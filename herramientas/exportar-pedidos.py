#!/usr/bin/env python3
"""Exporta los pedidos (servidor/datos/pedidos.json) a un pedidos.json publicable: sin las claves de borrado, del más
nuevo al más viejo. Es lo que lee la pantalla PEDIDOS del juego publicado, que no tiene servidor (js/pedidos.js).
Uso: python3 herramientas/exportar-pedidos.py <salida.json> [entrada.json]"""
import json, sys, os, shutil
salida = sys.argv[1]
entrada = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'servidor', 'datos', 'pedidos.json')
try:
    pedidos = json.load(open(entrada, encoding='utf8')).get('pedidos', [])
except FileNotFoundError:
    pedidos = []
limpios = [{k: v for k, v in p.items() if k != 'clave'} for p in sorted(pedidos, key=lambda p: p.get('fecha', ''), reverse=True)]
with open(salida, 'w', encoding='utf8') as f:
    json.dump({'pedidos': limpios}, f, ensure_ascii=False, indent=1)
# Las fotos de los pedidos viajan en fotos/ al lado del json (sólo las de pedidos que siguen existiendo)
origen = os.path.join(os.path.dirname(os.path.abspath(entrada)), 'pedidos-fotos')
destino = os.path.join(os.path.dirname(os.path.abspath(salida)), 'fotos')
copiadas = 0
for p in limpios:
    f = p.get('foto')
    if f and os.path.exists(os.path.join(origen, f)):
        os.makedirs(destino, exist_ok=True); shutil.copy(os.path.join(origen, f), os.path.join(destino, f)); copiadas += 1
print(f'{len(limpios)} pedidos ({copiadas} con foto) -> {salida}', file=sys.stderr)
