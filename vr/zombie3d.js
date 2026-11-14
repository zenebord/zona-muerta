/* ===== Zona Muerta VR: los zombies en 3D =====
 * Todos los del juego: el caminante y sus variantes, y los de Último bastión con lo que hace cada uno (la tabla está en
 * vr/zombie-tipos.js). El cuerpo es una sola superficie hecha de primitivas anatómicas (pelvis, costillas, pectorales,
 * trapecio, deltoides, bíceps, cuádriceps, gemelos…) unidas con mínimo suave y pasada a malla con surface nets
 * (vr/forma3d.js); las manos van aparte, más finas. Cinco cuerpos con el mismo esqueleto de 19 huesos, que se ajusta:
 * normal, gordo, fuerte, coloso e hinchado. La ropa son capas a 1, 1,6 y 2,8 cm del cuerpo recortadas por prenda; el
 * detalle fino de la piel y la tela lo pone el material (vr/piel3d.js), con heridas que recortan el cuerpo.
 * La forma de cada cuerpo se arma una vez, cuando hace falta (molde), y la comparten todos los zombies de ese cuerpo;
 * cada zombie tiene su color (la sangre es suya) y dos niveles de detalle: cerca, el cuerpo fino sin la piel que tapa
 * la ropa y la ropa en capas; lejos, una malla gruesa con la ropa pintada.
 * La Horda los maneja a todos: el rodeo de la mesa, que no se encimen, el detalle, los gritos que apuran, los que
 * cubre el Escudo, y los animales (vr/animales3d.js), que se le enchufan con la misma forma de trabajar. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { v3, limitar, suave, hash3, fbm, respiro, Forma, malla, normales, puntoEnSuperficie, geometria, pesosPiel, capa, recortarCapa } from './forma3d.js';
import { materialZombie, ponerHerida, cerrarHeridas, carneDeHerida } from './piel3d.js';
import { TIPOS, CUERPOS, CAMISAS, PANTALONES, SOBRECAPAS, medirBrazo, enBarbijo, pintarTela, accesorio, materialEscudo, SANGRE } from './zombie-tipos.js';
export { TIPOS, VARIANTES } from './zombie-tipos.js';

/* ---------- El esqueleto (m, en reposo, mirando a +z; la izquierda es +x), ajustado a cada cuerpo ---------- */
export const NOMBRES = ['cadera', 'columna', 'pecho', 'cuello', 'cabeza', 'hombroI', 'brazoI', 'anteI', 'manoI', 'hombroD', 'brazoD', 'anteD', 'manoD', 'musloI', 'piernaI', 'pieI', 'musloD', 'piernaD', 'pieD'];
const IDX = Object.fromEntries(NOMBRES.map((n, i) => [n, i]));
const PADRE = { cadera: null, columna: 'cadera', pecho: 'columna', cuello: 'pecho', cabeza: 'cuello', hombroI: 'pecho', brazoI: 'hombroI', anteI: 'brazoI', manoI: 'anteI', hombroD: 'pecho', brazoD: 'hombroD', anteD: 'brazoD', manoD: 'anteD', musloI: 'cadera', piernaI: 'musloI', pieI: 'piernaI', musloD: 'cadera', piernaD: 'musloD', pieD: 'piernaD' };
function esqueleto(P) {
  const dx = P.hombros || 0, ang = (P.abrir ?? 20) * Math.PI / 180, sx = Math.sin(ang), cy = Math.cos(ang), mx = P.caderas ?? 0.09;
  const brazo = [0.175 + dx, 1.415, -0.02], ante = [brazo[0] + 0.28 * sx, brazo[1] - 0.28 * cy, -0.02], mano = [ante[0] + 0.25 * sx, ante[1] - 0.25 * cy, -0.01];
  const A = { cadera: [0, 0.96, 0], columna: [0, 1.08, -0.01], pecho: [0, 1.24, -0.01], cuello: [0, 1.45, -0.01], cabeza: [0, 1.56, 0], hombroI: [0.06 + dx * 0.5, 1.42, -0.015], brazoI: brazo, anteI: ante, manoI: mano, musloI: [mx, 0.93, 0], piernaI: [mx + 0.01, 0.51, 0.005], pieI: [mx + 0.015, 0.09, -0.01] };
  for (const n of ['hombro', 'brazo', 'ante', 'mano', 'muslo', 'pierna', 'pie']) { const p = A[n + 'I']; A[n + 'D'] = [-p[0], p[1], p[2]]; }
  A.ang = ang;
  return A;
}

/* ---------- El cuerpo: primitivas anatómicas, con los parámetros de cada cuerpo ---------- */
function cuerpo(P, A) {
  const f = new Forma(), S = true, b = P.brazos || 1, pn = P.piernas || 1, t = P.torso || 1, pz = P.panza || 0, H = 1 + (P.hinchar || 0), cu = P.cuello || 1;
  const at = (a, c, s, d = [0, 0, 0]) => [a[0] + (c[0] - a[0]) * s + d[0], a[1] + (c[1] - a[1]) * s + d[1], a[2] + (c[2] - a[2]) * s + d[2]];
  const hx = A.brazoI[0] - 0.175, cx = A.musloI[0] - 0.09;
  // tronco: pelvis, glúteos, abdomen, tórax, pectorales, dorsales, trapecio y deltoides
  f.elip([0, 0.97, -0.005], [(0.15 + cx) * t * H, 0.1 * H, 0.1 * H], 'cadera', 0.03).elip([0.068 + cx, 0.92, -0.055], [0.072 * H * pn ** 0.5, 0.08 * H, 0.065 * H * pn ** 0.5], 'cadera', 0.03, S)
   .elip([0, 1.11, 0.0], [0.122 * t * H, 0.11 * H, 0.085 * H], 'columna', 0.035).elip([0, 1.28, -0.005], [(0.148 * t + hx * 0.7) * H, 0.15 * H, 0.098 * t * H], 'pecho', 0.035)
   .elip([0.058 * t + hx * 0.4, 1.315, 0.052 + (t - 1) * 0.05], [0.064 * t, 0.05 * t, 0.034 * t * (P.abdominales ? 1.3 : 1)], 'pecho', 0.025, S).elip([0, 1.3, -0.045], [(0.15 * t + hx * 0.8) * H, 0.12 * H, 0.064 * t * H], 'pecho', 0.03)
   .cono([0, 1.45, -0.025], [0.15 + hx, 1.415, -0.025], 0.047 * t * cu ** 0.5, 0.041 * t, 'pecho', 0.03, S)
   .elip(at(A.brazoI, A.anteI, 0, [-0.003, -0.02, 0.005]), [0.051 * b, 0.057 * b, 0.051 * b], 'brazoI', 0.025, S);
  // clavículas y los músculos del cuello (se marcan bajo la piel)
  f.cono([0.016, 1.43, 0.042], [0.14 + hx, 1.44, 0.0], 0.0105 * t, 0.009 * t, 'pecho', 0.012, S).cono([0.05, 1.6, 0.0], [0.02, 1.445, 0.045], 0.014 * cu, 0.012 * cu, 'cuello', 0.014, S);
  // la panza: redonda y hacia adelante, que cuelga sobre el cinturón, con los rollos de los costados
  if (pz) f.elip([0, 1.05 - pz * 0.01, 0.05 + pz * 0.065], [0.115 + pz * 0.05, 0.12 + pz * 0.05, 0.095 + pz * 0.065], 'columna', 0.06).elip([0.115, 1.02, 0.0], [0.035 * pz + 0.02, 0.05 * pz + 0.02, 0.05 * pz + 0.02], 'cadera', 0.05, S)
                .elip([0, 1.5, 0.035], [0.05 + pz * 0.01, 0.025, 0.035], 'cuello', 0.03);   // papada
  if (P.abdominales) for (const y of [1.04, 1.1, 1.165]) f.elip([0.031, y, 0.072 + (y - 1.04) * 0.1], [0.027, 0.026, 0.022], 'columna', 0.012, S);
  // cuello y cabeza (al 88 %, como en el juego): cráneo, cara, mentón, arco de las cejas, pómulos, nariz y orejas
  f.cono([0, 1.42, -0.012], [0, 1.6, 0.0], 0.051 * cu, 0.044 * cu ** 0.7, 'cuello', 0.03)
   .elip([0, 1.67, -0.005], [0.07, 0.085, 0.088], 'cabeza', 0.02).elip([0, 1.6, 0.03], [0.05, 0.045, 0.06], 'cabeza', 0.02)
   .elip([0, 1.575, 0.06], [0.025, 0.02, 0.02], 'cabeza', 0.012).elip([0, 1.678, 0.068], [0.062, 0.014, 0.022], 'cabeza', 0.012)
   .elip([0.043, 1.635, 0.058], [0.02, 0.015, 0.02], 'cabeza', 0.012, S).cono([0, 1.66, 0.082], [0, 1.628, 0.094], 0.011, 0.012, 'cabeza', 0.01)
   .elip([0.07, 1.648, -0.005], [0.01, 0.026, 0.018], 'cabeza', 0.008, S)
   .quitar([0.03, 1.652, 0.079], [0.02, 0.019, 0.02], 0.008, S).quitar([0, 1.593, 0.085], [0.03, 0.017, 0.032], 0.006);
  // brazos: bíceps, tríceps, codo y antebrazo
  f.cono(A.brazoI, A.anteI, 0.043 * b * H ** 0.5, 0.033 * b * H ** 0.5, 'brazoI', 0.02, S).elip(at(A.brazoI, A.anteI, 0.42, [0, 0, 0.02 * b]), [0.032 * b, 0.065, 0.034 * b], 'brazoI', 0.02, S)
   .elip(at(A.brazoI, A.anteI, 0.45, [0, 0, -0.02 * b]), [0.03 * b, 0.07, 0.03 * b], 'brazoI', 0.02, S).elip(at(A.anteI, A.anteI, 0, [0, 0, -0.008]), [0.03 * b ** 0.8, 0.03 * b ** 0.8, 0.03 * b ** 0.8], 'anteI', 0.015, S)
   .cono(A.anteI, A.manoI, 0.034 * b * H ** 0.5, 0.024 * b ** 0.7, 'anteI', 0.018, S).elip(at(A.anteI, A.manoI, 0.25, [0, 0, 0.015]), [0.033 * b, 0.06, 0.03 * b], 'anteI', 0.018, S);
  // piernas: muslo, cuádriceps, isquiotibiales, rodilla, canilla, gemelo, tobillo, talón, pie y dedos
  const pf = pn ** 0.4;
  f.cono(A.musloI, A.piernaI, 0.082 * pn * H ** 0.5, 0.05 * pn * H ** 0.5, 'musloI', 0.025, S).elip(at(A.musloI, A.piernaI, 0.5, [0, 0, 0.025 * pn]), [0.058 * pn, 0.13, 0.05 * pn], 'musloI', 0.025, S)
   .elip(at(A.musloI, A.piernaI, 0.48, [0, 0, -0.03 * pn]), [0.055 * pn, 0.12, 0.045 * pn], 'musloI', 0.025, S).elip(at(A.piernaI, A.piernaI, 0, [0, 0, 0.02]), [0.042 * pn ** 0.6, 0.04, 0.035 * pn ** 0.6], 'piernaI', 0.015, S)
   .cono(A.piernaI, A.pieI, 0.048 * pn * H ** 0.5, 0.03 * pn ** 0.6, 'piernaI', 0.02, S).elip(at(A.piernaI, A.pieI, 0.33, [0, 0, -0.032 * pn]), [0.043 * pn, 0.09, 0.042 * pn], 'piernaI', 0.02, S)
   .elip(at(A.pieI, A.pieI, 0, [0, -0.005, 0]), [0.032 * pf, 0.032, 0.032 * pf], 'pieI', 0.015, S).elip(at(A.pieI, A.pieI, 0, [0, -0.045, -0.02]), [0.035 * pf, 0.035, 0.035 * pf], 'pieI', 0.015, S)
   .elip(at(A.pieI, A.pieI, 0, [0.001, -0.055, 0.06 * pf]), [0.042 * pf, 0.032, 0.105 * pf], 'pieI', 0.02, S).elip(at(A.pieI, A.pieI, 0, [0.003, -0.068, 0.15 * pf]), [0.044 * pf, 0.02, 0.035 * pf], 'pieI', 0.012, S);
  // pústulas del hinchado: bultos sobre el tronco y los brazos, en la superficie
  if (P.pustulas) {
    const sdf = (x, y, z) => f.distancia(x, y, z);
    for (let k = 0; k < P.pustulas; k++) {
      const brazo = k % 4 === 3, hueso = brazo ? (k % 8 === 3 ? 'brazoI' : 'brazoD') : k % 3 ? 'pecho' : 'columna';
      const o = brazo ? at(A[hueso], A[hueso.replace('brazo', 'ante')], 0.5) : [0, hueso === 'pecho' ? 1.28 : 1.1, 0];
      const a = hash3(k, 5, 1) * Math.PI * 2, e = (hash3(k, 6, 1) - 0.5) * 1.2, dir = [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)];
      const p = puntoEnSuperficie(sdf, o, dir), r = 0.012 + hash3(k, 7, 1) * 0.016;
      f.elip(p, [r, r * 0.9, r], hueso, 0.006);
    }
  }
  return f;
}
// La mano izquierda en su marco: muñeca en el origen, hacia −y, palma hacia −x (el cuerpo) y pulgar hacia +z
function mano(k = 1) {
  const f = new Forma(), h = 'mano', s = p => p.map(q => q * k);
  f.cono(s([0, 0.025, 0]), s([0, -0.02, 0]), 0.023 * k, 0.025 * k, h, 0.012).elip(s([0, -0.052, 0]), [0.014 * k, 0.048 * k, 0.037 * k], h, 0.012);
  for (const [z, L] of [[0.027, 1], [0.009, 1.1], [-0.009, 1.03], [-0.026, 0.86]]) {   // dedos largos y curvos, con garra
    const a = [0.002, -0.092, z], b = [-0.008, -0.092 - 0.045 * L, z * 1.05], c = [-0.022, -0.092 - 0.078 * L, z * 1.08], d = [-0.04, -0.092 - 0.095 * L, z * 1.1];
    f.cono(s(a), s(b), 0.0095 * k, 0.0085 * k, h, 0.006).cono(s(b), s(c), 0.0085 * k, 0.0072 * k, h, 0.005).cono(s(c), s(d), 0.0068 * k, 0.0028 * k, h, 0.004);
  }
  f.cono(s([-0.004, -0.028, 0.028]), s([-0.018, -0.068, 0.054]), 0.012 * k, 0.0095 * k, h, 0.008).cono(s([-0.018, -0.068, 0.054]), s([-0.034, -0.094, 0.06]), 0.0092 * k, 0.004 * k, h, 0.005);
  return f;
}

