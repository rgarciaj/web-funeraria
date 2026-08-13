# Funeraria Jesús Te Espera — sitio web

Sitio one-page estático de [jesusteespera.cl](https://jesusteespera.cl): HTML, CSS y JavaScript puros, con dos scripts PHP (formulario de contacto y opiniones vía API). Reemplaza al antiguo sitio WordPress.

## Estructura

```
index.html                      Página completa (única)
css/styles.css                  Estilos (paleta, animaciones, responsive)
js/main.js                      Menú, carrusel de opiniones, filtros de urnas,
                                lightbox, formulario, animaciones de scroll
assets/img/                     Imágenes del sitio (logo, urnas, fondos)
assets/opiniones.json           Reseñas de Google que muestra la página
php/contacto.php                Recibe el formulario y envía el correo
php/reviews.php                 Alternativa: opiniones vía Places API (opcional)
tools/                          Script para actualizar las opiniones
cache/                          Caché de reviews.php (se genera sola)
.htaccess                       HTTPS forzado, redirecciones, caché
.github/workflows/deploy.yml    Deploy automático al hosting en cada push
```

## Desarrollo local

```bash
# opción simple (sin PHP):
python3 -m http.server 8734
# con PHP (formulario funcionando):
php -S localhost:8734
```

Abrir http://localhost:8734

## Actualizar las opiniones de Google

```bash
./tools/actualizar-opiniones.sh
```

Abre un Chrome invisible, carga la ficha del negocio en Google Maps, descarga
**todas** las reseñas y reescribe `assets/opiniones.json`. La primera vez crea
el entorno de Python automáticamente (necesita Google Chrome instalado).

Luego revisar el archivo y publicar (el push despliega automáticamente a
jesusteespera.cl):

```bash
git add -A && git commit -m "Actualiza opiniones" && git push
```

Si Google cambia su diseño y el script falla, ejecutarlo con ventana visible
para diagnosticar: `./tools/actualizar-opiniones.sh --visible`

Notas técnicas del script (no tocar sin motivo):
- Usa un user-agent de Chrome normal: sin él, Google sirve una "vista
  limitada" con menos reseñas.
- No reordena por "más recientes": ese reordenamiento rompe la carga
  progresiva y deja reseñas fuera.

## Formulario de contacto (correo)

`php/contacto.php` envía con `mail()` de PHP a las casillas configuradas al
inicio del archivo. Requisitos en el servidor:

1. Hosting con PHP 8+.
2. Que el hosting permita `mail()` (la mayoría de los hosting compartidos sí).
3. El remitente (`$REMITENTE`) debe ser una casilla del mismo dominio
   (`sitio@jesusteespera.cl`) para no caer en spam. Crearla en el panel del
   hosting si no existe.

Si el hosting bloquea `mail()` o los correos llegan a spam, cambiar a SMTP
autenticado (PHPMailer) — se necesita host SMTP, puerto, usuario y contraseña
de la casilla.

Si el sitio se sirve sin PHP (por ejemplo en un preview estático), el
formulario muestra un mensaje pidiendo llamar por teléfono.

## Publicación

Automática: cada push a `main` sube el sitio por FTPS al hosting mediante
GitHub Actions (`.github/workflows/deploy.yml`). Los secrets necesarios ya
están configurados en GitHub → Settings → Secrets and variables → Actions:

- `FTP_SERVER` — ej. `ftp.jesusteespera.cl`
- `FTP_USERNAME` — usuario del hosting
- `FTP_PASSWORD` — contraseña

Publica directo en `public_html/` (producción). El sitio WordPress antiguo
quedó respaldado en la carpeta `wordpress_respaldo/` del hosting (agosto
2026); su base de datos sigue intacta en MySQL por si hiciera falta.

## Datos del negocio

- Dirección: Carmen 1590, esquina Maule, Santiago
- Teléfonos principales: +56 2 2554 0370 · +56 9 6239 9667
- Secundarios: +56 2 2551 1676 · +56 9 7967 7038
- WhatsApp: +56 9 5207 7154
- Instagram: [@funerariajesusteespera](https://www.instagram.com/funerariajesusteespera/)
- Ficha Google Maps: https://maps.google.com/?cid=3490141509042910093
