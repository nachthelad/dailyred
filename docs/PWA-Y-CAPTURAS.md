# Instalación y capturas nativas

El icono de descarga junto al idioma abre la invitación de instalación. En la primera visita de cada sesión aparece unos 3 segundos y se minimiza automáticamente. Al interactuar permanece abierta. El diálogo nativo requiere tocar Instalar cuando el navegador lo permita. En modo standalone se ocultan invitación e icono.

En iPhone/iPad, la ayuda indica Safari → Compartir → Agregar a inicio. La instalación pública requiere HTTPS; localhost es una excepción segura. Las estadísticas permanecen en cada navegador/app, sin sincronización ni reanudación de partidas.

Las screenshots y grabaciones se hacen directamente con las funciones del celular. El sitio no agrega botones, exportadores ni permisos de captura. Comprobar imagen y audio en el grabador del dispositivo.

## Caché

El worker precarga la interfaz y guarda ROM y núcleo al usarlos. El primer uso requiere conexión; para jugar offline hay que cargar antes cada idioma bajo control del worker. Solo se cachean recursos de la lista explícita.

Incrementar CACHE en web/sw.js por cada release de recursos públicos. El worker espera el cierre de las ventanas anteriores; no fuerza recargas durante una partida. Elimina solo cachés Daily Red anteriores, sin tocar estadísticas. node scripts/prepare-vercel.mjs prepara los archivos sin desplegar.

## Pendiente en dispositivos físicos

1. Con un release HTTPS autorizado, instalar en Android Chrome e iPhone Safari y abrir standalone sin cartel.
2. Durante la partida, sacar screenshots y grabar con las funciones nativas. Reproducir desde la galería y verificar imagen/audio.
3. Revisar controles, idioma, fullscreen disponible y persistencia de estadísticas.
4. Tras cargar cada idioma, probar offline. Verificar que un nuevo release no interrumpa una partida.
