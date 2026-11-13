/* ===== Último bastión v2: dos bandos con contrapesos =====
 * Versión de prueba del diseño por bandos, al lado del modo de siempre (que no cambia). Un solo nivel, La granja,
 * con el plantel completo: 13 unidades militares en tres clases y 16 tipos de zombie en cuatro.
 *
 *   EL BASTIÓN                                              LA HORDA
 *   Infantería   soldado, francotirador, lanzallamas,       Caminantes   común, corredor, gordo, acorazado
 *                médico                                     Especiales   gritón, hinchado, dinamitero, tóxico
 *   Mecanizados  torreta, tanque, mortero, antiaérea        Animales     jauría, toro, bandada, buitre
 *   Estructuras  muro, alambrado, búnker, señuelo,          Acechadores  topo, lanzador, escupidor, rabioso
 *                torre de vigía                             (+ el soldado contagiado y El Coloso, el jefe)
 *
 * Los acechadores son los que no vienen de frente: el topo pasa por debajo, el lanzador arroja zombies por arriba de
 * los muros, el escupidor tira desde más lejos que la línea y el rabioso corre más rápido que las armas lentas.
 *
 * Los contrapesos no salen de una tabla de multiplicadores sino de cinco reglas que valen para todos:
 *   Blindaje   le resta puntos a cada bala (mínimo 1). No frena al francotirador, al cañón, al fuego ni a las explosiones
 *   Área       el fuego y las explosiones pegan a todos los que están juntos; la granada del mortero tarda en caer
 *   Aire       lo que vuela pasa sobre todo; sólo le tiran los fusiles (soldado, francotirador) y la antiaérea
 *   Velocidad  cuanto más rápido el zombie, menos tiempo pasa bajo fuego: cadencia alta y alambrado
 *   Vista      el zombie va por el humano que ve; el que tira desde más lejos que esa vista, tira escondido
 *
 * Los zombies se comportan como zombies: cada uno mira, caza al primer humano que ve, rompe lo que lo protege y, si
 * no ve a nadie, marcha al campamento. Cuenta como humano la infantería a pie y la gente de torretas, morteros,
 * antiaéreas, tanques y búnkeres ocupados. El soldado que cae se levanta a los 3 s como soldado zombie.
 *
 * Archivos:  js/bastion-v2.js         este: datos de los dos bandos, oleadas, colocar, vender, mover y guardar
 *            js/bastion-v2-horda.js   cómo se crea y cómo se porta cada tipo de zombie
 *            js/bastion-v2-tropa.js   armas y oficios de cada unidad, explosiones, gas y granadas
 *            js/bastion-v2-dibujo.js  el dibujo de lo nuevo (unidades, zombies, aves y efectos)
 *            js/bastion-v2-ui.js      panel, parte de la oleada, fichas, pantalla previa y textos
 * Cuelga de Juego con this.v2: envuelve los métodos de js/estrategia.js y deja el modo anterior intacto.
 */
