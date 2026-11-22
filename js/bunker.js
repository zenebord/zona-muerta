/* ===== Búnkeres de la pelea infinita (pedido de Enzo, 16/11, y los botiquines que sumó Leandro) =====
 * Arriba de la pantalla, la distancia recorrida desde el punto de partida. El primero está a 300 m (para los dos lados) y
 * después uno cada 300 m, siempre (pedido de Leandro, 22/11: antes la distancia crecía 1 km cada 3 hordas). Hay un
 * búnker subterráneo: en el piso, la boca de concreto blanco con la escalera que baja, y una luz verde que sale del piso
 * y se ve de lejos. Parado encima aparece «↓ ENTRAR AL BÚNKER»; con ↓ se entra (la partida queda quieta mientras tanto).
 * Adentro atiende un comerciante: un señor de unos 75 años con un parche en el ojo, barba blanca más o menos larga y el
 * pelo corto y blanco. El menú dice MEJORAS arriba, las muertes y el dinero arriba a la derecha y nuestras armas abajo;
 * al tocar una, se ve el arma grande y a su derecha MEJORAR con el precio. En la otra pestaña de abajo se compran armas
 * (cada una con su precio) y botiquines, que se llevan encima (hasta 3) y se usan con V o el botón ✚.
 * El dinero sale de matar zombies. Cada mejora sube el daño del arma un 20 % (cinco niveles: hasta el doble); el daño se
 * aplica en Zombie.recibirDano (js/zombie.js) con `juego.mejoras`. No hay búnkeres en las misiones ni en los otros modos.
 */
// Con el búnker abierto, el juego se ve en la mitad de arriba: la cámara baja tantas unidades (el suelo, que está en 440, queda en 225 de 540)
const DESPLAZAMIENTO_BUNKER = 215;
const BUNKER = {
  cada: 300,               // metros entre búnkeres al empezar
  pxPorMetro: 44,          // la medida de las estacas del entrenamiento (js/juego.js)
  boca: 104,               // ancho del hueco de la escalera, en unidades del mundo
  radioEntrar: 50,         // a cuánto del centro de la boca hay que estar parado para poder entrar
  mejoraMax: 5, mejoraDano: 0.2,
  botiquin: { precio: 150, cura: 50, maximo: 3, probCaja: 0.22 },   // probCaja: de cada 100 cajas del camino, ~22 traen un botiquín (pedido de Leandro, 22/11)
  aereo: { precio: 400, maximo: 3, recarga: 60 },   // ataque aéreo: uno gratis cada 60 s (el primero a los 60 s de empezar) y hasta 3 cargas extra compradas, que se usan sin esperar
  paga: { zombie: 10, corredor: 15, raro: 20, porRonda: 2 },   // raro: tóxico o congelado; porRonda: lo que suma cada ronda
};
// Precios: los de la tienda de la defensa ultra (js/defensa-ultra.js) y los de las armas que allá no se venden
const PRECIOS_BUNKER = Object.assign({}, PRECIOS_ULTRA, {
  python: 350, mauser: 250, remington700: 700, mosin: 500, winchester1894: 450, winchester1887: 500,
  machete: 120, katana: 300, hacha: 200, bate: 100, mazo: 250,
  m79: 900, mgl: 1500, bazuca: 1800, rpg7: 1600, granadas: 500, lanzallamas: 2000, minigun: 3000, laser: 3500,
});
const ARMAS_BUNKER = [...ARMAS_COMUNES, ...ARMAS_ESPECIALES];   // las legendarias no se venden: se ganan en las montañas
const precioArmaBunker = id => PRECIOS_BUNKER[id] ?? 500;
// Lo que cuesta pasar del nivel que tiene (0 a 4) al siguiente: la mitad del arma la primera vez, después más
const precioMejora = (id, nivel) => Math.max(60, Math.round(precioArmaBunker(id) * (0.5 + 0.5 * nivel) / 10) * 10);
const precioMunicionBunker = id => Math.max(40, Math.round(precioArmaBunker(id) * 0.2 / 10) * 10);
const multiplicadorMejora = nivel => 1 + BUNKER.mejoraDano * (nivel || 0);

/* ---------- El comerciante: un personaje más (js/skins.js), que no se elige en el menú ---------- */
SKINS.comerciante = { torso: 'tendero', cabeza: 'viejo', barba: '#e7e4dc',
  colores: { piel: '#d4a487', pelo: '#ecebe6', chaqueta: '#a9adab', antebrazo: '#a9adab', chaleco: '#4a3a2b', pantalon: '#3c3a36', rodillera: '#3c3a36',
    bota: '#2e2620', suela: '#18120e', guante: '#cf9f83', cinturon: '#3a2a1c', bolsa: '#4a3a2b', funda: '#3a2a1c', correa: '#3a2a1c', hebilla: '#9a9a96',
    sinBolsillo: true, sinRodillera: true, sinCartucheras: true, sinFunda: true } };
// Camisa gris con el chaleco de cuero abierto (como el del vaquero, sin estrella) y el bolsillo con un lápiz
TORSOS_SKIN.tendero = (ctx, C, y) => {
  const T = torsoPerfil(y), cuero = C.chaleco;
  pintura(ctx, T, C.chaqueta);
  for (let k = 0; k < 4; k++) detalle(ctx, '#e8e4da', circulo(5.6, y(-55 + k * 5), 0.45));   // botones de la camisa
  pintura(ctx, c => { c.moveTo(-6.6, y(-36)); c.quadraticCurveTo(-8.6, y(-46), -8, y(-53)); c.quadraticCurveTo(-7, y(-58.6), -3, y(-59.2)); c.lineTo(-0.2, y(-59)); c.lineTo(0.6, y(-36)); c.closePath(); }, cuero, { sombra: 0.8, brillo: 0.3 });
  pintura(ctx, c => { c.moveTo(3.2, y(-58.6)); c.quadraticCurveTo(7.6, y(-57), 7.8, y(-50)); c.quadraticCurveTo(7.8, y(-42), 6.4, y(-36.6)); c.lineTo(3.8, y(-36.6)); c.quadraticCurveTo(4.8, y(-48), 3.2, y(-58.6)); }, cuero, { sombra: 0.7, brillo: 0.3 });
  if (Pincel.silueta) return;
  ctx.save(); ctx.setLineDash([0.8, 0.7]); raya(ctx, ajustarColor(cuero, 0.3), 0.35, [[-0.6, y(-58)], [0, y(-37)]]); raya(ctx, ajustarColor(cuero, 0.3), 0.35, [[4, y(-57.4)], [4.6, y(-38)]]); ctx.restore();
  pintura(ctx, c => c.roundRect(4.4, y(-47), 3, 3.4, 0.5), ajustarColor(cuero, -0.08), { sombra: 0.3, brillo: 0.2, linea: 0.3 });   // bolsillo
  pintura(ctx, c => c.roundRect(5.2, y(-50.4), 0.8, 4, 0.3), '#c9a043', { sombra: 0.2, brillo: false, linea: 0.2 });              // lápiz
};
// Cabeza de viejo: pelo corto y blanco con entradas, arrugas en la frente, cejas tupidas y el parche negro en el ojo
// (de perfil se ve el ojo de este lado: lo tapa el parche, con la tira que pasa por la sien hasta la nuca)
CABEZAS_SKIN.viejo = (ctx, C, hy) => {
  const P = C.pelo, piel = C.piel;
  pintura(ctx, c => { c.moveTo(-6.8, hy + 11); c.quadraticCurveTo(-9.8, hy + 7, -9.2, hy + 2.4); c.quadraticCurveTo(-8.2, hy - 2.6, -2.2, hy - 2.4);
    c.quadraticCurveTo(2.2, hy - 2.4, 3.8, hy - 0.8); c.quadraticCurveTo(1.2, hy + 0.2, -0.2, hy + 1.8); c.quadraticCurveTo(-1.2, hy + 3.2, -1.6, hy + 5.8); c.lineTo(-4.6, hy + 6);
    c.quadraticCurveTo(-5.6, hy + 8.6, -6.8, hy + 11); }, P, { sombra: 0.5, brillo: 0.12, linea: 0.4, borde: 0.35 });
  if (!Pincel.silueta) {
    for (let k = 0; k < 6; k++) { const x = -7.6 + k * 1.9; raya(ctx, ajustarColor(P, -0.22), 0.3, [[x, hy - 0.2 + Math.abs(k - 3) * 0.3], [x + 1.4, hy - 1.8 + Math.abs(k - 3) * 0.25]]); }   // mechones
    for (let k = 0; k < 3; k++) raya(ctx, ajustarColor(piel, -0.32), 0.28, curvaPts(2.6, hy + 0.9 + k * 1.05, 4.6, hy + 0.4 + k * 1.05, 6.6, hy + 1.2 + k * 1.05, 4));   // arrugas de la frente
    raya(ctx, ajustarColor(piel, -0.3), 0.3, curvaPts(-0.6, hy + 9.4, 0.4, hy + 7.6, 2.2, hy + 7.2, 3));                                               // pata de gallo del lado de la oreja
  }
  // Parche: la tira (por la sien hasta la nuca) y el parche de cuero, con su costura
  linea(ctx, tinta('#151314'), 0.8, curvaPts(6.6, hy + 5.6, 1.2, hy + 3, -9, hy + 4.6));
  linea(ctx, tinta('#151314'), 0.7, curvaPts(6.4, hy + 5.2, 5.4, hy + 1.6, 3.2, hy - 0.6, 3));
  pintura(ctx, c => c.ellipse(5.5, hy + 6.8, 2.3, 2.1, -0.1, 0, Math.PI * 2), '#1e1c1d', { sombra: 0.35, brillo: 0.25, linea: 0.35, oscuro: 0.15 });
  if (!Pincel.silueta) { ctx.save(); ctx.setLineDash([0.5, 0.5]); raya(ctx, 'rgba(120,110,100,0.6)', 0.18, curvaPts(3.6, hy + 6.4, 5.5, hy + 5, 7.4, hy + 6.4, 5)); ctx.restore(); }
  raya(ctx, P, 1.2, [[3, hy + 3.9], [5.6, hy + 3.4], [7.8, hy + 3.8]]);   // ceja tupida y blanca, arriba del parche
};

