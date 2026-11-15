/* ===== Zona Muerta VR: el campo de pruebas en primera persona (Meta Quest, WebXR) =====
 * El galpón del campo de pruebas con una mesa larga delante de la línea de tiro y, sobre ella, armas del juego pasadas
 * a 3D (vr/modelo3d.js) que funcionan como de verdad (vr/armas-vr.js, vr/especiales.js).
 * Modos (vr/modos.js), elegidos en un menú que aparece al empezar y se abre cuando quieras (Y en el mando izquierdo,
 * M sin visor), que pausa el juego: Entrenamiento (blancos de chapa que suben, vr/blancos.js), Ataque zombie (zombies
 * que vienen caminando y rodean la mesa, vr/zombie3d.js) y Libre (blancos de papel a 10, 25 y 50 m, un zombie de
 * cartón a 17 m y el menú para aparecer zombies y blancos). El menú también tiene la configuración (sonido,
 * vibración, giro, velocidad al caminar, altura y mouse), que se guarda en el navegador.
 * En el visor: agarre derecho cerca de un arma de la mesa la toma; otra vez el agarre la deja (sobre la mesa vuelve a
 * su lugar; lejos, cae y vuelve sola). Gatillo dispara; A suelta el cargador; B monta. Con la mano izquierda: agarre
 * en el guardamanos sostiene con las dos manos (en la escopeta es la bomba); en la corredera, la manija o el cerrojo
 * los lleva atrás; lejos del arma saca munición nueva, que entra al acercarla al pozo, al portillo o a la ventana.
 * Palanca izquierda camina y la derecha gira. En la muñeca izquierda, un reloj con la vida y los puntos.
 * Sin visor: mouse apunta, clic dispara, clic derecho apunta con las miras, E toma el arma que se mira, Q la deja,
 * números la toman directo, R recarga, B monta, WASD camina, M el menú. Para las pruebas automáticas: window.__campo. */
import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { A_METROS } from './armas-vr.js';
import { crearArma } from './especiales.js';
import { ARMAS_PARED } from './armas-todas.js';
import { colgarEnPared } from './armero.js';
import { crearMano } from './mano3d.js';
import { Efectos, texturaCanvas } from './efectos.js';
import { prepararZombies, asegurarTipos, tipoListo, Horda, moldeInfo, TIPOS } from './zombie3d.js';
import { Emergentes } from './blancos.js';
import { crearAnimal, asegurarAnimales, animalListo, ESPECIES } from './animales3d.js';
import { Menu } from './menu.js';
import { Modos } from './modos.js';
import { fusionar, grabarArma, caja } from './modelo3d.js';

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
/* ---------- Configuración (se guarda en el navegador; la cambia el menú) ---------- */
const CONFIG_CLAVE = 'zonaMuerta.vr.config';
const config = { general: 0.9, efectos: 0.85, silencio: false, vibracion: true, giro: '30', caminar: 'normal', altura: 'pie', mouse: 1 };
try { Object.assign(config, JSON.parse(localStorage.getItem(CONFIG_CLAVE)) || {}); } catch (e) { /* sin almacenamiento: valores de fábrica */ }
function aplicarConfig() {
  Audio_.volumenes({ general: config.general, efectos: config.efectos, silencio: config.silencio });
  jugador.position.y = renderer.xr.isPresenting && config.altura === 'sentado' ? 0.4 : 0;   // sentado: el piso baja 40 cm
}
function cambiarConfig(clave, valor) {
  config[clave] = valor;
  try { localStorage.setItem(CONFIG_CLAVE, JSON.stringify(config)); } catch (e) { /* sin almacenamiento: dura la sesión */ }
  aplicarConfig();
}
/* ---------- Como app del Quest: directo al visor ----------
 * Instalada desde el APK (quest/, Bubblewrap de Meta), la página abre con ?pwa=1 (el start_url de vr/manifest.webmanifest)
 * y entra al visor apenas abre, como pide Meta: tocar el ícono de la app vale como el gesto que exige el navegador. La
 * sesión la pide vr/index.html antes de bajar los scripts (el permiso del gesto dura poco) y acá se conecta ya; mientras
 * se arman las armas y los zombies, el visor muestra su pantalla de carga, y al final se ubica al jugador y se abre el
 * menú (alEntrarVisor). Si no se pudo, queda la portada con «Entrar». */
const OPCIONES_XR = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] };
if (window.__sesionApp) window.__sesionApp.then(async sesion => {
  if (!sesion) return;
  try { Audio_.activar(); Audio_.sinSilencioAutomatico(); Audio_.lugar('galpon'); } catch (e) { /* el audio arranca con el primer gatillo */ }
  try { await renderer.xr.setSession(sesion); } catch (e) { console.warn('No se pudo conectar la sesión de la app:', e); }
});
const ruido = (g, w, h, n, colores) => { for (let k = 0; k < n; k++) { g.fillStyle = colores[k % colores.length]; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };

/* ---------- El galpón (como el del campo de pruebas: chapa gris azulada, columnas y el poste con bandas) ---------- */
const objetos = [];                                      // lo que la bala puede tocar: { malla, tipo, activo }
const mallasObjetos = () => { const out = []; for (const o of objetos) if (o.activo !== false) out.push(o.malla); return out; };
const blancosFijos = [];                                 // los de papel y el zombie de cartón (el escenario del modo libre)
const escenarioLibre = [];                               // { grupo, entradas de objetos }: se esconden en los otros modos
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
  const grupo = new THREE.Group(); grupo.position.set(x, 0, z); escena.add(grupo); const desde = objetos.length;
  const madera = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.85 });
  for (const px of [-0.36, 0.36]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.9, 0.05), madera); p.position.set(px, 0.95, 0); grupo.add(p); objetos.push({ malla: p, tipo: 'madera' }); }
  const hoja = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.93), new THREE.MeshStandardMaterial({ map: papel, roughness: 0.95, side: THREE.DoubleSide }));
  hoja.position.set(0, 1.35, 0); grupo.add(hoja);
  const b = { tipo: 'papel', malla: hoja, grupo, agujeros: [], impactos: 0 };
  objetos.push(b); blancosFijos.push(b); escenarioLibre.push({ grupo, entradas: objetos.slice(desde) });
}
function zombieCarton(x, z) {
  const grupo = new THREE.Group(); grupo.position.set(x, 0, z); escena.add(grupo); const desde = objetos.length;
  const geo = new THREE.PlaneGeometry(0.9, 1.8); geo.translate(0, 0.9, 0);
  const silueta = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: carton, alphaTest: 0.5, roughness: 0.9, side: THREE.DoubleSide }));
  grupo.add(silueta);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.4), new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.6 })); base.position.y = 0.04; grupo.add(base);
  const b = { tipo: 'zombie', malla: silueta, grupo, agujeros: [], impactos: 0, vida: 6, caida: 0, caidoEn: -1 };
  objetos.push(b); blancosFijos.push(b); escenarioLibre.push({ grupo, entradas: objetos.slice(desde) });
}