const BASTION2 = {
  celda: 44,              // una celda de vista o de alcance, en px del plano
  contagio: 3,            // segundos entre que cae un soldado y se levanta en contra
  desgaste: 2,            // vida que le saca al alambrado cada zombie que lo pisa (aguanta 20 pisadas)
  topeRaspado: 0.5,       // el alambrado lastima pero no mata solo: entre todos le sacan hasta la mitad de la vida
  quema: 4,               // daño por segundo de lo que quedó prendido fuego
  vender: { descanso: 0.75, oleada: 0.5 },
  crecimientoVida: 1.17,  // la vida de los zombies crece 17 % por oleada (12 oleadas: ×5,6 en la última)
  descanso: 28, primerDescanso: 45,
  horda: 6,               // los comunes entran de a tandas de este tamaño, pegados: una horda, no una fila
  clases: {
    inf: ['soldado', 'francotirador', 'lanzallamas', 'medico'],
    mec: ['torreta', 'tanque', 'mortero', 'antiaerea'],
    est: ['muro', 'alambrado', 'bunker', 'senuelo', 'vigia'],
  },
  /* Unidades. alcance, minimo y radio en px del plano (44 px = una celda). arma: 'bala' (el blindaje le resta),
   * 'pesada' (ignora el blindaje), 'fuego' (daño por segundo a todos los del cono), 'explosivo' (granada con demora)
   * o 'flak' (sólo al aire, con área). aire: le puede tirar a lo que vuela. elige: a quién le tira */
  unidades: {
    soldado:       { clase: 'inf', costo: 50,  tiempo: 4,   vida: 30,  donde: 'cuartel', alcance: 175, dano: 3,  cadencia: 0.65, arma: 'bala', aire: true },
    francotirador: { clase: 'inf', costo: 120, tiempo: 6,   vida: 20,  donde: 'cuartel', alcance: 340, dano: 45, cadencia: 3,    arma: 'pesada', aire: true, elige: 'peligro' },
    lanzallamas:   { clase: 'inf', costo: 110, tiempo: 5,   vida: 45,  donde: 'cuartel', alcance: 88,  dano: 14, cono: 0.7,      arma: 'fuego', quema: 2 },
    medico:        { clase: 'inf', costo: 90,  tiempo: 5,   vida: 25,  donde: 'cuartel', cura: 4, radio: 88 },
    torreta:       { clase: 'mec', costo: 150, tiempo: 8,   vida: 90,  donde: 'obra', bloquea: true, alcance: 195, dano: 2, cadencia: 0.13, arma: 'bala' },
    tanque:        { clase: 'mec', costo: 375, tiempo: 15,  vida: 400, donde: 'taller', bloquea: true, alcance: 220, dano: 70, cadencia: 1.8, arma: 'pesada', elige: 'vida', mordida: 0.3, vel: 38 },
    mortero:       { clase: 'mec', costo: 130, tiempo: 7,   vida: 60,  donde: 'obra', bloquea: true, alcance: 396, minimo: 176, dano: 14, radio: 40, cadencia: 3.5, vuelo: 1.5, arma: 'explosivo', elige: 'monton' },
    antiaerea:     { clase: 'mec', costo: 140, tiempo: 8,   vida: 80,  donde: 'obra', bloquea: true, alcance: 264, dano: 6, radio: 34, cadencia: 0.4, arma: 'flak', soloAire: true },
    muro:          { clase: 'est', costo: 35,  tiempo: 2,   vida: 150, donde: 'obra', bloquea: true },
    alambrado:     { clase: 'est', costo: 15,  tiempo: 1.5, vida: 40,  donde: 'obra', liviano: true, frena: 0.45, raspa: 0.2 },
    bunker:        { clase: 'est', costo: 120, tiempo: 12,  vida: 280, donde: 'obra', bloquea: true, capacidad: 4, masAlcance: 1.2, masCadencia: 0.8 },
    senuelo:       { clase: 'est', costo: 50,  tiempo: 2,   vida: 100, donde: 'obra', liviano: true, atrae: 5, entretiene: 5 },
    vigia:         { clase: 'est', costo: 60,  tiempo: 4,   vida: 80,  donde: 'obra', bloquea: true, detecta: 4 },   // detecta: celdas a las que obliga a salir al topo (el tanque, a 2)
  },
  /* Zombies. vida: veces la del común de esa oleada. vel en px/s. vista, olfato: en celdas. mueve: 'camina' (por la
   * grilla), 'cuad' (cuadrúpedo: salta lo bajo y el alambrado, no entra al agua) o 'vuela'. llega (los que cazan):
   * 'derecho' (por el camino si el rodeo es corto; si no, rompiendo lo que tapa a su presa), 'rodea' (nunca rompe) o
   * 'rompe' (nunca rodea). dano: lo que le saca al campamento si entra. esquiva: parte de los tiros pesados (el
   * francotirador, el cañón) que le erran. conducta: js/bastion-v2-horda.js */
  zombies: {
    caminante:     { clase: 'cam', conducta: 'caza', vida: 1,   vel: 24, vista: 3, llega: 'derecho', paga: 4,  dano: 1, escala: 0.58 },
    corredor:      { clase: 'cam', conducta: 'caza', vida: 0.8, vel: 46, vista: 4, llega: 'rodea',   paga: 4,  dano: 1, escala: 0.5 },
    gordo:         { clase: 'cam', conducta: 'caza', vida: 3.2, vel: 16, vista: 2, llega: 'rompe',   paga: 8,  dano: 3, escala: 0.66, aplasta: true, mordida: 1.5 },
    acorazado:     { clase: 'cam', conducta: 'caza', vida: 2,   vel: 20, vista: 3, llega: 'derecho', paga: 8,  dano: 2, escala: 0.6, blindaje: 2 },
    griton:        { clase: 'esp', conducta: 'grita', vida: 0.8, vel: 26, vista: 6, paga: 7, dano: 1, escala: 0.56, grito: { radio: 5, apuro: 1.3, dura: 6, cada: 5, quieto: 1.2 } },
    hinchado:      { clase: 'esp', conducta: 'revienta', vida: 5, vel: 14, vista: 5, paga: 8, dano: 3, escala: 0.66, estalla: { radio: 60, unidades: 90, gente: 30, zombies: 2.2 } },
    dinamitero:    { clase: 'esp', conducta: 'demuele', vida: 0.8, vel: 50, paga: 5, dano: 2, escala: 0.52, carga: { dano: 120, radio: 40, unidades: 40, gente: 20, zombies: 1 } },
    toxico:        { clase: 'esp', conducta: 'caza', vida: 3, vel: 18, vista: 4, llega: 'derecho', paga: 7, dano: 2, escala: 0.6, grupo: true, gas: { radio: 50, dura: 5, dano: 5, bunker: 2.3 } },
    perro:         { clase: 'ani', conducta: 'jauria', mueve: 'cuad', vida: 0.5, vel: 62, olfato: 6, paga: 2, dano: 1, escala: 0.74, manada: 5, cadaMordida: 600 },
    toro:          { clase: 'ani', conducta: 'embiste', mueve: 'cuad', vida: 6, vel: 20, vista: 6, paga: 10, dano: 3, escala: 0.82, embestida: { vel: 96, largo: 6, aviso: 0.8, aturde: 2, dano: 12, quieto: 2 } },
    cuervo:        { clase: 'ani', conducta: 'bandada', mueve: 'vuela', vida: 0.4, vel: 55, paga: 1, dano: 1, escala: 0.8, manada: 6, pico: 2, cadaPico: 700, altura: 44 },
    buitre:        { clase: 'ani', conducta: 'rapta', mueve: 'vuela', vida: 2.5, vel: 40, paga: 7, dano: 1, escala: 1, altura: 56 },
    soldadoZombie: { clase: 'cam', conducta: 'caza', vida: 1.5, vel: 24, vista: 3, llega: 'derecho', paga: 3, dano: 1, escala: 0.6, blindaje: 1 },
    topo:          { clase: 'ace', conducta: 'excava', vida: 1.6, vel: 24, vista: 3, llega: 'derecho', paga: 6, dano: 2, escala: 0.58, mordida: 1.5, topo: { vel: 36, sale: 0.8, encandila: 2.5, tanque: 2 } },
    lanzador:      { clase: 'ace', conducta: 'arroja', vida: 6, vel: 16, paga: 10, dano: 3, escala: 0.92, mordida: 1.5,
      arroja: { alcance: 7, cada: 3.2, vuelo: 1.3, cerca: 1.6, alFondo: true, tira: ['caminante', 'corredor', 'soldadoZombie', 'rabioso'], cosa: 'cascote', golpe: { unidades: 28, gente: 12, radio: 18 } } },
    escupidor:     { clase: 'ace', conducta: 'escupe', vida: 1.2, vel: 20, paga: 7, dano: 2, escala: 0.6, escupe: { alcance: 5, cada: 3.2, vuelo: 1, golpe: 6, charco: { radio: 22, dura: 3.5, gente: 6, cosas: 7 } } },
    rabioso:       { clase: 'ace', conducta: 'corre', vida: 0.7, vel: 120, paga: 3, dano: 1, escala: 0.5, manada: 4, esquiva: 0.6 },
    jefe:          { clase: 'cam', conducta: 'caza', vida: 22,  vel: 14, vista: 3, llega: 'rompe', paga: 45, dano: 8, escala: 1.25, aplasta: true, mordida: 3,
      arroja: { alcance: 5, cada: 5, vuelo: 1.3, cosa: 'fardo', golpe: { unidades: 60, gente: 25, radio: 30 } } },
  },
  ordenParte: ['caminante', 'corredor', 'gordo', 'acorazado', 'griton', 'hinchado', 'dinamitero', 'toxico', 'perro', 'toro', 'cuervo', 'buitre', 'topo', 'lanzador', 'escupidor', 'rabioso', 'jefe'],
  clasesZombie: { cam: ['caminante', 'corredor', 'gordo', 'acorazado'], esp: ['griton', 'hinchado', 'dinamitero', 'toxico'], ani: ['perro', 'toro', 'cuervo', 'buitre'], ace: ['topo', 'lanzador', 'escupidor', 'rabioso'] },
  // A quién elige primero el francotirador (de más a menos peligroso)
  peligro: ['lanzador', 'escupidor', 'griton', 'hinchado', 'toxico', 'dinamitero', 'buitre', 'topo', 'acorazado', 'toro', 'jefe', 'gordo', 'soldadoZombie', 'corredor', 'caminante', 'perro', 'cuervo', 'rabioso'],
  /* Quién frena a quién, para las marcas del panel, las fichas y los consejos. Sale de medir cada cruce con el
   * simulador (una defensa de un solo tipo contra una tanda de un solo tipo, en la oleada 6 u 8), no de una regla aparte.
   * bien: lo frena; mal: rinde poco o se pierde contra él */
  contra: {
    caminante:  { bien: ['lanzallamas', 'mortero', 'senuelo'], mal: ['tanque', 'antiaerea'] },
    corredor:   { bien: ['torreta', 'alambrado', 'lanzallamas'], mal: ['soldado', 'mortero', 'tanque'] },
    gordo:      { bien: ['tanque', 'francotirador'], mal: ['soldado', 'muro', 'alambrado', 'mortero'] },
    acorazado:  { bien: ['francotirador', 'tanque', 'lanzallamas'], mal: ['torreta', 'soldado', 'bunker'] },
    griton:     { bien: ['francotirador', 'torreta'], mal: ['mortero'] },
    hinchado:   { bien: ['francotirador', 'mortero', 'alambrado', 'senuelo'], mal: ['lanzallamas', 'soldado', 'muro'] },
    dinamitero: { bien: ['torreta', 'soldado', 'francotirador', 'alambrado'], mal: ['muro', 'mortero', 'antiaerea', 'tanque'] },
    toxico:     { bien: ['francotirador', 'tanque', 'medico'], mal: ['bunker', 'soldado', 'lanzallamas'] },
    perro:      { bien: ['lanzallamas', 'torreta', 'bunker'], mal: ['soldado', 'francotirador', 'alambrado', 'mortero'] },
    toro:       { bien: ['francotirador', 'tanque', 'torreta', 'bunker'], mal: ['soldado', 'alambrado', 'medico'] },
    cuervo:     { bien: ['antiaerea', 'bunker'], mal: ['torreta', 'tanque', 'mortero', 'lanzallamas'] },
    buitre:     { bien: ['antiaerea', 'soldado', 'bunker'], mal: ['torreta', 'tanque', 'mortero', 'lanzallamas'] },
    topo:       { bien: ['vigia', 'tanque', 'senuelo', 'lanzallamas'], mal: ['francotirador', 'mortero', 'antiaerea', 'soldado', 'muro', 'alambrado'] },
    lanzador:   { bien: ['francotirador', 'tanque', 'bunker'], mal: ['muro', 'alambrado', 'soldado', 'mortero'] },
    escupidor:  { bien: ['francotirador', 'tanque'], mal: ['soldado', 'torreta', 'bunker', 'lanzallamas', 'muro'] },
    rabioso:    { bien: ['lanzallamas', 'torreta', 'alambrado'], mal: ['francotirador', 'mortero', 'tanque', 'soldado'] },
    soldadoZombie: { bien: ['francotirador', 'tanque', 'medico'], mal: ['soldado'] },
    jefe:       { bien: ['tanque', 'francotirador'], mal: ['muro', 'alambrado', 'soldado'] },
  },
  /* Oleadas escritas (cuántos de cada tipo). Cada oleada estrena uno o dos tipos; el orden en que salen lo arma
   * ordenOleada, siempre igual. El Coloso viene en la 6 y en la 12. Cada muerto paga poco (un común, $4): con lo que se
   * junta en toda la partida alcanza para responder a cada tipo, no para tener de todo de sobra. La plata es la perilla
   * de la dificultad: con los comunes a $3 ningún plan del simulador llega al final */
  niveles: {
    granja: {
      dinero: 220, vida: 1,
      oleadas: [
        { caminante: 18 },
        { caminante: 24, corredor: 12 },
        { caminante: 28, corredor: 10, acorazado: 8 },
        { caminante: 28, corredor: 12, acorazado: 8, perro: 15, escupidor: 2 },
        { caminante: 32, acorazado: 10, perro: 10, cuervo: 18, escupidor: 3, rabioso: 4 },
        { caminante: 32, corredor: 14, gordo: 6, acorazado: 8, escupidor: 3, rabioso: 8, jefe: 1 },
        { caminante: 36, corredor: 14, hinchado: 3, perro: 15, cuervo: 18, rabioso: 8 },
        { caminante: 38, gordo: 7, acorazado: 10, hinchado: 4, dinamitero: 6, topo: 3, rabioso: 8 },
        { caminante: 40, corredor: 18, griton: 3, dinamitero: 6, perro: 15, cuervo: 18, topo: 3, lanzador: 2 },
        { caminante: 42, gordo: 9, acorazado: 12, griton: 3, hinchado: 4, toxico: 4, lanzador: 2, escupidor: 3, rabioso: 12 },
        { caminante: 42, corredor: 18, dinamitero: 7, toxico: 4, perro: 15, toro: 3, buitre: 3, topo: 4, escupidor: 3 },
        { caminante: 44, corredor: 16, gordo: 8, acorazado: 12, griton: 3, hinchado: 4, dinamitero: 6, toxico: 4, perro: 15, toro: 3, cuervo: 18, buitre: 3, topo: 4, lanzador: 2, escupidor: 3, rabioso: 12, jefe: 1 },
      ],
    },
  },
};
// Cómo acusa cada golpe el zombie (js/zombie.js): el fuego y las púas no destellan ni empujan; la explosión lo despide
const ARMA_BALA = { categoria: 'rifle' }, ARMA_PESADA = { categoria: 'escopeta', pesada: true };
const ARMA_FUEGO = { categoria: 'cuerpo', fuego: true }, ARMA_EXPLOSION = { categoria: 'bazuca', explosivo: true };
const ARMA_ALAMBRE = { categoria: 'cuerpo', fuego: true, alambre: true };

