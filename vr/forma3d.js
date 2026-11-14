/* ===== Zona Muerta VR: formas con campo de distancia =====
 * La base de todos los cuerpos (zombies, perros, toros y aves): primitivas anatómicas (elipsoides y conos
 * redondeados) unidas con mínimo suave, sin costuras, que se vuelven malla con surface nets. Cada primitiva dice a qué
 * hueso pertenece: de ahí salen los pesos de la piel. También las capas (ropa, pelaje) a una distancia del cuerpo,
 * recortadas por una función. Todo en metros, en la pose de reposo; la izquierda del cuerpo es +x. */
import * as THREE from 'three';

export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
export const suave = t => t * t * (3 - 2 * t);
export const respiro = () => new Promise(r => setTimeout(r, 0));

/* ---------- Ruido 3D (valor) para manchas y bordes rotos ---------- */
export function hash3(x, y, z) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function ruido3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = suave(xf), v = suave(yf), w = suave(zf), L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), L(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
    L(L(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), L(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w);
}
export const fbm = (x, y, z) => ruido3(x, y, z) * 0.6 + ruido3(x * 2.1 + 7, y * 2.1, z * 2.1) * 0.3 + ruido3(x * 4.3, y * 4.3 + 3, z * 4.3) * 0.1;

/* ---------- Primitivas con signo (m) ---------- */
// Cono redondeado entre a y b con radios ra y rb; elipsoide (aproximación de Íñigo Quílez); mínimo y máximo suaves
export function dCono(px, py, pz, p) {
  const bx = p.b[0] - p.a[0], by = p.b[1] - p.a[1], bz = p.b[2] - p.a[2], qx = px - p.a[0], qy = py - p.a[1], qz = pz - p.a[2];
  const t = limitar((qx * bx + qy * by + qz * bz) / p.l2, 0, 1), dx = qx - bx * t, dy = qy - by * t, dz = qz - bz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (p.ra + (p.rb - p.ra) * t);
}
export function dElipsoide(px, py, pz, p) {
  const x = (px - p.c[0]) / p.r[0], y = (py - p.c[1]) / p.r[1], z = (pz - p.c[2]) / p.r[2];
  const k0 = Math.sqrt(x * x + y * y + z * z), k1 = Math.sqrt((x / p.r[0]) ** 2 + (y / p.r[1]) ** 2 + (z / p.r[2]) ** 2);
  return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(...p.r);
}
export const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
export const smax = (a, b, k) => -smin(-a, -b, k);
export const lado = h => h && (h.endsWith('I') ? h.slice(0, -1) + 'D' : h);
const espejo = p => p.tipo === 'c' ? { ...p, a: [-p.a[0], p.a[1], p.a[2]], b: [-p.b[0], p.b[1], p.b[2]], hueso: lado(p.hueso) } : { ...p, c: [-p.c[0], p.c[1], p.c[2]], hueso: lado(p.hueso) };

export class Forma {   // unión suave de primitivas (con lo que se resta, como las cuencas de los ojos)
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
  // Las primitivas de algunos huesos (para las capas de ropa o de pelaje)
  de(huesos) { const f = new Forma(); for (const p of this.prims) if (huesos.includes(p.hueso)) f.prims.push(p); return f; }
}

/* ---------- Surface nets: de la distancia a la malla ---------- */
export function malla(sdf, min, max, paso) {
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
  // El cuadrilátero (a, b, c, d) da vueltas alrededor de la arista que cruza la superficie: su normal es +eje en x y z
  // y −eje en y. Se da vuelta según de qué lado está lo de adentro: así ningún triángulo queda al revés
  const idx = [], cara = (a, b, c, d, eje, signo) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if ((eje === 1) === (signo > 0)) idx.push(a, d, c, a, c, b); else idx.push(a, b, c, a, c, d);
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
export function normales(sdf, pos, h = 0.004) {
  const n = new Float32Array(pos.length);
  for (let q = 0; q < pos.length; q += 3) {
    const x = pos[q], y = pos[q + 1], z = pos[q + 2];
    const gx = sdf(x + h, y, z) - sdf(x - h, y, z), gy = sdf(x, y + h, z) - sdf(x, y - h, z), gz = sdf(x, y, z + h) - sdf(x, y, z - h), l = Math.hypot(gx, gy, gz) || 1;
    n[q] = gx / l; n[q + 1] = gy / l; n[q + 2] = gz / l;
  }
  return n;
}
// Un punto de la superficie: desde adentro (o afuera) del cuerpo, caminando por una dirección hasta cruzarla
export function puntoEnSuperficie(sdf, desde, dir, largo = 0.6) {
  let a = 0, b = largo; const d0 = sdf(desde[0], desde[1], desde[2]);
  for (let k = 0; k < 40; k++) { const m = (a + b) / 2, d = sdf(desde[0] + dir[0] * m, desde[1] + dir[1] * m, desde[2] + dir[2] * m); if ((d < 0) === (d0 < 0)) a = m; else b = m; }
  const t = (a + b) / 2; return [desde[0] + dir[0] * t, desde[1] + dir[1] * t, desde[2] + dir[2] * t];
}

/* ---------- Geometría con piel ---------- */
export function geometria({ pos, nor, idx, si, sw, uv, color }) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos instanceof Float32Array ? pos : new Float32Array(pos), 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (si) { g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); }
  if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (color) g.setAttribute('color', new THREE.BufferAttribute(color, 3));
  g.setIndex(idx); return g;
}
// Índices y pesos de los huesos de cada vértice (IDX: nombre del hueso → índice en el esqueleto)
export function pesosPiel(n, pesoDe, IDX) {
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let v = 0; v < n; v++) { const ps = pesoDe(v), suma = ps.reduce((s, q) => s + q[1], 0) || 1; ps.forEach(([h, w], k) => { si[v * 4 + k] = IDX[h]; sw[v * 4 + k] = w / suma; }); }
  return [si, sw];
}
// Una capa (ropa, pelaje) a cierta distancia del cuerpo: la malla entera; cada prenda se recorta de ahí
export function capa(F, sdfCapa, min, max, paso) {
  const m = malla(sdfCapa, min, max, paso), n = m.pos.length / 3, nor = normales(sdfCapa, m.pos);
  return { pos: m.pos, idx: m.idx, nor, n, F, pesos: new Array(n) };
}
// Se queda con los triángulos cuyo centro cumple la condición, sin pedacitos sueltos (menos de 40 triángulos), y
// arma la geometría: los atributos de cada vértice salen de la capa entera (la piel se calcula una vez por vértice)
export function recortarCapa(C, queda, IDX, uvDe = (x, y, z) => [(Math.atan2(x, z) / (Math.PI * 2) + 0.5) * 6, y * 7]) {
  const P = C.pos, idx = [];
  for (let t = 0; t < C.idx.length; t += 3) {
    const a = C.idx[t] * 3, b = C.idx[t + 1] * 3, c = C.idx[t + 2] * 3;
    if (queda((P[a] + P[b] + P[c]) / 3, (P[a + 1] + P[b + 1] + P[c + 1]) / 3, (P[a + 2] + P[b + 2] + P[c + 2]) / 3)) idx.push(C.idx[t], C.idx[t + 1], C.idx[t + 2]);
  }
  const padre = new Map(), raiz = a => { while (padre.get(a) !== a) { padre.set(a, padre.get(padre.get(a))); a = padre.get(a); } return a; };
  for (const i of idx) if (!padre.has(i)) padre.set(i, i);
  for (let t = 0; t < idx.length; t += 3) { const a = raiz(idx[t]); padre.set(raiz(idx[t + 1]), a); padre.set(raiz(idx[t + 2]), a); }
  const tam = new Map(); for (let t = 0; t < idx.length; t += 3) { const r = raiz(idx[t]); tam.set(r, (tam.get(r) || 0) + 1); }
  const grandes = []; for (let t = 0; t < idx.length; t += 3) if (tam.get(raiz(idx[t])) >= 40) grandes.push(idx[t], idx[t + 1], idx[t + 2]);
  const orig = [], nuevo = new Map(), out = grandes.map(i => { if (!nuevo.has(i)) { nuevo.set(i, orig.length); orig.push(i); } return nuevo.get(i); });
  const n = orig.length, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), ao = new Float32Array(n), r = new Float32Array(n);
  orig.forEach((o, k) => {
    const x = P[o * 3], y = P[o * 3 + 1], z = P[o * 3 + 2], nx = C.nor[o * 3], ny = C.nor[o * 3 + 1], nz = C.nor[o * 3 + 2];
    pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
    const [u, w] = uvDe(x, y, z); uv[k * 2] = u; uv[k * 2 + 1] = w;
    ao[k] = limitar(0.45 + 0.55 * C.F.distancia(x + nx * 0.03, y + ny * 0.03, z + nz * 0.03) / 0.04, 0.4, 1);
    r[k] = fbm(x * 12 + 9, y * 12, z * 12);
    if (!C.pesos[o]) { const ps = C.F.pesos(x, y, z), suma = ps.reduce((s, q) => s + q[1], 0) || 1; C.pesos[o] = ps.map(([h, w2]) => [IDX[h], w2 / suma]); }
    C.pesos[o].forEach(([h, w2], j) => { si[k * 4 + j] = h; sw[k * 4 + j] = w2; });
  });
  return { pos, nor, uv, ao, r, n, geo: geometria({ pos, nor, idx: out, si, sw, uv }) };
}
// Colores por vértice a partir de una función (x, y, z, v) → [r, g, b]
export function pintar(n, f) { const c = new Float32Array(n * 3); for (let v = 0; v < n; v++) c.set(f(v), v * 3); return c; }