/* ---------- Efectos, mundo para las armas e impactos ---------- */
const efectos = new Efectos(escena, superficie);
const rayo = new THREE.Raycaster();
const marcador = { disparos: 0, impactos: 0, mordidas: 0 };
const proyectiles = [];
const mundo = {
  escena, efectos, disparo: (o, d, golpe) => impacto(o, d, golpe), vibrar: (lado, f, ms) => vibrar(lado, f, ms),
  lanzar: p => { if (!p.objeto.parent) escena.add(p.objeto); p.edad = 0; proyectiles.push(p); if (p.vel && !p.enemigo) esquivanPesado(p.objeto.position, p.vel.clone().normalize()); return p; },
  dejarDeLanzar: p => { const i = proyectiles.indexOf(p); if (i >= 0) proyectiles.splice(i, 1); },
  explotar: (pos, radio) => explotar(pos, radio),
  barrer: (antes, ahora) => barrer(antes, ahora),
  golpearZombie: (h, dano, tipo) => golpear(h, dano, tipo),
  mano: () => manos.right ? manos.right.agarre.getWorldPosition(v3()) : desdeCamara(0.24, -0.22, -0.45),
  ojo: () => camara.getWorldPosition(v3()), mirada: () => camara.getWorldDirection(v3()),
  zombiesEnTramo: (p0, p1, radio) => zombiesEnTramo(p0, p1, radio),
  golpearCuerpo: (z, dano, tipo, dir, punto) => golpearCuerpo(z, dano, tipo, dir, punto),
  zombiesCerca: (p, r) => horda.vivos.filter(z => !z.bajoTierra && z.grupo.position.distanceTo(p.clone().setY(z.grupo.position.y)) < r).sort((a, b) => a.grupo.position.distanceToSquared(p) - b.grupo.position.distanceToSquared(p)),
  blancosEn: (p, r) => { const n = emergentes.enRadio(p, r).length; if (n) { marcador.impactos += n; dibujarTablero(); } return n; },
  fuego: (p, r, dano) => fuego(p, r, dano),
  rayo: (p, callado = false) => { efectos.rayo(p); if (!callado) { Audio_.trueno(); vibrar('right', 1, 220); vibrar('left', 0.6, 220); } },   // callado: los rayos que siguen al primero
  volverAMesa: (a, ya) => volverAMesa(a, ya),
};
// La normal de lo que tocó un rayo, del lado de donde venía
function normalDe(h, dir) { const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : dir.clone().negate(); if (n.dot(dir) > 0) n.negate(); return n; }
// Golpe de hoja, martillo o rayo contra un zombie o un blanco que sube
function golpear(h, dano, tipo) {
  if (h.blanco) { if (emergentes.golpear(h.zona, h.punto, h.dir.clone().negate())) { marcador.impactos++; dibujarTablero(); } return null; }
  const z = h.zona && h.zona.userData.zombie; if (!z) return null;
  const murio = z.recibir({ punto: h.punto, dir: h.dir, dano, tipo, zona: h.zona }); efectos.impacto(h.punto, h.dir.clone().negate(), 'carne'); marcador.impactos++; dibujarTablero();
  return { zombie: z, murio };
}
// Lo que barre un tramo a ras del piso (la onda de Excalibur, la ola del Tridente): los zombies a menos de `radio` de él
function zombiesEnTramo(p0, p1, radio) {
  const dx = p1.x - p0.x, dz = p1.z - p0.z, L2 = dx * dx + dz * dz, fuera = [];
  for (const z of horda.vivos) {
    if (z.vuela || z.bajoTierra) continue;
    const g = z.grupo.position, t = L2 > 1e-9 ? limitar(((g.x - p0.x) * dx + (g.z - p0.z) * dz) / L2, 0, 1) : 0;
    if (Math.hypot(p0.x + dx * t - g.x, p0.z + dz * t - g.z) < radio + (z.especie === 'toro' ? 0.45 : 0.2)) fuera.push(z);
  }
  return fuera;
}
// Un golpe a un zombie entero (sin la zona que tocó una bala): en el pecho, o donde diga `punto`
function golpearCuerpo(z, dano, tipo, dir, punto) {
  const p = punto || z.grupo.position.clone().add(v3(0, z.clase === 'animal' ? 0.5 : 1.25 * z.grupo.scale.x, 0));
  const murio = z.recibir({ punto: p, dir, dano, tipo }); efectos.impacto(p, dir.clone().negate(), 'carne'); marcador.impactos++; dibujarTablero();
  return { zombie: z, murio };
}
// Llamas: prenden al zombie que tocan (también al que cae) y tiran el blanco que esté arriba
function fuego(p, r, dano) {
  const z = horda.zombies.find(q => !q.libre && q.cerca(p, r));
  if (z) { z.incendiar(3); z.recibir({ dano, tipo: 'fuego' }); return true; }
  return !!emergentes.tocar(p, r);
}
// El rabioso esquiva los tiros pesados (rifle, lanzagranadas, bazuca): si va por la línea del tiro, se corre de costado
function esquivanPesado(origen, dir) {
  for (const z of horda.vivos) {
    if (!z.T || !z.T.esquiva || Math.random() > z.T.esquiva) continue;
    const p = z.grupo.position.clone().setY(1), d = p.clone().sub(origen), a = d.dot(dir);
    if (a > 0 && d.clone().addScaledVector(dir, -a).length() < 0.7) { const lado = v3(dir.z, 0, -dir.x).normalize().multiplyScalar(Math.random() < 0.5 ? 1 : -1); z.grupo.position.addScaledVector(lado, 0.9); z.grupo.updateMatrixWorld(true); z.aturdido = 0; }
  }
}
function impacto(origen, dir, golpe) {
  if (golpe.primero) marcador.disparos++;
  const pesado = golpe.arma && ['rifle', 'lanzagranadas', 'bazuca'].includes(golpe.arma.datos.categoria);
  if (pesado && golpe.primero) esquivanPesado(origen, dir);
  rayo.set(origen, dir); rayo.far = 120;
  const golpes = rayo.intersectObjects([...mallasObjetos(), ...horda.zonas()], false);
  for (const h of golpes) {
    const z = h.object.userData.zombie;
    if (z) {   // un zombie: la zona que tocó decide el daño; la cabeza lo mata
      if (!z.vivo) continue;
      const normal = dir.clone().negate();
      if (h.object.userData.tipo === 'escudo') {   // las balas chicas paran en el escudo; el rifle lo atraviesa
        if (pesado) continue;
        z.recibir({ punto: h.point, dir, dano: golpe.dano, tipo: golpe.tipo, zona: h.object, arma: golpe.arma, tiro: golpe.tiro });
        golpe.arma.impactos++; dibujarTablero(); return h.point;
      }
      z.recibir({ punto: h.point, dir, dano: golpe.dano, tipo: golpe.tipo, zona: h.object, arma: golpe.arma, tiro: golpe.tiro });
      efectos.impacto(h.point, normal, 'carne', z.T && z.T.sangre); Audio_.impactoCarne();
      golpe.arma.impactos++; if (!golpe.tiro.impacto) { golpe.tiro.impacto = true; marcador.impactos++; }
      dibujarTablero();
      return h.point;
    }
    const o = objetos.find(x => x.malla === h.object);
    if (o.tipo === 'emergente') {   // blanco que sube: cae (acostado, la bala pasa por arriba)
      if (!emergentes.golpear(h.object, h.point, normalDe(h, dir))) continue;
      golpe.arma.impactos++; if (!golpe.tiro.impacto) { golpe.tiro.impacto = true; marcador.impactos++; }
      dibujarTablero();
      return h.point;
    }
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
  for (const b of blancosFijos) if (b.tipo === 'zombie') {   // se cae para atrás, y a los 3 s se levanta de nuevo
    if (b.caida > 0 && b.caida < 1) { b.caida = Math.min(1, b.caida + dt / 0.35); if (b.caida === 1) b.caidoEn = ahora; }
    if (b.caida === 1 && ahora - b.caidoEn > 3000) { b.caida = 0.999; b.levanta = true; }
    if (b.levanta) { b.caida -= dt / 0.6; if (b.caida <= 0) { b.caida = 0; b.levanta = false; b.impactos = 0; for (const a of b.agujeros) b.malla.remove(a); b.agujeros = []; } }
    b.malla.rotation.x = -Math.PI / 2 * (b.caida * b.caida);
  }
}

/* ---------- Tablero sobre la mesa, reloj de la muñeca (visor) y cartel de escritorio ---------- */
const tablero = texturaCanvas(800, 300, () => {});
let horda = null, emergentes = null, modos = null, menu = null;
let manoDerecha = null;   // el arma que tiene la mano derecha
function dibujarTablero() {
  if (!horda) return;
  const g = tablero.lienzo.getContext('2d'), w = 800, h = 300, H = modos && modos.hud(), ancho = w - 60;
  g.fillStyle = '#16131a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a96e'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = '#c9a96e'; g.font = '700 40px "Trebuchet MS", sans-serif'; g.textAlign = 'left';
  g.fillText(H ? H.titulo : manoDerecha ? manoDerecha.nombre.toUpperCase() : 'CAMPO DE PRUEBAS', 30, 62, ancho);
  g.fillStyle = '#f1e6d0'; g.font = '700 34px "Trebuchet MS", sans-serif';
  if (H) H.lineas.forEach((l, i) => g.fillText(l, 30, 120 + i * 46, ancho));
  else {
    g.fillText(`Disparos: ${marcador.disparos}`, 30, 120); g.fillText(`Impactos: ${marcador.impactos}`, 420, 120);
    g.fillText(`Precisión: ${marcador.disparos ? Math.min(100, Math.round(100 * marcador.impactos / marcador.disparos)) : 0} %`, 30, 166);
    g.fillText(`Zombies: ${horda.muertes} · a la cabeza: ${horda.cabezazos} · mordidas: ${marcador.mordidas}`, 30, 212, ancho);
  }
  g.font = '400 22px "Trebuchet MS", sans-serif'; g.fillStyle = 'rgba(241,230,208,0.75)';
  g.fillText(manoDerecha ? `${H ? manoDerecha.nombre + ' · ' : ''}Agarre derecho: dejarla · A: cargador · B: montar` : 'Toma un arma de la mesa: agarre derecho cerca o apuntándole', 30, 262, ancho);
  g.fillText('Y en el mando izquierdo (M sin visor): menú, pausa y configuración', 30, 288, ancho);
  tablero.needsUpdate = true;
  dibujarMuneca(H); hudEscritorio(H);
}
// El reloj de la muñeca izquierda: vida o puntos de un vistazo
const muneca = { tex: texturaCanvas(384, 192, () => {}) };
muneca.malla = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshBasicMaterial({ map: muneca.tex, transparent: true, toneMapped: false }));
// (va sobre el dorso de la muñeca de la mano izquierda: manoIzq.reloj)
function dibujarMuneca(H) {
  const g = muneca.tex.lienzo.getContext('2d');
  g.clearRect(0, 0, 384, 192); g.fillStyle = 'rgba(16,13,20,0.92)'; g.beginPath(); g.roundRect(4, 4, 376, 184, 22); g.fill();
  g.strokeStyle = '#c9a96e'; g.lineWidth = 5; g.stroke(); g.textAlign = 'center';
  if (H) {
    g.fillStyle = H.vida !== undefined && H.vida <= 30 ? '#ff6a5a' : '#f1e6d0'; g.font = '700 62px "Trebuchet MS", sans-serif'; g.fillText(H.corta[1], 192, 86, 350);
    g.fillStyle = '#c9a96e'; g.font = '700 32px "Trebuchet MS", sans-serif'; g.fillText(`${H.corta[0]} · ${H.corta[2]}`, 192, 132, 350);
    if (H.vida !== undefined) { g.fillStyle = 'rgba(241,230,208,0.15)'; g.fillRect(40, 150, 304, 16); g.fillStyle = H.vida <= 30 ? '#d8402a' : '#7dd35a'; g.fillRect(40, 150, 304 * H.vida / 100, 16); }
  } else {
    g.fillStyle = '#c9a96e'; g.font = '700 46px "Trebuchet MS", sans-serif'; g.fillText(modos && modos.modo === 'libre' ? 'MODO LIBRE' : 'ZONA MUERTA', 192, 92, 350);
    g.fillStyle = '#f1e6d0'; g.font = '400 30px "Trebuchet MS", sans-serif'; g.fillText('Y: menú', 192, 145);
  }
  muneca.tex.needsUpdate = true;
}
const hudDiv = document.getElementById('hud');
function hudEscritorio(H) { if (!hudDiv) return; hudDiv.style.display = escritorio.activo && H && !renderer.xr.isPresenting ? 'block' : 'none'; if (H) hudDiv.textContent = [H.titulo, ...H.lineas].join('\n'); }

