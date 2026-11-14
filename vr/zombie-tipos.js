/* ===== Zona Muerta VR: los tipos de zombie (humanos) =====
 * Los de siempre (variantes del caminante del juego, js/zombie.js) y los de Último bastión (js/bastion-v2.js y
 * js/bastion-v2-horda.js), con sus colores, su ropa y lo que hace cada uno:
 *   cuerpo     normal | gordo (panza) | fuerte (brazos ×1,8) | coloso (brazos ×2, piernas ×1,6) | hinchado (pústulas)
 *   camisa     abierta | remera | musculosa | uniforme | capucha (buzo) | chaleco | overol | toxico (traje roto) | null
 *   pantalon   largo (roto a media canilla) | rodilla | recto | corto (de correr) | toxico
 *   vida, vel  multiplican la vida de un común (15) y su paso (0,55 m/s); mordida multiplica el daño de una mordida
 *   blindaje   las balas chicas (pistola, metralleta, escopeta, minigun) le hacen 1/(1 + blindaje); el rifle no
 *   conducta   caza (rodea la mesa) | rompe (va derecho y trepa la mesa) | grita | revienta | demuele | gas |
 *              excava | arroja | escupe | rabia | corre
 * Los niveles de deterioro siguen la idea de Dead Island 2: el que se convirtió hace poco (corredor, rabioso) tiene la
 * ropa casi entera; el caminante, rota y sucia. */
import * as THREE from 'three';
import { v3, hash3, fbm, limitar } from './forma3d.js';

const col = hex => new THREE.Color(hex);
export const SANGRE = col('#5a0c08'), SANGRE_VIVA = col('#7a1410');

/* ---------- Los tipos ---------- */
export const TIPOS = {
  // Los de siempre (el caminante y sus variantes)
  caminante:   { nombre: 'Caminante', grupo: 'comunes', camisa: 'abierta', tela: '#3563c8', cuadros: true, pantalon: 'largo', color: '#6b4528', escala: [0.97, 1.03] },
  camisaRoja:  { nombre: 'Camisa roja', grupo: 'comunes', camisa: 'abierta', tela: '#9e2a26', cuadros: true, pantalon: 'rodilla', color: '#3e5578', pies: 'zapatillas', calzado: '#3a2c22', escala: [0.95, 1.02] },
  enfermero:   { nombre: 'Enfermero', grupo: 'comunes', camisa: 'remera', tela: '#7fb7c9', pantalon: 'recto', color: '#6ea6b8', pies: 'zapatillas', calzado: '#d6d6cc', accesorios: ['barbijo'], escala: [0.95, 1.0] },
  policia:     { nombre: 'Policía', grupo: 'comunes', camisa: 'uniforme', tela: '#2a3858', pantalon: 'recto', color: '#1e2333', pies: 'botas', calzado: '#151515', franja: '#8d97b0', cinturon: true, accesorios: ['gorra'], vida: 1.6, escala: [1.0, 1.06] },
  corredor:    { nombre: 'Corredor', grupo: 'comunes', camisa: 'musculosa', tela: '#8c2a26', pantalon: 'corto', color: '#24252a', pies: 'zapatillas', calzado: '#e8e4da', unaZapatilla: true, franja: '#e8e4da', accesorios: ['dorsal'], conducta: 'corre', vel: 4.4, vida: 0.8, escala: [0.88, 0.94] },
  // Último bastión: caminantes
  gordo:       { nombre: 'Gordo', grupo: 'bastion', cuerpo: 'gordo', camisa: 'abierta', tela: '#d8c05a', pantalon: 'rodilla', color: '#5a5a2a', conducta: 'rompe', vida: 3.2, vel: 0.67, mordida: 1.5, escala: [1.04, 1.1] },
  acorazado:   { nombre: 'Acorazado', grupo: 'bastion', camisa: 'uniforme', tela: '#232a3a', pantalon: 'recto', color: '#1b202c', piel: '#6f8a5a', pies: 'botas', calzado: '#111214', accesorios: ['casco-antimotin', 'escudo', 'hombreras'], pose: 'escudo', vida: 2, vel: 0.83, blindaje: 2, escala: [1.02, 1.08] },
  soldado:     { nombre: 'Soldado zombie', grupo: 'bastion', camisa: 'chaleco', tela: '#5d6248', chaleco: '#9a8262', portaplacas: true, pantalon: 'recto', color: '#7c7a5e', piel: '#8fa672', pies: 'botas', calzado: '#2a261e', accesorios: ['casco-soldado', 'portacargadores'], vida: 1.5, blindaje: 1, escala: [1.0, 1.06] },
  // Especiales
  griton:      { nombre: 'Gritón', grupo: 'bastion', camisa: 'capucha', tela: '#7a2d8a', pantalon: 'recto', color: '#2a2530', piel: '#9ab07a', pies: 'zapatillas', calzado: '#3a3440', accesorios: ['megafono', 'pelo-largo'], pose: 'megafono', conducta: 'grita', vida: 0.8, vel: 1.08, grito: { radio: 10, apuro: 1.3, dura: 6, cada: 5, quieto: 1.2 }, escala: [0.92, 1.0] },
  hinchado:    { nombre: 'Hinchado', grupo: 'bastion', cuerpo: 'hinchado', camisa: null, pantalon: 'rodilla', color: '#4a3f2c', piel: '#a9b44a', conducta: 'revienta', vida: 5, vel: 0.58, estalla: { radio: 2.6, dano: 45 }, escala: [1.0, 1.06] },
  dinamitero:  { nombre: 'Dinamitero', grupo: 'bastion', camisa: 'chaleco', tela: '#5a5148', chaleco: '#c9541c', bandas: true, pantalon: 'recto', color: '#3c4252', pies: 'botas', calzado: '#3a3026', calvo: true, accesorios: ['casco-obra', 'dinamita'], conducta: 'demuele', vida: 0.8, vel: 4.6, carga: { radio: 3, dano: 40 }, escala: [0.9, 0.98] },
  toxico:      { nombre: 'Tóxico', grupo: 'bastion', camisa: 'toxico', tela: '#c4a22a', pantalon: 'toxico', color: '#8f7a22', pieles: ['#9fd13a', '#8cc43a', '#b2da4c'], sangre: '#3f7a12', pies: 'botas', calzado: '#5a4a1c', accesorios: ['pustulas', 'baba'], conducta: 'gas', vida: 3, vel: 0.75, gas: { radio: 2.2, dura: 5, dano: 5 }, escala: [0.98, 1.06] },
  // Acechadores
  topo:        { nombre: 'Topo', grupo: 'bastion', camisa: 'overol', tela: '#6a5a44', overol: '#4a463e', pantalon: 'recto', color: '#4a463e', piel: '#8f9a7a', pies: 'botas', calzado: '#2c241a', accesorios: ['casco-minero'], conducta: 'excava', vida: 1.6, mordida: 1.5, escala: [0.96, 1.04] },
  lanzador:    { nombre: 'Lanzador', grupo: 'bastion', cuerpo: 'fuerte', camisa: null, pantalon: 'rodilla', color: '#5a2a26', piel: '#9c9a78', accesorios: ['vincha'], conducta: 'arroja', vida: 6, vel: 0.67, mordida: 1.5, escala: [1.0, 1.04] },
  escupidor:   { nombre: 'Escupidor', grupo: 'bastion', camisa: 'musculosa', tela: '#3a3540', pantalon: 'recto', color: '#2c2a30', piel: '#b8a64a', ralo: true, accesorios: ['buche'], conducta: 'escupe', vida: 1.2, vel: 0.83, escupe: { distancia: 9, cada: 3.2, golpe: 8, charco: { radio: 1.0, dura: 3.5, dano: 6 } }, escala: [0.96, 1.04] },
  rabioso:     { nombre: 'Rabioso', grupo: 'bastion', camisa: 'remera', tela: '#e9e5d8', franjaRemera: '#b8322a', pantalon: 'corto', color: '#d8d4c6', piel: '#a9b89a', pies: 'zapatillas', calzado: '#c8c4b8', accesorios: ['pelo-largo'], conducta: 'rabia', vida: 0.7, vel: 8.2, esquiva: 0.6, escala: [0.84, 0.9] },
  // Jefes
  coloso:      { nombre: 'El Coloso', grupo: 'jefes', cuerpo: 'coloso', camisa: null, pantalon: 'rodilla', color: '#363a5e', piel: '#4fae2e', accesorios: ['pelo-revuelto'], conducta: 'rompe', fardos: { distancia: 12, cada: 4.5, dano: 25 }, vida: 22, vel: 0.7, mordida: 3, jefe: true, escala: [1.95, 1.95] },
  escudo:      { nombre: 'El Escudo', grupo: 'jefes', cuerpo: 'fuerte', camisa: 'uniforme', tela: '#1c2230', pantalon: 'recto', color: '#161a24', piel: '#5f7a4e', pies: 'botas', calzado: '#0e0f12', accesorios: ['casco-antimotin', 'paves', 'hombreras'], pose: 'escudo', conducta: 'rompe', cubre: true, vida: 22, vel: 0.78, mordida: 2.5, blindaje: 4, jefe: true, escala: [1.85, 1.85] },
  cisterna:    { nombre: 'La Cisterna', grupo: 'jefes', cuerpo: 'hinchado', camisa: null, pantalon: 'rodilla', color: '#3d3626', piel: '#8fa23a', conducta: 'revienta', estalla: { radio: 6, dano: 90 }, vida: 18, vel: 0.55, jefe: true, escala: [2.05, 2.05] },
  sirena:      { nombre: 'La Sirena', grupo: 'jefes', camisa: 'capucha', tela: '#b02a3a', pantalon: 'recto', color: '#241c22', piel: '#a9b890', pies: 'zapatillas', calzado: '#2a2226', accesorios: ['megafono', 'pelo-largo'], pose: 'megafono', conducta: 'grita', grito: { radio: 60, apuro: 1.33, dura: 6, cada: 6, quieto: 1.6, siempre: true }, vida: 18, vel: 0.82, mordida: 2, jefe: true, escala: [1.85, 1.85] },
};
export const VARIANTES = TIPOS;   // nombre de antes

