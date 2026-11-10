/* ===== Escenario, parte 1: cielo, cordillera, ciudad lejana y suelo en perspectiva =====
 * Modelo de profundidad: los pies de los personajes están en la "línea de juego" y = alturaSuelo(x).
 * La calle es una banda que va desde la vereda del fondo (y - FONDO_CALLE) hasta el borde de
 * adelante (y + FRENTE_CALLE), como si la cámara estuviera un poco elevada. Las montañas son mesetas:
 * cara de arriba iluminada y pared de roca hacia el frente.
 */
const FONDO_CALLE = 50, FRENTE_CALLE = 100;

const Escenario = {
  dibujarCielo(ctx, camaraX, tiempo) {
    const g = ctx.createLinearGradient(0, 0, 0, SUELO_BASE);
    g.addColorStop(0, '#1d1226');
    g.addColorStop(0.45, '#6b2f2c');
    g.addColorStop(0.8, '#c97a3f');
    g.addColorStop(1, '#e4b06a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ANCHO, ALTO);

    // Nubes alargadas de polvo, muy lentas
    ctx.fillStyle = 'rgba(255, 200, 150, 0.09)';
    for (let k = 0; k < 6; k++) {
      const x = ((k * 260 - camaraX * 0.03 - tiempo * 4) % 1600 + 1600) % 1600 - 300;
      ctx.beginPath(); ctx.ellipse(x, 120 + k * 28, 160 + k * 20, 9 + k * 2, 0, 0, Math.PI * 2); ctx.fill();
    }

    // Sol enorme y pálido, con halo
    const solX = ((700 - camaraX * 0.01) % 2000 + 2000) % 2000 - 300;
    const halo = ctx.createRadialGradient(solX, 285, 40, solX, 285, 160);
    halo.addColorStop(0, 'rgba(255, 214, 150, 0.35)'); halo.addColorStop(1, 'rgba(255, 214, 150, 0)');
    ctx.fillStyle = halo; ctx.fillRect(solX - 160, 125, 320, 320);
    ctx.fillStyle = 'rgba(255, 224, 170, 0.95)';
    ctx.beginPath(); ctx.arc(solX, 285, 58, 0, Math.PI * 2); ctx.fill();

    // Cordilleras con cara iluminada y cara en sombra, cada vez más cerca y más oscuras
    this.cordillera(ctx, camaraX, 0.08, 318, 90, '#6a4052', '#4a2c3c', 7);
    this.cordillera(ctx, camaraX, 0.16, 352, 70, '#8a5048', '#5e3634', 13);
    this.ciudad(ctx, camaraX, tiempo);
    this.cordillera(ctx, camaraX, 0.35, 392, 30, '#c48d55', '#a3703f', 29);   // dunas cercanas
  },

  // Picos triangulares: la cara izquierda recibe la luz del sol, la derecha queda en sombra
  cordillera(ctx, camaraX, factor, baseY, amplitud, luz, sombra, sal) {
    const desplaza = camaraX * factor, paso = 150;
    const inicio = Math.floor(desplaza / paso) - 1;
    ctx.fillStyle = sombra; ctx.fillRect(0, baseY - 1, ANCHO, ALTO - baseY);   // relleno hasta abajo
    for (let k = inicio; k < inicio + ANCHO / paso + 3; k++) {
      const x = k * paso - desplaza;
      const h = (0.35 + azar(k, sal) * 0.65) * amplitud;
      const cima = x + paso * (0.3 + azar(k, sal + 1) * 0.4);
      ctx.fillStyle = luz;
      ctx.beginPath(); ctx.moveTo(x - 20, baseY); ctx.lineTo(cima, baseY - h); ctx.lineTo(cima, baseY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = sombra;
      ctx.beginPath(); ctx.moveTo(cima, baseY - h); ctx.lineTo(x + paso + 20, baseY); ctx.lineTo(cima, baseY); ctx.closePath(); ctx.fill();
    }
  },

  // Ciudad en ruinas a lo lejos, con neblina encima para que quede atrás
  ciudad(ctx, camaraX, tiempo) {
    const factor = 0.3, desplaza = camaraX * factor, baseY = 372;
    const inicio = Math.floor(desplaza / SEGMENTO_CIUDAD) - 1;
    for (let k = inicio; k < inicio + ANCHO / SEGMENTO_CIUDAD + 3; k++) {
      const e = edificioDeColumna(k);
      if (!e) continue;
      const x = e.x - desplaza;
      ctx.fillStyle = '#4a3346';
      if (e.roto) {
        ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - e.alto * 0.7); ctx.lineTo(x + e.ancho * 0.3, baseY - e.alto);
        ctx.lineTo(x + e.ancho * 0.55, baseY - e.alto * 0.8); ctx.lineTo(x + e.ancho, baseY - e.alto * 0.9); ctx.lineTo(x + e.ancho, baseY); ctx.closePath(); ctx.fill();
      } else ctx.fillRect(x, baseY - e.alto, e.ancho, e.alto);
      ctx.fillStyle = '#5c4258'; ctx.fillRect(x + e.ancho, baseY - e.alto * 0.85, 8, e.alto * 0.85);   // cara lateral
      ctx.fillStyle = 'rgba(255, 190, 120, 0.18)';
      for (let yy = baseY - 14; yy > baseY - e.alto * 0.7; yy -= 16) for (let xx = x + 8; xx < x + e.ancho - 8; xx += 14) if (azar(k * 100 + yy + xx, 95) < 0.35) ctx.fillRect(xx, yy, 6, 8);
      if (e.antena) { ctx.fillStyle = '#4a3346'; ctx.fillRect(x + e.ancho / 2, baseY - e.alto - 30, 2, 30); }
    }
    const neblina = ctx.createLinearGradient(0, 220, 0, baseY);
    neblina.addColorStop(0, 'rgba(228, 176, 106, 0.1)'); neblina.addColorStop(1, 'rgba(228, 176, 106, 0.45)');
    ctx.fillStyle = neblina; ctx.fillRect(0, 220, ANCHO, baseY - 220);
  },

  // Suelo en perspectiva: vereda del fondo, asfalto con líneas, mesetas de roca con pared al frente
  dibujarSuelo(ctx, camaraX) {
    const paso = 8;
    const inicio = Math.floor(camaraX / paso) * paso;
    for (let wx = inicio; wx < camaraX + ANCHO + paso; wx += paso) {
      const y = alturaSuelo(wx), sx = wx - camaraX;
      const fondo = y - FONDO_CALLE, frente = y + FRENTE_CALLE;
      const esCalle = y >= SUELO_BASE - 0.5;
      if (esCalle) {
        // Vereda y cordón del fondo
        ctx.fillStyle = '#b5a384'; ctx.fillRect(sx, fondo - 14, paso, 14);
        ctx.fillStyle = '#8f7f64'; ctx.fillRect(sx, fondo - 3, paso, 3);
        // Asfalto: más claro al fondo (neblina), más oscuro adelante
        const g = ctx.createLinearGradient(0, fondo, 0, frente);
        g.addColorStop(0, '#5a5258'); g.addColorStop(0.35, '#3d3840'); g.addColorStop(1, '#262226');
        ctx.fillStyle = g; ctx.fillRect(sx, fondo, paso, frente - fondo);
        // Líneas laterales blancas gastadas y la doble amarilla del centro, cortada
        ctx.fillStyle = 'rgba(230, 225, 210, 0.35)'; ctx.fillRect(sx, fondo + 6, paso, 2); ctx.fillRect(sx, frente - 10, paso, 3);
        if (!Mundo.carriles && Math.floor(wx / 48) % 2 === 0) { ctx.fillStyle = '#b8932e'; ctx.fillRect(sx, y + 18, paso, 3); ctx.fillRect(sx, y + 24, paso, 3); }
        if (azar(Math.floor(wx / 16), 99) < 0.14) {   // grietas: trazos finos en zigzag
          const gy = fondo + 12 + azar(wx, 98) * 120;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(sx + 5, gy + 4); ctx.lineTo(sx + 3, gy + 9); ctx.lineTo(sx + 8, gy + 13); ctx.stroke();
        }
      } else {
        // Meseta: cara superior iluminada con estratos de arena, pared de roca hacia adelante
        const t = (SUELO_BASE - y) / ALTURA_MONTANA;
        const g = ctx.createLinearGradient(0, fondo, 0, frente);
        g.addColorStop(0, `rgb(${215 - t * 20}, ${178 - t * 20}, ${118 - t * 10})`);
        g.addColorStop(1, `rgb(${172 - t * 20}, ${132 - t * 16}, ${84 - t * 10})`);
        ctx.fillStyle = g; ctx.fillRect(sx, fondo, paso, frente - fondo);
        ctx.fillStyle = 'rgba(255, 240, 200, 0.35)'; ctx.fillRect(sx, fondo, paso, 3);   // filo iluminado
        ctx.fillStyle = 'rgba(0,0,0,0.07)';
        for (let yy = fondo + 24; yy < frente; yy += 30) ctx.fillRect(sx, yy + Math.sin(wx * 0.04) * 4, paso, 2);
        if (frente < ALTO) {
          const pared = ctx.createLinearGradient(0, frente, 0, ALTO);
          pared.addColorStop(0, `rgb(${120 - t * 20}, ${84 - t * 16}, ${56 - t * 10})`);
          pared.addColorStop(1, `rgb(${70 - t * 10}, ${48 - t * 8}, ${34 - t * 6})`);
          ctx.fillStyle = pared; ctx.fillRect(sx, frente, paso, ALTO - frente);
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          for (let yy = frente + 16; yy < ALTO; yy += 28) ctx.fillRect(sx, yy + Math.sin(wx * 0.07) * 5, paso, 3);
        }
      }
    }
  },
};
