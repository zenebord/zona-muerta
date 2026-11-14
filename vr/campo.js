/* ===== Zona Muerta VR: el campo de pruebas en primera persona (Meta Quest, WebXR) =====
 * El galpón del campo de pruebas con una mesa larga delante de la línea de tiro y, sobre ella, armas del juego pasadas
 * a 3D (vr/modelo3d.js) que funcionan como de verdad (vr/armas-vr.js). Blancos de papel a 10, 25 y 50 m y un zombie
 * de cartón a 17 m que se cae.
 * En el visor: agarre derecho cerca de un arma de la mesa la toma; otra vez el agarre la deja (sobre la mesa vuelve a
 * su lugar; lejos, cae y vuelve sola). Gatillo dispara; A suelta el cargador; B monta. Con la mano izquierda: agarre
 * en el guardamanos sostiene con las dos manos (en la escopeta es la bomba); en la corredera, la manija o el cerrojo
 * los lleva atrás; lejos del arma saca munición nueva, que entra al acercarla al pozo, al portillo o a la ventana.
 * Palanca izquierda camina y la derecha gira de a 30°.
 * Sin visor: mouse apunta, clic dispara, clic derecho apunta con las miras, E toma el arma que se mira, Q la deja,
 * números la toman directo, R recarga, B monta, WASD camina. Para las pruebas automáticas: window.__campo. */
import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { A_METROS } from './armas-vr.js';
import { crearArma } from './especiales.js';
import { Efectos, texturaCanvas } from './efectos.js';
import { Zombie } from './zombie3d.js';
import { fusionar } from './modelo3d.js';

const ARMAS_MESA = ['glock', 'ak47', 'remington700', 'mossberg', 'minigun', 'm79', 'rpg7', 'granadas', 'lanzallamas', 'laser', 'machete', 'mjolnir'];
const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- Escena ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor'); renderer.xr.setFoveation(1);
document.body.appendChild(renderer.domElement);

const escena = new THREE.Scene();
const NIEBLA = 0x7f8897;
escena.background = new THREE.Color(NIEBLA); escena.fog = new THREE.Fog(NIEBLA, 28, 100);
escena.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;   // reflejos del metal
escena.add(new THREE.HemisphereLight(0xe9eff9, 0x57524b, 1.3));
const sol = new THREE.DirectionalLight(0xfff1da, 1.5); sol.position.set(-6, 14, 5); escena.add(sol);

const camara = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.02, 220);
const jugador = new THREE.Group(); jugador.add(camara); escena.add(jugador);   // se mueve con la palanca (o WASD)
addEventListener('resize', () => { camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
const ruido = (g, w, h, n, colores) => { for (let k = 0; k < n; k++) { g.fillStyle = colores[k % colores.length]; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };

/* ---------- El galpón (como el del campo de pruebas: chapa gris azulada, columnas y el poste con bandas) ---------- */
const objetos = [];                                      // lo que la bala puede tocar: { malla, tipo }
const blancos = [];                                      // los de papel y el zombie de cartón
function galpon() {
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(26, 104), new THREE.MeshStandardMaterial({ roughness: 0.93, map: texturaCanvas(256, 256, (g, w, h) => {
    g.fillStyle = '#7b818b'; g.fillRect(0, 0, w, h); ruido(g, w, h, 2600, ['#6f757f', '#878d97', '#737983', '#8d939c']);
    g.strokeStyle = '#5b6069'; g.lineWidth = 3; g.strokeRect(0, 0, w, h);   // juntas cada 2 m
  }, [13, 52]) }));
  piso.rotation.x = -Math.PI / 2; piso.position.set(0, 0, -46); escena.add(piso); objetos.push({ malla: piso, tipo: 'piso' });
  for (const x of [-4, 0, 4]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 90), new THREE.MeshBasicMaterial({ color: 0xc9b25a })); l.rotation.x = -Math.PI / 2; l.position.set(x - 2, 0.003, -46); escena.add(l); }
  const linea = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.14), new THREE.MeshBasicMaterial({ color: 0xe0b020 })); linea.rotation.x = -Math.PI / 2; linea.position.set(0, 0.004, MESA.z0 + 0.12); escena.add(linea);
  const chapa = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.15, map: texturaCanvas(256, 256, (g, w, h) => {
    g.fillStyle = '#9aa3b2'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(x, 0, 6, h); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 7, 0, 3, h); }
    g.fillStyle = 'rgba(40,46,56,0.35)'; g.fillRect(0, h - 40, w, 40);   // zócalo sucio
  }, [25, 1]) });
  for (const x of [-13, 13]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(104, 9), chapa); p.position.set(x, 4.5, -46); p.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; escena.add(p); objetos.push({ malla: p, tipo: 'pared' }); }
  const atras = new THREE.Mesh(new THREE.PlaneGeometry(26, 9), chapa); atras.position.set(0, 4.5, 5.5); atras.rotation.y = Math.PI; escena.add(atras);
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(26, 9), chapa); fondo.position.set(0, 4.5, -97.5); escena.add(fondo); objetos.push({ malla: fondo, tipo: 'pared' });
  const talud = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 26, 24, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x6d5a44, roughness: 1 }));
  talud.rotation.z = Math.PI / 2; talud.rotation.y = Math.PI / 2; talud.position.set(0, 0, -95); escena.add(talud); objetos.push({ malla: talud, tipo: 'tierra' });
  const acero = new THREE.MeshStandardMaterial({ color: 0x2b2f37, roughness: 0.55, metalness: 0.5 });
  const luz = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
  const estructura = new THREE.Group();   // columnas, vigas y lámparas: una malla por material (menos llamadas de dibujo)
  for (let z = 2; z > -96; z -= 10) {
    for (const x of [-12.4, 12.4]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.45, 8, 0.45), acero); c.position.set(x, 4, z); estructura.add(c); }
    const viga = new THREE.Mesh(new THREE.BoxGeometry(25, 0.5, 0.25), acero); viga.position.set(0, 7.9, z); estructura.add(viga);
    const lampara = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.4), luz); lampara.position.set(0, 7.4, z - 5); estructura.add(lampara);
  }
  fusionar(estructura, true); escena.add(estructura);
  for (const m of estructura.children) if (m.material === acero) objetos.push({ malla: m, tipo: 'metal' });
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(26, 104), new THREE.MeshStandardMaterial({ color: 0x5a6170, roughness: 0.9, side: THREE.DoubleSide }));
  techo.rotation.x = Math.PI / 2; techo.position.set(0, 8.3, -46); escena.add(techo);
  for (const [x, z] of [[4.2, -14], [-4.6, -32], [4.2, -60]]) {   // postes con bandas amarillas, como el del juego
    const poste = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), acero); poste.position.set(x, 2, z); escena.add(poste); objetos.push({ malla: poste, tipo: 'metal' });
    for (const y of [1.6, 2.1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.32), new THREE.MeshStandardMaterial({ color: 0xe0b020, roughness: 0.6 })); b.position.set(x, y, z); escena.add(b); }
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), acero); base.position.set(x, 0.05, z); escena.add(base);
  }
  return { acero };
}

