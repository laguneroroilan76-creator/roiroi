import os

files = [
    "src/components/FloatingChat.jsx",
    "src/components/NotificationBell.jsx",
    "src/components/shared/ActivityTimeline.jsx",
    "src/pages/Dashboard.jsx"
]

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Find the correct path to api.js depending on the directory depth
    depth = file_path.count('/') - 1
    api_path = "../" * depth + "services/api"
    
    if "import { BASE_URL }" not in content:
        # Add import after other imports
        import_stmt = f"import {{ BASE_URL }} from '{api_path}';\n"
        if "import api from" in content:
            content = content.replace(f"import api from '{api_path}';", f"import api, {{ BASE_URL }} from '{api_path}';")
        else:
            # just insert it after the first import
            parts = content.split('\n')
            for i, line in enumerate(parts):
                if line.startswith('import '):
                    parts.insert(i+1, import_stmt)
                    break
            content = '\n'.join(parts)
            
    content = content.replace("io('/')", "io(BASE_URL)")
    
    with open(file_path, "w") as f:
        f.write(content)
