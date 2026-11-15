/* ===== Zona Muerta VR: las armas del juego pasadas a 3D =====
 * El modelo 2D de cada arma (js/armas-modelos*.js) pinta polígonos en cm. Acá se graban esos polígonos con la
 * transformación del lienzo (algunas piezas se dibujan corridas o giradas con ctx.translate/rotate: la bomba de la
 * Mossberg, el quiebre del M79) y cada uno se vuelve una pieza 3D:
 *   - extruida con su espesor: culatas, cajones, correderas, empuñaduras, hojas;
 *   - torneada alrededor de su eje: cañones, tubos, miras telescópicas, cohetes, granadas, mangos.
 * Lo que se mueve (corredera, cerrojo, bomba, quiebre) va en su propio grupo, con el movimiento que sale de comparar el
 * dibujo en reposo con el dibujo en el otro extremo: un desplazamiento o un giro alrededor de su pivote.
 * Marco del modelo: cm, x hacia la boca, y hacia arriba, z hacia el lado derecho del arma (el de la ventana). */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const REPOSO = { sinCargador: false, corredera: 0, cerrojo: 0, abierto: 0, bombeo: 0, palanca: 0, tapa: 0 };

/* ---------- Grabar lo que pinta el juego ---------- */
// Polígonos en cm con y hacia abajo, como el dibujo; con la transformación del lienzo aplicada
export function grabarDibujo(dibujar) {
  const lista = [], original = window.pintar;
  window.pintar = (ctx, pts, color, op = {}) => {
    const m = ctx.getTransform(), tf = ([x, y]) => [(m.a * x + m.c * y + m.e) / CM, (m.b * x + m.d * y + m.f) / CM];
    lista.push({ pts: pts.map(tf), color, huecos: (op.huecos || []).map(h => h.map(tf)) });
  };
  const c = document.createElement('canvas').getContext('2d');
  try { dibujar(c); } finally { window.pintar = original; }
  return lista;
}
export const grabarArma = (id, estado = {}) => grabarDibujo(c => DIBUJO_ARMAS[id].dibujar(c, { ...REPOSO, ...estado }));
// El cargador entero (también lo que va dentro del pozo o de la empuñadura), en su lugar en el arma
export const grabarCargador = id => grabarDibujo(c => { c.scale(CM, CM); CARGADORES[id].dibujar(c, true, false); });
/* Los trazos del dibujo (ctx.stroke de líneas, curvas y arcos): guardamontes, colas del disparador, alambres. Se
 * siguen los comandos del trazado con la transformación de cada momento (como hace el lienzo) y, al trazar, quedan
 * { lineas: [[x, y] cm, y abajo], ancho (cm), color, alfa }. Los trazados de un Path2D no se ven: se ignoran (son el
 * bisel y el acabado, que van en la textura). */
