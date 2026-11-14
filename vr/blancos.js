/* ===== Zona Muerta VR: blancos que suben =====
 * Siluetas de chapa pintada con la bisagra abajo, detrás de un parapeto de acero: suben, se quedan un rato y bajan
 * solas; si les pegas caen de golpe con ruido de chapa. La cabeza (roja) vale más. En los niveles altos algunas se
 * corren de costado sobre un riel y otras son más chicas. En el modo libre se quedan arriba hasta que les pegas y
 * vuelven a subir. Las chapas van en la lista de objetos que tocan las balas (tipo 'emergente'). */
import * as THREE from 'three';

const suave = t => t * t * (3 - 2 * t);
const ABAJO = -Math.PI / 2;   // acostada hacia atrás, escondida detrás del parapeto

function silueta() {   // torso con hombros y cuello (la cabeza va aparte), en m, con la bisagra en y = 0
  const s = new THREE.Shape();
  s.moveTo(-0.235, 0); s.lineTo(0.235, 0); s.lineTo(0.25, 0.48);
  s.quadraticCurveTo(0.25, 0.62, 0.13, 0.65); s.lineTo(0.06, 0.67); s.lineTo(0.06, 0.74); s.lineTo(-0.06, 0.74); s.lineTo(-0.06, 0.67); s.lineTo(-0.13, 0.65);
  s.quadraticCurveTo(-0.25, 0.62, -0.25, 0.48); s.closePath();
  return s;
}
const chapa = forma => { const g = new THREE.ExtrudeGeometry(forma, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.003, bevelSegments: 1, curveSegments: 16 }); g.translate(0, 0, -0.006); return g; };

