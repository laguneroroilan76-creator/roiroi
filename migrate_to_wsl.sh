#!/bin/bash

# HDI WSL Migration Script
# This script helps move the project from Windows to the WSL filesystem for better performance.

PROJECT_NAME="HDI"
TARGET_DIR="$HOME/projects"

echo "Creating projects directory in WSL home..."
mkdir -p "$TARGET_DIR"

echo "Copying $PROJECT_NAME from Windows to WSL..."
# Assuming this script is run from the project root in WSL (via /mnt/c/...)
cp -r . "$TARGET_DIR/$PROJECT_NAME"

echo "Migration complete!"
echo "Your project is now at: $TARGET_DIR/$PROJECT_NAME"
echo ""
echo "To open this project in VS Code (WSL mode):"
echo "1. Change directory: cd $TARGET_DIR/$PROJECT_NAME"
echo "2. Open VS Code: code ."
echo ""
echo "Note: Running from the WSL filesystem is much faster than running from /mnt/c/."