/* ---------- Dibujo de un arma entera, centrada y lo más grande posible (como la ficha de js/interfaz.js) ---------- */
// PX: píxeles por centímetro al medir (más chico, más rápido); el dibujo final se hace de nuevo al tamaño del lienzo
function dibujarArmaCentrada(lienzo, id, margen = 8, PX = 3) {
  const c = lienzo.getContext('2d'), a = ARMAS[id], d = DIBUJO_ARMAS[id];
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, lienzo.width, lienzo.height);
  if (!a || !d) return;
  const estado = { corredera: 0, sinCargador: false, abierto: 0, bombeo: 0, palanca: 0, mirar: 0, tapa: 0 };
  const W = 250 * PX, H = 160 * PX, k = PX / CM;   // hasta 2,5 m de largo
  const aparte = document.createElement('canvas'); aparte.width = W; aparte.height = H;
  const o = aparte.getContext('2d');
  const silueta = Pincel.silueta; Pincel.silueta = null;
  o.setTransform(k, 0, 0, k, W / 2, H / 2); if (a.cuerpo) o.rotate(Math.PI / 2);   // las de cuerpo a cuerpo, acostadas
  d.dibujar(o, estado); dibujarEquipables(o, id, d);
  const datos = o.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (datos[(y * W + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 > x0) {
    const w = x1 - x0 + 4, h = y1 - y0 + 4, esc = Math.min((lienzo.width - margen * 2) / w, (lienzo.height - margen * 2) / h);
    const ox = (lienzo.width - w * esc) / 2, oy = (lienzo.height - h * esc) / 2;
    c.setTransform(k * esc, 0, 0, k * esc, ox + (W / 2 - (x0 - 2)) * esc, oy + (H / 2 - (y0 - 2)) * esc);
    if (a.cuerpo) c.rotate(Math.PI / 2);
    d.dibujar(c, estado); dibujarEquipables(c, id, d);
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
  Pincel.silueta = silueta;
}
// Las miniaturas de las cartas se dibujan una vez por arma y después se copian
const miniaturasBunker = new Map();
function miniaturaArma(id) {
  const clave = id + JSON.stringify(equipoDe(id));   // con lo que lleva puesto (js/equipables.js)
  if (!miniaturasBunker.has(clave)) { const m = document.createElement('canvas'); m.width = 300; m.height = 128; dibujarArmaCentrada(m, id, 6, 2); miniaturasBunker.set(clave, m); }
  return miniaturasBunker.get(clave);
}
// Botiquín: valija blanca con la cruz verde de primeros auxilios y la manija
function dibujarBotiquin(ctx, x, y, w) {
  const h = w * 0.62, r = w * 0.06;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#5c625e'; ctx.beginPath(); ctx.roundRect(-w * 0.18, -h / 2 - w * 0.13, w * 0.36, w * 0.16, w * 0.05); ctx.fill();   // manija
  ctx.fillStyle = '#20231f'; ctx.beginPath(); ctx.roundRect(-w * 0.12, -h / 2 - w * 0.07, w * 0.24, w * 0.08, w * 0.03); ctx.fill();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#fbfbf8'); g.addColorStop(1, '#cfd3cf');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); ctx.fill();
  ctx.strokeStyle = '#8d938f'; ctx.lineWidth = Math.max(1, w * 0.018); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.18); ctx.lineTo(w / 2, -h * 0.18); ctx.stroke();   // tapa
  const b = w * 0.09, l = w * 0.24;
  ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.rect(-b, -l + h * 0.08, b * 2, l * 2); ctx.rect(-l, -b + h * 0.08, l * 2, b * 2); ctx.fill();   // cruz verde
  ctx.restore();
}

// Caja del camino con un botiquín en vez de un arma (pelea infinita): se levanta al pasar y suma uno a los que se llevan (hasta 3);
// con los tres encima se queda donde está, para cuando haga falta. Se usa con V o el botón ✚, igual que los del comerciante
class CajaBotiquin extends Caja {
  constructor(x) { super(x, ARMA_INICIAL, false); this.botiquin = true; this.avisoEn = 0; }
  alRecoger(juego) {
    const B = juego.bunker;
    if (B.botiquines >= BUNKER.botiquin.maximo) {
      if (juego.ahora >= this.avisoEn) { this.avisoEn = juego.ahora + 1800; juego.aviso(t('aviso.botiquinLleno', { max: BUNKER.botiquin.maximo }), 1400); }
      return false;   // no se levanta
    }
    B.botiquines++;
    juego.aviso(t('aviso.botiquinCaja', { n: B.botiquines, max: BUNKER.botiquin.maximo }), 1800);
    Audio_.municion();
  }
  dibujar(ctx, camaraX) {
    const sx = this.x - camaraX, flote = Math.sin(this.t * 3) * 3;
    sombraElipse(ctx, sx + 8, this.y + 2, 24, 7, 0.3 - flote * 0.02);
    ctx.save(); ctx.translate(sx, this.y - 16 + flote);
    ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 14 + Math.sin(this.t * 5) * 5;
    dibujarBotiquin(ctx, 0, 0, 34);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-64, -44, 128, 16);
    ctx.fillStyle = '#9dffb0'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(t('caja.botiquin'), 0, -32);
    ctx.restore();
  }
}

// Misil (el ataque aéreo que vende el comerciante): cuerpo gris con la punta roja, aletas y la llama
function dibujarMisil(ctx, x, y, w) {
  const h = w * 0.16;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35);
  ctx.fillStyle = '#ff9a2e'; ctx.beginPath(); ctx.moveTo(-w * 0.5, 0); ctx.lineTo(-w * 0.62, -h * 0.5); ctx.lineTo(-w * 0.75, 0); ctx.lineTo(-w * 0.62, h * 0.5); ctx.closePath(); ctx.fill();   // llama
  ctx.fillStyle = '#6f7479'; ctx.beginPath(); ctx.moveTo(-w * 0.32, -h * 0.5); ctx.lineTo(-w * 0.42, -h * 1.5); ctx.lineTo(-w * 0.22, -h * 0.5); ctx.fill(); ctx.beginPath(); ctx.moveTo(-w * 0.32, h * 0.5); ctx.lineTo(-w * 0.42, h * 1.5); ctx.lineTo(-w * 0.22, h * 0.5); ctx.fill();   // aletas
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#d7dbdc'); g.addColorStop(1, '#8a9094');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w * 0.5, -h / 2, w * 0.78, h, h * 0.3); ctx.fill();
  ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(w * 0.28, -h / 2); ctx.quadraticCurveTo(w * 0.52, 0, w * 0.28, h / 2); ctx.closePath(); ctx.fill();   // punta
  ctx.fillStyle = '#2f3437'; ctx.fillRect(-w * 0.1, -h / 2, w * 0.05, h); ctx.fillRect(w * 0.06, -h / 2, w * 0.05, h);
  ctx.restore();
}

