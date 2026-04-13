import re

path = r'frontend\src\pages\Submissions.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the button block using a regex that handles both \r\n and \n
old_pattern = re.compile(
    r'\{.*?media\.transcription_text\.includes\(\'EXTRACTED CLAIMS:\'\).*?\)\s*&&\s*\('
    r'.*?<button.*?onClick=\{.*?analyzeMutation\.mutate\(media\.id\).*?\}.*?/button>'
    r'\s*\)\}',
    re.DOTALL
)

new_block = """{(media.transcription_status === 'processing' || analyzingId === media.id) ? (
                             <span className="h-10 px-4 flex items-center gap-2 rounded-xl bg-indigo-600/50 text-white text-[10px] font-black uppercase tracking-widest">
                               <Loader2 className="h-3 w-3 animate-spin" /> Analyzing...
                             </span>
                           ) : (!media.transcription_text || !media.transcription_text.includes('EXTRACTED CLAIMS:')) && (
                             <button
                               onClick={() => { setAnalyzingId(media.id); analyzeMutation.mutate(media.id); }}
                               disabled={analyzingId !== null}
                               className="h-10 px-4 flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/10"
                             >
                               <Sparkles className="h-3 w-3" />
                               AI Extract
                             </button>
                           )}"""

match = old_pattern.search(content)
if match:
    print(f"Match found at positions {match.start()}-{match.end()}")
    new_content = content[:match.start()] + new_block + content[match.end():]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("File updated successfully")
else:
    print("Pattern not found, trying line-based approach...")
    
    # Fallback: line-based replacement
    lines = content.splitlines(keepends=True)
    output = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if "!media.transcription_text.includes('EXTRACTED CLAIMS:')" in line and "&&" in line:
            # Found the start of the old button block
            # Collect lines until we find the closing )}
            block_start = i
            depth = 0
            j = i
            while j < len(lines):
                if '{' in lines[j]:
                    depth += lines[j].count('{') - lines[j].count('}')
                if ')};' in lines[j] or lines[j].strip() == ')}':
                    j += 1
                    break
                j += 1
            
            print(f"Line-based: replacing lines {block_start}-{j}")
            # Get indentation
            indent = '                           '
            output.append(indent + new_block + '\r\n')
            i = j
        else:
            output.append(line)
            i += 1
    
    new_content = ''.join(output)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("File updated via line-based approach")

print("Done")
