/* ===== Zona Muerta VR: las armas, cómo funcionan =====
 * Cada arma se arma con su modelo del juego (vr/modelo3d.js) y acá se le da vida: gatillo, ciclo, munición, recarga
 * con la mano izquierda y miras. Mecánicas:
 *   semi     un tiro por apretada; la corredera cicla sola y, si se vacía, queda atrás (Glock)
 *   auto     tira mientras se aprieta, a su cadencia (AK-47)
 *   cerrojo  después de cada tiro hay que abrir y cerrar el cerrojo a mano (Remington 700)
 *   bomba    después de cada tiro, la bomba atrás y adelante con la mano de apoyo (Mossberg 500)
 * Munición: cargador (se suelta con A y la mano izquierda trae uno nuevo al pozo), tubo (cartuchos de a uno por el
 * portillo de abajo) o interna (con el cerrojo abierto, balas de a una por la ventana).
 * Marco del modelo: cm, x hacia la boca, y arriba, z al lado derecho. El soporte es la mano: la boca va por −z. */
import * as THREE from 'three';
import { construirArma, extruir, tornear, material, caja, v3 } from './modelo3d.js';
import { texturaCanvas } from './efectos.js';

export const A_METROS = 0.01;
const EJE_Y = v3(0, 1, 0);
// Sonido de cada mitad de la acción (eventos de Audio_.recarga): la corredera suena al tirarla, la manija de la AK al
// volver, el cerrojo al abrir y al cerrar, la bomba de una vez
const SONIDO_ACCION = { semi: { atras: 'corredera' }, auto: { adelante: 'cerrojo' }, cerrojo: { atras: 'cerrojo-abrir', adelante: 'cerrojo' }, bomba: { atras: 'bombear' } };
const pulso = p => p < 0.28 ? (p / 0.28) ** 2 * (3 - 2 * p / 0.28) : p < 0.5 ? 1 : 1 - ((p - 0.5) / 0.5) ** 2 * (3 - 2 * (p - 0.5) / 0.5);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- Munición en 3D: cartucho o vaina del calibre del arma (cm, base en x=0 y punta hacia +x) ---------- */
const MAT_LATON = new THREE.MeshStandardMaterial({ color: 0xb39b62, metalness: 0.9, roughness: 0.3 });
const MAT_COBRE = new THREE.MeshStandardMaterial({ color: 0xa57553, metalness: 0.85, roughness: 0.32 });
const MAT_PLASTICO = new THREE.MeshStandardMaterial({ color: 0x99443b, metalness: 0.05, roughness: 0.45 });
const MAT_OLIVA = new THREE.MeshStandardMaterial({ color: 0x5b6440, metalness: 0.2, roughness: 0.55 });
const torno = (perfil, mat) => { const g = new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 18); g.rotateZ(-Math.PI / 2); return new THREE.Mesh(g, mat); };
export function cartucho3d(id, conBala = true) {
  const cal = calibreDe(id), r = cal.d / 2, L = cal.vaina, g = new THREE.Group();
  if (cal.forma === 'escopeta') {   // cartucho del 12: culote de latón y tubo de plástico rojo, cerrado en estrella
    g.add(torno([[0, 0], [r * 1.04, 0], [r * 1.04, 0.12], [r, 0.14], [r, 0.9], [0, 0.9]], MAT_LATON));
    g.add(torno([[0, 0.9], [r * 0.98, 0.9], [r * 0.98, L - 0.25], [r * 0.8, L], [0, L - (conBala ? 0.05 : 0.6)]], MAT_PLASTICO));
    return g;
  }
  if (cal.forma === 'granada') {   // 40 mm: vaina de aluminio y el proyectil oliva con la ojiva dorada
    g.add(torno([[0, 0], [r, 0], [r, L], [0, L]], new THREE.MeshStandardMaterial({ color: 0x9da2a8, metalness: 0.8, roughness: 0.35 })));
    if (conBala) { g.add(torno([[0, L], [r * 0.97, L], [r * 0.97, L + cal.punta * 0.45], [0, L + cal.punta * 0.45]], MAT_OLIVA)); g.add(torno([[r * 0.97, L + cal.punta * 0.45], [r * 0.7, L + cal.punta * 0.8], [r * 0.25, L + cal.punta], [0, L + cal.punta]], MAT_LATON)); }
    return g;
  }
  const cuello = cal.forma === 'cuello' ? (cal.cuello ?? 0.75) * r : r;
  const vaina = cal.forma === 'cuello'
    ? [[0, 0], [r * 1.02, 0], [r * 1.02, 0.1], [r * 0.9, 0.14], [r * 0.9, 0.2], [r, 0.25], [r * 0.97, L * 0.78], [cuello, L * 0.88], [cuello, L], [cuello * 0.8, L]]
    : [[0, 0], [r * 1.02, 0], [r * 1.02, 0.1], [r * 0.9, 0.14], [r * 0.9, 0.2], [r, 0.25], [r, L], [r * 0.85, L]];
  g.add(torno(vaina, MAT_LATON));
  if (conBala && cal.punta > 0) {
    const rb = cuello * 0.96, P = cal.punta, perfil = [[rb, L - 0.05]];
    for (let k = 1; k <= 8; k++) { const t = k / 8; const f = cal.nariz === 'chata' ? Math.min(1, (1 - t) * 1.6) * 0.75 + 0.25 * (1 - t) : cal.nariz === 'redonda' ? Math.sqrt(1 - t * t) : Math.pow(1 - t, 0.7); perfil.push([Math.max(cal.nariz === 'chata' && k === 8 ? rb * 0.45 : 0.001, rb * f), L + P * (0.15 + 0.85 * t)]); }
    perfil.push([0, L + P]);
    g.add(torno(perfil, MAT_COBRE));
  }
  return g;
}

