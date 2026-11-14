/* ===== Anatomía: hasta dónde llega cada articulación, y brazos, manos y piernas dibujados con eso =====
 * El cuerpo se ve de costado, pero los brazos y las manos se resuelven en tres dimensiones (x hacia adelante, y hacia
 * abajo, z hacia el que mira) y después se proyectan: así el codo cae donde cae el de una persona, un brazo que viene
 * hacia el que mira se ve en escorzo en vez de encogerse, y la mano puede girar hacia cualquier lado y envolver lo que
 * agarra (lo que queda del otro lado de lo agarrado se dibuja antes; lo de este lado, después).
 *
 * ANATOMIA: rangos de movimiento normales de un adulto, en grados (valores de referencia de la American Academy of
 * Orthopaedic Surgeons; para los dedos, las medias de los estudios de goniometría). Son los límites de todo lo que
 * sigue: una articulación no se dobla más que esto ni hacia donde no puede.
 * HUESOS: largos en unidades del cuerpo. Brazo, antebrazo y mano guardan entre sí la proporción de las tablas de
 * Drillis y Contini (0,186, 0,146 y 0,108 de la altura); se dejan un 8 % más largos porque las armas están
 * agrandadas respecto del cuerpo y, si no, la mano de apoyo no llega al guardamanos.
 */
const GRADOS = Math.PI / 180;
const ANATOMIA = {
  hombro: { flexion: 180, extension: 60 },             // el brazo sube por delante hasta la vertical; hacia atrás, 60°
  codo: { flexion: 150, extension: 0 },                // bisagra: dobla hacia adelante y no pasa de recto
  antebrazo: { pronacion: 85, supinacion: 85 },        // giro de la palma desde la posición neutra (el pulgar arriba)
  muneca: { flexion: 80, extension: 70, radial: 20, cubital: 30 },
  dedo: { nudillo: 90, media: 100, punta: 80 },        // las tres articulaciones de cada dedo, de la palma a la punta
  pulgar: { nudillo: 55, punta: 80 },
  cadera: { flexion: 120, extension: 20 }, rodilla: { flexion: 140, extension: 0 }, tobillo: { arriba: 20, abajo: 50 },
};
const HUESOS = { brazo: 15.6, antebrazo: 13.2, muslo: 14.5, canilla: 14, tobillo: 5.5 };

/* ---------- Vectores de tres componentes ---------- */
const V3 = {
  suma: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  resta: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  por: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  punto: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cruz: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  largo: a => Math.hypot(a[0], a[1], a[2]),
  unidad: (a, respaldo = [1, 0, 0]) => { const l = Math.hypot(a[0], a[1], a[2]); return l > 1e-6 ? [a[0] / l, a[1] / l, a[2] / l] : respaldo; },
  mezcla: (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k],
  // gira `a` hacia `b` hasta que el ángulo entre los dos sea `ang` (los dos de largo 1)
  hacia: (a, b, ang) => {
    const c = limitar(V3.punto(a, b), -1, 1), total = Math.acos(c);
    if (total < 1e-4) return a;
    const k = ang / total, s = Math.sin(total), wa = Math.sin((1 - k) * total) / s, wb = Math.sin(k * total) / s;
    return V3.unidad([b[0] * wa + a[0] * wb, b[1] * wa + a[1] * wb, b[2] * wa + a[2] * wb]);
  },
};

/* ---------- Pintura mate ----------
 * Como `pintura` (dos tonos con la luz arriba a la izquierda), pero sin el filo de brillo, que era lo que hacía que la
 * tela y los guantes parecieran de plástico, y con el contorno por detrás del relleno: cuando varias piezas del mismo
 * color se pasan juntas en un solo trazado (un brazo entero: hombro, codo y antebrazo), el contorno queda únicamente en
 * la silueta del conjunto y no dibuja un círculo en cada articulación. */
