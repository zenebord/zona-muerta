/* ===== Equipables de las armas (pedido de Enzo, 18/11): bípode, mira y silenciador =====
 * En el búnker de la pelea infinita, abajo del todo en la ventana del arma elegida, el botón EQUIPABLES muestra tres
 * objetos que se compran y quedan puestos en esa arma:
 *   - BÍPODE: en cualquier arma menos las escopetas, las pistolas y las de cuerpo a cuerpo. Mejora muy poco la
 *     puntería: la bala le pega de frente a un zombie chiquito sin que el tirador se agache (la caja del golpe de los
 *     chiquitos sube unos píxeles) y las ráfagas se abren la mitad. Sólo vale parado en el piso: desde una montaña o un
 *     lugar alto no ayuda, y sólo con los zombies chiquitos (más bajos que la boca del arma).
 *   - MIRA: funciona igual que las que ya existen (tecla D: apunta sola al zombie más cercano y la bala no falla).
 *     Los rifles sólo pueden llevar la telescópica; todas las otras armas, sólo la de punto rojo.
 *   - SILENCIADOR: el disparo suena apagado y casi no hay fogonazo, y atrae a menos zombies: con él en el arma que
 *     tienes en la mano, los zombies vivos a la vez son un 20 % menos (cuatro donde iban cinco de cada diez).
 * EQUIPO_ARMAS: id del arma → { bipode, mira ('telescopica' | 'puntoRojo'), silenciador }; se vacía en cada partida.
 */
const EQUIPO_ARMAS = new Map();
const equipoDe = id => EQUIPO_ARMAS.get(id) || {};
const FRACCION_SILENCIADOR = 0.8;   // zombies vivos a la vez con silenciador: 4 donde iban 5
const BIPODE = { subeCaja: 40, chicoMax: 0.85, desnivelMax: 24, altoMax: 20, desvio: 0.5 };   // px; escala del «chiquito»; px sobre el piso para decir «lugar alto»
const EQUIPABLES = {
  bipode: { nombre: 'equip.bipode', desc: 'equip.bipode.desc', precio: () => 200 },
  mira: { nombre: id => 'equip.mira.' + (ARMAS[id].categoria === 'rifle' ? 'tele' : 'punto'), desc: id => 'equip.mira.' + (ARMAS[id].categoria === 'rifle' ? 'tele' : 'punto') + '.desc', precio: id => ARMAS[id].categoria === 'rifle' ? 350 : 250 },
  silenciador: { nombre: 'equip.silenciador', desc: 'equip.silenciador.desc', precio: () => 300 },
};
const miraPropia = id => MIRA_TELESCOPICA.has(id) ? 'telescopica' : MIRA_PUNTO_ROJO.has(id) ? 'puntoRojo' : null;   // la que el arma ya trae
const esDeFuego = a => !!a && !a.cuerpo && a.categoria !== 'granada';

// ¿Va este equipable en esta arma? { ok, puesto, razon, nombre, desc, precio }
function infoEquipable(tipo, id) {
  const a = ARMAS[id], E = EQUIPABLES[tipo], eq = equipoDe(id), r = { ok: false, puesto: !!eq[tipo], razon: '' };
  const por = x => typeof x === 'function' ? x(id) : x;
  r.nombre = por(E.nombre); r.desc = por(E.desc); r.precio = E.precio(id);
  if (r.puesto) { r.ok = true; return r; }
  if (!esDeFuego(a)) r.razon = 'equip.noVa.cuerpo';
  else if (tipo === 'bipode' && (a.categoria === 'escopeta' || a.categoria === 'pistola')) r.razon = 'equip.noVa.bipode';
  else if (tipo === 'mira' && miraPropia(id)) r.razon = 'equip.noVa.yaMira';
  else r.ok = true;
  return r;
}

