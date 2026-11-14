/* ===== Zona Muerta VR: los modos de juego =====
 * Entrenamiento: blancos de chapa que suben en el campo; dispararles antes de que bajen (+1, la cabeza +2) y cada uno
 * que baja sin tiro resta 1. Ataque zombie: vienen caminando desde el fondo, rodean la mesa y muerden; hay que matarlos
 * a todos. Los dos con 10 niveles que se destraban de a uno. Libre: el campo de pruebas, con un menú para aparecer
 * zombies y blancos. Este módulo arma las páginas del menú (inicio, niveles, pausa, libre, resultado, guía y
 * configuración), lleva la cuenta de cada nivel y guarda el progreso (localStorage 'zonaMuerta.vr.progreso'). */
import * as THREE from 'three';
import { ANCHO, COLOR, ICONOS, texto, parrafo } from './menu.js';
import { TIPOS } from './zombie3d.js';

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const POSTES = [[4.2, -14], [-4.6, -32], [4.2, -60]];   // los postes del galpón: ahí no van blancos
const coma = n => String(n).replace('.', ',');

/* ---------- Niveles ---------- */
// blancos en total, cuántos arriba a la vez, segundos arriba, distancias (m), pausa entre uno y otro (s), parte móviles y chicos
export const ENTRENAMIENTO = [
  { blancos: 10, juntos: 1, arriba: 4.0, cerca: 8, lejos: 12, pausa: 1.2 },
  { blancos: 12, juntos: 1, arriba: 3.5, cerca: 8, lejos: 15, pausa: 1.0 },
  { blancos: 14, juntos: 2, arriba: 3.2, cerca: 10, lejos: 20, pausa: 1.0 },
  { blancos: 16, juntos: 2, arriba: 3.0, cerca: 10, lejos: 25, pausa: 0.9 },
  { blancos: 18, juntos: 2, arriba: 2.8, cerca: 12, lejos: 30, pausa: 0.8, moviles: 0.25 },
  { blancos: 20, juntos: 3, arriba: 2.5, cerca: 12, lejos: 35, pausa: 0.8, moviles: 0.35 },
  { blancos: 22, juntos: 3, arriba: 2.2, cerca: 15, lejos: 40, pausa: 0.7, moviles: 0.45 },
  { blancos: 25, juntos: 3, arriba: 2.0, cerca: 15, lejos: 45, pausa: 0.6, moviles: 0.5, chicos: 0.3 },
  { blancos: 28, juntos: 4, arriba: 1.7, cerca: 15, lejos: 55, pausa: 0.5, moviles: 0.6, chicos: 0.4 },
  { blancos: 30, juntos: 4, arriba: 1.4, cerca: 20, lejos: 60, pausa: 0.5, moviles: 0.7, chicos: 0.5 },
];
// zombies en total, cuántos vivos a la vez, variantes (peso de cada una), velocidad y vida (multiplican), de dónde salen
// (m), cada cuánto (s), si también salen por los costados y cuánto quita cada mordida
// Los animales (vr/animales3d.js) no están en TIPOS; las manadas salen juntas
export const ANIMALES = { perro: { nombre: 'Jauría', manada: 5 }, toro: { nombre: 'Toro' }, cuervo: { nombre: 'Bandada de cuervos', manada: 6 }, buitre: { nombre: 'Buitre' } };
const MANADA = { perro: 5, cuervo: 6, rabioso: 4 };
export const nombreTipo = id => (TIPOS[id] || ANIMALES[id] || { nombre: id }).nombre;
const BASTION = { caminante: 2, corredor: 0.8, gordo: 0.6, acorazado: 0.6, soldado: 0.6, griton: 0.4, hinchado: 0.5, dinamitero: 0.4, toxico: 0.5, topo: 0.4, lanzador: 0.4, escupidor: 0.5, rabioso: 0.3, perro: 0.3, toro: 0.3, cuervo: 0.3, buitre: 0.25 };
// zombies en total, cuántos vivos a la vez, tipos (peso de cada uno; perros, cuervos y rabiosos salen en manada), jefes
// (aparecen cuando cayó el 60 %), velocidad y vida (multiplican), de dónde salen (m), cada cuánto (s), si también salen
// por los costados y cuánto quita cada mordida (después la multiplica cada tipo)
export const ATAQUE = [
  { zombies: 4, juntos: 2, variantes: { caminante: 1 }, vel: 1.0, vida: 1.0, lejos: 26, cada: 4.0, mordida: 20 },
  { zombies: 6, juntos: 3, variantes: { caminante: 2, camisaRoja: 1, corredor: 0.6 }, vel: 1.0, vida: 1.0, lejos: 26, cada: 3.5, mordida: 20 },
  { zombies: 9, juntos: 4, variantes: { caminante: 2, enfermero: 1, gordo: 0.7, perro: 0.5 }, vel: 1.05, vida: 1.0, lejos: 25, cada: 3.2, mordida: 20 },
  { zombies: 11, juntos: 5, variantes: { caminante: 2, policia: 1, acorazado: 0.7, soldado: 0.7, cuervo: 0.5 }, vel: 1.1, vida: 1.05, lejos: 24, cada: 3.0, mordida: 20 },
  { zombies: 13, juntos: 5, variantes: { caminante: 2, corredor: 1, gordo: 0.6, griton: 0.6, hinchado: 0.6, perro: 0.4 }, jefes: ['coloso'], vel: 1.15, vida: 1.1, lejos: 24, cada: 2.8, costados: true, mordida: 20 },
  { zombies: 15, juntos: 6, variantes: { caminante: 2, acorazado: 0.8, toxico: 0.8, dinamitero: 0.6, toro: 0.4, cuervo: 0.4 }, vel: 1.2, vida: 1.2, lejos: 23, cada: 2.5, costados: true, mordida: 25 },
  { zombies: 18, juntos: 7, variantes: { caminante: 2, soldado: 1, topo: 0.8, escupidor: 0.8, rabioso: 0.5, perro: 0.4 }, vel: 1.25, vida: 1.3, lejos: 22, cada: 2.2, costados: true, mordida: 25 },
  { zombies: 21, juntos: 8, variantes: { caminante: 2, gordo: 0.8, lanzador: 0.7, griton: 0.6, buitre: 0.4, toxico: 0.6, rabioso: 0.4 }, jefes: ['sirena'], vel: 1.3, vida: 1.4, lejos: 22, cada: 2.0, costados: true, mordida: 25 },
  { zombies: 25, juntos: 9, variantes: BASTION, jefes: ['escudo'], vel: 1.4, vida: 1.5, lejos: 21, cada: 1.8, costados: true, mordida: 25 },
  { zombies: 28, juntos: 10, variantes: BASTION, jefes: ['cisterna', 'coloso'], vel: 1.5, vida: 1.6, lejos: 20, cada: 1.5, costados: true, mordida: 25 },
];
const elegir = pesos => { const e = Object.entries(pesos), t = e.reduce((s, [, p]) => s + p, 0); let r = Math.random() * t; for (const [id, p] of e) { r -= p; if (r <= 0) return id; } return e[0][0]; };