/* ---------- Partida guardada, oleadas y pantalla de fin (aparte del modo de siempre) ---------- */
const BastionV2 = {
  PARTIDA: 'zonaMuerta.bastion2.partida', GANADO: 'zonaMuerta.bastion2.ganado', VERSION: 2,
  partida() { const p = ProgresoBastion.leer(this.PARTIDA, null); return p && p.version === this.VERSION ? p : null; },   // la de un plantel anterior no sirve
  borrar() { ProgresoBastion.escribir(this.PARTIDA, null); },
  oleadas() { return BASTION2.niveles.granja.oleadas; },
  // En qué oleada (desde 0) aparece por primera vez cada tipo
  debut() {
    if (!this.debuts) { this.debuts = {}; this.oleadas().forEach((def, i) => { for (const k in def) if (!(k in this.debuts)) this.debuts[k] = i; }); }
    return this.debuts;
  },
  /* Orden en que sale una oleada, sin azar: los comunes en hordas repartidas de principio a fin; los acorazados
   * adelante, de escudo; el gritón, primero; gordos, hinchados y tóxicos de la mitad en adelante; corredores y
   * dinamiteros en dos tandas; perros de a 5 y cuervos de a 6; el jefe, al final */
  ordenOleada(def) {
    const puestos = [], n = tipo => def[tipo] || 0, poner = (tipo, f) => puestos.push([f, tipo]);
    const parejo = (tipo, a, b) => { for (let k = 0; k < n(tipo); k++) poner(tipo, a + (b - a) * (k + 0.5) / n(tipo)); };
    const tandas = (tipo, tam, cuando) => { for (let k = 0; k < n(tipo); k++) poner(tipo, cuando[Math.min(cuando.length - 1, Math.floor(k / tam))] + k * 0.0004); };
    const hordas = Math.max(1, Math.round(n('caminante') / BASTION2.horda));
    for (let k = 0; k < n('caminante'); k++) poner('caminante', (Math.floor(k * hordas / n('caminante')) + 0.5) / hordas + k * 0.0004);
    parejo('acorazado', 0.08, 0.7); parejo('gordo', 0.4, 1); parejo('griton', 0.04, 0.55);
    parejo('hinchado', 0.3, 0.9); parejo('toxico', 0.3, 0.85); parejo('toro', 0.4, 0.8); parejo('buitre', 0.45, 0.9);
    parejo('topo', 0.2, 0.75); parejo('lanzador', 0.3, 0.8); parejo('escupidor', 0.12, 0.75);
    tandas('rabioso', BASTION2.zombies.rabioso.manada, [0.35, 0.65, 0.9]);
    tandas('corredor', Math.ceil(n('corredor') / 2) || 1, [0.3, 0.72]);
    tandas('dinamitero', Math.ceil(n('dinamitero') / 2) || 1, [0.5, 0.82]);
    tandas('perro', BASTION2.zombies.perro.manada, [0.25, 0.6, 0.86, 0.95]);
    tandas('cuervo', BASTION2.zombies.cuervo.manada, [0.4, 0.7, 0.92]);
    for (let k = 0; k < n('jefe'); k++) poner('jefe', 2 + k);
    return puestos.sort((a, b) => a[0] - b[0]).map(p => p[1]);
  },
  total(def) { return Object.values(def).reduce((s, v) => s + v, 0); },
  // Segundos hasta el próximo que sale: los de una misma tanda (horda de comunes, corredores, manada) salen pegados,
  // y después de una horda hay un respiro
  pausa(tipo, sigue, ronda, k) {
    const base = Math.max(0.5, 1.5 - ronda * 0.08) * (0.8 + azar(k, ronda) * 0.4);
    if (tipo === sigue) return base * ({ caminante: 0.3, corredor: 0.4, dinamitero: 0.5, perro: 0.22, cuervo: 0.2, rabioso: 0.25 }[tipo] || 1);
    return base * (tipo === 'caminante' ? 2.4 : 1);
  },
  // Las unidades del bastión son una sola tabla (BASTION.unidades): en la v2 valen las de BASTION2 y, al volver al
  // modo de siempre, las originales
  ajustarUnidades(v2) {
    if (!this.originales) this.originales = JSON.parse(JSON.stringify(BASTION.unidades));
    for (const k of Object.keys(BASTION.unidades)) delete BASTION.unidades[k];
    Object.assign(BASTION.unidades, JSON.parse(JSON.stringify(v2 ? BASTION2.unidades : this.originales)));
  },
  // Texto de la pantalla de fin: si se perdió, quiénes entraron al campamento y con qué se frena al que más entró
  fin(juego, v) {
    const nivel = t('bniv.' + juego.nivelBastion.id), total = this.oleadas().length;
    if (juego.resultado === 'victoria') {
      return { titulo: t('fin.bastionGanado'), color: '#6ad06a',
        detalle: t('b2.finGanado', { nivel, olas: total, base: juego.vidaBase, max: BASTION.vidaBase, bajas: juego.bajas, contagiados: juego.contagiados, tiempo: v.tiempo }) };
    }
    const E = juego.entraron || {}, tipos = Object.keys(E).sort((a, b) => E[b] - E[a]);
    const lista = tipos.map(k => `${E[k]} × ${t('b2.z.' + k)}`).join(', ');
    const peor = tipos[0], C = peor && BASTION2.contra[peor];
    const consejo = C ? ' ' + t('b2.consejo', { tipo: t('b2.z.' + peor), con: C.bien.map(u => t('b2.u.' + u)).join(', ') }) : '';
    return { titulo: t('fin.bastionTitulo'), color: '',
      detalle: t('b2.finPerdido', { nivel, ola: Math.max(1, juego.ronda), total, lista, contagiados: juego.contagiados, tiempo: v.tiempo }) + consejo };
  },
};