/* ---------- Colores de la piel ---------- */
const col = hex => new THREE.Color(hex);
const PIEL = col('#5d8a3c'), PIEL_OSC = col('#3d5e29'), PIEL_CLARA = col('#77a04f'), CUENCA = col('#1c2414'), MORETON = col('#5a503a'), SANGRE_VIVA = col('#7a1410'), PELO = col('#231a12'), UNA = col('#3a3226'), BOCA = col('#1a0604');
// Los tonos de piel de los zombies del juego (js/zombie.js), relativos al de base
const BASE_PIEL = col('#6aa641'), tonoDe = hex => { const c = col(hex); return [c.r / BASE_PIEL.r, c.g / BASE_PIEL.g, c.b / BASE_PIEL.b]; };
const TONOS = ['#6aa641', '#5a9436', '#7bb352', '#6f9c4a', '#7d9a62', '#8aa86a', '#5f8a4e', '#86a24c'].map(tonoDe);

// El cuerpo entero con las dos manos, a una resolución: posiciones, normales, piel y el color de la piel (sin pelo
// ni tono: los pone cada tipo). masc: cuánto es piel pura; pelo: dónde va el pelo
function cuerpoEntero(F, sdf, paso, pasoMano, min, max, A, P) {
  const mc = malla(sdf, min, max, paso), nc = normales(sdf, mc.pos);
  const FM = mano(P.manos || 1), sdfM = (x, y, z) => FM.distancia(x, y, z), km = P.manos || 1;
  const mm = malla(sdfM, [-0.065 * km, -0.205 * km, -0.05 * km], [0.035 * km, 0.04 * km, 0.08 * km], pasoMano), nm = normales(sdfM, mm.pos, Math.min(0.002, pasoMano * 0.5));
  const cs = Math.cos(A.ang), sn = Math.sin(A.ang), nCuerpo = mc.pos.length / 3, nMano = mm.pos.length / 3, n = nCuerpo + 2 * nMano;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = mc.idx.slice();
  pos.set(mc.pos); nor.set(nc);
  [1, -1].forEach((signo, lado) => {   // las manos puestas en la muñeca, siguiendo el antebrazo; la derecha es el espejo
    const base = nCuerpo + lado * nMano;
    for (let q = 0; q < nMano; q++) {
      const x = mm.pos[q * 3], y = mm.pos[q * 3 + 1], z = mm.pos[q * 3 + 2], nx = nm[q * 3], ny = nm[q * 3 + 1], nz = nm[q * 3 + 2];
      pos.set([signo * (x * cs - y * sn + A.manoI[0]), x * sn + y * cs + A.manoI[1], z + A.manoI[2]], (base + q) * 3);
      nor.set([signo * (nx * cs - ny * sn), nx * sn + ny * cs, nz], (base + q) * 3);
    }
    for (let t = 0; t < mm.idx.length; t += 3) { const a = mm.idx[t] + base, b = mm.idx[t + 1] + base, c = mm.idx[t + 2] + base; if (signo > 0) idx.push(a, b, c); else idx.push(a, c, b); }
  });
  const [si, sw] = pesosPiel(n, v => {
    if (v < nCuerpo) return F.pesos(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
    const k = (v - nCuerpo) % nMano, ly = mm.pos[k * 3 + 1] / km, l = v - nCuerpo < nMano ? 'I' : 'D', w = limitar((ly + 0.005) / 0.04, 0, 0.6);
    return w > 0.02 ? [['mano' + l, 1 - w], ['ante' + l, w]] : [['mano' + l, 1]];
  }, IDX);
  const base = new Float32Array(n * 3), masc = new Float32Array(n), pelo = new Float32Array(n), ao = new Float32Array(n), c = new THREE.Color();
  for (let v = 0; v < n; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2], nx = nor[v * 3], ny = nor[v * 3 + 1], nz = nor[v * 3 + 2], esMano = v >= nCuerpo;
    ao[v] = limitar(0.25 + 0.75 * (esMano ? 1 : sdf(x + nx * 0.03, y + ny * 0.03, z + nz * 0.03) / 0.03), 0.2, 1);
    let m = 1; const mezcla = (color, k) => { if (k > 0) { c.lerp(color, k); m *= 1 - k; } };
    const r = fbm(x * 9, y * 9, z * 9), r2 = fbm(x * 31 + 5, y * 31, z * 31);
    c.copy(PIEL).lerp(PIEL_CLARA, limitar((r - 0.45) * 2, 0, 0.6)).lerp(PIEL_OSC, limitar((0.42 - r) * 2.5, 0, 0.7)).lerp(MORETON, limitar((r2 - 0.72) * 3, 0, 0.6));
    if (y > 1.69 && z < 0.065 && fbm(x * 60, y * 60, z * 60) > 0.48) pelo[v] = 0.85;                               // pelo ralo y sucio
    if (Math.hypot(x, (y - 1.59) * 1.2, (z - 0.085) * 0.8) < 0.04) mezcla(SANGRE, 0.6);                              // boca
    if (Math.hypot(x / 0.03, (y - 1.593) / 0.017, (z - 0.08) / 0.03) < 1.15) mezcla(BOCA, 0.85);                        // adentro de la boca
    const dCuenca = Math.hypot(Math.abs(x) - 0.03, y - 1.652, (z - 0.075) * 0.7); if (dCuenca < 0.03) mezcla(CUENCA, (1 - dCuenca / 0.03) * 0.85);
    const hilo = 0.005 + r2 * 0.005 - (1.6 - y) * 0.02; if (Math.abs(x + 0.012 + (1.6 - y) * 0.05) < hilo && y < 1.6 && y > 1.47 && z > 0.02) mezcla(SANGRE_VIVA, 0.8 * (1 - (1.6 - y) / 0.13));
    const dh = Math.hypot(x - 0.045, y - 1.25, (z - 0.09) * 0.6);                                                         // herida del pecho
    if (dh < 0.045) { mezcla(SANGRE, limitar((0.045 - dh) / 0.03, 0, 1)); if (dh < 0.015) c.multiplyScalar(0.45); }
    if (esMano && mm.pos[((v - nCuerpo) % nMano) * 3 + 1] / km < -0.165) mezcla(UNA, 0.85);                             // uñas
    c.multiplyScalar(ao[v]);
    base[v * 3] = c.r; base[v * 3 + 1] = c.g; base[v * 3 + 2] = c.b; masc[v] = m;
  }
  return { geo: geometria({ pos, nor, idx, si, sw }), pos, nor, base, masc, pelo, ao, nCuerpo, nMano, n };
}

/* ---------- Moldes: la forma de cada cuerpo, armada una vez cuando hace falta ---------- */
const MOLDES = {}, ARMANDO = {};
export const cuerpoDe = id => (TIPOS[id] && TIPOS[id].cuerpo) || 'normal';
export const tipoListo = id => !TIPOS[id] || !!MOLDES[cuerpoDe(id)];
export async function prepararZombies(progreso = () => {}, cuerpos = ['normal']) { for (const c of cuerpos) await molde(c, progreso); return MOLDES.normal; }
export async function asegurarTipos(ids, progreso = () => {}) { for (const c of [...new Set(ids.filter(id => TIPOS[id]).map(cuerpoDe))]) await molde(c, progreso); }
export const moldeInfo = () => Object.fromEntries(Object.entries(MOLDES).map(([k, M]) => [k, { ms: Math.round(M.ms), triAlto: M.alto.geo.index.count / 3, triBajo: M.bajo.geo.index.count / 3 }]));
function molde(nombre, progreso = () => {}) { if (MOLDES[nombre]) return Promise.resolve(MOLDES[nombre]); return ARMANDO[nombre] || (ARMANDO[nombre] = armarMolde(nombre, progreso)); }
async function armarMolde(nombre, progreso) {
  const t0 = performance.now(), P = CUERPOS[nombre], A = esqueleto(P), F = cuerpo(P, A), sdf = (x, y, z) => F.distancia(x, y, z), H = 1 + (P.hinchar || 0);
  const ancho = A.manoI[0] + 0.07, z0 = -0.18 * H * (P.torso || 1) - 0.02, z1 = 0.22 + (P.panza || 0) * 0.13 + (H - 1) * 0.12;
  let paso = 0; const listo = async () => { progreso(nombre, ++paso / 6); await respiro(); };
  await respiro();
  const M = { nombre, P, A, F, sdf, colores: {} };
  M.alto = cuerpoEntero(F, sdf, 0.0125, 0.0045 * (P.manos || 1), [-ancho, -0.01, z0], [ancho, 1.79, z1], A, P); await listo();
  M.bajo = cuerpoEntero(F, sdf, 0.025, 0.007 * (P.manos || 1), [-ancho - 0.02, -0.03, z0 - 0.02], [ancho + 0.02, 1.81, z1 + 0.02], A, P); await listo();
  const camisaF = F.de(['cadera', 'columna', 'pecho', 'cuello', 'brazoI', 'brazoD', 'anteI', 'anteD']), brazoF = F.de(['brazoI', 'brazoD', 'anteI', 'anteD']), troncoF = F.de(['cadera', 'columna', 'pecho', 'cuello']);
  const piernasF = F.de(['cadera', 'musloI', 'musloD', 'piernaI', 'piernaD']), cabezaF = F.de(['cabeza']);
  M.formas = { camisaF, brazoF, troncoF, piernasF, cabezaF };
  const tipos = Object.entries(TIPOS).filter(([, T]) => (T.cuerpo || 'normal') === nombre);
  M.camisas = {}; M.pantalones = {}; M.sobres = {};
  const camisas = [...new Set(tipos.map(([, T]) => T.camisa).filter(Boolean))], pantalones = [...new Set(tipos.map(([, T]) => T.pantalon).filter(Boolean))];
  if (camisas.length) { const C = capa(F, (x, y, z) => camisaF.distancia(x, y, z) - 0.016, [-ancho, 0.8, z0 - 0.01], [ancho, 1.53, z1], 0.0125); for (const c of camisas) M.camisas[c] = recortarCapa(C, quedaCamisa(M, c), IDX); }
  await listo();
  const sobres = tipos.filter(([, T]) => SOBRECAPAS[T.camisa]);
  if (sobres.length) { const C = capa(F, (x, y, z) => camisaF.distancia(x, y, z) - 0.028, [-ancho, 0.85, z0 - 0.02], [ancho, 1.53, z1 + 0.01], 0.0125); for (const [id, T] of sobres) M.sobres[id] = recortarCapa(C, quedaSobre(M, T), IDX); }
  if (pantalones.length) { const C = capa(F, (x, y, z) => piernasF.distancia(x, y, z) - 0.01, [-0.24 - (A.musloI[0] - 0.09) * 2 - (H - 1) * 0.1, 0.05, z0], [0.24 + (A.musloI[0] - 0.09) * 2 + (H - 1) * 0.1, 1.08, 0.16 + (P.panza || 0) * 0.1 + (H - 1) * 0.1], 0.0125); for (const p of pantalones) M.pantalones[p] = recortarCapa(C, quedaPantalon(p), IDX); }
  await listo();
  M.cabeza = piezasDeCabeza(cabezaF, A);
  M.zonas = zonasDeImpacto(A, P);
  await listo();
  M.ms = performance.now() - t0;
  MOLDES[nombre] = M; await listo();
  return M;
}
function quedaCamisa(M, tipo) {
  const { brazoF, troncoF } = M.formas;
  return (x, y, z) => { const db = brazoF.distancia(x, y, z), brazo = db < troncoF.distancia(x, y, z); return CAMISAS[tipo](x, y, z, fbm(x * 18, y * 18, z * 18), brazo, brazo ? medirBrazo(M.A, x, y, z) : 0, db, M.P.panza || 0); };
}
function quedaSobre(M, T) {
  const { brazoF, troncoF } = M.formas;
  return (x, y, z) => { const db = brazoF.distancia(x, y, z), brazo = db < troncoF.distancia(x, y, z); return SOBRECAPAS[T.camisa](x, y, z, fbm(x * 18, y * 18, z * 18), brazo, 0, db, T); };
}
const quedaPantalon = tipo => (x, y, z) => PANTALONES[tipo](x, y, z, fbm(x * 18 + 3, y * 18, z * 18));

