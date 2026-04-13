import os

file_path = r'frontend\src\pages\ClaimDetail.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix source link
# Old: href={s.link ? getMediaUrl(s.link) : '#'}
text = text.replace('href={s.link ? getMediaUrl(s.link) : \'#\'}', 'href={s.link ? (s.link.startsWith("http") ? s.link : "https://" + s.link) : "#"}')

# Fix video tag using regex to handle multiple lines
import re
video_pattern = re.compile(r'<video\s+src=\{getMediaUrl\(selectedMedia\.file_url\)\}\s+controls\s+autoPlay\s+className="max-h-\[70vh\] w-full"\s+/>', re.DOTALL)

replacement_video = """<video 
                 src={getMediaUrl(selectedMedia.file_url)} 
                 controls 
                 autoPlay 
                 playsInline
                 crossOrigin="anonymous"
                 className="max-h-[70vh] w-full"
                 onError={(e) => console.error("Video load failed")}
              />"""

# If the exact match fails, let's try a simpler one
if not video_pattern.search(text):
    print("Exact video pattern match failed. Trying relaxed match.")
    # Relaxed match: look for <video ... src={getMediaUrl(selectedMedia.file_url)} ... />
    text = re.sub(
        r'<video\s+src=\{getMediaUrl\(selectedMedia\.file_url\)\}.*?/>',
        replacement_video,
        text,
        flags=re.DOTALL
    )
else:
    text = video_pattern.sub(replacement_video, text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("ClaimDetail.tsx updated successfully using regex")
