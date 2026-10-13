# Verificación local — 13/10/2026

## Resultado

Daily Red compilado y funcionando en Windows, en `D:\Cosas\Dev\daily-red`. Servidor final activo en <http://localhost:8080/> y Chrome abierto en práctica <http://localhost:8080/?seed=42>. Para futuros inicios: `Jugar.cmd`; para detener: `Detener.cmd` (también Ctrl+C si abriste una consola).

## Entorno y archivos

- Checkout Daily Red: `b8ba20c6d5177642b4c55d9c948282b8a0dd904d` más las adaptaciones Windows locales, sin commit ni publicación.
- pret/pokefirered: `037335f4c725d7c9aecdac87066f2002b4bd7e14`, con el parche original Daily Red.
- El hash Git del parche coincide con HEAD: `34bbd250a477e51283722e511a5d9cc1b804c0e4`. Sólo se normalizaron sus finales de línea.
- Node existente: 22.17.1. Chrome existente: 155.0.8059.40. Entrada probada con Windows PowerShell 5.1.
- xPack ARM GCC: 14.2.1-1.1, Windows x64. GCC host MSYS2: 15.3.0-1; make: 4.4.1-3; zlib-devel: 1.3.2-1. Libpng local: 1.6.44.
- MSYS2 y GCC ARM descargados con verificación SHA-256; libpng también tiene SHA-256 fijado en el script Windows.
- Vendor descargado mediante `scripts/fetch-vendor.sh` original: Nostalgist 0.22.0, mGBA v1.22.2 y Pixelify Sans, con todas sus verificaciones originales aprobadas.
- ROM: 16.777.216 bytes. SHA-256: `ff9f50d567eb28aaf8bcee0ad9560a18354d1200419d1de5e3c9c0dd31a106c8`.
- ROM comprimida: 5.471.859 bytes. SHA-256: `d3cfecb6b475d43a31ec3a2f82eb07a4dcc0d1dfa1f261d77d82839b99ab42a7`.

## Comprobaciones aprobadas

- Compilación completa `MODERN=1` y recompilación incremental con Windows PowerShell 5.1.
- `npm ci` desde el lockfile, playwright-core 1.56.1, sin descargar otro navegador.
- `npm test`: **32 comprobaciones smoke + 29 site**, sin fallos.
- `node tests/teams.mjs 1 42 424242`: tres equipos diferentes, 18 especies, cero equipos inválidos.
- Práctica visible en Chrome: Play, emulador mGBA real, equipo completo, caminata hasta RED, batalla y ataque normal. Sin escrituras en RAM, sin forzar resultados y sin consumir el desafío diario.
- Equipo de semilla 42: Seviper, Gardevoir, Machoke, Feraligatr, Zangoose y Haunter, todos nivel 100.
- Earthquake de Seviper: PP 10 → 9; HP de Seviper 346 → 61 y de Pikachu 211 → 116 durante el intercambio. Captura muestra “SEVIPER used EARTHQUAKE!”.
- Estadísticas diarias antes/después: `null`, sin cambios. Cero errores JavaScript en esa verificación.
- `Jugar.cmd -Practice`: servidor, registro de PID y apertura del Chrome con perfil en D:.
- `Detener.cmd`: valida identidad del servidor, lo detiene y el iniciador termina con código 0. Probado también cuando ya estaba detenido.
- Puerto ocupado: error claro; no se termina el servidor que ya estaba ejecutándose.
- `git diff --check`: aprobado.

Las pruebas originales smoke/site fuerzan algunos resultados en RAM para verificar estadísticas y cierre del juego. Esos resultados se distinguen de la práctica visible, que sólo usó botones normales. No se jugó una batalla visible completa hasta victoria o derrota; se verificó el inicio y un turno real. El audio no fue evaluado auditivamente. La emulación móvil fue probada en Chrome; no se usó un teléfono físico.

## Evidencia local

- `output/playwright/windows-party.png`: equipo en la web real.
- `output/playwright/windows-red-battle.png`: batalla iniciada.
- `output/playwright/windows-turn.png`: ataque normal.
- `output/playwright/windows-verification.json`: equipo, HP, PP, estadísticas y errores.
- `tests/output/`: capturas de smoke/site.
- `.toolchain/setup-retry.log`, `build-retry.log`, `build-incremental.log`, `tests.log`, `teams.log`, `visible-verification.log`: registros.

## Espacio y uso de C:

Medición de tamaños lógicos al terminar (pueden crecer el perfil y las cachés):

| Componente en D: | Tamaño aproximado |
| --- | ---: |
| `.toolchain`, incluidas descargas, MSYS2, compiladores, temporales, cachés y Chrome | 3,51 GB |
| `pokefirered`, incluidas fuentes y compilación | 114 MB |
| `web`, incluidas ROM y vendor | 9,1 MB |
| `tests`, incluidas dependencias y capturas | 9,1 MB |
| Proyecto completo | **3,64 GB / 3,39 GiB** |

Espacio libre observado en D: antes 720.973.910.016 bytes; al cierre 719.427.387.392 bytes. La variación del volumen no equivale al tamaño lógico de los archivos y puede incluir compresión y actividad ajena.

No se instalaron compiladores, distribuciones, dependencias ni navegadores nuevos en C:. Se reutilizaron Node de `C:\Program Files\nodejs` y Chrome de `C:\Program Files\Google\Chrome`. La copia anterior en `C:\Users\nacht\Documents\Codex\2026-10-13\https-github-com-amoi-builds-dailyred` se conserva.

Las variables TEMP/TMP, HOME de MSYS2 y caché npm se asignan sólo al proceso, hacia `.toolchain` en D:. Los perfiles temporales de Playwright se observaron en `.toolchain/tmp/playwright_chromiumdev_profile-*`; el perfil persistente está en `.toolchain/chrome-profile` y su caché en `.toolchain/cache/chrome`.

Espacio libre observado en C: antes 9.636.876.288 bytes; al cierre 9.627.791.360 bytes (reducción neta de aproximadamente **8,7 MiB**). Es una medición del volumen completo: no permite atribuir ese cambio al proyecto ni cuantificar registros de Windows, antivirus, Chrome o Codex. No se detectó la necesidad de instalar ninguna herramienta considerable en C:.

## Adaptaciones y límites

Se corrigieron dos problemas de CRLF: el parche binario al copiar el checkout y la salida del CPP nativo de Windows. La solución conserva LF mediante `.gitattributes` y `scripts/windows-cpp.sh`, sin cambios adicionales en el código del juego.

MSYS2 y Chrome requirieron ejecutarse fuera del aislamiento de Codex: dentro de él fallaban la carga de DLL de MSYS2 y la conexión del Chrome visible al servidor. En el contexto normal de Windows la compilación y la partida pasaron.

No se usaron WSL, Ubuntu, Docker ni máquinas virtuales; no se cambiaron configuraciones globales ni se publicó/subió ningún archivo generado. Las advertencias del linker sobre syscalls sin implementar y segmento RWX quedaron registradas; no impidieron la compilación ni las pruebas de juego.
