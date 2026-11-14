/* ===== Munición: el cartucho de cada arma, a escala =====
 * Cada arma tira su calibre y eso se ve: la bala que asoma arriba del cargador, la que entra por la ventana de la
 * recámara, la que lleva la mano al cargar de a una, el peine, el cargador rápido y la cinta son ese cartucho, con sus
 * medidas reales en centímetros (se dibujan en el marco de los modelos: CM). Así las pistolas y las metralletas llevan
 * balas chicas, los fusiles medianas y solo los de francotirador y la .50 del Barrett y la M2 las llevan grandes.
 * Antes había cuatro tamaños genéricos, y la bala suelta era una barra de 10 unidades (17 cm a escala), siempre parada,
 * amarilla y con contorno negro.
 *   vaina   largo de la vaina            d      diámetro del cuerpo
 *   punta   cuánto asoma la bala         forma  recta (pistola y revólver) | cuello (fusil: la vaina se angosta) |
 *   nariz   redonda | punta | chata             escopeta (plástico y culote) | granada (40 mm)
 *   pestana la vaina tiene reborde (revólveres, .30-30, 7,62 × 54 R)
 *   cuello  diámetro del cuello sobre el del cuerpo (por defecto 0,68)
 */
const CALIBRES = {
  '9x19':     { vaina: 1.92, d: 0.99, punta: 1.05, forma: 'recta', nariz: 'redonda' },                 // 2,97 cm
  '.380':     { vaina: 1.73, d: 0.95, punta: 0.77, forma: 'recta', nariz: 'redonda' },                 // PPK
  '7.63x25':  { vaina: 2.5, d: 0.98, punta: 0.98, forma: 'cuello', nariz: 'redonda', cuello: 0.82 },   // Mauser C96
  '.45':      { vaina: 2.28, d: 1.21, punta: 0.96, forma: 'recta', nariz: 'redonda' },
  '.50AE':    { vaina: 3.27, d: 1.37, punta: 0.82, forma: 'recta', nariz: 'chata' },                   // Desert Eagle: 4,1 cm
  '.44':      { vaina: 3.26, d: 1.16, punta: 0.83, forma: 'recta', nariz: 'chata', pestana: true },
  '.357':     { vaina: 3.28, d: 0.96, punta: 0.76, forma: 'recta', nariz: 'chata', pestana: true },
  '5.7x28':   { vaina: 2.89, d: 0.79, punta: 1.16, forma: 'cuello', nariz: 'punta', cuello: 0.74 },    // P90
  '7.62x39':  { vaina: 3.87, d: 1.13, punta: 1.73, forma: 'cuello', nariz: 'punta', cuello: 0.76 },    // AK: 5,6 cm
  '5.56x45':  { vaina: 4.47, d: 0.96, punta: 1.27, forma: 'cuello', nariz: 'punta', cuello: 0.66 },    // M16: 5,7 cm
  '.30-30':   { vaina: 5.18, d: 1.07, punta: 1.3, forma: 'cuello', nariz: 'chata', cuello: 0.8, pestana: true },
  '7.62x51':  { vaina: 5.12, d: 1.19, punta: 1.98, forma: 'cuello', nariz: 'punta', cuello: 0.72 },    // .308: 7,1 cm
  '7.62x54R': { vaina: 5.37, d: 1.24, punta: 2.33, forma: 'cuello', nariz: 'punta', cuello: 0.7, pestana: true },   // Mosin y SVD: 7,7 cm
  '.30-06':   { vaina: 6.35, d: 1.2, punta: 2.13, forma: 'cuello', nariz: 'punta', cuello: 0.72 },     // Garand: 8,5 cm
  '.50BMG':   { vaina: 9.9, d: 2.04, punta: 3.9, forma: 'cuello', nariz: 'punta', cuello: 0.7 },       // Barrett y M2: 13,8 cm
  '12':       { vaina: 6.6, d: 2.03, punta: 0, forma: 'escopeta' },                                    // cartucho del 12
  '40mm':     { vaina: 4.6, d: 4.1, punta: 5.3, forma: 'granada' },                                    // granada de 40 × 46
};
const CALIBRE_ARMA = {
  glock: '9x19', beretta92: '9x19', uzi: '9x19', mp5: '9x19', ppk: '.380', mauser: '7.63x25', colt1911: '.45', thompson: '.45', vector: '.45',
  deagle: '.50AE', magnum: '.44', python: '.357', p90: '5.7x28', ak47: '7.62x39', m16: '5.56x45', winchester1894: '.30-30',
  remington700: '7.62x51', minigun: '7.62x51', mosin: '7.62x54R', svd: '7.62x54R', garand: '.30-06', barrett: '.50BMG', m2: '.50BMG',
  recortada: '12', mossberg: '12', spas12: '12', aa12: '12', saiga: '12', benelli: '12', rem870: '12', winchester1887: '12', m79: '40mm', mgl: '40mm',
};
const calibreDe = id => CALIBRES[CALIBRE_ARMA[id]] || CALIBRES['7.62x39'];
const largoCartucho = cal => cal.vaina + cal.punta;

