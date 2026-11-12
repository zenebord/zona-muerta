/* ===== Catálogo de armas =====
 * El daño está calibrado contra la vida del zombie en dificultad media (15): pistolas 3 tiros,
 * metralletas 5, rifles / escopetas / ametralladora 1. En fácil el zombie tiene menos vida y
 * caen con menos tiros; en difícil tienen la misma vida que en medio.
 *
 * Recarga de cada arma:
 *   recargaTipo    cargador-pistola | cargador | tambor | tambor-rapido | peine | cerrojo | palanca | cartuchos | quiebre | cinta | granada | ignicion
 *   recargaFinal   qué hace al terminar de poner el cargador: corredera | liberar | palmada | palmada-hk | cerrojo | ninguno
 *   recargaUnidad  qué lleva en la mano: cargador | cargador-curvo | cargador-plano | tambor-cargador | bala | cartucho | peine | speedloader | cinta | granada40 | celda | ignicion
 *   balanceo       el cargador se engancha de adelante hacia atrás (AK, Saiga)
 */
const VIDA_ZOMBIE_NORMAL = 15;

const ARMAS = {
  // --- Pistolas: 3 tiros ---
  glock:    { id: 'glock',    nombre: 'Glock 17',        categoria: 'pistola', dano: 5, cargador: 17, cadencia: 240, recarga: 1300, automatica: false, velocidad: 16, alcance: 620, recargaTipo: 'cargador-pistola', recargaFinal: 'corredera', recargaUnidad: 'cargador', color: '#b0966f' },
  magnum:   { id: 'magnum',   nombre: 'Magnum .44',      categoria: 'pistola', dano: 5, cargador: 6,  cadencia: 380, recarga: 2600, automatica: false, velocidad: 17, alcance: 700, recargaTipo: 'tambor', recargaUnidad: 'bala', color: '#b9b9c4' },
  colt1911: { id: 'colt1911', nombre: 'Colt 1911',       categoria: 'pistola', dano: 5, cargador: 7,  cadencia: 300, recarga: 1250, automatica: false, velocidad: 16, alcance: 600, recargaTipo: 'cargador-pistola', recargaFinal: 'liberar', recargaUnidad: 'cargador', color: '#3b3f44' },
  deagle:   { id: 'deagle',   nombre: 'Desert Eagle',    categoria: 'pistola', dano: 5, cargador: 7,  cadencia: 420, recarga: 1600, automatica: false, velocidad: 18, alcance: 760, recargaTipo: 'cargador-pistola', recargaFinal: 'corredera', recargaUnidad: 'cargador', color: '#c9c6bf' },
  python:   { id: 'python',   nombre: 'Colt Python',     categoria: 'pistola', dano: 5, cargador: 6,  cadencia: 340, recarga: 2000, automatica: false, velocidad: 17, alcance: 700, recargaTipo: 'tambor-rapido', recargaUnidad: 'speedloader', color: '#c4c6ca' },
  beretta92: { id: 'beretta92', nombre: 'Beretta 92FS',  categoria: 'pistola', dano: 5, cargador: 15, cadencia: 250, recarga: 1350, automatica: false, velocidad: 16, alcance: 620, recargaTipo: 'cargador-pistola', recargaFinal: 'corredera', recargaUnidad: 'cargador', color: '#2c2d31' },
  ppk:      { id: 'ppk',      nombre: 'Walther PPK',     categoria: 'pistola', dano: 5, cargador: 7,  cadencia: 230, recarga: 1150, automatica: false, velocidad: 15, alcance: 560, recargaTipo: 'cargador-pistola', recargaFinal: 'liberar', recargaUnidad: 'cargador', color: '#9aa0a8' },
  mauser:   { id: 'mauser',   nombre: 'Mauser C96',      categoria: 'pistola', dano: 5, cargador: 10, cadencia: 260, recarga: 2200, automatica: false, velocidad: 16, alcance: 640, recargaTipo: 'cargador-pistola', recargaFinal: 'corredera', recargaUnidad: 'cargador', color: '#45484f' },

  // --- Metralletas: 5 tiros, automáticas ---
  uzi:      { id: 'uzi',      nombre: 'Uzi',             categoria: 'metralleta', dano: 3, cargador: 32, cadencia: 75,  recarga: 1500, automatica: true, velocidad: 15, alcance: 520, recargaTipo: 'cargador', recargaFinal: 'cerrojo', recargaUnidad: 'cargador', color: '#4a4a52' },
  ak47:     { id: 'ak47',     nombre: 'AK-47',           categoria: 'metralleta', dano: 3, cargador: 30, cadencia: 100, recarga: 1800, automatica: true, velocidad: 16, alcance: 640, recargaTipo: 'cargador', recargaFinal: 'cerrojo', recargaUnidad: 'cargador-curvo', balanceo: true, color: '#7a4a2a' },
  m16:      { id: 'm16',      nombre: 'M16',             categoria: 'metralleta', dano: 3, cargador: 30, cadencia: 85,  recarga: 1600, automatica: true, velocidad: 17, alcance: 680, recargaTipo: 'cargador', recargaFinal: 'palmada', recargaUnidad: 'cargador', color: '#2f3a2f' },
  mp5:      { id: 'mp5',      nombre: 'MP5',             categoria: 'metralleta', dano: 3, cargador: 30, cadencia: 80,  recarga: 1700, automatica: true, velocidad: 15, alcance: 600, recargaTipo: 'cargador', recargaFinal: 'palmada-hk', recargaUnidad: 'cargador-curvo', color: '#2a2a2e' },
  thompson: { id: 'thompson', nombre: 'Thompson M1928',  categoria: 'metralleta', dano: 3, cargador: 50, cadencia: 90,  recarga: 2400, automatica: true, velocidad: 15, alcance: 560, recargaTipo: 'cargador', recargaFinal: 'cerrojo', recargaUnidad: 'tambor-cargador', color: '#6b4a2b' },
  vector:   { id: 'vector',   nombre: 'Kriss Vector',    categoria: 'metralleta', dano: 3, cargador: 25, cadencia: 55,  recarga: 1600, automatica: true, velocidad: 16, alcance: 580, recargaTipo: 'cargador', recargaFinal: 'cerrojo', recargaUnidad: 'cargador', color: '#2b2c2f' },
  p90:      { id: 'p90',      nombre: 'P90',             categoria: 'metralleta', dano: 3, cargador: 50, cadencia: 70,  recarga: 2100, automatica: true, velocidad: 16, alcance: 620, recargaTipo: 'cargador', recargaFinal: 'cerrojo', recargaUnidad: 'cargador-plano', color: '#55585e' },

  // --- Rifles: 1 tiro ---
  remington700: { id: 'remington700', nombre: 'Remington 700', categoria: 'rifle', dano: 15, cargador: 5,  cadencia: 650, recarga: 2600, automatica: false, velocidad: 24, alcance: 1100, recargaTipo: 'cerrojo', recargaUnidad: 'bala', color: '#6b4a2b' },
  barrett:  { id: 'barrett',  nombre: 'Barrett M82',     categoria: 'rifle', dano: 15, cargador: 10, cadencia: 900, recarga: 2600, automatica: false, velocidad: 30, alcance: 1500, perfora: true, recargaTipo: 'cargador', recargaFinal: 'cerrojo', recargaUnidad: 'cargador', color: '#2a2e2a' },
  mosin:    { id: 'mosin',    nombre: 'Mosin-Nagant',    categoria: 'rifle', dano: 15, cargador: 5,  cadencia: 900, recarga: 2400, automatica: false, velocidad: 26, alcance: 1300, recargaTipo: 'peine', recargaUnidad: 'peine', color: '#6a3f1f' },
  garand:   { id: 'garand',   nombre: 'M1 Garand',       categoria: 'rifle', dano: 15, cargador: 8,  cadencia: 380, recarga: 2000, automatica: false, velocidad: 25, alcance: 1150, recargaTipo: 'peine', recargaUnidad: 'peine', color: '#6e3f22' },
  svd:      { id: 'svd',      nombre: 'Dragunov SVD',    categoria: 'rifle', dano: 15, cargador: 10, cadencia: 420, recarga: 2200, automatica: false, velocidad: 27, alcance: 1350, recargaTipo: 'cargador', recargaFinal: 'cerrojo', recargaUnidad: 'cargador-curvo', balanceo: true, color: '#6a3a1e' },
  winchester1894: { id: 'winchester1894', nombre: 'Winchester 1894', categoria: 'rifle', dano: 15, cargador: 8, cadencia: 550, recarga: 3600, automatica: false, velocidad: 22, alcance: 900, recargaTipo: 'palanca', recargaUnidad: 'bala', color: '#7a4a2a' },

  // --- Escopetas: 1 tiro, perdigones de corto alcance ---
  recortada: { id: 'recortada', nombre: 'Escopeta de dos cañones', categoria: 'escopeta', dano: 15, cargador: 2, cadencia: 450, recarga: 1600, automatica: false, velocidad: 14, alcance: 260, perdigones: 7, dispersion: 0.35, recargaTipo: 'quiebre', recargaUnidad: 'cartucho', color: '#74391b' },
  mossberg: { id: 'mossberg', nombre: 'Mossberg 500',    categoria: 'escopeta', dano: 15, cargador: 6,  cadencia: 700, recarga: 2200, automatica: false, velocidad: 15, alcance: 320, perdigones: 6, dispersion: 0.22, recargaTipo: 'cartuchos', recargaUnidad: 'cartucho', color: '#646b7b' },
  spas12:   { id: 'spas12',   nombre: 'SPAS-12',         categoria: 'escopeta', dano: 15, cargador: 8,  cadencia: 400, recarga: 2600, automatica: false, velocidad: 15, alcance: 340, perdigones: 6, dispersion: 0.25, recargaTipo: 'cartuchos', recargaUnidad: 'cartucho', color: '#1e1e22' },
  aa12:     { id: 'aa12',     nombre: 'AA-12',           categoria: 'escopeta', dano: 15, cargador: 20, cadencia: 280, recarga: 2600, automatica: true,  velocidad: 14, alcance: 280, perdigones: 5, dispersion: 0.3,  recargaTipo: 'cargador', recargaFinal: 'cerrojo', recargaUnidad: 'cargador', color: '#2b2f33' },
  saiga:    { id: 'saiga',    nombre: 'Saiga-12',        categoria: 'escopeta', dano: 15, cargador: 8,  cadencia: 350, recarga: 2000, automatica: false, velocidad: 15, alcance: 320, perdigones: 6, dispersion: 0.25, recargaTipo: 'cargador', recargaFinal: 'cerrojo', recargaUnidad: 'cargador', balanceo: true, color: '#2e2a26' },
  benelli:  { id: 'benelli',  nombre: 'Benelli M4',      categoria: 'escopeta', dano: 15, cargador: 7,  cadencia: 300, recarga: 2400, automatica: false, velocidad: 15, alcance: 330, perdigones: 6, dispersion: 0.23, recargaTipo: 'cartuchos', recargaUnidad: 'cartucho', color: '#2a2b2e' },
  rem870:   { id: 'rem870',   nombre: 'Remington 870',   categoria: 'escopeta', dano: 15, cargador: 6,  cadencia: 680, recarga: 2300, automatica: false, velocidad: 15, alcance: 330, perdigones: 6, dispersion: 0.22, recargaTipo: 'cartuchos', recargaUnidad: 'cartucho', color: '#5b3a1e' },
  winchester1887: { id: 'winchester1887', nombre: 'Winchester 1887', categoria: 'escopeta', dano: 15, cargador: 5, cadencia: 650, recarga: 3000, automatica: false, velocidad: 15, alcance: 330, perdigones: 6, dispersion: 0.24, recargaTipo: 'palanca', recargaUnidad: 'cartucho', color: '#6a3f1f' },

  // --- Ametralladora fija: 1 tiro. No se puede llevar: está clavada en las montañas ---
  m2:       { id: 'm2',       nombre: 'M2 Browning .50', categoria: 'ametralladora', dano: 15, cargador: 100, cadencia: 65, recarga: 3200, automatica: true, velocidad: 20, alcance: 1200, fija: true, recargaTipo: 'cinta', recargaUnidad: 'cinta', color: '#333' },

  // --- Armas especiales: solo en las montañas, con munición limitada ---
  m79:      { id: 'm79',      nombre: 'Lanzagranadas M79', categoria: 'lanzagranadas', dano: 15, cargador: 1, cadencia: 800, recarga: 1800, automatica: false, velocidad: 11, alcance: 700, explosivo: true, radio: 110, gravedad: 0.35, reservaInicial: 10, recargaTipo: 'quiebre', recargaUnidad: 'granada40', color: '#8c5a33' },
  bazuca:   { id: 'bazuca',   nombre: 'Bazuca M9', categoria: 'bazuca', dano: 15, cargador: 1, cadencia: 900, recarga: 2400, automatica: false, velocidad: 7, alcance: 1150, explosivo: true, cohete: true, radio: 145, gravedad: 0, reservaInicial: 6, recargaTipo: 'cohete', recargaUnidad: 'cohete', color: '#4b5634' },
  rpg7:     { id: 'rpg7',     nombre: 'RPG-7', categoria: 'bazuca', dano: 15, cargador: 1, cadencia: 900, recarga: 2600, automatica: false, velocidad: 8, alcance: 1100, explosivo: true, cohete: true, radio: 155, gravedad: 0, reservaInicial: 5, colaCm: 133, recargaTipo: 'cohete', recargaUnidad: 'cohete', color: '#5a4a2a' },
  mgl:      { id: 'mgl',      nombre: 'Milkor MGL', categoria: 'lanzagranadas', dano: 15, cargador: 6, cadencia: 450, recarga: 3600, automatica: false, velocidad: 11, alcance: 700, explosivo: true, radio: 100, gravedad: 0.35, reservaInicial: 18, recargaTipo: 'quiebre', recargaUnidad: 'granada40', color: '#a68b69' },
  granadas: { id: 'granadas', nombre: 'Granadas M67',    categoria: 'granada', dano: 15, cargador: 3,  cadencia: 600, recarga: 400,  automatica: false, velocidad: 9,  alcance: 500, explosivo: true, radio: 120, gravedad: 0.45, mecha: 900, reservaInicial: 6, recargaTipo: 'granada', recargaUnidad: 'granada', color: '#3d5a2a' },
  // Lanzallamas M2 (EE. UU., 1943): chorro continuo de corto alcance. Cada llama pega una vez (dano) y prende fuego al
  // zombie, que sigue quemándose quemaSeg segundos (quema por segundo). cargador = descargas; a 50 ms son 7 s de fuego.
  // Lo que se cambia al recargar es el cilindro de ignición de la punta (el combustible va en la mochila).
  lanzallamas: { id: 'lanzallamas', nombre: 'Lanzallamas M2', categoria: 'lanzallamas', fuego: true, dano: 0.4, quema: 4, quemaSeg: 3, llamas: 3, cargador: 140, cadencia: 50, recarga: 2400, automatica: true, velocidad: 8.5, alcance: 330, gravedad: 0.035, reservaInicial: 4, recargaTipo: 'ignicion', recargaFinal: 'ninguno', recargaUnidad: 'ignicion', color: '#4a5532' },
  laser:    { id: 'laser',    nombre: 'Láser alienígena', categoria: 'laser', dano: 15, cargador: 20, cadencia: 220, recarga: 2000, automatica: false, velocidad: 40, alcance: 1400, perfora: true, reservaInicial: 40, recargaTipo: 'cargador', recargaFinal: 'ninguno', recargaUnidad: 'celda', color: '#39ff14' },

  // --- Cuerpo a cuerpo: se empuñan; sin munición ni recarga. alcance en unidades, objetivos = a cuántos pega por golpe ---
  machete:  { id: 'machete',  nombre: 'Machete',          categoria: 'cuerpo', cuerpo: true, unaMano: true, dano: 8,  cadencia: 420, golpe: 360, alcance: 52, objetivos: 2, empuje: 2, filo: true,  cargador: 1, automatica: true, color: '#9aa0a8' },
  katana:   { id: 'katana',   nombre: 'Katana',           categoria: 'cuerpo', cuerpo: true, dano: 10, cadencia: 380, golpe: 330, alcance: 64, objetivos: 2, empuje: 1.5, filo: true, cargador: 1, automatica: true, color: '#c8ccd2' },
  hacha:    { id: 'hacha',    nombre: 'Hacha de bombero', categoria: 'cuerpo', cuerpo: true, dano: 15, cadencia: 720, golpe: 600, alcance: 58, objetivos: 2, empuje: 3, filo: true,  cargador: 1, automatica: true, color: '#b3261e' },
  bate:     { id: 'bate',     nombre: 'Bate con clavos',  categoria: 'cuerpo', cuerpo: true, dano: 8,  cadencia: 520, golpe: 440, alcance: 58, objetivos: 3, empuje: 5, filo: false, cargador: 1, automatica: true, color: '#9b6a3a' },
  mazo:     { id: 'mazo',     nombre: 'Mazo',             categoria: 'cuerpo', cuerpo: true, dano: 15, cadencia: 900, golpe: 760, alcance: 60, objetivos: 3, empuje: 7, filo: false, cargador: 1, automatica: true, color: '#55585e' },

  // --- Legendarias (mitología): golpes con poder. Solo en las montañas ---
  mjolnir:  { id: 'mjolnir',  nombre: 'Mjölnir',              categoria: 'legendaria', cuerpo: true, legendaria: true, poder: 'rayo',  dano: 15, cadencia: 900,  golpe: 620, alcance: 54, objetivos: 3, empuje: 5, filo: false, cargador: 1, automatica: true, color: '#7d8a9a' },
  excalibur: { id: 'excalibur', nombre: 'Excalibur',          categoria: 'legendaria', cuerpo: true, legendaria: true, poder: 'onda',  dano: 15, cadencia: 650,  golpe: 420, alcance: 68, objetivos: 3, empuje: 2, filo: true,  cargador: 1, automatica: true, color: '#e8d27a' },
  tridente: { id: 'tridente', nombre: 'Tridente de Poseidón', categoria: 'legendaria', cuerpo: true, legendaria: true, poder: 'marea', dano: 15, cadencia: 1100, golpe: 640, alcance: 72, objetivos: 3, empuje: 4, filo: true,  cargador: 1, automatica: true, color: '#3fb6c8' },
  egida:    { id: 'egida',    nombre: 'Égida',                categoria: 'legendaria', cuerpo: true, legendaria: true, poder: 'escudo', unaMano: true, dano: 15, cadencia: 500, golpe: 420, alcance: 44, objetivos: 2, empuje: 6, filo: false, cargador: 1, automatica: true, color: '#c7953a' },
  gungnir:  { id: 'gungnir',  nombre: 'Gungnir',              categoria: 'legendaria', cuerpo: true, legendaria: true, poder: 'lanza', unaMano: true, dano: 15, cadencia: 500, golpe: 440, alcance: 74, objetivos: 2, empuje: 3, filo: true,  cargador: 1, automatica: true, color: '#b9c3cf' },
};