/* ---------- Dibujo: sobre el arma, con los puntos de anclaje que ya tiene (boca, mano delantera, expulsión) ---------- */
function dibujarEquipables(ctx, id, d) {
  const eq = EQUIPO_ARMAS.get(id); if (!eq || !d || !d.boca) return;
  const b = d.boca;
  if (eq.silenciador) {   // el cilindro oscuro que sale de la boca, con sus anillos
    parte(ctx, b.x - 1, b.y - 2.3, 17, 4.6, '#222327');
    ctx.fillStyle = tinta('#3b3d44'); for (const k of [3, 7, 11]) ctx.fillRect(b.x - 1 + k, b.y - 2.3, 0.9, 4.6);
    ctx.fillStyle = tinta('#111214'); ctx.fillRect(b.x + 15.2, b.y - 1, 0.8, 2);
  }
  if (eq.bipode) {   // las patas plegadas hacia adelante, bajo el guardamanos
    const m = d.manoDelantera || { x: b.x * 0.55, y: b.y + 4 }, ax = Math.min(m.x + 3, b.x - 8), ay = Math.max(m.y - 1, b.y + 3);
    parte(ctx, ax - 1.2, ay - 2, 3, 3, '#33363c');
    parte(ctx, ax, ay + 0.2, 9, 1.2, '#2a2c31'); parte(ctx, ax + 1, ay + 1.6, 8, 1.1, '#2a2c31');
  }
  if (eq.mira) {
    const e = d.expulsion || { x: 8, y: b.y - 2 };
    if (eq.mira === 'telescopica') {   // tubo con las dos campanas, sobre dos anillos de montaje apoyados en la parte de arriba del arma
      const x = Math.max(0, e.x - 11), top = parteSuperior(id, d, x + 1, x + 21);
      parte(ctx, x + 2, top - 3.2, 2.2, 3.4, '#222327'); parte(ctx, x + 15, top - 3.2, 2.2, 3.4, '#222327');
      parte(ctx, x, top - 6.6, 20, 3.4, '#1f2023'); parte(ctx, x - 1.4, top - 7.4, 2.6, 5, '#2b2d33'); parte(ctx, x + 18.8, top - 7.6, 2.8, 5.4, '#2b2d33');
      ctx.fillStyle = tinta('#7fb7ff'); ctx.fillRect(x + 21, top - 6.6, 0.7, 3.4);
    } else {            // punto rojo: caja chica con la lente al frente, sobre su base
      const x = Math.max(0, e.x - 4), top = parteSuperior(id, d, x, x + 6);
      parte(ctx, x, top - 1, 6.4, 1.2, '#222327'); parte(ctx, x + 0.3, top - 4.2, 5.6, 3.4, '#25272b');
      ctx.fillStyle = tinta('rgba(255,70,60,0.85)'); ctx.fillRect(x + 5, top - 3.8, 0.7, 2.6); ctx.fillStyle = tinta('#ff5a4a'); ctx.fillRect(x + 2.6, top - 2.7, 0.9, 0.9);
    }
  }
}

// Dónde queda la parte de arriba del dibujo del arma entre x0 y x1 (unidades del dibujo, y hacia arriba negativa): se
// mide una vez dibujando el arma aparte, así la mira apoya sobre cada una sin flotar ni hundirse
const partesSuperiores = new Map();
function parteSuperior(id, d, x0, x1) {
  const clave = id + ':' + Math.round(x0) + ':' + Math.round(x1);
  if (partesSuperiores.has(clave)) return partesSuperiores.get(clave);
  const PX = 3, ORIGEN_X = 40, ORIGEN_Y = 90, W = 300 * PX, H = 130 * PX;
  const lienzo = document.createElement('canvas'); lienzo.width = W; lienzo.height = H;
  const o = lienzo.getContext('2d', { willReadFrequently: true }), silueta = Pincel.silueta; Pincel.silueta = null;
  o.setTransform(PX, 0, 0, PX, ORIGEN_X * PX, ORIGEN_Y * PX);
  try { d.dibujar(o, { corredera: 0, sinCargador: false, abierto: 0, bombeo: 0, palanca: 0, mirar: 0, tapa: 0 }); } finally { Pincel.silueta = silueta; }
  const datos = o.getImageData(0, 0, W, H).data, xa = Math.max(0, Math.floor((ORIGEN_X + x0) * PX)), xb = Math.min(W, Math.ceil((ORIGEN_X + x1) * PX));
  let alto = null;
  for (let y = 0; y < H && alto === null; y++) for (let x = xa; x < xb; x++) if (datos[(y * W + x) * 4 + 3] > 20) { alto = y / PX - ORIGEN_Y; break; }
  const r = alto === null ? (d.boca ? d.boca.y - 3 : -8) : alto;
  partesSuperiores.set(clave, r);
  return r;
}

/* ---------- La ventana del búnker ---------- */
Object.assign(Juego.prototype, {
  silenciadorEnMano() { const j = this.jugador; return !j.montada && !!equipoDe(j.arma().id).silenciador; },
  // El panel de equipables del arma elegida (reemplaza el contenido de la ventana de la derecha)
  htmlEquipables(id) {
    const B = this.bunker, a = ARMAS[id];
    const filas = ['bipode', 'mira', 'silenciador'].map(tipo => {
      const i = infoEquipable(tipo, id);
      let accion;
      if (i.puesto) accion = `<span class="equip-puesto">✓ ${t('equip.puesto')}</span>`;
      else if (!i.ok) accion = `<span class="equip-novale">${t(i.razon)}</span>`;
      else { const falta = i.precio - B.dinero; accion = `<button type="button" class="boton-bunker secundario" data-bunker="equipo:${tipo}"${falta > 0 ? ' disabled' : ''}><span>${t('bunker.comprar1')}</span><b>${falta > 0 ? t('bunker.faltan', { n: falta }) : '$' + i.precio}</b></button>`; }
      return `<div class="equipable${i.ok ? '' : ' apagado'}"><div class="equip-texto"><b>${t(i.nombre)}</b><small>${t(i.desc)}</small></div>${accion}</div>`;
    }).join('');
    return `<h3>${a.nombre}</h3><p class="estrellas">${t('equip.titulo')}</p>${filas}<button type="button" class="boton-bunker secundario" data-bunker="equipables-volver"><span>${t('equip.volver')}</span></button>`;
  },
  botonEquipables() { return `<button type="button" class="boton-bunker secundario boton-equipables" data-bunker="equipables"><span>${t('equip.boton')}</span><b>▸</b></button>`; },
  comprarEquipo(tipo, armaId, cobrar) {
    const i = EQUIPABLES[tipo] && ARMAS[armaId] ? infoEquipable(tipo, armaId) : null;
    if (!i || !i.ok || i.puesto || !cobrar(i.precio)) return false;
    const eq = Object.assign({}, equipoDe(armaId));
    eq[tipo] = tipo === 'mira' ? (ARMAS[armaId].categoria === 'rifle' ? 'telescopica' : 'puntoRojo') : true;
    EQUIPO_ARMAS.set(armaId, eq);
    this.bunker.dice = t('bunker.dijoEquipo');
    Audio_.sacarArma(ARMAS[armaId]);
    return true;
  },
});

