/* ===== Zona Muerta VR: las manos del jugador =====
 * En lugar del modelo del control, las manos del sobreviviente del juego (js/skins.js): guante arena con la palma y las
 * yemas de cuero, el abrojo de la muñeca, las almohadillas de los nudillos y la manga oliva de la chaqueta. Se arma como
 * los cuerpos de los zombies (vr/forma3d.js): primitivas anatómicas unidas en una sola superficie, con 16 huesos (la
 * palma, tres falanges por dedo y el pulgar) para que los dedos se doblen.
 *   - Marco de la mano (en el que se modela): la muñeca en el origen, los dedos hacia −z, la palma hacia −y y el pulgar
 *     hacia +x (es la izquierda; la derecha es su espejo: la malla se arma una sola vez).
 *   - En el control va en el «grip» de WebXR: el origen en el centro de los dedos cerrados sobre el mango, −z hacia el
 *     pulgar y el dorso hacia afuera (−x en la izquierda, +x en la derecha); el antebrazo, hacia atrás por el rayo del
 *     control. Con el puño cerrado, los dedos abrazan el mango del control (3,4 cm), que no se ve.
 *   - posar({ agarre, gatillo, pulgar, enGatillo }): el agarre cierra medio, anular y meñique; el gatillo, el índice; el
 *     pulgar baja cuando toca los botones; enGatillo pone el índice en el gatillo de un arma de fuego. Lo que se sostiene
 *     (cargador, guardamanos, cerrojo, un mango) cierra la mano entera. */
import * as THREE from 'three';
import { Forma, malla, normales, geometria, fbm, limitar } from './forma3d.js';

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sumar = (a, d, l) => [a[0] + d[0] * l, a[1] + d[1] * l, a[2] + d[2] * l];
const unitario = d => { const l = Math.hypot(...d); return d.map(c => c / l); };

/* ---------- Medidas (m): una mano de adulto de 19 cm, con el guante ---------- */
// Cada dedo: dónde está el nudillo, cuánto se abre en abanico (rad, hacia el pulgar) y sus tres falanges con los radios
const DEDOS = [
  { n: 'indice',  mcp: [0.0265, 0.000, -0.090], abre: 0.12,  L: [0.041, 0.024, 0.021], r: [0.0096, 0.0089, 0.0082, 0.0071] },
  { n: 'medio',   mcp: [0.0085, 0.001, -0.094], abre: 0.0,   L: [0.045, 0.028, 0.022], r: [0.0098, 0.0091, 0.0084, 0.0072] },
  { n: 'anular',  mcp: [-0.0095, 0.000, -0.090], abre: -0.09, L: [0.042, 0.027, 0.021], r: [0.0093, 0.0086, 0.0079, 0.0069] },
  { n: 'menique', mcp: [-0.0265, -0.002, -0.081], abre: -0.2, L: [0.033, 0.020, 0.019], r: [0.0082, 0.0075, 0.0069, 0.0061] },
];
// El pulgar: la base (trapecio) junto a la muñeca y sus tres tramos, que apuntan adelante, afuera y abajo
const PULGAR = { cmc: [0.019, -0.007, -0.014], dirs: [[0.62, -0.30, -0.72], [0.45, -0.32, -0.83], [0.35, -0.30, -0.89]].map(unitario),
  L: [0.040, 0.031, 0.027], r: [0.0132, 0.0112, 0.0102, 0.0094, 0.0079] };
// El pulgar cerrado (apoyado en los botones del control, sobre el índice): hacia dónde apunta cada tramo
const PULGAR_CERRADO = [[0.55, -0.55, -0.6], [0.1, -0.78, -0.62], [-0.38, -0.72, -0.58]].map(unitario);
// Dedos (rad, nudillo · medio · punta): abiertos (el control suelto), cerrados (el puño sobre el mango) y el índice
const ABIERTA = [0.28, 0.38, 0.22], CERRADA = [1.05, 1.31, 0.61], INDICE_SUELTO = [0.12, 0.15, 0.1], INDICE_GATILLO = [0.9, 1.2, 0.55];
// El galpón está muy iluminado desde arriba (el paño de la mesa sale casi al doble de claro): con el color del 2D tal
// cual, el guante se veía crema y la manga verde claro. A la mitad (lineal), con la luz quedan como en el juego
const ALBEDO = 0.5;
// Dónde termina la manga (m, detrás de la muñeca): la tapa se pinta oscura, como la boca de la manga vista de afuera
const CORTE = 0.06;
// Centro del mango en el puño cerrado (marco de la mano): ahí va el origen del grip
const MANGO = [-0.001, -0.037, -0.084];
// Colores del sobreviviente (js/skins.js: guante #a3885f, chaqueta #5d6248)
const COL = { guante: new THREE.Color('#a3885f'), cuero: new THREE.Color('#8a7150'), nudillo: new THREE.Color('#8e7650'), abrojo: new THREE.Color('#6f5a3a'),
  manga: new THREE.Color('#5d6248'), puno: new THREE.Color('#4c5138'), adentro: new THREE.Color('#14150f') };

