/* ===== Jerarquía de armas al recoger una caja (pedido de Leandro, 22/11) =====
 * En la pelea infinita, una caja con un arma de menor nivel que la que llevás en la mano no te la cambia: el arma se guarda
 * igual en el inventario (y se carga la munición), pero la mano sigue con la de más valor. Una de igual o mayor nivel
 * sí pasa a la mano, como siempre. Los niveles son los de las categorías de arma, de menor a mayor; el orden de fábrica es el
 * que pidió Leandro: cuerpo a cuerpo, pistolas, metralletas, [rifles: no los nombró, quedan acá], especiales, especiales
 * cuerpo a cuerpo (las legendarias) y, arriba de todo, las escopetas. Se puede reordenar y apagar en la configuración.
 */
const Jerarquia = (() => {
  const CLAVES = ['cuerpo', 'pistola', 'metralleta', 'rifle', 'especial', 'legendaria', 'escopeta'];   // de menor a mayor
  const clave = id => {
    const a = ARMAS[id];
    if (!a) return 'especial';
    return CLAVES.includes(a.categoria) ? a.categoria : 'especial';   // lanzagranadas, bazuca, lanzallamas, láser, granadas, ametralladora…
  };
  // El orden guardado (si es una permutación válida de las siete) o el de fábrica
  const orden = () => {
    const g = Config.get('jerarquiaOrden');
    return Array.isArray(g) && g.length === CLAVES.length && CLAVES.every(c => g.includes(c)) ? g : CLAVES;
  };
  const rango = id => orden().indexOf(clave(id));
  // ¿La caja con `nuevoId` pasa a la mano, estando `actualId` en ella?
  const reemplaza = (nuevoId, actualId) => !Config.get('jerarquia') || rango(nuevoId) >= rango(actualId);

  // La lista de la configuración: la más valiosa arriba, con ▲ ▼ para subir o bajar cada nivel
  function dibujarLista(el) {
    const o = orden().slice().reverse();
    el.innerHTML = o.map((c, i) => `<div class="fila-jerarquia"><span class="puesto">${i + 1}</span><span class="nombre">${t('jerarquia.' + c)}</span>` +
      `<button type="button" class="boton mini" data-jerarquia-sube="${c}" aria-label="${t('jerarquia.subir', { n: t('jerarquia.' + c) })}"${i === 0 ? ' disabled' : ''}>▲</button>` +
      `<button type="button" class="boton mini" data-jerarquia-baja="${c}" aria-label="${t('jerarquia.bajar', { n: t('jerarquia.' + c) })}"${i === o.length - 1 ? ' disabled' : ''}>▼</button></div>`).join('');
  }
  function mover(c, delta) {   // delta +1: sube un puesto (más valiosa)
    const o = orden().slice(), i = o.indexOf(c), j = i + delta;
    if (i < 0 || j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    Config.set('jerarquiaOrden', o);
  }
  document.addEventListener('click', e => {
    const lista = document.getElementById('lista-jerarquia');
    const sube = e.target.closest('[data-jerarquia-sube]'), baja = e.target.closest('[data-jerarquia-baja]'), orig = e.target.closest('[data-accion="jerarquia-original"]');
    if (sube) mover(sube.dataset.jerarquiaSube, +1);
    else if (baja) mover(baja.dataset.jerarquiaBaja, -1);
    else if (orig) Config.set('jerarquiaOrden', null);
    else return;
    if (lista) dibujarLista(lista);
  });
  Idioma.alCambiar(() => { const l = document.getElementById('lista-jerarquia'); if (l && l.childElementCount) dibujarLista(l); });
  return { clave, orden, rango, reemplaza, dibujarLista, CLAVES };
})();

Object.assign(TEXTOS.es, {
  'config.jerarquia': 'JERARQUÍA DE ARMAS', 'config.jerarquiaUsar': 'Una caja con un arma de menor nivel no reemplaza a la que llevas en la mano',
  'config.jerarquiaNota': 'Pelea infinita. El arma igual queda en tu inventario; sólo cambia la que llevas en la mano. La más valiosa va arriba.',
  'config.jerarquiaOriginal': 'Orden original', 'aviso.guardada': 'GUARDADA EN EL INVENTARIO: ',
  'jerarquia.cuerpo': 'Cuerpo a cuerpo', 'jerarquia.pistola': 'Pistolas', 'jerarquia.metralleta': 'Metralletas', 'jerarquia.rifle': 'Rifles', 'jerarquia.especial': 'Especiales',
  'jerarquia.legendaria': 'Especiales cuerpo a cuerpo', 'jerarquia.escopeta': 'Escopetas', 'jerarquia.subir': v => `Subir ${v.n}`, 'jerarquia.bajar': v => `Bajar ${v.n}`,
});
Object.assign(TEXTOS.pt, {
  'config.jerarquia': 'HIERARQUIA DE ARMAS', 'config.jerarquiaUsar': 'Uma caixa com arma de nível menor não substitui a que você leva na mão',
  'config.jerarquiaNota': 'Luta infinita. A arma fica no inventário do mesmo jeito; só muda a que está na mão. A mais valiosa vai em cima.',
  'config.jerarquiaOriginal': 'Ordem original', 'aviso.guardada': 'GUARDADA NO INVENTÁRIO: ',
  'jerarquia.cuerpo': 'Corpo a corpo', 'jerarquia.pistola': 'Pistolas', 'jerarquia.metralleta': 'Submetralhadoras', 'jerarquia.rifle': 'Rifles', 'jerarquia.especial': 'Especiais',
  'jerarquia.legendaria': 'Especiais corpo a corpo', 'jerarquia.escopeta': 'Espingardas', 'jerarquia.subir': v => `Subir ${v.n}`, 'jerarquia.bajar': v => `Descer ${v.n}`,
});
Object.assign(TEXTOS.en, {
  'config.jerarquia': 'WEAPON RANKING', 'config.jerarquiaUsar': 'A crate with a lower-ranked weapon does not replace the one in your hand',
  'config.jerarquiaNota': 'Endless fight. The weapon still goes into your inventory; only the one in your hand stays. The most valuable goes on top.',
  'config.jerarquiaOriginal': 'Original order', 'aviso.guardada': 'STORED IN INVENTORY: ',
  'jerarquia.cuerpo': 'Melee', 'jerarquia.pistola': 'Pistols', 'jerarquia.metralleta': 'Submachine guns', 'jerarquia.rifle': 'Rifles', 'jerarquia.especial': 'Special weapons',
  'jerarquia.legendaria': 'Special melee', 'jerarquia.escopeta': 'Shotguns', 'jerarquia.subir': v => `Move ${v.n} up`, 'jerarquia.bajar': v => `Move ${v.n} down`,
});