// Armas que pueden aparecer en las cajas comunes del camino (las que se llevan en la mano)
const ARMAS_COMUNES = ['glock', 'magnum', 'colt1911', 'deagle', 'python', 'beretta92', 'ppk', 'mauser',
  'uzi', 'ak47', 'm16', 'mp5', 'thompson', 'vector', 'p90',
  'remington700', 'barrett', 'mosin', 'garand', 'svd', 'winchester1894',
  'recortada', 'mossberg', 'spas12', 'aa12', 'saiga', 'benelli', 'rem870', 'winchester1887',
  'machete', 'katana', 'hacha', 'bate', 'mazo'];

// Armas especiales que solo aparecen arriba de las montañas
const ARMAS_ESPECIALES = ['m79', 'mgl', 'bazuca', 'rpg7', 'granadas', 'lanzallamas', 'laser'];
// Legendarias: también en las montañas, en lugar de una especial cada tanto
const ARMAS_LEGENDARIAS = ['mjolnir', 'excalibur', 'tridente', 'egida', 'gungnir'];

// Orden fijo del inventario, para que las teclas 1…0 siempre apunten a la misma arma
const ORDEN_INVENTARIO = [...ARMAS_COMUNES, ...ARMAS_ESPECIALES, ...ARMAS_LEGENDARIAS];

