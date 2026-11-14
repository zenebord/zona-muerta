/* ===== Zona Muerta VR: los animales de Último bastión =====
 * Perro (la jauría de cinco), toro, cuervo (la bandada de seis) y buitre, con los colores del juego (js/zombies-
 * autoctonos.js y js/bastion-v2-dibujo.js) y lo que hace cada uno (js/bastion-v2.js):
 *   perro   muy rápido, rodea… y salta lo bajo (la mesa); muerde cada 0,6 s; poca vida; no cruza el fuego
 *   toro    escarba el piso 0,8 s (avisa), embiste derecho y atropella: mucho daño y aturde 2 s; después queda quieto
 *           2 s; si choca la mesa la sacude; cuatro veces la vida de un común; no cruza el fuego
 *   cuervo  vuelan por arriba de todo, rodean la cabeza y picotean; poca vida
 *   buitre  vuela alto, baja en picada, te levanta y te suelta en medio de la horda
 * Los cuadrúpedos son una superficie con piel sobre su esqueleto (vr/forma3d.js), como los zombies; las aves, piezas
 * rígidas (cuerpo, cabeza, alas de dos tramos con las plumas largas sueltas, cola) que aletean. */
import * as THREE from 'three';
import { v3, limitar, suave, hash3, fbm, respiro, Forma, malla, normales, geometria, pesosPiel } from './forma3d.js';
import { materialZombie } from './piel3d.js';

const col = hex => new THREE.Color(hex);
const IDENTIDAD = new THREE.Matrix4();
export const ESPECIES = {
  perro:  { nombre: 'Perro', vida: 0.5, vel: 3.2, mordida: 0.55, cadaMordida: 600, alcance: 0.75, voz: 1, radio: 0.75 },
  toro:   { nombre: 'Toro', vida: 6, vel: 0.55, mordida: 1, alcance: 1.6, voz: 2.2, radio: 2.2, embestida: { vel: 7, largo: 16, aviso: 0.8, aturde: 2, dano: 40, quieto: 2 } },
  cuervo: { nombre: 'Cuervo', vida: 0.4, vel: 4.2, mordida: 0.12, cadaMordida: 700, alcance: 0.9, voz: 0.4, vuela: true, altura: 3.5 },
  buitre: { nombre: 'Buitre', vida: 2.5, vel: 3.4, mordida: 0.5, alcance: 0.9, voz: 1, vuela: true, altura: 6.5 },
};

