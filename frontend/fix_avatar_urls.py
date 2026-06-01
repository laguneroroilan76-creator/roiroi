import os
import re

files_to_fix = [
    "src/pages/SupportLog.jsx",
    "src/pages/TodayRecords.jsx",
    "src/pages/Users.jsx",
    "src/pages/Profile.jsx",
    "src/pages/OngoingRecords.jsx",
    "src/pages/PendingRecords.jsx",
    "src/pages/ApprovedRecords.jsx",
    "src/components/Topbar.jsx",
    "src/components/shared/ActivityTimeline.jsx",
    "src/components/history/TicketTable.jsx",
]

old_pattern = r'`\$\{window\.location\.protocol\}//\$\{window\.location\.hostname\}:5000(\$\{[^}]+\})`'
new_pattern = r'`${BASE_URL}\1`'

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        continue
    with open(file_path, "r") as f:
        content = f.read()

    # Check if BASE_URL is already imported
    has_base_url = "BASE_URL" in content

    # Replace the pattern
    new_content = re.sub(old_pattern, new_pattern, content)

    # If changed and BASE_URL not imported, add import
    if new_content != content and not has_base_url:
        # determine depth
        depth = file_path.count('/') - 1
        rel_path = "../" * depth + "services/api"
        
        # Check if api is already imported
        if f"import api from '{rel_path}'" in new_content:
            new_content = new_content.replace(
                f"import api from '{rel_path}'",
                f"import api, {{ BASE_URL }} from '{rel_path}'"
            )
        elif f"import api, {{ BASE_URL }} from '{rel_path}'" in new_content:
            pass  # already done
        else:
            # Find first import line and inject after it
            lines = new_content.split('\n')
            last_import = 0
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    last_import = i
            lines.insert(last_import + 1, f"import {{ BASE_URL }} from '{rel_path}';")
            new_content = '\n'.join(lines)

    with open(file_path, "w") as f:
        f.write(new_content)
    
    if new_content != content:
        print(f"Updated: {file_path}")
    else:
        print(f"No change: {file_path}")

# Fix Profile.jsx avatar upload which uses axios directly
with open("src/pages/Profile.jsx", "r") as f:
    profile = f.read()

profile = profile.replace(
    '`${window.location.protocol}//${window.location.hostname}:5000/api/users/profile/avatar`',
    '`${BASE_URL}/api/users/profile/avatar`'
)

with open("src/pages/Profile.jsx", "w") as f:
    f.write(profile)

print("Profile avatar upload fixed.")
