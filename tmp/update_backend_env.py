import os

file_path = r'backend\.env'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith('BACKEND_CORS_ORIGINS='):
        new_lines.append('BACKEND_CORS_ORIGINS=["*"]\n')
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("backend/.env updated successfully")
