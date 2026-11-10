#!/bin/bash
# Instala el servidor de construcción de Zona Muerta y su túnel de Cloudflare como servicios de este usuario
# (LaunchAgents): arrancan al iniciar sesión, se reinician si se caen, y caffeinate evita que la Mac se duerma
# mientras está enchufada. Se corre a mano, una vez:
#
#   bash servidor/instalar.sh servidor                    # el servidor en http://127.0.0.1:8790
#   bash servidor/instalar.sh tunel juego.tudominio.com   # enlace fijo (antes: cloudflared tunnel login)
#   bash servidor/instalar.sh provisorio                  # enlace al azar de trycloudflare.com, cambia al reiniciar
#   bash servidor/instalar.sh estado                      # qué está corriendo y cuál es el enlace
#   bash servidor/instalar.sh desinstalar                 # saca los servicios (no toca el código ni git)
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
AGENTES="$HOME/Library/LaunchAgents"
DATOS="$RAIZ/servidor/datos"
NODE="$(command -v node)"
CLOUDFLARED="$(command -v cloudflared || true)"
YO="gui/$(id -u)"
mkdir -p "$AGENTES" "$DATOS"

# Escribe un LaunchAgent y lo (re)carga. $1 = nombre, el resto = el programa con sus argumentos
agente() {
  local nombre="$1"; shift
  local plist="$AGENTES/com.zonamuerta.$nombre.plist" args=""
  for a in "$@"; do args+="    <string>$a</string>"$'\n'; done
  cat > "$plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.zonamuerta.$nombre</string>
  <key>ProgramArguments</key>
  <array>
$args  </array>
  <key>WorkingDirectory</key><string>$RAIZ</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>$DATOS/$nombre.log</string>
  <key>StandardErrorPath</key><string>$DATOS/$nombre.log</string>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>$(dirname "$NODE"):/opt/homebrew/bin:/usr/bin:/bin</string></dict>
</dict>
</plist>
EOF
  launchctl bootout "$YO/com.zonamuerta.$nombre" 2>/dev/null || true
  launchctl bootstrap "$YO" "$plist"
  echo "Servicio com.zonamuerta.$nombre instalado (registro: $DATOS/$nombre.log)"
}
quitar() { launchctl bootout "$YO/com.zonamuerta.$1" 2>/dev/null || true; rm -f "$AGENTES/com.zonamuerta.$1.plist"; }

case "${1:-}" in
  servidor)
    [ -d "$RAIZ/servidor/node_modules" ] || (cd "$RAIZ/servidor" && npm install --silent)
    [ -f "$RAIZ/servidor/.env" ] || cp "$RAIZ/servidor/.env.ejemplo" "$RAIZ/servidor/.env"
    pkill -f "node servidor/servidor.mjs" 2>/dev/null || true   # el que haya quedado corriendo a mano
    agente servidor /usr/bin/caffeinate -s "$NODE" "$RAIZ/servidor/servidor.mjs"
    sleep 2; curl -s -m 3 http://127.0.0.1:8790/api/estado && echo
    ;;
  tunel)
    host="${2:?Falta el nombre: bash servidor/instalar.sh tunel juego.tudominio.com}"
    [ -n "$CLOUDFLARED" ] || { echo "Falta cloudflared: brew install cloudflared"; exit 1; }
    [ -f "$HOME/.cloudflared/cert.pem" ] || { echo "Primero: cloudflared tunnel login (elegí el dominio en el navegador)"; exit 1; }
    "$CLOUDFLARED" tunnel info zona-muerta >/dev/null 2>&1 || "$CLOUDFLARED" tunnel create zona-muerta
    id="$("$CLOUDFLARED" tunnel info zona-muerta 2>/dev/null | grep -Eo '[0-9a-f]{8}-[0-9a-f-]{27}' | head -1)"
    "$CLOUDFLARED" tunnel route dns zona-muerta "$host" || true   # si el registro ya existe, sigue
    cat > "$HOME/.cloudflared/zona-muerta.yml" <<EOF
tunnel: $id
credentials-file: $HOME/.cloudflared/$id.json
ingress:
  - hostname: $host
    service: http://127.0.0.1:8790
  - service: http_status:404
EOF
    quitar tunel-provisorio
    agente tunel "$CLOUDFLARED" tunnel --no-autoupdate --config "$HOME/.cloudflared/zona-muerta.yml" run zona-muerta
    echo "Enlace fijo: https://$host  (puede tardar un minuto en responder la primera vez)"
    ;;
  provisorio)
    [ -n "$CLOUDFLARED" ] || { echo "Falta cloudflared: brew install cloudflared"; exit 1; }
    : > "$DATOS/tunel-provisorio.log"
    agente tunel-provisorio "$CLOUDFLARED" tunnel --no-autoupdate --url http://127.0.0.1:8790
    for _ in $(seq 1 20); do url="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$DATOS/tunel-provisorio.log" | head -1 || true)"; [ -n "$url" ] && break; sleep 1; done
    echo "Enlace provisorio: ${url:-(todavía no apareció; mirá $DATOS/tunel-provisorio.log)}"
    ;;
  estado)
    launchctl list | grep zonamuerta || echo "No hay servicios instalados"
    curl -s -m 3 http://127.0.0.1:8790/api/estado && echo || echo "El servidor no responde"
    [ -f "$HOME/.cloudflared/zona-muerta.yml" ] && grep hostname "$HOME/.cloudflared/zona-muerta.yml" || true
    grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$DATOS/tunel-provisorio.log" 2>/dev/null | tail -1 || true
    ;;
  desinstalar)
    quitar servidor; quitar tunel; quitar tunel-provisorio
    echo "Servicios quitados. El túnel con nombre sigue creado en Cloudflare (cloudflared tunnel delete zona-muerta para borrarlo)."
    ;;
  *) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//' ;;
esac
