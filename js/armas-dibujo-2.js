/* ===== Dibujo detallado de cada arma (2/2: rifles, escopetas, M2 y especiales) ===== */
// Palanca de un arma de palanca: un aro debajo del cajón que gira hacia abajo al ciclar
function palancaArma(ctx, x, y, e, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(e.palanca * 1.1);
  ctx.strokeStyle = tinta(color); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2, 7); ctx.lineTo(8, 9); ctx.lineTo(10, 2); ctx.stroke();
  ctx.restore();
}

Object.assign(DIBUJO_ARMAS, {
  /* ---------- Rifles ---------- */
  remington700: { manoDelantera: { x: 26, y: -2 }, cargador: { x: 11, y: -9 }, corredera: { x: 12, y: -4 }, expulsion: { x: 10, y: -7 }, boca: { x: 50, y: -5 }, casquillo: 'bala',
    dibujar(ctx, e) {
      culata(ctx, 3, -7, 25, 8, MADERA_OSCURA, 1);
      parte(ctx, -2, 2, 6, 6, MADERA_OSCURA);
      parte(ctx, 2, -8, 18, 6, METAL);
      parte(ctx, 6, -2, 10, 3, '#3a3a3e');                                  // chapa del depósito interno
      const ab = Math.max(e.corredera, e.abierto);
      if (ab > 0.3) { ctx.fillStyle = tinta('#111'); ctx.fillRect(8, -8, 7, 3); }
      mirilla(ctx, 3, -14, 20);
      parte(ctx, 18, -4, 16, 5, MADERA_OSCURA);
      parte(ctx, 20, -7, 30, 3, METAL); mira(ctx, 48, -9);
      parte(ctx, 10 - ab * 5, -6, 3, 6, METAL_CLARO); esfera(ctx, 12 - ab * 5, 1, 2, '#7a7a82');   // el cerrojo se va hacia atrás
      guardamonte(ctx, 8, 3);
    } },
  barrett: { manoDelantera: { x: 30, y: -2 }, cargador: { x: 10, y: 9 }, corredera: { x: 2, y: -11 }, expulsion: { x: 12, y: -8 }, boca: { x: 62, y: -5 }, casquillo: 'grande',
    dibujar(ctx, e) {
      culata(ctx, -7, -9, 19, 10, '#2a2e2a', 0);
      parte(ctx, -8, -10, 36, 10, '#2a2e2a');
      parte(ctx, -6, 0, 5, 9, '#1e1e1e');
      cargadorRecto(ctx, 7, 0, 8, 14, '#1e1e1e', e);
      mirilla(ctx, 0, -17, 24);
      parte(ctx, 28, -8, 30, 5, METAL); parte(ctx, 56, -9, 8, 7, METAL_CLARO);
      ctx.fillStyle = tinta('#1a1a1a'); for (let k = 0; k < 3; k++) ctx.fillRect(57 + k * 2.5, -8, 1, 5);
      ctx.strokeStyle = tinta(METAL); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(34, -3); ctx.lineTo(30, 8); ctx.moveTo(38, -3); ctx.lineTo(42, 8); ctx.stroke();
      parte(ctx, 0 - e.corredera * 6, -12, 6, 2, METAL_CLARO);
      guardamonte(ctx, 2, 2);
    } },
  mosin: { manoDelantera: { x: 28, y: -2 }, cargador: { x: 12, y: -9 }, corredera: { x: 14, y: -5 }, expulsion: { x: 12, y: -7 }, boca: { x: 62, y: -5 }, casquillo: 'bala',
    dibujar(ctx, e) {
      culata(ctx, 3, -6, 27, 7, '#6a3f1f', 2);   // culata recta de madera
      parte(ctx, -2, 2, 6, 6, '#6a3f1f');
      parte(ctx, 2, -8, 20, 6, METAL);                                      // cajón del cerrojo
      parte(ctx, 6, -1, 10, 5, '#3a3a3e');                                  // depósito de 5 asomando
      const ab = Math.max(e.corredera, e.abierto);
      if (ab > 0.3) { ctx.fillStyle = tinta('#111'); ctx.fillRect(9, -8, 7, 3); }   // cerrojo atrás: entra el peine por arriba
      parte(ctx, 18, -4, 30, 5, '#6a3f1f');                                 // guardamanos de madera hasta casi la boca
      parte(ctx, 20, -7, 42, 3, METAL); mira(ctx, 60, -9); parte(ctx, 10, -11, 4, 3, METAL);   // cañón largo y alza
      parte(ctx, 12 - ab * 6, -6, 2.5, 7, METAL_CLARO); esfera(ctx, 13 - ab * 6, 2, 2, '#7a7a82');   // manija recta del cerrojo, hacia atrás al abrir
      guardamonte(ctx, 8, 3);
    } },
  winchester1894: { manoDelantera: { x: 24, y: -1 }, cargador: { x: 8, y: -3 }, corredera: { x: 4, y: 6 }, expulsion: { x: 8, y: -8 }, boca: { x: 52, y: -5 }, casquillo: 'bala',
    dibujar(ctx, e) {
      culata(ctx, 1, -7, 23, 8, MADERA, 3);   // culata
      parte(ctx, 0, -8, 16, 8, '#3a3a3a');                                  // cajón
      parte(ctx, 7, -4, 5, 3, '#1e1e1e');                                   // ventana de carga lateral
      parte(ctx, -1, -9, 3, 3, METAL_CLARO);                                // martillo
      parte(ctx, 16, -7, 36, 3, METAL);                                     // cañón
      parte(ctx, 16, -3, 30, 2.5, '#3a3a3a');                               // tubo de balas debajo
      parte(ctx, 18, -4, 14, 4, MADERA);                                    // guardamanos
      palancaArma(ctx, 2, 0, e, '#2a2a2e');                                  // palanca
      mira(ctx, 50, -9); parte(ctx, 12, -10, 3, 2, METAL);
    } },

  /* ---------- Escopetas ---------- */
  recortada: { manoDelantera: { x: 14, y: 2 }, cargador: { x: 3, y: -5 }, corredera: { x: 10, y: -9 }, expulsion: { x: 4, y: -8 }, boca: { x: 30, y: -5 }, casquillo: null, casquilloVaciado: 'escopeta',
    dibujar(ctx, e) {
      culata(ctx, 0, -6, 12, 8, MADERA_OSCURA, 3);
      ctx.save(); ctx.rotate(e.abierto * 0.55);
      parte(ctx, -1, -7, 32, 3, METAL); parte(ctx, -1, -4, 32, 3, METAL);
      parte(ctx, 8, -1, 12, 3, MADERA_OSCURA);
      if (e.abierto > 0.5) { ctx.fillStyle = tinta('#111'); ctx.fillRect(-1, -6, 2, 1.5); ctx.fillRect(-1, -3, 2, 1.5); }
      mira(ctx, 28, -9); ctx.restore();
      parte(ctx, -2, -6, 6, 6, METAL_CLARO); guardamonte(ctx, 3, 2);
    } },
  mossberg: { manoDelantera: { x: 26, y: -1 }, cargador: { x: 8, y: 3 }, corredera: { x: 26, y: -2 }, expulsion: { x: 8, y: -8 }, boca: { x: 44, y: -5 }, casquillo: 'escopeta',
    dibujar(ctx, e) {
      culata(ctx, -3, -7, 19, 8, '#3a2a1a', 2);
      parte(ctx, -4, -9, 18, 9, METAL);
      parte(ctx, 2, 0, 10, 2, '#111');
      parte(ctx, 14, -8, 30, 3, METAL); parte(ctx, 14, -4, 26, 3, '#3a3a3a');
      parte(ctx, 20 - e.bombeo * 8, -7, 14, 7, '#3a2a1a'); ctx.fillStyle = tinta('#2a1e12'); for (let k = 0; k < 4; k++) ctx.fillRect(22 - e.bombeo * 8 + k * 3, -6, 1, 5);
      mira(ctx, 42, -10); guardamonte(ctx, 6, 2);
    } },
  spas12: { manoDelantera: { x: 28, y: -1 }, cargador: { x: 8, y: 3 }, corredera: { x: 28, y: -2 }, expulsion: { x: 10, y: -9 }, boca: { x: 46, y: -5 }, casquillo: 'escopeta',
    dibujar(ctx, e) {
      parte(ctx, -24, -8, 20, 3, METAL); parte(ctx, -24, -5, 4, 9, METAL);
      parte(ctx, -4, -9, 22, 10, '#1e1e22'); parte(ctx, -2, 1, 5, 9, '#1e1e22'); parte(ctx, 4, 1, 10, 2, '#111');
      parte(ctx, 18, -8, 28, 3, METAL);
      parte(ctx, 18, -11, 20, 3, '#3a3a3a'); ctx.fillStyle = tinta('#111'); for (let k = 0; k < 5; k++) ctx.fillRect(20 + k * 4, -10, 2, 1);
      parte(ctx, 18, -4, 28, 3, '#3a3a3a');
      parte(ctx, 24 - e.bombeo * 8, -7, 14, 7, '#1e1e22');
      mira(ctx, 44, -13); guardamonte(ctx, 7, 3);
    } },
  aa12: { manoDelantera: { x: 26, y: -2 }, cargador: { x: 10, y: 10 }, corredera: { x: 2, y: -11 }, expulsion: { x: 12, y: -8 }, boca: { x: 46, y: -5 }, casquillo: 'escopeta',
    dibujar(ctx, e) {
      culata(ctx, -3, -9, 19, 9, '#2b2f33', 0);                                // culata maciza
      parte(ctx, -4, -10, 30, 10, '#2b2f33');                               // cajón cuadrado
      parte(ctx, -1, 0, 5, 8, '#1e2226');
      if (!e.sinCargador) { esfera(ctx, 11, 7, 7, '#1e2226'); ctx.fillStyle = tinta('#3a3f44'); ctx.fillRect(8, 6, 6, 2); }   // tambor de 20
      parte(ctx, 26, -8, 20, 5, '#1e2226'); parte(ctx, 26, -4, 16, 3, '#2b2f33');   // cañón y guardamanos
      parte(ctx, 0 - e.corredera * 6, -12, 6, 2, METAL_CLARO);
      mira(ctx, 44, -10); guardamonte(ctx, 7, 2);
    } },
  saiga: { manoDelantera: { x: 26, y: -2 }, cargador: { x: 11, y: 9 }, corredera: { x: 4, y: -8 }, expulsion: { x: 10, y: -7 }, boca: { x: 48, y: -4 }, casquillo: 'escopeta',
    dibujar(ctx, e) {
      culata(ctx, -3, -6, 17, 6, '#2e2a26', 2);
      parte(ctx, -4, -8, 26, 8, '#2a2a2e');
      parte(ctx, -1, 0, 5, 9, '#2e2a26');
      cargadorRecto(ctx, 8, 0, 7, 12, '#1e1e22', e);                         // cargador recto de 8 cartuchos
      parte(ctx, 18, -7, 14, 6, '#2e2a26'); parte(ctx, 20, -9, 14, 2, METAL); parte(ctx, 32, -5, 16, 4, METAL);
      parte(ctx, 2 - e.corredera * 6, -9, 5, 2, METAL_CLARO);
      mira(ctx, 44, -8); guardamonte(ctx, 7, 2);
    } },
  winchester1887: { manoDelantera: { x: 26, y: -1 }, cargador: { x: 8, y: -3 }, corredera: { x: 4, y: 6 }, expulsion: { x: 8, y: -9 }, boca: { x: 48, y: -5 }, casquillo: 'escopeta',
    dibujar(ctx, e) {
      culata(ctx, -1, -8, 21, 9, '#6a3f1f', 3);
      parte(ctx, -2, -9, 18, 9, '#3a3a3a'); esfera(ctx, -2, -4, 4, '#3a3a3a');   // cajón grande con la parte de atrás redondeada
      parte(ctx, 7, -5, 6, 3, '#1e1e1e');                                   // ventana de carga lateral
      parte(ctx, 16, -8, 32, 3, METAL); parte(ctx, 16, -4, 26, 3, '#3a3a3a');
      parte(ctx, 20, -5, 14, 5, '#6a3f1f');
      palancaArma(ctx, 2, 0, e, '#2a2a2e');
      mira(ctx, 46, -10); parte(ctx, -1, -11, 3, 3, METAL_CLARO);
    } },

  /* ---------- Ametralladora fija: la dibuja el emplazamiento; acá solo van los anclajes para las manos ---------- */
  m2: { manoDelantera: { x: -29, y: -1 }, cargador: { x: -14, y: -5 }, corredera: { x: -2, y: 4 }, expulsion: { x: -6, y: -2 }, boca: { x: 48, y: 3 }, casquillo: 'grande', dibujar() {} },

  /* ---------- Especiales ---------- */
  m79: { manoDelantera: { x: 22, y: 0 }, cargador: { x: 13, y: -4 }, corredera: { x: 14, y: -9 }, expulsion: { x: 12, y: -4 }, boca: { x: 40, y: -4 }, casquillo: null, casquilloVaciado: 'granada40',
    dibujar(ctx, e) {
      culata(ctx, -1, -6, 21, 8, MADERA_OSCURA, 2);
      parte(ctx, -2, -8, 14, 8, '#4a5d23');
      ctx.save(); ctx.translate(12, -4); ctx.rotate(e.abierto * 0.55); ctx.translate(-12, 4);   // el cañón se quiebra por la bisagra
      parte(ctx, 12, -9, 28, 10, '#4a5d23'); parte(ctx, 38, -8, 3, 8, '#2a3a12');
      parte(ctx, 14, -4, 12, 4, MADERA_OSCURA);
      if (e.abierto > 0.5) { ctx.fillStyle = tinta('#111'); ctx.fillRect(12, -7, 3, 6); }   // recámara abierta
      ctx.restore();
      parte(ctx, 4, -12, 6, 4, METAL); guardamonte(ctx, 4, 2);
    } },
  granadas: { manoDelantera: { x: 2, y: 2 }, cargador: { x: 2, y: 2 }, corredera: { x: 2, y: 2 }, expulsion: { x: 0, y: 0 }, boca: { x: 8, y: -4 }, casquillo: null,
    dibujar(ctx, e) { if (e.sinCargador) return; esfera(ctx, 6, 0, 6, '#3d5a2a'); ctx.fillStyle = tinta('#2a3a1a'); ctx.fillRect(2, -1, 8, 1); ctx.fillRect(6, -5, 1, 10); parte(ctx, 4, -9, 4, 4, '#999'); parte(ctx, 7, -8, 5, 2, '#777'); } },
  laser: { manoDelantera: { x: 20, y: 1 }, cargador: { x: 8, y: 6 }, corredera: { x: 2, y: -8 }, expulsion: { x: 0, y: 0 }, boca: { x: 36, y: -3 }, casquillo: null,
    dibujar(ctx, e) {
      parte(ctx, -10, -5, 14, 7, '#4a3a6a'); parte(ctx, -6, -8, 34, 9, '#5a4a7a');
      parte(ctx, 0, 1, 5, 8, '#4a3a6a');
      if (!e.sinCargador) esfera(ctx, 10, 6, 4, '#39ff14');
      parte(ctx, 26, -6, 8, 5, '#3a2a5a'); parte(ctx, 32, -5, 5, 3, '#39ff14');
      if (!Pincel.silueta) { ctx.fillStyle = '#39ff14'; ctx.fillRect(-2, -5, 20, 1.5); ctx.fillRect(2, -1, 12, 1.5); }
    } },
});
