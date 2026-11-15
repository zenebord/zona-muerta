/* ===== Zona Muerta VR: lo que ya se bajó queda guardado =====
 * Para que la app del Quest (quest/, el APK de Bubblewrap) abra también sin conexión: cada archivo que pide la página
 * (la página, vr/*.js, los js/ del juego, los sonidos, three.js y los modelos de los mandos de jsDelivr) se guarda al
 * bajarlo. Primero va a la red, así siempre corre la última versión publicada; si no hay red, sirve lo guardado.
 * Controla sólo vr/ (su carpeta): el juego 2D no pasa por acá. */
const CACHE = 'zona-muerta-vr-1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);   // las de versiones anteriores
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const r = e.request, url = new URL(r.url);
  if (r.method !== 'GET' || (url.origin !== location.origin && url.hostname !== 'cdn.jsdelivr.net')) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(r);
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)).catch(() => {}); }
      return res;
    } catch (err) {   // sin conexión: lo guardado (la página, también si cambió el ?pwa=1)
      const guardada = await caches.match(r, { ignoreSearch: r.mode === 'navigate' });
      if (guardada) return guardada;
      throw err;
    }
  })());
});