/* ---------- Textos de la guía (español de México) ---------- */
const CONTROLES = [
  'Visor: el agarre derecho toma y deja el arma (o apunta a una de la mesa y aprieta el gatillo). Gatillo: disparar. A: soltar el cargador. B: montar. Con el agarre izquierdo en el arma la sostienes con las dos manos o cargas; lejos del arma sacas munición nueva. Palanca izquierda: caminar; derecha: girar. Y: este menú.',
  'Sin visor: el mouse apunta, clic dispara, clic derecho mira por las miras. E toma el arma que miras, del 1 al 0 las tomas directo, Q la deja, R recarga, B monta, W A S D caminas. M: este menú.',
];
const GUIAS = {
  entrenamiento: ['Se levantan blancos de chapa en el campo. Dispárales antes de que bajen: cada blanco vale 1 punto y la cabeza roja vale 2. Si uno baja sin que le pegues, pierdes 1 punto.',
    'Superas el nivel si le das al 60 % de los blancos. Con el 80 % ganas dos estrellas y con todos, tres. En los niveles altos hay blancos que se mueven de costado y blancos más chicos.'],
  zombies: ['Los zombies vienen caminando desde el fondo del campo y rodean la mesa para alcanzarte. Mátalos a todos para superar el nivel. Un tiro en la cabeza los mata siempre; el policía aguanta más tiros en el cuerpo y el maratonista corre.',
    'Cada mordida te quita vida: si llega a cero, pierdes el nivel. Dos estrellas si terminas con la mitad de la vida o más; tres, si no te muerden.'],
  libre: ['El campo de pruebas: prueba las armas contra el papel, el zombie de cartón y los zombies. Desde el menú apareces zombies de cada tipo y blancos que suben; con «Quietos» no caminan, para practicar la puntería.'],
};

// Lo que hace cada tipo (la guía): los de siempre, los de Último bastión, los animales y los jefes
const BESTIARIO = [
  [['Caminantes', 'caminan, rodean la mesa y muerden. El policía aguanta más tiros.'], ['Corredor', 'corre y rodea la mesa buscando el hueco.'],
    ['Gordo', 'tres veces la vida de uno común; no rodea: se trepa a la mesa y tira las armas. Muerde más fuerte.'],
    ['Acorazado', 'casco y escudo: las balas chicas no pasan el escudo y al cuerpo le hacen un tercio. El rifle, el fuego y las explosiones sí.'],
    ['Soldado zombie', 'chaleco: las balas chicas le hacen la mitad.'], ['Gritón', 'se planta a gritar con el megáfono y los de alrededor se apuran.'],
    ['Hinchado', 'estalla al tocarte o al morir, y también mata zombies: reviéntalo lejos.'],
    ['Dinamitero', 'corre a la mesa y la vuela (las armas salen volando). A balazos cae sin estallar.'], ['Tóxico', 'al morir deja una nube de gas que quema cinco segundos.']],
  [['Topo', 'avanza bajo tierra, donde no le puedes tirar, y sale detrás de ti.'], ['Lanzador', 'agarra al zombie de al lado y te lo arroja; si no tiene, te tira cascotes.'],
    ['Escupidor', 'se planta lejos y escupe ácido que deja un charco.'], ['Rabioso', 'corre en zigzag, en manada, y esquiva los tiros pesados.'],
    ['Jauría', 'cinco perros muy rápidos que saltan la mesa. No cruzan el fuego.'], ['Toro', 'escarba y embiste derecho: te aturde. Después queda quieto: es el momento.'],
    ['Cuervos', 'una bandada que rodea tu cabeza y picotea.'], ['Buitre', 'baja en picada, te levanta y te suelta en medio de la horda.'],
    ['Jefes', 'El Coloso trepa la mesa y tira fardos; El Escudo cubre a los de atrás y las balas chicas le hacen 1; La Cisterna estalla grande; mientras vive La Sirena, todos se apuran.']],
];

/* ---------- Progreso ---------- */
const CLAVE = 'zonaMuerta.vr.progreso';
function leer() { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } }
function guardar(p) { try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch (e) { /* sin almacenamiento: el progreso dura la sesión */ } }

export class Modos {
  /* ctx (de vr/campo.js): menu, horda, blancos, reloj(), abrirMenu(pagina), cerrarMenu(), escenaLibre(si), reubicar(),
   * aviso(texto, sub, color), flotante(pos, texto, color), config, cambiarConfig(clave, valor), actualizarHud() */
  constructor(ctx) {
    this.ctx = ctx; this.progreso = leer();
    this.modo = null; this.nivel = 0; this.fase = 'inicio'; this.d = {}; this.def = null; this.resultado = null;
    this.opLibre = { quietos: false, reaparecen: true }; this.reaparicion = [];
  }
  get jugando() { return this.fase === 'cuenta' || this.fase === 'juego'; }
  get nombre() { return { entrenamiento: 'Entrenamiento', zombies: 'Ataque zombie', libre: 'Libre' }[this.modo] || ''; }
  mostrar(p) { this.ctx.menu.mostrar(p); }

