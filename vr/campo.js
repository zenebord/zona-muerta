/* ===== Zona Muerta VR: el campo de pruebas en primera persona (Meta Quest, WebXR) =====
 * Versión mínima: el galpón del campo de pruebas, la AK-47 en la mano derecha, blancos de papel y un zombie de cartón.
 * La AK es la del juego: se graban los polígonos que pinta su modelo (js/armas-modelos-3.js, en cm, con y hacia
 * abajo) y cada pieza se extruye con su espesor real. Lo que se mueve va aparte: el cargador (se suelta, cae y se
 * cambia), la manija de carga (va con el portacerrojo en cada tiro, como en el juego) y el cerrojo que se ve por la
 * ventana de expulsión, que deja la recámara abierta un instante; por ahí sale la vaina. Los sonidos son los del
 * juego (js/audio.js) con el eco del galpón.
 * En el visor: gatillo derecho dispara; agarre izquierdo junto al guardamanos sostiene con las dos manos; A suelta
 * el cargador; con la mano izquierda libre el agarre saca uno del portacargador y llevándolo al pozo encastra; la
 * manija se tira con la mano izquierda (o B); palanca izquierda camina y la derecha gira de a 30°.
 * Sin visor: mouse apunta, clic dispara, R recarga, WASD camina. Para las pruebas automáticas: window.__campo.
 */
import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const A_METROS = 0.01;                                   // el modelo del juego está en cm; la escena, en metros
const AK = { cadencia: 100, cargador: 30, ciclo: 75, recorrido: 8 };
const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

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

function texturaCanvas(w, h, dibujar, repetir) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  dibujar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repetir); }
  t.lienzo = c;
  return t;
}
const ruido = (g, w, h, n, colores) => { for (let k = 0; k < n; k++) { g.fillStyle = colores[k % colores.length]; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };

/* ---------- El galpón (como el del campo de pruebas: chapa gris azulada, columnas y el poste con bandas) ---------- */
const objetos = [];                                      // lo que la bala puede tocar: { malla, tipo }
const blancos = [];                                      // los de papel y el zombie
function galpon() {
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(26, 104), new THREE.MeshStandardMaterial({ roughness: 0.93, map: texturaCanvas(256, 256, (g, w, h) => {
    g.fillStyle = '#7b818b'; g.fillRect(0, 0, w, h); ruido(g, w, h, 2600, ['#6f757f', '#878d97', '#737983', '#8d939c']);
    g.strokeStyle = '#5b6069'; g.lineWidth = 3; g.strokeRect(0, 0, w, h);   // juntas cada 2 m
  }, [13, 52]) }));
  piso.rotation.x = -Math.PI / 2; piso.position.set(0, 0, -46); escena.add(piso); objetos.push({ malla: piso, tipo: 'piso' });
  // Carriles y línea de tiro
  for (const x of [-4, 0, 4]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 90), new THREE.MeshBasicMaterial({ color: 0xc9b25a })); l.rotation.x = -Math.PI / 2; l.position.set(x - 2, 0.003, -46); escena.add(l); }
  const linea = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.14), new THREE.MeshBasicMaterial({ color: 0xe0b020 })); linea.rotation.x = -Math.PI / 2; linea.position.set(0, 0.004, -0.75); escena.add(linea);
  // Paredes de chapa acanalada
  const chapa = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.15, map: texturaCanvas(256, 256, (g, w, h) => {
    g.fillStyle = '#9aa3b2'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(x, 0, 6, h); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 7, 0, 3, h); }
    g.fillStyle = 'rgba(40,46,56,0.35)'; g.fillRect(0, h - 40, w, 40);   // zócalo sucio
  }, [25, 1]) });
  for (const x of [-13, 13]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(104, 9), chapa); p.position.set(x, 4.5, -46); p.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    escena.add(p); objetos.push({ malla: p, tipo: 'pared' });
  }
  const atras = new THREE.Mesh(new THREE.PlaneGeometry(26, 9), chapa); atras.position.set(0, 4.5, 5.5); atras.rotation.y = Math.PI; escena.add(atras);
  // Fondo: talud de tierra que ataja las balas, contra la pared del fondo
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(26, 9), chapa); fondo.position.set(0, 4.5, -97.5); escena.add(fondo); objetos.push({ malla: fondo, tipo: 'pared' });
  const talud = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 26, 24, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x6d5a44, roughness: 1 }));
  talud.rotation.z = Math.PI / 2; talud.rotation.y = Math.PI / 2; talud.position.set(0, 0, -95); escena.add(talud); objetos.push({ malla: talud, tipo: 'tierra' });
  // Columnas, vigas del techo y luces
  const acero = new THREE.MeshStandardMaterial({ color: 0x2b2f37, roughness: 0.55, metalness: 0.5 });
  const luz = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
  for (let z = 2; z > -96; z -= 10) {
    for (const x of [-12.4, 12.4]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.45, 8, 0.45), acero); c.position.set(x, 4, z); escena.add(c); objetos.push({ malla: c, tipo: 'metal' }); }
    const viga = new THREE.Mesh(new THREE.BoxGeometry(25, 0.5, 0.25), acero); viga.position.set(0, 7.9, z); escena.add(viga);
    const lampara = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.4), luz); lampara.position.set(0, 7.4, z - 5); escena.add(lampara);
  }
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(26, 104), new THREE.MeshStandardMaterial({ color: 0x5a6170, roughness: 0.9, side: THREE.DoubleSide }));
  techo.rotation.x = Math.PI / 2; techo.position.set(0, 8.3, -46); escena.add(techo);
  // Postes con bandas amarillas, como el del campo de pruebas del juego
  for (const [x, z] of [[4.2, -14], [-4.6, -32], [4.2, -60]]) {
    const poste = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), acero); poste.position.set(x, 2, z); escena.add(poste); objetos.push({ malla: poste, tipo: 'metal' });
    for (const y of [1.6, 2.1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.32), new THREE.MeshStandardMaterial({ color: 0xe0b020, roughness: 0.6 })); b.position.set(x, y, z); escena.add(b); }
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), acero); base.position.set(x, 0.05, z); escena.add(base);
  }
  // Banco de tiro con cargadores de repuesto encima (decorado)
  const madera = new THREE.MeshStandardMaterial({ color: 0x7a5434, roughness: 0.8 });
  const tabla = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.62), madera); tabla.position.set(0, 0.92, -1.15); escena.add(tabla); objetos.push({ malla: tabla, tipo: 'madera' });
  for (const [x, z] of [[-0.78, -0.88], [0.78, -0.88], [-0.78, -1.42], [0.78, -1.42]]) { const pata = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), acero); pata.position.set(x, 0.45, z); escena.add(pata); }
  return { tabla };
}

