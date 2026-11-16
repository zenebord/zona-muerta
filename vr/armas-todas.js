/* ===== Zona Muerta VR: todas las armas del juego =====
 * La mesa tiene una de cada tipo (vr/campo.js); las otras 36 cuelgan de la pared de atrás (la M2 no: en el juego es
 * la ametralladora fija del monte y no tiene modelo para llevar). Cada una se arma sola desde su modelo 2D y sus datos
 * del juego, sin una ficha escrita a mano por arma:
 *   - piezas: extruidas con su espesor; torneadas las largas y finas que no son de madera (cañones, tubos, miras) y,
 *     en las de cuerpo a cuerpo, los mangos y las astas; las hojas, finas; la madera de culatas y guardamanos, gruesa
 *   - empuñadura: donde apoya la mano del gatillo en el juego (js/jugador-dibujo.js: la palma, según el ángulo de la
 *     empuñadura; en la Mauser y el Barrett, corrida como en el ajuste del gatillo); apoyo: el ancla manoDelantera
 *   - acción: lo que mueve el dibujo (la corredera, el cerrojo o la manija; la bomba; la palanca; el quiebre; el tambor)
 *   - mecánica: la del juego (semiautomática, automática, cerrojo, palanca, bomba, revólver, quiebre, peine en bloque,
 *     cohete, hoja) y la munición (cargador, cartuchos por el portillo, balas de a una, peine)
 *   - mira telescópica (SVD, Barrett, Mosin): el tubo de la mira del dibujo
 *   - el aspecto: el dibujo del juego entero como textura de costado y los trazos en el aire como varillas
 *     (vr/modelo3d.js: def.textura y def.trazos)
 * Lo hecho en las armas 2D sigue acá: disparos grabados y el sonido de sacar el arma (js/audio.js); el «ping» y el
 * peine que salta del Garand con el cerrojo trabado atrás; los martillos de la de dos caños, que caen con cada tiro y
 * se montan al cerrarla; el revólver que vuelca todo y el cargador rápido de la Python; el peine de la Mosin, que salta
 * al cerrar el cerrojo; los poderes de las legendarias (js/poderes.js): la onda de Excalibur, la ola del Tridente, la
 * Égida y Gungnir que vuelven solas (y los rayos del Mjölnir, en vr/especiales.js); el susurro del machete del cazador
 * (vr/campo.js). */
import * as THREE from 'three';
import { Arma, DEFS, A_METROS, cartucho3d } from './armas-vr.js';
import { grabarArma, caja, v3 } from './modelo3d.js';
import { CLASES, Cohete, Cuerpo, Mjolnir } from './especiales.js';
import { tamborRevolver3d, escudoRevolver3d, tamborMgl3d, tamborThompson3d } from './tambores3d.js';
import { miraReflex3d } from './miras3d.js';

const P = (x, y, z = 0) => v3(x, y, z);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const enCm = p => [p.x / CM, -p.y / CM];                      // ancla del dibujo (unidades, y abajo) → cm con y arriba
const cajaTotal = base => { const c = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity }; for (const p of base) for (const [x, y] of p.pts) { c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.y0 = Math.min(c.y0, y); c.y1 = Math.max(c.y1, y); } return c; };

// Las de la mesa ya tienen su ficha (vr/armas-vr.js y vr/especiales.js); la M2 no tiene modelo para llevar
export const ARMAS_PARED = Object.keys(ARMAS).filter(id => !DEFS[id] && id !== 'm2' && DIBUJO_ARMAS[id]);

/* ---------- Cómo se comporta cada tipo ---------- */
const POR_CATEGORIA = {
  pistola:       { ciclo: 60, fogonazo: 0.12, cono: 0.005, vibra: 0.5, retroceso: { atras: 0.012, sube: 0.18, dura: 0.11 } },
  metralleta:    { ciclo: 70, fogonazo: 0.18, cono: 0.005, vibra: 0.6, retroceso: { atras: 0.016, sube: 0.06, dura: 0.09 } },
  rifle:         { ciclo: 100, fogonazo: 0.3, cono: 0.0008, vibra: 1, retroceso: { atras: 0.03, sube: 0.12, dura: 0.16 } },
  escopeta:      { ciclo: 110, fogonazo: 0.32, cono: 0.045, vibra: 1, retroceso: { atras: 0.035, sube: 0.15, dura: 0.17 } },
  lanzagranadas: { ciclo: 200, fogonazo: 0.25, cono: 0, vibra: 0.8, retroceso: { atras: 0.03, sube: 0.12, dura: 0.15 } },
  bazuca:        { ciclo: 200, fogonazo: 0.3, cono: 0, vibra: 1, retroceso: { atras: 0.01, sube: 0.03, dura: 0.12 } },
};
const PESO_RETROCESO = { deagle: 1.6, magnum: 1.7, python: 1.4, barrett: 1.8, mosin: 1.2, svd: 1.1, garand: 1.1 };
// Acción a mano después de cada tiro: cerrojo (Mosin), palanca (las Winchester, con su sonido) o bomba
const MANUAL = { mosin: 'cerrojo', winchester1894: 'palanca', winchester1887: 'palanca', spas12: 'bomba', rem870: 'bomba' };
// Donde el origen del dibujo no está en la empuñadura, la mano se corre como en el ajuste del gatillo del juego (cm)
const CORRIMIENTO_MANO = { mauser: [0.8, 1.7], barrett: [-2.6, -0.1] };
// Las que no son la clase común (vr/armas-vr.js)
const CLASE_DE = { magnum: 'revolver', python: 'revolver', recortada: 'quiebre', mgl: 'quiebre', garand: 'garand', mosin: 'mosin', bazuca: 'cohete', egida: 'arrojadiza', gungnir: 'arrojadiza', excalibur: 'excalibur', tridente: 'tridente' };

/* ---------- Materiales: de qué es cada color del dibujo ----------
 * tipoDeColor (vr/modelo3d.js) mide el color ya pasado a lineal: los marrones oscuros (nogal, la madera del juego)
 * quedan como goma y los dorados como madera. Acá se mide como lo pinta el juego (sRGB): madera los marrones (también
 * los oscuros), latón los dorados (en las legendarias, también el bronce), acero los grises y los claros casi blancos
 * (hojas, cromados), goma o polímero los negros y los grises oscuros, pintura lo demás (el rojo del hacha, el arena
 * del MGL). Con la textura el color lo pone el dibujo: esto decide sólo el brillo y lo metálico. */
const MATERIAL_ARMA = { p90: { '#55585e': 'polimero', '#8e877a': 'polimero' }, mgl: { '#8a7559': 'polimero', '#a68b69': 'polimero', '#b49c7c': 'polimero' } };
function materialesDe(id, base) {
  const out = {}, legendaria = !!ARMAS[id].legendaria;
  for (const color of new Set(base.map(p => p.color))) {
    const hsl = {}; new THREE.Color(color).getHSL(hsl, THREE.SRGBColorSpace); const { h, s, l } = hsl;
    let t;
    if (s > 0.45 && l > 0.3 && l < 0.7 && (legendaria ? h < 0.17 : h >= 0.105 && h < 0.17)) t = 'laton';
    else if (s > 0.3 && h >= 0.025 && h < 0.12 && l > 0.1 && l < 0.75) t = 'madera';
    else if ((s < 0.15 && l > 0.3) || (l > 0.78 && s < 0.35)) t = 'metal';
    else if (l < 0.3) t = s < 0.2 ? 'goma' : 'polimero';
    else t = 'pintura';
    out[color] = (MATERIAL_ARMA[id] && MATERIAL_ARMA[id][color]) || t;
  }
  return out;
}