export class Emergentes {
  constructor(escena, objetos, efectos) {
    this.escena = escena; this.objetos = objetos; this.efectos = efectos; this.lista = [];
    this.alGolpe = null; this.alEscapar = null;
    const cabeza = new THREE.Shape(); cabeza.absarc(0, 0.86, 0.12, 0, Math.PI * 2, false);
    this.geo = { torso: chapa(silueta()), cabeza: chapa(cabeza), parapeto: new THREE.BoxGeometry(0.74, 0.3, 0.16), riel: new THREE.BoxGeometry(1, 0.04, 0.12) };
    this.mat = {
      torso: new THREE.MeshStandardMaterial({ color: 0xd9772b, roughness: 0.55, metalness: 0.25 }),
      cabeza: new THREE.MeshStandardMaterial({ color: 0xb8261b, roughness: 0.55, metalness: 0.25 }),
      acero: new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.6, metalness: 0.45 }),
      riel: new THREE.MeshStandardMaterial({ color: 0x24272d, roughness: 0.7, metalness: 0.5 }),
    };
  }
  crear() {
    const grupo = new THREE.Group(), bisagra = new THREE.Group(); grupo.add(bisagra); this.escena.add(grupo);
    const parapeto = new THREE.Mesh(this.geo.parapeto, this.mat.acero); parapeto.position.set(0, 0.15, 0.13); grupo.add(parapeto);
    bisagra.position.set(0, 0.27, 0);
    const torso = new THREE.Mesh(this.geo.torso, this.mat.torso), cabeza = new THREE.Mesh(this.geo.cabeza, this.mat.cabeza);
    bisagra.add(torso, cabeza);
    const riel = new THREE.Mesh(this.geo.riel, this.mat.riel); riel.visible = false; this.escena.add(riel);
    const b = { grupo, bisagra, torso, cabeza, parapeto, riel, estado: 'abajo', angulo: ABAJO, libre: true, marcas: [] };
    for (const [m, esCabeza] of [[torso, false], [cabeza, true]]) { m.userData.emergente = b; m.userData.cabeza = esCabeza; this.objetos.push({ malla: m, tipo: 'emergente', blanco: b }); }
    this.objetos.push({ malla: parapeto, tipo: 'metal', blanco: b });
    this.lista.push(b);
    return b;
  }
  /* Pone un puesto en (x, z): el parapeto y la chapa acostada. op: { chico, movil (m de cada lado), velocidad (m/s) } */
  colocar(x, z, op = {}) {
    const b = this.lista.find(q => q.libre) || this.crear();
    Object.assign(b, { libre: false, x, z, movil: op.movil || 0, velocidad: op.velocidad || 0.8, fase: Math.random() * Math.PI * 2, estado: 'abajo', angulo: ABAJO, t: 0, repetir: false });
    const e = op.chico ? 0.6 : 1; b.grupo.scale.setScalar(e);
    b.grupo.position.set(x, 0, z); b.grupo.visible = true; b.bisagra.rotation.x = ABAJO;
    this.borrarMarcas(b);
    b.riel.visible = b.movil > 0;
    if (b.movil > 0) { b.riel.scale.set(b.movil * 2 + 0.8 * e, 1, 1); b.riel.position.set(x, 0.02, z + 0.05); }
    return b;
  }
  /* Lo levanta. op: { arriba (s; Infinity = hasta que le peguen), repetir (vuelve a subir a los 2 s de caer), demora (s) } */
  subir(b, op = {}) {
    Object.assign(b, { arriba: op.arriba ?? 3, restante: op.arriba ?? 3, repetir: !!op.repetir, estado: 'espera', espera: op.demora || 0, t: 0 });
    this.borrarMarcas(b);
    return b;
  }
  // Atajo: pone y levanta
  levantar(x, z, op = {}) { return this.subir(this.colocar(x, z, op), op); }
  borrarMarcas(b) { for (const m of b.marcas) if (m.parent) m.parent.remove(m); b.marcas = []; }
  disponibles() { return this.lista.filter(b => !b.libre && b.estado === 'abajo'); }
  quitar(b) { b.libre = true; b.estado = 'abajo'; b.grupo.visible = false; b.riel.visible = false; }
  quitarTodos() { for (const b of this.lista) this.quitar(b); }
  get arriba() { return this.lista.filter(b => !b.libre && (b.estado === 'sube' || b.estado === 'arriba')).length; }
  get activos() { return this.lista.filter(b => !b.libre); }
  // ¿Se le puede pegar? (mientras sube y mientras está arriba)
  expuesto(b) { return !b.libre && (b.estado === 'sube' || b.estado === 'arriba'); }
  // Una bala (o lo que sea) tocó una chapa: cae y avisa. Devuelve { blanco, cabeza } o null si estaba abajo
  golpear(malla, punto, normal) {
    const b = malla.userData.emergente; if (!b || !this.expuesto(b)) return null;
    const cabeza = !!malla.userData.cabeza;
    if (punto && normal) b.marcas.push(this.efectos.marca(malla, punto, normal, 0.011));
    if (punto) this.efectos.impacto(punto, normal || new THREE.Vector3(0, 0, 1), 'metal');
    Audio_.blanco('acero');
    this.caer(b);
    if (this.alGolpe) this.alGolpe(b, cabeza);
    return { blanco: b, cabeza };
  }
  caer(b) { b.estado = 'cae'; b.t = 0; b.desde = b.angulo; }
  centro(b) { return b.grupo.position.clone().setY(0.27 + 0.45 * b.grupo.scale.x); }
  // Explosión: tira todos los que estén arriba dentro del radio
  enRadio(pos, radio) {
    const out = [];
    for (const b of this.lista) if (this.expuesto(b) && this.centro(b).distanceTo(pos) < radio) { this.caer(b); Audio_.blanco('acero'); if (this.alGolpe) this.alGolpe(b, false); out.push(b); }
    return out;
  }
  // Fuego o golpe de cerca: el primero que esté arriba a menos de r de p
  tocar(p, r) {
    const b = this.lista.find(q => this.expuesto(q) && Math.abs(p.x - q.grupo.position.x) < 0.3 * q.grupo.scale.x + r && Math.abs(p.z - q.grupo.position.z) < r && p.y > 0.25 && p.y < 0.27 + 1.0 * q.grupo.scale.x);
    if (!b) return null;
    this.caer(b); Audio_.blanco('acero'); if (this.alGolpe) this.alGolpe(b, false);
    return b;
  }
  actualizar(dt) {
    for (const b of this.lista) {
      if (b.libre) continue;
      b.t += dt;
      if (b.estado === 'espera') { b.espera -= dt; if (b.espera <= 0) { b.estado = 'sube'; b.t = 0; } }
      else if (b.estado === 'sube') { const s = Math.min(1, b.t / 0.25); b.angulo = ABAJO * (1 - suave(s)); if (s >= 1) { b.estado = 'arriba'; b.t = 0; b.restante = b.arriba; } }
      else if (b.estado === 'arriba') { b.restante -= dt; if (b.restante <= 0) { b.estado = 'baja'; b.t = 0; b.desde = b.angulo; if (this.alEscapar) this.alEscapar(b); } }
      else if (b.estado === 'baja') { const s = Math.min(1, b.t / 0.35); b.angulo = b.desde + (ABAJO - b.desde) * suave(s); if (s >= 1) this.fin(b); }
      else if (b.estado === 'cae') {   // de golpe, con un rebote al final
        const s = Math.min(1, b.t / 0.22); b.angulo = b.desde + (ABAJO - b.desde) * s * s;
        if (s >= 1) { b.angulo = ABAJO + Math.sin(Math.min(1, (b.t - 0.22) / 0.15) * Math.PI) * 0.12; if (b.t > 0.37) this.fin(b); }
      } else if (b.estado === 'pausa') { b.espera -= dt; if (b.espera <= 0) { this.borrarMarcas(b); b.estado = 'sube'; b.t = 0; } }
      b.bisagra.rotation.x = b.angulo;
      if (b.movil > 0 && b.estado !== 'abajo' && b.estado !== 'pausa') { b.fase += dt * b.velocidad / b.movil; b.grupo.position.x = b.x + Math.sin(b.fase) * b.movil; }
    }
  }
  fin(b) {   // quedó acostada: en el modo libre vuelve a subir; si no, espera que la levanten de nuevo
    b.angulo = ABAJO;
    if (b.repetir) { b.estado = 'pausa'; b.espera = 2; return; }
    b.estado = 'abajo';
  }
}
