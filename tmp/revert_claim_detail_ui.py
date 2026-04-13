import os

file_path = r'frontend\src\pages\ClaimDetail.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

old_ui = [
    '                    <div className="flex-1 min-w-0">\n',
    '                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Authenticated Source</p>\n',
    "                       <p className=\"text-xs font-bold text-slate-300 truncate leading-snug group-hover:text-white transition-colors\">{s.title || s.link || 'Verified Intel'}</p>\n",
    '                       <p className="text-[9px] text-slate-500 mt-1 font-bold truncate opacity-60 italic">{s.link}</p>\n',
    '                    </div>\n'
]

# Find the target block and replace it
# Look for our previous markers
found = False
for i, line in enumerate(lines):
    if 'text-emerald-500' in line and (('Direct Evidence' in line) or ('Authenticated Source' in line)):
        # We need to find the start and end of the div we added
        # The div started at i - 1 roughly (lines[453] in previous view)
        start = i - 1
        # The div ends before lines[471] which was "flex flex-col items-end gap-2"
        end = -1
        for j in range(i, len(lines)):
            if 'flex flex-col items-end gap-2' in lines[j]:
                end = j
                break
        
        if end != -1:
            print(f"Reverting block from index {start} to {end}")
            lines[start:end] = old_ui
            found = True
            break

if found:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("ClaimDetail.tsx UI reverted successfully")
else:
    print("Could not find the block to revert in ClaimDetail.tsx")