/* ---------- Definiciones: cómo se pasa cada arma a 3D y cómo funciona ---------- */
const P = (x, y, z = 0) => v3(x, y, z);
export const DEFS = {
  glock: {
    mecanica: 'semi', bloqueo: true, municion: 'cargador', ciclo: 60, fogonazo: 0.12, cono: 0.005, vibra: 0.5,
    retroceso: { atras: 0.012, sube: 0.18, dura: 0.11 },
    empunadura: [-1.6, -5.0], apoyo: { punto: [-1.4, -6.5], modo: 'estabiliza', radio: 0.12 },
    accion: { parte: 'corredera', punto: [-3.5, 2.5, 0], radio: 0.065, sonido: 'corredera' },
    expulsion: [3.3, 2.5, 1.3], mira: { alza: [-2.65, 3.1], poste: [14.7, 3.0] },
    contador: { x: 9.5, y: -1.0, z: -1.62, ancho: 4.2 },
    modelo: {
      materiales: { '#b0966f': 'polimero' },
      piezas: { 0: { t: 3.0 }, 1: { t: 3.0 }, 2: { t: 0.6 }, 3: { t: 3.3 }, 4: { t: 3.25 }, 5: { t: 3.1 }, 6: { redonda: 'x' },
        7: { t: 2.55 }, 8: { t: 0.32 }, 9: { t: 1.1, partir: 0.3 }, 10: { t: 0.06, z: 1.3 } },
      movimientos: { corredera: { estado: 'corredera' } },
      anchoCargador: 2.2,
    },
  },
  ak47: {
    mecanica: 'auto', municion: 'cargador', ciclo: 75, fogonazo: 0.2, cono: 0.004, vibra: 0.7,
    retroceso: { atras: 0.018, sube: 0.06, dura: 0.09 },
    empunadura: [-1.0, -5.0], apoyo: { punto: [30, -1.2], modo: 'linea', radio: 0.16 },
    accion: { parte: 'manija', punto: [19.5, 4.9, 3.0], radio: 0.09, sonido: 'cerrojo' },
    expulsion: null, contador: { x: 5.5, y: 3.0, z: -1.75, ancho: 5.6, inclinado: true },
    modelo: {
      // espesor (cm) de cada una de las 25 piezas del dibujo; redondas: cañón, tubo de gases, varilla y tuerca
      piezas: { 0: { t: 3.8 }, 1: { t: 4.0 }, 2: { t: 2.9 }, 3: { t: 0.7 }, 4: { t: 2.6 }, 5: { t: 2.9 }, 6: { t: 3.0 }, 7: { omitir: true }, 8: { t: 3.2 },
        9: { t: 3.4 }, 10: { t: 3.5 }, 11: { t: 2.4, techo: 7.8 }, 12: { t: 1.6, partir: 0.3 }, 13: { t: 4.2 }, 14: { t: 4.4 }, 15: { redonda: 'x' }, 16: { t: 3.4 },
        17: { t: 2.2 }, 18: { redonda: 'x' }, 19: { redonda: 'x' }, 20: { t: 1.8 }, 21: { omitir: true }, 22: { redonda: 'x' }, 23: { t: 0.9, z: 1.9 }, 24: { t: 1.6, z: 2.5 } },
      movimientos: { manija: { estado: 'corredera', piezas: [23, 24] } },
      extras(a) {
        // Guion: base hasta el pie del poste, una oreja a cada lado y el poste fino en el medio (el dibujo es de costado:
        // extruido tal cual era una placa de 1,4 cm sin poste y no se podía apuntar)
        const g = a.base[21], hoja = a.base[12], ch = caja(hoja.pts), alto = -ch.y0 + 0.1;   // la punta de la hoja (con bisel)
        const pie = g.pts.map(([x, y]) => [x, Math.max(y, -5.8)]), m = a.mat(g.color);
        a.raiz.add(extruir(pie, [], m, -0.4, 0.4), extruir(g.pts, g.huecos, m, 0.4, 0.7), extruir(g.pts, g.huecos, m, -0.7, -0.4),
          extruir([[57.75, -5.8], [58.05, -5.8], [58.05, -alto], [57.75, -alto]], [], m, -0.12, 0.12));
        a.mira = { alza: P(ch.x0 - 0.1, alto), poste: P(57.9, alto) };
        // Ventana de expulsión: el hueco y el cerrojo, que corre hacia atrás con cada tiro y deja ver la recámara
        const R = RECAMARAS.ak47, ventana = new THREE.Group(); ventana.position.set(R.x, -(R.y + R.h), 1.63); a.raiz.add(ventana);
        const hueco = new THREE.Mesh(new THREE.PlaneGeometry(R.w, R.h), new THREE.MeshBasicMaterial({ color: 0x050506 })); hueco.position.set(R.w / 2, R.h / 2, 0); ventana.add(hueco);
        const cerrojo = new THREE.Mesh(new THREE.PlaneGeometry(1, R.h * 0.86), new THREE.MeshStandardMaterial({ color: 0x6a6f78, metalness: 0.8, roughness: 0.3 }));
        cerrojo.position.set(R.w / 2, R.h / 2, 0.02); ventana.add(cerrojo);
        a.alAccion = t => { const ancho = Math.max(0, Math.min(R.w, R.w - t * 8)); cerrojo.visible = ancho > 0.05; cerrojo.scale.x = Math.max(0.01, ancho); cerrojo.position.x = ancho / 2; };
        a.expulsion = P(R.x + R.w / 2, -(R.y + R.h / 2), 1.62);
      },
    },
  },
  remington700: {
    mecanica: 'cerrojo', municion: 'interna', fogonazo: 0.3, cono: 0.0008, vibra: 1,
    retroceso: { atras: 0.03, sube: 0.12, dura: 0.16 },
    empunadura: [-4.0, -3.5], apoyo: { punto: [27, -1.6], modo: 'linea', radio: 0.16 },
    accion: { parte: 'cerrojo', punto: [5.7, 1.0, 3.6], radio: 0.08, sonido: 'cerrojo' },
    carga: { punto: [13, 5.6, 1.2], radio: 0.07 }, expulsion: [13, 5.4, 1.4],
    mira: { telescopica: { eje: 8.35, ocular: 0.75, objetivo: 35.6, aumento: 6, radio: 1.75 } },
    contador: { x: -12, y: -1.5, z: -2.15, ancho: 5 },
    modelo: {
      materiales: { '#141414': 'goma', '#17110d': 'goma' },
      piezas: { 0: { redonda: { eje: 'x', centro: -3.7, radio: 1.7 } }, 1: { redonda: 'x' }, 2: { t: 4.2 }, 3: { t: 4.3 }, 4: { t: 1.2 }, 5: { t: 4.0 },
        6: { redonda: 'x' }, 7: { redonda: 'y', z: 3.6 }, 8: { t: 2.6 }, 9: { t: 2.6 }, 10: { redonda: 'x' }, 11: { redonda: 'x' }, 12: { redonda: 'x' },
        13: { redonda: 'y' }, 14: { omitir: true } },
      movimientos: { cerrojo: { estado: 'corredera' } },
      cargador: false,
      extras(a) {
        const m = a.mat('#232429');
        // La palanca del cerrojo: del costado del cajón a la bola (el dibujo de costado solo tiene la bola)
        const palanca = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 3.3, 10), m);
        palanca.rotation.x = Math.PI / 2; palanca.rotation.z = 0.35; palanca.position.set(5.2, 2.3, 2.1); a.partes.cerrojo.grupo.add(palanca);
        // Perilla de deriva, al costado derecho de la mira
        const deriva = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 1.4, 16), a.mat('#26272b')); deriva.rotation.x = Math.PI / 2; deriva.position.set(16.5, 8.4, 1.9); a.raiz.add(deriva);
      },
    },
  },
  mossberg: {
    mecanica: 'bomba', municion: 'tubo', fogonazo: 0.32, cono: 0.045, vibra: 1,
    retroceso: { atras: 0.035, sube: 0.15, dura: 0.17 },
    empunadura: [-4.5, -2.6], apoyo: { punto: [37, -1.2], modo: 'bomba', radio: 0.16 },
    accion: { parte: 'bomba', sonido: 'bombear' },
    carga: { punto: [12.2, -0.4, 0], radio: 0.07 }, expulsion: [11, 3.6, 1.9],
    mira: { alza: [1.5, 6.1], poste: [66.5, 6.3] },
    contador: { x: 8, y: 2.0, z: -1.85, ancho: 5 },
    modelo: {
      materiales: { '#646b7b': 'polimero', '#3c414b': 'goma' },
      piezas: { 0: { redonda: 'x' }, 1: { redonda: 'x' }, 2: { redonda: 'x' }, 3: { t: 2.6 }, 4: { t: 4.0 }, 5: { t: 4.1 }, 6: { t: 3.6 }, 7: { t: 1.0 },
        8: { redonda: 'x' }, 9: { t: 0.06, z: 1.85 } },
      movimientos: { bomba: { estado: 'bombeo' } },
      cargador: false,
      extras(a) {
        const m = a.mat('#3c414b', 'metal');
        // Guardamonte y cola del disparador (el dibujo los traza con líneas) y el punto de mira de la boca
        const guarda = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.28, 8, 20, Math.PI), m); guarda.rotation.z = Math.PI; guarda.position.set(-1.0, 0.2, 0); a.raiz.add(guarda);
        const cola = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.0, 0.5), m); cola.position.set(-0.6, -0.9, 0); cola.rotation.z = 0.25; a.raiz.add(cola);
        const punto = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), new THREE.MeshStandardMaterial({ color: 0xd8d2c0, metalness: 0.6, roughness: 0.3 })); punto.position.set(66.5, 6.06, 0); a.raiz.add(punto);
      },
    },
  },
};

