#!/bin/sh
set -eu

repo=$(CDPATH= cd "$(dirname "$0")/.." && pwd)
stage=$(mktemp -d "${TMPDIR:-/tmp}/veilbound-package.XXXXXXXX")
trap 'rm -rf "$stage"' EXIT HUP INT TERM

mkdir -p "$stage/assets/media" "$stage/assets/type" "$repo/downloads"
cp -R "$repo/play" "$stage/play"
cp "$repo/assets/media/compass.webp" "$stage/assets/media/"
cp "$repo/assets/type/cormorant-garamond-medium.ttf" "$repo/assets/type/OFL.txt" "$stage/assets/type/"

cat > "$stage/README.txt" <<'EOF'
VEILBOUND · ECHOES OF THE HOLLOW CROWN

Extract the entire archive, then open play/index.html in a desktop browser.
Choose The First Crossing for the short playable chapter or Begin journey
for the ten-dungeon campaign. Both run offline.

Move with WASD or the arrow keys. Press F to interact, J to strike, hold K
to guard, and press Space to dodge. Q and E use the equipped instruments.
Tab opens Equipment, M opens the campaign map, and Escape pauses.
On the chapter's default loadout, Q throws the Gale Disc and E rings the
Echo Chime. You can also play with a gamepad or on-screen touch controls.

Use Settings to adjust audio, graphics, keyboard bindings, motion, and trail
guidance. Graphics includes fullscreen and Ultra 4K (3840 × 2160).
The campaign saves in this browser. Export your save from the Pause menu
before moving the folder or playing in another browser. The short chapter
keeps checkpoints for the current session.

https://nearbycoder.github.io/veilbound/
EOF

cd "$stage"
zip -q -X -r veilbound.zip README.txt play assets
mv veilbound.zip "$repo/downloads/veilbound.zip"
printf '%s\n' "$repo/downloads/veilbound.zip"