  /* --- Abrir y cerrar el menú (Y en el visor, M sin visor) --- */
  paginaActual() { return this.fase === 'fin' ? this.paginaResultado() : !this.jugando ? this.paginaInicio() : this.modo === 'libre' ? this.paginaLibre() : this.paginaPausa(); }
  abrir() { this.ctx.abrirMenu(this.paginaActual()); }
  alternar() { if (this.ctx.menu.abierto) this.cerrar(); else this.abrir(); }
  cerrar() {
    if (this.fase === 'fin') return;               // el resultado se cierra con sus botones
    if (this.fase === 'inicio') return this.empezarLibre();
    this.ctx.cerrarMenu();
  }
  salir() {   // vuelve al inicio sin modo: el campo libre de fondo
    this.modo = null; this.fase = 'inicio'; this.ctx.horda.quitarTodos(); this.ctx.blancos.quitarTodos(); this.ctx.escenaLibre(true); this.reaparicion = [];
    this.mostrar(this.paginaInicio()); this.ctx.actualizarHud();
  }

  /* --- Empezar un nivel o el modo libre --- */
  async empezar(modo, n) {
    const c = this.ctx;
    if (modo === 'zombies' && c.asegurar) {   // los cuerpos que el nivel necesita (se arman una vez)
      const L = ATAQUE[n - 1], ids = [...Object.keys(L.variantes), ...(L.jefes || []), 'caminante', 'soldado'];
      if (!ids.every(id => this.listo(id))) { c.aviso('Preparando…', 'los zombies de este nivel', COLOR.arena); await c.asegurar(ids); }
    }
    this.modo = modo; this.nivel = n; this.resultado = null; this.reaparicion = [];
    c.horda.quitarTodos(); c.blancos.quitarTodos(); c.escenaLibre(false); c.reubicar();
    if (modo === 'entrenamiento') {
      const L = this.def = ENTRENAMIENTO[n - 1];
      this.d = { puntos: 0, aciertos: 0, cabezas: 0, fallados: 0, porSubir: L.blancos, proximo: 0, ultimo: null, finEn: 0 };
      for (const p of this.puestos(L)) c.blancos.colocar(p.x, p.z, { movil: p.movil, chico: p.chico, velocidad: 0.7 + n * 0.07 });
    } else {
      const L = this.def = ATAQUE[n - 1];
      this.d = { vida: 100, muertos: 0, cabezas: 0, mordidas: 0, porAparecer: L.zombies, jefes: (L.jefes || []).slice(), jefesEn: Math.ceil(L.zombies * 0.6), proximo: 0, proximoLatido: 0, inicio: 0, finEn: 0, total: L.zombies };
      c.horda.tiempoCuerpo = 8000;
    }
    this.fase = 'cuenta'; this.cuentaDesde = c.reloj(); this.ultimaCuenta = -1;
    c.cerrarMenu(); c.actualizarHud();
  }
  empezarLibre() {
    const c = this.ctx;
    this.modo = 'libre'; this.nivel = 0; this.def = null; this.resultado = null; this.reaparicion = []; this.d = { mordidas: 0 };
    c.horda.quitarTodos(); c.blancos.quitarTodos(); c.escenaLibre(true); c.horda.tiempoCuerpo = 6000;
    c.horda.aparecer(v3(0, 0, -22), 'caminante', { quieto: this.opLibre.quietos, ahora: c.reloj(), emerger: true });
    this.fase = 'juego'; c.cerrarMenu(); c.actualizarHud();
  }
  // Los puestos de un nivel de entrenamiento: repartidos en la franja de distancias, sin taparse entre sí ni con los postes
  puestos(L) {
    const n = Math.min(12, L.juntos * 3 + 4), out = [];
    for (let intento = 0; out.length < n && intento < 800; intento++) {
      const d = L.cerca + Math.random() * (L.lejos - L.cerca), movil = Math.random() < (L.moviles || 0) ? 1.4 : 0, chico = Math.random() < (L.chicos || 0);
      const x = (Math.random() * 2 - 1) * (d < 15 ? 6 : 8.4);
      if (Math.abs(x) + movil > 9.6) continue;
      if (POSTES.some(([px, pz]) => Math.abs(px - x) < 1.2 + movil && Math.abs(pz + d) < 1.5)) continue;
      if (out.some(p => (Math.abs(p.x - x) < 1.4 + movil + p.movil && Math.abs(p.z + d) < 3) || Math.abs(Math.atan2(p.x, -p.z) - Math.atan2(x, d)) < 0.045 + (movil + p.movil) / d)) continue;
      out.push({ x, z: -d, movil, chico });
    }
    return out;
  }
  listo(id) { return !TIPOS[id] || (this.ctx.tipoListo ? this.ctx.tipoListo(id) : true); }
  // Aparece uno (o la manada entera) y devuelve cuántos salieron
  aparecerTipo(id, pos, op) {
    const h = this.ctx.horda, n = MANADA[id] || 1; let k = 0;
    for (let i = 0; i < n; i++) { const q = pos.clone().add(v3((Math.random() - 0.5) * 2.5, 0, (Math.random() - 0.5) * 2.5)); if (h.aparecer(q, id, op)) k++; }
    return k;
  }
  lugarZombie(L) {
    if (L.costados && Math.random() < 0.3) { const s = Math.random() < 0.5 ? -1 : 1; return v3(s * 11.2, 0, -6 - Math.random() * 8); }
    return v3((Math.random() * 2 - 1) * 9.5, 0, -(L.lejos + Math.random() * 6));
  }

