# Arma la página publicable como artefacto a partir de index.html: sin <html>/<head>/<body>,
# con título corto, el CSS integrado y los scripts como archivos anexos (mismas rutas js/...).
# Cada script se pide con ?v=<huella de su contenido>: si el archivo cambia, cambia la dirección y el navegador
# (sobre todo el del celular, que guarda todo en caché) no puede seguir usando la copia vieja ni mezclar versiones.
# Uso: python3 herramientas/armar-artefacto.py <carpeta del proyecto> <carpeta de salida>
import hashlib, pathlib, re, sys

proyecto, salida = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
html = (proyecto / 'index.html').read_text()
css = (proyecto / 'css/estilos.css').read_text()
cuerpo = re.search(r'<body>(.*)</body>', html, re.S).group(1)


def con_huella(m):
    ruta = m.group(1)
    huella = hashlib.sha1((proyecto / ruta).read_bytes()).hexdigest()[:10]
    return f'<script src="{ruta}?v={huella}"></script>'


cuerpo = re.sub(r'<script src="(js/[^"?]+)"></script>', con_huella, cuerpo)
pagina = ('<title>Zona Muerta</title>\n'
          '<style>\n/* Juego de estética única y oscura: esquema oscuro fijo, fondo explícito */\n'
          ':root { color-scheme: dark; }\n' + css + '\n</style>\n' + cuerpo.strip() + '\n')
salida.mkdir(parents=True, exist_ok=True)
(salida / 'index.html').write_text(pagina)
scripts = re.findall(r'<script src="(js/[^"]+)"></script>', cuerpo)
print(len(pagina) // 1024, 'KB de página;', len(scripts), 'scripts, cada uno con su huella')
