#!/usr/bin/env bash
# Native Windows GCC writes CRLF; pret's assembly enum parser requires LF.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
"$ROOT/.toolchain/arm-none-eabi/bin/arm-none-eabi-cpp.exe" "$@" | tr -d '\r'
