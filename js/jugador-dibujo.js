/* ===== Dibujo del jugador =====
 * Un sobreviviente con chaleco táctico, mochila, gorra y mangas arremangadas. El torso, la cabeza y el equipo se pintan
 * con volumen (luz a la izquierda) y un contorno fino; los brazos, las manos y las piernas salen de js/anatomia.js: cada
 * miembro es una sola forma, las articulaciones no pasan de lo que da una persona y las manos son un esqueleto chico
 * que se orienta hacia cualquier lado.
 * Todo se dibuja alrededor de los pies (0, 0) mirando a la derecha; el cuerpo se reutiliza para la sombra.
 */
const COLORES_JUGADOR = {
  piel: '#e2b48d', pelo: '#3b2a1c', gorra: '#2f3236', chaqueta: '#5e6a3d', chaleco: '#33363b', bolsillo: '#4a4e55',
  pantalon: '#6f6a52', rodillera: '#2e2b27', bota: '#2a211b', cinturon: '#4a3524', bolsa: '#3f4a30', funda: '#2e2a26',
  mochila: '#4d4a35', manta: '#6a7f8a', guante: '#2a2623', correa: '#26231f',
};

/* ---------- Pintura de ilustración para el personaje ----------
 * Sombreado de dos tonos con la luz arriba a la izquierda: la forma se rellena con el tono oscuro y encima la misma
 * forma corrida hacia la luz con el tono base (queda una franja de sombra abajo a la derecha), un brillo fino en el
 * borde iluminado y un contorno del mismo color, más oscuro (no negro). En la pasada de la sombra, solo la silueta. */
function pintura(ctx, trazar, color, op = {}) {
  ctx.beginPath(); trazar(ctx); ctx.closePath();
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fill(); return; }
  const corre = op.sombra ?? 1.3;
  ctx.save();
  ctx.fillStyle = ajustarColor(color, -(op.oscuro ?? 0.3)); ctx.fill();
  ctx.clip();
  ctx.translate(-corre * 0.7, -corre);
  ctx.beginPath(); trazar(ctx); ctx.closePath();
  const g = ctx.createLinearGradient(0, op.y0 ?? -90, 0, op.y1 ?? 0);
  g.addColorStop(0, ajustarColor(color, 0.06)); g.addColorStop(1, ajustarColor(color, -0.06));
  ctx.fillStyle = op.plano ? color : g; ctx.fill();
  if (op.brillo !== false) {
    ctx.translate(corre * 0.7 + 0.55, corre + 0.55);
    ctx.beginPath(); trazar(ctx); ctx.closePath();
    ctx.strokeStyle = `rgba(255, 246, 225, ${op.brillo ?? 0.3})`; ctx.lineWidth = 0.7; ctx.lineCap = 'butt'; ctx.stroke();
  }
  ctx.restore();
  if (op.contorno !== false) { ctx.beginPath(); trazar(ctx); ctx.closePath(); ctx.strokeStyle = ajustarColor(color, -0.62); ctx.lineWidth = op.linea ?? 0.5; ctx.lineJoin = 'round'; ctx.lineCap = 'butt'; ctx.stroke(); }
}
// Tramo de brazo o pierna: más ancho al principio que al final, con los extremos redondeados y un bulto de músculo
// (abulta > 0 hacia un lado de la normal, < 0 hacia el otro)
function tramo(x0, y0, x1, y1, w0, w1, abulta = 0) {
  return c => {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
    const m = (w0 + w1) / 4, tn = Math.atan2(ny, nx);
    const p = (k, s, w) => [x0 + dx * k + nx * s * w, y0 + dy * k + ny * s * w];
    c.moveTo(...p(0, 1, w0 / 2));
    c.quadraticCurveTo(...p(0.45, 1, m + Math.max(0, abulta)), ...p(1, 1, w1 / 2));
    c.arc(x1, y1, w1 / 2, tn, tn - Math.PI, true);
    c.quadraticCurveTo(...p(0.45, -1, m + Math.max(0, -abulta)), ...p(0, -1, w0 / 2));
    c.arc(x0, y0, w0 / 2, tn - Math.PI, tn - 2 * Math.PI, true);
  };
}
const raya = (ctx, color, ancho, pts) => { if (!Pincel.silueta) linea(ctx, color, ancho, pts); };

