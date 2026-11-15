/* ===== Zona Muerta VR: el armero de la pared de atrás =====
 * Las armas que no entran en la mesa cuelgan de un tablero perforado corrido en la pared que queda a la espalda al
 * empezar, en grupos separados por listones, como en el inventario del juego: pistolas, metralletas, rifles, escopetas,
 * lanzadores, cuerpo a cuerpo y legendarias (y, si el juego suma una categoría nueva, un grupo más). Cada grupo lleva su
 * cartel arriba y cada arma su nombre abajo; las armas apoyan en dos ganchos.
 *   - Las de fuego, acostadas contra la pared con la boca a la derecha y el lado dibujado a la vista, como en el juego,
 *     con el centro de cada grupo a la altura del pecho.
 *   - Las de cuerpo a cuerpo y las legendarias, de pie con el mango abajo y los mangos a la misma altura.
 * Lo que no es un arma (tablero, marco y listones, ganchos y carteles) va en cuatro mallas: cuatro llamadas de dibujo. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { texturaCanvas } from './efectos.js';

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
// El soporte de cada arma (vr/armas-vr.js) tiene la boca hacia −z, arriba +y y el lado dibujado hacia +x; en las de
// pie, la hoja hacia −z y el dibujo de costado igual. Colgadas, ese lado mira al que se da vuelta (−z del mundo).
const COLGADA = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(v3(0, 0, -1), v3(0, 1, 0), v3(1, 0, 0)));
const DE_PIE = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(v3(0, 0, -1), v3(1, 0, 0), v3(0, -1, 0)));
// El escudo (vr/armas-todas.js) se lleva con la cara adelante: colgado, el soporte derecho ya la muestra
const postura = a => a.escudo ? new THREE.Quaternion() : a.def.vertical ? DE_PIE : COLGADA;

// Los tableros, en el orden del inventario del juego, y cuántas armas van por fila en cada uno
const TABLEROS = [
  { titulo: 'PISTOLAS', categorias: ['pistola'], columnas: 4 },
  { titulo: 'METRALLETAS', categorias: ['metralleta'], columnas: 2 },
  { titulo: 'RIFLES', categorias: ['rifle'], columnas: 1 },
  { titulo: 'ESCOPETAS', categorias: ['escopeta'], columnas: 2 },
  { titulo: 'LANZAGRANADAS Y BAZUCA', categorias: ['lanzagranadas', 'bazuca'], columnas: 1 },
  { titulo: 'CUERPO A CUERPO', categorias: ['cuerpo'], dePie: true },
  { titulo: 'LEGENDARIAS', categorias: ['legendaria'], dePie: true },
];
// Medidas (m)
const HUECO = 0.1;          // entre dos armas de una fila
const ETIQUETA = 0.055;     // lugar del nombre, debajo de cada arma
const ENTRE_FILAS = 0.05;
const MARGEN = 0.09;        // del borde del tablero a las armas
const CABECERA = 0.13;      // franja del cartel, arriba
const DIVISION = 0.16;      // entre dos grupos (con el listón en el medio)
const ESPESOR = 0.02;       // del tablero
const ALTO_CENTRO = 1.4;    // altura del centro de los tableros de armas acostadas
const MANGOS = 0.95;        // altura de los mangos de las de pie (donde agarra la mano)
const PISO = 0.12;          // lo más bajo que puede quedar la punta de una de pie

/* ---------- Texturas ---------- */
// Tablero perforado (hardboard): agujeros cada 2,5 cm; la textura cubre 20 × 20 cm y se repite
const PASO_TEXTURA = 0.2;
function texturaTablero() {
  return texturaCanvas(128, 128, (g, w, h) => {
    g.fillStyle = '#a5875f'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 900; k++) { const v = Math.random(); g.fillStyle = v < 0.5 ? 'rgba(90,64,36,0.10)' : 'rgba(255,236,200,0.08)'; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1); }
    const n = 8, p = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = (i + 0.5) * p, y = (j + 0.5) * p;
      g.fillStyle = 'rgba(255,240,210,0.18)'; g.beginPath(); g.arc(x + 0.6, y + 0.8, 3.1, 0, Math.PI * 2); g.fill();   // canto iluminado
      g.fillStyle = '#2b2116'; g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill();
    }
  }, [1, 1]);
}
// Carteles: todos en una textura (una sola malla). Nombres de 256 × 64 px y títulos de 512 × 64
function atlasCarteles(nombres, titulos) {
  const lugares = new Map(), W = 1024, FILA = 64;
  let x = 0, y = 0;
  const reservar = (clave, ancho) => { if (x + ancho > W) { x = 0; y += FILA; } lugares.set(clave, { x, y, w: ancho, h: FILA }); x += ancho; };
  for (const t of titulos) reservar('t:' + t, 512);
  x = 0; y += FILA;
  for (const n of nombres) reservar('n:' + n, 256);
  const alto = THREE.MathUtils.ceilPowerOfTwo(y + FILA);
  const tex = texturaCanvas(W, alto, g => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [clave, l] of lugares) {
      const titulo = clave.startsWith('t:'), texto = clave.slice(2);
      if (titulo) {   // chapa oscura con letras de esténcil
        g.fillStyle = '#23271f'; g.fillRect(l.x + 2, l.y + 4, l.w - 4, l.h - 8);
        g.strokeStyle = '#c9a96e'; g.lineWidth = 3; g.strokeRect(l.x + 6, l.y + 8, l.w - 12, l.h - 16);
        g.fillStyle = '#e8cf8e'; let tam = 36; do { g.font = `700 ${tam}px "Trebuchet MS", sans-serif`; tam--; } while (g.measureText(texto).width > l.w - 40 && tam > 16);
        g.fillText(texto, l.x + l.w / 2, l.y + l.h / 2 + 1);
      } else {        // tarjeta clara, como las de la mesa
        g.fillStyle = '#f1e6d0'; g.fillRect(l.x + 2, l.y + 6, l.w - 4, l.h - 12);
        g.strokeStyle = '#3a2a1c'; g.lineWidth = 3; g.strokeRect(l.x + 3.5, l.y + 7.5, l.w - 7, l.h - 15);
        g.fillStyle = '#2a1e12'; let tam = 30; do { g.font = `700 ${tam}px "Trebuchet MS", sans-serif`; tam--; } while (g.measureText(texto).width > l.w - 18 && tam > 12);
        g.fillText(texto, l.x + l.w / 2, l.y + l.h / 2 + 1);
      }
    }
  });
  tex.anisotropy = 8;
  return { tex, lugares, W, alto };
}
// Un cartel: un plano que mira al jugador (−z), con las coordenadas de su lugar en la textura
function cartel(atlas, clave, centro, ancho) {
  const l = atlas.lugares.get(clave), alto = ancho * l.h / l.w;
  const g = new THREE.PlaneGeometry(ancho, alto), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (l.x + uv.getX(i) * l.w) / atlas.W, 1 - (l.y + (1 - uv.getY(i)) * l.h) / atlas.alto);
  g.rotateY(Math.PI); g.translate(centro.x, centro.y, centro.z);
  return g;
}

