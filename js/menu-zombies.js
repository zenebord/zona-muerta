/* ===== Menú de zombies del campo de pruebas (pedido de Enzo, 22/11) =====
 * Dos maneras de poner un zombie de prueba: ZOMBIE RANDOM (Z: el común al azar de siempre) y MENÚ DE ZOMBIES, con cada
 * zombie del juego para elegirlo: los comunes (el cocinero, el policía…), los chicos (el ciclista…), el tóxico y el
 * congelado, los del modo historia (personajes y animales), los del Último bastión y los jefes. Todos quedan quietos
 * como el de prueba (no muerden, no escupen, no tiran hielo ni embisten): miran al jugador y acusan los tiros. Hasta 5
 * a la vez (con uno más se va el más viejo) y se borran con X o BORRAR TODO (Juego.borrarGenerado).
 * Cada uno se arma igual que en su modo (zombieConEstilo, ZombieAnimal, crearJefe, crearZombieV2…), con su vida.
 */
const CATALOGO_ZOMBIES = [
  { grupo: 'comunes', ids: () => VARIANTES_CAMINANTE.map(v => 'v:' + v.id) },
  { grupo: 'chicos', ids: () => VARIANTES_CORREDOR.map(v => 'c:' + v.id) },
  { grupo: 'mapas', ids: () => ['toxico', 'congelado'] },
  { grupo: 'historia', ids: () => ['a:esquiador', 'a:gaucho', 'a:colectivero', 'a:abuela', 'a:parrillero', 'a:hincha', 'an:guanaco', 'an:ciervo', 'an:vaca', 'an:perro', 'an:gato', 'an:nandu'] },
  { grupo: 'bastion', ids: () => ['b:soldadoZombie', 'b:acorazado', 'b:griton', 'b:hinchado', 'b:dinamitero', 'b:topo', 'b:lanzador', 'b:escupidor', 'b:rabioso', 'b:cuervo', 'b:buitre'] },
  { grupo: 'jefes', ids: () => ['j:avion', 'j:ruta', 'j:ciudad', 'j:barrio', 'b:jefe', 'b:escudo', 'b:cisterna', 'b:sirena'] },
];
// Un zombie de la clave pedida, en x (la vida y el aspecto de su modo; la dificultad, la del campo de pruebas)
function crearZombieDeMenu(clave, x, dif) {
  const [tipo, id] = clave.includes(':') ? clave.split(':') : [clave, null];
  let z;
  if (tipo === 'v' || tipo === 'c') {   // comunes y chicos: el zombie de siempre con esa ropa
    const est = (tipo === 'c' ? VARIANTES_CORREDOR : VARIANTES_CAMINANTE).find(v => v.id === id);
    z = new Zombie(x, tipo === 'c', dif);
    z.estilo = est; z.escala = azarEntre(...est.escala); z.ancho = 26 * z.escala; z.alto = 64 * z.escala;
    z.colores = { ...COLORES_ZOMBIE, camiseta: variarColor(est.camiseta), pantalon: variarColor(est.pantalon) };
  } else if (tipo === 'toxico') z = new ZombieToxico(x, dif);
  else if (tipo === 'congelado') z = new ZombieCongelado(x, dif);
  else if (tipo === 'a') z = zombieConEstilo(x, id === 'hincha' ? varianteHincha() : VARIANTES_AUTOCTONAS[id], dif);
  else if (tipo === 'an') z = new ZombieAnimal(x, id, dif);
  else if (tipo === 'j') z = crearJefe(id, x, dif);
  else if (tipo === 'b') {   // los del Último bastión, como los arma el retrato de su guía (js/bastion-v2-ui.js)
    const P = Juego.prototype, falso = { dificultad: dif, ronda: 1, nivelV2: { vida: 1 }, ahora: 0, vidaComunV2: P.vidaComunV2, vestirZombieV2: P.vestirZombieV2 };
    z = P.crearZombieV2.call(falso, id, dif);
    z.x = x; z.direccion = -1;
  }
  z.x = x; z.y = alturaSuelo(x); if (z.ySuelo !== undefined) z.ySuelo = z.y;
  return z;
}
// Quieto como el zombie de prueba, aunque su clase tenga su propio comportamiento (escupir, tirar hielo, embestir):
// vivo, solo mira al jugador, respira y acusa el empujón de los tiros; muerto, cae como en su modo
function quietoDePrueba(z) {
  const propio = z.actualizar;
  z.actualizar = function (dt, jugador, juego) {
    if (this.estado === 'muerto') return propio.call(this, dt, jugador, juego);
    const paso = dt * 60;
    this.ahora = juego.ahora;
    this.direccion = jugador.x >= this.x ? 1 : -1;
    this.fase = (this.fase || 0) + dt * 1.5;
    if (Math.abs(this.empuje || 0) > 0.05) { this.x += this.empuje * paso; this.empuje *= Math.pow(0.8, paso); }
    this.y = alturaSuelo(this.x); if (this.ySuelo !== undefined) this.ySuelo = this.y;
  };
  return z;
}
// Nombre de cada uno (los del bastión y los jefes de la historia ya tienen el suyo)
const nombreZombieMenu = clave => {
  const [tipo, id] = clave.includes(':') ? clave.split(':') : [clave, null];
  if (tipo === 'b') return t('b2.z.' + id);
  if (tipo === 'j') { const n = t('hist.jefe.' + id); return n.charAt(0) + n.slice(1).toLowerCase(); }
  return t('zm.' + (id || tipo));
};

