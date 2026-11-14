/* ===== Zona Muerta VR: el zombie caminante en 3D =====
 * El caminante del juego (js/zombie.js): piel verde, ojos amarillos hundidos, boca abierta con dientes y sangre,
 * camisa escocesa azul abierta con una herida en el pecho, pantalón marrón roto a media pierna y descalzo; encorvado,
 * con los brazos hacia adelante.
 * El cuerpo es una sola superficie: un campo de distancia con signo hecho de primitivas anatómicas (pelvis, costillas,
 * pectorales, trapecio, deltoides, bíceps, cuádriceps, gemelos…) unidas con mínimo suave, sin costuras ni «pelotas
 * unidas», que se vuelve malla con surface nets. Las manos van en una malla más fina (dedos largos con uñas de garra).
 * La ropa son capas a 1 cm del cuerpo, recortadas con bordes rotos. Todo lleva piel (SkinnedMesh) sobre 19 huesos y
 * el color sale por vértice: el verde de la piel, manchas, sangre y la oclusión que da el mismo campo (los pliegues
 * se oscurecen solos). Camina hacia el jugador, reacciona a cada impacto, se cae, muerde y vuelve a aparecer. */
import * as THREE from 'three';
import { fusionar } from './modelo3d.js';

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = t => t * t * (3 - 2 * t);