/* ---------- Medir y ubicar ---------- */
// La caja del arma colgada, relativa al punto del soporte (la empuñadura)
function medir(a, q) {
  a.soporte.position.set(0, 0, 0); a.soporte.quaternion.copy(q);
  a.cabeceo.position.set(0, 0, 0); a.cabeceo.rotation.set(0, 0, 0);
  a.soporte.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(a.modelo, true);
}
const rayo = new THREE.Raycaster();
// Lo primero del arma que encuentra una recta (para apoyarla en los ganchos)
function tocar(a, desde, dir) { rayo.set(desde, dir); rayo.far = 3; const h = rayo.intersectObject(a.modelo, true)[0]; return h ? h.point : null; }

/* armas: las que cuelgan; escena; op: { z (la pared), x (el centro) }. Les deja a cada una su `lugar` ({ pos, quat }) */
export function colgarEnPared(armas, escena, op = {}) {
  const zPared = op.z ?? 5.5, xCentro = op.x ?? 0, frente = zPared - ESPESOR;   // frente: la cara del tablero
  // Cada arma a su tablero (las de una categoría que no está en la lista, a uno más al final)
  const tableros = TABLEROS.map(t => ({ ...t, armas: [] }));
  for (const a of armas) {
    let t = tableros.find(x => x.categorias.includes(a.datos.categoria));
    if (!t) { t = tableros.find(x => x.otras) || (tableros.push({ titulo: 'OTRAS', categorias: [], columnas: 2, otras: true, armas: [] }), tableros[tableros.length - 1]); }
    t.armas.push(a);
  }
  const usados = tableros.filter(t => t.armas.length);
  // Medidas de cada arma, filas de cada grupo y dónde queda su contenido (de abajo arriba)
  for (const t of usados) {
    t.items = t.armas.map(a => { const vertical = !!a.def.vertical, q = postura(a), caja = medir(a, q); return { a, vertical, q, caja, w: caja.max.x - caja.min.x, h: caja.max.y - caja.min.y }; });
    if (t.dePie) t.filas = [t.items];
    else {
      const orden = [...t.items].sort((p, q) => q.w - p.w);   // las largas arriba: filas parejas
      t.filas = []; for (let i = 0; i < orden.length; i += t.columnas) t.filas.push(orden.slice(i, i + t.columnas));
    }
    for (const f of t.filas) { f.ancho = f.reduce((s, it) => s + it.w, 0) + HUECO * (f.length - 1); f.alto = Math.max(...f.map(it => it.h)) + ETIQUETA; }
    t.ancho = Math.max(...t.filas.map(f => f.ancho)) + 2 * MARGEN;
    if (t.dePie) {   // los mangos a la misma altura
      t.abajo = Infinity; t.arriba = -Infinity;
      for (const it of t.items) { const y0 = Math.max(PISO + ETIQUETA, MANGOS + it.caja.min.y); it.y = y0 - it.caja.min.y; t.abajo = Math.min(t.abajo, y0 - ETIQUETA - 0.018); t.arriba = Math.max(t.arriba, it.y + it.caja.max.y); }
    } else {
      const alto = t.filas.reduce((s, f) => s + f.alto, 0) + ENTRE_FILAS * (t.filas.length - 1);
      t.arriba = ALTO_CENTRO + alto / 2; t.abajo = t.arriba - alto;
    }
  }
  // El tablero: de la punta izquierda a la derecha (para el que mira la pared, de +x a −x), centrado; alto parejo
  const total = usados.reduce((s, t) => s + t.ancho, 0) + DIVISION * (usados.length - 1);
  const y0 = Math.min(0.3, Math.min(...usados.map(t => t.abajo)) - MARGEN), y1 = Math.max(2.5, Math.max(...usados.map(t => t.arriba)) + 0.04 + CABECERA);
  const xIzq = xCentro + total / 2, xDer = xIzq - total, xm = (xIzq + xDer) / 2;
  const atlas = atlasCarteles(armas.map(a => a.nombre), usados.map(t => t.titulo));
  const gTableros = [], gMarcos = [], gGanchos = [], gCarteles = [];
  const ganchos = (x, y, zFrente) => {   // un gancho: la varilla que sale del tablero, con la punta para arriba
    const largo = frente - zFrente + 0.012, v = new THREE.CylinderGeometry(0.0045, 0.0045, largo, 8); v.rotateX(Math.PI / 2); v.translate(x, y - 0.0045, frente - largo / 2); gGanchos.push(v);
    const p = new THREE.CylinderGeometry(0.0045, 0.0045, 0.016, 8); p.translate(x, y + 0.0015, frente - largo + 0.0045); gGanchos.push(p);
    const r = new THREE.CylinderGeometry(0.009, 0.009, 0.004, 12); r.rotateX(Math.PI / 2); r.translate(x, y - 0.0045, frente - 0.002); gGanchos.push(r);   // la arandela contra el tablero
  };
  const liston = (w, h, x, y) => { const prof = ESPESOR + 0.012, b = new THREE.BoxGeometry(w, h, prof); b.translate(x, y, zPared - prof / 2); gMarcos.push(b); };
  // tablero y marco
  const tab = new THREE.BoxGeometry(total, y1 - y0, ESPESOR), uv = tab.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * total / PASO_TEXTURA, uv.getY(i) * (y1 - y0) / PASO_TEXTURA);
  tab.translate(xm, (y0 + y1) / 2, zPared - ESPESOR / 2); gTableros.push(tab);
  const m = 0.045;
  liston(total + 2 * m, m, xm, y1 + m / 2); liston(total + 2 * m, m, xm, y0 - m / 2); liston(m, y1 - y0, xIzq + m / 2, (y0 + y1) / 2); liston(m, y1 - y0, xDer - m / 2, (y0 + y1) / 2);
  liston(total, 0.025, xm, y1 - CABECERA - 0.0125);   // el listón de abajo de los carteles
  let izquierda = xIzq;
  for (const t of usados) {
    const x0 = izquierda, x1 = izquierda - t.ancho, xt = (x0 + x1) / 2;   // x0: borde izquierdo del grupo (para el que mira)
    if (x0 < xIzq - 0.01) liston(0.03, y1 - y0, x0 + DIVISION / 2, (y0 + y1) / 2);   // la división con el grupo anterior
    gCarteles.push(cartel(atlas, 't:' + t.titulo, v3(xt, y1 - CABECERA / 2, frente - 0.002), Math.min(t.ancho - 0.1, 1.04)));
    // Las armas
    const ubicar = (it, xIzqArma, yAbajo) => {
      const pos = v3(xIzqArma - it.caja.max.x, yAbajo - it.caja.min.y, frente - 0.012 - it.caja.max.z);
      it.a.soporte.position.copy(pos); it.a.soporte.quaternion.copy(it.q); it.a.soporte.updateMatrixWorld(true);
      it.a.lugar = { pos: pos.clone(), quat: it.a.soporte.quaternion.clone() };
      return pos;
    };
    if (t.dePie) {
      const f = t.filas[0]; let x = xt + f.ancho / 2;
      for (const it of f) {
        const pos = ubicar(it, x, it.y + it.caja.min.y), zc = pos.z + (it.caja.min.z + it.caja.max.z) / 2;
        // dos ganchos a los lados del mango, justo arriba de la mano
        const yG = pos.y + 0.05, izq = tocar(it.a, v3(x + 0.05, yG, zc), v3(-1, 0, 0)), der = tocar(it.a, v3(x - it.w - 0.05, yG, zc), v3(1, 0, 0));
        if (izq && der) { ganchos(izq.x + 0.006, yG, pos.z + it.caja.min.z); ganchos(der.x - 0.006, yG, pos.z + it.caja.min.z); }
        gCarteles.push(cartel(atlas, 'n:' + it.a.nombre, v3(x - it.w / 2, pos.y + it.caja.min.y - ETIQUETA / 2 - 0.018, frente - 0.002), 0.15));   // más abajo: el mango está adelante y lo tapa desde arriba
        x -= it.w + HUECO;
      }
    } else {
      let yArriba = t.arriba;
      for (const f of t.filas) {
        const yAbajo = yArriba - f.alto + ETIQUETA; let x = xt + f.ancho / 2;
        for (const it of f) {
          const pos = ubicar(it, x, yAbajo), zc = pos.z + (it.caja.min.z + it.caja.max.z) / 2;
          // dos ganchos debajo, donde el arma apoya: lo más bajo de su mitad de atrás y de su mitad de adelante
          const perfil = [];
          for (let j = 0; j <= 32; j++) { const f = 0.1 + 0.8 * j / 32, gx = x - it.w * f, p = tocar(it.a, v3(gx, yAbajo - 0.05, zc), v3(0, 1, 0)); if (p) perfil.push({ f, gx, y: p.y }); }
          const masBajo = l => l.reduce((m, q) => !m || q.y < m.y - 0.002 ? q : m, null);
          for (const q of [masBajo(perfil.filter(q => q.f < 0.5)), masBajo(perfil.filter(q => q.f >= 0.5))]) if (q) ganchos(q.gx, q.y, pos.z + it.caja.min.z);
          gCarteles.push(cartel(atlas, 'n:' + it.a.nombre, v3(x - it.w / 2, yAbajo - ETIQUETA / 2 - 0.004, frente - 0.002), 0.15));
          x -= it.w + HUECO;
        }
        yArriba -= f.alto + ENTRE_FILAS;
      }
    }
    t.x0 = x0; t.x1 = x1; t.y0 = t.abajo; t.y1 = t.arriba;
    izquierda -= t.ancho + DIVISION;
  }
  // Cuatro mallas: tablero, marco y listones, ganchos y carteles
  const mallas = [
    new THREE.Mesh(mergeGeometries(gTableros), new THREE.MeshStandardMaterial({ map: texturaTablero(), roughness: 0.92 })),
    new THREE.Mesh(mergeGeometries(gMarcos), new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 0.8 })),
    new THREE.Mesh(mergeGeometries(gGanchos), new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.35, metalness: 0.8 })),
    new THREE.Mesh(mergeGeometries(gCarteles), new THREE.MeshBasicMaterial({ map: atlas.tex })),
  ];
  for (const m of mallas) escena.add(m);
  return { tableros: usados.map(t => ({ titulo: t.titulo, x0: t.x0, x1: t.x1, y0: t.y0, y1: t.y1, armas: t.armas.map(a => a.id) })), mallas };
}