  /* --- Cada cuadro (sólo cuando no está en pausa); reloj en ms del juego --- */
  actualizar(reloj, dt) {
    const c = this.ctx, d = this.d;
    if (this.fase === 'cuenta') {
      const t = (reloj - this.cuentaDesde) / 1000, k = Math.floor(t);
      if (k !== this.ultimaCuenta && k <= 3) { this.ultimaCuenta = k; c.aviso(k < 3 ? String(3 - k) : '¡YA!', k < 3 ? `${this.nombre} · nivel ${this.nivel}` : '', k < 3 ? COLOR.arena : COLOR.verde); }
      if (t >= 3) { this.fase = 'juego'; d.inicio = reloj; d.proximo = reloj + 400; }
      return;
    }
    if (this.fase !== 'juego') return;
    if (this.modo === 'libre') {
      for (let i = this.reaparicion.length - 1; i >= 0; i--) if (reloj >= this.reaparicion[i][0]) { const [, v] = this.reaparicion.splice(i, 1)[0]; c.horda.aparecer(this.lugarLibre(), v, { quieto: this.opLibre.quietos, ahora: reloj, emerger: true }); }
      return;
    }
    if (d.finEn && reloj >= d.finEn) return this.terminar(true);
    if (this.modo === 'entrenamiento') {
      const L = this.def, b = c.blancos;
      if (d.porSubir > 0 && b.arriba < L.juntos && reloj >= d.proximo) {
        const libres = b.disponibles(), otros = libres.filter(q => q.x !== d.ultimo), q = (otros.length ? otros : libres)[Math.floor(Math.random() * (otros.length || libres.length))];
        if (q) { b.subir(q, { arriba: L.arriba }); d.porSubir--; d.ultimo = q.x; d.proximo = reloj + L.pausa * 1000 * (0.6 + Math.random() * 0.8); c.actualizarHud(); }
      }
      if (d.porSubir === 0 && !d.finEn && b.activos.every(q => q.estado === 'abajo')) d.finEn = reloj + 700;
    } else {
      const L = this.def, h = c.horda, vivos = h.vivos;
      if (d.porAparecer > 0 && vivos.filter(z => !(z.T && z.T.jefe)).length < L.juntos && reloj >= d.proximo) {
        let id = elegir(L.variantes); if (MANADA[id] && MANADA[id] > d.porAparecer) id = 'caminante';
        const op = { vida: L.vida, velocidad: L.vel, ahora: reloj, emerger: true }, k = this.aparecerTipo(id, this.lugarZombie(L), op) || this.aparecerTipo('caminante', this.lugarZombie(L), op);
        d.porAparecer = Math.max(0, d.porAparecer - k); d.proximo = reloj + L.cada * 1000 * (0.6 + Math.random() * 0.8) * (k > 1 ? 1.6 : 1);
        if (Math.random() < 0.35) Audio_.gemidoLejano();
      }
      if (d.jefes.length && d.muertos >= d.jefesEn) {   // los jefes: con aviso, desde el fondo; el Escudo trae a los que cubre
        for (const id of d.jefes) {
          const p = v3((Math.random() - 0.5) * 6, 0, -(L.lejos + 4)), jefe = h.aparecer(p, id, { vida: 1, velocidad: 1, ahora: reloj, emerger: true });
          if (!jefe) continue;
          d.total++;
          if (TIPOS[id].cubre) for (let f = 0; f < 4; f++) { const s = h.aparecer(p.clone().add(v3((Math.random() - 0.5) * 0.6, 0, -1.2 - f * 0.8)), f % 2 ? 'soldado' : 'caminante', { vida: L.vida, velocidad: 1, ahora: reloj, emerger: true, sigue: jefe, fila: f }); if (s) d.total++; }
          c.aviso(TIPOS[id].nombre.toUpperCase(), 'jefe', '#ff6a5a'); Audio_.rondaSuperada();
        }
        d.jefes = []; c.actualizarHud();
      }
      if (d.porAparecer === 0 && !d.jefes.length && !h.vivos.length && !d.finEn) d.finEn = reloj + 1800;   // que se vea caer al último
      if (d.vida <= 30 && reloj >= d.proximoLatido) { Audio_.latido(d.vida <= 15 ? 1 : 0.7); d.proximoLatido = reloj + (d.vida <= 15 ? 700 : 1000); }
    }
  }

  /* --- Lo que pasa en el campo (lo avisa vr/campo.js) --- */
  blancoGolpeado(b, cabeza) {
    const c = this.ctx;
    if (this.modo !== 'entrenamiento' || this.fase !== 'juego') { if (this.modo === 'libre') c.flotante(c.blancos.centro(b), cabeza ? '¡CABEZA!' : '¡BIEN!', COLOR.verde); return; }
    const d = this.d; d.aciertos++; if (cabeza) d.cabezas++; d.puntos += cabeza ? 2 : 1;
    d.proximo = Math.max(d.proximo, c.reloj() + this.def.pausa * 600);
    c.flotante(c.blancos.centro(b), cabeza ? '+2' : '+1', COLOR.verde); c.actualizarHud();
  }
  blancoEscapo(b) {
    if (this.modo !== 'entrenamiento' || this.fase !== 'juego') return;
    const c = this.ctx, d = this.d; d.fallados++; d.puntos -= 1;
    d.proximo = Math.max(d.proximo, c.reloj() + this.def.pausa * 600);
    c.flotante(c.blancos.centro(b), '−1', '#ff5a4a'); c.actualizarHud();
  }
  zombieMuerto(z, cabezazo) {
    const c = this.ctx;
    if (this.modo === 'libre') { if (this.opLibre.reaparecen && !(z.T && z.T.jefe)) this.reaparicion.push([c.reloj() + 6500, z.tipo || z.especie]); c.actualizarHud(); return; }
    if (this.modo !== 'zombies' || this.fase !== 'juego') return;
    const d = this.d; d.muertos++; if (cabezazo) d.cabezas++;
    c.actualizarHud();
  }
  // Una mordida: en el ataque quita vida (y puede terminar el nivel). Devuelve si hay que mostrar el golpe
  mordida(z) {
    const d = this.d;
    if (this.modo === 'libre') { d.mordidas = (d.mordidas || 0) + 1; this.ctx.actualizarHud(); return true; }
    if (this.modo !== 'zombies' || this.fase !== 'juego') return false;
    d.mordidas++; return this.danar(this.def.mordida * ((z && z.T && z.T.mordida) || 1), 'mordida');
  }
  // Cualquier daño al jugador (mordidas, explosiones, gas, ácido, cascotes, embestidas). Devuelve si hay que mostrarlo
  danar(n, motivo) {
    const d = this.d;
    if (this.modo === 'libre') return true;
    if (this.modo !== 'zombies' || this.fase !== 'juego') return false;
    d.vida = Math.max(0, d.vida - n); this.ctx.actualizarHud();
    if (d.vida <= 0) { Audio_.jugadorMuere(); this.terminar(false); }
    return true;
  }