// Ojos, pupilas, dientes, barbijo y la capucha bajada: en el marco del hueso de la cabeza (o del pecho)
function piezasDeCabeza(cabezaF, A) {
  const rel = (g, h = 'cabeza') => g.translate(-A[h][0], -A[h][1], -A[h][2]);
  const pintar = (g, hex) => { const c = col(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g; };
  const ojos = mergeGeometries([1, -1].map(s => new THREE.SphereGeometry(0.0098, 16, 12).translate(s * 0.03, 1.651, 0.064)));
  const pupilas = mergeGeometries([1, -1].map(s => new THREE.SphereGeometry(0.0032, 10, 8).translate(s * 0.0292, 1.6512, 0.0716)));
  const dientes = [];
  for (let k = 0; k < 8; k++) for (const [y, inc] of [[1.6, 1], [1.585, -1]]) {
    if (hash3(k, y * 1000, 7) < 0.2) continue;
    const a = (k - 3.5) * 0.3, h = 0.006 + hash3(k, y * 1000, 2) * 0.004, g = new THREE.BoxGeometry(0.0052, h, 0.0042);
    g.applyMatrix4(new THREE.Matrix4().compose(v3(Math.sin(a) * 0.024, y - inc * (0.001 + h / 2 - 0.003), 0.066 + Math.cos(a) * 0.016), new THREE.Quaternion().setFromEuler(new THREE.Euler((hash3(k, y, 9) - 0.5) * 0.3, a, (hash3(k, y * 100, 3) - 0.5) * 0.5)), v3(1, 1, 1)));
    dientes.push(pintar(g, hash3(k, y * 1000, 5) < 0.3 ? '#8a7a52' : '#c4b384'));
  }
  // Barbijo: una capa a 3,5 mm de la cara (sin las cuencas ni la boca), con pliegues, sangre y los elásticos
  const sdfB = (x, y, z) => cabezaF.distancia(x, y, z) - 0.0035, mb = malla(sdfB, [-0.085, 1.53, -0.02], [0.085, 1.7, 0.13], 0.0035);
  const tb = []; for (let t = 0; t < mb.idx.length; t += 3) { const P = i => mb.pos.slice(mb.idx[t + i] * 3, mb.idx[t + i] * 3 + 3), a = P(0), b = P(1), c = P(2); if (enBarbijo((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3)) tb.push(mb.idx[t], mb.idx[t + 1], mb.idx[t + 2]); }
  const usados = [...new Set(tb)], ren = new Map(usados.map((o, k) => [o, k])), pb = new Float32Array(usados.length * 3), cb = new Float32Array(usados.length * 3), c = new THREE.Color();
  usados.forEach((o, k) => {
    const x = mb.pos[o * 3], y = mb.pos[o * 3 + 1], z = mb.pos[o * 3 + 2]; pb.set([x, y, z], k * 3);
    c.set('#9ec9d6'); if (Math.abs(Math.sin((y - 1.555) * 120)) > 0.93) c.multiplyScalar(0.82);
    const ds = Math.hypot(x * 1.2, y - 1.59 + fbm(x * 70, y * 70, 1) * 0.012); if (ds < 0.03) c.lerp(SANGRE, (1 - ds / 0.03) * 0.75);
    if (fbm(x * 40 + 3, y * 40, z * 40) > 0.62) c.lerp(col('#6f7a62'), 0.35);
    cb.set([c.r, c.g, c.b], k * 3);
  });
  const gb = new THREE.BufferGeometry(); gb.setAttribute('position', new THREE.BufferAttribute(pb, 3)); gb.setAttribute('color', new THREE.BufferAttribute(cb, 3)); gb.setIndex(tb.map(i => ren.get(i))); gb.computeVertexNormals();
  const elasticos = [1, -1].map(s => pintar(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(v3(s * 0.063, 1.622, 0.045), v3(s * 0.08, 1.64, 0.02), v3(s * 0.071, 1.652, -0.006)), 8, 0.0011, 4), '#e2ecee'));
  // La capucha bajada del buzo: una bolsa de tela sobre la nuca y la espalda (se le pone el color del buzo)
  const capucha = new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), pc = capucha.attributes.position;
  for (let i = 0; i < pc.count; i++) { const y = pc.getY(i); pc.setY(i, y * (y > 0 ? 0.6 : 1)); }
  capucha.scale(0.115, 0.09, 0.075).rotateX(-0.5).translate(0, 1.42, -0.105); capucha.deleteAttribute('uv'); capucha.computeVertexNormals();
  return {
    ojos: rel(ojos), pupilas: rel(pupilas), dientes: rel(mergeGeometries(dientes)), barbijo: rel(mergeGeometries([gb, ...elasticos])), capucha: rel(capucha, 'pecho'),
    matOjo: new THREE.MeshStandardMaterial({ color: 0xdcc43e, emissive: 0x6a5a08, emissiveIntensity: 0.45, roughness: 0.2 }), matPupila: new THREE.MeshBasicMaterial({ color: 0x120c06 }),
    matColor: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }), matTela: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }),
  };
}
// Zonas de impacto (invisibles, pegadas a los huesos): [hueso, geometría, centro en reposo, tipo]
function zonasDeImpacto(A, P) {
  const out = [], b = P.brazos || 1, pn = P.piernas || 1, t = (P.torso || 1) * (1 + (P.hinchar || 0)), pz = P.panza || 0, esf = (rx, ry, rz) => new THREE.SphereGeometry(1, 12, 10).scale(rx, ry, rz);
  const tubo = (a, c, r) => { const L = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]), g = new THREE.CylinderGeometry(r, r, L, 10); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), v3(c[0] - a[0], c[1] - a[1], c[2] - a[2]).normalize())); return g; };
  out.push(['cabeza', esf(0.075, 0.095, 0.095), [0, 1.655, 0.01], 'cabeza'], ['cuello', esf(0.05 * (P.cuello || 1), 0.07, 0.05 * (P.cuello || 1)), [0, 1.5, 0], 'tronco'],
    ['pecho', esf(0.16 * t + (A.brazoI[0] - 0.175), 0.15, 0.11 * t), [0, 1.3, -0.005], 'tronco'], ['columna', esf(0.13 * t + pz * 0.08, 0.1 + pz * 0.04, 0.095 * t + pz * 0.1), [0, 1.11, pz * 0.05], 'tronco'],
    ['cadera', esf(0.16 * t + (A.musloI[0] - 0.09), 0.1, 0.11 * t), [0, 0.95, -0.01], 'tronco']);
  for (const s of ['I', 'D']) {
    const sx = s === 'I' ? 1 : -1, m = p => [p[0] * sx, p[1], p[2]];
    for (const [h, a, c, r] of [['brazo' + s, A.brazoI, A.anteI, 0.045 * b], ['ante' + s, A.anteI, A.manoI, 0.036 * b], ['muslo' + s, A.musloI, A.piernaI, 0.08 * pn], ['pierna' + s, A.piernaI, A.pieI, 0.055 * pn]]) {
      const P0 = m(a), P1 = m(c); out.push([h, tubo(P0, P1, r), [(P0[0] + P1[0]) / 2, (P0[1] + P1[1]) / 2, (P0[2] + P1[2]) / 2], 'miembro']);
    }
    out.push(['mano' + s, esf(0.03 * (P.manos || 1), 0.09 * (P.manos || 1), 0.045 * (P.manos || 1)), [sx * (A.manoI[0] + 0.03), A.manoI[1] - 0.085, 0.0], 'miembro'], ['pie' + s, esf(0.05, 0.05, 0.13), [sx * (A.pieI[0] + 0.001), 0.04, 0.05], 'miembro']);
  }
  return out;
}

