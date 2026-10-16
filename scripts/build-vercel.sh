#!/usr/bin/env bash
# Clean Linux build from Git sources. Generated ROMs/toolchains stay out of Git.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [ "$(uname -s)" != Linux ] || [ "$(uname -m)" != x86_64 ]; then
  echo 'This build targets the Vercel Linux x86_64 image.' >&2
  exit 1
fi
TC="$ROOT/.toolchain"
mkdir -p "$TC/downloads"
GCC_VER='14.2.1-1.1'
GCC_NAME="xpack-arm-none-eabi-gcc-$GCC_VER"
if [ ! -x "$TC/$GCC_NAME/bin/arm-none-eabi-gcc" ]; then
  archive="$GCC_NAME-linux-x64.tar.gz"
  url="https://github.com/xpack-dev-tools/arm-none-eabi-gcc-xpack/releases/download/v$GCC_VER/$archive"
  curl -fL --retry 3 -o "$TC/downloads/$archive" "$url"
  curl -fsSL --retry 3 -o "$TC/downloads/$archive.sha" "$url.sha"
  expected="$(awk '{print $1}' "$TC/downloads/$archive.sha")"
  printf '%s  %s\n' "$expected" "$TC/downloads/$archive" | sha256sum -c -
  tar -xzf "$TC/downloads/$archive" -C "$TC"
fi
TOOLCHAIN="$TC/$GCC_NAME"
"$TOOLCHAIN/bin/arm-none-eabi-gcc" --version | head -1
# Vercel's build image supplies gcc/g++, make, libpng-devel and zlib-devel.
pkg-config --exists libpng
bash scripts/fetch-vendor.sh
if [ ! -d pokefirered ]; then bash scripts/get-pokefirered.sh; fi
node scripts/localize-rom.mjs
JOBS=2
make -C pokefirered -j"$JOBS" TOOLCHAIN="$TOOLCHAIN" MODERN=1
make -C .toolchain/pokefirered-es -j"$JOBS" TOOLCHAIN="$TOOLCHAIN" MODERN=1
mkdir -p web/game
gzip -9 -n -c pokefirered/pokefirered_modern.gba > web/game/dailyred.gba.gz
gzip -9 -n -c .toolchain/pokefirered-es/pokefirered_modern.gba > web/game/dailyred-es.gba.gz
cp pokefirered/graphics/trainers/front_pics/red_front_pic.png web/game/red.png
node scripts/prepare-vercel.mjs