/* ---------- Las piezas: qué se tornea, qué va fino y qué grueso ---------- */
function piezasDe(base, vertical, mats) {
  const piezas = {};
  base.forEach((p, i) => {
    const c = caja(p.pts), w = c.x1 - c.x0, h = c.y1 - c.y0, tipo = mats[p.color];
    if (!vertical && w > 7 * h && h > 0.3 && h < 4.2 && tipo !== 'madera') piezas[i] = { redonda: 'x' };        // cañones, tubos, miras
    else if (vertical && h > 6 * w && w > 0.5 && w < 5 && tipo !== 'metal') piezas[i] = { redonda: 'y' };       // mangos y astas
    else if (vertical && tipo === 'metal' && w > 1.6 && h > 1.6) piezas[i] = { t: 0.45 };                       // hojas
    else if (Math.min(w, h) < 0.4) piezas[i] = { t: 0.35 };                                                       // hilos y detalles
    else if (tipo === 'madera' && h > 4) piezas[i] = { t: 3.8 };                                                  // culatas y guardamanos
  });
  return piezas;
}
/* ---------- Las miras ----------
 * Telescópicas (en el 2D: js/jugador.js, MIRA_TELESCOPICA): el eje del tubo (y del dibujo, hacia abajo), de dónde a
 * dónde va (del ocular, atrás, al objetivo) y cuánto aumenta. Las piezas del dibujo que están sobre ese eje se tornean
 * (el tubo, las campanas y el ocular de goma) y la lente va en el ocular, como en la Remington 700 de la mesa. Antes se
 * buscaba sola la pieza larga y fina de arriba: en la Dragunov agarraba el tubo de gases, en la Mosin el cañón y en la
 * Barrett una pieza del frente, y la lente (de 1,2 cm) quedaba adentro de ellos. */
const TELESCOPICAS = {
  svd: { eje: -12.6, x0: -11.9, x1: 25.6, aumento: 4 },        // PSO-1, con el ocular de goma
  barrett: { eje: -15.4, x0: -10.3, x1: 25.4, aumento: 10 },
  mosin: { eje: -10.3, x0: -5.6, x1: 21.0, aumento: 3.5 },    // PU
};
function telescopicaDe(id, base, def) {
  const T = TELESCOPICAS[id]; if (!T) return;
  const piezas = def.modelo.piezas; let rAtras = 0;
  base.forEach((p, i) => {
    const c = caja(p.pts), h = c.y1 - c.y0;
    if (Math.abs((c.y0 + c.y1) / 2 - T.eje) > 0.8 || h > 6 || c.x0 < T.x0 - 0.6 || c.x1 > T.x1 + 0.6) return;
    piezas[i] = { redonda: { eje: 'x', centro: T.eje } };
    if (c.x0 <= T.x0 + 0.3) rAtras = Math.max(rAtras, h / 2);
  });
  def.mira = { telescopica: { eje: -T.eje, ocular: T.x0, objetivo: T.x1, aumento: T.aumento, radio: Math.max(0.8, (rAtras || 1.2) - 0.35) } };
}
/* De punto rojo (en el 2D: MIRA_PUNTO_ROJO, con la retícula de Enzo): la pieza del cuerpo de la mira (su color y de
 * dónde a dónde va, para reconocerla), el ancho de costado a costado y cuánto de arriba (techo) y de abajo (base) es
 * pared, en cm; con «hueco», la base llega hasta 0,4 cm debajo de la ventana dibujada. La P90 la tiene dibujada muy
 * finita: se la levanta 1,2 cm para que se pueda mirar por ella. Las perillas dibujadas sobre el costado van al costado
 * izquierdo (en el medio quedaban adentro de la ventana). La mira hueca y su vidrio, en vr/miras3d.js */
const PUNTO_ROJO = {
  vector: { color: '#26272b', x: [7, 19], ancho: 3, techo: 0.45, hueco: true, perillas: ['#3a3c42'] },
  saiga: { color: '#26272b', x: [8.6, 19.6], ancho: 3, techo: 0.45, hueco: true },
  p90: { color: '#2e3034', x: [3.35, 11.94], ancho: 3, techo: 0.3, base: 0.35, sube: 1.2 },
  mgl: { color: '#41423e', x: [11.16, 23.62], ancho: 5, techo: 0.6, base: 0.6, perillas: ['#1f201e', '#2a2b28'] },
  bazuca: { color: '#4a5532', x: [8, 17], ancho: 3.4, techo: 0.5, base: 0.5 },
};
function puntoRojoDe(id, base, def) {
  const R = PUNTO_ROJO[id]; if (!R) return;
  const i = base.findIndex(p => p.color === R.color && Math.abs(caja(p.pts).x0 - R.x[0]) < 1 && Math.abs(caja(p.pts).x1 - R.x[1]) < 1);
  if (i < 0) return;
  const p = base[i], c = caja(p.pts), top = c.y0 - (R.sube || 0), hueco = R.hueco && p.huecos && p.huecos[0] ? caja(p.huecos[0]) : null;
  const bajo = hueco ? hueco.y1 + 0.4 : c.y1 - R.base;   // dibujo: y hacia abajo
  const caja3 = { x0: c.x0, x1: c.x1, y0: -c.y1, y1: -top }, abertura = { y0: -bajo, y1: -(top + R.techo) }, yc = (abertura.y0 + abertura.y1) / 2;
  const piezas = def.modelo.piezas; piezas[i] = { omitir: true };
  base.forEach((q, k) => { if (R.perillas && R.perillas.includes(q.color)) { const b = caja(q.pts); if (b.x0 >= c.x0 - 0.5 && b.x1 <= c.x1 + 0.5 && b.y0 >= top - 0.5 && b.y1 <= c.y1 + 0.5) piezas[k] = { z: -(R.ancho / 2 + 0.25), t: 0.5 }; } });
  def.mira = { alza: [c.x0, yc], poste: [c.x1, yc] }; def.puntoRojo = true;
  const previo = def.modelo.extras;
  def.modelo.extras = arma => {
    if (previo) previo(arma);
    arma.raiz.add(miraReflex3d({ caja: caja3, abertura, ancho: R.ancho, color: p.color, lados: R.sube ? null : { pts: p.pts, huecos: p.huecos } }));
  };
}
// El centro de lo que mueve un estado del dibujo (para la zona de la mano izquierda en la palanca)
function centroDe(id, base, estado) {
  const otro = grabarArma(id, estado), pts = [];
  base.forEach((p, i) => { if (otro[i] && JSON.stringify(otro[i].pts) !== JSON.stringify(p.pts)) pts.push(...p.pts); });
  if (!pts.length) return null;
  const c = caja(pts); return [(c.x0 + c.x1) / 2, -(c.y0 + c.y1) / 2];
}

