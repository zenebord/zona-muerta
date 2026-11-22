/* ===== Protecciones del jugador (propuesta aprobada por Leandro, 22/11: «hacé las 7, escudo solo con armas de una mano») =====
 * Siete piezas, una por parte del cuerpo, cada una contra un peligro que el juego ya tiene:
 *   brazales  antebrazos   −20 % a las mordidas                                  aguante 40   $250
 *   chaleco   torso        −35 % a mordidas y golpes                             aguante 80   $500
 *   placas    torso        −55 % a mordidas y golpes, camina 10 % más lento      aguante 160  $1100
 *   casco     cabeza       −60 % a lo que viene por el aire (hielo, ácido) y −10 % a mordidas   aguante 60   $400
 *   mascara   cara         sin veneno de los tóxicos; los charcos de ácido, la mitad (no se gasta)    $350
 *   escudo    mano de apoyo  frena todo lo que viene de frente (mordidas, hielo, ácido), solo con armas de una mano
 *                          (pistolas, revólveres, machete, Égida, Gungnir); con un arma de dos manos va colgado en la
 *                          espalda y no protege                                  aguante 150  $900
 *   traje     antibombas: torso, cabeza y brazos   −80 % a las explosiones, −40 % a mordidas y a lo del aire; 25 % más
 *                          lento y salta menos                                   aguante 250  $2500
 * Lo que una pieza frena se descuenta de su aguante (la barra azul arriba de la vida); en 0 se rompe y se cae. En el
 * búnker de la pelea infinita se compran, se reparan (la mitad del precio, según el daño) y se mejoran (+25 % de aguante
 * por nivel, hasta 5): tercera pestaña, PROTECCIONES. En el entrenamiento y el campo de pruebas se ponen y se sacan
 * gratis desde el menú de armas (C). En los otros modos no hay.
 * Se dibujan sobre el personaje (sobre la ropa de cada uno) envolviendo las funciones del dibujo: dibujarTorso,
 * dibujarCabeza (js/skins.js), dibujarBrazo, piernaArticulada y Jugador.cuerpo (js/jugador-dibujo.js). La VR no las usa:
 * no se toca ningún dibujo de arma (vr/modelo3d.js arma las armas con lo que pasa por pintar).
 */
const PROTECCIONES = {
  brazales: { zona: 'brazos', aguante: 40, precio: 250, frena: { mordida: 0.2 }, color: '#2b2d31' },
  chaleco: { zona: 'torso', aguante: 80, precio: 500, frena: { mordida: 0.35 }, color: '#2c3342' },
  placas: { zona: 'torso', aguante: 160, precio: 1100, frena: { mordida: 0.55 }, lento: 0.1, color: '#8a7556' },
  casco: { zona: 'cabeza', aguante: 60, precio: 400, frena: { aire: 0.6, mordida: 0.1 }, color: '#4f573c' },
  mascara: { zona: 'cara', aguante: null, precio: 350, frena: { charco: 0.5 }, sinVeneno: true, color: '#25282c' },
  escudo: { zona: 'escudo', aguante: 150, precio: 900, frente: true, color: '#9fd0ee' },
  traje: { zona: 'torso', ocupa: ['torso', 'cabeza', 'brazos'], aguante: 250, precio: 2500, frena: { explosion: 0.8, mordida: 0.4, aire: 0.4 }, lento: 0.25, salto: 0.82, color: '#56603f' },
};
const ORDEN_PROTECCIONES = ['brazales', 'chaleco', 'placas', 'casco', 'mascara', 'escudo', 'traje'];
const ZONAS_PROTECCION = ['escudo', 'cabeza', 'torso', 'brazos', 'cara'];   // el orden en que frenan un golpe
const PROTECCION_MEJORA = { max: 5, aguante: 0.25 };
const zonasDe = id => PROTECCIONES[id].ocupa || [PROTECCIONES[id].zona];
// Armas que se usan con una sola mano: con ellas el escudo va en la otra
const armaDeUnaMano = a => !!a && (a.categoria === 'pistola' || !!a.unaMano);
const aguanteMaximo = (id, nivel = 0) => PROTECCIONES[id].aguante === null ? null : Math.round(PROTECCIONES[id].aguante * (1 + PROTECCION_MEJORA.aguante * nivel));
const precioReparar = p => p.max ? Math.max(20, Math.round(PROTECCIONES[p.id].precio * 0.5 * (1 - p.aguante / p.max) / 10) * 10) : 0;
const precioMejorarProteccion = (id, nivel) => Math.round(PROTECCIONES[id].precio * (0.5 + 0.5 * nivel) / 10) * 10;

