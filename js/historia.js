/* ===== Modo historia: «Camino a casa» =====
 * El avión del protagonista cae a 100 km de su casa cuando aparecen los zombies. Tiene que cruzar cuatro niveles,
 * de izquierda a derecha como en los juegos de plataformas de antes, para volver con su hija:
 *   1. Los restos del vuelo 214 (km 100 → 75): el bosque donde cayó el avión, al amanecer.
 *   2. La ruta 9 (km 75 → 45): la carretera trabada de autos abandonados, a la tarde.
 *   3. La ciudad (km 45 → 15): el centro en ruinas, de noche.
 *   4. Tu barrio (km 15 → 0): las casas de su calle, al amanecer; termina en la puerta de su casa.
 * En el camino hay corazones (curan) y radios (cada una es un ataque aéreo para pedir con la A). Al terminar
 * cada nivel se muestra un resumen de lo que hizo; entre niveles, viñetas al estilo de los juegos de 8 bits.
 * Las armas y la munición pasan de un nivel al siguiente; si muere, reintenta el nivel con lo que tenía al empezarlo.
 */

const NIVELES_HISTORIA = [
  // Nivel 1: terreno caótico con desniveles. Tramos [desde, hasta, altura al empezar, altura al terminar, tipo]
  // (px sobre el piso; negativa = cráter). Hay zombies dormidos que se despiertan al ver al jugador.
  { clave: 'avion',  kmDesde: 100, kmHasta: 75, largo: 4600, intervalo: [4.5, 6.5], maxVivos: 4,  corredores: 0,    grupo: 1,
    cajas: [[1440, 'mossberg'], [3100, 'uzi']], corazones: [1520, 2200, 3730, 4250], radios: [1050],
    terreno: [
      [0, 300, 0, 0, 'suelo'], [300, 420, 40, 40, 'escombro'], [420, 520, 0, 0, 'suelo'], [520, 700, -40, -40, 'pozo'],
      [700, 780, 0, 0, 'suelo'], [780, 880, 0, 60, 'escalera'], [880, 1180, 60, 60, 'fuselaje'], [1180, 1400, 0, 0, 'suelo'],
      [1400, 1480, 50, 50, 'cajas'], [1480, 1560, 90, 90, 'cajas'], [1560, 1700, 0, 0, 'suelo'], [1700, 1820, 35, 35, 'escombro'],
      [1820, 1900, 0, 0, 'suelo'], [1900, 2150, 0, 70, 'ala'], [2150, 2250, 70, 70, 'ala'], [2250, 2400, 0, 0, 'suelo'],
      [2400, 2600, -50, -50, 'pozo'], [2600, 2700, 45, 45, 'escombro'], [2700, 2900, 0, 0, 'suelo'], [2900, 2980, 0, 60, 'escalera'],
      [2980, 3300, 60, 60, 'fuselaje'], [3300, 3380, 60, 0, 'escalera'], [3380, 3600, 0, 0, 'suelo'], [3600, 3700, 50, 50, 'escombro'],
      [3700, 3760, 80, 80, 'escombro'], [3760, 3900, 0, 0, 'suelo'], [3900, 4100, -40, -40, 'pozo'], [4100, 4800, 0, 0, 'suelo'],
    ],
    dormidos: [360, 610, 950, 1120, 1450, 1760, 2200, 2500, 3050, 3200, 3650, 3735, 4000, 4300] },
  { clave: 'ruta',   kmDesde: 75,  kmHasta: 45, largo: 5400, intervalo: [2.0, 3.0], maxVivos: 7,  corredores: 0.15, grupo: 2,
    cajas: [[1200, 'ak47'], [2900, 'rem870'], [4300, 'm16']], corazones: [1500, 3300, 4800], radios: [2500] },
  { clave: 'ciudad', kmDesde: 45,  kmHasta: 15, largo: 6200, intervalo: [1.6, 2.4], maxVivos: 9,  corredores: 0.25, grupo: 3,
    cajas: [[1000, 'spas12'], [2600, 'm79', true], [4100, 'mp5']], corazones: [1800, 3500, 5300], radios: [1400, 4600] },
  { clave: 'barrio', kmDesde: 15,  kmHasta: 0,  largo: 6800, intervalo: [1.3, 2.0], maxVivos: 11, corredores: 0.35, grupo: 3,
    cajas: [[1200, 'thompson'], [3000, 'aa12'], [4800, 'mgl', true]], corazones: [1600, 3300, 5000, 6200], radios: [2200, 5600] },
];
const INICIO_HISTORIA = 600;   // x donde arranca cada nivel

// Altura del piso (px hacia arriba) en cada x según los tramos del nivel: escalones de 12 px en las escaleras,
// subida pareja en el ala (rampa), altura fija en lo demás
function perfilTerreno(tramos, x0) {
  return x => {
    const d = x - x0;
    for (const [a, b, h0, h1, tipo] of tramos) {
      if (d < a || d >= b) continue;
      if (h0 === h1) return h0;
      const f = (d - a) / (b - a);
      if (tipo === 'escalera') { const n = Math.max(1, Math.round(Math.abs(h1 - h0) / 12)); return h0 + (h1 - h0) * Math.min(n, Math.floor(f * n) + (h1 > h0 ? 1 : 0)) / n; }
      return h0 + (h1 - h0) * f;
    }
    return 0;
  };
}