/* ---------- Cuerpos: parámetros de la forma y del esqueleto ---------- */
// brazos/piernas/torso: grosor; panza; hinchar (todo inflado); hombros (m más afuera); abrir (° de los brazos);
// caderas (x de los muslos); manos (tamaño); abdominales; pustulas (cuántas en la piel)
export const CUERPOS = {
  normal:   {},
  gordo:    { panza: 1.25, torso: 1.04, brazos: 1.2, piernas: 1.15, hombros: 0.03, abrir: 26, caderas: 0.097, cuello: 1.3 },
  fuerte:   { brazos: 1.75, piernas: 1.4, torso: 1.22, hombros: 0.05, abrir: 27, caderas: 0.12, manos: 1.3, abdominales: true, cuello: 1.35 },
  coloso:   { brazos: 2.0, piernas: 1.6, torso: 1.38, hombros: 0.075, abrir: 30, caderas: 0.135, manos: 1.45, abdominales: true, cuello: 1.6 },
  hinchado: { hinchar: 0.38, brazos: 1.25, piernas: 1.3, panza: 0.6, hombros: 0.05, abrir: 28, caderas: 0.125, pustulas: 16, manos: 1.1 },
};

/* ---------- Ropa: qué queda de cada capa ----------
 * Cada función recibe el centro de un triángulo de la capa (x, y, z), un ruido r (0..1) para los bordes rotos, si es
 * del brazo, cuánto bajó por el brazo desde el hombro (s, en m) y su distancia al brazo. */
