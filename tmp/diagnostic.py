import os
import requests
import traceback
import sys

# Try moviepy extraction
file_path = r"c:\Users\xxx85\Downloads\polfact-lite\YTDown.com_YouTube_This-is-not-Morgan-Freeman-A-Deepfake-Si_Media_oxXpB9pSETo_001_1080p.mp4"
params = {
    'models': 'deepfake',
    'api_user': '1977380819',
    'api_secret': 'VYKTRrxnbDiCMEKdyqEA9DddaY9cSAtF'
}

try:
    print("Loading MoviePy...")
    try:
        from moviepy import VideoFileClip
    except ImportError:
        from moviepy.editor import VideoFileClip
    from PIL import Image

    print("Loading VideoFileClip...")
    clip = VideoFileClip(file_path, audio=False)
    duration = clip.duration or 0
    print(f"Video loaded. Duration: {duration} seconds.")

    times = []
    if duration > 0:
        times = [duration * 0.25, duration * 0.50, duration * 0.75]
    else:
        times = [0]
    
    max_deepfake = 0.0
    api_success = False

    for i, t in enumerate(times):
        print(f"\n--- Processing Frame {i+1} at {t}s ---")
        try:
            print("Extracting frame...")
            frame = clip.get_frame(t)
            frame_path = f"tmp_diagnostic_frame_{i}.jpg"
            im = Image.fromarray(frame)
            im.save(frame_path)
            print("Saved frame locally.")

            print("Sending to Sightengine...")
            with open(frame_path, 'rb') as f:
                r = requests.post(
                    'https://api.sightengine.com/1.0/check.json', 
                    files={'media': f}, 
                    data=params
                )
            
            if os.path.exists(frame_path):
                os.remove(frame_path)
                
            result = r.json()
            print("Sightengine response:", result)
            
            if result.get("status") == "success":
                api_success = True
                if 'type' in result and isinstance(result['type'], dict) and 'deepfake' in result['type']:
                    score = result['type']['deepfake'] * 100
                    print(f"Frame deepfake score: {score}%")
                    if score > max_deepfake:
                        max_deepfake = score
        except Exception as frame_e:
            print(f"Error processing frame {i}: {frame_e}")
            traceback.print_exc()

    clip.close()
    
    print("\n--- Summary ---")
    if api_success:
        print(f"COMPLETED. Final Max Deepfake Score: {max_deepfake}%")
    else:
        print("FAILED: All API requests failed.")

except Exception as e:
    print("CRITICAL ERROR ENCOUNTERED:")
    traceback.print_exc()
