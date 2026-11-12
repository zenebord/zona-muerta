/* ===== Armas nuevas a escala real (en cm, como en armas-modelos.js) =====
 * Armas de fuego: mismo criterio que el resto (origen en la empuñadura, x hacia la boca, y hacia abajo).
 * Cuerpo a cuerpo y legendarias: la mano del gatillo está en el origen y el arma se para «hacia arriba»
 * (la hoja o la cabeza en y negativa, el mango hacia abajo). Así el giro del golpe es la inclinación del arma.
 */
const NOGAL_GARAND = '#7a391b';   // nogal rojizo aceitado, como el de las fotos
VETAS.add(NOGAL_GARAND);
const M2_NUEVOS = {
  /* ===== Pistolas ===== */
  beretta92: modelo({ casquillo: 'pistola', origen: PISTOLA,
    anclas: { manoDelantera: [0.8, 5.2], cargador: [-4.6, 10.4], corredera: [-3, -2.2], expulsion: [5, -3.4], boca: [18.2, -2.0] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-4.6, -0.2], [1.2, 0.8], [-1.4, 10.2], [-6.8, 10.2], [-6.0, 1.4], [-6.6, -0.4]], MAT.pavonado);           // armazón y empuñadura
      pintar(ctx, [[-0.6, 1.8], [-2.0, 8.8], [-5.6, 8.8], [-4.8, 1.8]], MAT.polimero);                                          // cachas
      rayas(ctx, -4.6, -1.8, 3, 8, 0.7, 'rgba(255,255,255,0.05)');
      pintar(ctx, [[-4.4, -0.6], [15, -0.6], [15, 0.6], [6.6, 0.7], [5.4, 1.0], [-4.4, 1.0]], MAT.pavonado);
      guardamonteC(ctx, 1.2, 7.0, 0.8, 3.0);
      if (!e.sinCargador) pintar(ctx, Rc(-7.0, 10.0, 5.6, 0.9), MAT.polimero);
      pintar(ctx, Rc(2, -3.3, 16, 1.7), MAT.acero);                                                                            // cañón a la vista
      ctx.save(); ctx.translate(-e.corredera * 3.8, 0);
      pintar(ctx, [[-5, -0.5], [-5, -3.2], [-4.2, -3.7], [1.6, -3.7], [2.6, -2.5], [12.6, -2.5], [13.6, -3.7], [17.8, -3.7], [17.8, -0.5]], MAT.pavonado);   // corredera abierta arriba
      rayas(ctx, -4.4, -2, -3.2, -0.9, 0.5);
      pintar(ctx, Rc(16.4, -4.3, 0.7, 0.6), MAT.acero); pintar(ctx, Rc(-4.4, -4.3, 1.2, 0.6), MAT.acero);
      ctx.restore();
    } }),
  ppk: modelo({ casquillo: 'pistola', origen: PISTOLA,
    anclas: { manoDelantera: [0.6, 4.4], cargador: [-3.6, 8.4], corredera: [-2.6, -2], expulsion: [4, -3], boca: [12.4, -1.8] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-3.6, -0.2], [1.0, 0.7], [-1.2, 8.4], [-5.6, 8.4], [-4.8, 1.2], [-5.2, -0.4]], MAT.niquel);
      pintar(ctx, [[-0.6, 1.4], [-1.8, 7.4], [-4.6, 7.4], [-3.8, 1.4]], MAT.polimero);                                         // cachas negras
      pintar(ctx, [[-3.6, -0.6], [10, -0.6], [10, 0.5], [5.4, 0.6], [4.4, 0.9], [-3.6, 0.9]], MAT.niquel);
      guardamonteC(ctx, 0.9, 5.4, 0.7, 2.4, MAT.niquel);
      if (!e.sinCargador) pintar(ctx, Rc(-5.8, 8.2, 4.6, 0.7), MAT.polimero);
      ctx.save(); ctx.translate(-e.corredera * 3.0, 0);
      pintar(ctx, RRc(-4.4, -3.0, 16.8, 2.6, 0.9), MAT.niquel);
      rayas(ctx, -3.8, -1.8, -2.7, -0.8, 0.45);
      if (!Pincel.silueta) { ctx.fillStyle = '#0c0c0e'; ctx.fillRect(3.2, -3.0, 3.0, 0.7); }
      ctx.restore();
    } }),

  /* ===== Metralletas ===== */
  thompson: modelo({ casquillo: 'pistola',
    anclas: { manoDelantera: [25.6, 3.6], cargador: [8, 6], corredera: [15, -9.4], expulsion: [10, -7.6], boca: [44.4, -5.2] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-6, -7.4], [-36, -4.2], [-36.8, -4.2], [-36.8, 7.8], [-36, 7.8], [-9, 2.8], [-6, 0.6]], MAT.madera);     // culata de nogal
      pintar(ctx, Rc(-37.4, -4.4, 0.8, 12.4), MAT.acero);
      pintar(ctx, [[-1, -0.6], [3, -0.6], [1.8, 8], [-2.4, 8], [-2.6, 1]], MAT.madera);                                         // pistolete
      guardamonteC(ctx, 3.0, 8.6, -0.6, 3.0, MAT.acero);
      if (!e.sinCargador) { pintar(ctx, Cc(8, 7.6, 9.4, 30), MAT.pavonado); pintar(ctx, Cc(8, 7.6, 7.4, 26), MAT.acero, { brillo: 0.15 }); punto(ctx, 8, 7.6, 1.6, '#16171a'); }   // tambor de 50
      pintar(ctx, RRc(-6, -9.0, 26.6, 8.6, 0.8), MAT.pavonado);                                                                  // cajón
      pintar(ctx, Rc(-3, -10.8, 2.6, 1.8), MAT.pavonado);                                                                         // alza
      pintar(ctx, Rc(20.6, -6.6, 15.6, 3.6), MAT.pavonado);                                                                      // cañón con aletas
      rayas(ctx, 21.4, 35.4, -6.4, -3.2, 0.8, 'rgba(255,255,255,0.12)', 0.35);
      pintar(ctx, Rc(36.2, -5.8, 3.8, 2.0), MAT.pavonado);
      pintar(ctx, RRc(39.6, -6.6, 4.8, 3.4, 0.5), MAT.acero); rayas(ctx, 40.6, 43.4, -6.4, -5.0, 1.0, '#000', 0.3);              // compensador Cutts
      pintar(ctx, [[23.4, -2.8], [28, -2.8], [27.4, 7.8], [23.8, 7.8]], MAT.madera);                                           // empuñadura delantera
      rayas(ctx, 24.2, 27.2, 1, 7, 1.5, 'rgba(0,0,0,0.3)', 0.35);
      pintar(ctx, RRc(14 - e.corredera * 6, -10.6, 2.4, 1.8, 0.6), MAT.acero);                                                  // perilla de carga arriba
    } }),
  vector: modelo({ casquillo: 'pistola',
    anclas: { manoDelantera: [15.4, 2.6], cargador: [7, 4], corredera: [2, -7.6], expulsion: [10, -6], boca: [36.4, -3.7] },
    dibujarCm(ctx, e) {
      pintar(ctx, Rc(-24, -5.6, 20, 1.2), MAT.polimero); pintar(ctx, Rc(-24, -1.6, 20, 1.2), MAT.polimero);                    // culata de varillas
      pintar(ctx, RRc(-27, -7.4, 3.4, 9, 0.8), MAT.polimero);
      pintar(ctx, [[-4, -7], [22, -7], [24, -5], [24, -1], [18, 1], [18, 3.4], [10, 3.4], [6.6, 9.4], [3, 9.4], [0.4, 1], [-4, 1]], MAT.polimero);   // cuerpo anguloso
      rayas(ctx, 12, 20, -5.6, -1.4, 1.6, 'rgba(255,255,255,0.06)', 0.4);
      pintar(ctx, [[-0.6, 0.4], [3, 0.4], [1.6, 9.6], [-2.6, 9.6], [-2.4, 3]], MAT.polimero);
      if (!e.sinCargador) pintar(ctx, [[5.4, 3.4], [9.2, 3.4], [9.8, 17.4], [5.8, 17.4]], MAT.pavonado);                       // cargador de pistola
      pintar(ctx, Rc(-2, -8.6, 26, 1.6), MAT.pavonado); rayas(ctx, -1, 23, -8.6, -7.2, 1.2, 'rgba(0,0,0,0.5)', 0.3);           // riel
      pintar(ctx, Rc(24, -4.8, 8, 2.4), MAT.pavonado); pintar(ctx, RRc(32, -4.6, 4.4, 1.8, 0.4), MAT.acero);
      pintar(ctx, RRc(1 - e.corredera * 5, -7.4, 2.8, 1.2, 0.4), MAT.acero);
    } }),

  /* ===== Rifles ===== */
  /* M1 Garand (110,6 cm), medido sobre fotos de perfil: culata de nogal de una pieza, alta atrás y con garganta
   * en semipistolete; cajón con el alza de anillo; dos guardamanos de madera arriba del cañón separados por la
   * abrazadera inferior; la varilla de operación por el costado con su manija junto al cajón; adelante el
   * cilindro de gases bajo el cañón y el guion con orejas. Se carga por arriba con el peine en bloque de 8. */
  garand: modelo({ casquillo: 'bala',
    anclas: { manoDelantera: [33, 0.8], cargador: [10.5, -4.6], corredera: [19.4, -3.8], expulsion: [11, -4.6], boca: [80.6, -3.0] },
    dibujarCm(ctx, e) {
      const ab = Math.max(e.corredera, e.abierto);
      // Culata de una pieza: talón alto, lomo casi recto, garganta curva, y el fuste que sigue bajo el cañón
      pintar(ctx, suave([[-30, 0.2], [-12, -0.9], [-4, -1.5], [-0.4, -1.6], [17, -1.6], [44.6, -1.8], [64.7, -1.8], [65.2, -0.6], [64.7, 0.2],
        [45, 0.5], [17, 2.4], [8.4, 2.7], [2.2, 2.6], [-2.4, 3.6], [-6, 4.4], [-12, 7.0], [-22, 10.2], [-30, 12.0], [-30.4, 6]], 0.9, 4), NOGAL_GARAND);
      trazo(ctx, 'rgba(0,0,0,0.25)', 0.3, [[-2.6, -1.3], [-1.2, 3.2]]);                                                       // canto de la garganta
      pintar(ctx, suave([[-30.9, -0.2], [-30.1, -0.2], [-30.1, 12.4], [-30.9, 12.4]], 0.3, 2), MAT.pavonado);                // cantonera de acero
      if (!Pincel.silueta) { ctx.beginPath(); ctx.ellipse(-21.4, 11.2, 0.9, 0.7, 0, 0, Math.PI * 2); ctx.strokeStyle = '#2a2b2f'; ctx.lineWidth = 0.35; ctx.stroke(); }   // argolla de la culata
      // Guardamonte redondo y grande, con el seguro adelante
      guardamonteC(ctx, 2.4, 8.0, 2.5, 2.8, MAT.pavonado);
      pintar(ctx, Rc(8.2, 2.3, 0.9, 1.2), MAT.pavonado);
      // Varilla de operación por el costado (de la manija al cilindro de gases)
      pintar(ctx, RRc(18, -2.5, 47, 0.9, 0.4), MAT.pavonado);
      // Cajón con el alza de anillo y su perilla de deriva
      pintar(ctx, suave([[-0.6, -1.4], [-0.8, -3.0], [0.6, -4.4], [17.6, -4.2], [17.8, -1.4]], 0.5, 3), MAT.pavonado);
      pintar(ctx, suave([[2.6, -4.4], [3.4, -6.8], [6.6, -6.8], [7.8, -4.4]], 0.5, 3), MAT.pavonado);                       // alza
      punto(ctx, 4.9, -6.0, 0.55, '#0a0a0c');                                                                                 // anillo de puntería
      pintar(ctx, Cc(6.4, -4.9, 0.95, 14), MAT.acero); rayas(ctx, 5.7, 7.1, -5.6, -4.2, 0.35, 'rgba(0,0,0,0.5)', 0.18);      // perilla
      if (ab > 0.3 && !Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(8.4, -4.4, 6.8, 0.9); }                    // recámara abierta (por acá entra el peine)
      trazo(ctx, 'rgba(255,255,255,0.12)', 0.25, [[0.8, -4.1], [17.2, -3.9]]);
      // Guardamanos de madera arriba del cañón (atrás y adelante de la abrazadera)
      pintar(ctx, suave([[17.8, -1.6], [18.2, -4.0], [44.4, -3.8], [44.4, -1.8]], 0.7, 3), NOGAL_GARAND);
      pintar(ctx, suave([[46, -1.8], [46, -3.8], [64, -3.6], [64.6, -1.8]], 0.7, 3), NOGAL_GARAND);
      // Abrazadera inferior con argolla para la correa
      pintar(ctx, Rc(44.4, -4.2, 1.6, 4.9), MAT.pavonado);
      if (!Pincel.silueta) { ctx.beginPath(); ctx.ellipse(45.2, 1.5, 0.8, 0.7, 0, 0, Math.PI * 2); ctx.strokeStyle = '#2a2b2f'; ctx.lineWidth = 0.35; ctx.stroke(); }
      // Cañón, cilindro de gases debajo con su tapón, tetón de bayoneta y guion con orejas protectoras
      pintar(ctx, Rc(64, -3.7, 16.6, 1.3), MAT.pavonado);
      pintar(ctx, RRc(64.6, -2.5, 13.4, 1.8, 0.7), MAT.pavonado);
      pintar(ctx, RRc(77.8, -2.4, 1.4, 1.6, 0.4), MAT.acero);
      pintar(ctx, Rc(75.4, -0.8, 1.4, 0.9), MAT.pavonado);
      pintar(ctx, [[76.6, -3.6], [76.8, -6.4], [77.4, -6.4], [77.6, -3.6]], MAT.pavonado);
      pintar(ctx, [[78.6, -3.6], [78.8, -6.4], [79.4, -6.4], [79.6, -3.6]], MAT.pavonado);
      pintar(ctx, [[77.8, -3.6], [78.0, -5.6], [78.4, -5.6], [78.6, -3.6]], MAT.acero);
      // Manija de la varilla de operación, junto al cajón: corre hacia atrás al cargar
      pintar(ctx, suave([[18.2 - ab * 7, -2.5], [18.6 - ab * 7, -5.0], [20.8 - ab * 7, -5.0], [21.0 - ab * 7, -2.5]], 0.5, 3), MAT.acero);
    } }),
  svd: modelo({ casquillo: 'bala',
    anclas: { manoDelantera: [38, -3.6], cargador: [10, -2.2], corredera: [19, -5.2], expulsion: [14, -7], boca: [102, -5.9] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-5, -6.8], [-40, -6.4], [-40.8, -6.4], [-40.8, 8.2], [-40, 8.2], [-8, 1.6], [-5, -2.2]], MAT.madera,
        { huecos: [[[-30, -4.0], [-12, -3.2], [-12, -0.2], [-30, 3.6]]] });                                                     // culata esqueleto
      pintar(ctx, Rc(-41.4, -6.6, 0.9, 15), MAT.goma);
      pintar(ctx, [[-1, -2.2], [3, -2.2], [1.6, 8], [-2.6, 8], [-2.8, 0]], MAT.madera);
      guardamonteC(ctx, 3.2, 9.2, -2.2, 3.2, MAT.acero);
      if (!e.sinCargador) pintar(ctx, [[7, -2.2], [12.6, -2.2], [13.8, 4], [15.4, 9.4], [10.6, 10.6], [9.4, 5], [7, 0]], MAT.pavonado);   // cargador de 10
      pintar(ctx, [[-5, -2.2], [-5, -6.8], [-3.2, -8], [26, -8], [26, -2.2]], MAT.pavonado);
      pintar(ctx, [[27, -7.8], [50, -7.6], [50, -3.4], [27, -3.2]], MAT.madera, { huecos: Array.from({ length: 5 }, (_, k) => RRc(30 + k * 4, -6.6, 2.2, 1.0, 0.4)) });   // guardamanos con ventilaciones
      pintar(ctx, Rc(50, -6.6, 46, 1.4), MAT.pavonado);
      pintar(ctx, RRc(96, -7.2, 6.2, 2.6, 0.5), MAT.pavonado); rayas(ctx, 97.4, 101, -7, -5, 1.2, '#000', 0.3);               // apagallamas
      pintar(ctx, [[92, -6.6], [92.4, -9.6], [93.6, -9.6], [94, -6.6]], MAT.pavonado);
      miraTelescopica(ctx, 0, 24, -12.4, 2.6, 4.2, [5, 18], -8);
      pintar(ctx, RRc(17.4 - e.corredera * 8, -5.9, 3.4, 1.4, 0.5), MAT.acero);
    } }),

  /* ===== Escopetas ===== */
  benelli: modelo({ casquillo: 'escopeta',
    anclas: { manoDelantera: [33, -2.4], cargador: [11, 1.6], corredera: [9, -1.6], expulsion: [10, -5.5], boca: [66, -5.1] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-4, -6.2], [-30, -5.6], [-31.6, -5.6], [-31.6, 6], [-26, 5.2], [-12, 0], [-4, 0]], MAT.polimero);         // culata
      pintar(ctx, Rc(-32.6, -5.8, 1.1, 12), MAT.goma);
      pintar(ctx, [[-0.6, 1.4], [3.4, 1.4], [2.0, 10.6], [-2.6, 10.6], [-2.4, 4]], MAT.polimero);
      pintar(ctx, [[-2, -6.6], [19, -6.6], [19, 1.6], [-2, 1.6]], MAT.aleacion);                                               // cajón
      guardamonteC(ctx, 3.4, 9.2, 1.6, 2.6, MAT.polimero);
      pintar(ctx, Rc(1, -8.6, 3, 2), MAT.pavonado); pintar(ctx, Rc(1.6, -9.6, 1.8, 1), MAT.pavonado);                          // alza fantasma
      pintar(ctx, Rc(19, -6.0, 47, 1.8), MAT.pavonado);
      pintar(ctx, Rc(19, -3.8, 34, 2.6), MAT.pavonado); pintar(ctx, Rc(53, -4.0, 2, 3), MAT.acero);
      pintar(ctx, RRc(22, -4.8, 22, 4.6, 1.2), MAT.polimero); rayas(ctx, 24, 42, -4.4, -0.6, 1.4, 'rgba(255,255,255,0.08)', 0.45);
      pintar(ctx, [[63.6, -6.0], [64, -8.4], [65, -8.4], [65.4, -6.0]], MAT.pavonado);
      pintar(ctx, RRc(8 - e.corredera * 5, -2.4, 3, 1.4, 0.5), MAT.acero);                                                     // manija de carga
    } }),
  rem870: modelo({ casquillo: 'escopeta',
    anclas: { manoDelantera: [34, -2.4], cargador: [12, 1.4], corredera: [34, -2.6], expulsion: [10, -5], boca: [67.6, -5.2] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-36, -5.2], [-4, -4.2], [0, -4.6], [0, 1.4], [-2, 2], [-5, 2.4], [-36, 8.2]], MAT.nogal);
      pintar(ctx, Rc(-37, -5.4, 1.1, 13.8), MAT.goma);
      pintar(ctx, [[0, -6.4], [20.6, -6.4], [20.6, 1.4], [0, 1.4]], MAT.pavonado);
      if (!Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(6, -5.6, 7, 1.6); }
      guardamonteC(ctx, 1.2, 8.0, 1.4, 2.4);
      pintar(ctx, Rc(20.6, -6.0, 47, 1.6), MAT.pavonado); pintar(ctx, Rc(20.6, -6.8, 47, 0.6), MAT.pavonado);                  // cañón con banda ventilada
      punto(ctx, 67, -7.2, 0.4, '#d8d8d8');
      pintar(ctx, Rc(20.6, -4.0, 36, 2.4), MAT.pavonado); pintar(ctx, Rc(56.6, -4.2, 1.8, 2.8), MAT.acero);
      ctx.save(); ctx.translate(-e.bombeo * 9, 0);
      pintar(ctx, RRc(25, -4.8, 19, 4.6, 1.2), MAT.nogal); rayas(ctx, 27, 42, -4.4, -0.6, 1.4, 'rgba(0,0,0,0.3)', 0.45);   // bomba de madera
      ctx.restore();
    } }),

  /* ===== Especiales ===== */
  rpg7: modelo({ casquillo: null,
    anclas: { manoDelantera: [15.8, 3.2], cargador: [38, -4], corredera: [38, -4], expulsion: [-64, -4], boca: [62, -3.8] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-60, -6.2], [-62.6, -8.8], [-66, -9.4], [-66, 1.4], [-62.6, 0.8], [-60, -1.8]], MAT.pavonado);             // tobera trasera
      pintar(ctx, Rc(-60, -6.2, 96, 4.4), MAT.acero);                                                                            // tubo
      pintar(ctx, RRc(-15, -7.6, 28, 7.2, 1.8), MAT.madera);                                                                     // protector térmico de madera
      trazo(ctx, 'rgba(0,0,0,0.4)', 0.3, [[-14, -4], [12, -4]]);
      pintar(ctx, [[-0.6, -1.8], [3.2, -1.8], [2.0, 8], [-2.2, 8], [-2.0, 2]], MAT.polimero);
      guardamonteC(ctx, 3.2, 8.2, -1.8, 2.6);
      pintar(ctx, [[14, -1.8], [17.6, -1.8], [17, 7], [14.4, 7]], MAT.polimero);
      pintar(ctx, Rc(-3, -12.4, 10, 3.6), MAT.pavonado); pintar(ctx, RRc(-6, -12, 3.4, 2.8, 0.8), MAT.goma);                   // mira óptica
      if (!e.sinCargador) {                                                                                                      // ojiva de 85 mm que asoma adelante
        pintar(ctx, [[34, -5.0], [40, -5.0], [44, -9.4], [54, -9.4], [62, -4.0], [54, 1.4], [44, 1.4], [40, -2.6], [34, -2.6]], MAT.oliva);
        pintar(ctx, Rc(61.6, -4.6, 3.0, 1.2), MAT.acero);
        trazo(ctx, 'rgba(0,0,0,0.35)', 0.35, [[46, -9.2], [46, 1.2]]);
      }
    } }),
  mgl: modelo({ casquillo: null, casquilloVaciado: 'granada40',
    anclas: { manoDelantera: [30.8, 3.4], cargador: [13, -2], corredera: [-1, -6], expulsion: [13, -2], boca: [42.4, -3.4] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-4, -6.2], [-28, -5.2], [-29.4, -5.2], [-29.4, 6.2], [-24, 5.2], [-6, 0], [-4, 0]], MAT.polimero);       // culata plegable
      pintar(ctx, [[-0.6, 0.6], [3.4, 0.6], [2.0, 9.6], [-2.6, 9.6], [-2.4, 3]], MAT.polimero);
      guardamonteC(ctx, 3.0, 8.4, 0.6, 2.6);
      pintar(ctx, [[-4, -6.4], [6, -6.4], [6, 0.8], [-4, 0.8]], MAT.oliva);                                                   // armazón trasero
      ctx.save(); ctx.translate(5, 2); ctx.rotate(e.abierto * 0.5); ctx.translate(-5, -2);                                    // el tambor y el cañón se vuelcan hacia adelante
      pintar(ctx, RRc(6, -9.6, 18, 15.4, 3.4), MAT.oliva);                                                                       // tambor de 6 granadas
      rayas(ctx, 8, 22, -9.0, 5.0, 3.4, 'rgba(0,0,0,0.35)', 0.5);
      pintar(ctx, RRc(24, -6.6, 18.6, 6.4, 1.2), MAT.pavonado);                                                                 // cañón de 40 mm
      pintar(ctx, Rc(4, -11, 22, 1.4), MAT.acero);                                                                               // puente superior
      pintar(ctx, [[29, -0.2], [32.6, -0.2], [32, 8.2], [29.4, 8.2]], MAT.polimero);                                           // empuñadura delantera
      if (e.abierto > 0.5) punto(ctx, 7, -2, 2.2, '#0a0a0c');
      ctx.restore();
      pintar(ctx, Rc(8, -14.4, 8, 3.2), MAT.pavonado); if (!Pincel.silueta) { ctx.fillStyle = '#d33'; ctx.fillRect(15.6, -13.2, 0.4, 0.8); }   // mira réflex
    } }),

  /* ===== Cuerpo a cuerpo ===== */
  machete: modelo({ casquillo: null,
    anclas: { manoDelantera: [0, 6], cargador: [0, 3], corredera: [0, 3], expulsion: [0, 0], boca: [1, -44] },
    dibujarCm(ctx, e) {
      pintar(ctx, RRc(-1.7, -0.8, 3.4, 11.6, 1.3), MAT.polimero);                                                                // mango
      punto(ctx, 0, 2.4, 0.45, '#9aa0a8'); punto(ctx, 0, 7.4, 0.45, '#9aa0a8');                                                  // remaches
      pintar(ctx, Rc(-2.2, -1.6, 4.4, 0.9), MAT.acero);
      pintar(ctx, [[-1.4, -1.6], [2.0, -1.6], [3.6, -20], [4.4, -37], [3, -45], [-0.4, -48.4], [-1.5, -40]], MAT.inox, { brillo: 0.45 });   // hoja
      trazo(ctx, 'rgba(255,255,255,0.6)', 0.35, [[2.2, -4], [3.9, -22], [4.3, -37]]);                                         // filo
      trazo(ctx, 'rgba(60,40,30,0.4)', 0.8, [[0.4, -10], [1.2, -18]]);                                                           // mugre
    } }),
  katana: modelo({ casquillo: null,
    anclas: { manoDelantera: [0, 14], cargador: [0, 6], corredera: [0, 6], expulsion: [0, 0], boca: [3.6, -72] },
    dibujarCm(ctx, e) {
      pintar(ctx, RRc(-1.6, -1.2, 3.2, 25.4, 1.3), '#1d1a22');                                                                  // tsuka envuelta
      if (!Pincel.silueta) for (let y = 0; y < 23; y += 2.4) { trazo(ctx, 'rgba(230,225,215,0.55)', 0.4, [[-1.5, y], [1.5, y + 1.2]]); trazo(ctx, 'rgba(230,225,215,0.55)', 0.4, [[1.5, y], [-1.5, y + 1.2]]); }
      pintar(ctx, Rc(-1.7, 23.8, 3.4, 1.4), MAT.pavonado);                                                                      // kashira
      pintar(ctx, RRc(-4.2, -2.6, 8.4, 1.4, 0.6), MAT.pavonado);                                                                // tsuba
      pintar(ctx, Rc(-1.4, -4.6, 2.8, 2.0), MAT.laton);                                                                         // habaki
      const borde = [], lomo = [];
      for (let k = 0; k <= 12; k++) { const tt = k / 12, y = -4.6 - tt * 66, c = 2.6 * tt * tt; lomo.push([-1.3 + c, y]); borde.push([1.5 + c - tt * 0.4, y]); }
      pintar(ctx, [...borde, [3.6, -73.4], ...lomo.reverse()], '#d2d6dc', { brillo: 0.5 });                                     // hoja curva
      if (!Pincel.silueta) { ctx.beginPath(); for (let k = 0; k <= 24; k++) { const tt = k / 24, y = -5 - tt * 64, c = 2.6 * tt * tt; const x = 0.7 + c - tt * 0.2 + Math.sin(k * 1.7) * 0.18; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.35; ctx.stroke(); }   // hamon
    } }),
  hacha: modelo({ casquillo: null,
    anclas: { manoDelantera: [0, 16], cargador: [0, 8], corredera: [0, 8], expulsion: [0, 0], boca: [13, -60] },
    dibujarCm(ctx, e) {
      pintar(ctx, RRc(-1.7, -58, 3.4, 80, 1.3), '#c79a3a');                                                                     // mango de fibra
      pintar(ctx, Rc(-1.8, 14, 3.6, 8), MAT.goma);
      pintar(ctx, [[1.2, -62.4], [6, -64], [12.6, -70.4], [14.2, -60], [12.6, -49.6], [6, -55.4], [1.2, -54.2]], MAT.rojo);    // hoja pintada
      pintar(ctx, [[11.4, -68.8], [14.2, -60], [12.4, -51.2], [10.8, -52.6], [12.2, -60], [10.4, -67.2]], MAT.inox, { brillo: 0.5 });   // filo afilado
      pintar(ctx, [[-1.2, -61.4], [-6, -60.6], [-13.4, -59.2], [-6, -57], [-1.2, -56.2]], MAT.rojo);                           // pico
      pintar(ctx, RRc(-2.4, -63.6, 4.8, 9.8, 1), MAT.rojo);
    } }),
  bate: modelo({ casquillo: null,
    anclas: { manoDelantera: [0, 8], cargador: [0, 4], corredera: [0, 4], expulsion: [0, 0], boca: [0, -60] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-1.4, 12], [1.4, 12], [1.7, 0], [2.5, -25], [3.5, -50], [3.5, -64], [2.6, -66.6], [-2.6, -66.6], [-3.5, -64], [-3.5, -50], [-2.5, -25], [-1.7, 0]], MAT.maderaClara);
      pintar(ctx, RRc(-2.3, 12, 4.6, 1.8, 0.7), MAT.maderaClara);                                                              // perilla
      pintar(ctx, Rc(-1.7, -2, 3.4, 13.6), MAT.goma);                                                                           // cinta
      for (const [y, lado] of [[-42, 1], [-47, -1], [-52, 1], [-56, -1], [-60, 1], [-50, 1], [-62, -1], [-44, -1]]) trazo(ctx, '#b9bec6', 0.45, [[lado * 3.2, y], [lado * 6.2, y - 0.6]]);   // clavos
      punto(ctx, 1.2, -55, 1.3, 'rgba(110,11,11,0.7)'); punto(ctx, -1.4, -48, 0.9, 'rgba(110,11,11,0.6)');
    } }),
  mazo: modelo({ casquillo: null,
    anclas: { manoDelantera: [0, 15], cargador: [0, 8], corredera: [0, 8], expulsion: [0, 0], boca: [8, -66] },
    dibujarCm(ctx, e) {
      pintar(ctx, RRc(-1.5, -62, 3.0, 82, 1.1), MAT.maderaClara);
      pintar(ctx, RRc(-8.4, -70.6, 16.8, 9.4, 1.4), '#4a4d53');                                                                  // cabeza de acero
      pintar(ctx, Rc(7.2, -70, 1.4, 8.2), MAT.acero); pintar(ctx, Rc(-8.6, -70, 1.4, 8.2), MAT.acero);                          // caras
    } }),

  /* ===== Legendarias ===== */
  mjolnir: modelo({ casquillo: null,
    anclas: { manoDelantera: [0, 10], cargador: [0, 6], corredera: [0, 6], expulsion: [0, 0], boca: [13, -13] },
    dibujarCm(ctx, e) {
      pintar(ctx, RRc(-1.5, -6, 3.0, 22, 1), '#5a3a20');                                                                         // mango envuelto en cuero
      for (let y = -4; y < 15; y += 1.8) trazo(ctx, 'rgba(0,0,0,0.35)', 0.35, [[-1.5, y], [1.5, y + 0.9]]);
      pintar(ctx, Rc(-1.9, 15.6, 3.8, 1.6), MAT.acero);
      if (!Pincel.silueta) { ctx.beginPath(); ctx.ellipse(0, 19.6, 1.6, 2.6, 0, 0, Math.PI * 2); ctx.strokeStyle = '#3d2614'; ctx.lineWidth = 0.6; ctx.stroke(); }   // correa
      pintar(ctx, RRc(-13, -20.4, 26, 14.4, 2.2), '#8a929c', { brillo: 0.45 });                                                 // cabeza
      pintar(ctx, Rc(-13, -15, 26, 3.4), '#6f7782');
      if (!Pincel.silueta) {
        for (const cx of [-7.4, 7.4]) { ctx.beginPath(); ctx.arc(cx, -13.2, 2.6, 0, Math.PI * 2); ctx.moveTo(cx - 2.6, -13.2); ctx.lineTo(cx + 2.6, -13.2); ctx.moveTo(cx, -15.8); ctx.lineTo(cx, -10.6); ctx.strokeStyle = 'rgba(30,35,45,0.6)'; ctx.lineWidth = 0.4; ctx.stroke(); }   // nudos grabados
        if (Math.random() < 0.25) { ctx.strokeStyle = 'rgba(160,210,255,0.9)'; ctx.lineWidth = 0.4; ctx.beginPath(); const x0 = -12 + Math.random() * 24; ctx.moveTo(x0, -20.4); ctx.lineTo(x0 + 1.5, -23); ctx.lineTo(x0 - 0.5, -24.5); ctx.lineTo(x0 + 1, -27); ctx.stroke(); }   // chispas
      }
    } }),
  excalibur: modelo({ casquillo: null,
    anclas: { manoDelantera: [0, 10], cargador: [0, 6], corredera: [0, 6], expulsion: [0, 0], boca: [0, -78] },
    dibujarCm(ctx, e) {
      if (!Pincel.silueta) { const g = ctx.createLinearGradient(0, -2, 0, -82); g.addColorStop(0, 'rgba(255,225,120,0)'); g.addColorStop(1, 'rgba(255,225,120,0.35)'); ctx.fillStyle = g; ctx.fillRect(-5, -82, 10, 80); }   // resplandor
      pintar(ctx, RRc(-1.5, -1, 3, 15, 1), '#5a2a14');
      pintar(ctx, Cc(0, 15.6, 2.4, 14), MAT.laton);                                                                             // pomo
      pintar(ctx, [[-9.6, -1.6], [-9, -2.8], [9, -2.8], [9.6, -1.6], [9, -0.6], [-9, -0.6]], MAT.laton);                        // gavilanes
      punto(ctx, 0, -1.7, 0.9, '#3a6fd8');                                                                                       // piedra
      pintar(ctx, [[-2.3, -2.8], [2.3, -2.8], [1.9, -74], [0, -80], [-1.9, -74]], '#e4e8ee', { brillo: 0.55 });               // hoja recta
      trazo(ctx, 'rgba(120,130,150,0.6)', 0.5, [[0, -4], [0, -66]]);                                                            // vaceo
    } }),
  tridente: modelo({ casquillo: null,
    anclas: { manoDelantera: [0, 18], cargador: [0, 8], corredera: [0, 8], expulsion: [0, 0], boca: [0, -96] },
    dibujarCm(ctx, e) {
      pintar(ctx, RRc(-1.2, -72, 2.4, 98, 1), MAT.laton);
      for (const y of [-40, 0, 20]) pintar(ctx, Rc(-1.6, y, 3.2, 1.2), MAT.cobre);
      pintar(ctx, [[-9, -72], [9, -72], [9.6, -75], [-9.6, -75]], MAT.laton);
      for (const x of [-8, 0, 8]) {
        const largo = x ? 18 : 23;
        pintar(ctx, [[x - 1.2, -75], [x + 1.2, -75], [x + 1.2, -75 - largo + 4], [x, -75 - largo], [x - 1.2, -75 - largo + 4]], MAT.laton, { brillo: 0.5 });
        if (x) pintar(ctx, [[x + Math.sign(x) * 1.2, -75 - largo + 5], [x + Math.sign(x) * 3.4, -75 - largo + 8], [x + Math.sign(x) * 1.2, -75 - largo + 8]], MAT.laton);   // púas
      }
      punto(ctx, 0, -73.5, 1.2, '#3fd0e0');
    } }),
  egida: modelo({ casquillo: null,
    anclas: { manoDelantera: [0, 6], cargador: [0, 0], corredera: [0, 0], expulsion: [0, 0], boca: [4, -4] },
    dibujarCm(ctx, e) {
      if (e.sinCargador) return;   // en el aire
      pintar(ctx, Cc(4, -4, 17, 40), '#b07a2c', { brillo: 0.4 });                                                               // escudo redondo de bronce
      pintar(ctx, Cc(4, -4, 13.6, 36), '#c99a46');
      pintar(ctx, Cc(4, -4, 5.2, 24), '#8a5a1c', { brillo: 0.5 });                                                              // umbo
      if (!Pincel.silueta) for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; trazo(ctx, 'rgba(70,40,10,0.55)', 0.5, [[4 + Math.cos(a) * 6.4, -4 + Math.sin(a) * 6.4], [4 + Math.cos(a) * 12.6, -4 + Math.sin(a) * 12.6]]); }   // rayos grabados
    } }),
  gungnir: modelo({ casquillo: null,
    anclas: { manoDelantera: [0, 20], cargador: [0, 8], corredera: [0, 8], expulsion: [0, 0], boca: [0, -106] },
    dibujarCm(ctx, e) {
      if (e.sinCargador) return;   // en el aire
      pintar(ctx, RRc(-1, -84, 2, 110, 1), MAT.nogal);
      if (!Pincel.silueta) for (let y = -70; y < 10; y += 9) trazo(ctx, 'rgba(150,210,255,0.7)', 0.35, [[-0.6, y], [0.6, y + 1.4], [-0.4, y + 2.6]]);   // runas
      pintar(ctx, Rc(-1.5, -87, 3, 4), MAT.laton);
      pintar(ctx, [[-2.8, -87], [2.8, -87], [3.4, -94], [0, -110], [-3.4, -94]], '#d6dde6', { brillo: 0.55 });               // punta de hoja ancha
      trazo(ctx, 'rgba(90,100,120,0.6)', 0.4, [[0, -88], [0, -104]]);
    } }),
};