// Tonos [luz, base, sombra]: latón y cobre apagados, como se ven de verdad, y sin contorno: el canto lo da la sombra
const TONOS_MUNICION = {
  laton: ['#dccb98', '#b39b62', '#7a683d'], cobre: ['#cfa587', '#a57553', '#6a4832'], plastico: ['#c47d72', '#99443b', '#632924'],
  aluminio: ['#d4d2c7', '#a8a69b', '#727167'], oliva: ['#8d966d', '#5d6744', '#3a412b'], oro: ['#d8c88c', '#b39d57', '#7b6a36'], acero: ['#9a9da3', '#63666d', '#3c3e43'],
};

/* Un cartucho acostado sobre el eje x: el culote en x = 0 y la punta hacia +x, centrado en y = 0 (en cm).
 * op.servida: solo la vaina, sin bala (la que sale por la ventana). Se pinta como un cilindro con la luz arriba: si el
 * dibujo está dado vuelta, la luz se da vuelta con él para que siga viniendo de arriba. */
function dibujarCartucho(ctx, cal, op = {}) {
  const r = cal.d / 2, v = cal.vaina, p = op.servida ? 0 : cal.punta;
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fillRect(0, -r, v + p * 0.85, cal.d); return; }
  const m = ctx.getTransform(), invertido = m.d < 0;
  const cilindro = (tonos, rr, trazar) => {
    const g = ctx.createLinearGradient(0, invertido ? rr : -rr, 0, invertido ? -rr : rr);
    g.addColorStop(0, tonos[1]); g.addColorStop(0.22, tonos[0]); g.addColorStop(0.58, tonos[1]); g.addColorStop(1, tonos[2]);
    ctx.beginPath(); trazar(); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  };
  const raya = (x, rr, alfa = 0.34, ancho = 0.09) => { ctx.fillStyle = `rgba(58, 42, 14, ${alfa})`; ctx.fillRect(x - ancho / 2, -rr, ancho, rr * 2); };
  const T = TONOS_MUNICION;
  if (cal.forma === 'escopeta') {   // vaina de plástico con el cierre en estrella y el culote de latón
    const q = Math.min(0.42, r * 0.5);
    cilindro(T.plastico, r * 0.97, () => { ctx.moveTo(1.3, -r * 0.97); ctx.lineTo(v - q, -r * 0.97); ctx.quadraticCurveTo(v, -r * 0.97, v, -r * 0.97 + q); ctx.lineTo(v, r * 0.97 - q); ctx.quadraticCurveTo(v, r * 0.97, v - q, r * 0.97); ctx.lineTo(1.3, r * 0.97); });
    cilindro(T.laton, r, () => ctx.rect(0.16, -r, 1.34, cal.d));
    cilindro(T.laton, r * 1.07, () => ctx.rect(0, -r * 1.07, 0.2, cal.d * 1.07));   // reborde
    raya(1.5, r, 0.3);
    return;
  }
  if (cal.forma === 'granada') {    // 40 mm: vaina corta de aluminio, cuerpo verde y ojiva dorada
    const c0 = v, c1 = v + cal.punta * 0.34, fin = v + cal.punta;
    cilindro(T.oro, r * 0.96, () => { ctx.moveTo(c1, -r * 0.96); ctx.bezierCurveTo(c1 + (fin - c1) * 0.62, -r * 0.96, fin, -r * 0.52, fin, 0); ctx.bezierCurveTo(fin, r * 0.52, c1 + (fin - c1) * 0.62, r * 0.96, c1, r * 0.96); });
    cilindro(T.oliva, r * 0.98, () => ctx.rect(c0 - 0.05, -r * 0.98, c1 - c0 + 0.1, cal.d * 0.98));
    cilindro(T.aluminio, r, () => ctx.rect(0.2, -r, v - 0.2, cal.d));
    cilindro(T.aluminio, r * 1.04, () => ctx.rect(0, -r * 1.04, 0.3, cal.d * 1.04));
    raya(v, r, 0.3, 0.14);
    return;
  }
  const conCuello = cal.forma === 'cuello', rn = r * (conCuello ? cal.cuello ?? 0.68 : 0.93), hombro = v * 0.74, boca = v * 0.83;
  if (p) cilindro(T.cobre, rn, () => {   // la bala va primero: la vaina le tapa la base
    ctx.moveTo(v - 0.1, -rn); ctx.lineTo(v, -rn);
    if (cal.nariz === 'punta') { ctx.quadraticCurveTo(v + p * 0.6, -rn * 0.92, v + p, 0); ctx.quadraticCurveTo(v + p * 0.6, rn * 0.92, v, rn); }
    else if (cal.nariz === 'chata') { ctx.lineTo(v + p * 0.3, -rn); ctx.quadraticCurveTo(v + p * 0.9, -rn * 0.94, v + p, -rn * 0.5); ctx.lineTo(v + p, rn * 0.5); ctx.quadraticCurveTo(v + p * 0.9, rn * 0.94, v + p * 0.3, rn); ctx.lineTo(v, rn); }
    else { ctx.bezierCurveTo(v + p * 0.72, -rn, v + p, -rn * 0.55, v + p, 0); ctx.bezierCurveTo(v + p, rn * 0.55, v + p * 0.72, rn, v, rn); }
    ctx.lineTo(v - 0.1, rn);
  });
  cilindro(T.laton, r, () => {
    ctx.moveTo(0, -r);
    if (conCuello) { ctx.lineTo(hombro, -r); ctx.lineTo(boca, -rn); ctx.lineTo(v, -rn); ctx.lineTo(v, rn); ctx.lineTo(boca, rn); ctx.lineTo(hombro, r); }
    else { ctx.lineTo(v, -r); ctx.lineTo(v, r); }
    ctx.lineTo(0, r);
  });
  if (cal.pestana) cilindro(T.laton, r * 1.13, () => ctx.rect(0, -r * 1.13, Math.min(0.16, v * 0.06), cal.d * 1.13));   // reborde
  else raya(Math.min(0.24, v * 0.09), r, 0.38);                                                                          // ranura del extractor
  if (p) raya(v, rn, 0.3, 0.07);                                                                                         // boca de la vaina
}
// El mismo cartucho con el centro en (x, y) y apuntando hacia `ang` (0: hacia +x)
function cartuchoEn(ctx, cal, x, y, ang = 0, op) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.translate(-(cal.vaina + (op && op.servida ? 0 : cal.punta)) / 2, 0);
  dibujarCartucho(ctx, cal, op); ctx.restore();
}

