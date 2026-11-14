# Créditos de sonido

Los mecanismos de las armas (cargadores, correderas, cerrojos, bombeo, cartuchos, balas), las voces
de los zombies, los pasos, los impactos y los quejidos del protagonista son **grabaciones reales**
recortadas en eventos sueltos. Los disparos, explosiones, el viento, la sirena y el latido son
sintetizados en `js/audio.js`.

Cada archivo de esta carpeta es un recorte procesado (mono, 44,1 kHz, paso alto a 70 Hz, fundidos
y normalizado). `js/sonidos-datos.js` los lleva embebidos en base64 para que el juego funcione
abriendo `index.html` directo, sin servidor.

| Archivos | Fuente original | Autor | Licencia |
|---|---|---|---|
| `pistola_*`, `gatillo_en_seco`, `cerrojo_abrir`, `cerrojo_cerrar`, `rifle_*`, `escopeta_*`, `cerrojo_22`, `revolver_balas`, `balas_sueltas`, `casquillo_*`, `cartucho_cae` | [Handling Guns](https://opengameart.org/node/11033): Colt M1911A1, escopeta Browning semiautomática calibre 12, Marlin .22 de cerrojo y Remington 700 calibre .30-06, grabados en seco | Gary (para el proyecto PARPG) | [CC-BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| `bombeo_cartucho`, `bombeo_rack` | [Shotgun Reload Sound Effects](https://opengameart.org/content/shotgun-reload-sound-effects) | zer0_sol | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `cargador_al_piso` | [Handgun Reload Sound Effect](https://opengameart.org/content/handgun-reload-sound-effect) | zer0_sol | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |

Sonidos de ambiente, en `sonidos/ambiente/` (embebidos en `js/sonidos-ambiente.js`, a 22 kHz):

| Archivos | Fuente original | Autor | Licencia |
|---|---|---|---|
| `zombie_gemido_1` a `_4` | [Zombie moans](https://opengameart.org/content/zombie-moans) | Darsycho | CC0 |
| `zombie_gemido_5` a `_8`, `zombie_ataque_*`, `zombie_muerte_*` | [Zombies Sound Pack](https://opengameart.org/content/zombies-sound-pack) | artisticdude | CC0 |
| `impacto_carne_*` | [Squish Sounds Effects](https://opengameart.org/node/183322) | EZduzziteh | CC0 |
| `cuerpo_cae_*` | [2 wooden squish splatter sequences](https://opengameart.org/node/2549) | Independent.nu | CC0 |
| `paso_arena_*`, `paso_asfalto_*` | [Fantozzi's Footsteps (Grass/Sand & Stone)](https://opengameart.org/content/fantozzis-footsteps-grasssand-stone) | Fantozzi | CC0 |
| `quejido_*` | [DAMAGE SOUNDS (Male) - Audio Pack](https://opengameart.org/node/163052) | VoiceBosch | [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `grito_muerte` | [Man hurt sounds](https://opengameart.org/node/20720) | Aharabada | CC0 |

**Qué implican CC-BY-SA 3.0 y 4.0** (Gary y VoiceBosch): hay que dar crédito al autor (este archivo y el
README lo hacen) y los recortes derivados de esas grabaciones quedan bajo la misma licencia. El resto
del juego (código, gráficos) no queda alcanzado.