/* Agarre de cada una (mismo formato que AGARRES) */
const AGARRES_2 = {
  beretta92: ['pistola', 0.3], ppk: ['pistola', 0.32],
  thompson: ['hombro', 0.3, 31], vector: ['hombro', 0.25, 27], garand: ['hombro', 0.75, 30.4], svd: ['hombro', 0.3, 41],
  benelli: ['hombro', 0.33, 32], rem870: ['hombro', 0.85, 37], rpg7: ['hombro', 0.15, 10], mgl: ['hombro', 0.3, 29],
};
for (const id of ['machete', 'katana', 'hacha', 'bate', 'mazo', 'mjolnir', 'excalibur', 'tridente', 'egida', 'gungnir']) AGARRES_2[id] = ['cuerpo', 0];
for (const [id, [agarre, angulo, culata]] of Object.entries(AGARRES_2)) Object.assign(M2_NUEVOS[id], { agarre, anguloEmpunadura: angulo, culataCm: culata });
Object.assign(M2_NUEVOS.thompson, { moviles: { corredera: e => [-e.corredera * 6, 0] } });
Object.assign(M2_NUEVOS.vector, { moviles: { corredera: e => [-e.corredera * 5, 0] } });
Object.assign(M2_NUEVOS.garand, { moviles: { corredera: e => [-Math.max(e.corredera, e.abierto) * 7, 0] } });
Object.assign(M2_NUEVOS.svd, { moviles: { corredera: e => [-e.corredera * 8, 0] } });
Object.assign(M2_NUEVOS.benelli, { moviles: { corredera: e => [-e.corredera * 5, 0] } });
Object.assign(M2_NUEVOS.rem870, { moviles: { corredera: e => [-e.bombeo * 9, 0], manoDelantera: e => [-e.bombeo * 9, 0] } });
Object.assign(M2_NUEVOS.mgl, { moviles: { manoDelantera: e => girarCm(30.8, 3.4, 5, 2, e.abierto * 0.5), cargador: e => girarCm(13, -2, 5, 2, e.abierto * 0.5) } });
Object.assign(DIBUJO_ARMAS, M2_NUEVOS);
