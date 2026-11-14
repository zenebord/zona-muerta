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
    const otro = grabarArma(id, { [m.estado]: m.valor ?? 1 });
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
  const mat = (color, tipo) => material(color, tipo || tipos[color]);
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
    for (const malla of mallas) { malla.userData.pieza = i; destino.add(malla); }
  });
  const arma = { raiz, partes, cargador, base, mat, extruir, tornear, grabarArma };
  // El cargador entero, para soltarlo o tenerlo en la mano: el de CARGADORES si el arma lo tiene
  arma.cargadorSuelto = () => {
    const g = new THREE.Group();
    const pols = typeof CARGADORES !== 'undefined' && CARGADORES[id] ? grabarCargador(id) : null;
    if (pols && pols.length) for (const p of pols) { const c = caja(p.pts), t = def.anchoCargador ?? Math.min(2.6, (c.y1 - c.y0) * 0.5), m = extruir(p.pts, p.huecos, mat(p.color), -t / 2, t / 2); m.userData.pieza = -1; g.add(m); }
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
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.clearGroups();
    if (!porMaterial.has(m.material)) porMaterial.set(m.material, []);
    porMaterial.get(m.material).push(g); raiz.remove(m);
  }
  for (const [mat, gs] of porMaterial) raiz.add(new THREE.Mesh(gs.length > 1 ? mergeGeometries(gs) : gs[0], mat));
}
