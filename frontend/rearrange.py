with open("src/pages/Profile.jsx", "r") as f:
    lines = f.readlines()

# find indices
avatar_end = -1
for i, line in enumerate(lines):
    if "          {/* Activity Widget */}" in line:
        activity_start = i
    if "          </div>" in line and "        </div>" in lines[i+1] and "        {/* RIGHT COLUMN */}" in lines[i+3]:
        activity_end = i
    if "        {/* RIGHT COLUMN */}" in line:
        right_col_start = i
    if "          {/* Account Settings / Profile Editing */}" in line:
        settings_start = i
    if "      </div>" in line and "      <style>{`" in lines[i+2]:
        right_col_end = i

avatar_end = activity_start
activity_widget = lines[activity_start:activity_end+1]
right_col = lines[right_col_start:right_col_end] # includes settings, permissions

# New structure:
# lines[:avatar_end] (up to end of avatar card)
# settings + permissions (which is right_col[2:]) # right_col_start is 299, 300 is <div className="grid-column-right">, 301 is Settings
# </div> # end of grid-column-left
# {/* RIGHT COLUMN */}
# <div className="grid-column-right">
# activity_widget
# </div> # end of grid-column-right
# lines[right_col_end:]

new_lines = lines[:activity_start] + right_col[2:] + ["        </div>\n\n", "        {/* RIGHT COLUMN */}\n", "        <div className=\"grid-column-right\">\n"] + activity_widget + ["        </div>\n"] + lines[right_col_end:]

with open("src/pages/Profile.jsx", "w") as f:
    f.writelines(new_lines)