function forma(ctx, trazar, color, op = {}) {
  ctx.beginPath(); trazar(ctx);
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fill(); return; }
  const linea = op.linea ?? 0.42;
  if (linea) { ctx.strokeStyle = ajustarColor(color, -(op.borde ?? 0.52)); ctx.lineWidth = linea * 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  const corre = op.sombra ?? 1;
  ctx.fillStyle = corre ? ajustarColor(color, -(op.oscuro ?? 0.22)) : color; ctx.fill();
  if (!corre) return;
  ctx.save(); ctx.clip(); ctx.translate(-corre * 0.6, -corre);
  ctx.beginPath(); trazar(ctx); ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}
// Tramo de un miembro como trazado cerrado: ancho w0 al principio y w1 al final, extremos redondos y una panza de
// cada lado (atras, adelante: cuánto abulta; en: en qué parte del largo). «Atrás» es el lado de la normal (-uy, ux):
// en una pierna parada, la pantorrilla; en un brazo estirado hacia adelante, el lado de abajo.
function tramoMusculo(x0, y0, x1, y1, w0, w1, atras = 0, adelante = 0, enAtras = 0.4, enAdelante = 0.4) {
  return c => {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy);
    if (l < 0.05) { c.moveTo(x0 + Math.max(w0, w1) / 2, y0); c.arc(x0, y0, Math.max(w0, w1) / 2, 0, Math.PI * 2); c.closePath(); return; }
    const ux = dx / l, uy = dy / l, nx = -uy, ny = ux, tn = Math.atan2(ny, nx);
    const p = (k, s, w) => [x0 + dx * k + nx * s * w, y0 + dy * k + ny * s * w];
    const m = k => (w0 + (w1 - w0) * k) / 2;
    c.moveTo(...p(0, 1, w0 / 2));
    c.quadraticCurveTo(...p(enAtras, 1, m(enAtras) + atras * 2), ...p(1, 1, w1 / 2));
    c.arc(x1, y1, w1 / 2, tn, tn - Math.PI, true);
    c.quadraticCurveTo(...p(enAdelante, -1, m(enAdelante) + adelante * 2), ...p(0, -1, w0 / 2));
    c.arc(x0, y0, w0 / 2, tn - Math.PI, tn - 2 * Math.PI, true);
    c.closePath();
  };
}
const juntos = (...tramos) => c => { for (const t of tramos) t(c); };
// Polígono convexo que envuelve a los puntos (para la palma proyectada), y su trazado con las esquinas redondeadas
function envolvente(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), giro = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const abajo = [], arriba = [];
  for (const q of p) { while (abajo.length >= 2 && giro(abajo[abajo.length - 2], abajo[abajo.length - 1], q) <= 0) abajo.pop(); abajo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (arriba.length >= 2 && giro(arriba[arriba.length - 2], arriba[arriba.length - 1], q) <= 0) arriba.pop(); arriba.push(q); }
  return abajo.slice(0, -1).concat(arriba.slice(0, -1));
}
function trazarRedondeado(c, pts, r) {
  const n = pts.length;
  if (n < 3) { if (n) { c.moveTo(pts[0][0] + r, pts[0][1]); c.arc(pts[0][0], pts[0][1], r, 0, Math.PI * 2); c.closePath(); } return; }
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[i], d = pts[(i + 1) % n];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, l2 = Math.hypot(d[0] - b[0], d[1] - b[1]) || 1, k1 = Math.min(r, l1 / 2), k2 = Math.min(r, l2 / 2);
    const e = [b[0] - (b[0] - a[0]) / l1 * k1, b[1] - (b[1] - a[1]) / l1 * k1], s = [b[0] + (d[0] - b[0]) / l2 * k2, b[1] + (d[1] - b[1]) / l2 * k2];
    if (i === 0) c.moveTo(e[0], e[1]); else c.lineTo(e[0], e[1]);
    c.quadraticCurveTo(b[0], b[1], s[0], s[1]);
  }
  c.closePath();
}