/* ---------- Colores de cada tipo (una vez por tipo y cuerpo; cada zombie les pone su tono de piel) ---------- */
function coloresDe(M, id) {
  if (M.colores[id]) return M.colores[id];
  const V = { ...TIPOS[id], id }, pelo = V.calvo ? 0 : V.ralo ? 0.45 : 1, P = PELO.toArray();
  const conPelo = B => { const c = B.base.slice(), m = B.masc.slice(); for (let v = 0; v < B.n; v++) { const k = B.pelo[v] * pelo; if (k > 0) { for (let j = 0; j < 3; j++) c[v * 3 + j] += (P[j] * B.ao[v] - c[v * 3 + j]) * k; m[v] *= 1 - k; } } return { col: c, masc: m }; };
  const cuerpo = conPelo(M.alto); pintarCalzado(M.alto, V, cuerpo);
  const lejos = conPelo(M.bajo); pintarCalzado(M.bajo, V, lejos); pintarRopaLejos(M, M.bajo, V, lejos);
  return (M.colores[id] = {
    cuerpo, lejos, indice: pielVisible(M, M.alto, V),
    camisa: V.camisa ? pintarTela(M.camisas[V.camisa], 'camisa', V, M.A) : null,
    sobre: M.sobres[id] ? pintarTela(M.sobres[id], 'sobre', V, M.A) : null,
    pantalon: pintarTela(M.pantalones[V.pantalon], 'pantalon', V, M.A),
  });
}
function pintarCalzado(B, V, out) {
  if (!V.pies) return;
  const alto = V.pies === 'botas' ? 0.2 : 0.105, color = col(V.calzado), suela = color.clone().multiplyScalar(V.pies === 'botas' ? 0.6 : 0.55), c = new THREE.Color();
  for (let v = 0; v < B.nCuerpo; v++) {
    const x = B.pos[v * 3], y = B.pos[v * 3 + 1], z = B.pos[v * 3 + 2];
    if (y > alto + (fbm(x * 30, y * 30, z * 30) - 0.5) * 0.012 || (V.unaZapatilla && x > 0)) continue;
    c.copy(y < 0.018 ? suela : color).lerp(col('#4a3f30'), limitar((fbm(x * 25 + 4, y * 25, z * 25) - 0.45) * 1.5, 0, 0.5));
    if (V.pies === 'zapatillas' && z > 0.04 && y > 0.045 && y < 0.08 && Math.sin(z * 260) > 0.2) c.multiplyScalar(0.8);   // cordones
    c.multiplyScalar(B.ao[v]);
    out.col.set([c.r, c.g, c.b], v * 3); out.masc[v] = 0;
  }
}
// Lejos la ropa va pintada sobre el cuerpo (una sola malla): la misma forma que las capas de cerca
function pintarRopaLejos(M, B, V, out) {
  const { camisaF, piernasF } = M.formas, enCamisa = V.camisa && quedaCamisa(M, V.camisa), enSobre = M.sobres[V.id] && quedaSobre(M, V), enPantalon = quedaPantalon(V.pantalon);
  const tela = V.camisa ? (V.cuadros ? promedioEscocesa(V.tela) : col(V.tela)) : null, sobre = col(V.chaleco || V.overol || '#000000'), pant = col(V.color), barb = col('#9ec9d6'), c = new THREE.Color();
  const barbijo = (V.accesorios || []).includes('barbijo');
  for (let v = 0; v < B.nCuerpo; v++) {
    const x = B.pos[v * 3], y = B.pos[v * 3 + 1], z = B.pos[v * 3 + 2], nx = B.nor[v * 3], ny = B.nor[v * 3 + 1], nz = B.nor[v * 3 + 2];
    let base = null;
    const enTronco = camisaF.distancia(x, y, z) < 0.006;
    if (enSobre && enTronco && enSobre(x + nx * 0.028, y + ny * 0.028, z + nz * 0.028)) base = sobre;
    else if (enCamisa && enTronco && enCamisa(x + nx * 0.016, y + ny * 0.016, z + nz * 0.016)) base = tela;
    else if (piernasF.distancia(x, y, z) < 0.006 && enPantalon(x + nx * 0.01, y + ny * 0.01, z + nz * 0.01)) base = pant;
    else if (barbijo && enBarbijo(x, y, z)) base = barb;
    if (!base) continue;
    c.copy(base).lerp(base.clone().multiplyScalar(0.55), limitar((fbm(x * 12 + 9, y * 12, z * 12) - 0.5) * 2.2, 0, 0.75)).multiplyScalar(0.25 + 0.75 * B.ao[v]);
    out.col.set([c.r, c.g, c.b], v * 3); out.masc[v] = 0;
  }
}
// La piel que tapa la ropa no se dibuja: queda un borde de dos anillos de triángulos debajo de cada orilla
function pielVisible(M, B, V) {
  const { camisaF, piernasF } = M.formas, enCamisa = V.camisa && quedaCamisa(M, V.camisa), enPantalon = quedaPantalon(V.pantalon), tapado = new Uint8Array(B.n);
  for (let v = 0; v < B.nCuerpo; v++) {
    const x = B.pos[v * 3], y = B.pos[v * 3 + 1], z = B.pos[v * 3 + 2], nx = B.nor[v * 3], ny = B.nor[v * 3 + 1], nz = B.nor[v * 3 + 2];
    tapado[v] = (enCamisa && camisaF.distancia(x, y, z) < 0.006 && enCamisa(x + nx * 0.016, y + ny * 0.016, z + nz * 0.016)) || (piernasF.distancia(x, y, z) < 0.006 && enPantalon(x + nx * 0.01, y + ny * 0.01, z + nz * 0.01)) ? 1 : 0;
  }
  const idx = B.geo.index.array;
  for (let anillo = 0; anillo < 2; anillo++) {
    const destapar = [];
    for (let t = 0; t < idx.length; t += 3) { const a = idx[t], b = idx[t + 1], c = idx[t + 2]; if (!tapado[a] || !tapado[b] || !tapado[c]) destapar.push(a, b, c); }
    for (const v of destapar) tapado[v] = 0;
  }
  const out = [];
  for (let t = 0; t < idx.length; t += 3) { const a = idx[t], b = idx[t + 1], c = idx[t + 2]; if (!(tapado[a] && tapado[b] && tapado[c])) out.push(a, b, c); }
  return new THREE.BufferAttribute(B.n > 65535 ? new Uint32Array(out) : new Uint16Array(out), 1);
}
// Tela a cuadros del color de la camisa (una por color) y su color promedio para el zombie lejano
const TEXTURAS = new Map();
function texturaEscocesa(base) {
  if (TEXTURAS.has(base)) return TEXTURAS.get(base);
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const b = col(base), hex = k => '#' + b.clone().multiplyScalar(k).getHexString(), claro = '#' + b.clone().lerp(col('#ffffff'), 0.55).getHexString();
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (const [p, w, color, a] of [[0, 46, hex(0.18), 0.75], [128, 46, hex(0.18), 0.75], [60, 10, claro, 0.55], [188, 10, claro, 0.55], [100, 4, hex(0.05), 0.8], [228, 4, hex(0.05), 0.8]]) { g.globalAlpha = a; g.fillStyle = color; g.fillRect(p, 0, w, 256); g.fillRect(0, p, 256, w); }
  g.globalAlpha = 1;
  for (let k = 0; k < 2200; k++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1, 1 + Math.random() * 3); }
  const d = g.getImageData(0, 0, 256, 256).data; let r = 0, v = 0, a = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; v += d[i + 1]; a += d[i + 2]; }
  const n = d.length / 4, t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  t.userData.promedio = new THREE.Color().setRGB(r / n / 255, v / n / 255, a / n / 255, THREE.SRGBColorSpace);
  TEXTURAS.set(base, t); return t;
}
const promedioEscocesa = base => texturaEscocesa(base).userData.promedio;
// Materiales compartidos de los accesorios
let MATS = null;
function materialesAccesorios() {
  if (MATS) return MATS;
  const pelo = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide, alphaTest: 0.5 });
  const l = document.createElement('canvas'); l.width = 32; l.height = 128; const g = l.getContext('2d');   // mechones: hebras con huecos
  for (let x = 0; x < 32; x++) { const a = 0.55 + Math.random() * 0.45, largo = 128 * (0.65 + Math.random() * 0.35); g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(x, 0, 1, largo); }
  pelo.alphaMap = new THREE.CanvasTexture(l);
  return (MATS = {
    mate: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), brillo: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.1 }),
    vidrio: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.08, transparent: true, opacity: 0.38, depthWrite: false }),
    luz: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), pelo,
    escudo: materialEscudo(false), paves: materialEscudo(true),
  });
}