/* ---------- La ficha de cada arma, desde el juego ---------- */
function fichaDe(id) {
  const a = ARMAS[id], d = DIBUJO_ARMAS[id], base = grabarArma(id), clase = CLASE_DE[id], mats = materialesDe(id, base);
  if (a.cuerpo) {   // cuerpo a cuerpo y legendarias: de pie, el mango en la mano y la hoja (o la cabeza) arriba
    const c = cajaTotal(base), largo = -c.y0, x = (c.x0 + c.x1) / 2;
    const empunadura = a.poder === 'escudo' ? [x, -(c.y0 + c.y1) / 2] : [0, -Math.max(4, c.y1 * 0.5)];   // el escudo, de la manija del centro
    return { mecanica: 'cuerpo', vertical: true, empunadura, filo: !!a.filo, peso: limitar(a.dano / 10, 0.6, 1.8), poder: null,
      hoja: [0.15, 0.4, 0.62, 0.82, 0.97].map(f => [x, largo * f]),
      modelo: { piezas: piezasDe(base, true, mats), cargador: false, textura: true, trazos: true, materiales: mats } };
  }
  const cat = POR_CATEGORIA[a.categoria] || POR_CATEGORIA.rifle, k = PESO_RETROCESO[id] || 1, manual = MANUAL[id];
  const ang = d.anguloEmpunadura ?? 0.3, s = Math.sin(ang), co = Math.cos(ang), corre = CORRIMIENTO_MANO[id] || [0, 0];
  const empunadura = [(-s * 1.9 - co * 0.3) / CM + corre[0], -((co * 1.9 - s * 0.3) / CM + 2 + corre[1])];
  const corta = d.agarre === 'pistola';
  const def = {
    mecanica: manual === 'palanca' ? 'cerrojo' : manual || (a.automatica ? 'auto' : 'semi'),
    municion: a.recargaTipo === 'cargador' || a.recargaTipo === 'cargador-pistola' ? 'cargador' : a.recargaTipo === 'cartuchos' || a.recargaTipo === 'palanca' ? 'tubo' : 'interna',
    bloqueo: corta || id === 'garand', ciclo: cat.ciclo, fogonazo: cat.fogonazo, cono: cat.cono, vibra: Math.min(1, cat.vibra * k),
    retroceso: { atras: cat.retroceso.atras * k, sube: cat.retroceso.sube * k, dura: cat.retroceso.dura },
    empunadura, apoyo: d.manoDelantera ? { punto: enCm(d.manoDelantera), modo: corta ? 'estabiliza' : manual === 'bomba' ? 'bomba' : 'linea', radio: corta ? 0.12 : 0.16 } : null,
    carga: d.cargador ? { punto: [...enCm(d.cargador), 0], radio: 0.08 } : null,
    expulsion: d.expulsion ? [...enCm(d.expulsion), 1.5] : null,
    contador: { x: Math.max(-6, empunadura[0] + 5), y: empunadura[1] + 6.5, z: -2.1, ancho: corta ? 3.6 : 4.6 },
    modelo: { piezas: piezasDe(base, false, mats), movimientos: {}, textura: true, trazos: true, materiales: mats },
  };
  const mov = def.modelo.movimientos, corredera = d.corredera ? enCm(d.corredera) : null;
  if (id === 'recortada') { mov.martillo1 = { estado: 'martillos', valor: [0, 1] }; mov.martillo2 = { estado: 'martillos', valor: [1, 0] }; }   // cada martillo, caído
  if (clase === 'revolver' || clase === 'quiebre') mov.abrir = { estado: 'abierto' };
  else if (manual === 'bomba') { mov.bomba = { estado: 'bombeo' }; def.accion = { parte: 'bomba', sonido: 'bombear' }; }
  else if (manual === 'palanca') {
    mov.palanca = { estado: 'palanca' }; const lazo = centroDe(id, base, { palanca: 1 }) || empunadura;
    def.accion = { parte: 'palanca', punto: [lazo[0], lazo[1], 0], radio: 0.09 }; def.sonidos = { atras: 'palanca' };
  } else if (clase !== 'cohete') {
    mov.accion = { estado: 'corredera' };
    if (corredera) def.accion = { parte: 'accion', punto: [corredera[0], corredera[1], corta ? 0 : 2.4], radio: corta ? 0.07 : 0.08 };
  }
  telescopicaDe(id, base, def);
  if (clase === 'quiebre') { def.unidad = id === 'mgl' ? 'granada40' : 'cartucho'; def.granada = id === 'mgl'; }
  if (clase === 'revolver') def.unidad = 'bala';
  if (def.municion !== 'cargador') def.modelo.cargador = false;
  tamborDe(id, base, def, clase, d);
  puntoRojoDe(id, base, def);
  dosCanonesDe(id, base, def, d);
  return def;
}

/* ---------- La escopeta de dos caños: dos cañones, lado a lado ----------
 * El dibujo es de costado y el cañón de enfrente queda tapado por el de este lado: extruida, se veía de un solo caño
 * (pedido de Enzo: «aunque la perspectiva muestre lo contrario, que tenga 2 cañones»). Las piezas que se vuelcan al
 * abrirla y van sobre el eje de la boca (el cañón y su boca) se tornean dos veces, una a cada lado; la báscula y el
 * guardamanos se ensanchan a lo que miden los dos juntos; cada martillo va sobre su caño (el de este lado, el que cae
 * con el primer tiro, a la izquierda) y cada tiro sale por el suyo (Basculante.tirar: def.canones). */
function dosCanonesDe(id, base, def, d) {
  if (id !== 'recortada' || !d.boca) return;
  const piezas = def.modelo.piezas, cajas = base.map(p => caja(p.pts)), eje = d.boca.y / CM;   // dibujo: y hacia abajo
  const mueven = estado => { const o = grabarArma(id, estado); return base.map((p, i) => i).filter(i => o[i] && JSON.stringify(o[i].pts) !== JSON.stringify(base[i].pts)); };
  const abre = mueven({ abierto: 1 }), canon = abre.filter(i => Math.abs((cajas[i].y0 + cajas[i].y1) / 2 - eje) < 0.6 && cajas[i].y1 - cajas[i].y0 <= 3.2);
  if (!canon.length) return;
  const r = Math.max(...canon.map(i => cajas[i].y1 - cajas[i].y0)) / 2, sep = r * 0.98;
  for (const i of canon) piezas[i] = { redonda: { eje: 'x', centro: eje }, doble: sep };
  const m1 = mueven({ martillos: [0, 1] }), m2 = mueven({ martillos: [1, 0] });
  for (const i of m1) if (!m2.includes(i)) piezas[i] = { z: -sep };
  for (const i of m2) if (!m1.includes(i)) piezas[i] = { z: sep };
  for (const i of abre) if (!piezas[i] && cajas[i].x1 - cajas[i].x0 > 3 && cajas[i].y1 - cajas[i].y0 > 2) piezas[i] = { t: 4 * r * 0.9 };
  def.canones = sep;
}

/* ---------- Los tambores redondos (vr/tambores3d.js) ----------
 * El dibujo los trae de costado: extruidos, eran una placa. Se saca esa pieza y va el tambor de verdad en su lugar, en
 * el mismo grupo (lo que se vuelca al abrir o el cargador). Cada pieza se reconoce por lo que hace, no por su número:
 * el tambor de un revólver o del MGL es la pieza más grande de las que se mueven al abrir (y la placa de atrás del MGL,
 * la que va justo detrás); el de la Thompson es lo que se va con el cargador. */
// Thompson: el disco va 1,6 cm más adelante que la pieza del dibujo (si no, el armazón del disparador le entra) y su
// borde de arriba 2,2 cm más abajo (la pieza sube hasta adentro del cajón: ahí va la torre)
const TAMBOR_THOMPSON = { adelante: 1.6, bajaArriba: 2.2, ancho: 5.4 };
function tamborDe(id, base, def, clase, d) {
  const piezas = def.modelo.piezas, cajas = base.map(p => caja(p.pts)), area = c => (c.x1 - c.x0) * (c.y1 - c.y0);
  const movidas = () => { const ab = grabarArma(id, { abierto: 1 }); return base.map((p, i) => i).filter(i => ab[i] && JSON.stringify(ab[i].pts) !== JSON.stringify(base[i].pts)); };
  const cartucho = llena => cartucho3d(id, llena);
  if (clase === 'revolver' || id === 'mgl') {
    const m = movidas(); if (!m.length) return;
    const i = m.reduce((a, b) => area(cajas[b]) > area(cajas[a]) ? b : a), c = cajas[i], eje = -(c.y0 + c.y1) / 2;
    // la recámara de arriba, en línea con el cañón: el radio de las recámaras es lo que hay del eje del tambor a la boca
    const boca = d.boca ? enCm(d.boca)[1] : null;
    piezas[i] = { omitir: true };
    if (clase === 'revolver') {
      const radio = (c.y1 - c.y0) / 2;
      // el contador iba de costado sobre el tambor (lo tapaba, y ahora el tambor sale hasta ahí): al costado del cañón,
      // justo delante del tambor
      const canon = cajas.map((k, n) => n).filter(n => cajas[n].x0 >= c.x1 - 1 && !m.includes(n)).sort((a, b) => (cajas[b].x1 - cajas[b].x0) - (cajas[a].x1 - cajas[a].x0))[0];
      if (canon !== undefined && def.contador) {
        const k = cajas[canon], alto = k.y1 - k.y0;
        def.contador = { ...def.contador, x: c.x1 + def.contador.ancho / 2 + 0.5, y: -(k.y0 + k.y1) / 2, z: -(limitar(alto * 0.55, 0.8, 3) / 2 + 0.2) };
      }
      def.modelo.extras = arma => {
        const t = tamborRevolver3d({ largo: c.x1 - c.x0, radio, calibre: calibreDe(id), color: base[i].color, cartucho, sentido: id === 'magnum' ? -1 : 1 });   // la Smith & Wesson gira al revés que la Colt
        t.position.set(c.x0, eje, 0); arma.partes.abrir.grupo.add(t);
        const escudo = escudoRevolver3d({ radio, color: base[i].color }); escudo.position.set(c.x0, eje, 0); arma.raiz.add(escudo);
      };
    } else {
      const j = m.filter(k => k !== i && cajas[k].x0 < c.x0 && cajas[k].x1 > c.x0 - 1 && cajas[k].y1 - cajas[k].y0 > (c.y1 - c.y0) * 0.6).sort((a, b) => cajas[b].x1 - cajas[a].x1)[0];
      const atras = j !== undefined ? { largo: c.x0 - cajas[j].x0, radio: (cajas[j].y1 - cajas[j].y0) / 2 } : { largo: 1.3, radio: (c.y1 - c.y0) * 0.42 };
      if (j !== undefined) piezas[j] = { omitir: true };
      const radio = (c.y1 - c.y0) / 2, rc = boca != null ? limitar(boca - eje, radio * 0.5, radio * 0.7) : radio * 0.62;
      def.modelo.extras = arma => {
        const t = tamborMgl3d({ largo: c.x1 - c.x0, radio, atras, calibre: calibreDe(id), color: base[i].color, colorAtras: j !== undefined ? base[j].color : '#2e2c28', cartucho, rc });
        t.position.set(c.x0 - atras.largo, eje, 0); arma.partes.abrir.grupo.add(t);
      };
    }
    return;
  }
  if (id === 'thompson' && def.modelo.cargador !== false) {
    const sin = grabarArma(id, { sinCargador: true }), clave = p => p.color + ':' + p.pts.length + ':' + p.pts[0].map(v => v.toFixed(2)).join(',');
    const quedan = new Set(sin.map(clave)), van = base.map((p, i) => i).filter(i => !quedan.has(clave(base[i])));
    if (!van.length) return;
    const i = van.reduce((a, b) => area(cajas[b]) > area(cajas[a]) ? b : a), c = cajas[i], T = TAMBOR_THOMPSON;
    const arriba = c.y0 + T.bajaArriba, radio = (c.y1 - arriba) / 2, centro = [(c.x0 + c.x1) / 2 + T.adelante, -(arriba + c.y1) / 2];
    piezas[i] = { omitir: true };
    // la mano izquierda lo trae agarrado del canto de abajo
    def.agarreCargador = [centro[0], centro[1] - radio + 1.0];
    def.modelo.extras = arma => {
      arma.cargador.add(tamborThompson3d({ centro, radio, ancho: T.ancho, color: base[i].color, torre: { x: (c.x0 + c.x1) / 2, y0: -arriba - 0.6, y1: -c.y0, ancho: Math.min(3.2, (c.x1 - c.x0) * 0.6) } }));
      // el cargador suelto (en la mano, o el que cae) es el mismo tambor
      arma.cargadorSuelto = () => { const g = new THREE.Group(); for (const o of arma.cargador.children) g.add(o.clone()); return g; };
    };
  }
}