  terminar(gano) {
    const c = this.ctx, d = this.d, n = this.nivel, reloj = c.reloj();
    this.fase = 'fin';
    let superado, estrellas, valor;
    if (this.modo === 'entrenamiento') { const pct = d.aciertos / this.def.blancos; superado = pct >= 0.6; estrellas = pct >= 1 ? 3 : pct >= 0.8 ? 2 : superado ? 1 : 0; valor = d.puntos; d.pct = pct; }
    else { d.vida = Math.round(d.vida); superado = gano; estrellas = !gano ? 0 : d.vida >= 100 ? 3 : d.vida >= 50 ? 2 : 1; valor = gano ? d.vida : null; d.tiempo = reloj - d.inicio; }
    const reg = this.progreso[this.modo] || (this.progreso[this.modo] = {}), antes = reg[n];
    const record = valor !== null && (!antes || antes.mejor === null || antes.mejor === undefined || valor > antes.mejor);
    reg[n] = { superado: superado || !!(antes && antes.superado), estrellas: Math.max(estrellas, antes ? antes.estrellas : 0), mejor: record ? valor : antes ? antes.mejor : null };
    guardar(this.progreso);
    this.resultado = { superado, estrellas, valor, record: record && !!antes, gano };
    if (superado) Audio_.rondaSuperada();
    c.abrirMenu(this.paginaResultado()); c.actualizarHud();
  }

  /* --- Modo libre: aparecer cosas --- */
  lugarLibre() {
    const h = this.ctx.horda;
    for (let k = 0; k < 30; k++) { const p = v3((Math.random() * 2 - 1) * 6, 0, -14 - Math.random() * 10); if (h.activos.every(z => z.grupo.position.distanceTo(p) > 1.4)) return p; }
    return v3((Math.random() * 2 - 1) * 6, 0, -20);
  }
  async aparecerLibre(id) {
    const c = this.ctx;
    if (!this.listo(id) && c.asegurar) { c.aviso('Preparando…', nombreTipo(id), COLOR.arena); await c.asegurar([id]); }
    const jefe = TIPOS[id] && TIPOS[id].jefe, p = jefe ? v3((Math.random() - 0.5) * 4, 0, -20) : this.lugarLibre();
    const k = this.aparecerTipo(id, p, { quieto: this.opLibre.quietos, ahora: c.reloj(), emerger: true });
    if (jefe && k) { const z = c.horda.vivos.find(q => q.tipo === id); if (TIPOS[id].cubre && z) for (let f = 0; f < 3; f++) c.horda.aparecer(p.clone().add(v3(0, 0, -1.2 - f * 0.8)), 'caminante', { quieto: this.opLibre.quietos, ahora: c.reloj(), emerger: true, sigue: z, fila: f }); }
    if (!k) c.aviso('No se puede', 'hay demasiados en el campo', '#ff6a5a');
    if (c.menu.abierto) this.mostrar(this.paginaLibre());
  }
  blancoLibre(distancia, movil) {
    const b = this.ctx.blancos;
    let x = 0;
    for (let k = 0; k < 30; k++) { x = (Math.random() * 2 - 1) * (movil ? 4 : 5.5); if (b.activos.every(q => Math.abs(q.grupo.position.z + distancia) > 2.5 || Math.abs(q.x - x) > 1.6 + (movil ? 1.5 : 0) + q.movil)) break; }
    b.levantar(x, -distancia, { arriba: Infinity, repetir: true, movil: movil ? 1.5 : 0, velocidad: 0.9 });
  }

