/* ===== Zona Muerta VR: el material de la piel y de la ropa de los zombies =====
 * Lo que en los juegos sale de las texturas pintadas a mano, acá sale del sombreador, en el marco de reposo del cuerpo
 * (así queda pegado a la piel cuando el esqueleto se mueve) y con proyección en los tres ejes:
 *  - piel: poros, venas oscuras y moradas, manchas de descomposición, mugre hacia los pies, brillo húmedo en la sangre
 *    y la boca, y la luz que atraviesa la piel en los bordes (dispersión bajo la superficie, aproximada);
 *  - tela: el tejido en relieve, la mugre y el revés más oscuro (se ve por las mangas y los agujeros);
 *  - heridas como las de Left 4 Dead 2 (Valve, GDC 2010): un elipsoide en el marco de reposo recorta la piel y la ropa
 *    con borde desparejo, se moja de sangre alrededor y adentro se ve la carne (una esfera vista de adentro, pegada al
 *    hueso). Hasta dos por zombie.
 * Cada zombie tiene sus materiales (las heridas son suyas); el programa del sombreador es uno por tipo. */
import * as THREE from 'three';
import { hash3, suave } from './forma3d.js';

/* ---------- Textura de ruido: R poros, G venas, B manchas, A tejido (256², se repite sin costura) ---------- */
let RUIDO = null;
export function texturaRuido() {
  if (RUIDO) return RUIDO;
  const N = 256, d = new Uint8Array(N * N * 4), L = (a, b, t) => a + (b - a) * t;
  const periodico = (x, y, p, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = suave(x - xi), v = suave(y - yi), h = (i, j) => hash3(((i % p) + p) % p, ((j % p) + p) % p, s);
    return L(L(h(xi, yi), h(xi + 1, yi), u), L(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
  };
  const fbm = (x, y, p, s, oct) => { let a = 0, t = 0, f = 1, w = 1; for (let o = 0; o < oct; o++) { a += periodico(x * f, y * f, p * f, s + o * 17) * w; t += w; f *= 2; w *= 0.5; } return a / t; };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = i / N, v = j / N, k = (j * N + i) * 4;
    const poro = fbm(u * 32, v * 32, 32, 3, 2);
    const vena = Math.pow(1 - Math.abs(2 * fbm(u * 6, v * 6, 6, 11, 3) - 1), 7);
    const mancha = fbm(u * 3, v * 3, 3, 29, 3);
    const tejido = 0.5 + 0.32 * Math.sin((i + j) * Math.PI * 2 / 5.333) * (0.75 + 0.25 * Math.sin(j * Math.PI * 2 / 2.667)) + (periodico(u * 64, v * 64, 64, 41) - 0.5) * 0.3;
    d[k] = poro * 255; d[k + 1] = Math.min(1, vena * 1.3) * 255; d[k + 2] = mancha * 255; d[k + 3] = Math.max(0, Math.min(1, tejido)) * 255;
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4;
  t.needsUpdate = true;
  return (RUIDO = t);
}
let BLANCA = null;
const texturaBlanca = () => BLANCA || (BLANCA = Object.assign(new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat), { needsUpdate: true }));

const PARS = /* glsl */`
uniform sampler2D tRuido;
uniform float uEscala, uRelieve, uVenas, uMugre, uDispersion;
uniform vec4 uHeridaC[2];
uniform vec3 uHeridaR[2];
uniform vec3 uSangre;
varying vec3 vReposo;
varying vec3 vNormRep;
vec4 triplanar(vec3 p, vec3 n, float esc) {
  vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z + 1e-5);
  return texture2D(tRuido, p.yz * esc) * w.x + texture2D(tRuido, p.xz * esc) * w.y + texture2D(tRuido, p.xy * esc) * w.z;
}
// Relieve con las derivadas de pantalla de una altura (como el bumpMap de three.js)
vec3 relieveZombie(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDir) {
  vec3 vSigmaX = normalize(dFdx(surf_pos)), vSigmaY = normalize(dFdy(surf_pos)), vN = surf_norm;
  vec3 R1 = cross(vSigmaY, vN), R2 = cross(vN, vSigmaX);
  float fDet = dot(vSigmaX, R1) * faceDir;
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}
`;

/* tipo: 'piel' | 'tela'. op: { map, roughness, side, relieve, venas, mugre, dispersion, escala } */
export function materialZombie(tipo = 'piel', op = {}) {
  const piel = tipo === 'piel';
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: op.roughness ?? (piel ? 0.62 : 0.93), metalness: 0, side: op.side ?? (piel ? THREE.FrontSide : THREE.DoubleSide), map: piel ? null : (op.map || texturaBlanca()) });
  const U = m.userData.uniforms = {
    tRuido: { value: texturaRuido() }, uEscala: { value: op.escala ?? 1 }, uRelieve: { value: op.relieve ?? (piel ? 1 : 0.7) },
    uVenas: { value: op.venas ?? (piel ? 1 : 0) }, uMugre: { value: op.mugre ?? 1 }, uDispersion: { value: op.dispersion ?? (piel ? 1 : 0) },
    uHeridaC: { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] }, uHeridaR: { value: [new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1)] },   // w = 0: cerrada (Vector4() trae w = 1)
    uSangre: { value: new THREE.Color('#4a0806') },
  };
  m.onBeforeCompile = s => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vReposo;\nvarying vec3 vNormRep;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvReposo = position; vNormRep = normal;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\n' + PARS)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      vec4 rFino = triplanar(vReposo, vNormRep, 9.0 * uEscala);
      vec4 rGrueso = triplanar(vReposo, vNormRep, 2.4 * uEscala);
      float herida = 9.0;
      for (int i = 0; i < 2; i++) if (uHeridaC[i].w > 0.5) { vec3 q = (vReposo - uHeridaC[i].xyz) / uHeridaR[i]; herida = min(herida, dot(q, q)); }
      if (herida < 1.0 + (rFino.r - 0.5) * 0.9) discard;   // la herida: borde desparejo`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      ${piel ? `
      float vena = smoothstep(0.72, 0.97, rGrueso.g) * smoothstep(0.25, 0.65, rFino.b) * uVenas;          // venas finas, a trechos
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.5, 0.42, 0.72), vena * 0.42);    // moradas
      diffuseColor.rgb *= 0.9 + rGrueso.b * 0.2;                                                         // manchas
      diffuseColor.rgb *= 0.94 + rFino.r * 0.12;                                                         // poros
      ` : `
      diffuseColor.rgb *= 0.84 + rFino.a * 0.3;                                                          // tejido
      diffuseColor.rgb *= 0.9 + rGrueso.b * 0.2;
      if (!gl_FrontFacing) diffuseColor.rgb *= 0.42;                                                     // el revés
      `}
      diffuseColor.rgb *= mix(1.0 - 0.3 * uMugre, 1.0, smoothstep(0.05, 0.55, vReposo.y));                 // mugre hacia los pies
      float sangreH = smoothstep(2.8, 1.0, herida);
      diffuseColor.rgb = mix(diffuseColor.rgb, uSangre, sangreH * 0.92);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      float humedo = clamp((diffuseColor.r - diffuseColor.g) * 4.0 - 0.1, 0.0, 1.0);                   // sangre y boca brillan
      roughnessFactor = clamp(roughnessFactor + (rFino.r - 0.5) * 0.3 - humedo * 0.45 - sangreH * 0.5, 0.12, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      float alto = ${piel ? 'rFino.r * 0.5 + smoothstep(0.72, 0.97, rGrueso.g) * 0.5 + rGrueso.b * 0.2' : 'rFino.a + rFino.r * 0.3'};
      normal = relieveZombie(-vViewPosition, normal, vec2(dFdx(alto), dFdy(alto)) * 0.6 * uRelieve, faceDirection);`)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
      ${piel ? `float borde = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.5);
      reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(1.0, 0.62, 0.45) * borde * 0.55 * uDispersion;   // luz que atraviesa` : ''}`);
  };
  m.customProgramCacheKey = () => 'zombie-' + tipo;
  return m;
}
// Abre (o cambia) una herida: centro y radios en el marco de reposo del cuerpo
export function ponerHerida(mats, i, c, r) {
  for (const m of mats) { const U = m.userData.uniforms; U.uHeridaC.value[i].set(c.x, c.y, c.z, 1); U.uHeridaR.value[i].set(r.x, r.y, r.z); }
}
export function cerrarHeridas(mats) { for (const m of mats) for (const h of m.userData.uniforms.uHeridaC.value) h.w = 0; }

// Lo que se ve por la herida: carne, grasa y hueso (una esfera que se ve sólo por dentro)
let GEO_CARNE = null, MAT_CARNE = null;
export function carneDeHerida() {
  if (!GEO_CARNE) {
    const g = new THREE.SphereGeometry(1, 20, 14), p = g.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = hash3(Math.floor(x * 6 + 9), Math.floor(y * 6 + 9), Math.floor(z * 6 + 9));
      col.set(n > 0.86 ? '#d9cdb0' : n > 0.7 ? '#b8857a' : n > 0.35 ? '#5a0a08' : '#3a0505');   // hueso, grasa, carne
      c.set([col.r, col.g, col.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); GEO_CARNE = g;
    MAT_CARNE = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0, side: THREE.BackSide });
  }
  return new THREE.Mesh(GEO_CARNE, MAT_CARNE);
}