/* ---------- Ruido 3D (valor) para manchas y bordes rotos ---------- */
function hash3(x, y, z) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function ruido3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = suave(xf), v = suave(yf), w = suave(zf), L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), L(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
    L(L(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), L(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w);
}
const fbm = (x, y, z) => ruido3(x, y, z) * 0.6 + ruido3(x * 2.1 + 7, y * 2.1, z * 2.1) * 0.3 + ruido3(x * 4.3, y * 4.3 + 3, z * 4.3) * 0.1;

/* ---------- Primitivas con signo (m) ---------- */
// Cono redondeado entre a y b con radios ra y rb; elipsoide (aproximación de Íñigo Quílez); mínimo y máximo suaves
function dCono(px, py, pz, p) {
  const bx = p.b[0] - p.a[0], by = p.b[1] - p.a[1], bz = p.b[2] - p.a[2], qx = px - p.a[0], qy = py - p.a[1], qz = pz - p.a[2];
  const t = limitar((qx * bx + qy * by + qz * bz) / p.l2, 0, 1), dx = qx - bx * t, dy = qy - by * t, dz = qz - bz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (p.ra + (p.rb - p.ra) * t);
}
function dElipsoide(px, py, pz, p) {
  const x = (px - p.c[0]) / p.r[0], y = (py - p.c[1]) / p.r[1], z = (pz - p.c[2]) / p.r[2];
  const k0 = Math.sqrt(x * x + y * y + z * z), k1 = Math.sqrt((x / p.r[0]) ** 2 + (y / p.r[1]) ** 2 + (z / p.r[2]) ** 2);
  return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(...p.r);
}
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
class Forma {   // unión suave de primitivas (con lo que se resta, como las cuencas de los ojos)
  constructor() { this.prims = []; this.restas = []; }
  elip(c, r, hueso, k = 0.02, sim = false) { this.agregar({ tipo: 'e', c, r, hueso, k }, sim); return this; }
  cono(a, b, ra, rb, hueso, k = 0.02, sim = false) { this.agregar({ tipo: 'c', a, b, ra, rb, hueso, k }, sim); return this; }
  quitar(c, r, k = 0.008, sim = false) { const p = { tipo: 'e', c, r, k }; this.restas.push(this.preparar(p)); if (sim) this.restas.push(this.preparar({ ...p, c: [-c[0], c[1], c[2]] })); return this; }
  agregar(p, sim) { this.prims.push(this.preparar(p)); if (sim) this.prims.push(this.preparar(espejo(p))); }
  preparar(p) {
    if (p.tipo === 'c') { p.l2 = (p.b[0] - p.a[0]) ** 2 + (p.b[1] - p.a[1]) ** 2 + (p.b[2] - p.a[2]) ** 2 || 1e-9; p.bc = [(p.a[0] + p.b[0]) / 2, (p.a[1] + p.b[1]) / 2, (p.a[2] + p.b[2]) / 2]; p.br = Math.sqrt(p.l2) / 2 + Math.max(p.ra, p.rb); p.d = dCono; }
    else { p.bc = p.c; p.br = Math.max(...p.r); p.d = dElipsoide; }
    return p;
  }
  distancia(x, y, z) {
    let d = 1;
    for (const p of this.prims) {
      const cx = x - p.bc[0], cy = y - p.bc[1], cz = z - p.bc[2];
      if (Math.sqrt(cx * cx + cy * cy + cz * cz) - p.br > d + p.k) continue;   // no llega a cambiar el mínimo
      d = smin(d, p.d(x, y, z, p), p.k);
    }
    for (const p of this.restas) d = smax(d, -p.d(x, y, z, p), p.k);
    return d;
  }
  // Los huesos que manda cada punto: los de las primitivas más cercanas, con peso suave
  pesos(x, y, z, ancho = 0.012) {
    const ds = this.prims.map(p => [p.hueso, p.d(x, y, z, p)]).filter(([h]) => h);
    const dmin = Math.min(...ds.map(q => q[1])), acum = new Map();
    for (const [h, d] of ds) { const w = Math.exp(-(d - dmin) / ancho); if (w > 0.02) acum.set(h, (acum.get(h) || 0) + w); }
    return [...acum.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }
}
const espejo = p => p.tipo === 'c' ? { ...p, a: [-p.a[0], p.a[1], p.a[2]], b: [-p.b[0], p.b[1], p.b[2]], hueso: lado(p.hueso) } : { ...p, c: [-p.c[0], p.c[1], p.c[2]], hueso: lado(p.hueso) };
const lado = h => h && (h.endsWith('I') ? h.slice(0, -1) + 'D' : h);

/* ---------- Surface nets: de la distancia a la malla ---------- */
function malla(sdf, min, max, paso) {
  const nx = Math.ceil((max[0] - min[0]) / paso) + 1, ny = Math.ceil((max[1] - min[1]) / paso) + 1, nz = Math.ceil((max[2] - min[2]) / paso) + 1;
  const val = new Float32Array(nx * ny * nz), I = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) val[I(i, j, k)] = sdf(min[0] + i * paso, min[1] + j * paso, min[2] + k * paso);
  const C = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k), celda = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1), pos = [];
  const esq = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const aristas = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]], v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let dentro = 0; for (let e = 0; e < 8; e++) { v[e] = val[I(i + esq[e][0], j + esq[e][1], k + esq[e][2])]; if (v[e] < 0) dentro++; }
    if (dentro === 0 || dentro === 8) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of aristas) { if ((v[a] < 0) === (v[b] < 0)) continue; const t = v[a] / (v[a] - v[b]); sx += esq[a][0] + (esq[b][0] - esq[a][0]) * t; sy += esq[a][1] + (esq[b][1] - esq[a][1]) * t; sz += esq[a][2] + (esq[b][2] - esq[a][2]) * t; n++; }
    celda[C(i, j, k)] = pos.length / 3; pos.push(min[0] + (i + sx / n) * paso, min[1] + (j + sy / n) * paso, min[2] + (k + sz / n) * paso);
  }
  const idx = [], cara = (a, b, c, d, eje, signo) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    const P = q => [pos[q * 3], pos[q * 3 + 1], pos[q * 3 + 2]], A = P(a), B = P(b), D = P(d);
    const n = [(B[1] - A[1]) * (D[2] - A[2]) - (B[2] - A[2]) * (D[1] - A[1]), (B[2] - A[2]) * (D[0] - A[0]) - (B[0] - A[0]) * (D[2] - A[2]), (B[0] - A[0]) * (D[1] - A[1]) - (B[1] - A[1]) * (D[0] - A[0])];
    if (n[eje] * signo < 0) idx.push(a, d, c, a, c, b); else idx.push(a, b, c, a, c, d);
  };
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const v0 = val[I(i, j, k)] < 0;
    if (i < nx - 1 && j > 0 && k > 0 && v0 !== (val[I(i + 1, j, k)] < 0)) cara(celda[C(i, j - 1, k - 1)], celda[C(i, j, k - 1)], celda[C(i, j, k)], celda[C(i, j - 1, k)], 0, v0 ? 1 : -1);
    if (j < ny - 1 && i > 0 && k > 0 && v0 !== (val[I(i, j + 1, k)] < 0)) cara(celda[C(i - 1, j, k - 1)], celda[C(i, j, k - 1)], celda[C(i, j, k)], celda[C(i - 1, j, k)], 1, v0 ? 1 : -1);
    if (k < nz - 1 && i > 0 && j > 0 && v0 !== (val[I(i, j, k + 1)] < 0)) cara(celda[C(i - 1, j - 1, k)], celda[C(i, j - 1, k)], celda[C(i, j, k)], celda[C(i - 1, j, k)], 2, v0 ? 1 : -1);
  }
  return { pos, idx };
}
// Normales del gradiente del campo (más suaves que las de las caras)
function normales(sdf, pos, h = 0.004) {
  const n = new Float32Array(pos.length);
  for (let q = 0; q < pos.length; q += 3) {
    const x = pos[q], y = pos[q + 1], z = pos[q + 2];
    const gx = sdf(x + h, y, z) - sdf(x - h, y, z), gy = sdf(x, y + h, z) - sdf(x, y - h, z), gz = sdf(x, y, z + h) - sdf(x, y, z - h), l = Math.hypot(gx, gy, gz) || 1;
    n[q] = gx / l; n[q + 1] = gy / l; n[q + 2] = gz / l;
  }
  return n;
}
// Se queda con las caras cuyo centro cumple la condición (para la ropa con bordes rotos) y compacta los vértices
function recortar(m, queda) {
  const idx = [];
  for (let t = 0; t < m.idx.length; t += 3) {
    const [a, b, c] = [m.idx[t], m.idx[t + 1], m.idx[t + 2]];
    const x = (m.pos[a * 3] + m.pos[b * 3] + m.pos[c * 3]) / 3, y = (m.pos[a * 3 + 1] + m.pos[b * 3 + 1] + m.pos[c * 3 + 1]) / 3, z = (m.pos[a * 3 + 2] + m.pos[b * 3 + 2] + m.pos[c * 3 + 2]) / 3;
    if (queda(x, y, z)) idx.push(a, b, c);
  }
  // sin pedacitos sueltos: se queda con las partes conectadas de 40 triángulos o más
  const padre = new Map(), raiz = a => { while (padre.get(a) !== a) { padre.set(a, padre.get(padre.get(a))); a = padre.get(a); } return a; };
  for (const i of idx) if (!padre.has(i)) padre.set(i, i);
  for (let t = 0; t < idx.length; t += 3) { const a = raiz(idx[t]); padre.set(raiz(idx[t + 1]), a); padre.set(raiz(idx[t + 2]), a); }
  const tam = new Map(); for (let t = 0; t < idx.length; t += 3) { const r = raiz(idx[t]); tam.set(r, (tam.get(r) || 0) + 1); }
  const grandes = []; for (let t = 0; t < idx.length; t += 3) if (tam.get(raiz(idx[t])) >= 40) grandes.push(idx[t], idx[t + 1], idx[t + 2]);
  idx.length = 0; idx.push(...grandes);
  const nuevo = new Map(), pos = [];
  const out = idx.map(i => { if (!nuevo.has(i)) { nuevo.set(i, pos.length / 3); pos.push(m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]); } return nuevo.get(i); });
  return { pos, idx: out };
}