/* ---------- Brazo ----------
 * Hombro en (hx, hy) y muñeca en (mx, my), los dos en el dibujo. La mano puede estar más adentro o más afuera que el
 * hombro (op.fondo: z de la muñeca respecto del hombro), que es lo normal: los hombros están a los costados y lo que
 * se agarra, en el medio. Con el largo verdadero de los huesos sale el ángulo del codo (nunca más de
 * ANATOMIA.codo.flexion ni menos que recto) y el codo cae sobre un círculo alrededor de la línea hombro–muñeca; se
 * elige el punto de ese círculo hacia donde tira el brazo de verdad: abajo, un poco hacia afuera y, si la mano agarra
 * algo, en línea con ella (op.mano: hacia dónde van los dedos), para que la muñeca no tenga que quebrarse. Si así el
 * brazo quedara más atrás de lo que da el hombro (ANATOMIA.hombro.extension), el codo se abre hacia el costado.
 * lado: 1 el brazo cercano (su «afuera» es hacia el que mira), -1 el lejano.
 * Devuelve el codo proyectado, el ángulo del antebrazo en el dibujo y su dirección en 3D (para la muñeca). */
function resolverBrazo(hx, hy, mx, my, op = {}) {
  const L1 = op.L1 ?? HUESOS.brazo, L2 = op.L2 ?? HUESOS.antebrazo, lado = op.lado ?? 1;
  const dx = mx - hx, dy = my - hy, d2 = dx * dx + dy * dy;
  let dz = op.fondo ?? 0, D = Math.sqrt(d2 + dz * dz);
  const Dmin = Math.sqrt(L1 * L1 + L2 * L2 - 2 * L1 * L2 * Math.cos((180 - ANATOMIA.codo.flexion) * GRADOS)), Dmax = (L1 + L2) * 0.997;
  if (D < Dmin) { dz = (dz < 0 || (!dz && lado > 0) ? -1 : 1) * Math.sqrt(Math.max(0, Dmin * Dmin - d2)); D = Math.max(Dmin, Math.sqrt(d2)); }   // demasiado cerca del hombro: el codo no dobla más, la mano queda más adentro
  let estira = 1;
  if (D > Dmax) {   // no llega: primero se saca profundidad (el brazo se pone de perfil) y, si aun así no alcanza, se estira apenas
    dz = Math.sign(dz) * Math.sqrt(Math.max(0, Dmax * Dmax - d2)); D = Math.sqrt(d2 + dz * dz);
    if (D > Dmax) estira = D / Dmax;
  }
  const l1 = L1 * estira, l2 = L2 * estira, a = [dx / D, dy / D, dz / D];
  const t = (l1 * l1 - l2 * l2 + D * D) / (2 * D), rho = Math.sqrt(Math.max(0, l1 * l1 - t * t));
  const sube = Math.max(0, -a[1]);   // con la mano por encima del hombro, el codo va hacia adelante
  const base = [-0.3 + sube * 1.4, 1, lado * (op.afuera ?? 0.5)];
  if (op.mano) { const k = op.alinea ?? 1.1; base[0] -= op.mano[0] * k; base[1] -= op.mano[1] * k; base[2] -= op.mano[2] * k; }
  if (op.polo) { base[0] += op.polo[0]; base[1] += op.polo[1]; base[2] += op.polo[2]; }
  let codo = null;
  for (let paso = 0; paso < 7; paso++) {
    const g = [base[0] + paso * 0.35, base[1], base[2] + lado * paso * 0.8];           // cada vuelta, más hacia el costado
    const n = V3.unidad(V3.resta(g, V3.por(a, V3.punto(g, a))), [0, 1, 0]);
    codo = [a[0] * t + n[0] * rho, a[1] * t + n[1] * rho, a[2] * t + n[2] * rho];
    // Hombro: ángulo del brazo en el plano de costado, desde colgando (0) hacia adelante (+) o hacia atrás (-)
    const atras = Math.atan2(-codo[0], codo[1]) / GRADOS;
    if (codo[1] < 0 || atras <= ANATOMIA.hombro.extension) break;                       // (por encima del hombro vale: es flexión)
  }
  const ante = V3.unidad([dx - codo[0], dy - codo[1], dz - codo[2]]);
  const flexion = 180 - Math.acos(limitar((l1 * l1 + l2 * l2 - D * D) / (2 * l1 * l2), -1, 1)) / GRADOS;
  const extension = codo[1] < 0 ? 0 : Math.max(0, Math.atan2(-codo[0], codo[1]) / GRADOS);   // cuánto va el brazo hacia atrás
  return { cx: hx + codo[0], cy: hy + codo[1], cz: codo[2], ante: Math.atan2(my - hy - codo[1], mx - hx - codo[0]), ante3: ante, brazo3: V3.unidad(codo), flexion, extension, fondo: dz, estira };
}