/* ---------- Cuadrúpedos: esqueleto y forma (mirando a +z; la izquierda es +x) ---------- */
const HUESOS4 = ['cadera', 'columna', 'pecho', 'cuello', 'cabeza', 'mandibula', 'cola1', 'cola2', 'brazoI', 'anteI', 'manoI', 'brazoD', 'anteD', 'manoD', 'musloI', 'piernaI', 'talonI', 'pieI', 'musloD', 'piernaD', 'talonD', 'pieD'];
const PADRE4 = { cadera: null, columna: 'cadera', pecho: 'columna', cuello: 'pecho', cabeza: 'cuello', mandibula: 'cabeza', cola1: 'cadera', cola2: 'cola1', brazoI: 'pecho', anteI: 'brazoI', manoI: 'anteI', brazoD: 'pecho', anteD: 'brazoD', manoD: 'anteD', musloI: 'cadera', piernaI: 'musloI', talonI: 'piernaI', pieI: 'talonI', musloD: 'cadera', piernaD: 'musloD', talonD: 'piernaD', pieD: 'talonD' };
const IDX4 = Object.fromEntries(HUESOS4.map((n, i) => [n, i]));
function espejar(A) { for (const n of ['brazo', 'ante', 'mano', 'muslo', 'pierna', 'talon', 'pie']) { const p = A[n + 'I']; A[n + 'D'] = [-p[0], p[1], p[2]]; } return A; }
const ESQ = {
  perro: espejar({ cadera: [0, 0.52, -0.28], columna: [0, 0.53, -0.06], pecho: [0, 0.52, 0.16], cuello: [0, 0.58, 0.28], cabeza: [0, 0.68, 0.4], mandibula: [0, 0.635, 0.45], cola1: [0, 0.56, -0.38], cola2: [0, 0.66, -0.5],
    brazoI: [0.08, 0.47, 0.2], anteI: [0.085, 0.29, 0.22], manoI: [0.085, 0.06, 0.21], musloI: [0.08, 0.5, -0.3], piernaI: [0.085, 0.32, -0.2], talonI: [0.085, 0.15, -0.34], pieI: [0.085, 0.03, -0.31] }),
  toro: espejar({ cadera: [0, 1.15, -0.65], columna: [0, 1.2, -0.15], pecho: [0, 1.2, 0.35], cuello: [0, 1.25, 0.65], cabeza: [0, 1.12, 0.98], mandibula: [0, 1.0, 1.06], cola1: [0, 1.2, -0.88], cola2: [0, 0.85, -0.98],
    brazoI: [0.21, 1.0, 0.45], anteI: [0.22, 0.6, 0.48], manoI: [0.22, 0.13, 0.46], musloI: [0.21, 1.05, -0.7], piernaI: [0.22, 0.65, -0.55], talonI: [0.22, 0.35, -0.74], pieI: [0.22, 0.07, -0.7] }),
};
function formaPerro(A) {
  const f = new Forma(), S = true;
  f.elip([0, 0.47, 0.13], [0.105, 0.15, 0.17], 'pecho', 0.04).elip([0, 0.5, -0.08], [0.08, 0.085, 0.16], 'columna', 0.04).elip([0, 0.5, -0.26], [0.09, 0.1, 0.12], 'cadera', 0.04)
   .cono([0, 0.52, 0.22], [0, 0.64, 0.36], 0.068, 0.05, 'cuello', 0.03)
   .elip([0, 0.69, 0.4], [0.064, 0.06, 0.078], 'cabeza', 0.02).cono([0, 0.672, 0.44], [0, 0.645, 0.56], 0.042, 0.028, 'cabeza', 0.015).elip([0, 0.648, 0.575], [0.019, 0.015, 0.013], 'cabeza', 0.008)
   .cono([0, 0.63, 0.45], [0, 0.615, 0.54], 0.026, 0.016, 'mandibula', 0.01)
   .elip([0.068, 0.655, 0.37], [0.012, 0.056, 0.034], 'cabeza', 0.012, S)   // orejas caídas
   .quitar([0.031, 0.705, 0.462], [0.013, 0.012, 0.012], 0.006, S);
  // patas: delanteras (hombro con músculo, antebrazo, mano) y traseras (muslo grande, pierna, garrón y pie)
  f.elip(A.brazoI, [0.045, 0.075, 0.052], 'brazoI', 0.03, S).cono(A.brazoI, A.anteI, 0.04, 0.028, 'brazoI', 0.02, S).cono(A.anteI, A.manoI, 0.025, 0.018, 'anteI', 0.012, S)
   .elip([A.manoI[0], 0.025, A.manoI[2] + 0.02], [0.026, 0.022, 0.036], 'manoI', 0.012, S)
   .elip([0.075, 0.42, -0.28], [0.05, 0.1, 0.075], 'musloI', 0.03, S).cono(A.musloI, A.piernaI, 0.045, 0.03, 'musloI', 0.02, S).cono(A.piernaI, A.talonI, 0.028, 0.02, 'piernaI', 0.012, S)
   .cono(A.talonI, A.pieI, 0.019, 0.016, 'talonI', 0.01, S).elip([A.pieI[0], 0.022, A.pieI[2] + 0.02], [0.026, 0.02, 0.036], 'pieI', 0.012, S)
   .cono(A.cola1, A.cola2, 0.022, 0.012, 'cola1', 0.012).cono(A.cola2, [0, 0.72, -0.57], 0.012, 0.005, 'cola2', 0.008);
  return f;
}
function formaToro(A) {
  const f = new Forma(), S = true;
  f.elip([0, 1.05, 0.3], [0.32, 0.38, 0.42], 'pecho', 0.08).elip([0, 1.02, -0.2], [0.3, 0.33, 0.45], 'columna', 0.08).elip([0, 1.08, -0.6], [0.28, 0.3, 0.3], 'cadera', 0.07)
   .elip([0, 1.43, 0.3], [0.19, 0.16, 0.32], 'pecho', 0.08)   // joroba
   .elip([0, 0.78, 0.45], [0.13, 0.12, 0.12], 'pecho', 0.06)  // papada
   .cono([0, 1.25, 0.55], [0, 1.18, 0.88], 0.23, 0.18, 'cuello', 0.06)
   .elip([0, 1.18, 0.98], [0.15, 0.15, 0.18], 'cabeza', 0.04).cono([0, 1.1, 1.02], [0, 1.0, 1.26], 0.12, 0.1, 'cabeza', 0.03).elip([0, 0.98, 1.3], [0.1, 0.075, 0.05], 'cabeza', 0.02)
   .cono([0, 0.97, 1.06], [0, 0.94, 1.22], 0.07, 0.05, 'mandibula', 0.02)
   .elip([0.18, 1.24, 0.92], [0.085, 0.026, 0.045], 'cabeza', 0.015, S)   // orejas al costado
   .quitar([0.1, 1.2, 1.08], [0.025, 0.022, 0.022], 0.01, S);
  f.elip([0.2, 0.92, 0.42], [0.1, 0.18, 0.13], 'brazoI', 0.05, S).cono(A.brazoI, A.anteI, 0.09, 0.07, 'brazoI', 0.04, S).cono(A.anteI, A.manoI, 0.06, 0.05, 'anteI', 0.02, S)
   .elip([A.manoI[0], 0.05, A.manoI[2] + 0.02], [0.065, 0.055, 0.08], 'manoI', 0.02, S)
   .elip([0.2, 0.9, -0.66], [0.13, 0.23, 0.17], 'musloI', 0.06, S).cono(A.musloI, A.piernaI, 0.11, 0.075, 'musloI', 0.04, S).cono(A.piernaI, A.talonI, 0.065, 0.05, 'piernaI', 0.02, S)
   .cono(A.talonI, A.pieI, 0.05, 0.048, 'talonI', 0.015, S).elip([A.pieI[0], 0.05, A.pieI[2] + 0.02], [0.065, 0.055, 0.08], 'pieI', 0.02, S)
   .cono(A.cola1, A.cola2, 0.04, 0.025, 'cola1', 0.02).cono(A.cola2, [0, 0.45, -0.98], 0.022, 0.012, 'cola2', 0.01).elip([0, 0.42, -0.98], [0.045, 0.08, 0.045], 'cola2', 0.015);   // con el mechón
  return f;
}
// Color del pelaje: lomo más oscuro, panza clara, manchas sin pelo, costillas a la vista y el hocico ensangrentado
function pintarPelaje(esp, pos, nor, sdf, n) {
  const c = new THREE.Color(), out = new Float32Array(n * 3), perro = esp === 'perro', s = perro ? 1 : 2.3;
  const pelo = col(perro ? '#8a6a44' : '#2a2622'), panza = col(perro ? '#c8b08a' : '#3a332c'), lomo = pelo.clone().multiplyScalar(0.6), piel = col(perro ? '#9a7c6e' : '#4a3a36'), sangre = col('#5a0c08'), hueso = col('#d8ccb0');
  for (let v = 0; v < n; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2], nx = nor[v * 3], ny = nor[v * 3 + 1], nz = nor[v * 3 + 2];
    const ao = limitar(0.3 + 0.7 * sdf(x + nx * 0.03 * s, y + ny * 0.03 * s, z + nz * 0.03 * s) / (0.03 * s), 0.25, 1), r = fbm(x * 9 / s, y * 9 / s, z * 9 / s);
    c.copy(pelo).lerp(lomo, limitar(ny * 1.2, 0, 0.7)).lerp(panza, limitar(-ny * 1.5 - 0.2, 0, 0.8));
    c.multiplyScalar(0.85 + r * 0.3);
    if (fbm(x * 14 / s + 3, y * 14 / s, z * 14 / s) > 0.66) c.lerp(piel, 0.7);                                       // sin pelo
    const flanco = x > 0.04 * s && Math.abs(z - 0.02 * s) < 0.12 * s && y > 0.38 * s && y < 0.55 * s;                 // costillas a la vista
    if (flanco) { c.lerp(sangre, 0.75); if (Math.abs(Math.sin(z / s * 95)) > 0.82) c.copy(hueso).multiplyScalar(0.9); }
    if (z > (perro ? 0.5 : 1.15) && y < (perro ? 0.66 : 1.06)) c.lerp(sangre, 0.6);                                     // el hocico
    c.multiplyScalar(ao);
    out[v * 3] = c.r; out[v * 3 + 1] = c.g; out[v * 3 + 2] = c.b;
  }
  return out;
}