/* ---------- Armas sobre la mesa ---------- */
const armas = ARMAS_MESA.map(id => crearArma(id, mundo));
// Las que se tiran y vuelven (Mjölnir, Égida, Gungnir): la que está tirada y todavía no viene (la Égida y Gungnir vuelven
// solas, pero también se las puede llamar antes)
const tirada = () => armas.find(a => a.llamar && a.tirado && !a.volviendoAMano);
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
function tomar(a, lado = 'right', atrapada = false) {
  if (a.suelto) { efectos.quitarSuelto(a.suelto, false); a.suelto = null; }
  if (a.a.pintarTextura) a.a.pintarTextura();
  a.volviendo = null; a.tirado = false; a.volando = false; a.enMano = lado; manoDerecha = a;
  // el ruido de sacar esa arma, como en el juego (la que vuelve volando a la mano ya sonó al atraparla); el machete del
  // cazador no hace ruido de arma: susurra
  if (a.id === 'macheteCazador') susurrar('sacar'); else if (!atrapada) Audio_.sacarArma(a.datos);
  vibrar(lado, 0.5, 40);
  dibujarTablero();
}
// El susurro del machete del cazador (js/armas-especiales.js): al tomarlo, y al pegar (4 de cada 10) o matar con él, con
// su tiempo de espera; dos no se pisan
const SUSURRO = { alSacar: 4000, entreGolpes: 8000, alPegar: 0.4 };
let susurroEn = -1e9;
function susurrar(motivo) {
  const ahora = performance.now(), espera = Math.max(Audio_.duracionSusurro() * 1000 + 300, motivo === 'sacar' ? SUSURRO.alSacar : SUSURRO.entreGolpes);
  if (ahora - susurroEn < espera) return;
  susurroEn = ahora; Audio_.susurroCazador();
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
  a.volviendo = { desde: a.soporte.position.clone(), qDesde: a.soporte.quaternion.clone(), t0: performance.now(), dura: 350 + 110 * Math.min(8, a.soporte.position.distanceTo(a.lugar.pos)) };
}
function actualizarMesa(ahora) {
  for (const a of armas) if (a.volviendo) {
    const v = a.volviendo, t = Math.min(1, (ahora - v.t0) / v.dura), s = t * t * (3 - 2 * t);
    a.soporte.position.lerpVectors(v.desde, a.lugar.pos, s); a.soporte.quaternion.slerpQuaternions(v.qDesde, a.lugar.quat, s);
    if (t >= 1) a.volviendo = null;
  }
}
// El arma de la mesa o de la pared que cruza un rayo (la cruz sin visor o el rayo del mando), a menos de `alcance`
// metros: desde la mesa se alcanza el armero de atrás (está a 5,5 m) sin caminar
const ALCANCE_TOMAR = 9;
function armaApuntada(origen, dir, alcance = ALCANCE_TOMAR) {   // contra las piezas de cada arma (las cajas de las armas largas se pisan)
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
// Las dos manos son las del sobreviviente (vr/mano3d.js), no los controles: guante, manga y dedos que siguen los botones
const manoIzq = crearMano('izquierda'), manoDer = crearMano('derecha');
manoIzq.reloj.add(muneca.malla);
// Los botones de un control: cuánto está apretado cada uno (0 a 1) y si el dedo lo toca
function botonesDe(m) {
  const b = m.fuente.gamepad ? m.fuente.gamepad.buttons : [];
  return { valor: i => b[i] ? (b[i].value ?? (b[i].pressed ? 1 : 0)) : 0, toca: i => !!(b[i] && (b[i].touched || b[i].pressed)) };
}
function posarManoIzquierda(izq, dt) {
  if (manoIzq.grupo.parent !== izq.agarre) izq.agarre.add(manoIzq.grupo);
  izq.modeloMando.visible = false;
  const { valor, toca } = botonesDe(izq);
  // agarre: medio, anular y meñique; gatillo: el índice (apenas lo roza, se acerca); el pulgar baja si toca la palanca o
  // los botones. Lo que sostiene (cargador, cartucho, guardamanos, cerrojo) cierra la mano entera
  const sostiene = !!(izquierda.modo || izquierda.item);
  manoIzq.posar({ agarre: sostiene ? 1 : valor(1), gatillo: sostiene ? 1 : Math.max(valor(0), toca(0) ? 0.3 : 0), pulgar: sostiene || [3, 4, 5, 6].some(toca) ? 1 : 0 }, dt);
}
// La derecha, vacía, como la izquierda. Con un arma va con el arma (sube con el retroceso y la sigue cuando la izquierda
// la apunta desde el guardamanos). Con una de fuego, la primera vez busca dónde agarrarla (vr/mano3d.js, agarrar: el mango
// adentro del puño y la yema del índice en el disparador) y el índice se dobla con el gatillo del control; con una hoja,
// un mango o la granada, el puño cerrado a lo largo del mango
const qRayo = new THREE.Quaternion(), qGrip = new THREE.Quaternion();
let agarreDer = null;   // lo que eligió la mano en el arma que tiene (para las pruebas)
// El punto del disparador (DEDO_GATILLO del 2D: cm, x hacia la boca, y hacia abajo), en el marco del cabeceo del arma.
// Se lee de la tabla: el dibujo de la minigun (js/armas-especiales.js) carga después de que js/armas-modelos-3.js le pasa
// el punto a cada dibujo, y el suyo queda sin dedoGatillo
function disparadorDe(a) {
  const d = (typeof DEDO_GATILLO !== 'undefined' && DEDO_GATILLO[a.id]) || (DIBUJO_ARMAS[a.id] && DIBUJO_ARMAS[a.id].dedoGatillo); if (!d) return null;
  a.modelo.updateMatrix(); return v3(d[0], -d[1], 0).applyMatrix4(a.modelo.matrix);
}
// El arma vista de costado: si un punto del marco del cabeceo cae dentro de los polígonos de su dibujo (cm, y abajo)
const siluetas = new Map();
function siluetaDe(a) {
  if (siluetas.has(a)) return siluetas.get(a);
  const polis = grabarArma(a.id).map(p => ({ formas: [p.pts, ...(p.huecos || [])], c: caja(p.pts) }));
  a.modelo.updateMatrix(); const e = a.modelo.matrix.clone().invert().elements;
  const dentro = (x, y, z) => {
    const px = e[0] * x + e[4] * y + e[8] * z + e[12], py = -(e[1] * x + e[5] * y + e[9] * z + e[13]);
    for (const p of polis) {
      if (px < p.c.x0 || px > p.c.x1 || py < p.c.y0 || py > p.c.y1) continue;
      let adentro = false;
      for (const f of p.formas) for (let i = 0, j = f.length - 1; i < f.length; j = i++) {
        const [xi, yi] = f[i], [xj, yj] = f[j];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) adentro = !adentro;
      }
      if (adentro) return true;
    }
    return false;
  };
  siluetas.set(a, dentro);
  return dentro;
}
function posarManoDerecha(der, dt) {
  der.modeloMando.visible = false;
  const { valor, toca } = botonesDe(der), a = manoDerecha;
  if (a) {
    const recien = manoDer.grupo.parent !== a.cabeceo;
    if (recien) a.cabeceo.add(manoDer.grupo);
    if (a.agarreMano) manoDer.colocar('mango');
    else manoDer.colocar('control', der.rayo.getWorldQuaternion(qRayo).invert().multiply(der.agarre.getWorldQuaternion(qGrip)));   // el grip visto desde el rayo
    if (recien) agarreDer = a.agarreMano ? manoDer.agarrar() : manoDer.agarrar(disparadorDe(a), siluetaDe(a));   // dónde la agarra y el índice al disparador
    manoDer.posar({ agarre: 1, gatillo: a.agarreMano ? 1 : valor(0), pulgar: 1, enGatillo: a.agarreMano ? 0 : 1 }, dt);
  } else {
    if (manoDer.grupo.parent !== der.agarre) { der.agarre.add(manoDer.grupo); manoDer.colocar('control'); manoDer.agarrar(); }
    manoDer.colocar('control');
    manoDer.posar({ agarre: valor(1), gatillo: Math.max(valor(0), toca(0) ? 0.3 : 0), pulgar: [3, 4, 5, 6].some(toca) ? 1 : 0, enGatillo: 0 }, dt);
  }
}
const previos = { right: [], left: [] };
const velMano = { right: v3(), left: v3() }, posPrevia = { right: null, left: null };
for (let i = 0; i < 2; i++) {
  const rayoXR = renderer.xr.getController(i), agarre = renderer.xr.getControllerGrip(i);
  jugador.add(rayoXR); jugador.add(agarre);
  const modeloMando = fabrica.createControllerModel(agarre); agarre.add(modeloMando);
  rayoXR.addEventListener('connected', ev => { manos[ev.data.handedness] = { rayo: rayoXR, agarre, fuente: ev.data, modeloMando }; });
  rayoXR.addEventListener('disconnected', () => {
    for (const k of ['right', 'left']) if (manos[k] && manos[k].rayo === rayoXR) {
      manos[k] = null;
      if (k === 'right' && manoDer.grupo.parent) manoDer.grupo.parent.remove(manoDer.grupo);   // al salir del visor no queda pegada al arma
    }
  });
}
function vibrar(lado, fuerza, ms) {
  if (!config.vibracion) return;
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
// El arma de la mano derecha sigue al mando (con las dos manos, apunta hacia la izquierda)
function posarArma(der, pI) {
  const a = manoDerecha, pA = der.agarre.getWorldPosition(v3()), qR = der.rayo.getWorldQuaternion(new THREE.Quaternion());
  a.soporte.position.copy(pA); a.soporte.quaternion.copy(a.agarreMano ? der.agarre.getWorldQuaternion(new THREE.Quaternion()) : qR);
  if (a.dosManos && a.modoApoyo !== 'estabiliza' && pI) a.soporte.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(pA, pI, v3(0, 1, 0).applyQuaternion(qR)));
  a.apuntarA = null;
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
  if (izq) posarManoIzquierda(izq, dt);
  if (apreto('left', 5)) modos.alternar();   // Y: abre y cierra el menú (y pausa)
  if (menu.abierto) {   // los dos rayos apuntan y el gatillo aprieta; el arma sigue la mano pero no tira
    puntero.visible = false;
    if (der) { if (manoDerecha) { posarArma(der, pI); manoDerecha.gatillo(false); } posarManoDerecha(der, dt); }
    for (const lado of ['right', 'left']) {
      const m = manos[lado]; if (!m) { menu.apuntar(lado, null); continue; }
      menu.apuntar(lado, m.rayo.getWorldPosition(v3()), v3(0, 0, -1).applyQuaternion(m.rayo.getWorldQuaternion(new THREE.Quaternion())));
      if (apreto(lado, 0) && menu.apretar(lado) && !menu.abierto) break;   // el botón cerró el menú
    }
    return;
  }
  if (der) {
    const pA = der.agarre.getWorldPosition(v3()), qR = der.rayo.getWorldQuaternion(new THREE.Quaternion());
    const pR = der.rayo.getWorldPosition(v3()), dR = v3(0, 0, -1).applyQuaternion(qR);
    const senalada = manoDerecha ? null : (armaApuntada(pR, dR, ALCANCE_TOMAR) || armaCerca(pA));
    mostrarPuntero(!manoDerecha, pR, dR, senalada);
    if (manoDerecha) { if (apreto('right', 1)) dejar(manoDerecha, velMano.right); }
    else if (apreto('right', 1) || apreto('right', 0)) {   // la mano vacía toma con el agarre o con el gatillo
      if (senalada) { tomar(senalada); esperarGatillo = boton('right', 0); }
      else if (apreto('right', 1) && tirada()) tirada().llamar(() => der.agarre.getWorldPosition(v3()));
    }
    const a = manoDerecha;
    if (a) {
      a.porTajo = true;   // con el visor, el tajo fuerte suelta el poder de Excalibur y del Tridente
      posarArma(der, pI);
      if (esperarGatillo && !boton('right', 0)) esperarGatillo = false;
      a.gatillo(boton('right', 0) && !esperarGatillo && !aturdido() && !rapto);
      if (apreto('right', 4)) a.botonA();
      if (apreto('right', 5)) a.botonB(ahora);
    }
    posarManoDerecha(der, dt);
    const ex = der.fuente.gamepad ? der.fuente.gamepad.axes[2] || 0 : 0;   // palanca derecha: girar de a 30° o 45°, o suave
    if (config.giro === 'suave') { if (Math.abs(ex) > 0.15) girar(-ex * 2.4 * dt); }
    else if (Math.abs(ex) > 0.7 && !girando) { girando = true; girar(-Math.sign(ex) * (config.giro === '45' ? Math.PI / 4 : Math.PI / 6)); } else if (Math.abs(ex) < 0.3) girando = false;
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
    if (Math.hypot(mx, mz) > 0.15 && !aturdido()) caminar(mx, mz, dt);
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
  const vel = { lenta: 1.4, normal: 2.2, rapida: 3.0 }[config.caminar] || 2.2;
  jugador.position.addScaledVector(adelante, -z * vel * dt).addScaledVector(derecha, x * vel * dt);
  jugador.position.x = limitar(jugador.position.x, -11.5, 11.5); jugador.position.z = limitar(jugador.position.z, -90, 5.05);
}

/* ---------- Sin visor: mouse y teclado ---------- */
const escritorio = { activo: false, guinada: 0, cabeceo: 0, teclas: new Set(), mira: 0, apuntando: false };
const desdeCamara = (x, y, z) => camara.localToWorld(v3(x, y, z));
// Lo que tapa la cruz del centro (el escenario o el zombie): ahí van las balas de cadera y lo que se tira
function blancoCentro() {
  const r = new THREE.Raycaster(camara.getWorldPosition(v3()), camara.getWorldDirection(v3()), 0.1, 120);
  const h = r.intersectObjects([...mallasObjetos(), ...horda.zonas()], false).find(x => !(x.object.userData.emergente && !emergentes.expuesto(x.object.userData.emergente)));
  return h ? h.point : desdeCamara(0, 0, -60);
}
const tiroHacia = (a, rapidez, sube) => blancoCentro().sub(a.soporte.position).normalize().multiplyScalar(rapidez).add(v3(0, sube, 0));
function poseEscritorio() { jugador.rotation.y = escritorio.guinada; camara.rotation.set(escritorio.cabeceo, 0, 0); camara.position.y = 1.65; jugador.updateMatrixWorld(true); }
function entradaEscritorio(ahora, dt) {
  poseEscritorio();
  const k = escritorio.teclas, mx = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0), mz = (k.has('KeyS') ? 1 : 0) - (k.has('KeyW') ? 1 : 0);
  if ((mx || mz) && !menu.abierto && !aturdido()) caminar(mx, mz, dt);
  camara.updateMatrixWorld(true);
  const a = manoDerecha; if (!a) return;
  a.porTajo = false;
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
// El mouse del sistema (o la cruz, si está tomado) apunta al menú
const ratonMenu = new THREE.Vector2(), rayoMenu = new THREE.Raycaster();
function apuntarMenuEscritorio() {
  if (!menu || !menu.abierto || renderer.xr.isPresenting || !escritorio.activo) return;
  if (document.pointerLockElement === renderer.domElement) rayoMenu.set(camara.getWorldPosition(v3()), camara.getWorldDirection(v3()));
  else { camara.updateMatrixWorld(true); rayoMenu.setFromCamera(ratonMenu, camara); }
  menu.apuntar('mouse', rayoMenu.ray.origin, rayoMenu.ray.direction);
}
function pedirMouse() { const p = renderer.domElement.requestPointerLock(); if (p && p.catch) p.catch(() => {}); }
renderer.domElement.addEventListener('mousedown', ev => {
  if (!escritorio.activo) return;
  if (menu.abierto) { if (ev.button === 0) { ratonMenu.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1); apuntarMenuEscritorio(); menu.apretar('mouse'); } return; }
  if (document.pointerLockElement !== renderer.domElement) { pedirMouse(); return; }
  const a = manoDerecha;
  if (ev.button === 0 && a && !aturdido() && !rapto) { if (a.def.mecanica === 'cuerpo') golpeEscritorio(a); else a.gatillo(true); }
  if (ev.button === 2) { if (a && a.llamar) tirarArrojadiza(a); else if (!a && tirada()) tirada().llamar(() => desdeCamara(0.24, -0.22, -0.45)); else escritorio.apuntando = true; }
});
addEventListener('mouseup', ev => {
  if (!escritorio.activo || menu.abierto) return;
  const a = manoDerecha;
  if (ev.button === 0 && a) { if (a.id === 'granadas' && a.armada) dejar(a, tiroHacia(a, 5.5, 2.2)); else a.gatillo(false); }
  if (ev.button === 2) escritorio.apuntando = false;
});
function tirarArrojadiza(a) { dejar(a, tiroHacia(a, 8, a.vuelveSola ? 0 : 0.4)); }   // la Égida y Gungnir vuelan rectas: a la cruz
// Sin visor, el clic es el golpe: la hoja barre de derecha a izquierda; Excalibur y el Tridente sueltan su poder (en el
// visor lo suelta el tajo fuerte)
function golpeEscritorio(a) { escritorio.golpe = performance.now(); if (a.poder) a.poder(); }
addEventListener('contextmenu', ev => { if (escritorio.activo) ev.preventDefault(); });
addEventListener('mousemove', ev => {
  if (!escritorio.activo) return;
  ratonMenu.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  if (document.pointerLockElement !== renderer.domElement) { apuntarMenuEscritorio(); return; }
  const s = 0.0022 * config.mouse;
  escritorio.guinada -= ev.movementX * s; escritorio.cabeceo = limitar(escritorio.cabeceo - ev.movementY * s, -1.3, 1.3);
});
addEventListener('keydown', ev => {
  if (!escritorio.activo) return;
  if (ev.code === 'KeyM') { if (!ev.repeat) modos.alternar(); return; }
  if (menu.abierto) return;
  escritorio.teclas.add(ev.code);
  const a = manoDerecha, ahora = performance.now();
  if (ev.code === 'KeyR' && a) a.recargaEscritorio(ahora);
  if (ev.code === 'KeyB' && a) a.botonB(ahora);
  if (ev.code === 'KeyQ' && a) dejar(a);
  if (ev.code === 'KeyE') {   // toma el arma (de la mesa o de la pared) que mira la cruz
    const mejor = armaApuntada(camara.getWorldPosition(v3()), camara.getWorldDirection(v3()), ALCANCE_TOMAR);
    if (mejor) tomarEscritorio(mejor);
  }
  // 1 a 9, 0 y las dos teclas que siguen (código físico: sirve con cualquier distribución de teclado)
  const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'].indexOf(ev.code);
  if (n >= 0 && armas[n] && !armas[n].enMano) tomarEscritorio(armas[n]);
});
addEventListener('keyup', ev => escritorio.teclas.delete(ev.code));