/* ---------- Revólveres, la escopeta de dos caños y el MGL: se abren (B o la mano) y se cargan de a una ---------- */
// Abierto, el borde derecho del tambor queda a esto (cm) del medio del arma: el armazón mide 3 cm de ancho y el del MGL, 3,2
const TAMBOR_HOLGURA = 1.8;
class Basculante extends Arma {
  constructor(id, mundo) {
    super(id, mundo);
    this.parteAccion = this.a.partes.abrir; this.abierto = 0; this.objetivo = 0; this.vainas = 0;
    this.municion = this.capacidad; this.recamara = false;
    // Revólveres y MGL: el tambor redondo (vr/tambores3d.js) gira 60° con cada tiro (vueltas) y muestra lo que tiene
    this.tambor = this.a.raiz.getObjectByName('tambor'); this.vueltas = 0; this.giroVisto = 0;
    this.carga = this.def.carga ? P(...this.def.carga.punto) : this.pozo.clone();
    /* Abierto, el tambor sale hacia la izquierda (pedido de Leandro: «en vez de abrirse para abajo, que se abran para el
     * lado de la izquierda»): gira 90° alrededor de un eje paralelo al cañón que va arriba y a la izquierda de él, y
     * termina al costado izquierdo del arma, a la misma altura y sin tocarla (en el medio del recorrido baja un poco: así
     * no roza el armazón de arriba al salir). En los revólveres es lo único que se mueve; en el MGL, la placa, el cañón y
     * la empuñadura (que el dibujo del juego vuelca hacia abajo junto con el tambor) quedan en su lugar. La recámara
     * donde se carga va con el tambor. */
    if (this.tambor && this.parteAccion) {
      const t = this.tambor, d = (t.userData.radio + TAMBOR_HOLGURA) / 2, base = t.position.clone(), py = base.y + d, pz = base.z - d;
      const vy = base.y - py, vz = base.z - pz;
      this.cargaTambor = this.carga.clone().sub(base);
      this.parteAccion.mover = function (u) {
        this.t = u; const th = Math.PI / 2 * u, c = Math.cos(th), s = Math.sin(th);
        t.position.set(base.x, py + vy * c - vz * s, pz + vy * s + vz * c); t.rotation.set(th, 0, 0);
      };
    }
    // La de dos caños tiene martillos a la vista (js/armas-modelos-3.js): 1 montado, 0 caído; cada tiro baja el suyo
    if (this.a.partes.martillo1) { this.martillos = [1, 1]; this.verMartillos = [1, 1]; }
    this.dibujarContador();
  }
  listo() { return this.municion > 0 && this.abierto < 0.05 && (!this.martillos || this.martillos.includes(1)); }
  botonB() { this.objetivo = this.objetivo ? 0 : 1; Audio_.recarga(this.objetivo ? 'abrir' : 'cerrar', this.id); if (!this.objetivo) this.alCerrar(); }
  alCerrar() {   // la de dos caños: cerrada, el pulgar monta los martillos caídos (como en el juego), uno y otro
    if (!this.martillos) return;
    const t = performance.now(); let k = 0;
    for (const m of [0, 1]) if (!this.martillos[m]) { k++; this.cola.push([t + 40 + 220 * k, () => { this.martillos[m] = 1; Audio_.recarga('martillo', this.id); this.mundo.vibrar('right', 0.25, 20); }]); }
  }
  recamaraMundo() { return this.cargaTambor ? this.tambor.localToWorld(this.cargaTambor.clone()) : (this.parteAccion ? this.parteAccion.grupo : this.a.raiz).localToWorld(this.carga.clone()); }
  actualizar(ahora, dt) {
    this.abierto = limitar(this.abierto + Math.sign(this.objetivo - this.abierto) * dt / 0.25, 0, 1);
    if (this.parteAccion) this.parteAccion.mover(this.abierto * this.abierto * (3 - 2 * this.abierto));
    if (this.martillos) for (const m of [0, 1]) {   // cae de golpe; montarlo lleva un instante
      const v = this.verMartillos; v[m] = this.martillos[m] > v[m] ? Math.min(1, v[m] + dt / 0.12) : this.martillos[m];
      this.a.partes['martillo' + (m + 1)].mover(1 - v[m]);
    }
    if (this.abierto > 0.95) this.volcar();   // una vez por apertura
    if (this.abierto < 0.5 && !this.objetivo) this.volcado = false;
    if (this.tambor) {   // el giro de 60° tarda unos 70 ms; las balas, sólo en la mano (en la pared no se ven y son mallas de más)
      const t = this.tambor.userData, objetivo = t.sentido * this.vueltas * Math.PI / 3;
      this.giroVisto += (objetivo - this.giroVisto) * Math.min(1, dt / 0.035); t.giro.rotation.x = this.giroVisto;
      t.balas.visible = !!this.enMano;
    }
    if (this.pulso) {
      this.pulso = false;
      if (this.listo() && ahora - this.ultimoTiro >= this.datos.cadencia) this.tirar(ahora);
      else if (!this.avisoVacio) { Audio_.vacio(); this.avisoVacio = true; }
    }
    this.retrocesoYCola(ahora, dt);
  }
  tirar(ahora) {
    const def = this.def; this.municion--; this.vainas++; this.ultimoTiro = ahora; this.tiroEn = ahora; this.disparos++; this.retroceso = 1;
    if (this.tambor) this.vueltas++;   // la próxima recámara pasa arriba
    const canonTiro = this.martillos ? this.martillos.indexOf(1) : -1;
    if (canonTiro >= 0) this.martillos[canonTiro] = 0;   // el martillo de ese caño cae sobre el percutor
    // la de dos caños: el primer tiro sale por el de este lado (izquierda) y el segundo por el de enfrente
    const boca = this.mundoDe(def.canones && canonTiro >= 0 ? this.boca.clone().setZ(canonTiro === 0 ? -def.canones : def.canones) : this.boca), dirMira = this.apuntarA ? this.apuntarA.clone().sub(boca).normalize() : this.direccionMira();
    this.mundo.efectos.disparo(boca, this.direccion(), ahora, def.fogonazo);
    if (def.granada) {   // MGL: la granada de 40 mm en parábola, como la del M79
      Audio_.disparo('lanzagranadas', this.id);
      const g = cartucho3d(this.id, true); g.children[0].visible = false; g.scale.setScalar(A_METROS); g.position.copy(boca); g.quaternion.copy(this.modelo.getWorldQuaternion(new THREE.Quaternion()));
      const sigue = def.puntoRojo && this.apuntarA ? this.objetivoVivo : null;   // con un zombie marcado, derecho a él y lo sigue (como en el 2D)
      this.mundo.lanzar({ objeto: g, vel: dirMira.multiplyScalar(42), gravedad: sigue ? 0 : 9.8, sigue, vida: 6, alChocar: h => { this.mundo.explotar(h.punto, 3); return true; } });
    } else {
      Audio_.disparo(this.datos.categoria, this.id);
      const n = this.datos.perdigones || 1, cono = def.cono, tiro = { impacto: false };
      for (let k = 0; k < n; k++) {
        const dir = dirMira.clone(), a = Math.random() * Math.PI * 2, r = (n > 1 ? Math.sqrt(Math.random()) : Math.random() - 0.5) * cono;
        const u = v3(1, 0, 0).cross(dir).normalize(), w = dir.clone().cross(u);
        dir.addScaledVector(u, Math.cos(a) * r).addScaledVector(w, Math.sin(a) * r).normalize();
        this.mundo.disparo(boca, dir, { dano: this.datos.dano / n * (n > 1 ? 1.6 : 1), tipo: n > 1 ? 'perdigon' : 'bala', arma: this, tiro, primero: k === 0 });
      }
    }
    this.mundo.vibrar('right', def.vibra, 40); if (this.dosManos) this.mundo.vibrar('left', def.vibra * 0.5, 30);
    this.dibujarContador();
  }
  vaciar() {   // abierto: los expulsores tiran las vainas gastadas (las balas que quedan, no)
    for (let k = 0; k < this.vainas; k++) this.caer(false);
    this.vainas = 0; this.verRecamaras();
  }
  caer(llena) {   // una vaina (o una bala entera) que sale de la recámara para atrás y al piso
    const cal = calibreDe(this.id), v = cartucho3d(this.id, llena); v.scale.setScalar(A_METROS); v.position.copy(this.recamaraMundo()); v.quaternion.copy(this.modelo.getWorldQuaternion(new THREE.Quaternion()));
    const s = this.mundo.efectos.soltar(v, this.direccion().multiplyScalar(-0.6 - Math.random() * 0.5).add(v3((Math.random() - 0.5) * 0.4, 0.3, (Math.random() - 0.5) * 0.4)), v3(4, 0, 2), 'vaina', cal.d / 2 * A_METROS);
    s.sonido = f => Audio_.casquillo(cal.forma === 'escopeta' ? 'escopeta' : cal.forma === 'granada' ? 'granada40' : 'bala', 'asfalto', f);
  }
  municionParaMano() { return this.abierto > 0.8 && this.municion + this.vainas < this.capacidad ? { tipo: this.def.unidad, cuerpo: cartucho3d(this.id, true), punta: true } : null; }
  probarCarga(m) {
    if (this.abierto < 0.8 || this.municion + this.vainas >= this.capacidad) return false;
    const cal = calibreDe(this.id), punta = m.objeto.localToWorld(P(cal.vaina + cal.punta * 0.5, 0));
    if (punta.distanceTo(this.recamaraMundo()) > 0.09) return false;
    this.municion++; Audio_.recarga(this.def.unidad === 'cartucho' ? 'cartucho' : this.def.unidad === 'granada40' ? 'granada' : 'bala', this.id);
    this.mundo.vibrar('left', 0.4, 30); this.dibujarContador(); return true;
  }
  zonas() { return this.def.apoyo ? [{ tipo: 'apoyo', punto: this.mundoDe(P(...this.def.apoyo.punto)), radio: this.def.apoyo.radio }] : []; }
  dibujarContador() { this.recamara = false; super.dibujarContador(); this.verRecamaras(); }
  /* Qué hay en cada recámara, en el orden en que van a tirar desde la de arriba (k = 0): las balas que quedan, después
   * las vacías y al final las vainas de los tiros (la última, la de recién). La recámara j del tambor está arriba
   * cuando j ≡ −sentido·vueltas (mod 6), y la k-ésima en tirar es la j = arriba − sentido·k. */
  verRecamaras() {
    if (!this.tambor) return;
    const t = this.tambor.userData, n = 6, mod = v => ((v % n) + n) % n, arriba = mod(-t.sentido * this.vueltas);
    for (let k = 0; k < n; k++) {
      const r = t.recamaras[mod(arriba - t.sentido * k)];
      r.llena.visible = k < this.municion; r.vaina.visible = k >= this.municion && k >= n - this.vainas;
    }
  }
  recargaEscritorio(ahora) {
    if (this.cola.length) return;
    this.objetivo = 1; Audio_.recarga('abrir', this.id);
    this.cola.push([ahora + 260, () => this.volcar()]);   // abierta: salen las vainas (no depende de cuántos cuadros tardó en abrir)
    let t = ahora + 450;
    for (let k = 0; k < this.capacidad; k++) { t += 380; this.cola.push([t, () => { if (this.municion + this.vainas < this.capacidad) { this.municion++; Audio_.recarga(this.def.unidad === 'cartucho' ? 'cartucho' : this.def.unidad === 'granada40' ? 'granada' : 'bala', this.id); this.dibujarContador(); } }]); }
    this.cola.push([t + 400, () => { this.objetivo = 0; Audio_.recarga('cerrar', this.id); this.alCerrar(); }]);
  }
  volcar() { if (!this.volcado) { this.volcado = true; this.vaciar(); } }
}