// Textos del modo historia en los tres idiomas (se suman a los de idioma.js)
Object.assign(TEXTOS.es, {
  'menu.historia': 'HISTORIA: CAMINO A CASA',
  'hist.nivel1': 'Los restos del vuelo 214', 'hist.nivel2': 'La ruta 9', 'hist.nivel3': 'La ciudad', 'hist.nivel4': 'Tu barrio',
  'hist.intro1': 'Una noche de noviembre, un virus convirtió a millones de personas en zombies. Tú volvías a casa en el último vuelo que salió de la capital.',
  'hist.intro2': 'A mitad del viaje, un pasajero infectado atacó a la tripulación. El avión perdió el control y cayó en medio del bosque.',
  'hist.intro3': 'Despiertas entre los restos. De milagro, estás vivo. El teléfono marca 100 kilómetros hasta tu casa.',
  'hist.intro4': 'Allá te espera tu hija, escondida en su cuarto. Le prometiste que volverías. Tienes que cumplirlo.',
  'hist.antes1': 'Abre camino entre los restos del avión. Los pasajeros ya no son pasajeros.',
  'hist.antes2': 'La carretera está trabada de autos abandonados. Los que intentaron huir no llegaron lejos.',
  'hist.antes3': 'Hay que cruzar la ciudad de noche. Es el camino más corto... y el más peligroso.',
  'hist.antes4': 'Ya ves tu calle. En tu casa, la luz del cuarto de tu hija sigue prendida. Un último esfuerzo.',
  'hist.final': v => `Abres la puerta. Tu hija corre a abrazarte. Recorriste 100 kilómetros y venciste a ${v.bajas} zombies para cumplir tu promesa. Estás en casa.`,
  'hist.fin': 'FIN', 'hist.gracias': '¡Gracias por jugar!',
  'hist.nivelN': v => `NIVEL ${v.n} DE 4`, 'hist.km': v => `KM ${v.desde} → ${v.hasta}`,
  'hist.superado': v => `¡NIVEL ${v.n} SUPERADO!`,
  'hist.resumen': v => `${v.que} Avanzaste ${v.km} km en ${v.tiempo} y eliminaste a ${v.bajas} zombies.` +
    (v.corazones ? ` Recogiste ${v.corazones} ${v.corazones === 1 ? 'corazón' : 'corazones'}.` : '') +
    (v.aereos ? ` Pediste ${v.aereos} ${v.aereos === 1 ? 'ataque aéreo' : 'ataques aéreos'}.` : '') +
    (v.armas ? ` Encontraste: ${v.armas}.` : ''),
  'hist.que1': 'Saliste de entre los restos del avión y dejaste atrás el bosque.',
  'hist.que2': 'Cruzaste la ruta 9 esquivando autos y zombies hasta la entrada de la ciudad.',
  'hist.que3': 'Atravesaste la ciudad en ruinas en plena noche.',
  'hist.que4': 'Llegaste a tu calle y a la puerta de tu casa.',
  'hist.siguiente': v => `Siguiente: ${v.nombre} (km ${v.km})`,
  'hist.dato.bajas': 'Zombies', 'hist.dato.tiempo': 'Tiempo', 'hist.dato.vida': 'Vida', 'hist.dato.armas': 'Armas', 'hist.dato.corazones': 'Corazones', 'hist.dato.radios': 'Radios',
  'hist.boton.seguir': 'SIGUIENTE ▶', 'hist.boton.saltar': 'SALTAR', 'hist.boton.jugar': 'JUGAR ▶', 'hist.boton.menu': 'MENÚ',
  'hist.boton.continuar': v => `CONTINUAR: NIVEL ${v.n}`, 'hist.boton.nueva': 'EMPEZAR DE NUEVO',
  'hist.pista': 'Enter o toca para seguir',
  'hist.hud.nivel': v => `NIVEL ${v.n}/4`, 'hist.hud.faltan': v => `🏠 Faltan ${v.km} km`, 'hist.hud.modo': 'HISTORIA · ',
  'hist.aviso.inicio': v => `${v.nombre.toUpperCase()} · AVANZA HACIA LA DERECHA →`,
  'hist.aviso.corazon': '❤ +30 DE VIDA', 'hist.aviso.radio': '📻 RADIO: ATAQUE AÉREO DISPONIBLE (A)', 'hist.aviso.sinRadio': 'NECESITAS UNA RADIO 📻 PARA PEDIR UN ATAQUE AÉREO',
  'hist.aereo.cargas': v => `📻 × ${v.n} · ${v.tecla}`, 'hist.aereo.busca': 'BUSCA UNA RADIO 📻',
  'hist.cartel': v => `KM ${v.km}`, 'hist.casa': 'CASA',
  'hist.muerto': 'CAÍSTE EN EL CAMINO', 'hist.muertoDetalle': v => `Nivel ${v.n}: ${v.nombre}. Quedaban ${v.km} km para llegar a casa. Eliminaste ${v.bajas} zombies. Puedes reintentar el nivel con las armas que tenías al empezarlo.`,
});
Object.assign(TEXTOS.pt, {
  'menu.historia': 'HISTÓRIA: CAMINHO DE CASA',
  'hist.nivel1': 'Os destroços do voo 214', 'hist.nivel2': 'A rodovia 9', 'hist.nivel3': 'A cidade', 'hist.nivel4': 'Seu bairro',
  'hist.intro1': 'Numa noite de novembro, um vírus transformou milhões de pessoas em zumbis. Você voltava para casa no último voo que saiu da capital.',
  'hist.intro2': 'No meio da viagem, um passageiro infectado atacou a tripulação. O avião perdeu o controle e caiu no meio da floresta.',
  'hist.intro3': 'Você acorda entre os destroços. Por milagre, está vivo. O celular marca 100 quilômetros até a sua casa.',
  'hist.intro4': 'Lá a sua filha espera, escondida no quarto. Você prometeu que voltaria. Precisa cumprir.',
  'hist.antes1': 'Abra caminho entre os destroços do avião. Os passageiros já não são passageiros.',
  'hist.antes2': 'A rodovia está travada de carros abandonados. Quem tentou fugir não foi longe.',
  'hist.antes3': 'É preciso cruzar a cidade de noite. É o caminho mais curto... e o mais perigoso.',
  'hist.antes4': 'Você já vê a sua rua. Na sua casa, a luz do quarto da sua filha continua acesa. Um último esforço.',
  'hist.final': v => `Você abre a porta. Sua filha corre para abraçar você. Você percorreu 100 quilômetros e venceu ${v.bajas} zumbis para cumprir a promessa. Está em casa.`,
  'hist.fin': 'FIM', 'hist.gracias': 'Obrigado por jogar!',
  'hist.nivelN': v => `NÍVEL ${v.n} DE 4`, 'hist.km': v => `KM ${v.desde} → ${v.hasta}`,
  'hist.superado': v => `NÍVEL ${v.n} CONCLUÍDO!`,
  'hist.resumen': v => `${v.que} Você avançou ${v.km} km em ${v.tiempo} e eliminou ${v.bajas} zumbis.` +
    (v.corazones ? ` Pegou ${v.corazones} ${v.corazones === 1 ? 'coração' : 'corações'}.` : '') +
    (v.aereos ? ` Pediu ${v.aereos} ${v.aereos === 1 ? 'ataque aéreo' : 'ataques aéreos'}.` : '') +
    (v.armas ? ` Encontrou: ${v.armas}.` : ''),
  'hist.que1': 'Você saiu dos destroços do avião e deixou a floresta para trás.',
  'hist.que2': 'Você cruzou a rodovia 9 desviando de carros e zumbis até a entrada da cidade.',
  'hist.que3': 'Você atravessou a cidade em ruínas no meio da noite.',
  'hist.que4': 'Você chegou à sua rua e à porta da sua casa.',
  'hist.siguiente': v => `Próximo: ${v.nombre} (km ${v.km})`,
  'hist.dato.bajas': 'Zumbis', 'hist.dato.tiempo': 'Tempo', 'hist.dato.vida': 'Vida', 'hist.dato.armas': 'Armas', 'hist.dato.corazones': 'Corações', 'hist.dato.radios': 'Rádios',
  'hist.boton.seguir': 'SEGUIR ▶', 'hist.boton.saltar': 'PULAR', 'hist.boton.jugar': 'JOGAR ▶', 'hist.boton.menu': 'MENU',
  'hist.boton.continuar': v => `CONTINUAR: NÍVEL ${v.n}`, 'hist.boton.nueva': 'COMEÇAR DE NOVO',
  'hist.pista': 'Enter ou toque para seguir',
  'hist.hud.nivel': v => `NÍVEL ${v.n}/4`, 'hist.hud.faltan': v => `🏠 Faltam ${v.km} km`, 'hist.hud.modo': 'HISTÓRIA · ',
  'hist.aviso.inicio': v => `${v.nombre.toUpperCase()} · AVANCE PARA A DIREITA →`,
  'hist.aviso.corazon': '❤ +30 DE VIDA', 'hist.aviso.radio': '📻 RÁDIO: ATAQUE AÉREO DISPONÍVEL (A)', 'hist.aviso.sinRadio': 'VOCÊ PRECISA DE UM RÁDIO 📻 PARA PEDIR UM ATAQUE AÉREO',
  'hist.aereo.cargas': v => `📻 × ${v.n} · ${v.tecla}`, 'hist.aereo.busca': 'PROCURE UM RÁDIO 📻',
  'hist.cartel': v => `KM ${v.km}`, 'hist.casa': 'CASA',
  'hist.muerto': 'VOCÊ CAIU NO CAMINHO', 'hist.muertoDetalle': v => `Nível ${v.n}: ${v.nombre}. Faltavam ${v.km} km para chegar em casa. Você eliminou ${v.bajas} zumbis. Pode repetir o nível com as armas que tinha ao começar.`,
});
Object.assign(TEXTOS.en, {
  'menu.historia': 'STORY: THE WAY HOME',
  'hist.nivel1': 'The wreck of flight 214', 'hist.nivel2': 'Route 9', 'hist.nivel3': 'The city', 'hist.nivel4': 'Your neighborhood',
  'hist.intro1': 'One November night, a virus turned millions of people into zombies. You were flying home on the last plane out of the capital.',
  'hist.intro2': 'Halfway there, an infected passenger attacked the crew. The plane lost control and went down in the middle of the forest.',
  'hist.intro3': 'You wake up among the wreckage. Somehow, you are alive. Your phone says home is 100 kilometers away.',
  'hist.intro4': 'Your daughter is waiting there, hiding in her room. You promised her you would come back. You have to keep that promise.',
  'hist.antes1': 'Fight your way through the wreckage of the plane. The passengers are not passengers anymore.',
  'hist.antes2': 'The highway is jammed with abandoned cars. The ones who tried to run did not get far.',
  'hist.antes3': 'You have to cross the city at night. It is the shortest way... and the most dangerous.',
  'hist.antes4': 'You can see your street. At home, the light in your daughter\'s room is still on. One last push.',
  'hist.final': v => `You open the door. Your daughter runs into your arms. You crossed 100 kilometers and beat ${v.bajas} zombies to keep your promise. You are home.`,
  'hist.fin': 'THE END', 'hist.gracias': 'Thanks for playing!',
  'hist.nivelN': v => `LEVEL ${v.n} OF 4`, 'hist.km': v => `KM ${v.desde} → ${v.hasta}`,
  'hist.superado': v => `LEVEL ${v.n} CLEARED!`,
  'hist.resumen': v => `${v.que} You covered ${v.km} km in ${v.tiempo} and took down ${v.bajas} zombies.` +
    (v.corazones ? ` You picked up ${v.corazones} ${v.corazones === 1 ? 'heart' : 'hearts'}.` : '') +
    (v.aereos ? ` You called ${v.aereos} ${v.aereos === 1 ? 'air strike' : 'air strikes'}.` : '') +
    (v.armas ? ` You found: ${v.armas}.` : ''),
  'hist.que1': 'You climbed out of the wreckage and left the forest behind.',
  'hist.que2': 'You crossed route 9, dodging cars and zombies, up to the edge of the city.',
  'hist.que3': 'You crossed the ruined city in the middle of the night.',
  'hist.que4': 'You reached your street and the door of your house.',
  'hist.siguiente': v => `Next: ${v.nombre} (km ${v.km})`,
  'hist.dato.bajas': 'Zombies', 'hist.dato.tiempo': 'Time', 'hist.dato.vida': 'Health', 'hist.dato.armas': 'Weapons', 'hist.dato.corazones': 'Hearts', 'hist.dato.radios': 'Radios',
  'hist.boton.seguir': 'NEXT ▶', 'hist.boton.saltar': 'SKIP', 'hist.boton.jugar': 'PLAY ▶', 'hist.boton.menu': 'MENU',
  'hist.boton.continuar': v => `CONTINUE: LEVEL ${v.n}`, 'hist.boton.nueva': 'START OVER',
  'hist.pista': 'Press Enter or tap to continue',
  'hist.hud.nivel': v => `LEVEL ${v.n}/4`, 'hist.hud.faltan': v => `🏠 ${v.km} km to go`, 'hist.hud.modo': 'STORY · ',
  'hist.aviso.inicio': v => `${v.nombre.toUpperCase()} · HEAD RIGHT →`,
  'hist.aviso.corazon': '❤ +30 HEALTH', 'hist.aviso.radio': '📻 RADIO: AIR STRIKE READY (A)', 'hist.aviso.sinRadio': 'YOU NEED A RADIO 📻 TO CALL AN AIR STRIKE',
  'hist.aereo.cargas': v => `📻 × ${v.n} · ${v.tecla}`, 'hist.aereo.busca': 'FIND A RADIO 📻',
  'hist.cartel': v => `KM ${v.km}`, 'hist.casa': 'HOME',
  'hist.muerto': 'YOU FELL ON THE WAY', 'hist.muertoDetalle': v => `Level ${v.n}: ${v.nombre}. You were ${v.km} km from home. You took down ${v.bajas} zombies. You can retry the level with the weapons you had when it started.`,
});

