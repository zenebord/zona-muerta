#!/bin/bash
# Publica el último commit en GitHub (rama main) y la web en GitHub Pages (rama gh-pages), sin lo que haya sin
# commitear. Imprime la versión publicada: el artefacto se arma con la misma (herramientas/armar-artefacto.py), así
# el juego descargado de cualquiera de los dos se actualiza desde la web.
# Uso: herramientas/publicar-web.sh   (necesita gh con sesión iniciada en la cuenta del repositorio)
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=https://github.com/zenebord/zona-muerta.git
URL=https://zenebord.github.io/zona-muerta/
COMMIT=$(git rev-parse --short HEAD)
VERSION=$(date +%Y%m%d-%H%M)-$COMMIT
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir "$T/fuente"; git archive HEAD | tar -x -C "$T/fuente"
COMMIT=$COMMIT VERSION=$VERSION python3 -I "$T/fuente/herramientas/armar-web.py" "$T/web" "$URL" >&2
git push -q origin HEAD:main
cd "$T/web"
git init -q -b gh-pages
git -c user.name=zenebord -c user.email=173313277+zenebord@users.noreply.github.com add -A
git -c user.name=zenebord -c user.email=173313277+zenebord@users.noreply.github.com commit -q -m "Web publicada: $VERSION"
git push -q -f "$REPO" gh-pages:gh-pages
echo "$VERSION"