  /* ---------- Páginas del menú ---------- */
  paginaInicio() {
    const botones = [
      { x: 55, y: 168, w: 370, h: 350, estilo: 'modo', texto: 'ENTRENAMIENTO', icono: ICONOS.entrenamiento, lineas: ['Blancos que suben', '10 niveles'], accion: () => this.mostrar(this.paginaNiveles('entrenamiento')) },
      { x: 455, y: 168, w: 370, h: 350, estilo: 'modo', texto: 'ATAQUE ZOMBIE', icono: ICONOS.zombies, lineas: ['Vienen caminando', '10 niveles'], accion: () => this.mostrar(this.paginaNiveles('zombies')) },
      { x: 855, y: 168, w: 370, h: 350, estilo: 'modo', texto: 'LIBRE', icono: ICONOS.libre, lineas: ['Prueba las armas,', 'aparece zombies y blancos'], accion: () => this.empezarLibre() },
      { x: 460, y: 560, w: 360, h: 74, texto: 'CONFIGURACIÓN', accion: () => this.mostrar(this.paginaConfig(() => this.paginaInicio())) },
    ];
    return { titulo: 'ZONA MUERTA VR', sub: 'Elige un modo', botones,
      dibujar: g => texto(g, 'Este menú se abre y se cierra con Y en el mando izquierdo (M sin visor)', ANCHO / 2, 740, { tam: 23, peso: 400, color: 'rgba(241,230,208,0.7)', alinear: 'center', ancho: ANCHO - 120 }) };
  }
  detalleNivel(modo, L, i) {
    if (modo === 'entrenamiento') {
      const extra = [L.moviles ? 'se mueven' : '', L.chicos ? 'chicos' : ''].filter(Boolean).join(' y ');
      return [`${L.blancos} blancos · ${L.juntos} a la vez`, `${L.cerca} a ${L.lejos} m · ${coma(L.arriba)} s`, extra || ' '];
    }
    const antes = new Set(ATAQUE.slice(0, i).flatMap(A => Object.keys(A.variantes))), nuevos = Object.keys(L.variantes).filter(v => !antes.has(v)).map(v => nombreTipo(v).toLowerCase());
    return [`${L.zombies} zombies · ${L.juntos} a la vez`, nuevos.length ? 'Nuevo: ' + nuevos.slice(0, 3).join(', ') : L.vel > 1 ? `más rápidos (×${coma(L.vel)})` : ' ', L.jefes ? 'Jefe: ' + L.jefes.map(j => TIPOS[j].nombre).join(' y ') : L.costados ? 'también por los costados' : ' '];
  }
  paginaNiveles(modo, volver = () => (this.jugando ? this.paginaPausa() : this.paginaInicio())) {
    const tabla = modo === 'entrenamiento' ? ENTRENAMIENTO : ATAQUE, reg = this.progreso[modo] || {};
    const botones = tabla.map((L, i) => {
      const n = i + 1, abierto = n === 1 || !!(reg[n - 1] && reg[n - 1].superado), r = reg[n];
      const mejor = !r ? '' : modo === 'entrenamiento' ? `Récord: ${r.mejor} pts` : r.superado ? `Récord: vida ${r.mejor}` : 'Sin superar';
      return { x: 54 + (i % 5) * 238, y: 148 + Math.floor(i / 5) * 276, w: 220, h: 262, estilo: 'tarjeta', texto: 'NIVEL ' + n, candado: !abierto, activo: abierto,
        sub: 'Supera el nivel ' + (n - 1), lineas: this.detalleNivel(modo, L, i), estrellas: r ? r.estrellas : 0, mejor, accion: () => this.empezar(modo, n) };
    });
    botones.push({ x: 330, y: 716, w: 290, h: 70, texto: 'VOLVER', accion: () => this.mostrar(volver()) },
      { x: 660, y: 716, w: 290, h: 70, texto: 'GUÍA', accion: () => this.mostrar(this.paginaGuia(modo, () => this.paginaNiveles(modo, volver))) });
    return { titulo: modo === 'entrenamiento' ? 'ENTRENAMIENTO' : 'ATAQUE ZOMBIE', sub: 'Elige un nivel', botones };
  }
  paginaPausa() {
    const b = [], fila = (y, t, accion, estilo) => b.push({ x: 380, y, w: 520, h: 74, texto: t, estilo, accion });
    fila(158, 'SEGUIR', () => this.ctx.cerrarMenu(), 'grande');
    fila(248, 'REPETIR NIVEL', () => this.empezar(this.modo, this.nivel));
    fila(338, 'ELEGIR NIVEL', () => this.mostrar(this.paginaNiveles(this.modo, () => this.paginaPausa())));
    fila(428, 'GUÍA', () => this.mostrar(this.paginaGuia(this.modo, () => this.paginaPausa())));
    fila(518, 'CONFIGURACIÓN', () => this.mostrar(this.paginaConfig(() => this.paginaPausa())));
    fila(608, 'SALIR DEL MODO', () => this.salir());
    return { titulo: 'PAUSA', sub: `${this.nombre} · nivel ${this.nivel}`, botones: b };
  }
  paginaLibre() {
    const c = this.ctx, b = [], otra = () => this.mostrar(this.paginaLibre()), P = this.pestana || 'comunes';
    const pestanas = [['comunes', 'COMUNES'], ['bastion', 'ÚLTIMO BASTIÓN'], ['animales', 'ANIMALES'], ['jefes', 'JEFES'], ['blancos', 'BLANCOS']];
    pestanas.forEach(([id, texto], i) => b.push({ x: 51 + i * 238, y: 146, w: 226, h: 62, texto, estilo: 'chico', marcado: P === id, accion: () => { this.pestana = id; otra(); } }));
    const grilla = items => items.forEach((it, i) => b.push({ x: 51 + (i % 4) * 297, y: 222 + Math.floor(i / 4) * 82, w: 285, h: 72, estilo: 'chico', ...it }));
    const tipo = id => ({ texto: nombreTipo(id).toUpperCase(), sub: MANADA[id] ? `aparece la manada (${MANADA[id]})` : TIPOS[id] && TIPOS[id].jefe ? 'jefe' : 'aparecer uno', accion: () => this.aparecerLibre(id) });
    if (P === 'comunes') grilla([...Object.keys(TIPOS).filter(id => TIPOS[id].grupo === 'comunes').map(tipo), { texto: 'HORDA DE 6', sub: 'de todos los tipos', accion: async () => { const ids = Object.keys(TIPOS).filter(id => TIPOS[id].grupo !== 'jefes'); for (let k = 0; k < 6; k++) await this.aparecerLibre(ids[Math.floor(Math.random() * ids.length)]); } }]);
    if (P === 'bastion') grilla(Object.keys(TIPOS).filter(id => TIPOS[id].grupo === 'bastion').map(tipo));
    if (P === 'animales') grilla(Object.keys(ANIMALES).map(tipo));
    if (P === 'jefes') grilla(Object.keys(TIPOS).filter(id => TIPOS[id].jefe).map(tipo));
    if (P === 'blancos') grilla([...[10, 25, 50].map(m => ({ texto: `BLANCO A ${m} m`, sub: 'sube y se queda', accion: () => { this.blancoLibre(m); otra(); } })), { texto: 'BLANCO MÓVIL', sub: 'a 20 m', accion: () => { this.blancoLibre(20, true); otra(); } }]);
    const q = this.opLibre.quietos, r = this.opLibre.reaparecen, op = (it, i) => b.push({ x: 51 + i * 238, y: 488, w: 226, h: 70, estilo: 'chico', ...it });
    [{ texto: 'QUIETOS: ' + (q ? 'SÍ' : 'NO'), sub: 'no caminan', marcado: q, accion: () => { this.opLibre.quietos = !q; for (const z of c.horda.activos) z.quieto = !q; otra(); } },
      { texto: 'REAPARECEN: ' + (r ? 'SÍ' : 'NO'), sub: 'al morir', marcado: r, accion: () => { this.opLibre.reaparecen = !r; if (r) this.reaparicion = []; otra(); } },
      { texto: 'QUITAR ZOMBIES', accion: () => { c.horda.quitarTodos(); this.reaparicion = []; otra(); } },
      { texto: 'QUITAR BLANCOS', accion: () => { c.blancos.quitarTodos(); otra(); } },
      { texto: 'A LA MESA', sub: 'volver a tu lugar', accion: () => { c.reubicar(); otra(); } }].forEach(op);
    b.push({ x: 340, y: 590, w: 600, h: 74, texto: 'SEGUIR', estilo: 'grande', accion: () => c.cerrarMenu() },
      { x: 51, y: 690, w: 370, h: 66, texto: 'GUÍA', accion: () => this.mostrar(this.paginaGuia('libre', () => this.paginaLibre())) },
      { x: 455, y: 690, w: 370, h: 66, texto: 'CONFIGURACIÓN', accion: () => this.mostrar(this.paginaConfig(() => this.paginaLibre())) },
      { x: 859, y: 690, w: 370, h: 66, texto: 'SALIR DEL MODO', accion: () => this.salir() });
    const vivos = c.horda.vivos.length, blancos = c.blancos.activos.length;
    return { titulo: 'MODO LIBRE', sub: `En el campo: ${vivos} ${vivos === 1 ? 'enemigo' : 'enemigos'} · ${blancos} ${blancos === 1 ? 'blanco' : 'blancos'}`, botones: b };
  }
  paginaResultado() {
    const R = this.resultado || { superado: false, estrellas: 0 }, d = this.d, n = this.nivel, ultimo = n >= 10;
    const titulo = R.superado ? '¡NIVEL SUPERADO!' : this.modo === 'zombies' ? 'TE ALCANZARON' : 'NO LO LOGRASTE';
    const lineas = [];
    if (this.modo === 'entrenamiento') {
      lineas.push(`Puntos: ${d.puntos}`, `Acertaste ${d.aciertos} de ${this.def.blancos} blancos (${Math.round(d.pct * 100)} %)`, `A la cabeza: ${d.cabezas} · se escaparon: ${d.fallados}`);
      if (!R.superado) lineas.push('Necesitas acertarle al 60 % de los blancos.');
    } else {
      const seg = Math.round((d.tiempo || 0) / 1000);
      lineas.push(`Zombies abatidos: ${d.muertos} de ${d.total}`, `A la cabeza: ${d.cabezas} · mordidas: ${d.mordidas}`, R.superado ? `Vida: ${d.vida} · tiempo: ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}` : 'Te quedaste sin vida.');
    }
    if (R.record) lineas.push('¡Nuevo récord!');
    const b = [];
    if (R.superado && !ultimo) b.push({ x: 380, y: 520, w: 520, h: 80, texto: 'SIGUIENTE NIVEL', estilo: 'grande', accion: () => this.empezar(this.modo, n + 1) });
    b.push({ x: 51, y: 680, w: 370, h: 72, texto: 'REPETIR', accion: () => this.empezar(this.modo, n) },
      { x: 455, y: 680, w: 370, h: 72, texto: 'ELEGIR NIVEL', accion: () => this.mostrar(this.paginaNiveles(this.modo, () => this.paginaResultado())) },
      { x: 859, y: 680, w: 370, h: 72, texto: 'SALIR DEL MODO', accion: () => this.salir() });
    return { titulo, colorTitulo: R.superado ? COLOR.verde : '#ff6a5a', sub: `${this.nombre} · nivel ${n}`, botones: b,
      dibujar: g => {
        for (let k = 0; k < 3; k++) { const cx = ANCHO / 2 + (k - 1) * 90, cy = 205; g.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? 15 : 34; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fillStyle = k < R.estrellas ? '#f2c94c' : 'rgba(241,230,208,0.14)'; g.fill(); }
        let y = 300; for (const l of lineas) { texto(g, l, ANCHO / 2, y, { tam: 30, peso: l.startsWith('¡') ? 700 : 400, color: l.startsWith('¡') ? '#f2c94c' : COLOR.texto, alinear: 'center', ancho: ANCHO - 120 }); y += 48; }
      } };
  }
  paginaTipos(n, volver) {
    const b = [{ x: 330, y: 728, w: 290, h: 70, texto: 'VOLVER', accion: () => this.mostrar(volver()) }];
    b.push({ x: 660, y: 728, w: 290, h: 70, texto: n ? 'ANTERIOR' : 'SIGUIENTE', accion: () => this.mostrar(this.paginaTipos(1 - n, volver)) });
    return { titulo: 'TIPOS DE ZOMBIE', sub: n ? 'acechadores, animales y jefes' : 'caminantes y especiales', botones: b,
      dibujar: g => { let y = 182; for (const [nombre, que] of BESTIARIO[n]) { texto(g, nombre, 70, y, { tam: 24, color: COLOR.arena }); y = parrafo(g, que, 290, y, ANCHO - 360, { tam: 22 }) + 8; } } };
  }
  paginaGuia(modo, volver) {
    const otra = () => this.paginaGuia(modo, volver);
    return { titulo: 'GUÍA', sub: { entrenamiento: 'Entrenamiento', zombies: 'Ataque zombie', libre: 'Modo libre' }[modo], botones: [{ x: 330, y: 728, w: 290, h: 70, texto: 'VOLVER', accion: () => this.mostrar(volver()) },
      ...(modo === 'entrenamiento' ? [] : [{ x: 660, y: 728, w: 290, h: 70, texto: 'TIPOS DE ZOMBIE', accion: () => this.mostrar(this.paginaTipos(0, otra)) }])],
      dibujar: g => {
        let y = 190; for (const p of GUIAS[modo]) y = parrafo(g, p, 70, y, ANCHO - 140, { tam: 25 }) + 10;
        y += 8; texto(g, 'CONTROLES', 70, y, { tam: 24, color: COLOR.arena }); y += 38;
        for (const p of CONTROLES) y = parrafo(g, p, 70, y, ANCHO - 140, { tam: 21, color: 'rgba(241,230,208,0.85)' }) + 6;
      } };
  }
  paginaConfig(volver) {
    const C = this.ctx.config, otra = () => this.mostrar(this.paginaConfig(volver)), cambiar = (k, v) => { this.ctx.cambiarConfig(k, v); otra(); };
    const filas = [
      ['Volumen general', 'barra', 'general', 0, 1, 0.1], ['Efectos', 'barra', 'efectos', 0, 1, 0.1],
      ['Sonido', 'opciones', 'silencio', [[false, 'ACTIVADO'], [true, 'SILENCIO']]], ['Vibración de los mandos', 'opciones', 'vibracion', [[true, 'SÍ'], [false, 'NO']]],
      ['Giro con la palanca', 'opciones', 'giro', [['30', '30°'], ['45', '45°'], ['suave', 'SUAVE']]], ['Velocidad al caminar', 'opciones', 'caminar', [['lenta', 'LENTA'], ['normal', 'NORMAL'], ['rapida', 'RÁPIDA']]],
      ['Altura', 'opciones', 'altura', [['pie', 'DE PIE'], ['sentado', 'SENTADO']]], ['Mouse (sin visor)', 'barra', 'mouse', 0.4, 2, 0.2],
    ];
    const b = [], barras = [];
    filas.forEach(([, tipo, clave, a, z, paso], i) => {
      const y = 148 + i * 70;
      if (tipo === 'barra') {
        const v = C[clave], red = x => Math.round(x * 100) / 100;
        b.push({ x: 560, y, w: 70, h: 56, texto: '−', estilo: 'grande', activo: v > a + 1e-6, accion: () => cambiar(clave, red(Math.max(a, v - paso))) },
          { x: 1080, y, w: 70, h: 56, texto: '+', estilo: 'grande', activo: v < z - 1e-6, accion: () => cambiar(clave, red(Math.min(z, v + paso))) });
        barras.push([y, (v - a) / (z - a), clave === 'mouse' ? `×${coma(v.toFixed(1))}` : `${Math.round(v * 100)} %`]);
      } else {
        const w = (590 - (a.length - 1) * 12) / a.length;
        a.forEach(([valor, t], k) => b.push({ x: 560 + k * (w + 12), y, w, h: 56, texto: t, estilo: 'chico', marcado: C[clave] === valor, accion: () => cambiar(clave, valor) }));
      }
    });
    b.push({ x: 490, y: 728, w: 300, h: 70, texto: 'VOLVER', accion: () => this.mostrar(volver()) });
    return { titulo: 'CONFIGURACIÓN', sub: 'Se guarda en este navegador', botones: b,
      dibujar: g => {
        filas.forEach(([nombre], i) => texto(g, nombre, 70, 148 + i * 70 + 38, { tam: 26, peso: 400, ancho: 470 }));
        for (const [y, f, t] of barras) {
          g.fillStyle = 'rgba(241,230,208,0.12)'; g.fillRect(648, y + 18, 414, 20);
          g.fillStyle = COLOR.arena; g.fillRect(648, y + 18, 414 * f, 20);
          texto(g, t, 855, y + 34, { tam: 18, color: f > 0.5 ? COLOR.noche : COLOR.texto, alinear: 'center' });
        }
      } };
  }