/* ---------- Articulaciones en reposo (los dedos estirados y en abanico: así no se pegan al armar la malla) ---------- */
function articulaciones() {
  const J = {};
  for (const d of DEDOS) {
    const dir = [Math.sin(d.abre), 0, -Math.cos(d.abre)];
    const j0 = d.mcp, j1 = sumar(j0, dir, d.L[0]), j2 = sumar(j1, dir, d.L[1]), j3 = sumar(j2, dir, d.L[2]);
    J[d.n] = { pts: [j0, j1, j2, j3], dir, eje: unitario([-Math.cos(d.abre), 0, -Math.sin(d.abre)]) };   // eje de flexión: la punta va hacia la palma
  }
  const p0 = PULGAR.cmc, p1 = sumar(p0, PULGAR.dirs[0], PULGAR.L[0]), p2 = sumar(p1, PULGAR.dirs[1], PULGAR.L[1]), p3 = sumar(p2, PULGAR.dirs[2], PULGAR.L[2]);
  J.pulgar = { pts: [p0, p1, p2, p3], dirs: PULGAR.dirs };
  return J;
}

function forma(J) {
  const F = new Forma();
  // muñeca, manga de la chaqueta y palma (con las eminencias del pulgar y del meñique)
  F.elip([0, 0.002, 0.004], [0.028, 0.019, 0.022], 'palma', 0.015)
   .cono([0, 0.003, 0.014], [0, 0.005, 0.09], 0.0355, 0.039, 'palma', 0.006)
   .elip([-0.001, 0, -0.047], [0.040, 0.015, 0.050], 'palma', 0.016)
   .elip([0.024, -0.009, -0.03], [0.018, 0.013, 0.025], 'palma', 0.012)
   .elip([-0.028, -0.006, -0.045], [0.013, 0.012, 0.033], 'palma', 0.012);
  for (const d of DEDOS) {
    const [j0, j1, j2, j3] = J[d.n].pts;
    F.cono([d.mcp[0] * 0.6, 0.004, -0.02], sumar(j0, [0, 0.003, 0.006], 1), 0.0085, 0.0095, 'palma', 0.012)   // el metacarpiano bajo el dorso
     .elip(sumar(j0, [0, 0.004, 0.004], 1), [d.r[0] * 1.06, d.r[0] * 0.98, d.r[0] * 1.12], 'palma', 0.006)    // el nudillo
     .cono(j0, j1, d.r[0], d.r[1], d.n + '1', 0.003).cono(j1, j2, d.r[1], d.r[2], d.n + '2', 0.003).cono(j2, j3, d.r[2], d.r[3], d.n + '3', 0.003);
  }
  const [p0, p1, p2, p3] = J.pulgar.pts, r = PULGAR.r;
  F.cono(p0, p1, r[0], r[1], 'pulgar1', 0.012).cono(p1, p2, r[2], r[3], 'pulgar2', 0.004).cono(p2, p3, r[3], r[4], 'pulgar3', 0.003);
  return F;
}

