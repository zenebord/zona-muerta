/* ===== Zona Muerta VR: los tambores redondos =====
 * El dibujo del juego es de costado y, extruido, un tambor quedaba como una placa: el del MGL y los de los revólveres,
 * de frente, eran un rectángulo; el de la Thompson, una tabla de 3 cm. Acá cada uno es un cuerpo redondo de verdad,
 * con las medidas que tiene en el dibujo (vr/armas-todas.js saca la pieza del dibujo y pone esta en su lugar):
 *   - revólveres (Colt Python y Magnum .44): el tambor con las seis recámaras pasantes, las estrías entre ellas (no
 *     llegan hasta atrás, como en los de verdad), la estrella del extractor y la varilla, que cerrado queda adentro de la
 *     funda bajo el cañón;
 *   - MGL: el tambor de seis recámaras de 40 mm con las estrías anchas y la placa trasera; la recámara de arriba queda
 *     en línea con el cañón;
 *   - Thompson: el tambor de 50, un disco de costado (como lo dibuja el juego cuando cae al piso, js/objetos.js), con el
 *     canto de dos aros, la cara estampada, la llave de cuerda del lado izquierdo y la torre que entra en el cajón.
 * Marco: cm, x hacia la boca, y arriba, z a la derecha (el del modelo del arma). Los de recámaras se arman con el
 * origen en el eje, a la altura de la cara de atrás, y giran sobre x (giro); las recámaras van a 60° una de otra,
 * contadas desde arriba hacia la derecha (de +y a +z), y cada una tiene su bala y su vaina para mostrar lo que tiene. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const materiales = new Map();
function metal(color, op = {}) {
  const clave = color + JSON.stringify(op);
  if (!materiales.has(clave)) materiales.set(clave, new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.6, envMapIntensity: 0.9, ...op }));
  return materiales.get(clave);
}
const juntar = gs => mergeGeometries(gs.map(g => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); return n; }));

/* La sección de un tambor de recámaras (en el plano u = −z, v = y, para extruirla sobre x): el círculo de radio R con
 * las estrías entre las recámaras (un surco de coseno: ancho, el medio ancho en radianes; hondo, en cm) y los agujeros */