/* ---------- El arma en el mundo ---------- */
export class Arma {
  /* mundo: { escena, efectos, disparo(origen, dir, golpe), vibrar(lado, fuerza, ms) } */
  constructor(id, mundo) {
    const def = DEFS[id];
    this.id = id; this.def = def; this.datos = ARMAS[id]; this.mundo = mundo; this.nombre = this.datos.nombre;
    this.a = construirArma({ id, ...def.modelo });
    this.soporte = new THREE.Group(); this.cabeceo = new THREE.Group(); this.modelo = new THREE.Group();
    this.soporte.add(this.cabeceo); this.cabeceo.add(this.modelo); this.modelo.add(this.a.raiz);
    this.modelo.rotation.y = Math.PI / 2; this.modelo.scale.setScalar(A_METROS);
    this.modelo.position.copy(v3(def.empunadura[0], def.empunadura[1], 0).multiplyScalar(A_METROS).applyAxisAngle(EJE_Y, Math.PI / 2)).negate();
    mundo.escena.add(this.soporte);
    // Puntos del arma (cm)
    const d = DIBUJO_ARMAS[id];
    this.boca = d.boca ? P(d.boca.x / CM, -d.boca.y / CM) : P(0, 0);
    this.expulsion = this.a.expulsion || (def.expulsion ? P(...def.expulsion) : d.expulsion ? P(d.expulsion.x / CM, -d.expulsion.y / CM, 1.5) : P(0, 0));
    this.pozo = d.cargador ? P(d.cargador.x / CM, -d.cargador.y / CM) : P(0, 0);
    this.mira = this.a.mira || (def.mira && def.mira.alza ? { alza: P(...def.mira.alza), poste: P(...def.mira.poste) } : null);
    this.anguloApoyo = def.apoyo && def.apoyo.modo !== 'estabiliza' ? -Math.atan2(def.apoyo.punto[1] - def.empunadura[1], def.apoyo.punto[0] - def.empunadura[0]) : 0;
    this.parteAccion = def.accion && this.a.partes[def.accion.parte];
    this.recorrido = this.parteAccion ? this.recorridoDe(this.parteAccion) : 8;
    if (def.vertical) this.ponerVertical(def.empunadura);
    // Estado: lleno y con bala en la recámara (como el juego: el total es la capacidad)
    this.capacidad = this.datos.cargador; this.municion = this.capacidad - 1; this.recamara = true; this.vaina = false; this.puesto = true;
    this.gatilloApretado = false; this.pulso = false; this.ultimoTiro = -1e9; this.tiroEn = -1e9; this.avisoVacio = false;
    this.retroceso = 0; this.dosManos = false; this.modoApoyo = def.apoyo ? def.apoyo.modo : null;
    this.accion = 0; this.atrasHecho = false; this.bloqueada = false; this.golpeB = null; this.manoAccion = null; this.cola = [];
    this.disparos = 0; this.impactos = 0; this.apuntarA = null;
    if (def.contador) this.crearContador(def.contador);
    if (def.mira && def.mira.telescopica) this.crearMira(def.mira.telescopica);
    this.dibujarContador();
  }
  ponerVertical(e) {
    const base = new THREE.Matrix4().makeBasis(v3(0, -1, 0), v3(0, 0, -1), v3(1, 0, 0));
    this.modelo.rotation.set(0, 0, 0); this.modelo.quaternion.setFromRotationMatrix(base);
    this.modelo.position.copy(v3(e[0], e[1], 0).multiplyScalar(A_METROS).applyMatrix4(base)).negate();
  }
  // Recorrido de la parte que se mueve (cm): lo que se corre su primer punto de un extremo al otro
  recorridoDe(parte) { const a = parte.ajuste; return a.ang ? 6 : Math.hypot(a.dx, a.dy) || 8; }

