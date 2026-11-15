/* ===== Zona Muerta VR: la mano izquierda del jugador =====
 * En lugar del modelo del control, la mano del sobreviviente del juego (js/skins.js): guante arena con la palma y las
 * yemas de cuero, el abrojo de la muñeca, las almohadillas de los nudillos y la manga oliva de la chaqueta. Se arma como
 * los cuerpos de los zombies (vr/forma3d.js): primitivas anatómicas unidas en una sola superficie, con 16 huesos (la
 * palma, tres falanges por dedo y el pulgar) para que los dedos se doblen.
 *   - Marco de la mano (en el que se modela): la muñeca en el origen, los dedos hacia −z, la palma hacia −y y el pulgar
 *     hacia +x (es la izquierda).
 *   - En el control va en el «grip» de WebXR: el origen en el centro de los dedos cerrados sobre el mango, −z hacia el
 *     pulgar y el dorso de la izquierda hacia −x; el antebrazo, hacia atrás por el rayo del control. Con el puño cerrado,
 *     los dedos abrazan el mango del control (3,4 cm), que no se ve.
 *   - posar({ agarre, gatillo, pulgar }): el agarre cierra medio, anular y meñique; el gatillo, el índice; el pulgar baja
 *     cuando toca los botones. Lo que se sostiene (cargador, guardamanos, cerrojo) cierra la mano entera. */
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

/* ---------- La mano ---------- */
export function crearManoIzquierda() {
  // La manga se corta a 6 cm de la muñeca, adentro de la grilla: malla() (vr/forma3d.js) no cierra lo que toca el borde
  // de la grilla, y ahí armaba triángulos con celdas de otra capa (láminas que iban de la manga a los dedos)
  const J = articulaciones(), F = forma(J), sdf = (x, y, z) => Math.max(F.distancia(x, y, z), z - CORTE);
  const m = malla(sdf, [-0.062, -0.05, -0.2], [0.078, 0.05, CORTE + 0.01], 0.0024), n = m.pos.length / 3, nor = normales(sdf, m.pos, 0.0015);
  // Huesos: la palma en la muñeca; cada falange en su articulación
  const NOMBRES = ['palma', ...DEDOS.flatMap(d => [d.n + '1', d.n + '2', d.n + '3']), 'pulgar1', 'pulgar2', 'pulgar3'], IDX = Object.fromEntries(NOMBRES.map((h, i) => [h, i]));
  const huesos = {}, poner = (h, p, padre, pp) => { const b = new THREE.Bone(); b.name = h; b.position.set(p[0] - pp[0], p[1] - pp[1], p[2] - pp[2]); if (padre) padre.add(b); huesos[h] = b; };
  poner('palma', [0, 0, 0], null, [0, 0, 0]);
  for (const d of DEDOS) { const [j0, j1, j2] = J[d.n].pts; poner(d.n + '1', j0, huesos.palma, [0, 0, 0]); poner(d.n + '2', j1, huesos[d.n + '1'], j0); poner(d.n + '3', j2, huesos[d.n + '2'], j1); }
  { const [p0, p1, p2] = J.pulgar.pts; poner('pulgar1', p0, huesos.palma, [0, 0, 0]); poner('pulgar2', p1, huesos.pulgar1, p0); poner('pulgar3', p2, huesos.pulgar2, p1); }
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
  const malla3d = new THREE.SkinnedMesh(geometria({ pos: m.pos, nor, idx: m.idx, si, sw, color }),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, envMapIntensity: 0.22 }));   // tela y cuero: casi nada de reflejo (con más, el reflejo del galpón la aclaraba hasta el crema)
  malla3d.frustumCulled = false; malla3d.add(huesos.palma); malla3d.updateMatrixWorld(true);
  malla3d.bind(new THREE.Skeleton(NOMBRES.map(h => huesos[h])));
  // En el grip: el marco de la mano girado (+x de la mano → −z, +y → −x, +z → +y) y, además, 45° sobre x: en el Touch el
  // mango cruza la palma en diagonal y el antebrazo va hacia atrás por el rayo del control (entre +y y +z del grip), no
  // por +y. Así el pulgar queda arriba, el antebrazo atrás y el dorso afuera. El centro del puño, en el origen
  const grupo = new THREE.Group(), R = new THREE.Matrix4().makeRotationX(Math.PI / 4).multiply(new THREE.Matrix4().makeBasis(v3(0, 0, -1), v3(-1, 0, 0), v3(0, 1, 0)));
  grupo.quaternion.setFromRotationMatrix(R); grupo.position.copy(v3(...MANGO).applyMatrix4(R).negate()); grupo.add(malla3d);
  // El reloj (la vida o los puntos) va sobre la manga, del lado del pulgar, que es el de arriba con el control en la mano,
  // inclinado 35° hacia los ojos: se lee de un vistazo, de izquierda a derecha a lo ancho del antebrazo
  const reloj = new THREE.Group(); reloj.position.set(0.043, 0.003, 0.036);
  const cara = v3(Math.cos(0.61), 0, Math.sin(0.61)), derecha = v3(0, -1, 0);
  reloj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(derecha, cara.clone().cross(derecha), cara)); huesos.palma.add(reloj);

  // Poses: los dedos se doblan sobre su eje (cada falange respecto de la anterior); el pulgar va de tramo en tramo
  const actual = { agarre: 0, gatillo: 0, pulgar: 0 }, q = new THREE.Quaternion(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
  const ejeDe = {}; for (const d of DEDOS) ejeDe[d.n] = v3(...J[d.n].eje);
  const restoPulgar = J.pulgar.dirs.map(d => v3(...d)), cerradoPulgar = PULGAR_CERRADO.map(d => v3(...d));
  function aplicar() {
    for (const d of DEDOS) {
      const indice = d.n === 'indice', t = indice ? actual.gatillo : actual.agarre, A = indice ? INDICE_SUELTO : ABIERTA, B = indice ? INDICE_GATILLO : CERRADA;
      for (let k = 0; k < 3; k++) huesos[d.n + (k + 1)].quaternion.setFromAxisAngle(ejeDe[d.n], A[k] + (B[k] - A[k]) * t);
    }
    // pulgar: cada tramo hacia su dirección (entre suelto y cerrado); el giro local sale de restar el del tramo anterior
    let previo = new THREE.Quaternion();
    for (let k = 0; k < 3; k++) {
      const destino = restoPulgar[k].clone().lerp(cerradoPulgar[k], actual.pulgar).normalize();
      qa.setFromUnitVectors(restoPulgar[k], destino);
      huesos['pulgar' + (k + 1)].quaternion.copy(qb.copy(previo).invert().multiply(qa));
      previo = qa.clone();
    }
  }
  aplicar();
  return {
    grupo, reloj, huesos,
    // objetivo: { agarre, gatillo, pulgar } de 0 a 1; dt: lo que pasó (s). Los dedos van hacia el objetivo en ~60 ms
    posar(objetivo, dt = 1) {
      const k = 1 - Math.exp(-dt / 0.06);
      for (const clave of ['agarre', 'gatillo', 'pulgar']) actual[clave] += ((objetivo[clave] ?? 0) - actual[clave]) * k;
      aplicar();
    },
    get estado() { return { ...actual }; },
  };
}