/* ---------- Pesos de la piel: cada dedo sólo con sus falanges (y la primera con la palma, en el nudillo) ---------- */
const cadena = h => h === 'palma' ? 'palma' : h.replace(/\d$/, '');
function pesosDe(F, x, y, z) {
  const ds = F.prims.map(p => [p.hueso, p.d(x, y, z, p)]);
  let mejor = ds[0]; for (const q of ds) if (q[1] < mejor[1]) mejor = q;
  const c = cadena(mejor[0]), acum = new Map();
  for (const [h, d] of ds) {
    if (d - mejor[1] > 0.012) continue;
    const ok = cadena(h) === c || (c === 'palma' && /1$/.test(h)) || (h === 'palma' && /1$/.test(mejor[0]));
    if (!ok) continue;
    acum.set(h, (acum.get(h) || 0) + Math.exp(-(d - mejor[1]) / 0.0035));
  }
  return [...acum.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
}

/* ---------- La malla (una sola vez: la derecha es su espejo) ---------- */
let base = null;
function armarBase() {
  if (base) return base;
  // La manga se corta a 6 cm de la muñeca, adentro de la grilla: malla() (vr/forma3d.js) no cierra lo que toca el borde
  // de la grilla, y ahí armaba triángulos con celdas de otra capa (láminas que iban de la manga a los dedos)
  const J = articulaciones(), F = forma(J), sdf = (x, y, z) => Math.max(F.distancia(x, y, z), z - CORTE);
  const m = malla(sdf, [-0.062, -0.05, -0.2], [0.078, 0.05, CORTE + 0.01], 0.0024), n = m.pos.length / 3, nor = normales(sdf, m.pos, 0.0015);
  const NOMBRES = ['palma', ...DEDOS.flatMap(d => [d.n + '1', d.n + '2', d.n + '3']), 'pulgar1', 'pulgar2', 'pulgar3'], IDX = Object.fromEntries(NOMBRES.map((h, i) => [h, i]));
  // Piel y colores (en reposo): cuero en la palma y en las yemas, almohadilla en los nudillos, abrojo, manga y su puño
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), color = new Float32Array(n * 3), c = new THREE.Color();
  for (let v = 0; v < n; v++) {
    const x = m.pos[v * 3], y = m.pos[v * 3 + 1], z = m.pos[v * 3 + 2], ny = nor[v * 3 + 1];
    const ps = pesosDe(F, x, y, z), suma = ps.reduce((s, q) => s + q[1], 0) || 1;
    ps.forEach(([h, w], k) => { si[v * 4 + k] = IDX[h]; sw[v * 4 + k] = w / suma; });
    const hueso = ps[0][0];
    if (z > CORTE - 0.004 && nor[v * 3 + 2] > 0.6) c.copy(COL.adentro);
    else if (z > 0.024) c.copy(COL.manga);
    else if (z > 0.013) c.copy(COL.puno);
    else if (z > -0.006 && hueso === 'palma') c.copy(COL.abrojo);
    else if (/3$/.test(hueso) || ny < -0.35 || (hueso === 'palma' && y < -0.006)) c.copy(COL.cuero);
    else c.copy(COL.guante);
    if (hueso === 'palma' && ny > 0.4 && DEDOS.some(d => Math.hypot(x - d.mcp[0], z - d.mcp[2]) < 0.013)) c.copy(COL.nudillo);
    const tela = 0.9 + 0.2 * fbm(x * 260, y * 260, z * 260), sombra = limitar(0.55 + 0.45 * sdf(x + nor[v * 3] * 0.01, y + ny * 0.01, z + nor[v * 3 + 2] * 0.01) / 0.01, 0.5, 1);
    const k = ALBEDO * tela * sombra; color[v * 3] = c.r * k; color[v * 3 + 1] = c.g * k; color[v * 3 + 2] = c.b * k;
  }
  base = { J, NOMBRES, pos: Float32Array.from(m.pos), nor, idx: m.idx, si, sw, color };
  return base;
}

/* ---------- Dónde va la mano ----------
 * «control»: en el grip de WebXR, el marco de la mano girado (en la izquierda, +x de la mano → −z, +y → −x, +z → +y; la
 *   derecha es el espejo) y, además, 45° sobre x: en el Touch el mango cruza la palma en diagonal y el antebrazo va hacia
 *   atrás por el rayo del control (entre +y y +z del grip), no por +y. Así el pulgar queda arriba, el antebrazo atrás y
 *   el dorso afuera. Es también como empuña la culata o la empuñadura de un arma de fuego (a unos 17° de la vertical).
 * «mango»: sin esos 45°, el puño cierra sobre el eje del mango del control (−z del grip): así agarra las hojas, los
 *   mangos y la granada, que se llevan a lo largo del mango.
 * En los dos, el centro del puño en el origen. */
