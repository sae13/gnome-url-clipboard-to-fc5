#!/usr/bin/env bash
set -euo pipefail

UUID='url-shortener@fc5.ir'
ARCHIVE="${UUID}.shell-extension.zip"
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR"

for command_name in node gnome-extensions unzip; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$command_name" >&2
    exit 1
  fi
done

node --test tests/urlShortener.test.js
gnome-extensions pack --force --extra-source=urlShortener.js .
unzip -t "$ARCHIVE"
gnome-extensions install --force "$ARCHIVE"

if gnome-extensions enable "$UUID"; then
  gnome-extensions info "$UUID"
else
  printf '\nThe extension was installed, but the current GNOME session does not recognize it yet.\n' >&2
  printf 'Log out and log back in, then run:\n\n' >&2
  printf '  gnome-extensions enable %s\n' "$UUID" >&2
fi
