/* ===== Terreno y objetos del mundo =====
 * El mundo es infinito hacia los dos lados y se genera por "trozos" de 1200 px de forma determinista:
 * el mismo trozo siempre tiene lo mismo, sin guardar nada. Casi todo es calle; cada tanto hay una
 * montaña, que es lo único que tiene ametralladora fija y armas especiales.
 */
const ANCHO = 960, ALTO = 540;
const SUELO_BASE = 440;          // y del piso en la calle
const TAMANO_TROZO = 1200;
const ALTURA_MONTANA = 150;
// Geometría de la montaña dentro de su trozo (coordenadas locales)
const MONTANA = { subidaInicio: 180, cimaInicio: 480, cimaFin: 820, bajadaFin: 1080 };

// Azar determinista: el mismo (i, sal) devuelve siempre el mismo número en [0, 1)
function azar(i, sal) {
  let h = (Math.imul(i, 374761393) + Math.imul(sal + 1, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const suavizar = t => t * t * (3 - 2 * t);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

function indiceTrozo(x) { return Math.floor(x / TAMANO_TROZO); }

// Modo del mundo: en el campo de pruebas no hay montañas, es una planicie
const Mundo = { plano: false, interior: false };   // interior: galpón del entrenamiento

// ¿El trozo i es una montaña? Nunca cerca del punto de aparición ni dos montañas seguidas
function esMontana(i) {
  if (Mundo.plano || Math.abs(i) <= 1) return false;
  return azar(i, 1) < 0.3 && azar(i - 1, 1) >= 0.3;
}
function tipoTrozo(i) { return esMontana(i) ? 'montana' : 'calle'; }

// Altura relativa de la montaña (0 a 1) según la x local dentro del trozo
function perfilMontana(local) {
  const m = MONTANA;
  if (local <= m.subidaInicio || local >= m.bajadaFin) return 0;
  if (local < m.cimaInicio) return suavizar((local - m.subidaInicio) / (m.cimaInicio - m.subidaInicio));
  if (local <= m.cimaFin) return 1;
  return suavizar(1 - (local - m.cimaFin) / (m.bajadaFin - m.cimaFin));
}

// Coordenada y del suelo en cualquier x del mundo: lo usan jugador, zombies, cajas y bolas de paja
function alturaSuelo(x) {
  const i = indiceTrozo(x);
  if (!esMontana(i)) return SUELO_BASE;
  return SUELO_BASE - ALTURA_MONTANA * perfilMontana(x - i * TAMANO_TROZO);
}

// Datos de una montaña: dónde va la ametralladora fija y la caja especial
function infoMontana(i) {
  if (!esMontana(i)) return null;
  const x0 = i * TAMANO_TROZO;
  return {
    indice: i,
    x0,
    cimaX0: x0 + MONTANA.cimaInicio,
    cimaX1: x0 + MONTANA.cimaFin,
    cimaY: SUELO_BASE - ALTURA_MONTANA,
    ametralladoraX: x0 + 580,
    cajaX: x0 + 740,
    tieneCaja: azar(i, 2) < 0.75,
    armaEspecial: azar(i, 4) < 0.3 ? ARMAS_LEGENDARIAS[Math.floor(azar(i, 3) * ARMAS_LEGENDARIAS.length)] : ARMAS_ESPECIALES[Math.floor(azar(i, 3) * ARMAS_ESPECIALES.length)],   // 3 de cada 10: una legendaria
  };
}

// Farolas de un trozo de calle
function farolasDeTrozo(i) {
  if (esMontana(i)) return [];
  const x0 = i * TAMANO_TROZO;
  const lista = [];
  for (let k = 0; k < 4; k++) {
    lista.push({
      x: x0 + 120 + k * 320,
      parpadea: azar(i, 10 + k) < 0.3,
      rota: azar(i, 20 + k) < 0.15,
      torcida: (azar(i, 50 + k) - 0.5) * 0.12,   // inclinación en radianes
    });
  }
  return lista;
}

// Chatarra de un trozo: autos destruidos, barriles en llamas, llantas
function chatarraDeTrozo(i) {
  if (esMontana(i)) return [];
  const x0 = i * TAMANO_TROZO;
  const lista = [];
  if (i !== 0 && azar(i, 30) < 0.5) {
    lista.push({ tipo: 'auto', x: x0 + 260 + azar(i, 31) * 700, color: ['#6e2f2a', '#3b4a6b', '#7a7a55', '#4a5a4a'][Math.floor(azar(i, 32) * 4)], volcado: azar(i, 33) < 0.25 });
  }
  if (azar(i, 40) < 0.4) lista.push({ tipo: 'barril', x: x0 + 100 + azar(i, 41) * 1000 });
  if (azar(i, 45) < 0.5) lista.push({ tipo: 'llanta', x: x0 + 60 + azar(i, 46) * 1080 });
  if (azar(i, 47) < 0.3) lista.push({ tipo: 'cartel', x: x0 + 200 + azar(i, 48) * 800, texto: ['PELIGRO', 'ZONA MUERTA', 'NO ENTRAR', 'SALIDA 7'][Math.floor(azar(i, 49) * 4)] });
  return lista;
}

/* ===== Ambiente: periódicos volando, bolas de paja rodando y polvo =====
 * Viven cerca de la cámara; cuando se van lejos reaparecen del lado del viento.
 */
class Ambiente {
  constructor() {
    this.periodicos = [];
    this.bolas = [];
    this.polvo = [];
    this.tiempo = 0;
    this.viento = 1.4;
    for (let k = 0; k < 7; k++) this.periodicos.push(this.nuevoPeriodico(0, true));
    for (let k = 0; k < 2; k++) this.bolas.push(this.nuevaBola(0, true));
    for (let k = 0; k < 40; k++) this.polvo.push({ x: Math.random() * ANCHO, y: Math.random() * ALTO, v: 0.3 + Math.random() * 0.8, t: Math.random() * 10 });
  }

  nuevoPeriodico(camaraX, enPantalla) {
    const x = enPantalla ? camaraX + Math.random() * ANCHO : camaraX - 120 - Math.random() * 300;
    return { x, y: SUELO_BASE - 40 - Math.random() * 200, vx: 1 + Math.random() * 2, vy: 0, rot: Math.random() * 6.28, vrot: (Math.random() - 0.5) * 0.2, fase: Math.random() * 6.28, w: 16 + Math.random() * 10 };
  }

  nuevaBola(camaraX, enPantalla) {
    const x = enPantalla ? camaraX + Math.random() * ANCHO : camaraX - 80 - Math.random() * 400;
    const radio = 14 + Math.random() * 12;
    return { x, y: alturaSuelo(x) - radio, vx: 1.5 + Math.random() * 1.5, vy: 0, rot: 0, radio };
  }

  actualizar(dt, camaraX) {
    this.tiempo += dt;
    this.viento = 1.4 + Math.sin(this.tiempo * 0.35) * 0.9 + Math.sin(this.tiempo * 1.7) * 0.3;
    const paso = dt * 60;

    for (let k = 0; k < this.periodicos.length; k++) {
      const p = this.periodicos[k];
      p.fase += dt * 3;
      p.x += (p.vx + this.viento) * paso;
      p.vy += (Math.sin(p.fase) * 0.25 - 0.02) * paso;   // flota con el viento
      p.vy = limitar(p.vy, -2.5, 2.5);
      p.y += p.vy * paso;
      p.rot += p.vrot * paso;
      const piso = alturaSuelo(p.x) - 4;
      if (p.y > piso) { p.y = piso; p.vy = -Math.abs(p.vy) * 0.6 - 0.8; }
      if (p.y < 60) p.vy += 0.1;
      if (p.x > camaraX + ANCHO + 200) this.periodicos[k] = this.nuevoPeriodico(camaraX, false);
      if (p.x < camaraX - 600) this.periodicos[k] = this.nuevoPeriodico(camaraX, false);
    }

    for (let k = 0; k < this.bolas.length; k++) {
      const b = this.bolas[k];
      b.x += (b.vx + this.viento * 0.8) * paso;
      b.vy += 0.5 * paso;
      b.y += b.vy * paso;
      b.rot += (b.vx + this.viento) / b.radio * paso;
      const piso = alturaSuelo(b.x) - b.radio;
      if (b.y >= piso) { b.y = piso; b.vy = Math.random() < 0.1 ? -4 - Math.random() * 3 : -Math.abs(b.vy) * 0.3; }
      if (b.x > camaraX + ANCHO + 300 || b.x < camaraX - 800) this.bolas[k] = this.nuevaBola(camaraX, false);
    }

    for (const g of this.polvo) {
      g.x += (g.v + this.viento * 0.5) * paso;
      g.t += dt;
      g.y += Math.sin(g.t * 2) * 0.3;
      if (g.x > ANCHO) { g.x = -10; g.y = Math.random() * ALTO; }
    }
  }
}

/* ===== Capas de profundidad =====
 * Lejos: ciudad en ruinas (paralaje 0.3). Medio: ruinas, postes y árboles secos detrás de la
 * vereda (paralaje 0.6). Cerca: alambrado, arbustos y piedras delante de la calle (paralaje 1.35).
 */
const SEGMENTO_CIUDAD = 90, SEGMENTO_RUINAS = 700, SEGMENTO_FRENTE = 400;

// Un edificio por columna de 90 px, solo en algunos tramos para que la ciudad no sea continua
function edificioDeColumna(k) {
  const tramo = Math.floor(k / 14);
  if (azar(tramo, 90) > 0.55) return null;
  const alto = 30 + azar(k, 91) * 130;
  return { x: k * SEGMENTO_CIUDAD, ancho: SEGMENTO_CIUDAD - 6 - azar(k, 92) * 20, alto, roto: azar(k, 93) < 0.5, antena: azar(k, 94) < 0.2 };
}

function ruinasDeSegmento(k) {
  const x0 = k * SEGMENTO_RUINAS;
  const lista = [];
  const r = azar(k, 60);
  if (r < 0.32) {
    lista.push({ tipo: 'casa', x: x0 + 60 + azar(k, 61) * 300, ancho: 130 + azar(k, 62) * 120, alto: 80 + azar(k, 63) * 60, fondo: 34,
      color: ['#8a7560', '#6e5f55', '#7d6a4f', '#5e5a60'][Math.floor(azar(k, 64) * 4)], fuego: azar(k, 65) < 0.3, techoRoto: azar(k, 66) < 0.6 });
  } else if (r < 0.42) {
    lista.push({ tipo: 'gasolinera', x: x0 + 100 + azar(k, 61) * 200 });
  } else if (r < 0.5) {
    lista.push({ tipo: 'tanque', x: x0 + 200 + azar(k, 61) * 300 });
  }
  if (azar(k, 67) < 0.55) lista.push({ tipo: 'poste', x: x0 + 380 + azar(k, 68) * 280 });
  if (azar(k, 69) < 0.4) lista.push({ tipo: 'arbol', x: x0 + azar(k, 70) * 700, alto: 70 + azar(k, 71) * 50 });
  return lista;
}

function frenteDeSegmento(k) {
  const x0 = k * SEGMENTO_FRENTE;
  const lista = [];
  if (azar(k, 80) < 0.7) lista.push({ tipo: 'poste', x: x0 + azar(k, 81) * 400, alto: 46 + azar(k, 82) * 24 });
  if (azar(k, 83) < 0.35) lista.push({ tipo: 'arbusto', x: x0 + azar(k, 84) * 400, r: 14 + azar(k, 85) * 12 });
  if (azar(k, 86) < 0.3) lista.push({ tipo: 'piedra', x: x0 + azar(k, 87) * 400, r: 8 + azar(k, 88) * 10 });
  return lista;
}