/* ---------- Corazones y radios que se recogen en el camino ---------- */
class RecogibleHistoria {
  constructor(x, tipo) {
    this.x = x; this.y = alturaSuelo(x); this.tipo = tipo; this.t = Math.random() * 6;
    this.vivo = true; this.especial = true;   // «especial»: no se borra aunque quede lejos
  }
  actualizar(dt) { this.t += dt; }
  tocaA(j) { return Math.abs(j.x - this.x) < 26 && Math.abs(j.y - this.y) < 60; }
  alRecoger(juego) {
    const j = juego.jugador, H = juego.historia;
    if (this.tipo === 'corazon') { j.vida = Math.min(j.vidaMax, j.vida + 30); H.corazones++; juego.aviso(t('hist.aviso.corazon'), 1600); }
    else { juego.aereo.cargas++; H.radios++; juego.aviso(t('hist.aviso.radio'), 2600); }
    Audio_.recoger();
    for (let k = 0; k < 10; k++) juego.particulas.push(new Particula(this.x, this.y - 30, (Math.random() - 0.5) * 3, -1 - Math.random() * 2.5, this.tipo === 'corazon' ? '#ff4d6d' : '#8fe07a', 0.7, 3, 0));
  }
  dibujar(ctx, camaraX) {
    const sx = this.x - camaraX, flote = Math.sin(this.t * 3) * 4, y = this.y - 34 + flote;
    sombraElipse(ctx, sx, this.y + 2, 14, 4, 0.28);
    ctx.save(); ctx.translate(sx, y);
    const brillo = 10 + Math.sin(this.t * 5) * 5;
    if (this.tipo === 'corazon') {
      // Corazón de píxeles grandes, como en los juegos de antes
      ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = brillo;
      const P = ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000'], s = 3;
      for (let f = 0; f < P.length; f++) for (let c = 0; c < 8; c++) if (P[f][c] === '1') {
        ctx.fillStyle = f < 2 && c > 0 && c < 3 ? '#ffb3c1' : f > 4 ? '#b0142f' : '#e8203f';
        ctx.fillRect(-12 + c * s, -10 + f * s, s, s);
      }
    } else {
      // Radio transmisor: cuerpo verde oliva, antena, parlante y luz que titila
      ctx.shadowColor = '#8fe07a'; ctx.shadowBlur = brillo;
      ctx.fillStyle = '#3d4a2a'; ctx.fillRect(-8, -10, 16, 22);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#56653c'; ctx.fillRect(-7, -9, 14, 3);
      ctx.fillStyle = '#1d2216'; ctx.fillRect(-2, -24, 2, 14);
      ctx.fillStyle = '#1d2216'; for (let k = 0; k < 4; k++) ctx.fillRect(-5, -2 + k * 3, 10, 1.4);
      ctx.fillStyle = Math.sin(this.t * 8) > 0 ? '#9dff6a' : '#2f5a1c'; ctx.fillRect(3, -8, 3, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-22, -40, 44, 13);
      ctx.fillStyle = '#9dff6a'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('RADIO', 0, -30);
    }
    ctx.restore();
  }
}