export const CAMISAS = {
  // pz: la panza del cuerpo. La barriga empuja la tela: abierta angosta en el cuello y bien ancha sobre la panza
  abierta: (x, y, z, r, brazo, s, dBrazo, pz = 0) => {
    if (y < 0.87 + r * 0.05) return false;
    if (y > 1.462 - (z > 0 ? Math.max(0, 0.045 - Math.abs(x) * 0.45) : 0)) return false;
    if (!brazo && z > 0.015 && Math.abs(x) < 0.022 + (1.45 - y) * 0.085 + (r - 0.5) * (0.02 + pz * 0.03) + pz * 0.062 * Math.exp(-(((y - 1.02) / 0.13) ** 2))) return false;
    if (brazo && s > 0.085 + (r - 0.5) * 0.05) return false;
    return true;
  },
  remera: (x, y, z, r, brazo, s) => {
    if (y < 0.885 + (r - 0.5) * 0.014 || y > 1.466) return false;
    if (z > 0 && y > 1.372 && Math.abs(x) < (y - 1.372) * 0.75 + 0.004) return false;
    if (brazo && s > 0.125 + (r - 0.5) * 0.012) return false;
    return true;
  },
  musculosa: (x, y, z, r, brazo, s, dBrazo) => {
    const ax = Math.abs(x);
    if (brazo || dBrazo < 0.022) return false;
    if (y < 0.965 + (r - 0.5) * 0.01) return false;
    if (y > 1.25 && ax > 0.122 - Math.max(0, y - 1.37) * 0.35) return false;
    if (ax < 0.064 && y > (z > 0 ? 1.35 : 1.41) + (ax / 0.064) ** 2 * (z > 0 ? 0.105 : 0.05)) return false;
    return y <= 1.47;
  },
  uniforme: (x, y, z, r, brazo, s) => {
    if (y < 0.986) return false;
    if (y > 1.478 - (z > 0.02 ? Math.max(0, 0.034 - Math.abs(x) * 0.7) : 0)) return false;
    if (brazo && s > 0.465 + (r - 0.5) * 0.01) return false;
    if (brazo && x < 0 && s > 0.3 && s < 0.4 && r > 0.6) return false;
    if (!brazo && x > 0.02 && z < -0.02 && Math.hypot(x - 0.07, y - 1.1) < 0.035 + (r - 0.5) * 0.03) return false;
    return true;
  },
  // buzo con capucha: manga larga, puños, cuello cerrado (la capucha es aparte)
  capucha: (x, y, z, r, brazo, s) => {
    if (y < 0.9 + (r - 0.5) * 0.01) return false;
    if (y > 1.49 - (z > 0.03 ? Math.max(0, 0.05 - Math.abs(x) * 0.8) : 0)) return false;
    if (brazo && s > 0.49) return false;
    if (brazo && x > 0 && s > 0.22 && s < 0.31 && r > 0.62) return false;   // codo roto
    return true;
  },
  // camisa de trabajo bajo el chaleco: manga corta
  chaleco: (x, y, z, r, brazo, s) => {
    if (y < 0.93 + (r - 0.5) * 0.02 || y > 1.47) return false;
    if (z > 0.02 && y > 1.39 && Math.abs(x) < (y - 1.39) * 0.6 + 0.01) return false;
    if (brazo && s > 0.13 + (r - 0.5) * 0.03) return false;
    return true;
  },
  // camisa de manga larga arremangada bajo el overol
  overol: (x, y, z, r, brazo, s) => {
    if (y < 0.93 || y > 1.47) return false;
    if (z > 0.02 && y > 1.4 && Math.abs(x) < (y - 1.4) * 0.7 + 0.01) return false;
    if (brazo && s > 0.3 + (r - 0.5) * 0.03) return false;
    return true;
  },
  // traje de la cloaca hecho jirones: manga larga con agujeros grandes
  toxico: (x, y, z, r, brazo, s) => {
    if (y < 0.93 || y > 1.47 - (z > 0.02 ? Math.max(0, 0.04 - Math.abs(x) * 0.6) : 0)) return false;
    if (brazo && s > 0.38 + (r - 0.5) * 0.12) return false;
    if (fbm(x * 9 + 4, y * 9, z * 9) > 0.62) return false;   // jirones
    return true;
  },
};
export const PANTALONES = {
  largo: (x, y, z, r) => {
    if (y > 1.0 + (r - 0.5) * 0.012) return false;
    if (y < (x > 0 ? 0.36 : 0.27) + r * 0.07) return false;
    if (x < 0 && z > 0.02 && Math.hypot(x + 0.1, (y - 0.53) * 0.8) < 0.045 + (r - 0.5) * 0.03) return false;
    return true;
  },
  rodilla: (x, y, z, r) => !(y > 1.0 + (r - 0.5) * 0.012 || y < 0.47 + r * 0.05),
  recto: (x, y, z, r) => {
    if (y > 1.0 || y < 0.13 + r * 0.018) return false;
    if (x > 0 && z > 0.02 && Math.hypot(x - 0.1, (y - 0.3) * 0.7) < 0.026 + (r - 0.5) * 0.02) return false;
    return true;
  },
  corto: (x, y, z, r) => !(y > 1.0 || y < 0.7 + (Math.abs(x) > 0.13 ? 0.035 : 0) + (r - 0.5) * 0.006),
  toxico: (x, y, z, r) => {
    if (y > 1.0 || y < 0.2 + r * 0.12) return false;
    return fbm(x * 9 + 1, y * 9 + 5, z * 9) < 0.64;
  },
};
// Segunda capa (sobre la camisa): chaleco naranja con bandas o portaplacas; peto y tiradores del overol
export const SOBRECAPAS = {
  chaleco: (x, y, z, r, brazo, s, dBrazo, V) => {
    if (brazo || dBrazo < 0.03) return false;
    if (y < 0.95 || y > 1.45) return false;
    if (y > 1.25 && Math.abs(x) > 0.125 - Math.max(0, y - 1.36) * 0.3) return false;   // sisas
    if (!V.portaplacas && z > 0.03 && Math.abs(x) < 0.03 + (1.45 - y) * 0.03) return false;   // abierto adelante
    if (Math.abs(x) < 0.07 && y > (z > 0 ? 1.38 : 1.42)) return false;
    return true;
  },
  overol: (x, y, z, r, brazo, s, dBrazo) => {
    if (brazo || y < 0.95 || y > 1.46) return false;
    const ax = Math.abs(x);
    if (z > 0 && y < 1.27) return ax < 0.11;                                  // peto
    return Math.abs(ax - 0.075) < 0.022 && y > 1.15;                          // tiradores
  },
};

// Cuánto bajó un punto por el brazo desde la articulación del hombro (m): por el húmero y después por el antebrazo
export function medirBrazo(A, x, y, z) {
  const ax = Math.abs(x), tramo = (P, Q, tmin) => {
    const bx = Q[0] - P[0], by = Q[1] - P[1], bz = Q[2] - P[2], L2 = bx * bx + by * by + bz * bz;
    const t = Math.max(tmin, Math.min(1, ((ax - P[0]) * bx + (y - P[1]) * by + (z - P[2]) * bz) / L2));
    return [t, Math.sqrt(L2), Math.hypot(ax - P[0] - bx * t, y - P[1] - by * t, z - P[2] - bz * t)];
  };
  const [t1, L1, d1] = tramo(A.brazoI, A.anteI, -0.4), [t2, L2, d2] = tramo(A.anteI, A.manoI, 0);
  return d1 <= d2 ? t1 * L1 : L1 + t2 * L2;
}
export const enBarbijo = (x, y, z) => z > 0.026 && Math.abs(x) < 0.066 && y < 1.637 - Math.abs(x) * 0.12 && y > 1.553 + Math.abs(x) * 0.3;

