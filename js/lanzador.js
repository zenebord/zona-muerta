/* Lanzador del juego descargado (zona-muerta.html). Es una página chica que trae el juego entero adentro (en base64,
 * así funciona sin conexión) y lo muestra en un marco. Al abrirla o recargarla:
 *   1. usa la versión más nueva que tenga: la que trae adentro o la última que bajó (guardada en IndexedDB);
 *   2. si hay conexión y dirección de actualización, pregunta en la web qué versión está publicada (version.json);
 *      si es más nueva, baja juego.html y la guarda. Si el jugador está en el menú la carga ya; si está jugando, queda
 *      para la próxima vez que recargue.
 * El marco usa srcdoc, que comparte el origen de la página: el progreso y la configuración (localStorage) se
 * conservan entre versiones. Lo usan interfaz.js (botón «Descargar el juego») y herramientas/armar-web.py, que lee
 * esta plantilla de acá: {{VERSION}}, {{URL}} y {{JUEGO}} se reemplazan al armar el archivo. Los cierres de script van como
 * <\/script> para que la plantilla pueda ir adentro de otra página sin cortarla. */
const LANZADOR_HTML = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zona Muerta</title>
<style>html,body{margin:0;height:100%;background:#0b0b0d;overflow:hidden}iframe{border:0;width:100%;height:100%;display:block}
#aviso{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:rgba(0,0,0,.8);color:#f2e6c8;font:14px sans-serif;padding:8px 14px;border-radius:6px;display:none;z-index:9}</style>
</head><body>
<iframe id="juego" title="Zona Muerta" allow="fullscreen; autoplay"></iframe>
<div id="aviso"></div>
<script type="text/plain" id="copia">{{JUEGO}}<\/script>
<script>
(async function () {
  var VERSION = '{{VERSION}}', WEB = '{{URL}}', marco = document.getElementById('juego'), aviso = document.getElementById('aviso');
  function decodificar(b) { var s = atob(b.trim()), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new TextDecoder().decode(u); }
  function avisar(t, ms) { aviso.textContent = t; aviso.style.display = 'block'; setTimeout(function () { aviso.style.display = 'none'; }, ms || 4000); }
  function mostrar(html) { marco.onload = function () { try { marco.contentWindow.focus(); } catch (e) {} }; marco.srcdoc = html; }
  var db = await new Promise(function (ok) { try { var r = indexedDB.open('zona-muerta', 1); r.onupgradeneeded = function () { r.result.createObjectStore('copias'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { ok(null); }; } catch (e) { ok(null); } });
  function leer() { return db ? new Promise(function (ok) { try { var q = db.transaction('copias').objectStore('copias').get('ultima'); q.onsuccess = function () { ok(q.result || null); }; q.onerror = function () { ok(null); }; } catch (e) { ok(null); } }) : Promise.resolve(null); }
  function guardar(v) { return db ? new Promise(function (ok) { try { var tx = db.transaction('copias', 'readwrite'); tx.objectStore('copias').put(v, 'ultima'); tx.oncomplete = ok; tx.onerror = ok; } catch (e) { ok(); } }) : Promise.resolve(); }
  var actual = { version: VERSION, html: null }, guardada = await leer();
  if (guardada && guardada.html && guardada.version > VERSION) actual = guardada;
  mostrar(actual.html || decodificar(document.getElementById('copia').textContent));
  if (!WEB || VERSION === 'dev' || navigator.onLine === false) return;
  try {
    var v = await (await fetch(WEB + 'version.json?t=' + Date.now(), { cache: 'no-store' })).json();
    if (!v.version || v.version <= actual.version) return;
    var r = await fetch(WEB + 'juego.html?v=' + encodeURIComponent(v.version), { cache: 'no-store' });
    if (!r.ok) return;
    var html = await r.text();
    if (html.indexOf(v.version) < 0) return;
    await guardar({ version: v.version, html: html });
    var jugando = false; try { jugando = !!(marco.contentWindow.ZonaMuerta && marco.contentWindow.ZonaMuerta.juego()); } catch (e) {}
    if (jugando) avisar('Hay una versión nueva del juego: se usará la próxima vez que lo abras o recargues.', 6000);
    else { mostrar(html); avisar('Juego actualizado a la última versión.'); }
  } catch (e) { /* sin conexión o la web no responde: sigue con la que tiene */ }
})();
<\/script>
</body></html>`;