/* ---------- Revólveres: abierto el tambor, la varilla vuelca todo (como en el juego); la Magnum se carga de a una y la
 * Colt Python con el cargador rápido, las seis de una vez; el cargador vacío se cae de la mano ---------- */
function cargadorRapido3d(id, cargado, rc = null) {   // cm: la perilla atrás, el cuerpo y las seis balas alrededor del eje, como en el tambor
  const cal = calibreDe(id), g = new THREE.Group(), R = rc || cal.d * 1.08;
  const negro = new THREE.MeshStandardMaterial({ color: 0x1d1d20, roughness: 0.55, metalness: 0.25 });
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(R + cal.d * 0.62, R + cal.d * 0.62, 0.9, 24), negro); cuerpo.rotation.z = Math.PI / 2; cuerpo.position.x = -0.45; g.add(cuerpo);
  const perilla = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 1.7, 18), negro); perilla.rotation.z = Math.PI / 2; perilla.position.x = -1.75; g.add(perilla);
  if (cargado) for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, b = cartucho3d(id, true); b.position.set(0, Math.cos(a) * R, Math.sin(a) * R); g.add(b); }
  return g;
}
class Revolver extends Basculante {
  vaciar() {   // vainas y balas: todo al piso
    for (let k = 0; k < this.vainas + this.municion; k++) this.caer(k >= this.vainas);
    this.vainas = 0; this.municion = 0; this.dibujarContador();
  }
  rapido() { return this.datos.recargaUnidad === 'speedloader'; }
  municionParaMano() {
    if (this.abierto < 0.8 || this.municion + this.vainas >= this.capacidad) return null;
    return this.rapido() ? (this.municion === 0 && this.vainas === 0 ? { tipo: 'speedloader', cuerpo: cargadorRapido3d(this.id, true, this.tambor && this.tambor.userData.rc), agarre: P(-1.9, 0), punta: true } : null) : super.municionParaMano();
  }
  probarCarga(m) {
    if (m.tipo !== 'speedloader') return super.probarCarga(m);
    if (this.abierto < 0.8 || this.municion + this.vainas > 0) return false;
    const cal = calibreDe(this.id), punta = m.objeto.localToWorld(P(cal.vaina + cal.punta * 0.5, 0));
    if (punta.distanceTo(this.recamaraMundo()) > 0.1) return false;
    this.municion = this.capacidad; Audio_.recarga('speedloader', this.id); this.mundo.vibrar('left', 0.6, 40); this.dibujarContador();
    // el cargador rápido, ya vacío, se cae de la mano
    const vacio = cargadorRapido3d(this.id, false, this.tambor && this.tambor.userData.rc), q = new THREE.Quaternion(), pos = v3(), e = v3(); m.objeto.updateMatrixWorld(true); m.objeto.matrixWorld.decompose(pos, q, e);
    vacio.position.copy(pos); vacio.quaternion.copy(q); vacio.scale.copy(e);
    this.mundo.efectos.soltar(vacio, v3((Math.random() - 0.5) * 0.3, -0.3, (Math.random() - 0.5) * 0.3), v3(3, 1, 2), 'cargador', 0.012).sonido = f => Audio_.casquillo('speedloader', 'asfalto', f);
    return true;
  }
  recargaEscritorio(ahora) {   // abre (se vuelca todo), las seis de a una o con el cargador rápido, y cierra
    if (this.cola.length) return;
    this.objetivo = 1; Audio_.recarga('abrir', this.id);
    this.cola.push([ahora + 260, () => this.volcar()]);
    let t = ahora + 450;
    if (this.rapido()) { t += 450; this.cola.push([t, () => { this.municion = this.capacidad; Audio_.recarga('speedloader', this.id); this.dibujarContador(); }]); }
    else for (let k = 0; k < this.capacidad; k++) { t += 380; this.cola.push([t, () => { if (this.municion + this.vainas < this.capacidad) { this.municion++; Audio_.recarga('bala', this.id); this.dibujarContador(); } }]); }
    this.cola.push([t + 450, () => { this.objetivo = 0; Audio_.recarga('cerrar', this.id); }]);
  }
}