export function grabarTrazos(dibujar) {
  const lista = [], c = document.createElement('canvas').getContext('2d');
  let lineas = [], actual = null;
  const tf = (x, y) => { const m = c.getTransform(); return [(m.a * x + m.c * y + m.e) / CM, (m.b * x + m.d * y + m.f) / CM]; };
  const ultimo = () => actual && actual.length ? actual[actual.length - 1] : null;
  const nueva = p => { actual = [p]; lineas.push(actual); };
  const agregar = p => { if (!actual) nueva(p); else actual.push(p); };
  const proto = CanvasRenderingContext2D.prototype, en = (u, a) => [u.x, u.y];
  const inversa = () => c.getTransform().inverse();
  const desdeDisp = ([x, y]) => { const m = inversa(); return [m.a * x * CM + m.c * y * CM + m.e, m.b * x * CM + m.d * y * CM + m.f]; };   // del último punto (cm) al espacio actual
  c.beginPath = function () { lineas = []; actual = null; return proto.beginPath.call(this); };
  c.moveTo = function (x, y) { nueva(tf(x, y)); return proto.moveTo.call(this, x, y); };
  c.lineTo = function (x, y) { agregar(tf(x, y)); return proto.lineTo.call(this, x, y); };
  c.closePath = function () { if (actual && actual.length > 1) actual.push([...actual[0]]); actual = null; return proto.closePath.call(this); };
  c.rect = function (x, y, w, h) { nueva(tf(x, y)); agregar(tf(x + w, y)); agregar(tf(x + w, y + h)); agregar(tf(x, y + h)); agregar(tf(x, y)); actual = null; return proto.rect.call(this, x, y, w, h); };
  c.quadraticCurveTo = function (cx, cy, x, y) {
    const u = ultimo(); const [x0, y0] = u ? desdeDisp(u) : [cx, cy];
    for (let k = 1; k <= 8; k++) { const t = k / 8, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, d = t * t; agregar(tf(a * x0 + b * cx + d * x, a * y0 + b * cy + d * y)); }
    return proto.quadraticCurveTo.call(this, cx, cy, x, y);
  };
  c.bezierCurveTo = function (ax, ay, bx, by, x, y) {
    const u = ultimo(); const [x0, y0] = u ? desdeDisp(u) : [ax, ay];
    for (let k = 1; k <= 10; k++) { const t = k / 10, s = 1 - t; agregar(tf(s * s * s * x0 + 3 * s * s * t * ax + 3 * s * t * t * bx + t * t * t * x, s * s * s * y0 + 3 * s * s * t * ay + 3 * s * t * t * by + t * t * t * y)); }
    return proto.bezierCurveTo.call(this, ax, ay, bx, by, x, y);
  };
  const arco = (x, y, rx, ry, rot, a0, a1, ccw) => {
    let d = a1 - a0; if (!ccw && d < 0) d += Math.PI * 2 * Math.ceil(-d / (Math.PI * 2)); if (ccw && d > 0) d -= Math.PI * 2 * Math.ceil(d / (Math.PI * 2));
    if (Math.abs(a1 - a0) >= Math.PI * 2) d = ccw ? -Math.PI * 2 : Math.PI * 2;
    const n = Math.max(4, Math.ceil(Math.abs(d) / (Math.PI / 12))), cr = Math.cos(rot), sr = Math.sin(rot);
    for (let k = 0; k <= n; k++) { const a = a0 + d * k / n, px = Math.cos(a) * rx, py = Math.sin(a) * ry; agregar(tf(x + px * cr - py * sr, y + px * sr + py * cr)); }
  };
  c.arc = function (x, y, r, a0, a1, ccw = false) { arco(x, y, r, r, 0, a0, a1, ccw); return proto.arc.call(this, x, y, r, a0, a1, ccw); };
  c.ellipse = function (x, y, rx, ry, rot, a0, a1, ccw = false) { arco(x, y, rx, ry, rot, a0, a1, ccw); return proto.ellipse.call(this, x, y, rx, ry, rot, a0, a1, ccw); };
  c.stroke = function (camino) {
    if (!camino) {
      const m = c.getTransform(), escala = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / CM;
      lista.push({ lineas: lineas.filter(l => l.length > 1).map(l => l.map(p => [...p])), ancho: c.lineWidth * escala, color: typeof c.strokeStyle === 'string' ? c.strokeStyle : null, alfa: c.globalAlpha });
    }
    return camino ? proto.stroke.call(this, camino) : proto.stroke.call(this);
  };
  const original = window.pintar;
  window.pintar = (ctx, pts, color, op = {}) => {};   // los polígonos van aparte (grabarDibujo)
  try { dibujar(c); } finally { window.pintar = original; }
  return lista;
}
export const grabarTrazosArma = (id, estado = {}) => grabarTrazos(c => DIBUJO_ARMAS[id].dibujar(c, { ...REPOSO, ...estado }));

/* El dibujo entero del juego, con su acabado de cerca (degradados, veta, cuadriculado, bisel, desgaste, grabados,
 * tornillos: lo que pinta js/armas-modelos.js a más de 3 px/cm), en un lienzo. uv(x, y) da dónde cae un punto del
 * modelo (cm, y arriba). dibujar() lo pinta (cuesta: se llama de a una arma, cuando conviene). Los bordes se corren
 * unos píxeles hacia afuera: los cantos de las piezas y los niveles chicos de la textura toman el color del borde y no
 * el negro del fondo. */
