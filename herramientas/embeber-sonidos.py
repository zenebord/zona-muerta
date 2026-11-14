"""Embebe las grabaciones en base64 para que el juego funcione abriendo index.html directo, sin servidor.

- sonidos/*.wav (mecanismos de recarga, WAV mono 44,1 kHz)  -> js/sonidos-datos.js  (const SONIDOS_GRABADOS)
- sonidos/armas/*.mp3 (disparos, explosiones y foley, MP3)  -> js/sonidos-armas.js  (const SONIDOS_ARMAS)

Las que ya estaban quedan en su orden; las nuevas se agregan al final, por nombre. Fuentes y licencias en
sonidos/CREDITOS.md. Uso: python3 herramientas/embeber-sonidos.py   (desde la carpeta del proyecto)
"""
import base64, json, os

GRUPOS = [
    ('sonidos', '.wav', 'js/sonidos-datos.js', 'SONIDOS_GRABADOS',
     '/* Grabaciones reales de mecanismos de armas, recortadas y embebidas en base64 (WAV mono 44,1 kHz).\n'
     ' * Fuentes y licencias en sonidos/CREDITOS.md. Se generan desde sonidos/*.wav; no editar a mano. */\n'),
    ('sonidos/armas', '.mp3', 'js/sonidos-armas.js', 'SONIDOS_ARMAS',
     '/* Disparos de armas reales, explosiones y foley (agarrar el arma, el pasador de la granada), embebidos en base64\n'
     ' * (MP3 mono). Fuentes y licencias en sonidos/CREDITOS.md. Se generan desde sonidos/armas/*.mp3; no editar a mano. */\n'),
]
for carpeta, ext, salida, constante, cabecera in GRUPOS:
    previos = []
    if os.path.exists(salida):
        t = open(salida, encoding='utf-8').read()
        previos = list(json.loads(t[t.index('{'):t.rindex('}') + 1]))
    archivos = {f[:-len(ext)] for f in os.listdir(carpeta) if f.endswith(ext)}
    orden = [n for n in previos if n in archivos] + sorted(archivos - set(previos))
    datos = {n: base64.b64encode(open(f'{carpeta}/{n}{ext}', 'rb').read()).decode('ascii') for n in orden}
    with open(salida, 'w', encoding='utf-8') as f:
        f.write(cabecera + f'const {constante} = ' + json.dumps(datos) + ';\n')
    print(f'{len(datos)} grabaciones ({len(set(previos) & archivos)} de antes, {len(archivos - set(previos))} nuevas) -> {salida}, {os.path.getsize(salida) // 1024} KB')