// Retrato de cada zombie: dibujado una vez, entero y centrado en un cuadrado
const retratosZombie = new Map();
function retratoZombie(clave) {
  if (retratosZombie.has(clave)) return retratosZombie.get(clave);
  const W = 420, H = 420, aparte = document.createElement('canvas'); aparte.width = W; aparte.height = H;
  const o = aparte.getContext('2d'), salida = document.createElement('canvas'); salida.width = salida.height = 112;
  try {
    const z = crearZombieDeMenu(clave, 0, DIFICULTADES.medio);
    z.x = 0; z.y = 0; if (z.ySuelo !== undefined) z.ySuelo = 0; z.direccion = 1; z.estado = 'camina'; z.fase = 1.2;
    if (z.variante) z.variante.brazoColgando = false;
    const silueta = Pincel.silueta; Pincel.silueta = null;
    o.setTransform(1, 0, 0, 1, W / 2, H - 40);
    z.dibujar(o, 0, 1000);
    Pincel.silueta = silueta;
    const datos = o.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (datos[(y * W + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 > x0) {
      const c = salida.getContext('2d'), lado = Math.max(x1 - x0, y1 - y0) + 8;
      c.drawImage(aparte, (x0 + x1) / 2 - lado / 2, (y0 + y1) / 2 - lado / 2, lado, lado, 0, 0, salida.width, salida.height);
    }
  } catch (err) { /* sin retrato */ }
  retratosZombie.set(clave, salida);
  return salida;
}

const MenuZombies = {
  abierto: false,
  juego: null,
  abrir(juego) {
    this.juego = juego; this.abierto = true;
    const capa = document.getElementById('menu-zombies'), lista = document.getElementById('lista-zombies');
    if (!lista.childElementCount || lista.dataset.idioma !== Idioma.actual()) this.pintar(lista);
    capa.classList.remove('oculta');
    document.body.classList.add('menu-armas-abierto');   // la ficha de la vitrina se esconde (CSS), como con el menú de armas
    juego.entrada.derecha = juego.entrada.izquierda = juego.entrada.disparar = juego.entrada.abajo = false;
    capa.querySelector('[data-zombie]')?.focus({ preventScroll: true });
  },
  cerrar() {
    this.abierto = false;
    document.getElementById('menu-zombies').classList.add('oculta');
    document.body.classList.remove('menu-armas-abierto');
  },
  pintar(lista) {
    lista.dataset.idioma = Idioma.actual();
    lista.innerHTML = CATALOGO_ZOMBIES.map(G => {
      const ids = G.ids();
      return `<section class="grupo-armas grupo-zombies ${G.grupo}"><h3>${t('zm.grupo.' + G.grupo)} <span>${ids.length}</span></h3><div class="rejilla-armas rejilla-zombies">` +
        ids.map(c => `<button class="boton-arma boton-zombie-menu" type="button" data-zombie="${c}"><canvas width="112" height="112" aria-hidden="true"></canvas><span>${nombreZombieMenu(c)}</span></button>`).join('') +
        `</div></section>`;
    }).join('');
    lista.querySelectorAll('[data-zombie] canvas').forEach(cv => cv.getContext('2d').drawImage(retratoZombie(cv.parentElement.dataset.zombie), 0, 0));
  },
  poner(clave) {
    const J = this.juego;
    if (!J || !J.pruebas) return;
    if (clave === 'random') J.ponerZombiePrueba();
    else J.ponerZombiePrueba(x => quietoDePrueba(crearZombieDeMenu(clave, x, J.dificultad)));
    J.aviso(t('zm.puesto', { nombre: (clave === 'random' ? t('zm.randomCorto') : nombreZombieMenu(clave)).toUpperCase() }), 1300);
  },
};
document.getElementById('menu-zombies').addEventListener('click', e => {
  const b = e.target.closest('[data-zombie]');
  if (!b || !MenuZombies.juego) return;
  const clave = b.dataset.zombie;
  if (clave === 'cerrar') return MenuZombies.cerrar();
  if (clave === 'borrar') { MenuZombies.juego.borrarGenerado(); return; }
  MenuZombies.poner(clave);
  MenuZombies.cerrar();   // a la vista para probarlo enseguida
});

/* ---------- Textos (los de la cámara lenta, también) ---------- */
Object.assign(TEXTOS.es, {
  'lenta.0': 'NORMAL', 'lenta.1': 'LENTA', 'lenta.2': 'MUY LENTA', 'lenta.3': 'EXTREMA',
  'lenta.aviso0': 'VELOCIDAD NORMAL', 'lenta.aviso1': 'CÁMARA LENTA (×½)', 'lenta.aviso2': 'CÁMARA MUY LENTA (×¼)', 'lenta.aviso3': 'CÁMARA EXTREMADAMENTE LENTA (×⅒)',
  'zm.random': '+ ZOMBIE RANDOM (Z)', 'zm.randomCorto': 'ZOMBIE RANDOM', 'zm.menu': 'MENÚ DE ZOMBIES', 'zm.tactil': 'ZOMBIES ▤', 'zm.borrarTactil': '✕ BORRAR',
  'zm.titulo': 'MENÚ DE ZOMBIES', 'zm.ayuda': 'Toca uno para ponerlo en el campo (quieto, como el de prueba). Con X o BORRAR TODO se borran.',
  'zm.puesto': v => `ZOMBIE: ${v.nombre}`,
  'zm.grupo.comunes': 'COMUNES', 'zm.grupo.chicos': 'CHICOS', 'zm.grupo.mapas': 'DE LOS MAPAS', 'zm.grupo.historia': 'DE LA HISTORIA', 'zm.grupo.bastion': 'DEL ÚLTIMO BASTIÓN', 'zm.grupo.jefes': 'JEFES',
  'zm.leñador': 'Leñador', 'zm.camisa-roja': 'Camisa roja', 'zm.oficinista': 'Oficinista', 'zm.obrero': 'Obrero', 'zm.enfermero': 'Enfermero', 'zm.policia': 'Policía',
  'zm.turista': 'Turista', 'zm.chef': 'Cocinero', 'zm.granjero': 'Granjero', 'zm.gordo': 'Gordo',
  'zm.maratonista': 'Maratonista', 'zm.basquet': 'Basquetbolista', 'zm.capucha': 'Chico de capucha', 'zm.ciclista': 'Chico bicicletero', 'zm.adolescente': 'Adolescente',
  'zm.toxico': 'Tóxico (cloaca)', 'zm.congelado': 'Congelado (nieve)',
  'zm.esquiador': 'Esquiador', 'zm.gaucho': 'Paisano', 'zm.colectivero': 'Colectivero', 'zm.abuela': 'Abuela de ruleros', 'zm.parrillero': 'Vecino del asado', 'zm.hincha': 'Hincha',
  'zm.guanaco': 'Guanaco', 'zm.ciervo': 'Ciervo', 'zm.vaca': 'Vaca', 'zm.perro': 'Perro', 'zm.gato': 'Gato', 'zm.nandu': 'Ñandú',
});
Object.assign(TEXTOS.pt, {
  'lenta.0': 'NORMAL', 'lenta.1': 'LENTA', 'lenta.2': 'MUITO LENTA', 'lenta.3': 'EXTREMA',
  'lenta.aviso0': 'VELOCIDADE NORMAL', 'lenta.aviso1': 'CÂMERA LENTA (×½)', 'lenta.aviso2': 'CÂMERA MUITO LENTA (×¼)', 'lenta.aviso3': 'CÂMERA EXTREMAMENTE LENTA (×⅒)',
  'zm.random': '+ ZUMBI ALEATÓRIO (Z)', 'zm.randomCorto': 'ZUMBI ALEATÓRIO', 'zm.menu': 'MENU DE ZUMBIS', 'zm.tactil': 'ZUMBIS ▤', 'zm.borrarTactil': '✕ APAGAR',
  'zm.titulo': 'MENU DE ZUMBIS', 'zm.ayuda': 'Toque um para colocá-lo no campo (parado, como o de teste). Com X ou APAGAR TUDO eles somem.',
  'zm.puesto': v => `ZUMBI: ${v.nombre}`,
  'zm.grupo.comunes': 'COMUNS', 'zm.grupo.chicos': 'PEQUENOS', 'zm.grupo.mapas': 'DOS MAPAS', 'zm.grupo.historia': 'DA HISTÓRIA', 'zm.grupo.bastion': 'DO ÚLTIMO BASTIÃO', 'zm.grupo.jefes': 'CHEFES',
  'zm.leñador': 'Lenhador', 'zm.camisa-roja': 'Camisa vermelha', 'zm.oficinista': 'Funcionário de escritório', 'zm.obrero': 'Operário', 'zm.enfermero': 'Enfermeiro', 'zm.policia': 'Policial',
  'zm.turista': 'Turista', 'zm.chef': 'Cozinheiro', 'zm.granjero': 'Fazendeiro', 'zm.gordo': 'Gordo',
  'zm.maratonista': 'Maratonista', 'zm.basquet': 'Jogador de basquete', 'zm.capucha': 'Garoto de capuz', 'zm.ciclista': 'Garoto ciclista', 'zm.adolescente': 'Adolescente',
  'zm.toxico': 'Tóxico (esgoto)', 'zm.congelado': 'Congelado (neve)',
  'zm.esquiador': 'Esquiador', 'zm.gaucho': 'Gaúcho', 'zm.colectivero': 'Motorista de ônibus', 'zm.abuela': 'Vovó de bobes', 'zm.parrillero': 'Vizinho do churrasco', 'zm.hincha': 'Torcedor',
  'zm.guanaco': 'Guanaco', 'zm.ciervo': 'Cervo', 'zm.vaca': 'Vaca', 'zm.perro': 'Cachorro', 'zm.gato': 'Gato', 'zm.nandu': 'Ema',
});
Object.assign(TEXTOS.en, {
  'lenta.0': 'NORMAL', 'lenta.1': 'SLOW', 'lenta.2': 'VERY SLOW', 'lenta.3': 'EXTREME',
  'lenta.aviso0': 'NORMAL SPEED', 'lenta.aviso1': 'SLOW MOTION (×½)', 'lenta.aviso2': 'VERY SLOW MOTION (×¼)', 'lenta.aviso3': 'EXTREMELY SLOW MOTION (×⅒)',
  'zm.random': '+ RANDOM ZOMBIE (Z)', 'zm.randomCorto': 'RANDOM ZOMBIE', 'zm.menu': 'ZOMBIE MENU', 'zm.tactil': 'ZOMBIES ▤', 'zm.borrarTactil': '✕ CLEAR',
  'zm.titulo': 'ZOMBIE MENU', 'zm.ayuda': 'Tap one to place it on the field (standing still, like the test zombie). X or CLEAR ALL removes them.',
  'zm.puesto': v => `ZOMBIE: ${v.nombre}`,
  'zm.grupo.comunes': 'COMMON', 'zm.grupo.chicos': 'SMALL', 'zm.grupo.mapas': 'FROM THE MAPS', 'zm.grupo.historia': 'FROM THE STORY', 'zm.grupo.bastion': 'FROM LAST BASTION', 'zm.grupo.jefes': 'BOSSES',
  'zm.leñador': 'Lumberjack', 'zm.camisa-roja': 'Red shirt', 'zm.oficinista': 'Office worker', 'zm.obrero': 'Construction worker', 'zm.enfermero': 'Nurse', 'zm.policia': 'Police officer',
  'zm.turista': 'Tourist', 'zm.chef': 'Cook', 'zm.granjero': 'Farmer', 'zm.gordo': 'Big guy',
  'zm.maratonista': 'Marathon runner', 'zm.basquet': 'Basketball player', 'zm.capucha': 'Hoodie kid', 'zm.ciclista': 'Bike kid', 'zm.adolescente': 'Teenager',
  'zm.toxico': 'Toxic (sewer)', 'zm.congelado': 'Frozen (snow)',
  'zm.esquiador': 'Skier', 'zm.gaucho': 'Gaucho', 'zm.colectivero': 'Bus driver', 'zm.abuela': 'Granny in curlers', 'zm.parrillero': 'Barbecue neighbor', 'zm.hincha': 'Soccer fan',
  'zm.guanaco': 'Guanaco', 'zm.ciervo': 'Deer', 'zm.vaca': 'Cow', 'zm.perro': 'Dog', 'zm.gato': 'Cat', 'zm.nandu': 'Rhea',
});
