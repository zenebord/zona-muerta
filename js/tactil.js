/* ===== Controles táctiles =====
 * Detecta pantallas táctiles (puntero grueso o el primer toque) y muestra botones en pantalla.
 * Cada botón dispara la misma tecla que usa el teclado, así el juego no necesita saber de dónde viene.
 * Eventos de puntero: varios dedos a la vez (caminar y disparar), y soltar fuera del botón también suelta la tecla.
 */
(() => {
  const cuerpo = document.body;
  // Configuración «Botones en pantalla»: auto (se detecta), si (siempre) o no (nunca)
  let detectado = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  const aplicar = () => { const modo = Config.get('tactil'); cuerpo.classList.toggle('tactil', modo === 'si' || (modo !== 'no' && detectado)); };
  aplicar();
  Config.alCambiar(clave => { if (clave === 'tactil') aplicar(); });
  window.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !detectado) { detectado = true; aplicar(); } }, { passive: true });

  const enviar = (code, tipo) => document.dispatchEvent(new KeyboardEvent(tipo, { code, bubbles: true }));
  const vibrar = () => { try { if (Config.get('vibracion') && navigator.vibrate) navigator.vibrate(8); } catch { /* sin vibración */ } };
  const capturar = (el, e) => { try { el.setPointerCapture(e.pointerId); } catch { /* sin captura, igual funciona */ } };
  const despertarAudio = () => { if (typeof Audio_ !== 'undefined') Audio_.activar(); };

  // Botones: apretar manda keydown, soltar (o perder el dedo) manda keyup
  document.querySelectorAll('.boton-tactil').forEach(boton => {
    const code = boton.dataset.tecla;
    let apretado = false;
    const soltar = () => {
      if (!apretado) return;
      apretado = false; boton.classList.remove('apretado');
      enviar(code, 'keyup');
    };
    boton.addEventListener('pointerdown', e => {
      e.preventDefault(); despertarAudio(); capturar(boton, e);
      apretado = true; boton.classList.add('apretado'); vibrar();
      enviar(code, 'keydown');
    });
    boton.addEventListener('pointerup', soltar);
    boton.addEventListener('pointercancel', soltar);
    boton.addEventListener('lostpointercapture', soltar);
    boton.addEventListener('contextmenu', e => e.preventDefault());
  });

  // Barra de movimiento: la mitad donde está el dedo decide la dirección; deslizar cambia sin levantarlo
  const pad = document.querySelector('.pad-mover');
  if (pad) {
    const mitades = [...pad.querySelectorAll('.mitad')];
    let dedo = null, lado = null;
    const poner = nuevo => {
      if (nuevo === lado) return;
      if (lado) enviar(lado, 'keyup');
      lado = nuevo;
      if (lado) { enviar(lado, 'keydown'); vibrar(); }
      mitades.forEach(m => m.classList.toggle('activa', m.dataset.lado === lado));
    };
    const ladoDe = e => { const r = pad.getBoundingClientRect(); return e.clientX < r.left + r.width / 2 ? 'ArrowLeft' : 'ArrowRight'; };
    pad.addEventListener('pointerdown', e => {
      e.preventDefault(); despertarAudio();
      if (dedo !== null) return;
      dedo = e.pointerId; capturar(pad, e); poner(ladoDe(e));
    });
    pad.addEventListener('pointermove', e => { if (e.pointerId === dedo) poner(ladoDe(e)); });
    const terminar = e => { if (e.pointerId !== dedo) return; dedo = null; poner(null); };
    pad.addEventListener('pointerup', terminar);
    pad.addEventListener('pointercancel', terminar);
    pad.addEventListener('lostpointercapture', terminar);
    pad.addEventListener('contextmenu', e => e.preventDefault());
  }

  // Apaisado obligatorio: con el teléfono parado, un aviso tapa el juego (CSS) y la partida se pausa
  const parado = window.matchMedia ? matchMedia('(orientation: portrait)') : null;
  const revisarOrientacion = () => { if (parado && parado.matches && cuerpo.classList.contains('tactil') && window.ZonaMuerta) ZonaMuerta.pausar(); };
  if (parado) parado.addEventListener('change', revisarOrientacion);
  // Al empezar una partida en un teléfono: pantalla completa y orientación trabada en apaisado. Sólo anda donde
  // el navegador lo permite (Android, fuera de un marco); si no, queda el aviso de girar.
  window.Tactil = {
    alEmpezar() {
      if (!cuerpo.classList.contains('tactil')) return;
      try {
        const el = document.documentElement, pedir = el.requestFullscreen || el.webkitRequestFullscreen;
        if (pedir && !document.fullscreenElement) {
          Promise.resolve(pedir.call(el, { navigationUI: 'hide' }))
            .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
            .catch(() => { /* no se permite acá: queda el aviso */ });
        }
      } catch { /* ídem */ }
      setTimeout(revisarOrientacion, 0);
    },
  };

  // El botón de armas (tecla C) solo tiene sentido en el campo de pruebas y en el entrenamiento
  setInterval(() => {
    const j = window.ZonaMuerta && ZonaMuerta.juego();
    cuerpo.classList.toggle('en-pruebas', !!(j && (j.pruebas || j.entrenamiento)));
  }, 500);
})();
