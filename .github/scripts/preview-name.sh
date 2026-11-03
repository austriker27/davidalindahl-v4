#!/usr/bin/env bash
# Turn a git branch name into a Worker Preview name that is safe inside a hostname:
# lowercase a–z, 0–9 and single dashes, at most 40 characters, no leading/trailing dash.
#   preview-name.sh "claude/Sharp_Goodall#1"  →  claude-sharp-goodall-1
set -euo pipefail
name="$(printf '%s' "${1:?usage: preview-name.sh <branch>}" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' \
  | cut -c1-40 \
  | sed -E 's/-+$//')"
printf '%s\n' "${name:-branch}"