/* ---------- Moldes de los animales (una vez, cuando hacen falta) ---------- */
const MOLDES = {}, ARMANDO = {};
export const animalListo = e => !!MOLDES[e];
export async function asegurarAnimales(ids) { for (const e of ids.filter(e => ESPECIES[e])) await (MOLDES[e] ? null : ARMANDO[e] || (ARMANDO[e] = armar(e))); }
async function armar(e) {
  await respiro();
  const t0 = performance.now(), M = { especie: e, ms: 0 };
  if (e === 'perro' || e === 'toro') {
    const A = ESQ[e], F = e === 'perro' ? formaPerro(A) : formaToro(A), sdf = (x, y, z) => F.distancia(x, y, z), s = e === 'perro' ? 1 : 2.3;
    const m = malla(sdf, [-0.2 * s, -0.01, -0.62 * s - (e === 'toro' ? 0.1 : 0)], [0.2 * s, 0.78 * s, 0.62 * s], e === 'perro' ? 0.0125 : 0.02), nor = normales(sdf, m.pos, 0.003 * s), n = m.pos.length / 3;
    const [si, sw] = pesosPiel(n, v => F.pesos(m.pos[v * 3], m.pos[v * 3 + 1], m.pos[v * 3 + 2], 0.012 * s), IDX4);
    M.A = A; M.geo = geometria({ pos: m.pos, nor, idx: m.idx, si, sw }); M.color = pintarPelaje(e, m.pos, nor, sdf, n);
    M.zonas = zonas4(A, s);
    // ojos que brillan (amarillos el perro, rojos el toro), dientes, cuernos y la argolla
    const ojos = [], extra = [];
    const ojoC = e === 'perro' ? [0.031, 0.705, 0.465] : [0.1, 1.2, 1.09];
    for (const sx of [1, -1]) ojos.push(new THREE.SphereGeometry(e === 'perro' ? 0.011 : 0.022, 10, 8).translate(sx * ojoC[0], ojoC[1], ojoC[2]));
    M.ojos = mezclar(ojos);
    if (e === 'perro') { const d = []; for (let k = 0; k < 8; k++) { const a = (k - 3.5) * 0.22, g = new THREE.ConeGeometry(0.004, 0.014, 5); g.rotateX(Math.PI).translate(Math.sin(a) * 0.02, 0.632, 0.47 + Math.cos(a) * 0.06); d.push(g); } M.dientes = mezclar(d); }
    else {
      for (const sx of [1, -1]) {   // cuernos: salen del cráneo hacia afuera y se curvan adelante y arriba
        const curva = new THREE.CubicBezierCurve3(v3(sx * 0.12, 1.3, 0.95), v3(sx * 0.32, 1.32, 0.95), v3(sx * 0.42, 1.42, 1.05), v3(sx * 0.38, 1.6, 1.18));
        const g = new THREE.TubeGeometry(curva, 16, 0.05, 10, false), p = g.attributes.position, c = new Float32Array(p.count * 3);
        for (let i = 0; i < p.count; i++) {   // se afina hacia la punta, marfil con la punta oscura
          const k = Math.floor(i / 11) / 16, cen = curva.getPoint(k), q = v3(p.getX(i), p.getY(i), p.getZ(i)).sub(cen).multiplyScalar(1 - k * 0.85).add(cen);
          p.setXYZ(i, q.x, q.y, q.z); const cc = col('#d8cfae').lerp(col('#2a2622'), Math.max(0, k - 0.6) * 2.2); c.set([cc.r, cc.g, cc.b], i * 3);
        }
        g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.deleteAttribute('uv'); g.computeVertexNormals(); extra.push(g);
      }
      const argolla = new THREE.TorusGeometry(0.05, 0.008, 6, 18).translate(0, 0.93, 1.33); const c = new Float32Array(argolla.attributes.position.count * 3).fill(0.6); argolla.setAttribute('color', new THREE.BufferAttribute(c, 3)); argolla.deleteAttribute('uv'); extra.push(argolla);
      M.extra = mezclar(extra.map(g => { if (!g.attributes.color) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3)); return g; }));
    }
  } else M.ave = armarAve(e);
  M.ms = performance.now() - t0;
  MOLDES[e] = M;
  return M;
}
function mezclar(gs) {
  const out = []; for (const g of gs) { const q = g.index ? g.toNonIndexed() : g; if (q.attributes.uv) q.deleteAttribute('uv'); out.push(q); }
  const n = out.reduce((s, g) => s + g.attributes.position.count, 0), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col3 = out.every(g => g.attributes.color) ? new Float32Array(n * 3) : null; let k = 0;
  for (const g of out) { if (!g.attributes.normal) g.computeVertexNormals(); pos.set(g.attributes.position.array, k * 3); nor.set(g.attributes.normal.array, k * 3); if (col3) col3.set(g.attributes.color.array, k * 3); k += g.attributes.position.count; }
  const r = new THREE.BufferGeometry(); r.setAttribute('position', new THREE.BufferAttribute(pos, 3)); r.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); if (col3) r.setAttribute('color', new THREE.BufferAttribute(col3, 3));
  return r;
}
function zonas4(A, s) {
  const esf = (rx, ry, rz) => new THREE.SphereGeometry(1, 10, 8).scale(rx, ry, rz);
  const tubo = (a, c, r) => { const L = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]), g = new THREE.CylinderGeometry(r, r, L, 8); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), v3(c[0] - a[0], c[1] - a[1], c[2] - a[2]).normalize())); return g; };
  const out = [['cabeza', esf(0.075 * s, 0.07 * s, 0.11 * s), [A.cabeza[0], A.cabeza[1], A.cabeza[2] + 0.04 * s], 'cabeza'], ['cuello', esf(0.07 * s, 0.07 * s, 0.09 * s), [0, A.cuello[1] - 0.02 * s, A.cuello[2]], 'tronco'],
    ['pecho', esf(0.12 * s, 0.16 * s, 0.19 * s), [0, A.pecho[1] - 0.05 * s, A.pecho[2] - 0.02 * s], 'tronco'], ['columna', esf(0.1 * s, 0.1 * s, 0.17 * s), [0, A.columna[1] - 0.03 * s, A.columna[2]], 'tronco'], ['cadera', esf(0.1 * s, 0.11 * s, 0.13 * s), [0, A.cadera[1] - 0.02 * s, A.cadera[2]], 'tronco']];
  for (const L of ['I', 'D']) for (const [h, a, c, r] of [['brazo' + L, A['brazo' + L], A['ante' + L], 0.04], ['ante' + L, A['ante' + L], A['mano' + L], 0.028], ['muslo' + L, A['muslo' + L], A['pierna' + L], 0.05], ['pierna' + L, A['pierna' + L], A['pie' + L], 0.03]]) out.push([h, tubo(a, c, r * s), [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2], 'miembro']);
  return out;
}

