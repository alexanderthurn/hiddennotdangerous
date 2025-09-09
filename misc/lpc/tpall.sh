#!/usr/bin/env bash
set -euo pipefail

IN="./in"
OUT="./out"
mkdir -p "$OUT"

# Ranges und Richtungen (Ihre Reihenfolge)
starts=(0 10 16 24)
dirs=(up left down right)

shopt -s nullglob
found_any=0

for SRC in "$IN"/*; do
  [[ -d "$SRC" ]] || continue
  NAME="$(basename "$SRC")"
  found_any=1
  echo ">> Verarbeite '$NAME' in '$SRC'"

  for i in "${!starts[@]}"; do
    start="${starts[$i]}"
    dir="${dirs[$i]}"
    for offset in 0 1 2 3; do
      idx=$((start + offset))
      src="$SRC/walk-$idx.png"
      dst="$OUT/${NAME}_${dir}_${offset}.png"
      if [[ -f "$src" ]]; then
        cp "$src" "$dst"
        echo "OK  $src -> $dst"
      else
        echo "FEHLT: $src (übersprungen)" >&2
      fi
    done
  done
done

shopt -u nullglob

if (( ! found_any )); then
  echo "Keine Unterordner in '$IN' gefunden." >&2
  exit 1
fi
