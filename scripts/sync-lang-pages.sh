#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

langs=(en es ko ja)

html_files="$(find . -type f -name '*.html' \
  -not -path './admin/*' \
  -not -path './.git/*' \
  -not -path './en/*' \
  -not -path './es/*' \
  -not -path './ko/*' \
  -not -path './ja/*' \
  -print | sed 's#^\\./##')"

for lang in "${langs[@]}"; do
  mkdir -p "$lang"
  echo "$html_files" | while IFS= read -r file; do
    [ -z "$file" ] && continue
    dest="$lang/$file"
    mkdir -p "$(dirname "$dest")"
    cp "$file" "$dest"
  done
done

echo "Synced language-prefixed pages: ${langs[*]}"
