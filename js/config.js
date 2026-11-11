/* ===== Configuración del jugador =====
 * Se guarda en este navegador (localStorage, con try/catch: en una ventana privada puede no haber).
 * Quien necesita enterarse de un cambio se anota con Config.alCambiar(fn).
 */
/* Perillas que el asistente de construcción (js/asistente.js) puede mover sin tocar código: multiplicadores
 * de la jugabilidad. Valen 1 (o el valor original) mientras nadie pida un cambio. */
// La página tal como llegó, antes de que nadie la toque: con ella se arma el juego descargable (un solo .html)
const HTML_PAGINA = document.documentElement.outerHTML;

const AJUSTE = { velocidadJugador: 1, salto: 1, vidaJugador: 100, velocidadZombie: 1, vidaZombie: 1, mordida: 1, cantidadZombies: 1, cajas: 1 };

const Config = (() => {
  const CLAVE = 'zonaMuerta.config';
  const PREDETERMINADA = {
    general: 0.9,      // volumen general 0…1
    efectos: 0.85,     // disparos, zombies, pasos…
    musica: 0.6,       // música de cada escenario
    silencio: false,   // silenciar todo
    idioma: null,      // es | pt | en (null: según el navegador)
    calidad: 'auto',   // auto: empieza en alta y baja sola si no da abasto · alta: hasta 2× · normal: 1× · baja: 0,75× sin bisel
    tactil: 'auto',    // auto | si | no: botones en pantalla
    vibracion: true,   // vibración corta al tocar los botones en pantalla
    skin: 'sobreviviente',   // personaje elegido (js/skins.js)
  };
  let datos = { ...PREDETERMINADA };
  try { Object.assign(datos, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch { /* sin almacenamiento */ }
  // Antes la calidad predeterminada era «alta» y quedaba guardada aunque nadie la eligiera: pasa a «auto» una vez
  if (!datos.calidadAuto) { if (datos.calidad === 'alta') datos.calidad = 'auto'; datos.calidadAuto = true; }
  const oyentes = [];
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch { /* ídem */ } };
  return {
    get: clave => datos[clave],
    set(clave, valor) {
      if (datos[clave] === valor) return;
      datos[clave] = valor; guardar();
      oyentes.forEach(f => f(clave, valor));
    },
    alCambiar(f) { oyentes.push(f); },
    restablecer() {
      const { idioma, skin } = datos;   // el idioma y el personaje no se tocan al restablecer
      datos = { ...PREDETERMINADA, idioma, skin }; guardar();
      Object.keys(datos).forEach(k => oyentes.forEach(f => f(k, datos[k])));
    },
  };
})();