/* ---------- La mesa de las armas, delante de la línea de tiro ---------- */
const MESA = { x0: -2.3, x1: 2.3, z0: -0.42, z1: -1.42, alto: 0.92 };
const sobreMesa = (x, z, margen = 0) => x > MESA.x0 - margen && x < MESA.x1 + margen && z < MESA.z0 + margen && z > MESA.z1 - margen;
const superficie = (x, z) => sobreMesa(x, z) ? MESA.alto : 0;
function mesa(acero) {
  const madera = new THREE.MeshStandardMaterial({ color: 0x8a6542, roughness: 0.72, map: texturaCanvas(512, 128, (g, w, h) => {
    g.fillStyle = '#d9bf9b'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 60; k++) { const y = Math.random() * h; g.strokeStyle = `rgba(80,45,20,${0.06 + Math.random() * 0.14})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y - 5 + Math.random() * 10, w * 0.7, y - 5 + Math.random() * 10, w, y); g.stroke(); }
    for (let x = 0; x < w; x += 128) { g.fillStyle = 'rgba(40,20,8,0.35)'; g.fillRect(x, 0, 2, h); }   // tablones
  }, [2, 1]) });
  const ancho = MESA.x1 - MESA.x0, fondo = MESA.z0 - MESA.z1;
  const tabla = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.05, fondo), madera); tabla.position.set((MESA.x0 + MESA.x1) / 2, MESA.alto - 0.025, (MESA.z0 + MESA.z1) / 2); escena.add(tabla); objetos.push({ malla: tabla, tipo: 'madera' });
  const paño = new THREE.Mesh(new THREE.PlaneGeometry(ancho - 0.1, fondo - 0.1), new THREE.MeshStandardMaterial({ color: 0x3f4a3a, roughness: 0.95 }));
  paño.rotation.x = -Math.PI / 2; paño.position.set(tabla.position.x, MESA.alto + 0.001, tabla.position.z); escena.add(paño);
  for (const x of [MESA.x0 + 0.08, MESA.x1 - 0.08, (MESA.x0 + MESA.x1) / 2]) for (const z of [MESA.z0 - 0.08, MESA.z1 + 0.08]) { const pata = new THREE.Mesh(new THREE.BoxGeometry(0.07, MESA.alto - 0.05, 0.07), acero); pata.position.set(x, (MESA.alto - 0.05) / 2, z); escena.add(pata); }
}

/* ---------- Blancos: papel con un zombie impreso y un zombie de cartón que se cae ---------- */
function texturaPapel() {
  return texturaCanvas(512, 768, (g, w, h) => {
    g.fillStyle = '#eee5cf'; g.fillRect(0, 0, w, h); ruido(g, w, h, 900, ['#e2d8c0', '#f5eedd']);
    g.fillStyle = '#4c5a44';
    g.beginPath(); g.ellipse(256, 200, 92, 110, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(206, 290); g.lineTo(306, 290); g.lineTo(330, 340); g.bezierCurveTo(470, 360, 470, 420, 480, 760); g.lineTo(32, 760); g.bezierCurveTo(42, 420, 42, 360, 182, 340); g.closePath(); g.fill();
    g.fillStyle = '#1b2016'; g.beginPath(); g.ellipse(222, 188, 22, 18, 0.2, 0, 7); g.ellipse(294, 186, 24, 19, -0.2, 0, 7); g.fill();
    g.fillStyle = '#d8d26a'; g.beginPath(); g.arc(226, 190, 6, 0, 7); g.arc(290, 188, 6, 0, 7); g.fill();
    g.fillStyle = '#1b2016'; g.beginPath(); g.moveTo(214, 252); for (let k = 0; k <= 8; k++) g.lineTo(214 + k * 11, 252 + (k % 2 ? 16 : 0)); g.lineTo(302, 262); g.lineTo(214, 262); g.fill();
    g.lineWidth = 4;
    for (const [cx, cy, r] of [[256, 200, 40], [256, 200, 80], [256, 470, 60], [256, 470, 120], [256, 470, 180]]) { g.strokeStyle = 'rgba(176,34,24,0.85)'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
    g.fillStyle = '#2b2b2b'; g.font = '700 30px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.fillText('ZONA MUERTA · CAMPO DE TIRO', 256, 730);
  });
}
function texturaZombie() {
  return texturaCanvas(512, 1024, (g) => {
    const piel = '#86a862', pielOsc = '#5e7a43';
    g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = '#1d2216';
    const forma = (pts, color) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = color; g.fill(); g.stroke(); };
    forma([[196, 610], [250, 610], [244, 960], [182, 960]], '#3c4a6a'); forma([[262, 610], [318, 610], [330, 960], [268, 960]], '#35425f');
    forma([[170, 950], [250, 950], [256, 1000], [150, 1000]], '#2a2420'); forma([[262, 950], [342, 950], [362, 1000], [258, 1000]], '#2a2420');
    forma([[150, 330], [362, 330], [388, 470], [352, 640], [300, 610], [262, 650], [214, 612], [160, 640], [124, 470]], '#c8bfab');
    g.fillStyle = 'rgba(122,26,18,0.75)'; for (const [x, y, r] of [[300, 430, 28], [210, 520, 20], [330, 560, 16], [240, 400, 12]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    forma([[140, 350], [182, 360], [110, 560], [74, 600], [56, 580], [96, 520]], '#c8bfab'); forma([[372, 350], [330, 360], [402, 560], [438, 600], [456, 580], [416, 520]], '#c8bfab');
    forma([[52, 580], [84, 600], [80, 650], [44, 640]], piel); forma([[460, 580], [428, 600], [432, 650], [468, 640]], piel);
    forma([[232, 300], [282, 300], [286, 340], [228, 340]], pielOsc);
    g.beginPath(); g.ellipse(256, 200, 96, 118, 0, 0, Math.PI * 2); g.fillStyle = piel; g.fill(); g.stroke();
    g.fillStyle = '#1a1d14'; g.beginPath(); g.ellipse(220, 186, 24, 20, 0.2, 0, 7); g.ellipse(294, 184, 26, 21, -0.2, 0, 7); g.fill();
    g.fillStyle = '#e8e07a'; g.beginPath(); g.arc(224, 190, 7, 0, 7); g.arc(290, 188, 7, 0, 7); g.fill();
    g.fillStyle = '#2a0c08'; g.beginPath(); g.ellipse(258, 262, 46, 24, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8e2c8'; for (let k = 0; k < 6; k++) g.fillRect(220 + k * 13, 242, 8, 12);
    g.fillStyle = '#3a2a1c'; for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(170 + k * 20, 110); g.lineTo(180 + k * 20, 70 - (k % 3) * 12); g.lineTo(190 + k * 20, 112); g.fill(); }
  });
}
const papel = texturaPapel(), carton = texturaZombie();
function blancoPapel(x, z) {
  const grupo = new THREE.Group(); grupo.position.set(x, 0, z); escena.add(grupo);
  const madera = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.85 });
  for (const px of [-0.36, 0.36]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.9, 0.05), madera); p.position.set(px, 0.95, 0); grupo.add(p); objetos.push({ malla: p, tipo: 'madera' }); }
  const hoja = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.93), new THREE.MeshStandardMaterial({ map: papel, roughness: 0.95, side: THREE.DoubleSide }));
  hoja.position.set(0, 1.35, 0); grupo.add(hoja);
  const b = { tipo: 'papel', malla: hoja, grupo, agujeros: [], impactos: 0 };
  objetos.push(b); blancos.push(b);
}
function zombieCarton(x, z) {
  const grupo = new THREE.Group(); grupo.position.set(x, 0, z); escena.add(grupo);
  const geo = new THREE.PlaneGeometry(0.9, 1.8); geo.translate(0, 0.9, 0);
  const silueta = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: carton, alphaTest: 0.5, roughness: 0.9, side: THREE.DoubleSide }));
  grupo.add(silueta);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.4), new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.6 })); base.position.y = 0.04; grupo.add(base);
  const b = { tipo: 'zombie', malla: silueta, grupo, agujeros: [], impactos: 0, vida: 6, caida: 0, caidoEn: -1 };
  objetos.push(b); blancos.push(b);
}

/* ---------- Efectos, mundo para las armas e impactos ---------- */
const efectos = new Efectos(escena, superficie);
const rayo = new THREE.Raycaster();
const marcador = { disparos: 0, impactos: 0, mordidas: 0 };
const proyectiles = [];
const mundo = {
  escena, efectos, disparo: (o, d, golpe) => impacto(o, d, golpe), vibrar: (lado, f, ms) => vibrar(lado, f, ms),
  lanzar: p => { if (!p.objeto.parent) escena.add(p.objeto); p.edad = 0; proyectiles.push(p); return p; },
  dejarDeLanzar: p => { const i = proyectiles.indexOf(p); if (i >= 0) proyectiles.splice(i, 1); },
  explotar: (pos, radio) => explotar(pos, radio),
  barrer: (antes, ahora) => barrer(antes, ahora),
  golpearZombie: (h, dano, tipo) => { zombie.recibir({ punto: h.punto, dir: h.dir, dano, tipo, zona: h.zona }); efectos.impacto(h.punto, h.dir.clone().negate(), 'carne'); marcador.impactos++; dibujarTablero(); },
  rayo: p => { efectos.rayo(p); Audio_.trueno(); vibrar('right', 1, 220); vibrar('left', 0.6, 220); },
  volverAMesa: (a, ya) => volverAMesa(a, ya),
  get zombie() { return zombie; },
};
function impacto(origen, dir, golpe) {
  if (golpe.primero) marcador.disparos++;
  rayo.set(origen, dir); rayo.far = 120;
  const golpes = rayo.intersectObjects([...objetos.map(o => o.malla), ...zombie.zonas], false);
  for (const h of golpes) {
    if (h.object.userData.zombie) {   // el zombie: la zona que tocó decide el daño; la cabeza lo mata
      if (zombie.estado === 'cae' || zombie.estado === 'muerto') continue;
      const normal = dir.clone().negate();
      zombie.recibir({ punto: h.point, dir, dano: golpe.dano, tipo: golpe.tipo, zona: h.object });
      efectos.impacto(h.point, normal, 'carne'); Audio_.impactoCarne();
      golpe.arma.impactos++; if (!golpe.tiro.impacto) { golpe.tiro.impacto = true; marcador.impactos++; }
      dibujarTablero();
      return h.point;
    }
    const o = objetos.find(x => x.malla === h.object);
    if (o.tipo === 'zombie') {
      if (o.caida > 0.5) continue;
      const c = carton.lienzo, px = Math.floor(h.uv.x * c.width), py = Math.floor((1 - h.uv.y) * c.height);
      if (c.getContext('2d').getImageData(px, py, 1, 1).data[3] < 128) continue;   // por el hueco del recorte
    }
    const normal = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : dir.clone().negate();
    if (normal.dot(dir) > 0) normal.negate();
    if (o.tipo === 'papel' || o.tipo === 'zombie') {
      const marca = efectos.marca(o.malla, h.point, normal, o.tipo === 'zombie' ? 0.014 : golpe.tipo === 'perdigon' ? 0.0045 : 0.0055, o.tipo === 'zombie');
      o.agujeros.push(marca); if (o.agujeros.length > 200) o.malla.remove(o.agujeros.shift());
      o.impactos++; golpe.arma.impactos++;
      if (!golpe.tiro.impacto) { golpe.tiro.impacto = true; marcador.impactos++; }
      if (o.tipo === 'zombie') { Audio_.impactoCarne(); if (o.impactos >= o.vida && o.caida === 0) { o.caida = 0.001; Audio_.zombieMuere(true); } }
    }
    efectos.impacto(h.point, normal, o.tipo === 'metal' ? 'metal' : o.tipo === 'papel' ? 'papel' : 'polvo');
    dibujarTablero();
    return h.point;
  }
  return null;
}
function actualizarBlancos(ahora, dt) {
  for (const b of blancos) if (b.tipo === 'zombie') {   // se cae para atrás, y a los 3 s se levanta de nuevo
    if (b.caida > 0 && b.caida < 1) { b.caida = Math.min(1, b.caida + dt / 0.35); if (b.caida === 1) b.caidoEn = ahora; }
    if (b.caida === 1 && ahora - b.caidoEn > 3000) { b.caida = 0.999; b.levanta = true; }
    if (b.levanta) { b.caida -= dt / 0.6; if (b.caida <= 0) { b.caida = 0; b.levanta = false; b.impactos = 0; for (const a of b.agujeros) b.malla.remove(a); b.agujeros = []; } }
    b.malla.rotation.x = -Math.PI / 2 * (b.caida * b.caida);
  }
}

/* ---------- Tablero sobre la mesa ---------- */
const tablero = texturaCanvas(800, 300, () => {});
let zombie = null;
let manoDerecha = null;   // el arma que tiene la mano derecha
function dibujarTablero() {
  const g = tablero.lienzo.getContext('2d'), w = 800, h = 300;
  g.fillStyle = '#16131a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a96e'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = '#c9a96e'; g.font = '700 42px "Trebuchet MS", sans-serif'; g.textAlign = 'left';
  g.fillText(manoDerecha ? manoDerecha.nombre.toUpperCase() : 'CAMPO DE PRUEBAS', 30, 64);
  g.fillStyle = '#f1e6d0'; g.font = '700 36px "Trebuchet MS", sans-serif';
  g.fillText(`Disparos: ${marcador.disparos}`, 30, 130); g.fillText(`Impactos: ${marcador.impactos}`, 420, 130);
  g.fillText(`Precisión: ${marcador.disparos ? Math.min(100, Math.round(100 * marcador.impactos / marcador.disparos)) : 0} %`, 30, 184);
  g.fillText(`Zombies: ${zombie.muertes} · a la cabeza: ${zombie.cabezazos} · mordidas: ${marcador.mordidas}`, 30, 226);
  g.font = '400 22px "Trebuchet MS", sans-serif'; g.fillStyle = 'rgba(241,230,208,0.75)';
  g.fillText(manoDerecha ? 'Agarre derecho: dejarla · A: cargador · B: montar' : 'Toma un arma de la mesa: agarre derecho cerca o apuntándole', 30, 262);
  g.fillText(manoDerecha ? 'Agarre izquierdo: apoyo, acción o munición nueva' : 'Sin visor: E la que miras, o 1 a 0 y las dos teclas que siguen', 30, 288);
  tablero.needsUpdate = true;
}

/* ---------- Armas sobre la mesa ---------- */
const armas = ARMAS_MESA.map(id => crearArma(id, mundo));
const mjolnir = armas.find(a => a.id === 'mjolnir');
const ACOSTADA = new THREE.Quaternion().setFromAxisAngle(v3(0, 0, 1), Math.PI / 2);   // sobre su lado izquierdo, la ventana arriba
function acomodarEnMesa() {
  // ancho de cada una acostada (su alto) y su largo hacia atrás (culata), medidos en la pose acostada
  const medidas = armas.map(a => {
    a.soporte.position.set(0, 0, 0); a.soporte.quaternion.copy(ACOSTADA); a.cabeceo.position.set(0, 0, 0); a.cabeceo.rotation.set(0, 0, 0);
    a.soporte.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(a.modelo);
  });
  const hueco = 0.1, total = medidas.reduce((s, b) => s + (b.max.x - b.min.x), 0) + hueco * (armas.length - 1);
  let x = -total / 2;
  armas.forEach((a, i) => {
    const b = medidas[i], ancho = b.max.x - b.min.x;
    const pos = v3(x - b.min.x, MESA.alto + 0.003 - b.min.y, MESA.z0 - 0.06 - b.max.z);
    a.lugar = { pos, quat: ACOSTADA.clone() };
    a.soporte.position.copy(pos); a.soporte.quaternion.copy(ACOSTADA);
    // cartelito con el nombre, delante del arma
    const t = texturaCanvas(256, 64, (g, w, h) => { g.fillStyle = '#f1e6d0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a2a1c'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); g.fillStyle = '#2a1e12'; let tam = 30; do { g.font = `700 ${tam}px "Trebuchet MS", sans-serif`; tam--; } while (g.measureText(a.nombre).width > w - 16 && tam > 14); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(a.nombre, w / 2, h / 2 + 2); });
    const cartel = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.04), new THREE.MeshBasicMaterial({ map: t }));
    cartel.rotation.x = -Math.PI / 2 + 0.25; cartel.position.set(x + ancho / 2, MESA.alto + 0.012, MESA.z0 - 0.035); escena.add(cartel);
    x += ancho + hueco;
  });
}

/* ---------- Tomar y dejar ---------- */
function tomar(a, lado = 'right') {
  if (a.suelto) { efectos.quitarSuelto(a.suelto, false); a.suelto = null; }
  a.volviendo = null; a.tirado = false; a.volando = false; a.enMano = lado; manoDerecha = a;
  Audio_.recoger(); vibrar(lado, 0.5, 40);
  dibujarTablero();
}
function dejar(a, velocidad) {
  soltarIzquierda();
  if (velocidad && a.lanzar && a.lanzar(velocidad)) { a.enMano = null; if (manoDerecha === a) manoDerecha = null; dibujarTablero(); return; }
  a.gatillo(false); a.dosManos = false; a.enMano = null; if (manoDerecha === a) manoDerecha = null;
  const p = a.soporte.position;
  if (!velocidad || (sobreMesa(p.x, p.z, 0.15) && p.y < MESA.alto + 0.6)) volverAMesa(a);
  else {   // cae al piso y a los 1,2 s vuelve sola a la mesa
    a.suelto = efectos.soltar(a.soporte, velocidad.clone(), v3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4), 'arma', 0.03, Infinity);
    a.suelto.sonido = f => Audio_.casquillo('cargador', 'asfalto', f);
    a.suelto.alPosarse = () => { setTimeout(() => { if (!a.enMano && a.suelto) { efectos.quitarSuelto(a.suelto, false); a.suelto = null; volverAMesa(a); } }, 1200); };
  }
  dibujarTablero();
}
function volverAMesa(a, ya = false) {
  a.cabeceo.position.set(0, 0, 0); a.cabeceo.rotation.set(0, 0, 0); a.tirado = false; a.volando = false;
  if (ya) { a.volviendo = null; a.soporte.position.copy(a.lugar.pos); a.soporte.quaternion.copy(a.lugar.quat); return; }
  a.volviendo = { desde: a.soporte.position.clone(), qDesde: a.soporte.quaternion.clone(), t0: performance.now(), dura: 350 };
}
function actualizarMesa(ahora) {
  for (const a of armas) if (a.volviendo) {
    const v = a.volviendo, t = Math.min(1, (ahora - v.t0) / v.dura), s = t * t * (3 - 2 * t);
    a.soporte.position.lerpVectors(v.desde, a.lugar.pos, s); a.soporte.quaternion.slerpQuaternions(v.qDesde, a.lugar.quat, s);
    if (t >= 1) a.volviendo = null;
  }
}
// El arma de la mesa que cruza un rayo (la cruz sin visor o el rayo del mando), a menos de `alcance` metros
function armaApuntada(origen, dir, alcance = 3) {   // contra las piezas de cada arma (las cajas de las armas largas se pisan)
  const r = new THREE.Raycaster(origen, dir.clone().normalize(), 0, alcance); let mejor = null, dmin = Infinity;
  for (const x of armas) { if (x.enMano || x.volando) continue; const h = r.intersectObject(x.modelo, true)[0]; if (h && h.distance < dmin) { dmin = h.distance; mejor = x; } }
  return mejor;
}
// El arma más cerca de la mano (a menos de 12 cm de su caja, o 18 cm de su empuñadura)
function armaCerca(p) {
  let mejor = null, dmin = Infinity;
  for (const a of armas) {
    if (a.enMano || a.volando) continue;
    const caja = new THREE.Box3().setFromObject(a.modelo), d = Math.min(caja.distanceToPoint(p) + 0.06, a.soporte.position.distanceTo(p));
    if (d < 0.18 && d < dmin) { dmin = d; mejor = a; }
  }
  return mejor;
}

/* ---------- Visor: mandos ---------- */
const fabrica = new XRControllerModelFactory();
const manos = { right: null, left: null };
const previos = { right: [], left: [] };
const velMano = { right: v3(), left: v3() }, posPrevia = { right: null, left: null };
for (let i = 0; i < 2; i++) {
  const rayoXR = renderer.xr.getController(i), agarre = renderer.xr.getControllerGrip(i);
  jugador.add(rayoXR); jugador.add(agarre);
  const modeloMando = fabrica.createControllerModel(agarre); agarre.add(modeloMando);
  rayoXR.addEventListener('connected', ev => { manos[ev.data.handedness] = { rayo: rayoXR, agarre, fuente: ev.data, modeloMando }; });
  rayoXR.addEventListener('disconnected', () => { for (const k of ['right', 'left']) if (manos[k] && manos[k].rayo === rayoXR) manos[k] = null; });
}
function vibrar(lado, fuerza, ms) {
  const m = manos[lado], h = m && m.fuente.gamepad && m.fuente.gamepad.hapticActuators && m.fuente.gamepad.hapticActuators[0];
  if (h && h.pulse) h.pulse(fuerza, ms);
}
const izquierda = { modo: null, item: null };
let esperarGatillo = false;   // tomó el arma con el gatillo: no tira hasta soltarlo y volver a apretar
// Con la mano derecha vacía, un rayo sale del mando: verde cuando señala un arma de la mesa
const puntero = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 1, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.5, depthWrite: false }));
puntero.visible = false; escena.add(puntero);
function mostrarPuntero(ver, o, d, objetivo) {
  puntero.visible = ver; if (!ver) return;
  const largo = objetivo ? Math.max(0.08, objetivo.soporte.position.distanceTo(o)) : 4;
  puntero.scale.set(1, largo, 1); puntero.position.copy(o).addScaledVector(d, largo / 2); puntero.quaternion.setFromUnitVectors(v3(0, 1, 0), d);
  puntero.material.color.set(objetivo ? 0x7dff4a : 0xffd27a); puntero.material.opacity = objetivo ? 0.9 : 0.45;
}   // modo: 'accion' | 'apoyo'; item: munición en la mano
function soltarIzquierda() {
  const a = manoDerecha;
  if (izquierda.modo === 'accion' && a) a.soltarAccion();
  if (izquierda.modo === 'apoyo' && a) { a.dosManos = false; if (a.modoApoyo === 'bomba') a.soltarAccion(); }
  izquierda.modo = null;
  if (izquierda.item) {   // se le cae de la mano
    const o = izquierda.item.objeto, pos = v3(), q = new THREE.Quaternion(), s = v3();
    o.updateMatrixWorld(true); o.matrixWorld.decompose(pos, q, s); o.parent.remove(o);
    o.position.copy(pos); o.quaternion.copy(q); o.scale.copy(s);
    const sx = efectos.soltar(o, velMano.left.clone(), v3(0.5, 0.2, 1), izquierda.item.tipo === 'cargador' ? 'cargador' : 'vaina', izquierda.item.tipo === 'cargador' ? 0.012 : 0.01);
    sx.sonido = f => Audio_.casquillo(izquierda.item && izquierda.item.tipo === 'cargador' ? 'cargador' : 'bala', 'asfalto', f);
    izquierda.item = null;
  }
}
// La munición nueva en la mano: el mismo cuerpo del arma, agarrado por donde lo agarra la mano de verdad
function municionEnMano(m, agarreMano) {
  const o = new THREE.Group(); o.add(m.cuerpo); o.scale.setScalar(A_METROS);
  o.rotation.set(0, Math.PI / 2, 0);   // como en el arma: su x (hacia la boca) adelante de la mano
  const tomaEn = m.agarre || v3(calibreDe(manoDerecha.id).vaina * 0.35, 0, 0);
  o.position.copy(tomaEn.clone().multiplyScalar(A_METROS).applyAxisAngle(v3(0, 1, 0), Math.PI / 2)).negate();
  agarreMano.add(o);
  return { ...m, objeto: o };
}
function entradaVisor(ahora, dt) {
  const der = manos.right, izq = manos.left;
  const leer = m => (m && m.fuente.gamepad ? m.fuente.gamepad.buttons : []).map(b => !!(b && b.pressed));
  const ahoraB = { right: leer(der), left: leer(izq) }, antes = { right: previos.right, left: previos.left };
  previos.right = ahoraB.right; previos.left = ahoraB.left;
  const boton = (lado, i) => !!ahoraB[lado][i], apreto = (lado, i) => !!ahoraB[lado][i] && !antes[lado][i], solto = (lado, i) => !ahoraB[lado][i] && !!antes[lado][i];
  for (const lado of ['right', 'left']) {   // velocidad de cada mano (para tirar lo que suelta)
    const m = manos[lado]; if (!m) continue;
    const p = m.agarre.getWorldPosition(v3());
    if (posPrevia[lado] && dt > 0) velMano[lado].lerp(p.clone().sub(posPrevia[lado]).divideScalar(dt), 0.5);
    posPrevia[lado] = p;
  }
  let pI = izq ? izq.agarre.getWorldPosition(v3()) : null;
  if (der) {
    const pA = der.agarre.getWorldPosition(v3()), qR = der.rayo.getWorldQuaternion(new THREE.Quaternion());
    der.modeloMando.visible = !manoDerecha;
    const pR = der.rayo.getWorldPosition(v3()), dR = v3(0, 0, -1).applyQuaternion(qR);
    const senalada = manoDerecha ? null : (armaApuntada(pR, dR, 4) || armaCerca(pA));
    mostrarPuntero(!manoDerecha, pR, dR, senalada);
    if (manoDerecha) { if (apreto('right', 1)) dejar(manoDerecha, velMano.right); }
    else if (apreto('right', 1) || apreto('right', 0)) {   // la mano vacía toma con el agarre o con el gatillo
      if (senalada) { tomar(senalada); esperarGatillo = boton('right', 0); }
      else if (apreto('right', 1) && mjolnir && mjolnir.tirado) mjolnir.llamar(() => der.agarre.getWorldPosition(v3()));
    }
    const a = manoDerecha;
    if (a) {
      a.soporte.position.copy(pA); a.soporte.quaternion.copy(a.agarreMano ? der.agarre.getWorldQuaternion(new THREE.Quaternion()) : qR);
      if (a.dosManos && a.modoApoyo !== 'estabiliza' && pI) a.soporte.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(pA, pI, v3(0, 1, 0).applyQuaternion(qR)));
      a.apuntarA = null;
      if (esperarGatillo && !boton('right', 0)) esperarGatillo = false;
      a.gatillo(boton('right', 0) && !esperarGatillo);
      if (apreto('right', 4)) a.botonA();
      if (apreto('right', 5)) a.botonB(ahora);
    }
    const ex = der.fuente.gamepad ? der.fuente.gamepad.axes[2] || 0 : 0;   // palanca derecha: girar de a 30°
    if (Math.abs(ex) > 0.7 && !girando) { girando = true; girar(-Math.sign(ex) * Math.PI / 6); } else if (Math.abs(ex) < 0.3) girando = false;
  }
  if (izq) {
    const a = manoDerecha;
    if (a) a.soporte.updateMatrixWorld(true);
    if (apreto('left', 1) && a) {
      const zonas = a.zonas(), cerca = t => zonas.find(z => z.tipo === t && z.punto.distanceTo(pI) < z.radio);
      if (cerca('accion')) { izquierda.modo = 'accion'; a.agarrarAccion(pI); }
      else if (cerca('apoyo')) { izquierda.modo = 'apoyo'; a.dosManos = true; if (a.modoApoyo === 'bomba') a.agarrarAccion(pI); }
      else { const m = a.municionParaMano(); if (m) { izquierda.item = municionEnMano(m, izq.agarre); vibrar('left', 0.3, 30); } }
    }
    if (boton('left', 1) && a) {
      if (izquierda.modo === 'accion' || (izquierda.modo === 'apoyo' && a.modoApoyo === 'bomba')) a.moverAccion(pI);
      if (izquierda.item) { izquierda.item.objeto.updateMatrixWorld(true); if (a.probarCarga(izquierda.item)) { izquierda.item.objeto.parent.remove(izquierda.item.objeto); izquierda.item = null; } }
    }
    if (solto('left', 1)) soltarIzquierda();
    const gp = izq.fuente.gamepad, mx = gp ? gp.axes[2] || 0 : 0, mz = gp ? gp.axes[3] || 0 : 0;   // palanca izquierda: caminar
    if (Math.hypot(mx, mz) > 0.15) caminar(mx, mz, dt);
  }
}
let girando = false;
function girar(angulo) {   // gira el «jugador» alrededor de la cabeza
  const cabeza = camara.getWorldPosition(v3());
  jugador.position.sub(cabeza).applyAxisAngle(v3(0, 1, 0), angulo).add(cabeza);
  jugador.rotation.y += angulo;
}
function caminar(x, z, dt) {
  const adelante = camara.getWorldDirection(v3()); adelante.y = 0; adelante.normalize();
  const derecha = v3(-adelante.z, 0, adelante.x);
  jugador.position.addScaledVector(adelante, -z * 2.2 * dt).addScaledVector(derecha, x * 2.2 * dt);
  jugador.position.x = limitar(jugador.position.x, -11.5, 11.5); jugador.position.z = limitar(jugador.position.z, -90, 4.5);
}

/* ---------- Sin visor: mouse y teclado ---------- */
const escritorio = { activo: false, guinada: 0, cabeceo: 0, teclas: new Set(), mira: 0, apuntando: false };
const desdeCamara = (x, y, z) => camara.localToWorld(v3(x, y, z));
// Lo que tapa la cruz del centro (el escenario o el zombie): ahí van las balas de cadera y lo que se tira
function blancoCentro() {
  const r = new THREE.Raycaster(camara.getWorldPosition(v3()), camara.getWorldDirection(v3()), 0.1, 120);
  const h = r.intersectObjects([...objetos.map(o => o.malla), ...(zombie.estado === 'cae' || zombie.estado === 'muerto' ? [] : zombie.zonas)], false)[0];
  return h ? h.point : desdeCamara(0, 0, -60);
}
const tiroHacia = (a, rapidez, sube) => blancoCentro().sub(a.soporte.position).normalize().multiplyScalar(rapidez).add(v3(0, sube, 0));
function entradaEscritorio(ahora, dt) {
  jugador.rotation.y = escritorio.guinada; camara.rotation.set(escritorio.cabeceo, 0, 0); camara.position.y = 1.65;
  const k = escritorio.teclas, mx = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0), mz = (k.has('KeyS') ? 1 : 0) - (k.has('KeyW') ? 1 : 0);
  if (mx || mz) caminar(mx, mz, dt);
  camara.updateMatrixWorld(true);
  const a = manoDerecha; if (!a) return;
  if (a.agarreMano) {   // hoja, martillo o granada: a la derecha, hacia adelante; el clic da un golpe de derecha a izquierda
    const t = escritorio.golpe ? (performance.now() - escritorio.golpe) / 280 : 1, s = t < 1 ? t * t * (3 - 2 * t) : 0, golpe = t < 1;
    a.soporte.position.copy(desdeCamara(golpe ? 0.3 - 0.6 * s : 0.24, golpe ? 0.08 - 0.4 * s : -0.22, -0.45));
    a.soporte.quaternion.copy(camara.getWorldQuaternion(new THREE.Quaternion())).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(golpe ? 0.5 - 1.1 * s : 0.55, golpe ? -1.0 + 2.0 * s : -0.25, golpe ? 0.3 : 0, 'YXZ')));
    if (t >= 1) escritorio.golpe = 0;
    document.getElementById('mira').style.display = 'block';
    return;
  }
  // A la cadera la bala va de la boca a lo que mira el centro de la pantalla; con las miras, por la línea de mira
  escritorio.mira = limitar(escritorio.mira + (escritorio.apuntando && (a.mira || a.telescopica) ? 1 : -1) * dt / 0.16, 0, 1);
  const blanco = blancoCentro();
  const corta = a.datos.categoria === 'pistola';
  // pose a la cadera
  a.soporte.position.copy(desdeCamara(corta ? 0.14 : 0.16, corta ? -0.2 : -0.25, corta ? -0.42 : -0.46));
  a.soporte.lookAt(blanco); a.soporte.rotateY(Math.PI);
  const pCadera = a.soporte.position.clone(), qCadera = a.soporte.quaternion.clone();
  // pose con las miras: la línea de mira pasa por el ojo, a la distancia de cada arma
  a.soporte.quaternion.copy(camara.getWorldQuaternion(new THREE.Quaternion())); a.soporte.position.set(0, 0, 0); a.cabeceo.rotation.set(0, 0, 0); a.cabeceo.position.set(0, 0, 0);
  a.soporte.updateMatrixWorld(true);
  if (!a.mira && !a.telescopica) { a.soporte.position.copy(pCadera); a.soporte.quaternion.copy(qCadera); a.apuntarA = blanco; document.getElementById('mira').style.display = 'block'; return; }   // sin miras: solo a la cadera
  const t = a.telescopica, refA = t ? v3(t.ocular, t.eje, 0) : a.mira.alza, refB = t ? v3(t.ocular + 10, t.eje, 0) : a.mira.poste;
  const sDir = a.mundoDe(refB).sub(a.mundoDe(refA)).normalize(), fwd = camara.getWorldDirection(v3());
  a.soporte.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(sDir, fwd)); a.soporte.updateMatrixWorld(true);
  const ojo = camara.getWorldPosition(v3()), dist = t ? 0.065 : corta ? 0.5 : 0.24;
  a.soporte.position.copy(ojo.clone().addScaledVector(fwd, dist).sub(a.mundoDe(refA)));
  const pMira = a.soporte.position.clone(), qMira = a.soporte.quaternion.clone();
  const s = escritorio.mira * escritorio.mira * (3 - 2 * escritorio.mira);
  a.soporte.position.lerpVectors(pCadera, pMira, s); a.soporte.quaternion.slerpQuaternions(qCadera, qMira, s);
  a.apuntarA = s < 0.5 ? blanco : null;
  document.getElementById('mira').style.display = s > 0.5 ? 'none' : 'block';
}
function tomarEscritorio(a) { if (manoDerecha) dejar(manoDerecha); tomar(a); }
renderer.domElement.addEventListener('mousedown', ev => {
  if (!escritorio.activo) return;
  if (document.pointerLockElement !== renderer.domElement) { renderer.domElement.requestPointerLock(); return; }
  const a = manoDerecha;
  if (ev.button === 0 && a) { if (a.def.mecanica === 'cuerpo') escritorio.golpe = performance.now(); else a.gatillo(true); }
  if (ev.button === 2) { if (a && a.id === 'mjolnir') tirarMjolnir(); else if (!a && mjolnir.tirado) mjolnir.llamar(() => desdeCamara(0.24, -0.22, -0.45)); else escritorio.apuntando = true; }
});
addEventListener('mouseup', ev => {
  if (!escritorio.activo) return;
  const a = manoDerecha;
  if (ev.button === 0 && a) { if (a.id === 'granadas' && a.armada) dejar(a, tiroHacia(a, 5.5, 2.2)); else a.gatillo(false); }
  if (ev.button === 2) escritorio.apuntando = false;
});
function tirarMjolnir() { dejar(mjolnir, tiroHacia(mjolnir, 8, 0.4)); }
addEventListener('contextmenu', ev => { if (escritorio.activo) ev.preventDefault(); });
addEventListener('mousemove', ev => { if (!escritorio.activo || document.pointerLockElement !== renderer.domElement) return; escritorio.guinada -= ev.movementX * 0.0022; escritorio.cabeceo = limitar(escritorio.cabeceo - ev.movementY * 0.0022, -1.3, 1.3); });
addEventListener('keydown', ev => {
  if (!escritorio.activo) return;
  escritorio.teclas.add(ev.code);
  const a = manoDerecha, ahora = performance.now();
  if (ev.code === 'KeyR' && a) a.recargaEscritorio(ahora);
  if (ev.code === 'KeyB' && a) a.botonB(ahora);
  if (ev.code === 'KeyQ' && a) dejar(a);
  if (ev.code === 'KeyE') {   // toma el arma de la mesa que mira la cruz, a menos de 3 m
    const mejor = armaApuntada(camara.getWorldPosition(v3()), camara.getWorldDirection(v3()), 3);
    if (mejor) tomarEscritorio(mejor);
  }
  // 1 a 9, 0 y las dos teclas que siguen (código físico: sirve con cualquier distribución de teclado)
  const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'].indexOf(ev.code);
  if (n >= 0 && armas[n] && !armas[n].enMano) tomarEscritorio(armas[n]);
});
addEventListener('keyup', ev => escritorio.teclas.delete(ev.code));

/* ---------- Proyectiles, explosiones y golpes de hoja ---------- */
// p: { objeto, vel, gravedad, empuje, velMax, vida, mecha (ms), rebota, gira, orientar, estela, enEscena, alChocar(h) → false sigue, alExplotar(pos) }
function actualizarProyectiles(ahora, dt) {
  const mallas = [...objetos.map(o => o.malla), ...zombie.zonas];
  for (let i = proyectiles.length - 1; i >= 0; i--) {
    const p = proyectiles[i], o = p.objeto;
    p.edad += dt;
    if (p.mecha && ahora >= p.mecha) { proyectiles.splice(i, 1); const pos = o.position.clone(); if (!p.enEscena) escena.remove(o); if (p.alExplotar) p.alExplotar(pos); continue; }
    if (p.edad > (p.vida || 8)) { proyectiles.splice(i, 1); if (!p.enEscena) escena.remove(o); continue; }
    if (p.quieto) continue;
    const antes = o.position.clone();
    if (p.empuje) { const v = p.vel.length(); if (v < p.velMax) p.vel.multiplyScalar(Math.min(p.velMax, v + p.empuje * dt) / v); }
    p.vel.y -= (p.gravedad || 0) * dt;
    o.position.addScaledVector(p.vel, dt);
    if (p.gira) { o.rotateX(p.gira.x * dt); o.rotateY(p.gira.y * dt); o.rotateZ(p.gira.z * dt); }
    if (p.orientar) o.lookAt(o.position.clone().add(p.vel));
    if (p.estela) efectos.estela(antes);
    const d = o.position.clone().sub(antes), largo = d.length(); if (largo < 1e-5) continue;
    rayo.set(antes, d.clone().normalize()); rayo.far = largo + 0.03;
    const h = rayo.intersectObjects(mallas, false).find(x => !(x.object.userData.zombie && (zombie.estado === 'cae' || zombie.estado === 'muerto')) && !(p.yaPego && p.yaPego.has(x.object)));
    if (!h) continue;
    const esZombie = !!h.object.userData.zombie, golpe = { punto: h.point.clone(), dir: d.clone().normalize(), zombie: esZombie, zona: esZombie ? h.object : null };
    if (p.rebota && !esZombie) {   // la granada rebota y se queda quieta
      const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : v3(0, 1, 0);
      p.vel.reflect(n).multiplyScalar(0.38); o.position.copy(h.point).addScaledVector(n, 0.04);
      if (p.vel.length() > 1) Audio_.casquillo('cargador', 'asfalto', Math.min(1, p.vel.length() / 5)); else { p.vel.set(0, 0, 0); p.quieto = true; if (p.gira) p.gira.set(0, 0, 0); }
      continue;
    }
    const parar = p.alChocar ? p.alChocar(golpe) : true;
    if (parar === false) { (p.yaPego || (p.yaPego = new Set())).add(h.object); continue; }
    proyectiles.splice(i, 1);
    if (!p.enEscena) escena.remove(o); else o.position.copy(h.point).addScaledVector(golpe.dir, -0.06);
  }
}
function explotar(pos, radio) {
  efectos.explosion(pos, radio); Audio_.explosion();
  const dj = camara.getWorldPosition(v3()).distanceTo(pos);
  if (dj < radio * 4) { const f = 1 - dj / (radio * 4); vibrar('right', f, 300); vibrar('left', f, 300); if (dj < radio) destello.material.opacity = Math.max(destello.material.opacity, 0.35); }
  const zc = zombie.grupo.position.clone().add(v3(0, 1, 0)), dz = zc.distanceTo(pos);
  if (dz < radio && zombie.estado !== 'cae' && zombie.estado !== 'muerto') { zombie.recibir({ punto: zc, dir: zc.clone().sub(pos).setY(0.3).normalize(), dano: 40 * (1 - dz / radio) + 6, tipo: 'explosion' }); marcador.impactos++; }
  for (const b of blancos) if (b.tipo === 'zombie' && b.caida === 0 && b.grupo.position.distanceTo(pos) < radio * 1.2) b.caida = 0.001;
  dibujarTablero();
}
// Golpe de hoja: cada punto de la hoja, del cuadro anterior a este, contra las zonas del zombie
function barrer(antes, ahora) {
  if (zombie.estado === 'cae' || zombie.estado === 'muerto') return null;
  for (let i = 0; i < ahora.length; i++) {
    const d = ahora[i].clone().sub(antes[i]), l = d.length(); if (l < 0.005) continue;
    rayo.set(antes[i], d.clone().normalize()); rayo.far = l + 0.03;
    const h = rayo.intersectObjects(zombie.zonas, false)[0];
    if (h) return { punto: h.point.clone(), dir: d.normalize(), zona: h.object, zombie: true };
  }
  return null;
}

/* ---------- Arranque ---------- */
const { acero } = galpon(); mesa(acero);
zombie = new Zombie(escena, efectos);
const destello = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color: 0x8a0000, transparent: true, opacity: 0, side: THREE.BackSide, depthTest: false }));
destello.renderOrder = 999; camara.add(destello);
function mordida() {   // el zombie alcanzó al jugador: vibran los dos mandos, se ve rojo y suena
  marcador.mordidas++; destello.material.opacity = 0.55; vibrar('right', 1, 220); vibrar('left', 1, 220); Audio_.jugadorHerido(); dibujarTablero();
}
// La mesa lo frena: si se mete en ella (con 30 cm de margen), sale por el lado más cercano
function zombieFueraDeLaMesa() {
  const p = zombie.grupo.position, m = 0.3;
  if (!sobreMesa(p.x, p.z, m)) return;
  const salidas = [[p.x - (MESA.x0 - m), 'x', MESA.x0 - m], [(MESA.x1 + m) - p.x, 'x', MESA.x1 + m], [p.z - (MESA.z1 - m), 'z', MESA.z1 - m], [(MESA.z0 + m) - p.z, 'z', MESA.z0 + m]];
  const [, eje, valor] = salidas.sort((a, b) => a[0] - b[0])[0]; p[eje] = valor;
}
blancoPapel(-2, -10); blancoPapel(2, -25); blancoPapel(-2, -50); zombieCarton(0, -17);
const cartel = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.36), new THREE.MeshBasicMaterial({ map: tablero }));
cartel.position.set(0, 1.95, MESA.z1 - 0.3); cartel.rotation.x = 0.18; escena.add(cartel);
acomodarEnMesa();
for (const a of armas) a.alCambiar = () => { if (a === manoDerecha) dibujarTablero(); };
mjolnir.alVolver = a => { if (manoDerecha && manoDerecha !== a) dejar(manoDerecha); tomar(a); };
dibujarTablero();
jugador.position.set(0, 0, -0.02);

let previo = performance.now();
renderer.setAnimationLoop(() => {
  const ahora = performance.now(), dt = Math.min(0.05, (ahora - previo) / 1000); previo = ahora;
  if (renderer.xr.isPresenting) entradaVisor(ahora, dt); else if (escritorio.activo) entradaEscritorio(ahora, dt);
  for (const a of armas) { a.soporte.updateMatrixWorld(true); a.actualizar(ahora, dt); }
  actualizarMesa(ahora);
  actualizarProyectiles(ahora, dt);
  efectos.actualizar(ahora, dt);
  actualizarBlancos(ahora, dt);
  zombie.objetivo.copy(camara.getWorldPosition(v3()));
  const muertesAntes = zombie.muertes; zombie.actualizar(ahora, dt, mordida); zombieFueraDeLaMesa(); if (zombie.muertes !== muertesAntes) dibujarTablero();
  destello.material.opacity = Math.max(0, destello.material.opacity - dt * 1.4);
  if (manoDerecha && manoDerecha.camMira) manoDerecha.renderizarMira(renderer, escena);
  renderer.render(escena, camara);
});

const portada = document.getElementById('portada'), estado = document.getElementById('estado'), entrar = document.getElementById('entrar');
renderer.xr.addEventListener('sessionstart', () => { portada.classList.add('oculta'); jugador.position.set(0, 0, -0.02); jugador.rotation.y = 0; });
renderer.xr.addEventListener('sessionend', () => { portada.classList.remove('oculta'); puntero.visible = false; });
if (navigator.xr) {
  navigator.xr.isSessionSupported('immersive-vr').then(si => {
    entrar.disabled = !si;
    estado.textContent = si ? 'Listo: ponte el visor y entra.' : 'Este navegador no tiene realidad virtual: abre esta página en el navegador del Meta Quest.';
  }).catch(() => { estado.textContent = 'No se pudo consultar el visor.'; });
} else estado.textContent = 'Este navegador no tiene realidad virtual (WebXR): ábrela en el navegador del Meta Quest. Mientras, puedes probar sin visor.';
entrar.addEventListener('click', async () => {
  Audio_.activar(); Audio_.sinSilencioAutomatico(); Audio_.lugar('galpon');
  try {
    const sesion = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] });
    await renderer.xr.setSession(sesion);
  } catch (e) { estado.textContent = 'No se pudo entrar en realidad virtual: ' + e.message; }
});
document.getElementById('sin-visor').addEventListener('click', () => {
  Audio_.activar(); Audio_.lugar('galpon');
  escritorio.activo = true; portada.classList.add('oculta');
  document.getElementById('mira').style.display = 'block'; document.getElementById('pista').style.display = 'block';
  renderer.domElement.requestPointerLock();
});

// Para las pruebas automáticas (CDP): tomar, disparar, recargar, mirar y leer el estado
window.__campo = {
  armas, escritorio, escena, jugador, blancos, efectos, marcador, MESA, camara, get zombie() { return zombie; },
  get sueltos() { return efectos.sueltos; },
  get mano() { return manoDerecha; },
  empezar() { escritorio.activo = true; portada.classList.add('oculta'); document.getElementById('mira').style.display = 'block'; },
  mirar(guinada, cabeceo) { escritorio.guinada = guinada; escritorio.cabeceo = cabeceo; },
  tomar(id) { const a = armas.find(x => x.id === id); if (a) tomarEscritorio(a); return !!a; },
  dejar() { if (manoDerecha) dejar(manoDerecha); },
  apretar(si) { if (manoDerecha) manoDerecha.gatillo(si); },
  apuntar(si) { escritorio.apuntando = si; },
  recargar() { if (manoDerecha) manoDerecha.recargaEscritorio(performance.now()); },
  montar() { if (manoDerecha) manoDerecha.botonB(performance.now()); },
  // Adelanta la simulación del zombie sin dibujar (el Chrome de pruebas dibuja lento y el paso tiene tope)
  get proyectiles() { return proyectiles; },
  get izquierda() { return izquierda; },
  /* Mandos simulados para probar el código del visor (entradaVisor) sin entorno de realidad virtual:
   * estado = { right: { pos: [x, y, z] (rayo, en el marco del jugador), quat: [x, y, z, w], botones: [gatillo, agarre, , , A, B], ejes }, left: {...} }
   * El agarre va donde lo pone el mando Touch Plus: 5 cm atrás, 1,6 cm abajo y girado 45° respecto del rayo. */
  visorFalso(estado, pasos = 1) {
    const GRIP = { right: [0.99254, 0, 0.12187, 0, -0.086175, 0.70711, 0.70184, 0, -0.086175, -0.70711, 0.70184, 0, 0.0039798, -0.015858, 0.049642, 1],
      left: [0.99254, 0, -0.12187, 0, 0.08617, 0.70711, 0.70184, 0, 0.08617, -0.70711, 0.70184, 0, -0.0039798, -0.015858, 0.049642, 1] };
    for (const lado of ['right', 'left']) {
      const e = estado[lado]; if (!e) continue;
      if (!this._falsos) this._falsos = {};
      let m = this._falsos[lado];
      if (!m) { const rayo = new THREE.Group(), agarre = new THREE.Group(); jugador.add(rayo, agarre); m = this._falsos[lado] = { rayo, agarre, modeloMando: new THREE.Group(), fuente: { handedness: lado, gamepad: { buttons: Array.from({ length: 7 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0], hapticActuators: [] } } }; }
      manos[lado] = m;
      if (e.pos) m.rayo.position.set(...e.pos); if (e.quat) m.rayo.quaternion.set(...e.quat);
      new THREE.Matrix4().compose(m.rayo.position, m.rayo.quaternion, v3(1, 1, 1)).multiply(new THREE.Matrix4().fromArray(GRIP[lado])).decompose(m.agarre.position, m.agarre.quaternion, v3());
      if (e.botones) e.botones.forEach((b, i) => { m.fuente.gamepad.buttons[i].pressed = !!b; m.fuente.gamepad.buttons[i].value = b ? 1 : 0; });
      if (e.ejes) m.fuente.gamepad.axes = e.ejes;
    }
    for (let k = 0; k < pasos; k++) { const t = performance.now(); jugador.updateMatrixWorld(true); entradaVisor(t, 0.016); for (const a of armas) { a.soporte.updateMatrixWorld(true); a.actualizar(t, 0.016); } }
    return { mano: manoDerecha && manoDerecha.id, puntero: puntero.visible, verde: puntero.material.color.getHex() === 0x7dff4a };
  },
  get info() { return { llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles }; },
  golpe() { escritorio.golpe = performance.now(); },
  tirar() { if (manoDerecha && manoDerecha.id === 'mjolnir') tirarMjolnir(); else if (manoDerecha && manoDerecha.id === 'granadas') { manoDerecha.gatillo(true); dejar(manoDerecha, tiroHacia(manoDerecha, 5.5, 2.2)); } },
  llamar() { if (mjolnir.tirado) mjolnir.llamar(() => desdeCamara(0.24, -0.22, -0.45)); },
  avanzar(seg, paso = 0.02) { let t = performance.now(); for (let k = 0; k < seg / paso; k++) { t += paso * 1000; zombie.objetivo.copy(camara.getWorldPosition(v3())); zombie.actualizar(t, paso, mordida); zombieFueraDeLaMesa(); } },
};