/* ---------- Proyectiles, explosiones y golpes de hoja ---------- */
// Lo que no atraviesa (granadas, cohetes, el martillo) choca con el cuerpo entero de un zombie, un cilindro de 20 cm
// de radio: con sólo las zonas de las balas, una granada podía pasar entre los muslos y explotar atrás
function choqueCuerpo(a, b) {
  let mejor = null;
  for (const z of horda.vivos) {
    if (z.vuela || z.bajoTierra) continue;
    const g = z.grupo.position, dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz, alto = z.clase === 'animal' ? (z.especie === 'toro' ? 1.6 : 0.65) : 1.75 * z.grupo.scale.x, r = z.especie === 'toro' ? 0.45 : 0.2;
    const t = L2 > 1e-9 ? limitar(((g.x - a.x) * dx + (g.z - a.z) * dz) / L2, 0, 1) : 0, y = a.y + (b.y - a.y) * t;
    if (Math.hypot(a.x + dx * t - g.x, a.z + dz * t - g.z) < r && y > g.y + 0.05 && y < g.y + alto && (!mejor || t < mejor.t)) mejor = { z, t, punto: v3(a.x + dx * t, y, a.z + dz * t) };
  }
  if (!mejor) return null;
  let zona = null, dmin = Infinity;   // la zona más cercana al punto decide dónde pegó
  for (const m of mejor.z.zonas) { const d = m.getWorldPosition(v3()).distanceTo(mejor.punto); if (d < dmin) { dmin = d; zona = m; } }
  return { object: zona, point: mejor.punto, t: mejor.t, face: null };
}
// p: { objeto, vel, gravedad, empuje, velMax, vida, mecha (ms), rebota, gira, orientar, estela, enEscena, perfora, alChocar(h) → false sigue, alExplotar(pos) }
function actualizarProyectiles(ahora, dt) {
  const mallas = [...mallasObjetos(), ...horda.zonas()];
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
    if (p.enemigo) {
      const ojo = camara.getWorldPosition(v3()), q = o.position, dc = Math.hypot(q.x - ojo.x, q.z - ojo.z);
      if ((q.distanceTo(ojo) < 0.42 || (dc < 0.32 && q.y < ojo.y && q.y > 0.3)) && !p.pego) { p.pego = true; proyectiles.splice(i, 1); if (!p.enEscena) escena.remove(o); if (p.alJugador) p.alJugador(q.clone()); continue; }
      rayo.set(antes, d.clone().normalize()); rayo.far = largo + 0.03;
      const hp = rayo.intersectObjects(mallasObjetos(), false)[0];
      if (hp) { proyectiles.splice(i, 1); if (!p.enEscena) escena.remove(o); if (p.alChocar) p.alChocar({ punto: hp.point.clone(), dir: d.clone().normalize() }); }
      continue;
    }
    let h = rayo.intersectObjects(mallas, false).find(x => !(x.object.userData.zombie && !x.object.userData.zombie.vivo) && !(x.object.userData.emergente && !emergentes.expuesto(x.object.userData.emergente)) && !(p.yaPego && p.yaPego.has(x.object)));
    if (!p.perfora) { const c = choqueCuerpo(antes, o.position); if (c && (!h || c.t * largo < h.distance)) h = c; }
    if (!h) continue;
    const esZombie = !!h.object.userData.zombie, golpe = { punto: h.point.clone(), dir: d.clone().normalize(), zombie: esZombie, zona: esZombie ? h.object : null };
    if (h.object.userData.emergente) { emergentes.golpear(h.object, h.point, normalDe(h, golpe.dir)); marcador.impactos++; dibujarTablero(); }   // lo que le pegue lo tira
    if (p.rebota) {   // la granada rebota (también en un zombie: antes se quedaba en el aire y no explotaba) y se queda quieta
      const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : esZombie ? golpe.dir.clone().negate().setY(0.25).normalize() : v3(0, 1, 0);
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
// op (las de los zombies): { dano (al jugador, en el centro), de (el que estalla), gore (tripas en vez de fuego), color }
function explotar(pos, radio, op = {}) {
  if (op.gore) efectos.reventar(pos, radio, op.color); else efectos.explosion(pos, radio); Audio_.explosion();
  const ojo = camara.getWorldPosition(v3()), dj = Math.min(ojo.distanceTo(pos), ojo.clone().setY(Math.max(0.4, ojo.y - 0.7)).distanceTo(pos));
  if (dj < radio * 4) { const f = 1 - dj / (radio * 4); vibrar('right', f, 300); vibrar('left', f, 300); if (dj < radio) destello.material.opacity = Math.max(destello.material.opacity, 0.35); }
  if (op.dano && dj < radio) danarJugador(op.dano * (1 - (dj / radio) ** 2), 'explosion');
  if (op.dano && dj < radio * 1.5) empujarArmas(pos, radio * 0.7, 6);
  for (const z of horda.vivos) {
    if (z === op.de) continue;
    const zc = z.grupo.position.clone().add(v3(0, 1, 0)), dz = zc.distanceTo(pos);
    if (dz < radio) { z.recibir({ punto: zc, dir: zc.clone().sub(pos).setY(0.3).normalize(), dano: 40 * (1 - dz / radio) + 6, tipo: 'explosion' }); marcador.impactos++; }
  }
  marcador.impactos += emergentes.enRadio(pos, radio * 1.1).length;
  for (const b of blancosFijos) if (b.tipo === 'zombie' && b.grupo.visible && b.caida === 0 && b.grupo.position.distanceTo(pos) < radio * 1.2) b.caida = 0.001;
  dibujarTablero();
}
// Golpe de hoja: cada punto de la hoja, del cuadro anterior a este, contra las zonas de los zombies y los blancos arriba
function barrer(antes, ahora) {
  const mallas = horda.zonas(); for (const b of emergentes.lista) if (emergentes.expuesto(b)) mallas.push(b.torso, b.cabeza);
  if (!mallas.length) return null;
  for (let i = 0; i < ahora.length; i++) {
    const d = ahora[i].clone().sub(antes[i]), l = d.length(); if (l < 0.005) continue;
    rayo.set(antes[i], d.clone().normalize()); rayo.far = l + 0.03;
    const h = rayo.intersectObjects(mallas, false)[0];
    if (h) { const b = h.object.userData.emergente || null; return { punto: h.point.clone(), dir: d.normalize(), zona: h.object, zombie: !b, blanco: b }; }
  }
  return null;
}

/* ---------- Arranque ---------- */
const { acero } = galpon(); mesa(acero);
const destello = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color: 0x8a0000, transparent: true, opacity: 0, side: THREE.BackSide, depthTest: false }));
destello.renderOrder = 999; camara.add(destello);
function mordida(z) {   // un zombie alcanzó al jugador: vibran los dos mandos, se ve rojo y suena (en el ataque, además, quita vida)
  if (!modos.mordida(z)) return;
  marcador.mordidas++; destello.material.opacity = 0.55; vibrar('right', 1, 220); vibrar('left', 1, 220); Audio_.jugadorHerido(); dibujarTablero();
}
// Cualquier otro daño (explosiones, gas, ácido, cascotes, fardos, la embestida): lo cuenta el modo
let proximoQuejido = 0;
function danarJugador(n, motivo) {
  if (!(n > 0) || !modos.danar(n, motivo)) return;
  destello.material.opacity = Math.max(destello.material.opacity, Math.min(0.55, 0.15 + n / 40));
  if (n > 2) { vibrar('right', Math.min(1, n / 25), 160); vibrar('left', Math.min(1, n / 25), 160); }
  if (performance.now() > proximoQuejido) { Audio_.jugadorHerido(); proximoQuejido = performance.now() + 700; }
  dibujarTablero();
}