/* ---------- Blancos: papel con un zombie impreso y un zombie de cartón que se cae ---------- */
function texturaPapel() {
  return texturaCanvas(512, 768, (g, w, h) => {
    g.fillStyle = '#eee5cf'; g.fillRect(0, 0, w, h); ruido(g, w, h, 900, ['#e2d8c0', '#f5eedd']);
    g.fillStyle = '#4c5a44';   // silueta: cabeza, cuello, hombros y torso
    g.beginPath(); g.ellipse(256, 200, 92, 110, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(206, 290); g.lineTo(306, 290); g.lineTo(330, 340); g.bezierCurveTo(470, 360, 470, 420, 480, 760); g.lineTo(32, 760); g.bezierCurveTo(42, 420, 42, 360, 182, 340); g.closePath(); g.fill();
    g.fillStyle = '#1b2016'; g.beginPath(); g.ellipse(222, 188, 22, 18, 0.2, 0, 7); g.ellipse(294, 186, 24, 19, -0.2, 0, 7); g.fill();   // ojos hundidos
    g.fillStyle = '#d8d26a'; g.beginPath(); g.arc(226, 190, 6, 0, 7); g.arc(290, 188, 6, 0, 7); g.fill();
    g.fillStyle = '#1b2016'; g.beginPath(); g.moveTo(214, 252); for (let k = 0; k <= 8; k++) g.lineTo(214 + k * 11, 252 + (k % 2 ? 16 : 0)); g.lineTo(302, 262); g.lineTo(214, 262); g.fill();   // boca
    g.lineWidth = 4;
    for (const [cx, cy, r] of [[256, 200, 40], [256, 200, 80], [256, 470, 60], [256, 470, 120], [256, 470, 180]]) { g.strokeStyle = 'rgba(176,34,24,0.85)'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
    g.fillStyle = '#2b2b2b'; g.font = '700 30px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.fillText('ZONA MUERTA · 7,62×39', 256, 730);
  });
}
function texturaZombie() {
  return texturaCanvas(512, 1024, (g) => {
    const piel = '#86a862', pielOsc = '#5e7a43';
    g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = '#1d2216';
    const forma = (pts, color) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = color; g.fill(); g.stroke(); };
    forma([[196, 610], [250, 610], [244, 960], [182, 960]], '#3c4a6a'); forma([[262, 610], [318, 610], [330, 960], [268, 960]], '#35425f');   // piernas (jean)
    forma([[170, 950], [250, 950], [256, 1000], [150, 1000]], '#2a2420'); forma([[262, 950], [342, 950], [362, 1000], [258, 1000]], '#2a2420');   // zapatos
    forma([[150, 330], [362, 330], [388, 470], [352, 640], [300, 610], [262, 650], [214, 612], [160, 640], [124, 470]], '#c8bfab');   // camisa rota
    g.fillStyle = 'rgba(122,26,18,0.75)'; for (const [x, y, r] of [[300, 430, 28], [210, 520, 20], [330, 560, 16], [240, 400, 12]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    forma([[140, 350], [182, 360], [110, 560], [74, 600], [56, 580], [96, 520]], '#c8bfab'); forma([[372, 350], [330, 360], [402, 560], [438, 600], [456, 580], [416, 520]], '#c8bfab');   // brazos para adelante
    forma([[52, 580], [84, 600], [80, 650], [44, 640]], piel); forma([[460, 580], [428, 600], [432, 650], [468, 640]], piel);   // manos
    forma([[232, 300], [282, 300], [286, 340], [228, 340]], pielOsc);   // cuello
    g.beginPath(); g.ellipse(256, 200, 96, 118, 0, 0, Math.PI * 2); g.fillStyle = piel; g.fill(); g.stroke();   // cabeza
    g.fillStyle = '#1a1d14'; g.beginPath(); g.ellipse(220, 186, 24, 20, 0.2, 0, 7); g.ellipse(294, 184, 26, 21, -0.2, 0, 7); g.fill();
    g.fillStyle = '#e8e07a'; g.beginPath(); g.arc(224, 190, 7, 0, 7); g.arc(290, 188, 7, 0, 7); g.fill();
    g.fillStyle = '#2a0c08'; g.beginPath(); g.ellipse(258, 262, 46, 24, 0, 0, Math.PI * 2); g.fill();   // boca abierta
    g.fillStyle = '#e8e2c8'; for (let k = 0; k < 6; k++) g.fillRect(220 + k * 13, 242, 8, 12);
    g.fillStyle = '#3a2a1c'; for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(170 + k * 20, 110); g.lineTo(180 + k * 20, 70 - (k % 3) * 12); g.lineTo(190 + k * 20, 112); g.fill(); }   // pelo revuelto
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
  const geo = new THREE.PlaneGeometry(0.9, 1.8); geo.translate(0, 0.9, 0);   // el pie en el piso: se cae para atrás desde ahí
  const silueta = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: carton, alphaTest: 0.5, roughness: 0.9, side: THREE.DoubleSide }));
  grupo.add(silueta);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.4), new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.6 })); base.position.y = 0.04; grupo.add(base);
  const b = { tipo: 'zombie', malla: silueta, grupo, agujeros: [], impactos: 0, vida: 6, caida: 0, caidoEn: -1 };
  objetos.push(b); blancos.push(b);
}

