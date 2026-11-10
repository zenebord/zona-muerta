/* ===== Cloaca: canal subterráneo gigante (mapa de la pelea infinita) =====
 * Vista de costado de un túnel de ladrillo: pared del fondo con caños y desagües, bóveda que se curva hacia
 * la cámara (cada hilada de la bóveda se desplaza más rápido: así se lee la curva), arcos de refuerzo de piedra,
 * faroles enjaulados, haces de luz de las bocas de tormenta, la vereda mojada por donde se camina y,
 * adelante, el canal de agua verde que corre. dibujarCloacaFrente pone niebla y columnas delante de todo.
 */
const CLOACA = { PISO: SUELO_BASE - FONDO_CALLE, ARRANQUE: 178, BORDE: SUELO_BASE + 22, AGUA: SUELO_BASE + 32, F_PARED: 0.82 };

Object.assign(Escenario, {
  dibujarCloaca(ctx, camaraX, tiempo = 0) {
    const { PISO, ARRANQUE, BORDE, AGUA, F_PARED } = CLOACA;
    const proy = (X, f) => (X - camaraX - ANCHO / 2) * f + ANCHO / 2;
    const rango = (paso, f, margen = 1) => {
      const media = ANCHO / 2 / f, c = camaraX + ANCHO / 2;
      return [Math.floor((c - media) / paso) - margen, Math.floor((c + media) / paso) + margen];
    };
    let a, b, g;

    /* --- Hiladas de ladrillo: pared (factor fijo) y bóveda (factor creciente hacia arriba) --- */
    ctx.fillStyle = '#100f0c'; ctx.fillRect(0, 0, ANCHO, PISO);
    const hilada = (y0, alto, f, fila, base, oscuro) => {
      const L = 30 / f;   // ladrillo de 30 px en pantalla
      ctx.fillStyle = base; ctx.fillRect(0, y0, ANCHO, alto);
      [a, b] = rango(L, f);
      const corrido = fila % 2 ? L / 2 : 0;
      for (let k = a; k <= b; k++) {
        const x = proy(k * L + corrido, f), v = azar(k, 700 + fila);
        if (v < 0.35) { ctx.fillStyle = `rgba(0,0,0,${0.12 + v * 0.4})`; ctx.fillRect(x, y0, 30, alto); }
        else if (v > 0.82) { ctx.fillStyle = `rgba(150,120,80,${(v - 0.82) * 0.9})`; ctx.fillRect(x, y0, 30, alto); }
        ctx.fillStyle = oscuro; ctx.fillRect(x, y0, 1.3, alto);   // junta vertical
      }
      ctx.fillStyle = oscuro; ctx.fillRect(0, y0 + alto - 1.3, ANCHO, 1.3);   // junta horizontal
      ctx.fillStyle = 'rgba(255,240,200,0.05)'; ctx.fillRect(0, y0, ANCHO, 1);   // canto de arriba con algo de luz
    };
    let fila = 0;
    for (let y = PISO - 13; y > ARRANQUE - 13; y -= 13, fila++) hilada(y, 13, F_PARED, fila, '#4a3b2c', 'rgba(15,10,6,0.75)');
    // Bóveda: hiladas cada vez más altas y más rápidas a medida que suben (se acercan a la cámara)
    const boveda = [];
    for (let k = 0, abajo = ARRANQUE; abajo > 0; k++) {
      const alto = 13 * (1 + k * 0.16), f = F_PARED + k * 0.045, y0 = abajo - alto;
      hilada(y0, alto, f, fila++, '#3d3125', 'rgba(10,7,4,0.8)');
      boveda.push([y0, alto, f]);
      abajo = y0;
    }
    // La bóveda se oscurece hacia arriba
    g = ctx.createLinearGradient(0, 0, 0, ARRANQUE + 20);
    g.addColorStop(0, 'rgba(5,5,4,0.88)'); g.addColorStop(1, 'rgba(5,5,4,0.15)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, ANCHO, ARRANQUE + 20);
    // Línea de arranque de la bóveda: una cornisa de piedra
    ctx.fillStyle = '#5c5040'; ctx.fillRect(0, ARRANQUE - 4, ANCHO, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, ARRANQUE + 2, ANCHO, 3);

    /* --- Humedad: mancha de verdín abajo y chorreaduras --- */
    g = ctx.createLinearGradient(0, PISO - 80, 0, PISO);
    g.addColorStop(0, 'rgba(50,80,25,0)'); g.addColorStop(1, 'rgba(50,80,25,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, PISO - 80, ANCHO, 80);
    [a, b] = rango(55, F_PARED);
    for (let k = a; k <= b; k++) {
      if (azar(k, 720) > 0.35) continue;
      const x = proy(k * 55 + azar(k, 721) * 40, F_PARED), y0 = ARRANQUE + azar(k, 722) * 60, largo = 40 + azar(k, 723) * 120;
      const r = ctx.createLinearGradient(0, y0, 0, y0 + largo);
      r.addColorStop(0, 'rgba(20,30,10,0.45)'); r.addColorStop(1, 'rgba(20,30,10,0)');
      ctx.fillStyle = r; ctx.fillRect(x, y0, 3 + azar(k, 724) * 5, largo);
    }

    /* --- Caños a lo largo de la pared --- */
    const cano = (y, d, base, brillo, sombra, sepBridas) => {
      g = ctx.createLinearGradient(0, y, 0, y + d);
      g.addColorStop(0, sombra); g.addColorStop(0.3, brillo); g.addColorStop(0.6, base); g.addColorStop(1, sombra);
      ctx.fillStyle = g; ctx.fillRect(0, y, ANCHO, d);
      [a, b] = rango(sepBridas, F_PARED);
      for (let k = a; k <= b; k++) {
        const x = proy(k * sepBridas, F_PARED);
        ctx.fillStyle = sombra; ctx.fillRect(x - 3, y - 2, 6, d + 4);
        ctx.fillStyle = 'rgba(255,220,170,0.15)'; ctx.fillRect(x - 3, y - 2, 6, 1.5);
        ctx.fillStyle = '#2a2420'; ctx.fillRect(x - 1.5, y + d + 2, 3, PISO - y - d - 2 > 30 ? 14 : 0);   // soporte
        if (azar(k, 730) < 0.4) {   // óxido que chorrea de la brida
          const r = ctx.createLinearGradient(0, y + d, 0, y + d + 50);
          r.addColorStop(0, 'rgba(140,70,30,0.5)'); r.addColorStop(1, 'rgba(140,70,30,0)');
          ctx.fillStyle = r; ctx.fillRect(x - 1, y + d, 3, 50);
        }
      }
    };
    cano(206, 24, '#5d4a3a', '#8a6e52', '#2a1f17', 300);
    cano(242, 10, '#4a5150', '#7a8480', '#1f2423', 220);

    /* --- Arcos de refuerzo: sillares de piedra que suben por la pared y siguen por la bóveda --- */
    const ARCO = 760;
    [a, b] = rango(ARCO, F_PARED, 2);
    const arcos = [];
    for (let k = a; k <= b; k++) {
      const X = k * ARCO, x = proy(X, F_PARED), w = 46;
      if (x < -120 || x > ANCHO + 120) continue;
      arcos.push([X, x, k]);
      g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, '#3a3228'); g.addColorStop(0.25, '#6b5d4a'); g.addColorStop(0.7, '#544838'); g.addColorStop(1, '#2a241c');
      ctx.fillStyle = g; ctx.fillRect(x - w / 2, ARRANQUE, w, PISO - ARRANQUE);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      for (let y = ARRANQUE + 26; y < PISO; y += 26) ctx.fillRect(x - w / 2, y, w, 1.5);
      // Por la bóveda: cada hilada lo corre con su propio factor y lo ensancha
      for (const [y0, alto, f] of boveda) {
        const xb = proy(X, f), wb = w * f / F_PARED;
        g = ctx.createLinearGradient(xb - wb / 2, 0, xb + wb / 2, 0);
        g.addColorStop(0, '#2c261e'); g.addColorStop(0.25, '#574b3c'); g.addColorStop(1, '#221d16');
        ctx.fillStyle = g; ctx.fillRect(xb - wb / 2, y0, wb, alto + 0.5);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(xb - wb / 2, y0 + alto - 1.5, wb, 1.5);
      }
      // Número de sector pintado
      ctx.fillStyle = 'rgba(230,220,190,0.55)'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('S-' + (((k % 40) + 40) % 40 + 1), x, PISO - 60);
    }
    // Sombra de la bóveda sobre los arcos
    g = ctx.createLinearGradient(0, 0, 0, ARRANQUE);
    g.addColorStop(0, 'rgba(5,5,4,0.8)'); g.addColorStop(1, 'rgba(5,5,4,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, ANCHO, ARRANQUE);

    /* --- Desagües: bocas redondas que vuelcan un hilo de agua a la canaleta del fondo --- */
    [a, b] = rango(ARCO, F_PARED, 1);
    for (let k = a; k <= b; k++) {
      if (azar(k, 740) < 0.25) continue;
      const x = proy(k * ARCO + ARCO / 2, F_PARED), y = 318, r = 17;
      if (x < -40 || x > ANCHO + 40) continue;
      // Mancha verde debajo
      const m = ctx.createLinearGradient(0, y, 0, PISO);
      m.addColorStop(0, 'rgba(80,140,30,0.45)'); m.addColorStop(1, 'rgba(80,140,30,0.1)');
      ctx.fillStyle = m; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.lineTo(x + 22, PISO); ctx.lineTo(x - 22, PISO); ctx.fill();
      // Aro de ladrillo y boca negra
      ctx.fillStyle = '#5e4c38'; ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) { const ang = i / 10 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r); ctx.lineTo(x + Math.cos(ang) * (r + 6), y + Math.sin(ang) * (r + 6)); ctx.stroke(); }
      ctx.fillStyle = '#050504'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      // Reja de la boca
      ctx.strokeStyle = '#3a3530'; ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 6.5, y - Math.sqrt(Math.max(0, r * r - (i * 6.5) ** 2))); ctx.lineTo(x + i * 6.5, y + Math.sqrt(Math.max(0, r * r - (i * 6.5) ** 2))); ctx.stroke(); }
      // Chorro que cae: franjas que bajan
      const caudal = 0.5 + azar(k, 741) * 0.5;
      g = ctx.createLinearGradient(0, y + r * 0.6, 0, PISO);
      g.addColorStop(0, `rgba(150,190,90,${0.55 * caudal})`); g.addColorStop(1, `rgba(150,190,90,${0.25 * caudal})`);
      ctx.fillStyle = g; ctx.fillRect(x - 4 * caudal, y + r * 0.6, 8 * caudal, PISO - y - r * 0.6);
      ctx.fillStyle = `rgba(230,255,190,${0.35 * caudal})`;
      for (let i = 0; i < 5; i++) { const yy = y + r * 0.6 + ((tiempo * 160 + i * 14) % (PISO - y)); ctx.fillRect(x - 1.5, yy, 1.2, 6); }
      // Espuma donde pega
      ctx.fillStyle = 'rgba(220,240,200,0.35)';
      ctx.beginPath(); ctx.ellipse(x, PISO + 3, 12 * caudal + Math.sin(tiempo * 9 + k) * 1.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    }

    /* --- Vereda de cemento mojado --- */
    g = ctx.createLinearGradient(0, PISO, 0, BORDE);
    g.addColorStop(0, '#3a382f'); g.addColorStop(0.5, '#33312a'); g.addColorStop(1, '#2a2923');
    ctx.fillStyle = g; ctx.fillRect(0, PISO, ANCHO, BORDE - PISO);
    // Canaleta del fondo con un hilo de agua que corre
    ctx.fillStyle = '#181a12'; ctx.fillRect(0, PISO, ANCHO, 7);
    ctx.fillStyle = 'rgba(140,190,90,0.35)';
    for (let x = ((-tiempo * 50 - camaraX * F_PARED) % 24 + 24) % 24 - 24; x < ANCHO; x += 24) ctx.fillRect(x, PISO + 3, 9, 1);
    // Losas en perspectiva
    [a, b] = rango(150, F_PARED, 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    for (let k = a; k <= b; k++) { ctx.beginPath(); ctx.moveTo(proy(k * 150, F_PARED), PISO + 7); ctx.lineTo(proy(k * 150, 1.15), BORDE); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, PISO + 34, ANCHO, 1);
    // Charcos que reflejan y rejillas de desagüe
    [a, b] = rango(130, 1.0, 2);
    for (let k = a; k <= b; k++) {
      const v = azar(k, 750), x = proy(k * 130 + azar(k, 751) * 80, 1.0), y = PISO + 14 + azar(k, 752) * (BORDE - PISO - 22);
      if (v < 0.3) {
        ctx.fillStyle = 'rgba(120,140,110,0.18)'; ctx.beginPath(); ctx.ellipse(x, y, 16 + v * 40, 3 + v * 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,220,160,0.08)'; ctx.beginPath(); ctx.ellipse(x - 4, y - 0.5, 8 + v * 15, 1.2, 0, 0, Math.PI * 2); ctx.fill();
      } else if (v > 0.9) {
        ctx.fillStyle = '#121310'; ctx.fillRect(x - 14, y - 3, 28, 7);
        ctx.fillStyle = '#4a4a42'; for (let i = 0; i < 6; i++) ctx.fillRect(x - 13 + i * 5, y - 3, 1.5, 7);
      }
    }
    // Cordón de piedra al borde del canal
    g = ctx.createLinearGradient(0, BORDE, 0, AGUA);
    g.addColorStop(0, '#6a6252'); g.addColorStop(0.3, '#4c4538'); g.addColorStop(1, '#1d1b15');
    ctx.fillStyle = g; ctx.fillRect(0, BORDE, ANCHO, AGUA - BORDE);
    ctx.fillStyle = 'rgba(255,240,200,0.12)'; ctx.fillRect(0, BORDE, ANCHO, 1);
    [a, b] = rango(60, 1.2, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    for (let k = a; k <= b; k++) ctx.fillRect(proy(k * 60, 1.2), BORDE, 1.2, AGUA - BORDE);

    /* --- Canal de agua tóxica que corre hacia la izquierda --- */
    g = ctx.createLinearGradient(0, AGUA, 0, ALTO);
    g.addColorStop(0, '#26391c'); g.addColorStop(0.35, '#172812'); g.addColorStop(1, '#070d05');
    ctx.fillStyle = g; ctx.fillRect(0, AGUA, ANCHO, ALTO - AGUA);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, AGUA, ANCHO, 4);   // sombra del cordón sobre el agua
    const corriente = tiempo * 38;
    for (let i = 0; i < 46; i++) {
      const prof = azar(i, 760), f = 1.05 + prof * 0.45;
      const x = ((azar(i, 761) * ANCHO * 1.6 - corriente * f - camaraX * f) % (ANCHO * 1.6) + ANCHO * 1.6) % (ANCHO * 1.6) - ANCHO * 0.3;
      const y = AGUA + 6 + prof * (ALTO - AGUA - 8) + Math.sin(tiempo * 2 + i) * 1.2;
      ctx.fillStyle = `rgba(170,210,120,${0.07 + (1 - prof) * 0.1})`;
      ctx.fillRect(x, y, 10 + azar(i, 762) * 34 * f, 1 + prof);
    }
    // Manchas de lodo fosforescente que flotan
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const f = 1.15, ancho = 30 + azar(i, 770) * 60;
      const x = ((azar(i, 771) * ANCHO * 2 - corriente * f - camaraX * f) % (ANCHO * 2) + ANCHO * 2) % (ANCHO * 2) - ANCHO * 0.5;
      const y = AGUA + 14 + azar(i, 772) * 40, pulso = 0.6 + Math.sin(tiempo * 1.4 + i * 2) * 0.4;
      const m = ctx.createRadialGradient(x, y, 1, x, y, ancho);
      m.addColorStop(0, `rgba(120,230,50,${0.16 * pulso})`); m.addColorStop(1, 'rgba(120,230,50,0)');
      ctx.fillStyle = m; ctx.beginPath(); ctx.ellipse(x, y, ancho, ancho * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    }

    /* --- Luz: faroles enjaulados en los arcos y haces de las bocas de tormenta --- */
    const faroles = [];
    for (const [X, x, k] of arcos) {
      let luz = 1;
      if (azar(k, 780) < 0.3) luz = Math.sin(tiempo * 23 + k) + Math.sin(tiempo * 6.1 + k * 3) > 1 ? 0.2 : 1;   // los que fallan
      if (azar(k, 781) < 0.12) luz = 0;   // alguno quemado
      faroles.push([x, luz]);
      if (!luz) continue;
      const y = 196;
      const halo = ctx.createRadialGradient(x, y, 2, x, y, 170);
      halo.addColorStop(0, `rgba(255,170,80,${0.32 * luz})`); halo.addColorStop(0.4, `rgba(255,150,60,${0.1 * luz})`); halo.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = halo; ctx.fillRect(x - 170, y - 170, 340, 340);
      // Reflejo que tiembla en el agua
      for (let i = 0; i < 9; i++) {
        const yy = AGUA + 8 + i * 6.5, dx = Math.sin(tiempo * 3 + i * 1.7 + k) * (2 + i * 0.6);
        ctx.fillStyle = `rgba(255,170,80,${(0.22 - i * 0.02) * luz})`; ctx.fillRect(x - 6 - i * 0.8 + dx, yy, 12 + i * 1.6, 2);
      }
      // Charco de luz en la vereda
      const p = ctx.createRadialGradient(x, PISO + 30, 2, x, PISO + 30, 110);
      p.addColorStop(0, `rgba(255,170,80,${0.14 * luz})`); p.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = p; ctx.beginPath(); ctx.ellipse(x, PISO + 30, 110, 28, 0, 0, Math.PI * 2); ctx.fill();
    }
    [a, b] = rango(1500, 1.1, 1);
    for (let k = a; k <= b; k++) {
      const x0 = proy(k * 1500 + 500, 1.1);
      if (x0 < -300 || x0 > ANCHO + 100) continue;
      g = ctx.createLinearGradient(0, 0, 0, BORDE);
      g.addColorStop(0, 'rgba(190,215,200,0.16)'); g.addColorStop(1, 'rgba(190,215,200,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + 34, 0); ctx.lineTo(x0 + 150, BORDE); ctx.lineTo(x0 + 70, BORDE); ctx.fill();
      // Mota de polvo y vapor en el haz
      ctx.fillStyle = 'rgba(220,235,220,0.25)';
      for (let i = 0; i < 10; i++) {
        const t = (tiempo * 0.05 + azar(i, 790 + k)) % 1;
        ctx.fillRect(x0 + 15 + t * 100 + Math.sin(tiempo + i) * 6, t * BORDE, 1.2, 1.2);
      }
    }
    ctx.restore();
    // Faroles: jaula de alambre y vidrio
    for (const [x, luz] of faroles) {
      const y = 196;
      ctx.fillStyle = '#1d1a16'; ctx.fillRect(x - 2, y - 16, 4, 8);
      ctx.fillStyle = luz ? `rgba(255,${190 + luz * 40},120,${0.5 + luz * 0.5})` : '#3a352c';
      ctx.beginPath(); ctx.ellipse(x, y, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1a1714'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(x, y, 7, 9, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9); ctx.stroke();
    }
  },

  // Delante de todo: vapor sobre el agua, gotas que caen y alguna columna en primer plano
  dibujarCloacaFrente(ctx, camaraX, tiempo = 0) {
    const { BORDE, AGUA } = CLOACA;
    // Vapor verdoso que se arrastra sobre el canal y la vereda
    for (let i = 0; i < 8; i++) {
      const f = 1.3, ancho = 140 + azar(i, 800) * 160;
      const x = ((azar(i, 801) * ANCHO * 2 - tiempo * (8 + azar(i, 802) * 10) - camaraX * f) % (ANCHO * 2) + ANCHO * 2) % (ANCHO * 2) - ANCHO * 0.5;
      const y = AGUA - 10 + azar(i, 803) * 50;
      const v = ctx.createRadialGradient(x, y, 4, x, y, ancho);
      v.addColorStop(0, 'rgba(140,170,110,0.10)'); v.addColorStop(1, 'rgba(140,170,110,0)');
      ctx.fillStyle = v; ctx.beginPath(); ctx.ellipse(x, y, ancho, ancho * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Gotas que caen de la bóveda
    ctx.fillStyle = 'rgba(200,230,180,0.55)';
    for (let i = 0; i < 7; i++) {
      const ciclo = 1.4 + azar(i, 810) * 1.6, t = ((tiempo + azar(i, 811) * ciclo) % ciclo) / ciclo;
      const x = ((azar(i, 812) * ANCHO * 1.3 - camaraX * 0.95) % (ANCHO * 1.3) + ANCHO * 1.3) % (ANCHO * 1.3) - ANCHO * 0.15;
      const yFin = BORDE - 30 + azar(i, 813) * 30, y = 40 + t * t * (yFin - 40);
      if (t < 0.97) ctx.fillRect(x, y, 1.2, 3.5);
      else { ctx.strokeStyle = 'rgba(200,230,180,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(x, yFin + 3, 5, 1.2, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    // Columnas de los arcos más cercanos, en sombra, de vez en cuando
    const f = 1.55, paso = 3100, c = camaraX + ANCHO / 2, media = ANCHO / 2 / f;
    ctx.save(); ctx.globalAlpha = 0.72;   // semitransparentes: no esconden a los zombies que vienen
    for (let k = Math.floor((c - media) / paso) - 1; k <= Math.floor((c + media) / paso) + 1; k++) {
      const x = (k * paso + 900 - camaraX - ANCHO / 2) * f + ANCHO / 2, w = 34;
      if (x < -w || x > ANCHO + w) continue;
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, '#0a0907'); g.addColorStop(0.35, '#1d1912'); g.addColorStop(1, '#070605');
      ctx.fillStyle = g; ctx.fillRect(x - w / 2, 0, w, ALTO);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      for (let y = 20; y < ALTO; y += 34) ctx.fillRect(x - w / 2, y, w, 2);
      ctx.fillStyle = 'rgba(255,170,80,0.08)'; ctx.fillRect(x + w / 2 - 4, 0, 4, ALTO);   // canto que toma la luz del farol
    }
    ctx.restore();
  },
});