const Protecciones = {
  // Lo que tiene puesto el jugador, pieza por pieza (para la barra y los menús)
  puestas(j) { return j.protecciones ? ZONAS_PROTECCION.map(z => j.protecciones[z]).filter((p, i, a) => p && a.indexOf(p) === i) : []; },
  tiene(j, id) { return this.puestas(j).find(p => p.id === id) || null; },
  // Se pone (comprada o en las pruebas): saca lo que ocupe las mismas zonas
  poner(j, id, nivel = 0) {
    j.protecciones = j.protecciones || {};
    for (const z of zonasDe(id)) { const otra = j.protecciones[z]; if (otra) for (const zz of zonasDe(otra.id)) delete j.protecciones[zz]; }
    const max = aguanteMaximo(id, nivel), p = { id, nivel, max, aguante: max };
    for (const z of zonasDe(id)) j.protecciones[z] = p;
    this.recalcular(j);
    return p;
  },
  sacar(j, id) {
    if (!j.protecciones) return;
    for (const z of Object.keys(j.protecciones)) if (j.protecciones[z].id === id) delete j.protecciones[z];
    this.recalcular(j);
  },
  // Lo que reemplazaría ponerse `id` (para avisarlo antes de comprar)
  reemplaza(j, id) { return this.puestas(j).filter(p => p.id !== id && zonasDe(p.id).some(z => zonasDe(id).includes(z))).map(p => p.id); },
  // Lo lento y lo que salta según lo que lleva (js/jugador.js multiplica el paso y el salto)
  recalcular(j) {
    let paso = 1, salto = 1;
    for (const p of this.puestas(j)) { const P = PROTECCIONES[p.id]; if (P.lento) paso = Math.min(paso, 1 - P.lento); if (P.salto) salto = Math.min(salto, P.salto); }
    j.pasoProteccion = paso; j.saltoProteccion = salto;
  },
  // ¿El escudo protege ahora? En la mano de apoyo con un arma de una mano (y no montado en la M2)
  escudoEnMano(j) { return !!(j.protecciones && j.protecciones.escudo && !j.montada && !j.muerto && armaDeUnaMano(j.arma())); },
  // Reparte un golpe entre las piezas: el escudo primero (si viene de frente), después cabeza, torso y brazos.
  // Devuelve lo que queda para la vida
  absorber(j, cantidad, tipo, desdeX, juego) {
    let queda = cantidad, golpeEscudo = false;
    for (const z of ZONAS_PROTECCION) {
      const p = j.protecciones[z];
      if (!p || queda <= 0 || p.usadaEn === juego.ahora) continue;
      const P = PROTECCIONES[p.id];
      let parte = 0;
      if (z === 'escudo') {
        const deFrente = desdeX !== undefined && (Math.abs(desdeX - j.x) < 4 || Math.sign(desdeX - j.x) === j.direccion);
        if ((tipo === 'mordida' || tipo === 'aire') && deFrente && this.escudoEnMano(j)) { parte = queda; golpeEscudo = true; }
      } else parte = queda * ((P.frena && P.frena[tipo]) || 0);
      if (parte <= 0) continue;
      p.usadaEn = juego.ahora;   // una pieza que ocupa varias zonas (el traje) frena una sola vez
      if (p.max === null) { queda -= parte; continue; }   // la máscara no se gasta
      parte = Math.min(parte, p.aguante);
      p.aguante -= parte; queda -= parte;
      if (p.aguante <= 0.01) this.romper(j, p, juego);
    }
    if (golpeEscudo) {   // chispa y golpe seco contra el policarbonato
      juego.salpicar(j.x + j.direccion * 16, j.y - 52, '#dff4ff', 7, 2.2);
      Audio_.blanco('metal');
    }
    return Math.max(0, Math.round(queda * 10) / 10);
  },
  romper(j, p, juego) {
    for (const z of Object.keys(j.protecciones)) if (j.protecciones[z] === p) delete j.protecciones[z];
    this.recalcular(j);
    juego.aviso(t('prot.rota', { nombre: t('prot.' + p.id).toUpperCase() }), 1800);
    juego.salpicar(j.x, j.y - 45, PROTECCIONES[p.id].color, 14, 3);
    Audio_.golpeCuerpo('bate', true);
  },
  // Barra azul arriba de la vida: el aguante que queda de todo lo puesto
  hud(j) {
    const barra = document.getElementById('barra-blindaje');
    if (!barra) return;
    const conAguante = this.puestas(j).filter(p => p.max), max = conAguante.reduce((s, p) => s + p.max, 0), aguante = conAguante.reduce((s, p) => s + p.aguante, 0);
    const texto = max ? `${Math.ceil(aguante)} / ${max}` : '';
    if (barra.dataset.texto === texto) return;
    barra.dataset.texto = texto;
    barra.classList.toggle('oculta', !max);
    document.getElementById('blindaje-relleno').style.width = (max ? aguante / max * 100 : 0) + '%';
    document.getElementById('blindaje-texto').textContent = texto;
  },
};

/* ---------- El daño: cada golpe pasa primero por las protecciones ---------- */
// tipo: mordida (mordidas y golpes), aire (bloques de hielo, escupitajos), charco (ácido del piso), explosion
// desdeX: de dónde viene (para el escudo, que solo frena lo de adelante)
const recibirDanoSinProteccion = Jugador.prototype.recibirDano;
Jugador.prototype.recibirDano = function (cantidad, juego, tipo = 'mordida', desdeX) {
  if (this.protecciones && !this.muerto && !this.protegido && juego.ahora >= this.invulnerableHasta) {
    const queda = Protecciones.absorber(this, cantidad, tipo, desdeX, juego);
    if (queda <= 0) { this.invulnerableHasta = juego.ahora + 400; return; }   // lo frenó todo
    cantidad = queda;
  }
  return recibirDanoSinProteccion.call(this, cantidad, juego);
};
const envenenarSinProteccion = Jugador.prototype.envenenar;
Jugador.prototype.envenenar = function (segundos) {
  if (this.protecciones && this.protecciones.cara && PROTECCIONES[this.protecciones.cara.id].sinVeneno) return;   // con la máscara no entra
  return envenenarSinProteccion.call(this, segundos);
};
// La barra del blindaje se actualiza con el resto del HUD
const actualizarHudSinProteccion = Juego.prototype.actualizarHud;
Juego.prototype.actualizarHud = function () {
  actualizarHudSinProteccion.call(this);
  Protecciones.hud(this.jugador);
};