export function texturaDeArma(id) {
  const c0 = caja(grabarArma(id).flatMap(p => p.pts)), largo = c0.x1 - c0.x0, alto = c0.y1 - c0.y0;
  const R = Math.max(4, Math.min(8, 1024 / Math.max(largo, alto))), m = 12;   // px por cm: las cortas, más detalle
  const W = Math.ceil(largo * R + 2 * m), H = Math.ceil(alto * R + 2 * m);
  const lienzo = document.createElement('canvas'); lienzo.width = W; lienzo.height = H;
  const tex = new THREE.CanvasTexture(lienzo); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const dibujar = () => {
    const g = lienzo.getContext('2d');
    g.setTransform(R / CM, 0, 0, R / CM, m - c0.x0 * R, m - c0.y0 * R);
    DIBUJO_ARMAS[id].dibujar(g, { ...REPOSO });
    g.setTransform(1, 0, 0, 1, 0, 0);
    const copia = document.createElement('canvas'); copia.width = W; copia.height = H; const gc = copia.getContext('2d');
    for (const d of [1, 2, 3, 5]) {   // 11 px en cuatro pasadas
      gc.clearRect(0, 0, W, H); gc.drawImage(lienzo, 0, 0);
      g.globalCompositeOperation = 'destination-over';
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) g.drawImage(copia, dx * d, dy * d);
    }
    g.globalCompositeOperation = 'source-over';
    tex.needsUpdate = true;
  };
  return { tex, dibujar, uv: (x, y) => [((x - c0.x0) * R + m) / W, 1 - ((-y - c0.y0) * R + m) / H] };
}
// ¿Está el punto (cm, y abajo) dentro de alguno de los polígonos?
function adentro(base, [x, y]) {
  for (const p of base) {
    let dentro = false;
    for (const forma of [p.pts, ...(p.huecos || [])]) for (let i = 0, j = forma.length - 1; i < forma.length; j = i++) {
      const [xi, yi] = forma[i], [xj, yj] = forma[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) dentro = !dentro;
    }
    if (dentro) return true;
  }
  return false;
}
// Un trazo en el aire, como varilla: un tubo por la línea (cm, en el plano del dibujo)
function varilla(linea, radio, mat) {
  const pts = linea.map(([x, y]) => v3(x, -y, 0)), camino = new THREE.CurvePath();
  for (let i = 0; i + 1 < pts.length; i++) if (pts[i].distanceToSquared(pts[i + 1]) > 1e-6) camino.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  if (!camino.curves.length) return null;
  const cerrada = pts[0].distanceTo(pts[pts.length - 1]) < 1e-3;
  return new THREE.Mesh(new THREE.TubeGeometry(camino, Math.max(2, camino.curves.length * 2), radio, 6, cerrada), mat);
}

export const caja = pts => { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { x0, x1, y0, y1 }; };

