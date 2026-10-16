# Verificación local — 16/10/2026

Alcance corregido: PWA con aviso de 3 segundos e icono junto al idioma. Capturas y grabaciones mediante funciones nativas del celular. Se eliminaron módulo, controles, exportadores y traducciones de captura interna. El worker pasó a v2 para retirar esos recursos de su caché al activarse.

- node tests/pwa.mjs: aviso/minimización/reapertura, evento de instalación simulado, manifest/iconos, arranque offline con emulador real, standalone simulado y ausencia de botones de captura/grabación.
- node tests/toolbar.mjs: audio, fullscreen, fin de partida y límite diario con emulador real.
- node scripts/prepare-vercel.mjs: staging local sin módulo de captura; sin despliegue.

Pruebas en Chrome aislado de escritorio, viewport móvil 390×844. Instalación nativa y captura/grabación del sistema en Android/iPhone físicos pendientes. Evidencias nuevas en output/playwright/pwa/. Las evidencias del alcance anterior no prueban las funciones nativas del celular.