const BASES = { izquierda: new THREE.Matrix4().makeBasis(v3(0, 0, -1), v3(-1, 0, 0), v3(0, 1, 0)), derecha: new THREE.Matrix4().makeBasis(v3(0, 0, 1), v3(1, 0, 0), v3(0, 1, 0)) };
const GIRO_CONTROL = new THREE.Matrix4().makeRotationX(Math.PI / 4);
// El índice sobre el gatillo de un arma de fuego (rad), si no se sabe dónde está el disparador: apoyado y apretando
const INDICE_APOYADO = [0.32, 0.85, 0.35], INDICE_APRETANDO = [0.45, 1.1, 0.5];

/* ---------- La mano en la empuñadura de un arma de fuego ----------
 * El control pone el centro del puño en la empuñadura del arma (vr/armas-vr.js), pero esa empuñadura se eligió para el
 * control, no para una mano: en algunas armas largas el puño quedaba debajo de la culata. Así que, una vez por arma, la
 * mano busca dónde agarrarla, corriéndose (hasta 5 cm) e inclinándose (la muñeca: de 50° hacia adelante a 20° hacia
 * atrás) desde donde la pone el control:
 *   - que el mango quede adentro del puño: el meñique, el anular y el medio alrededor de él, y centrado (el dibujo del
 *     arma visto de costado: dentro(x, y, z));
 *   - que la yema del índice —el 65 % de la última falange, como en el 2D (js/jugador-dibujo.js, ajusteGatillo)— quede
 *     en el disparador de esa arma (DEDO_GATILLO, js/armas-modelos-3.js), con la curvatura del índice y cuánto se separa
 *     del medio;
 *   - moviéndose e inclinándose lo menos posible.
 * Primero de a 1 cm y 10°, después fino (2,5 mm y 2,5°) alrededor de lo mejor. Apretar dobla el índice un poco más. */
