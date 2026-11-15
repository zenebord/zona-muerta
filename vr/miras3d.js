/* ===== Zona Muerta VR: las miras de punto rojo =====
 * En el 2D, la mira de punto rojo (tecla D con la Kriss Vector, la P90, la Saiga-12, el Milkor MGL o la bazuca M9,
 * js/jugador.js) apunta sola al zombie vivo más cercano, la retícula se cierra sobre él y el tiro no falla. La retícula
 * es la de la imagen que mandó Enzo (js/jugador-dibujo.js, dibujarMiraPuntoRojo): un anillo rojo, cuatro marcas cortas
 * hacia afuera y el punto en el centro, con un resplandor rojo y un contorno oscuro apenas.
 * Acá, la misma retícula en dos lugares:
 *   - en el vidrio de la mira, que ahora es hueca (el dibujo extruido era un bloque macizo): está «en el infinito», como
 *     en una de verdad, sobre la línea de la mira y no en el vidrio, así que se ve en el mismo lugar aunque el ojo no
 *     esté centrado (cada ojo la ve en la misma dirección);
 *   - sobre el zombie marcado (vr/campo.js), como en el 2D: al marcar uno nuevo se cierra sobre él desde 1,5 veces su
 *     tamaño en 180 ms. Mientras hay uno marcado, el vidrio no la repite (se verían dos).
 * Marco: cm, x hacia la boca, y arriba, z a la derecha (el del modelo del arma). */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { extruir } from './modelo3d.js';

/* La retícula (lienzo de 256): el anillo de radio 0,35 del ancho y las marcas hasta 1,3 veces el radio; los trazos con
 * las mismas proporciones que el 2D (allá R = 22 y la luz de 1,6 de ancho) */
export const ANILLO = 0.35;   // radio del anillo, en anchos de la textura
let textura = null;
export function texturaPuntoRojo() {
  if (textura) return textura;
  const n = 256, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), R = n * ANILLO, k = R / 22;
  g.translate(n / 2, n / 2); g.lineCap = 'butt';
  const figura = () => {
    g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2);
    for (let a = 0; a < 4; a++) { const ux = Math.round(Math.cos(a * Math.PI / 2)), uy = Math.round(Math.sin(a * Math.PI / 2)); g.moveTo(ux * R, uy * R); g.lineTo(ux * R * 1.3, uy * R * 1.3); }
  };
  const capa = (color, ancho, radioPunto) => {
    g.strokeStyle = g.fillStyle = color; g.lineWidth = ancho * k; figura(); g.stroke();
    g.beginPath(); g.arc(0, 0, radioPunto, 0, Math.PI * 2); g.fill();
  };
  capa('rgba(255,46,32,0.2)', 5.5, R * 0.17);        // resplandor
  capa('rgba(48,0,0,0.42)', 2.7, R * 0.075 + 0.5 * k); // contorno
  capa('#ec2a1f', 1.6, R * 0.075);                    // la luz roja
  textura = new THREE.CanvasTexture(c); textura.colorSpace = THREE.SRGBColorSpace; textura.anisotropy = 4;
  return textura;
}

/* El vidrio: para cada punto que se ve, la dirección del ojo a ese punto, comparada con la línea de la mira (uDir, con
 * uDer y uArr para la orientación de la retícula); uTam es la tangente del medio ancho de la textura. Un tinte
 * azulado apenas, como el tratamiento de los vidrios de las miras réflex. uVer apaga la retícula (deja el tinte). */
