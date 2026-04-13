import os
import asyncio
from realitydefender import RealityDefender

API_KEY = "rd_2852d3c04871bde0_b910fde9d9e2bb15adc77320226df0db"

async def main():
    rd = RealityDefender(api_key=API_KEY)
    file_path = r"C:\Users\xxx85\.gemini\antigravity\brain\53bc5a24-24dd-4ac6-9250-48d28706edaf\blank_scene_1775511024011.png"

    try:
        print("Uploading...")
        result = await rd.upload(file_path=file_path)
        print("Upload Result:", result)
        
        request_id = result.get('id') or result.get('request_id')
        print("Got Request ID:", request_id)
        
        if request_id:
            # Reality Defender Python SDK - let's see if there's a get_result
            if hasattr(rd, 'get_detection_result'):
                analysis = await rd.get_detection_result(request_id)
                print("Analysis:", analysis)
            elif hasattr(rd, 'get_result'):
                analysis = await rd.get_result(request_id=request_id)
                print("Analysis:", analysis)
    except Exception as e:
        print("Error:", e)

asyncio.run(main())