(() => {
  const P = Juego.prototype, v1 = {};
  const distPlano = (ax, ay, bx, by) => Math.hypot(ax - bx, (ay - by) * 1.3);   // en el plano la fila vale 1,3 (como los alcances)
  const VECINAS = [[-1, 0], [0, -1], [0, 1], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]];
  // Un método de la v1 pasa a elegir: en una partida v2 corre el nuevo; en las demás, el de siempre
  const envolver = (nombre, nuevo) => { v1[nombre] = P[nombre]; P[nombre] = function (...a) { return this.v2 ? nuevo.apply(this, a) : v1[nombre].apply(this, a); }; };
  BastionV2.distPlano = distPlano; BastionV2.v1 = v1; BastionV2.envolver = envolver;
  const U_ = tipo => BASTION.unidades[tipo];
  const esInf = u => !!u && u.clase === 'inf';

  /* ---------- Armar la partida ---------- */
  v1.prepararBastion = P.prepararBastion;
  P.prepararBastion = function () {
    this.v2 = !!(this.opcionesEstrategia && this.opcionesEstrategia.v2);
    document.body.classList.toggle('bastion-v2', this.v2);
    BastionV2.ajustarUnidades(this.v2);
    if (!this.v2) return v1.prepararBastion.call(this);
    const B = BASTION;
    Mundo.plano = true; Mundo.carriles = false; Mundo.perfil = null;
    this.cols = columnasBastion();
    this.filas = Math.floor((B.abajo - B.arriba) / B.celda[1]);
    this.vidaBase = B.vidaBase;
    this.unidades = []; this.colaCuartel = []; this.colaTaller = []; this.colaOleada = [];
    this.ronda = 0; this.porAparecer = 0; this.enDescanso = true; this.descansoHasta = BASTION2.primerDescanso; this.proximoZombie = 0;
    this.colocando = null; this.moviendo = null; this.puntero = null; this.trazos = []; this.balasBastion = [];
    this.granadasV2 = []; this.nubesV2 = []; this.rayosV2 = []; this.flakV2 = []; this.pendientesV2 = []; this.ondasV2 = []; this.arrojadosV2 = []; this.charcosV2 = [];
    this.velocidad = 1; this.construidas = 0; this.contagiados = 0; this.entraron = {};
    this.camposLibres = new Map(); this.camposCrudos = new Map(); this.camposCuad = new Map();
    this.prepararNivelBastion();   // escenario, terreno y obstáculos de La granja (js/bastion-niveles.js)
    this.nivelV2 = BASTION2.niveles[this.nivelBastion.id] || BASTION2.niveles.granja;
    this.dinero = this.nivelV2.dinero;
    // Lo que no deja pasar a nadie que camine, haya o no construcciones: obstáculos del mapa y agua profunda. Los
    // obstáculos bajos (fardos, el tractor) los saltan los perros
    this.crudasV2 = new Set(); this.bajasV2 = new Set();
    for (const o of this.obstaculos || []) { this.crudasV2.add(o.c + ',' + o.f); if (o.tipo === 'fardo' || o.tipo === 'tractor' || o.tipo === 'auto') this.bajasV2.add(o.c + ',' + o.f); }
    for (let f = 0; f < this.filas; f++) for (let c = 0; c < this.cols; c++) if (this.terrenoEn(c, f) === 'agua') this.crudasV2.add(c + ',' + f);
    const guardada = this.opcionesEstrategia.continuar && BastionV2.partida();
    if (guardada) this.restaurarPartidaV2(guardada); else this.ejercitoInicialV2();
    this.rehacerCamino();
    document.getElementById('hud-aereo').classList.add('oculta');
    document.getElementById('panel-bastion').classList.remove('oculta');
    this.panelBastion();
  };
  // Una unidad lista en su celda (op.obra: recién empezada a construir)
  P.nuevaUnidadV2 = function (tipo, c, f, op = {}) {
    const U = U_(tipo), p = this.centroCelda(c, f);
    const u = { tipo, clase: U.clase, c, f, x: op.x ?? p.x, y: op.y ?? p.y, vida: U.vida, vidaMax: U.vida, listo: true, obra: 1, bloquea: !!U.bloquea, costo: U.costo,
      enfriado: Math.random() * 0.4, fuego: 0, apunta: 0, fase: 0, adentro: 0 };
    if (tipo === 'bunker') u.dentro = [];
    if (U.soloAire) u.apunta = -0.8;   // la antiaérea espera mirando al cielo
    if (op.obra) { u.listo = false; u.obra = 0; u.vida = U.vida * 0.25; }
    return u;
  };
  // Ejército mínimo al empezar: tres soldados y tres muros que les sirven de escudo sin cerrar el camino
  P.ejercitoInicialV2 = function () {
    const medio = Math.floor(this.filas / 2);
    for (const df of [-2, -1, 1]) if (!this.motivoNoColocar('muro', 7, medio + df, true)) this.unidades.push(this.nuevaUnidadV2('muro', 7, medio + df));
    for (const df of [-1, 0, 1]) if (!this.motivoNoColocar('soldado', 4, medio + df, true)) this.unidades.push(this.nuevaUnidadV2('soldado', 4, medio + df));
  };

  envolver('alMorirZombie', function (zombie, arma) {
    this.bajas++;
    if (!zombie.sinPaga) this.dinero += (BASTION2.zombies[zombie.tipoBastion] || BASTION2.zombies.caminante).paga;
    this.alCaerZombieV2(zombie, arma);   // lo que deja al morir: explosión, gas… (js/bastion-v2-horda.js)
  });

  /* ---------- Caminos: el de siempre (libre), hacia una presa, «crudo» (como si no hubiera construcciones) y el de
   * los cuadrúpedos (que saltan lo bajo) ---------- */
  envolver('bloqueadas', function (extra) {
    const s = v1.bloqueadas.call(this, extra);
    for (const k of this.crudasV2) s.add(k);   // el estanque también corta el paso
    return s;
  });
  envolver('rehacerCamino', function () {
    this.bloqV2 = this.bloqueadas();
    this.distBastion = this.distancias(this.bloqV2);
    this.bloqCuadV2 = new Set([...this.bloqV2].filter(k => !this.bajasV2.has(k)));
    this.distCuadV2 = this.distancias(this.bloqCuadV2);
    this.camposLibres.clear(); this.camposCuad.clear();
  });
  // Distancias por celda desde las fuentes, sin pisar las bloqueadas
  P.bfsV2 = function (fuentes, bloqueadas) {
    const d = Array.from({ length: this.filas }, () => new Array(this.cols).fill(Infinity)), cola = [];
    for (const [c, f] of fuentes) if (this.dentro(c, f) && !bloqueadas.has(c + ',' + f) && d[f][c] === Infinity) { d[f][c] = 1; cola.push([c, f]); }
    for (let i = 0; i < cola.length; i++) {
      const [c, f] = cola[i];
      for (const [dc, df] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nf = f + df;
        if (this.dentro(nc, nf) && d[nf][nc] === Infinity && !bloqueadas.has(nc + ',' + nf)) { d[nf][nc] = d[f][c] + 1; cola.push([nc, nf]); }
      }
    }
    return d;
  };
  // Hacia una celda por el camino abierto. Si la celda es una construcción (búnker, torreta), hasta sus vecinas.
  // cuad: el de los perros y el toro
  P.campoLibre = function (c, f, cuad) {
    const k = c + ',' + f, cache = cuad ? this.camposCuad : this.camposLibres, bloq = cuad ? this.bloqCuadV2 : this.bloqV2;
    let d = cache.get(k);
    if (!d) { d = this.bfsV2(bloq.has(k) ? [[c + 1, f], [c - 1, f], [c, f + 1], [c, f - 1]] : [[c, f]], bloq); cache.set(k, d); }
    return d;
  };
  // Hacia una celda (o hacia el campamento) en línea lo más recta posible: sólo estorban los obstáculos del mapa
  P.campoCrudo = function (c, f) {
    const k = c + ',' + f; let d = this.camposCrudos.get(k);
    if (!d) { d = this.bfsV2([[c, f]], this.crudasV2); this.camposCrudos.set(k, d); if (this.camposCrudos.size > 400) this.camposCrudos.delete(this.camposCrudos.keys().next().value); }
    return d;
  };
  P.campoCrudoBase = function () {
    let d = this.camposCrudos.get('base');
    if (!d) { d = this.bfsV2(Array.from({ length: this.filas }, (_, f) => [0, f]), this.crudasV2); this.camposCrudos.set('base', d); }
    return d;
  };
  // La celda vecina que más acerca (sin cortar esquinas); null si ya no hay ninguna mejor
  P.siguienteCeldaV2 = function (c, f, campo, crudo) {
    let mejor = null, dm = campo[f][c];
    for (const [dc, df] of VECINAS) {
      const nc = c + dc, nf = f + df;
      if (!this.dentro(nc, nf) || !(campo[nf][nc] < dm)) continue;
      if (dc && df) {
        if (campo[f][nc] === Infinity || campo[nf][c] === Infinity) continue;
        if (crudo && (this.bloqV2.has(nc + ',' + f) || this.bloqV2.has(c + ',' + nf))) continue;
      }
      dm = campo[nf][nc]; mejor = [nc, nf];
    }
    return mejor;
  };

  /* ---------- Colocar, vender, reparar ---------- */
  // sinPlata: sólo las reglas del lugar (para el ejército inicial y para mover)
  envolver('motivoNoColocar', function (tipo, c, f, sinPlata, mueve) {
    const U = U_(tipo);
    if (!this.dentro(c, f)) return 'bastion.fuera';
    if (this.obstaculoEn(c, f)) return 'bastion.obstaculo';
    const suelo = this.terrenoEn(c, f);
    if (suelo === 'agua') return 'bastion.agua';
    if (suelo === 'barro' && U.clase !== 'inf' && !U.liviano) return 'b2.blando';   // en el barro: sólo gente a pie, alambrado y señuelo
    if (!sinPlata && this.dinero < U.costo) return 'bastion.sinDinero';
    const ocupa = this.ocupadaPor(c, f);
    const suelta = this.unidades.find(u => u !== mueve && !u.bloquea && !u.invisible && !u.llevado && u.c === c && u.f === f && (!esInf(u) || u.listo));   // alambrado, señuelo, un caído o alguien en su puesto
    if (U.clase === 'inf') {
      if (ocupa && ocupa !== mueve) return ocupa.tipo !== 'bunker' ? 'bastion.ocupado' : ocupa.dentro.length + this.vanAlBunker(ocupa) >= U_('bunker').capacidad ? 'bastion.lleno' : null;
      return suelta ? 'bastion.ocupado' : this.colaCuartel.some(o => o.c === c && o.f === f && !o.bunker) ? 'bastion.ocupado' : null;
    }
    if ((ocupa && ocupa !== mueve) || suelta) return 'bastion.ocupado';
    if (this.zombies.some(z => { if (z.estado === 'muerto' || z.vuela || z.enterrado) return false; const k = this.celdaDe(z.x, z.y); return k.c === c && k.f === f; })) return 'bastion.ocupado';
    if (!U.liviano) {   // lo que bloquea no puede cerrar del todo el paso al campamento
      const bloq = this.bloqueadas(c + ',' + f);
      if (mueve && mueve.bloquea) bloq.delete(mueve.c + ',' + mueve.f);
      if (!this.distancias(bloq).some(fila => fila[this.cols - 1] < Infinity)) return 'bastion.bloquea';
    }
    return null;
  });
  envolver('vanAlBunker', function (b) { return this.unidades.filter(u => u.destinoBunker === b || u.esperaBunker === b).length + this.colaCuartel.filter(o => o.bunker === b).length; });
  envolver('colocar', function (c, f) {
    const tipo = this.colocando, U = U_(tipo); if (!U) return false;
    const motivo = this.motivoNoColocar(tipo, c, f);
    if (motivo) { this.aviso(t(motivo), 1400); Audio_.vacio(); return false; }
    this.dinero -= U.costo;
    if (U.donde === 'obra') {   // se levanta en el lugar
      this.unidades.push(this.nuevaUnidadV2(tipo, c, f, { obra: true }));
      if (U.bloquea) this.rehacerCamino();
      Audio_.recarga('cartucho');
    } else {   // se forma en el cuartel o se arma en el taller, de a uno, y va hasta su lugar
      const bunker = this.ocupadaPor(c, f), p = this.centroCelda(c, f);
      const orden = { tipo, c, f, costo: U.costo, bunker: bunker && bunker.tipo === 'bunker' ? bunker : null };
      if (U.bloquea) {   // el lugar del tanque queda reservado desde ya, así nadie lo bloquea
        orden.reserva = { tipo: 'reserva', c, f, x: p.x, y: p.y, bloquea: true, listo: false, vida: 1, vidaMax: 1, costo: 0, invisible: true };
        this.unidades.push(orden.reserva); this.rehacerCamino();
      }
      (U.donde === 'cuartel' ? this.colaCuartel : this.colaTaller).push(orden);
      Audio_.recarga('tapa');
    }
    this.panelBastion();
    return true;
  });
  // Lo que hay para vender o reparar en una celda: primero lo construido, después la gente
  P.unidadEnV2 = function (c, f) {
    const lista = this.unidades.filter(u => u.c === c && u.f === f && !u.invisible && !u.llevado && u.tipo !== 'caido' && U_(u.tipo));
    return lista.find(u => u.bloquea) || lista.find(u => !esInf(u)) || lista.find(u => u.listo && !u.enCamino) || null;
  };
  envolver('vender', function (x, y) {
    const { c, f } = this.celdaDe(x, y), u = this.unidadEnV2(c, f);
    if (!u) return false;
    const devuelve = u.listo ? Math.round(u.costo * (this.enDescanso ? BASTION2.vender.descanso : BASTION2.vender.oleada)) : u.costo;
    this.quitarUnidad(u); this.dinero += devuelve;
    this.aviso(t('bastion.vendido', { d: devuelve }), 1200); Audio_.recarga('tapa');
    return true;
  });
  envolver('aReparar', function (c, f) { return this.unidades.find(u => u.c === c && u.f === f && !u.invisible && u.listo && u.vida < u.vidaMax - 0.5 && U_(u.tipo) && !esInf(u)) || null; });   // a la gente la cura el médico
  envolver('quitarUnidad', function (u, destruida) {
    u.quitada = true;   // los zombies que la tenían de presa la sueltan
    const dentro = u.dentro || []; u.dentro = []; u.adentro = 0;
    if (this.moviendo === u) this.moviendo = null;
    v1.quitarUnidad.call(this, u, destruida && !esInf(u));
    dentro.forEach((d, k) => {   // los de adentro del búnker salen a pie, cada uno con su oficio
      const s = this.nuevaUnidadV2(d.tipo, u.c, u.f, { x: u.x - 10 + k * 6, y: u.y + 6 }); s.vida = d.vida ?? s.vida;
      this.unidades.push(s);
    });
    for (const s of this.unidades) if (s.esperaBunker === u) s.esperaBunker = null;
  });

  // Cuartel y taller: forman de a uno; lo formado sale del campamento y va hasta su lugar
  envolver('formar', function (dt) {
    const B = BASTION, puerta = { x: B.baseX - 18, y: B.arriba + (this.filas * B.celda[1]) / 2 + 8 };
    for (const cola of [this.colaCuartel, this.colaTaller]) {
      const o = cola[0]; if (!o) continue;
      o.hecho = (o.hecho || 0) + dt;
      if (o.hecho < U_(o.tipo).tiempo) continue;
      cola.shift();
      if (o.reserva) this.unidades = this.unidades.filter(x => x !== o.reserva);
      const u = this.nuevaUnidadV2(o.tipo, o.c, o.f, { x: puerta.x, y: puerta.y });
      u.destino = this.centroCelda(o.c, o.f); u.enCamino = true; u.retroceso = 0;
      if (esInf(u) && o.bunker && !o.bunker.quitada) u.destinoBunker = o.bunker;
      this.unidades.push(u); if (u.bloquea) this.rehacerCamino();
      this.aviso(t('bastion.listo', { que: t('b2.u.' + o.tipo) }), 1100);
      Audio_.recarga(u.bloquea ? 'tapa' : 'cerrojo');
    }
  });

  /* ---------- Mover: la infantería y el tanque cambian de lugar (también en plena oleada; van expuestos) ---------- */
  envolver('elegirUnidad', function (tipo) {
    this.moviendo = null;
    if (tipo !== 'mover') return v1.elegirUnidad.call(this, tipo);
    this.colocando = this.colocando === 'mover' ? null : 'mover';
    this.panelBastion();
  });
  envolver('cancelarColocacion', function () { this.moviendo = null; return v1.cancelarColocacion.call(this); });
  // ¿A quién se puede mover de esa celda? Alguien a pie, el tanque o el último que entró a un búnker
  P.movibleEnV2 = function (c, f) {
    const en = this.unidades.filter(u => u.c === c && u.f === f && u.listo && !u.invisible && !u.llevado);
    return en.find(u => esInf(u) && !u.enCamino) || en.find(u => u.tipo === 'tanque') || en.find(u => u.tipo === 'bunker' && u.dentro.length) || null;
  };
  P.tocarMoverV2 = function (c, f) {
    if (!this.moviendo) {
      const u = this.movibleEnV2(c, f);
      if (!u) { this.aviso(t('b2.nadaQueMover'), 1100); Audio_.vacio(); return; }
      this.moviendo = u; Audio_.recarga('cerrojo'); return;
    }
    let u = this.moviendo;
    if (u.quitada) { this.moviendo = null; return; }
    if (u.c === c && u.f === f) { this.moviendo = null; return; }   // tocar de nuevo el mismo lugar lo suelta
    const tipo = u.tipo === 'bunker' ? u.dentro[u.dentro.length - 1].tipo : u.tipo;
    const motivo = this.motivoNoColocar(tipo, c, f, true, u.tipo === 'bunker' ? null : u);
    if (motivo) { this.aviso(t(motivo), 1400); Audio_.vacio(); return; }
    if (u.tipo === 'bunker') {   // sale el último que entró
      const d = u.dentro.pop(); u.adentro = u.dentro.length;
      const s = this.nuevaUnidadV2(d.tipo, c, f, { x: u.x, y: u.y + 6 }); s.vida = d.vida ?? s.vida;
      this.unidades.push(s); u = s;
    }
    const destino = this.ocupadaPor(c, f);
    u.c = c; u.f = f; u.destino = this.centroCelda(c, f); u.enCamino = true; u.esperaBunker = null;
    u.destinoBunker = esInf(u) && destino && destino.tipo === 'bunker' ? destino : null;
    if (u.bloquea) this.rehacerCamino();
    this.moviendo = null; Audio_.recarga('tapa');
  };
  envolver('punteroBastion', function (x, y, tipo, boton) {
    if (this.colocando !== 'mover') return v1.punteroBastion.call(this, x, y, tipo, boton);
    ({ x, y } = this.camaraBastion().desproyectar(x, y));
    this.puntero = { x, y };
    if (tipo !== 'down' || this.terminado) return;
    if (boton === 2) { if (this.moviendo) this.moviendo = null; else this.cancelarColocacion(); return; }
    const { c, f } = this.celdaDe(x, y);
    if (this.dentro(c, f)) this.tocarMoverV2(c, f);
  });

  /* ---------- Oleadas escritas ---------- */
  envolver('oleadas', function (dt) {
    const total = this.nivelV2.oleadas.length;
    if (this.terminado) return;
    if (this.enDescanso) { if (this.tiempoJugado >= this.descansoHasta) this.empezarOleadaV2(); return; }
    if (this.colaOleada.length) {
      this.proximoZombie -= dt;
      if (this.proximoZombie <= 0) {
        const tipo = this.colaOleada.shift(), sigue = this.colaOleada[0];
        this.aparecerZombieV2(tipo, sigue);
        const k = this.colaOleada.length;
        this.proximoZombie = BastionV2.pausa(tipo, sigue, this.ronda, k);
        this.porAparecer = k;
      }
    } else if (!this.zombies.some(z => z.estado !== 'muerto') && !this.unidades.some(u => u.tipo === 'caido')) {
      if (this.ronda >= total) {
        this.terminado = true; this.resultado = 'victoria';
        ProgresoBastion.escribir(BastionV2.GANADO, { base: this.vidaBase, dificultad: this.dificultad.id, fecha: Date.now() }); BastionV2.borrar();
        Audio_.rondaSuperada(); return;
      }
      const bono = 30 + 5 * this.ronda;
      this.dinero += bono; this.enDescanso = true; this.descansoHasta = this.tiempoJugado + BASTION2.descanso;
      this.nubesV2 = []; this.granadasV2 = []; this.arrojadosV2 = []; this.charcosV2 = [];
      this.avisoRonda(t('bastion.oleadaSuperada', { n: this.ronda }), t('bastion.bonus', { d: bono }), 2600); Audio_.rondaSuperada();
      this.guardarPartidaV2();
    }
  });
  P.empezarOleadaV2 = function () {
    this.guardarPartidaV2();   // la foto de cómo estaba todo al empezar la oleada: si se pierde, se repite desde acá
    this.ronda++; this.enDescanso = false; this.sinPremioPorAdelantar = false;
    this.colaOleada = BastionV2.ordenOleada(this.nivelV2.oleadas[this.ronda - 1]);
    this.porAparecer = this.colaOleada.length; this.proximoZombie = 0.5; this.filaManada = null;
    this.avisoRonda(t('bastion.ola', { n: this.ronda }), t('bastion.vienen', { n: this.porAparecer }), 2200); Audio_.sirena();
  };
  // Entra por la derecha, en una fila con paso al campamento. Las manadas (perros, cuervos) entran por la misma zona
  P.aparecerZombieV2 = function (tipo, sigue) {
    const B = BASTION, Z = BASTION2.zombies[tipo];
    const filas = []; for (let f = 0; f < this.filas; f++) if (Z.mueve === 'vuela' || this.distBastion[f][this.cols - 1] < Infinity) filas.push(f);
    let f = filas[Math.floor(Math.random() * filas.length)] ?? 0;
    if (Z.manada || tipo === 'caminante') {
      if (this.filaManada && this.filaManada.tipo === tipo) f = limitar(this.filaManada.f + Math.round((Math.random() - 0.5) * 2), 0, this.filas - 1);
      this.filaManada = tipo === sigue ? { tipo, f: this.filaManada && this.filaManada.tipo === tipo ? this.filaManada.f : f } : null;
      if (!filas.includes(f)) f = filas[0] ?? 0;
    }
    const z = this.crearZombieV2(tipo), p = this.centroCelda(this.cols - 1, f);
    z.x = B.baseX + this.cols * B.celda[0] + 14 + Math.random() * 20; z.y = z.ySuelo = p.y + (Math.random() - 0.5) * 10;
    this.zombies.push(z);
    return z;
  };

  /* ---------- Guardar y seguir ---------- */
  // Foto de la partida: todo lo construido y la gente, cada uno en su puesto (el que está formándose o en camino se
  // guarda ya llegado: en su celda o dentro de su búnker)
  P.fotoV2 = function () {
    const us = [], alBunker = new Map();
    const llega = (tipo, c, f, bunker, vida) => {
      if (bunker && !bunker.quitada) { if (!alBunker.has(bunker)) alBunker.set(bunker, []); alBunker.get(bunker).push({ tipo, vida }); }
      else us.push({ tipo, c, f, vida: vida ?? U_(tipo).vida, listo: true, obra: 1 });
    };
    for (const o of this.colaCuartel) llega(o.tipo, o.c, o.f, o.bunker);
    for (const o of this.colaTaller) us.push({ tipo: o.tipo, c: o.c, f: o.f, vida: U_(o.tipo).vida, listo: true, obra: 1 });
    for (const u of this.unidades) {
      if (u.invisible || !U_(u.tipo)) continue;   // reservas y caídos no se guardan
      if (esInf(u) && (u.destinoBunker || u.esperaBunker)) { llega(u.tipo, u.c, u.f, u.destinoBunker || u.esperaBunker, Math.round(u.vida)); continue; }
      us.push({ tipo: u.tipo, c: u.c, f: u.f, vida: Math.round(u.vida), listo: !!u.listo, obra: u.obra || 0, dentro: (u.dentro || []).map(d => ({ tipo: d.tipo, vida: d.vida })), de: u });
    }
    for (const s of us) { if (s.de && alBunker.has(s.de)) s.dentro = [...s.dentro, ...alBunker.get(s.de)].slice(0, U_('bunker').capacidad); delete s.de; }
    return { version: BastionV2.VERSION, nivel: this.nivelBastion.id, dificultad: this.dificultad.id, ronda: this.ronda, dinero: this.dinero, vidaBase: this.vidaBase,
      bajas: this.bajas || 0, construidas: this.construidas || 0, contagiados: this.contagiados || 0, tiempo: Math.round(this.tiempoJugado), fecha: Date.now(), unidades: us };
  };
  P.guardarPartidaV2 = function () { if (!this.terminado) ProgresoBastion.escribir(BastionV2.PARTIDA, this.fotoV2()); };
  P.restaurarPartidaV2 = function (d) {
    this.unidades = [];
    for (const s of d.unidades) {
      const U = U_(s.tipo); if (!U || !this.dentro(s.c, s.f)) continue;
      const u = this.nuevaUnidadV2(s.tipo, s.c, s.f);
      u.vida = Math.min(U.vida, s.vida ?? U.vida); u.listo = s.listo !== false; u.obra = u.listo ? 1 : s.obra || 0;
      if (u.dentro) { u.dentro = (s.dentro || []).filter(x => U_(x.tipo)).slice(0, U.capacidad).map(x => ({ tipo: x.tipo, vida: x.vida ?? U_(x.tipo).vida, enfriado: Math.random() })); u.adentro = u.dentro.length; }
      this.unidades.push(u);
    }
    this.ronda = d.ronda; this.dinero = d.dinero; this.vidaBase = d.vidaBase; this.bajas = d.bajas || 0; this.construidas = d.construidas || 0; this.contagiados = d.contagiados || 0;
    this.tiempoJugado = d.tiempo || 0; this.enDescanso = true; this.descansoHasta = this.tiempoJugado + BASTION2.descanso;
    this.sinPremioPorAdelantar = true;   // al repetir una oleada, adelantarla no vuelve a pagar (si no, perder a propósito daría plata)
  };
  envolver('oleadaYa', function () {
    if (this.enDescanso && this.sinPremioPorAdelantar) { this.descansoHasta = this.tiempoJugado; return; }
    v1.oleadaYa.call(this);
  });

  /* ---------- El paso de cada cuadro, panel, teclas y dibujo ---------- */
  envolver('moverZombiesBastion', function (dt) { this.hordaV2(dt); });                       // js/bastion-v2-horda.js
  envolver('moverUnidades', function (dt) { this.tropaV2(dt); this.efectosV2(dt); });         // js/bastion-v2-tropa.js
  envolver('panelBastion', function () { if (typeof BastionV2UI !== 'undefined') BastionV2UI.panel(this); });
  // Teclas como el panel: 1 a 4 la infantería, Q W E R los mecanizados, A S D F G las estructuras; Z vende, X repara, C mueve
  const TECLAS = { Digit1: 'soldado', Digit2: 'francotirador', Digit3: 'lanzallamas', Digit4: 'medico', KeyQ: 'torreta', KeyW: 'tanque', KeyE: 'mortero', KeyR: 'antiaerea',
    KeyA: 'muro', KeyS: 'alambrado', KeyD: 'bunker', KeyF: 'senuelo', KeyG: 'vigia', KeyZ: 'vender', KeyX: 'reparar', KeyC: 'mover' };
  BastionV2.TECLAS = TECLAS;
  envolver('teclaBastion', function (codigo) {
    if (TECLAS[codigo]) { this.elegirUnidad(TECLAS[codigo]); return true; }
    if (/^(Digit|Numpad)\d$/.test(codigo)) return true;
    return v1.teclaBastion.call(this, codigo);   // espacio: oleada ya; V: velocidad
  });
  envolver('dibujarUnidad', function (ctx, u) {
    if (!esInf(u) || !u.listo) return v1.dibujarUnidad.call(this, ctx, u);
    ctx.save();
    if (u.llevado) ctx.translate(0, -(u.llevado.altura - 12));   // colgando de las garras del buitre
    if (u.mira === -1) ctx.scale(-1, 1);                          // mira (o camina) hacia la izquierda
    v1.dibujarUnidad.call(this, ctx, u);
    ctx.restore();
  });
  envolver('dibujarBastion', function () {
    const herramienta = this.colocando;
    if (herramienta === 'mover') this.colocando = null;   // el modo de siempre no conoce «mover»: su cursor lo pinta la v2
    try { v1.dibujarBastion.call(this); } finally { this.colocando = herramienta; }
    if (typeof BastionV2Dibujo !== 'undefined') BastionV2Dibujo.encima(this);   // efectos, avisos, anillos y cursores de la v2
  });
})();
