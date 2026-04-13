import os

file_path = r'frontend\src\pages\ClaimDetail.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

final_lines = []
skip_until = -1
for i, line in enumerate(lines):
    if i < skip_until:
        continue
    
    # 1. Update Source Card to be more interactive
    # Look for the start of the source mapping
    if '{claim.sources?.map((s) => (' in line:
        final_lines.append(line)
        # We find the container div
        # line[i+1] is the <div key={s.id}...
        continue

    # 2. Check and improve source link wrapping
    if '<div key={s.id} className="group card-intel p-4 !rounded-2xl flex items-center gap-5 glass-surface">' in line:
        line = line.replace('glass-surface">', 'glass-surface hover:border-indigo-500/50 transition-all cursor-pointer">')
        final_lines.append(line)
        continue

    if '<div className="flex-1 min-w-0">' in line and i > 450: # Around the source section
        # Replace the div with a link wrap
        new_wrap = [
            '                    <a \n',
            '                       href={s.link ? (s.link.startsWith("http") ? s.link : "https://" + s.link) : "#"} \n',
            '                       target="_blank" \n',
            '                       rel="noreferrer" \n',
            '                       className="flex-1 min-w-0"\n',
            '                    >\n'
        ]
        final_lines.extend(new_wrap)
        # We need to change the closing div to a closing a
        # The div ended around line 457
        for j in range(i+1, i+10):
            if '</div>' in lines[j] and 'flex flex-col items-end gap-2' in lines[j+1]:
                # This </div> at lines[j] should be </a>
                # But we'll skip lines[i] and add our own
                skip_until = j + 1
                # Add the content lines but not the closing div
                final_lines.extend(lines[i+1 : j])
                final_lines.append('                    </a>\n')
                break
        continue

    final_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("ClaimDetail.tsx updated successfully for improved Source interactivity")
