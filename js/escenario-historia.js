/* ===== Escenarios del modo historia («Camino a casa») =====
 * Cuatro lugares, uno por nivel, de atrás hacia adelante: cielo, capas lejanas con paralaje, suelo y objetos
 * fijos al mundo. Al final de cada nivel, un cartel con el kilómetro; en el último, la casa.
 *   avion:  bosque al amanecer con los restos del avión (fuselaje partido, ala, cola, motor, valijas, fuego y humo)
 *   ruta:   carretera a la tarde, con neblina, postes de luz, guardarraíl, carteles y autos abandonados
 *   ciudad: la ciudad en ruinas de noche, con luna, incendios en el horizonte y faroles
 *   barrio: casas con jardín y cerca blanca al amanecer; la última es la del protagonista
 */
const EscenarioHistoria = {
  fondo(ctx, cam, t, H) {
    const tema = H.def.clave;
    if (tema === 'avion') this.fondoAvion(ctx, cam, t, H);
    else if (tema === 'ruta') this.fondoRuta(ctx, cam, t, H);
    else if (tema === 'ciudad') this.fondoCiudad(ctx, cam, t, H);
    else this.fondoBarrio(ctx, cam, t, H);
    if (tema !== 'barrio') this.cartelMeta(ctx, cam, H);
  },

  frente(ctx, cam, t, H, juego) {
    const tema = H.def.clave;
    if (tema === 'ruta') { Escenario.dibujarFrente(ctx, cam); this.partesDeAutos(ctx, cam, SUELO_BASE + 70, 0.35, 890); }
    else if (tema === 'ciudad') Escenario.dibujarFrente(ctx, cam);
    else if (tema === 'avion') { this.pastoAdelante(ctx, cam, '#4a5240'); this.valijasAdelante(ctx, cam); }
    else { this.pastoAdelante(ctx, cam, '#1e2a18'); if (juego) this.oscuridad(ctx, cam, t, juego); }   // barrio: penumbras
  },
  // Valijas abiertas y ropa desparramada delante del sendero
  valijasAdelante(ctx, cam) {
    const desde = Math.floor(cam / 160) - 1, hasta = Math.floor((cam + ANCHO) / 160) + 1;
    for (let c = desde; c <= hasta; c++) {
      if (azar(c, 895) > 0.5) continue;
      const x = c * 160 + azar(c, 896) * 100 - cam, y = SUELO_BASE + 60 + azar(c, 897) * 30, col = ['#8a2a2a', '#2a5a8a', '#3a3a3a', '#8a6a2a'][c & 3];
      ctx.fillStyle = col; ctx.fillRect(x, y - 12, 26, 12); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y - 3, 26, 3);
      ctx.save(); ctx.translate(x + 2, y - 12); ctx.rotate(-0.9); ctx.fillStyle = col; ctx.fillRect(0, -2, 26, 4); ctx.restore();   // tapa abierta
      ctx.fillStyle = ['#e8e0d0', '#c84a4a', '#4a7ac8'][c % 3]; ctx.fillRect(x + 28, y - 4, 14, 4); ctx.fillRect(x - 12, y - 2, 10, 3);   // ropa
    }
  },

  /* ---------- Piezas comunes ---------- */
  cielo(ctx, colores, alto = SUELO_BASE) {
    const g = ctx.createLinearGradient(0, 0, 0, alto);
    colores.forEach((c, i) => g.addColorStop(i / (colores.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, ANCHO, ALTO);
  },
  astro(ctx, x, y, r, color, halo) {
    if (halo) { const h = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3); h.addColorStop(0, halo); h.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = h; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); }
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  },
  estrellas(ctx, cam, t) {
    for (let k = 0; k < 90; k++) {
      const x = ((azar(k, 701) * 2400 - cam * 0.02) % 2400 + 2400) % 2400 - 200, y = azar(k, 702) * 260;
      ctx.fillStyle = `rgba(230, 230, 255, ${0.35 + 0.5 * Math.abs(Math.sin(t * 1.3 + k))})`; ctx.fillRect(x, y, k % 7 ? 1.5 : 2.5, k % 7 ? 1.5 : 2.5);
    }
  },
  // Fila de pinos (o árboles redondos) con paralaje
  arboleda(ctx, cam, factor, base, alto, color, sal, redondos = false) {
    const paso = 46, desplaza = cam * factor, inicio = Math.floor(desplaza / paso) - 1;
    ctx.fillStyle = color; ctx.fillRect(0, base - 2, ANCHO, ALTO - base + 2);
    for (let k = inicio; k < inicio + ANCHO / paso + 3; k++) {
      const x = k * paso - desplaza + azar(k, sal) * 20, h = alto * (0.6 + azar(k, sal + 1) * 0.5);
      ctx.beginPath();
      if (redondos) { ctx.ellipse(x, base - h * 0.6, h * 0.42, h * 0.5, 0, 0, Math.PI * 2); ctx.rect(x - 3, base - h * 0.3, 6, h * 0.3); }
      else { ctx.moveTo(x - h * 0.28, base); ctx.lineTo(x, base - h); ctx.lineTo(x + h * 0.28, base); }
      ctx.fill();
    }
  },
  humo(ctx, x, y, t, escala = 1) {
    for (let k = 0; k < 9; k++) {
      const f = (t * 0.12 + k / 9) % 1, r = (10 + f * 46) * escala;
      ctx.fillStyle = `rgba(${60 + f * 60}, ${56 + f * 56}, ${60 + f * 56}, ${0.5 * (1 - f)})`;
      ctx.beginPath(); ctx.arc(x + Math.sin(k * 2 + t * 0.5) * 12 * escala + f * 60 * escala, y - f * 260 * escala, r, 0, Math.PI * 2); ctx.fill();
    }
  },
  fuego(ctx, x, y, t, escala = 1) {
    for (let k = 0; k < 7; k++) {
      const f = Math.sin(t * 11 + k * 1.9), h = (16 + f * 6 + (k % 3) * 6) * escala;
      ctx.fillStyle = k % 2 ? 'rgba(255, 176, 46, 0.9)' : 'rgba(255, 90, 31, 0.9)';
      ctx.beginPath(); ctx.moveTo(x + (k - 3.5) * 5 * escala, y); ctx.quadraticCurveTo(x + (k - 3) * 5 * escala + f * 3, y - h * 0.6, x + (k - 3) * 5 * escala, y - h); ctx.quadraticCurveTo(x + (k - 2.5) * 5 * escala, y - h * 0.5, x + (k - 2.5) * 5 * escala, y); ctx.fill();
    }
    const g = ctx.createRadialGradient(x, y - 10 * escala, 2, x, y - 10 * escala, 60 * escala); g.addColorStop(0, 'rgba(255,160,60,0.35)'); g.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 60 * escala, y - 70 * escala, 120 * escala, 120 * escala);
  },
  pastoAdelante(ctx, cam, color) {
    const desde = Math.floor(cam / 38) - 1, hasta = Math.floor((cam + ANCHO) / 38) + 1;
    for (let c = desde; c <= hasta; c++) {
      if (azar(c, 720) > 0.6) continue;
      const x = c * 38 + azar(c, 721) * 30 - cam, y = SUELO_BASE + 60 + azar(c, 722) * 40, h = 10 + azar(c, 723) * 14;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 3, y); ctx.quadraticCurveTo(x + k * 4, y - h * 0.6, x + k * 6, y - h); ctx.stroke(); }
    }
  },
  sueloCampo(ctx, cam, arriba, abajo, camino) {
    const horizonte = SUELO_BASE - FONDO_CALLE;
    const g = ctx.createLinearGradient(0, horizonte, 0, ALTO); g.addColorStop(0, arriba); g.addColorStop(1, abajo);
    ctx.fillStyle = g; ctx.fillRect(0, horizonte, ANCHO, ALTO - horizonte);
    // Sendero de tierra por donde camina
    const s = ctx.createLinearGradient(0, SUELO_BASE - 18, 0, SUELO_BASE + 46); s.addColorStop(0, camino[0]); s.addColorStop(1, camino[1]);
    ctx.fillStyle = s; ctx.fillRect(0, SUELO_BASE - 18, ANCHO, 64);
    const desde = Math.floor(cam / 30) - 1, hasta = Math.floor((cam + ANCHO) / 30) + 1;
    for (let c = desde; c <= hasta; c++) {
      const x = c * 30 + azar(c, 730) * 26 - cam, y = horizonte + 6 + azar(c, 731) * (ALTO - horizonte - 10);
      ctx.fillStyle = azar(c, 732) < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,240,200,0.10)';
      ctx.beginPath(); ctx.ellipse(x, y, 3 + azar(c, 733) * 5, 1.5 + azar(c, 734) * 2, 0, 0, Math.PI * 2); ctx.fill();
    }
  },

  /* ---------- Nivel 1: la montaña cerca de Bariloche, al amanecer ----------
   * Cordillera nevada, el lago abajo, bosque de cipreses, piso de roca con manchones de nieve y los restos del
   * avión: fuselaje, ala, cola, turbinas humeando y valijas abiertas por todos lados. */
  fondoAvion(ctx, cam, t, H) {
    this.cielo(ctx, ['#1b2546', '#3e4a7a', '#9a7a9a', '#e8a88a', '#f6d2a8']);
    this.astro(ctx, 180 - cam * 0.01, 300, 30, 'rgba(255, 236, 196, 0.95)', 'rgba(255, 210, 160, 0.3)');
    this.andes(ctx, cam, 0.04, 330, 210, '#5a6a92', '#3e4a72', 71);
    this.andes(ctx, cam, 0.09, 350, 150, '#6a7aa0', '#4a5682', 73);
    // Lago Nahuel Huapi: franja de agua con reflejos
    const lg = ctx.createLinearGradient(0, 338, 0, 372); lg.addColorStop(0, '#6a88b8'); lg.addColorStop(1, '#3a5a8a');
    ctx.fillStyle = lg; ctx.fillRect(0, 338, ANCHO, 34);
    ctx.fillStyle = 'rgba(255, 220, 190, 0.25)'; for (let k = 0; k < 14; k++) { const x = ((k * 97 - cam * 0.15) % ANCHO + ANCHO) % ANCHO; ctx.fillRect(x, 342 + (k % 4) * 7, 30 + (k % 3) * 14, 2); }
    this.arboleda(ctx, cam, 0.3, 376, 74, '#2a3a34', 75);
    this.arboleda(ctx, cam, 0.5, 392, 92, '#1e2c26', 77);
    this.sueloCampo(ctx, cam, '#6a6e66', '#2e3230', ['#857a6a', '#5a5246']);
    this.nieve(ctx, cam);
    const x0 = H.inicio;
    for (const dx of [-250, 950, 1750, 2600]) { const sx = x0 + dx - cam; if (sx > -300 && sx < ANCHO + 300) this.humo(ctx, sx, SUELO_BASE - 70, t, 1.3); }
    const piezas = [['fuselaje', -260, 1], ['valijas', 120], ['turbina', 240], ['ala', 460], ['valijas', 700], ['asientos', 760], ['cola', 950], ['turbina', 1250], ['valijas', 1330],
      ['motor', 1750], ['valijas', 1980], ['asientos', 2150], ['turbina', 2380], ['fuselaje', 2600, -1], ['valijas', 3000], ['turbina', 3300], ['ala', 3500], ['valijas', 3720], ['asientos', 3900], ['turbina', 4150], ['valijas', 4300]];
    for (const [tipo, dx, lado] of piezas) {
      const sx = x0 + dx - cam;
      if (sx < -340 || sx > ANCHO + 340) continue;
      this['resto_' + tipo](ctx, sx, SUELO_BASE - FONDO_CALLE + 22, t, lado || 1);
    }
    if (H.def.terreno) this.terreno(ctx, cam, t, H);
  },
  // Cerros con la nieve en la cumbre: cara iluminada, cara en sombra y el casquete blanco
  andes(ctx, cam, factor, base, alto, luz, sombra, sal) {
    const paso = 190, desplaza = cam * factor, inicio = Math.floor(desplaza / paso) - 1;
    ctx.fillStyle = sombra; ctx.fillRect(0, base - 1, ANCHO, ALTO - base);
    for (let k = inicio; k < inicio + ANCHO / paso + 3; k++) {
      const x = k * paso - desplaza, h = (0.55 + azar(k, sal) * 0.45) * alto, cima = x + paso * (0.35 + azar(k, sal + 1) * 0.3);
      ctx.fillStyle = luz; ctx.beginPath(); ctx.moveTo(x - 60, base); ctx.lineTo(cima, base - h); ctx.lineTo(cima, base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = sombra; ctx.beginPath(); ctx.moveTo(cima, base - h); ctx.lineTo(x + paso + 60, base); ctx.lineTo(cima, base); ctx.closePath(); ctx.fill();
      const n = h * 0.32;   // nieve
      ctx.fillStyle = '#eef2f8'; ctx.beginPath(); ctx.moveTo(cima, base - h); ctx.lineTo(cima - n * 0.62, base - h + n); ctx.lineTo(cima - n * 0.3, base - h + n * 0.8); ctx.lineTo(cima - n * 0.05, base - h + n * 1.05); ctx.lineTo(cima, base - h + n * 0.85); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c8d0e0'; ctx.beginPath(); ctx.moveTo(cima, base - h); ctx.lineTo(cima, base - h + n * 0.85); ctx.lineTo(cima + n * 0.35, base - h + n * 0.95); ctx.lineTo(cima + n * 0.55, base - h + n * 0.8); ctx.closePath(); ctx.fill();
    }
  },
  nieve(ctx, cam) {
    const desde = Math.floor(cam / 70) - 1, hasta = Math.floor((cam + ANCHO) / 70) + 1;
    for (let c = desde; c <= hasta; c++) {
      if (azar(c, 740) > 0.55) continue;
      const x = c * 70 + azar(c, 741) * 50 - cam, y = SUELO_BASE - FONDO_CALLE + 6 + azar(c, 742) * 150, w = 20 + azar(c, 743) * 50;
      ctx.fillStyle = 'rgba(236, 242, 250, 0.85)'; ctx.beginPath(); ctx.ellipse(x, y, w, 3 + azar(c, 744) * 4, 0, 0, Math.PI * 2); ctx.fill();
    }
  },
  resto_turbina(ctx, sx, base, t) {
    // Turbina de avión arrancada del ala: carcasa grande, toma de aire con los álabes y humo
    const g = ctx.createLinearGradient(0, base - 64, 0, base); g.addColorStop(0, '#d2d6dc'); g.addColorStop(1, '#5a5f68');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sx, base - 32, 66, 32, -0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d2129'; ctx.beginPath(); ctx.ellipse(sx + 52, base - 34, 16, 28, -0.08, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a9099'; ctx.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = t * 2 + k * 0.785; ctx.beginPath(); ctx.moveTo(sx + 52, base - 34); ctx.lineTo(sx + 52 + Math.cos(a) * 12, base - 34 + Math.sin(a) * 22); ctx.stroke(); }
    ctx.fillStyle = '#c0392b'; ctx.fillRect(sx - 30, base - 52, 40, 5);
    this.humo(ctx, sx - 40, base - 40, t, 0.55);
  },

  /* ---------- Desniveles del nivel 1: escombros, cráteres, cajas de carga, fuselajes, escalerillas y el ala ----------
   * La cara de arriba de cada obstáculo es la línea donde se camina; el frente baja hasta delante del sendero. */
  terreno(ctx, cam, t, H) {
    const x0 = H.inicio, frente = SUELO_BASE + 34;
    for (const [a, b, h0, h1, tipo] of H.def.terreno) {
      if (tipo === 'suelo') continue;
      const sa = x0 + a - cam, sb = x0 + b - cam;
      if (sb < -40 || sa > ANCHO + 40) continue;
      const k = a;   // semilla de los detalles
      if (tipo === 'pozo') this.crater(ctx, sa, sb, SUELO_BASE - h0, t, k);
      else if (tipo === 'escombro') this.escombro(ctx, sa, sb, SUELO_BASE - h0, frente, k);
      else if (tipo === 'cajas') this.cajasCarga(ctx, sa, sb, SUELO_BASE - h0, frente, k);
      else if (tipo === 'fuselaje') this.fuselajePiso(ctx, sa, sb, SUELO_BASE - h0, frente, t, k);
      else if (tipo === 'escalera') this.escalerilla(ctx, sa, sb, h0, h1, frente);
      else if (tipo === 'ala') this.alaRampa(ctx, sa, sb, h0, h1, frente);
      else if (tipo === 'abismo') this.abismo(ctx, sa, sb, H.def.clave, t, k);
      else if (tipo === 'puente') this.puente(ctx, sa, sb);
      else if (tipo === 'auto') this.autoPiso(ctx, sa, sb, SUELO_BASE - h0, frente, k);
      else if (tipo === 'colectivo' || tipo === 'camion') this.vehiculoGrande(ctx, sa, sb, SUELO_BASE - h0, frente, tipo, k);
      else if (tipo === 'contenedor') this.contenedor(ctx, sa, sb, SUELO_BASE - h0, frente, k);
      else if (tipo === 'andamio') this.andamio(ctx, sa, sb, SUELO_BASE - h0, frente);
      else if (tipo === 'techo') this.techo(ctx, sa, sb, SUELO_BASE - h0, frente, H.def.clave, k);
      else if (tipo === 'cerca') this.cercaPiso(ctx, sa, sb, SUELO_BASE - h0, frente);
    }
    for (const [a, b] of H.def.fuegos || []) { const sa = x0 + a - cam; if (sa > -120 && sa < ANCHO + 40) for (let x = sa + 12; x < x0 + b - cam; x += 26) this.fuego(ctx, x, SUELO_BASE + 6, t, 1.1); }
    for (const [dx, h] of H.def.escaleras || []) this.escaleraMano(ctx, x0 + dx - cam, alturaSuelo(x0 + dx - 12), SUELO_BASE - h);
  },
  // Sogas: se dibujan después del suelo, colgadas de su soporte, en la posición del balanceo
  sogas(ctx, cam, juego) {
    const H = juego.historia;
    for (const s of H.def.sogas || []) {
      const p = juego.extremoSoga(s), px = p.px - cam, ex = p.x - cam;
      if (px < -300 || px > ANCHO + 300) continue;
      const tema = H.def.clave;
      if (tema === 'barrio') {   // rama de un árbol, de noche
        ctx.fillStyle = '#1a140e'; ctx.fillRect(px - 70, p.py - 8, 140, 12); ctx.fillStyle = '#0c140c'; ctx.beginPath(); ctx.ellipse(px, p.py - 30, 96, 36, 0, 0, Math.PI * 2); ctx.fill();
      } else if (tema === 'ruta') {   // pórtico de carteles de la ruta, con un cartel colgando
        ctx.fillStyle = '#5a5f66'; ctx.fillRect(px - 120, p.py - 8, 240, 10); ctx.fillRect(px - 124, p.py - 8, 8, SUELO_BASE + 20 - p.py); ctx.fillRect(px + 116, p.py - 8, 8, SUELO_BASE + 20 - p.py);
        ctx.save(); ctx.translate(px - 70, p.py + 2); ctx.rotate(0.35); ctx.fillStyle = '#1f6a3a'; ctx.fillRect(0, 0, 70, 30); ctx.strokeStyle = '#eee'; ctx.lineWidth = 2; ctx.strokeRect(3, 3, 64, 24); ctx.restore();
      } else {   // ciudad: cable de los semáforos entre dos postes
        ctx.fillStyle = '#2a2c30'; ctx.fillRect(px - 130, p.py - 6, 6, SUELO_BASE + 20 - p.py); ctx.fillRect(px + 124, p.py - 6, 6, SUELO_BASE + 20 - p.py);
        ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 127, p.py); ctx.quadraticCurveTo(px, p.py + 12, px + 127, p.py); ctx.stroke();
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(px + 40, p.py + 4, 16, 38); ctx.fillStyle = Math.sin(this.t || 0) > 0 ? '#ffc020' : '#3a3010'; ctx.beginPath(); ctx.arc(px + 48, p.py + 23, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#c9a46a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, p.py); ctx.lineTo(ex, p.y); ctx.stroke();
      ctx.strokeStyle = 'rgba(80,50,20,0.6)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(px, p.py); ctx.lineTo(ex, p.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(ex, p.y, 5, 0, Math.PI * 2); ctx.fill();   // nudo para agarrarse
    }
  },
  escaleraMano(ctx, sx, base, arriba) {
    if (sx < -60 || sx > ANCHO + 60) return;
    const x0 = sx - 22, x1 = sx - 4;
    ctx.fillStyle = '#7a8088'; ctx.fillRect(x0, arriba - 10, 3, base - arriba + 10); ctx.fillRect(x1, arriba - 10, 3, base - arriba + 10);
    ctx.fillStyle = '#9aa0a8'; for (let y = base - 8; y > arriba - 6; y -= 12) ctx.fillRect(x0, y, x1 - x0 + 3, 3);
  },
  abismo(ctx, sa, sb, tema, t, k) {
    const arriba = SUELO_BASE - FONDO_CALLE - 14, w = sb - sa;
    if (tema === 'ciudad') {   // socavón: la calle se hundió; caños rotos y agua que cae
      const g = ctx.createLinearGradient(0, arriba, 0, ALTO); g.addColorStop(0, '#2a2420'); g.addColorStop(0.3, '#120e0c'); g.addColorStop(1, '#030202');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sa - 10, arriba); for (let i = 0; i <= 8; i++) ctx.lineTo(sa + w * i / 8, arriba + 6 + azar(k + i, 783) * 14); ctx.lineTo(sb + 10, arriba); ctx.lineTo(sb + 4, ALTO); ctx.lineTo(sa - 4, ALTO); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a5e64'; ctx.fillRect(sa - 6, SUELO_BASE + 30, 30, 12); ctx.fillRect(sb - 24, SUELO_BASE + 60, 30, 12);   // caños cortados
      ctx.fillStyle = 'rgba(150, 190, 220, 0.5)'; for (let i = 0; i < 6; i++) ctx.fillRect(sa + 20 + ((i * 7 + t * 120) % 14), SUELO_BASE + 42 + ((t * 200 + i * 30) % 120), 2, 10);   // agua que cae
      this.bordeRoto(ctx, sa, sb, arriba, k);
      return;
    }
    if (tema === 'ruta') {   // bache gigante: el asfalto partido, tierra, hierros y agua barrosa en el fondo
      ctx.fillStyle = '#3a2c20'; ctx.beginPath(); ctx.moveTo(sa - 14, arriba); ctx.lineTo(sa + 16, SUELO_BASE + 60); ctx.lineTo(sb - 16, SUELO_BASE + 60); ctx.lineTo(sb + 14, arriba); ctx.closePath(); ctx.fill();
      const g = ctx.createLinearGradient(0, SUELO_BASE + 40, 0, ALTO); g.addColorStop(0, '#1e160e'); g.addColorStop(1, '#050302');
      ctx.fillStyle = g; ctx.fillRect(sa + 16, SUELO_BASE + 40, w - 32, ALTO - SUELO_BASE - 40);
      ctx.fillStyle = 'rgba(110, 90, 60, 0.6)'; ctx.fillRect(sa + 24, ALTO - 40, w - 48, 8);   // charco barroso
      ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = sa + 10 + azar(k + i, 784) * (w - 20); ctx.beginPath(); ctx.moveTo(x, arriba + 10); ctx.quadraticCurveTo(x + 8, arriba + 30, x + 4, arriba + 50); ctx.stroke(); }
      this.bordeRoto(ctx, sa, sb, arriba, k);
      return;
    }
    // Barrio: zanja inundada, de noche
    ctx.fillStyle = '#100c08'; ctx.fillRect(sa, arriba, w, ALTO - arriba);
    const agua = SUELO_BASE + 30, g = ctx.createLinearGradient(0, agua, 0, ALTO); g.addColorStop(0, '#1a2a30'); g.addColorStop(1, '#05080a');
    ctx.fillStyle = g; ctx.fillRect(sa + 6, agua, w - 12, ALTO - agua);
    ctx.fillStyle = 'rgba(200, 210, 230, 0.12)'; for (let i = 0; i < 5; i++) ctx.fillRect(sa + 10 + ((i * 53 + t * 30) % (w - 30)), agua + 8 + i * 9, 18, 2);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(sa + 20 + azar(k + i, 782) * (w - 60), agua + 4 + Math.sin(t + i) * 2, 34, 6); }
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(sa, arriba, 8, ALTO - arriba); ctx.fillRect(sb - 8, arriba, 8, ALTO - arriba);
  },
  // Pedazos de asfalto levantado en los bordes de un pozo
  bordeRoto(ctx, sa, sb, arriba, k) {
    for (const [x, lado] of [[sa, 1], [sb, -1]]) for (let i = 0; i < 3; i++) {
      const y = arriba + 20 + i * 34, w = 20 + azar(k + i, 785) * 16;
      ctx.save(); ctx.translate(x, y); ctx.rotate(lado * (0.3 + azar(k + i, 786) * 0.4));
      ctx.fillStyle = '#3d3840'; ctx.fillRect(lado > 0 ? -4 : -w + 4, -5, w, 9); ctx.fillStyle = '#8a7f64'; ctx.fillRect(lado > 0 ? -4 : -w + 4, 4, w, 3);
      ctx.restore();
    }
  },
  puente(ctx, sa, sb) {
    const y = SUELO_BASE - FONDO_CALLE - 14;
    ctx.fillStyle = '#7a7470'; ctx.fillRect(sa, y - 18, sb - sa, 6); for (let x = sa; x < sb; x += 24) ctx.fillRect(x, y - 18, 4, 18);   // baranda de atrás
    ctx.fillStyle = '#5a5450'; ctx.fillRect(sa, SUELO_BASE + 96, sb - sa, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(sa, SUELO_BASE + 110, sb - sa, ALTO);
  },
  autoPiso(ctx, sa, sb, arriba, frente, k) {
    const colores = ['#7a2a24', '#2c4a6e', '#6a6a48', '#3e5a3e', '#5a3a5a'], c = colores[Math.floor(azar(k, 790) * colores.length)];
    const w = sb - sa, base = frente - 10;
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(sa, base); ctx.lineTo(sa + 4, arriba + 22); ctx.lineTo(sa + w * 0.22, arriba + 18); ctx.lineTo(sa + w * 0.3, arriba); ctx.lineTo(sb - w * 0.28, arriba); ctx.lineTo(sb - w * 0.18, arriba + 18); ctx.lineTo(sb - 4, arriba + 22); ctx.lineTo(sb, base); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a2230'; ctx.fillRect(sa + w * 0.33, arriba + 4, w * 0.15, 14); ctx.fillRect(sa + w * 0.52, arriba + 4, w * 0.15, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sa, arriba + 30, w, 4);
    ctx.fillStyle = '#141414'; for (const x of [sa + w * 0.2, sb - w * 0.2]) { ctx.beginPath(); ctx.arc(x, base, 12, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(sa + w * 0.3, arriba, w * 0.42, 2);
  },
  vehiculoGrande(ctx, sa, sb, arriba, frente, tipo, k) {
    const w = sb - sa, base = frente - 8, col = tipo === 'colectivo' ? '#c8a23a' : '#8a8f96';
    ctx.fillStyle = col; ctx.fillRect(sa, arriba, w, base - arriba - 8);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(sa, arriba, w, 3);
    if (tipo === 'colectivo') { ctx.fillStyle = '#1a2230'; for (let x = sa + 12; x < sb - 30; x += 34) ctx.fillRect(x, arriba + 12, 26, 22); ctx.fillStyle = '#7a2a24'; ctx.fillRect(sa, arriba + 44, w, 6); }
    else { ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let x = sa + 14; x < sb - 6; x += 16) ctx.fillRect(x, arriba + 6, 3, base - arriba - 20); ctx.fillStyle = '#c0392b'; ctx.fillRect(sa + 20, arriba + 30, 70, 16); ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('CARGA', sa + 30, arriba + 42); }
    ctx.fillStyle = '#141414'; for (const x of [sa + 30, sb - 30]) { ctx.beginPath(); ctx.arc(x, base, 15, 0, Math.PI * 2); ctx.fill(); }
  },
  contenedor(ctx, sa, sb, arriba, frente, k) {
    ctx.fillStyle = azar(k, 791) < 0.5 ? '#2e5a3a' : '#3a4a6a'; ctx.fillRect(sa, arriba, sb - sa, frente - arriba - 4);
    ctx.fillStyle = '#1d2a22'; ctx.fillRect(sa - 3, arriba - 4, sb - sa + 6, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = sa + 10; x < sb - 4; x += 14) ctx.fillRect(x, arriba + 6, 3, frente - arriba - 14);
  },
  andamio(ctx, sa, sb, arriba, frente) {
    ctx.fillStyle = '#9a7a4a'; ctx.fillRect(sa, arriba, sb - sa, 7);   // tablones
    ctx.strokeStyle = '#8a9098'; ctx.lineWidth = 3;
    for (let x = sa + 4; x <= sb - 2; x += Math.max(30, (sb - sa - 8) / 2)) { ctx.beginPath(); ctx.moveTo(x, arriba + 7); ctx.lineTo(x, frente); ctx.stroke(); }
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sa + 4, arriba + 7); ctx.lineTo(sb - 4, frente - 4); ctx.moveTo(sb - 4, arriba + 7); ctx.lineTo(sa + 4, frente - 4); ctx.stroke();
  },
  techo(ctx, sa, sb, arriba, frente, tema, k) {
    // Edificio (ciudad) o casa con terraza (barrio): se camina por la terraza; ventanas en el frente
    const ciudad = tema === 'ciudad', pared = ciudad ? ['#6a5a52', '#5a6068', '#7a6a58'][Math.floor(azar(k, 792) * 3)] : ['#3a3430', '#2e3640', '#3a2e2a'][Math.floor(azar(k, 792) * 3)];
    ctx.fillStyle = pared; ctx.fillRect(sa, arriba, sb - sa, frente - arriba);
    ctx.fillStyle = ciudad ? '#3a302c' : '#1a1410'; ctx.fillRect(sa - 4, arriba - 6, sb - sa + 8, 8);   // cornisa
    for (let y = arriba + 18; y < frente - 24; y += 34) for (let x = sa + 14; x < sb - 30; x += 40) {
      const luz = azar(k + x + y, 793) < (ciudad ? 0.12 : 0.08);
      ctx.fillStyle = luz ? 'rgba(255, 210, 120, 0.8)' : ciudad ? '#2a2830' : '#0e1018'; ctx.fillRect(x, y, 22, 18);
    }
    if (ciudad) { ctx.fillStyle = '#4a4440'; ctx.fillRect(sb - 50, arriba - 28, 28, 22); ctx.fillRect(sb - 46, arriba - 6, 4, 6); ctx.fillRect(sb - 30, arriba - 6, 4, 6); }   // tanque de agua
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(sb - 8, arriba, 8, frente - arriba);
  },
  cercaPiso(ctx, sa, sb, arriba, frente) {
    ctx.fillStyle = '#eeeeee';
    for (let x = sa; x < sb; x += 10) { ctx.beginPath(); ctx.moveTo(x, frente - 8); ctx.lineTo(x, arriba + 4); ctx.lineTo(x + 4, arriba - 2); ctx.lineTo(x + 8, arriba + 4); ctx.lineTo(x + 8, frente - 8); ctx.fill(); }
    ctx.fillRect(sa - 2, arriba + 12, sb - sa + 4, 4); ctx.fillRect(sa - 2, frente - 26, sb - sa + 4, 4);
  },
  crater(ctx, sa, sb, piso, t, k) {
    const borde = SUELO_BASE - 18;
    ctx.fillStyle = '#2a1e14'; ctx.beginPath(); ctx.moveTo(sa - 12, borde); ctx.lineTo(sa + 10, piso - 6); ctx.lineTo(sb - 10, piso - 6); ctx.lineTo(sb + 12, borde); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(0, piso - 8, 0, piso + 40); g.addColorStop(0, '#4a3624'); g.addColorStop(1, '#22180f');
    ctx.fillStyle = g; ctx.fillRect(sa + 6, piso - 8, sb - sa - 12, SUELO_BASE + 46 - piso + 8);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sa + 6, piso - 8, 10, SUELO_BASE + 54 - piso);   // sombra de la pared
    for (let i = 0; i < 5; i++) { const x = sa + 20 + azar(k + i, 760) * (sb - sa - 40); ctx.fillStyle = `rgba(255, ${90 + i * 20}, 30, ${0.4 + 0.4 * Math.abs(Math.sin(t * 3 + i))})`; ctx.fillRect(x, piso - 2, 3, 2); }   // brasas
    ctx.fillStyle = '#5a4a38'; for (let i = 0; i < 6; i++) { const x = sa + azar(k + i, 761) * (sb - sa); ctx.beginPath(); ctx.ellipse(x, borde + 2, 6 + azar(k, i) * 6, 3, 0, 0, Math.PI * 2); ctx.fill(); }   // tierra levantada en el borde
  },
  escombro(ctx, sa, sb, arriba, frente, k) {
    // Montaña de losas de hormigón, chapas y hierros, con la cara de arriba por donde se camina
    const pts = [[sa - 6, frente]];
    for (let x = sa, i = 0; x <= sb; x += 12, i++) pts.push([x, arriba - 2 - azar(k + i, 770) * 7]);
    pts.push([sb + 6, frente]);
    const g = ctx.createLinearGradient(0, arriba - 10, 0, frente); g.addColorStop(0, '#9a948c'); g.addColorStop(0.5, '#6e6862'); g.addColorStop(1, '#3e3a36');
    ctx.fillStyle = g; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 6; i++) {   // losas sueltas y chapas
      const x = sa + azar(k + i, 771) * (sb - sa - 20), y = arriba + 4 + azar(k + i, 772) * (frente - arriba - 16), w = 18 + azar(k + i, 773) * 26;
      ctx.save(); ctx.translate(x, y); ctx.rotate((azar(k + i, 774) - 0.5) * 0.8);
      ctx.fillStyle = i % 3 === 0 ? '#7d838c' : '#b0aaa0'; ctx.fillRect(0, 0, w, 7); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 5, w, 2); ctx.restore();
    }
    ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 2;   // hierros retorcidos
    for (let i = 0; i < 4; i++) { const x = sa + 10 + azar(k + i, 775) * (sb - sa - 20); ctx.beginPath(); ctx.moveTo(x, arriba + 4); ctx.quadraticCurveTo(x + 6, arriba - 14, x + 14 - azar(k, i) * 20, arriba - 22); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(sa, arriba - 3, sb - sa, 2);
  },
  cajasCarga(ctx, sa, sb, arriba, frente, k) {
    // Contenedores de carga del avión, de aluminio con nervios y la etiqueta
    const g = ctx.createLinearGradient(0, arriba, 0, frente); g.addColorStop(0, '#b9c0c8'); g.addColorStop(1, '#6b7280');
    ctx.fillStyle = g; ctx.fillRect(sa, arriba, sb - sa, frente - arriba);
    ctx.fillStyle = '#e8ecf0'; ctx.fillRect(sa, arriba, sb - sa, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = sa + 10; x < sb - 4; x += 12) ctx.fillRect(x, arriba + 6, 3, frente - arriba - 10);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(sa + 8, arriba + 14, Math.min(46, sb - sa - 16), 14);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('CARGO', sa + 11, arriba + 25);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.strokeRect(sa, arriba, sb - sa, frente - arriba);
  },
  fuselajePiso(ctx, sa, sb, arriba, frente, t, k) {
    // Tramo de fuselaje acostado: se camina por el techo; ventanillas, franja roja y las puntas rotas
    const g = ctx.createLinearGradient(0, arriba - 6, 0, frente); g.addColorStop(0, '#f2f4f7'); g.addColorStop(0.35, '#c5cad2'); g.addColorStop(1, '#6b7078');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sa, frente); ctx.lineTo(sa, arriba + 8); ctx.quadraticCurveTo(sa, arriba - 4, sa + 14, arriba - 4); ctx.lineTo(sb - 14, arriba - 4); ctx.quadraticCurveTo(sb, arriba - 4, sb, arriba + 8); ctx.lineTo(sb, frente); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.fillRect(sa, arriba + 30, sb - sa, 6);
    ctx.fillStyle = '#2b3e55'; for (let x = sa + 18; x < sb - 14; x += 22) { ctx.beginPath(); ctx.ellipse(x, arriba + 18, 4, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#1d2129'; for (const x of [sa, sb - 10]) { ctx.beginPath(); ctx.moveTo(x, arriba + 4); ctx.lineTo(x + 10, arriba + 14); ctx.lineTo(x + 4, arriba + 30); ctx.lineTo(x + 10, frente - 6); ctx.lineTo(x, frente); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(sa, frente - 8, sb - sa, 8);
    this.fuego(ctx, sb - 6, arriba - 2, t, 0.8);
  },
  escalerilla(ctx, sa, sb, h0, h1, frente) {
    // Escalerilla del avión: escalones con pasamanos y la base con ruedas
    const n = Math.max(1, Math.round(Math.abs(h1 - h0) / 12)), w = (sb - sa) / n, sube = h1 > h0;
    for (let i = 0; i < n; i++) {
      const h = h0 + (h1 - h0) * (i + (sube ? 1 : 0)) / n, x = sa + i * w, y = SUELO_BASE - h;
      ctx.fillStyle = '#c9ced6'; ctx.fillRect(x, y, w + 1, 4); ctx.fillStyle = '#6b7280'; ctx.fillRect(x, y + 4, w + 1, frente - y - 4);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + w - 2, y + 4, 2, frente - y - 4);
    }
    const alto = SUELO_BASE - Math.max(h0, h1), bajoX = sube ? sa : sb, altoX = sube ? sb : sa;
    ctx.strokeStyle = '#e8ecf0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bajoX, SUELO_BASE - 30); ctx.lineTo(altoX, alto - 30); ctx.stroke();   // pasamanos
    ctx.lineWidth = 2; for (let i = 0; i <= n; i++) { const x = sa + i * w, y = SUELO_BASE - (h0 + (h1 - h0) * i / n); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 30); ctx.stroke(); }
    ctx.fillStyle = '#1d2129'; for (const x of [sa + 10, sb - 10]) { ctx.beginPath(); ctx.arc(x, frente - 2, 6, 0, Math.PI * 2); ctx.fill(); }
  },
  alaRampa(ctx, sa, sb, h0, h1, frente) {
    // El ala apoyada como rampa: chapa de aluminio con remaches y las aletas
    const y0 = SUELO_BASE - h0, y1 = SUELO_BASE - h1;
    ctx.fillStyle = '#a7adb6'; ctx.beginPath(); ctx.moveTo(sa, y0); ctx.lineTo(sb, y1); ctx.lineTo(sb, y1 + 12); ctx.lineTo(sa, y0 + 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9dde3'; ctx.beginPath(); ctx.moveTo(sa, y0); ctx.lineTo(sb, y1); ctx.lineTo(sb, y1 + 3); ctx.lineTo(sa, y0 + 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a4f58'; ctx.beginPath(); ctx.moveTo(sa, y0 + 12); ctx.lineTo(sb, y1 + 12); ctx.lineTo(sb, frente); ctx.lineTo(sa + 10, frente); ctx.closePath(); ctx.globalAlpha = h0 === h1 ? 1 : 0.55; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let x = sa + 8; x < sb; x += 16) { const y = y0 + (y1 - y0) * (x - sa) / (sb - sa); ctx.fillRect(x, y + 6, 2, 2); }
    if (h0 === h1) { ctx.fillStyle = '#c0392b'; ctx.fillRect(sb - 14, y1 - 2, 10, 5); }
  },
  resto_fuselaje(ctx, sx, base, t, lado) {
    ctx.save(); ctx.translate(sx, base); ctx.scale(lado, 1);
    const g = ctx.createLinearGradient(0, -86, 0, 0); g.addColorStop(0, '#eef1f5'); g.addColorStop(0.5, '#c5cad2'); g.addColorStop(1, '#7d838c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-170, -6); ctx.quadraticCurveTo(-190, -46, -160, -82); ctx.lineTo(120, -86); ctx.lineTo(132, -64); ctx.lineTo(118, -50); ctx.lineTo(136, -30); ctx.lineTo(120, -12); ctx.lineTo(128, 0); ctx.lineTo(-150, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1d2129'; ctx.beginPath(); ctx.moveTo(120, -86); ctx.lineTo(132, -64); ctx.lineTo(118, -50); ctx.lineTo(136, -30); ctx.lineTo(120, -12); ctx.lineTo(128, 0); ctx.lineTo(104, 0); ctx.lineTo(104, -84); ctx.closePath(); ctx.fill();   // boca rota
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-160, -40, 264, 6);
    ctx.fillStyle = '#2b3e55'; for (let k = 0; k < 11; k++) { ctx.beginPath(); ctx.ellipse(-140 + k * 22, -58, 4, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-150, -6, 270, 6);
    ctx.restore();
    this.fuego(ctx, sx + 112 * lado, base - 4, t, 1.3);
  },
  resto_ala(ctx, sx, base, t) {
    ctx.fillStyle = '#a7adb6'; ctx.beginPath(); ctx.moveTo(sx - 150, base - 2); ctx.lineTo(sx + 130, base - 20); ctx.lineTo(sx + 150, base - 10); ctx.lineTo(sx - 120, base + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7d838c'; ctx.beginPath(); ctx.moveTo(sx - 120, base + 6); ctx.lineTo(sx + 150, base - 10); ctx.lineTo(sx + 150, base - 4); ctx.lineTo(sx - 116, base + 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.fillRect(sx + 120, base - 22, 18, 5);
  },
  resto_cola(ctx, sx, base, t) {
    ctx.save(); ctx.translate(sx, base); ctx.rotate(-0.2);
    ctx.fillStyle = '#d9dde3'; ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(-10, -130); ctx.lineTo(30, -130); ctx.lineTo(50, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(-26, -70); ctx.lineTo(-12, -120); ctx.lineTo(24, -120); ctx.lineTo(36, -70); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f1e6d0'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('214', 8, -86);
    ctx.restore();
    this.fuego(ctx, sx - 10, base, t, 0.9);
  },
  resto_motor(ctx, sx, base, t) {
    const g = ctx.createLinearGradient(0, base - 50, 0, base); g.addColorStop(0, '#9aa0aa'); g.addColorStop(1, '#4a4f58');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(sx - 60, base - 48, 110, 48, 22) : ctx.rect(sx - 60, base - 48, 110, 48); ctx.fill();
    ctx.fillStyle = '#1d2129'; ctx.beginPath(); ctx.ellipse(sx + 50, base - 24, 10, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(sx + 50, base - 24); ctx.lineTo(sx + 50 + Math.cos(t + k * 1.26) * 8, base - 24 + Math.sin(t + k * 1.26) * 20); ctx.stroke(); }
    this.humo(ctx, sx + 30, base - 40, t, 0.6);
  },
  resto_asientos(ctx, sx, base) {
    for (let k = 0; k < 3; k++) {
      const x = sx - 50 + k * 34, y = base + (k % 2) * 6;
      ctx.fillStyle = '#2c4a7a'; ctx.fillRect(x, y - 34, 24, 26); ctx.fillStyle = '#1f3558'; ctx.fillRect(x, y - 10, 30, 8); ctx.fillStyle = '#5a6b8a'; ctx.fillRect(x + 4, y - 30, 16, 4);
    }
  },
  resto_valijas(ctx, sx, base) {
    const colores = ['#8a2a2a', '#2a5a8a', '#3a3a3a', '#8a6a2a'];
    for (let k = 0; k < 4; k++) {
      const x = sx - 70 + k * 40 + (k % 2) * 8, y = base + 8 + (k % 3) * 6, w = 26 + (k % 2) * 8, h = 18 + (k % 3) * 4;
      ctx.fillStyle = colores[k]; ctx.fillRect(x, y - h, w, h); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y - 3, w, 3);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.strokeRect(x + w / 2 - 5, y - h - 5, 10, 5);
    }
  },

  /* ---------- Nivel 2: la ruta destruida, a la tarde ----------
   * Asfalto partido con baches gigantes, autos atravesados, partes de autos tiradas, carteles caídos y humo. */
  fondoRuta(ctx, cam, t, H) {
    this.cielo(ctx, ['#5a6270', '#8a8a86', '#c8b48a', '#e0c898']);
    this.astro(ctx, 640 - cam * 0.01, 150, 30, 'rgba(255, 238, 200, 0.7)', 'rgba(255, 230, 190, 0.25)');
    Escenario.cordillera(ctx, cam, 0.06, 330, 80, '#7a8296', '#646c82', 51);
    Escenario.cordillera(ctx, cam, 0.14, 360, 46, '#8e8a72', '#76725e', 53);
    this.arboleda(ctx, cam, 0.35, 378, 36, '#5e624a', 55, true);
    const paso = 300, desplaza = cam * 0.6, inicio = Math.floor(desplaza / paso) - 1;
    ctx.strokeStyle = '#3a3428'; ctx.lineWidth = 1.2;
    for (let k = inicio; k < inicio + ANCHO / paso + 3; k++) {   // postes de luz, algunos caídos
      const x = k * paso - desplaza, caido = azar(k, 811) < 0.3;
      ctx.save(); ctx.translate(x, 390); if (caido) ctx.rotate(0.5 * (azar(k, 812) < 0.5 ? 1 : -1));
      ctx.fillStyle = '#4a3f2c'; ctx.fillRect(-3, -140, 6, 140); ctx.fillRect(-22, -132, 44, 4); ctx.restore();
      if (!caido) { ctx.beginPath(); ctx.moveTo(x + 20, 262); ctx.quadraticCurveTo(x + paso / 2, 296, x + paso + 20, 262); ctx.stroke(); }
    }
    for (let k = 0; k < 3; k++) this.humo(ctx, ((k * 410 - cam * 0.3) % 1300 + 1300) % 1300 - 100, 380, t + k, 1.4);
    for (const [dx, txt] of [[300, 'RUTA 40'], [2200, 'CIUDAD 50 KM'], [3300, 'PELIGRO: CALZADA ROTA'], [4700, 'NO SE DETENGA']]) {
      const sx = H.inicio + dx - cam; if (sx < -160 || sx > ANCHO + 160) continue;
      const base = SUELO_BASE - FONDO_CALLE - 10, tuerto = azar(dx, 813) < 0.5 ? 0.12 : -0.08;
      ctx.save(); ctx.translate(sx, base); ctx.rotate(tuerto);
      ctx.fillStyle = '#5a5a5a'; ctx.fillRect(-40, -90, 5, 90); ctx.fillRect(35, -90, 5, 90);
      ctx.fillStyle = txt.startsWith('PELIGRO') ? '#c8a020' : '#1f6a3a'; ctx.fillRect(-78, -130, 156, 46); ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 3; ctx.strokeRect(-74, -126, 148, 38);
      ctx.fillStyle = txt.startsWith('PELIGRO') ? '#1a1a1a' : '#f2f2f2'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(txt, 0, -101); ctx.restore();
    }
    Escenario.dibujarSuelo(ctx, cam);
    this.asfaltoRoto(ctx, cam);
    this.guardarrail(ctx, cam);
    Escenario.dibujarFondoDelMundo(ctx, cam, t);
    this.partesDeAutos(ctx, cam, SUELO_BASE - 6, 0.6, 820);
    if (H.def.terreno) this.terreno(ctx, cam, t, H);
  },
  // Grietas grandes y parches de asfalto levantado
  asfaltoRoto(ctx, cam) {
    const desde = Math.floor(cam / 90) - 1, hasta = Math.floor((cam + ANCHO) / 90) + 1;
    for (let c = desde; c <= hasta; c++) {
      if (azar(c, 830) > 0.5) continue;
      const x = c * 90 + azar(c, 831) * 60 - cam, y = SUELO_BASE - 30 + azar(c, 832) * 120;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y);
      for (let i = 1; i < 6; i++) ctx.lineTo(x + i * 10, y + (azar(c + i, 833) - 0.5) * 14); ctx.stroke();
      if (azar(c, 834) < 0.4) { ctx.fillStyle = '#2a2628'; ctx.beginPath(); ctx.ellipse(x + 20, y + 6, 18, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  // Ruedas, puertas, paragolpes y capós tirados en el camino
  partesDeAutos(ctx, cam, y0, densidad, sal) {
    const desde = Math.floor(cam / 130) - 1, hasta = Math.floor((cam + ANCHO) / 130) + 1;
    for (let c = desde; c <= hasta; c++) {
      if (azar(c, sal) > densidad) continue;
      const x = c * 130 + azar(c, sal + 1) * 90 - cam, y = y0 + azar(c, sal + 2) * 70, tipo = Math.floor(azar(c, sal + 3) * 4);
      ctx.save(); ctx.translate(x, y); ctx.rotate((azar(c, sal + 4) - 0.5) * 0.6);
      if (tipo === 0) { ctx.fillStyle = '#141414'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6a6e74'; ctx.beginPath(); ctx.ellipse(0, -1, 6, 3, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (tipo === 1) { ctx.fillStyle = ['#7a2a24', '#2c4a6e', '#6a6a48'][c % 3]; ctx.fillRect(-18, -8, 36, 10); ctx.fillStyle = '#1a2230'; ctx.fillRect(-14, -7, 14, 5); }
      else if (tipo === 2) { ctx.fillStyle = '#9aa0a8'; ctx.fillRect(-24, -3, 48, 5); ctx.fillStyle = '#5a5f68'; ctx.fillRect(-24, 1, 48, 2); }
      else { ctx.fillStyle = ['#3e5a3e', '#5a3a5a', '#8a6a2a'][c % 3]; ctx.beginPath(); ctx.moveTo(-20, 2); ctx.lineTo(-14, -8); ctx.lineTo(16, -8); ctx.lineTo(22, 2); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
  },
  guardarrail(ctx, cam) {
    const y = SUELO_BASE - FONDO_CALLE - 12;
    ctx.fillStyle = '#9ca3ad'; ctx.fillRect(0, y - 8, ANCHO, 7); ctx.fillStyle = '#6b7280'; ctx.fillRect(0, y - 2, ANCHO, 2);
    const inicio = Math.floor(cam / 80) * 80;
    for (let x = inicio; x < cam + ANCHO + 80; x += 80) { ctx.fillStyle = '#5b616b'; ctx.fillRect(x - cam - 2, y - 8, 4, 18); }
  },

  /* ---------- Nivel 3: las calles de la ciudad, al atardecer y con humo ----------
   * Edificios lejanos, una fila de negocios saqueados (carteles, toldos, vidrieras rotas), semáforos (algunos
   * caídos, con la luz amarilla titilando), autos, basura, carritos y escombros por toda la calle. */
  fondoCiudad(ctx, cam, t, H) {
    this.cielo(ctx, ['#2a2634', '#5a4a58', '#9a6a5a', '#c8865a']);
    const paso = 70, desplaza = cam * 0.15, inicio = Math.floor(desplaza / paso) - 1;
    for (let k = inicio; k < inicio + ANCHO / paso + 3; k++) {
      const x = k * paso - desplaza, h = 90 + azar(k, 801) * 140, w = 50 + azar(k, 802) * 16;
      ctx.fillStyle = '#3a3240'; ctx.fillRect(x, 330 - h, w, h + 30);
      for (let yy = 330 - h + 8; yy < 320; yy += 12) for (let xx = x + 6; xx < x + w - 6; xx += 10) if (azar(k * 97 + yy + xx, 803) < 0.1) { ctx.fillStyle = 'rgba(255, 200, 120, 0.5)'; ctx.fillRect(xx, yy, 4, 6); }
      if (azar(k, 805) < 0.2) this.humo(ctx, x + w / 2, 330 - h, t + k, 1.1);
    }
    const n = ctx.createLinearGradient(0, 200, 0, 360); n.addColorStop(0, 'rgba(200, 130, 90, 0)'); n.addColorStop(1, 'rgba(200, 130, 90, 0.35)');
    ctx.fillStyle = n; ctx.fillRect(0, 200, ANCHO, 160);
    this.negocios(ctx, cam, t);
    Escenario.dibujarSuelo(ctx, cam);
    this.asfaltoRoto(ctx, cam);
    this.semaforos(ctx, cam, t);
    Escenario.dibujarFondoDelMundo(ctx, cam, t);
    this.basura(ctx, cam);
    if (H.def.terreno) this.terreno(ctx, cam, t, H);
    ctx.fillStyle = 'rgba(40, 20, 30, 0.12)'; ctx.fillRect(0, 0, ANCHO, ALTO);   // humo del atardecer
  },
  negocios(ctx, cam, t) {
    const NOMBRES = ['FARMACIA', 'KIOSCO', 'PANADERÍA', 'FERRETERÍA', 'BAR', 'ROPA', 'CELULARES', 'ALMACÉN', 'PIZZERÍA', 'LIBRERÍA'];
    const COLORES = ['#8a5a4a', '#5a6a7a', '#7a6a4a', '#6a4a5a', '#4a6a5a', '#7a7a6a'];
    const ancho = 210, base = SUELO_BASE - FONDO_CALLE - 14, desde = Math.floor((cam - ancho) / ancho), hasta = Math.floor((cam + ANCHO) / ancho);
    for (let k = desde; k <= hasta; k++) {
      const x = k * ancho - cam, alto = 130 + azar(k, 840) * 50, col = COLORES[Math.floor(azar(k, 841) * COLORES.length)];
      ctx.fillStyle = col; ctx.fillRect(x, base - alto, ancho - 4, alto);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = base - alto + 12; y < base - 80; y += 26) for (let xx = x + 14; xx < x + ancho - 30; xx += 36) ctx.fillRect(xx, y, 20, 16);   // ventanas de arriba
      const nombre = NOMBRES[Math.floor(azar(k, 842) * NOMBRES.length)], roto = azar(k, 843) < 0.45;
      ctx.fillStyle = '#20202a'; ctx.fillRect(x + 8, base - 80, ancho - 20, 22);
      ctx.fillStyle = azar(k, 844) < 0.5 ? '#e8d8a0' : '#f0f0f0'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
      ctx.save(); if (roto) { ctx.translate(x + ancho / 2, base - 64); ctx.rotate(0.06); ctx.fillText(nombre, 0, 0); } else ctx.fillText(nombre, x + ancho / 2, base - 64); ctx.restore();
      // Toldo a rayas
      for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#e8e0d0' : ['#a03a2a', '#2a5a8a', '#3a7a3a'][k % 3]; ctx.beginPath(); ctx.moveTo(x + 8 + i * (ancho - 20) / 8, base - 56); ctx.lineTo(x + 8 + (i + 1) * (ancho - 20) / 8, base - 56); ctx.lineTo(x + 12 + (i + 1) * (ancho - 20) / 8, base - 44); ctx.lineTo(x + 12 + i * (ancho - 20) / 8, base - 44); ctx.closePath(); ctx.fill(); }
      // Vidriera (rota o con la persiana baja) y puerta
      if (roto) { ctx.fillStyle = '#121418'; ctx.fillRect(x + 14, base - 40, ancho - 80, 40); ctx.strokeStyle = 'rgba(200, 220, 240, 0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 14, base - 40); ctx.lineTo(x + 50, base - 22); ctx.lineTo(x + 30, base); ctx.moveTo(x + 90, base - 40); ctx.lineTo(x + 70, base - 18); ctx.stroke(); }
      else { ctx.fillStyle = '#6a6e74'; ctx.fillRect(x + 14, base - 40, ancho - 80, 40); ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = base - 38; y < base; y += 4) ctx.fillRect(x + 14, y, ancho - 80, 1); }
      ctx.fillStyle = '#2a2018'; ctx.fillRect(x + ancho - 58, base - 42, 30, 42);
      if (azar(k, 845) < 0.25) { ctx.fillStyle = 'rgba(30, 30, 30, 0.8)'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(['SALVENSE', 'NO ENTRAR', 'AYUDA'][k % 3], x + ancho / 2, base - 100); }   // pintadas
      if (azar(k, 846) < 0.15) this.fuego(ctx, x + 40, base - 4, t, 0.9);
    }
  },
  semaforos(ctx, cam, t) {
    const paso = 520, base = SUELO_BASE - FONDO_CALLE - 6, desde = Math.floor(cam / paso) - 1, hasta = Math.floor((cam + ANCHO) / paso) + 1;
    for (let k = desde; k <= hasta; k++) {
      const x = k * paso + 260 - cam, caido = azar(k, 850) < 0.35;
      ctx.save(); ctx.translate(x, base); if (caido) ctx.rotate(-1.2);
      ctx.fillStyle = '#2a2c30'; ctx.fillRect(-3, -150, 6, 150); ctx.fillRect(-3, -150, 40, 5);
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(30, -150, 18, 46);
      const titila = Math.sin(t * 6 + k) > 0;
      ctx.fillStyle = '#3a1010'; ctx.beginPath(); ctx.arc(39, -140, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = titila && !caido ? '#ffc020' : '#3a3010'; ctx.beginPath(); ctx.arc(39, -127, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#103a14'; ctx.beginPath(); ctx.arc(39, -114, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  },
  // Bolsas de basura, tachos volcados, carritos, papeles y cascotes
  basura(ctx, cam) {
    const desde = Math.floor(cam / 70) - 1, hasta = Math.floor((cam + ANCHO) / 70) + 1;
    for (let c = desde; c <= hasta; c++) {
      if (azar(c, 860) > 0.6) continue;
      const x = c * 70 + azar(c, 861) * 50 - cam, y = SUELO_BASE - 40 + azar(c, 862) * 130, tipo = Math.floor(azar(c, 863) * 5);
      if (tipo === 0) { ctx.fillStyle = '#1a1a1e'; ctx.beginPath(); ctx.ellipse(x, y - 8, 12, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 3, y - 20, 6, 5); }
      else if (tipo === 1) { ctx.save(); ctx.translate(x, y); ctx.rotate(1.4); ctx.fillStyle = '#3a5a3a'; ctx.fillRect(-10, -14, 20, 26); ctx.restore(); }
      else if (tipo === 2) { ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 14, y - 18, 28, 14); ctx.beginPath(); ctx.moveTo(x - 14, y - 4); ctx.lineTo(x - 10, y + 2); ctx.lineTo(x + 12, y + 2); ctx.stroke(); }
      else if (tipo === 3) { ctx.fillStyle = 'rgba(235, 230, 215, 0.8)'; ctx.fillRect(x, y, 10, 7); ctx.fillRect(x + 14, y + 4, 8, 6); }
      else { ctx.fillStyle = '#7a7470'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 4, y - 9); ctx.lineTo(x + 8, y - 6); ctx.lineTo(x + 12, y); ctx.closePath(); ctx.fill(); }
    }
  },

  /* ---------- Nivel 4: tu barrio, destruido y de noche ----------
   * Casas en penumbras con pocas ventanas prendidas, árboles negros, faroles apagados (alguno titila) y, encima de
   * todo, la oscuridad: solo se ve alrededor del personaje, del fuego, de los faroles y de la casa de la hija. */
  fondoBarrio(ctx, cam, t, H) {
    this.cielo(ctx, ['#03040c', '#0a0e22', '#161b36', '#22264a']);
    this.estrellas(ctx, cam, t);
    this.astro(ctx, 780 - cam * 0.01, 80, 20, '#d8d4b8', 'rgba(200, 200, 255, 0.12)');
    this.arboleda(ctx, cam, 0.2, 320, 60, '#0e1220', 61, true);
    this.arboleda(ctx, cam, 0.4, 340, 70, '#0a0e18', 63, true);
    const horizonte = SUELO_BASE - FONDO_CALLE - 14;
    ctx.fillStyle = '#141a14'; ctx.fillRect(0, 330, ANCHO, horizonte - 330);
    const paso = 340, desde = Math.floor((cam - 300) / paso), hasta = Math.floor((cam + ANCHO + 300) / paso);
    for (let k = desde; k <= hasta; k++) {
      const x = k * paso + 170;
      if (x < H.inicio - 400 || x > H.meta - 260) continue;
      this.casa(ctx, x - cam, horizonte, k, t);
    }
    this.casaFinal(ctx, H.meta - cam, horizonte, t);
    Escenario.dibujarSuelo(ctx, cam);
    this.asfaltoRoto(ctx, cam);
    this.partesDeAutos(ctx, cam, SUELO_BASE - 6, 0.3, 870);
    if (H.def.terreno) this.terreno(ctx, cam, t, H);
  },
  // Oscuridad del barrio: una capa negra con agujeros de luz (se pinta encima de todo)
  oscuridad(ctx, cam, t, juego) {
    const H = juego.historia, j = juego.jugador;
    if (!this.capaOscura) this.capaOscura = document.createElement('canvas');
    const c = this.capaOscura; if (c.width !== ANCHO || c.height !== ALTO) { c.width = ANCHO; c.height = ALTO; }
    const o = c.getContext('2d');
    o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, ANCHO, ALTO);
    o.fillStyle = 'rgba(2, 3, 10, 0.86)'; o.fillRect(0, 0, ANCHO, ALTO);
    o.globalCompositeOperation = 'destination-out';
    const luz = (x, y, r, fuerza = 1) => { const g = o.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${fuerza})`); g.addColorStop(0.55, `rgba(0,0,0,${fuerza * 0.7})`); g.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = g; o.fillRect(x - r, y - r, r * 2, r * 2); };
    luz(j.x - cam + j.direccion * 40, j.y - 40, 210);                                    // alrededor del personaje
    for (const [a, b] of H.def.fuegos || []) luz(H.inicio + (a + b) / 2 - cam, SUELO_BASE - 20, 170, 0.95);
    luz(H.meta - cam - 120, SUELO_BASE - FONDO_CALLE - 120, 200, 0.9);                    // la ventana de la hija
    for (let k = Math.floor((cam - 400) / 400); k <= Math.floor((cam + ANCHO + 400) / 400); k++) {   // faroles: casi todos apagados
      if (azar(k, 880) > 0.35) continue;
      const fuerza = azar(k, 881) < 0.5 ? 0.85 : (Math.sin(t * 13 + k) > 0.3 ? 0.8 : 0.15);
      luz(k * 400 + 200 - cam, SUELO_BASE - 40, 150, fuerza);
    }
    for (const c2 of juego.cajas) if (c2.tipo) luz(c2.x - cam, c2.y - 34, 46, 0.8);         // corazones y radios brillan
    for (const p of juego.proyectiles) luz(p.x - cam, p.y, 70, 0.6);                         // los tiros iluminan
    for (const x of juego.explosiones) if (x.x !== undefined) luz(x.x - cam, x.y, 160, 0.8);
    ctx.drawImage(c, 0, 0);
    for (let k = Math.floor((cam - 400) / 400); k <= Math.floor((cam + ANCHO + 400) / 400); k++) {   // el poste del farol, encima de la oscuridad
      if (azar(k, 880) > 0.35) continue;
      const x = k * 400 + 200 - cam; ctx.fillStyle = '#1a1c22'; ctx.fillRect(x - 3, SUELO_BASE - FONDO_CALLE - 150, 6, 150);
      const prendido = azar(k, 881) < 0.5 || Math.sin(t * 13 + k) > 0.3; ctx.fillStyle = prendido ? '#ffe6a0' : '#3a3a30'; ctx.fillRect(x - 10, SUELO_BASE - FONDO_CALLE - 154, 20, 6);
    }
  },
  casa(ctx, sx, base, k, t) {
    const paredes = ['#4a4238', '#3a4450', '#4a3a36', '#3e4a3c', '#463e4a'], techos = ['#2a1410', '#1a1a22', '#2a1c16', '#14221c'];   // de noche
    const w = 220 + azar(k, 901) * 40, h = 110 + azar(k, 902) * 30, pared = paredes[Math.floor(azar(k, 903) * paredes.length)], techo = techos[Math.floor(azar(k, 904) * techos.length)];
    const rota = azar(k, 905) < 0.35, fuego = azar(k, 906) < 0.15, x = sx - w / 2;
    ctx.fillStyle = pared; ctx.fillRect(x, base - h, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x, base - 12, w, 12);
    ctx.fillStyle = techo; ctx.beginPath(); ctx.moveTo(x - 16, base - h); ctx.lineTo(sx, base - h - 56); ctx.lineTo(x + w + 16, base - h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a3420'; ctx.fillRect(sx + w * 0.12, base - 70, 34, 70);   // puerta
    for (const vx of [x + 24, x + w - 74]) {
      ctx.fillStyle = rota ? '#0a0a10' : azar(k + vx, 907) < 0.18 ? '#c8a050' : '#14182a'; ctx.fillRect(vx, base - h + 26, 50, 40);   // alguna ventana prendida
      if (rota) { ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(vx - 4, base - h + 30); ctx.lineTo(vx + 54, base - h + 62); ctx.moveTo(vx - 4, base - h + 60); ctx.lineTo(vx + 54, base - h + 28); ctx.stroke(); }   // tablas clavadas
      else { ctx.fillStyle = '#e9e2d0'; ctx.fillRect(vx + 23, base - h + 26, 4, 40); ctx.fillRect(vx, base - h + 44, 50, 4); }
    }
    // Cerca blanca adelante
    ctx.fillStyle = '#8a8a90';
    for (let fx = x - 20; fx < x + w + 20; fx += 14) { ctx.beginPath(); ctx.moveTo(fx, base); ctx.lineTo(fx, base - 26); ctx.lineTo(fx + 4, base - 32); ctx.lineTo(fx + 8, base - 26); ctx.lineTo(fx + 8, base); ctx.fill(); }
    ctx.fillRect(x - 20, base - 20, w + 40, 4);
    if (fuego) { this.fuego(ctx, sx + w * 0.3, base - h, t, 1.2); this.humo(ctx, sx + w * 0.3, base - h - 20, t, 0.9); }
  },
  // La casa del protagonista: azul, con el porche, la luz del cuarto prendida y la puerta donde termina el viaje
  casaFinal(ctx, sx, base, t) {
    if (sx < -400 || sx > ANCHO + 400) return;
    const w = 320, h = 170, x = sx - w * 0.62;
    ctx.fillStyle = '#7aa0c8'; ctx.fillRect(x, base - h, w, h);
    ctx.fillStyle = '#4a3040'; ctx.beginPath(); ctx.moveTo(x - 22, base - h); ctx.lineTo(x + w / 2, base - h - 80); ctx.lineTo(x + w + 22, base - h); ctx.closePath(); ctx.fill();
    // Ventana del cuarto de la hija, con luz y su silueta
    const vx = x + 40, vy = base - h + 30;
    const brillo = ctx.createRadialGradient(vx + 32, vy + 26, 4, vx + 32, vy + 26, 90); brillo.addColorStop(0, 'rgba(255, 220, 120, 0.45)'); brillo.addColorStop(1, 'rgba(255, 220, 120, 0)');
    ctx.fillStyle = brillo; ctx.fillRect(vx - 60, vy - 60, 184, 172);
    ctx.fillStyle = '#f6d36a'; ctx.fillRect(vx, vy, 64, 52); ctx.fillStyle = '#5a3a2a'; ctx.fillRect(vx + 30, vy, 4, 52); ctx.fillRect(vx, vy + 24, 64, 4);
    ctx.fillStyle = 'rgba(60, 30, 40, 0.75)'; ctx.beginPath(); ctx.arc(vx + 16, vy + 30, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(vx + 9, vy + 36, 14, 16);
    // Porche y puerta
    ctx.fillStyle = '#e9e2d0'; ctx.fillRect(sx - 60, base - 96, 120, 8); ctx.fillRect(sx - 56, base - 88, 6, 88); ctx.fillRect(sx + 50, base - 88, 6, 88);
    ctx.fillStyle = '#6a3a22'; ctx.fillRect(sx - 22, base - 80, 44, 80); ctx.fillStyle = '#e0c060'; ctx.beginPath(); ctx.arc(sx + 12, base - 40, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('♥ ' + t2Casa(), sx, base - 104 + Math.sin(t * 3) * 3);
    for (let fx = x - 30; fx < sx - 70; fx += 14) { ctx.fillStyle = '#eeeeee'; ctx.fillRect(fx, base - 26, 8, 26); }
  },

  // Cartel verde con el kilómetro al final de los niveles 1 a 3, con bandera a cuadros
  cartelMeta(ctx, cam, H) {
    const sx = H.meta - cam; if (sx < -200 || sx > ANCHO + 200) return;
    const base = SUELO_BASE - FONDO_CALLE + 4;
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(sx - 46, base - 120, 6, 120); ctx.fillRect(sx + 40, base - 120, 6, 120);
    ctx.fillStyle = '#1f6a3a'; ctx.fillRect(sx - 80, base - 170, 160, 58); ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 3; ctx.strokeRect(sx - 75, base - 165, 150, 48);
    ctx.fillStyle = '#f2f2f2'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t('hist.cartel', { km: H.def.kmHasta }) + ' →', sx, base - 133);
    for (let f = 0; f < 4; f++) for (let c = 0; c < 6; c++) { ctx.fillStyle = (f + c) % 2 ? '#111' : '#f2f2f2'; ctx.fillRect(sx + 50 + c * 7, base - 230 + f * 7, 7, 7); }
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(sx + 47, base - 232, 3, 62);
  },
};
function t2Casa() { return t('hist.casa'); }