/* ---------- Mosin-Nagant: vacía y con el cerrojo atrás, el peine de cinco en la guía, se empujan todas y al cerrar el
 * cerrojo el peine salta (como en el juego); a medias, bala por bala ---------- */
function tira3d(id, cargada) {   // cm: la tira de acero que agarra los culotes y las cinco balas paradas una sobre otra
  const cal = calibreDe(id), g = new THREE.Group(), paso = cal.d * 0.98, alto = paso * 5 + 0.2;
  const acero = new THREE.MeshStandardMaterial({ color: 0x6b6e74, metalness: 0.85, roughness: 0.38 });
  const tira = new THREE.Mesh(new THREE.BoxGeometry(0.5, alto, cal.d * 1.25), acero); tira.position.set(0.05, -alto / 2 + 0.1, 0); g.add(tira);
  if (cargada) for (let k = 0; k < 5; k++) { const b = cartucho3d(id, true); b.position.set(0.25, -cal.d / 2 - k * paso, 0); g.add(b); }
  return g;
}
class Mosin extends Arma {
  municionParaMano() {
    if (this.accion > 0.8 && this.municion === 0 && !this.tiraPuesta) return { tipo: 'tira', cuerpo: tira3d(this.id, true), agarre: P(0.3, -calibreDe(this.id).d * 2.5), punta: false };
    return super.municionParaMano();
  }
  probarCarga(m) {
    if (m.tipo !== 'tira') return super.probarCarga(m);
    if (this.accion < 0.8 || this.municion > 0) return false;
    const abajo = m.objeto.localToWorld(P(1, -calibreDe(this.id).d * 4.5));
    if (abajo.distanceTo(this.mundoDe(P(...this.def.carga.punto))) > 0.09) return false;
    this.municion = this.capacidad; Audio_.recarga('peine', this.id); this.mundo.vibrar('left', 0.6, 50);
    // la tira vacía queda en la guía hasta que se cierra el cerrojo
    this.tiraPuesta = tira3d(this.id, false); this.tiraPuesta.position.set(...this.def.carga.punto); this.tiraPuesta.position.y += calibreDe(this.id).d * 2.5; this.a.raiz.add(this.tiraPuesta);
    this.dibujarContador(); return true;
  }
  adelante() {
    super.adelante();
    if (!this.tiraPuesta) return;
    const t = this.tiraPuesta; this.tiraPuesta = null; t.updateMatrixWorld(true);
    const pos = v3(), q = new THREE.Quaternion(), e = v3(); t.matrixWorld.decompose(pos, q, e); t.parent.remove(t);
    t.position.copy(pos); t.quaternion.copy(q); t.scale.copy(e);
    const arriba = this.mundoDe(P(0, 100)).sub(this.mundoDe(P(0, 0))).normalize();
    this.mundo.efectos.soltar(t, arriba.multiplyScalar(1.6).add(this.mundoDe(P(0, 0, 100)).sub(this.mundoDe(P(0, 0, 0))).normalize().multiplyScalar(0.8)), v3(6, 2, 3), 'vaina', 0.006).sonido = f => Audio_.casquillo('peine', 'asfalto', f);
  }
  recargaEscritorio(ahora) {
    if (this.cola.length) return;
    if (this.municion > 0) { super.recargaEscritorio(ahora); return; }
    this.cola.push([ahora, () => { this.accion = 1; if (!this.atrasHecho) this.atras(); }]);
    this.cola.push([ahora + 900, () => { this.municion = this.capacidad; Audio_.recarga('peine', this.id); this.dibujarContador(); }]);
    this.cola.push([ahora + 1400, () => { this.accion = 0; this.adelante(); Audio_.casquillo('peine', 'asfalto', 0.6); }]);
  }
}

/* ---------- M1 Garand: peine en bloque de 8 ---------- */
// El peine (cm): dos láminas de acero a los costados de los culotes y, si va cargado, las ocho balas en dos hileras
function peine3d(id, cargado) {
  const cal = calibreDe(id), g = new THREE.Group(), paso = cal.d * 0.87, alto = paso * 4 + cal.d * 0.4, largo = cal.vaina * 0.62;
  const acero = new THREE.MeshStandardMaterial({ color: 0x63666d, metalness: 0.85, roughness: 0.35 });
  for (const z of [-cal.d - 0.08, cal.d + 0.08]) { const l = new THREE.Mesh(new THREE.BoxGeometry(largo, alto, 0.08), acero); l.position.set(largo / 2 - 0.3, -alto / 2, z); g.add(l); }
  if (cargado) for (let k = 0; k < 8; k++) { const b = cartucho3d(id, true); b.position.set(0, -cal.d / 2 - k * paso * 0.5, k % 2 ? cal.d / 2 : -cal.d / 2); g.add(b); }
  return g;
}
class Garand extends Arma {
  disparar(ahora) {
    super.disparar(ahora);
    if (this.municion === 0 && !this.recamara) this.cola.push([ahora + 45, () => { Audio_.pingGarand(); this.saltarPeine(); }]);   // la última: el peine sale con su «ping»
  }
  saltarPeine() {
    const g = peine3d(this.id, false); g.scale.setScalar(A_METROS); g.position.copy(this.mundoDe(P(...this.def.carga.punto))); g.quaternion.copy(this.modelo.getWorldQuaternion(new THREE.Quaternion()));
    const arriba = this.mundoDe(P(0, 100)).sub(this.mundoDe(P(0, 0))).normalize();
    const s = this.mundo.efectos.soltar(g, arriba.multiplyScalar(3.2 + Math.random()).addScaledVector(this.direccion(), -0.6), v3(10 + Math.random() * 6, 2, 1), 'vaina', 0.012);
    s.sonido = f => Audio_.casquillo('enBloque', 'asfalto', f);
  }
  // Vacío, con el cerrojo trabado atrás: la izquierda trae un peine lleno; al llegar arriba del cajón entra y el cerrojo cierra solo
  municionParaMano() { return !this.recamara && this.municion === 0 ? { tipo: 'peine', cuerpo: peine3d(this.id, true), agarre: P(1.5, -2), punta: false } : null; }
  probarCarga(m) {
    if (m.tipo !== 'peine' || this.recamara || this.municion > 0) return false;
    const fondo = m.objeto.localToWorld(P(0.6, -calibreDe(this.id).d * 2.2));
    if (fondo.distanceTo(this.mundoDe(P(...this.def.carga.punto))) > 0.08) return false;
    this.cargarPeine(); return true;
  }
  cargarPeine() {
    this.municion = this.capacidad - 1; this.recamara = true; this.bloqueada = false; this.accion = 0;
    Audio_.recarga('cargador-poner', this.id); this.cola.push([performance.now() + 90, () => Audio_.recarga('cierra-solo', this.id)]);
    this.mundo.vibrar('left', 0.6, 50); this.mundo.vibrar('right', 0.5, 40); this.dibujarContador();
  }
  recargaEscritorio(ahora) { if (this.cola.length || this.recamara || this.municion > 0) return; this.cola.push([ahora + 700, () => this.cargarPeine()]); }
}

