#!/usr/bin/env bash
# Guarda la fecha y hora actual en un archivo de texto cada vez que se ejecuta.
# Uso: ./scripts/marca_hora.sh

set -euo pipefail

ARCHIVO="$(dirname "$0")/registro_horas.txt"

echo "$(date '+%Y-%m-%d %H:%M:%S')" >> "$ARCHIVO"

echo "Hora registrada en $ARCHIVO"