/* ---------- Mano ----------
 * La mano es un esqueleto chico: la palma, cuatro dedos de tres falanges y el pulgar, en su propio marco:
 *   x  hacia la punta de los dedos      a  hacia el lado del pulgar      b  hacia donde mira la palma
 * Una base { ex, ea, eb } (tres vectores en el marco del cuerpo) dice cómo está orientada, y con eso se proyecta de
 * costado. La mano derecha y la izquierda son la misma espejada (zurda: la del brazo cercano, que es el izquierdo). */
const MANO = {
  muneca: 2.2,                                                             // de la muñeca al centro de la palma
  palma: { x0: -2.2, x1: 1.9, a0: 1.12, a1: 1.66, b0: -0.55, b1: 0.72 },   // semiancho en la muñeca y en los nudillos; dorso y palma
  // índice, mayor, anular y meñique: dónde nace (x, a), las tres falanges, el grosor, cuánto más cierra y hacia dónde se abre
  dedos: [
    { x: 1.9, a: 1.2, l: [1.78, 1.08, 0.84], w: 0.84, k: 0.94, abre: 9 },
    { x: 2.06, a: 0.4, l: [1.95, 1.22, 0.88], w: 0.86, k: 1, abre: 2 },
    { x: 1.9, a: -0.4, l: [1.8, 1.12, 0.86], w: 0.82, k: 1.04, abre: -5 },
    { x: 1.62, a: -1.16, l: [1.38, 0.82, 0.76], w: 0.72, k: 1.1, abre: -13 },
  ],
  // Pulgar: nace cerca de la muñeca, del lado de a; tres tramos (el primero va por dentro de la palma) y cuatro gestos
  pulgar: { base: [-1.3, 1.12, 0.3], l: [1.9, 1.45, 1.2], w: [1.3, 1.06, 0.92],
    gestos: {
      suelto: [[0.72, 0.6, 0.34], [0.86, 0.45, 0.22], [0.92, 0.32, 0.2]],       // relajado, apenas separado del índice
      largo: [[0.85, 0.42, 0.3], [0.96, 0.2, 0.18], [0.98, 0.1, 0.15]],         // estirado junto al índice (sobre el armazón)
      cierra: [[0.55, 0.45, 0.7], [0.5, -0.35, 0.8], [0.25, -0.75, 0.6]],       // cruza por delante de la palma: envuelve
      arriba: [[0.35, 0.9, 0.25], [0.25, 0.95, 0.15], [0.2, 0.97, 0.1]],        // separado hacia su lado
      sube: [[0.2, 0.5, 0.84], [0.1, 0.35, 0.93], [0.1, 0.2, 0.97]],            // hacia donde mira la palma (sube por el costado de lo que sostiene)
    } },
};
// Base de la mano a partir de hacia dónde van los dedos y hacia dónde mira la palma
function baseMano(dedos, palma, zurda) {
  const ex = V3.unidad(dedos), eb = V3.unidad(V3.resta(palma, V3.por(ex, V3.punto(palma, ex))), [0, 0, zurda ? -1 : 1]);
  const ea = V3.cruz(ex, eb);
  return { ex, eb, ea: zurda ? V3.por(ea, -1) : ea, zurda: !!zurda };
}
/* Base de la mano siguiendo al antebrazo, con los ángulos de una persona: giro (pronación +, supinación -; 0 = neutra,
 * la palma hacia el cuerpo), flexion de la muñeca (hacia la palma +) y desvio (hacia el pulgar +). Todo se limita a
 * ANATOMIA: es la manera de pedir una pose que no se puede hacer mal. ante3: dirección del antebrazo. */
