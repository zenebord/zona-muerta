/* ===== Misiones =====
 * Todas se juegan dentro de la pelea infinita. Tipos:
 *   bajas      → matar N zombies (opcionalmente con una categoría o un arma puntual)
 *   conseguir  → recoger ciertas armas (lista de ids) o N armas de una categoría
 *   sobrevivir → aguantar vivo N segundos
 * Cualquiera puede llevar `tiempoLimite` (segundos): si se agota, la misión falla.
 */
const MISIONES = [
  { id: 'primera-sangre', nombre: 'Primera sangre',      descripcion: 'Mata 10 zombies.',                                        tipo: 'bajas', meta: 10 },
  { id: 'cazador',        nombre: 'Cazador',             descripcion: 'Mata 50 zombies.',                                        tipo: 'bajas', meta: 50 },
  { id: 'pistolero',      nombre: 'Pistolero',           descripcion: 'Mata 15 zombies con pistolas.',         tipo: 'bajas', meta: 15, categoria: 'pistola' },
  { id: 'rafaga',         nombre: 'Ráfaga',              descripcion: 'Mata 25 zombies con metralletas.',                        tipo: 'bajas', meta: 25, categoria: 'metralleta' },
  { id: 'un-tiro',        nombre: 'Un tiro, un muerto',  descripcion: 'Mata 20 zombies con rifles.',                             tipo: 'bajas', meta: 20, categoria: 'rifle' },
  { id: 'escopetazo',     nombre: 'Escopetazo',          descripcion: 'Consigue una escopeta.',                                  tipo: 'conseguir', categoria: 'escopeta', meta: 1 },
  { id: 'coleccionista',  nombre: 'Coleccionista',       descripcion: 'Consigue 3 escopetas distintas.',                               tipo: 'conseguir', categoria: 'escopeta', meta: 3 },
  { id: 'arsenal',        nombre: 'Arsenal completo',    descripcion: 'Consigue la Uzi, la AK-47, la M16, el Remington 700 y el Barrett M82.',              tipo: 'conseguir', armas: ['uzi', 'ak47', 'm16', 'remington700', 'barrett'] },
  { id: 'artillero',      nombre: 'Artillero',           descripcion: 'Sube a una montaña, monta la M2 Browning y mata 30 zombies con ella.', tipo: 'bajas', meta: 30, categoria: 'ametralladora', arma: 'm2' },   // la minigun también es ametralladora: no cuenta
  { id: 'tecnologia',     nombre: 'Tecnología alienígena', descripcion: 'Encuentra el láser alienígena en lo alto de una montaña.', tipo: 'conseguir', armas: ['laser'] },
  { id: 'demoledor',      nombre: 'Demoledor',           descripcion: 'Mata 15 zombies con granadas, lanzagranadas o bazuca.',  tipo: 'bajas', meta: 15, categorias: ['granada', 'lanzagranadas', 'bazuca'] },
  { id: 'relampago',      nombre: 'Relámpago',           descripcion: 'Mata 5 zombies en 30 segundos.',                          tipo: 'bajas', meta: 5,  tiempoLimite: 30 },
  { id: 'contrarreloj',   nombre: 'Contrarreloj',        descripcion: 'Mata 30 zombies en 2 minutos.',                           tipo: 'bajas', meta: 30, tiempoLimite: 120 },
  { id: 'masacre',        nombre: 'Masacre',             descripcion: 'Mata 100 zombies en 10 minutos.',                         tipo: 'bajas', meta: 100, tiempoLimite: 600 },
  { id: 'rapido',         nombre: 'Manos rápidas',       descripcion: 'Consigue 3 armas distintas en 90 segundos.',               tipo: 'conseguir', meta: 3, tiempoLimite: 90 },
  { id: 'resistencia',    nombre: 'Resistencia',         descripcion: 'Sobrevive 5 minutos.',                                    tipo: 'sobrevivir', meta: 300 },
  { id: 'sobreviviente',  nombre: 'Sobreviviente',       descripcion: 'Sobrevive 10 minutos.',                                   tipo: 'sobrevivir', meta: 600 },
];

const CLAVE_PROGRESO = 'zonaMuerta.misionesCumplidas';

const ProgresoMisiones = {
  cargar() {
    try { return new Set(JSON.parse(localStorage.getItem(CLAVE_PROGRESO) || '[]')); }
    catch { return new Set(); }
  },
  marcar(id) {
    const hechas = this.cargar();
    hechas.add(id);
    try { localStorage.setItem(CLAVE_PROGRESO, JSON.stringify([...hechas])); } catch { /* sin almacenamiento, no pasa nada */ }
  },
  borrar() {
    try { localStorage.removeItem(CLAVE_PROGRESO); } catch { /* ídem */ }
  },
};

/* Sigue una misión durante la partida: recibe eventos del juego y dice cómo va */
class SeguimientoMision {
  constructor(mision) {
    this.mision = mision;
    this.contador = 0;
    this.armasVistas = new Set();   // para las misiones de "conseguir"
    this.transcurrido = 0;
    this.estado = 'activa';          // activa | cumplida | fallida
  }

  // Segundos jugados; devuelve el tiempo restante si hay límite
  tick(dt) {
    if (this.estado !== 'activa') return;
    this.transcurrido += dt;
    const m = this.mision;
    if (m.tipo === 'sobrevivir' && this.transcurrido >= m.meta) this.estado = 'cumplida';
    if (m.tiempoLimite && this.transcurrido >= m.tiempoLimite && this.estado === 'activa') this.estado = 'fallida';
  }

  alMatar(arma) {
    if (this.estado !== 'activa' || this.mision.tipo !== 'bajas') return;
    const m = this.mision;
    if (m.categoria && arma.categoria !== m.categoria) return;
    if (m.categorias && !m.categorias.includes(arma.categoria)) return;
    if (m.arma && arma.id !== m.arma) return;
    this.contador++;
    if (this.contador >= m.meta) this.estado = 'cumplida';
  }

  alRecoger(arma) {
    if (this.estado !== 'activa' || this.mision.tipo !== 'conseguir') return;
    const m = this.mision;
    if (m.armas) {
      if (m.armas.includes(arma.id)) this.armasVistas.add(arma.id);
      this.contador = this.armasVistas.size;
      if (this.contador >= m.armas.length) this.estado = 'cumplida';
      return;
    }
    if (m.categoria && arma.categoria !== m.categoria) return;
    this.armasVistas.add(arma.id);
    this.contador = this.armasVistas.size;
    if (this.contador >= m.meta) this.estado = 'cumplida';
  }

  // Texto de progreso para el HUD, p. ej. "7 / 10" o "02:31"
  progresoTexto() {
    const m = this.mision;
    if (m.tipo === 'sobrevivir') return formatearTiempo(Math.max(0, m.meta - this.transcurrido));
    const total = m.armas ? m.armas.length : m.meta;
    return `${this.contador} / ${total}`;
  }

  tiempoRestante() {
    return this.mision.tiempoLimite ? Math.max(0, this.mision.tiempoLimite - this.transcurrido) : null;
  }
}

function formatearTiempo(segundos) {
  const s = Math.floor(segundos);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