/* ---------- La partida en modo historia (se suma a Juego) ---------- */
Object.assign(Juego.prototype, {
  prepararHistoria(op) {
    const n = op.nivel, def = NIVELES_HISTORIA[n - 1], j = this.jugador;
    this.historia = { n, def, inicio: INICIO_HISTORIA, meta: INICIO_HISTORIA + def.largo, corazones: 0, radios: 0, aereos: 0, armas: [], bajasTotal: (op.estado && op.estado.bajasTotal) || 0, tiempoTotal: (op.estado && op.estado.tiempoTotal) || 0 };
    Mundo.plano = true; Mundo.carriles = false; Mundo.interior = false;
    Mundo.perfil = def.terreno ? perfilTerreno(def.terreno, INICIO_HISTORIA) : null;
    j.aTierra = true;                                       // el ataque aéreo lo pasa cuerpo a tierra
    // Armas y munición que trae del nivel anterior
    const e = op.estado;
    if (e && e.inventario) {
      j.inventario = e.inventario.slice(); j.municion = { ...j.municion, ...e.municion }; j.reserva = { ...j.reserva, ...e.reserva };
      j.indiceArma = Math.min(e.indice || 0, j.inventario.length - 1);
    }
    // Ataque aéreo: solo con radios (cada una es un pedido)
    this.aereo = { listoEn: 0, activo: null, recarga: 0, cargas: 0 };
    this.misiles = []; this.aviones = []; this.hud.aereo = document.getElementById('hud-aereo');
    document.getElementById('hud-aereo').classList.remove('oculta');
    this.enDescanso = false; this.porAparecer = Infinity; this.descansoHasta = Infinity;
    this.proximoZombie = 1.2; this.proximaCaja = Infinity;
    const x0 = this.historia.inicio;
    for (const [dx, id, especial] of def.cajas) { const c = new Caja(x0 + dx, id, !!especial); c.historia = true; this.cajas.push(c); }
    for (const dx of def.corazones) this.cajas.push(new RecogibleHistoria(x0 + dx, 'corazon'));
    for (const dx of def.radios) this.cajas.push(new RecogibleHistoria(x0 + dx, 'radio'));
    // Zombies dormidos donde dice el nivel; si no tiene, dos esperando adelante para arrancar
    if (def.dormidos) for (const dx of def.dormidos) this.zombies.push(new Zombie(x0 + dx, false, this.dificultad).dormir());
    else for (const dx of [700, 1000]) this.zombies.push(new Zombie(x0 + dx, false, this.dificultad));
    this.camaraX = j.x - ANCHO / 2;
  },

  nombreNivel(n) { return t('hist.nivel' + n); },

  // Zombies que aparecen adelante (y a veces atrás) a medida que avanza; nunca después de la meta
  aparecerZombiesHistoria(dt) {
    const H = this.historia, d = H.def, j = this.jugador;
    this.proximoZombie -= dt;
    const despiertos = this.zombies.filter(z => z.estado !== 'muerto' && !z.dormido).length;   // los dormidos no cuentan
    if (this.proximoZombie > 0 || despiertos >= d.maxVivos) return;
    const avance = limitar((j.x - H.inicio) / d.largo, 0, 1);
    this.proximoZombie = (d.intervalo[0] + Math.random() * (d.intervalo[1] - d.intervalo[0])) * (1 - avance * 0.25);
    const grupo = 1 + Math.floor(Math.random() * d.grupo);
    for (let k = 0; k < grupo; k++) {
      const atras = Math.random() < 0.15 && j.x > H.inicio + ANCHO;
      const x = atras ? this.camaraX - 60 - Math.random() * 160 : this.camaraX + ANCHO + 60 + Math.random() * 260;
      if (x > H.meta - 120) continue;
      this.zombies.push(new Zombie(x, Math.random() < d.corredores, this.dificultad));
    }
  },

  // Bordes del nivel, cámara y llegada a la meta
  actualizarHistoria() {
    const H = this.historia, j = this.jugador;
    if (j.x < H.inicio - 80) j.x = H.inicio - 80;
    if (j.x > H.meta + 30) j.x = H.meta + 30;
    this.camaraX = Math.max(this.camaraX, H.inicio - ANCHO * 0.35);
    if (!this.terminado && !j.muerto && j.x >= H.meta - 6) {
      this.terminado = true; this.resultado = 'nivel-superado';
      H.bajasTotal += this.bajas; H.tiempoTotal += this.tiempoJugado;
      Audio_.rondaSuperada(); Musica.detener(0.6);
    }
  },

  // Lo que se lleva al nivel siguiente (o con lo que reintenta)
  estadoHistoria() {
    const j = this.jugador, H = this.historia;
    return { inventario: j.inventario.slice(), municion: { ...j.municion }, reserva: { ...j.reserva }, indice: j.indiceArma, bajasTotal: H.bajasTotal, tiempoTotal: H.tiempoTotal };
  },

  kmRestantes() {
    const H = this.historia, d = H.def, avance = limitar((this.jugador.x - H.inicio) / d.largo, 0, 1);
    return Math.max(0, Math.round(d.kmDesde - (d.kmDesde - d.kmHasta) * avance));
  },

  hudHistoria() {
    const H = this.historia, h = this.hud;
    h.ronda.innerHTML = `${t('hist.hud.nivel', { n: H.n })}<small>${this.nombreNivel(H.n)}</small>`;
    const avance = limitar((this.jugador.x - H.inicio) / H.def.largo, 0, 1), llenos = Math.round(avance * 10);
    h.mision.classList.add('activa');
    h.mision.innerHTML = `${t('hist.hud.faltan', { km: this.kmRestantes() })} · <span class="progreso">${'▰'.repeat(llenos)}${'▱'.repeat(10 - llenos)}</span>`;
  },
});