/* ---------- La AK-47 del juego, en 3D ---------- */
// Graba los polígonos que pinta el modelo 2D en el estado e (pintar recibe los puntos en cm)
function grabarPoligonos(e) {
  const lista = [], original = window.pintar;
  window.pintar = (ctx, pts, color, op = {}) => { lista.push({ pts, color, huecos: op.huecos || [] }); };
  const c = document.createElement('canvas').getContext('2d');
  try { DIBUJO_ARMAS.ak47.dibujar(c, { sinCargador: false, corredera: 0, cerrojo: 0, abierto: 0, bombeo: 0, palanca: 0, tapa: 0, ...e }); }
  finally { window.pintar = original; }
  return lista;
}
// Espesor (cm) y corrimiento hacia el lado derecho (+z) de cada pieza, en el orden en que las pinta el modelo de la
// AK (25 polígonos). Si el modelo cambia y no son 25, el espesor sale de la altura de cada pieza.
const PIEZAS_AK = [
  { t: 3.8 }, { t: 4.0 }, { t: 2.9 }, { t: 0.7 },        // culata, cantonera, pistolete, cola del disparador
  { t: 2.6 }, { t: 2.9 },                                // cargador y su base
  { t: 3.0 }, { omitir: true }, { t: 3.2 },              // cajón, cerrojo de la ventana (va aparte), tapa
  { t: 3.4 }, { t: 3.5 }, { t: 2.4 }, { t: 1.6 },        // palanca selectora, su eje, bloque del alza, hoja del alza
  { t: 4.2 }, { t: 4.4 }, { t: 1.8 }, { t: 3.4 },        // guardamanos de abajo, retén, tubo de gases, guardamanos de arriba
  { t: 2.2 }, { t: 1.6 }, { t: 0.8 }, { t: 1.8 },        // bloque de gases, cañón, varilla, abrazadera
  { t: 1.4 }, { t: 1.9 },                                // guion, tuerca de la boca
  { t: 0.9, z: 1.9 }, { t: 1.6, z: 2.5 },                // manija de carga y su perilla (del lado derecho)
];
const MADERAS = new Set(['#a8441f', '#a33c14', '#9a3a18']);
const veta = texturaCanvas(512, 128, (g, w, h) => {
  g.fillStyle = '#e2c4a4'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 46; k++) { const y = Math.random() * h; g.strokeStyle = `rgba(70,30,10,${0.08 + Math.random() * 0.2})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y - 6 + Math.random() * 12, w * 0.7, y - 6 + Math.random() * 12, w, y + Math.random() * 4); g.stroke(); }
}, [1 / 30, 1 / 8]);
const materiales = new Map();
function material(color) {
  if (!materiales.has(color)) {
    const madera = MADERAS.has(color), baquelita = color === '#4a3a48';
    materiales.set(color, new THREE.MeshStandardMaterial({ color, map: madera ? veta : null,
      roughness: madera ? 0.5 : baquelita ? 0.55 : 0.38, metalness: madera || baquelita ? 0.02 : 0.65, envMapIntensity: madera ? 0.6 : 1 }));
  }
  return materiales.get(color);
}
function pieza(pts, huecos, color, t, z = 0) {
  const forma = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, -y)));
  for (const h of huecos) forma.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, -y))));
  const g = new THREE.ExtrudeGeometry(forma, { depth: t, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 1, curveSegments: 3 });
  g.translate(0, 0, -t / 2 + z);
  return new THREE.Mesh(g, material(color));
}
function construirAK() {
  const base = grabarPoligonos({}), conManija = grabarPoligonos({ corredera: 1 }), sinCargador = grabarPoligonos({ sinCargador: true });
  const clave = p => p.color + ':' + p.pts.length + ':' + p.pts[0].join(',');
  const resto = new Set(sinCargador.map(clave));
  const fijo = new THREE.Group(), cargador = new THREE.Group(), manija = new THREE.Group();
  const conocida = base.length === PIEZAS_AK.length;
  base.forEach((p, i) => {
    const conf = conocida ? PIEZAS_AK[i] : {};
    const mueve = JSON.stringify(p.pts) !== JSON.stringify(conManija[i] && conManija[i].pts);
    if (conf.omitir || (!conocida && mueve && p.color === '#5d6169')) return;
    let y0 = Infinity, y1 = -Infinity; for (const [, y] of p.pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const t = conf.t ?? Math.max(0.8, Math.min(3.0, (y1 - y0) * 0.55));
    (!resto.has(clave(p)) ? cargador : mueve ? manija : fijo).add(pieza(p.pts, p.huecos, p.color, t, conf.z ?? (mueve ? 1.9 : 0)));
  });
  // El cargador gira, cae y se agarra por su medio: el origen del grupo va al centro y las piezas se corren
  const centro = new THREE.Box3().setFromObject(cargador).getCenter(v3());
  for (const m of cargador.children) m.position.sub(centro);
  cargador.position.copy(centro);
  return { fijo, cargador, manija, centroCargador: centro };
}

// Puntos del arma en cm (3D: y hacia arriba, +z el lado derecho, el de la ventana)
const d = DIBUJO_ARMAS.ak47, R = RECAMARAS.ak47, cmJuego = CM;   // CM del juego: unidades de juego por cm
const P = {
  empunadura: v3(-1.0, -5.0, 0),                                          // centro del pistolete: donde va la mano
  boca: v3(d.boca.x / cmJuego, -d.boca.y / cmJuego, 0),
  pozo: v3(d.cargador.x / cmJuego, -d.cargador.y / cmJuego, 0),          // boca del pozo del cargador
  apoyo: v3(30, -1.2, 0),                                                 // la mano de apoyo, abajo del guardamanos
  manija: v3(19.5, 4.9, 3.0),                                             // la perilla de la manija de carga
  ventana: v3(R.x + R.w / 2, -(R.y + R.h / 2), 1.62),
  mira: v3(-6, 8.4, 0),                                                   // detrás del alza, a la altura del ojo
};
const AK3 = construirAK();
const TOPE_CARGADOR = P.pozo.clone().sub(AK3.centroCargador);   // la boca del cargador, en su propio marco (cm)
const soporte = new THREE.Group();            // pose de la mano derecha (o de la cámara sin visor)
const cabeceo = new THREE.Group();            // ajuste de dos manos y retroceso
const modelo = new THREE.Group();             // el arma en cm, con la boca hacia -z del soporte
soporte.add(cabeceo); cabeceo.add(modelo); escena.add(soporte);
modelo.rotation.y = Math.PI / 2; modelo.scale.setScalar(A_METROS);
modelo.position.copy(P.empunadura.clone().multiplyScalar(A_METROS).applyAxisAngle(v3(0, 1, 0), Math.PI / 2)).negate();
modelo.add(AK3.fijo, AK3.manija, AK3.cargador);
// La ventana de expulsión: el hueco y el cerrojo, que corre hacia atrás y deja ver la recámara
const ventana = new THREE.Group(); ventana.position.set(R.x, -(R.y + R.h), 1.63); modelo.add(ventana);
const hueco = new THREE.Mesh(new THREE.PlaneGeometry(R.w, R.h), new THREE.MeshBasicMaterial({ color: 0x050506 })); hueco.position.set(R.w / 2, R.h / 2, 0); ventana.add(hueco);
const cerrojo = new THREE.Mesh(new THREE.PlaneGeometry(1, R.h * 0.86), new THREE.MeshStandardMaterial({ color: 0x6a6f78, metalness: 0.8, roughness: 0.3 }));
cerrojo.position.set(R.w / 2, R.h / 2, 0.02); ventana.add(cerrojo);
function cerrojoEn(ab) {   // ab: 0 adelante … 1 atrás; se ve del borde de atrás de la ventana hasta la cara del cerrojo
  const ancho = Math.max(0, Math.min(R.w, R.w - ab * AK.recorrido));
  cerrojo.visible = ancho > 0.05; cerrojo.scale.x = Math.max(0.01, ancho); cerrojo.position.x = ancho / 2;
}
// Contador de balas en el costado izquierdo del cajón, inclinado hacia el que tira
const contador = texturaCanvas(256, 112, () => {});
const placa = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.45), new THREE.MeshBasicMaterial({ map: contador, transparent: true }));
placa.position.set(5.5, 3.0, -1.75); placa.rotation.set(0, Math.PI, 0); placa.rotateX(-0.5); modelo.add(placa);

/* ---------- Estado del arma ---------- */
const ak = { balas: AK.cargador - 1, recamara: true, puesto: true, gatillo: false, ultimoTiro: -1e9, tiroEn: -1e9, vaina: false, avisoVacio: false,
  manijaMano: 0, manijaAtras: false, golpeManija: null, retroceso: 0, disparos: 0, impactos: 0 };
let dosManos = false;
function dibujarContador() {
  const g = contador.lienzo.getContext('2d'), w = 256, h = 112;
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(12,10,14,0.72)'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 14); g.fill();
  const texto = ak.puesto ? `${ak.balas}${ak.recamara ? '+1' : ''}` : ak.recamara ? '0+1' : '—';
  g.fillStyle = ak.balas === 0 && !ak.recamara ? '#ff6b5a' : '#ffd27a'; g.font = '700 64px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, w / 2, h / 2 + 4);
  contador.needsUpdate = true;
  dibujarTablero();
}

/* ---------- Tablero de la línea de tiro ---------- */
const tablero = texturaCanvas(640, 320, () => {});
function dibujarTablero() {
  const g = tablero.lienzo.getContext('2d'), w = 640, h = 320;
  g.fillStyle = '#16131a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a96e'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = '#c9a96e'; g.font = '700 40px "Trebuchet MS", sans-serif'; g.textAlign = 'left'; g.fillText('CAMPO DE PRUEBAS · AK-47', 28, 62);
  g.fillStyle = '#f1e6d0'; g.font = '700 34px "Trebuchet MS", sans-serif';
  g.fillText(`Disparos: ${ak.disparos}`, 28, 128); g.fillText(`Impactos: ${ak.impactos}`, 330, 128);
  g.fillText(`Precisión: ${ak.disparos ? Math.round(100 * ak.impactos / ak.disparos) : 0} %`, 28, 182);
  g.font = '400 24px "Trebuchet MS", sans-serif'; g.fillStyle = 'rgba(241,230,208,0.75)';
  g.fillText('A: soltar cargador · agarre izquierdo: cargador nuevo', 28, 238); g.fillText('B o la manija con la mano izquierda: montar', 28, 276);
  tablero.needsUpdate = true;
}

/* ---------- Física simple: vainas y cargadores que caen ---------- */
const sueltos = [];
const geoVaina = new THREE.CylinderGeometry(0.0056, 0.0056, 0.039, 8); geoVaina.rotateZ(Math.PI / 2);
const matVaina = new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.9, roughness: 0.25 });
function soltar(objeto, vel, giro, tipo, alto) {
  escena.add(objeto);
  sueltos.push({ objeto, vel, giro, tipo, alto, rebotes: 0, vida: tipo === 'vaina' ? 9 : 25, quieto: false });
  if (sueltos.length > 90) { const v = sueltos.shift(); escena.remove(v.objeto); }
}
function actualizarSueltos(dt) {
  for (let i = sueltos.length - 1; i >= 0; i--) {
    const s = sueltos[i];
    s.vida -= dt;
    if (s.vida <= 0) { escena.remove(s.objeto); sueltos.splice(i, 1); continue; }
    if (s.quieto) continue;
    s.vel.y -= 9.8 * dt;
    s.objeto.position.addScaledVector(s.vel, dt);
    s.objeto.rotateX(s.giro.x * dt); s.objeto.rotateY(s.giro.y * dt); s.objeto.rotateZ(s.giro.z * dt);
    if (s.objeto.position.y < s.alto) {
      s.objeto.position.y = s.alto;
      if (s.vel.y < -0.8 && s.rebotes < 3) {
        if (s.rebotes === 0) Audio_.casquillo(s.tipo === 'vaina' ? 'bala' : 'cargador', 'asfalto', Math.min(1, -s.vel.y / 4));
        s.vel.y *= -0.32; s.vel.x *= 0.6; s.vel.z *= 0.6; s.giro.multiplyScalar(0.6); s.rebotes++;
      } else {   // queda tendido en el piso
        s.quieto = true;
        const e = new THREE.Euler().setFromQuaternion(s.objeto.quaternion, 'YXZ');
        if (s.tipo === 'vaina') s.objeto.rotation.set(0, e.y, 0, 'YXZ');
        else s.objeto.rotation.set(Math.PI / 2, e.y, 0, 'YXZ');
      }
    }
  }
}

/* ---------- Disparo, fogonazo e impactos ---------- */
const fogonazo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaCanvas(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 2, 64, 64, 60); r.addColorStop(0, 'rgba(255,250,220,1)'); r.addColorStop(0.25, 'rgba(255,200,90,0.9)'); r.addColorStop(1, 'rgba(255,120,20,0)');
  g.fillStyle = r; g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, rr = k % 2 ? 26 : 62; g.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); } g.fill();
}), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
fogonazo.visible = false; escena.add(fogonazo);
const luzBoca = new THREE.PointLight(0xffb45a, 0, 6, 2); escena.add(luzBoca);
let fogonazoHasta = 0;
const polvo = [];
const matPolvo = new THREE.SpriteMaterial({ map: texturaCanvas(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 1, 32, 32, 30); r.addColorStop(0, 'rgba(200,190,170,0.9)'); r.addColorStop(1, 'rgba(200,190,170,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }), depthWrite: false, transparent: true });
const rayo = new THREE.Raycaster();
const geoAgujero = new THREE.CircleGeometry(0.0055, 10), matAgujero = new THREE.MeshBasicMaterial({ color: 0x141012 });
const geoSangre = new THREE.CircleGeometry(0.014, 10), matSangre = new THREE.MeshBasicMaterial({ color: 0x5a0d08 });

function mundo(p) { return modelo.localToWorld(p.clone()); }
function direccionCanon() { const a = mundo(v3(0, 0, 0)), b = mundo(v3(100, 0, 0)); return b.sub(a).normalize(); }
let apuntarA = null;   // sin visor: el punto que mira el centro de la pantalla (la bala va de la boca hacia ahí)

function disparar(ahora) {
  ak.ultimoTiro = ahora; ak.tiroEn = ahora; ak.vaina = true; ak.disparos++;
  if (ak.puesto && ak.balas > 0) { ak.balas--; ak.recamara = true; } else ak.recamara = false;
  Audio_.disparo('metralleta', 'ak47');
  ak.retroceso = 1;
  const boca = mundo(P.boca);
  fogonazo.position.copy(boca); fogonazo.scale.setScalar(0.16 + Math.random() * 0.1); fogonazo.material.rotation = Math.random() * Math.PI; fogonazo.visible = true;
  luzBoca.position.copy(boca); luzBoca.intensity = 6; fogonazoHasta = ahora + 45;
  const dir = apuntarA ? apuntarA.clone().sub(boca).normalize() : direccionCanon();
  dir.x += (Math.random() - 0.5) * 0.004; dir.y += (Math.random() - 0.5) * 0.004; dir.normalize();   // dispersión de la AK
  impacto(boca, dir);
  vibrar('right', 0.7, 35); if (dosManos) vibrar('left', 0.35, 30);
  dibujarContador();
}
function impacto(origen, dir) {
  rayo.set(origen, dir); rayo.far = 120;
  const golpes = rayo.intersectObjects(objetos.map(o => o.malla), false);
  for (const h of golpes) {
    const o = objetos.find(x => x.malla === h.object);
    if (o.tipo === 'zombie') {
      if (o.caida > 0.5) continue;
      const c = carton.lienzo, px = Math.floor(h.uv.x * c.width), py = Math.floor((1 - h.uv.y) * c.height);
      if (c.getContext('2d').getImageData(px, py, 1, 1).data[3] < 128) continue;   // por el hueco del recorte
    }
    const normal = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : dir.clone().negate();
    if (normal.dot(dir) > 0) normal.negate();
    if (o.tipo === 'papel' || o.tipo === 'zombie') {
      const marca = new THREE.Mesh(o.tipo === 'zombie' ? geoSangre : geoAgujero, o.tipo === 'zombie' ? matSangre : matAgujero);
      marca.position.copy(h.point).addScaledVector(normal, 0.002); marca.lookAt(h.point.clone().add(normal));
      o.malla.worldToLocal(marca.position); marca.quaternion.premultiply(o.malla.getWorldQuaternion(new THREE.Quaternion()).invert());
      o.malla.add(marca); o.agujeros.push(marca); if (o.agujeros.length > 160) o.malla.remove(o.agujeros.shift());
      o.impactos++; ak.impactos++;
      if (o.tipo === 'zombie') { Audio_.impactoCarne(); if (o.impactos >= o.vida && o.caida === 0) { o.caida = 0.001; Audio_.zombieMuere(true); } }
    }
    const p = new THREE.Sprite(matPolvo); p.position.copy(h.point).addScaledVector(normal, 0.03); p.scale.setScalar(o.tipo === 'papel' ? 0.06 : 0.16);
    escena.add(p); polvo.push({ p, vida: 0.35 });
    return;
  }
}
function actualizarEfectos(ahora, dt) {
  if (ahora > fogonazoHasta) { fogonazo.visible = false; luzBoca.intensity = 0; }
  for (let i = polvo.length - 1; i >= 0; i--) { const q = polvo[i]; q.vida -= dt; q.p.material.opacity = Math.max(0, q.vida / 0.35); q.p.scale.multiplyScalar(1 + dt * 2); if (q.vida <= 0) { escena.remove(q.p); polvo.splice(i, 1); } }
  for (const b of blancos) if (b.tipo === 'zombie') {   // se cae para atrás, y a los 3 s se levanta de nuevo
    if (b.caida > 0 && b.caida < 1) { b.caida = Math.min(1, b.caida + dt / 0.35); if (b.caida === 1) b.caidoEn = ahora; }
    if (b.caida === 1 && ahora - b.caidoEn > 3000) { b.caida = 0.999; b.levanta = true; }
    if (b.levanta) { b.caida -= dt / 0.6; if (b.caida <= 0) { b.caida = 0; b.levanta = false; b.impactos = 0; for (const a of b.agujeros) b.malla.remove(a); b.agujeros = []; } }
    b.malla.rotation.x = -Math.PI / 2 * (b.caida * b.caida);
  }
}

/* ---------- El ciclo del arma en cada cuadro ---------- */
const pulso = p => p < 0.28 ? (p / 0.28) ** 2 * (3 - 2 * p / 0.28) : p < 0.5 ? 1 : 1 - ((p - 0.5) / 0.5) ** 2 * (3 - 2 * (p - 0.5) / 0.5);
function actualizarArma(ahora, dt) {
  if (ak.gatillo && ahora - ak.ultimoTiro >= AK.cadencia) {
    if (ak.recamara && ak.manijaMano < 0.05 && !ak.golpeManija) disparar(ahora);
    else if (!ak.avisoVacio) { Audio_.vacio(); ak.avisoVacio = true; ak.ultimoTiro = ahora; }
  }
  if (!ak.gatillo) ak.avisoVacio = false;
  // Cerrojo: va atrás con cada tiro (la manija con él, como en el juego), con la mano o con el golpe de B
  const t = ahora - ak.tiroEn, ciclo = t >= 0 && t < AK.ciclo ? pulso(t / AK.ciclo) : 0;
  let golpe = 0;
  if (ak.golpeManija) {
    const q = (ahora - ak.golpeManija) / 260;
    golpe = q < 0.45 ? q / 0.45 : Math.max(0, 1 - (q - 0.45) / 0.55);
    if (q >= 0.45 && !ak.manijaAtras) ak.manijaAtras = true;
    if (q >= 1) { ak.golpeManija = null; montar(); }
  }
  const ab = Math.max(ciclo, golpe, ak.manijaMano);
  AK3.manija.position.x = -ab * AK.recorrido;
  cerrojoEn(ab);
  if (ak.vaina && t >= AK.ciclo * 0.3) {   // la vaina sale por la ventana, hacia la derecha, arriba y un poco atrás
    ak.vaina = false;
    const v = new THREE.Mesh(geoVaina, matVaina); v.position.copy(mundo(P.ventana));
    v.quaternion.copy(modelo.getWorldQuaternion(new THREE.Quaternion()));
    const der = mundo(v3(0, 0, 100)).sub(mundo(v3(0, 0, 0))).normalize(), arriba = mundo(v3(0, 100, 0)).sub(mundo(v3(0, 0, 0))).normalize(), atras = direccionCanon().negate();
    const vel = der.multiplyScalar(1.5 + Math.random() * 0.8).addScaledVector(arriba, 1.4 + Math.random() * 0.8).addScaledVector(atras, 0.3 + Math.random() * 0.5);   // caen a 1–1,5 m, a la vista
    soltar(v, vel, v3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30), 'vaina', 0.0056);
  }
  // Retroceso: el arma va atrás y la boca sube; con las dos manos, la mitad
  ak.retroceso = Math.max(0, ak.retroceso - dt / 0.09);
  const k = ak.retroceso * ak.retroceso * (dosManos ? 0.5 : 1);
  cabeceo.position.set(0, 0, 0.018 * k);
  cabeceo.rotation.x = (dosManos ? ANGULO_APOYO : 0) + 0.06 * k;
}
const ANGULO_APOYO = -Math.atan2(P.apoyo.y - P.empunadura.y, P.apoyo.x - P.empunadura.x);
// Montar: la manija volvió adelante después de ir atrás; si había bala en la recámara, se pierde (sale entera)
function montar() {
  if (!ak.manijaAtras) return;
  ak.manijaAtras = false;
  if (ak.puesto && ak.balas > 0) { ak.balas--; ak.recamara = true; } else ak.recamara = false;
  Audio_.recarga('cerrojo', 'ak47'); vibrar('left', 0.5, 40); vibrar('right', 0.4, 30);
  dibujarContador();
}
function soltarCargador() {
  if (!ak.puesto) return;
  ak.puesto = false; ak.balas = 0;
  const c = AK3.cargador.clone(); AK3.cargador.visible = false;
  const pos = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  AK3.cargador.matrixWorld.decompose(pos, q, s);
  c.position.copy(pos); c.quaternion.copy(q); c.scale.copy(s); c.visible = true;
  soltar(c, v3(0, -0.4, 0), v3(0.6, 0, 1.4), 'cargador', 0.014);
  Audio_.recarga('cargador-sacar', 'ak47'); vibrar('right', 0.4, 40);
  dibujarContador();
}
function ponerCargador() {
  ak.puesto = true; ak.balas = AK.cargador; AK3.cargador.visible = true;
  Audio_.recarga('cargador-poner', 'ak47'); vibrar('left', 0.6, 50); vibrar('right', 0.5, 40);
  dibujarContador();
}

/* ---------- Visor: mandos ---------- */
const fabrica = new XRControllerModelFactory();
const manos = { right: null, left: null };
const previos = { right: [], left: [] };
for (let i = 0; i < 2; i++) {
  const rayoXR = renderer.xr.getController(i), agarre = renderer.xr.getControllerGrip(i);
  jugador.add(rayoXR); jugador.add(agarre);
  const modeloMando = fabrica.createControllerModel(agarre); agarre.add(modeloMando);
  rayoXR.addEventListener('connected', ev => { manos[ev.data.handedness] = { rayo: rayoXR, agarre, fuente: ev.data, modeloMando }; modeloMando.visible = ev.data.handedness !== 'right'; });
  rayoXR.addEventListener('disconnected', () => { for (const k of ['right', 'left']) if (manos[k] && manos[k].rayo === rayoXR) manos[k] = null; });
}
function vibrar(lado, fuerza, ms) {
  const m = manos[lado], h = m && m.fuente.gamepad && m.fuente.gamepad.hapticActuators && m.fuente.gamepad.hapticActuators[0];
  if (h && h.pulse) h.pulse(fuerza, ms);
}
const izquierda = { cargador: null, manija: null, inicioManija: null };
const cargadorEnMano = AK3.cargador.clone();
function entradaVisor(ahora, dt) {
  const der = manos.right, izq = manos.left;
  // Botones (gamepad «xr-standard»: 0 gatillo, 1 agarre, 4 A/X, 5 B/Y): se leen una vez por cuadro
  const leer = m => (m && m.fuente.gamepad ? m.fuente.gamepad.buttons : []).map(b => !!(b && b.pressed));
  const ahoraB = { right: leer(der), left: leer(izq) }, antes = { right: previos.right, left: previos.left };
  previos.right = ahoraB.right; previos.left = ahoraB.left;
  const boton = (m, lado, i) => !!ahoraB[lado][i];
  const apreto = (m, lado, i) => !!ahoraB[lado][i] && !antes[lado][i];
  const solto = (m, lado, i) => !ahoraB[lado][i] && !!antes[lado][i];
  // El arma en la mano derecha: el pistolete en el agarre y la boca hacia donde apunta el mando
  if (der) {
    const pA = der.agarre.getWorldPosition(v3()), qR = der.rayo.getWorldQuaternion(new THREE.Quaternion());
    soporte.position.copy(pA); soporte.quaternion.copy(qR);
    if (dosManos && izq) {   // con las dos manos: la línea entre las manos manda
      const pI = izq.agarre.getWorldPosition(v3()), arriba = v3(0, 1, 0).applyQuaternion(qR);
      soporte.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(pA, pI, arriba));
    }
    ak.gatillo = boton(der, 'right', 0);
    if (apreto(der, 'right', 4)) soltarCargador();                                   // A
    if (apreto(der, 'right', 5) && !ak.golpeManija) ak.golpeManija = ahora;            // B
    // Palanca derecha: girar de a 30°
    const ex = der.fuente.gamepad ? der.fuente.gamepad.axes[2] || 0 : 0;
    if (Math.abs(ex) > 0.7 && !girando) { girando = true; girar(-Math.sign(ex) * Math.PI / 6); } else if (Math.abs(ex) < 0.3) girando = false;
  }
  if (izq) {
    soporte.updateMatrixWorld(true);
    const pI = izq.agarre.getWorldPosition(v3());
    const agarra = apreto(izq, 'left', 1), suelta = solto(izq, 'left', 1), sostiene = boton(izq, 'left', 1);
    if (agarra) {
      if (pI.distanceTo(mundo(P.manija)) < 0.09) { izquierda.manija = true; izquierda.inicioManija = pI.clone(); }
      else if (pI.distanceTo(mundo(P.apoyo)) < 0.16) dosManos = true;
      else if (!izquierda.cargador && !ak.puesto) {   // del portacargador: uno nuevo en la mano
        izquierda.cargador = cargadorEnMano; izq.agarre.add(cargadorEnMano);   // la mano en el medio del cargador
        cargadorEnMano.scale.setScalar(A_METROS); cargadorEnMano.rotation.set(0, Math.PI / 2, 0); cargadorEnMano.position.set(0, 0, 0);
        cargadorEnMano.visible = true; vibrar('left', 0.3, 30);
      }
    }
    if (izquierda.manija && sostiene) {   // tira de la manija: lo que la mano va hacia atrás, a lo largo del arma
      const atras = direccionCanon().negate(), tiro = pI.clone().sub(izquierda.inicioManija).dot(atras) / A_METROS;
      ak.manijaMano = Math.max(0, Math.min(1, tiro / AK.recorrido));
      if (ak.manijaMano > 0.75) ak.manijaAtras = true;
      if (ak.manijaAtras && ak.manijaMano < 0.2) { ak.manijaMano = 0; montar(); }
    }
    if (izquierda.cargador && sostiene && !ak.puesto) {   // llevarlo al pozo lo encastra
      const tope = cargadorEnMano.localToWorld(TOPE_CARGADOR.clone());
      if (tope.distanceTo(mundo(P.pozo)) < 0.05) { izq.agarre.remove(cargadorEnMano); izquierda.cargador = null; ponerCargador(); }
    }
    if (suelta) {
      dosManos = false;
      if (izquierda.manija) { izquierda.manija = false; ak.manijaMano = 0; montar(); }
      if (izquierda.cargador) {   // se le cae de la mano
        const c = cargadorEnMano.clone(), pos = v3(), q = new THREE.Quaternion(), s = v3();
        cargadorEnMano.matrixWorld.decompose(pos, q, s); izq.agarre.remove(cargadorEnMano); izquierda.cargador = null;
        c.position.copy(pos); c.quaternion.copy(q); c.scale.copy(s); soltar(c, v3(0, -0.3, 0), v3(0.5, 0.2, 1), 'cargador', 0.014);
      }
    }
    // Palanca izquierda: caminar hacia donde mira la cabeza
    const gp = izq.fuente.gamepad, mx = gp ? gp.axes[2] || 0 : 0, mz = gp ? gp.axes[3] || 0 : 0;
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
  jugador.position.x = Math.max(-11.5, Math.min(11.5, jugador.position.x)); jugador.position.z = Math.max(-90, Math.min(4.5, jugador.position.z));
}

/* ---------- Sin visor: mouse y teclado ---------- */
const escritorio = { activo: false, guinada: 0, cabeceo: 0, teclas: new Set(), recarga: [] };
function entradaEscritorio(ahora, dt) {
  jugador.rotation.y = escritorio.guinada; camara.rotation.set(escritorio.cabeceo, 0, 0); camara.position.y = 1.65;
  const k = escritorio.teclas, mx = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0), mz = (k.has('KeyS') ? 1 : 0) - (k.has('KeyW') ? 1 : 0);
  if (mx || mz) caminar(mx, mz, dt);
  camara.updateMatrixWorld(true);
  // El arma abajo a la derecha de la vista; la bala va de la boca hacia lo que mira el centro de la pantalla
  soporte.position.copy(camara.localToWorld(v3(0.16, -0.25, -0.46)));
  const centro = new THREE.Raycaster(camara.getWorldPosition(v3()), camara.getWorldDirection(v3()), 0.1, 120);
  const h = centro.intersectObjects(objetos.map(o => o.malla), false)[0];
  apuntarA = h ? h.point : camara.localToWorld(v3(0, 0, -60));
  soporte.lookAt(apuntarA); soporte.rotateY(Math.PI);   // lookAt deja +z hacia el blanco; la boca va por -z
  // R: recarga entera, con los tiempos de la mano (sacar, traer el nuevo, montar si hace falta)
  for (let i = escritorio.recarga.length - 1; i >= 0; i--) if (ahora >= escritorio.recarga[i][0]) { escritorio.recarga[i][1](); escritorio.recarga.splice(i, 1); }
}
function recargaEscritorio() {
  if (escritorio.recarga.length) return;
  const t = performance.now(), vacia = !ak.recamara;
  escritorio.recarga.push([t, soltarCargador], [t + 650, ponerCargador]);
  if (vacia) escritorio.recarga.push([t + 1050, () => { ak.golpeManija = performance.now(); }]);
}
renderer.domElement.addEventListener('mousedown', ev => { if (!escritorio.activo) return; if (document.pointerLockElement !== renderer.domElement) { renderer.domElement.requestPointerLock(); return; } if (ev.button === 0) ak.gatillo = true; });
addEventListener('mouseup', () => { if (escritorio.activo) ak.gatillo = false; });
addEventListener('mousemove', ev => { if (!escritorio.activo || document.pointerLockElement !== renderer.domElement) return; escritorio.guinada -= ev.movementX * 0.0022; escritorio.cabeceo = Math.max(-1.3, Math.min(1.3, escritorio.cabeceo - ev.movementY * 0.0022)); });
addEventListener('keydown', ev => { if (!escritorio.activo) return; escritorio.teclas.add(ev.code); if (ev.code === 'KeyR') recargaEscritorio(); });
addEventListener('keyup', ev => escritorio.teclas.delete(ev.code));

/* ---------- Arranque ---------- */
const { tabla } = galpon();
blancoPapel(-2, -10); blancoPapel(2, -25); blancoPapel(-2, -50); zombieCarton(1.2, -17);
const cartel = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshBasicMaterial({ map: tablero }));
cartel.position.set(-1.25, 1.35, -1.5); cartel.rotation.y = 0.35; escena.add(cartel);
for (const [x, a] of [[0.35, 0.3], [0.55, -0.2]]) {   // cargadores de repuesto sobre el banco (decorado)
  const c = AK3.cargador.clone(); c.scale.setScalar(A_METROS); c.rotation.set(Math.PI / 2, a, 0, 'YXZ'); c.position.set(x - 0.1, 0.964, -1.1); escena.add(c);
}
dibujarContador();
jugador.position.set(0, 0, 0.2);

let previo = performance.now();
renderer.setAnimationLoop(() => {
  const ahora = performance.now(), dt = Math.min(0.05, (ahora - previo) / 1000); previo = ahora;
  if (renderer.xr.isPresenting) entradaVisor(ahora, dt); else if (escritorio.activo) entradaEscritorio(ahora, dt);
  soporte.updateMatrixWorld(true);
  actualizarArma(ahora, dt);
  actualizarSueltos(dt);
  actualizarEfectos(ahora, dt);
  renderer.render(escena, camara);
});

const portada = document.getElementById('portada'), estado = document.getElementById('estado'), entrar = document.getElementById('entrar');
renderer.xr.addEventListener('sessionstart', () => { portada.classList.add('oculta'); jugador.position.set(0, 0, 0.2); jugador.rotation.y = 0; });
renderer.xr.addEventListener('sessionend', () => { portada.classList.remove('oculta'); });
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

// Para las pruebas automáticas (CDP): disparar, recargar, mirar y leer el estado
window.__campo = {
  ak, escritorio, escena, jugador, blancos, sueltos,
  empezar() { escritorio.activo = true; portada.classList.add('oculta'); document.getElementById('mira').style.display = 'block'; },
  mirar(guinada, cabeceo) { escritorio.guinada = guinada; escritorio.cabeceo = cabeceo; },
  apretar(si) { ak.gatillo = si; },
  recargar: recargaEscritorio,
  soltarCargador, ponerCargador, montar: () => { ak.golpeManija = performance.now(); },
};