// Camuflaje multiterreno: manchas fijas a la tela (se mueven con la pierna) y encima una sombra de costado para no perder volumen
function camuflaje(ctx, trazar, colores, ox, oy, ang, ancho, largo, sal, oscuro = 0) {
  if (Pincel.silueta || !colores) return;
  ctx.save(); ctx.beginPath(); trazar(ctx); ctx.closePath(); ctx.clip();
  ctx.translate(ox, oy); ctx.rotate(ang);
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * 0.8;
  for (let k = 0; k < 16; k++) {
    const col = colores[k % colores.length];
    ctx.fillStyle = oscuro ? ajustarColor(col, -oscuro) : col;
    const x = (azar(k, sal) - 0.5) * ancho * 1.2, y = -2 + azar(k, sal + 1) * (largo + 4);
    ctx.beginPath(); ctx.ellipse(x, y, 0.9 + azar(k, sal + 2) * 1.8, 0.7 + azar(k, sal + 3) * 1.3, azar(k, sal + 4) * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = a0;
  const g = ctx.createLinearGradient(-ancho / 2, 0, ancho / 2, 0);
  g.addColorStop(0, 'rgba(255, 245, 220, 0.12)'); g.addColorStop(0.5, 'rgba(0, 0, 0, 0)'); g.addColorStop(1, 'rgba(15, 10, 5, 0.3)');
  ctx.fillStyle = g; ctx.fillRect(-ancho, -4, ancho * 2, largo + 8);
  ctx.restore();
}
const repasar = (ctx, trazar, color) => { if (Pincel.silueta) return; ctx.beginPath(); trazar(ctx); ctx.closePath(); ctx.strokeStyle = ajustarColor(color, -0.62); ctx.lineWidth = 0.5; ctx.lineJoin = 'round'; ctx.lineCap = 'butt'; ctx.stroke(); };

/* --- Partes del cuerpo --- */
/* Pierna articulada: muslo desde la cadera, rodilla, canilla, tobillo y bota. a = ángulo del muslo (adelante > 0),
 * doblez = flexión de la rodilla (solo hacia atrás, hasta ANATOMIA.rodilla). El muslo y la canilla son una sola forma
 * (cuádriceps adelante, pantorrilla atrás) y la rodilla es el quiebre entre los dos, no una bola; la rodillera es una
 * coquilla chica sobre el frente de la rodilla. El pie apoya de plano mientras el tobillo da (ANATOMIA.tobillo): si la
 * canilla se inclina más, se levanta el talón (pierna de atrás) o la punta (pierna de adelante). */
function piernaArticulada(ctx, hx, hy, a, doblez, color, C) {
  const L1 = HUESOS.muslo, L2 = HUESOS.canilla, A = ANATOMIA;
  a = limitar(a, -A.cadera.extension * GRADOS, A.cadera.flexion * GRADOS);
  doblez = limitar(doblez, A.rodilla.extension * GRADOS, A.rodilla.flexion * GRADOS);
  const kx = hx + Math.sin(a) * L1, ky = hy + Math.cos(a) * L1;
  const b = a - doblez;
  const tx = kx + Math.sin(b) * L2, ty = ky + Math.cos(b) * L2;   // tobillo
  const lejos = color !== C.pantalon ? 0.2 : 0;
  // Pie: de plano; si el tobillo no da, gira lo que falta (y al despegar, la pierna de atrás levanta el talón)
  const pie = giroDelPie(b, doblez);
  const cp = Math.cos(pie), sp = Math.sin(pie), P = (x, y) => [tx + x * cp - y * sp, ty + x * sp + y * cp];
  const enCanilla = k => [kx + (tx - kx) * k, ky + (ty - ky) * k];

  // Bota (va primero: el pantalón cae sobre la caña): la caña sube por la canilla y el pie gira en el tobillo; una sola
  // forma, con la suela aparte
  const Bt = lejos ? ajustarColor(C.bota, -0.12) : C.bota, Su = C.suela || ajustarColor(C.bota, -0.5), H = HUESOS.tobillo;
  const cana = tramoMusculo(...enCanilla(1 - 5.6 / L2), tx, ty, 5.0, 4.8);
  const empeine = c => {
    c.moveTo(...P(-2.5, -1.2)); c.quadraticCurveTo(...P(-3.7, 0.8), ...P(-3.6, 2.6)); c.lineTo(...P(-3.6, H - 1.2));          // talón
    c.lineTo(...P(8.2, H - 1.2)); c.quadraticCurveTo(...P(9.2, H - 1.4), ...P(8.9, H - 2.5));                                   // puntera
    c.quadraticCurveTo(...P(8.3, H - 3.9), ...P(6.2, H - 4.1)); c.quadraticCurveTo(...P(3.6, -0.6), ...P(2.4, -1.8));            // empeine
    c.closePath();
  };
  forma(ctx, juntos(cana, empeine), Bt, { sombra: 0.8 });
  forma(ctx, c => { c.moveTo(...P(-3.8, H - 1.35)); c.lineTo(...P(8.6, H - 1.35)); c.quadraticCurveTo(...P(9.4, H - 1.2), ...P(9.2, H - 0.5)); c.lineTo(...P(8.4, H)); c.lineTo(...P(-3.8, H)); c.closePath(); }, Su, { sombra: 0.3, linea: 0.32 });
  if (!Pincel.silueta) {
    raya(ctx, ajustarColor(Bt, -0.3), 0.36, [P(5.6, H - 3.8), P(6.6, H - 1.5)]);                                    // costura de la puntera
    for (let k = 0; k < 3; k++) raya(ctx, ajustarColor(Bt, -0.4), 0.4, [P(2.3 + k * 1.0, -1.2 + k * 0.9), P(3.6 + k * 1.0, -0.5 + k * 0.9)]);   // cordones
    raya(ctx, ajustarColor(Su, 0.25), 0.3, [P(-3.4, H - 0.7), P(8.2, H - 0.7)]);                                   // canto de la suela
  }

  // Muslo y canilla: una sola forma del color del pantalón, que termina abolsada sobre la caña de la bota
  const muslo = tramoMusculo(hx, hy, kx, ky, 8.2, 5.9, 0.22, 0.42, 0.3, 0.42);
  const canilla = tramoMusculo(kx, ky, ...enCanilla(1 - 4.6 / L2), 5.9, 5.4, 0.45, 0.06, 0.38, 0.5);
  forma(ctx, juntos(muslo, canilla), color);
  camuflaje(ctx, c => { muslo(c); }, C.camo, hx, hy, -a, 9, L1, 11, lejos);
  camuflaje(ctx, c => { canilla(c); }, C.camo, kx, ky, -b, 7, L2, 31, lejos);
  if (!Pincel.silueta) {
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-a);
    if (C.rayaPierna) raya(ctx, C.rayaPierna, 0.7, [[0.6, 0.5], [0.8, L1 - 0.5]]);   // raya o costura a lo largo del pantalón
    if (!C.sinBolsillo) {   // bolsillo cargo con tapa y botón
      forma(ctx, c => c.roundRect(-2.4, 5.2, 4.8, 5.2, 1), ajustarColor(color, -0.05), { sombra: 0.4, linea: 0.3 });
      forma(ctx, c => c.roundRect(-2.6, 4.8, 5.2, 1.8, 0.7), ajustarColor(color, -0.12), { sombra: 0.3, linea: 0.3 });
      detalle(ctx, ajustarColor(color, -0.45), circulo(-0.1, 5.7, 0.36));
    }
    ctx.restore();
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(-b);
    if (C.rayaPierna) raya(ctx, C.rayaPierna, 0.7, [[0.4, 0.5], [0.2, L2 - 5.4]]);
    raya(ctx, ajustarColor(color, -0.28), 0.34, [[-1.9, 2.2], [-0.6, 3.4]]); raya(ctx, ajustarColor(color, -0.24), 0.3, [[-2, 4.2], [-0.9, 5.2]]);   // pliegues de la corva
    raya(ctx, ajustarColor(color, -0.3), 0.32, [[-2.2, L2 - 5.6], [2.2, L2 - 5.9]]);                             // el fruncido de la botamanga
    ctx.restore();
  }

  // Rodillera: coquilla sobre el frente de la rodilla, con sus dos correas (no la llevan los que van de traje, de cuero o de tela)
  if (!C.sinRodillera) {
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(-(a + b) / 2);
    const R = C.rodillera;
    if (!Pincel.silueta) for (const yy of [-2.3, 2.5]) raya(ctx, ajustarColor(R, -0.4), 0.7, [[-2.9, yy + 0.4], [1.2, yy]]);
    forma(ctx, c => { c.moveTo(0.6, -3.1); c.quadraticCurveTo(3.4, -3.3, 3.9, -0.6); c.quadraticCurveTo(4.1, 2.2, 2.6, 3.4); c.quadraticCurveTo(1.2, 3.8, 0.5, 3.0); c.quadraticCurveTo(1.5, 0, 0.6, -3.1); c.closePath(); }, R, { sombra: 0.6, linea: 0.36 });
    if (!Pincel.silueta) raya(ctx, ajustarColor(R, -0.25), 0.3, [[2.6, -2.2], [3.3, 0.2], [2.5, 2.7]]);   // canto de la coquilla
    ctx.restore();
  }
}

/* ---------- Brazos ----------
 * El brazo es una sola forma: la manga arranca ancha en el hombro (el deltoides), afina hacia el codo y sigue por el
 * antebrazo hasta la muñeca. Antes eran dos cápsulas con su contorno cada una y un círculo en el hombro, y se leía
 * como pelotas unidas. Dónde cae el codo lo resuelve js/anatomia.js (resolverBrazo) con los límites de una persona. */
const coloresLejos = C => Object.assign({}, C, { chaqueta: ajustarColor(C.chaqueta, -0.28), piel: ajustarColor(C.piel, -0.25), guante: ajustarColor(C.guante, -0.08),
  antebrazo: C.antebrazo && ajustarColor(C.antebrazo, -0.28), parche: C.parche && ajustarColor(C.parche, -0.28), brazal: C.brazal && ajustarColor(C.brazal, -0.28) });
function dibujarBrazo(ctx, hx, hy, mx, my, R, C) {
  const { cx, cy } = R, larga = !!C.antebrazo, T = C.chaqueta;
  const manga = tramoMusculo(hx, hy, cx, cy, 6.0, 4.6, 0.2, 0.28, 0.5, 0.3);                                  // tríceps atrás, deltoides y bíceps adelante
  const ante = tramoMusculo(cx, cy, mx, my, larga ? 4.6 : 4.2, larga ? 3.3 : 2.9, 0.26, 0.18, 0.28, 0.3);    // la panza del antebrazo, cerca del codo
  const en = (x0, y0, x1, y1, k) => [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
  if (larga) forma(ctx, juntos(manga, ante), T);
  else {   // manga corta: antebrazo de piel y, sobre el codo, el rollo de la manga arremangada (una banda, no una bola)
    forma(ctx, ante, C.piel);
    forma(ctx, manga, T);
    forma(ctx, tramoMusculo(...en(hx, hy, cx, cy, 0.8), ...en(hx, hy, cx, cy, 0.97), 5.4, 5.2), ajustarColor(T, 0.08), { sombra: 0.6, linea: 0.36 });
  }
  if (!Pincel.silueta) {   // dos pliegues en la sangría del codo, del lado hacia donde dobla
    const u1 = [cx - hx, cy - hy], u2 = [mx - cx, my - cy], l1 = Math.hypot(...u1) || 1, l2 = Math.hypot(...u2) || 1;
    const bx = -u1[0] / l1 + u2[0] / l2, by = -u1[1] / l1 + u2[1] / l2, lb = Math.hypot(bx, by);
    if (lb > 0.35 && l1 > 5 && l2 > 5) {
      const ix = bx / lb, iy = by / lb, tono = ajustarColor(larga ? T : C.piel, -0.3);
      raya(ctx, tono, 0.36, [[cx + ix * 0.5, cy + iy * 0.5], [cx + ix * 2.3, cy + iy * 2.3]]);
      if (larga) raya(ctx, tono, 0.32, [[cx + ix * 0.9 - u1[0] / l1 * 1.7, cy + iy * 0.9 - u1[1] / l1 * 1.7], [cx + ix * 2.3 - u1[0] / l1 * 1.2, cy + iy * 2.3 - u1[1] / l1 * 1.2]]);
    }
  }
  if (C.brazal) {   // brazal: muñequera de metal o cuero con remaches
    forma(ctx, tramoMusculo(...en(cx, cy, mx, my, 0.52), ...en(cx, cy, mx, my, 0.9), 4.6, 4.2), C.brazal, { sombra: 0.5, linea: 0.36 });
    if (!Pincel.silueta) for (const k of [0.6, 0.82]) detalle(ctx, ajustarColor(C.brazal, 0.35), circulo(...en(cx, cy, mx, my, k), 0.38));
  }
  if (C.parche) {   // parche de abrojo en el hombro
    ctx.save(); ctx.translate(...en(hx, hy, cx, cy, 0.34)); ctx.rotate(Math.atan2(cy - hy, cx - hx) - Math.PI / 2);
    forma(ctx, c => c.roundRect(-1.9, -1.7, 3.8, 3.4, 0.5), C.parche, { sombra: 0.35, linea: 0.3 });
    if (!Pincel.silueta) for (let k = 0; k < 3; k++) detalle(ctx, ajustarColor(C.parche, -0.3), c => c.rect(-1.3, -1.1 + k * 1.1, 2.6, 0.4));
    ctx.restore();
  }
  // Puño elastizado del guante, sobre la muñeca
  const ux = Math.cos(R.ante), uy = Math.sin(R.ante);
  forma(ctx, tramoMusculo(mx - ux * 1.1, my - uy * 1.1, mx + ux * 0.4, my + uy * 0.4, 3.5, 3.1), ajustarColor(C.guante, 0.1), { linea: 0.3, sombra: 0.45 });
}

/* ---------- Manos ----------
 * Todas las manos son la misma mano con guante (js/anatomia.js: dibujarMano), empuñe lo que empuñe: mismo color, mismas
 * medidas y mismo trazo, en reposo y en cada fase de la recarga. Lo que cambia es el gesto: cuánto cierra cada dedo y
 * qué hace el pulgar. La orientación sale del antebrazo y de lo que agarra, siempre dentro de lo que da la muñeca, y la
 * mano pasa de un gesto a otro girando y cerrando de a poco (TAU_MANO), no de golpe.
 * Lo que agarra va por detrás: la palma y los nudillos lo tapan, y los dedos que lo envuelven por el otro lado se
 * dibujan antes que él. */
const GESTOS_MANO = {
  viaja:       { cierre: 0.24, pulgar: { suelto: 1 }, abre: 0.6 },                                           // en camino, entreabierta
  suelta:      { cierre: 0.14, pulgar: { suelto: 0.8, arriba: 0.2 }, abre: 1 },                              // recién abrió los dedos
  cargador:    { cierre: 0.62, nudillo: 0.2, pulgar: { cierra: 0.6, arriba: 0.4 }, abre: 0 },                // envuelve un cargador: los dedos cruzan su costado y doblan en el canto
  punio:       { cierre: 0.86, nudillo: 0.9, pulgar: { cierra: 1 }, abre: 0 },                               // puño alrededor de un mango o un tubo
  pinza:       { cierre: [0.34, 0.38, 0.7, 0.78], nudillo: 0.8, pulgar: { cierra: 0.45, largo: 0.55 }, abre: 0 },   // algo chico entre el pulgar y dos dedos
  bolsa:       { cierre: 0.5, nudillo: 0.7, pulgar: { cierra: 0.5, suelto: 0.5 }, abre: 0.2 },               // metida en la bolsa
  manija:      { cierre: 0.8, nudillo: 0.4, pulgar: { suelto: 1 }, abre: 0 },                                // los dedos en gancho
  corredera:   { cierre: 0.7, nudillo: 0.8, pulgar: { cierra: 0.8, suelto: 0.2 }, abre: 0 },                 // por arriba de la corredera
  palmada:     { cierre: 0.04, pulgar: { arriba: 0.6, suelto: 0.4 }, abre: 0.7 },
  empuja:      { cierre: 0.8, nudillo: 0.9, pulgar: { sube: 1 }, abre: 0 },                                  // el pulgar empuja las balas del peine
  bandeja:     { cierre: 0.3, nudillo: 0.5, pulgar: { arriba: 0.6, suelto: 0.4 }, abre: 0.4 },               // la palma hacia arriba, sosteniendo
  empunadura:  { cierre: [0.4, 0.86, 0.9, 0.92], nudillo: 0.92, pulgar: { cierra: 0.6, largo: 0.4 }, abre: 0 },   // el índice, en el disparador
  guardamanos: { cierre: 0.62, nudillo: 0.75, pulgar: { arriba: 0.4, sube: 0.6 }, abre: 0 },                 // la palma por debajo del arma; el pulgar sube en diagonal por este costado
  envuelve:    { cierre: 0.7, nudillo: 0.3, pulgar: { largo: 1 }, abre: 0 },                                 // sobre los dedos de la otra mano
  cabeza:      { cierre: 0.4, pulgar: { suelto: 1 }, abre: 0.4 },
};
const TAU_MANO = 65;   // ms que tarda la mano en acomodarse a un gesto nuevo
// Lo que hace que la mano no salte de una pose a otra: guarda la base y la pose de cada mano y las acerca al objetivo.
// Un agarre firme sobre el arma (rigido) ya acomodado sigue al arma sin retraso.
function poseSuave(j, cual, gesto, B, pose, rigido) {
  const M = j.manos || (j.manos = {}), prev = M[cual], ahora = j.ahora, arma = j.montada ? 'm2' : j.inventario[j.indiceArma];
  let k = 1;
  if (prev && prev.arma === arma && ahora >= prev.t && ahora - prev.t < 250) {
    if (ahora === prev.t && prev.gesto === gesto) return prev;                      // segunda pasada del mismo cuadro (la sombra)
    k = rigido && prev.gesto === gesto && prev.asentada ? 1 : 1 - Math.exp(-(ahora - prev.t) / TAU_MANO);
  }
  const nB = k >= 1 ? B : mezclarBases(prev.B, B, k), nP = k >= 1 ? pose : mezclarPoses(prev.pose, pose, k);
  const asentada = k >= 1 || (V3.punto(nB.ex, B.ex) > 0.9992 && V3.punto(nB.eb, B.eb) > 0.9992);
  return (M[cual] = { B: nB, pose: nP, t: ahora, arma, gesto, asentada });
}
/* Resuelve un brazo con su mano. `armar(ante3)` devuelve, para esa dirección del antebrazo, lo que pide el gesto:
 *   { gesto, B: base de la mano, O: [x, y] dónde va la palma, pose, zObj: profundidad de lo que agarra, rigido }
 * Como la muñeca depende de la mano y la mano del antebrazo, se da un par de vueltas hasta que cierran. */
function armarBrazo(j, cual, hx, hy, armar, opBrazo) {
  let ante3 = [0.8, -0.55, 0], g = null, R = null;
  const resolver = B => { const W = munecaDe(g.O, B); return [W, resolverBrazo(hx, hy, W[0], W[1], Object.assign({ mano: g.rigido ? B.ex : null, alinea: g.alinea }, opBrazo, g.polo ? { polo: g.polo } : null))]; };
  for (let k = 0; k < 3; k++) { g = armar(ante3); R = resolver(g.B)[1]; ante3 = R.ante3; }
  const S = poseSuave(j, cual, g.gesto, g.B, normalizarPose(g.pose), g.rigido), [W, R2] = resolver(S.B);
  (j.brazos || (j.brazos = {}))[cual] = { cx: R2.cx, cy: R2.cy, flexion: R2.flexion, extension: R2.extension };   // para las pruebas: dónde quedó el codo y cuánto dobla
  return { hx, hy, W, R: R2, O: g.O, B: S.B, pose: S.pose, zObj: g.zObj || 0, gesto: g.gesto, capas: g.capas || null };
}
const pintarBrazo = (ctx, A, C) => dibujarBrazo(ctx, A.hx, A.hy, A.W[0], A.W[1], A.R, C);
const pintarMano = (ctx, A, C, capa = null) => dibujarMano(ctx, A.O, A.B, A.pose, C.guante, capa, A.zObj);
const mezclaGesto = (a, b, k) => mezclarPoses(normalizarPose(GESTOS_MANO[a]), normalizarPose(GESTOS_MANO[b]), limitar(k, 0, 1));

/* Gestos de la mano de apoyo (la del brazo cercano, que es el izquierdo). p: el punto donde actúa (e.mano). */
function gestoApoyo(gesto, p, e, op = {}) {
  const c = Math.cos(e.incl), s = Math.sin(e.incl), arribaArma = [s, -c, 0];   // hacia arriba del arma
  const libre = (nombre, giro, flexion, desvio, atras = 0, palma = 0, pose = null) => ante3 => {
    const B = manoDesdeAntebrazo(ante3, true, giro, flexion, desvio);
    return { gesto: nombre, B, O: [p[0] - B.ex[0] * atras - B.eb[0] * palma, p[1] - B.ex[1] * atras - B.eb[1] * palma], pose: pose || GESTOS_MANO[nombre] };
  };
  const agarra = e.agarra ?? 1;
  switch (gesto) {
    case 'guardamanos': {   // la palma sostiene el arma desde abajo; los dedos suben por el otro costado y el pulgar por este
      const B = baseMano([0.2 * c + 0.24 * s, 0.2 * s - 0.24 * c, -0.95], [arribaArma[0], arribaArma[1], 0.14], true);
      return () => ({ gesto, B, O: [p[0] - B.eb[0] * 0.85, p[1] - B.eb[1] * 0.85], pose: GESTOS_MANO.guardamanos, zObj: B.ex[2] * 0.5 + B.eb[2] * 1.6, rigido: true, alinea: 0, capas: 'arma' });
    }
    case 'envuelve': {      // pistola a dos manos: tapa los dedos de la otra, con el pulgar estirado sobre el armazón
      const a = e.incl + 0.2, B = baseMano([Math.cos(a), Math.sin(a), -0.32], [0.12, 0, -1], true);
      return () => ({ gesto, B, O: [p[0] - B.ex[0] * 0.9, p[1] + 0.5 - B.ex[1] * 0.9], pose: GESTOS_MANO.envuelve, zObj: B.eb[2] * 1.3, rigido: true, alinea: 0.5, capas: 'arma' });
    }
    case 'mango': {         // segunda mano en el mango de un arma de dos manos
      const B = baseMano([c, s, -0.1], [0.1, 0, -1], true);
      return () => ({ gesto, B, O: p, pose: GESTOS_MANO.punio, zObj: B.eb[2] * 0.9, rigido: true, alinea: 0.5, capas: 'arma' });
    }
    case 'cargador': case 'punio': {   // envuelve algo largo (cargador, cohete, granada): el lado del pulgar, a lo largo de eso
      const eje = op.eje || arribaArma, eb = [-0.15, 0, -1];
      return ante3 => {
        let ex = V3.cruz(eje, eb);
        if (gesto === 'punio' && V3.punto(ex, ante3) < 0) ex = V3.por(ex, -1);   // un tubo se agarra de cualquiera de los dos lados
        const B = limitarMuneca(baseMano(ex, eb, true), ante3);
        const atras = gesto === 'cargador' ? 1.5 : 0.4;   // la palma queda sobre la mitad de atrás y los dedos cruzan hasta el canto de adelante
        return { gesto, B, O: [p[0] - B.ex[0] * atras, p[1] - B.ex[1] * atras], pose: mezclaGesto('viaja', gesto, agarra), zObj: B.eb[2] * 1.4, capas: op.capas || 'objeto' };
      };
    }
    case 'bandeja': {       // la caja apoyada en la palma
      return ante3 => { const B = manoDesdeAntebrazo(ante3, true, -80, -25, 0); return { gesto, B, O: [p[0] - B.eb[0] * 0.9, p[1] - B.eb[1] * 0.9], pose: GESTOS_MANO.bandeja, zObj: -9 }; };
    }
    case 'corredera': {     // por arriba de la corredera de la pistola: la palma encima, los dedos del otro lado
      const eb = [-arribaArma[0], -arribaArma[1], 0.1];
      return ante3 => { const B = limitarMuneca(baseMano([0.1 * c - 0.25 * s, 0.1 * s + 0.25 * c, -0.95], eb, true), ante3);
        return { gesto, B, O: [p[0] - B.eb[0] * 0.85, p[1] - B.eb[1] * 0.85], pose: mezclaGesto('viaja', 'corredera', agarra), zObj: B.ex[2] * 1.5 + B.eb[2] * 1.2, capas: 'objeto' }; };
    }
    case 'peldano': {       // barrote de la escalera: los dedos por arriba, hacia adelante
      const B = baseMano([0.15, -1, 0], [1, 0.2, 0], true);
      return () => ({ gesto, B, O: p, pose: GESTOS_MANO.punio, rigido: true, alinea: 0.2, polo: [-0.8, 0.4, 1.7] });   // el codo se abre hacia el costado
    }
    case 'soga': { const B = baseMano([1, -0.1, -0.1], [0.1, 0, -1], true); return () => ({ gesto, B, O: p, pose: GESTOS_MANO.punio, rigido: true, alinea: 0.2, polo: [-0.8, 0.4, 1.7] }); }
    case 'pinza':   return libre('pinza', 25, 14, 0, 3.4, 1.8);                                          // lo que lleva queda en la punta de los dedos
    case 'bolsa':   return libre('bolsa', 55, 28, 0, 2.0, 0, mezclaGesto('viaja', 'bolsa', agarra));
    case 'manija':  return libre('manija', 70, 15, -5, 3.3, 1.2, mezclaGesto('viaja', 'manija', agarra));   // la manija, en el gancho de los dedos
    case 'palmada': return libre('palmada', 35, -25, 0, 1.0);
    case 'empuja':  return libre('empuja', 80, 35, 0, 0.4, 1.9);
    case 'suelta':  return libre('suelta', 0, -5, 0);
    case 'cabeza':  return libre('cabeza', -70, 72, 0);                                                 // la palma sobre la cabeza: la muñeca doblada, los dedos hacia atrás
    default:        return libre('viaja', 10, 10, 0);
  }
}
/* Gestos de la mano del gatillo (la del brazo lejano, la derecha). g: el punto de la empuñadura; ang: su inclinación. */
function gestoGatillo(gesto, g, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  switch (gesto) {
    case 'empunadura': {    // la palma del otro lado de la empuñadura; de este lado, los dedos que la envuelven y el pulgar
      const B = baseMano([c, s, -0.12], [0.1, 0, 1], false);
      return () => ({ gesto, B, O: [g[0] - s * 1.9 - c * 0.3, g[1] + c * 1.9 - s * 0.3], pose: GESTOS_MANO.empunadura, zObj: 1.25, rigido: true, alinea: 0.25, polo: [0, -0.35, -0.9], capas: 'arma' });
    }
    case 'mango': {         // el mango pasa por el puño
      const B = baseMano([c, s, 0], [0, 0, 1], false);
      return () => ({ gesto, B, O: g, pose: GESTOS_MANO.punio, zObj: 0.9, rigido: true, alinea: 0.4, polo: [0, -0.2, -0.6], capas: 'arma' });
    }
    case 'granada': {       // la granada en la mano, a la altura del pecho
      const B = baseMano([0.25, -0.95, 0.1], [0.2, 0, 1], false);
      return () => ({ gesto, B, O: [g[0], g[1] + 1], pose: GESTOS_MANO.cargador, zObj: 1.4, rigido: true, alinea: 0.3, polo: [0, -0.2, -0.6], capas: 'arma' });
    }
    case 'peldano': { const B = baseMano([0.15, -1, 0], [1, 0.2, 0], false); return () => ({ gesto, B, O: g, pose: GESTOS_MANO.punio, rigido: true, alinea: 0.2, polo: [-0.8, 0.4, -1.7] }); }
    case 'soga': { const B = baseMano([1, -0.1, 0.1], [0.1, 0, 1], false); return () => ({ gesto, B, O: g, pose: GESTOS_MANO.punio, rigido: true, alinea: 0.2, polo: [-0.8, 0.4, -1.7] }); }
    default: return ante3 => ({ gesto: 'cabeza', B: manoDesdeAntebrazo(ante3, false, -70, 72, 0), O: g, pose: GESTOS_MANO.cabeza });   // la palma sobre la cabeza
  }
}
// Brazo suelto con su mano entera (trepar, colgarse, taparse la cabeza)
function brazoSuelto(ctx, j, cual, hx, hy, armar, C) {
  const A = armarBrazo(j, cual, hx, hy, armar, cual === 'cerca' ? { lado: 1, fondo: -4 } : { lado: -1, fondo: 4 });
  pintarBrazo(ctx, A, C); pintarMano(ctx, A, C);
  return A;
}

Jugador.prototype.dibujar = function (ctx, camaraX, ahora) {
  const sx = this.x - camaraX;
  const parpadeo = ahora < this.invulnerableHasta && Math.floor(ahora / 80) % 2 === 0;
  const cuerpo = (c = ctx) => this.cuerpo(c, parpadeo);
  if (this.muerto) {
    ctx.save();
    ctx.translate(sx, this.y);
    ctx.rotate(-Math.PI / 2 * this.direccion); ctx.translate(0, 20);
    cuerpo();
    ctx.restore();
    return;
  }
  if (this.aTierra && this.cubierto > 0.3) {   // cuerpo a tierra: sombra chata debajo, no proyectada
    sombraElipse(ctx, sx, this.y + 1, 44, 5, 0.35);
    ctx.save(); ctx.translate(sx, this.y); cuerpo(); ctx.restore();
    return;
  }
  conSombra(ctx, sx, this.y, cuerpo, 0.32, alturaSuelo(this.x), true);   // sombra pareja: el cuerpo tiene muchas piezas encimadas
};

Jugador.prototype.cuerpo = function (ctx, parpadeo) {
  ctx.scale(this.direccion * ESCALA_JUGADOR, ESCALA_JUGADOR);   // más grande que el esqueleto: a la altura de los zombies
  // Con parapeto (defensa zombie) baja detrás de las bolsas; sin parapeto (defensa ultra) se tira cuerpo a tierra:
  // el cuerpo gira hasta quedar boca abajo, con la cabeza hacia adelante y el pecho en el piso
  if (this.aTierra && this.cubierto > 0.01) { const p = this.cubierto; ctx.translate(-36 * p, -9 * p); ctx.rotate(p * Math.PI / 2); }
  else if (this.cubierto > 0.01) { ctx.beginPath(); ctx.rect(-80, -200, 160, 200); ctx.clip(); ctx.translate(0, this.cubierto * 26); }
  // Agachado: todo el cuerpo baja y las piernas se doblan para que las botas sigan en el piso
  const ag = this.montada ? 0 : this.agachado;
  if (ag > 0) ctx.translate(0, ag * BAJA_AGACHADO);
  if (parpadeo && !Pincel.silueta) ctx.globalAlpha = 0.45;
  const S = skinDe(this), C = S.colores ? { ...COLORES_JUGADOR, ...S.colores } : COLORES_JUGADOR;   // personaje elegido
  const s = this.caminando ? Math.sin(this.fase) : 0;
  const enAire = !this.enSuelo && !this.montada;
  const respiro = this.caminando || enAire ? 0 : Math.sin(this.ahora / 650) * 0.6;   // respira en reposo
  const ty = (this.caminando ? -Math.abs(Math.cos(this.fase)) * 1.4 : 0) + respiro;    // el torso sube en la mitad del paso

  // Capa o faldón (detrás de todo) y mochila con manta enrollada, según el personaje
  if (S.capa) dibujarCapa(ctx, S.capa, ty, this.ahora, this.caminando ? 1 : 0);
  if (S.faldon) dibujarCapa(ctx, C.chaqueta, ty, this.ahora, this.caminando ? 0.6 : 0, 0.45);
  if (S.mochila) {   // mochila de armazón: cuerpo, tapa, bolsillo lateral, correas de compresión y la manta enrollada arriba
    const M = C.mochila;
    pintura(ctx, c => { c.moveTo(-12, -58 + ty); c.lineTo(-20.5, -58.5 + ty); c.quadraticCurveTo(-25, -58 + ty, -25, -52 + ty); c.lineTo(-24.4, -38.5 + ty); c.quadraticCurveTo(-24, -35 + ty, -20, -35 + ty); c.lineTo(-12, -35.5 + ty); }, M);
    pintura(ctx, c => { c.moveTo(-12, -58.5 + ty); c.lineTo(-21, -59 + ty); c.quadraticCurveTo(-25.6, -58.4 + ty, -25.4, -53 + ty); c.lineTo(-21, -52.4 + ty); c.lineTo(-12, -53 + ty); }, ajustarColor(M, -0.06), { sombra: 0.6 });   // tapa
    pintura(ctx, c => c.roundRect(-23.6, -48 + ty, 7.4, 9.6, 1.8), ajustarColor(M, -0.1), { sombra: 0.7 });                 // bolsillo lateral
    if (!Pincel.silueta) {
      for (const y of [-50, -41]) pintura(ctx, c => c.roundRect(-25, y + ty, 13, 1.6, 0.5), C.correa, { sombra: 0.3, brillo: false, linea: 0.3 });   // correas de compresión
      for (const y of [-49.5, -40.5]) pintura(ctx, c => c.roundRect(-16.6, y - 0.4 + ty, 2.2, 2.4, 0.4), '#8a8f96', { sombra: 0.3, linea: 0.3 });   // hebillas
      raya(ctx, ajustarColor(M, -0.35), 0.4, [[-23.4, -46 + ty], [-16.6, -46 + ty]]);                                          // cierre del bolsillo
    }
    pintura(ctx, c => c.roundRect(-26, -64.6 + ty, 15.6, 6.6, 3.3), C.manta, { sombra: 0.9, brillo: 0.35 });                // manta enrollada
    if (!Pincel.silueta) {
      raya(ctx, ajustarColor(C.manta, -0.3), 0.45, [[-24, -63.6 + ty], [-12.5, -63.6 + ty]]);
      for (const x of [-22.6, -15.6]) pintura(ctx, c => c.roundRect(x, -65 + ty, 1.8, 7.4, 0.4), C.correa, { sombra: 0.3, brillo: false, linea: 0.3 });
    }
  }

  // Lanzallamas: la mochila con los tanques (el de combustible cercano, el de nitrógeno asomando arriba, el armazón)
  const dTanques = !this.montada && DIBUJO_ARMAS[this.arma().id];
  if (dTanques && dTanques.tanques) dibujarTanques(ctx, ty);

  // Trepando una escalera o colgado de una soga: pose propia, con el arma colgada a la espalda
  if ((this.trepa || this.soga) && !this.muerto) { dibujarColgado(ctx, this, S, C); return; }

  // Piernas: la de atrás más oscura. En el aire van recogidas
  if (enAire) {
    piernaArticulada(ctx, -4, -34, 0.15, 0.8, ajustarColor(C.pantalon, -0.18), C);
    piernaArticulada(ctx, 4, -34, 0.65, 1.15, C.pantalon, C);
  } else {
    // Rodilla en tierra: la de atrás apoya la rodilla con la pierna hacia atrás; la de adelante, muslo horizontal y canilla vertical
    const mezcla = (parado, rodilla) => parado + (rodilla - parado) * ag;
    piernaArticulada(ctx, -4, -34, mezcla(-s * 0.55, -0.2), mezcla(0.75 * Math.max(0, -s), 1.7), ajustarColor(C.pantalon, -0.18), C);
    piernaArticulada(ctx, 4, -34, mezcla(s * 0.55, 1.48), mezcla(0.75 * Math.max(0, s), 1.48), C.pantalon, C);
  }

  // Brazo lejano (el derecho, el del gatillo): va detrás del torso, así no se ve su hombro; solo asoma la mano en la empuñadura
  const e = this.estadoArma();
  const dArma = DIBUJO_ARMAS[this.arma().id] || DIBUJO_ARMAS.glock;
  // cuerpo a cuerpo: el mango sigue al arma; con la palanca abierta la mano gira con el lazo
  const angMano = this.montada ? 0 : (dArma.anguloEmpunadura ?? 0.3) + e.incl - (e.palanca || 0) * GIRO_PALANCA * 0.7;
  // Con la M2: la mano del gatillo en la empuñadura de pala de abajo (16,5 detrás del cajón)
  const tapa = this.cubierto > 0.45;   // agachado, con las manos sobre la cabeza
  const gatillo = tapa ? { x: -2.5, y: -78 + ty } : this.montada ? { x: (e.origen.x - 12 - 16.5) / ESCALA_JUGADOR, y: -44 / ESCALA_JUGADOR } : { x: e.origen.x + e.manoGatillo.x, y: e.origen.y + e.manoGatillo.y };
  const Clejos = coloresLejos(C);
  if (dArma.tanques && dArma.manguera && !this.montada) {
    const m = dArma.manguera, c = Math.cos(e.incl), sn = Math.sin(e.incl);
    dibujarManguera(ctx, ty, e.origen.x + m.x * c - m.y * sn, e.origen.y + m.x * sn + m.y * c);
  }
  const golpe = (this.montada || dArma.agarre === 'hombro') ? e.empuje * 1.2 : e.empuje * 0.4;   // el hombro absorbe el retroceso
  const arma = this.arma(), d = dArma, cuerpoACuerpo = d.agarre === 'cuerpo' && !this.montada;
  // Los dos brazos se resuelven antes de dibujar nada: cada mano va en dos capas, una detrás de lo que agarra y otra delante
  const corta = d.agarre === 'pistola' && !this.montada;
  const gestoLejos = tapa ? 'cabeza' : this.montada ? 'empunadura' : cuerpoACuerpo ? 'mango' : d.agarre === 'mano' ? 'granada' : 'empunadura';
  const lejos = armarBrazo(this, 'lejos', -4 - golpe, -53 + ty, gestoGatillo(gestoLejos, [gatillo.x, gatillo.y], cuerpoACuerpo ? e.incl : angMano), { lado: -1, fondo: corta ? 7 : 3 });
  // Hombro izquierdo: con el arma al hombro el cuerpo se perfila y ese hombro va adelante (el codo cae bajo el arma);
  // con la pistola los hombros quedan de frente al blanco (posición isósceles)
  const hombroX = (tapa || this.montada ? 4 : d.agarre === 'hombro' ? 6 : d.agarre === 'pistola' ? -1 : 3) - golpe + (tapa || this.montada ? 0 : e.adelantoHombro || 0), hombroY = -52 + ty;
  const opCerca = { lado: 1, fondo: corta ? -7 : -5, afuera: 0.12 };   // el codo del brazo de apoyo cae hacia abajo, casi en el plano
  // El cargador que lleva la mano de apoyo es el de esta arma (js/cargadores.js), girado como el arma y con el agarre en la mano
  const cargadorEnMano = !this.montada && e.enMano && ES_CARGADOR.has(e.enMano) && CARGADORES[arma.id];
  let cerca, gestoCerca = e.gesto || 'apoyo', manoEn = e.mano;
  if (tapa) cerca = armarBrazo(this, 'cerca', hombroX, hombroY, gestoApoyo('cabeza', [5, -78.5 + ty], e), opCerca);
  else if (this.montada) {
    // La M2 está en el mundo, sin agrandar: la mano de apoyo en la otra empuñadura, o siguiendo la recarga de la cinta
    manoEn = { x: e.mano.x / ESCALA_JUGADOR, y: e.mano.y / ESCALA_JUGADOR };
    const recargaM2 = !!this.recarga, B = baseMano([1, 0, -0.12], [0.1, 0, -1], true);
    cerca = armarBrazo(this, 'cerca', hombroX, hombroY, recargaM2 ? gestoApoyo(gestoCerca === 'apoyo' ? 'viaja' : gestoCerca, [manoEn.x, manoEn.y], e)
      : () => ({ gesto: 'empunadura', B, O: [manoEn.x, manoEn.y], pose: GESTOS_MANO.punio, rigido: true, alinea: 0.4 }), opCerca);
  } else if (cuerpoACuerpo) {
    // Cuerpo a cuerpo: el izquierdo también en el mango (dos manos) o en guardia delante del pecho (una mano)
    if (!arma.unaMano && !e.sinCargador) cerca = armarBrazo(this, 'cerca', hombroX, hombroY, gestoApoyo('mango', [e.mano.x, e.mano.y], e), opCerca);
    else {
      const g = this.golpeActual, p = g ? limitar((this.ahora - g.inicio) / g.dur, 0, 1) : 0;
      const guardia = [9 - Math.sin(p * Math.PI) * 6, -42 + ty - Math.sin(p * Math.PI) * 4];   // contrapeso del golpe
      cerca = armarBrazo(this, 'cerca', hombroX, hombroY, ante3 => { const B = manoDesdeAntebrazo(ante3, true, 10, 15, 0); return { gesto: 'guardia', B, O: guardia, pose: GESTOS_MANO.punio }; }, opCerca);
    }
  } else {
    if (gestoCerca === 'apoyo') gestoCerca = d.agarre === 'pistola' ? 'envuelve' : d.agarre === 'mano' ? 'viaja' : d.apoyoVertical ? 'mango' : 'guardamanos';
    // Lo que lleva: el cargador se agarra a lo largo de su eje; lo demás, según hacia dónde apunta. Los dedos que envuelven
    // el cargador por el otro lado van antes que el arma (también cuando el cargador está puesto y la mano lo agarra ahí)
    let eje = null;
    if (gestoCerca === 'cargador') { const M = CARGADORES[arma.id], [ex, ey] = M ? M.eje : [0, 1], a = e.incl + e.rotMano, c = Math.cos(a), sn = Math.sin(a); eje = [-(ex * c - ey * sn), -(ex * sn + ey * c), 0]; }
    else if (gestoCerca === 'punio' && e.apuntaMano != null) eje = [Math.cos(e.apuntaMano), Math.sin(e.apuntaMano), 0];
    if (gestoCerca === 'punio' && e.enMano === 'cajaMinigun') gestoCerca = 'bandeja';
    cerca = armarBrazo(this, 'cerca', hombroX, hombroY, gestoApoyo(gestoCerca, [manoEn.x, manoEn.y], e, { eje, capas: gestoCerca === 'cargador' && !(cargadorEnMano && cargadorEnMano.encima) ? 'arma' : 'objeto' }), opCerca);
  }
  pintarBrazo(ctx, lejos, Clejos);

  // Cinturón con hebilla, cartucheras atrás y funda con pistola en el muslo (angosto como el torso de perfil)
  ctx.save(); ctx.scale(0.64, 1);
  pintura(ctx, c => c.roundRect(-12.4, -37.4, 24.6, 5.2, 1.4), C.cinturon, { sombra: 0.7 });
  pintura(ctx, c => c.roundRect(0.4, -37, 5, 4.4, 0.8), C.hebilla || '#7d8288', { sombra: 0.5, brillo: 0.5, linea: 0.35 });          // hebilla
  if (!C.sinCartucheras) for (const x of [-10.6, -4.4]) {   // portacargadores con tapa
    pintura(ctx, c => c.roundRect(x, -36.4, 5.4, 8, 1.2), C.bolsa, { sombra: 0.7 });
    pintura(ctx, c => c.roundRect(x - 0.2, -36.8, 5.8, 2.6, 0.8), ajustarColor(C.bolsa, -0.1), { sombra: 0.4, brillo: 0.2, linea: 0.35 });
  }
  // Funda de muslo: la empuñadura de la pistola asoma, y la correa abraza la pierna
  if (!C.sinFunda) {
    pintura(ctx, c => c.roundRect(6.6, -33.4, 6.8, 12.4, 1.8), C.funda, { sombra: 0.8 });
    pintura(ctx, c => c.roundRect(7.6, -36.6, 3.8, 4.6, 1), '#26272b', { sombra: 0.5, linea: 0.35 });
    pintura(ctx, c => c.roundRect(5.6, -25.6, 9, 1.8, 0.6), C.correa, { sombra: 0.3, brillo: false, linea: 0.3 });
  }
  ctx.restore();

  // Cuello, torso según el personaje (chaleco táctico, armadura, traje…) y cabeza. El cuello va antes que el torso, para
  // que salga de adentro de la ropa; cuello y cabeza con la misma inclinación (durante la recarga baja la mirada hacia el arma)
  const inclinarCabeza = () => { ctx.translate(1.4 * e.apunta - golpe * 0.8, -62 + ty + 0.9 * e.apunta); ctx.rotate(0.2 * e.mirar + 0.12 * e.apunta); ctx.scale(ESCALA_CABEZA, ESCALA_CABEZA); ctx.translate(0, 62 - ty); };
  ctx.save(); inclinarCabeza(); dibujarCuello(ctx, S, C, ty); ctx.restore();
  dibujarTorso(ctx, S, C, ty);
  ctx.save(); inclinarCabeza(); dibujarCabeza(ctx, S, C, ty, e); ctx.restore();

  // Cuerpo a tierra (suelta el arma y se tapa la cabeza con las dos manos) y la M2 (que se dibuja en el mundo): solo las manos
  if (tapa || this.montada) {
    pintarMano(ctx, lejos, Clejos);
    pintarBrazo(ctx, cerca, C);
    if (this.montada && !tapa && e.enMano) dibujarUnidad(ctx, e.enMano, manoEn.x, manoEn.y, e.apuntaMano, false, 'm2');   // la cinta, por detrás de la mano
    pintarMano(ctx, cerca, C);
    return;
  }

  // Lo que queda del otro lado del arma va antes que ella: la palma de la mano del gatillo y los dedos de la de apoyo
  pintarMano(ctx, lejos, Clejos, 'atras');
  if (cerca.capas === 'arma') pintarMano(ctx, cerca, C, 'atras');
  const dibujarCargadorEnMano = () => {
    ctx.save(); ctx.translate(e.mano.x, e.mano.y); ctx.rotate(e.incl + e.rotMano); ctx.scale(CM, CM); ctx.translate(-cargadorEnMano.agarre[0], -cargadorEnMano.agarre[1]);
    dibujarCargadorSuelto(ctx, cargadorEnMano, e.cargadorNuevo);
    ctx.restore();
  };
  // El cargador que entra o sale va antes que el arma, así el pozo o la empuñadura tapan lo que todavía está adentro
  if (cargadorEnMano && !cargadorEnMano.encima) dibujarCargadorEnMano();
  ctx.save(); ctx.translate(e.origen.x, e.origen.y); ctx.rotate(e.incl); d.dibujar(ctx, e); ctx.restore();
  if (e.peine) dibujarPeineEnArma(ctx, e.peine, arma.id);
  pintarMano(ctx, lejos, Clejos, 'adelante');

  // Brazo izquierdo (de apoyo): va por delante de todo y es el único hombro que se ve. Lo que lleva la mano se dibuja
  // antes que ella: queda detrás de la palma y de los nudillos, y solo los dedos que lo envuelven por el otro lado van antes
  pintarBrazo(ctx, cerca, C);
  if (cerca.capas === 'objeto') pintarMano(ctx, cerca, C, 'atras');
  if (cargadorEnMano) { if (cargadorEnMano.encima) dibujarCargadorEnMano(); }
  else if (e.enMano) dibujarUnidad(ctx, e.enMano, e.mano.x, e.mano.y, e.apuntaMano, e.cajaNueva, arma.id);
  pintarMano(ctx, cerca, C, cerca.capas ? 'adelante' : null);
};

/* Mochila del lanzallamas M2 en la espalda: dos tanques de combustible (de perfil se ve el cercano, con domos arriba y
 * abajo), el tanque esférico de nitrógeno que asoma arriba entre los dos, el armazón y las válvulas */
function dibujarTanques(ctx, ty) {
  const OD = '#4b5434';
  pintura(ctx, c => c.roundRect(-14.5, -63 + ty, 3.2, 28, 1), '#2f3322', { sombra: 0.4 });                                   // armazón contra la espalda
  pintura(ctx, c => c.arc(-20.5, -64.5 + ty, 5.2, 0, Math.PI * 2), ajustarColor(OD, -0.12), { sombra: 0.8, brillo: 0.3 });   // nitrógeno
  pintura(ctx, c => { c.moveTo(-27.5, -60 + ty); c.quadraticCurveTo(-27.5, -66 + ty, -21, -66 + ty); c.quadraticCurveTo(-14.5, -66 + ty, -14.5, -60 + ty);
    c.lineTo(-14.5, -39 + ty); c.quadraticCurveTo(-14.5, -33 + ty, -21, -33 + ty); c.quadraticCurveTo(-27.5, -33 + ty, -27.5, -39 + ty); }, OD, { sombra: 1.1, brillo: 0.35 });   // combustible
  if (!Pincel.silueta) {
    for (const y of [-58, -40]) raya(ctx, ajustarColor(OD, -0.35), 0.5, [[-27.3, y + ty], [-14.7, y + ty]]);                   // costuras de soldadura
    ctx.fillStyle = '#d8d0b0'; ctx.font = '700 2.6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('M2', -21, -48 + ty); ctx.textAlign = 'start';
  }
  pintura(ctx, c => c.roundRect(-22.6, -69 + ty, 3.2, 3.4, 0.6), '#3a3c3e', { sombra: 0.4 });                               // válvula de arriba
  pintura(ctx, c => c.roundRect(-18.6, -34.4 + ty, 4, 2.6, 0.6), '#3a3c3e', { sombra: 0.4 });                               // salida de la manguera
}
// Manguera de goma: sale de abajo del tanque, baja por detrás de la cadera y sube a la válvula de la lanza (x, y)
function dibujarManguera(ctx, ty, x, y) {
  ctx.save(); ctx.lineCap = 'round';
  const trazado = () => { ctx.beginPath(); ctx.moveTo(-16.6, -32.6 + ty); ctx.bezierCurveTo(-17, -16 + ty, x - 16, y + 18, x, y); };
  trazado(); ctx.strokeStyle = tinta('#1c1d1b'); ctx.lineWidth = 2.6; ctx.stroke();
  if (!Pincel.silueta) { trazado(); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.7; ctx.stroke(); }
  ctx.restore();
}

/* Lo que puede llevar la mano durante una recarga, con su forma propia (nueva: la que trae, no la que saca).
 * apunta: hacia dónde va la punta (radianes en el marco del cuerpo; 0 = hacia adelante): la bala, el cartucho, el peine,
 * el cohete y la granada de 40 giran con la mano y con el arma, no van siempre parados. Las balas y los cartuchos son
 * los del calibre del arma (armaId; js/municion.js), a escala. */
function dibujarUnidad(ctx, tipo, x, y, apunta = -Math.PI / 2, nueva = false, armaId = null) {
  const laton = TONOS_MUNICION.laton[1];
  ctx.save(); ctx.translate(x, y);
  switch (tipo) {
    case 'bala': case 'cartucho': case 'granada40':   // de a una: el cartucho de esa arma, con el centro en la mano
      ctx.rotate(apunta); ctx.scale(CM, CM); cartuchoEn(ctx, calibreDe(armaId), 0, 0); ctx.restore(); return;
    case 'peine':
      ctx.rotate(apunta); ctx.scale(CM, CM); dibujarPeine(ctx, armaId); ctx.restore(); return;
    case 'speedloader':
      ctx.rotate(apunta); ctx.scale(CM, CM); dibujarCargadorRapido(ctx, armaId); ctx.restore(); return;
    case 'cinta':     // el tramo de cinta cuelga de la mano: las balas, paradas
      ctx.rotate(apunta + Math.PI / 2); ctx.scale(CM, CM); dibujarCinta(ctx, armaId || 'm2'); ctx.restore(); return;
    case 'pasador':     // anilla con el pasador recién sacado, colgando de un dedo
      if (!Pincel.silueta) { ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.strokeStyle = tinta('#b8b8b8'); ctx.lineWidth = 0.8; ctx.stroke();
        ctx.strokeStyle = tinta('#9a9a9a'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(1.6, 1.4); ctx.lineTo(3.4, 5.4); ctx.lineTo(4.2, 5.0); ctx.stroke(); }
      ctx.restore(); return;
  }
  ctx.rotate(apunta + Math.PI / 2);   // lo que sigue está dibujado parado (la punta hacia arriba)
  switch (tipo) {
    case 'cajaMinigun':   // la caja de munición de la minigun, apoyada en la palma (js/armas-especiales.js)
      ctx.scale(CM, CM); cajaMinigun(ctx, 0, 1.6, nueva); break;
    case 'cargador':
      parte(ctx, -2, 0, 5, 11, '#222'); ctx.fillStyle = tinta(laton); ctx.fillRect(-1.5, -1.5, 4, 1.8);
      ctx.fillStyle = tinta('#444'); ctx.fillRect(-2.5, 9, 6, 2); break;
    case 'cargador-curvo':
      parte(ctx, -2, 0, 5, 5, '#3a3a3a'); parte(ctx, -1, 4, 5, 4, '#3a3a3a'); parte(ctx, 0, 7, 5, 4, '#3a3a3a');
      ctx.fillStyle = tinta(laton); ctx.fillRect(-1.5, -1.5, 4, 1.8); break;
    case 'cargador-plano':
      parte(ctx, -12, -2, 24, 3.5, '#4a4f4a'); ctx.fillStyle = tinta(laton); for (let k = 0; k < 6; k++) ctx.fillRect(-10 + k * 4, -1.5, 2, 1); break;
    case 'tambor-cargador':
      esfera(ctx, 1, 4, 6.5, '#1e2226'); parte(ctx, -1.5, -2, 5, 4, '#2b2f33'); ctx.fillStyle = tinta('#3a3f44'); ctx.fillRect(-2, 3, 6, 1.5); break;
    case 'cohete':
      parte(ctx, -1.6, -4, 3.2, 9, '#4b5634'); ctx.fillStyle = tinta('#3a3a3a');
      ctx.beginPath(); ctx.moveTo(-1.6, -4); ctx.lineTo(0, -7.5); ctx.lineTo(1.6, -4); ctx.fill(); ctx.fillRect(-2.6, 4, 5.2, 1.6); break;
    case 'coheteRpg':   // granada PG-7V: motor oscuro abajo, cabeza de guerra verde con banda amarilla y espoleta arriba
      parte(ctx, -1.2, 2, 2.4, 9, '#2e302c'); ctx.fillStyle = tinta('#4a5532');
      ctx.beginPath(); ctx.moveTo(-1.2, 2); ctx.lineTo(-2.8, -0.4); ctx.lineTo(-2.8, -5.6); ctx.lineTo(-0.8, -10.4); ctx.lineTo(0.8, -10.4); ctx.lineTo(2.8, -5.6); ctx.lineTo(2.8, -0.4); ctx.lineTo(1.2, 2); ctx.fill();
      ctx.fillStyle = tinta('#d6c36a'); ctx.fillRect(-2.8, -3.4, 5.6, 0.7); ctx.fillStyle = tinta('#1d1e1c'); ctx.fillRect(-0.6, -12, 1.2, 1.8); break;
    case 'granada':
      esfera(ctx, 0, 0, 5, '#3d5a2a'); parte(ctx, -1.5, -7, 3, 3, '#999'); parte(ctx, 1, -6.5, 4, 1.5, '#777'); break;
    case 'ignicion':    // cilindro de ignición del lanzallamas, con los culotes de los cartuchos
      parte(ctx, -3, -2.6, 6, 5.2, '#4b5434');
      if (!Pincel.silueta) { ctx.fillStyle = laton; for (const x of [-1.5, 0, 1.5]) { ctx.beginPath(); ctx.arc(x, -2.4, 0.5, 0, Math.PI * 2); ctx.fill(); } }
      break;
    case 'celda':
      if (!Pincel.silueta) { ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 8; }
      esfera(ctx, 0, 0, 3.5, '#39ff14'); break;
  }
  ctx.restore();
}

/* Peine apoyado en la guía del cajón, con las balas hacia adelante: van bajando al depósito a medida que el pulgar empuja */
function dibujarPeineEnArma(ctx, peine, armaId) {
  const cal = calibreDe(armaId), n = armaId === 'garand' ? 4 : 5, alto = n * cal.d * 1.08;
  ctx.save(); ctx.translate(peine.x, peine.y); ctx.rotate(peine.incl || 0); ctx.scale(CM, CM); ctx.translate(0, -alto / 2 - 0.2);
  dibujarPeine(ctx, armaId, Math.ceil(n * peine.restante));
  ctx.restore();
}

/* Trepando una escalera de mano: de perfil contra la escalera, las manos se turnan en los barrotes de arriba y las
 * piernas suben de a un escalón (una rodilla arriba mientras la otra estira). Colgado de una soga: las dos manos
 * arriba, una sobre la otra, y las piernas juntas, balanceándose un poco. El arma va colgada a la espalda. */
function dibujarColgado(ctx, j, S, C) {
  const Clejos = coloresLejos(C);
  const pantalonLejos = ajustarColor(C.pantalon, -0.18);
  // Arma a la espalda, en diagonal
  ctx.save(); ctx.translate(-14, -50); ctx.rotate(-1.05);
  pieza(ctx, redondo(-20, -2.5, 40, 5, 2), '#26272b', -20, 20); detalle(ctx, '#3a3c42', c => c.rect(-6, -2.5, 10, 2));
  ctx.restore();
  if (j.trepa) {
    const T = j.trepa, peldanos = Math.abs(T.y1 - T.y0) / 12, c = Math.sin(T.f * peldanos * Math.PI);   // un ciclo cada dos barrotes
    const sube = Math.max(0, c), baja = Math.max(0, -c);
    piernaArticulada(ctx, -2, -34, 0.35 + 0.75 * baja, 0.45 + 1.1 * baja, pantalonLejos, C);
    brazoSuelto(ctx, j, 'lejos', -3, -53, gestoGatillo('peldano', [7, -74 - 9 * baja], 0), Clejos);
    const mirarArriba = () => { ctx.translate(2, -62); ctx.rotate(-0.18); ctx.scale(ESCALA_CABEZA, ESCALA_CABEZA); ctx.translate(0, 62); };   // mira hacia arriba
    ctx.save(); mirarArriba(); dibujarCuello(ctx, S, C, 0); ctx.restore();
    dibujarTorso(ctx, S, C, 0);
    ctx.save(); mirarArriba(); dibujarCabeza(ctx, S, C, 0, j.estadoArma()); ctx.restore();
    piernaArticulada(ctx, 3, -34, 0.35 + 0.75 * sube, 0.45 + 1.1 * sube, C.pantalon, C);
    brazoSuelto(ctx, j, 'cerca', 4, -52, gestoApoyo('peldano', [8, -74 - 9 * sube], { incl: 0 }), C);
    return;
  }
  // Colgado de la soga
  const vaiven = Math.sin(j.ahora / 260) * 0.12;
  piernaArticulada(ctx, -2, -34, 0.1 + vaiven, 0.35, pantalonLejos, C);
  brazoSuelto(ctx, j, 'lejos', -3, -53, gestoGatillo('soga', [0, -78], 0), Clejos);
  const colgado = () => { ctx.translate(1, -62); ctx.rotate(-0.12); ctx.scale(ESCALA_CABEZA, ESCALA_CABEZA); ctx.translate(0, 62); };
  ctx.save(); colgado(); dibujarCuello(ctx, S, C, 0); ctx.restore();
  dibujarTorso(ctx, S, C, 0);
  ctx.save(); colgado(); dibujarCabeza(ctx, S, C, 0, j.estadoArma()); ctx.restore();
  piernaArticulada(ctx, 3, -34, 0.25 + vaiven, 0.5, C.pantalon, C);
  brazoSuelto(ctx, j, 'cerca', 4, -52, gestoApoyo('soga', [1, -70], { incl: 0 }), C);
}