function manoDesdeAntebrazo(ante3, zurda, giro = 0, flexion = 0, desvio = 0) {
  const A = ANATOMIA, g = limitar(giro, -A.antebrazo.supinacion, A.antebrazo.pronacion) * GRADOS;
  const f = limitar(flexion, -A.muneca.extension, A.muneca.flexion) * GRADOS, d = limitar(desvio, -A.muneca.cubital, A.muneca.radial) * GRADOS;
  const ex0 = V3.unidad(ante3), medial = [0, 0, zurda ? -1 : 1];
  const m = V3.unidad(V3.resta(medial, V3.por(ex0, V3.punto(medial, ex0))), [0, 1, 0]);            // neutra: la palma mira hacia el cuerpo
  const p = V3.por(V3.cruz(ex0, m), zurda ? 1 : -1);                                                // pronada: con el brazo hacia adelante, la palma hacia abajo
  let eb = V3.suma(V3.por(m, Math.cos(g)), V3.por(p, Math.sin(g)));
  let ex = V3.suma(V3.por(ex0, Math.cos(f)), V3.por(eb, Math.sin(f)));                              // flexión: los dedos van hacia la palma
  eb = V3.resta(V3.por(eb, Math.cos(f)), V3.por(ex0, Math.sin(f)));
  const ea = V3.por(V3.cruz(ex, eb), zurda ? -1 : 1);
  ex = V3.suma(V3.por(ex, Math.cos(d)), V3.por(ea, Math.sin(d)));                                   // desvío hacia el pulgar
  return baseMano(ex, eb, zurda);
}
/* Límite de la muñeca para una mano que tiene que quedar orientada de cierta manera (agarrando algo): si para eso la
 * muñeca tuviera que doblarse más de lo que da, los dedos giran hacia el antebrazo hasta el límite. Cuánto da depende
 * de hacia dónde se dobla: hacia la palma (flexión), hacia el dorso (extensión) o de costado (desvíos). */