/* ---------- La escena de adentro: búnker blanco con bóveda, el comerciante detrás del mostrador ---------- */
let comercianteBunker = null;
function dibujarEscenaBunker(lienzo, armaId, ahora) {
  const c = lienzo.getContext('2d'), W = lienzo.width, H = lienzo.height, piso = H * 0.78;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#151a17'; c.fillRect(0, 0, W, H);
  // Bóveda de concreto blanco, con los nervios de la estructura
  const boveda = cc => { cc.moveTo(0, H); cc.lineTo(0, H * 0.3); cc.quadraticCurveTo(W / 2, -H * 0.16, W, H * 0.3); cc.lineTo(W, H); cc.closePath(); };
  const g = c.createLinearGradient(0, 0, 0, piso); g.addColorStop(0, '#d9dcd6'); g.addColorStop(0.55, '#eef0eb'); g.addColorStop(1, '#e2e5e0');
  c.fillStyle = g; c.beginPath(); boveda(c); c.fill();
  c.save(); c.beginPath(); boveda(c); c.clip();
  c.strokeStyle = 'rgba(120,128,122,0.35)'; c.lineWidth = 1;
  for (let k = 1; k < 6; k++) { const yy = piso - k * H * 0.12; c.beginPath(); c.moveTo(0, yy); c.lineTo(W, yy); c.stroke(); }   // juntas de los bloques
  for (let k = 0; k < 6; k++) for (let x = (k % 2) * 30; x < W; x += 60) { const yy = piso - (k + 1) * H * 0.12; c.beginPath(); c.moveTo(x, yy); c.lineTo(x, yy + H * 0.12); c.stroke(); }
  c.strokeStyle = 'rgba(150,156,150,0.55)'; c.lineWidth = 5;
  for (const f of [0.22, 0.5, 0.78]) { c.beginPath(); c.moveTo(W * f - 4, piso); c.lineTo(W * f - 4, H * 0.3 - 0.36 * H * Math.sin(Math.PI * f) + 0.04 * H); c.stroke(); }   // nervios
  c.restore();
  // Piso de cemento
  const gp = c.createLinearGradient(0, piso, 0, H); gp.addColorStop(0, '#c4c8c2'); gp.addColorStop(1, '#9ea39d');
  c.fillStyle = gp; c.fillRect(0, piso, W, H - piso);
  c.strokeStyle = 'rgba(80,86,80,0.25)'; c.lineWidth = 1;
  for (let k = -4; k < 12; k++) { c.beginPath(); c.moveTo(W * 0.5 + k * 60 - 240, piso); c.lineTo(W * 0.5 + (k * 60 - 240) * 1.6, H); c.stroke(); }
  // La puerta de la escalera, a la izquierda, con la luz verde que baja de afuera
  const px = W * 0.035, pw = W * 0.15, py = H * 0.36;
  c.fillStyle = '#0d1a12'; c.fillRect(px, py, pw, piso - py);
  c.fillStyle = '#c7cbc5'; for (let k = 0; k < 5; k++) c.fillRect(px + pw * 0.08 + k * pw * 0.17, piso - (k + 1) * (piso - py) * 0.15, pw * 0.24, 3);   // escalones
  c.strokeStyle = '#b5bab4'; c.lineWidth = 6; c.strokeRect(px - 3, py - 3, pw + 6, piso - py + 3);
  c.save(); c.globalCompositeOperation = 'lighter';
  const pulso = 0.85 + Math.sin(ahora / 400) * 0.15;
  let lv = c.createRadialGradient(px + pw / 2, py + 10, 2, px + pw / 2, py + 10, W * 0.32);
  lv.addColorStop(0, `rgba(90,255,130,${0.42 * pulso})`); lv.addColorStop(1, 'rgba(90,255,130,0)');
  c.fillStyle = lv; c.fillRect(0, 0, W * 0.6, H);
  c.restore();
  c.fillStyle = '#2b3a30'; c.fillRect(px + pw / 2 - 9, py - 16, 18, 9);                            // lámpara verde arriba de la puerta
  c.fillStyle = '#7dffa0'; c.beginPath(); c.ellipse(px + pw / 2, py - 7, 7, 3.5, 0, 0, Math.PI); c.fill();
  // Armero en la pared del fondo, a la derecha, con armas colgadas
  const ax = W * 0.63, aw = W * 0.33, ay = H * 0.26, ah = H * 0.36;
  c.fillStyle = '#7d8a7f'; c.fillRect(ax, ay, aw, ah);
  c.fillStyle = 'rgba(30,36,32,0.55)'; for (let yy = ay + 8; yy < ay + ah; yy += 11) for (let x = ax + 8; x < ax + aw; x += 11) c.fillRect(x, yy, 2, 2);   // agujeros de la placa
  c.strokeStyle = '#59645b'; c.lineWidth = 3; c.strokeRect(ax, ay, aw, ah);
  const silueta = Pincel.silueta; Pincel.silueta = null;
  const estado = { corredera: 0, sinCargador: false, abierto: 0, bombeo: 0, palanca: 0, mirar: 0, tapa: 0 };
  ['rem870', 'ak47', 'mp5'].forEach((id, n) => {
    if (!DIBUJO_ARMAS[id]) return;
    const kk = (aw * 0.0058) / CM;   // un 0,58 % del ancho del armero por centímetro: entran enteras
    c.save(); c.setTransform(kk, 0, 0, kk, ax + aw * 0.3, ay + ah * (0.22 + n * 0.3)); DIBUJO_ARMAS[id].dibujar(c, estado); c.restore();
  });
  Pincel.silueta = silueta;
  // Estante bajo la lámpara con cajas de munición y botiquines
  const ex = W * 0.2, ew = W * 0.2, ey = H * 0.47;
  c.fillStyle = '#8d9590'; c.fillRect(ex, ey, ew, 5);
  c.fillStyle = '#4e5a38'; c.fillRect(ex + 6, ey - 16, 22, 16); c.fillRect(ex + 30, ey - 12, 18, 12);
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(ex + 6, ey - 16, 22, 3);
  dibujarBotiquin(c, ex + ew - 18, ey - 10, 26);
  // Lámpara colgada del techo: el cable, la pantalla y la luz cálida
  const lx = W * 0.44, ly = H * 0.2;
  c.strokeStyle = '#3a3e3b'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(lx, 0); c.lineTo(lx, ly); c.stroke();
  c.fillStyle = '#4c5650'; c.beginPath(); c.moveTo(lx - 18, ly + 12); c.lineTo(lx - 6, ly); c.lineTo(lx + 6, ly); c.lineTo(lx + 18, ly + 12); c.closePath(); c.fill();
  c.save(); c.globalCompositeOperation = 'lighter';
  lv = c.createRadialGradient(lx, ly + 14, 2, lx, ly + 40, W * 0.42); lv.addColorStop(0, 'rgba(255,236,190,0.5)'); lv.addColorStop(1, 'rgba(255,236,190,0)');
  c.fillStyle = lv; c.fillRect(0, 0, W, H); c.restore();
  c.fillStyle = '#fff6d8'; c.beginPath(); c.ellipse(lx, ly + 12, 10, 3, 0, 0, Math.PI * 2); c.fill();
  // El comerciante, detrás del mostrador, con el arma elegida en la mano (o su escopeta)
  if (!comercianteBunker) { comercianteBunker = new Jugador(0); comercianteBunker.skin = 'comerciante'; }
  const m = comercianteBunker, id = armaId && ARMAS[armaId] && DIBUJO_ARMAS[armaId] ? armaId : 'rem870';
  if (m.inventario[0] !== id) { m.inventario = [id]; m.indiceArma = 0; m.municion = { [id]: ARMAS[id].cargador }; }
  m.ahora = ahora; m.direccion = 1;
  const kc = H / 132, mx = W * 0.37, my = H * 1.02;   // de la cadera para arriba, sobre el mostrador
  c.save(); c.setTransform(kc, 0, 0, kc, mx, my);
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 1, 18, 3, 0, 0, Math.PI * 2); c.fill();
  try { m.cuerpo(c, false); } catch (e) { /* si un arma no tiene pose de reposo, el comerciante queda igual sin ella */ }
  c.restore();
  // Mostrador: tapa de madera y frente de chapa con remaches
  const mxi = W * 0.13, mxf = W * 0.66, mt = H * 0.72;
  c.fillStyle = '#7f8682'; c.fillRect(mxi, mt + 7, mxf - mxi, H - mt);
  c.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = mxi + 40; x < mxf; x += 40) c.fillRect(x, mt + 7, 2, H - mt);
  c.fillStyle = '#c3c8c4'; for (let x = mxi + 8; x < mxf; x += 20) { c.beginPath(); c.arc(x, mt + 16, 1.6, 0, Math.PI * 2); c.fill(); }
  const gm = c.createLinearGradient(0, mt, 0, mt + 9); gm.addColorStop(0, '#9a6a42'); gm.addColorStop(1, '#5e3f25');
  c.fillStyle = gm; c.fillRect(mxi - 6, mt, mxf - mxi + 12, 9);
  dibujarBotiquin(c, mxf - 30, mt - 9, 30);
  c.fillStyle = '#4e5a38'; c.fillRect(mxi + 10, mt - 12, 26, 12); c.fillStyle = '#c9a96e'; c.fillRect(mxi + 14, mt - 9, 18, 3);   // caja de balas
  // Viñeta
  const v = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
  c.fillStyle = v; c.fillRect(0, 0, W, H);
}

