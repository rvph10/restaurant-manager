#!/bin/bash

DIR=$(pwd)
OUTPUT="allfile.txt"
> $OUTPUT

process_file() {
  local file_path=$1
  echo "Processing $file_path"
  echo "=== File: $file_path ===" >> $OUTPUT
  echo "" >> $OUTPUT
  cat "$file_path" >> $OUTPUT
  echo -e "\n=== End of $file_path ===\n\n" >> $OUTPUT
}

export -f process_file
export OUTPUT

# Find all files in frontend and backend directories
find $DIR \( \
  -path "*/frontend/*" -o \
  -path "*/backend/*" -o \
  -path "*/docker/*" \
  \) \
  ! -path "*/node_modules/*" \
  ! -path "*/migrations/*" \
  ! -path "*/.next/*" \
  ! -path "*/build/*" \
  ! -path "*/dist/*" \
  ! -path "*/logs/*" \
  ! -path "*/docker/*" \
  ! -path "*/.git/*" \
  ! -name "*.log" \
  ! -name "*.map" \
  ! -name "*.d.ts" \
  ! -name "*.test.*" \
  ! -name "*.spec.*" \
  ! -name "*.min.*" \
  ! -name "*.md" \
  ! -name "*.json" \
  ! -name "*.prisma" \
  -type f \
  -exec bash -c 'process_file "$0"' {} \;

# Add Docker and root configuration files
for file in docker-compose.yml package.json; do
  if [ -f "$DIR/$file" ]; then
    process_file "$DIR/$file"
  fi
done

echo "All files have been processed and written to $OUTPUT"