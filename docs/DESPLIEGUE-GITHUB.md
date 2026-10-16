# GitHub → Vercel

El proyecto existente daily-red-es está conectado a nachthelad/dailyred. La rama de producción es main y conserva daily-red-es.vercel.app y su historial de despliegues.

La configuración raíz vercel.json ejecuta scripts/build-vercel.sh en Linux. Descarga la toolchain versionada con verificación SHA-256, el emulador fijado por checksums y el commit de pret/pokefirered fijado por el proyecto. Aplica el parche Daily Red, localiza y compila ambos idiomas desde las fuentes del commit desplegado.

Solo publica .toolchain/vercel-site, construido con la lista explícita de scripts/prepare-vercel.mjs. Las herramientas, checkout de pret, documentación interna y secretos quedan fuera de la salida pública. No hace falta subir las ROM generadas a GitHub. Los headers de seguridad se mantienen en el vercel.json raíz y se reutilizan en el staging manual.

La primera compilación remota descarga herramientas y compila dos ROM; tarda más que el antiguo upload de archivos ya generados. Un build fallido conserva el último despliegue válido.

Cada push a main dispara un despliegue de producción; las otras ramas generan previews según las reglas de Vercel. Para cambios de recursos web, incrementar la versión CACHE en web/sw.js para renovar la caché PWA. La actualización espera al cierre de ventanas antiguas; no fuerza recargas durante una partida.

Verificación inicial: el commit 59db142 fue compilado desde GitHub en Vercel (dpl_8TiRn1PQeffubhCFszfoFX66RKNj), con ambas ROM y salida pública lista. El manifest respondió HTTP 200 con MIME application/manifest+json y los headers de seguridad esperados.