// Ranuras del teclado (1 a 7): cada tecla elige un grupo y, apretada otra vez, recorre sus armas
const GRUPOS_ARMAS = [
  { nombre: 'Pistolas', es: a => a.categoria === 'pistola' },
  { nombre: 'Metralletas', es: a => a.categoria === 'metralleta' },
  { nombre: 'Rifles', es: a => a.categoria === 'rifle' },
  { nombre: 'Escopetas', es: a => a.categoria === 'escopeta' },
  { nombre: 'Especiales', es: a => ARMAS_ESPECIALES.includes(a.id) },
  { nombre: 'Cuerpo a cuerpo', es: a => a.categoria === 'cuerpo' },
  { nombre: 'Legendarias', es: a => a.categoria === 'legendaria' },
];
const grupoDeArma = id => GRUPOS_ARMAS.findIndex(g => g.es(ARMAS[id]));

const ARMA_FIJA = ARMAS.m2;
const ARMA_INICIAL = 'glock';

const NOMBRE_CATEGORIA = {
  pistola: 'Pistola', metralleta: 'Metralleta', rifle: 'Rifle', escopeta: 'Escopeta',
  ametralladora: 'Ametralladora', lanzagranadas: 'Lanzagranadas', bazuca: 'Bazuca', granada: 'Granada', lanzallamas: 'Lanzallamas', laser: 'Láser',
  cuerpo: 'Cuerpo a cuerpo', legendaria: 'Legendaria',
};

// Lanzallamas: segundos de fuego para matar un zombie (la mitad de las llamas le pega, más la quema), redondeado a décimas
function segundosParaMatarFuego(arma, vidaZombie = VIDA_ZOMBIE_NORMAL) {
  const porSegundo = arma.dano * arma.llamas * 1000 / arma.cadencia * 0.5 + arma.quema;
  return Math.round(vidaZombie / porSegundo * 10) / 10;
}
// Cuántos tiros hacen falta para matar un zombie con esa arma, según la vida que tenga en la dificultad elegida
function disparosParaMatar(arma, vidaZombie = VIDA_ZOMBIE_NORMAL) {
  return Math.ceil(vidaZombie / arma.dano);
}