/* ---------- Viñetas al estilo de los juegos de 8 bits ----------
 * Se dibujan en un lienzo de 320×180 con rectángulos enteros y se agrandan sin suavizar, así se ven los píxeles. */
const Vinetas = (() => {
  const W = 320, H = 180;
  const t2 = (clave, v) => t(clave, v);   // dentro de las escenas, «t» es el tiempo
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const bandas = (c, colores, y0, y1) => { const paso = (y1 - y0) / colores.length; colores.forEach((col, k) => R(c, 0, y0 + k * paso, W, paso + 1, col)); };
  const estrellas = (c, n, alto, t) => { for (let k = 0; k < n; k++) { const x = azar(k, 501) * W, y = azar(k, 502) * alto; if (Math.sin(t * 3 + k) > -0.6) R(c, x, y, 1, 1, k % 5 ? '#d8d8f0' : '#fff6c0'); } };
  const luna = (c, x, y, r) => { for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); R(c, x - w, y + dy, w * 2, 1, '#f2ecc8'); } R(c, x + 2, y - 2, 3, 2, '#d8d0a6'); R(c, x - 4, y + 3, 2, 2, '#d8d0a6'); };
  const sol = (c, x, y, r, col) => { for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); R(c, x - w, y + dy, w * 2, 1, col); } };
  const pino = (c, x, base, h, col) => { for (let k = 0; k < h; k += 2) { const w = Math.round((k / h) * h * 0.45) + 1; R(c, x - w, base - h + k, w * 2 + 1, 2, col); } R(c, x - 1, base, 3, 3, '#2a1a10'); };
  const fuego = (c, x, y, t, s = 1) => { for (let k = 0; k < 6; k++) { const f = Math.sin(t * 9 + k * 1.7); R(c, x + (k - 3) * 2 * s, y - (4 + f * 2 + (k % 3) * 2) * s, 2 * s, (4 + f * 2 + (k % 3) * 2) * s, k % 2 ? '#ffb02e' : '#ff5a1f'); } R(c, x - 3 * s, y - 2 * s, 6 * s, 2 * s, '#fff07a'); };
  const humo = (c, x, y, t, n = 6) => { for (let k = 0; k < n; k++) { const f = ((t * 0.4 + k / n) % 1); const r = 2 + f * 6; R(c, x + Math.sin(k + t) * 3 + f * 10 - r, y - f * 50 - r, r * 2, r * 2, f < 0.5 ? 'rgba(70,64,70,0.85)' : 'rgba(110,104,110,0.6)'); } };
  // Personaje en píxeles: el padre (con mochila y gorra) o la hija (pelo largo, vestido)
  const padre = (c, x, y, t = 0, camina = false) => {
    const p = camina ? Math.round(Math.sin(t * 8)) : 0;
    R(c, x - 2, y - 3, 2, 3 + p, '#2b2e24'); R(c, x + 1, y - 3, 2, 3 - p, '#2b2e24');           // piernas
    R(c, x - 3, y - 9, 6, 6, '#4f6a3a'); R(c, x - 5, y - 9, 2, 5, '#3a4a2a');                  // torso y mochila
    R(c, x + 3, y - 8, 3, 2, '#d9a273');                                                         // brazo
    R(c, x - 2, y - 13, 5, 4, '#d9a273'); R(c, x - 3, y - 14, 6, 2, '#1e1e1e'); R(c, x + 2, y - 13, 3, 1, '#1e1e1e');   // cabeza y gorra
  };
  const hija = (c, x, y) => {
    R(c, x - 1, y - 2, 1, 2, '#3a2a20'); R(c, x + 1, y - 2, 1, 2, '#3a2a20');
    R(c, x - 2, y - 7, 5, 5, '#e05a8a'); R(c, x - 3, y - 4, 7, 2, '#e05a8a');                   // vestido
    R(c, x - 1, y - 10, 3, 3, '#f0c49a'); R(c, x - 2, y - 11, 5, 2, '#6a3a1a'); R(c, x - 2, y - 10, 1, 4, '#6a3a1a'); R(c, x + 2, y - 10, 1, 4, '#6a3a1a');
  };
  const zombie = (c, x, y, t) => { const p = Math.round(Math.sin(t * 4 + x)); R(c, x - 2, y - 3, 2, 3, '#2a2a40'); R(c, x + 1, y - 3, 2, 3 + p, '#2a2a40'); R(c, x - 2, y - 9, 5, 6, '#3d5a8a'); R(c, x + 2, y - 8, 4, 2, '#7fa65a'); R(c, x - 1, y - 13, 4, 4, '#7fa65a'); R(c, x + 1, y - 12, 1, 1, '#ff3030'); };
  const avion = (c, x, y, s = 1) => {
    R(c, x, y, 40 * s, 6 * s, '#c9ced6'); R(c, x + 36 * s, y + 1 * s, 6 * s, 4 * s, '#c9ced6'); R(c, x + 40 * s, y + 2 * s, 3 * s, 2 * s, '#9aa0aa');   // fuselaje y nariz
    R(c, x, y - 7 * s, 5 * s, 7 * s, '#c9ced6'); R(c, x + 1 * s, y - 6 * s, 3 * s, 3 * s, '#c0392b');                                               // cola
    R(c, x + 14 * s, y + 3 * s, 12 * s, 3 * s, '#9aa0aa'); R(c, x + 16 * s, y + 6 * s, 5 * s, 2 * s, '#6b7280');                                    // ala y motor
    for (let k = 0; k < 7; k++) R(c, x + 8 * s + k * 4 * s, y + 1 * s, 2 * s, 2 * s, '#3b5a7a');                                                       // ventanillas
    R(c, x, y + 4 * s, 40 * s, 1 * s, '#8a9099');
  };
  const casa = (c, x, base, w, h, pared, techo, luz) => {
    R(c, x, base - h, w, h, pared); for (let k = 0; k < 10; k++) R(c, x - 4 + k * 0.5, base - h - k, w + 8 - k, 1, techo);
    R(c, x + w * 0.62, base - h * 0.55, w * 0.18, h * 0.55, '#5a3420'); R(c, x + w * 0.66, base - h * 0.3, 1, 1, '#e0c060');
    R(c, x + w * 0.14, base - h * 0.75, w * 0.3, h * 0.3, luz || '#2a3048'); R(c, x + w * 0.14 + w * 0.15, base - h * 0.75, 1, h * 0.3, '#5a3420');
  };
  const corazon = (c, x, y, col = '#ff4d6d') => { const P = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000']; P.forEach((f, i) => [...f].forEach((v, k) => { if (v === '1') R(c, x + k, y + i, 1, 1, col); })); };
  const texto = (c, s, x, y, col = '#fff', tam = 8, centro = true) => { c.font = `bold ${tam}px monospace`; c.textAlign = centro ? 'center' : 'left'; c.fillStyle = '#000'; c.fillText(s, x + 1, y + 1); c.fillStyle = col; c.fillText(s, x, y); };

  const ESCENAS = {
    // 1. El último vuelo, de noche, sobre la ciudad que arde
    intro1(c, t) {
      bandas(c, ['#06061a', '#0b0b26', '#121233', '#1b1840', '#2a1f48', '#3f2448'], 0, 140); estrellas(c, 60, 110, t); luna(c, 262, 32, 11);
      const x = ((t * 18) % 420) - 70; avion(c, x, 58, 1.2); R(c, x - 20, 62, 20, 1, 'rgba(255,255,255,0.25)');
      for (let k = 0; k < 24; k++) { const w = 8 + azar(k, 7) * 12, h = 12 + azar(k, 8) * 30, bx = k * 14 - 4; R(c, bx, 180 - 40 - h, w, h + 40, '#120f1e'); for (let v = 0; v < 6; v++) if (azar(k * 10 + v, 9) < 0.4) R(c, bx + 2 + (v % 2) * 4, 180 - 36 - h + Math.floor(v / 2) * 6, 2, 2, '#e8c860'); }
      for (const fx of [40, 118, 205, 280]) { fuego(c, fx, 142, t, 1.4); humo(c, fx, 130, t, 5); }
      R(c, 0, 168, W, 12, '#0a0812');
    },
    // 2. El avión cae en el bosque con un motor en llamas
    intro2(c, t) {
      bandas(c, ['#0d0b1e', '#1a1430', '#2b1d3a', '#43263e', '#5c2f3a'], 0, 150); estrellas(c, 30, 70, t);
      const k = Math.min(1, (t % 6) / 4.5), x = 40 + k * 170, y = 30 + k * 90;
      for (let s = 0; s < 14; s++) { const f = s / 14; R(c, x - 6 - f * 70 + Math.sin(t * 5 + s) * 2, y - 2 - f * 38, 6 - f * 2, 6 - f * 2, `rgba(${80 + s * 4},${70 + s * 3},${80 + s * 3},${0.9 - f * 0.6})`); }
      c.save(); c.translate(x, y); c.rotate(0.5); avion(c, -20, -3, 1); c.restore();
      fuego(c, x + 2, y + 6, t, 1);
      for (let p = 0; p < 30; p++) pino(c, p * 11 + (p % 3) * 3, 180 - 8, 18 + (p % 4) * 6, p % 2 ? '#0f2a1a' : '#12331f');
      R(c, 0, 172, W, 8, '#081a10');
    },
    // 3. Amanecer en el lugar del choque: el sobreviviente se levanta entre los restos
    intro3(c, t) {
      bandas(c, ['#2a2340', '#4a2f55', '#7d4a5e', '#b8625c', '#e0895a', '#f2c27a'], 0, 120); sol(c, 70, 112, 16, '#ffe29a');
      for (let p = 0; p < 20; p++) pino(c, p * 17 + 5, 124, 22 + (p % 3) * 8, '#2f3b2a');
      R(c, 0, 120, W, 60, '#4d5a30'); R(c, 0, 140, W, 40, '#3b4626'); R(c, 0, 160, W, 20, '#2c351c');
      R(c, 150, 116, 60, 18, '#b9bec6'); R(c, 150, 116, 60, 3, '#e6e9ee'); for (let k = 0; k < 7; k++) R(c, 156 + k * 7, 121, 3, 3, '#2b3e55');   // fuselaje partido
      R(c, 208, 112, 4, 24, '#6b7280'); R(c, 230, 124, 40, 6, '#a7adb6'); R(c, 262, 102, 10, 22, '#c9ced6'); R(c, 264, 104, 6, 8, '#c0392b');   // ala y cola
      fuego(c, 212, 128, t, 1.6); humo(c, 212, 110, t, 8); fuego(c, 238, 126, t, 1);
      c.save(); c.translate(110, 152); c.scale(2, 2); padre(c, 0, 0, t); c.restore();
      R(c, 40, 132, 3, 22, '#5a3a1a'); R(c, 26, 126, 36, 12, '#7a5a2a'); R(c, 27, 127, 34, 10, '#9a7a3a'); texto(c, 'CASA 100 KM', 44, 135, '#2a1a08', 6);
    },
    // 4. La hija espera en la ventana de su cuarto; afuera rondan los zombies
    intro4(c, t) {
      bandas(c, ['#05061a', '#0b0f2a', '#121838', '#1a2242'], 0, 130); estrellas(c, 50, 100, t); luna(c, 60, 34, 12);
      R(c, 0, 130, W, 50, '#14202a'); R(c, 0, 150, W, 30, '#0e171f');
      casa(c, 150, 150, 110, 60, '#6a5a7a', '#3a2a40', '#f6d36a');
      hija(c, 175, 117);
      for (let k = 0; k < 9; k++) R(c, 140 + k * 14, 140, 2, 12, '#d8d8d8'); R(c, 140, 143, 126, 2, '#d8d8d8');
      for (const zx of [30, 62, 290]) zombie(c, zx + Math.sin(t + zx) * 4, 158, t);
      corazon(c, 182, 96 - (t * 6 % 14), '#ff4d6d');
    },
    // Mapa del camino: del avión (km 100) a la casa (km 0), con el tramo que ya recorrió
    mapa(c, t, n) {
      R(c, 0, 0, W, H, '#d8c79c'); for (let x = 0; x < W; x += 16) R(c, x, 0, 1, H, '#c9b78a'); for (let y = 0; y < H; y += 16) R(c, 0, y, W, 1, '#c9b78a');
      R(c, 6, 6, W - 12, 2, '#8a7650'); R(c, 6, H - 8, W - 12, 2, '#8a7650'); R(c, 6, 6, 2, H - 12, '#8a7650'); R(c, W - 8, 6, 2, H - 12, '#8a7650');
      const nodos = [[34, 120], [104, 70], [174, 112], [240, 64], [292, 100]], kms = [100, 75, 45, 15, 0];
      for (let i = 0; i < 4; i++) {
        const [x0, y0] = nodos[i], [x1, y1] = nodos[i + 1];
        for (let s = 0; s <= 20; s++) { if (s % 2) continue; const f = s / 20; R(c, x0 + (x1 - x0) * f - 1, y0 + (y1 - y0) * f - 1, 3, 3, i < n - 1 ? '#c0392b' : '#6a5a3a'); }
      }
      for (let i = 0; i < 5; i++) { const [x, y] = nodos[i]; R(c, x - 4, y - 4, 9, 9, i < n ? '#c0392b' : '#6a5a3a'); R(c, x - 2, y - 2, 5, 5, '#f2e6c4'); texto(c, `KM ${kms[i]}`, x, y + 16, '#3a2a10', 7); }
      avion(c, 18, 96, 0.6); casa(c, 280, 88, 24, 16, '#c96a4a', '#6a2a1a', '#f6d36a');
      const [px, py] = nodos[n - 1]; padre(c, px, py - 6 + Math.round(Math.sin(t * 4)), t);
      texto(c, n <= 4 ? t2('hist.hud.nivel', { n }) : t2('hist.casa'), W / 2, 24, '#3a2a10', 10);
    },
    // Final: el reencuentro en la puerta de casa, al amanecer
    final(c, t) {
      bandas(c, ['#3b3560', '#6a4a72', '#c86b6b', '#f4a27c', '#ffd8a0'], 0, 130); sol(c, 250, 128, 22, '#fff0b8');
      R(c, 0, 128, W, 52, '#5c7a3a'); R(c, 0, 150, W, 30, '#4a6630'); R(c, 120, 150, 60, 30, '#b9a888');
      casa(c, 100, 150, 120, 70, '#7aa0c8', '#4a3040', '#f6d36a'); R(c, 174, 111, 20, 39, '#2a1a10');   // puerta abierta
      for (let k = 0; k < 14; k++) R(c, 10 + k * 8, 138, 2, 12, '#eeeeee'); R(c, 10, 141, 108, 2, '#eeeeee');
      c.save(); c.translate(146, 174); c.scale(3, 3);   // el abrazo, grande: es la escena del final
      padre(c, 0, 0, t); hija(c, 6, 0); R(c, 3, -9, 4, 2, '#d9a273');
      c.restore();
      for (let k = 0; k < 5; k++) { const f = ((t * 0.35 + k / 5) % 1); corazon(c, 136 + k * 9 + Math.sin(t * 2 + k) * 4, 124 - f * 80, f > 0.7 ? '#ff9db0' : '#ff4d6d'); }
      texto(c, t > 2 ? 'FIN' : '', W / 2, 40, '#fff6d8', 16);
    },
  };

  // Dibuja la escena en el lienzo visible, agrandada y con los píxeles a la vista
  const chico = document.createElement('canvas'); chico.width = W; chico.height = H;
  function pintar(destino, escena, t, n) {
    const c = chico.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, W, H);
    (ESCENAS[escena] || ESCENAS.mapa)(c, t, n);
    const d = destino.getContext('2d'); d.imageSmoothingEnabled = false;
    d.clearRect(0, 0, destino.width, destino.height); d.drawImage(chico, 0, 0, destino.width, destino.height);
    // Líneas de barrido, como en un televisor de tubo
    d.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = 0; y < destino.height; y += 4) d.fillRect(0, y, destino.width, 1);
  }
  return { pintar };
})();