function limitarMuneca(B, ante3) {
  const A = ANATOMIA.muneca, f = V3.unidad(ante3), c = limitar(V3.punto(B.ex, f), -1, 1), ang = Math.acos(c);
  if (ang < 0.02) return B;
  const lado = V3.unidad(V3.resta(B.ex, V3.por(f, c)));                         // hacia dónde está doblada
  let cb = V3.punto(lado, B.eb), ca = V3.punto(lado, B.ea);
  const n = Math.hypot(cb, ca) || 1; cb /= n; ca /= n;                          // cuánto es flexión o extensión y cuánto desvío
  const tope = Math.hypot(cb * (cb > 0 ? A.flexion : A.extension), ca * (ca > 0 ? A.radial : A.cubital)) * GRADOS;
  if (ang <= tope) return B;
  const ex = V3.hacia(f, B.ex, tope);
  return baseMano(ex, B.eb, B.zurda);
}
// Mezcla dos bases (para pasar de una pose a otra girando de a poco)
function mezclarBases(A, B, k) {
  if (!A) return B;
  return baseMano(V3.mezcla(A.ex, B.ex, k), V3.mezcla(A.eb, B.eb, k), B.zurda);
}
const POSE_MANO = { cierre: [0.2, 0.2, 0.2, 0.2], nudillo: 1, abre: 0.5, pulgar: { suelto: 1, largo: 0, cierra: 0, arriba: 0, sube: 0 } };
function normalizarPose(p = {}) {
  const c = p.cierre ?? 0.2, pulgar = Object.assign({ suelto: 0, largo: 0, cierra: 0, arriba: 0, sube: 0 }, p.pulgar || { suelto: 1 });
  return { cierre: Array.isArray(c) ? c.slice(0, 4) : [c, c, c, c], nudillo: p.nudillo ?? 1, abre: p.abre ?? 0.5, pulgar };
}
function mezclarPoses(A, B, k) {
  if (!A) return B;
  const pulgar = {}; for (const g in B.pulgar) pulgar[g] = A.pulgar[g] + (B.pulgar[g] - A.pulgar[g]) * k;
  return { cierre: B.cierre.map((c, i) => A.cierre[i] + (c - A.cierre[i]) * k), nudillo: A.nudillo + (B.nudillo - A.nudillo) * k, abre: A.abre + (B.abre - A.abre) * k, pulgar };
}

/* Dibuja la mano. O: centro de la palma en el dibujo [x, y]; B: su base; pose: normalizarPose(); G: color del guante.
 * capa: 'atras' dibuja solo lo que queda más lejos que lo agarrado (zObjeto: su profundidad respecto de la palma),
 * 'adelante' el resto, y sin capa, todo. Cada dedo es una sola forma (las tres falanges en un trazado), pintada mate. */