/* ---------- El esqueleto (m, en reposo, mirando a +z; la izquierda del zombie es +x) ---------- */
const HUESOS = [
  ['cadera', null, [0, 0.96, 0]], ['columna', 'cadera', [0, 1.08, -0.01]], ['pecho', 'columna', [0, 1.24, -0.01]],
  ['cuello', 'pecho', [0, 1.45, -0.01]], ['cabeza', 'cuello', [0, 1.56, 0.0]],
  ['hombroI', 'pecho', [0.06, 1.42, -0.015]], ['brazoI', 'hombroI', [0.175, 1.415, -0.02]], ['anteI', 'brazoI', [0.271, 1.152, -0.02]], ['manoI', 'anteI', [0.356, 0.917, -0.01]],
  ['hombroD', 'pecho', [-0.06, 1.42, -0.015]], ['brazoD', 'hombroD', [-0.175, 1.415, -0.02]], ['anteD', 'brazoD', [-0.271, 1.152, -0.02]], ['manoD', 'anteD', [-0.356, 0.917, -0.01]],
  ['musloI', 'cadera', [0.09, 0.93, 0]], ['piernaI', 'musloI', [0.10, 0.51, 0.005]], ['pieI', 'piernaI', [0.105, 0.09, -0.01]],
  ['musloD', 'cadera', [-0.09, 0.93, 0]], ['piernaD', 'musloD', [-0.10, 0.51, 0.005]], ['pieD', 'piernaD', [-0.105, 0.09, -0.01]],
];
const ABS = Object.fromEntries(HUESOS.map(([n, , p]) => [n, p]));

/* ---------- El cuerpo: primitivas anatómicas ---------- */
function cuerpo() {
  const f = new Forma(), S = true;
  // tronco
  f.elip([0, 0.97, -0.005], [0.15, 0.1, 0.1], 'cadera', 0.03).elip([0.068, 0.92, -0.055], [0.072, 0.08, 0.065], 'cadera', 0.03, S)
   .elip([0, 1.11, 0.0], [0.122, 0.11, 0.085], 'columna', 0.035).elip([0, 1.28, -0.005], [0.148, 0.15, 0.098], 'pecho', 0.035)
   .elip([0.058, 1.315, 0.052], [0.064, 0.05, 0.034], 'pecho', 0.025, S).elip([0, 1.3, -0.045], [0.15, 0.12, 0.064], 'pecho', 0.03)
   .cono([0, 1.45, -0.025], [0.15, 1.415, -0.025], 0.047, 0.041, 'pecho', 0.03, S)
   .elip([0.172, 1.395, -0.015], [0.051, 0.057, 0.051], 'brazoI', 0.025, S);
  // cuello y cabeza (al 88 %, como en el juego): cráneo, cara, mentón, arco de las cejas, pómulos, nariz y orejas
  f.cono([0, 1.42, -0.012], [0, 1.6, 0.0], 0.051, 0.044, 'cuello', 0.03)
   .elip([0, 1.67, -0.005], [0.07, 0.085, 0.088], 'cabeza', 0.02).elip([0, 1.6, 0.03], [0.05, 0.045, 0.06], 'cabeza', 0.02)
   .elip([0, 1.575, 0.06], [0.025, 0.02, 0.02], 'cabeza', 0.012).elip([0, 1.678, 0.068], [0.062, 0.014, 0.022], 'cabeza', 0.012)
   .elip([0.043, 1.635, 0.058], [0.02, 0.015, 0.02], 'cabeza', 0.012, S).cono([0, 1.66, 0.082], [0, 1.628, 0.094], 0.011, 0.012, 'cabeza', 0.01)
   .elip([0.07, 1.648, -0.005], [0.01, 0.026, 0.018], 'cabeza', 0.008, S)
   .quitar([0.03, 1.652, 0.079], [0.02, 0.019, 0.02], 0.008, S).quitar([0, 1.593, 0.085], [0.03, 0.017, 0.032], 0.006);
  // brazos (abiertos 20° en reposo): deltoides, bíceps, tríceps, codo y antebrazo
  f.cono(ABS.brazoI, ABS.anteI, 0.043, 0.033, 'brazoI', 0.02, S).elip([0.212, 1.305, 0.0], [0.032, 0.065, 0.034], 'brazoI', 0.02, S)
   .elip([0.22, 1.3, -0.04], [0.03, 0.07, 0.03], 'brazoI', 0.02, S).elip([0.271, 1.152, -0.028], [0.03, 0.03, 0.03], 'anteI', 0.015, S)
   .cono(ABS.anteI, ABS.manoI, 0.034, 0.024, 'anteI', 0.018, S).elip([0.29, 1.09, -0.005], [0.033, 0.06, 0.03], 'anteI', 0.018, S);
  // piernas: muslo, cuádriceps, isquiotibiales, rodilla, canilla, gemelo, tobillo, talón, pie y dedos
  f.cono(ABS.musloI, ABS.piernaI, 0.082, 0.05, 'musloI', 0.025, S).elip([0.098, 0.72, 0.025], [0.058, 0.13, 0.05], 'musloI', 0.025, S)
   .elip([0.095, 0.73, -0.03], [0.055, 0.12, 0.045], 'musloI', 0.025, S).elip([0.1, 0.51, 0.025], [0.042, 0.04, 0.035], 'piernaI', 0.015, S)
   .cono(ABS.piernaI, ABS.pieI, 0.048, 0.03, 'piernaI', 0.02, S).elip([0.1, 0.37, -0.032], [0.043, 0.09, 0.042], 'piernaI', 0.02, S)
   .elip([0.105, 0.085, -0.01], [0.032, 0.032, 0.032], 'pieI', 0.015, S).elip([0.105, 0.045, -0.03], [0.035, 0.035, 0.035], 'pieI', 0.015, S)
   .elip([0.106, 0.035, 0.05], [0.042, 0.032, 0.105], 'pieI', 0.02, S).elip([0.108, 0.022, 0.14], [0.044, 0.02, 0.035], 'pieI', 0.012, S);
  return f;
}
// La mano izquierda en su marco: muñeca en el origen, hacia −y, palma hacia −x (el cuerpo) y pulgar hacia +z
function mano() {
  const f = new Forma(), h = 'mano';
  f.cono([0, 0.025, 0], [0, -0.02, 0], 0.023, 0.025, h, 0.012).elip([0, -0.052, 0], [0.014, 0.048, 0.037], h, 0.012);
  for (const [z, L] of [[0.027, 1], [0.009, 1.1], [-0.009, 1.03], [-0.026, 0.86]]) {   // dedos largos y curvos, con garra
    const a = [0.002, -0.092, z], b = [-0.008, -0.092 - 0.045 * L, z * 1.05], c = [-0.022, -0.092 - 0.078 * L, z * 1.08], d = [-0.04, -0.092 - 0.095 * L, z * 1.1];
    f.cono(a, b, 0.0095, 0.0085, h, 0.006).cono(b, c, 0.0085, 0.0072, h, 0.005).cono(c, d, 0.0068, 0.0028, h, 0.004);
  }
  f.cono([-0.004, -0.028, 0.028], [-0.018, -0.068, 0.054], 0.012, 0.0095, h, 0.008).cono([-0.018, -0.068, 0.054], [-0.034, -0.094, 0.06], 0.0092, 0.004, h, 0.005);
  return f;
}

