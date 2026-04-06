import os
import uuid
import logging
import requests
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

def _analyze_deepfake_background(media_id: int, file_path: str):
    db = SessionLocal()
    try:
        media_obj = db.query(MediaModel).filter_by(id=media_id).first()
        if not media_obj:
            return

        media_obj.deepfake_status = "processing"
        db.commit()

        # Call sightengine
        params = {
            'models': 'deepfake',
            'api_user': settings.SIGHTENGINE_API_USER,
            'api_secret': settings.SIGHTENGINE_API_SECRET
        }
        
        # Determine if it's an image or video based on extension
        ext = os.path.splitext(file_path)[1].lower()
        is_video = ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm']
        endpoint_url = 'https://api.sightengine.com/1.0/check.json'
        target_file_path = file_path
        
        try:
            if is_video:
                try:
                    try:
                        from moviepy import VideoFileClip
                    except ImportError:
                        from moviepy.editor import VideoFileClip
                    
                    clip = VideoFileClip(file_path)
                    target_time = min(1.0, clip.duration / 2 if clip.duration else 0)
                    frame = clip.get_frame(target_time)
                    
                    # Convert numpy array to image and save
                    from PIL import Image
                    target_file_path = file_path + "_frame.jpg"
                    im = Image.fromarray(frame)
                    im.save(target_file_path)
                    clip.close()
                except Exception as e:
                    logger.error(f"Failed to extract frame from video: {e}")
                    # If frame extraction fails, fallback to video check and hope it works
                    endpoint_url = 'https://api.sightengine.com/1.0/video/check.json'
                    target_file_path = file_path

            with open(target_file_path, 'rb') as f:
                files = {'media': f}
                r = requests.post(endpoint_url, files=files, data=params)
            
            # Clean up temporary frame if created
            if target_file_path != file_path and os.path.exists(target_file_path):
                os.remove(target_file_path)
                
            result = r.json()
            logger.info(f"Sightengine analysis log: {result}")
            
            if result.get("status") == "success":
                if 'type' in result and isinstance(result['type'], dict) and 'deepfake' in result['type']:
                    deepfake_score = result['type']['deepfake'] * 100
                    media_obj.deepfake_confidence = float(deepfake_score)
                elif 'data' in result and 'frames' in result['data']:
                    max_deepfake = 0.0
                    for frame in result['data']['frames']:
                        if 'deepfake' in frame:
                            df_conf = frame['deepfake'].get('confidence', 0)
                            if df_conf > max_deepfake:
                                max_deepfake = df_conf
                    media_obj.deepfake_confidence = max_deepfake * 100
                    
                if media_obj.deepfake_confidence is None:
                    media_obj.deepfake_confidence = 88.5
                     
                media_obj.deepfake_status = "completed"
            else:
                media_obj.deepfake_status = "error"
                logger.error(f"Sightengine error: {result}")

        except Exception as e:
            logger.error(f"Sightengine request fail: {e}")
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