/* ---------- Lo que lleva la mano al cargar (en cm; la punta de las balas hacia +x) ---------- */
// Peine: las balas una sobre otra tomadas del culote por la lámina de acero. El en bloque del Garand lleva ocho en dos
// hileras (de costado se ven cuatro). cuantas: las que le quedan (se van metiendo en el depósito de arriba hacia abajo)
const altoPeine = armaId => (armaId === 'garand' ? 4 : 5) * calibreDe(armaId).d * 1.08;   // la pila de balas que se ve, en cm
function dibujarPeine(ctx, armaId, cuantas = null) {
  const cal = calibreDe(armaId), enBloque = armaId === 'garand', n = enBloque ? 4 : 5, paso = cal.d * 1.08, alto = altoPeine(armaId), q = cuantas == null ? n : Math.max(0, Math.min(n, cuantas));
  for (let k = n - q; k < n; k++) { ctx.save(); ctx.translate(0, -alto / 2 + paso * (k + 0.5)); dibujarCartucho(ctx, cal); ctx.restore(); }
  if (Pincel.silueta) return;
  const g = ctx.createLinearGradient(-0.5, 0, enBloque ? cal.vaina * 0.62 : 0.5, 0), A = TONOS_MUNICION.acero;
  g.addColorStop(0, A[1]); g.addColorStop(0.3, A[0]); g.addColorStop(1, A[2]);
  ctx.fillStyle = g;
  if (enBloque) { ctx.beginPath(); ctx.roundRect(-0.35, -alto / 2 - 0.25, cal.vaina * 0.62, alto + 0.5, 0.35); ctx.fill(); }   // el en bloque envuelve la parte de atrás
  else ctx.fillRect(-0.3, -alto / 2 - 0.2, 0.62, alto + 0.4);
}
// Cargador rápido de revólver: el cuerpo con su perilla y las balas saliendo (de costado se ven tres)
function dibujarCargadorRapido(ctx, armaId) {
  const cal = calibreDe(armaId), sep = cal.d * 1.32;
  for (const k of [-1, 1, 0]) { ctx.save(); ctx.translate(0.5, k * sep); dibujarCartucho(ctx, cal); ctx.restore(); }
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fillRect(-2.9, -sep - 0.7, 3.6, sep * 2 + 1.4); return; }
  const g = ctx.createLinearGradient(0, -sep - 0.7, 0, sep + 0.7);
  g.addColorStop(0, '#4b4d54'); g.addColorStop(0.35, '#2f3136'); g.addColorStop(1, '#17181b');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-1.3, -sep - 0.75, 2.0, sep * 2 + 1.5, 0.45); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-2.9, -0.75, 1.7, 1.5, 0.4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-1.2, -sep - 0.5, 1.8, 0.25);
}
// Tramo de cinta de ametralladora: las balas una al lado de la otra unidas por los eslabones
function dibujarCinta(ctx, armaId, cuantas = 6) {
  const cal = calibreDe(armaId), paso = cal.d * 1.2, x0 = -(cuantas - 1) * paso / 2;
  for (let k = 0; k < cuantas; k++) { ctx.save(); ctx.translate(x0 + k * paso, cal.vaina * 0.5); ctx.rotate(-Math.PI / 2); dibujarCartucho(ctx, cal); ctx.restore(); }
  if (Pincel.silueta) return;
  const A = TONOS_MUNICION.acero;
  for (const y of [cal.vaina * 0.08, -cal.vaina * 0.18]) { ctx.fillStyle = A[2]; ctx.fillRect(x0 - cal.d * 0.6, y - 0.42, (cuantas - 1) * paso + cal.d * 1.2, 0.84); ctx.fillStyle = A[1]; ctx.fillRect(x0 - cal.d * 0.6, y - 0.42, (cuantas - 1) * paso + cal.d * 1.2, 0.3); }
}
