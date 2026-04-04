"""
Media upload endpoint with inline BackgroundTasks-based transcription.
Replaces Celery task with FastAPI BackgroundTasks.
"""
import os
import uuid
import logging
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.media import Media
from app.schemas.response import ResponseModel
from app.services import media as media_service
from app.models.media import MediaType
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.media import Media as MediaModel

router = APIRouter()
logger = logging.getLogger(__name__)


def _transcribe_media_background(media_id: int, file_path: str):
    """
    Synchronous background task: transcribes audio/video using OpenAI Whisper,
    then extracts claims using GPT. Runs in a thread pool via BackgroundTasks.
    """
    db = SessionLocal()
    try:
        import openai
        import speech_recognition as sr

        media_obj = db.query(MediaModel).filter_by(id=media_id).first()
        if not media_obj:
            return

        # Extract/Convert to WAV for SpeechRecognition
        wav_path = file_path + ".wav"
        try:
            # MoviePy 2.x import
            try:
                from moviepy import VideoFileClip, AudioFileClip
            except ImportError:
                from moviepy.editor import VideoFileClip, AudioFileClip
            
            if file_path.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
                clip = VideoFileClip(file_path)
                clip.audio.write_audiofile(wav_path, codec='pcm_s16le')
                clip.close()
            else:
                clip = AudioFileClip(file_path)
                clip.write_audiofile(wav_path, codec='pcm_s16le')
                clip.close()
        except Exception as e:
            logger.error(f"Media conversion failed: {e}")
            media_obj.transcription_status = "error: extraction"
            db.commit()
            return

        # Transcribe using SpeechRecognition (Google Free API)
        try:
            recognizer = sr.Recognizer()
            with sr.AudioFile(wav_path) as source:
                audio_data = recognizer.record(source)
                transcript = recognizer.recognize_google(audio_data)
        except Exception as e:
            logger.error(f"SpeechRecognition failed: {e}")
            # Fallback to empty transcript but continue for OpenAI if possible? 
            # No, if transcription fails, we can't extract claims.
            media_obj.transcription_status = "error: transcription"
            db.commit()
            return

        # Extract claims with GPT
        claims_text = ""
        try:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY.strip())
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a fact-checking assistant. Extract specific factual claims from the following transcript. Output only a numbered list."},
                    {"role": "user", "content": transcript}
                ]
            )
            claims_text = response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI extraction failed: {e}")

        final_text = f"TRANSCRIPTION:\n{transcript}"
        if claims_text:
            final_text += f"\n\nEXTRACTED CLAIMS:\n{claims_text}"

        media_obj.transcription_text = final_text
        media_obj.transcription_status = "completed"
        db.commit()

        # Cleanup wav
        if os.path.exists(wav_path):
            os.remove(wav_path)

    except Exception as e:
        logger.error(f"Background transcription error: {e}")
    finally:
        db.close()


@router.get("/recent", response_model=ResponseModel[List[Media]])
def get_recent_media(
    *, 
    db: Session = Depends(deps.get_db), 
    limit: int = Query(20, ge=1, le=100),
    current_user: Any = Depends(deps.get_current_journalist)
) -> Any:
    """Get the most recently uploaded media files."""
    media_list = db.query(MediaModel).order_by(MediaModel.id.desc()).limit(limit).all()
    return ResponseModel(data=media_list)


@router.post("/upload", response_model=ResponseModel[Media], status_code=status.HTTP_201_CREATED)
async def upload_media(
    *,
    db: Session = Depends(deps.get_db),
    claim_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    current_user: Any = Depends(deps.get_current_journalist),
    background_tasks: BackgroundTasks,
) -> Any:
    """Upload a media file. Video/audio files will be transcribed in the background."""
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Determine media type
    image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    video_exts = {'.mp4', '.avi', '.mov', '.mkv', '.webm'}
    audio_exts = {'.mp3', '.wav', '.m4a', '.ogg', '.flac'}
    pdf_exts = {'.pdf'}

    if ext in image_exts:
        media_type = MediaType.IMAGE
    elif ext in video_exts:
        media_type = MediaType.VIDEO
    elif ext in audio_exts:
        media_type = MediaType.AUDIO
    elif ext in pdf_exts:
        media_type = MediaType.PDF
    else:
        media_type = MediaType.IMAGE  # fallback

    from app.schemas.media import MediaCreate
    media_in = MediaCreate(
        claim_id=claim_id,
        file_url=f"/{upload_dir}/{filename}",
        type=media_type,
        transcription_status="processing" if media_type in [MediaType.VIDEO, MediaType.AUDIO] else "completed"
    )
    media_obj = media_service.create_media(db, obj_in=media_in)

    # Kick off background transcription for video/audio
    if media_type in [MediaType.VIDEO, MediaType.AUDIO]:
        background_tasks.add_task(_transcribe_media_background, media_obj.id, file_path)

    return ResponseModel(data=media_obj, message="File uploaded successfully")


@router.get("/{id}", response_model=ResponseModel[Media])
def get_media(*, db: Session = Depends(deps.get_db), id: int) -> Any:
    media = media_service.get_media(db, id=id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return ResponseModel(data=media)


@router.delete("/{id}")
def delete_media(*, db: Session = Depends(deps.get_db), id: int, current_user: Any = Depends(deps.get_current_journalist)) -> Any:
    media = media_service.get_media(db, id=id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    media_service.delete_media(db, id=id)
    return ResponseModel(data=None, message="Media deleted")
