# Abrir desde el celular

Sitio estable en Vercel: https://daily-red-es.vercel.app/?seed=42&lang=es (práctica en español). No depende de que esta PC esté encendida. Proyecto `daily-red-es`, despliegue de producción `dpl_4NPTbbJLrtb9vTdiPyG3V8qPPoMo`. Se publicaron solamente los archivos web preparados en `.toolchain/vercel-site`, sin subir nada a GitHub. Para actualizar, ejecutar `node scripts/prepare-vercel.mjs` y desplegar esa carpeta en el mismo proyecto. Las credenciales y archivos `.env*` están excluidos de la publicación.

Los túneles siguientes fueron la alternativa inicial y ya se cerraron tras publicar en Vercel.

Ejecutá `Publicar-temporal.cmd` y abrí el enlace HTTPS que muestra. Incluye `?seed=42&lang=es`: español y práctica, sin consumir el desafío diario. Para jugar el desafío diario, quitá `seed=42` del enlace.

Es un [túnel temporal de Cloudflare](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/). Funciona mientras esta PC tenga conexión y sigan activos el servidor y el túnel. El enlace puede cambiar al reiniciarlo; cualquiera que lo tenga puede abrir el juego. No requiere estar en la misma red Wi-Fi.

Para cerrarlo, ejecutá `Cerrar-publico.cmd`. Esto detiene únicamente el túnel y su servidor del puerto 8081; `Jugar.cmd` y `Detener.cmd` siguen controlando el servidor local habitual del puerto 8080.

El ejecutable portable está en `.toolchain/cloudflared/cloudflared.exe` (55.365.048 bytes, versión 2026.10.0). Se verificó SHA-256 contra el digest publicado por GitHub: `86aee4017b26625cee8484c113558f48effa4cd47f7aa05fcf425604e5d2b23c`. No instala servicios ni cambia configuraciones globales. Ejecutable, logs, metadatos y temporales quedan dentro del proyecto en D:.

La dirección actual y los PID están en `.toolchain/public-server.json`. Los logs están en `.toolchain/public-tunnel.log` y `.toolchain/public-server*.log`.

Verificación reproducible: `powershell -NoProfile -ExecutionPolicy Bypass -Command ". ./scripts/windows-env.ps1; node tests/public-smoke.mjs"`. Usa el Chrome instalado, tamaño de celular y la ROM real en español; comprueba equipo, batalla contra RED y errores JavaScript. Evidencias en `output/playwright/public/`. La prueba en un teléfono físico queda a cargo del usuario.