/* ---------- La pose: con el escudo, la mano de apoyo lo sostiene adelante del pecho ---------- */
const ESCUDO_GUARDIA = { x: 10.5, y: -45 };   // dónde va la mano que lo sostiene (unidades del cuerpo)
const estadoArmaSinProteccion = Jugador.prototype.estadoArma;
Jugador.prototype.estadoArma = function () {
  const e = estadoArmaSinProteccion.call(this);
  if (Protecciones.escudoEnMano(this)) {
    e.escudo = true;
    const L = this.recarga, g = ESCUDO_GUARDIA;
    if (!L) {   // recargando, la mano hace lo suyo y el escudo, sujeto al antebrazo, la acompaña
      e.mano = { x: g.x, y: g.y };
      e.apoyo = e.reposoApoyo = e.mano;
      e.gesto = 'punio'; e.agarra = 1;
    } else {   // al empezar y al terminar la recarga, la mano va y vuelve de la guardia en 150 ms (sin salto)
      const k = Math.max(0, Math.min(1, (this.ahora - L.inicio) / 150, (L.fin - this.ahora) / 150));
      if (k < 1 && e.mano) { const q = suavizar(k); e.mano = { x: g.x + (e.mano.x - g.x) * q, y: g.y + (e.mano.y - g.y) * q }; }
    }
  }
  return e;
};