const MEDIO_ANCHO = THREE.MathUtils.degToRad(2.2);   // la textura cubre ±2,2°: el anillo, ±1,54° (una de 3° de diámetro)
function materialVidrio() {
  return new THREE.ShaderMaterial({
    uniforms: { uRet: { value: texturaPuntoRojo() }, uDir: { value: new THREE.Vector3(1, 0, 0) }, uDer: { value: new THREE.Vector3(0, 0, 1) }, uArr: { value: new THREE.Vector3(0, 1, 0) }, uTam: { value: Math.tan(MEDIO_ANCHO) }, uVer: { value: 1 } },
    vertexShader: 'varying vec3 vM; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vM = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform sampler2D uRet; uniform vec3 uDir, uDer, uArr; uniform float uTam, uVer; varying vec3 vM;
      void main() {
        vec3 d = normalize(vM - cameraPosition); float c = dot(d, uDir); vec4 r = vec4(0.0);
        if (c > 0.0) {
          vec2 uv = vec2(dot(d, uDer), dot(d, uArr)) / c / uTam * 0.5 + 0.5;
          if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) r = texture2D(uRet, uv) * uVer;
        }
        gl_FragColor = vec4(mix(vec3(0.42, 0.6, 0.72), r.rgb, r.a), max(0.08, r.a));
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}

/* La mira hueca: los dos costados (el contorno del dibujo con su ventana, si la tiene, o una placa), el techo y la
 * base, abierta adelante y atrás; el vidrio, cerca del frente. caja y abertura en cm con y arriba ({ x0, x1, y0, y1 },
 * y0 < y1); ancho: de costado a costado; lados: { pts, huecos } del dibujo (y abajo) o null */
export function miraReflex3d({ caja, abertura, ancho, color, lados }) {
  const L = caja.x1 - caja.x0, W = ancho, pared = 0.22, xc = (caja.x0 + caja.x1) / 2;
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.35, envMapIntensity: 0.7 });
  const gs = [];
  for (const s of [-1, 1]) {
    if (lados) { const m = extruir(lados.pts, lados.huecos || [], mat, s < 0 ? -W / 2 : W / 2 - pared, s < 0 ? -W / 2 + pared : W / 2); m.updateMatrix(); gs.push(m.geometry.clone().applyMatrix4(m.matrix)); }
    else { const b = new THREE.BoxGeometry(L, caja.y1 - caja.y0, pared); b.translate(xc, (caja.y0 + caja.y1) / 2, s * (W - pared) / 2); gs.push(b); }
  }
  const techo = new THREE.BoxGeometry(L, caja.y1 - abertura.y1, W); techo.translate(xc, (caja.y1 + abertura.y1) / 2, 0); gs.push(techo);
  const base = new THREE.BoxGeometry(L, abertura.y0 - caja.y0, W); base.translate(xc, (caja.y0 + abertura.y0) / 2, 0); gs.push(base);
  const grupo = new THREE.Group(); grupo.name = 'puntoRojo';
  grupo.add(new THREE.Mesh(mergeGeometries(gs.map(g => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal'].includes(k)) n.deleteAttribute(k); return n; })), mat));
  // el vidrio, a medio centímetro del frente, del tamaño de la abertura
  const vg = new THREE.PlaneGeometry(W - 2 * pared, abertura.y1 - abertura.y0); vg.rotateY(Math.PI / 2); vg.translate(caja.x1 - 0.5, (abertura.y0 + abertura.y1) / 2, 0);
  const vidrio = new THREE.Mesh(vg, materialVidrio()); vidrio.renderOrder = 2;
  // la línea de la mira, en el mundo, para cada cuadro: x del arma adelante, y arriba, z a la derecha
  vidrio.onBeforeRender = () => {
    const u = vidrio.material.uniforms, m = vidrio.matrixWorld.elements;
    u.uDir.value.set(m[0], m[1], m[2]).normalize(); u.uArr.value.set(m[4], m[5], m[6]).normalize(); u.uDer.value.set(m[8], m[9], m[10]).normalize();
  };
  grupo.add(vidrio);
  grupo.userData = { vidrio, centro: [caja.x1 - 0.5, (abertura.y0 + abertura.y1) / 2], atras: [caja.x0, (abertura.y0 + abertura.y1) / 2] };
  return grupo;
}
// Prende o apaga la retícula del vidrio (con un zombie marcado se ve la de él)
export function verReticulaVidrio(grupo, ver) { grupo.userData.vidrio.material.uniforms.uVer.value = ver ? 1 : 0; }

/* La retícula sobre el zombie marcado: un cartel que siempre mira al jugador y se dibuja encima de todo, como en el 2D */
export function reticulaMarcado() {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaPuntoRojo(), transparent: true, depthTest: false, depthWrite: false }));
  s.renderOrder = 999; s.visible = false;
  return s;
}
