# Arma la versión web del juego para publicarla en un hosting estático (GitHub Pages, por ejemplo):
#   index.html, css/ y js/     el juego para jugar en línea
#   juego.html                 el juego entero en un solo archivo (lo baja el lanzador para actualizarse)
#   zona-muerta.html           el lanzador para descargar: trae el juego adentro y se actualiza solo (js/lanzador.js)
#   version.json               la versión publicada, que consulta el lanzador
# La versión es la fecha y hora más el commit (AAAAMMDD-HHMM-abc1234): se compara como texto, así que la más nueva
# siempre es «mayor». Uso: python3 -I herramientas/armar-web.py <carpeta de salida> <URL pública terminada en />
import base64, hashlib, json, os, pathlib, re, shutil, subprocess, sys, time

proyecto = pathlib.Path(__file__).resolve().parent.parent
salida, url = pathlib.Path(sys.argv[1]), sys.argv[2]
if url and not url.endswith('/'): url += '/'
commit = os.environ.get('COMMIT') or subprocess.run(['git', '-C', str(proyecto), 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True).stdout.strip() or 'local'
version = os.environ.get('VERSION') or time.strftime('%Y%m%d-%H%M') + '-' + commit   # VERSION: la fija herramientas/publicar-web.sh

if salida.exists(): shutil.rmtree(salida)
(salida / 'css').mkdir(parents=True); (salida / 'js').mkdir()
shutil.copy(proyecto / 'css/estilos.css', salida / 'css/estilos.css')
html = (proyecto / 'index.html').read_text()
scripts = re.findall(r'<script src="(js/[^"]+)"></script>', html)
for s in scripts: shutil.copy(proyecto / s, salida / s)
# vr/: el campo de pruebas en realidad virtual (Meta Quest, WebXR); usa los mismos js/ de arriba
if (proyecto / 'vr').is_dir(): shutil.copytree(proyecto / 'vr', salida / 'vr')
(salida / 'js/version.js').write_text(
    "/* Versión publicada (la escribe herramientas/armar-web.py). */\n"
    f"const VERSION_JUEGO = '{version}';\nconst URL_ACTUALIZACION = '{url}';\n")

# juego.html: el CSS y los scripts adentro, en el mismo orden
juego = html.replace('<link rel="stylesheet" href="css/estilos.css">', '<style>\n' + (proyecto / 'css/estilos.css').read_text() + '\n</style>')
for s in scripts:
    codigo = (salida / s).read_text().replace('</script', '<\\/script')
    juego = juego.replace(f'<script src="{s}"></script>', '<script>\n' + codigo + '\n</script>', 1)
(salida / 'juego.html').write_text(juego)

# zona-muerta.html: la plantilla del lanzador con el juego en base64
plantilla = re.search(r'const LANZADOR_HTML = `(.*?)`;', (proyecto / 'js/lanzador.js').read_text(), re.S).group(1).replace('<\\/script>', '</script>')
lanzador = (plantilla.replace('{{VERSION}}', version).replace('{{URL}}', url)
            .replace('{{JUEGO}}', base64.b64encode(juego.encode()).decode()))
(salida / 'zona-muerta.html').write_text(lanzador)
# index.html para jugar en línea: cada archivo con ?v=<huella>, así el navegador no mezcla versiones viejas (caché)
huella = lambda ruta: hashlib.sha1((salida / ruta).read_bytes()).hexdigest()[:10]
pagina = re.sub(r'<script src="(js/[^"?]+)"></script>', lambda m: f'<script src="{m.group(1)}?v={huella(m.group(1))}"></script>', html)
pagina = pagina.replace('href="css/estilos.css"', f'href="css/estilos.css?v={huella("css/estilos.css")}"')
(salida / 'index.html').write_text(pagina)
# vr/: lo mismo con los js/ del juego que usa, con campo.js y con los módulos que importa (mapa de importación), así el
# navegador del visor no mezcla archivos viejos y nuevos después de publicar
vr = salida / 'vr' / 'index.html'
if vr.exists():
    t = re.sub(r'<script src="\.\./(js/[^"?]+)"></script>', lambda m: f'<script src="../{m.group(1)}?v={huella(m.group(1))}"></script>', vr.read_text())
    modulos = sorted(f.name for f in (salida / 'vr').glob('*.js') if f.name != 'campo.js')
    mapa = ''.join(f',\n                 "./{n}": "./{n}?v={huella("vr/" + n)}"' for n in modulos)
    t = t.replace('"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/" }', '"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"' + mapa + ' }')
    t = t.replace('src="campo.js"', f'src="campo.js?v={huella("vr/campo.js")}"')
    vr.write_text(t)
(salida / 'version.json').write_text(json.dumps({'version': version}) + '\n')
(salida / '.nojekyll').write_text('')   # GitHub Pages: servir todo tal cual
print(version, '·', len(scripts), 'scripts ·', len(juego) // 1024, 'KB juego.html ·', len(lanzador) // 1024, 'KB zona-muerta.html')