const TEXTOS_EQUIPABLES = {
  es: {
    'equip.boton': 'EQUIPABLES', 'equip.volver': 'VOLVER', 'equip.titulo': 'BÍPODE · MIRA · SILENCIADOR', 'equip.puesto': 'PUESTO',
    'equip.bipode': 'Bípode', 'equip.bipode.desc': 'Afina un poco la puntería: le pegas de frente a los zombies chiquitos sin agacharte. No ayuda desde una montaña ni desde un lugar alto.',
    'equip.mira.tele': 'Mira telescópica', 'equip.mira.tele.desc': 'Como la de los rifles: con la tecla de la mira apunta sola al zombie más cercano y la bala no falla.',
    'equip.mira.punto': 'Mira de punto rojo', 'equip.mira.punto.desc': 'Como la de las metralletas: con la tecla de la mira apunta sola al zombie más cercano y la bala no falla.',
    'equip.silenciador': 'Silenciador', 'equip.silenciador.desc': 'Apaga el disparo y atrae a menos zombies: caen 4 a la vez donde iban 5 (un 20 % menos).',
    'equip.noVa.bipode': 'No va en escopetas ni pistolas', 'equip.noVa.cuerpo': 'No va en esta arma', 'equip.noVa.yaMira': 'Esta arma ya trae su mira',
    'bunker.dijoEquipo': 'Listo, ya te lo dejé puesto.',
  },
  pt: {
    'equip.boton': 'EQUIPÁVEIS', 'equip.volver': 'VOLTAR', 'equip.titulo': 'BIPÉ · MIRA · SILENCIADOR', 'equip.puesto': 'INSTALADO',
    'equip.bipode': 'Bipé', 'equip.bipode.desc': 'Melhora um pouco a pontaria: você acerta os zumbis pequenos de frente sem se abaixar. Não ajuda de uma montanha nem de um lugar alto.',
    'equip.mira.tele': 'Luneta', 'equip.mira.tele.desc': 'Como a dos rifles: com a tecla da mira, ela vai sozinha no zumbi mais próximo e a bala não erra.',
    'equip.mira.punto': 'Mira de ponto vermelho', 'equip.mira.punto.desc': 'Como a das submetralhadoras: com a tecla da mira, ela vai sozinha no zumbi mais próximo e a bala não erra.',
    'equip.silenciador': 'Silenciador', 'equip.silenciador.desc': 'Abafa o tiro e atrai menos zumbis: vêm 4 ao mesmo tempo em vez de 5 (20 % a menos).',
    'equip.noVa.bipode': 'Não serve em escopetas nem pistolas', 'equip.noVa.cuerpo': 'Não serve nesta arma', 'equip.noVa.yaMira': 'Esta arma já tem sua mira',
    'bunker.dijoEquipo': 'Pronto, já deixei instalado.',
  },
  en: {
    'equip.boton': 'ATTACHMENTS', 'equip.volver': 'BACK', 'equip.titulo': 'BIPOD · SIGHT · SUPPRESSOR', 'equip.puesto': 'FITTED',
    'equip.bipode': 'Bipod', 'equip.bipode.desc': 'Steadies your aim a little: you hit small zombies head-on without crouching. It doesn\'t help from a mountain or any high spot.',
    'equip.mira.tele': 'Telescopic sight', 'equip.mira.tele.desc': 'Like the rifles\': with the sight key it locks onto the nearest zombie and the bullet never misses.',
    'equip.mira.punto': 'Red dot sight', 'equip.mira.punto.desc': 'Like the SMGs\': with the sight key it locks onto the nearest zombie and the bullet never misses.',
    'equip.silenciador': 'Suppressor', 'equip.silenciador.desc': 'Muffles the shot and draws fewer zombies: 4 at a time instead of 5 (20% fewer).',
    'equip.noVa.bipode': 'Doesn\'t fit shotguns or pistols', 'equip.noVa.cuerpo': 'Doesn\'t fit this weapon', 'equip.noVa.yaMira': 'This weapon already has its sight',
    'bunker.dijoEquipo': 'Done, it\'s all fitted.',
  },
};
for (const idioma of Object.keys(TEXTOS_EQUIPABLES)) Object.assign(TEXTOS[idioma], TEXTOS_EQUIPABLES[idioma]);
