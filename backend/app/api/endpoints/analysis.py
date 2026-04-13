import os
import uuid
import logging
import asyncio
from realitydefender import RealityDefender
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from app.api import deps
from app.models.media import MediaType
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.media import Media as MediaModel
from app.schemas.media import Media
from app.schemas.response import ResponseModel

router = APIRouter()
logger = logging.getLogger(__name__)

async def _analyze_deepfake_background(media_id: int, file_path: str):
    db = SessionLocal()
    try:
        media_obj = db.query(MediaModel).filter_by(id=media_id).first()
        if not media_obj:
            return

        media_obj.deepfake_status = "processing"
        db.commit()

        try:
            rd = RealityDefender(api_key=settings.REALITY_DEFENDER_API_KEY)
            
            async def run_rd_analysis(target_path):
                """Helper to upload and poll for a single file"""
                try:
                    up = await rd.upload(file_path=target_path)
                    req_id = up.get('id') or up.get('request_id')
                    if not req_id:
                        return None
                    
                    for _ in range(40): # Poll for ~3.5 mins
                        try:
                            analysis = await (rd.get_detection_result(req_id) if hasattr(rd, 'get_detection_result') else rd.get_result(request_id=req_id))
                            # Ensure we actually got a dict before parsing
                            if not isinstance(analysis, dict):
                                logger.warning(f"Reality Defender returned non-dict response (likely HTML error): {analysis}")
                                await asyncio.sleep(8)
                                continue

                            status = analysis.get('status', '')
                            logger.info(f"Reality Defender Poll: {status}")
                            
                            if status in ['MANIPULATED', 'AUTHENTIC', 'SUCCESS']:
                                return (analysis.get('score', 0)) * 100
                            if status in ['FAILED', 'ERROR']:
                                break
                        except Exception as poll_inner_e:
                            logger.warning(f"Transient polling error (will retry): {poll_inner_e}")
                            
                        await asyncio.sleep(8) # Slightly slower polling for better rate limit compliance
                except Exception as e:
                    logger.warning(f"Analysis iteration failed for {target_path}: {e}")
                return None

            # 1. Try Whole Video First
            logger.info(f"Attempting whole-file analysis for: {file_path}")
            final_score = await run_rd_analysis(file_path)
            
            # 2. Fallback to Frame Extraction if Whole Video fails or score is ambiguous
            if final_score is None:
                logger.info("Whole-file analysis failed or rejected. Falling back to multi-frame extraction...")
                try:
                    from moviepy import VideoFileClip
                    from PIL import Image
                    
                    clip = VideoFileClip(file_path, audio=False)
                    duration = clip.duration or 0
                    times = [duration * 0.25, duration * 0.50, duration * 0.75] if duration > 0 else [0]
                    
                    max_frame_score = 0.0
                    any_success = False
                    
                    for i, t in enumerate(times):
                        # Give the API a moment to breathe between frames
                        if i > 0:
                            await asyncio.sleep(3)

                        frame_path = f"{file_path}_f{i}.jpg"
                        try:
                            frame = clip.get_frame(t)
                            Image.fromarray(frame).save(frame_path)
                            score = await run_rd_analysis(frame_path)
                            if score is not None:
                                any_success = True
                                max_frame_score = max(max_frame_score, score)
                        finally:
                            if os.path.exists(frame_path):
                                os.remove(frame_path)
                    
                    clip.close()
                    if any_success:
                        final_score = max_frame_score
                except Exception as ex:
                    logger.error(f"Fallback frame extraction failed: {ex}")

            if final_score is not None:
                media_obj.deepfake_confidence = float(final_score)
                media_obj.deepfake_status = "completed"
            else:
                media_obj.deepfake_status = "error"

        except Exception as e:
            logger.error(f"Reality Defender implementation error: {e}")
            media_obj.deepfake_status = "error"

        db.commit()

    except Exception as e:
        logger.error(f"Background deepfake error: {e}")
    finally:
        db.close()


@router.post("/deepfake", response_model=ResponseModel[Media], status_code=status.HTTP_201_CREATED)
async def analyze_deepfake(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: Any = Depends(deps.get_current_journalist),
    background_tasks: BackgroundTasks,
) -> Any:
    """Upload a media file and analyze it for deepfake."""
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.abspath(os.path.join(upload_dir, filename))

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    from app.services import media as media_service
    # Define type
    image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    if ext in image_exts:
        media_type = MediaType.IMAGE
    else:
        media_type = MediaType.VIDEO

    from app.schemas.media import MediaCreate
    media_in = MediaCreate(
        file_url=f"/{upload_dir}/{filename}",
        type=media_type,
        deepfake_status="pending",
        transcription_status="not_applicable"
    )
    media_obj = media_service.create_media(db, obj_in=media_in)

    # Start background analysis
    background_tasks.add_task(_analyze_deepfake_background, media_obj.id, file_path)

    return ResponseModel(data=media_obj, message="Analysis started")


@router.get("/deepfake/{media_id}", response_model=ResponseModel[Media])
def get_deepfake_status(
    *, 
    db: Session = Depends(deps.get_db), 
    media_id: int,
    current_user: Any = Depends(deps.get_current_journalist)
) -> Any:
    from app.services import media as media_service
    media_obj = media_service.get_media(db, id=media_id)
    if not media_obj:
        raise HTTPException(status_code=404, detail="Media not found")
    
    return ResponseModel(data=media_obj)