/* ---------- Pantalla de la historia: viñetas, resumen de cada nivel y final ---------- */
const Historia = (() => {
  const CLAVE = 'zonaMuerta.historia.nivel';
  const $ = id => document.getElementById(id);
  let pasos = [], indice = 0, alTerminar = null, inicioEscena = 0, cuadro = 0, letras = 0, textoActual = '', activa = false, musica = null;

  const guardado = () => { try { return Math.min(4, Math.max(1, parseInt(localStorage.getItem(CLAVE) || '1', 10) || 1)); } catch { return 1; } };
  const guardar = n => { try { if (n > guardado()) localStorage.setItem(CLAVE, String(n)); } catch { /* sin almacenamiento */ } };

  function mostrarCapa(si) { activa = si; $('capa-historia').classList.toggle('oculta', !si); if (!si) { cancelAnimationFrame(cuadro); musica = null; } }

  // Recorre una lista de pasos: { escena, n, texto, titulo, datos, botones }
  function secuencia(lista, fin) {
    pasos = lista; indice = 0; alTerminar = fin; mostrarCapa(true); mostrarPaso();
    cancelAnimationFrame(cuadro); cuadro = requestAnimationFrame(animar);
  }
  function mostrarPaso() {
    const p = pasos[indice];
    // Música de 8 bits: «Camino a casa» en las viñetas y «Estás en casa» en el final
    const tema = p.escena === 'final' ? 'retroFinal' : 'retro';
    if (tema !== musica) { Audio_.activar(); Musica.tocar(tema); musica = tema; }
    inicioEscena = performance.now(); letras = 0; textoActual = p.texto || '';
    $('historia-titulo').textContent = p.titulo || '';
    $('historia-texto').textContent = '';
    $('historia-datos').innerHTML = p.datos ? p.datos.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('') : '';
    $('historia-datos').classList.toggle('oculta', !p.datos);
    const botones = p.botones || [[t(indice === pasos.length - 1 ? 'hist.boton.jugar' : 'hist.boton.seguir'), 'seguir']];
    $('historia-botones').innerHTML = botones.map(([txt, acc], i) => `<button class="boton chico${i === 0 ? ' principal' : ''}" type="button" data-hist="${acc}">${txt}</button>`).join('') +
      (p.sinSaltar ? '' : `<button class="boton chico tenue" type="button" data-hist="saltar">${t('hist.boton.saltar')}</button>`);
    $('historia-pista').textContent = t('hist.pista');
    const primero = $('historia-botones').querySelector('button'); if (primero) primero.focus({ preventScroll: true });
  }
  function animar(ahora) {
    if (!activa) return;
    const p = pasos[indice], tiempo = (ahora - inicioEscena) / 1000;
    Vinetas.pintar($('historia-vineta'), p.escena, tiempo, p.n || 1);
    const debe = Math.min(textoActual.length, Math.floor(tiempo * 45));
    if (debe !== letras) { letras = debe; $('historia-texto').textContent = textoActual.slice(0, letras); if (letras % 3 === 0 && letras < textoActual.length) Audio_.tecla && Audio_.tecla(); }
    cuadro = requestAnimationFrame(animar);
  }
  function terminar(accion) { const fin = alTerminar; mostrarCapa(false); if (fin) fin(accion); }
  function avanzar(accion = 'seguir') {
    if (!activa) return;
    if (accion === 'saltar') {                                    // salta a la última viñeta (o, si ya está, sigue)
      if (indice < pasos.length - 1) { indice = pasos.length - 1; mostrarPaso(); return; }
      accion = 'seguir';
    } else if (accion === 'seguir' && letras < textoActual.length) { inicioEscena = performance.now() - 1e6; return; }   // primero completa el texto
    if (accion === 'seguir' && indice < pasos.length - 1) { indice++; mostrarPaso(); return; }
    terminar(accion);
  }

  const pasoNivel = n => {
    const d = NIVELES_HISTORIA[n - 1];
    return { escena: 'mapa', n, titulo: `${t('hist.nivelN', { n })} · ${t('hist.nivel' + n)}`, texto: `${t('hist.km', { desde: d.kmDesde, hasta: d.kmHasta })}. ${t('hist.antes' + n)}` };
  };
  // Armas con las que arranca un nivel si se continúa desde el menú: las de las cajas de los niveles anteriores
  function estadoParaNivel(n) {
    const j = new Jugador(0), inv = j.inventario.slice(), municion = { ...j.municion }, reserva = { ...j.reserva };
    for (let i = 0; i < n - 1; i++) for (const [, id] of NIVELES_HISTORIA[i].cajas) if (!inv.includes(id)) { inv.push(id); municion[id] = ARMAS[id].cargador; if (ARMAS[id].reservaInicial !== undefined) reserva[id] = ARMAS[id].reservaInicial; }
    return { inventario: inv, municion, reserva, indice: inv.length - 1, bajasTotal: 0, tiempoTotal: 0 };
  }
  function jugarNivel(n, estado) { guardar(n); ZonaMuerta.iniciar(null, { historia: { nivel: n, estado } }); }

  // Desde el menú: intro (o elegir continuar) y nivel 1
  function abrir() {
    const n = guardado();
    const intro = [1, 2, 3, 4].map(k => ({ escena: 'intro' + k, texto: t('hist.intro' + k), titulo: t('menu.historia') }));
    const empezar = () => secuencia([...intro, pasoNivel(1)], acc => { if (acc === 'seguir') jugarNivel(1, null); });
    if (n <= 1) return empezar();
    secuencia([{ escena: 'mapa', n, titulo: t('menu.historia'), texto: t('hist.intro4'), sinSaltar: true,
      botones: [[t('hist.boton.continuar', { n }), 'continuar'], [t('hist.boton.nueva'), 'nueva'], [t('hist.boton.menu'), 'menu']] }],
      acc => { if (acc === 'continuar') secuencia([pasoNivel(n)], a => { if (a === 'seguir') jugarNivel(n, estadoParaNivel(n)); }); else if (acc === 'nueva') empezar(); });
  }

  // Al llegar a la meta: resumen del nivel; después el siguiente o el final
  function nivelSuperado(juego) {
    const H = juego.historia, n = H.n, d = H.def, j = juego.jugador, estado = juego.estadoHistoria();
    const armas = H.armas.map(id => ARMAS[id].nombre).join(', ');
    const texto = t('hist.resumen', { que: t('hist.que' + n), km: d.kmDesde - d.kmHasta, tiempo: formatearTiempo(juego.tiempoJugado), bajas: juego.bajas, corazones: H.corazones, aereos: H.aereos, armas });
    const datos = [[t('hist.dato.bajas'), juego.bajas], [t('hist.dato.tiempo'), formatearTiempo(juego.tiempoJugado)], [t('hist.dato.vida'), Math.ceil(j.vida)],
      [t('hist.dato.armas'), j.inventario.length], [t('hist.dato.corazones'), H.corazones], [t('hist.dato.radios'), H.radios]];
    const resumen = { escena: 'mapa', n: Math.min(5, n + 1), titulo: t('hist.superado', { n }) + ' · ' + t('hist.nivel' + n), texto, datos };
    if (n < 4) {
      guardar(n + 1);
      const sig = NIVELES_HISTORIA[n];
      resumen.texto += ' ' + t('hist.siguiente', { nombre: t('hist.nivel' + (n + 1)), km: sig.kmDesde });
      secuencia([resumen, pasoNivel(n + 1)], acc => { if (acc === 'seguir') jugarNivel(n + 1, estado); else ZonaMuerta.salir(); });
    } else {
      try { localStorage.setItem(CLAVE, '1'); } catch { /* sin almacenamiento */ }
      const total = [[t('hist.dato.bajas'), estado.bajasTotal], [t('hist.dato.tiempo'), formatearTiempo(estado.tiempoTotal)], [t('hist.dato.armas'), j.inventario.length]];
      secuencia([resumen, { escena: 'final', titulo: t('hist.fin'), texto: t('hist.final', { bajas: estado.bajasTotal }) + ' ' + t('hist.gracias'), datos: total, sinSaltar: true,
        botones: [[t('hist.boton.menu'), 'menu']] }], () => ZonaMuerta.salir());
    }
  }

  // Botones y teclas de la pantalla de historia (captura: no llegan al juego)
  document.addEventListener('click', e => { const b = e.target.closest('[data-hist]'); if (b) { Audio_.activar(); avanzar(b.dataset.hist); } else if (activa && e.target.closest('#capa-historia') && !e.target.closest('button')) avanzar('seguir'); });
  document.addEventListener('keydown', e => {
    if (!activa) return;
    e.stopImmediatePropagation();
    if (['Enter', 'NumpadEnter', 'Space', 'ArrowRight'].includes(e.code)) { e.preventDefault(); const b = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.hist; avanzar(b && b !== 'saltar' ? b : 'seguir'); }
    else if (e.code === 'Escape') avanzar('saltar');
  }, true);

  return { abrir, nivelSuperado, activa: () => activa, nombre: n => t('hist.nivel' + n) };
})();