/* ---------- El dibujo de cada pieza sobre el personaje ---------- */
// Mientras se dibuja un jugador, sus protecciones (las demás figuras que usan las mismas funciones no llevan nada)
let PROT_DIBUJO = null;
const tonoP = (id, k = 0) => ajustarColor(PROTECCIONES[id].color, k);
const cuerpoSinProteccion = Jugador.prototype.cuerpo;
Jugador.prototype.cuerpo = function (ctx, parpadeo) {
  const antes = PROT_DIBUJO;
  PROT_DIBUJO = this.protecciones && Object.keys(this.protecciones).length ? { p: this.protecciones, j: this } : null;
  try {
    cuerpoSinProteccion.call(this, ctx, parpadeo);
    // El escudo en la mano: adelante de todo (es transparente: se ve el brazo y el arma a través)
    if (PROT_DIBUJO && PROT_DIBUJO.p.escudo && !this.muerto && !(this.trepa || this.soga) && !(this.aTierra && this.cubierto > 0.3) && !this.montada && Protecciones.escudoEnMano(this)) {
      const e = this.estadoArma();
      dibujarEscudo(ctx, e.mano.x + 3.2, e.mano.y - 2, 0);
    }
  } finally { PROT_DIBUJO = antes; }
};
// Escudo antidisturbios de policarbonato, visto casi de canto (de tres cuartos): la cara transparente celeste, el borde de
// goma negro, la mirilla de arriba más clara y los reflejos. (x, y): centro; inclinado `ang` radianes
function dibujarEscudo(ctx, x, y, ang) {
  const W = 7.2, H = 41, r = 2.2;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const plano = c => { c.moveTo(-W / 2 + r, -H / 2); c.lineTo(W / 2, -H / 2 + 1.2); c.lineTo(W / 2, H / 2 - 1.2); c.lineTo(-W / 2 + r, H / 2); c.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r); c.lineTo(-W / 2, -H / 2 + r); c.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2); c.closePath(); };
  if (Pincel.silueta) { ctx.globalAlpha *= 0.45; ctx.beginPath(); plano(ctx); ctx.fillStyle = Pincel.silueta; ctx.fill(); ctx.restore(); return; }
  const g = ctx.createLinearGradient(-W / 2, 0, W / 2, 0);
  g.addColorStop(0, 'rgba(150,200,230,0.30)'); g.addColorStop(0.55, 'rgba(190,225,245,0.20)'); g.addColorStop(1, 'rgba(120,170,205,0.36)');
  ctx.beginPath(); plano(ctx); ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = 'rgba(235,248,255,0.18)'; ctx.fillRect(-W / 2 + 0.8, -H / 2 + 2.4, W - 1.6, 7.5);   // mirilla
  ctx.strokeStyle = '#17191c'; ctx.lineWidth = 0.9; ctx.beginPath(); plano(ctx); ctx.stroke();       // borde de goma
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.35;
  for (const [a, b] of [[-14, -4], [-1, 7]]) { ctx.beginPath(); ctx.moveTo(-W / 2 + 1.2, a); ctx.lineTo(W / 2 - 1.4, b); ctx.stroke(); }   // reflejos
  ctx.fillStyle = 'rgba(20,22,26,0.55)'; ctx.fillRect(-W / 2 + 0.9, -1, W - 1.8, 2.4);                  // la franja de la manija, por detrás
  ctx.restore();
}
// Torso: chaleco, chaleco con placas o la chaqueta del traje antibombas (y el escudo colgado en la espalda, detrás)
const dibujarTorsoSinProteccion = dibujarTorso;
dibujarTorso = function (ctx, S, C, ty) {
  const P = PROT_DIBUJO && PROT_DIBUJO.p, y = v => v + ty;
  if (P && P.escudo && !Protecciones.escudoEnMano(PROT_DIBUJO.j) && !PROT_DIBUJO.j.montada) dibujarEscudo(ctx, -12.5, y(-44), -0.12);   // colgado en la espalda
  dibujarTorsoSinProteccion(ctx, S, C, ty);
  if (!P || !P.torso) return;
  const id = P.torso.id;
  if (id === 'chaleco') {   // chaleco blando: dos paneles de tela balística sobre la ropa, con las hombreras y el abrojo del frente
    const T = tonoP(id);
    pintura(ctx, c => { c.moveTo(-7.4, y(-36)); c.quadraticCurveTo(-9.2, y(-46), -8.4, y(-54)); c.quadraticCurveTo(-7.4, y(-58.4), -3.2, y(-58.6)); c.lineTo(-2.4, y(-55.6));
      c.lineTo(2.6, y(-55.6)); c.lineTo(3.6, y(-58.4)); c.quadraticCurveTo(8.2, y(-57), 8.4, y(-50)); c.quadraticCurveTo(8.4, y(-41), 6.6, y(-36)); c.closePath(); }, T, { sombra: 0.8, brillo: 0.22 });
    if (!Pincel.silueta) {
      pintura(ctx, c => c.roundRect(4.4, y(-52), 3.6, 5, 0.6), tonoP(id, 0.08), { sombra: 0.3, brillo: 0.15, linea: 0.3 });   // abrojo del frente
      for (const yy of [-44, -39.5]) raya(ctx, tonoP(id, -0.4), 0.35, [[-8.2, y(yy)], [7.6, y(yy)]]);                         // correas laterales
    }
  } else if (id === 'placas') {   // portaplacas: placas abultadas adelante y atrás, hombreras, faja y portacargadores
    const T = tonoP(id);
    pintura(ctx, c => { c.moveTo(-9.6, y(-37)); c.quadraticCurveTo(-11, y(-47), -9.8, y(-55)); c.quadraticCurveTo(-8.6, y(-58.8), -3.4, y(-58.8)); c.lineTo(-2.6, y(-56));
      c.lineTo(2.6, y(-56)); c.lineTo(3.8, y(-58.8)); c.quadraticCurveTo(9.8, y(-57.6), 10.2, y(-49)); c.quadraticCurveTo(10.4, y(-41), 8.4, y(-37)); c.closePath(); }, T, { sombra: 1, brillo: 0.25 });
    pintura(ctx, c => c.roundRect(-9.4, y(-40.6), 18.8, 4.2, 1), tonoP(id, -0.1), { sombra: 0.5, brillo: 0.15 });                // faja
    for (let k = 0; k < 3; k++) pintura(ctx, c => c.roundRect(7.6, y(-50 + k * 3.6), 3.6, 3.2, 0.6), tonoP(id, 0.05), { sombra: 0.4, brillo: 0.2, linea: 0.3 });   // portacargadores
    if (!Pincel.silueta) { for (let k = 0; k < 4; k++) raya(ctx, tonoP(id, -0.35), 0.3, [[-9, y(-53 + k * 3)], [-4, y(-53 + k * 3)]]); }   // cintas de la espalda
  } else if (id === 'traje') {   // traje antibombas: chaqueta acolchada gruesa con cuello alto y la placa del pecho
    const T = tonoP(id);
    pintura(ctx, c => { c.moveTo(-10, y(-32)); c.quadraticCurveTo(-12, y(-46), -10.6, y(-57)); c.quadraticCurveTo(-9, y(-62.6), -3.4, y(-63.4)); c.lineTo(4.4, y(-63));
      c.quadraticCurveTo(10.6, y(-60), 11, y(-49)); c.quadraticCurveTo(11.2, y(-38), 9, y(-32)); c.closePath(); }, T, { sombra: 1.2, brillo: 0.25 });
    pintura(ctx, c => c.roundRect(2.6, y(-56), 8.2, 15, 2.2), tonoP(id, 0.06), { sombra: 0.8, brillo: 0.3 });                     // placa del pecho
    if (!Pincel.silueta) { for (let k = 0; k < 5; k++) raya(ctx, tonoP(id, -0.32), 0.35, [[-9.6, y(-36 - k * 5)], [2, y(-36.4 - k * 5)]]); }   // costuras del acolchado
  }
};
// Brazos: brazales de kevlar en los antebrazos, o las mangas gruesas del traje
const dibujarBrazoSinProteccion = dibujarBrazo;
dibujarBrazo = function (ctx, hx, hy, mx, my, R, C) {
  dibujarBrazoSinProteccion(ctx, hx, hy, mx, my, R, C);
  const P = PROT_DIBUJO && PROT_DIBUJO.p;
  if (!P || !P.brazos) return;
  const { cx, cy } = R, en = (x0, y0, x1, y1, k) => [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
  if (P.brazos.id === 'traje') {
    forma(ctx, juntos(tramoMusculo(hx, hy, cx, cy, 7.2, 6.0, 0.3, 0.3), tramoMusculo(cx, cy, ...en(cx, cy, mx, my, 0.86), 6.0, 5.2, 0.2, 0.2)), tonoP('traje'), { sombra: 0.8 });
  } else {
    const T = tonoP('brazales');
    forma(ctx, tramoMusculo(...en(cx, cy, mx, my, 0.2), ...en(cx, cy, mx, my, 0.84), 5.0, 4.1, 0.15, 0.1), T, { sombra: 0.6, linea: 0.36 });
    if (!Pincel.silueta) for (const k of [0.36, 0.7]) forma(ctx, tramoMusculo(...en(cx, cy, mx, my, k - 0.03), ...en(cx, cy, mx, my, k + 0.03), 5.3, 5.2), tonoP('brazales', 0.18), { sombra: 0.2, linea: 0.25 });   // las correas
  }
};
// Piernas: con el traje antibombas, el pantalón grueso del traje
const piernaSinProteccion = piernaArticulada;
piernaArticulada = function (ctx, hx, hy, a, doblez, color, C) {
  const P = PROT_DIBUJO && PROT_DIBUJO.p;
  if (P && P.torso && P.torso.id === 'traje') {
    const T = tonoP('traje'), atras = color !== C.pantalon;
    const C2 = Object.assign({}, C, { pantalon: T, camo: null, rodillera: ajustarColor(T, -0.12), rayaPierna: null, sinRodillera: false });
    return piernaSinProteccion(ctx, hx, hy, a, doblez, atras ? ajustarColor(T, -0.18) : T, C2);
  }
  return piernaSinProteccion(ctx, hx, hy, a, doblez, color, C);
};
// Cabeza: máscara de gas, casco balístico o el casco del traje con su visor
const dibujarCabezaSinProteccion = dibujarCabeza;
dibujarCabeza = function (ctx, S, C, ty, e) {
  dibujarCabezaSinProteccion(ctx, S, C, ty, e);
  const P = PROT_DIBUJO && PROT_DIBUJO.p;
  if (!P || !(P.cara || P.cabeza)) return;
  const hy = -78 + ty;
  ctx.save(); ctx.translate(1, hy + 13.2); ctx.scale(0.72, 0.72); ctx.translate(-1, -(hy + 16.4));   // el mismo marco que la cabeza (cabezaArriba)
  if (P.cara) {   // máscara de gas: goma negra sobre la nariz y la boca, el ocular, el filtro adelante y las correas
    const M = tonoP('mascara');
    linea(ctx, tinta('#1a1c1f'), 0.9, [[1.8, hy + 6.2], [-8.4, hy + 4.8]]); linea(ctx, tinta('#1a1c1f'), 0.9, [[1.4, hy + 13.6], [-7.6, hy + 12]]);
    pintura(ctx, c => { c.moveTo(1.6, hy + 4); c.quadraticCurveTo(7, hy + 2.4, 10.2, hy + 7.6); c.quadraticCurveTo(11.8, hy + 11, 10.6, hy + 14.6); c.quadraticCurveTo(8.6, hy + 17.6, 3.6, hy + 17);
      c.quadraticCurveTo(0.6, hy + 15.6, 0.8, hy + 10); c.closePath(); }, M, { sombra: 0.7, brillo: 0.2 });
    if (!Pincel.silueta) {   // ocular
      ctx.fillStyle = '#121416'; ctx.beginPath(); ctx.ellipse(6.2, hy + 6.8, 2.6, 2.3, 0, 0, Math.PI * 2); ctx.fill();
      const v = ctx.createLinearGradient(4, hy + 5, 8, hy + 9); v.addColorStop(0, 'rgba(170,210,220,0.75)'); v.addColorStop(1, 'rgba(40,70,80,0.75)');
      ctx.fillStyle = v; ctx.beginPath(); ctx.ellipse(6.2, hy + 6.8, 1.9, 1.7, 0, 0, Math.PI * 2); ctx.fill();
    }
    pintura(ctx, c => { c.moveTo(9.4, hy + 11.4); c.lineTo(13.4, hy + 12.6); c.lineTo(12.6, hy + 17.2); c.lineTo(8.6, hy + 15.8); c.closePath(); }, '#3b3f45', { sombra: 0.5, brillo: 0.35 });   // filtro
    if (!Pincel.silueta) for (let k = 0; k < 3; k++) raya(ctx, '#2a2d31', 0.25, [[10 + k * 1.1, hy + 12.4 + k * 0.3], [9.4 + k * 1.1, hy + 15.6 + k * 0.3]]);
  }
  if (P.cabeza && P.cabeza.id === 'traje') {   // casco del traje: grande, redondo, con el visor oscuro adelante
    const T = tonoP('traje');
    pintura(ctx, c => { c.moveTo(-11, hy + 18); c.quadraticCurveTo(-13.4, hy + 2, -6, hy - 4.6); c.quadraticCurveTo(4, hy - 8, 10.4, hy - 1); c.quadraticCurveTo(13.4, hy + 4, 13, hy + 18); c.closePath(); }, T, { sombra: 1.2, brillo: 0.3 });
    pintura(ctx, c => { c.moveTo(4.6, hy + 1.6); c.quadraticCurveTo(12.6, hy + 2, 12.8, hy + 9); c.quadraticCurveTo(12.6, hy + 15.6, 5.4, hy + 16); c.quadraticCurveTo(3.6, hy + 9, 4.6, hy + 1.6); c.closePath(); }, '#1c2a2e', { sombra: 0.4, brillo: 0.6 });   // visor
    if (!Pincel.silueta) { ctx.fillStyle = 'rgba(200,235,245,0.25)'; ctx.beginPath(); ctx.ellipse(8.6, hy + 5.6, 1.4, 3.2, -0.3, 0, Math.PI * 2); ctx.fill(); }
  } else if (P.cabeza) {   // casco balístico: cúpula verde oliva con el borde, la cubierta de tela y el barboquejo
    const T = tonoP('casco');
    if (!Pincel.silueta) linea(ctx, '#2a2620', 0.7, [[-1.2, hy + 7.4], [2, hy + 12], [6.4, hy + 15.6]]);   // barboquejo
    pintura(ctx, c => { c.moveTo(-10, hy + 9.6); c.quadraticCurveTo(-11.2, hy - 3.6, -1, hy - 5); c.quadraticCurveTo(8.6, hy - 5.2, 10, hy + 3); c.lineTo(9.6, hy + 4.4); c.quadraticCurveTo(2, hy + 2.6, -2.4, hy + 6.4);
      c.lineTo(-5.2, hy + 10.6); c.closePath(); }, T, { sombra: 1, brillo: 0.28 });
    pintura(ctx, c => { c.moveTo(-10.4, hy + 9); c.lineTo(-5, hy + 10.4); c.lineTo(-2.4, hy + 6.6); c.quadraticCurveTo(2, hy + 3, 10.2, hy + 3.6); c.lineTo(10.4, hy + 4.8); c.quadraticCurveTo(2.4, hy + 4.2, -1.6, hy + 7.8); c.lineTo(-4.6, hy + 11.8); c.lineTo(-10.6, hy + 10.4); c.closePath(); }, tonoP('casco', -0.15), { sombra: 0.4, brillo: 0.12 });   // el borde
    if (!Pincel.silueta) { pintura(ctx, c => c.roundRect(-2.4, hy - 4.4, 5.4, 2.6, 0.6), tonoP('casco', -0.08), { sombra: 0.3, brillo: 0.15, linea: 0.3 }); for (let k = 0; k < 3; k++) raya(ctx, tonoP('casco', -0.3), 0.3, curvaPts(-8.6 + k * 4, hy - 1 - k * 0.8, -5 + k * 4, hy - 3.6, -1.4 + k * 4, hy - 1.6, 3)); }   // la placa de adelante y los pliegues de la cubierta
  }
  ctx.restore();
};

/* ---------- Vista previa: un maniquí con el personaje elegido y solo esa pieza puesta ---------- */
const muestraProteccion = (() => { let m = null; return () => { if (!m) { m = new Jugador(0); m.inventario = ['glock']; m.indiceArma = 0; m.municion = { glock: 17 }; } return m; }; })();
// Encuadre según la zona: la cabeza de cerca, el torso de medio cuerpo, el escudo y el traje enteros
const ENCUADRE_PROT = { cabeza: [-70, 24], cara: [-70, 20], torso: [-48, 40], brazos: [-50, 36], escudo: [-46, 66], traje: [-46, 92] };
function dibujarMuestraProteccion(c, W, H, id, ahora = 1000) {
  const m = muestraProteccion();
  m.skin = Config.get('skin') || 'sobreviviente'; m.protecciones = {}; m.ahora = ahora; m.direccion = 1;
  const arma = id === 'escudo' ? 'glock' : 'm16';
  if (m.inventario[0] !== arma) { m.inventario = [arma]; m.municion = { [arma]: ARMAS[arma].cargador }; }
  const P = PROTECCIONES[id];
  const p = { id, nivel: 0, max: P.aguante, aguante: P.aguante };
  for (const z of zonasDe(id)) m.protecciones[z] = p;
  const [fy, alto] = ENCUADRE_PROT[id === 'traje' ? 'traje' : P.zona] || [-46, 60];
  const k = H / (alto * ESCALA_JUGADOR) * 0.92, cx = W / 2 - (id === 'escudo' ? 8 : 4) * k * ESCALA_JUGADOR;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
  c.save(); c.setTransform(k, 0, 0, k, cx, H / 2 - fy * ESCALA_JUGADOR * k);
  try { m.cuerpo(c, false); } catch (err) { /* sin vista previa */ }
  c.restore();
}

/* ---------- Búnker: la pestaña PROTECCIONES (js/bunker.js la llama) ---------- */
Object.assign(Juego.prototype, {
  cartaProteccion(clave, elegida) {
    const id = clave.slice(5), B = this.bunker, puesta = Protecciones.tiene(this.jugador, id), P = PROTECCIONES[id];
    const pie = puesta ? (puesta.max ? `<small>${'★'.repeat(puesta.nivel)}${'☆'.repeat(PROTECCION_MEJORA.max - puesta.nivel)} · ${Math.ceil(puesta.aguante)}/${puesta.max}</small>` : `<small>${t('prot.puesta')}</small>`)
      : `<small class="precio">$${P.precio}</small>`;
    return `<button type="button" class="bunker-carta${elegida ? ' elegida' : ''}${!puesta && P.precio > B.dinero ? ' caro' : ''}" data-bunker="elegir:${clave}"><canvas width="150" height="64" aria-hidden="true"></canvas>` +
      `<span class="nombre">${t('prot.' + id)}</span>${pie}</button>`;
  },
  detalleProteccion(id, lienzo, acc, boton) {
    const B = this.bunker, j = this.jugador, P = PROTECCIONES[id], puesta = Protecciones.tiene(j, id);
    dibujarMuestraProteccion(lienzo.getContext('2d'), lienzo.width, lienzo.height, id, this.ahora);
    let html = `<h3>${t('prot.' + id)}</h3><p>${t('prot.' + id + '.texto')}</p>`;
    if (puesta) {
      if (puesta.max) {
        html += `<p class="estrellas">${'★'.repeat(puesta.nivel)}${'☆'.repeat(PROTECCION_MEJORA.max - puesta.nivel)} ${t('bunker.nivel', { n: puesta.nivel, max: PROTECCION_MEJORA.max })} · ${t('prot.aguante', { a: Math.ceil(puesta.aguante), b: puesta.max })}</p>`;
        if (puesta.aguante < puesta.max) html += boton('prot:' + id + ':reparar', t('prot.reparar'), precioReparar(puesta));
        if (puesta.nivel < PROTECCION_MEJORA.max) html += boton('prot:' + id + ':mejorar', t('prot.mejorar', { b: aguanteMaximo(id, puesta.nivel + 1) }), precioMejorarProteccion(id, puesta.nivel), ' secundario');
        else html += `<p class="aviso-bunker">${t('bunker.alMaximo')}</p>`;
      } else html += `<p class="aviso-bunker">${t('prot.puesta')}</p>`;
    } else {
      const reemplaza = Protecciones.reemplaza(j, id);
      if (P.aguante) html += `<p>${t('prot.aguante', { a: P.aguante, b: P.aguante })}</p>`;
      if (reemplaza.length) html += `<p class="aviso-bunker">${t('prot.reemplaza', { lista: reemplaza.map(r => t('prot.' + r)).join(', ') })}</p>`;
      html += boton('prot:' + id + ':comprar', t('bunker.comprar1'), P.precio);
    }
    acc.innerHTML = html;
  },
  accionProteccion(resto, cobrar) {
    const [id, que] = resto.split(':'), B = this.bunker, j = this.jugador, P = PROTECCIONES[id];
    if (!P) return false;
    const puesta = Protecciones.tiene(j, id);
    if (que === 'comprar') {
      if (puesta || !cobrar(P.precio)) return false;
      Protecciones.poner(j, id);
      B.dice = t('prot.dijoCompra');
    } else if (que === 'reparar') {
      if (!puesta || !puesta.max || puesta.aguante >= puesta.max || !cobrar(precioReparar(puesta))) return false;
      puesta.aguante = puesta.max;
      B.dice = t('prot.dijoReparar');
    } else if (que === 'mejorar') {
      if (!puesta || !puesta.max || puesta.nivel >= PROTECCION_MEJORA.max || !cobrar(precioMejorarProteccion(id, puesta.nivel))) return false;
      const nuevo = aguanteMaximo(id, puesta.nivel + 1);
      puesta.aguante += nuevo - puesta.max; puesta.max = nuevo; puesta.nivel++;
      B.dice = t('prot.dijoMejora');
    } else return false;
    Audio_.recoger();
    return true;
  },
});

/* ---------- Entrenamiento y campo de pruebas: se ponen y se sacan desde el menú de armas ---------- */
Protecciones.seccionMenu = lista => {
  const grupo = document.createElement('section');
  grupo.className = 'grupo-armas protecciones';
  grupo.innerHTML = `<h3>${t('prot.titulo')} <span>${ORDEN_PROTECCIONES.length}</span></h3>` +
    `<div class="rejilla-armas">${ORDEN_PROTECCIONES.map(id => `<button class="boton-arma boton-proteccion" type="button" data-proteccion="${id}">${t('prot.' + id)}<small>${PROTECCIONES[id].aguante ? t('prot.aguanteCorto', { n: PROTECCIONES[id].aguante }) : t('prot.sinVeneno')}</small></button>`).join('')}` +
    `<button class="boton-arma solo-campo" type="button" data-proteccion="zombie">${t('prot.zombieMuerde')}<small>${t('prot.zombieMuerdeNota')}</small></button></div>`;
  lista.appendChild(grupo);
};
Protecciones.marcarMenu = juego => {
  const j = juego && juego.jugador;
  document.querySelectorAll('#lista-armas-prueba [data-proteccion]').forEach(b => {
    const id = b.dataset.proteccion, p = j && PROTECCIONES[id] && Protecciones.tiene(j, id);
    b.classList.toggle('en-mano', !!p);
    if (id === 'zombie') b.hidden = !(juego && juego.pruebas);
  });
};
document.getElementById('lista-armas-prueba').addEventListener('click', e => {
  const b = e.target.closest('[data-proteccion]'), juego = window.ZonaMuerta && ZonaMuerta.juego();
  if (!b || !juego || !(juego.pruebas || juego.entrenamiento)) return;
  e.stopPropagation();
  const id = b.dataset.proteccion, j = juego.jugador;
  if (id === 'zombie') {   // un zombie de verdad, que camina y muerde: para ver la barra azul bajando
    const z = new Zombie(j.x + j.direccion * 230, false, juego.dificultad);
    juego.zombies.push(z); Audio_.gemido(true, 230);
    juego.aviso(t('prot.zombieAviso'), 1400);
  } else if (Protecciones.tiene(j, id)) { Protecciones.sacar(j, id); juego.aviso(t('prot.sacada', { nombre: t('prot.' + id).toUpperCase() }), 1200); }
  else {
    const reemplaza = Protecciones.reemplaza(j, id);
    Protecciones.poner(j, id);
    juego.aviso(t('prot.puestaAviso', { nombre: t('prot.' + id).toUpperCase() }) + (reemplaza.length ? ' · ' + t('prot.reemplazo', { lista: reemplaza.map(r => t('prot.' + r)).join(', ') }) : ''), 1800);
    Audio_.recoger();
  }
  Protecciones.marcarMenu(juego);
});

/* ---------- Textos ---------- */
Object.assign(TEXTOS.es, {
  'prot.titulo': 'PROTECCIONES', 'bunker.protecciones': 'PROTECCIONES',
  'prot.brazales': 'Brazales de kevlar', 'prot.chaleco': 'Chaleco antibalas', 'prot.placas': 'Chaleco con placas', 'prot.casco': 'Casco balístico',
  'prot.mascara': 'Máscara de gas', 'prot.escudo': 'Escudo antidisturbios', 'prot.traje': 'Traje antibombas',
  'prot.brazales.texto': 'Kevlar en los antebrazos: las mordidas hacen 20 % menos.',
  'prot.chaleco.texto': 'Tela balística sobre el torso: mordidas y golpes hacen 35 % menos.',
  'prot.placas.texto': 'Placas adelante y atrás: mordidas y golpes hacen 55 % menos, pero caminas 10 % más lento. Reemplaza al chaleco.',
  'prot.casco.texto': 'Lo que viene por el aire (bloques de hielo, escupitajos de ácido) hace 60 % menos, y las mordidas 10 % menos.',
  'prot.mascara.texto': 'Los zombies tóxicos ya no te envenenan y los charcos de ácido hacen la mitad. No se gasta.',
  'prot.escudo.texto': 'Frena todo lo que viene de frente: mordidas, hielo y ácido. Solo con armas de una mano (pistolas, revólveres, machete…); con un arma de dos manos va colgado en la espalda y no protege.',
  'prot.traje.texto': 'Cubre todo el cuerpo: tus propias explosiones hacen 80 % menos y mordidas y golpes 40 % menos. Muy pesado: caminas 25 % más lento y saltas menos. Reemplaza al chaleco, al casco y a los brazales.',
  'prot.aguante': v => `Aguante ${v.a} de ${v.b}`, 'prot.aguanteCorto': v => `aguante ${v.n}`, 'prot.sinVeneno': 'sin veneno',
  'prot.puesta': 'PUESTA', 'prot.reparar': 'REPARAR', 'prot.mejorar': v => `MEJORAR (aguante ${v.b})`,
  'prot.reemplaza': v => `Te quita: ${v.lista}`, 'prot.reemplazo': v => `sacaste: ${v.lista}`,
  'prot.rota': v => `¡SE ROMPIÓ: ${v.nombre}!`, 'prot.sacada': v => `TE SACASTE: ${v.nombre}`, 'prot.puestaAviso': v => `TE PUSISTE: ${v.nombre}`,
  'prot.dijoCompra': 'Póntelo bien ajustado. Te va a salvar la vida.', 'prot.dijoReparar': 'Como nuevo. Bueno, casi.', 'prot.dijoMejora': 'Le agregué una capa más. Ahora aguanta más.',
  'prot.zombieMuerde': '+ ZOMBIE QUE MUERDE', 'prot.zombieMuerdeNota': 'para probar las protecciones', 'prot.zombieAviso': 'VIENE UN ZOMBIE QUE MUERDE',
});
Object.assign(TEXTOS.pt, {
  'prot.titulo': 'PROTEÇÕES', 'bunker.protecciones': 'PROTEÇÕES',
  'prot.brazales': 'Braçadeiras de kevlar', 'prot.chaleco': 'Colete à prova de balas', 'prot.placas': 'Colete com placas', 'prot.casco': 'Capacete balístico',
  'prot.mascara': 'Máscara de gás', 'prot.escudo': 'Escudo antidistúrbios', 'prot.traje': 'Traje antibombas',
  'prot.brazales.texto': 'Kevlar nos antebraços: as mordidas causam 20 % menos.',
  'prot.chaleco.texto': 'Tecido balístico sobre o tronco: mordidas e golpes causam 35 % menos.',
  'prot.placas.texto': 'Placas na frente e atrás: mordidas e golpes causam 55 % menos, mas você anda 10 % mais devagar. Substitui o colete.',
  'prot.casco.texto': 'O que vem pelo ar (blocos de gelo, cusparadas de ácido) causa 60 % menos, e as mordidas 10 % menos.',
  'prot.mascara.texto': 'Os zumbis tóxicos não envenenam mais e as poças de ácido causam a metade. Não se gasta.',
  'prot.escudo.texto': 'Para tudo o que vem de frente: mordidas, gelo e ácido. Só com armas de uma mão (pistolas, revólveres, facão…); com uma arma de duas mãos fica pendurado nas costas e não protege.',
  'prot.traje.texto': 'Cobre o corpo todo: suas próprias explosões causam 80 % menos e mordidas e golpes 40 % menos. Muito pesado: você anda 25 % mais devagar e pula menos. Substitui o colete, o capacete e as braçadeiras.',
  'prot.aguante': v => `Resistência ${v.a} de ${v.b}`, 'prot.aguanteCorto': v => `resistência ${v.n}`, 'prot.sinVeneno': 'sem veneno',
  'prot.puesta': 'EM USO', 'prot.reparar': 'CONSERTAR', 'prot.mejorar': v => `MELHORAR (resistência ${v.b})`,
  'prot.reemplaza': v => `Tira: ${v.lista}`, 'prot.reemplazo': v => `tirou: ${v.lista}`,
  'prot.rota': v => `QUEBROU: ${v.nombre}!`, 'prot.sacada': v => `VOCÊ TIROU: ${v.nombre}`, 'prot.puestaAviso': v => `VOCÊ VESTIU: ${v.nombre}`,
  'prot.dijoCompra': 'Ajuste bem. Vai salvar sua vida.', 'prot.dijoReparar': 'Como novo. Bom, quase.', 'prot.dijoMejora': 'Coloquei mais uma camada. Agora aguenta mais.',
  'prot.zombieMuerde': '+ ZUMBI QUE MORDE', 'prot.zombieMuerdeNota': 'para testar as proteções', 'prot.zombieAviso': 'VEM UM ZUMBI QUE MORDE',
});
Object.assign(TEXTOS.en, {
  'prot.titulo': 'PROTECTION', 'bunker.protecciones': 'PROTECTION',
  'prot.brazales': 'Kevlar bracers', 'prot.chaleco': 'Bulletproof vest', 'prot.placas': 'Plate carrier', 'prot.casco': 'Ballistic helmet',
  'prot.mascara': 'Gas mask', 'prot.escudo': 'Riot shield', 'prot.traje': 'Bomb suit',
  'prot.brazales.texto': 'Kevlar on the forearms: bites do 20% less.',
  'prot.chaleco.texto': 'Ballistic fabric over the torso: bites and hits do 35% less.',
  'prot.placas.texto': 'Plates front and back: bites and hits do 55% less, but you walk 10% slower. Replaces the vest.',
  'prot.casco.texto': 'What comes through the air (ice blocks, acid spit) does 60% less, and bites 10% less.',
  'prot.mascara.texto': 'Toxic zombies can no longer poison you and acid puddles do half. It never wears out.',
  'prot.escudo.texto': 'Stops everything coming from the front: bites, ice and acid. Only with one-handed weapons (pistols, revolvers, machete…); with a two-handed weapon it hangs on your back and does not protect.',
  'prot.traje.texto': 'Covers the whole body: your own explosions do 80% less and bites and hits 40% less. Very heavy: you walk 25% slower and jump lower. Replaces the vest, the helmet and the bracers.',
  'prot.aguante': v => `Durability ${v.a} of ${v.b}`, 'prot.aguanteCorto': v => `durability ${v.n}`, 'prot.sinVeneno': 'no poison',
  'prot.puesta': 'WORN', 'prot.reparar': 'REPAIR', 'prot.mejorar': v => `UPGRADE (durability ${v.b})`,
  'prot.reemplaza': v => `Takes off: ${v.lista}`, 'prot.reemplazo': v => `took off: ${v.lista}`,
  'prot.rota': v => `${v.nombre} BROKE!`, 'prot.sacada': v => `TOOK OFF: ${v.nombre}`, 'prot.puestaAviso': v => `PUT ON: ${v.nombre}`,
  'prot.dijoCompra': 'Strap it on tight. It will save your life.', 'prot.dijoReparar': 'Good as new. Well, almost.', 'prot.dijoMejora': 'I added another layer. Now it holds more.',
  'prot.zombieMuerde': '+ BITING ZOMBIE', 'prot.zombieMuerdeNota': 'to test the protection', 'prot.zombieAviso': 'A BITING ZOMBIE IS COMING',
});
