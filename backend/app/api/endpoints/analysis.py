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
            
            # 1. Start Upload and Analysis
            upload_result = await rd.upload(file_path=file_path)
            request_id = upload_result.get('id') or upload_result.get('request_id')
            
            if not request_id:
                logger.error("Reality Defender upload failed: No request ID returned.")
                media_obj.deepfake_status = "error"
                db.commit()
                return

            # 2. Asynchronous Polling
            max_attempts = 60 # 5 minutes maximum
            final_status = "error"
            final_score = 0.0
            
            for _ in range(max_attempts):
                if hasattr(rd, 'get_detection_result'):
                    analysis = await rd.get_detection_result(request_id)
                elif hasattr(rd, 'get_result'):
                    analysis = await rd.get_result(request_id=request_id)
                else:
                    break
                    
                status = analysis.get('status', '') if isinstance(analysis, dict) else getattr(analysis, 'status', '')
                logger.info(f"Reality Defender status: {status}")
                
                if status in ['MANIPULATED', 'AUTHENTIC', 'SUCCESS']:
                    score = analysis.get('score', 0) if isinstance(analysis, dict) else getattr(analysis, 'score', 0)
                    final_score = score * 100
                    final_status = "completed"
                    break
                elif status in ['FAILED', 'ERROR']:
                    logger.error("Reality Defender analysis failed remotely.")
                    final_status = "error"
                    break
                    
                await asyncio.sleep(5) # Wait before next poll

            media_obj.deepfake_confidence = float(final_score)
            media_obj.deepfake_status = final_status
            
        except Exception as e:
            logger.error(f"Reality Defender request fail: {e}")
            media_obj.deepfake_status = "error"
            media_obj.deepfake_confidence = None

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
    file_path = os.path.join(upload_dir, filename)

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