/* ---------- Bazuca: el cohete va adentro del tubo (el dibujo no lo tiene suelto); se arma para tirarlo y cargarlo ---------- */
class Bazuca extends Cohete {
  constructor(id, mundo) {
    super(id, mundo);
    const boca = enCm(DIBUJO_ARMAS[id].boca), c = cajaTotal(this.a.base);
    this.bocaTubo = P(boca[0], boca[1]); this.colaTubo = P(c.x0 + 1, boca[1]);   // el fogonazo adelante y el chorro de atrás, en la M9
    this.a.cargadorSuelto = () => {
      const g = new THREE.Group(), verde = new THREE.MeshStandardMaterial({ color: 0x4a5a32, roughness: 0.6, metalness: 0.2 }), acero = new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.4, metalness: 0.7 });
      const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 34, 16), verde); cuerpo.rotation.z = Math.PI / 2; cuerpo.position.x = 17; g.add(cuerpo);
      const punta = new THREE.Mesh(new THREE.ConeGeometry(2.6, 14, 16), verde); punta.rotation.z = -Math.PI / 2; punta.position.x = 41; g.add(punta);
      for (let k = 0; k < 4; k++) { const ala = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 5), acero); ala.position.set(2, 0, 0); ala.rotation.x = k * Math.PI / 2; ala.translateZ(3.2); g.add(ala); }
      g.position.set(-20, enCm(DIBUJO_ARMAS[id].boca)[1], 0);   // en el eje del tubo, la cola 20 cm detrás del origen
      return g;
    };
  }
}

/* ---------- Égida y Gungnir (js/poderes.js, ArmaLanzada): se tiran rectas, golpean a todo lo que cruzan (a cada uno una
 * vez), llegan a su alcance o chocan con algo y vuelven solas a la mano; de vuelta también golpean. La lanza vuela con la
 * punta adelante (15 m/s, 10,7 m); el escudo, acostado y girando (11 m/s, 7,2 m) ---------- */
class Arrojadiza extends Mjolnir {
  constructor(id, mundo) {
    super(id, mundo); this.lanza = this.datos.poder === 'lanza'; this.vuelveSola = true;
    const b = new THREE.Box3().setFromObject(this.a.raiz); this.radioVuelo = this.lanza ? 0.08 : Math.max(b.max.x - b.min.x, b.max.y - b.min.y) * A_METROS / 2;
    if (!this.lanza) {   // el escudo se lleva con la cara adelante (el dibujo es su frente): girado media vuelta, de la manija
      this.escudo = true; const e = this.def.empunadura;
      this.modelo.quaternion.setFromAxisAngle(v3(0, 1, 0), Math.PI);
      this.modelo.position.copy(v3(e[0], e[1], 0).multiplyScalar(A_METROS).applyAxisAngle(v3(0, 1, 0), Math.PI)).negate();
    }
  }
  lanzar(vel) {
    if (vel.length() < 2.5) return false;
    const dir = vel.clone().normalize();
    this.alcance = this.lanza ? 10.7 : 7.2; this.desde = this.soporte.position.clone(); this.tocados = new Set(); this.previo = this.desde.clone();
    this.tirado = true; this.volando = true; Audio_.lanzar(this.datos.poder);
    if (this.lanza) this.soporte.lookAt(this.soporte.position.clone().sub(dir));   // la punta (−z del soporte) adelante
    else {   // el escudo acostado, la cara para arriba (−z del soporte), gira sobre su eje como un plato
      const h = dir.clone().setY(0); if (h.lengthSq() < 1e-6) h.set(0, 0, -1); h.normalize();
      this.soporte.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(h.clone().cross(v3(0, -1, 0)), h, v3(0, -1, 0)));
    }
    this.vuelo = this.mundo.lanzar({ objeto: this.soporte, vel: dir.multiplyScalar(this.lanza ? 15 : 11), gravedad: 0, vida: 5, perfora: true, gira: this.lanza ? null : v3(0, 0, 16), enEscena: true,
      alChocar: h => {
        if (h.zombie) return false;   // a los zombies los pega el barrido (actualizar): atraviesa
        Audio_.golpeCuerpo('golpe', false, this.id); this.vuelo = null; this.volver(); return true;   // chocó con la pared o el piso
      } });
    return true;
  }
  volver() { this.llamar(() => this.mundo.mano()); }
  llamar(mano) { if (!this.tirado || this.volviendoAMano) return; if (this.vuelo) this.mundo.dejarDeLanzar(this.vuelo); this.vuelo = null; this.volviendoAMano = mano; this.volando = true; this.tocados = new Set(); }
  actualizar(ahora, dt) {
    if (this.vuelo && (this.soporte.position.distanceTo(this.desde) > this.alcance || this.vuelo.edad > 2)) this.volver();   // llegó a su alcance (o se trabó)
    if (this.volviendoAMano) {
      const destino = this.volviendoAMano(), p = this.soporte.position, d = destino.clone().sub(p), l = d.length();
      if (l < 0.2) { this.volviendoAMano = null; this.tirado = false; this.volando = false; Audio_.atrapar(this.datos.poder); if (this.alVolver) this.alVolver(this); }
      else {
        d.normalize(); p.addScaledVector(d, Math.min(l, (this.lanza ? 17 : 13) * dt));
        if (this.lanza) this.soporte.lookAt(p.clone().sub(d)); else this.soporte.rotateZ(16 * dt);
      }
    }
    // En el aire, ida y vuelta: golpea a cada zombie que cruza una vez por tramo
    if (this.volando && this.previo) {
      const p = this.soporte.position, dir = p.clone().sub(this.previo);
      if (dir.lengthSq() > 1e-8) for (const z of this.mundo.zombiesEnTramo(this.previo, p, this.radioVuelo)) {
        const alto = z.clase === 'animal' ? (z.especie === 'toro' ? 1.6 : 0.7) : 1.8 * z.grupo.scale.x;
        if (this.tocados.has(z) || p.y > alto + this.radioVuelo || p.y < 0.05) continue;
        this.tocados.add(z); this.mundo.golpearCuerpo(z, this.datos.dano * 1.5, this.lanza ? 'filo' : 'golpe', dir.clone().normalize(), z.grupo.position.clone().setY(p.y));
        Audio_.golpeCuerpo(this.lanza ? 'filo' : 'golpe', true, this.id); this.mundo.vibrar('right', 0.6, 40);
      }
    }
    this.previo = this.volando ? this.soporte.position.clone() : null;
    if (this.volando) this.previos = null;   // en el aire no barre la hoja (lo hace el tramo de arriba)
    Cuerpo.prototype.actualizar.call(this, ahora, dt);
  }
}

/* ---------- Excalibur (js/poderes.js, OndaLuz): cada tajo fuerte suelta una medialuna de luz que avanza a 12 m/s,
 * atraviesa a todos los que encuentra (a cada uno una vez) y se apaga a los 10,7 m ---------- */