/* ---------- Materiales ---------- */
function texturaCanvas(w, h, dibujar, repetir) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; dibujar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repetir); }
  return t;
}
const veta = texturaCanvas(512, 128, (g, w, h) => {   // veta de la madera, a lo largo del arma
  g.fillStyle = '#e2c4a4'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 46; k++) { const y = Math.random() * h; g.strokeStyle = `rgba(70,30,10,${0.08 + Math.random() * 0.2})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y - 6 + Math.random() * 12, w * 0.7, y - 6 + Math.random() * 12, w, y + Math.random() * 4); g.stroke(); }
}, [1 / 30, 1 / 8]);
const grano = texturaCanvas(128, 128, (g, w, h) => {   // textura fina de polímero y de goma
  g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 1800; k++) { const v = 190 + Math.random() * 60 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * w, Math.random() * h, 1, 1); }
}, [1 / 6, 1 / 6]);
// Qué es cada color del dibujo: madera (marrón saturado), goma (casi negro), metal (gris) o pintura/polímero
export function tipoDeColor(hex) {
  const hsl = {}; new THREE.Color(hex).getHSL(hsl);
  if (hsl.s > 0.38 && hsl.h < 0.12 && hsl.l > 0.12 && hsl.l < 0.5) return 'madera';
  if (hsl.l < 0.1) return 'goma';
  if (hsl.s < 0.2) return 'metal';
  return 'pintura';
}
const AJUSTES = {
  madera: { roughness: 0.5, metalness: 0.02, envMapIntensity: 0.6, map: veta },
  metal: { roughness: 0.38, metalness: 0.65, envMapIntensity: 1 },
  polimero: { roughness: 0.62, metalness: 0.04, envMapIntensity: 0.5, map: grano },
  goma: { roughness: 0.9, metalness: 0, envMapIntensity: 0.3, map: grano },
  pintura: { roughness: 0.5, metalness: 0.12, envMapIntensity: 0.7 },
  laton: { roughness: 0.28, metalness: 0.9, envMapIntensity: 1 },
  brillo: { roughness: 0.25, metalness: 0.1, envMapIntensity: 1, emissiveIntensity: 0.9 },
};
// Con el dibujo del juego como textura (def.textura): la luz ya viene pintada, el metal refleja menos
const CON_TEXTURA = { metal: { roughness: 0.42, metalness: 0.35 }, laton: { roughness: 0.34, metalness: 0.45 }, madera: { roughness: 0.55 }, goma: { roughness: 0.85 }, polimero: { roughness: 0.7 } };
const materiales = new Map();
export function material(color, tipo = tipoDeColor(color)) {
  const clave = color + ':' + tipo;
  if (!materiales.has(clave)) {
    const a = AJUSTES[tipo] || AJUSTES.pintura;
    const m = new THREE.MeshStandardMaterial({ color, ...a });
    if (tipo === 'brillo') m.emissive = new THREE.Color(color);
    materiales.set(clave, m);
  }
  return materiales.get(clave);
}

/* ---------- Piezas ---------- */
export function contorno(pts, huecos = []) {   // el polígono del dibujo (y hacia abajo) como forma de Three (y hacia arriba)
  const forma = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, -y)));
  for (const h of huecos) forma.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, -y))));
  return forma;
}
// Extruida: ocupa justo de z0 a z1 (con el bisel adentro; sin bisel si es fina)
export function extruir(pts, huecos, mat, z0, z1) {
  const b = z1 - z0 > 0.5 ? 0.12 : 0;
  const g = new THREE.ExtrudeGeometry(contorno(pts, huecos), { depth: Math.max(0.01, z1 - z0 - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b ? 0.1 : 0, bevelSegments: 1, curveSegments: 3 });
  g.translate(0, 0, z0 + b);
  return new THREE.Mesh(g, mat);
}
// Corte de un polígono con una recta x = c (eje 'x') o y = c (eje 'y'): el tramo que ocupa, [mín, máx] o null
function tramo(pts, eje, c) {
  let a = Infinity, b = -Infinity;
  const [u, w] = eje === 'x' ? [0, 1] : [1, 0];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    if ((p[u] - c) * (q[u] - c) > 0 || p[u] === q[u]) { if (p[u] === c) { a = Math.min(a, p[w]); b = Math.max(b, p[w]); } continue; }
    const t = (c - p[u]) / (q[u] - p[u]), v = p[w] + t * (q[w] - p[w]);
    a = Math.min(a, v); b = Math.max(b, v);
  }
  return a <= b ? [a, b] : null;
}
/* Torneada: superficie de revolución que sigue el ancho del polígono a lo largo de su eje.
 *   eje 'x' (horizontal: cañones, tubos, miras) o 'y' (vertical: mangos, perillas)
 *   centro: fijo (cm, en coordenadas del dibujo) o el medio del polígono en cada estación
 *   radio: fijo, o la mitad del ancho del polígono en cada estación */
export function tornear(pts, mat, op = {}) {
  const eje = op.eje || 'x', c = caja(pts), [a0, a1] = eje === 'x' ? [c.x0, c.x1] : [c.y0, c.y1];
  const largo = a1 - a0, alto = eje === 'x' ? c.y1 - c.y0 : c.x1 - c.x0, lados = op.lados || (alto < 2 ? 10 : 16);
  const estaciones = new Set();
  const n = Math.max(2, Math.min(40, Math.round(largo / 1.5)));
  for (let k = 0; k <= n; k++) estaciones.add(+(a0 + largo * (k / n) * 0.999 + largo * 0.0005).toFixed(4));
  for (const p of pts) { const s = eje === 'x' ? p[0] : p[1]; if (s > a0 + 0.01 && s < a1 - 0.01) { estaciones.add(+(s - 0.005).toFixed(4)); estaciones.add(+(s + 0.005).toFixed(4)); } }
  const anillos = [];
  for (const s of [...estaciones].sort((p, q) => p - q)) {
    const t = tramo(pts, eje, s); if (!t) continue;
    const centro = op.centro ?? (t[0] + t[1]) / 2, radio = op.radio ?? Math.max(Math.abs(t[1] - centro), Math.abs(centro - t[0]));
    anillos.push([s, centro, radio]);
  }
  const pos = [], idx = [];
  const punto = (s, centro, r, ang) => eje === 'x' ? [s, -(centro + Math.cos(ang) * r), Math.sin(ang) * r] : [centro + Math.cos(ang) * r, -s, Math.sin(ang) * r];
  anillos.forEach(([s, centro, r]) => { for (let k = 0; k < lados; k++) pos.push(...punto(s, centro, r, k / lados * Math.PI * 2)); });
  for (let i = 0; i + 1 < anillos.length; i++) for (let k = 0; k < lados; k++) {
    const a = i * lados + k, b = i * lados + (k + 1) % lados, cc = a + lados, d = b + lados;
    if (eje === 'x') idx.push(a, cc, b, b, cc, d); else idx.push(a, b, cc, b, d, cc);
  }
  for (const [i, sentido] of [[0, -1], [anillos.length - 1, 1]]) {   // tapas
    if (!anillos[i]) continue;
    const [s, centro] = anillos[i], m = pos.length / 3; pos.push(...punto(s, centro, 0, 0));
    for (let k = 0; k < lados; k++) { const a = i * lados + k, b = i * lados + (k + 1) % lados; const ida = (eje === 'x') === (sentido > 0); idx.push(...(ida ? [m, a, b] : [m, b, a])); }
  }
  const uv = []; for (let q = 0; q < pos.length / 3; q++) uv.push(((eje === 'x' ? pos[q * 3] : pos[q * 3 + 1]) - a0) / 30, (q % lados) / lados);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

/* ---------- Movimiento de una parte: lo que cambia el dibujo de un extremo al otro ---------- */
// Ajuste rígido en el plano (dibujo, y hacia abajo): ángulo y pivote, o un desplazamiento si no gira
function ajusteRigido(A, B) {
  const ca = [0, 0], cb = [0, 0]; for (const p of A) { ca[0] += p[0]; ca[1] += p[1]; } for (const p of B) { cb[0] += p[0]; cb[1] += p[1]; }
  ca[0] /= A.length; ca[1] /= A.length; cb[0] /= B.length; cb[1] /= B.length;
  let sn = 0, cs = 0; for (let i = 0; i < A.length; i++) { const ax = A[i][0] - ca[0], ay = A[i][1] - ca[1], bx = B[i][0] - cb[0], by = B[i][1] - cb[1]; sn += ax * by - ay * bx; cs += ax * bx + ay * by; }
  const ang = Math.atan2(sn, cs);
  if (Math.abs(ang) < 0.01) return { ang: 0, dx: cb[0] - ca[0], dy: cb[1] - ca[1] };
  // pivote: el punto que el giro deja quieto, p = R·(p − ca) + cb
  const c = Math.cos(ang), s = Math.sin(ang), rx = cb[0] - (c * ca[0] - s * ca[1]), ry = cb[1] - (s * ca[0] + c * ca[1]);
  const det = (1 - c) * (1 - c) + s * s, px = ((1 - c) * rx - s * ry) / det, py = (s * rx + (1 - c) * ry) / det;
  return { ang, px, py };
}
// Pone el grupo de la parte en la fracción t del recorrido (0 reposo … 1 el otro extremo), en el marco 3D (y arriba)
function moverParte(g, a, t) {
  if (!a.ang) { g.position.set(a.dx * t, -a.dy * t, 0); g.rotation.z = 0; return; }
  const phi = -a.ang * t, c = Math.cos(phi), s = Math.sin(phi), px = a.px, py = -a.py;
  g.rotation.z = phi; g.position.set(px - (c * px - s * py), py - (s * px + c * py), 0);
}

/* ---------- El arma entera ---------- */
// Qué pieza del otro dibujo es cada una del reposo: la del mismo lugar si los dos traen las mismas piezas en el mismo
// orden (casi todas); si no, la primera libre del mismo color y la misma cantidad de puntos (la escopeta de dos caños
// pinta la báscula y los martillos antes o después de los cañones según esté abierta o cerrada)
function emparejar(base, otro) {
  const firma = p => p.color + ':' + p.pts.length;
  if (base.length === otro.length && base.every((p, i) => firma(p) === firma(otro[i]))) return base.map((_, i) => i);
  const usados = new Set();
  return base.map(p => { const j = otro.findIndex((q, k) => !usados.has(k) && firma(q) === firma(p)); if (j >= 0) usados.add(j); return j; });
}
/* def: { id,
 *   piezas: { [índice]: { t, z, redonda: 'x' | 'y' | { eje, centro, radio, lados }, omitir, techo, partir, material, parte } },
 *   materiales: { color: tipo },  espesor(caja, pieza): espesor por defecto (cm),
 *   movimientos: { nombre: { estado, piezas? } },  cargador: true | false,
 *   extras(h): agrega piezas propias (miras, perillas, el cerrojo que el dibujo no tiene) }
 * Devuelve { raiz, partes: { nombre: { grupo, mover(t) } }, cargador (grupo puesto), cargadorSuelto(), base } */
export function construirArma(def) {
  const id = def.id, base = grabarArma(id), conf = def.piezas || {};
  const raiz = new THREE.Group(), partes = {}, dueno = new Map();
  for (const [nombre, m] of Object.entries(def.movimientos || {})) {
    const dibujado = grabarArma(id, { [m.estado]: m.valor ?? 1 }), par = emparejar(base, dibujado), otro = base.map((_, i) => dibujado[par[i]]);
    const piezas = m.piezas || base.map((_, i) => i).filter(i => otro[i] && JSON.stringify(otro[i].pts) !== JSON.stringify(base[i].pts));
    const A = piezas.flatMap(i => base[i].pts), B = piezas.flatMap(i => otro[i].pts.slice(0, base[i].pts.length));
    const ajuste = A.length === B.length && A.length ? ajusteRigido(A, B) : { ang: 0, dx: 0, dy: 0 };
    const grupo = new THREE.Group(); raiz.add(grupo);
    partes[nombre] = { grupo, ajuste, piezas, t: 0, mover(t) { this.t = t; moverParte(grupo, ajuste, t); } };
    for (const i of piezas) if (!dueno.has(i)) dueno.set(i, nombre);
  }
  // Lo que se va con el cargador (lo que deja de pintarse sin cargador)
  const cargador = new THREE.Group(); raiz.add(cargador);
  if (def.cargador !== false) {
    const sin = grabarArma(id, { sinCargador: true }), clave = p => p.color + ':' + p.pts.length + ':' + p.pts[0].map(v => v.toFixed(2)).join(',');
    const quedan = new Set(sin.map(clave));
    base.forEach((p, i) => { if (!quedan.has(clave(p)) && !dueno.has(i)) dueno.set(i, '#cargador'); });
  }
  const tipos = def.materiales || {};
  /* Con textura (def.textura), cada pieza lleva el dibujo del juego de costado: un material por tipo (brillo y metal)
   * para todas. Hasta que el dibujo esté pintado (arma.pintarTextura(), de a una arma), cada pieza se ve de su color
   * (colores por vértice); después, el dibujo. */
  const tex = def.textura ? texturaDeArma(id) : null, conTextura = new Map();
  const mat = (color, tipo) => {
    tipo = tipo || tipos[color]; if (!tex) return material(color, tipo);
    const t = tipo || tipoDeColor(color);
    if (!conTextura.has(t)) {
      // el dibujo trae su veta, su grano y su luz: menos metálico que sin textura, si no el color lo pone el reflejo del galpón
      const a = { ...(AJUSTES[t] || AJUSTES.pintura), ...(CON_TEXTURA[t] || {}) }; delete a.map;
      const m = new THREE.MeshStandardMaterial({ ...a, color: 0xffffff, vertexColors: true });
      m.userData.textura = t; conTextura.set(t, m);
    }
    return conTextura.get(t);
  };
  const proyectar = (malla, color) => {   // uv de costado ((x, y) del modelo → el lugar en el dibujo) y el color de la pieza
    if (!tex || !malla.material.userData.textura) return;
    const p = malla.geometry.attributes.position, uv = new Float32Array(p.count * 2), col = new Float32Array(p.count * 3), c = new THREE.Color(color);
    for (let i = 0; i < p.count; i++) { const [u, v] = tex.uv(p.getX(i), p.getY(i)); uv[2 * i] = u; uv[2 * i + 1] = v; col[3 * i] = c.r; col[3 * i + 1] = c.g; col[3 * i + 2] = c.b; }
    malla.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); malla.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  };
  const espesor = def.espesor || ((c) => Math.max(0.8, Math.min(3.0, (c.y1 - c.y0) * 0.55)));
  const piezaDe = (p, c, i) => {
    const k = conf[i] || {}, m = mat(p.color, k.material);
    let pts = p.pts;
    if (k.techo != null) pts = pts.map(([x, y]) => [x, Math.max(y, -k.techo)]);   // recorta lo que pasa de esa altura (cm, y arriba)
    if (k.redonda) { const r = typeof k.redonda === 'string' ? { eje: k.redonda } : k.redonda; const malla = tornear(pts, m, r); if (k.z) malla.position.z = k.z; return [malla]; }
    const t = k.t ?? espesor(c, p), z = k.z ?? 0;
    if (k.partir) {   // la hoja del alza: partida por la muesca
      const g = k.partir / 2; return [extruir(pts, p.huecos, m, z + g, z + t / 2), extruir(pts, p.huecos, m, z - t / 2, z - g)];
    }
    return [extruir(pts, p.huecos, m, z - t / 2, z + t / 2)];
  };
  base.forEach((p, i) => {
    const k = conf[i] || {}; if (k.omitir) return;
    const c = caja(p.pts), mallas = piezaDe(p, c, i);
    const d = k.parte || dueno.get(i), destino = d === '#cargador' ? cargador : d ? partes[d].grupo : raiz;
    for (const malla of mallas) { malla.userData.pieza = i; proyectar(malla, p.color); destino.add(malla); }
  });
  /* Con def.trazos, lo que el dibujo traza con líneas en el aire (fuera de las piezas: guardamontes, colas del
   * disparador, alambres) va como varilla; los trazos sobre una pieza (ranuras, rayas, grabados) ya están en la textura.
   * Cada varilla va con la parte que la mueve o con el cargador, como las piezas. */
  if (def.trazos) {
    const solida = t => t.color && t.alfa > 0.85 && t.ancho >= 0.3 && !/rgba\([^)]*,\s*0?\.[0-7]\d*\s*\)/.test(t.color);
    // en el aire: lo que queda fuera de las piezas mide al menos 0,8 cm y el 40 % del trazo (las marcas que apenas
    // asoman de una vara fina, como las runas del Gungnir, quedan en la textura)
    const enAire = l => {
      let total = 0, fuera = 0;
      for (let j = 0; j + 1 < l.length; j++) {
        const [x0, y0] = l[j], [x1, y1] = l[j + 1], d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 0.2));
        for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; total += d / n; if (!adentro(base, [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t])) fuera += d / n; }
      }
      return fuera >= 0.8 && fuera >= 0.4 * total;
    };
    const reposo = grabarTrazosArma(id), firma = t => t.lineas.map(l => l.map(p => p.map(v => v.toFixed(2)).join(',')).join(';')).join('|');
    const movidos = Object.entries(def.movimientos || {}).map(([nombre, m]) => ({ nombre, otro: grabarTrazosArma(id, { [m.estado]: m.valor ?? 1 }) }));
    const sinCargador = def.cargador !== false ? new Set(grabarTrazosArma(id, { sinCargador: true }).map(firma)) : null;
    reposo.forEach((t, i) => {
      if (!solida(t)) return;
      const mueve = movidos.find(o => o.otro[i] && firma(o.otro[i]) !== firma(t));
      const destino = mueve ? partes[mueve.nombre].grupo : sinCargador && !sinCargador.has(firma(t)) ? cargador : raiz;
      for (const l of t.lineas) {
        if (!enAire(l)) continue;
        const color = t.color.startsWith('#') ? t.color : '#232429', v = varilla(l, t.ancho / 2, mat(color)); if (!v) continue;
        v.userData.pieza = 1000 + i; proyectar(v, color); destino.add(v);
      }
    });
  }
  const arma = { raiz, partes, cargador, base, mat, extruir, tornear, grabarArma };
  // Pinta el dibujo del juego y lo pone en las piezas (una vez)
  arma.pintarTextura = tex ? () => { arma.pintarTextura = null; tex.dibujar(); for (const m of conTextura.values()) { m.map = tex.tex; m.vertexColors = false; m.needsUpdate = true; } } : null;
  // El cargador entero, para soltarlo o tenerlo en la mano: el de CARGADORES si el arma lo tiene
  arma.cargadorSuelto = () => {
    const g = new THREE.Group();
    const pols = typeof CARGADORES !== 'undefined' && CARGADORES[id] ? grabarCargador(id) : null;
    if (pols && pols.length) for (const p of pols) { const c = caja(p.pts), t = def.anchoCargador ?? Math.min(2.6, (c.y1 - c.y0) * 0.5), m = extruir(p.pts, p.huecos, material(p.color, tipos[p.color]), -t / 2, t / 2); m.userData.pieza = -1; g.add(m); }
    else for (const m of cargador.children) g.add(m.clone());
    fusionar(g);
    return g;
  };
  if (def.extras) def.extras(arma);
  fusionar(raiz); fusionar(cargador); for (const pa of Object.values(partes)) fusionar(pa.grupo);
  return arma;
}
// Las piezas fijas (las del dibujo que quedaron sueltas en la raíz) se juntan en una malla por material: cada arma
// pasa de decenas de llamadas de dibujo a unas pocas. Lo que se mueve o se cambia queda en sus grupos.
export function fusionar(raiz, todas = false) {
  const porMaterial = new Map();
  for (const m of [...raiz.children]) {
    if (!m.isMesh || (!todas && m.userData.pieza === undefined)) continue;
    m.updateMatrix(); const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!m.material.vertexColors && g.attributes.color) g.deleteAttribute('color');
    if (m.material.vertexColors && !g.attributes.color) g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
    g.clearGroups();
    if (!porMaterial.has(m.material)) porMaterial.set(m.material, []);
    porMaterial.get(m.material).push(g); raiz.remove(m);
  }
  for (const [mat, gs] of porMaterial) raiz.add(new THREE.Mesh(gs.length > 1 ? mergeGeometries(gs) : gs[0], mat));
}