/* ---------- Colores de la tela de cerca: base, mugre, sangre y detalles de cada prenda ---------- */
export function pintarTela(P, prenda, V, A) {
  const out = new Float32Array(P.n * 3), c = new THREE.Color();
  const cuadros = prenda === 'camisa' && V.cuadros;
  const hex = prenda === 'camisa' ? V.tela : prenda === 'sobre' ? (V.chaleco || V.overol) : V.color;
  const base = col(cuadros ? '#ffffff' : hex);
  const sucio = cuadros ? col('#9a9080') : base.clone().multiplyScalar(0.58).lerp(col('#3e2817'), 0.35);
  const forma = prenda === 'camisa' ? V.camisa : prenda === 'sobre' ? V.camisa : V.pantalon;
  const sangre = V.sangre ? col(V.sangre) : SANGRE, viva = V.sangre ? col(V.sangre).multiplyScalar(1.4) : SANGRE_VIVA;
  // los recién convertidos tienen la ropa más limpia
  const deterioro = ['corredor', 'rabioso'].includes(V.id) ? 0.45 : 1;
  for (let v = 0; v < P.n; v++) {
    const x = P.pos[v * 3], y = P.pos[v * 3 + 1], z = P.pos[v * 3 + 2], r = P.r[v], ax = Math.abs(x);
    c.copy(base).lerp(sucio, limitar((r - 0.5) * 2.2, 0, 0.75) * deterioro);
    if (prenda === 'camisa') {
      if (forma === 'abierta' && Math.hypot(x - 0.06, y - 1.22, (z - 0.08) * 0.6) < 0.07 + r * 0.03) c.lerp(sangre, 0.7);
      if (forma === 'remera') {
        if (z > 0 && y > 1.36 && Math.abs(ax - ((y - 1.372) * 0.75 + 0.004)) < 0.011) c.multiplyScalar(0.72);
        if (V.franjaRemera && Math.abs(y - 1.18 + x * 0.35) < 0.025) c.set(V.franjaRemera);                       // franja del rabioso
        if (Math.hypot(x + 0.03, (y - 1.3) * 0.8, z > 0 ? 0 : 1) < 0.06 + r * 0.04) c.lerp(viva, 0.75 * deterioro);
        if (V.id === 'enfermero' && z > 0 && Math.abs(x - 0.02 + (y - 1.1) * 0.1) < 0.012 + r * 0.01 && y < 1.24 && y > 0.95) c.lerp(viva, 0.5);
      }
      if (forma === 'musculosa') {
        const borde = Math.min(Math.abs(ax - (0.122 - Math.max(0, y - 1.37) * 0.35)) + (y < 1.25 ? 1 : 0), ax < 0.07 ? Math.abs(y - ((z > 0 ? 1.35 : 1.41) + (Math.min(ax, 0.064) / 0.064) ** 2 * (z > 0 ? 0.105 : 0.05))) : 1);
        if (V.franja && borde < 0.011) c.copy(col(V.franja)).multiplyScalar(0.85);
        if (Math.hypot(x - 0.05, y - 1.36) < 0.035 + r * 0.03 && z > 0) c.lerp(sangre, 0.6);
      }
      if (forma === 'uniforme') {
        if (z > 0.04 && ax < 0.011 && y > 1.0) c.multiplyScalar(0.8);
        if (z > 0.04 && ax < 0.008 && y > 1.0 && Math.abs(((y - 1.02) % 0.075) - 0.0375) < 0.006) c.set('#c8c4b4');
        if (V.id === 'policia' && z > 0.04 && Math.hypot(x - 0.075, y - 1.34) < 0.019) c.set(Math.hypot(x - 0.075, y - 1.34) < 0.008 ? '#9a7a20' : '#d8b23a');
        if (V.id === 'policia' && z > 0.04 && Math.abs(x + 0.075) < 0.03 && Math.abs(y - 1.345) < 0.007) c.set('#c8ccd0');
        if (z > 0.04 && Math.abs(ax - 0.075) < 0.046 && y < 1.32 && y > 1.24 && (Math.abs(ax - 0.075) > 0.036 || y > 1.305)) c.multiplyScalar(0.7);
        const s = medirBrazo(A, x, y, z); if (V.id === 'policia' && ax > 0.17 && s > 0.035 && s < 0.1 && ax - (A.brazoI[0] + 0.343 * s) > 0.015) c.set('#c9a94a');
        if (Math.hypot(x + 0.06, (y - 1.42) * 1.5) < 0.05 + r * 0.03 && z > 0) c.lerp(sangre, 0.6);
      }
      if (forma === 'capucha') {
        if (z > 0.05 && ax < 0.09 && y > 0.98 && y < 1.1) c.multiplyScalar(Math.abs(y - 1.1) < 0.008 || Math.abs(ax - 0.09) < 0.008 ? 0.6 : 0.88);   // bolsillo canguro
        if (z > 0.06 && Math.abs(ax - 0.022) < 0.004 && y > 1.36 && y < 1.47) c.set('#d8d8d0');                                                   // cordones
        if (y < 0.94 || (medirBrazo(A, x, y, z) > 0.45 && Math.abs(x) > 0.2)) c.multiplyScalar(0.8);                                               // puños y cintura
      }
      if (forma === 'chaleco' || forma === 'overol') if (Math.hypot(x + 0.04, y - 1.25) < 0.05 + r * 0.03 && z > 0) c.lerp(sangre, 0.5);
      if (forma === 'toxico') { if (fbm(x * 14, y * 14, z * 14) > 0.56) c.lerp(col('#7a8a2a'), 0.5); if (Math.hypot(x - 0.03, y - 1.3) < 0.06 && z > 0) c.lerp(sangre, 0.6); }
    } else if (prenda === 'sobre') {
      if (V.bandas && (Math.abs(y - 1.18) < 0.014 || Math.abs(y - 1.06) < 0.014)) c.set('#e8eadc');                        // bandas reflectivas
      if (V.portaplacas && ((Math.abs(y - 1.02) < 0.012) || (Math.abs(y - 1.1) < 0.012))) c.multiplyScalar(0.7);          // cintas
      if (V.overol && z > 0 && Math.abs(x) < 0.05 && Math.abs(y - 1.2) < 0.03) c.multiplyScalar(0.85);                     // bolsillo del peto
      if (V.overol && Math.abs(Math.abs(x) - 0.075) < 0.012 && Math.abs(y - 1.26) < 0.012 && z > 0) c.set('#c9b36a');         // botones
    } else {
      if (forma === 'largo' && y < 0.45) c.multiplyScalar(0.78);
      if (forma === 'rodilla' && y < 0.6) c.multiplyScalar(0.84);
      if (V.franja && V.pantalon !== 'rodilla' && ax > 0.115 && Math.abs(z - (y > 0.5 ? 0.0 : -0.005)) < 0.009) c.set(V.franja).multiplyScalar(0.8);
      if (V.cinturon && y > 0.956) c.set(ax < 0.022 && z > 0.05 ? '#b8bcc0' : '#101010');
      if ((forma === 'recto' || forma === 'toxico') && y < 0.4) c.lerp(col('#4a3a28'), limitar((0.4 - y) * 2, 0, 0.45));
      if (V.cuerpo === 'hinchado' || V.cuerpo === 'coloso') c.multiplyScalar(0.8 + 0.2 * fbm(x * 30, y * 30, z * 30));   // estirado y roto
    }
    c.multiplyScalar(P.ao[v]);
    out[v * 3] = c.r; out[v * 3 + 1] = c.g; out[v * 3 + 2] = c.b;
  }
  return out;
}

/* ---------- Accesorios: piezas rígidas pegadas a un hueso (geometría en el marco de reposo del cuerpo) ----------
 * Cada uno devuelve [{ hueso, geo (con color por vértice), mat: 'mate' | 'brillo' | 'vidrio' | 'luz' | 'pelo' }] */
const pint = (g, hex) => { const c = col(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g; };
const pintMancha = (g, hex, f) => { pint(g, hex); const p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { const k = f(p.getX(i), p.getY(i), p.getZ(i)); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); } return g; };
const sucio = (x, y, z) => 0.75 + 0.25 * fbm(x * 40 + 3, y * 40, z * 40);
/* ---------- Los escudos: el frente dibujado como en el juego 2D (js/bastion-v2-dibujo.js), en una textura ----------
 * Antes era color por vértice (una grilla de 16×24) y las franjas salían en escalones. Ahora:
 *  - antidisturbios (acorazado): ventana arriba, franja blanca con «POLICÍA», abolladuras, rayones, sangre y barro;
 *  - pavés (El Escudo): ventana enrejada, dos franjas de obra amarillas y negras, remaches, grieta, sangre y barro.
 * Otra textura, en gris, da la rugosidad: la ventana brilla, la sangre está húmeda y el barro es mate. */