/* ---------- Colores ---------- */
const col = hex => new THREE.Color(hex);
const PIEL = col('#5d8a3c'), PIEL_OSC = col('#3d5e29'), PIEL_CLARA = col('#77a04f'), CUENCA = col('#1c2414'), MORETON = col('#5a503a'), SANGRE = col('#5a0c08'), SANGRE_VIVA = col('#7a1410'), PELO = col('#231a12'), UNA = col('#3a3226');
function texturaEscocesa() {   // camisa a cuadros azul, como la del caminante
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#3563c8'; g.fillRect(0, 0, 256, 256);
  for (const [p, w, color] of [[0, 46, 'rgba(20,34,90,0.75)'], [128, 46, 'rgba(20,34,90,0.75)'], [60, 10, 'rgba(160,190,240,0.55)'], [188, 10, 'rgba(160,190,240,0.55)'], [100, 4, 'rgba(10,15,40,0.8)'], [228, 4, 'rgba(10,15,40,0.8)']]) {
    g.fillStyle = color; g.fillRect(p, 0, w, 256); g.fillRect(0, p, 256, w);
  }
  for (let k = 0; k < 2200; k++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1, 1 + Math.random() * 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

/* ---------- Construcción (una vez: la geometría se comparte entre zombies) ---------- */
let MOLDE = null;
function construirMolde() {
  const t0 = performance.now(), F = cuerpo(), sdf = (x, y, z) => F.distancia(x, y, z);
  // Cuerpo
  const mc = malla(sdf, [-0.4, -0.01, -0.17], [0.4, 1.79, 0.21], 0.0125);
  const nc = normales(sdf, mc.pos);
  // Manos (más finas) puestas en reposo: giradas 20° y en la muñeca; la derecha es el espejo
  const FM = mano(), sdfM = (x, y, z) => FM.distancia(x, y, z);
  const mm = malla(sdfM, [-0.065, -0.205, -0.05], [0.035, 0.04, 0.08], 0.0045), nm = normales(sdfM, mm.pos, 0.002);
  const a20 = 20 * Math.PI / 180, cs = Math.cos(a20), sn = Math.sin(a20);
  const ponerMano = (x, y, z, signo) => { const rx = x * cs - y * sn, ry = x * sn + y * cs; return [signo * (rx + ABS.manoI[0]), ry + ABS.manoI[1], z + ABS.manoI[2]]; };
  // Ropa: capas a 1 cm del cuerpo, con bordes rotos
  const camisaF = new Forma(); for (const p of F.prims) if (['cadera', 'columna', 'pecho', 'cuello', 'brazoI', 'brazoD'].includes(p.hueso)) camisaF.prims.push(p);
  const sdfCamisa = (x, y, z) => camisaF.distancia(x, y, z) - 0.016;   // por encima del pantalón (a 1 cm)
  const camisa = recortar(malla(sdfCamisa, [-0.31, 0.8, -0.18], [0.31, 1.52, 0.18], 0.0125), (x, y, z) => {
    const r = fbm(x * 18, y * 18, z * 18);
    if (y < 0.87 + r * 0.05) return false;                                                    // faldones rotos
    if (y > 1.462 - (z > 0 ? Math.max(0, 0.045 - Math.abs(x) * 0.45) : 0)) return false;        // cuello en V
    if (z > 0.015 && Math.abs(x) < 0.022 + (1.45 - y) * 0.085 + (r - 0.5) * 0.02) return false; // abierta adelante
    const brazo = Math.abs(x) > 0.2 || (Math.abs(x) > 0.17 && y < 1.36);
    if (brazo && y < 1.335 + (r - 0.5) * 0.04) return false;                                    // manga corta rota
    return true;
  });
  const pantalonF = new Forma(); for (const p of F.prims) if (['cadera', 'musloI', 'musloD', 'piernaI', 'piernaD'].includes(p.hueso) && !(p.c && p.c[1] < 0.1) && !(p.a && p.b[1] < 0.1 && p.a[1] < 0.1)) pantalonF.prims.push(p);
  const sdfPantalon = (x, y, z) => pantalonF.distancia(x, y, z) - 0.01;
  const pantalon = recortar(malla(sdfPantalon, [-0.24, 0.12, -0.17], [0.24, 1.08, 0.16], 0.0125), (x, y, z) => {
    const r = fbm(x * 18 + 3, y * 18, z * 18);
    if (y > 1.0 + (r - 0.5) * 0.012) return false;                                               // cintura
    if (y < (x > 0 ? 0.36 : 0.27) + r * 0.07) return false;                                       // ruedos rotos a media pierna
    if (x < 0 && z > 0.02 && Math.hypot(x + 0.1, (y - 0.53) * 0.8) < 0.045 + (r - 0.5) * 0.03) return false;   // rodilla rota
    return true;
  });
  const nCam = normales(sdfCamisa, camisa.pos), nPan = normales(sdfPantalon, pantalon.pos);
  MOLDE = { F, sdf, mc, nc, mm, nm, ponerMano, camisa, nCam, pantalon, nPan, ms: performance.now() - t0 };
  return MOLDE;
}

// Atributos de piel: índices y pesos de los huesos de cada vértice
const NOMBRES = HUESOS.map(h => h[0]), IDX = Object.fromEntries(NOMBRES.map((n, i) => [n, i]));
function pielDe(F, pos, fijo) {
  const si = new Uint16Array(pos.length / 3 * 4), sw = new Float32Array(pos.length / 3 * 4);
  for (let v = 0; v < pos.length / 3; v++) {
    const ps = fijo ? fijo(v) : F.pesos(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
    const suma = ps.reduce((s, q) => s + q[1], 0) || 1;
    ps.forEach(([h, w], k) => { si[v * 4 + k] = IDX[h]; sw[v * 4 + k] = w / suma; });
  }
  return [si, sw];
}

/* ---------- Un zombie ---------- */
export class Zombie {
  constructor(escena, efectos) {
    this.escena = escena; this.efectos = efectos;
    const M = MOLDE || construirMolde();
    this.grupo = new THREE.Group(); escena.add(this.grupo);
    // Esqueleto
    this.huesos = {};
    for (const [n, padre, p] of HUESOS) {
      const b = new THREE.Bone(); b.name = n; const pp = padre ? ABS[padre] : [0, 0, 0]; b.position.set(p[0] - pp[0], p[1] - pp[1], p[2] - pp[2]);
      this.huesos[n] = b; if (padre) this.huesos[padre].add(b);
    }
    this.grupo.add(this.huesos.cadera); this.grupo.rotation.order = 'YXZ';   // la caída gira en el marco del zombie
    this.grupo.updateMatrixWorld(true);
    this.esqueleto = new THREE.Skeleton(NOMBRES.map(n => this.huesos[n]));
    // Cuerpo + manos en una sola malla con piel
    const F = M.F, posC = M.mc.pos, nC = M.nc;
    const posM = [], nM = [], idxM = [];
    for (const signo of [1, -1]) {
      const base = (posC.length + posM.length) / 3;
      for (let q = 0; q < M.mm.pos.length; q += 3) {
        posM.push(...M.ponerMano(M.mm.pos[q], M.mm.pos[q + 1], M.mm.pos[q + 2], signo));
        const nx = M.nm[q], ny = M.nm[q + 1], nz = M.nm[q + 2], a = 20 * Math.PI / 180;
        nM.push(signo * (nx * Math.cos(a) - ny * Math.sin(a)), nx * Math.sin(a) + ny * Math.cos(a), nz);
      }
      for (let t = 0; t < M.mm.idx.length; t += 3) { const [a, b, c] = [M.mm.idx[t], M.mm.idx[t + 1], M.mm.idx[t + 2]]; idxM.push(...(signo > 0 ? [a, b, c] : [a, c, b]).map(i => i + base)); }
    }
    const nManoV = M.mm.pos.length / 3;
    const pos = [...posC, ...posM], nor = new Float32Array([...nC, ...nM]), idx = [...M.mc.idx, ...idxM];
    const nCuerpo = posC.length / 3;
    const pesoDe = v => {
      if (v < nCuerpo) return F.pesos(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
      const k = (v - nCuerpo) % nManoV, ly = M.mm.pos[k * 3 + 1], l = v - nCuerpo < nManoV ? 'I' : 'D', w = limitar((ly + 0.005) / 0.04, 0, 0.6);
      return w > 0.02 ? [['mano' + l, 1 - w], ['ante' + l, w]] : [['mano' + l, 1]];
    };
    const [si, sw] = pielDe(F, pos, pesoDe);
    // Color de la piel por vértice: verde con manchas, oclusión, sangre en la boca y la herida, pelo ralo y uñas
    const colores = new Float32Array(pos.length), c = new THREE.Color();
    for (let v = 0; v < pos.length / 3; v++) {
      const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2], nx = nor[v * 3], ny = nor[v * 3 + 1], nz = nor[v * 3 + 2];
      const ao = limitar(0.25 + 0.75 * (v < nCuerpo ? M.sdf(x + nx * 0.03, y + ny * 0.03, z + nz * 0.03) / 0.03 : 1), 0.2, 1);
      const r = fbm(x * 9, y * 9, z * 9), r2 = fbm(x * 31 + 5, y * 31, z * 31);
      c.copy(PIEL).lerp(PIEL_CLARA, limitar((r - 0.45) * 2, 0, 0.6)).lerp(PIEL_OSC, limitar((0.42 - r) * 2.5, 0, 0.7)).lerp(MORETON, limitar((r2 - 0.72) * 3, 0, 0.6));
      if (y > 1.69 && z < 0.065 && fbm(x * 60, y * 60, z * 60) > 0.48) c.lerp(PELO, 0.85);                       // pelo ralo y sucio
      if (Math.hypot(x, (y - 1.59) * 1.2, (z - 0.085) * 0.8) < 0.04) c.lerp(SANGRE, 0.6);                        // boca
      if (Math.hypot(x / 0.03, (y - 1.593) / 0.017, (z - 0.08) / 0.03) < 1.15) c.lerp(col('#1a0604'), 0.85);         // adentro de la boca
      const dCuenca = Math.hypot(Math.abs(x) - 0.03, y - 1.652, (z - 0.075) * 0.7); if (dCuenca < 0.03) c.lerp(CUENCA, (1 - dCuenca / 0.03) * 0.85);   // cuencas hundidas
      const hilo = 0.005 + r2 * 0.005 - (1.6 - y) * 0.02; if (Math.abs(x + 0.012 + (1.6 - y) * 0.05) < hilo && y < 1.6 && y > 1.47 && z > 0.02) c.lerp(SANGRE_VIVA, 0.8 * (1 - (1.6 - y) / 0.13));   // hilo de sangre que baja del mentón
      const dh = Math.hypot(x - 0.045, y - 1.25, (z - 0.09) * 0.6);                                                   // herida del pecho
      if (dh < 0.045) c.lerp(SANGRE, limitar((0.045 - dh) / 0.03, 0, 1)).multiplyScalar(dh < 0.015 ? 0.45 : 1);
      if (v >= nCuerpo && M.mm.pos[((v - nCuerpo) % nManoV) * 3 + 1] < -0.165) c.lerp(UNA, 0.85);                    // uñas
      c.multiplyScalar(ao);
      colores.set([c.r, c.g, c.b], v * 3);
    }
    this.colorBase = colores.slice();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colores, 3)); g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    g.setIndex(idx);
    this.cuerpo = new THREE.SkinnedMesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0 }));
    // Ropa
    this.camisa = this.ropa(M.camisa, M.nCam, F, 'camisa');
    this.pantalon = this.ropa(M.pantalon, M.nPan, F, 'pantalon');
    for (const m of [this.cuerpo, this.camisa, this.pantalon]) { m.frustumCulled = false; this.grupo.add(m); m.bind(this.esqueleto); }
    // Ojos amarillos y dientes, pegados a la cabeza
    const cab = this.huesos.cabeza, rel = (x, y, z) => v3(x - ABS.cabeza[0], y - ABS.cabeza[1], z - ABS.cabeza[2]);
    const matOjo = new THREE.MeshStandardMaterial({ color: 0xdcc43e, emissive: 0x6a5a08, emissiveIntensity: 0.45, roughness: 0.25 }), matPupila = new THREE.MeshBasicMaterial({ color: 0x120c06 });
    for (const s of [1, -1]) {
      const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.0098, 16, 12), matOjo); ojo.position.copy(rel(s * 0.03, 1.651, 0.064)); cab.add(ojo);
      const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.0032, 10, 8), matPupila); pupila.position.copy(rel(s * 0.0292, 1.6512, 0.0716)); cab.add(pupila);
    }
    const dientes = new THREE.Group(); cab.add(dientes);
    const matDiente = new THREE.MeshStandardMaterial({ color: 0xc4b384, roughness: 0.5 }), matDienteOsc = new THREE.MeshStandardMaterial({ color: 0x8a7a52, roughness: 0.6 });
    for (let k = 0; k < 8; k++) for (const [y, inc] of [[1.6, 1], [1.585, -1]]) {
      if (hash3(k, y * 1000, 7) < 0.2) continue;   // le faltan dientes
      const a = (k - 3.5) * 0.3, h = 0.006 + hash3(k, y * 1000, 2) * 0.004, d = new THREE.Mesh(new THREE.BoxGeometry(0.0052, h, 0.0042), hash3(k, y * 1000, 5) < 0.3 ? matDienteOsc : matDiente);
      d.position.copy(rel(Math.sin(a) * 0.024, y - inc * (0.001 + h / 2 - 0.003), 0.066 + Math.cos(a) * 0.016)); d.rotation.set((hash3(k, y, 9) - 0.5) * 0.3, a, (hash3(k, y * 100, 3) - 0.5) * 0.5); dientes.add(d);
    }
    fusionar(dientes, true);
    // Zonas de impacto, pegadas a los huesos
    this.zonas = [];
    const zona = (hueso, geo, centro, tipo) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ visible: false })); const b = this.huesos[hueso]; m.position.set(centro[0] - ABS[hueso][0], centro[1] - ABS[hueso][1], centro[2] - ABS[hueso][2]); b.add(m); m.userData = { zombie: this, tipo, hueso }; this.zonas.push(m); return m; };
    const esf = (rx, ry, rz) => { const gq = new THREE.SphereGeometry(1, 12, 10); gq.scale(rx, ry, rz); return gq; };
    zona('cabeza', esf(0.075, 0.095, 0.095), [0, 1.655, 0.01], 'cabeza'); zona('cuello', esf(0.05, 0.07, 0.05), [0, 1.5, 0], 'tronco');
    zona('pecho', esf(0.16, 0.15, 0.11), [0, 1.3, -0.005], 'tronco'); zona('columna', esf(0.13, 0.1, 0.095), [0, 1.11, 0.0], 'tronco'); zona('cadera', esf(0.16, 0.1, 0.11), [0, 0.95, -0.01], 'tronco');
    const tubo = (a, b, r) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), gq = new THREE.CylinderGeometry(r, r, L, 10); const dir = v3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); gq.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), dir)); return gq; };
    for (const s of ['I', 'D']) {
      const sx = s === 'I' ? 1 : -1, m = p => [p[0] * sx, p[1], p[2]];
      for (const [h, a, b, r] of [['brazo' + s, ABS.brazoI, ABS.anteI, 0.045], ['ante' + s, ABS.anteI, ABS.manoI, 0.036], ['muslo' + s, ABS.musloI, ABS.piernaI, 0.08], ['pierna' + s, ABS.piernaI, ABS.pieI, 0.055]]) {
        const A = m(a), B = m(b); zona(h, tubo(A, B, r), [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2], 'miembro');
      }
      zona('mano' + s, esf(0.03, 0.09, 0.045), [sx * 0.39, 0.83, 0.0], 'miembro'); zona('pie' + s, esf(0.05, 0.05, 0.13), [sx * 0.106, 0.04, 0.05], 'miembro');
    }
    // Estado
    this.vidaMax = VIDA_ZOMBIE_NORMAL; this.vida = this.vidaMax; this.estado = 'camina'; this.fase = Math.random() * 6; this.velocidad = 0.55;
    this.sacudida = { pecho: v3(), cabeza: v3() }; this.aturdido = 0; this.proximoGemido = performance.now() + 2000 + Math.random() * 3000; this.proximaMordida = 0;
    this.caida = 0; this.direccionCaida = 1; this.muertoEn = 0; this.muertes = 0; this.cabezazos = 0;
    this.objetivo = v3(0, 0, 0);
    this.aparecer(v3(0, 0, -22));
  }
  ropa(m, n, F, tipo) {
    const pos = m.pos, colores = new Float32Array(pos.length), uv = new Float32Array(pos.length / 3 * 2), c = new THREE.Color();
    const base = tipo === 'camisa' ? col('#ffffff') : col('#6b4528'), sucio = tipo === 'camisa' ? col('#9a9080') : col('#3e2817');
    for (let v = 0; v < pos.length / 3; v++) {
      const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2], r = fbm(x * 12 + 9, y * 12, z * 12);
      c.copy(base).lerp(sucio, limitar((r - 0.5) * 2.2, 0, 0.75));
      if (tipo === 'camisa' && Math.hypot(x - 0.06, y - 1.22, (z - 0.08) * 0.6) < 0.07 + r * 0.03) c.lerp(SANGRE, 0.7);   // sangre de la herida
      if (tipo === 'pantalon' && y < 0.45) c.multiplyScalar(0.78);
      const ao = limitar(0.45 + 0.55 * F.distancia(x + n[v * 3] * 0.03, y + n[v * 3 + 1] * 0.03, z + n[v * 3 + 2] * 0.03) / 0.04, 0.4, 1);
      c.multiplyScalar(ao);
      colores.set([c.r, c.g, c.b], v * 3);
      uv[v * 2] = (Math.atan2(x, z) / (Math.PI * 2) + 0.5) * 6; uv[v * 2 + 1] = y * 7;
    }
    const [si, sw] = pielDe(F, pos);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colores, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); g.setIndex(m.idx);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, side: THREE.DoubleSide, map: tipo === 'camisa' ? (Zombie.escocesa || (Zombie.escocesa = texturaEscocesa())) : null });
    const malla_ = new THREE.SkinnedMesh(g, mat); malla_.userData.colorBase = colores.slice();
    return malla_;
  }
  aparecer(p) {
    this.grupo.position.copy(p); this.grupo.rotation.set(0, 0, 0); this.vida = this.vidaMax; this.estado = 'camina'; this.caida = 0; this.aturdido = 0;
    this.cuerpo.geometry.attributes.color.array.set(this.colorBase); this.cuerpo.geometry.attributes.color.needsUpdate = true;
    for (const m of [this.camisa, this.pantalon]) { m.geometry.attributes.color.array.set(m.userData.colorBase); m.geometry.attributes.color.needsUpdate = true; }
    this.grupo.visible = true; this.quemando = 0; if (this.llamas) for (const l of this.llamas) l.visible = false;
  }

  /* --- Impactos --- */
  // golpe: { punto, dir, dano, tipo ('bala' | 'perdigon' | 'explosion' | 'fuego' | 'filo' | 'golpe' | 'rayo'), zona (malla de la zona) }
  recibir(golpe) {
    if (this.estado === 'cae' || this.estado === 'muerto') return false;
    const zona = golpe.zona ? golpe.zona.userData.tipo : 'tronco', hueso = golpe.zona ? golpe.zona.userData.hueso : 'pecho';
    const mult = zona === 'cabeza' ? 4 : zona === 'miembro' ? 0.6 : 1;
    this.vida -= golpe.dano * mult;
    if (golpe.punto) this.mancharSangre(golpe.punto, hueso, golpe.tipo === 'perdigon' ? 0.035 : golpe.tipo === 'explosion' ? 0.12 : 0.05);
    // sacudida: el tronco o la cabeza se van hacia donde empuja la bala
    const empuje = golpe.dir ? golpe.dir.clone().setY(0).normalize() : v3(0, 0, -1), local = empuje.applyQuaternion(this.grupo.quaternion.clone().invert());
    const f = Math.min(1.5, golpe.dano / 5) * (golpe.tipo === 'perdigon' ? 0.5 : 1);
    if (zona === 'cabeza') this.sacudida.cabeza.add(v3(local.z * 0.5, 0, -local.x * 0.5).multiplyScalar(f)); else this.sacudida.pecho.add(v3(local.z * 0.25, 0, -local.x * 0.25).multiplyScalar(f));
    if (golpe.dano * mult >= 10) this.aturdido = 0.6;
    if (zona === 'cabeza' || this.vida <= 0) { this.morir(empuje, zona === 'cabeza'); return true; }
    if (Math.random() < 0.4) Audio_.gemido(false, 300);
    return false;
  }
  // Mancha la piel y la ropa alrededor del impacto: el punto pasa al marco de reposo de su hueso
  mancharSangre(punto, hueso, radio) {
    const b = this.huesos[hueso]; b.updateWorldMatrix(true, false);
    const local = b.worldToLocal(punto.clone()), reposo = local.add(v3(...ABS[hueso]));
    for (const m of [this.cuerpo, this.camisa, this.pantalon]) {
      const p = m.geometry.attributes.position.array, c = m.geometry.attributes.color;
      for (let v = 0; v < p.length / 3; v++) {
        const d = Math.hypot(p[v * 3] - reposo.x, p[v * 3 + 1] - reposo.y, p[v * 3 + 2] - reposo.z);
        if (d < radio) { const k = (1 - d / radio) * 0.85; c.array[v * 3] += (SANGRE.r * 0.7 - c.array[v * 3]) * k; c.array[v * 3 + 1] += (SANGRE.g * 0.5 - c.array[v * 3 + 1]) * k; c.array[v * 3 + 2] += (SANGRE.b * 0.5 - c.array[v * 3 + 2]) * k; }
      }
      c.needsUpdate = true;
    }
  }
  morir(empuje, cabezazo) {
    this.estado = 'cae'; this.caida = 0; this.muertes++; if (cabezazo) this.cabezazos++;
    // cae para atrás si la bala venía de adelante (lo más común), con un poco del lado
    const local = empuje.clone().applyQuaternion(this.grupo.quaternion.clone().invert());
    this.direccionCaida = local.z < 0.3 ? -1 : 1;
    Audio_.zombieMuere(true);
  }

  // ¿Está p cerca del cuerpo? (de pie: un cilindro de 1,8 m; caído: tendido en el piso)
  cerca(p, r = 0.3) {
    if (this.estado === 'muerto') return false;
    const g = this.grupo.position, dx = p.x - g.x, dz = p.z - g.z;
    if (this.estado === 'cae') return Math.hypot(dx, dz) < 1.1 && p.y < 0.6;
    return Math.hypot(dx, dz) < 0.22 + r && p.y > 0 && p.y < 1.85;
  }
  // Fuego: llamas pegadas a los huesos mientras quema, 4 de vida por segundo y la piel se chamusca
  incendiar(seg) {
    if (!this.llamas) {
      const tex = this.efectos.matFuego;
      this.llamas = ['cabeza', 'pecho', 'columna', 'cadera', 'brazoI', 'brazoD', 'anteI', 'anteD', 'musloI', 'musloD', 'piernaI'].map(h => { const s = new THREE.Sprite(tex.clone()); s.scale.setScalar(0.25); s.visible = false; this.huesos[h].add(s); s.position.set(0, h.startsWith('brazo') || h.startsWith('ante') || h.startsWith('muslo') || h.startsWith('pierna') ? -0.12 : 0.05, 0.06); return s; });
    }
    if (!(this.quemando > 0)) Audio_.gemido(true, 80);
    this.quemando = Math.max(this.quemando || 0, seg);
  }
  quemar(ahora, dt) {
    if (!(this.quemando > 0)) return;
    this.quemando -= dt;
    for (const s of this.llamas) { s.visible = this.quemando > 0; s.scale.setScalar(0.2 + Math.random() * 0.18); s.material.rotation = Math.random() * 6; }
    if (this.estado !== 'cae' && this.estado !== 'muerto') { this.vida -= 4 * dt; if (this.vida <= 0) this.morir(new THREE.Vector3(0, 0, -1), false); }
    if (!this.chamuscado || ahora - this.chamuscado > 400) {   // se va oscureciendo
      this.chamuscado = ahora;
      for (const m of [this.cuerpo, this.camisa, this.pantalon]) { const c = m.geometry.attributes.color; for (let i = 0; i < c.array.length; i++) c.array[i] *= 0.97; c.needsUpdate = true; }
    }
  }

  /* --- Cada cuadro --- */
  actualizar(ahora, dt, alMorder) {
    const H = this.huesos, g = this.grupo;
    this.quemar(ahora, dt);
    for (const k of ['pecho', 'cabeza']) this.sacudida[k].multiplyScalar(Math.max(0, 1 - dt * 7));
    if (this.estado === 'cae' || this.estado === 'muerto') return this.actualizarCaida(ahora, dt);
    // Hacia el jugador: gira de a poco y camina arrastrando los pies
    const al = this.objetivo.clone().setY(0).sub(g.position), dist = al.length();
    const rumbo = Math.atan2(al.x, al.z); let dif = rumbo - g.rotation.y; dif = Math.atan2(Math.sin(dif), Math.cos(dif));
    g.rotation.y += limitar(dif, -1.1 * dt, 1.1 * dt);
    this.aturdido = Math.max(0, this.aturdido - dt);
    const ataca = dist < 0.78;
    this.estado = ataca ? 'ataca' : 'camina';
    const anda = !ataca && this.aturdido <= 0;
    if (anda) { this.fase += dt * 3.3; g.position.addScaledVector(v3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)), this.velocidad * dt * (0.75 + 0.25 * Math.abs(Math.sin(this.fase)))); }
    else this.fase += dt * 1.2;
    const f = this.fase, s = Math.sin(f), s2 = Math.sin(f * 2);
    // Tronco encorvado que se balancea con cada paso
    H.cadera.position.y = ABS.cadera[1] + (anda ? Math.abs(Math.cos(f)) * 0.022 - 0.015 : -0.01);
    H.cadera.rotation.set(0.05, s * 0.09, s * 0.06);
    H.columna.rotation.set(0.2 + this.sacudida.pecho.x, -s * 0.05, -s * 0.035 + this.sacudida.pecho.z);
    H.pecho.rotation.set(0.12, -s * 0.11, 0);
    H.cuello.rotation.set(-0.22, 0, 0.05);
    H.cabeza.rotation.set(-0.08 + s2 * 0.05 + this.sacudida.cabeza.x, Math.sin(ahora * 0.0007) * 0.15, 0.22 + Math.sin(ahora * 0.0013) * 0.05 + this.sacudida.cabeza.z);
    // Brazos hacia adelante, flojos; al atacar, se estiran a agarrar
    const t = ahora / 1000, alcance = ataca ? 0.25 + 0.15 * Math.sin(t * 5) : 0;
    for (const [L, sg, fa] of [['I', 1, 0], ['D', -1, 1.7]]) {
      H['hombro' + L].rotation.set(0, 0, sg * 0.05);
      H['brazo' + L].rotation.set(-1.42 - alcance + Math.sin(f + fa) * 0.07, sg * 0.1, -sg * 0.3);
      H['ante' + L].rotation.set(-0.25 + Math.sin(t * 1.3 + fa) * 0.06 + alcance * 0.8, 0, 0);
      H['mano' + L].rotation.set(0.45, 0, sg * 0.15);
    }
    // Piernas: la izquierda arrastra (levanta poco la rodilla y el pie va torcido)
    for (const [L, fa, arrastra] of [['I', 0, true], ['D', Math.PI, false]]) {
      const p = anda ? Math.sin(f + fa) : 0, sube = anda ? Math.max(0, Math.cos(f + fa)) : 0;
      H['muslo' + L].rotation.set(-p * 0.42 - 0.06, 0, (L === 'I' ? 1 : -1) * 0.03);
      H['pierna' + L].rotation.set(0.12 + sube * (arrastra ? 0.45 : 0.85), 0, 0);
      H['pie' + L].rotation.set(-0.1 + p * 0.25 - sube * 0.2, arrastra ? 0.35 : 0, 0);
    }
    // Gemido de vez en cuando; al atacar, muerde cada 1,4 s
    if (ahora > this.proximoGemido) { Audio_.gemido(ataca, Math.min(600, dist * 25)); this.proximoGemido = ahora + 3000 + Math.random() * 4000; }
    if (ataca && ahora > this.proximaMordida) { this.proximaMordida = ahora + 1400; Audio_.zombieGolpea(); if (alMorder) alMorder(); }
  }
  actualizarCaida(ahora, dt) {
    const H = this.huesos, g = this.grupo;
    if (this.estado === 'cae') {
      this.caida = Math.min(1, this.caida + dt / 0.9);
      if (this.caida >= 1) { this.estado = 'muerto'; this.muertoEn = ahora; Audio_.cuerpoAnimalCae(1.2, 1); }
    }
    const c = this.caida * this.caida, d = this.direccionCaida;
    // Las rodillas se aflojan y todo el cuerpo gira sobre los pies hasta quedar tendido
    g.rotation.x = d * c * Math.PI / 2 * 0.96;
    g.position.y = Math.sin(c * Math.PI / 2) * 0.1;
    for (const L of ['I', 'D']) { H['muslo' + L].rotation.x = -0.5 * c * (d > 0 ? 1 : 0.4); H['pierna' + L].rotation.x = 0.9 * c * (d > 0 ? 1 : 0.5); }
    H.columna.rotation.x = 0.2 * (1 - c); H.cabeza.rotation.x = -0.3 * c * d;
    for (const [L, sg] of [['I', 1], ['D', -1]]) { H['brazo' + L].rotation.set(-1.22 * (1 - c) - (d < 0 ? 2.6 : 0.4) * c, 0, -sg * (0.3 + 0.6 * c)); H['ante' + L].rotation.x = -0.3 * (1 - c) - 0.2 * c; }
    if (this.estado === 'muerto') {
      const t = ahora - this.muertoEn;
      if (t > 5000) g.position.y = -Math.min(0.5, (t - 5000) / 1000 * 0.35);   // se hunde en el piso
      if (t > 6500) { const x = (Math.random() - 0.5) * 6; this.aparecer(v3(x, 0, -20 - Math.random() * 8)); }
    }
  }
}
