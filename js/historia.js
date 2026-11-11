/* ===== Modo historia: «Camino a casa» =====
 * El avión del protagonista cae cerca de Bariloche, a 1600 km de su casa en Padua (Merlo), cuando aparecen los zombies. Tiene que cruzar cuatro niveles,
 * de izquierda a derecha como en los juegos de plataformas de antes, para volver con su hija:
 *   1. Bariloche (km 1600 → 1550): la montaña donde cayó el avión, al amanecer.
 *   2. La Pampa (km 1550 → 60): la ruta destruida, a la tarde.
 *   3. Zona sur (km 60 → 15): las calles del conurbano sur de Buenos Aires, al atardecer.
 *   4. Padua, Merlo (km 15 → 0): su barrio, de noche; termina en la puerta de su casa.
 * En el camino hay corazones (curan) y radios (cada una es un ataque aéreo para pedir con la A). Al terminar
 * cada nivel se muestra un resumen de lo que hizo; entre niveles, viñetas al estilo de los juegos de 8 bits.
 * Las armas y la munición pasan de un nivel al siguiente; si muere, reintenta el nivel con lo que tenía al empezarlo.
 */

const NIVELES_HISTORIA = [
  // Nivel 1: terreno caótico con desniveles. Tramos [desde, hasta, altura al empezar, altura al terminar, tipo]
  // (px sobre el piso; negativa = cráter). Hay zombies dormidos que se despiertan al ver al jugador.
  { clave: 'avion',  kmDesde: 1600, kmHasta: 1550, largo: 4600, intervalo: [4.5, 6.5], maxVivos: 4,  corredores: 0,    grupo: 1,
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
  // Nivel 2: la ruta destruida: autos atravesados y un colectivo para saltar, un camión con escalera, baches gigantes
  // (dos se cruzan con una soga colgada de un pórtico de carteles), un auto en llamas y la horda al final
  { clave: 'ruta',   kmDesde: 1550, kmHasta: 60, largo: 5600, intervalo: [3.2, 4.5], maxVivos: 5,  corredores: 0.15, grupo: 2, horda: [1200, 5],
    cajas: [[1100, 'ak47'], [2600, 'rem870'], [3680, 'm16']], corazones: [1650, 2850, 4550, 5200], radios: [2550, 4800],
    terreno: [
      [0, 350, 0, 0, 'suelo'], [350, 470, 45, 45, 'auto'], [470, 650, 0, 0, 'suelo'], [650, 780, 45, 45, 'auto'], [780, 1010, 90, 90, 'colectivo'],
      [1010, 1200, 0, 0, 'suelo'], [1200, 1320, 0, 0, 'suelo'], [1320, 1560, -300, -300, 'abismo'], [1560, 1700, 0, 0, 'suelo'],
      [1700, 1900, 0, 0, 'suelo'], [1900, 2020, 45, 45, 'auto'], [2020, 2400, 0, 0, 'suelo'], [2400, 2700, 130, 130, 'camion'],
      [2700, 2900, 0, 0, 'suelo'], [2900, 3000, 0, 0, 'suelo'], [3000, 3110, -300, -300, 'abismo'], [3110, 3300, 0, 0, 'suelo'],
      [3300, 3500, 0, 0, 'suelo'], [3500, 3620, 45, 45, 'auto'], [3620, 3740, 90, 90, 'auto'], [3740, 3860, 45, 45, 'auto'],
      [3860, 4100, 0, 0, 'suelo'], [4100, 4200, 0, 0, 'suelo'], [4200, 4480, -300, -300, 'abismo'], [4480, 4600, 0, 0, 'suelo'], [4600, 5800, 0, 0, 'suelo'],
    ],
    escaleras: [[2400, 130]], sogas: [[1440, 230, 170], [4340, 230, 170]], fuegos: [[2200, 2290]],
    dormidos: [400, 850, 1150, 1950, 2550, 2950, 3560, 3680, 3800, 4700, 5000, 5300] },
  // Nivel 3: techos a los que se llega por andamios y escaleras, huecos entre edificios con sogas colgadas de grúas,
  // un salto largo de techo a techo, contenedores, fuego y una horda más grande
  { clave: 'ciudad', kmDesde: 60,  kmHasta: 15, largo: 6400, intervalo: [2.6, 3.6], maxVivos: 7,  corredores: 0.25, grupo: 2, horda: [1400, 7],
    cajas: [[950, 'spas12'], [2700, 'm79', true], [4320, 'mp5']], corazones: [1450, 2300, 3650, 4800, 5800], radios: [1600, 3300, 5500],
    terreno: [
      [0, 300, 0, 0, 'suelo'], [300, 400, 45, 45, 'contenedor'], [400, 600, 0, 0, 'suelo'], [600, 700, 70, 70, 'andamio'], [700, 800, 140, 140, 'andamio'],
      [800, 1100, 140, 140, 'techo'], [1100, 1340, -300, -300, 'abismo'], [1340, 1700, 140, 140, 'techo'], [1700, 1800, 70, 70, 'andamio'],
      [1800, 2120, 0, 0, 'suelo'], [2120, 2240, 45, 45, 'contenedor'], [2240, 2500, 0, 0, 'suelo'], [2500, 2900, 150, 150, 'techo'],
      [2900, 3150, -300, -300, 'abismo'], [3150, 3400, 150, 150, 'techo'], [3400, 3530, -300, -300, 'abismo'], [3530, 3800, 150, 150, 'techo'],
      [3800, 3900, 80, 80, 'andamio'], [3900, 4150, 0, 0, 'suelo'], [4150, 4270, 45, 45, 'contenedor'], [4270, 4380, 90, 90, 'andamio'],
      [4380, 5000, 0, 0, 'suelo'], [5000, 5200, -300, -300, 'abismo'], [5200, 6600, 0, 0, 'suelo'],
    ],
    escaleras: [[2500, 150]], sogas: [[1220, 330, 180], [3025, 340, 190], [5100, 230, 170]], fuegos: [[2050, 2120], [4620, 4700]],
    dormidos: [350, 900, 1000, 1500, 1600, 2180, 2700, 2800, 3300, 3700, 4200, 4500, 4900, 5600, 5900] },
  // Nivel 4: cercas, techos con escaleras, canales inundados que se cruzan de soga en soga, jardines en llamas y la
  // horda más grande antes de llegar a la puerta de casa
  { clave: 'barrio', kmDesde: 15,  kmHasta: 0,  largo: 7000, intervalo: [2.0, 2.8], maxVivos: 9,  corredores: 0.35, grupo: 3, horda: [1600, 10],
    cajas: [[1100, 'thompson'], [2400, 'aa12'], [4600, 'mgl', true]], corazones: [1900, 2900, 3650, 4700, 5950, 6400], radios: [1150, 3700, 5100, 6200],
    terreno: [
      [0, 300, 0, 0, 'suelo'], [300, 330, 40, 40, 'cerca'], [330, 600, 0, 0, 'suelo'], [600, 630, 40, 40, 'cerca'], [630, 900, 0, 0, 'suelo'],
      [900, 1300, 140, 140, 'techo'], [1300, 1700, -300, -300, 'abismo'], [1700, 2100, 140, 140, 'techo'], [2100, 2200, 70, 70, 'escombro'],
      [2200, 2500, 0, 0, 'suelo'], [2500, 2530, 50, 50, 'cerca'], [2530, 2800, 0, 0, 'suelo'], [2800, 2830, 50, 50, 'cerca'], [2830, 3100, 0, 0, 'suelo'],
      [3100, 3500, -300, -300, 'abismo'], [3500, 3800, 0, 0, 'suelo'], [3800, 4200, 150, 150, 'techo'], [4200, 4450, -300, -300, 'abismo'],
      [4450, 4800, 150, 150, 'techo'], [4800, 4900, 75, 75, 'escombro'], [4900, 5300, 0, 0, 'suelo'], [5300, 5330, 40, 40, 'cerca'],
      [5330, 5600, 0, 0, 'suelo'], [5600, 5900, -300, -300, 'abismo'], [5900, 7300, 0, 0, 'suelo'],
    ],
    escaleras: [[900, 140], [3800, 150]], sogas: [[1400, 330, 190], [1600, 330, 190], [3200, 300, 200], [3400, 300, 200], [4325, 340, 200], [5750, 240, 170]],
    fuegos: [[2650, 2760], [5450, 5540]],
    dormidos: [450, 1000, 1200, 1800, 2000, 2350, 2950, 3600, 3900, 4100, 4600, 5000, 5450, 6000, 6300, 6500, 6700] },
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
  'hist.dato.nivel': 'Zombies del nivel', 'hist.dato.total': 'Zombies en total', 'hist.dato.tiempoNivel': 'Tiempo del nivel', 'hist.dato.tiempoTotal': 'Tiempo total',
  'hist.dato.km': 'Kilómetros recorridos', 'hist.dato.caidas': 'Caídas', 'hist.dato.disparos': 'Disparos', 'hist.dato.aereos': 'Ataques aéreos', 'hist.dato.encontradas': 'Armas encontradas',
  'hist.calificacion': 'CALIFICACIÓN',
  'hist.aviso.caida': '¡CAÍSTE! −25 DE VIDA', 'hist.aviso.horda': '¡UNA HORDA! AGUANTA, YA FALTA POCO', 'hist.aviso.fuego': '¡TE QUEMAS!',
  'hist.aviso.jefe': '¡JEFE FINAL!', 'hist.aviso.jefeBloquea': '¡DERROTA AL JEFE PARA SEGUIR!', 'hist.aviso.jefeVencido': '¡JEFE DERROTADO!', 'hist.aviso.onda': '¡LA ONDA! SALTA PARA ESQUIVARLA',
  'hist.jefe.avion': 'EL SAN BERNARDO DEL CENTRO CÍVICO', 'hist.jefe.ruta': 'EL TORO DE LA PAMPA', 'hist.jefe.ciudad': 'EL HINCHA DEL BOMBO', 'hist.jefe.barrio': 'EL COLOSO VERDE',
  'hist.pista.escalera': '↑ PARA TREPAR', 'hist.pista.bajar': '↓ PARA BAJAR', 'hist.pista.soga': 'SALTA PARA SOLTAR LA SOGA',
  'menu.historia': 'HISTORIA: CAMINO A CASA',
  'hist.nivel1': 'Bariloche', 'hist.nivel2': 'La Pampa', 'hist.nivel3': 'Zona sur', 'hist.nivel4': 'Padua, Merlo',
  'hist.intro1': 'Una noche de noviembre, un virus convirtió a millones de personas en zombies. Tú volvías a casa en el último vuelo que salió de la capital.',
  'hist.intro2': 'A mitad del viaje, un pasajero infectado atacó a la tripulación. El avión perdió el control y se estrelló en la cordillera, cerca de Bariloche.',
  'hist.intro3': 'Despiertas entre los restos, en la nieve. De milagro, estás vivo. El teléfono marca 1.600 kilómetros hasta tu casa, en Padua.',
  'hist.intro4': 'Allá te espera tu hija, escondida en su cuarto. Le prometiste que volverías. Tienes que cumplirlo.',
  'hist.antes1': 'Baja de la montaña entre los restos del avión: turbinas, valijas abiertas y pasajeros que ya no son pasajeros.',
  'hist.antes2': 'Cruzar La Pampa por la ruta destruida: baches gigantes, autos atravesados y pedazos de autos por todas partes.',
  'hist.antes3': 'Llegas a la zona sur del conurbano. Las calles están llenas de destrozos, saquearon los negocios y los semáforos ya no funcionan.',
  'hist.antes4': 'Llegas a Padua de noche. No hay luz y todo está en penumbras. En tu casa, la ventana de tu hija sigue prendida.',
  'hist.final': v => `Abres la puerta. Tu hija corre a abrazarte. Recorriste 1.600 kilómetros, de Bariloche a Padua, y venciste a ${v.bajas} zombies para cumplir tu promesa. Estás en casa.`,
  'hist.fin': 'FIN', 'hist.gracias': '¡Gracias por jugar!',
  'hist.nivelN': v => `NIVEL ${v.n} DE 4`, 'hist.km': v => `KM ${v.desde} → ${v.hasta}`,
  'hist.superado': v => `¡NIVEL ${v.n} SUPERADO!`,
  'hist.resumen': v => `${v.que} Avanzaste ${v.km} km en ${v.tiempo} y eliminaste a ${v.bajas} zombies.` +
    (v.corazones ? ` Recogiste ${v.corazones} ${v.corazones === 1 ? 'corazón' : 'corazones'}.` : '') +
    (v.aereos ? ` Pediste ${v.aereos} ${v.aereos === 1 ? 'ataque aéreo' : 'ataques aéreos'}.` : '') +
    (v.armas ? ` Encontraste: ${v.armas}.` : ''),
  'hist.que1': 'Bajaste de la montaña y dejaste atrás los restos del avión.',
  'hist.que2': 'Cruzaste La Pampa por la ruta destruida, entre baches gigantes y autos atravesados.',
  'hist.que3': 'Atravesaste las calles destruidas de la zona sur.',
  'hist.que4': 'Cruzaste Padua a oscuras y llegaste a la puerta de tu casa.',
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
  'hist.dato.nivel': 'Zumbis do nível', 'hist.dato.total': 'Zumbis no total', 'hist.dato.tiempoNivel': 'Tempo do nível', 'hist.dato.tiempoTotal': 'Tempo total',
  'hist.dato.km': 'Quilômetros percorridos', 'hist.dato.caidas': 'Quedas', 'hist.dato.disparos': 'Disparos', 'hist.dato.aereos': 'Ataques aéreos', 'hist.dato.encontradas': 'Armas encontradas',
  'hist.calificacion': 'AVALIAÇÃO',
  'hist.aviso.caida': 'VOCÊ CAIU! −25 DE VIDA', 'hist.aviso.horda': 'UMA HORDA! AGUENTE, FALTA POUCO', 'hist.aviso.fuego': 'VOCÊ ESTÁ QUEIMANDO!',
  'hist.aviso.jefe': 'CHEFÃO FINAL!', 'hist.aviso.jefeBloquea': 'DERROTE O CHEFÃO PARA SEGUIR!', 'hist.aviso.jefeVencido': 'CHEFÃO DERROTADO!', 'hist.aviso.onda': 'A ONDA! PULE PARA DESVIAR',
  'hist.jefe.avion': 'O SÃO BERNARDO DO CENTRO CÍVICO', 'hist.jefe.ruta': 'O TOURO DOS PAMPAS', 'hist.jefe.ciudad': 'O TORCEDOR DO BUMBO', 'hist.jefe.barrio': 'O COLOSSO VERDE',
  'hist.pista.escalera': '↑ PARA SUBIR', 'hist.pista.bajar': '↓ PARA DESCER', 'hist.pista.soga': 'PULE PARA SOLTAR A CORDA',
  'menu.historia': 'HISTÓRIA: CAMINHO DE CASA',
  'hist.nivel1': 'Bariloche', 'hist.nivel2': 'La Pampa', 'hist.nivel3': 'Zona sul', 'hist.nivel4': 'Padua, Merlo',
  'hist.intro1': 'Numa noite de novembro, um vírus transformou milhões de pessoas em zumbis. Você voltava para casa no último voo que saiu da capital.',
  'hist.intro2': 'No meio da viagem, um passageiro infectado atacou a tripulação. O avião perdeu o controle e caiu na cordilheira, perto de Bariloche.',
  'hist.intro3': 'Você acorda entre os destroços, na neve. Por milagre, está vivo. O celular marca 1.600 quilômetros até a sua casa, em Padua.',
  'hist.intro4': 'Lá a sua filha espera, escondida no quarto. Você prometeu que voltaria. Precisa cumprir.',
  'hist.antes1': 'Desça a montanha entre os destroços do avião: turbinas, malas abertas e passageiros que já não são passageiros.',
  'hist.antes2': 'Cruzar La Pampa pela rodovia destruída: buracos gigantes, carros atravessados e pedaços de carros por toda parte.',
  'hist.antes3': 'Você chega à zona sul da Grande Buenos Aires. As ruas estão cheias de destroços, as lojas foram saqueadas e os semáforos não funcionam mais.',
  'hist.antes4': 'Você chega a Padua de noite. Não há luz e tudo está na penumbra. Na sua casa, a janela da sua filha continua acesa.',
  'hist.final': v => `Você abre a porta. Sua filha corre para abraçar você. Você percorreu 1.600 quilômetros, de Bariloche a Padua, e venceu ${v.bajas} zumbis para cumprir a promessa. Está em casa.`,
  'hist.fin': 'FIM', 'hist.gracias': 'Obrigado por jogar!',
  'hist.nivelN': v => `NÍVEL ${v.n} DE 4`, 'hist.km': v => `KM ${v.desde} → ${v.hasta}`,
  'hist.superado': v => `NÍVEL ${v.n} CONCLUÍDO!`,
  'hist.resumen': v => `${v.que} Você avançou ${v.km} km em ${v.tiempo} e eliminou ${v.bajas} zumbis.` +
    (v.corazones ? ` Pegou ${v.corazones} ${v.corazones === 1 ? 'coração' : 'corações'}.` : '') +
    (v.aereos ? ` Pediu ${v.aereos} ${v.aereos === 1 ? 'ataque aéreo' : 'ataques aéreos'}.` : '') +
    (v.armas ? ` Encontrou: ${v.armas}.` : ''),
  'hist.que1': 'Você desceu a montanha e deixou para trás os destroços do avião.',
  'hist.que2': 'Você cruzou La Pampa pela rodovia destruída, entre buracos gigantes e carros atravessados.',
  'hist.que3': 'Você atravessou as ruas destruídas da zona sul.',
  'hist.que4': 'Você cruzou Padua no escuro e chegou à porta da sua casa.',
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
  'hist.dato.nivel': 'Zombies this level', 'hist.dato.total': 'Zombies in total', 'hist.dato.tiempoNivel': 'Level time', 'hist.dato.tiempoTotal': 'Total time',
  'hist.dato.km': 'Kilometers covered', 'hist.dato.caidas': 'Falls', 'hist.dato.disparos': 'Shots', 'hist.dato.aereos': 'Air strikes', 'hist.dato.encontradas': 'Weapons found',
  'hist.calificacion': 'RATING',
  'hist.aviso.caida': 'YOU FELL! −25 HEALTH', 'hist.aviso.horda': 'A HORDE! HOLD ON, ALMOST THERE', 'hist.aviso.fuego': 'YOU ARE BURNING!',
  'hist.aviso.jefe': 'FINAL BOSS!', 'hist.aviso.jefeBloquea': 'DEFEAT THE BOSS TO GO ON!', 'hist.aviso.jefeVencido': 'BOSS DEFEATED!', 'hist.aviso.onda': 'SHOCKWAVE! JUMP TO DODGE IT',
  'hist.jefe.avion': 'THE CIVIC CENTER SAINT BERNARD', 'hist.jefe.ruta': 'THE BULL OF THE PAMPAS', 'hist.jefe.ciudad': 'THE BASS DRUM FAN', 'hist.jefe.barrio': 'THE GREEN COLOSSUS',
  'hist.pista.escalera': '↑ TO CLIMB', 'hist.pista.bajar': '↓ TO CLIMB DOWN', 'hist.pista.soga': 'JUMP TO LET GO OF THE ROPE',
  'menu.historia': 'STORY: THE WAY HOME',
  'hist.nivel1': 'Bariloche', 'hist.nivel2': 'La Pampa', 'hist.nivel3': 'The south side', 'hist.nivel4': 'Padua, Merlo',
  'hist.intro1': 'One November night, a virus turned millions of people into zombies. You were flying home on the last plane out of the capital.',
  'hist.intro2': 'Halfway there, an infected passenger attacked the crew. The plane lost control and crashed in the Andes, near Bariloche.',
  'hist.intro3': 'You wake up among the wreckage, in the snow. Somehow, you are alive. Your phone says home is 1,600 kilometers away, in Padua.',
  'hist.intro4': 'Your daughter is waiting there, hiding in her room. You promised her you would come back. You have to keep that promise.',
  'hist.antes1': 'Get down the mountain through the wreckage: engines, open suitcases and passengers who are not passengers anymore.',
  'hist.antes2': 'Cross La Pampa on the wrecked highway: giant potholes, cars blocking the way and car parts everywhere.',
  'hist.antes3': 'You reach the south side of Greater Buenos Aires. The streets are full of wreckage, the shops were looted and the traffic lights are dead.',
  'hist.antes4': 'You reach Padua at night. The power is out and everything is in the dark. At home, your daughter\'s window is still lit.',
  'hist.final': v => `You open the door. Your daughter runs into your arms. You crossed 1,600 kilometers, from Bariloche to Padua, and beat ${v.bajas} zombies to keep your promise. You are home.`,
  'hist.fin': 'THE END', 'hist.gracias': 'Thanks for playing!',
  'hist.nivelN': v => `LEVEL ${v.n} OF 4`, 'hist.km': v => `KM ${v.desde} → ${v.hasta}`,
  'hist.superado': v => `LEVEL ${v.n} CLEARED!`,
  'hist.resumen': v => `${v.que} You covered ${v.km} km in ${v.tiempo} and took down ${v.bajas} zombies.` +
    (v.corazones ? ` You picked up ${v.corazones} ${v.corazones === 1 ? 'heart' : 'hearts'}.` : '') +
    (v.aereos ? ` You called ${v.aereos} ${v.aereos === 1 ? 'air strike' : 'air strikes'}.` : '') +
    (v.armas ? ` You found: ${v.armas}.` : ''),
  'hist.que1': 'You came down the mountain and left the wreckage behind.',
  'hist.que2': 'You crossed La Pampa on the wrecked highway, between giant potholes and wrecked cars.',
  'hist.que3': 'You crossed the ruined streets of the south side.',
  'hist.que4': 'You crossed dark Padua and reached your front door.',
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
    this.historia = { n, def, inicio: INICIO_HISTORIA, meta: INICIO_HISTORIA + def.largo, corazones: 0, radios: 0, aereos: 0, armas: [], caidas: 0, disparos: 0, bajasTotal: (op.estado && op.estado.bajasTotal) || 0, tiempoTotal: (op.estado && op.estado.tiempoTotal) || 0 };
    Mundo.plano = true; Mundo.carriles = false; Mundo.interior = false;
    Mundo.perfil = def.terreno ? perfilTerreno(def.terreno, INICIO_HISTORIA) : null;
    j.aTierra = true;                                       // el ataque aéreo lo pasa cuerpo a tierra
    j.soga = null; j.trepa = null; j.impulso = 0;
    this.historia.seguro = { x: j.x, y: j.y }; this.historia.proximoFuego = 0;
    // Armas y munición que trae del nivel anterior
    const e = op.estado;
    if (e && e.inventario) {
      j.inventario = e.inventario.slice(); j.municion = { ...j.municion, ...e.municion }; j.reserva = { ...j.reserva, ...e.reserva };
      j.indiceArma = Math.min(e.indice || 0, j.inventario.length - 1);
    }
    // Siempre lleva el cuchillo, y cada nivel empieza con 3 granadas más (se suman a las que traía)
    const enMano = j.inventario[j.indiceArma];
    if (!j.inventario.includes('cuchillo')) { j.inventario.unshift('cuchillo'); j.municion.cuchillo = 1; }
    if (!j.inventario.includes('granadas')) {
      j.inventario.push('granadas'); j.municion.granadas = 0; j.reserva.granadas = 0;
      j.inventario.sort((a, b) => ORDEN_INVENTARIO.indexOf(a) - ORDEN_INVENTARIO.indexOf(b));   // el cuchillo (fuera de la lista) queda primero
    }
    j.reserva.granadas = (j.reserva.granadas || 0) + 3;
    const faltan = Math.min(ARMAS.granadas.cargador - (j.municion.granadas || 0), j.reserva.granadas);
    j.municion.granadas = (j.municion.granadas || 0) + faltan; j.reserva.granadas -= faltan;
    j.indiceArma = Math.max(0, j.inventario.indexOf(enMano));
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
    // (la mitad, del lugar: animales o personajes típicos; ver zombies-autoctonos.js)
    if (def.dormidos) for (const dx of def.dormidos) this.zombies.push(this.zombieHistoria(x0 + dx, false).dormir());
    else for (const dx of [700, 1000]) this.zombies.push(this.zombieHistoria(x0 + dx, false));
    this.camaraX = j.x - ANCHO / 2;
  },

  nombreNivel(n) { return t('hist.nivel' + n); },

  // Zombies que aparecen adelante (y a veces atrás) a medida que avanza; nunca después de la meta
  aparecerZombiesHistoria(dt) {
    const H = this.historia, d = H.def, j = this.jugador;
    this.proximoZombie -= dt;
    const despiertos = this.zombies.filter(z => z.estado !== 'muerto' && !z.dormido).length;   // los dormidos no cuentan
    if (this.proximoZombie > 0 || despiertos >= (this.jefeVivo() ? Math.ceil(d.maxVivos / 2) : d.maxVivos)) return;   // con el jefe, menos
    const avance = limitar((j.x - H.inicio) / d.largo, 0, 1);
    this.proximoZombie = (d.intervalo[0] + Math.random() * (d.intervalo[1] - d.intervalo[0])) * (1 - avance * 0.25);
    const grupo = 1 + Math.floor(Math.random() * d.grupo);
    for (let k = 0; k < grupo; k++) {
      const atras = Math.random() < 0.15 && j.x > H.inicio + ANCHO;
      const x = atras ? this.camaraX - 60 - Math.random() * 160 : this.camaraX + ANCHO + 60 + Math.random() * 260;
      if (x > H.meta - 120 || alturaSuelo(x) > SUELO_BASE + 100) continue;   // ni después de la meta ni en un precipicio
      this.zombies.push(this.zombieHistoria(x, Math.random() < d.corredores));
    }
  },
  // Horda final: al acercarse a la meta entra un grupo grande de golpe, con corredores
  hordaHistoria() {
    const H = this.historia, d = H.def, j = this.jugador;
    if (H.horda || !d.horda || j.x < H.meta - d.horda[0]) return;
    H.horda = true;
    for (let k = 0; k < d.horda[1]; k++) {
      let x = this.camaraX + ANCHO + 40 + k * 70 + Math.random() * 40;
      if (alturaSuelo(x) > SUELO_BASE + 100) x += 320;
      this.zombies.push(this.zombieHistoria(Math.min(x, H.meta - 140), Math.random() < d.corredores + 0.2));
    }
    this.avisoRonda(t('hist.aviso.horda'), '☠ × ' + d.horda[1]); Audio_.sirena();
  },

  /* Movimiento del jugador en la historia: escaleras de mano, sogas que se balancean y precipicios */
  extremoSoga(s) {
    const [dx, hPivote, largo] = s, P = 2.6, A = 0.78, w = 2 * Math.PI / P, f = this.tiempoJugado * w + dx * 0.01;
    const ang = A * Math.sin(f), dAng = A * w * Math.cos(f);
    const px = this.historia.inicio + dx, py = SUELO_BASE - hPivote;
    return { x: px + Math.sin(ang) * largo, y: py + Math.cos(ang) * largo, vx: Math.cos(ang) * largo * dAng / 60, vy: -Math.sin(ang) * largo * dAng / 60, px, py };
  },
  moverJugadorHistoria(dt, e) {
    const j = this.jugador, H = this.historia, d = H.def, neutral = { ...e, derecha: false, izquierda: false, saltarPulsado: false, abajo: false };
    if (j.protegido || j.muerto) { j.actualizar(dt, neutral, this); return; }
    // Colgado de una soga: sigue el extremo; saltando se suelta con el impulso del balanceo
    if (j.soga) {
      j.actualizar(dt, neutral, this);
      const p = this.extremoSoga(j.soga);
      j.x = p.x; j.y = p.y + 70; j.vy = 0; j.enSuelo = false;
      if (e.saltarPulsado) { j.impulso = p.vx * 1.15; j.vy = Math.min(-5, p.vy - 6); j.soga = null; j.sogaLibreHasta = this.ahora + 450; Audio_.recoger && Audio_.recoger(); }
      e.saltarPulsado = false; return;
    }
    // Trepando una escalera de mano: sube o baja sola hasta el otro extremo
    if (j.trepa) {
      j.actualizar(dt, neutral, this);
      const T = j.trepa; T.f = Math.min(1, T.f + dt * 110 / Math.abs(T.y1 - T.y0));
      j.x = T.x; j.y = T.y0 + (T.y1 - T.y0) * T.f; j.vy = 0; j.enSuelo = true;
      if (T.f >= 1) { j.x = T.xFin; j.y = alturaSuelo(T.xFin); j.trepa = null; }
      return;
    }
    for (const [dx, h] of d.escaleras || []) {
      const lx = H.inicio + dx, base = alturaSuelo(lx - 12), arriba = SUELO_BASE - h;
      if (e.saltarPulsado && j.enSuelo && Math.abs(j.x - (lx - 14)) < 28 && Math.abs(j.y - base) < 10) { j.trepa = { x: lx - 10, y0: base, y1: arriba, f: 0, xFin: lx + 22 }; e.saltarPulsado = false; j.direccion = 1; return j.actualizar(dt, neutral, this); }
      if (e.abajo && j.enSuelo && Math.abs(j.x - (lx + 22)) < 26 && Math.abs(j.y - arriba) < 10) { j.trepa = { x: lx - 10, y0: arriba, y1: base, f: 0, xFin: lx - 34 }; return j.actualizar(dt, neutral, this); }
    }
    j.actualizar(dt, e, this);
    // En el aire, cerca del extremo de una soga: se agarra
    if (!j.enSuelo && this.ahora > (j.sogaLibreHasta || 0)) for (const s of d.sogas || []) {
      const p = this.extremoSoga(s);
      if (Math.hypot(j.x - p.x, j.y - 70 - p.y) < 36) { j.soga = s; j.impulso = 0; j.vy = 0; this.aviso(t('hist.pista.soga'), 1400); break; }
    }
  },
  // Precipicios, fuego y punto seguro para volver después de una caída
  peligrosHistoria() {
    const H = this.historia, d = H.def, j = this.jugador;
    if (j.muerto) return;
    const firme = x => alturaSuelo(x) < SUELO_BASE + 60;
    if (j.enSuelo && !j.trepa && !j.soga && firme(j.x) && firme(j.x - 50) && firme(j.x + 50)) H.seguro = { x: j.x, y: j.y };
    if (j.y > SUELO_BASE + 150) {   // cayó al vacío
      j.vida = Math.max(0, j.vida - 25); Audio_.jugadorHerido(); H.caidas++;
      if (j.vida <= 0) { j.muerto = true; Audio_.jugadorMuere(); return; }
      j.x = H.seguro.x; j.y = H.seguro.y; j.vy = 0; j.impulso = 0; j.enSuelo = true; j.invulnerableHasta = this.ahora + 1500;
      this.aviso(t('hist.aviso.caida'), 1600); this.sacudida = 8;
    }
    for (const [a, b] of d.fuegos || []) {
      if (j.enSuelo && j.x > H.inicio + a && j.x < H.inicio + b && j.y > SUELO_BASE - 4 && this.ahora >= H.proximoFuego) {
        H.proximoFuego = this.ahora + 450; j.recibirDano(8, this); this.aviso(t('hist.aviso.fuego'), 900);
      }
    }
    // Pistas: cerca de una escalera
    for (const [dx, h] of d.escaleras || []) {
      const lx = H.inicio + dx;
      if (j.enSuelo && !j.trepa && Math.abs(j.x - (lx - 14)) < 40 && Math.abs(j.y - alturaSuelo(lx - 12)) < 10 && this.ahora > (H.pistaHasta || 0)) { this.aviso(t('hist.pista.escalera'), 1500); H.pistaHasta = this.ahora + 4000; }
    }
  },

  // Bordes del nivel, cámara y llegada a la meta
  actualizarHistoria() {
    const H = this.historia, j = this.jugador;
    this.peligrosHistoria(); this.hordaHistoria(); this.ambienteHistoria();
    if (j.x < H.inicio - 80) j.x = H.inicio - 80;
    if (j.x > H.meta + 30) j.x = H.meta + 30;
    this.jefeHistoria();                                   // el jefe cierra el paso a la meta mientras viva
    this.camaraX = Math.max(this.camaraX, H.inicio - ANCHO * 0.35);
    if (!this.terminado && !j.muerto && j.x >= H.meta - 6) {
      this.terminado = true; this.resultado = 'nivel-superado';
      H.bajasTotal += this.bajas; H.tiempoTotal += this.tiempoJugado;
      Audio_.rondaSuperada(); Musica.detener(0.6);
    }
  },

  // Ambiente de la ciudad: cada 3 a 8 s suena algo a lo lejos (bocinas y alarmas de autos, más alguna sirena o
  // un helicóptero); en el barrio, de vez en cuando, una alarma lejana
  ambienteHistoria() {
    const H = this.historia, tema = H.def.clave;
    if (tema !== 'ciudad' && tema !== 'barrio') return;
    if (H.proximoSonido === undefined) H.proximoSonido = this.ahora + 1500;
    if (this.ahora < H.proximoSonido) return;
    const lejos = 0.3 + Math.random() * 0.6, r = Math.random();
    if (tema === 'ciudad') {
      if (r < 0.4) Audio_.bocina(lejos); else if (r < 0.75) Audio_.alarmaAuto(lejos); else if (r < 0.9) Audio_.sirenaLejana(); else Audio_.helicoptero();
      H.proximoSonido = this.ahora + 3000 + Math.random() * 5000;
    } else { Audio_.alarmaAuto(0.85); H.proximoSonido = this.ahora + 14000 + Math.random() * 10000; }
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
  // Cerros en píxeles con la cumbre nevada
  const cerros = (c, base, alto, luz, sombra, sal) => {
    for (let k = -1; k < 8; k++) {
      const cx = k * 48 + azar(k, sal) * 20, h = alto * (0.6 + azar(k, sal + 1) * 0.4);
      for (let y = 0; y < h; y += 2) { const w = (y / h) * h * 0.9; R(c, cx - w, base - h + y, w, 2, luz); R(c, cx, base - h + y, w, 2, sombra); if (y < h * 0.28) { R(c, cx - w, base - h + y, w * 2, 2, y < h * 0.15 ? '#f2f4fa' : '#c8d0e0'); } }
    }
  };
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
      cerros(c, 160, 80, '#2a3048', '#1c2238', 3);   // la cordillera nevada, de noche
      const k = Math.min(1, (t % 6) / 4.5), x = 40 + k * 170, y = 30 + k * 90;
      for (let s = 0; s < 14; s++) { const f = s / 14; R(c, x - 6 - f * 70 + Math.sin(t * 5 + s) * 2, y - 2 - f * 38, 6 - f * 2, 6 - f * 2, `rgba(${80 + s * 4},${70 + s * 3},${80 + s * 3},${0.9 - f * 0.6})`); }
      c.save(); c.translate(x, y); c.rotate(0.5); avion(c, -20, -3, 1); c.restore();
      fuego(c, x + 2, y + 6, t, 1);
      for (let p = 0; p < 30; p++) pino(c, p * 11 + (p % 3) * 3, 180 - 8, 12 + (p % 4) * 4, p % 2 ? '#0f2a1a' : '#12331f');
      R(c, 0, 172, W, 8, '#081a10');
    },
    // 3. Amanecer en el lugar del choque: el sobreviviente se levanta entre los restos
    intro3(c, t) {
      bandas(c, ['#2a2340', '#4a2f55', '#7d4a5e', '#b8625c', '#e0895a', '#f2c27a'], 0, 120); sol(c, 70, 112, 16, '#ffe29a');
      cerros(c, 112, 80, '#6a6a92', '#4a4a72', 5);
      for (let p = 0; p < 20; p++) pino(c, p * 17 + 5, 124, 18 + (p % 3) * 6, '#2a3530');
      R(c, 0, 120, W, 60, '#6a6e66'); R(c, 0, 140, W, 40, '#545850'); R(c, 0, 160, W, 20, '#3e423c');
      for (let k = 0; k < 14; k++) R(c, azar(k, 520) * W, 124 + azar(k, 521) * 50, 14 + azar(k, 522) * 20, 2, '#eef2f8');   // nieve
      R(c, 150, 116, 60, 18, '#b9bec6'); R(c, 150, 116, 60, 3, '#e6e9ee'); for (let k = 0; k < 7; k++) R(c, 156 + k * 7, 121, 3, 3, '#2b3e55');   // fuselaje partido
      R(c, 208, 112, 4, 24, '#6b7280'); R(c, 230, 124, 40, 6, '#a7adb6'); R(c, 262, 102, 10, 22, '#c9ced6'); R(c, 264, 104, 6, 8, '#c0392b');   // ala y cola
      fuego(c, 212, 128, t, 1.6); humo(c, 212, 110, t, 8); fuego(c, 238, 126, t, 1);
      c.save(); c.translate(110, 152); c.scale(2, 2); padre(c, 0, 0, t); c.restore();
      R(c, 40, 132, 3, 22, '#5a3a1a'); R(c, 26, 126, 36, 12, '#7a5a2a'); R(c, 27, 127, 34, 10, '#9a7a3a'); texto(c, 'PADUA 1600 KM', 44, 135, '#2a1a08', 5);
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
      const nodos = [[34, 120], [104, 70], [174, 112], [240, 64], [292, 100]], kms = [1600, 1550, 60, 15, 0];
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
    const tema = p.escena === 'final' ? 'retroFinal' : p.victoria ? 'retroVictoria' : 'retro';   // nivel superado: fanfarria
    if (tema !== musica) { Audio_.activar(); Musica.tocar(tema); musica = tema; }
    inicioEscena = performance.now(); letras = 0; textoActual = p.texto || '';
    $('historia-titulo').textContent = p.titulo || '';
    $('historia-texto').textContent = '';
    $('historia-datos').innerHTML = p.datos ? p.datos.map(([k, v]) => `<div><dt>${k}</dt><dd${typeof v === 'number' ? ` data-num="${v}">0` : `>${v}`}</dd></div>`).join('') : '';
    $('historia-datos').classList.toggle('oculta', !p.datos);
    $('historia-datos').classList.toggle('grande', !!p.victoria);
    // Los números suben contando y las estrellas aparecen de a una
    const numeros = [...$('historia-datos').querySelectorAll('[data-num]')], t0 = performance.now();
    const contar = ahora => { const f = Math.min(1, (ahora - t0) / 1400); for (const el of numeros) el.textContent = Math.round(+el.dataset.num * (1 - Math.pow(1 - f, 3))); if (f < 1 && activa) requestAnimationFrame(contar); };
    if (numeros.length) requestAnimationFrame(contar);
    const caja = $('historia-estrellas');
    caja.innerHTML = p.estrellas ? `<span class="rotulo">${t('hist.calificacion')}</span>` + [1, 2, 3].map(k => `<span class="estrella" data-k="${k}">★</span>`).join('') : '';
    caja.classList.toggle('oculta', !p.estrellas);
    if (p.estrellas) [1, 2, 3].forEach(k => setTimeout(() => { const el = caja.querySelector(`[data-k="${k}"]`); if (!el || !activa) return; el.classList.add(k <= p.estrellas ? 'ganada' : 'vacia'); if (k <= p.estrellas) Audio_.recoger(); }, 1500 + k * 380));
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
    const datos = [[t('hist.dato.nivel'), juego.bajas], [t('hist.dato.total'), estado.bajasTotal], [t('hist.dato.km'), d.kmDesde - d.kmHasta],
      [t('hist.dato.tiempoNivel'), formatearTiempo(juego.tiempoJugado)], [t('hist.dato.tiempoTotal'), formatearTiempo(estado.tiempoTotal)], [t('hist.dato.vida'), Math.ceil(j.vida)],
      [t('hist.dato.corazones'), H.corazones], [t('hist.dato.radios'), H.radios], [t('hist.dato.aereos'), H.aereos],
      [t('hist.dato.caidas'), H.caidas], [t('hist.dato.disparos'), H.disparos], [t('hist.dato.encontradas'), H.armas.length]];
    // Calificación: 3 estrellas con mucha vida y sin caídas; 1 si llegó a duras penas
    const estrellas = j.vida >= 60 && H.caidas === 0 ? 3 : j.vida >= 30 && H.caidas <= 1 ? 2 : 1;
    const resumen = { escena: 'mapa', n: Math.min(5, n + 1), titulo: t('hist.superado', { n }) + ' · ' + t('hist.nivel' + n), texto, datos, estrellas, victoria: true };
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