const FRENTE = 0.8;   // fracción de la textura que es el frente; el resto es el dorso (y los cantos)
const MAT_ESCUDO = {};
export function materialEscudo(grande) {
  const k = grande ? 'paves' : 'escudo';
  if (MAT_ESCUDO[k]) return MAT_ESCUDO[k];
  const FW = 256, W = 320, H = grande ? 600 : 448;
  const lienzo = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')]; };
  const [cc, g] = lienzo(), [cr, r] = lienzo();
  let sem = grande ? 7919 : 104729; const azar = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
  const gris = v => `rgb(${v},${v},${v})`;
  const ambos = (f, colorG, valorR) => { g.fillStyle = colorG; f(g); r.fillStyle = gris(valorR); f(r); };
  // base: plástico oscuro, más claro en el centro (es curvo) y el dorso liso
  g.fillStyle = grande ? '#2a3146' : '#262d40'; g.fillRect(0, 0, FW, H); r.fillStyle = gris(115); r.fillRect(0, 0, FW, H);
  const bri = g.createLinearGradient(0, 0, FW, 0); bri.addColorStop(0, 'rgba(0,0,0,0.32)'); bri.addColorStop(0.42, 'rgba(255,255,255,0.07)'); bri.addColorStop(0.55, 'rgba(255,255,255,0.03)'); bri.addColorStop(1, 'rgba(0,0,0,0.38)');
  g.fillStyle = bri; g.fillRect(0, 0, FW, H);
  g.fillStyle = '#191d27'; g.fillRect(FW, 0, W - FW, H); r.fillStyle = gris(150); r.fillRect(FW, 0, W - FW, H);
  // rayones y abolladuras
  for (let i = 0; i < 220; i++) {
    const x = azar() * W, y = azar() * H, l = 5 + azar() * 28, a = (azar() - 0.5) * 1.2 + (azar() < 0.3 ? Math.PI / 2 : 0);
    g.strokeStyle = `rgba(205,215,235,${0.05 + azar() * 0.12})`; g.lineWidth = azar() < 0.8 ? 1 : 2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    r.strokeStyle = gris(185); r.lineWidth = g.lineWidth; r.beginPath(); r.moveTo(x, y); r.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); r.stroke();
  }
  for (let i = 0; i < (grande ? 9 : 6); i++) {
    const x = 20 + azar() * (FW - 40), y = 20 + azar() * (H - 40), rad = 6 + azar() * 12, d = g.createRadialGradient(x - rad * 0.3, y - rad * 0.3, 0, x, y, rad);
    d.addColorStop(0, 'rgba(255,255,255,0.12)'); d.addColorStop(0.6, 'rgba(0,0,0,0.22)'); d.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = d; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  // la ventana (vidrio que refleja el cielo), con marco de goma; el pavés la tiene enrejada
  const [vx0, vx1, vy0, vy1] = grande ? [0.2 * FW, 0.8 * FW, 0.085 * H, 0.245 * H] : [0.17 * FW, 0.83 * FW, 0.07 * H, 0.31 * H];
  const vid = g.createLinearGradient(0, vy0, 0, vy1); vid.addColorStop(0, '#a9c9d8'); vid.addColorStop(0.55, '#6f90a4'); vid.addColorStop(1, '#3e5668');
  ambos(k => k.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0), vid, 18);
  g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.moveTo(vx0 + 10, vy1); g.lineTo(vx0 + 34, vy1); g.lineTo(vx0 + 34 + (vy1 - vy0) * 0.6, vy0); g.lineTo(vx0 + 10 + (vy1 - vy0) * 0.6, vy0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(235,245,250,0.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(vx0 + 6, vy0 + 6); g.lineTo(vx1 - 6, vy0 + 6); g.stroke();
  if (grande) {
    for (const f of [0.25, 0.5, 0.75]) ambos(k => k.fillRect(vx0 + (vx1 - vx0) * f - 3.5, vy0, 7, vy1 - vy0), '#141822', 120);
    ambos(k => k.fillRect(vx0, (vy0 + vy1) / 2 - 3, vx1 - vx0, 6), '#141822', 120);
  }
  for (const [kk, v] of [[g, '#0f1219'], [r, gris(150)]]) { kk.strokeStyle = v; kk.lineWidth = 7; kk.strokeRect(vx0, vy0, vx1 - vx0, vy1 - vy0); }
  // franjas de obra (pavés) o la franja blanca con POLICÍA (antidisturbios)
  if (grande) for (const [a, b] of [[0.315, 0.39], [0.8, 0.875]]) {
    const y0 = a * H, y1 = b * H, alto = y1 - y0;
    ambos(k => k.fillRect(10, y0, FW - 20, alto), '#e8c23a', 140);
    g.fillStyle = '#1a1c22'; g.save(); g.beginPath(); g.rect(10, y0, FW - 20, alto); g.clip();
    for (let x = -alto; x < FW; x += 38) { g.beginPath(); g.moveTo(x, y1); g.lineTo(x + 19, y1); g.lineTo(x + 19 + alto, y0); g.lineTo(x + alto, y0); g.closePath(); g.fill(); }
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(42,49,70,${0.5 + azar() * 0.4})`; g.beginPath(); g.ellipse(10 + azar() * (FW - 20), y0 + azar() * alto, 2 + azar() * 6, 1 + azar() * 3, azar() * 3, 0, Math.PI * 2); g.fill(); }   // pintura saltada
    g.restore();
  } else {
    const y0 = 0.375 * H, alto = 0.075 * H;
    ambos(k => k.fillRect(0.1 * FW, y0, 0.8 * FW, alto), '#e8e6dc', 160);
    g.fillStyle = '#1b2338'; g.font = `bold ${Math.round(alto * 0.72)}px Arial, Helvetica, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('POLICÍA', FW / 2, y0 + alto * 0.54);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(38,45,64,${0.35 + azar() * 0.5})`; g.fillRect(0.1 * FW + azar() * 0.8 * FW, y0 + azar() * alto, 1 + azar() * 7, 1 + azar() * 2); }   // gastada
  }
  // grieta (pavés)
  if (grande) {
    const P = [[0.2, 0.45], [0.36, 0.5], [0.31, 0.6], [0.47, 0.66], [0.56, 0.74]].map(([x, y]) => [x * FW, y * H]);
    for (const [kk, c, an, dx] of [[g, 'rgba(255,255,255,0.14)', 2, 1.5], [g, 'rgba(10,12,20,0.85)', 3, 0], [r, gris(200), 3, 0]]) {
      kk.strokeStyle = c; kk.lineWidth = an; kk.beginPath(); P.forEach(([x, y], i) => i ? kk.lineTo(x + dx, y + dx) : kk.moveTo(x + dx, y + dx)); kk.stroke();
    }
  }
  // sangre: la mancha, gotas alrededor y chorreaduras (húmeda: brilla)
  const [sx, sy] = grande ? [0.6 * FW, 0.57 * H] : [0.62 * FW, 0.64 * H];
  // forma(k, relleno): la misma salpicadura en las dos texturas (se repite la semilla)
  const forma = (k, relleno) => {
    sem = grande ? 31 : 57;
    for (let i = 0; i < 11; i++) {   // el cuerpo: manchas superpuestas, más chicas hacia afuera
      const a = azar() * Math.PI * 2, d = azar() * 18, x = sx + Math.cos(a) * d, y = sy + Math.sin(a) * d * 1.3, rx = 7 + azar() * 13, ry = 6 + azar() * 11;
      k.fillStyle = relleno(sx, sy, 40); k.beginPath(); k.ellipse(x, y, rx, ry, azar() * 3, 0, Math.PI * 2); k.fill();   // un solo degradé: sin bordes entre manchas
    }
    for (let i = 0; i < 14; i++) {   // puntas: el golpe salpica hacia afuera
      const a = azar() * Math.PI * 2, d0 = 12 + azar() * 8, d1 = d0 + 10 + azar() * 26, an = 0.06 + azar() * 0.1;
      k.fillStyle = relleno(sx, sy, d1); k.beginPath(); k.moveTo(sx + Math.cos(a - an) * d0, sy + Math.sin(a - an) * d0); k.lineTo(sx + Math.cos(a) * d1, sy + Math.sin(a) * d1); k.lineTo(sx + Math.cos(a + an) * d0, sy + Math.sin(a + an) * d0); k.closePath(); k.fill();
    }
    for (let i = 0; i < 30; i++) {   // gotas sueltas, estiradas hacia afuera
      const a = azar() * Math.PI * 2, d = 26 + azar() * 46, rr = 0.8 + azar() * 3;
      k.fillStyle = relleno(sx, sy, d); k.beginPath(); k.ellipse(sx + Math.cos(a) * d, sy + Math.sin(a) * d, rr * 1.8, rr, a, 0, Math.PI * 2); k.fill();
    }
    for (let i = 0; i < 5; i++) {   // chorreaduras: se afinan, se tuercen un poco y terminan en gota
      let x = sx - 24 + i * 11 + azar() * 6, an = 2.2 + azar() * 2.4;
      const y = sy + 6 + azar() * 10, l = 22 + azar() * 80, paso = 4;
      k.fillStyle = relleno(sx, sy, 20);
      for (let t = 0; t < l; t += paso) { k.beginPath(); k.ellipse(x, y + t, an / 2, paso * 0.8, 0, 0, Math.PI * 2); k.fill(); x += (azar() - 0.5) * 0.9; an = Math.max(1.2, an - 0.03); }
      k.beginPath(); k.ellipse(x, y + l, an * 0.85, an * 1.1, 0, 0, Math.PI * 2); k.fill();
    }
  };
  // seca en los bordes (más oscura) y más viva donde es más gruesa
  forma(g, (x, y, rad) => { const d = g.createRadialGradient(x, y, 0, x, y, rad); d.addColorStop(0, 'rgba(122,14,11,0.8)'); d.addColorStop(0.55, 'rgba(100,11,9,0.84)'); d.addColorStop(1, 'rgba(62,6,5,0.9)'); return d; });
  forma(r, () => gris(62));
  // barro abajo
  const barro = g.createLinearGradient(0, H * 0.78, 0, H); barro.addColorStop(0, 'rgba(70,52,34,0)'); barro.addColorStop(1, 'rgba(70,52,34,0.65)');
  g.fillStyle = barro; g.fillRect(0, H * 0.78, FW, H * 0.22);
  const barroR = r.createLinearGradient(0, H * 0.8, 0, H); barroR.addColorStop(0, 'rgba(235,235,235,0)'); barroR.addColorStop(1, 'rgba(235,235,235,1)');
  r.fillStyle = barroR; r.fillRect(0, H * 0.8, FW, H * 0.2);
  // remaches (pavés: en las esquinas y los bordes) y el canto de goma con su brillo
  const rem = grande ? [[0.07, 0.03], [0.93, 0.03], [0.07, 0.97], [0.93, 0.97], [0.07, 0.5], [0.93, 0.5], [0.07, 0.28], [0.93, 0.28], [0.07, 0.72], [0.93, 0.72]] : [[0.1, 0.04], [0.9, 0.04], [0.1, 0.96], [0.9, 0.96]];
  for (const [x, y] of rem) {
    const X = x * FW, Y = y * H;
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.arc(X + 1.5, Y + 1.5, 6, 0, Math.PI * 2); g.fill();
    ambos(k => { k.beginPath(); k.arc(X, Y, 5.5, 0, Math.PI * 2); k.fill(); }, '#8a8e9a', 90);
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(X - 1.8, Y - 1.8, 1.8, 0, Math.PI * 2); g.fill();
  }
  for (const [kk, v] of [[g, '#11141c'], [r, gris(170)]]) { kk.strokeStyle = v; kk.lineWidth = 10; kk.strokeRect(0, 0, FW, H); }
  g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(8, 8, 3, H - 16);
  const mapa = new THREE.CanvasTexture(cc), rug = new THREE.CanvasTexture(cr);
  mapa.colorSpace = THREE.SRGBColorSpace; mapa.anisotropy = rug.anisotropy = 4;
  return (MAT_ESCUDO[k] = new THREE.MeshStandardMaterial({ map: mapa, roughnessMap: rug, roughness: 1, metalness: 0.06, vertexColors: true }));
}

const T = (g, x, y, z) => g.translate(x, y, z);
export function accesorio(nombre, A) {
  const C = A.cabeza, out = [];
  const enCabeza = (geo, mat = 'mate') => out.push({ hueso: 'cabeza', geo, mat });
  switch (nombre) {
    case 'casco-antimotin': {   // casco antidisturbios: casquete, cubrenuca y el visor levantado a medias, rajado
      enCabeza(pintMancha(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.58).scale(0.093, 0.1, 0.108).translate(0, 1.668, -0.008), '#1e2433', sucio), 'brillo');
      enCabeza(pintMancha(new THREE.CylinderGeometry(0.1, 0.11, 0.07, 20, 1, true, Math.PI * 0.6, Math.PI * 0.8).scale(0.95, 1, 1.05).translate(0, 1.6, -0.01), '#171b26', sucio));   // cubrenuca
      enCabeza(pint(new THREE.TorusGeometry(0.096, 0.006, 6, 28, Math.PI * 1.1).rotateX(Math.PI / 2).rotateY(-Math.PI * 0.05).scale(1, 1, 1.12).translate(0, 1.645, -0.008), '#0e1016'));   // borde
      const visor = new THREE.SphereGeometry(1, 24, 8, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.42, Math.PI * 0.24).scale(0.104, 0.11, 0.122);
      visor.translate(0, -0.012, 0).rotateX(-0.55).translate(0, 1.672, -0.01);   // levantado a medias
      enCabeza(pint(visor, '#9fb4c8'), 'vidrio');
      break;
    }
    case 'gorra': {
      const copa = pint(new THREE.CylinderGeometry(1, 0.8, 1, 28), '#1e2a48').scale(0.094, 0.07, 0.11).translate(0, 1.745, -0.008);
      const banda = pint(new THREE.CylinderGeometry(1, 1, 1, 28, 1, true), '#121318').scale(0.079, 0.026, 0.096).translate(0, 1.722, -0.006);
      const visera = pint(new THREE.CylinderGeometry(1, 1, 1, 20, 1, false, -Math.PI / 2, Math.PI), '#0d0d0f').scale(0.075, 0.004, 0.085).rotateX(0.38).translate(0, 1.71, 0.045);
      const placa = pint(new THREE.CylinderGeometry(0.012, 0.012, 0.003, 6), '#d8b23a').rotateX(Math.PI / 2).translate(0, 1.748, 0.094);
      for (const g of [copa, banda, visera, placa]) enCabeza(g, 'brillo');
      break;
    }
    case 'casco-obra': {   // casco de obra amarillo con su cresta y el ala
      enCabeza(pintMancha(new THREE.SphereGeometry(1, 26, 12, 0, Math.PI * 2, 0, Math.PI * 0.52).scale(0.092, 0.098, 0.106).translate(0, 1.69, -0.006), '#e8b21c', sucio), 'brillo');
      enCabeza(pint(new THREE.CylinderGeometry(0.115, 0.118, 0.008, 28).scale(1, 1, 1.12).translate(0, 1.69, 0.005), '#d9a214'), 'brillo');
      enCabeza(pint(new THREE.BoxGeometry(0.016, 0.018, 0.2).translate(0, 1.787, -0.006), '#d9a214'), 'brillo');
      break;
    }
    case 'casco-minero': {   // casco de minero abollado con la lámpara prendida al frente
      const g = new THREE.SphereGeometry(1, 26, 12, 0, Math.PI * 2, 0, Math.PI * 0.55); const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const d = Math.hypot(x - 0.5, y - 0.6, z - 0.5) < 0.4 ? 0.9 : 1; p.setXYZ(i, x * d, y * d, z * d); }   // abolladura
      enCabeza(pintMancha(g.scale(0.094, 0.1, 0.108).translate(0, 1.685, -0.008), '#7a6a3a', sucio), 'brillo');
      enCabeza(pint(new THREE.CylinderGeometry(0.112, 0.116, 0.008, 28).scale(1, 1, 1.1).translate(0, 1.684, 0.002), '#5a4e2c'));
      enCabeza(pint(new THREE.CylinderGeometry(0.022, 0.025, 0.03, 16).rotateX(Math.PI / 2).translate(0, 1.73, 0.11), '#2a2a2a'), 'brillo');
      enCabeza(pint(new THREE.CircleGeometry(0.019, 16).translate(0, 1.73, 0.1255), '#fff6d0'), 'luz');
      break;
    }
    case 'casco-soldado': {   // casco de combate con funda, borde y el barbijo suelto
      enCabeza(pintMancha(new THREE.SphereGeometry(1, 26, 12, 0, Math.PI * 2, 0, Math.PI * 0.6).scale(0.1, 0.098, 0.113).translate(0, 1.672, -0.01), '#5b6340', (x, y, z) => 0.7 + 0.3 * fbm(x * 70, y * 70, z * 70)));
      enCabeza(pint(new THREE.TorusGeometry(0.103, 0.007, 6, 32).rotateX(Math.PI / 2).scale(1, 1, 1.12).translate(0, 1.626, -0.01), '#454c30'));
      enCabeza(pint(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(v3(-0.085, 1.62, 0.0), v3(-0.02, 1.52, 0.06), v3(0.07, 1.6, 0.02)), 10, 0.004, 4), '#3b3a2c'));
      break;
    }
    case 'vincha': {   // vincha blanca con la raya roja
      enCabeza(pint(new THREE.CylinderGeometry(1, 1, 1, 30, 1, true).scale(0.083, 0.024, 0.099).translate(0, 1.7, -0.004), '#f2f2ea'));
      enCabeza(pint(new THREE.CylinderGeometry(1, 1, 1, 30, 1, true).scale(0.0835, 0.006, 0.0995).translate(0, 1.7, -0.004), '#b8322a'));
      break;
    }
    case 'barbijo': break;   // se arma con la cara (necesita la forma de la cabeza)
    case 'megafono': {   // megáfono rojo pegado a la boca
      const bocina = pint(new THREE.CylinderGeometry(0.075, 0.03, 0.17, 20, 1, true), '#c8261e').rotateX(Math.PI / 2).translate(0, 1.585, 0.185);
      const cuerpo = pint(new THREE.CylinderGeometry(0.03, 0.028, 0.06, 16), '#e8e4da').rotateX(Math.PI / 2).translate(0, 1.585, 0.08);
      const mango = pint(new THREE.BoxGeometry(0.022, 0.07, 0.025), '#1a1a1a').translate(0, 1.54, 0.09);
      const aro = pint(new THREE.TorusGeometry(0.075, 0.006, 6, 24).translate(0, 1.585, 0.27), '#e8e4da');
      for (const g of [bocina, cuerpo, mango, aro]) enCabeza(g, 'brillo');
      break;
    }
    case 'hombreras': for (const s of [1, -1]) {
      const g = pintMancha(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(0.075, 0.05, 0.075), '#1a1f2c', sucio);
      g.rotateZ(-s * 0.35).translate(A.brazoI[0] * s + s * 0.015, A.brazoI[1] + 0.012, A.brazoI[2]);
      out.push({ hueso: s > 0 ? 'brazoI' : 'brazoD', geo: g, mat: 'brillo' });
    } break;
    case 'escudo': case 'paves': {   // escudo antidisturbios (ventana y franja de POLICÍA) o el pavés gigante (franjas de obra y reja)
      const grande = nombre === 'paves', w = grande ? 0.62 : 0.46, h = grande ? 1.45 : 0.82;
      const g = new THREE.BoxGeometry(w, h, 0.018, 16, 24, 1), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
      // el dibujo va en una textura (materialEscudo): el frente usa la parte izquierda; el dorso y los cantos, la franja lisa
      for (let i = 0; i < p.count; i++) uv.setX(i, n.getZ(i) > 0.5 ? uv.getX(i) * FRENTE : FRENTE + 0.02 + uv.getX(i) * (0.96 - FRENTE));
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, p.getZ(i) - (x / w) ** 2 * 0.09 + (hash3(Math.round(x * 30), Math.round(y * 30), 3) < 0.04 ? -0.008 : 0)); }   // curvo y abollado
      g.computeVertexNormals();
      const c = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) c.fill(0.9 + 0.1 * fbm(p.getX(i) * 20, p.getY(i) * 20, 1), i * 3, i * 3 + 3);
      g.setAttribute('color', new THREE.BufferAttribute(c, 3));
      // en la mano izquierda: el antebrazo va hacia adelante y el escudo queda parado delante del cuerpo
      // en reposo: acostado, mirando abajo y con el borde de arriba hacia +z (al girar el antebrazo hacia adelante queda parado)
      g.rotateX(Math.PI / 2).translate(A.manoI[0] - (grande ? 0.24 : 0.15), A.manoI[1] - 0.06, A.manoI[2] - (grande ? 0.3 : 0.02));
      out.push({ hueso: 'anteI', geo: g, mat: grande ? 'paves' : 'escudo', escudo: { w, h, grande } });
      break;
    }
    case 'dinamita': {   // cartuchos atados a la espalda, con la mecha prendida
      const piezas = [];
      for (let k = 0; k < 6; k++) piezas.push(pint(new THREE.CylinderGeometry(0.016, 0.016, 0.2, 10), k % 2 ? '#b8261e' : '#c8321e').translate(-0.05 + k * 0.02, 1.2, -0.12 - (k % 2) * 0.012));
      for (const y of [1.14, 1.26]) piezas.push(pint(new THREE.BoxGeometry(0.14, 0.018, 0.05), '#2a2a2a').translate(0, y, -0.125));
      piezas.push(pint(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(v3(0.0, 1.3, -0.125), v3(0.04, 1.4, -0.15), v3(0.07, 1.42, -0.1)), 8, 0.002, 4), '#c9b36a'));
      for (const g of piezas) out.push({ hueso: 'pecho', geo: g, mat: 'mate' });
      out.push({ hueso: 'pecho', geo: pint(new THREE.SphereGeometry(0.006, 8, 6).translate(0.07, 1.42, -0.1), '#ffd060'), mat: 'luz', mecha: true });
      break;
    }
    case 'portacargadores': for (const x of [-0.06, 0, 0.06]) {
      out.push({ hueso: 'pecho', geo: pintMancha(new THREE.BoxGeometry(0.05, 0.075, 0.03).translate(x, 1.17, 0.13), '#8a7458', sucio), mat: 'mate' });
    } break;
    case 'pelo-revuelto': {   // mata de pelo negro parado
      const g = [];
      for (let k = 0; k < 46; k++) {
        const a = hash3(k, 1, 7) * Math.PI * 2, e = 0.15 + hash3(k, 2, 7) * 0.9, d = v3(Math.sin(a) * Math.sin(e), Math.cos(e), Math.cos(a) * Math.sin(e));
        if (d.z > 0.55 && d.y < 0.75) continue;   // la frente despejada
        const base = v3(0, 1.672, -0.008).add(d.clone().multiply(v3(0.068, 0.082, 0.085))), largo = 0.035 + hash3(k, 3, 7) * 0.04;
        const cono = new THREE.ConeGeometry(0.014 + hash3(k, 4, 7) * 0.008, largo, 5);
        cono.translate(0, largo / 2, 0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), d.clone().add(v3((hash3(k, 5, 7) - 0.5) * 0.6, 0.25, -0.2)).normalize())).translate(base.x, base.y, base.z);
        g.push(pint(cono, k % 3 ? '#15161a' : '#232428'));
      }
      for (const x of g) enCabeza(x);
      break;
    }
    case 'pelo-largo': {   // pelo largo, ralo y apelmazado: mechones que caen hasta los hombros
      for (let k = 0; k < 34; k++) {
        const a = -Math.PI * 0.85 + (k / 33) * Math.PI * 1.7 + (hash3(k, 9, 1) - 0.5) * 0.12, r0 = v3(Math.sin(a) * 0.074, 1.7 + Math.cos(a) * 0.01, -Math.cos(a) * 0.086 - 0.008);
        if (Math.cos(a) < -0.55) continue;   // la cara despejada
        const largo = 0.2 + hash3(k, 3, 1) * 0.12, ancho = 0.018 + hash3(k, 4, 1) * 0.01, seg = 7, pos = [], idx = [];
        const fuera = v3(Math.sin(a), 0, -Math.cos(a)).normalize();
        for (let s = 0; s <= seg; s++) {
          const t = s / seg, y = r0.y - t * largo, o = 0.012 + t * t * 0.06 + Math.max(0, 0.03 - t * 0.2);
          const c = v3(r0.x + fuera.x * o, y, r0.z + fuera.z * o - t * 0.02), lado2 = v3(-fuera.z, 0, fuera.x).multiplyScalar(ancho * (1 - t * 0.6));
          pos.push(c.x - lado2.x, c.y, c.z - lado2.z, c.x + lado2.x, c.y, c.z + lado2.z);
          if (s < seg) idx.push(s * 2, s * 2 + 2, s * 2 + 1, s * 2 + 1, s * 2 + 2, s * 2 + 3);
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        pint(g, k % 4 ? '#2a241c' : '#4a4034');
        const u0 = hash3(k, 7, 1) * 0.6, uv = [];   // la raíz arriba de la textura de hebras; las puntas quedan desparejas
        for (let s = 0; s <= seg; s++) uv.push(u0, 1 - s / seg, u0 + 0.4, 1 - s / seg);
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        enCabeza(g, 'pelo');
      }
      break;
    }
    case 'buche': {   // la bolsa de ácido bajo la mandíbula (se hincha antes de escupir)
      const g = pintMancha(new THREE.SphereGeometry(1, 18, 12).scale(0.05, 0.04, 0.045).translate(0, 1.535, 0.055), '#c8c24a', (x, y, z) => 0.7 + 0.3 * fbm(x * 90, y * 90, z * 90));
      out.push({ hueso: 'cabeza', geo: g, mat: 'brillo', buche: true });
      break;
    }
    case 'pustulas': for (let k = 0; k < 9; k++) {   // pústulas que brillan (tóxico): torso, cabeza y brazos
      const zona = k < 4 ? 't' : k < 6 ? 'c' : 'b', g = new THREE.SphereGeometry(0.009 + hash3(k, 1, 3) * 0.008, 10, 8);
      const p = zona === 't' ? [(hash3(k, 2, 3) - 0.5) * 0.2, 1.12 + hash3(k, 3, 3) * 0.25, 0.1] : zona === 'c' ? [(hash3(k, 2, 3) - 0.5) * 0.08, 1.64 + hash3(k, 3, 3) * 0.05, 0.075] : [(k % 2 ? 1 : -1) * 0.23, 1.25, 0.03];
      out.push({ hueso: zona === 't' ? 'pecho' : zona === 'c' ? 'cabeza' : k % 2 ? 'brazoI' : 'brazoD', geo: pint(g.translate(...p), '#c8ff5a'), mat: 'luz', pulso: hash3(k, 4, 3) * 6 });
    } break;
    case 'baba': for (let k = 0; k < 3; k++) {   // baba fosforescente que cuelga de la boca
      const largo = 0.03 + k * 0.015, g = new THREE.CylinderGeometry(0.0025, 0.0012, largo, 5).translate(-0.012 + k * 0.012, 1.575 - largo / 2, 0.083);
      enCabeza(pint(g, '#a8ff3c'), 'luz');
    } break;
    case 'dorsal': break;   // se arma por zombie (lleva un número)
  }
  return out;
}
