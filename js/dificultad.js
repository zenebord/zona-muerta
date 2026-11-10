/* ===== Dificultades =====
 * Los zombies vienen en rondas infinitas. Cada ronda trae más que la anterior; cuando caen todos,
 * hay un respiro y arranca la siguiente. La dificultad cambia cuántos vienen, qué tan rápidos son,
 * cuánto aguantan y cuánto muerden.
 */
const DIFICULTADES = {
  facil: {
    id: 'facil', nombre: 'Fácil',
    descripcion: 'Rondas chicas que empiezan con 5 zombies lentos. Caen con menos tiros: pistola 2, metralleta 3, rifle 1.',
    vidaZombie: 9, velocidad: 0.75, danoMordida: 8,
    zombiesBase: 5, zombiesPorRonda: 2, intervalo: 1.6, maxVivos: 20,
    rondaCorredores: 5, probCorredor: 0.1, descanso: 6,
  },
  medio: {
    id: 'medio', nombre: 'Medio',
    descripcion: 'Zombies normales, con la vida y la resistencia de siempre: pistola 3 tiros, metralleta 5, rifle 1.',
    vidaZombie: 15, velocidad: 1, danoMordida: 10,
    zombiesBase: 8, zombiesPorRonda: 3, intervalo: 1.1, maxVivos: 30,
    rondaCorredores: 3, probCorredor: 0.2, descanso: 5,
  },
  dificil: {
    id: 'dificil', nombre: 'Difícil',
    descripcion: 'Hordas grandes de zombies rápidos que muerden fuerte. Aguantan lo mismo que en medio.',
    vidaZombie: 15, velocidad: 1.3, danoMordida: 15,
    zombiesBase: 12, zombiesPorRonda: 4, intervalo: 0.7, maxVivos: 45,
    rondaCorredores: 2, probCorredor: 0.35, descanso: 4,
  },
};

const CLAVE_DIFICULTAD = 'zonaMuerta.dificultad';

const Dificultad = {
  actual() {
    let id = 'medio';
    try { id = localStorage.getItem(CLAVE_DIFICULTAD) || 'medio'; } catch { /* sin almacenamiento */ }
    return DIFICULTADES[id] || DIFICULTADES.medio;
  },
  elegir(id) {
    if (!DIFICULTADES[id]) return;
    try { localStorage.setItem(CLAVE_DIFICULTAD, id); } catch { /* ídem */ }
  },
  // Cuántos zombies trae la ronda n (empieza en 1)
  zombiesDeRonda(dificultad, ronda) {
    return Math.max(1, Math.round((dificultad.zombiesBase + dificultad.zombiesPorRonda * (ronda - 1)) * AJUSTE.cantidadZombies));
  },
};