  /* --- Puntos en el mundo --- */
  mundoDe(p) { return this.modelo.localToWorld(p.clone()); }
  direccion() { const a = this.mundoDe(P(0, 0)), b = this.mundoDe(P(100, 0)); return b.sub(a).normalize(); }
  direccionMira() {
    if (this.telescopica || !this.mira) return this.direccion();
    return this.mundoDe(this.mira.poste).sub(this.mundoDe(this.mira.alza)).normalize();
  }
  posicionAccion() { const a = this.def.accion; if (!a || !a.punto) return null; return (this.parteAccion ? this.parteAccion.grupo : this.a.raiz).localToWorld(P(...a.punto)); }

  /* --- Contador de balas sobre el arma --- */
  crearContador(c) {
    this.texContador = texturaCanvas(256, 112, () => {});
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(c.ancho, c.ancho * 0.4375), new THREE.MeshBasicMaterial({ map: this.texContador, transparent: true }));
    placa.position.set(c.x, c.y, c.z); placa.rotation.set(0, Math.PI, 0); if (c.inclinado) placa.rotateX(-0.5);
    this.a.raiz.add(placa);
  }
  dibujarContador() {
    if (!this.texContador) return;
    const g = this.texContador.lienzo.getContext('2d'), w = 256, h = 112;
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(12,10,14,0.72)'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 14); g.fill();
    const enArma = this.def.municion === 'cargador' && !this.puesto ? '—' : String(this.municion);
    const texto = `${enArma}${this.recamara ? '+1' : ''}`;
    g.fillStyle = this.municion === 0 && !this.recamara ? '#ff6b5a' : '#ffd27a'; g.font = '700 64px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, w / 2, h / 2 + 4);
    this.texContador.needsUpdate = true;
    if (this.alCambiar) this.alCambiar(this);
  }

  /* --- Mira telescópica: lo que ve una cámara angosta desde el objetivo, en la lente del ocular, con la retícula --- */
  crearMira(t) {
    this.rtMira = new THREE.WebGLRenderTarget(512, 512);
    this.camMira = new THREE.PerspectiveCamera(30 / t.aumento, 1, 0.05, 220);   // la lente se ve de unos 30°: aumenta t.aumento veces
    const lente = new THREE.Mesh(new THREE.CircleGeometry(t.radio, 40), new THREE.MeshBasicMaterial({ map: this.rtMira.texture }));
    lente.position.set(t.ocular - 0.02, t.eje, 0); lente.rotation.y = -Math.PI / 2; this.a.raiz.add(lente);
    const reticula = texturaCanvas(256, 256, (g, w) => {
      g.strokeStyle = '#000'; g.lineWidth = 7; for (const [a, b, c, d] of [[0, w / 2, w * 0.4, w / 2], [w * 0.6, w / 2, w, w / 2], [w / 2, 0, w / 2, w * 0.4], [w / 2, w * 0.6, w / 2, w]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
      g.lineWidth = 1.6; g.beginPath(); g.moveTo(w * 0.4, w / 2); g.lineTo(w * 0.6, w / 2); g.moveTo(w / 2, w * 0.4); g.lineTo(w / 2, w * 0.6); g.stroke();
      g.fillStyle = 'rgba(200,20,10,0.9)'; g.beginPath(); g.arc(w / 2, w / 2, 2.2, 0, 7); g.fill();
      const v = g.createRadialGradient(w / 2, w / 2, w * 0.36, w / 2, w / 2, w * 0.5); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.95)'); g.fillStyle = v; g.fillRect(0, 0, w, w);
    });
    const ret = new THREE.Mesh(new THREE.CircleGeometry(t.radio, 40), new THREE.MeshBasicMaterial({ map: reticula, transparent: true, depthWrite: false }));
    ret.position.set(t.ocular - 0.05, t.eje, 0); ret.rotation.y = -Math.PI / 2; this.a.raiz.add(ret);
    const vidrio = new THREE.Mesh(new THREE.CircleGeometry(t.radio * 1.4, 32), new THREE.MeshStandardMaterial({ color: 0x0d1a24, metalness: 0.9, roughness: 0.08 }));
    vidrio.position.set(t.objetivo + 0.02, t.eje, 0); vidrio.rotation.y = Math.PI / 2; this.a.raiz.add(vidrio);
    this.lenteMira = lente; this.telescopica = t;
  }
  renderizarMira(renderer, escena) {
    if (!this.camMira) return;
    const t = this.telescopica, desde = this.mundoDe(P(t.objetivo + 1, t.eje)), hacia = this.mundoDe(P(t.objetivo + 101, t.eje));
    this.camMira.position.copy(desde); this.camMira.up.copy(this.mundoDe(P(0, 100)).sub(this.mundoDe(P(0, 0))).normalize());
    this.camMira.lookAt(hacia); this.camMira.updateMatrixWorld();
    const xr = renderer.xr.enabled, antes = renderer.getRenderTarget();
    renderer.xr.enabled = false; renderer.setRenderTarget(this.rtMira); renderer.render(escena, this.camMira);
    renderer.setRenderTarget(antes); renderer.xr.enabled = xr;
  }

  /* --- Gatillo y botones --- */
  // Cada apretada queda guardada hasta que el arma la procesa (un toque más corto que un cuadro también tira)
  gatillo(apretado) { if (apretado && !this.gatilloApretado) this.pulso = true; if (!apretado) this.avisoVacio = false; this.gatilloApretado = apretado; }
  accionCerrada() { return this.accion < 0.05 && !this.golpeB && !this.bloqueada; }
  listo() { return this.recamara && this.accionCerrada(); }
  botonA() {   // suelta el cargador
    if (this.def.municion === 'cargador' && this.puesto) this.soltarCargador();
  }
  botonB(ahora) {   // monta sin la mano: la acción atrás y adelante (o suelta la corredera trabada)
    if (this.golpeB || this.manoAccion) return;
    this.golpeB = { desde: ahora, soloAdelante: this.bloqueada };
  }

  /* --- Disparo --- */
  disparar(ahora) {
    const def = this.def, manual = def.mecanica === 'cerrojo' || def.mecanica === 'bomba';
    this.ultimoTiro = ahora; this.tiroEn = ahora; this.disparos++; this.recamara = false;
    if (manual) this.vaina = true;
    else {
      this.expulsarEn = ahora + def.ciclo * 0.3;
      if (this.puesto && this.municion > 0) { this.municion--; this.recamara = true; }
      else if (def.bloqueo) this.bloqueada = true;
    }
    Audio_.disparo(this.datos.categoria, this.id);
    this.retroceso = 1;
    const boca = this.mundoDe(this.boca), dirMira = this.apuntarA ? this.apuntarA.clone().sub(boca).normalize() : this.direccionMira();
    this.mundo.efectos.disparo(boca, this.direccion(), ahora, def.fogonazo);
    const n = this.datos.perdigones || 1, cono = def.cono, tiro = { impacto: false };   // los perdigones de un tiro cuentan como un tiro
    for (let k = 0; k < n; k++) {
      const dir = dirMira.clone();
      const a = Math.random() * Math.PI * 2, r = (n > 1 ? Math.sqrt(Math.random()) : Math.random() - 0.5) * cono;
      const u = v3(1, 0, 0).cross(dir).normalize(), w = dir.clone().cross(u);
      dir.addScaledVector(u, Math.cos(a) * r).addScaledVector(w, Math.sin(a) * r).normalize();
      this.mundo.disparo(boca, dir, { dano: this.datos.dano / n * (n > 1 ? 1.6 : 1), tipo: n > 1 ? 'perdigon' : 'bala', arma: this, tiro, primero: k === 0 });
    }
    this.mundo.vibrar('right', def.vibra, 35); if (this.dosManos) this.mundo.vibrar('left', def.vibra * 0.5, 30);
    this.dibujarContador();
  }
  // Una vaina (o un cartucho entero) sale por la ventana, hacia la derecha, arriba y un poco atrás
  expulsar(conBala = false) {
    const pieza = cartucho3d(this.id, conBala); pieza.scale.setScalar(A_METROS);
    pieza.position.copy(this.mundoDe(this.expulsion)); pieza.quaternion.copy(this.modelo.getWorldQuaternion(new THREE.Quaternion()));
    const der = this.mundoDe(P(0, 0, 100)).sub(this.mundoDe(P(0, 0, 0))).normalize(), arriba = this.mundoDe(P(0, 100, 0)).sub(this.mundoDe(P(0, 0, 0))).normalize(), atras = this.direccion().negate();
    const vel = der.multiplyScalar(1.4 + Math.random() * 0.8).addScaledVector(arriba, 1.3 + Math.random() * 0.8).addScaledVector(atras, 0.3 + Math.random() * 0.5);
    const cal = calibreDe(this.id), s = this.mundo.efectos.soltar(pieza, vel, v3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30), 'vaina', cal.d / 2 * A_METROS);
    s.sonido = f => Audio_.casquillo(cal.forma === 'escopeta' ? 'grande' : cal.d > 1.15 ? 'bala' : 'pistola', 'asfalto', f);
  }

  /* --- La acción (corredera, manija, cerrojo, bomba): atrás expulsa, adelante carga --- */
  ponerAccion(t) {
    this.accion = limitar(t, 0, 1);
    if (this.accion > 0.8 && !this.atrasHecho) this.atras();
    if (this.accion < 0.15 && this.atrasHecho) this.adelante();
  }
  atras() {
    this.atrasHecho = true;
    if (this.vaina) { this.expulsar(false); this.vaina = false; }
    else if (this.recamara) { this.expulsar(true); this.recamara = false; }
    const s = SONIDO_ACCION[this.def.mecanica]; if (s.atras) Audio_.recarga(s.atras, this.id);
    this.mundo.vibrar('left', 0.4, 30);
    this.dibujarContador();
  }
  adelante() {
    this.atrasHecho = false;
    const liberar = this.bloqueada;
    this.bloqueada = false;
    if (!this.recamara && this.municion > 0 && (this.puesto || this.def.municion !== 'cargador')) { this.municion--; this.recamara = true; }
    const s = liberar ? 'liberar' : SONIDO_ACCION[this.def.mecanica].adelante; if (s) Audio_.recarga(s, this.id);
    this.mundo.vibrar('left', 0.5, 40); this.mundo.vibrar('right', 0.35, 30);
    this.dibujarContador();
  }
  // La mano izquierda agarra la acción (o la bomba) y la lleva atrás o adelante a lo largo del arma
  agarrarAccion(pos) { this.manoAccion = { inicio: pos.clone(), t0: this.accion }; }
  moverAccion(pos) {
    if (!this.manoAccion) return;
    const atras = this.direccion().negate(), d = pos.clone().sub(this.manoAccion.inicio).dot(atras) / A_METROS;
    this.ponerAccion(this.manoAccion.t0 + d / this.recorrido);
  }
  soltarAccion() {
    if (!this.manoAccion) return;
    this.manoAccion = null;
    // la corredera y la manija vuelven solas (resorte); el cerrojo y la bomba quedan donde los dejó la mano
    if (this.def.mecanica === 'semi' || this.def.mecanica === 'auto') { if (this.atrasHecho || !this.bloqueada) this.ponerAccion(0); }
  }

  /* --- Cargador y munición de la mano izquierda --- */
  soltarCargador() {
    this.puesto = false; this.municion = 0;
    const c = this.a.cargadorSuelto(); const g = new THREE.Group(); g.add(c); g.scale.setScalar(A_METROS);
    this.modelo.updateMatrixWorld(true); this.modelo.matrixWorld.decompose(g.position, g.quaternion, new THREE.Vector3());
    this.a.cargador.visible = false;
    const s = this.mundo.efectos.soltar(g, v3(0, -0.4, 0), v3(0.6, 0, 1.4), 'cargador', 0.012);
    s.sonido = f => Audio_.casquillo('cargador', 'asfalto', f);
    s.alPosarse = () => {};   // queda como cayó
    Audio_.recarga('cargador-sacar', this.id); this.mundo.vibrar('right', 0.4, 40);
    this.dibujarContador();
  }
  ponerCargador() {
    this.puesto = true; this.municion = this.capacidad; this.a.cargador.visible = true;
    Audio_.recarga('cargador-poner', this.id); this.mundo.vibrar('left', 0.6, 50); this.mundo.vibrar('right', 0.5, 40);
    this.dibujarContador();
  }
  /* Qué saca la mano izquierda del cinto para esta arma, si ahora le hace falta: { objeto, tipo, refs (cm del arma) }
   * El objeto va pegado al agarre de la mano; refs son puntos que, cuando coinciden con los del arma, entra. */
  municionParaMano() {
    const def = this.def;
    if (def.municion === 'cargador') {
      if (this.puesto) return null;
      const c = this.a.cargadorSuelto(), info = CARGADORES[this.id];
      const agarre = info ? P(info.agarre[0], -info.agarre[1]) : this.pozo.clone().add(P(0, -6));
      const box = new THREE.Box3().setFromObject(c), arriba = P((box.min.x + box.max.x) / 2, box.max.y), abajo = agarre.clone();
      return { tipo: 'cargador', cuerpo: c, agarre, refs: [arriba, abajo], tolerancia: 0.06 };
    }
    if (def.municion === 'tubo' && this.municion < this.capacidad) return { tipo: 'cartucho', cuerpo: cartucho3d(this.id, true), punta: true };
    if (def.municion === 'interna' && this.accion > 0.8 && this.municion < this.capacidad) return { tipo: 'bala', cuerpo: cartucho3d(this.id, true), punta: true };
    return null;
  }
  // ¿Entra lo que trae la mano? m: { tipo, objeto (en la mano), refs, ... }
  probarCarga(m) {
    if (m.tipo === 'cargador') {
      if (this.puesto) return false;
      // entra si la boca llega a su lugar y no está muy torcido (hasta unos 70°): como en un juego, no hace falta precisión de taller
      const [r0, r1] = m.refs, a0 = m.objeto.localToWorld(r0.clone()), a1 = m.objeto.localToWorld(r1.clone()), b0 = this.mundoDe(r0), b1 = this.mundoDe(r1);
      const ok = a0.distanceTo(b0) < m.tolerancia + 0.01 && a0.clone().sub(a1).normalize().dot(b0.clone().sub(b1).normalize()) > 0.34;
      if (ok) this.ponerCargador();
      return ok;
    }
    const c = this.def.carga; if (!c) return false;
    if (m.tipo === 'bala' && this.accion < 0.8) return false;
    if (this.municion >= this.capacidad) return false;
    const punta = m.objeto.localToWorld(P(calibreDe(this.id).vaina + calibreDe(this.id).punta * 0.5, 0));
    if (punta.distanceTo(this.mundoDe(P(...c.punto))) > c.radio) return false;
    this.municion++;
    Audio_.recarga(m.tipo === 'cartucho' ? 'cartucho' : 'bala', this.id); this.mundo.vibrar('left', 0.4, 30);
    this.dibujarContador();
    return true;
  }
  // Zonas que agarra la mano izquierda, en el mundo: la acción (si se agarra a mano) y el apoyo
  zonas() {
    const z = [];
    const pa = this.posicionAccion(); if (pa) z.push({ tipo: 'accion', punto: pa, radio: this.def.accion.radio });
    if (this.def.apoyo) {
      z.push({ tipo: 'apoyo', punto: this.mundoDe(P(...this.def.apoyo.punto)).add(this.desplazamientoBomba()), radio: this.def.apoyo.radio });
    }
    return z;
  }
  desplazamientoBomba() {   // lo que la bomba corrió el guardamanos (m, en el mundo)
    if (this.modoApoyo !== 'bomba' || !this.parteAccion) return v3();
    return this.direccion().multiplyScalar(-this.accion * this.recorrido * A_METROS);
  }

  /* --- Cada cuadro --- */
  actualizar(ahora, dt) {
    const def = this.def;
    // Gatillo: automática mientras se aprieta; las demás, un tiro por apretada
    const cad = this.datos.cadencia;
    if (((this.gatilloApretado && def.mecanica === 'auto') || this.pulso) && ahora - this.ultimoTiro >= cad) {
      this.pulso = false;
      if (this.listo()) this.disparar(ahora);
      else if (!this.avisoVacio) { Audio_.vacio(); this.avisoVacio = true; this.ultimoTiro = ahora; }
    }
    if (this.expulsarEn && ahora >= this.expulsarEn) { this.expulsarEn = 0; this.expulsar(false); }
    // Botón B: la acción atrás y adelante sola
    if (this.golpeB) {
      const q = (ahora - this.golpeB.desde) / (def.mecanica === 'cerrojo' ? 520 : 300);
      if (this.golpeB.soloAdelante) { this.accion = Math.max(0, 1 - q); if (q >= 1) { this.golpeB = null; this.adelante(); this.accion = 0; } }
      else {
        this.accion = q < 0.45 ? q / 0.45 : Math.max(0, 1 - (q - 0.45) / 0.55);
        if (q >= 0.45 && !this.atrasHecho) this.atras();
        if (q >= 1) { this.golpeB = null; this.accion = 0; this.adelante(); }
      }
    }
    // Lo que se ve de la acción: el pulso de cada tiro (semi y auto), la mano, el botón o trabada atrás
    let ver = this.accion;
    if (def.mecanica === 'semi' || def.mecanica === 'auto') {
      const t = ahora - this.tiroEn, ciclo = t >= 0 && t < def.ciclo ? pulso(t / def.ciclo) : 0;
      ver = Math.max(ver, ciclo, this.bloqueada && t >= def.ciclo * 0.5 ? 1 : 0);
    }
    if (this.parteAccion) this.parteAccion.mover(ver);
    if (this.a.alAccion) this.a.alAccion(ver);
    this.retrocesoYCola(ahora, dt);
  }
  // Retroceso (el arma va atrás y la boca sube; con las dos manos, la mitad) y los pasos de la recarga sin visor
  retrocesoYCola(ahora, dt) {
    const r = this.def.retroceso || { atras: 0, sube: 0, dura: 0.1 };
    this.retroceso = Math.max(0, this.retroceso - dt / r.dura);
    const k = this.retroceso * this.retroceso * (this.dosManos ? 0.5 : 1);
    this.cabeceo.position.set(0, 0, r.atras * k);
    this.cabeceo.rotation.x = (this.dosManos && this.modoApoyo !== 'estabiliza' ? this.anguloApoyo : 0) + r.sube * k;
    for (let i = this.cola.length - 1; i >= 0; i--) if (ahora >= this.cola[i][0]) { const f = this.cola[i][1]; this.cola.splice(i, 1); f(); }
  }
  // R sin visor: la recarga entera, con los tiempos de la mano
  recargaEscritorio(ahora) {
    if (this.cola.length) return;
    const def = this.def;
    if (def.municion === 'cargador') {
      if (this.puesto) this.cola.push([ahora, () => this.soltarCargador()]);
      this.cola.push([ahora + 650, () => this.ponerCargador()]);
      this.cola.push([ahora + 1050, () => { if (!this.recamara || this.bloqueada) this.botonB(performance.now()); }]);
    } else if (def.municion === 'tubo') {
      let t = ahora; for (let k = this.municion; k < this.capacidad; k++) { t += 450; this.cola.push([t, () => { if (this.municion < this.capacidad) { this.municion++; Audio_.recarga('cartucho', this.id); this.dibujarContador(); } }]); }
      this.cola.push([t + 400, () => { if (!this.recamara) this.botonB(performance.now()); }]);
    } else if (def.municion === 'interna') {
      this.cola.push([ahora, () => { this.accion = 1; if (!this.atrasHecho) this.atras(); }]);
      let t = ahora + 300; for (let k = this.municion; k < this.capacidad; k++) { t += 400; this.cola.push([t, () => { if (this.municion < this.capacidad) { this.municion++; Audio_.recarga('bala', this.id); this.dibujarContador(); } }]); }
      this.cola.push([t + 350, () => { this.accion = 0; this.adelante(); }]);
    }
  }
}