/* ---------- Un zombie ---------- */
const IDENTIDAD = new THREE.Matrix4();
const LIVIANAS = new Set(['glock', 'ak47', 'mossberg', 'minigun']);
export class Zombie {
  constructor(escena, efectos, M, horda) {
    this.escena = escena; this.efectos = efectos; this.M = M; this.horda = horda; this.clase = 'humano';
    this.grupo = new THREE.Group(); this.grupo.visible = false; escena.add(this.grupo);
    this.huesos = {};
    for (const n of NOMBRES) {
      const b = new THREE.Bone(); b.name = n; const p = M.A[n], pp = PADRE[n] ? M.A[PADRE[n]] : [0, 0, 0]; b.position.set(p[0] - pp[0], p[1] - pp[1], p[2] - pp[2]);
      this.huesos[n] = b; if (PADRE[n]) this.huesos[PADRE[n]].add(b);
    }
    this.grupo.add(this.huesos.cadera); this.grupo.rotation.order = 'YXZ';
    this.grupo.updateMatrixWorld(true);
    this.esqueleto = new THREE.Skeleton(NOMBRES.map(n => this.huesos[n]));
    // Materiales propios (las heridas y la sangre son de cada uno)
    this.matPiel = materialZombie('piel'); this.matCamisa = materialZombie('tela'); this.matSobre = materialZombie('tela'); this.matPantalon = materialZombie('tela');
    this.mats = [this.matPiel, this.matCamisa, this.matSobre, this.matPantalon];
    this.cuerpo = this.conPiel(M.alto.geo, this.matPiel);
    this.lejos = this.conPiel(M.bajo.geo, this.matPiel);
    this.prendas = {}; this.camisa = null; this.pantalon = null; this.sobre = null; this.detallado = null; this.accesorios = {};
    const cab = this.huesos.cabeza, C = M.cabeza;
    this.ojos = new THREE.Mesh(C.ojos, C.matOjo); this.pupilas = new THREE.Mesh(C.pupilas, C.matPupila); this.dientes = new THREE.Mesh(C.dientes, C.matColor);
    cab.add(this.ojos, this.pupilas, this.dientes);
    this.zonas = M.zonas.map(([hueso, geo, centro, tipo]) => {
      const m = new THREE.Mesh(geo, horda.matZona); m.position.set(centro[0] - M.A[hueso][0], centro[1] - M.A[hueso][1], centro[2] - M.A[hueso][2]);
      this.huesos[hueso].add(m); m.userData = { zombie: this, tipo, hueso }; return m;
    });
    this.zonasBase = this.zonas.slice();
    this.carnes = [carneDeHerida(), carneDeHerida()]; for (const c of this.carnes) c.visible = false;
    this.libre = true; this.estado = 'muerto'; this.vidaMax = VIDA_ZOMBIE_NORMAL; this.vida = 0; this.fase = Math.random() * 6;
    this.sacudida = { pecho: v3(), cabeza: v3() }; this.aturdido = 0; this.proximoGemido = 0; this.proximaMordida = 0;
    this.caida = 0; this.direccionCaida = 1; this.muertoEn = 0; this.tiempoCuerpo = 6000; this.apuro = 1; this.apuroHasta = 0;
    this.objetivo = v3(); this.destino = v3(); this.velocidad = 0.55; this.quieto = false; this.accion = null; this.subido = 0;
  }
  get vivo() { return !this.libre && this.estado !== 'cae' && this.estado !== 'muerto'; }
  get blanco() { return this.vivo && !this.bajoTierra; }
  conPiel(base, mat) {   // malla con piel que comparte la forma del molde y tiene su propio color
    const g = new THREE.BufferGeometry();
    for (const k of ['position', 'normal', 'skinIndex', 'skinWeight', 'uv']) if (base.attributes[k]) g.setAttribute(k, base.attributes[k]);
    g.setIndex(base.index);
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(base.attributes.position.count * 3), 3));
    const m = new THREE.SkinnedMesh(g, mat); m.frustumCulled = false; this.grupo.add(m); m.bind(this.esqueleto, IDENTIDAD);
    return m;
  }
  pegar(hueso, malla) { this.huesos[hueso].add(malla); return malla; }
  // Accesorios del tipo (se arman una vez por zombie y se prenden o apagan)
  ponerAccesorios(V) {
    const M = this.M, C = M.cabeza, MA = materialesAccesorios(), quiere = new Set(V.accesorios || []);
    if (V.camisa === 'capucha') quiere.add('capucha');
    for (const [nombre, piezas] of Object.entries(this.accesorios)) for (const p of piezas) p.visible = quiere.has(nombre);
    for (const nombre of quiere) {
      if (this.accesorios[nombre]) continue;
      if (nombre === 'barbijo') { this.accesorios.barbijo = [this.pegar('cabeza', new THREE.Mesh(C.barbijo, C.matTela))]; continue; }
      if (nombre === 'capucha') {
        const g = C.capucha.clone(); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
        this.accesorios.capucha = [this.pegar('pecho', new THREE.Mesh(g, MA.mate))]; continue;
      }
      if (nombre === 'dorsal') { this.accesorios.dorsal = [this.crearDorsal()]; continue; }
      this.accesorios[nombre] = accesorio(nombre, M.A).map(p => {
        const h = M.A[p.hueso], m = new THREE.Mesh(p.geo.translate(-h[0], -h[1], -h[2]), MA[p.mat]);
        this.pegar(p.hueso, m);
        if (p.escudo) { m.userData = { zombie: this, tipo: 'escudo', hueso: p.hueso, escudo: p.escudo }; this.escudoMalla = m; }
        if (p.buche) this.buche = m;
        if (p.mecha) this.mecha = m;
        if (p.pulso !== undefined) { m.userData.pulso = p.pulso; (this.pustulas || (this.pustulas = [])).push(m); }
        return m;
      });
    }
    if (this.accesorios.dorsal && quiere.has('dorsal')) this.numeroDorsal();
    const conEscudo = quiere.has('escudo') || quiere.has('paves');
    this.zonas = this.zonasBase.concat(conEscudo && this.escudoMalla ? [this.escudoMalla] : []);
  }
  crearDorsal() {
    const g = new THREE.PlaneGeometry(0.15, 0.11, 8, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, -(p.getX(i) ** 2) / (2 * 0.17));
    const lienzo = document.createElement('canvas'); lienzo.width = 128; lienzo.height = 96;
    const tex = new THREE.CanvasTexture(lienzo); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide }));
    m.rotation.x = -0.12; m.userData.lienzo = lienzo; m.userData.tex = tex;
    this.huesos.pecho.add(m); m.position.set(0, 1.215 - this.M.A.pecho[1], 0.106 - this.M.A.pecho[2]);
    return m;
  }
  numeroDorsal() {
    const m = this.accesorios.dorsal[0], g = m.userData.lienzo.getContext('2d');
    g.fillStyle = '#ecebe4'; g.fillRect(0, 0, 128, 96); g.fillStyle = '#b8261b'; g.fillRect(0, 0, 128, 16); g.fillRect(0, 80, 128, 16);
    g.fillStyle = '#16161a'; g.font = '700 50px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(10 + Math.floor(Math.random() * 890)), 64, 50);
    g.fillStyle = 'rgba(90,12,8,0.75)'; g.beginPath(); g.ellipse(30 + Math.random() * 60, 60 + Math.random() * 20, 18, 12, Math.random() * 3, 0, 7); g.fill();
    for (let k = 0; k < 300; k++) { g.fillStyle = `rgba(60,50,30,${Math.random() * 0.15})`; g.fillRect(Math.random() * 128, Math.random() * 96, 2, 2); }
    m.userData.tex.needsUpdate = true;
  }
  vestir(id) {
    const V = { ...TIPOS[id], id }, M = this.M;
    this.tipo = id; this.T = V;
    for (const m of Object.values(this.prendas)) m.visible = false;
    const prenda = (clave, geo, mat) => { let m = this.prendas[clave]; if (!m) m = this.prendas[clave] = this.conPiel(geo, mat); m.material = mat; m.visible = true; return m; };
    this.cuerpo.geometry.setIndex(coloresDe(M, id).indice);
    this.matCamisa.map = V.cuadros ? texturaEscocesa(V.tela) : this.matPantalon.map;
    this.camisa = V.camisa ? prenda('camisa:' + V.camisa, M.camisas[V.camisa].geo, this.matCamisa) : null;
    this.sobre = M.sobres[id] ? prenda('sobre:' + id, M.sobres[id].geo, this.matSobre) : null;
    this.pantalon = prenda('pantalon:' + V.pantalon, M.pantalones[V.pantalon].geo, this.matPantalon);
    for (const m of this.mats) m.userData.uniforms.uSangre.value.set(V.sangre || '#4a0806');
    this.ponerAccesorios(V);
    const [e0, e1] = V.escala; this.grupo.scale.setScalar(e0 + Math.random() * (e1 - e0));
    this.directo = V.conducta === 'rompe' || V.conducta === 'demuele';
    this.detallado = null;
  }
  // Cerca, el cuerpo fino con la ropa en capas; lejos, una malla sola con la ropa pintada
  detalle(cerca) {
    if (this.detallado === cerca) return; this.detallado = cerca;
    const barbijo = (this.T.accesorios || []).includes('barbijo');
    this.cuerpo.visible = cerca; this.lejos.visible = !cerca;
    for (const m of [this.camisa, this.sobre, this.pantalon]) if (m) m.visible = cerca;
    this.pupilas.visible = cerca; this.dientes.visible = cerca && !barbijo;
    if (this.accesorios.barbijo) this.accesorios.barbijo[0].visible = cerca && barbijo;
  }
  /* op: { vida, velocidad (multiplican), quieto, rumbo, emerger, ahora, sigue (zombie al que sigue), fila } */
  aparecer(p, id = 'caminante', op = {}) {
    this.vestir(id);
    const V = this.T, g = this.grupo;
    g.position.set(p.x, 0, p.z); g.rotation.set(0, op.rumbo ?? Math.atan2(-p.x, -p.z), 0);
    this.vidaMax = VIDA_ZOMBIE_NORMAL * (V.vida || 1) * (op.vida || 1); this.vida = this.vidaMax;
    this.velocidad = 0.55 * (V.vel || 1) * (op.velocidad || 1) * (0.92 + Math.random() * 0.16); this.quieto = !!op.quieto; this.sigue = op.sigue || null; this.fila = op.fila || 0;
    this.estado = 'camina'; this.caida = 0; this.aturdido = 0; this.libre = false; this.fase = Math.random() * 6; this.accion = null; this.subido = 0; this.bajoTierra = false; this.volando = null; this.cargadoPor = null; this.cargado = null;
    this.sacudida.pecho.set(0, 0, 0); this.sacudida.cabeza.set(0, 0, 0); this.destino.copy(this.objetivo); this.apuro = 1; this.apuroHasta = 0;
    this.quemando = 0; this.chamuscado = 0; if (this.llamas) for (const l of this.llamas) l.visible = false;
    const ahora = op.ahora ?? performance.now();
    this.proximoGemido = ahora + 1500 + Math.random() * 4000; this.proximaMordida = 0; this.proximoEspecial = ahora + 2000 + Math.random() * 2000;
    this.heridas = 0; cerrarHeridas(this.mats); for (const c of this.carnes) { c.visible = false; if (c.parent) c.parent.remove(c); }
    this.inmuneHasta = 0; this.zigzag = Math.random() * 6;
    const C = coloresDe(this.M, id), tono = V.piel ? tonoDe(V.piel) : V.pieles ? tonoDe(V.pieles[Math.floor(Math.random() * V.pieles.length)]) : TONOS[Math.floor(Math.random() * TONOS.length)];
    teñir(this.cuerpo, C.cuerpo, tono); teñir(this.lejos, C.lejos, tono);
    if (this.camisa) copiarColor(this.camisa, C.camisa); if (this.sobre) copiarColor(this.sobre, C.sobre); copiarColor(this.pantalon, C.pantalon);
    if (this.accesorios.capucha && this.accesorios.capucha[0].visible) { const c = col(V.tela), a = this.accesorios.capucha[0].geometry.attributes.color; for (let i = 0; i < a.count; i++) a.setXYZ(i, c.r * 0.85, c.g * 0.85, c.b * 0.85); a.needsUpdate = true; }
    if (this.buche) this.buche.scale.setScalar(1);
    g.visible = true; this.detalle(true);
    if (V.conducta === 'excava' && op.emerger !== false && !op.quieto) { this.enterrar(); return; }
    if (op.emerger) { this.estado = 'sale'; this.saliendo = 0; this.saleEn = V.jefe ? 2.6 : 1.7; g.position.y = -1.8 * g.scale.x; this.polvo(V.jefe ? 24 : 10, V.jefe ? 2 : 1.2); Audio_.gemido(false, 400); }
  }
  liberar() {
    this.libre = true; this.grupo.visible = false; this.estado = 'muerto'; this.quemando = 0; this.bajoTierra = false; this.volando = null;
    if (this.llamas) for (const l of this.llamas) l.visible = false;
    if (this.monticulo) this.monticulo.visible = false;
    if (this.cargado) { this.cargado.soltarDe(this); this.cargado = null; }
    this.cargadoPor = null;
  }
  polvo(n, fuerza) {
    const e = this.efectos, p = this.grupo.position;
    for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, r = 0.15 + Math.random() * 0.35 * this.grupo.scale.x; e.particula(e.matPolvo, v3(p.x + Math.cos(a) * r, 0.05, p.z + Math.sin(a) * r), v3(Math.cos(a) * fuerza * 0.6, 0.4 + Math.random() * fuerza, Math.sin(a) * fuerza * 0.6), (0.22 + Math.random() * 0.2) * this.grupo.scale.x, 0.9 + Math.random() * 0.6, 2.2); }
  }

  /* --- Impactos --- */
  // golpe: { punto, dir, dano, tipo ('bala' | 'perdigon' | 'explosion' | 'fuego' | 'filo' | 'golpe' | 'rayo'), zona, arma, tiro }
  recibir(golpe) {
    if (!this.vivo || this.bajoTierra) return false;
    const V = this.T, zona = golpe.zona ? golpe.zona.userData.tipo : 'tronco', hueso = golpe.zona ? golpe.zona.userData.hueso : 'pecho';
    const arma = golpe.arma && golpe.arma.id, liviana = LIVIANAS.has(arma) && (golpe.tipo === 'bala' || golpe.tipo === 'perdigon');
    if (zona === 'escudo' && (liviana || golpe.tipo === 'filo' || golpe.tipo === 'golpe')) {   // el escudo frena las balas chicas y los golpes
      if (golpe.punto) this.efectos.impacto(golpe.punto, golpe.dir ? golpe.dir.clone().negate() : v3(0, 0, 1), 'metal');
      Audio_.blanco('acero'); return false;
    }
    let dano = golpe.dano;
    if (V.blindaje && liviana) dano = V.blindaje >= 4 ? Math.min(1, dano) : dano / (1 + V.blindaje);
    const casco = (V.accesorios || []).includes('casco-antimotin') && liviana;
    const mult = zona === 'cabeza' ? (V.jefe || casco ? 2 : 4) : zona === 'miembro' ? 0.6 : 1;
    this.vida -= dano * mult;
    if (golpe.punto && zona !== 'escudo') this.mancharSangre(golpe.punto, hueso, golpe.tipo === 'perdigon' ? 0.035 : golpe.tipo === 'explosion' ? 0.12 : 0.05);
    if (zona !== 'escudo') this.herida(golpe, zona, hueso);
    const empuje = golpe.dir ? golpe.dir.clone().setY(0).normalize() : v3(0, 0, -1), local = empuje.clone().applyQuaternion(this.grupo.quaternion.clone().invert());
    const f = Math.min(1.5, golpe.dano / 5) * (golpe.tipo === 'perdigon' ? 0.5 : 1) * (V.jefe ? 0.25 : 1);
    if (zona === 'cabeza') this.sacudida.cabeza.add(v3(local.z * 0.5, 0, -local.x * 0.5).multiplyScalar(f)); else this.sacudida.pecho.add(v3(local.z * 0.25, 0, -local.x * 0.25).multiplyScalar(f));
    if (dano * mult >= 10 && !V.jefe) this.aturdido = V.conducta === 'corre' || V.conducta === 'rabia' ? 0.35 : 0.6;
    const cabezazo = zona === 'cabeza' && !V.jefe && !casco;
    if (cabezazo || this.vida <= 0) { this.morir(empuje, cabezazo, golpe.tipo); return true; }
    if (Math.random() < 0.4) Audio_.gemido(false, 300);
    return false;
  }
  // Herida que se abre (como en Left 4 Dead 2): cabezazos, perdigones de cerca, explosiones, el filo y el rifle
  herida(golpe, zona, hueso) {
    if (!golpe.punto || this.heridas >= 2 || (this.T.jefe && golpe.tipo !== 'explosion')) return;
    const ojo = this.horda.ojo, cerca = ojo && golpe.punto.distanceTo(ojo) < 5;
    const fuerte = golpe.tipo === 'explosion' || golpe.tipo === 'filo' || (zona === 'cabeza' && golpe.dano >= 5) || (golpe.tipo === 'perdigon' && golpe.tiro && !golpe.tiro.herida && cerca) || (golpe.arma && golpe.arma.id === 'remington700');
    if (!fuerte) return;
    if (golpe.tiro) golpe.tiro.herida = true;
    const b = this.huesos[hueso]; b.updateWorldMatrix(true, false);
    const c = b.worldToLocal(golpe.punto.clone()).add(v3(...this.M.A[hueso]));
    const r = zona === 'cabeza' ? v3(0.045, 0.04, 0.045) : golpe.tipo === 'filo' ? v3(0.07, 0.016, 0.05) : golpe.tipo === 'explosion' ? v3(0.09, 0.08, 0.07) : v3(0.04, 0.04, 0.035);
    const i = this.heridas++; ponerHerida(this.mats, i, c, r);
    const carne = this.carnes[i]; carne.scale.copy(r).multiplyScalar(0.92); carne.position.copy(c).sub(v3(...this.M.A[hueso])); b.add(carne); carne.visible = true;
  }
  mancharSangre(punto, hueso, radio) {
    const b = this.huesos[hueso]; b.updateWorldMatrix(true, false);
    const reposo = b.worldToLocal(punto.clone()).add(v3(...this.M.A[hueso])), rx = reposo.x, ry = reposo.y, rz = reposo.z, S = this.T.sangre ? col(this.T.sangre) : SANGRE;
    for (const m of [this.cuerpo, this.lejos, this.camisa, this.sobre, this.pantalon]) {
      if (!m) continue;
      const p = m.geometry.attributes.position.array, c = m.geometry.attributes.color, a = c.array; let hubo = false;
      for (let v = 0; v < p.length / 3; v++) {
        const dy = p[v * 3 + 1] - ry; if (dy > radio || dy < -radio) continue;
        const d = Math.hypot(p[v * 3] - rx, dy, p[v * 3 + 2] - rz);
        if (d < radio) { const k = (1 - d / radio) * 0.85; a[v * 3] += (S.r * 0.7 - a[v * 3]) * k; a[v * 3 + 1] += (S.g * 0.5 - a[v * 3 + 1]) * k; a[v * 3 + 2] += (S.b * 0.5 - a[v * 3 + 2]) * k; hubo = true; }
      }
      if (hubo) c.needsUpdate = true;
    }
  }
  morir(empuje, cabezazo, tipo) {
    const V = this.T;
    if (this.cargado) { this.cargado.soltarDe(this); this.cargado = null; }
    // el hinchado y la Cisterna estallan al morir; el dinamitero sólo si lo prende el fuego o una explosión
    if (V.conducta === 'revienta' || (V.conducta === 'demuele' && (tipo === 'fuego' || tipo === 'explosion'))) { this.estallar(cabezazo); return; }
    this.estado = 'cae'; this.caida = 0; this.accion = null;
    const local = empuje.clone().applyQuaternion(this.grupo.quaternion.clone().invert());
    this.direccionCaida = local.z < 0.3 ? -1 : 1;
    Audio_.zombieMuere(true);
    if (V.conducta === 'gas' && this.horda.mundo) this.horda.mundo.gas(this.grupo.position.clone(), V.gas.radio, V.gas.dura, V.gas.dano);
    if (this.alMorir) this.alMorir(this, cabezazo, tipo);
  }
  estallar(cabezazo = false) {
    const V = this.T, p = this.grupo.position.clone().add(v3(0, 1.0 * this.grupo.scale.x, 0)), E = V.estalla || V.carga;
    this.estado = 'muerto'; this.muertoEn = -1e9;
    if (this.alMorir) this.alMorir(this, cabezazo, 'estalla');
    this.liberar();
    if (this.horda.mundo) this.horda.mundo.explotar(p, E.radio, { dano: E.dano, de: this, gore: V.conducta === 'revienta', color: V.conducta === 'revienta' ? '#a9b44a' : null });
  }

  // ¿Está p cerca del cuerpo? (de pie: un cilindro del alto del zombie; caído: tendido en el piso)
  cerca(p, r = 0.3) {
    if (this.libre || this.estado === 'muerto' || this.bajoTierra) return false;
    const g = this.grupo.position, s = this.grupo.scale.x, dx = p.x - g.x, dz = p.z - g.z;
    if (this.estado === 'cae') return Math.hypot(dx, dz) < 1.1 * s && p.y < 0.6 * s;
    return Math.hypot(dx, dz) < 0.22 * s + r && p.y > g.y && p.y < g.y + 1.85 * s;
  }
  incendiar(seg) {
    if (!this.llamas) {
      const tex = this.efectos.matFuego;
      this.llamas = ['cabeza', 'pecho', 'columna', 'cadera', 'brazoI', 'brazoD', 'anteI', 'anteD', 'musloI', 'musloD', 'piernaI'].map(h => { const s = new THREE.Sprite(tex.clone()); s.scale.setScalar(0.25); s.visible = false; this.huesos[h].add(s); s.position.set(0, /^(brazo|ante|muslo|pierna)/.test(h) ? -0.12 : 0.05, 0.06); return s; });
    }
    if (!(this.quemando > 0)) Audio_.gemido(true, 80);
    this.quemando = Math.max(this.quemando || 0, seg);
  }
  quemar(ahora, dt) {
    if (!(this.quemando > 0)) return;
    this.quemando -= dt;
    for (const s of this.llamas) { s.visible = this.quemando > 0; s.scale.setScalar(0.2 + Math.random() * 0.18); s.material.rotation = Math.random() * 6; }
    if (this.vivo) { this.vida -= 4 * dt; if (this.vida <= 0) this.morir(v3(0, 0, -1), false, 'fuego'); }
    if (!this.chamuscado || ahora - this.chamuscado > 400) {
      this.chamuscado = ahora;
      for (const m of [this.cuerpo, this.lejos, this.camisa, this.sobre, this.pantalon]) { if (!m) continue; const c = m.geometry.attributes.color; for (let i = 0; i < c.array.length; i++) c.array[i] *= 0.97; c.needsUpdate = true; }
    }
  }

  /* --- Cada cuadro --- */
  actualizar(ahora, dt, alMorder) {
    if (this.libre) return;
    const g = this.grupo, V = this.T, W = this.horda.mundo;
    this.quemar(ahora, dt);
    for (const k of ['pecho', 'cabeza']) this.sacudida[k].multiplyScalar(Math.max(0, 1 - dt * 7));
    if (this.pustulas) for (const p of this.pustulas) p.scale.setScalar(1 + Math.sin(ahora * 0.004 + (p.userData.pulso || 0)) * 0.18);
    if (this.mecha && this.mecha.visible) { this.mecha.scale.setScalar(0.7 + Math.random() * 0.7); if (Math.random() < dt * 20) { const p = this.mecha.getWorldPosition(v3()); this.efectos.particula(this.efectos.matChispa, p, v3((Math.random() - 0.5), Math.random() * 1.5, (Math.random() - 0.5)), 0.012, 0.25, 0.4, 4); } }
    if (this.estado === 'cae' || this.estado === 'muerto') return this.actualizarCaida(ahora, dt);
    if (this.volando) return this.actualizarVuelo(ahora, dt);
    if (this.cargadoPor) return this.poseColgado(ahora);
    if (this.bajoTierra) return this.actualizarTopo(ahora, dt);
    if (this.estado === 'sale') return this.actualizarSalida(ahora, dt);
    if (this.accion) return this.actualizarAccion(ahora, dt);
    const dist = Math.hypot(this.objetivo.x - g.position.x, this.objetivo.z - g.position.z), s = g.scale.x, ataca = dist < 0.78 * Math.max(1, s * 0.8) && Math.abs(g.position.y - this.subido) < 0.3;
    // Lo especial de cada tipo
    if (!this.quieto && W && this.conducta(ahora, dist)) return;
    const hacia = ataca ? this.objetivo : this.destino;
    let dif = Math.atan2(hacia.x - g.position.x, hacia.z - g.position.z) - g.rotation.y; dif = Math.atan2(Math.sin(dif), Math.cos(dif));
    const rapido = V.conducta === 'corre' || V.conducta === 'rabia' || V.conducta === 'demuele';
    const giro = (rapido ? 3.4 : V.jefe ? 1.0 : 1.6) * dt; g.rotation.y += limitar(dif, -giro, giro);
    this.aturdido = Math.max(0, this.aturdido - dt);
    this.estado = ataca ? 'ataca' : 'camina';
    // el escupidor se planta a su distancia
    const plantado = V.conducta === 'escupe' && dist < V.escupe.distancia;
    const anda = !ataca && !this.quieto && this.aturdido <= 0 && !plantado, derecho = Math.max(0.2, Math.cos(dif));
    const vel = this.velocidad * (ahora < this.apuroHasta ? this.apuro : 1) * this.horda.apuroGlobal;
    const avanzar = d => {
      const dir = v3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y));
      if (V.conducta === 'rabia' && dist > 2) dir.addScaledVector(v3(dir.z, 0, -dir.x), Math.sin(ahora * 0.006 + this.zigzag) * 0.9).normalize();   // zigzag
      g.position.addScaledVector(dir, d * derecho);
    };
    const t = ahora / 1000, alcance = ataca ? 0.25 + 0.15 * Math.sin(t * 5) : 0;
    if (rapido) {
      if (anda) { this.fase += dt * 9.5 * (V.conducta === 'rabia' ? 1.3 : 1); avanzar(vel * dt * (0.85 + 0.15 * Math.abs(Math.sin(this.fase)))); } else this.fase += dt * 1.5;
      this.poseCorrer(ahora, anda, ataca, alcance);
    } else {
      const pesado = ['gordo', 'hinchado', 'coloso'].includes(this.M.nombre) || !!V.jefe;
      if (anda) { this.fase += dt * (pesado ? 2.4 : 3.3) * Math.min(1.6, vel / 0.55 / (pesado ? 0.8 : 1)); avanzar(vel * dt * (0.75 + 0.25 * Math.abs(Math.sin(this.fase)))); }
      else this.fase += dt * 1.2;
      this.poseCaminar(ahora, anda, ataca, alcance, pesado);
    }
    // sube a la mesa (los que van derecho) o se queda en el piso
    g.position.y += (this.subido - g.position.y) * Math.min(1, dt * 6);
    if (ahora > this.proximoGemido) { Audio_.gemido(ataca, Math.min(600, dist * 25)); this.proximoGemido = ahora + 3000 + Math.random() * 4000; }
    if (ataca && ahora > this.proximaMordida) { this.proximaMordida = ahora + (V.jefe ? 1700 : 1400); Audio_.zombieGolpea(); if (alMorder) alMorder(this); }
    if (V.jefe && anda && W && Math.sin(this.fase) * Math.sin(this.fase - dt * 2.4) < 0) W.temblor(0.25);   // los pasos del gigante
  }
  // Lo de cada tipo; devuelve true si ya se encargó del cuadro
  conducta(ahora, dist) {
    const V = this.T, W = this.horda.mundo, g = this.grupo, p = g.position, s = g.scale.x;
    if (ahora < this.proximoEspecial) return false;
    switch (V.conducta) {
      case 'grita':
        if (dist < 40) { this.accion = { tipo: 'grito', t0: ahora, dura: V.grito.quieto * 1000 }; this.proximoEspecial = ahora + V.grito.cada * 1000; this.horda.grito(this, V.grito); return true; }
        break;
      case 'revienta':
        if (dist < 1.2 * s) { this.accion = { tipo: 'hincha', t0: ahora, dura: 450 }; Audio_.gemido(true, 0); return true; }
        break;
      case 'demuele': {   // la primera construcción en el camino: la mesa (o el jugador si está más cerca)
        const m = W.mesa, cx = limitar(p.x, m.x0, m.x1), cz = limitar(p.z, m.z0, m.z1), dm = Math.hypot(p.x - cx, p.z - cz);
        if (dm < 0.45 || dist < 0.9) { W.empujarArmas(v3(cx, 1, cz), 2.5, 7); this.estallar(); return true; }
        break;
      }
      case 'escupe':
        if (dist < V.escupe.distancia + 1 && dist > 2) { this.accion = { tipo: 'escupe', t0: ahora, dura: 1100 }; this.proximoEspecial = ahora + V.escupe.cada * 1000; return true; }
        break;
      case 'arroja':
        if (dist < 11 && dist > 3) {
          const presa = this.horda.zombies.find(z => z !== this && z.vivo && z.clase === 'humano' && !z.T.jefe && !z.cargadoPor && !z.volando && z.estado !== 'sale' && z.grupo.position.distanceTo(p) < 2.6);
          this.accion = presa ? { tipo: 'agarra', t0: ahora, dura: 700, presa } : { tipo: 'cascote', t0: ahora, dura: 1100 };
          this.proximoEspecial = ahora + 4500 + Math.random() * 1500; return true;
        }
        break;
      case 'rompe':
        if (V.fardos && dist < V.fardos.distancia && dist > 3.5) { this.accion = { tipo: 'fardo', t0: ahora, dura: 1300 }; this.proximoEspecial = ahora + V.fardos.cada * 1000; return true; }
        break;
    }
    return false;
  }
  actualizarAccion(ahora, dt) {
    const A = this.accion, H = this.huesos, g = this.grupo, V = this.T, W = this.horda.mundo, t = (ahora - A.t0) / A.dura, s = g.scale.x;
    let d = Math.atan2(this.objetivo.x - g.position.x, this.objetivo.z - g.position.z) - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); g.rotation.y += limitar(d, -2 * dt, 2 * dt);
    this.poseCaminar(ahora, false, false, 0, !!V.jefe);
    g.position.y += (this.subido - g.position.y) * Math.min(1, dt * 6);
    if (A.tipo === 'grito') {   // se planta, echa la cabeza atrás y grita (con el megáfono en la boca)
      const k = Math.sin(Math.min(1, t * 3) * Math.PI / 2);
      H.columna.rotation.x = 0.05 - 0.2 * k; H.cuello.rotation.x = -0.1 - 0.3 * k; H.cabeza.rotation.x = -0.25 * k + Math.sin(ahora * 0.05) * 0.03;
      for (const [L, sg] of [['I', 1], ['D', -1]]) { H['brazo' + L].rotation.set(-0.6 - 0.5 * k, 0, -sg * (0.6 + 0.5 * k)); H['ante' + L].rotation.set(-0.4, 0, 0); }
      if (V.pose === 'megafono') { H.brazoD.rotation.set(-1.1, 0, 0.55); H.anteD.rotation.set(-2.25, 0, 0); }
    } else if (A.tipo === 'hincha') {   // se hincha y revienta
      g.scale.setScalar(s * (1 + dt * 0.5));
      if (t >= 1) { this.estallar(); return; }
    } else if (A.tipo === 'escupe') {   // el buche se hincha, la cabeza va atrás y escupe en arco
      const k = Math.min(1, t / 0.55);
      if (this.buche) this.buche.scale.setScalar(1 + (t < 0.55 ? k : 0) * 0.9);
      H.cuello.rotation.x = -0.2 - 0.45 * (t < 0.55 ? k : 1 - (t - 0.55) / 0.45); H.cabeza.rotation.x = -0.3 * (t < 0.55 ? k : 0);
      if (!A.arcada) { A.arcada = true; Audio_.toxicoArcada(Math.min(600, g.position.distanceTo(this.objetivo) * 25)); }
      if (t >= 0.55 && !A.hecho) {
        A.hecho = true;
        const boca = this.huesos.cabeza.localToWorld(v3(0, 0.03, 0.09)); W.escupir(boca, this.objetivo.clone(), V.escupe, this);
        Audio_.escupir(Math.min(600, g.position.distanceTo(this.objetivo) * 25));
      }
    } else if (A.tipo === 'agarra') {   // agarra al zombie de al lado y lo levanta por encima de la cabeza
      const k = Math.min(1, t);
      for (const [L, sg] of [['I', 1], ['D', -1]]) { H['brazo' + L].rotation.set(-1.4 - 1.4 * k, 0, -sg * 0.25); H['ante' + L].rotation.set(-0.3, 0, 0); }
      if (!A.levantado && t > 0.35) { A.levantado = true; if (A.presa.vivo && !A.presa.cargadoPor) { A.presa.cargarEn(this); this.cargado = A.presa; } }
      if (t >= 1) { this.accion = this.cargado ? { tipo: 'arroja', t0: ahora, dura: 600 } : null; return; }
    } else if (A.tipo === 'arroja' || A.tipo === 'cascote' || A.tipo === 'fardo') {   // carga y tira (un zombie, un cascote o un fardo)
      const k = A.tipo === 'arroja' ? t : Math.min(1, t * 1.6);
      for (const [L, sg] of [['I', 1], ['D', -1]]) { H['brazo' + L].rotation.set(k < 0.6 ? -2.8 : -2.8 + (k - 0.6) / 0.4 * 2.2, 0, -sg * 0.25); H['ante' + L].rotation.set(k < 0.6 ? -0.6 : -0.1, 0, 0); }
      H.columna.rotation.x = k < 0.6 ? -0.25 : 0.35;
      if (k >= 0.6 && !A.hecho) {
        A.hecho = true; g.updateMatrixWorld(true);
        const mano = this.huesos.manoD.getWorldPosition(v3()).lerp(this.huesos.manoI.getWorldPosition(v3()), 0.5).add(v3(0, 0.15 * s, 0));
        if (A.tipo === 'arroja' && this.cargado) { const z = this.cargado; this.cargado = null; z.lanzadoA(mano, this.objetivo, this); Audio_.lanzar('martillo'); }
        else W.arrojar(A.tipo, mano, this.objetivo.clone(), A.tipo === 'fardo' ? V.fardos.dano : 15, this);
      }
    }
    if (t >= 1) this.accion = null;
  }
  // El zombie que agarró el lanzador: va colgado de sus manos y después vuela en parábola
  cargarEn(lanzador) { this.cargadoPor = lanzador; this.accion = null; }
  soltarDe(lanzador) { if (this.cargadoPor === lanzador) { this.cargadoPor = null; this.grupo.rotation.x = 0; this.grupo.position.y = 0; } }
  poseColgado(ahora) {
    const L = this.cargadoPor, g = this.grupo;
    if (!L || !L.vivo) { this.soltarDe(L); return; }
    L.grupo.updateMatrixWorld(true);
    const m = L.huesos.manoD.getWorldPosition(v3()).lerp(L.huesos.manoI.getWorldPosition(v3()), 0.5);
    g.position.set(m.x, m.y - 0.95 * g.scale.x, m.z); g.rotation.x = 0.3;
    this.poseAgitado(ahora);
  }
  lanzadoA(desde, objetivo, lanzador) {
    this.cargadoPor = null;
    const g = this.grupo, a = v3(Math.random() - 0.5, 0, Math.random() - 0.5).multiplyScalar(2.4), destino = objetivo.clone().add(a);
    const T = 1.15, vel = destino.clone().sub(desde).setY(0).divideScalar(T); vel.y = (0 - (desde.y - 0.95)) / T + 0.5 * 9.8 * T;
    this.volando = { vel, giro: (Math.random() - 0.5) * 6 }; g.position.copy(desde).add(v3(0, -0.95, 0));
  }
  actualizarVuelo(ahora, dt) {
    const g = this.grupo, F = this.volando;
    F.vel.y -= 9.8 * dt; g.position.addScaledVector(F.vel, dt); g.rotation.x += F.giro * dt * 0.4; g.rotation.y += F.giro * dt;
    this.poseAgitado(ahora);
    if (g.position.y <= 0 && F.vel.y < 0) {   // cae lastimado y aturdido
      g.position.y = 0; g.rotation.x = 0; this.volando = null; this.subido = 0;
      this.vida -= this.vidaMax * 0.3; this.aturdido = 1.5; Audio_.cuerpoAnimalCae(1.1, 1); this.polvo(8, 1);
      if (this.horda.mundo) this.horda.mundo.empujarArmas(g.position.clone().add(v3(0, 1, 0)), 0.8, 3);
      if (this.vida <= 0) this.morir(v3(0, 0, -1), false, 'golpe');
    }
  }
  poseAgitado(ahora) {
    const H = this.huesos, t = ahora / 120;
    for (const [L, sg] of [['I', 1], ['D', -1]]) { H['brazo' + L].rotation.set(-2.2 + Math.sin(t + sg) * 0.6, 0, -sg * 0.6); H['ante' + L].rotation.set(-0.6, 0, 0); H['muslo' + L].rotation.set(-0.6 + Math.sin(t * 1.3 + sg) * 0.5, 0, sg * 0.1); H['pierna' + L].rotation.set(0.9, 0, 0); }
  }
  // El topo: se entierra, avanza por debajo (sólo se ve el montículo que avanza) y sale detrás del jugador
  enterrar() {
    this.bajoTierra = true; this.grupo.visible = false;
    if (!this.monticulo) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4a3a26, roughness: 1 }));
      m.scale.set(0.45, 0.14, 0.45); this.escena.add(m); this.monticulo = m;
    }
    this.monticulo.visible = true; this.monticulo.position.set(this.grupo.position.x, 0, this.grupo.position.z);
  }
  actualizarTopo(ahora, dt) {
    const m = this.monticulo, W = this.horda.mundo, ojo = W ? W.ojo() : this.objetivo, atras = W ? W.atrasDelJugador(1.3) : this.objetivo;
    const d = atras.clone().setY(0).sub(m.position.clone().setY(0)), l = d.length();
    if (l > 1e-4) m.position.addScaledVector(d.normalize(), Math.min(l, 1.2 * dt));
    m.position.y = Math.sin(ahora * 0.02) * 0.01; m.scale.set(0.45 + Math.sin(ahora * 0.013) * 0.04, 0.14, 0.45);
    if (Math.random() < dt * 8) this.efectos.particula(this.efectos.matPolvo, m.position.clone().add(v3((Math.random() - 0.5) * 0.6, 0.1, (Math.random() - 0.5) * 0.6)), v3(0, 0.6, 0), 0.25, 0.8, 2);
    if (l < 0.25) {   // sale: tarda 0,8 s y queda a tiro
      this.bajoTierra = false; m.visible = false; this.grupo.visible = true;
      this.grupo.position.set(m.position.x, 0, m.position.z); this.grupo.rotation.y = Math.atan2(ojo.x - m.position.x, ojo.z - m.position.z);
      this.estado = 'sale'; this.saliendo = 0; this.saleEn = 0.8; this.grupo.position.y = -1.8 * this.grupo.scale.x; this.polvo(14, 1.6); Audio_.gemido(true, 60);
    }
  }
  actualizarSalida(ahora, dt) {
    const H = this.huesos, g = this.grupo;
    this.saliendo += dt;
    const s = Math.min(1, this.saliendo / (this.saleEn || 1.7)), e = suave(s);
    g.position.y = -1.8 * g.scale.x * (1 - e);
    if (Math.random() < dt * 6) this.polvo(2, 0.6);
    H.cadera.position.y = this.M.A.cadera[1]; H.cadera.rotation.set(0, 0, 0);
    H.columna.rotation.set(0.5 * (1 - e) + 0.2 * e, 0, 0); H.pecho.rotation.set(0.12, 0, 0); H.cuello.rotation.set(-0.3, 0, 0);
    H.cabeza.rotation.set(-0.1 + this.sacudida.cabeza.x, Math.sin(ahora * 0.003) * 0.25, 0.15 + this.sacudida.cabeza.z);
    for (const [L, sg] of [['I', 1], ['D', -1]]) {
      const a = Math.sin(ahora * 0.007 + (sg > 0 ? 0 : 1.6));
      H['hombro' + L].rotation.set(0, 0, sg * 0.05); H['brazo' + L].rotation.set(-2.5 + a * 0.35 * (1 - e) + e * 1.08, 0, -sg * (0.45 - 0.15 * e)); H['ante' + L].rotation.set(-0.7 * (1 - e) - 0.25 * e + a * 0.25 * (1 - e), 0, 0); H['mano' + L].rotation.set(0.6, 0, sg * 0.15);
    }
    for (const L of ['I', 'D']) { H['muslo' + L].rotation.set(-0.4 * (1 - e), 0, 0); H['pierna' + L].rotation.set(0.7 * (1 - e), 0, 0); H['pie' + L].rotation.set(0, 0, 0); }
    if (s >= 1) { this.estado = 'camina'; g.position.y = 0; }
  }
  /* --- Poses --- */
  poseCaminar(ahora, anda, ataca, alcance, pesado) {
    const H = this.huesos, V = this.T, f = this.fase, s = Math.sin(f), s2 = Math.sin(f * 2), t = ahora / 1000, A = this.M.A;
    // tronco encorvado que se balancea (el pesado se bambolea de costado)
    H.cadera.position.y = A.cadera[1] + (anda ? Math.abs(Math.cos(f)) * (pesado ? 0.03 : 0.022) - 0.015 : -0.01);
    H.cadera.rotation.set(0.05, s * 0.09, s * (pesado ? 0.1 : 0.06));
    const erguido = V.pose === 'escudo' || V.id === 'soldado';
    H.columna.rotation.set((erguido ? 0.06 : 0.2) + this.sacudida.pecho.x, -s * 0.05, -s * (pesado ? 0.07 : 0.035) + this.sacudida.pecho.z);
    H.pecho.rotation.set(erguido ? 0.02 : 0.12, -s * 0.11, 0);
    H.cuello.rotation.set(erguido ? -0.05 : -0.22, 0, 0.05);
    H.cabeza.rotation.set(-0.08 + s2 * 0.05 + this.sacudida.cabeza.x, Math.sin(ahora * 0.0007) * 0.15, (erguido ? 0.05 : 0.22) + Math.sin(ahora * 0.0013) * 0.05 + this.sacudida.cabeza.z);
    for (const [L, sg, fa] of [['I', 1, 0], ['D', -1, 1.7]]) {
      H['hombro' + L].rotation.set(0, 0, sg * 0.05);
      if (V.pose === 'escudo' && L === 'I') { H.brazoI.rotation.set(-0.12 - alcance * 0.3, 0, 0); H.anteI.rotation.set(-1.45, 0, 0); H.manoI.rotation.set(0, 0, 0); continue; }
      if (V.pose === 'megafono' && L === 'D') { H.brazoD.rotation.set(-1.1, 0, 0.55); H.anteD.rotation.set(-2.25, 0, 0); H.manoD.rotation.set(0.3, 0, 0); continue; }
      if (pesado && !ataca) {   // brazos pesados que cuelgan y se balancean
        H['brazo' + L].rotation.set(-0.35 + Math.sin(f + fa) * 0.25, 0, -sg * 0.12); H['ante' + L].rotation.set(-0.5 + Math.sin(t * 1.3 + fa) * 0.06, 0, 0); H['mano' + L].rotation.set(0.3, 0, sg * 0.1); continue;
      }
      H['brazo' + L].rotation.set(-1.42 - alcance + Math.sin(f + fa) * 0.07, sg * 0.1, -sg * 0.3);
      H['ante' + L].rotation.set(-0.25 + Math.sin(t * 1.3 + fa) * 0.06 + alcance * 0.8, 0, 0);
      H['mano' + L].rotation.set(0.45, 0, sg * 0.15);
    }
    for (const [L, fa, arrastra] of [['I', 0, !pesado && !erguido], ['D', Math.PI, false]]) {
      const p = anda ? Math.sin(f + fa) : 0, sube = anda ? Math.max(0, Math.cos(f + fa)) : 0;
      H['muslo' + L].rotation.set(-p * (pesado ? 0.32 : 0.42) - 0.06, 0, (L === 'I' ? 1 : -1) * (pesado ? 0.06 : 0.03));
      H['pierna' + L].rotation.set(0.12 + sube * (arrastra ? 0.45 : 0.85), 0, 0);
      H['pie' + L].rotation.set(-0.1 + p * 0.25 - sube * 0.2, arrastra ? 0.35 : 0, 0);
    }
  }
  poseCorrer(ahora, anda, ataca, alcance) {
    const H = this.huesos, f = this.fase, s = Math.sin(f), c = Math.cos(f), A = this.M.A, rabia = this.T.conducta === 'rabia';
    H.cadera.position.y = A.cadera[1] + (anda ? Math.abs(c) * 0.05 - 0.04 : -0.01);
    H.cadera.rotation.set(0.1, anda ? s * 0.15 : 0, 0);
    H.columna.rotation.set((anda ? (rabia ? 0.5 : 0.38) : 0.2) + this.sacudida.pecho.x, anda ? -s * 0.12 : 0, this.sacudida.pecho.z);
    H.pecho.rotation.set(0.1, anda ? -s * 0.18 : 0, 0);
    H.cuello.rotation.set(anda ? -0.45 : -0.25, 0, 0);
    H.cabeza.rotation.set(-0.1 + this.sacudida.cabeza.x + (rabia ? Math.sin(ahora * 0.03) * 0.08 : 0), Math.sin(ahora * (rabia ? 0.009 : 0.0011)) * 0.12, 0.08 + this.sacudida.cabeza.z);
    for (const [L, sg, fa] of [['I', 1, Math.PI], ['D', -1, 0]]) {
      const b = anda ? Math.sin(f + fa) : 0;
      H['hombro' + L].rotation.set(0, 0, sg * 0.05);
      H['brazo' + L].rotation.set(ataca ? -1.42 - alcance : rabia ? -1.1 - b * 0.4 : -0.35 - b * 0.85, sg * 0.15, -sg * (rabia ? 0.45 : 0.25));
      H['ante' + L].rotation.set(ataca ? -0.25 + alcance * 0.8 : rabia ? -0.5 : -1.25 - b * 0.25, 0, 0);
      H['mano' + L].rotation.set(0.3, 0, sg * 0.2);
    }
    for (const [L, fa] of [['I', 0], ['D', Math.PI]]) {
      const p = anda ? Math.sin(f + fa) : 0, sube = anda ? Math.max(0, Math.cos(f + fa)) : 0;
      H['muslo' + L].rotation.set(-p * 0.85 - (anda ? 0.2 : 0.05), 0, (L === 'I' ? 1 : -1) * 0.04);
      H['pierna' + L].rotation.set((anda ? 0.25 : 0.08) + sube * 1.5, 0, 0);
      H['pie' + L].rotation.set(-0.2 + p * 0.3, 0, 0);
    }
  }
  actualizarCaida(ahora, dt) {
    const H = this.huesos, g = this.grupo;
    if (this.estado === 'cae') {
      this.caida = Math.min(1, this.caida + dt / (this.T.jefe ? 1.5 : 0.9));
      if (this.caida >= 1) { this.estado = 'muerto'; this.muertoEn = ahora; Audio_.cuerpoAnimalCae(this.T.jefe ? 2.4 : 1.2, 1); if (this.T.jefe && this.horda.mundo) this.horda.mundo.temblor(0.8); }
    }
    const c = this.caida * this.caida, d = this.direccionCaida;
    g.rotation.x = d * c * Math.PI / 2 * 0.96;
    g.position.y = this.subido * (1 - c) + Math.sin(c * Math.PI / 2) * 0.1 * g.scale.x;
    for (const L of ['I', 'D']) { H['muslo' + L].rotation.x = -0.5 * c * (d > 0 ? 1 : 0.4); H['pierna' + L].rotation.x = 0.9 * c * (d > 0 ? 1 : 0.5); }
    H.columna.rotation.x = 0.2 * (1 - c); H.cabeza.rotation.x = -0.3 * c * d;
    for (const [L, sg] of [['I', 1], ['D', -1]]) { H['brazo' + L].rotation.set(-1.22 * (1 - c) - (d < 0 ? 2.6 : 0.4) * c, 0, -sg * (0.3 + 0.6 * c)); H['ante' + L].rotation.x = -0.3 * (1 - c) - 0.2 * c; }
    if (this.estado === 'muerto') {
      const t = ahora - this.muertoEn;
      if (t > this.tiempoCuerpo) g.position.y = -Math.min(0.5 * g.scale.x, (t - this.tiempoCuerpo) / 1000 * 0.35 * g.scale.x);
      if (t > this.tiempoCuerpo + 1500) this.liberar();
    }
  }
}
function teñir(m, { col: c, masc }, tono) {
  const a = m.geometry.attributes.color, d = a.array;
  for (let v = 0; v < masc.length; v++) { const k = masc[v]; d[v * 3] = c[v * 3] * (1 + (tono[0] - 1) * k); d[v * 3 + 1] = c[v * 3 + 1] * (1 + (tono[1] - 1) * k); d[v * 3 + 2] = c[v * 3 + 2] * (1 + (tono[2] - 1) * k); }
  a.needsUpdate = true;
}
function copiarColor(m, c) { m.geometry.attributes.color.array.set(c); m.geometry.attributes.color.needsUpdate = true; }