/* ---------- Lo que hacen los zombies especiales en la escena (el «mundo» de la horda) ---------- */
// Gas del tóxico y charcos de ácido del escupidor: dañan mientras el jugador está adentro
const peligros = [];
const matCharco = new THREE.MeshBasicMaterial({ color: 0x8ad62a, transparent: true, opacity: 0.6, depthWrite: false });
function ponerPeligro(tipo, pos, radio, dura, dano) {
  const P = { tipo, pos: pos.clone().setY(0), radio, hasta: reloj + dura * 1000, dano, malla: null };
  if (tipo === 'acido') { P.malla = new THREE.Mesh(new THREE.CircleGeometry(radio, 24), matCharco.clone()); P.malla.rotation.x = -Math.PI / 2; P.malla.position.copy(P.pos).setY(0.01); escena.add(P.malla); }
  if (tipo === 'gas') Audio_.toxicoChillido && Audio_.toxicoChillido();
  peligros.push(P);
}
function actualizarPeligros(dt) {
  const ojo = camara.getWorldPosition(v3()), pie = ojo.clone().setY(0);
  for (let i = peligros.length - 1; i >= 0; i--) {
    const P = peligros[i], resta = (P.hasta - reloj) / 1000;
    if (resta <= 0) { if (P.malla) escena.remove(P.malla); peligros.splice(i, 1); continue; }
    if (P.tipo === 'gas') {
      if (Math.random() < dt * 14) efectos.particula(efectos.matGas, P.pos.clone().add(v3((Math.random() - 0.5) * P.radio * 1.6, 0.3 + Math.random() * 1.4, (Math.random() - 0.5) * P.radio * 1.6)), v3((Math.random() - 0.5) * 0.3, 0.12, (Math.random() - 0.5) * 0.3), 0.7 + Math.random() * 0.6, 1.6, 1.5);
      if (pie.distanceTo(P.pos) < P.radio) danarJugador(P.dano * dt, 'gas');
    } else {
      P.malla.material.opacity = 0.6 * Math.min(1, resta / 0.8);
      if (Math.random() < dt * 6) efectos.particula(efectos.matGas, P.pos.clone().add(v3((Math.random() - 0.5) * P.radio, 0.05, (Math.random() - 0.5) * P.radio)), v3(0, 0.25, 0), 0.15, 0.8, 1.5);
      if (pie.distanceTo(P.pos) < P.radio) danarJugador(P.dano * dt, 'acido');
    }
  }
}
// Un proyectil de un zombie: vuela en parábola hasta donde estaba el jugador (tarda T segundos)
function proyectilEnemigo(objeto, desde, hasta, T, alJugador, alChocar) {
  const vel = hasta.clone().sub(desde).divideScalar(T); vel.y = (hasta.y - desde.y) / T + 0.5 * 9.8 * T;
  objeto.position.copy(desde); escena.add(objeto);
  proyectiles.push({ objeto, vel, gravedad: 9.8, vida: 4, enemigo: true, edad: 0, gira: v3(3, 2, 1), alJugador, alChocar });
}
const matAcido = new THREE.MeshStandardMaterial({ color: 0xa8e83c, emissive: 0x4a8a10, emissiveIntensity: 0.6, roughness: 0.2 });
function escupir(desde, hasta, E) {
  const gota = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), matAcido);
  const destino = hasta.clone().add(v3((Math.random() - 0.5) * 0.6, 0.9, (Math.random() - 0.5) * 0.6));
  proyectilEnemigo(gota, desde, destino, 1.0, p => { danarJugador(E.golpe, 'acido'); ponerPeligro('acido', p, E.charco.radio, E.charco.dura, E.charco.dano); Audio_.blanco('carton'); },
    h => { ponerPeligro('acido', h.punto, E.charco.radio, E.charco.dura, E.charco.dano); for (let k = 0; k < 6; k++) efectos.particula(efectos.matSangreVerde, h.punto.clone().add(v3(0, 0.05, 0)), v3((Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2), 0.06, 0.5, 1, 9.8); });
}
// Cascote (el lanzador sin zombie a mano) o fardo (el Coloso): pega fuerte si llega
let texFardo = null;
function arrojar(tipo, desde, hasta, dano) {
  let o;
  if (tipo === 'fardo') {
    texFardo = texFardo || texturaCanvas(128, 64, (g, w, h) => { g.fillStyle = '#c9a24a'; g.fillRect(0, 0, w, h); for (let k = 0; k < 500; k++) { g.strokeStyle = `rgba(${120 + Math.random() * 80},${90 + Math.random() * 60},30,0.6)`; g.beginPath(); const x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 4); g.stroke(); } g.fillStyle = '#6a4a20'; g.fillRect(0, h * 0.3, w, 3); g.fillRect(0, h * 0.68, w, 3); });
    o = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.45), new THREE.MeshStandardMaterial({ map: texFardo, roughness: 1 }));
  } else {
    const g = new THREE.DodecahedronGeometry(0.16, 0), p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.8 + Math.random() * 0.4), p.getY(i) * (0.6 + Math.random() * 0.4), p.getZ(i) * (0.8 + Math.random() * 0.4)); g.computeVertexNormals();
    o = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x8a8c90, roughness: 0.95, flatShading: true }));
  }
  const romper = p => { for (let k = 0; k < 12; k++) efectos.particula(tipo === 'fardo' ? efectos.matPolvo : efectos.matHumo, p.clone().add(v3((Math.random() - 0.5) * 0.4, 0.1, (Math.random() - 0.5) * 0.4)), v3((Math.random() - 0.5) * 2, Math.random() * 1.6, (Math.random() - 0.5) * 2), 0.18, 0.9, 1.6, 4); Audio_.casquillo('cargador', 'asfalto', 1); };
  proyectilEnemigo(o, desde, hasta.clone().setY(1.1), tipo === 'fardo' ? 1.25 : 1.05, p => { danarJugador(dano, tipo); romper(p); }, h => { romper(h.punto); empujarArmas(h.punto, 0.7, 4); });
}
// Las armas de la mesa que alcanza un golpe, una explosión o un zombie que la pisa salen volando y vuelven solas
function tirarDeLaMesa(a, vel) {
  if (a.enMano || a.suelto || a.volando || a.tirado) return;
  a.volviendo = null;
  a.suelto = efectos.soltar(a.soporte, vel, v3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8), 'arma', 0.03, Infinity);
  a.suelto.sonido = f => Audio_.casquillo('cargador', 'asfalto', f);
  a.suelto.alPosarse = () => { setTimeout(() => { if (!a.enMano && a.suelto) { efectos.quitarSuelto(a.suelto, false); a.suelto = null; volverAMesa(a); } }, 1500); };
}
function empujarArmas(pos, radio, fuerza) {
  for (const a of armas) {
    const d = a.soporte.position.clone().sub(pos), l = d.length();
    if (l < radio) tirarDeLaMesa(a, d.setY(0).normalize().multiplyScalar(fuerza * (1 - l / radio) * 0.6).add(v3(0, fuerza * (0.6 + Math.random() * 0.4), 0)));
  }
}
// Los pasos de un gigante o un golpe fuerte: vibran los mandos (y sin visor tiembla un poco la vista)
let temblando = 0;
function temblor(f) { vibrar('right', Math.min(1, f), 120); vibrar('left', Math.min(1, f), 120); temblando = Math.max(temblando, f * 0.012); }
// El grito: un anillo que se agranda desde la cabeza del que grita
const ondas = [];
function onda(pos, radio, color) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
  m.position.copy(pos); escena.add(m); ondas.push({ m, t: 0, radio });
}
function actualizarOndas(dt) {
  const ojo = camara.getWorldPosition(v3());
  for (let i = ondas.length - 1; i >= 0; i--) {
    const o = ondas[i]; o.t += dt; const k = o.t / 0.7;
    o.m.scale.setScalar(0.3 + k * Math.min(o.radio, 8)); o.m.lookAt(ojo); o.m.material.opacity = 0.7 * (1 - k);
    if (k >= 1) { escena.remove(o.m); ondas.splice(i, 1); }
  }
}
// La embestida del toro aturde: 2 s sin poder tirar ni caminar, con la vista apagada
let aturdidoHasta = 0;
function aturdir(seg) { aturdidoHasta = Math.max(aturdidoHasta, reloj + seg * 1000); aviso('¡ATURDIDO!', '', '#c8c8c8'); if (manoDerecha) manoDerecha.gatillo(false); }
const aturdido = () => reloj < aturdidoHasta;
// El buitre te levanta y te suelta en medio de la horda: fundido a negro (en el visor, moverte sin que lo hagas marea)
const velo = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, side: THREE.BackSide, depthTest: false }));
velo.renderOrder = 1002; camara.add(velo);
let rapto = null;
function raptar(z) {
  if (rapto) return;
  rapto = { t0: performance.now(), movido: false }; Audio_.lanzar('martillo'); vibrar('right', 1, 400); vibrar('left', 1, 400);
  if (manoDerecha) manoDerecha.gatillo(false);
}
function actualizarRapto() {
  if (!rapto) return;
  const t = (performance.now() - rapto.t0) / 1000;
  velo.material.opacity = t < 0.45 ? t / 0.45 : t < 0.9 ? 1 : Math.max(0, 1 - (t - 0.9) / 0.6);
  if (t >= 0.45 && !rapto.movido) {   // en medio de los zombies (o 15 m adelante si no hay)
    rapto.movido = true;
    const vivos = horda.vivos.filter(q => !q.vuela), destino = v3();
    if (vivos.length) { for (const q of vivos) destino.add(q.grupo.position); destino.divideScalar(vivos.length); destino.y = 0; } else destino.set(0, 0, -15);
    destino.x = limitar(destino.x, -10, 10); destino.z = limitar(destino.z, -60, -4);
    const pie = camara.getWorldPosition(v3()).setY(0); jugador.position.add(destino.sub(pie));
    danarJugador(10, 'buitre'); aviso('¡EL BUITRE!', 'te soltó en medio de la horda', '#ff6a5a');
  }
  if (t > 1.5) { rapto = null; velo.material.opacity = 0; }
}
const mundoHorda = {
  ojo: () => camara.getWorldPosition(v3()),
  aturdir, raptar,
  fuegoCerca: (p, r) => { const ll = armas.find(a => a.id === 'lanzallamas'); return !!ll && !!ll.llamas && ll.llamas.some(q => q.vida > 0.15 && q.s.position.distanceTo(p) < r); },
  atrasDelJugador: d => { const o = camara.getWorldPosition(v3()), f = camara.getWorldDirection(v3()).setY(0); if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize(); const p = o.addScaledVector(f, -d).setY(0); if (sobreMesa(p.x, p.z, 0.4)) p.z = MESA.z0 + 0.5; return p; },
  danar: danarJugador, explotar: (p, r, op) => explotar(p, r, op), gas: (p, r, dura, dano) => ponerPeligro('gas', p, r, dura, dano),
  escupir, arrojar, empujarArmas, temblor, onda,
};
blancoPapel(-2, -10); blancoPapel(2, -25); blancoPapel(-2, -50); zombieCarton(0, -17);
function escenaLibre(si) { for (const e of escenarioLibre) { e.grupo.visible = si; for (const o of e.entradas) o.activo = si; } }
const cartel = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.36), new THREE.MeshBasicMaterial({ map: tablero }));
cartel.position.set(0, 1.95, MESA.z1 - 0.3); cartel.rotation.x = 0.18; escena.add(cartel);
acomodarEnMesa();
// Las otras 36, en el armero de la pared de atrás (la que queda a la espalda al empezar)
const armasPared = ARMAS_PARED.map(id => crearArma(id, mundo));
const armero = colgarEnPared(armasPared, escena, { z: 5.5 });
armas.push(...armasPared);
// El dibujo del juego de cada una (vr/modelo3d.js, texturaDeArma) se pinta de a una arma después de arrancar: la entrada
// no se demora y, mientras tanto, cada pieza se ve de su color. La que se toma antes, se pinta en el momento.
const sinPintar = armasPared.filter(a => a.a.pintarTextura);
const pintarSiguiente = () => { const a = sinPintar.shift(); if (!a) return; if (a.a.pintarTextura) a.a.pintarTextura(); setTimeout(pintarSiguiente, 60); };
setTimeout(pintarSiguiente, 500);
for (const a of armas) a.alCambiar = () => { if (a === manoDerecha) dibujarTablero(); };
for (const a of armas) if (a.llamar) a.alVolver = x => { if (manoDerecha && manoDerecha !== x) dejar(manoDerecha); tomar(x, 'right', true); };
const macheteCazador = armas.find(a => a.id === 'macheteCazador');
if (macheteCazador) macheteCazador.alGolpe = r => { if (r && (r.murio || Math.random() < SUSURRO.alPegar)) susurrar(r.murio ? 'matar' : 'pegar'); };
jugador.position.set(0, 0, -0.02);
const jugadorEnPiso = () => camara.getWorldPosition(v3()).setY(0);
function reubicar() {   // vuelve al lugar de tiro, detrás de la mesa, mirando al campo
  jugador.position.set(0, 0, -0.02); jugador.rotation.y = 0; escritorio.guinada = 0; escritorio.cabeceo = 0; aplicarConfig();
}

