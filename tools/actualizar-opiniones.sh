#!/bin/bash
# Actualiza assets/opiniones.json con las reseñas de Google Maps.
# Crea el entorno de Python la primera vez; después solo lo reutiliza.
set -e
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  echo "Primera vez: creando entorno de Python…"
  python3 -m venv .venv
  ./.venv/bin/pip install --quiet --upgrade pip selenium
fi

./.venv/bin/python actualizar_opiniones.py "$@"
