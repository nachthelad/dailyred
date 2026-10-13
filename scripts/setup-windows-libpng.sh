#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TC="$ROOT/.toolchain"
if [ -f "$TC/libpng/lib/libpng.a" ]; then exit 0; fi
src="$TC/downloads/libpng-1.6.44"
curl -fL --retry 3 -o "$src.tar.gz" https://github.com/pnggroup/libpng/archive/refs/tags/v1.6.44.tar.gz
echo "0ef5b633d0c65f780c4fced27ff832998e71478c13b45dfb6e94f23a82f64f7c  $src.tar.gz" | sha256sum -c -
tar -xzf "$src.tar.gz" -C "$TC/downloads"
cp "$src/scripts/pnglibconf.h.prebuilt" "$src/pnglibconf.h"
mkdir -p "$TC/libpng/include" "$TC/libpng/lib" "$src/obj"
for f in png pngerror pngget pngmem pngpread pngread pngrio pngrtran pngrutil pngset pngtrans pngwio pngwrite pngwtran pngwutil; do
  gcc -O2 -DPNG_ARM_NEON_OPT=0 -DPNG_INTEL_SSE_OPT=0 -I"$src" -c "$src/$f.c" -o "$src/obj/$f.o"
done
ar rcs "$TC/libpng/lib/libpng.a" "$src"/obj/*.o
cp "$src/png.h" "$src/pngconf.h" "$src/pnglibconf.h" "$TC/libpng/include/"