/* ---------- Avisos: el cartel delante de los ojos y los puntos que suben sobre los blancos ---------- */
const aviso_ = { tex: texturaCanvas(1024, 256, () => {}), hasta: 0 };
aviso_.malla = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: aviso_.tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
aviso_.malla.position.set(0, 0.08, -1.4); aviso_.malla.renderOrder = 998; aviso_.malla.visible = false; camara.add(aviso_.malla);
function aviso(t, sub = '', color = '#c9a96e') {
  const g = aviso_.tex.lienzo.getContext('2d'); g.clearRect(0, 0, 1024, 256);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = '700 118px "Trebuchet MS", sans-serif'; g.lineWidth = 12; g.strokeStyle = 'rgba(10,8,12,0.85)'; g.strokeText(t, 512, sub ? 100 : 128, 980); g.fillStyle = color; g.fillText(t, 512, sub ? 100 : 128, 980);
  if (sub) { g.font = '700 44px "Trebuchet MS", sans-serif'; g.lineWidth = 8; g.strokeText(sub, 512, 210, 980); g.fillStyle = '#f1e6d0'; g.fillText(sub, 512, 210, 980); }
  aviso_.tex.needsUpdate = true; aviso_.malla.visible = true; aviso_.malla.material.opacity = 1; aviso_.hasta = performance.now() + 950;
}
const flotantes = [], texFlotante = new Map();
function flotante(pos, t, color) {
  const clave = t + color;
  if (!texFlotante.has(clave)) texFlotante.set(clave, texturaCanvas(256, 128, g => { g.font = '700 84px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = 'rgba(10,8,12,0.85)'; g.strokeText(t, 128, 66, 244); g.fillStyle = color; g.fillText(t, 128, 66, 244); }));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFlotante.get(clave), transparent: true, depthTest: false, depthWrite: false }));
  const d = camara.getWorldPosition(v3()).distanceTo(pos), e = 0.22 + d * 0.035;
  s.scale.set(e * 2, e, 1); s.position.copy(pos).add(v3(0, 0.55 + e * 0.5, 0)); s.renderOrder = 997; escena.add(s);
  flotantes.push({ s, t: 0, e });
}
function actualizarAvisos(dt) {
  if (aviso_.malla.visible) { const r = aviso_.hasta - performance.now(); aviso_.malla.material.opacity = Math.max(0, Math.min(1, r / 300)); if (r <= 0) aviso_.malla.visible = false; }
  for (let i = flotantes.length - 1; i >= 0; i--) {
    const f = flotantes[i]; f.t += dt; f.s.position.y += dt * f.e * 0.8; f.s.material.opacity = Math.max(0, 1 - Math.max(0, f.t - 0.6) / 0.6);
    if (f.t > 1.2) { escena.remove(f.s); f.s.material.dispose(); flotantes.splice(i, 1); }
  }
}

/* ---------- Menú y modos ---------- */
menu = new Menu(escena);
emergentes = new Emergentes(escena, objetos, efectos);
let reloj = 0;   // ms del juego: no corre mientras el menú está abierto (pausa)
function abrirMenu(pagina) {
  menu.mostrar(pagina);
  if (!renderer.xr.isPresenting) poseEscritorio();   // la cámara de escritorio puede no haber tomado altura todavía
  if (!menu.abierto) menu.abrir(camara.getWorldPosition(v3()), camara.getWorldDirection(v3()), renderer.xr.isPresenting ? 1.35 : 1.0);
  if (manoDerecha) manoDerecha.gatillo(false);
  document.getElementById('mira').style.visibility = 'hidden';
  puntero.visible = false; escritorio.apuntando = false;
  if (!renderer.xr.isPresenting && document.pointerLockElement === renderer.domElement) document.exitPointerLock();
  dibujarTablero();
}
function cerrarMenu() {
  menu.cerrar(); esperarGatillo = true; document.getElementById('mira').style.visibility = '';
  if (!renderer.xr.isPresenting && escritorio.activo && document.pointerLockElement !== renderer.domElement) pedirMouse();   // dentro del clic que lo cerró
  dibujarTablero();
}
const portada = document.getElementById('portada'), estado = document.getElementById('estado'), entrar = document.getElementById('entrar'), sinVisor = document.getElementById('sin-visor');
entrar.disabled = true; sinVisor.disabled = true;
estado.textContent = 'Preparando los zombies…';
await prepararZombies(p => { estado.textContent = `Preparando los zombies… ${Math.round(p * 100)} %`; });
mundoHorda.mesa = { x0: MESA.x0, x1: MESA.x1, z0: MESA.z1, z1: MESA.z0, alto: MESA.alto };
horda = new Horda(escena, efectos, { maximo: 18, obstaculos: [mundoHorda.mesa], mundo: mundoHorda, crearAnimal });
const asegurarTodo = async ids => { await asegurarTipos(ids); await asegurarAnimales(ids); };
const listoTodo = id => TIPOS[id] ? tipoListo(id) : ESPECIES[id] ? animalListo(id) : true;
modos = new Modos({ menu, horda, blancos: emergentes, reloj: () => reloj, abrirMenu, cerrarMenu, escenaLibre, reubicar, aviso, flotante, config, cambiarConfig, actualizarHud: dibujarTablero, asegurar: asegurarTodo, tipoListo: listoTodo });
horda.alMorir = (z, cabezazo) => { modos.zombieMuerto(z, cabezazo); dibujarTablero(); };
emergentes.alGolpe = (b, cabeza) => modos.blancoGolpeado(b, cabeza);
emergentes.alEscapar = b => modos.blancoEscapo(b);
aplicarConfig(); dibujarTablero();

/* ---------- Cada cuadro ---------- */
let previo = performance.now(), abrirAlEntrar = 0;
renderer.setAnimationLoop(() => {
  const ahora = performance.now(), dt = Math.min(0.05, (ahora - previo) / 1000); previo = ahora;
  if (renderer.xr.isPresenting) entradaVisor(ahora, dt); else if (escritorio.activo) entradaEscritorio(ahora, dt);
  if (menu.abierto && !renderer.xr.isPresenting && document.pointerLockElement === renderer.domElement) apuntarMenuEscritorio();
  for (const a of armas) { a.soporte.updateMatrixWorld(true); a.actualizar(ahora, dt); }
  actualizarMesa(ahora);
  actualizarProyectiles(ahora, dt);
  efectos.actualizar(ahora, dt);
  if (!menu.abierto) {   // en pausa no corren los zombies, los blancos ni el nivel
    reloj += dt * 1000;
    actualizarBlancos(ahora, dt);
    emergentes.actualizar(dt);
    actualizarPeligros(dt);
    horda.actualizar(reloj, dt, jugadorEnPiso(), camara.getWorldPosition(v3()), mordida);
    modos.actualizar(reloj, dt);
  }
  actualizarAvisos(dt); actualizarOndas(dt); actualizarRapto();
  if (temblando > 0 && !renderer.xr.isPresenting) { camara.rotation.z = (Math.random() - 0.5) * temblando; temblando = Math.max(0, temblando - dt * 0.05); }
  destello.material.opacity = Math.max(0, destello.material.opacity - dt * 1.4);
  if (aturdido()) { destello.material.color.set(0x303030); destello.material.opacity = Math.max(destello.material.opacity, 0.35 + Math.sin(performance.now() * 0.01) * 0.08); } else destello.material.color.set(0x8a0000);
  // Al entrar al visor el menú aparece delante de los ojos (cuando ya se sabe dónde está la cabeza)
  if (abrirAlEntrar > 0 && renderer.xr.isPresenting && camara.getWorldPosition(v3()).y > 0.3 && --abrirAlEntrar === 0 && !menu.abierto) modos.abrir();
  if (manoDerecha && manoDerecha.camMira) manoDerecha.renderizarMira(renderer, escena);
  renderer.render(escena, camara);
});

// Al entrar al visor: fuera la portada, al lugar de tiro y el menú en cuanto se sabe dónde está la cabeza. El primer
// gatillo o agarre reanuda el audio (en la app la sesión arranca sola y el contexto de audio puede quedar suspendido)
function alEntrarVisor() {
  portada.classList.add('oculta'); reubicar(); abrirAlEntrar = 6; if (hudDiv) hudDiv.style.display = 'none';
  const s = renderer.xr.getSession(); if (s) for (const t of ['selectstart', 'squeezestart']) s.addEventListener(t, () => Audio_.activar());
}
renderer.xr.addEventListener('sessionstart', alEntrarVisor);
if (renderer.xr.isPresenting) alEntrarVisor();   // la app entró al visor mientras se armaba todo
renderer.xr.addEventListener('sessionend', () => { portada.classList.remove('oculta'); puntero.visible = false; menu.cerrar(); aplicarConfig(); });
sinVisor.disabled = false;
if (navigator.xr) {
  estado.textContent = 'Buscando el visor…';
  navigator.xr.isSessionSupported('immersive-vr').then(si => {
    entrar.disabled = !si;
    estado.textContent = si ? 'Listo: ponte el visor y entra.' : 'Este navegador no tiene realidad virtual: abre esta página en el navegador del Meta Quest.';
  }).catch(() => { estado.textContent = 'No se pudo consultar el visor.'; });
} else estado.textContent = 'Este navegador no tiene realidad virtual (WebXR): ábrela en el navegador del Meta Quest. Mientras, puedes probar sin visor.';
entrar.addEventListener('click', async () => {
  Audio_.activar(); Audio_.sinSilencioAutomatico(); Audio_.lugar('galpon'); aplicarConfig();
  try {
    const sesion = await navigator.xr.requestSession('immersive-vr', OPCIONES_XR);
    await renderer.xr.setSession(sesion);
  } catch (e) { estado.textContent = 'No se pudo entrar en realidad virtual: ' + e.message; }
});
sinVisor.addEventListener('click', () => {
  Audio_.activar(); Audio_.lugar('galpon'); aplicarConfig();
  escritorio.activo = true; portada.classList.add('oculta');
  document.getElementById('mira').style.display = 'block'; document.getElementById('pista').style.display = 'block';
  modos.abrir();   // el menú al empezar; al elegir, el mouse queda tomado
});
// Sin visor, soltar el mouse (Esc) en medio de un juego lo pausa con el menú
document.addEventListener('pointerlockchange', () => {
  if (escritorio.activo && !renderer.xr.isPresenting && document.pointerLockElement !== renderer.domElement && !menu.abierto && modos.fase !== 'inicio') modos.abrir();
});

// Para las pruebas automáticas (CDP): tomar, disparar, recargar, mirar, el menú y el estado
window.__campo = {
  armas, escritorio, escena, jugador, blancos: blancosFijos, efectos, marcador, MESA, camara, config, renderer,
  get horda() { return horda; }, get emergentes() { return emergentes; }, get modos() { return modos; }, get menu() { return menu; },
  get zombie() { return horda.activos[0] || horda.zombies[0] || null; },   // el primero (las pruebas de antes usan uno solo)
  get reloj() { return reloj; }, get molde() { return moldeInfo(); },
  get sueltos() { return efectos.sueltos; },
  get mano() { return manoDerecha; },
  // Sin menú, directo al modo libre (como antes de los modos)
  empezar() { escritorio.activo = true; portada.classList.add('oculta'); document.getElementById('mira').style.display = 'block'; modos.empezarLibre(); },
  mirar(guinada, cabeceo) { escritorio.guinada = guinada; escritorio.cabeceo = cabeceo; },
  tomar(id) { const a = armas.find(x => x.id === id); if (a) tomarEscritorio(a); return !!a; },
  dejar() { if (manoDerecha) dejar(manoDerecha); },
  apretar(si) { if (manoDerecha) manoDerecha.gatillo(si); },
  apuntar(si) { escritorio.apuntando = si; },
  recargar() { if (manoDerecha) manoDerecha.recargaEscritorio(performance.now()); },
  montar() { if (manoDerecha) manoDerecha.botonB(performance.now()); },
  get proyectiles() { return proyectiles; },
  get izquierda() { return izquierda; },
  // El menú: qué página hay y apretar un botón por su texto (como un clic)
  pagina() { return menu.abierto && menu.pagina ? { titulo: menu.pagina.titulo, sub: menu.pagina.sub, botones: menu.pagina.botones.map(b => (b.texto + (b.sub ? ' / ' + b.sub : '') + (b.activo === false ? ' [cerrado]' : ''))) } : null; },
  clic(t) { const b = menu.abierto && menu.pagina.botones.find(x => x.activo !== false && (x.texto === t || x.texto.includes(t))); if (!b) return false; Audio_.recoger(); b.accion(); return true; },
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
    return { mano: manoDerecha && manoDerecha.id, puntero: puntero.visible, verde: puntero.material.color.getHex() === 0x7dff4a, menu: menu.abierto };
  },
  get info() { return { llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles }; },
  golpe() { if (manoDerecha) golpeEscritorio(manoDerecha); else escritorio.golpe = performance.now(); },
  tirar() { if (manoDerecha && manoDerecha.llamar) tirarArrojadiza(manoDerecha); else if (manoDerecha && manoDerecha.id === 'granadas') { manoDerecha.gatillo(true); dejar(manoDerecha, tiroHacia(manoDerecha, 5.5, 2.2)); } },
  llamar() { const t = tirada(); if (t) t.llamar(() => desdeCamara(0.24, -0.22, -0.45)); },
  get armero() { return armero; }, get sinPintar() { return sinPintar.length; }, manoIzq, manoDer, get agarreDer() { return agarreDer; },
  // Adelanta el juego (zombies, blancos y el nivel) sin dibujar: el Chrome de pruebas dibuja lento y el paso tiene tope
  avanzar(seg, paso = 0.02) {
    for (let k = 0; k < seg / paso && !menu.abierto; k++) { reloj += paso * 1000; emergentes.actualizar(paso); actualizarPeligros(paso); actualizarProyectiles(performance.now(), paso); horda.actualizar(reloj, paso, jugadorEnPiso(), camara.getWorldPosition(v3()), mordida); modos.actualizar(reloj, paso); actualizarRapto(); }
  },
};
