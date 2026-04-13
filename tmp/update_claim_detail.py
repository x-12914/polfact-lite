import os

file_path = r'frontend\src\pages\ClaimDetail.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_ui = [
    '                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">\n',
    '                         <Globe className="h-3 w-3" />\n',
    "                         {s.type === 'manual' ? 'Direct Evidence' : 'Authenticated Source'}\n",
    '                       </p>\n',
    "                       <p className=\"text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-400 transition-colors\">{s.title || 'Verified Intel'}</p>\n",
    '                       {s.content && (\n',
    '                         <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap italic line-clamp-3 group-hover:line-clamp-none transition-all">\n',
    '                           "{s.content}"\n',
    '                         </div>\n',
    '                       )}\n',
    '                       {s.link && (\n',
    '                         <p className="text-[9px] text-slate-500 mt-2 font-bold truncate opacity-60 flex items-center gap-1">\n',
    '                           <LinkIcon className="h-2 w-2" />\n',
    '                           {s.link}\n',
    '                         </p>\n',
    '                       )}\n'
]

# Find the target block and replace it
# We look for the "Authenticated Source" line
found = False
for i, line in enumerate(lines):
    if 'Authenticated Source' in line and 'text-emerald-500' in line:
        # Replace lines i, i+1, i+2 (which are the p tags)
        # Note: we need to be careful about the indices
        # Original:
        # 454: p (Authenticated Source)
        # 455: p (title)
        # 456: p (link)
        
        # We replace them
        lines[i:i+3] = new_ui
        found = True
        break

if found:
    # Also update the modal title
    for i, line in enumerate(lines):
        if 'title="Manually Key Intelligence"' in line:
            lines[i] = line.replace('title="Manually Key Intelligence"', 'title="Log Evidence Intel"')
            break

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("ClaimDetail.tsx updated successfully")
else:
    print("Could not find the source display block in ClaimDetail.tsx")