function seccion(R, rc, rch, estria, N = 96, arco = 12) {
  const pts = [];
  for (let i = 0; i < N; i++) {
    const th = i / N * Math.PI * 2; let rho = R;
    if (estria) for (let j = 0; j < 6; j++) {
      const d = Math.abs(((th - (j + 0.5) * Math.PI / 3) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      if (d < estria.ancho) rho = Math.min(rho, R - estria.hondo * 0.5 * (1 + Math.cos(Math.PI * d / estria.ancho)));
    }
    pts.push(new THREE.Vector2(-rho * Math.sin(th), rho * Math.cos(th)));
  }
  const forma = new THREE.Shape(pts);
  for (let j = 0; j < 6; j++) {
    const a = j * Math.PI / 3, h = new THREE.Path();
    h.absarc(-rc * Math.sin(a), rc * Math.cos(a), rch, 0, Math.PI * 2, true);
    forma.holes.push(new THREE.Path(h.getPoints(arco)));
  }
  return forma;
}
// Un tramo del tambor, de x0 a x1 (con el bisel adentro de esas medidas). N: puntos del contorno; arco: de cada recámara
function tramo(R, rc, rch, estria, x0, x1, bisel = 0, N = 96, arco = 12) {
  const b = bisel, g = new THREE.ExtrudeGeometry(seccion(R - b, rc, rch + b, estria, N, arco), { depth: Math.max(0.01, x1 - x0 - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: arco });
  g.rotateY(Math.PI / 2); g.translate(x0 + b, 0, 0);
  return g;
}
const enX = g => g.rotateZ(-Math.PI / 2);   // un cilindro de Three (eje y) acostado sobre x

/* Las recámaras: en cada una, la bala entera y la vaina servida (se muestra una, la otra o ninguna). cartucho: (llena)
 * → el cartucho del arma (vr/armas-vr.js, eje x, el culote en 0) */
function recamaras(giro, rc, cartucho, culote) {
  const balas = new THREE.Group(), lista = [], llena = cartucho(true), vaina = cartucho(false);
  for (let j = 0; j < 6; j++) {
    const a = j * Math.PI / 3, r = new THREE.Group(); r.position.set(culote, rc * Math.cos(a), rc * Math.sin(a));
    const l = llena.clone(), v = vaina.clone(); l.visible = false; v.visible = false; r.add(l, v); balas.add(r);
    lista.push({ llena: l, vaina: v });
  }
  balas.visible = false; giro.add(balas);
  return { balas, lista };
}

/* ---------- Revólver ----------
 * largo y radio del tambor (cm), calibre (calibreDe del juego), color del acero, cartucho(llena), sentido del giro mirado
 * desde atrás (+1 a la derecha, como los Colt; −1 a la izquierda, como los Smith & Wesson) */
export function tamborRevolver3d({ largo, radio, calibre, color, cartucho, sentido = 1 }) {
  const R = radio, L = largo, rc = R * 0.62, rch = calibre.d / 2 + 0.03;
  const estria = { ancho: 0.27, hondo: Math.max(0.12, R - rc - 0.48) }, Lr = L * 0.26;   // la parte de atrás, sin estrías
  const gs = [
    tramo(R, rc, rch, null, 0, Lr + 0.06),                     // atrás, liso: las estrías no llegan hasta el culote
    tramo(R, rc, rch, estria, Lr, L, Math.min(0.08, R * 0.04)),   // adelante, con las estrías y el chaflán de la boca
  ];
  // la estrella del extractor (y el trinquete en el medio), apenas salida de la cara de atrás
  const estrella = new THREE.CylinderGeometry(rc - rch * 0.55, rc - rch * 0.55, 0.12, 6, 1); enX(estrella); estrella.translate(-0.05, 0, 0); gs.push(estrella);
  const trinquete = new THREE.CylinderGeometry(rch * 0.75, rch * 0.85, 0.22, 6); enX(trinquete); trinquete.translate(-0.13, 0, 0); gs.push(trinquete);
  // la varilla del extractor: adelante, por el eje (cerrado, adentro de la funda bajo el cañón)
  const varilla = new THREE.CylinderGeometry(R * 0.1, R * 0.1, L * 0.8, 10); enX(varilla); varilla.translate(L + L * 0.4, 0, 0); gs.push(varilla);
  const punta = new THREE.CylinderGeometry(R * 0.15, R * 0.15, L * 0.12, 12); enX(punta); punta.translate(L + L * 0.8, 0, 0); gs.push(punta);
  const grupo = new THREE.Group(), giro = new THREE.Group(); grupo.name = 'tambor'; grupo.add(giro);
  giro.add(new THREE.Mesh(juntar(gs), aceroRevolver(color)));
  const { balas, lista } = recamaras(giro, rc, cartucho, -0.02);
  grupo.userData = { giro, balas, recamaras: lista, rc, radio: R, largo: L, sentido };
  return grupo;
}
// El acero del tambor, un poco más apagado que el color del dibujo: el armazón trae la luz pintada y, con el brillo
// entero, el tambor salía más claro que todo lo demás
const aceroRevolver = color => metal('#' + new THREE.Color(color).multiplyScalar(0.9).getHexString(), { roughness: 0.34, metalness: 0.78, envMapIntensity: 0.75 });
/* El escudo de atrás del tambor (va en el armazón, no se vuelca): el armazón del dibujo, extruido, es más angosto que el
 * tambor y por los costados se veían los culotes; en uno de verdad el escudo tapa todo el tambor por detrás */
export function escudoRevolver3d({ radio, color }) {
  const g = new THREE.CylinderGeometry(radio * 0.97, radio * 0.97, 0.3, 24); enX(g); g.translate(-0.2, 0, 0);
  return new THREE.Mesh(g, aceroRevolver(color));
}

/* ---------- MGL ----------
 * largo y radio del tambor y de la placa de atrás (cm); el tambor arranca donde termina la placa */
export function tamborMgl3d({ largo, radio, atras, calibre, color, colorAtras, cartucho, rc, sentido = 1 }) {
  const R = radio, rch = calibre.d / 2 + 0.08, Ra = Math.max(atras.radio, rc + rch + 0.45);
  const estria = { ancho: 0.3, hondo: Math.min(1.1, R - rc - rch - 0.35) };
  const grupo = new THREE.Group(), giro = new THREE.Group(); grupo.name = 'tambor'; grupo.add(giro);
  // el color del dibujo, un poco más oscuro: el resto del arma trae la sombra pintada y el tambor salía color crema
  const tierra = '#' + new THREE.Color(color).multiplyScalar(0.8).getHexString();
  giro.add(new THREE.Mesh(tramo(R, rc, rch, estria, atras.largo - 0.05, atras.largo + largo, 0.45, 144, 20), metal(tierra, { roughness: 0.75, metalness: 0.05, envMapIntensity: 0.45 })));
  giro.add(new THREE.Mesh(tramo(Ra, rc, rch, null, 0, atras.largo, 0.12, 72, 20), metal(colorAtras, { roughness: 0.5, metalness: 0.3 })));
  // el eje en el medio, que pasa a la placa de adelante
  const eje = new THREE.CylinderGeometry(R * 0.12, R * 0.12, atras.largo + largo + 1.2, 16); enX(eje); eje.translate((atras.largo + largo) / 2, 0, 0);
  giro.add(new THREE.Mesh(eje, metal('#2b2c2a', { roughness: 0.45, metalness: 0.5 })));
  const { balas, lista } = recamaras(giro, rc, cartucho, -0.05);
  grupo.userData = { giro, balas, recamaras: lista, rc, radio: R, largo: atras.largo + largo, sentido };
  return grupo;
}

/* ---------- Thompson: el tambor de 50 ----------
 * centro (x, y del disco), radio y ancho (cm); torre: { x, y0, y1 } (la torre que entra en el cajón, de y0 a y1) */
export function tamborThompson3d({ centro, radio, ancho, torre, color }) {
  const R = radio, T = ancho / 2;
  // El perfil, de la cara izquierda a la derecha (radio, z): el cubo del medio, el aro alzado, la cara, el surco
  // estampado, el borde redondeado y el canto con dos aros
  const cara = s => [[0, s * (T + 0.32)], [R * 0.22, s * (T + 0.32)], [R * 0.25, s * (T + 0.12)], [R * 0.6, s * (T + 0.12)], [R * 0.64, s * T], [R * 0.8, s * T], [R * 0.83, s * (T - 0.16)], [R * 0.86, s * T], [R - 0.32, s * T], [R, s * (T - 0.32)]];
  const canto = [[R, -T * 0.52], [R + 0.13, -T * 0.46], [R + 0.13, -T * 0.34], [R, -T * 0.28], [R, T * 0.28], [R + 0.13, T * 0.34], [R + 0.13, T * 0.46], [R, T * 0.52]];
  const perfil = [...cara(-1), ...canto, ...cara(1).reverse()].map(([r, z]) => new THREE.Vector2(r, z));
  const disco = new THREE.LatheGeometry(perfil, 48); disco.rotateX(Math.PI / 2);   // el eje del torno (y) pasa a z
  const gs = [disco];
  // la llave de cuerda, del lado izquierdo: el poste y las dos alas
  const poste = new THREE.CylinderGeometry(R * 0.08, R * 0.08, 0.5, 12); poste.rotateX(Math.PI / 2); poste.translate(0, 0, -(T + 0.55)); gs.push(poste);
  const alas = new THREE.BoxGeometry(R * 0.7, R * 0.17, 0.32); alas.translate(0, 0, -(T + 0.9)); gs.push(alas);
  for (const s of [-1, 1]) { const ala = new THREE.CylinderGeometry(R * 0.13, R * 0.13, 0.32, 16); ala.rotateX(Math.PI / 2); ala.translate(s * R * 0.35, 0, -(T + 0.9)); gs.push(ala); }
  // la torre, arriba (en el marco del arma, no del disco)
  const alto = torre.y1 - torre.y0, caja = new THREE.BoxGeometry(torre.ancho || 3, alto, Math.min(2.2, ancho * 0.42));
  caja.translate(torre.x - centro[0], (torre.y0 + torre.y1) / 2 - centro[1], 0); gs.push(caja);
  const grupo = new THREE.Group(); grupo.name = 'tambor'; grupo.position.set(centro[0], centro[1], 0);
  grupo.add(new THREE.Mesh(juntar(gs), metal(color, { roughness: 0.42, metalness: 0.55 })));
  return grupo;
}
