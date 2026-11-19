/* ===== Las caras de quienes abren pedidos (js/pedidos.js) =====
 * Una ilustración vectorial (SVG de 64×64, dibujada acá, sin archivos) por persona, dentro de un círculo con su color:
 *   - Tío Lea: un adulto de 40 años, de pelo corto oscuro y barba.
 *   - Francisco: un nene de 12 años, de pelo castaño y ojos azules.
 *   - Claude: la estrella terracota (no tiene cara).
 * CARA.svg(persona) devuelve el texto del SVG (siempre el mismo, fijo: nada de lo que escribe la gente entra acá).
 */
const CARA = (() => {
  // Sin clipPath (los ids repetidos fallan si el primer SVG está oculto): el círculo lo recorta el contenedor (.cara, border-radius y overflow)
  const marco = (fondo, dentro) => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect width="64" height="64" fill="${fondo}"/>${dentro}</svg>`;

  // Tío Lea: pelo corto y oscuro, barba entera, cejas gruesas, sonrisa
  const lea = marco('#4fd1e8', `
    <path d="M6 64c1-10 9-14 17-16l9 3 9-3c8 2 16 6 17 16z" fill="#3b4a66"/>
    <path d="M26 48h12v6c-2 3-10 3-12 0z" fill="#c98f68"/>
    <ellipse cx="18.5" cy="31" rx="2.6" ry="4" fill="#d8a07a"/><ellipse cx="45.5" cy="31" rx="2.6" ry="4" fill="#d8a07a"/>
    <ellipse cx="32" cy="29" rx="13.5" ry="16" fill="#e2b28c"/>
    <path d="M17.5 24c-1-9 5-15 14.500-15s15.500 6 14.500 15c-2-4-3.500-6.500-6-7.500-5 2-14 2-17 0-2.500 1.500-4.500 4-6 7.500z" fill="#3a2a21"/>
    <path d="M18 31c0 9 5 17 14 17s14-8 14-17c-1.500 4-3 6.500-5.500 8-3 1.500-6 1-8.500 1s-5.500.5-8.500-1c-2.500-1.500-4-4-5.500-8z" fill="#3a2a21"/>
    <path d="M25 38.500c2-1.500 4.500-1.500 7-.5 2.500-1 5-1 7 .5-2 2.500-4.500 2.500-7 1.500-2.500 1-5 1-7-1.500z" fill="#3a2a21"/>
    <path d="M28 41.500c2.500 2.200 5.500 2.200 8 0" fill="none" stroke="#f3d3bd" stroke-width="1.800" stroke-linecap="round"/>
    <path d="M22.500 26.500c2-1.800 5-1.800 7 0M34.500 26.500c2-1.800 5-1.800 7 0" fill="none" stroke="#2b1e17" stroke-width="2.200" stroke-linecap="round"/>
    <ellipse cx="26" cy="29.500" rx="1.700" ry="1.900" fill="#2b1e17"/><ellipse cx="38" cy="29.500" rx="1.700" ry="1.900" fill="#2b1e17"/>
    <path d="M32 30v5.500c-1 .8-2 .8-2.500.3" fill="none" stroke="#c28660" stroke-width="1.200" stroke-linecap="round"/>`);

  // Francisco: nene de 12, cara redonda, pelo castaño con flequillo, ojos azules grandes, pecas y sonrisa
  const francisco = marco('#b6e35a', `
    <path d="M8 64c1-9 8-13 16-15l8 3 8-3c8 2 15 6 16 15z" fill="#e8a93a"/>
    <path d="M27 49h10v5c-2 2.500-8 2.500-10 0z" fill="#e6b08a"/>
    <ellipse cx="19" cy="32.500" rx="2.800" ry="3.600" fill="#f0bf9a"/><ellipse cx="45" cy="32.500" rx="2.800" ry="3.600" fill="#f0bf9a"/>
    <ellipse cx="32" cy="31" rx="14" ry="15.500" fill="#f6cba6"/>
    <path d="M16.500 30c-2.500-10 3.500-19 15.500-19s18 9 15.500 19c-1-4-2.500-7.500-5-9.500-3 2-6.500 2.500-10.500 1.500-3.500 1.500-7 1.800-9.500 0-1.500 1.500-3.500 4.500-6 8z" fill="#8b5a33"/>
    <path d="M17 22c2-6 7-10 15-10 3 0 6 .8 8.500 2.500-5-.5-10 1-15 4.500-3 2-6 3.500-8.500 3z" fill="#a06a3d"/>
    <path d="M22.500 26.500c1.500-1 3.500-1 5 0M36.500 26.500c1.500-1 3.500-1 5 0" fill="none" stroke="#7a4e2c" stroke-width="1.500" stroke-linecap="round"/>
    <ellipse cx="25.500" cy="31" rx="3.300" ry="3.600" fill="#fff"/><ellipse cx="38.500" cy="31" rx="3.300" ry="3.600" fill="#fff"/>
    <circle cx="25.800" cy="31.400" r="2.300" fill="#2f78d6"/><circle cx="38.200" cy="31.400" r="2.300" fill="#2f78d6"/>
    <circle cx="25.800" cy="31.400" r="1.100" fill="#10233f"/><circle cx="38.200" cy="31.400" r="1.100" fill="#10233f"/>
    <circle cx="26.600" cy="30.400" r=".8" fill="#fff"/><circle cx="39" cy="30.400" r=".8" fill="#fff"/>
    <path d="M32 33.500c-.8 1.800-.6 2.800.8 2.800" fill="none" stroke="#d99a72" stroke-width="1.100" stroke-linecap="round"/>
    <circle cx="22" cy="37" r="2.600" fill="#f09a8a" opacity=".45"/><circle cx="42" cy="37" r="2.600" fill="#f09a8a" opacity=".45"/>
    <g fill="#c98a64"><circle cx="28.500" cy="35.500" r=".5"/><circle cx="30" cy="36.700" r=".5"/><circle cx="35.500" cy="35.500" r=".5"/><circle cx="34" cy="36.700" r=".5"/></g>
    <path d="M27.500 40.500c2.800 3.500 6.200 3.500 9 0z" fill="#fff" stroke="#b96c55" stroke-width="1.200" stroke-linejoin="round"/>`);

  // Claude: la estrella de rayos redondeados, color terracota (ocho rayos: los de los ejes, más largos)
  const claude = marco('#d97757', `
    <g stroke="#fbeee4" stroke-linecap="round" stroke-width="5.600">
      <path d="M32 9v46M9 32h46"/><path d="M15.700 15.700l32.600 32.600M48.300 15.700L15.700 48.300" stroke-width="4.800"/>
    </g>
    <circle cx="32" cy="32" r="5.500" fill="#fbeee4"/>`);

  return { svg: persona => ({ 'tio-lea': lea, 'francisco': francisco, 'claude': claude })[persona] || '' };
})();
