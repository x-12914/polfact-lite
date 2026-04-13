import re

file_path = r'frontend\src\pages\ClaimDetail.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We want to replace the block starting at <div className="flex-1 min-w-0"> (the one after <Globe.../>)
# and ending at <div className="flex flex-col items-end gap-2">

# The problematic block is the one with {s.content && ...} and the custom styling

pattern = re.compile(
    r'(<div className="flex-1 min-w-0[^"]*">)\s*<p className="text-\[10px\] font-black text-emerald-500 uppercase tracking-widest mb-1\.5 flex items-center gap-2">.*?</p>\s*<p className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-400 transition-colors">.*?</p>\s*\{s\.content && \(.*?\)\}\s*\{s\.link && \(.*?\)\}\s*(</div>)',
    re.DOTALL
)

replacement = """<div className="flex-1 min-w-0">
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Authenticated Source</p>
                       <p className="text-xs font-bold text-slate-300 truncate leading-snug group-hover:text-white transition-colors">{s.title || s.link || 'Verified Intel'}</p>
                       <p className="text-[9px] text-slate-500 mt-1 font-bold truncate opacity-60 italic">{s.link}</p>
                    </div>"""

new_content, count = re.subn(pattern, replacement, content)

if count > 0:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"ClaimDetail.tsx updated successfully. Replaced {count} occurrences.")
else:
    print("Pattern match failed. Trying a line-based fallback.")
    # Fallback to a simpler line-based search for the unique "Direct Evidence" or specific styling
    lines = content.splitlines(keepends=True)
    start_idx = -1
    end_idx = -1
    
    for i, line in enumerate(lines):
        if "text-emerald-500" in line and "Authenticated Source" in line:
            # Check if it has the new flex style
            if "flex items-center gap-2" in line or "{s.type === 'manual'" in line:
                # Start looking for the container <div> up
                for j in range(i, i-5, -1):
                    if 'className="flex-1 min-w-0' in lines[j]:
                        start_idx = j
                        break
                # Look for the end </div> after the {s.link && ...} block
                if start_idx != -1:
                    for j in range(i, i+30):
                        if '</div>' in lines[j] and 'flex flex-col items-end gap-2' in lines[j+1]:
                            end_idx = j + 1
                            break
                break
    
    if start_idx != -1 and end_idx != -1:
        print(f"Replacing lines {start_idx} to {end_idx}")
        # Build the replacement lines with proper indentation
        indent = "                    "
        replacement_lines = [
            indent + '<div className="flex-1 min-w-0">\n',
            indent + '                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Authenticated Source</p>\n',
            indent + "                       <p className=\"text-xs font-bold text-slate-300 truncate leading-snug group-hover:text-white transition-colors\">{s.title || s.link || 'Verified Intel'}</p>\n",
            indent + '                       <p className="text-[9px] text-slate-500 mt-1 font-bold truncate opacity-60 italic">{s.link}</p>\n',
            indent + '                    </div>\n'
        ]
        lines[start_idx:end_idx] = replacement_lines
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print("ClaimDetail.tsx updated successfully via line-based fallback.")
    else:
        print("Fallback search failed as well.")
