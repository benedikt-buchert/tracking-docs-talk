#!/usr/bin/env bash
# Jump between demo steps.
#   ./demo.sh            list steps
#   ./demo.sh next       go to the next step
#   ./demo.sh prev       go back one step
#   ./demo.sh 2          jump to step 2
#   ./demo.sh reset      back to main (step 0)
# Unsaved edits (e.g. live typing) are stashed first, never lost: see `git stash list`.
set -euo pipefail
cd "$(dirname "$0")"

branch_for() {
  if [ "$1" = "0" ]; then echo main; return; fi
  git for-each-ref --format='%(refname:short)' "refs/heads/step-$1-*" | head -1
}

current_step() {
  local b
  b=$(git rev-parse --abbrev-ref HEAD)
  if [ "$b" = "main" ]; then echo 0; return; fi
  echo "$b" | sed -E 's/^step-([0-9]+)-.*/\1/'
}

list() {
  local cur n b
  cur=$(git rev-parse --abbrev-ref HEAD)
  for n in 0 1 2 3 4 5 6 7 8 9; do
    b=$(branch_for "$n")
    [ -z "$b" ] && continue
    if [ "$b" = "$cur" ]; then echo "▶ $n  $b"; else echo "  $n  $b"; fi
  done
}

go() {
  local target
  target=$(branch_for "$1")
  if [ -z "$target" ]; then echo "No step $1"; exit 1; fi
  if [ -n "$(git status --porcelain)" ]; then
    git stash push -u -q -m "demo autosave before $target"
    echo "(stashed your edits)"
  fi
  git checkout -q "$target"
  echo "→ step $1: $target"
}

case "${1:-list}" in
  list) list ;;
  next) go $(( $(current_step) + 1 )) ;;
  prev) go $(( $(current_step) - 1 )) ;;
  reset) go 0 ;;
  [0-9]) go "$1" ;;
  *) echo "usage: ./demo.sh [list|next|prev|reset|<step>]"; exit 1 ;;
esac
