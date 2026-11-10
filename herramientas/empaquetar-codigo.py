"""Empaqueta el código del juego en js/codigo-fuente.js (window.CODIGO_FUENTE = {archivo: texto}).

El asistente de construcción lee el código del juego para escribir parches. Primero lo pide a los mismos archivos
que cargó la página; si claude.ai no lo deja, carga este paquete. Se genera al publicar, no se versiona.
Uso: python3 herramientas/empaquetar-codigo.py <carpeta del juego> <archivo de salida>
"""
import json, os, re, sys

raiz, salida = sys.argv[1], sys.argv[2]
index = open(os.path.join(raiz, 'index.html'), encoding='utf-8').read()
archivos = [s for s in re.findall(r'<script src="js/([^"]+\.js)"', index) if not re.search(r'sonidos-|asistente|rama\.js', s)]
codigo = {a: open(os.path.join(raiz, 'js', a), encoding='utf-8').read() for a in archivos}
with open(salida, 'w', encoding='utf-8') as f:
    f.write('// Generado por herramientas/empaquetar-codigo.py: el código del juego, para el asistente de construcción\n')
    f.write('window.CODIGO_FUENTE = ' + json.dumps(codigo, ensure_ascii=False) + ';\n')
print(f'{len(archivos)} archivos, {os.path.getsize(salida) // 1024} KB -> {salida}')