const CURVA_INDICE = [1, 1.33, 0.62], APRIETA = 0.14;   // cuánto se dobla cada falange por unidad de curvatura
// Lo que tiene que quedar adentro del arma (marco de la mano izquierda, m): el eje del puño a la altura del meñique, el
// anular y el medio, y 1,1 cm adelante y atrás de él; con su peso
const DENTRO_PUNO = [-0.022, -0.012, -0.002, 0.008].flatMap(s => [[MANGO[0] + s, MANGO[1], MANGO[2], 3], [MANGO[0] + s, MANGO[1], MANGO[2] - 0.011, 1], [MANGO[0] + s, MANGO[1], MANGO[2] + 0.011, 1]]);
// Las poses del índice (una sola vez): curvatura de 0 a 1,2 y giro de 20° hacia el pulgar a 7° hacia el medio (más, se le
// montaría encima); dónde queda la yema (marco de la mano izquierda) y cuánto cuesta la pose: el índice estirado del todo
// o hecho un gancho no se ve como un dedo en el gatillo (por 1 cm se prefiere doblarlo 0,4 menos)
const poses = {};
function posesIndice(J, grueso = false) {
  const clave = grueso ? 'grueso' : 'fino', paso = grueso ? 2 : 1;
  if (poses[clave]) return poses[clave];
  const d = J.indice, [j0, j1, j2, j3] = d.pts.map(p => v3(...p)), eje = v3(...d.eje), normal = v3(0, 1, 0);
  const l1 = j1.clone().sub(j0), l2 = j2.clone().sub(j1), l3 = j3.clone().sub(j2).multiplyScalar(0.65);
  const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), q3 = new THREE.Quaternion(), qg = new THREE.Quaternion(), p = v3(), t = v3();
  const c = [], g = [], yema = [], costo = [];
  for (let ci = 0; ci <= 60; ci += paso) for (let gi = -14; gi <= 5; gi += paso) {
    const cc = ci * 0.02, gg = gi * 0.025;
    q1.setFromAxisAngle(eje, cc * CURVA_INDICE[0]).premultiply(qg.setFromAxisAngle(normal, gg));
    q2.copy(q1).multiply(qg.setFromAxisAngle(eje, cc * CURVA_INDICE[1])); q3.copy(q2).multiply(qg.setFromAxisAngle(eje, cc * CURVA_INDICE[2]));
    p.copy(j0).add(t.copy(l1).applyQuaternion(q1)).add(t.copy(l2).applyQuaternion(q2)).add(t.copy(l3).applyQuaternion(q3));
    c.push(cc); g.push(gg); yema.push(p.x, p.y, p.z); costo.push(0.00002 * gg * gg + 0.0006 * (cc - 0.45) * (cc - 0.45));
  }
  return (poses[clave] = { c, g, yema: Float32Array.from(yema), costo: Float32Array.from(costo) });
}
// H0: de la mano (su malla) al padre, como la pone el control; T: el disparador (en el padre) o null; dentro(x, y, z): si
// un punto del padre cae dentro del arma; sx: −1 en la derecha. Devuelve { th, ty, tz, k }: la inclinación sobre x del
// padre (el costado del arma), la corrida (y, z del padre) y la pose del índice
function buscarAgarre(J, H0, T, dentro, sx) {
  let P = posesIndice(J, true), n = P.c.length;
  const Q = new Float32Array(posesIndice(J).c.length * 3), m = new THREE.Matrix4(), v = v3();
  let mejor = null;
  const conAngulo = th => {   // las yemas y los puntos del puño, con la mano inclinada th
    m.makeRotationX(th).multiply(H0);
    for (let k = 0; k < n; k++) { v.set(P.yema[k * 3] * sx, P.yema[k * 3 + 1], P.yema[k * 3 + 2]).applyMatrix4(m); Q[k * 3] = v.x; Q[k * 3 + 1] = v.y; Q[k * 3 + 2] = v.z; }
    return DENTRO_PUNO.map(([x, y, z, w]) => { v.set(x * sx, y, z).applyMatrix4(m); return [v.x, v.y, v.z, w]; });
  };
  const probar = (th, puno, ty, tz) => {
    if (Math.abs(ty) > 0.05 || Math.abs(tz) > 0.05) return;
    let costo = (ty * ty + tz * tz) / 0.0016 + (th / 0.6) * (th / 0.6);   // 4 cm o 34°: lo que cuesta 1 cm de yema lejos del disparador
    for (const [x, y, z, w] of puno) if (!dentro(x, y + ty, z + tz)) costo += w;
    let k = -1;
    if (T) {
      let r = Infinity; const tx = T.x, ry = T.y - ty, rz = T.z - tz;
      for (let i = 0; i < n; i++) { const dx = Q[i * 3] - tx, dy = Q[i * 3 + 1] - ry, dz = Q[i * 3 + 2] - rz, d = dx * dx + dy * dy + dz * dz + P.costo[i]; if (d < r) { r = d; k = i; } }
      costo += r / 1e-4;
    }
    if (!mejor || costo < mejor.costo) mejor = { costo, th, ty, tz, k };
  };
  for (let a = -5; a <= 2; a++) { const th = a * Math.PI / 18, puno = conAngulo(th); for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) probar(th, puno, i * 0.01, j * 0.01); }
  const g = { ...mejor };
  for (let a = -4; a <= 4; a++) { const th = g.th + a * Math.PI / 72, puno = conAngulo(th); for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) probar(th, puno, g.ty + i * 0.0025, g.tz + j * 0.0025); }
  // la pose del índice, con todas las poses, para la mano donde quedó (k es de la tabla fina)
  P = posesIndice(J); n = P.c.length; const f = mejor; mejor = null; probar(f.th, conAngulo(f.th), f.ty, f.tz);
  return mejor;
}