/* ---------- Aves: piezas rígidas ---------- */
function armarAve(e) {
  const cuervo = e === 'cuervo', s = cuervo ? 1 : 2.1;
  const pintarG = (g, f) => { const p = g.attributes.position, c = new Float32Array(p.count * 3), q = new THREE.Color(); for (let i = 0; i < p.count; i++) { f(q, p.getX(i), p.getY(i), p.getZ(i)); c.set([q.r, q.g, q.b], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g; };
  const pluma = cuervo ? col('#23252e') : col('#3b3026'), clara = cuervo ? col('#3b4159') : col('#57483a'), oscura = cuervo ? col('#15161b') : col('#241d17');
  // cuerpo (con la herida y las costillas de la panza) y cola, por campo de distancia
  const F = new Forma();
  F.elip([0, 0, 0], [0.055 * s, 0.05 * s, 0.11 * s], 'c', 0.02 * s).elip([0, -0.005 * s, -0.12 * s], [0.03 * s, 0.012 * s, 0.07 * s], 'c', 0.01 * s);
  if (!cuervo) F.elip([0, 0.025 * s, 0.085 * s], [0.045 * s, 0.035 * s, 0.03 * s], 'c', 0.015 * s);   // la gola
  const sdf = (x, y, z) => F.distancia(x, y, z), m = malla(sdf, [-0.08 * s, -0.07 * s, -0.22 * s], [0.08 * s, 0.07 * s, 0.14 * s], 0.006 * s), nor = normales(sdf, m.pos, 0.002 * s);
  const cuerpo = geometria({ pos: m.pos, nor, idx: m.idx });
  pintarG(cuerpo, (q, x, y, z) => {
    q.copy(pluma).multiplyScalar(0.85 + fbm(x * 60 / s, y * 60 / s, z * 60 / s) * 0.3);
    if (!cuervo && z > 0.06 * s && y > 0) q.set('#ddd6c6');                                                          // gola blanca
    if (y < -0.025 * s && Math.abs(z) < 0.05 * s) { q.lerp(col('#6e0b0b'), 0.8); if (Math.abs(Math.sin(z / s * 160)) > 0.8) q.set('#e1d7c3'); }   // costillas y herida
  });
  // cabeza: el cuervo con su pico; el buitre con el cuello pelado y el pico ganchudo
  const cab = [];
  if (cuervo) {
    cab.push(pintarG(new THREE.SphereGeometry(0.032, 12, 10).scale(1, 0.95, 1.1), q => q.copy(pluma)));
    cab.push(pintarG(new THREE.ConeGeometry(0.013, 0.05, 8).rotateX(Math.PI / 2).translate(0, -0.004, 0.045), q => q.set('#5a5440')));
  } else {
    cab.push(pintarG(new THREE.CylinderGeometry(0.018, 0.026, 0.12, 10).rotateX(-0.9).translate(0, 0.04, -0.03), q => q.set('#b89088')));   // cuello pelado
    cab.push(pintarG(new THREE.SphereGeometry(0.035, 12, 10).scale(1, 0.85, 1.2).translate(0, 0.075, 0.02), q => q.set('#b89088')));
    cab.push(pintarG(new THREE.ConeGeometry(0.015, 0.06, 8).rotateX(Math.PI / 2 + 0.5).translate(0, 0.062, 0.07), q => q.set('#d8cfae')));
  }
  const ojos = mezclar([1, -1].map(sx => new THREE.SphereGeometry(0.0065 * (cuervo ? 1 : 1.2), 8, 6).translate(sx * 0.024, cuervo ? 0.008 : 0.082, cuervo ? 0.018 : 0.035)));
  const cabeza = mezclar(cab);
  // ala izquierda en dos tramos (la derecha es el espejo): adentro las cobertoras, afuera las plumas largas separadas
  const tramo = (largo, ancho, dedos, base) => {
    const sh = new THREE.Shape(); sh.moveTo(0, 0.01); sh.lineTo(largo, 0.006);
    if (dedos) for (let k = 0; k < dedos; k++) { const x = largo - k * largo / dedos * 0.85, y0 = -ancho * (0.45 + k * 0.08); sh.lineTo(x + largo * 0.06, y0); sh.lineTo(x - largo * 0.05, y0 * 0.55); }
    else for (let k = 0; k <= 6; k++) sh.lineTo(largo * (1 - k / 6), -ancho * (0.85 + (k % 2) * 0.15));
    sh.lineTo(0, -ancho * 0.9); sh.closePath();
    const g = new THREE.ShapeGeometry(sh); g.rotateX(Math.PI / 2);
    return pintarG(g, (q, x, y, z) => q.copy(base).lerp(oscura, limitar(-z / ancho, 0, 1) * 0.6).multiplyScalar(0.85 + fbm(x * 40, z * 40, 1) * 0.3));
  };
  const alaIn = tramo(0.13 * s, 0.09 * s, 0, clara), alaOut = tramo(0.15 * s, 0.1 * s, cuervo ? 5 : 7, pluma);
  const cola = pintarG(new THREE.CircleGeometry(0.07 * s, 10, Math.PI * 1.25, Math.PI * 0.5).rotateX(-Math.PI / 2).translate(0, 0, -0.1 * s), q => q.copy(oscura));
  const patas = mezclar([1, -1].map(sx => pintarG(new THREE.CylinderGeometry(0.004 * s, 0.003 * s, 0.07 * s, 5).rotateX(1.2).translate(sx * 0.02 * s, -0.05 * s, -0.05 * s), q => q.set(cuervo ? '#2a2620' : '#8a7a56'))));
  return { cuerpo, cabeza, ojos, alaIn, alaOut, cola, patas, s, cabezaEn: cuervo ? [0, 0.03, 0.12] : [0, 0.03 * s, 0.09 * s] };
}

/* ---------- Un animal ---------- */
export class Animal {
  constructor(escena, efectos, especie, horda) {
    const M = MOLDES[especie];
    this.escena = escena; this.efectos = efectos; this.horda = horda; this.especie = especie; this.tipo = especie; this.clase = 'animal'; this.M = M;
    this.E = ESPECIES[especie]; this.T = { nombre: this.E.nombre, mordida: this.E.mordida, animal: true };
    this.vuela = !!this.E.vuela; this.radio = this.E.radio || 0.5;
    this.grupo = new THREE.Group(); this.grupo.visible = false; escena.add(this.grupo); this.grupo.rotation.order = 'YXZ';
    this.mat = materialZombie('piel', { venas: 0.15, dispersion: 0.3, relieve: 1.4, escala: especie === 'toro' ? 0.6 : 1.5 });
    if (M.geo) {
      this.huesos = {};
      for (const n of HUESOS4) { const b = new THREE.Bone(), p = M.A[n], pp = PADRE4[n] ? M.A[PADRE4[n]] : [0, 0, 0]; b.position.set(p[0] - pp[0], p[1] - pp[1], p[2] - pp[2]); this.huesos[n] = b; if (PADRE4[n]) this.huesos[PADRE4[n]].add(b); }
      this.grupo.add(this.huesos.cadera); this.grupo.updateMatrixWorld(true);
      this.esqueleto = new THREE.Skeleton(HUESOS4.map(n => this.huesos[n]));
      const g = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'skinIndex', 'skinWeight']) g.setAttribute(k, M.geo.attributes[k]); g.setIndex(M.geo.index);
      g.setAttribute('color', new THREE.BufferAttribute(M.color.slice(), 3));
      this.cuerpo = new THREE.SkinnedMesh(g, this.mat); this.cuerpo.frustumCulled = false; this.grupo.add(this.cuerpo); this.cuerpo.bind(this.esqueleto, IDENTIDAD);
      const C = M.A.cabeza, rel = geo => geo.clone().translate(-C[0], -C[1], -C[2]);
      this.ojos = new THREE.Mesh(rel(M.ojos), new THREE.MeshBasicMaterial({ color: especie === 'perro' ? 0xf0d040 : 0xff3020, toneMapped: false })); this.huesos.cabeza.add(this.ojos);
      if (M.dientes) { const J = M.A.mandibula, d = new THREE.Mesh(M.dientes.clone().translate(-J[0], -J[1], -J[2]), new THREE.MeshStandardMaterial({ color: 0xd8d0b0, roughness: 0.4 })); this.huesos.mandibula.add(d); }
      if (M.extra) this.huesos.cabeza.add(new THREE.Mesh(rel(M.extra), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.2 })));
      this.zonas = M.zonas.map(([hueso, geo, c, tipo]) => { const m = new THREE.Mesh(geo, horda.matZona), h = M.A[hueso]; m.position.set(c[0] - h[0], c[1] - h[1], c[2] - h[2]); this.huesos[hueso].add(m); m.userData = { zombie: this, tipo, hueso }; return m; });
    } else {   // ave
      const A = M.ave, mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
      this.cuerpoAve = new THREE.Group(); this.grupo.add(this.cuerpoAve);
      this.cuerpoAve.add(new THREE.Mesh(A.cuerpo, mat), new THREE.Mesh(A.cola, mat), new THREE.Mesh(A.patas, mat));
      this.cabezaAve = new THREE.Group(); this.cabezaAve.position.set(...A.cabezaEn); this.cuerpoAve.add(this.cabezaAve);
      this.cabezaAve.add(new THREE.Mesh(A.cabeza, mat), new THREE.Mesh(A.ojos, new THREE.MeshBasicMaterial({ color: 0xff3b2e, toneMapped: false })));
      this.alas = [1, -1].map(sx => {
        const hombro = new THREE.Group(); hombro.position.set(sx * 0.04 * A.s, 0.02 * A.s, 0.01 * A.s); this.cuerpoAve.add(hombro);
        const adentro = new THREE.Mesh(A.alaIn, mat), codo = new THREE.Group(), afuera = new THREE.Mesh(A.alaOut, mat);
        codo.position.set(0.13 * A.s, 0, 0); hombro.add(adentro, codo); codo.add(afuera); hombro.scale.x = sx;
        return { hombro, codo };
      });
      const z = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6).scale(0.08 * A.s, 0.07 * A.s, 0.15 * A.s), horda.matZona); z.userData = { zombie: this, tipo: 'tronco', hueso: 'cuerpo' };
      const zc = new THREE.Mesh(new THREE.SphereGeometry(0.05 * A.s, 8, 6), horda.matZona); zc.position.set(...A.cabezaEn); zc.userData = { zombie: this, tipo: 'cabeza', hueso: 'cabeza' };
      this.cuerpoAve.add(z, zc); this.zonas = [z, zc];
    }
    this.libre = true; this.estado = 'muerto'; this.vida = 0; this.fase = Math.random() * 6; this.objetivo = v3(); this.destino = v3(); this.subido = 0;
    this.muertoEn = 0; this.tiempoCuerpo = 6000; this.apuro = 1; this.apuroHasta = 0; this.aturdido = 0;
  }
  get vivo() { return !this.libre && this.estado !== 'cae' && this.estado !== 'muerto'; }
  get blanco() { return this.vivo; }
  detalle() {}
  aparecer(p, tipo, op = {}) {
    const g = this.grupo, E = this.E;
    this.vidaMax = VIDA_ZOMBIE_NORMAL * E.vida * (op.vida || 1); this.vida = this.vidaMax;
    this.velocidad = E.vel * (op.velocidad || 1) * (0.9 + Math.random() * 0.2); this.quieto = !!op.quieto;
    this.estado = 'camina'; this.libre = false; this.accion = null; this.caida = 0; this.aturdido = 0; this.subido = 0; this.directo = this.especie === 'perro';
    this.proximaMordida = 0; this.proximoGrunido = (op.ahora ?? performance.now()) + 1000 + Math.random() * 3000; this.proximoEspecial = (op.ahora ?? performance.now()) + 2500 + Math.random() * 2500;
    this.quemando = 0; if (this.llamas) for (const l of this.llamas) l.visible = false;
    g.position.set(p.x, this.vuela ? E.altura + Math.random() : 0, p.z); g.rotation.set(0, op.rumbo ?? Math.atan2(-p.x, -p.z), 0); g.scale.setScalar(0.92 + Math.random() * 0.16);
    if (this.cuerpo) { this.cuerpo.geometry.attributes.color.array.set(this.M.color); this.cuerpo.geometry.attributes.color.needsUpdate = true; for (const b of Object.values(this.huesos)) b.rotation.set(0, 0, 0); }
    this.vel = v3(); this.orbita = Math.random() * Math.PI * 2; this.subiendo = 0;
    g.visible = true;
  }
  liberar() { this.libre = true; this.grupo.visible = false; this.estado = 'muerto'; this.quemando = 0; if (this.llamas) for (const l of this.llamas) l.visible = false; }
  cerca(p, r = 0.3) {
    if (this.libre || this.estado === 'muerto') return false;
    const g = this.grupo.position, s = this.especie === 'toro' ? 0.5 : 0.25;
    return Math.hypot(p.x - g.x, p.z - g.z) < s + r && p.y > g.y - 0.2 && p.y < g.y + (this.especie === 'toro' ? 1.6 : 0.8);
  }
  incendiar(seg) {
    if (this.vuela) { this.quemando = seg; return; }
    if (!this.llamas) this.llamas = ['pecho', 'columna', 'cadera', 'cuello'].map(h => { const s = new THREE.Sprite(this.efectos.matFuego.clone()); s.scale.setScalar(this.especie === 'toro' ? 0.5 : 0.25); this.huesos[h].add(s); s.position.set(0, 0.05, 0); return s; });
    this.quemando = Math.max(this.quemando || 0, seg);
  }
  recibir(golpe) {
    if (!this.vivo) return false;
    const zona = golpe.zona ? golpe.zona.userData.tipo : 'tronco', mult = zona === 'cabeza' ? 4 : zona === 'miembro' ? 0.6 : 1;
    this.vida -= golpe.dano * mult;
    if (this.cuerpo && golpe.punto) this.manchar(golpe.punto, golpe.zona ? golpe.zona.userData.hueso : 'pecho');
    if (golpe.dano * mult >= 8 && this.especie !== 'toro') this.aturdido = 0.4;
    if (this.vida <= 0 || (zona === 'cabeza' && this.especie !== 'toro')) { this.morir(golpe); return true; }
    if (Math.random() < 0.5) Audio_.gruñido(150, this.E.voz, false);
    return false;
  }
  manchar(punto, hueso) {
    const b = this.huesos[hueso]; if (!b) return; b.updateWorldMatrix(true, false);
    const r = b.worldToLocal(punto.clone()).add(v3(...this.M.A[hueso])), p = this.cuerpo.geometry.attributes.position.array, c = this.cuerpo.geometry.attributes.color, a = c.array, rad = this.especie === 'toro' ? 0.12 : 0.05;
    for (let v = 0; v < p.length / 3; v++) { const d = Math.hypot(p[v * 3] - r.x, p[v * 3 + 1] - r.y, p[v * 3 + 2] - r.z); if (d < rad) { const k = (1 - d / rad) * 0.85; a[v * 3] += (0.25 - a[v * 3]) * k; a[v * 3 + 1] *= 1 - k * 0.8; a[v * 3 + 2] *= 1 - k * 0.8; } }
    c.needsUpdate = true;
  }
  morir(golpe) {
    this.estado = 'cae'; this.caida = 0; this.accion = null; this.lado = Math.random() < 0.5 ? 1 : -1;
    Audio_.animalMuere(this.E.voz);
    if (this.vuela) { this.vel = v3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2); for (let k = 0; k < 8; k++) this.efectos.particula(this.efectos.matHumoOscuro, this.grupo.position.clone(), v3((Math.random() - 0.5) * 2, Math.random(), (Math.random() - 0.5) * 2), 0.06, 1.2, 1, 1.5); }
    if (this.alMorir) this.alMorir(this, false, golpe && golpe.tipo);
  }
  quemar(dt) {
    if (!(this.quemando > 0)) return;
    this.quemando -= dt;
    if (this.llamas) for (const s of this.llamas) { s.visible = this.quemando > 0; s.material.rotation = Math.random() * 6; }
    if (this.vivo) { this.vida -= 5 * dt; if (this.vida <= 0) this.morir({ tipo: 'fuego' }); }
  }

  actualizar(ahora, dt, alMorder) {
    if (this.libre) return;
    this.quemar(dt);
    if (this.estado === 'cae' || this.estado === 'muerto') return this.actualizarCaida(ahora, dt);
    if (this.vuela) return this.actualizarVuelo(ahora, dt, alMorder);
    const g = this.grupo, E = this.E, W = this.horda.mundo, dist = Math.hypot(this.objetivo.x - g.position.x, this.objetivo.z - g.position.z);
    this.aturdido = Math.max(0, this.aturdido - dt);
    if (this.accion) return this.actualizarEmbestida(ahora, dt);
    // el toro avisa y embiste cuando te tiene enfrente
    if (this.especie === 'toro' && !this.quieto && ahora > this.proximoEspecial && dist < 18 && dist > 3) {
      this.accion = { tipo: 'escarba', t0: ahora, hacia: this.objetivo.clone() }; this.proximoEspecial = ahora + 7000; Audio_.gruñido(Math.min(600, dist * 25), E.voz, true); return;
    }
    const ataca = dist < E.alcance * g.scale.x;
    // no cruzan el fuego: si hay llamas adelante, se frenan y retroceden
    const adelante = g.position.clone().add(v3(Math.sin(g.rotation.y), 0.4, Math.cos(g.rotation.y)).multiplyScalar(1.2));
    const fuego = W && W.fuegoCerca && W.fuegoCerca(adelante, 1.3);
    const hacia = ataca ? this.objetivo : this.destino;
    let dif = Math.atan2(hacia.x - g.position.x, hacia.z - g.position.z) - g.rotation.y; dif = Math.atan2(Math.sin(dif), Math.cos(dif));
    g.rotation.y += limitar(dif, -4 * dt, 4 * dt) + (fuego ? dt * 2.5 : 0);
    const anda = !ataca && !this.quieto && this.aturdido <= 0, vel = this.velocidad * (ahora < this.apuroHasta ? this.apuro : 1) * this.horda.apuroGlobal;
    if (anda && !fuego) g.position.addScaledVector(v3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)), vel * dt * Math.max(0.25, Math.cos(dif)));
    if (fuego) g.position.addScaledVector(v3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)), -1.5 * dt);
    g.position.y += (this.subido * (this.especie === 'perro' ? 1 : 0) - g.position.y) * Math.min(1, dt * 8);   // el perro salta a la mesa y del otro lado
    this.fase += dt * (anda ? (this.especie === 'perro' ? 12 : 4.5) * Math.min(1.5, vel / E.vel) : 1.5);
    this.pose4(ahora, anda ? (this.especie === 'perro' ? 'galope' : 'paso') : ataca ? 'ataca' : 'quieto');
    if (ahora > this.proximoGrunido) { Audio_.gruñido(Math.min(600, dist * 25), E.voz, false); this.proximoGrunido = ahora + 2500 + Math.random() * 3500; }
    if (ataca && ahora > this.proximaMordida) { this.proximaMordida = ahora + (E.cadaMordida || 1400); Audio_.gruñido(30, E.voz, true); if (alMorder) alMorder(this); }
  }
  // El toro: escarba (avisa), embiste derecho y queda quieto
  actualizarEmbestida(ahora, dt) {
    const A = this.accion, g = this.grupo, B = this.E.embestida, W = this.horda.mundo, t = (ahora - A.t0) / 1000;
    if (A.tipo === 'escarba') {
      let dif = Math.atan2(A.hacia.x - g.position.x, A.hacia.z - g.position.z) - g.rotation.y; dif = Math.atan2(Math.sin(dif), Math.cos(dif)); g.rotation.y += limitar(dif, -3 * dt, 3 * dt);
      this.fase += dt * 14; this.pose4(ahora, 'escarba');
      if (Math.random() < dt * 10) this.efectos.particula(this.efectos.matPolvo, this.huesos.manoD.getWorldPosition(v3()), v3((Math.random() - 0.5), 0.8, -1), 0.3, 0.8, 2);
      if (t >= B.aviso) { const d = A.hacia.clone().sub(g.position).setY(0).normalize(); this.accion = { tipo: 'embiste', t0: ahora, dir: d, desde: g.position.clone(), pego: false }; Audio_.gruñido(10, this.E.voz, true); }
      return;
    }
    if (A.tipo === 'embiste') {
      const paso = (B.vel * this.horda.apuroGlobal) * dt; g.position.addScaledVector(A.dir, paso); g.rotation.y = Math.atan2(A.dir.x, A.dir.z);
      this.fase += dt * 11; this.pose4(ahora, 'galope');
      if (Math.random() < dt * 12) this.efectos.particula(this.efectos.matPolvo, g.position.clone().add(v3(0, 0.1, 0)), v3(0, 0.5, 0), 0.4, 1, 2);
      const ojo = W.ojo(), d = Math.hypot(ojo.x - g.position.x, ojo.z - g.position.z);
      if (!A.pego && d < 1.0 * g.scale.x) { A.pego = true; W.danar(B.dano, 'embestida'); W.aturdir(B.aturde); W.temblor(1); }
      const mesa = W.mesa, frente = g.position.clone().addScaledVector(A.dir, 1.1 * g.scale.x);
      const choca = frente.x > mesa.x0 && frente.x < mesa.x1 && frente.z > mesa.z0 && frente.z < mesa.z1;
      if (choca) { W.empujarArmas(frente.setY(1), 1.6, 4); W.temblor(0.8); Audio_.casquillo('cargador', 'asfalto', 1); }
      const fuego = W.fuegoCerca && W.fuegoCerca(frente.setY(0.6), 1.2);
      if (choca || fuego || g.position.distanceTo(A.desde) > B.largo || Math.abs(g.position.x) > 11.5) this.accion = { tipo: 'quieto', t0: ahora };
      return;
    }
    // quieto después de embestir (o aturdido por el choque): el momento de tirarle
    this.pose4(ahora, 'quieto');
    if (t >= B.quieto) this.accion = null;
  }
  pose4(ahora, modo) {
    const H = this.huesos, f = this.fase, A = this.M.A, perro = this.especie === 'perro';
    const pata = (n, fase, amp, rodilla) => { const s = Math.sin(f + fase), c = Math.cos(f + fase); H[n].rotation.x = -s * amp; return Math.max(0, c) * rodilla; };
    H.cadera.position.y = A.cadera[1]; H.cadera.rotation.set(0, 0, 0); H.columna.rotation.set(0, 0, 0); H.pecho.rotation.set(0, 0, 0);
    H.cuello.rotation.set(0.15, 0, 0); H.cabeza.rotation.set(-0.15 + Math.sin(ahora * 0.002) * 0.05, Math.sin(ahora * 0.0013) * 0.15, 0); H.mandibula.rotation.set(0.15, 0, 0);
    H.cola1.rotation.set(perro ? -0.5 : 0.3, Math.sin(ahora * 0.006) * 0.3, 0); H.cola2.rotation.set(perro ? -0.3 : 0.1, 0, 0);
    if (modo === 'galope' || modo === 'paso') {
      const galope = modo === 'galope', amp = galope ? 0.75 : 0.35, fases = galope ? [0, 0.4, Math.PI, Math.PI + 0.4] : [0, Math.PI, Math.PI / 2, Math.PI * 1.5];
      H.anteI.rotation.x = pata('brazoI', fases[0], amp, galope ? 1.1 : 0.5); H.anteD.rotation.x = pata('brazoD', fases[1], amp, galope ? 1.1 : 0.5);
      H.piernaI.rotation.x = -pata('musloI', fases[2], amp, galope ? 0.9 : 0.4); H.piernaD.rotation.x = -pata('musloD', fases[3], amp, galope ? 0.9 : 0.4);
      H.talonI.rotation.x = H.piernaI.rotation.x * -0.8; H.talonD.rotation.x = H.piernaD.rotation.x * -0.8;
      H.columna.rotation.x = galope ? Math.sin(f * 2) * 0.08 : 0; H.cadera.position.y = A.cadera[1] + (galope ? Math.abs(Math.sin(f)) * 0.04 * (perro ? 1 : 2.3) : 0);
      H.cabeza.rotation.x += galope ? Math.sin(f * 2) * 0.1 : 0;
    } else {
      for (const n of ['brazoI', 'brazoD', 'musloI', 'musloD', 'anteI', 'anteD', 'piernaI', 'piernaD', 'talonI', 'talonD']) H[n].rotation.x = 0;
      if (modo === 'ataca') { H.mandibula.rotation.x = 0.25 + Math.abs(Math.sin(ahora * 0.015)) * 0.45; H.cuello.rotation.x = 0.4 + Math.sin(ahora * 0.012) * 0.15; H.cabeza.rotation.x = -0.3; }
      if (modo === 'escarba') { H.brazoD.rotation.x = -0.4 + Math.sin(f) * 0.6; H.anteD.rotation.x = 0.6 + Math.sin(f) * 0.4; H.cuello.rotation.x = 0.45; H.cabeza.rotation.x = 0.2; }
    }
  }
  // Aves: el cuervo rodea la cabeza y picotea; el buitre vuela alto, baja en picada y te levanta
  actualizarVuelo(ahora, dt, alMorder) {
    const g = this.grupo, E = this.E, W = this.horda.mundo, ojo = W ? W.ojo() : this.objetivo.clone().setY(1.6), t = ahora / 1000;
    let meta;
    if (this.especie === 'cuervo') {
      this.orbita += dt * (1.6 + (this.fase % 1));
      const r = 0.55 + 0.35 * Math.sin(t * 1.7 + this.fase), cerca = g.position.distanceTo(ojo) < 3;
      meta = cerca ? ojo.clone().add(v3(Math.cos(this.orbita) * r, 0.1 + Math.sin(t * 3 + this.fase) * 0.25, Math.sin(this.orbita) * r))
                   : ojo.clone().add(v3(Math.cos(this.orbita) * 2.5, E.altura - 1.6 + Math.sin(t + this.fase), Math.sin(this.orbita) * 2.5));
      if (g.position.distanceTo(ojo) < E.alcance && ahora > this.proximaMordida && !this.quieto) { this.proximaMordida = ahora + E.cadaMordida; if (alMorder) alMorder(this); Audio_.gruñido(20, E.voz, true); }
    } else {
      const A = this.accion || (this.accion = { tipo: 'vuela', t0: ahora, hasta: ahora + 5000 + Math.random() * 4000 });
      if (A.tipo === 'vuela') { this.orbita += dt * 0.5; meta = ojo.clone().add(v3(Math.cos(this.orbita) * 7, E.altura - 1.6, Math.sin(this.orbita) * 7)); if (ahora > A.hasta && !this.quieto) { this.accion = { tipo: 'picada', t0: ahora }; Audio_.gruñido(100, E.voz, true); } }
      else if (A.tipo === 'picada') {
        meta = ojo.clone();
        if (g.position.distanceTo(ojo) < 0.9 && W) { W.raptar(this); this.accion = { tipo: 'sube', t0: ahora }; }
        if (ahora - A.t0 > 6000) this.accion = { tipo: 'sube', t0: ahora };
      } else { meta = g.position.clone().add(v3(0, 4, 0)); if (ahora - A.t0 > 3000) this.accion = { tipo: 'vuela', t0: ahora, hasta: ahora + 12000 + Math.random() * 6000 }; }
    }
    if (this.quieto) meta = g.position.clone().setY(Math.max(1.6, g.position.y));
    const quiere = meta.sub(g.position), l = quiere.length(), vmax = this.velocidad * (this.accion && this.accion.tipo === 'picada' ? 1.8 : 1) * this.horda.apuroGlobal;
    this.vel.lerp(quiere.normalize().multiplyScalar(Math.min(vmax, l * 3)), Math.min(1, dt * 3));
    g.position.addScaledVector(this.vel, dt);
    if (this.vel.lengthSq() > 0.01) { const r = Math.atan2(this.vel.x, this.vel.z); let d = r - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); g.rotation.y += d * Math.min(1, dt * 6); g.rotation.z = -d * 0.6; g.rotation.x = limitar(-this.vel.y * 0.15, -0.6, 0.6); }
    // aleteo: rápido el cuervo; el buitre planea y aletea de a ratos
    const aleteo = this.especie === 'cuervo' ? Math.sin(t * 18 + this.fase) * 0.9 : (Math.sin(t * 0.7 + this.fase) > 0.3 ? Math.sin(t * 7) * 0.7 : 0.08);
    for (const [k, a] of this.alas.entries()) { a.hombro.rotation.z = aleteo * (k ? -1 : 1) * 1; a.codo.rotation.z = aleteo * (k ? -1 : 1) * 0.5; }
    this.cabezaAve.rotation.y = Math.sin(t * 2.3 + this.fase) * 0.4;
    if (ahora > this.proximoGrunido) { Audio_.gruñido(Math.min(600, g.position.distanceTo(ojo) * 25), E.voz, false); this.proximoGrunido = ahora + 3000 + Math.random() * 4000; }
  }
  actualizarCaida(ahora, dt) {
    const g = this.grupo;
    if (this.vuela) {   // cae a plomo
      if (this.estado === 'cae') { this.vel.y -= 9.8 * dt; g.position.addScaledVector(this.vel, dt); g.rotation.z += dt * 6; if (g.position.y <= 0.05) { g.position.y = 0.05; this.estado = 'muerto'; this.muertoEn = ahora; Audio_.cuerpoAnimalCae(this.E.voz * 0.5, 0.6); } }
      for (const a of this.alas) { a.hombro.rotation.z = -0.3; a.codo.rotation.z = -0.2; }
    } else {
      if (this.estado === 'cae') { this.caida = Math.min(1, this.caida + dt / 0.7); if (this.caida >= 1) { this.estado = 'muerto'; this.muertoEn = ahora; Audio_.cuerpoAnimalCae(this.E.voz, 1); } }
      const c = suave(this.caida); g.rotation.z = this.lado * c * Math.PI / 2 * 0.95; g.position.y = this.subido * (1 - c);
      const H = this.huesos; for (const n of ['brazoI', 'brazoD', 'musloI', 'musloD']) H[n].rotation.x = c * 0.3; H.cuello.rotation.x = -0.2 * c;
    }
    if (this.estado === 'muerto') { const t = ahora - this.muertoEn; if (t > this.tiempoCuerpo) g.position.y = (this.vuela ? 0.05 : 0) - Math.min(0.6, (t - this.tiempoCuerpo) / 1000 * 0.3); if (t > this.tiempoCuerpo + 1600) this.liberar(); }
  }
}
export function crearAnimal(especie, horda) { return MOLDES[especie] ? new Animal(horda.escena, horda.efectos, especie, horda) : null; }