/* ---------- La partida: posición de los búnkeres, entrar y salir, dinero, botiquines, mejoras ---------- */
Object.assign(Juego.prototype, {
  prepararBunkers() {
    Mundo.sinMontana = new Set();
    // Ataque aéreo (pedido de Enzo): como en las defensas, la A o el botón; uno cada 60 s sin costo y las cargas extra del comerciante
    this.aereo = { listoEn: BUNKER.aereo.recarga, activo: null, recarga: BUNKER.aereo.recarga, extra: 0 };   // no se ofrece de entrada: el primero llega a los 60 s
    this.jugador.aTierra = true;   // en el ataque aéreo se tira cuerpo a tierra (en la calle no hay parapeto donde agacharse)
    this.misiles = []; this.aviones = []; this.hud.aereo = document.getElementById('hud-aereo');
    this.hud.aereo.classList.remove('oculta');
    this.bunker = { origen: this.jugador.x, dinero: 0, botiquines: 0, abierto: false, sobre: null,
      pestana: 'propias', elegido: null, dice: '', hud: '', proximoDibujo: 0, avisoEn: 2.8,   // avisoEn: después del «¡SOBREVIVE!» del arranque
      lados: { 1: [], '-1': [] } };   // lados: los búnkeres generados a cada lado, en orden
    this.mejoras = {};   // id del arma → nivel (lo lee Zombie.recibirDano)
  },
  // Distancia entre un búnker y el siguiente, en metros: siempre 300 (el primero está a 300 m del punto de partida)
  separacionM() { return BUNKER.cada; },
  // Cada búnker queda exactamente a 300 m del anterior: si su trozo iba a ser una montaña, ese trozo deja de serlo (Mundo.sinMontana;
  // está a más de 10 000 unidades del jugador, nunca a la vista), así nunca queda arriba de una montaña ni corrido de lugar
  generarBunker(lado) {
    const B = this.bunker, lista = B.lados[lado], ultimo = lista.length ? lista[lista.length - 1] : B.origen;
    let x = ultimo + lado * this.separacionM() * BUNKER.pxPorMetro;
    if (Mundo.sinMontana) Mundo.sinMontana.add(indiceTrozo(x));
    lista.push(x);
  },
  // A cada lado hay siempre generado uno más allá de lo que el jugador ve: cuando se acerca a el último (a 3 pantallas) o
  // lo pasa, se genera el siguiente, con la distancia de ese momento
  asegurarBunkers() {
    const B = this.bunker, jx = this.jugador.x;
    for (const lado of [1, -1]) {
      const lista = B.lados[lado];
      if (!lista.length) this.generarBunker(lado);
      while ((jx - lista[lista.length - 1]) * lado > -ANCHO * 3) this.generarBunker(lado);
    }
  },
  todosBunkers() { const B = this.bunker; return B.lados[1].concat(B.lados[-1]); },
  bunkersEntre(x0, x1) { this.asegurarBunkers(); return this.todosBunkers().filter(x => x >= x0 && x <= x1); },
  metrosRecorridos() { return Math.round(Math.abs(this.jugador.x - this.bunker.origen) / BUNKER.pxPorMetro); },
  // El próximo hacia donde va el jugador (o el que tiene debajo)
  proximoBunker() {
    this.asegurarBunkers();
    const j = this.jugador, dir = this.avance || j.direccion || 1;
    let mejor = null;
    for (const x of this.todosBunkers()) {
      const dx = x - j.x;
      if (Math.abs(dx) <= BUNKER.radioEntrar) return { metros: 0, dir: 0 };
      if (Math.sign(dx) === dir && (mejor === null || Math.abs(dx) < Math.abs(mejor))) mejor = dx;
    }
    return mejor === null ? { metros: this.separacionM(), dir } : { metros: Math.round(Math.abs(mejor) / BUNKER.pxPorMetro), dir };
  },
  // ¿Está parado sobre la boca de un búnker? Devuelve su x o null
  bunkerDebajo() {
    const j = this.jugador;
    if (j.muerto || j.montada || !j.enSuelo) return null;
    for (const x of this.bunkersEntre(j.x - BUNKER.radioEntrar, j.x + BUNKER.radioEntrar)) if (Math.abs(x - j.x) <= BUNKER.radioEntrar) return x;
    return null;
  },
  actualizarBunkers() {
    const B = this.bunker;
    B.sobre = this.bunkerDebajo();
    if (B.avisoEn !== null && this.tiempoJugado >= B.avisoEn) { B.avisoEn = null; this.aviso(t('bunker.aviso'), 3800); }
  },

  entrarBunker() {
    const B = this.bunker;
    if (!B || B.abierto || this.terminado || B.sobre === null) return false;
    B.abierto = true;
    Object.assign(this.entrada, { derecha: false, izquierda: false, abajo: false, disparar: false, dispararPulsado: false, saltarPulsado: false, abajoPulsado: false });
    this.jugador.mira = false;
    this.jugador.invulnerableHasta = Infinity;   // abajo nadie lo toca; al salir (salirBunker) se le da un respiro
    document.body.classList.add('en-bunker');
    B.arriba = -1;
    // La M2 Browning sale de la boca y se maneja desde abajo (pedido de Leandro): el mismo arma y dibujo que la de las montañas,
    // montada por el jugador (que no se ve), con munición sin fin; se dispara a los dos lados (F y W, o los botones del menú)
    B.bocaX = B.sobre; const m2 = new AmetralladoraFija(B.bocaX); B.m2 = m2; B.m2Desde = performance.now();
    this.ametralladoras.set('bunker', m2);
    this.jugador.x = B.bocaX; this.jugador.montar(m2);
    B.dice = t('bunker.saludo' + (1 + Math.floor(Math.random() * 3)));
    if (!B.elegido || (B.pestana === 'propias' && !this.jugador.inventario.includes(B.elegido))) { B.pestana = 'propias'; B.elegido = this.jugador.montada ? null : this.jugador.arma().id; }
    document.getElementById('bunker').classList.remove('oculta');
    Musica.intensidad(0.08);
    Audio_.recoger();
    this.pintarBunker();
    this.actualizarCuentaBunker(true);
    document.querySelector('#bunker .bunker-carta.elegida, #bunker button:not([disabled])')?.focus();
    return true;
  },
  salirBunker() {
    const B = this.bunker;
    if (!B || !B.abierto) return;
    B.abierto = false; B.equipables = false;
    document.getElementById('bunker').classList.add('oculta');
    document.body.classList.remove('en-bunker');
    this.soltarM2Bunker();
    if (B.m2) { this.jugador.desmontar(); this.ametralladoras.delete('bunker'); this.jugador.x = B.bocaX; B.m2 = null; }
    Object.assign(this.entrada, { derecha: false, izquierda: false, abajo: false, disparar: false, dispararPulsado: false, saltarPulsado: false, abajoPulsado: false });
    this.jugador.invulnerableHasta = this.ahora + 1500;   // un respiro al subir: los zombies quedaron donde estaban
    Audio_.recoger();
  },

  // Dinero por zombie: más por los corredores y los raros (tóxicos y congelados), y un poco más en cada ronda
  cobrarZombieInfinita(z) {
    if (this.bunker.abierto) return;   // los que cae la M2 del búnker no pagan (pedido de Leandro): sólo se cobra lo que se mata arriba
    const P = BUNKER.paga, base = z.toxico || z.congelado ? P.raro : z.corredor ? P.corredor : P.zombie;
    this.bunker.dinero += base + Math.max(0, this.ronda - 1) * P.porRonda;
  },
  usarBotiquin() {
    const B = this.bunker, j = this.jugador;
    if (!B || j.muerto || B.abierto) return;
    if (B.botiquines <= 0) { this.aviso(t('aviso.sinBotiquin'), 1200); return; }
    if (j.vida >= j.vidaMax) { this.aviso(t('aviso.vidaLlena'), 1200); return; }
    const antes = j.vida;
    j.vida = Math.min(j.vidaMax, j.vida + BUNKER.botiquin.cura);
    j.veneno = 0;   // el botiquín también corta el veneno de los tóxicos
    B.botiquines--;
    this.aviso(t('aviso.botiquin', { n: Math.round(j.vida - antes) }), 1400);
    Audio_.municion();
  },
  // El arma con el daño de su nivel de mejora (para la cuenta de tiros del HUD y del menú)
  armaMejorada(arma) {
    const n = this.mejoras && this.mejoras[arma.id];
    return n ? Object.assign({}, arma, { dano: arma.dano * multiplicadorMejora(n) }) : arma;
  },

  /* ---------- HUD: distancia arriba, dinero y botiquines a la derecha ---------- */
  hudBunker() {
    const B = this.bunker, p = this.proximoBunker();
    const texto = `<b>${this.metrosRecorridos()} m</b><small>${p.dir === 0 ? t('bunker.hudAqui', { tecla: this.teclaEntrar() }) : t('bunker.hudProximo', { flecha: p.dir > 0 ? '▶' : '◀', m: p.metros })}</small>`;
    if (texto !== B.hud) { B.hud = texto; document.getElementById('hud-distancia').innerHTML = texto; }
    const plata = `$ ${B.dinero}` + (B.botiquines ? ` · ✚ ${B.botiquines}` : '');
    if (plata !== B.hudPlata) { B.hudPlata = plata; document.getElementById('hud-dinero').textContent = plata; }
    const con = B.botiquines > 0;
    if (con !== B.conBotiquin) { B.conBotiquin = con; document.body.classList.toggle('con-botiquin', con); }
  },
  teclaEntrar() { return document.body.classList.contains('tactil') ? '▼' : Teclas.nombre('abajo'); },

  /* ---------- Dibujo en el mundo: la boca, la escalera que baja y la luz verde ---------- */
  dibujarBunkers(ctx, cam) {
    for (const x of this.bunkersEntre(cam - 200, cam + ANCHO + 200)) this.dibujarBocaBunker(ctx, x - cam, alturaSuelo(x));
  },
  dibujarBocaBunker(ctx, sx, y) {
    const w = BUNKER.boca, t0 = this.tiempoJugado, pulso = 0.8 + Math.sin(t0 * 3) * 0.2;
    ctx.save();
    // Luz verde que sale del piso y sube hasta el cielo: primero un velo verde (con «lighter» solo, sobre el cielo
    // naranja del atardecer se veía amarilla) y encima el núcleo brillante
    let g = ctx.createLinearGradient(0, y, 0, 0);
    g.addColorStop(0, `rgba(40,220,95,${0.42 * pulso})`); g.addColorStop(0.6, `rgba(40,220,95,${0.16 * pulso})`); g.addColorStop(1, 'rgba(40,220,95,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx - 34, y); ctx.lineTo(sx + 34, y); ctx.lineTo(sx + 78, 0); ctx.lineTo(sx - 78, 0); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    g = ctx.createLinearGradient(0, y, 0, y - ALTO * 0.85);
    g.addColorStop(0, `rgba(60,255,110,${0.55 * pulso})`); g.addColorStop(1, 'rgba(60,255,110,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx - 12, y); ctx.lineTo(sx + 12, y); ctx.lineTo(sx + 26, y - ALTO * 0.85); ctx.lineTo(sx - 26, y - ALTO * 0.85); ctx.closePath(); ctx.fill();
    g = ctx.createRadialGradient(sx, y, 4, sx, y, 140);
    g.addColorStop(0, `rgba(50,255,110,${0.5 * pulso})`); g.addColorStop(1, 'rgba(50,255,110,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sx, y, 140, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // El pozo de la escalera, bajo el piso: paredes blancas, escalones que bajan y la luz verde de abajo
    const x0 = sx - w / 2, prof = 92;
    ctx.fillStyle = tinta('#0c1610'); ctx.fillRect(x0, y, w, prof);
    g = ctx.createRadialGradient(sx + w * 0.3, y + prof, 4, sx + w * 0.3, y + prof, w);
    g.addColorStop(0, 'rgba(70,255,120,0.6)'); g.addColorStop(1, 'rgba(70,255,120,0)');
    ctx.fillStyle = g; ctx.fillRect(x0, y, w, prof);
    ctx.fillStyle = tinta('#dfe3de'); ctx.fillRect(x0, y, 7, prof); ctx.fillRect(x0 + w - 7, y, 7, prof);   // paredes
    for (let k = 0; k < 7; k++) {   // escalones: de arriba a la izquierda hacia abajo a la derecha
      const ex = x0 + 7 + k * 13, ey = y + 8 + k * 12;
      ctx.fillStyle = tinta('#eef1ec'); ctx.fillRect(ex, ey, 16, 3);
      ctx.fillStyle = tinta('#aeb4ad'); ctx.fillRect(ex, ey + 3, 16, 9);
    }
    // Losa blanca alrededor, a ras del piso, y la reja blanca encima del hueco: se puede pisar y se ve la escalera
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x0 - 16, y + 3, w + 32, 4);
    g = ctx.createLinearGradient(0, y - 4, 0, y + 4); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c4c9c3');
    ctx.fillStyle = Pincel.silueta || g; ctx.fillRect(x0 - 16, y - 4, 16, 8); ctx.fillRect(x0 + w, y - 4, 16, 8);
    ctx.fillStyle = tinta('#f4f6f2'); ctx.fillRect(x0, y - 3, w, 3);                                  // marco de la reja
    for (let x = x0 + 4; x < x0 + w - 2; x += 8) ctx.fillRect(x, y - 3, 3, 7);                         // barrotes
    ctx.fillStyle = tinta('#9aa29a'); ctx.fillRect(x0, y + 3, w, 1.5);
    // Lámparas verdes en las dos esquinas de la losa
    for (const lx of [x0 - 9, x0 + w + 9]) {
      ctx.fillStyle = tinta('#3a4a40'); ctx.fillRect(lx - 4, y - 9, 8, 5);
      ctx.fillStyle = tinta(`rgba(140,255,170,${0.75 + 0.25 * pulso})`); ctx.beginPath(); ctx.arc(lx, y - 9, 4, Math.PI, 0); ctx.fill();
    }
    ctx.restore();
  },
  // «↓ ENTRAR AL BÚNKER» arriba de la cabeza, mientras está parado sobre la boca
  dibujarAvisoBunker(ctx, cam) {
    const B = this.bunker, j = this.jugador;
    if (B.sobre === null || B.abierto || j.muerto) return;
    const texto = t(document.body.classList.contains('tactil') ? 'bunker.entrarTactil' : 'bunker.entrar', { tecla: this.teclaEntrar() });
    const x = j.x - cam, y = j.y - 112 + Math.sin(this.tiempoJugado * 4) * 2;
    ctx.save();
    ctx.font = '700 14px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(texto).width + 22;
    ctx.fillStyle = 'rgba(8,16,11,0.82)'; ctx.strokeStyle = '#7dffa0'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 13, w, 26, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d8ffe2'; ctx.fillText(texto, x, y + 1);
    ctx.restore();
  },

  /* ---------- El menú del comerciante ---------- */
  cartasBunker() {
    const j = this.jugador;
    if (this.bunker.pestana === 'protecciones') return ORDEN_PROTECCIONES.map(id => 'prot:' + id);   // js/protecciones.js
    if (this.bunker.pestana === 'propias') return j.inventario.filter(id => ARMAS[id] && DIBUJO_ARMAS[id]);
    return ['botiquin', 'aereo', ...ARMAS_BUNKER.filter(id => !j.inventario.includes(id) && DIBUJO_ARMAS[id])];
  },
  pintarBunker() {
    const B = this.bunker, j = this.jugador, cartas = this.cartasBunker();
    if (!cartas.includes(B.elegido)) B.elegido = cartas[0] || null;
    document.getElementById('bunker-bajas').textContent = `☠ ${this.bajas}`;
    document.getElementById('bunker-dinero').textContent = `$ ${B.dinero}`;
    B.dineroPintado = B.dinero;
    document.querySelectorAll('#bunker [data-bunker^="pestana:"]').forEach(b => { const si = b.dataset.bunker === 'pestana:' + B.pestana; b.classList.toggle('elegida', si); b.setAttribute('aria-selected', si); });
    // Cartas de abajo: miniatura, nombre y nivel (las propias) o precio (las de la venta)
    const lista = document.getElementById('bunker-lista'), desplazado = lista.scrollLeft;
    lista.innerHTML = cartas.map(id => {
      if (id.startsWith('prot:')) return this.cartaProteccion(id, id === B.elegido);   // js/protecciones.js
      if (id === 'aereo') {
        const caro = BUNKER.aereo.precio > B.dinero;
        return `<button type="button" class="bunker-carta${id === B.elegido ? ' elegida' : ''}${caro ? ' caro' : ''}" data-bunker="elegir:aereo"><canvas width="150" height="64" aria-hidden="true"></canvas>` +
          `<span class="nombre">${t('bunker.aereo')}</span><small class="precio">$${BUNKER.aereo.precio} · ✈ +${this.aereo.extra}/${BUNKER.aereo.maximo}</small></button>`;
      }
      if (id === 'botiquin') {
        const caro = BUNKER.botiquin.precio > B.dinero;
        return `<button type="button" class="bunker-carta${id === B.elegido ? ' elegida' : ''}${caro ? ' caro' : ''}" data-bunker="elegir:botiquin"><canvas width="150" height="64" aria-hidden="true"></canvas>` +
          `<span class="nombre">${t('bunker.botiquin')}</span><small class="precio">$${BUNKER.botiquin.precio} · ✚ ${B.botiquines}/${BUNKER.botiquin.maximo}</small></button>`;
      }
      const a = ARMAS[id], n = this.mejoras[id] || 0, venta = B.pestana === 'venta', precio = precioArmaBunker(id);
      const pie = venta ? `<small class="precio">$${precio}</small>` : `<small>${'★'.repeat(n)}${'☆'.repeat(BUNKER.mejoraMax - n)}</small>`;
      return `<button type="button" class="bunker-carta${id === B.elegido ? ' elegida' : ''}${venta && precio > B.dinero ? ' caro' : ''}" data-bunker="elegir:${id}"><canvas width="150" height="64" aria-hidden="true"></canvas>` +
        `<span class="nombre">${a.nombre}</span>${pie}</button>`;
    }).join('') || `<p class="bunker-vacia">${t('bunker.nadaMas')}</p>`;
    lista.scrollLeft = desplazado;
    lista.querySelectorAll('.bunker-carta').forEach((b, i) => {
      const cv = b.querySelector('canvas'), id = cartas[i], c = cv.getContext('2d');
      if (id === 'botiquin') dibujarBotiquin(c, cv.width / 2, cv.height / 2 + 4, 62);
      else if (id === 'aereo') dibujarMisil(c, cv.width / 2 + 8, cv.height / 2, 110);
      else if (id.startsWith('prot:')) dibujarMuestraProteccion(c, cv.width, cv.height, id.slice(5));
      else c.drawImage(miniaturaArma(id), 0, 0, cv.width, cv.height);
    });
    this.pintarDetalleBunker();
  },
  pintarDetalleBunker() {
    const B = this.bunker, j = this.jugador, id = B.elegido, acc = document.getElementById('bunker-accion'), lienzo = document.getElementById('bunker-arma');
    const boton = (accion, texto, precio, extra = '') => {
      const falta = precio - B.dinero;
      return `<button type="button" class="boton-bunker${extra}" data-bunker="${accion}"${falta > 0 ? ' disabled' : ''}><span>${texto}</span><b>${falta > 0 ? t('bunker.faltan', { n: falta }) : '$' + precio}</b></button>`;
    };
    const vida = this.dificultad.vidaZombie, tiros = arma => disparosParaMatar(arma, vida);
    let html = '';
    if (!id) { lienzo.getContext('2d').clearRect(0, 0, lienzo.width, lienzo.height); acc.innerHTML = `<p>${t('bunker.nadaMas')}</p>`; return; }
    if (id.startsWith('prot:')) { this.detalleProteccion(id.slice(5), lienzo, acc, boton); document.getElementById('bunker-dice').textContent = B.dice ? '— ' + B.dice : ''; return; }   // js/protecciones.js
    if (id === 'aereo') {
      const c = lienzo.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, lienzo.width, lienzo.height);
      dibujarMisil(c, lienzo.width / 2 + 20, lienzo.height / 2, lienzo.height * 2.1);
      const A = this.aereo, key = document.body.classList.contains('tactil') ? t('aereo.tocar') : Teclas.nombre('ataqueAereo');
      html = `<h3>${t('bunker.aereo')}</h3><p>${t('bunker.aereoTexto', { s: BUNKER.aereo.recarga, tecla: key })}</p>` +
        `<p class="estrellas">${'✈ '.repeat(A.extra)}${'· '.repeat(BUNKER.aereo.maximo - A.extra)}${t('bunker.llevas', { n: A.extra, max: BUNKER.aereo.maximo })}</p>` +
        (A.extra >= BUNKER.aereo.maximo ? `<p class="aviso-bunker">${t('bunker.aereoLleno', { max: BUNKER.aereo.maximo })}</p>` : boton('aereo', t('bunker.comprar1'), BUNKER.aereo.precio));
    } else if (id === 'botiquin') {
      const c = lienzo.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, lienzo.width, lienzo.height);
      dibujarBotiquin(c, lienzo.width / 2, lienzo.height / 2 + 10, lienzo.height * 0.95);
      html = `<h3>${t('bunker.botiquin')}</h3><p>${t('bunker.botiquinTexto', { cura: BUNKER.botiquin.cura, tecla: document.body.classList.contains('tactil') ? '✚' : Teclas.nombre('botiquin') })}</p>` +
        `<p class="estrellas">${'✚ '.repeat(B.botiquines)}${'· '.repeat(BUNKER.botiquin.maximo - B.botiquines)}${t('bunker.llevas', { n: B.botiquines, max: BUNKER.botiquin.maximo })}</p>` +
        (B.botiquines >= BUNKER.botiquin.maximo ? `<p class="aviso-bunker">${t('bunker.botiquinLleno', { max: BUNKER.botiquin.maximo })}</p>` : boton('botiquin', t('bunker.comprar1'), BUNKER.botiquin.precio));
    } else {
      dibujarArmaCentrada(lienzo, id, 14, 4);
      const a = ARMAS[id], golpes = a.cuerpo ? 'bunker.golpes' : 'bunker.tiros';
      if (B.pestana === 'propias' && B.equipables) { acc.innerHTML = this.htmlEquipables(id); document.getElementById('bunker-dice').textContent = B.dice ? '— ' + B.dice : ''; return; }   // bípode, mira y silenciador (js/equipables.js)
      if (B.pestana === 'propias') {
        const n = this.mejoras[id] || 0, antes = this.armaMejorada(a), despues = Object.assign({}, a, { dano: a.dano * multiplicadorMejora(n + 1) });
        html = `<h3>${a.nombre}</h3><p class="estrellas">${'★'.repeat(n)}${'☆'.repeat(BUNKER.mejoraMax - n)} ${t('bunker.nivel', { n, max: BUNKER.mejoraMax })}</p>`;
        if (n >= BUNKER.mejoraMax) html += `<p>${t('bunker.danoMax', { a: Math.round(antes.dano * 10) / 10 })}</p><p class="aviso-bunker">${t('bunker.alMaximo')}</p>`;
        else html += `<p>${t('bunker.dano', { a: Math.round(antes.dano * 10) / 10, b: Math.round(despues.dano * 10) / 10 })}</p>` +
          (a.fuego || a.explosivo ? '' : `<p>${t(golpes, { a: tiros(antes), b: tiros(despues) })}</p>`) +
          boton('mejorar:' + id, t('bunker.mejorar'), precioMejora(id, n));
        if (a.reservaInicial !== undefined) html += boton('municion:' + id, t('bunker.municion', { n: a.reservaInicial, tienes: (j.municion[id] || 0) + (j.reserva[id] || 0) }), precioMunicionBunker(id), ' secundario');
        html += this.botonEquipables();   // abajo de todo
      } else {
        html = `<h3>${a.nombre}</h3><p>${t('bunker.danoVenta', { d: a.dano })}${a.fuego || a.explosivo ? '' : ' · ' + t(golpes + 'Venta', { n: tiros(a) })}</p>` +
          (FICHAS[id] ? `<p class="bunker-desc">${enIdioma(FICHAS[id][3])}</p>` : '') +
          boton('comprar:' + id, t('bunker.comprar1'), precioArmaBunker(id));
      }
    }
    acc.innerHTML = html;
    document.getElementById('bunker-dice').textContent = B.dice ? '— ' + B.dice : '';
  },
  accionBunker(accion) {
    const B = this.bunker, j = this.jugador;
    if (!B || !B.abierto) return;
    const [que, ...resto] = accion.split(':'), id = resto.join(':');   // (las protecciones llevan más de un «:», 'prot:casco:comprar')
    const cobrar = precio => { if (B.dinero < precio) { B.dice = t('bunker.sinDinero'); this.pintarDetalleBunker(); return false; } B.dinero -= precio; return true; };
    if (que === 'salir') return this.salirBunker();
    if (que === 'pestana') { B.pestana = id; B.elegido = null; B.equipables = false; }
    else if (que === 'elegir') { B.elegido = id; B.equipables = false; }
    else if (que === 'equipables') { B.equipables = true; }
    else if (que === 'equipables-volver') { B.equipables = false; }
    else if (que === 'equipo') { if (!this.comprarEquipo(id, B.elegido, cobrar)) return; }
    else if (que === 'prot') { if (!this.accionProteccion(id, cobrar)) return; }   // comprar, reparar o mejorar una protección (js/protecciones.js)
    else if (que === 'mejorar') {
      const n = this.mejoras[id] || 0;
      if (n >= BUNKER.mejoraMax || !j.inventario.includes(id) || !cobrar(precioMejora(id, n))) return;
      this.mejoras[id] = n + 1;
      B.dice = t(n + 1 >= BUNKER.mejoraMax ? 'bunker.dijoMaximo' : 'bunker.dijoMejora');
      Audio_.sacarArma(ARMAS[id]);
    } else if (que === 'comprar') {
      if (j.inventario.includes(id) || !cobrar(precioArmaBunker(id))) return;
      j.recoger(id);
      B.dice = t('bunker.dijoCompra' + (1 + Math.floor(Math.random() * 2)));
      B.pestana = 'propias'; B.elegido = id;   // pasa a sus armas, con la nueva elegida: lista para mejorar
      Audio_.recoger();
    } else if (que === 'municion') {
      if (!j.inventario.includes(id) || !cobrar(precioMunicionBunker(id))) return;
      j.reserva[id] = (j.reserva[id] || 0) + ARMAS[id].reservaInicial;
      B.dice = t('bunker.dijoMunicion');
      Audio_.municion();
    } else if (que === 'aereo') {
      if (this.aereo.extra >= BUNKER.aereo.maximo || !cobrar(BUNKER.aereo.precio)) return;
      this.aereo.extra++;
      B.dice = t('bunker.dijoAereo');
      Audio_.municion();
    } else if (que === 'botiquin') {
      if (B.botiquines >= BUNKER.botiquin.maximo || !cobrar(BUNKER.botiquin.precio)) return;
      B.botiquines++;
      B.dice = t('bunker.dijoBotiquin');
      Audio_.municion();
    }
    this.pintarBunker();
    if (que === 'elegir' || que === 'pestana') document.querySelector('#bunker .bunker-carta.elegida')?.focus({ preventScroll: true });
  },
  // Teclado con el menú abierto: ← → otra carta, Tab la otra pestaña, Enter la acción, Esc o ↑ salir
  teclaBunker(e, tecla) {
    const B = this.bunker;
    // La M2 de abajo: F dispara (mantenida, ráfaga) hacia donde mira, W la gira hacia el otro lado
    if (tecla === 'KeyF') { this.dispararM2Bunker(0); return true; }
    if (tecla === 'KeyW') { if (!e.repeat) this.jugador.direccion = -this.jugador.direccion; return true; }
    if (e.code === 'Escape' || e.code === 'ArrowUp') { this.salirBunker(); return true; }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      const cartas = this.cartasBunker(), i = cartas.indexOf(B.elegido);
      if (!cartas.length) return true;
      B.elegido = cartas[(i + (e.code === 'ArrowRight' ? 1 : -1) + cartas.length) % cartas.length];
      this.pintarBunker();
      const el = document.querySelector('#bunker .bunker-carta.elegida'); if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      return true;
    }
    if (e.code === 'Tab') { this.accionBunker('pestana:' + (B.pestana === 'propias' ? 'venta' : B.pestana === 'venta' ? 'protecciones' : 'propias')); return true; }
    if ((e.code === 'Enter' || e.code === 'NumpadEnter') && !e.repeat) {
      if (document.activeElement && document.activeElement.closest('#bunker') && document.activeElement.dataset.bunker && !document.activeElement.dataset.bunker.startsWith('elegir:')) return false;   // el botón con foco hace lo suyo
      const b = document.querySelector('#bunker .boton-bunker:not([disabled])');
      if (b) this.accionBunker(b.dataset.bunker);
      return true;
    }
    return false;
  },
  // M2 del búnker: a la izquierda (-1) o a la derecha (1), mientras se aprieta el botón (o F); soltar la deja de disparar
  dispararM2Bunker(dir) {
    const B = this.bunker, j = this.jugador;
    if (!B || !B.abierto || !B.m2) return;
    if (dir) j.direccion = dir;
    this.entrada.disparar = true; this.entrada.dispararPulsado = true;
  },
  soltarM2Bunker() { if (this.entrada) this.entrada.disparar = false; },
  // Zombies vivos a la vista (los que la M2 puede alcanzar), el dinero que sube con las muertes y la munición sin fin
  actualizarCuentaBunker(forzar = false) {
    const B = this.bunker;
    if (B.m2) B.m2.municion = ARMA_FIJA.cargador;   // sin fin: nunca hay que recargar
    if (B.dinero !== B.dineroPintado) {   // los muertos de arriba pagan aunque se esté abajo: se actualiza el dinero y lo que se puede comprar
      const enLista = document.activeElement && document.activeElement.closest('#bunker-lista');
      B.dineroPintado = B.dinero; this.pintarBunker();
      if (enLista) document.querySelector('#bunker .bunker-carta.elegida')?.focus({ preventScroll: true });
    }
    const arriba = this.zombies.reduce((n, z) => n + (z.estado !== 'muerto' && !z.maniqui && z.x > this.camaraX - 20 && z.x < this.camaraX + ANCHO + 20 ? 1 : 0), 0);
    const lado = this.jugador.direccion;
    if (!forzar && arriba === B.arriba && lado === B.ladoM2) return;
    B.arriba = arriba; B.ladoM2 = lado;
    const cuenta = document.getElementById('bunker-arriba');
    if (cuenta) { cuenta.textContent = t('bunker.arriba', { n: arriba }); cuenta.classList.toggle('limpio', arriba === 0); }
    document.querySelectorAll('#bunker [data-m2]').forEach(b => b.classList.toggle('mirando', +b.dataset.m2 === lado));
  },
  // La partida sigue arriba mientras se está adentro; el comerciante se redibuja unas 20 veces por segundo
  actualizarBunkerAbierto() {
    const B = this.bunker;
    this.actualizarCuentaBunker();
    if (performance.now() < B.proximoDibujo) return;
    B.proximoDibujo = performance.now() + 50;
    const id = B.elegido && B.elegido !== 'botiquin' && B.elegido !== 'aereo' && !B.elegido.startsWith('prot:') ? B.elegido : null;
    dibujarEscenaBunker(document.getElementById('bunker-escena'), id, this.ahora + performance.now());
  },
});
// Botones del menú (delegación: el contenido se rearma después de cada compra)
document.getElementById('bunker').addEventListener('click', e => {
  const b = e.target.closest('[data-bunker]'), juego = window.ZonaMuerta && ZonaMuerta.juego();
  if (b && juego && juego.bunker && !b.disabled) juego.accionBunker(b.dataset.bunker);
});