/* ---------- Una mano ---------- */
export function crearMano(lado = 'izquierda') {
  const B = armarBase(), J = B.J, der = lado === 'derecha', sx = der ? -1 : 1;
  // la derecha: x al revés (posiciones y normales) y los triángulos dados vuelta
  const pos = Float32Array.from(B.pos), nor = Float32Array.from(B.nor), idx = B.idx.slice();
  if (der) {
    for (let i = 0; i < pos.length; i += 3) { pos[i] = -pos[i]; nor[i] = -nor[i]; }
    for (let t = 0; t < idx.length; t += 3) { const a = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = a; }
  }
  // Huesos: la palma en la muñeca; cada falange en su articulación
  const huesos = {}, poner = (h, p, padre, pp) => { const b = new THREE.Bone(); b.name = h; b.position.set((p[0] - pp[0]) * sx, p[1] - pp[1], p[2] - pp[2]); if (padre) padre.add(b); huesos[h] = b; };
  poner('palma', [0, 0, 0], null, [0, 0, 0]);
  for (const d of DEDOS) { const [j0, j1, j2] = J[d.n].pts; poner(d.n + '1', j0, huesos.palma, [0, 0, 0]); poner(d.n + '2', j1, huesos[d.n + '1'], j0); poner(d.n + '3', j2, huesos[d.n + '2'], j1); }
  { const [p0, p1, p2] = J.pulgar.pts; poner('pulgar1', p0, huesos.palma, [0, 0, 0]); poner('pulgar2', p1, huesos.pulgar1, p0); poner('pulgar3', p2, huesos.pulgar2, p1); }
  const malla3d = new THREE.SkinnedMesh(geometria({ pos, nor, idx, si: B.si, sw: B.sw, color: B.color }),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, envMapIntensity: 0.22 }));   // tela y cuero: casi nada de reflejo (con más, el reflejo del galpón la aclaraba hasta el crema)
  malla3d.frustumCulled = false; malla3d.add(huesos.palma); malla3d.updateMatrixWorld(true);
  malla3d.bind(new THREE.Skeleton(B.NOMBRES.map(h => huesos[h])));
  const grupo = new THREE.Group(); grupo.add(malla3d);
  const centro = v3(MANGO[0] * sx, MANGO[1], MANGO[2]), lugares = {};
  for (const [modo, giro] of [['control', GIRO_CONTROL], ['mango', new THREE.Matrix4()]]) {
    const R = giro.clone().multiply(BASES[lado]);
    lugares[modo] = { q: new THREE.Quaternion().setFromRotationMatrix(R), p: centro.clone().applyMatrix4(R).negate() };
  }
  // El reloj (la vida o los puntos), sólo en la izquierda: sobre la manga, del lado del pulgar, que es el de arriba con el
  // control en la mano, inclinado 35° hacia los ojos; se lee de un vistazo, de izquierda a derecha a lo ancho del antebrazo
  let reloj = null;
  if (!der) {
    reloj = new THREE.Group(); reloj.position.set(0.043, 0.003, 0.036);
    const cara = v3(Math.cos(0.61), 0, Math.sin(0.61)), derecha = v3(0, -1, 0);
    reloj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(derecha, cara.clone().cross(derecha), cara)); huesos.palma.add(reloj);
  }

  // Poses: los dedos se doblan sobre su eje (cada falange respecto de la anterior); el pulgar va de tramo en tramo. Se
  // calculan como en la izquierda; en la derecha cada giro va en espejo (x, −y, −z, w)
  const actual = { agarre: 0, gatillo: 0, pulgar: 0, enGatillo: 0 }, qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
  const ejeDe = {}; for (const d of DEDOS) ejeDe[d.n] = v3(...J[d.n].eje);
  const restoPulgar = J.pulgar.dirs.map(d => v3(...d)), cerradoPulgar = PULGAR_CERRADO.map(d => v3(...d));
  const fijar = (h, q) => { if (der) huesos[h].quaternion.set(q.x, -q.y, -q.z, q.w); else huesos[h].quaternion.copy(q); };
  let indiceArma = null;   // { c, g }: la curvatura y el giro del índice en el disparador del arma que agarra
  const normal = v3(0, 1, 0);
  function aplicar() {
    for (const d of DEDOS) {
      const indice = d.n === 'indice', t = indice ? actual.gatillo : actual.agarre;
      for (let k = 0; k < 3; k++) {
        let ang;
        if (!indice) ang = ABIERTA[k] + (CERRADA[k] - ABIERTA[k]) * t;
        else {   // el índice libre (suelto ↔ cerrado) o sobre el gatillo de un arma (apoyado ↔ apretando)
          const libre = INDICE_SUELTO[k] + (INDICE_GATILLO[k] - INDICE_SUELTO[k]) * t;
          const arma = indiceArma ? (indiceArma.c + APRIETA * t) * CURVA_INDICE[k] : INDICE_APOYADO[k] + (INDICE_APRETANDO[k] - INDICE_APOYADO[k]) * t;
          ang = libre + (arma - libre) * actual.enGatillo;
        }
        qa.setFromAxisAngle(ejeDe[d.n], ang);
        if (indice && k === 0 && indiceArma) qa.premultiply(qb.setFromAxisAngle(normal, indiceArma.g * actual.enGatillo));
        fijar(d.n + (k + 1), qa);
      }
    }
    let previo = new THREE.Quaternion();
    for (let k = 0; k < 3; k++) {
      const destino = restoPulgar[k].clone().lerp(cerradoPulgar[k], actual.pulgar).normalize();
      qa.setFromUnitVectors(restoPulgar[k], destino);
      fijar('pulgar' + (k + 1), qb.copy(previo).invert().multiply(qa));
      previo = qa.clone();
    }
  }
  aplicar();
  const relativo = new THREE.Quaternion(), ajuste = { q: new THREE.Quaternion(), t: v3() }, ultimo = { modo: 'control', rel: new THREE.Quaternion() }, recuerdos = new WeakMap();
  const mano = {
    lado, grupo, reloj, huesos,
    // modo: 'control' o 'mango'; rel: el giro del grip respecto del padre (cuando la mano va con el arma: el rayo del
    // control → su grip). Pone el grupo en su lugar, con el ajuste a la empuñadura del arma, si lo hay
    colocar(modo = 'control', rel = null) {
      const L = lugares[modo]; relativo.copy(rel || qb.identity()); ultimo.modo = modo; ultimo.rel.copy(relativo);
      grupo.quaternion.copy(relativo).multiply(L.q).premultiply(ajuste.q);
      grupo.position.copy(L.p).applyQuaternion(relativo).applyQuaternion(ajuste.q).add(ajuste.t);
    },
    // Agarra el arma de fuego en la que está (llamar después de colocar): gatillo, su disparador en el marco del padre (o
    // null); dentro(x, y, z), si un punto del padre cae dentro del arma. Sin nada, vuelve a como la pone el control.
    // Devuelve lo que eligió: inclinación (rad), corrida (m), pose del índice y a qué distancia quedó la yema (m)
    agarrar(gatillo = null, dentro = null) {
      ajuste.q.identity(); ajuste.t.set(0, 0, 0); indiceArma = null;
      mano.colocar(ultimo.modo, ultimo.rel);
      if (!dentro) { aplicar(); return null; }
      // se busca una vez por arma (y por control: si cambia el giro del grip respecto del rayo, otra vez)
      grupo.updateMatrix(); const e = grupo.matrix.elements;
      let rec = recuerdos.get(grupo.parent);
      if (!rec || rec.e.some((v, i) => Math.abs(v - e[i]) > 1e-4)) recuerdos.set(grupo.parent, rec = { e: e.slice(), r: buscarAgarre(J, grupo.matrix.clone(), gatillo, dentro, sx) });
      const r = rec.r, P = posesIndice(J);
      ajuste.q.setFromAxisAngle(v3(1, 0, 0), r.th); ajuste.t.set(0, r.ty, r.tz);
      mano.colocar(ultimo.modo, ultimo.rel);
      if (r.k >= 0) indiceArma = { c: P.c[r.k], g: P.g[r.k] };
      aplicar();
      let yema = null;
      if (gatillo && r.k >= 0) { grupo.updateMatrix(); yema = v3(P.yema[r.k * 3] * sx, P.yema[r.k * 3 + 1], P.yema[r.k * 3 + 2]).applyMatrix4(grupo.matrix).distanceTo(gatillo); }
      return { inclinacion: r.th, corrida: ajuste.t.clone(), indice: indiceArma, yema, costo: r.costo };
    },
    // objetivo: { agarre, gatillo, pulgar, enGatillo } de 0 a 1; dt: lo que pasó (s). Los dedos van hacia el objetivo en ~60 ms
    posar(objetivo, dt = 1) {
      const k = 1 - Math.exp(-dt / 0.06);
      for (const clave of ['agarre', 'gatillo', 'pulgar', 'enGatillo']) actual[clave] += ((objetivo[clave] ?? 0) - actual[clave]) * k;
      aplicar();
    },
    get estado() { return { ...actual }; },
  };
  mano.colocar('control');
  return mano;
}
