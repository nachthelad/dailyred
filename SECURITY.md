# Seguridad y límites

El sitio publicado es estático. No ofrece API, base de datos, cuentas, subida de archivos ni ejecución de comandos del visitante. Las ROM y el emulador son recursos públicos necesarios para jugar; las credenciales, herramientas y notas locales no forman parte del despliegue.

- La práctica con semillas personalizadas sólo se acepta en `localhost`, `127.0.0.1` y `::1`. En dominios públicos se elimina el parámetro y siempre se usa el desafío diario.
- La preparación para Vercel copia una lista explícita de recursos, rechaza enlaces simbólicos y limpia archivos de despliegues anteriores. Excluye archivos de entorno y metadatos locales.
- La política CSP limita scripts, conexiones y recursos al propio sitio y a los blobs del emulador; prohíbe scripts inline, formularios, plugins y marcos externos. Nostalgist necesita `unsafe-eval` para importar el core dinámicamente; se conserva el proveedor fijado y sus checksums.
- Se añaden `nosniff`, protección contra incrustación en iframes, política de referentes y desactivación de cámara, micrófono, geolocalización y pagos.

El límite de una batalla diaria y las estadísticas se guardan en el navegador. No es un sistema antifraude: borrar datos, cambiar de navegador/dispositivo o modificar el código local permite eludirlo. Imponer un límite por persona requeriría cuentas y validación del servidor.

Después de preparar los recursos con `node scripts/prepare-vercel.mjs`, `npm run security --prefix tests` comprueba el bloqueo de práctica pública y el inicio real de la ROM bajo la CSP. Es una revisión acotada, no una garantía de ausencia de vulnerabilidades ni una prueba de capacidad del hosting.
