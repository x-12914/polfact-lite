import os

file_path = r'frontend\src\pages\ClaimDetail.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

updated_lines = []
for i, line in enumerate(lines):
    # Fix the source link href logic
    if 'href={s.link ? getMediaUrl(s.link) : \'#\'}' in line:
        line = line.replace('href={s.link ? getMediaUrl(s.link) : \'#\'}', 'href={s.link ? (s.link.startsWith("http") ? s.link : "https://" + s.link) : "#"}')
    
    # Update video tag in the modal (Viewer)
    if '<video' in line and 'src={getMediaUrl(selectedMedia.file_url)}' in line:
        # We find the video block and update it
        # Old:
        # 648:              <video 
        # 649:                 src={getMediaUrl(selectedMedia.file_url)} 
        # 650:                 controls 
        # 651:                 autoPlay
        # 652:                 className="max-h-[70vh] w-full"
        # 653:              />
        
        # New version with CORS and error handling
        new_video = [
            '              <video \n',
            '                 src={getMediaUrl(selectedMedia.file_url)} \n',
            '                 controls \n',
            '                 autoPlay \n',
            '                 playsInline\n',
            '                 crossOrigin="anonymous"\n',
            '                 className="max-h-[70vh] w-full"\n',
            '                 onError={(e) => {\n',
            '                    const target = e.target as HTMLVideoElement;\n',
            '                    console.error("Video load failed:", target.error);\n',
            '                 }}\n',
            '              />\n'
        ]
        # Skip the next few lines of the old video tag
        # we'll look for the end tag />
        skip = 0
        for j in range(i, i+10):
            if '/>' in lines[j]:
                skip = j - i + 1
                break
        
        if skip > 0:
            updated_lines.extend(new_video)
            # increment the outer index
            # This is tricky with enumerate, we'll just skip the lines next
            continue
    
    # if we are skipping lines, skip them
    if i > 0 and len(updated_lines) > i:
         # check if we already processed this line via new_video block
         # This logic is a bit flawed for enumerate, let's just use a while loop or flag
         pass

# rewrite the whole thing with a safer loop
final_lines = []
skip_until = -1
for i, line in enumerate(lines):
    if i < skip_until:
        continue
    
    # Fix source link
    if 'href={s.link ? getMediaUrl(s.link) : \'#\'}' in line:
        line = line.replace('href={s.link ? getMediaUrl(s.link) : \'#\'}', 'href={s.link ? (s.link.startsWith("http") ? s.link : "https://" + s.link) : "#"}')
    
    # Update video tag
    if '<video' in line and 'src={getMediaUrl(selectedMedia.file_url)}' in line:
        new_video = [
            '              <video \n',
            '                 src={getMediaUrl(selectedMedia.file_url)} \n',
            '                 controls \n',
            '                 autoPlay \n',
            '                 playsInline\n',
            '                 crossOrigin="anonymous"\n',
            '                 className="max-h-[70vh] w-full shadow-2xl"\n',
            '                 onError={(e) => {\n',
            '                    const target = e.target as HTMLVideoElement;\n',
            '                    console.error("Video load failed:", target.error);\n',
            '                 }}\n',
            '              />\n'
        ]
        final_lines.extend(new_video)
        for j in range(i, i+10):
            if '/>' in lines[j]:
                skip_until = j + 1
                break
        continue
        
    final_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("ClaimDetail.tsx updated successfully")