  /* --- Lo que muestra el tablero de la mesa y el reloj de la muñeca --- */
  hud() {
    const d = this.d;
    if (this.modo === 'entrenamiento') {
      const L = this.def;
      return { titulo: `ENTRENAMIENTO · NIVEL ${this.nivel}`, lineas: [`Puntos: ${d.puntos}`, `Blancos: ${d.aciertos + d.fallados} de ${L.blancos} · acertados: ${d.aciertos}`, `A la cabeza: ${d.cabezas} · se escaparon: ${d.fallados}`],
        corta: [`Nivel ${this.nivel}`, `${d.puntos} pts`, `${d.aciertos + d.fallados}/${L.blancos}`] };
    }
    if (this.modo === 'zombies') {
      const L = this.def;
      const vida = Math.ceil(d.vida), jefe = (L.jefes || []).length ? (d.jefes.length ? ' · falta el jefe' : ' · ¡jefe!') : '';
      return { titulo: `ATAQUE ZOMBIE · NIVEL ${this.nivel}`, lineas: [`Vida: ${vida}`, `Zombies: ${d.muertos} de ${d.total}${jefe}`, `A la cabeza: ${d.cabezas} · mordidas: ${d.mordidas}`],
        corta: [`Nivel ${this.nivel}`, `Vida ${vida}`, `${d.muertos}/${d.total}`], vida };
    }
    return null;
  }
}