// Los dos botones de la M2 (a la izquierda y a la derecha): se mantienen apretados para disparar; sirven con mouse y con el dedo
document.getElementById('bunker').addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-m2]'), juego = window.ZonaMuerta && ZonaMuerta.juego();
  if (!b || !juego || !juego.bunker) return;
  e.preventDefault(); juego.dispararM2Bunker(+b.dataset.m2);
});
for (const ev of ['pointerup', 'pointercancel', 'blur']) window.addEventListener(ev, () => { const juego = window.ZonaMuerta && ZonaMuerta.juego(); if (juego && juego.bunker) juego.soltarM2Bunker(); });

/* ---------- Textos ---------- */
Object.assign(TEXTOS.es, {
  'caja.botiquin': 'BOTIQUÍN', 'aviso.botiquinCaja': v => `BOTIQUÍN +1 (${v.n}/${v.max})`, 'aviso.botiquinLleno': v => `YA LLEVAS LOS ${v.max} BOTIQUINES`,
  'bunker.arriba': v => `ARRIBA: ${v.n} ☠`, 'bunker.m2Izq': '◀ DISPARAR', 'bunker.m2Der': 'DISPARAR ▶', 'bunker.m2Ayuda': 'M2 BROWNING · F dispara · W la gira', 'bunker.titulo': 'MEJORAS', 'bunker.tusArmas': 'TUS ARMAS', 'bunker.venta': 'COMPRAR', 'bunker.salir': 'SALIR DEL BÚNKER',
  'bunker.entrar': v => `${v.tecla}  ENTRAR AL BÚNKER`, 'bunker.entrarTactil': 'TOCA ▼ ABAJO PARA ENTRAR AL BÚNKER',
  'bunker.hudProximo': v => `BÚNKER ${v.flecha} ${v.m} m`, 'bunker.hudAqui': v => `BÚNKER AQUÍ · ${v.tecla} PARA ENTRAR`,
  'bunker.nivel': v => `NIVEL ${v.n} DE ${v.max}`, 'bunker.mejorar': 'MEJORAR', 'bunker.comprar1': 'COMPRAR',
  'bunker.municion': v => `MUNICIÓN +${v.n} (tienes ${v.tienes})`,
  'bunker.dano': v => `Daño por tiro: ${v.a} → ${v.b} (+20 %)`, 'bunker.danoMax': v => `Daño por tiro: ${v.a}`, 'bunker.alMaximo': 'MEJORADA AL MÁXIMO',
  'bunker.tiros': v => `Tiros por zombie: ${v.a} → ${v.b}`, 'bunker.golpes': v => `Golpes por zombie: ${v.a} → ${v.b}`,
  'bunker.danoVenta': v => `Daño por tiro: ${v.d}`, 'bunker.tirosVenta': v => `${v.n} tiros por zombie`, 'bunker.golpesVenta': v => `${v.n} golpes por zombie`,
  'bunker.faltan': v => `TE FALTAN $${v.n}`, 'bunker.botiquin': 'Botiquín', 'bunker.llevas': v => `llevas ${v.n} de ${v.max}`,
  'bunker.botiquinTexto': v => `Te cura ${v.cura} de vida y quita el veneno. Se lleva encima y se usa cuando quieras con ${v.tecla}.`,
  'bunker.botiquinLleno': v => `YA LLEVAS ${v.max}: NO ENTRAN MÁS`, 'bunker.nadaMas': 'Ya tienes todas las armas que vendo.',
  'bunker.saludo1': '¡Bienvenido al búnker! ¿Qué te mejoro hoy?', 'bunker.saludo2': 'Pasa, pasa. Aquí abajo los zombies no entran.',
  'bunker.saludo3': 'Tengo lo que buscas… si traes con qué pagar.',
  'bunker.dijoMejora': 'Listo: ahora pega más fuerte.', 'bunker.dijoMaximo': 'Más que esto no se puede. Es una joya.',
  'bunker.dijoCompra1': '¡Buena elección! Cuídala.', 'bunker.dijoCompra2': 'Es tuya. Ya te la dejé cargada.',
  'bunker.dijoMunicion': 'Ahí tienes. No la gastes toda junta.', 'bunker.dijoBotiquin': 'Guárdalo para cuando lo necesites.',
  'bunker.sinDinero': 'Te falta dinero. Vuelve cuando caces más zombies.', 'bunker.aviso': 'CADA 300 m HAY UN BÚNKER CON UN COMERCIANTE',
  'aviso.botiquin': v => `+${v.n} DE VIDA`, 'aviso.sinBotiquin': 'NO TIENES BOTIQUINES', 'aviso.vidaLlena': 'TU VIDA ESTÁ LLENA',
  'accion.botiquin': 'Usar botiquín (Pelea infinita)', 'controles.botiquin': 'Usar un botiquín (se compran en los búnkeres de la pelea infinita)',
  'tactil.botiquin': 'Usar botiquín',
  'bunker.aereo': 'Ataque aéreo', 'bunker.aereoTexto': v => `Una carga extra de ataque aéreo: se usa con ${v.tecla} aunque el gratuito (uno cada ${v.s} s) esté en espera. Limpia la pantalla de zombies.`,
  'bunker.aereoLleno': v => `YA LLEVAS ${v.max} CARGAS: NO ENTRAN MÁS`, 'bunker.dijoAereo': 'Cuando lo pidas por radio, el cielo se encarga.',
});
Object.assign(TEXTOS.pt, {
  'caja.botiquin': 'KIT MÉDICO', 'aviso.botiquinCaja': v => `KIT MÉDICO +1 (${v.n}/${v.max})`, 'aviso.botiquinLleno': v => `JÁ LEVA OS ${v.max} KITS MÉDICOS`,
  'bunker.arriba': v => `LÁ EM CIMA: ${v.n} ☠`, 'bunker.m2Izq': '◀ ATIRAR', 'bunker.m2Der': 'ATIRAR ▶', 'bunker.m2Ayuda': 'M2 BROWNING · F atira · W a vira', 'bunker.titulo': 'MELHORIAS', 'bunker.tusArmas': 'SUAS ARMAS', 'bunker.venta': 'COMPRAR', 'bunker.salir': 'SAIR DO BUNKER',
  'bunker.entrar': v => `${v.tecla}  ENTRAR NO BUNKER`, 'bunker.entrarTactil': 'TOQUE ▼ ABAIXO PARA ENTRAR NO BUNKER',
  'bunker.hudProximo': v => `BUNKER ${v.flecha} ${v.m} m`, 'bunker.hudAqui': v => `BUNKER AQUI · ${v.tecla} PARA ENTRAR`,
  'bunker.nivel': v => `NÍVEL ${v.n} DE ${v.max}`, 'bunker.mejorar': 'MELHORAR', 'bunker.comprar1': 'COMPRAR',
  'bunker.municion': v => `MUNIÇÃO +${v.n} (você tem ${v.tienes})`,
  'bunker.dano': v => `Dano por tiro: ${v.a} → ${v.b} (+20 %)`, 'bunker.danoMax': v => `Dano por tiro: ${v.a}`, 'bunker.alMaximo': 'MELHORADA AO MÁXIMO',
  'bunker.tiros': v => `Tiros por zumbi: ${v.a} → ${v.b}`, 'bunker.golpes': v => `Golpes por zumbi: ${v.a} → ${v.b}`,
  'bunker.danoVenta': v => `Dano por tiro: ${v.d}`, 'bunker.tirosVenta': v => `${v.n} tiros por zumbi`, 'bunker.golpesVenta': v => `${v.n} golpes por zumbi`,
  'bunker.faltan': v => `FALTAM $${v.n}`, 'bunker.botiquin': 'Kit médico', 'bunker.llevas': v => `você leva ${v.n} de ${v.max}`,
  'bunker.botiquinTexto': v => `Cura ${v.cura} de vida e tira o veneno. Fica com você e se usa quando quiser com ${v.tecla}.`,
  'bunker.botiquinLleno': v => `VOCÊ JÁ LEVA ${v.max}: NÃO CABEM MAIS`, 'bunker.nadaMas': 'Você já tem todas as armas que eu vendo.',
  'bunker.saludo1': 'Bem-vindo ao bunker! O que eu melhoro hoje?', 'bunker.saludo2': 'Entra, entra. Aqui embaixo os zumbis não entram.',
  'bunker.saludo3': 'Tenho o que você procura… se trouxer com que pagar.',
  'bunker.dijoMejora': 'Pronto: agora bate mais forte.', 'bunker.dijoMaximo': 'Mais que isso não dá. É uma joia.',
  'bunker.dijoCompra1': 'Boa escolha! Cuide dela.', 'bunker.dijoCompra2': 'É sua. Já deixei carregada.',
  'bunker.dijoMunicion': 'Aqui está. Não gaste tudo de uma vez.', 'bunker.dijoBotiquin': 'Guarde para quando precisar.',
  'bunker.sinDinero': 'Falta dinheiro. Volte quando caçar mais zumbis.', 'bunker.aviso': 'A CADA 300 m HÁ UM BUNKER COM UM COMERCIANTE',
  'aviso.botiquin': v => `+${v.n} DE VIDA`, 'aviso.sinBotiquin': 'VOCÊ NÃO TEM KITS MÉDICOS', 'aviso.vidaLlena': 'SUA VIDA ESTÁ CHEIA',
  'accion.botiquin': 'Usar kit médico (Luta infinita)', 'controles.botiquin': 'Usar um kit médico (compram-se nos bunkers da luta infinita)',
  'tactil.botiquin': 'Usar kit médico',
  'bunker.aereo': 'Ataque aéreo', 'bunker.aereoTexto': v => `Uma carga extra de ataque aéreo: usa-se com ${v.tecla} mesmo com o gratuito (um a cada ${v.s} s) em espera. Limpa a tela de zumbis.`,
  'bunker.aereoLleno': v => `VOCÊ JÁ LEVA ${v.max} CARGAS: NÃO CABEM MAIS`, 'bunker.dijoAereo': 'Quando pedir pelo rádio, o céu cuida do resto.',
});
Object.assign(TEXTOS.en, {
  'caja.botiquin': 'MEDKIT', 'aviso.botiquinCaja': v => `MEDKIT +1 (${v.n}/${v.max})`, 'aviso.botiquinLleno': v => `YOU ALREADY CARRY ${v.max} MEDKITS`,
  'bunker.arriba': v => `ABOVE: ${v.n} ☠`, 'bunker.m2Izq': '◀ FIRE', 'bunker.m2Der': 'FIRE ▶', 'bunker.m2Ayuda': 'M2 BROWNING · F fires · W turns it', 'bunker.titulo': 'UPGRADES', 'bunker.tusArmas': 'YOUR WEAPONS', 'bunker.venta': 'BUY', 'bunker.salir': 'LEAVE THE BUNKER',
  'bunker.entrar': v => `${v.tecla}  ENTER THE BUNKER`, 'bunker.entrarTactil': 'TAP ▼ DOWN TO ENTER THE BUNKER',
  'bunker.hudProximo': v => `BUNKER ${v.flecha} ${v.m} m`, 'bunker.hudAqui': v => `BUNKER HERE · ${v.tecla} TO ENTER`,
  'bunker.nivel': v => `LEVEL ${v.n} OF ${v.max}`, 'bunker.mejorar': 'UPGRADE', 'bunker.comprar1': 'BUY',
  'bunker.municion': v => `AMMO +${v.n} (you have ${v.tienes})`,
  'bunker.dano': v => `Damage per shot: ${v.a} → ${v.b} (+20%)`, 'bunker.danoMax': v => `Damage per shot: ${v.a}`, 'bunker.alMaximo': 'FULLY UPGRADED',
  'bunker.tiros': v => `Shots per zombie: ${v.a} → ${v.b}`, 'bunker.golpes': v => `Hits per zombie: ${v.a} → ${v.b}`,
  'bunker.danoVenta': v => `Damage per shot: ${v.d}`, 'bunker.tirosVenta': v => `${v.n} shots per zombie`, 'bunker.golpesVenta': v => `${v.n} hits per zombie`,
  'bunker.faltan': v => `YOU NEED $${v.n} MORE`, 'bunker.botiquin': 'Medkit', 'bunker.llevas': v => `you carry ${v.n} of ${v.max}`,
  'bunker.botiquinTexto': v => `Heals ${v.cura} health and removes poison. You carry it and use it whenever you want with ${v.tecla}.`,
  'bunker.botiquinLleno': v => `YOU ALREADY CARRY ${v.max}: NO ROOM FOR MORE`, 'bunker.nadaMas': 'You already have every weapon I sell.',
  'bunker.saludo1': 'Welcome to the bunker! What shall I upgrade today?', 'bunker.saludo2': 'Come in, come in. Zombies can\'t get down here.',
  'bunker.saludo3': 'I have what you\'re looking for… if you can pay for it.',
  'bunker.dijoMejora': 'Done: now it hits harder.', 'bunker.dijoMaximo': 'It can\'t get any better than this. A real gem.',
  'bunker.dijoCompra1': 'Good choice! Take care of it.', 'bunker.dijoCompra2': 'It\'s yours. Already loaded.',
  'bunker.dijoMunicion': 'There you go. Don\'t spend it all at once.', 'bunker.dijoBotiquin': 'Keep it for when you need it.',
  'bunker.sinDinero': 'Not enough money. Come back when you\'ve hunted more zombies.', 'bunker.aviso': 'EVERY 300 m THERE IS A BUNKER WITH A MERCHANT',
  'aviso.botiquin': v => `+${v.n} HEALTH`, 'aviso.sinBotiquin': 'YOU HAVE NO MEDKITS', 'aviso.vidaLlena': 'YOUR HEALTH IS FULL',
  'accion.botiquin': 'Use medkit (Endless fight)', 'controles.botiquin': 'Use a medkit (bought in the bunkers of the endless fight)',
  'tactil.botiquin': 'Use medkit',
  'bunker.aereo': 'Air strike', 'bunker.aereoTexto': v => `One extra air strike charge: use it with ${v.tecla} even while the free one (one every ${v.s} s) is recharging. It clears the screen of zombies.`,
  'bunker.aereoLleno': v => `YOU ALREADY CARRY ${v.max} CHARGES: NO ROOM FOR MORE`, 'bunker.dijoAereo': 'Radio it in and the sky will do the rest.',
});
