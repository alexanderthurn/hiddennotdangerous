#!/usr/bin/env bash
set -euo pipefail

# usage: ./extract_frames.sh boy.zip
ZIP_IN="${1:-}"
if [[ -z "${ZIP_IN}" ]]; then
  echo "Usage: $0 <zipfile.zip>" >&2
  exit 1
fi
[[ -f "$ZIP_IN" ]] || { echo "Datei nicht gefunden: $ZIP_IN" >&2; exit 1; }

# Abhängigkeiten prüfen
if command -v magick >/dev/null 2>&1; then IMAGICK=(magick)
elif command -v convert >/dev/null 2>&1; then IMAGICK=(convert)
else
  echo "ImageMagick nicht gefunden (magick/convert)." >&2
  exit 1
fi
command -v unzip >/dev/null 2>&1 || { echo "unzip fehlt." >&2; exit 1; }

# Zielordner = ZIP-Basisname (ohne .zip)
ZIP_BASE="$(basename "$ZIP_IN")"
OUT_DIR="${ZIP_BASE%.zip}"
mkdir -p "$OUT_DIR"

# Temp-Verzeichnis fürs Entpacken (Pfade verwerfen, nur Dateien)
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

unzip -q -j "$ZIP_IN" -d "$TMPDIR"

shopt -s nullglob nocaseglob
PNGS=( "$TMPDIR"/*.png )
shopt -u nocaseglob

if (( ${#PNGS[@]} == 0 )); then
  echo "Keine PNGs in ZIP gefunden." >&2
  exit 1
fi

# Für jedes PNG: 64x64-Tiles schneiden, 0-basiert nummerieren, Name = <dateiname-ohne-ext>-<n>.png
for PNG in "${PNGS[@]}"; do
  BASE="$(basename "${PNG%.*}")"
  # -crop teilt links->rechts, oben->unten; +adjoin erzeugt mehrere Ausgabedateien
  "${IMAGICK[@]}" "$PNG" -crop 64x64 +repage +adjoin "${OUT_DIR}/${BASE}-%d.png"
done

echo "Fertig: ${OUT_DIR}/ (Frames wie walk-0.png, walk-1.png, ...)"