/* ---------- La horda: todos los zombies (y los animales), el rodeo de la mesa y que no se encimen ---------- */
function cruzaRect(px, pz, qx, qz, r) {
  let t0 = 0, t1 = 1; const dx = qx - px, dz = qz - pz;
  for (const [p, q] of [[-dx, px - r.x0], [dx, r.x1 - px], [-dz, pz - r.z0], [dz, r.z1 - pz]]) {
    if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t1 - t0 > 1e-6;
}
// Hacia dónde caminar para llegar a t sin atravesar los obstáculos: el camino más corto por sus esquinas
export function rodeo(p, t, obstaculos, m = 0.36) {
  for (const R of obstaculos) {
    const ri = { x0: R.x0 - m + 0.04, x1: R.x1 + m - 0.04, z0: R.z0 - m + 0.04, z1: R.z1 + m - 0.04 };
    let tx = t.x, tz = t.z;
    if (tx > ri.x0 && tx < ri.x1 && tz > ri.z0 && tz < ri.z1) {
      const op = [[tx - ri.x0, ri.x0 - 0.01, tz], [ri.x1 - tx, ri.x1 + 0.01, tz], [tz - ri.z0, tx, ri.z0 - 0.01], [ri.z1 - tz, tx, ri.z1 + 0.01]].sort((a, b) => a[0] - b[0])[0];
      tx = op[1]; tz = op[2];
    }
    if (!cruzaRect(p.x, p.z, tx, tz, ri)) { if (tx !== t.x || tz !== t.z) return { x: tx, z: tz }; continue; }
    const nodos = [[p.x, p.z], [R.x0 - m, R.z0 - m], [R.x1 + m, R.z0 - m], [R.x1 + m, R.z1 + m], [R.x0 - m, R.z1 + m], [tx, tz]], n = nodos.length;
    const dist = new Array(n).fill(Infinity), previo = new Array(n).fill(-1), hecho = new Array(n).fill(false); dist[0] = 0;
    for (let it = 0; it < n; it++) {
      let u = -1; for (let i = 0; i < n; i++) if (!hecho[i] && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || dist[u] === Infinity) break; hecho[u] = true;
      for (let w = 0; w < n; w++) if (!hecho[w] && !cruzaRect(nodos[u][0], nodos[u][1], nodos[w][0], nodos[w][1], ri)) {
        const d = dist[u] + Math.hypot(nodos[w][0] - nodos[u][0], nodos[w][1] - nodos[u][1]); if (d < dist[w]) { dist[w] = d; previo[w] = u; }
      }
    }
    let w = n - 1; if (previo[w] < 0) return t;
    while (previo[w] !== 0) w = previo[w];
    return { x: nodos[w][0], z: nodos[w][1] };
  }
  return t;
}
export const sobreRect = (p, R, m = 0) => p.x > R.x0 - m && p.x < R.x1 + m && p.z > R.z0 - m && p.z < R.z1 + m;
function empujarFuera(p, R, m) {
  if (!sobreRect(p, R, m)) return;
  const op = [[p.x - (R.x0 - m), 'x', R.x0 - m], [(R.x1 + m) - p.x, 'x', R.x1 + m], [p.z - (R.z0 - m), 'z', R.z0 - m], [(R.z1 + m) - p.z, 'z', R.z1 + m]].sort((a, b) => a[0] - b[0])[0];
  p[op[1]] = op[2];
}
export class Horda {
  /* op: { maximo, obstaculos (rectángulos { x0, x1, z0, z1, alto }), mundo (lo que necesitan los especiales, de vr/campo.js), crearAnimal(tipo, horda) } */
  constructor(escena, efectos, op = {}) {
    this.escena = escena; this.efectos = efectos; this.maximo = op.maximo || 16; this.obstaculos = op.obstaculos || []; this.mundo = op.mundo || null; this.crearAnimal = op.crearAnimal || null;
    this.zombies = []; this.muertes = 0; this.cabezazos = 0; this.alMorir = null; this.tiempoCuerpo = 6000; this.detallados = 4; this.apuroGlobal = 1;
    this.matZona = new THREE.MeshBasicMaterial({ visible: false }); this.ojo = null;
  }
  get activos() { return this.zombies.filter(z => !z.libre); }
  get vivos() { return this.zombies.filter(z => z.vivo); }
  // Saca uno del montón (de su clase), o arma uno nuevo hasta el máximo; si no hay lugar, reusa el cuerpo más viejo
  aparecer(pos, tipo = 'caminante', op = {}) {
    const animal = !TIPOS[tipo], M = animal ? null : MOLDES[cuerpoDe(tipo)];
    if (!animal && !M) return null;   // falta armar su molde (asegurarTipos)
    if (animal && !this.crearAnimal) return null;
    const mio = z => animal ? z.especie === tipo : z.M === M;
    let z = this.zombies.find(q => q.libre && mio(q));
    if (!z && this.zombies.length >= this.maximo) {   // hace lugar: un libre de otra clase o el cuerpo más viejo
      const otro = this.zombies.find(q => q.libre) || this.zombies.filter(q => q.estado === 'muerto').sort((a, b) => a.muertoEn - b.muertoEn)[0];
      if (!otro) return null;
      otro.liberar(); this.quitar(otro);
    }
    if (!z) {
      z = animal ? this.crearAnimal(tipo, this) : new Zombie(this.escena, this.efectos, M, this);
      if (!z) return null;
      this.zombies.push(z);
      z.alMorir = (q, cabezazo, t) => { this.muertes++; if (cabezazo) this.cabezazos++; if (this.alMorir) this.alMorir(q, cabezazo, t); };
    }
    z.tiempoCuerpo = this.tiempoCuerpo;
    z.aparecer(pos, tipo, op); return z;
  }
  quitar(z) { const i = this.zombies.indexOf(z); if (i >= 0) this.zombies.splice(i, 1); if (z.grupo) this.escena.remove(z.grupo); if (z.monticulo) this.escena.remove(z.monticulo); }
  quitarTodos() { for (const z of this.zombies) z.liberar(); }
  zonas() { const out = []; for (const z of this.zombies) if (z.blanco) for (const m of z.zonas) out.push(m); return out; }
  cerca(p, r) { return this.zombies.find(z => z.vivo && z.cerca(p, r)) || null; }
  // El grito: los de alrededor se apuran un rato (la Sirena apura a todos mientras viva)
  grito(z, G) {
    const p = z.grupo.position;
    for (const q of this.zombies) if (q !== z && q.vivo && q.grupo.position.distanceTo(p) < G.radio) { q.apuro = G.apuro; q.apuroHasta = (this.reloj || performance.now()) + G.dura * 1000; }
    Audio_.gemido(true, 0); Audio_.gemido(true, 0);
    if (this.mundo) this.mundo.onda(p.clone().add(v3(0, 1.6 * z.grupo.scale.x, 0)), G.radio > 20 ? 14 : G.radio, z.T.jefe ? '#ff5a4a' : '#d070ff');
  }
  // objetivo: dónde está el jugador (en el piso); ojo: desde dónde se mira (para el detalle)
  actualizar(ahora, dt, objetivo, ojo, alMorder) {
    this.reloj = ahora; this.ojo = ojo;
    const activos = this.activos;
    this.apuroGlobal = activos.some(z => z.vivo && z.T && z.T.grito && z.T.grito.siempre) ? 1.33 : 1;
    for (const z of activos) {
      if (z.vivo && !z.volando && !z.cargadoPor) {
        z.objetivo.set(objetivo.x, 0, objetivo.z);
        const lider = z.sigue && z.sigue.vivo ? z.sigue : null;   // los que vienen pegados detrás del Escudo
        if (lider) { const l = lider.grupo, atras = v3(-Math.sin(l.rotation.y), 0, -Math.cos(l.rotation.y)); z.destino.copy(l.position).addScaledVector(atras, 1.1 + (z.fila || 0) * 0.8).setY(0); }
        else if (z.directo) z.destino.set(objetivo.x, 0, objetivo.z);
        else { const d = rodeo(z.grupo.position, objetivo, this.obstaculos); z.destino.set(d.x, 0, d.z); }
        if (z.directo || z.trepa) this.subirMesa(z);
      }
      z.actualizar(ahora, dt, alMorder);
    }
    const cerca = activos.filter(z => !z.libre && z.detalle).map(z => [z, z.grupo.position.distanceTo(ojo)]).sort((a, b) => a[1] - b[1]);
    cerca.forEach(([z, d], i) => z.detalle(i < this.detallados && d < (z.detallado ? 7.5 : 6.5) * Math.max(1, z.grupo.scale.x * 0.8)));
    const vivos = activos.filter(z => z.vivo && !z.volando && !z.cargadoPor && !z.bajoTierra && !z.vuela);
    for (let i = 0; i < vivos.length; i++) for (let j = i + 1; j < vivos.length; j++) {
      const a = vivos[i].grupo.position, b = vivos[j].grupo.position, min = 0.27 * (vivos[i].grupo.scale.x * (vivos[i].radio || 1) + vivos[j].grupo.scale.x * (vivos[j].radio || 1)), dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
      if (d < min && d > 1e-4) { const k = (min - d) / 2 / d; a.x -= dx * k; a.z -= dz * k; b.x += dx * k; b.z += dz * k; }
    }
    for (const z of vivos) if (!z.directo && !z.trepa) for (const R of this.obstaculos) empujarFuera(z.grupo.position, R, 0.3 * z.grupo.scale.x);
  }
  // Los que van derecho se suben a la mesa (y tiran las armas que pisan); el resto la rodea
  subirMesa(z) {
    const p = z.grupo.position, R = this.obstaculos[0]; if (!R) return;
    const encima = sobreRect(p, R, 0.18 * z.grupo.scale.x);
    z.subido = encima ? R.alto : 0;
    if (encima && this.mundo) this.mundo.empujarArmas(p.clone().setY(R.alto + 0.1), 0.45 * z.grupo.scale.x, 2.5);
  }
}