function dibujarMano(ctx, O, B, pose, G, capa = null, zObjeto = 0) {
  const { ex, ea, eb } = B, M = MANO, P = M.palma;
  const pr = (x, a, b) => [O[0] + ex[0] * x + ea[0] * a + eb[0] * b, O[1] + ex[1] * x + ea[1] * a + eb[1] * b, ex[2] * x + ea[2] * a + eb[2] * b];
  const piezas = [];   // { z, trazar, tono }
  let orden = 0;
  const cadena = (pts, anchos, tono) => {   // tramos consecutivos; se parte donde cruza la profundidad de lo agarrado
    let grupo = null; orden++;
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], z = (p[2] + q[2]) / 2, lejos = z < zObjeto - 0.02;
      const t = tramoMusculo(p[0], p[1], q[0], q[1], anchos[i], anchos[i + 1]);
      if (grupo && grupo.lejos === lejos) { grupo.tramos.push(t); grupo.z = Math.max(grupo.z, z); }
      else { grupo = { lejos, tramos: [t], z: i === 0 && !lejos ? Math.max(z, 0.002 + orden * 1e-4) : z, tono }; piezas.push(grupo); }   // el nudillo va por encima de la palma: el dedo sale de ella
    }
  };
  // Dedos: cada articulación dobla hacia la palma lo que pide el cierre, hasta su límite
  const D = ANATOMIA.dedo;
  M.dedos.forEach((d, k) => {
    const c = limitar(pose.cierre[k] * d.k, 0, 1.08), sep = d.abre * pose.abre * (1 - Math.min(1, c * 1.6)) * GRADOS;
    const f1 = Math.min(D.nudillo, 7 + 80 * c * pose.nudillo) * GRADOS, f2 = f1 + Math.min(D.media, 12 + 90 * c) * GRADOS, f3 = f2 + Math.min(D.punta, 7 + 62 * c) * GRADOS;
    let x = d.x, a = d.a, b = 0.05;
    const pts = [pr(x, a, b)];
    for (const [l, f] of [[d.l[0], f1], [d.l[1], f2], [d.l[2], f3]]) { x += l * Math.cos(f) * Math.cos(sep); a += l * Math.cos(f) * Math.sin(sep); b += l * Math.sin(f); pts.push(pr(x, a, b)); }
    cadena(pts, [d.w, d.w * 0.96, d.w * 0.9, d.w * 0.8], 0);
  });
  // Pulgar: mezcla de gestos
  const Q = M.pulgar, pts = [pr(...Q.base)];
  let pos = Q.base.slice();
  for (let i = 0; i < 3; i++) {
    let dir = [0, 0, 0];
    for (const g in pose.pulgar) if (pose.pulgar[g]) { const v = V3.unidad(Q.gestos[g][i]); dir = V3.suma(dir, V3.por(v, pose.pulgar[g])); }
    dir = V3.unidad(dir, V3.unidad(Q.gestos.suelto[i]));
    const desde = i === 0 ? 0.55 : 0;   // el primer tramo va por dentro de la palma: asoma la mitad
    if (i === 0) { const q = V3.suma(pos, V3.por(dir, Q.l[0] * desde)); pts[0] = pr(...q); }
    pos = V3.suma(pos, V3.por(dir, Q.l[i]));
    pts.push(pr(...pos));
  }
  cadena(pts, [Q.w[0], Q.w[1], Q.w[2], Q.w[2] * 0.84], 0.03);
  // Palma: la caja de la palma proyectada, con el bulto de la base del pulgar
  const caja = [];
  for (const b of [P.b0, P.b1]) {   // muñeca angosta, el canto de la mano, y el arco de los nudillos (más salido en el mayor)
    caja.push(pr(P.x0, P.a0, b), pr(P.x0, -P.a0, b), pr(-0.4, P.a1 * 0.98, b), pr(-0.2, -P.a1, b), pr(P.x1 - 0.1, P.a1, b), pr(P.x1 + 0.22, 0.4, b), pr(P.x1 + 0.05, -0.45, b), pr(P.x1 - 0.38, -P.a1 * 0.96, b));
  }
  caja.push(pr(P.x0 + 1.0, P.a0 + 0.2, P.b1 + 0.32));                                    // el bulto de la base del pulgar
  const casco = envolvente(caja.map(q => [q[0], q[1]]));
  piezas.push({ lejos: zObjeto > 0.02, tramos: [c => trazarRedondeado(c, casco, 0.55)], z: 0.001, tono: 0 });   // la palma queda detrás de lo agarrado si eso está más cerca del que mira
  piezas.sort((p, q) => p.z - q.z);
  const zMax = piezas[piezas.length - 1].z;
  for (const p of piezas) {
    if (capa && (capa === 'atras') !== !!p.lejos) continue;
    const hondo = limitar((zMax - p.z) / 3.2, 0, 1);
    forma(ctx, juntos(...p.tramos), ajustarColor(G, p.tono - 0.15 * hondo), { linea: 0.3, sombra: 0.45, oscuro: 0.16, borde: 0.48 });
  }
  // Con el dorso hacia el que mira, la marca de cada nudillo (una rayita, del tono del guante)
  if (capa !== 'atras' && eb[2] < -0.3 && !Pincel.silueta) {
    const alfa = ctx.globalAlpha;
    ctx.strokeStyle = ajustarColor(G, -0.3); ctx.lineWidth = 0.22; ctx.lineCap = 'round'; ctx.globalAlpha = alfa * Math.min(1, (-eb[2] - 0.3) * 2.5);
    ctx.beginPath();
    for (const d of M.dedos) { const p = pr(d.x - 0.25, d.a - d.w * 0.3, P.b0), q = pr(d.x - 0.05, d.a, P.b0), t = pr(d.x - 0.25, d.a + d.w * 0.3, P.b0); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(q[0], q[1], t[0], t[1]); }
    ctx.stroke(); ctx.globalAlpha = alfa;
  }
}
// La muñeca de una mano cuya palma está en O
const munecaDe = (O, B) => [O[0] - B.ex[0] * MANO.muneca, O[1] - B.ex[1] * MANO.muneca];
