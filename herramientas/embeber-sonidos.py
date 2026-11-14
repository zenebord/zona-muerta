"""Embebe las grabaciones de sonidos/*.wav en js/sonidos-datos.js (const SONIDOS_GRABADOS = {nombre: WAV en base64}).

Las que ya estaban quedan en su orden; las nuevas se agregan al final, por nombre. Así el juego funciona abriendo
index.html directo, sin servidor. Fuentes y licencias en sonidos/CREDITOS.md.
Uso: python3 herramientas/embeber-sonidos.py   (desde la carpeta del proyecto)
"""
import base64, json, os

SALIDA = 'js/sonidos-datos.js'
CABECERA = ('/* Grabaciones reales de mecanismos de armas, recortadas y embebidas en base64 (WAV mono 44,1 kHz).\n'
            ' * Fuentes y licencias en sonidos/CREDITOS.md. Se generan desde sonidos/*.wav; no editar a mano. */\n'
            'const SONIDOS_GRABADOS = ')
previos = []
if os.path.exists(SALIDA):
    t = open(SALIDA, encoding='utf-8').read()
    previos = list(json.loads(t[t.index('{'):t.rindex('}') + 1]))
archivos = {f[:-4] for f in os.listdir('sonidos') if f.endswith('.wav')}
orden = [n for n in previos if n in archivos] + sorted(archivos - set(previos))
datos = {n: base64.b64encode(open(f'sonidos/{n}.wav', 'rb').read()).decode('ascii') for n in orden}
with open(SALIDA, 'w', encoding='utf-8') as f:
    f.write(CABECERA + json.dumps(datos) + ';\n')
print(f'{len(datos)} grabaciones ({len(set(previos) & archivos)} de antes, {len(archivos - set(previos))} nuevas) -> {SALIDA}, {os.path.getsize(SALIDA) // 1024} KB')
