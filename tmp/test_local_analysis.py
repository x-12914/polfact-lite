import os
import asyncio
import sys
import logging

# Add backend and root to path
WORKSPACE_PATH = r"c:\Users\xxx85\Downloads\polfact-lite"
sys.path.append(os.path.join(WORKSPACE_PATH, 'backend'))

# Configure logging to see polling
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import all models to avoid Mapper errors
from app.models.user import User
from app.models.claim import Claim
from app.models.media import Media, MediaType
from app.models.poi import POI
from app.models.evidence import Evidence
from app.models.source import Source

from app.api.endpoints.analysis import _analyze_deepfake_background
from app.db.session import SessionLocal

async def test_local_analysis():
    db = SessionLocal()
    try:
        # Use a video currently on the system
        uploads_dir = os.path.join(WORKSPACE_PATH, 'backend', 'uploads')
        if not os.path.exists(uploads_dir):
            print(f"ERROR: uploads dir not found at {uploads_dir}")
            return
            
        videos = [f for f in os.listdir(uploads_dir) if f.endswith('.mp4')]
        if not videos:
            print("ERROR: No .mp4 files found in backend/uploads")
            return
            
        test_filename = videos[0]
        test_file_path = os.path.join(uploads_dir, test_filename)
        
        print(f"Using file for test: {test_file_path}")

        # Create dummy entry
        media_obj = Media(
            file_url=f"/uploads/{test_filename}",
            type=MediaType.VIDEO,
            deepfake_status="pending",
            transcription_status="not_applicable"
        )
        db.add(media_obj)
        db.commit()
        db.refresh(media_obj)
        
        print(f"Created test media ID: {media_obj.id}")
        
        # Run actual function
        await _analyze_deepfake_background(media_obj.id, test_file_path)
        
        # Result reload
        db.refresh(media_obj)
        print("\n--- RESULTS ---")
        print(f"Status: {media_obj.deepfake_status}")
        print(f"Confidence: {media_obj.deepfake_confidence}")
        
    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR in test script: {e}")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_local_analysis())