const LUZ = [0xffe7a0, 0xffa22a].map((color, k) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: k ? 0.45 : 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
const GEO_ONDA = [0.028, 0.09].map(tubo => { const g = new THREE.TorusGeometry(0.55, tubo, 6, 30, 2.1); g.rotateZ(Math.PI / 2 - 1.05); g.translate(0, -0.55, 0); return g; });
// La velocidad de la punta para que un tajo cuente como golpe con poder (m/s); sólo con el visor (porTajo, vr/campo.js):
// sin visor el poder sale con el clic
const TAJO = 4.2;
class Excalibur extends Cuerpo {
  constructor(id, mundo) { super(id, mundo); this.ondas = []; this.proximoPoder = 0; }
  actualizar(ahora, dt) {
    const antes = this.previos ? this.previos[this.previos.length - 1].clone() : null;
    super.actualizar(ahora, dt);
    if (this.enMano && this.porTajo && antes && this.velPunta > TAJO) this.poder(ahora, this.previos[this.previos.length - 1].clone().sub(antes));
    for (let i = this.ondas.length - 1; i >= 0; i--) if (!this.moverOnda(this.ondas[i], dt)) { this.mundo.escena.remove(this.ondas[i].g); this.ondas.splice(i, 1); }
  }
  // tajo: hacia dónde iba la punta (la medialuna queda en ese plano); sin visor, el clic la llama sin tajo
  poder(ahora = performance.now(), tajo = null) {
    if (ahora < this.proximoPoder) return;
    this.proximoPoder = ahora + this.datos.cadencia;
    const f = this.mundo.mirada().setY(0); if (f.lengthSq() < 1e-6) return; f.normalize();
    let x = tajo ? tajo.clone().addScaledVector(f, -tajo.dot(f)) : v3(); if (x.lengthSq() < 1e-6) x = v3(-f.z, 0, f.x); x.normalize();
    const y = f.clone().cross(x), g = new THREE.Group();
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, f));
    for (let k = 0; k < 2; k++) g.add(new THREE.Mesh(GEO_ONDA[k], LUZ[k].clone()));
    const medio = this.mundoDe(this.puntos[2]), p = this.mundo.ojo().setY(limitar(medio.y, 0.6, 1.6)).addScaledVector(f, 0.5);
    g.position.copy(p); this.mundo.escena.add(g);
    this.ondas.push({ g, f, recorrido: 0, tocados: new Set() });
    Audio_.ondaLuz(); this.mundo.vibrar('right', 0.8, 60);
  }
  moverOnda(o, dt) {
    const antes = o.g.position.clone(), paso = 12 * dt; o.g.position.addScaledVector(o.f, paso); o.recorrido += paso;
    const k = 1 + o.recorrido / 10.7 * 0.5; o.g.scale.set(k, k, 1);
    const a = Math.min(1, (10.7 - o.recorrido) / 2.7); o.g.children[0].material.opacity = a; o.g.children[1].material.opacity = 0.45 * a;
    for (const z of this.mundo.zombiesEnTramo(antes, o.g.position, 0.5 * k)) {
      if (o.tocados.has(z)) continue;
      const alto = z.clase === 'animal' ? (z.especie === 'toro' ? 1.6 : 0.7) : 1.8 * z.grupo.scale.x;
      if (o.g.position.y > alto + 0.15) continue;   // pasa por arriba de los bajos
      o.tocados.add(z); this.mundo.golpearCuerpo(z, this.datos.dano, 'filo', o.f.clone(), z.grupo.position.clone().setY(Math.min(o.g.position.y, alto * 0.8)));
    }
    this.mundo.blancosEn(o.g.position, 0.55 * k);
    return o.recorrido < 10.7;
  }
}

/* ---------- Tridente (js/poderes.js, Marea): el golpe fuerte levanta una ola que avanza por el piso hasta 5,3 m, barre a
 * los zombies hacia atrás (los aturde) y se deshace ---------- */
const TEX_OLA = (() => {
  const c = document.createElement('canvas'); c.width = 16; c.height = 128; const g = c.getContext('2d'), d = g.createLinearGradient(0, 0, 0, 128);
  d.addColorStop(0, 'rgba(245,252,255,0.95)'); d.addColorStop(0.12, 'rgba(200,240,255,0.9)'); d.addColorStop(0.35, 'rgba(80,180,220,0.78)'); d.addColorStop(1, 'rgba(18,86,136,0.6)');
  g.fillStyle = d; g.fillRect(0, 0, 16, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
function geoOla() {   // una pared de agua de 2,6 m de ancho y 1 de alto, curvada hacia adelante y con la cresta que se vuelca
  const g = new THREE.PlaneGeometry(2.6, 1, 20, 8), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i) + 0.5; p.setXYZ(i, x, y, -0.35 * (x / 1.3) ** 2 + 0.28 * y ** 3); }   // z: los costados atrás, la cresta adelante
  g.computeVertexNormals(); return g;
}
class Tridente extends Cuerpo {
  constructor(id, mundo) { super(id, mundo); this.olas = []; this.empujados = []; this.proximoPoder = 0; }
  actualizar(ahora, dt) {
    super.actualizar(ahora, dt);
    if (this.enMano && this.porTajo && this.velPunta > TAJO) this.poder(ahora);
    for (let i = this.olas.length - 1; i >= 0; i--) if (!this.moverOla(this.olas[i], dt)) { this.mundo.escena.remove(this.olas[i].m); this.olas.splice(i, 1); }
    for (let i = this.empujados.length - 1; i >= 0; i--) {   // los que barrió la ola van para atrás
      const e = this.empujados[i], paso = Math.min(e.resta, 4.5 * dt);
      if (e.z.vivo) { e.z.grupo.position.addScaledVector(e.f, paso); e.z.grupo.updateMatrixWorld(true); }
      e.resta -= paso; if (e.resta <= 0.001 || !e.z.vivo) this.empujados.splice(i, 1);
    }
  }
  poder(ahora = performance.now()) {
    if (ahora < this.proximoPoder) return;
    this.proximoPoder = ahora + this.datos.cadencia;
    const f = this.mundo.mirada().setY(0); if (f.lengthSq() < 1e-6) return; f.normalize();
    const m = new THREE.Mesh(geoOla(), new THREE.MeshBasicMaterial({ map: TEX_OLA, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    const desde = this.mundo.ojo().setY(0).addScaledVector(f, 0.3);
    m.quaternion.setFromUnitVectors(v3(0, 0, 1), f); m.position.copy(desde); m.scale.y = 0.01; this.mundo.escena.add(m);
    this.olas.push({ m, f, desde, t: 0, tocados: new Set() });
    Audio_.marea(); this.mundo.vibrar('right', 0.9, 120);
  }
  moverOla(o, dt) {
    o.t += dt;
    const frente = Math.min(5.3, o.t * 8.7), alto = Math.min(1, o.t * 4) * Math.max(0, 1 - Math.max(0, o.t - 0.6) / 0.35) * 1.2;
    const p = o.desde.clone().addScaledVector(o.f, frente); o.m.position.copy(p); o.m.scale.y = Math.max(0.01, alto);
    o.m.material.opacity = Math.min(1, alto / 0.4);
    if (Math.random() < dt * 30) this.mundo.efectos.particula(this.mundo.efectos.matHumo, p.clone().add(v3((Math.random() - 0.5) * 2.2, alto * (0.85 + Math.random() * 0.2), 0)).addScaledVector(o.f, 0.25), o.f.clone().multiplyScalar(2).add(v3(0, 0.6, 0)), 0.18, 0.5, 1.8, 3);   // espuma
    for (const z of this.mundo.zombiesEnTramo(o.desde, p, 1.3)) {
      if (o.tocados.has(z)) continue;
      o.tocados.add(z); this.mundo.golpearCuerpo(z, this.datos.dano * 0.7, 'golpe', o.f.clone());
      if (z.vivo && !(z.T && z.T.jefe)) { z.aturdido = Math.max(z.aturdido || 0, 0.9); this.empujados.push({ z, f: o.f.clone(), resta: 1.6 }); }
    }
    this.mundo.blancosEn(p.clone().setY(0.6), 1.3);
    return o.t < 0.95;
  }
}

/* ---------- Registro: la ficha y la clase de cada una ---------- */
const CLASES_NUEVAS = { revolver: Revolver, quiebre: Basculante, garand: Garand, mosin: Mosin, cohete: Bazuca, arrojadiza: Arrojadiza, excalibur: Excalibur, tridente: Tridente };
for (const id of ARMAS_PARED) {
  DEFS[id] = fichaDe(id);
  const c = CLASE_DE[id];
  CLASES[id] = c ? CLASES_NUEVAS[c] : ARMAS[id].cuerpo ? Cuerpo : Arma;
}
