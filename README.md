# Zona Muerta — Zombies del Apocalipsis

Juego de plataformas y disparos en 2D hecho con HTML5 canvas y JavaScript puro. No usa
librerías ni necesita instalar nada.

## Cómo jugar

Abrí `index.html` con doble clic en cualquier navegador moderno (Chrome, Safari, Firefox).
Si preferís servirlo, desde esta carpeta:

```
python3 -m http.server 8791
```

y entrá a <http://127.0.0.1:8791/>.

## Modos y dificultad

- **Zombies**: hay 15 variantes y nunca salen dos iguales seguidas. Los **caminantes** (10): leñador y camisa
  roja (camisa a cuadros abierta, se ve la panza, short roto), oficinista (camisa abierta y corbata), obrero
  (chaleco naranja reflectivo y casco), enfermero (ambo y barbijo), policía (uniforme, placa y gorra), turista
  (camisa hawaiana y cámara), cocinero (chaqueta y gorro), granjero (overol y sombrero de paja) y gordo (más
  grande, con panza). Los **corredores** (5), más chicos y rápidos: maratonista (musculosa con dorsal y una
  zapatilla), basquetbolista (camiseta con número y vincha), encapuchado, ciclista (casco y calzas) y
  adolescente (el más chico, gorra para atrás). Cada uno varía además el tono de la piel y de la ropa. El
  **tóxico** (cloaca) lleva el traje amarillo.
- **Personaje**: arriba a la derecha del menú principal se elige la skin, con vista previa animada:
  Sobreviviente (el de siempre), Dios del trueno, Armadura de combate, Cazador enmascarado, Centinela, Bufón
  del caos, Rey de los mares, Vaquero y Ninja. Están inspirados en arquetipos conocidos pero con diseños
  propios (sin nombres, logos ni emblemas registrados). Queda guardada en el navegador.
- **Pelea infinita**: los zombies vienen en **rondas infinitas**: cada ronda trae más que la anterior y,
  cuando caen todos, hay un respiro de unos segundos (y +20 de vida) antes de la siguiente. Al entrar se
  elige el mapa:
  - **Ciudad en ruinas**: una calle con farolas, chatarra y periódicos volando, y montañas con M2 y cajas
    especiales.
  - **Cloaca**: un canal subterráneo gigante de ladrillo (bóveda, arcos de piedra, caños, desagües que
    vuelcan agua, faroles enjaulados y un canal de agua tóxica que corre). Suena a túnel (eco a 0,17 s),
    con agua corriendo y goteo. Entre los zombies de siempre aparecen **zombies tóxicos** (uno de cada cinco
    al principio, hasta la mitad en las rondas altas): trabajadores con el traje amarillo roto, pústulas que
    brillan y baba fosforescente, con 35 % más de vida. Escupen ácido de dos maneras: **en arco**, que cae
    donde estás y deja un charco que quema unos 6 s, y **en chorro** recto a la altura de la cabeza, que se
    esquiva agachándose. Además **saltan encima** del jugador desde media distancia y, a veces, cuando les
    pegan, dan una **voltereta hacia atrás**. El ácido envenena: la vida baja de a poco unos segundos y la
    barra se pone verde. En la cloaca no hay montañas, así que no hay M2 ni cajas especiales.
- **Misiones**: 17 misiones que se juegan dentro de la pelea infinita (matar zombies, conseguir
  armas, sobrevivir, y varias contrarreloj). El progreso queda guardado en el navegador.
- **Defensa zombie ultra** (`js/defensa-ultra.js`): el tirador defiende su sector, a la izquierda, y los zombies llegan
  desde la derecha por **4 carriles**; con ↑ y ↓ (o ▲ ▼ en el celular) cambia de carril. Las balas y el cuchillo sólo
  pegan en el carril propio. Arranca con una Glock y un cargador de repuesto; sin balas pasa a otra arma con munición o
  al **cuchillo**. Cada zombie muerto paga **dinero** ($10, $15 los corredores, +$2 por ola), que se gasta en la
  **tienda** (B o TIENDA, pausa la partida): armas que se habilitan cada dos olas, munición para las que tiene y hasta 4
  **torretas automáticas** (una por carril, $300 / $500 / $800 / $1200; T compra una directo) que disparan solas en su
  carril. Durante las olas, y siempre al terminar una, cae una **caja en paracaídas** con un arma o munición en otro
  carril de su columna: hay que ir a buscarla antes de que desaparezca (13 s). El ataque aéreo se recarga cada 25 s.
  **Si pasan más de 5 zombies, se pierde**; el récord de olas se guarda por dificultad.
  Detrás de la línea hay un campamento militar (carpa, bandera, antena, cajas bajo red de camuflaje, tambores y
  parapeto de bolsas de arena). Durante el ataque aéreo el tirador se tira cuerpo a tierra con las manos en la
  cabeza: no dispara ni cambia de carril hasta que termina.
- **Defensa zombie** (antes «Torreta»): fijo en una M2 Browning sobre un parapeto de bolsas de arena, en medio de la calle. Los zombies
  llegan en olas por los dos lados y cada ola es peor: más zombies, más rápidos, más corredores y, desde la
  cuarta, más resistentes (ya no caen de un tiro). Las flechas giran la ametralladora (el tirador rodea el
  trípode), `F` dispara y `S` cambia la cinta. Entre olas hay un respiro con +20 de vida. Se guarda la ola
  más alta de cada dificultad.
  Con `A` (o tocando el panel ✈ del HUD) se pide un **ataque aéreo**: pasan dos cazas, caen siete misiles y
  no queda ningún zombie a la vista; el tirador se agacha detrás de las bolsas y no recibe daño. Se recarga
  en 20 segundos y el panel muestra si está listo, recargando (con barra) o en curso.
- **Entrenamiento**: polígono de tiro bajo techo, en un galpón grande (pared de chapa, columnas de acero, campanas
  de luz, claraboyas y piso de cemento), con las 25 armas y carteles que marcan la distancia cada 5 metros. Como es
  un lugar cerrado, los disparos tienen un eco moderado de las paredes (rebote a 0,13 s) y algo más de sala. Aparecen blancos al azar y todos se mueven: suben y bajan cruzando la línea de tiro y, desde la
  segunda serie, también se deslizan sobre un riel. Hay dianas (10-8-6-4-2 según dónde pegue), siluetas
  (5 al torso, 10 a la cabeza saltando), dianas rápidas ×1,5, dianas altas ×2 (hay que saltar) y platos que
  vuelan en arco, y dianas bajas ▼ ×1,5 que solo se alcanzan agachado (`↓`). Reaccionar rápido suma puntos extra. Series de 15 blancos con resumen (puntos, blancos,
  precisión, reacción) y récord guardado; cada serie es más difícil. `C` elige arma.
- **Ficha de cada arma**: en el campo de pruebas y en el entrenamiento, `C` abre el menú de armas; al tocar una
  se abre su ficha con la imagen grande, una descripción real (origen, año y munición) y los datos de juego:
  daño por impacto, tiros o golpes para matar un zombie en cada dificultad y uno tóxico, cargador, cadencia,
  funcionamiento, tipo y tiempo de recarga, alcance, perdigones, radio de explosión, retroceso y, en las
  legendarias, su poder. **USAR** (o `Enter`) se la da al personaje; **VOLVER** (o `Esc`) regresa a la lista.
- **Campo de pruebas**: una planicie de tierra sin zombies ni rondas, con las 24 armas en el
  inventario, para probar armas y recargas. `1`-`5` eligen el grupo de armas. `C` abre un menú
  donde se elige cualquier arma para tenerla directo en la mano (granadas y especiales incluidas), se pone o quita
  una M2 Browning y plantar un zombie maniquí que no se mueve ni muerde. Con el menú abierto, `X`
  borra todo lo generado.
- **Dificultad** (se elige en el menú y queda guardada):

| | Fácil | Medio | Difícil |
|---|---|---|---|
| Zombies en la ronda 1 | 5 | 8 | 12 |
| Más por ronda | +2 | +3 | +4 |
| Vida del zombie | 9 | 15 | 15 |
| Tiros con pistola / metralleta / rifle | 2 / 3 / 1 | 3 / 5 / 1 | 3 / 5 / 1 |
| Velocidad | ×0,75 | ×1 | ×1,3 |
| Mordida | 8 | 10 | 15 |

## Campo de pruebas: vitrina de armas

El personaje queda quieto y la cámara se acerca (3,3× con pistolas, 2,9× con metralletas y cuerpo a cuerpo, 2,6×
con el resto) para ver de cerca el arma, el fogonazo, los casquillos y la recarga. ← y → cambian de arma (lista para
tirar, sin heredar la espera de la anterior), `F` o clic dispara, `S` o clic derecho recarga y `L` pone cámara lenta
(un cuarto de la velocidad; el sonido sigue normal). La ficha del arma en la mano: su dibujo entero de perfil con el largo, grupo, origen, año,
munición, descripción, daño, tiros para matar, cargador, cadencia, funcionamiento, recarga, alcance y retroceso, con
la munición en vivo; va arriba a la izquierda, el personaje un poco a la izquierda del centro y el maniquí a 150 px, dentro del cuadro. `C` sigue abriendo la lista de todas las armas.

## Último bastión (defensa con estrategia)

Modo aparte de las defensas (`js/estrategia.js`): no se dispara, se manda. Vista de estratega sobre un campo con
grilla; a la izquierda el campamento (cuartel, taller, empalizada), y los zombies llegan por la derecha buscando el
camino más corto (un mapa de distancias por celda que se rehace cada vez que algo se construye o se rompe).

| Qué | Cuesta | Tarda | Dónde se hace | Qué hace |
|---|---|---|---|---|
| Soldado | $50 | 4 s | Cuartel, de a uno | Camina a su lugar y dispara (alcance medio). Si su lugar es un búnker, entra (hasta 4) |
| Torreta | $125 | 8 s | En el lugar, con andamio | Ametralladora con su tirador detrás de bolsas de arena: mucho fuego, poco daño |
| Búnker | $150 | 12 s | En el lugar | Mucha vida; disparan los soldados que tenga adentro, con más alcance. Si cae, salen |
| Tanque | $300 | 15 s | Taller, de a uno | Maneja hasta su lugar; dispara muy lejos con daño en área, pero no a los que tiene pegados |
| Muro | $15 | 2 s | En el lugar | Obliga a rodear: en los huecos angostos los zombies se amontonan y van más lento. No se puede cerrar el paso del todo |

Torretas, búnkeres, tanques y muros ocupan su celda; los soldados no. Los zombies muerden lo que tienen adelante y,
si se trancan, rompen lo que los traba. Cada muerto paga (caminante $10, corredor $12, gordo $25, el coloso de cada
5 oleadas $150) y cada oleada superada da un premio. Entre oleadas hay 25 s para construir (la primera, 40); se
puede adelantar con Espacio o el botón, y cobra $2 por segundo ahorrado. El que llega al campamento le saca vida
(1, 3 el gordo, 8 el coloso); con 20 entradas se pierde. Teclas: `1` a `5` eligen, `6` vende, clic derecho vende
a mitad de precio (o cancela entero lo que no estaba listo), `Esc` suelta lo elegido.

## Historia: «Camino a casa»

Modo por niveles, de izquierda a derecha como los juegos de plataformas de antes (`js/historia.js`,
`js/escenario-historia.js`). El avión del protagonista cae en la cordillera, cerca de Bariloche, cuando aparecen los zombies, y tiene que
volver con su hija a su casa en Padua (Merlo), a 1600 km. La historia se cuenta con viñetas de 8 bits (lienzo de 320×180 agrandado sin
suavizar, con líneas de barrido) y música de consola de los 80 hecha en vivo (temas «Camino a casa», «Cien
kilómetros» y «Estás en casa» en `js/musica.js`).

| Nivel | Lugar | Km |
|---|---|---|
| 1 | Bariloche: la montaña donde cayó el avión, al amanecer (cordillera nevada, el lago, cipreses, nieve), con escombros, cráteres, contenedores de carga, fuselajes para caminar por arriba, escalerillas, el ala como rampa, turbinas y valijas tiradas; zombies dormidos que se despiertan al ver al jugador | 1600 → 1550 |
| 2 | La Pampa: la ruta destruida, con baches gigantes (dos se cruzan con una soga colgada de un pórtico de carteles), autos atravesados y un colectivo para saltar, un camión al que se sube por escalera, partes de autos tiradas, un auto en llamas y una horda de 5 al final | 1550 → 60 |
| 3 | Zona sur (conurbano de Buenos Aires) al atardecer con humo: negocios saqueados de fondo, semáforos caídos, carteles de calle (Av. Calchaquí, Quilmes, Lomas de Zamora), basura y escombros, andamios y escalera hasta los techos, socavones con sogas colgadas de los cables, contenedores, fuego, bocinas y alarmas de autos, y una horda de 7 | 60 → 15 |
| 4 | Padua, Merlo, de noche: casas en penumbras; solo se ve alrededor del personaje, del fuego, de los faroles que quedan y de la ventana de la hija. Cercas, techos con escaleras, zanjas inundadas de soga en soga y una horda de 10 antes de la puerta de casa | 15 → 0 |

La dificultad sube con cada nivel: más zombies dormidos (14, 12, 15 y 17), zombies sueltos más seguidos, más
corredores (0 %, 15 %, 25 % y 35 %) y hordas más grandes al final. Mecánicas de plataformas:
- **Escaleras de mano**: al pie, ↑ (o saltar) trepa sola hasta arriba; arriba, ↓ baja.
- **Sogas**: se balancean solas; te agarras si cualquier parte del cuerpo toca los tres cuartos de abajo de la
  soga (quedas colgado de la punta), y saltando otra vez te sueltas con el impulso del balanceo (hay que soltarse
  cuando va hacia adelante). En el nivel 4, los dos huecos de dos sogas tienen un apoyo en el medio: un andamio
  entre los techos y un montón de escombros en la zanja.
- **Precipicios** (río, canal, hueco entre edificios): caer quita 25 de vida y te devuelve al último lugar firme.
- **Fuego en el piso**: quema mientras lo pisas. Los zombies no se tiran a los precipicios: esperan en el borde.

**Zombies del lugar y jefes** (`js/zombies-autoctonos.js`). En cada nivel, uno de cada dos zombies es del lugar
(van por pares: uno común y uno del lugar, en orden al azar), con su propio dibujo y su vida y velocidad:

| Nivel | Del lugar | Jefe (antes de la meta) |
|---|---|---|
| 1 | Guanacos, ciervos colorados y esquiadores (campera, gorro con pompón, antiparras) | El San Bernardo del Centro Cívico, con su barril: embiste |
| 2 | Vacas (lentas y con mucha vida), ñandúes (rápidos) y paisanos de boina, faja con rastra y pañuelo | El toro de la pampa: escarba y embiste |
| 3 | Perros callejeros, hinchas con la camiseta a rayas (celeste, verde o granate) y colectiveros | El hincha del bombo: golpea el bombo y la onda corre por el piso |
| 4 | Gatos, perros, abuelas en batón con ruleros y el vecino del asado (musculosa y delantal) | El coloso verde, un zombie gigante y musculoso: salta y cae con una onda expansiva |

Los animales están hechos para dar miedo: pelaje podrido con calvas, lomo erizado, la herida con las costillas,
el hueso a la vista en una pata, garras, hocico arrugado que muestra encías y colmillos, baba de sangre y ojos
rojos con pupila rasgada bajo el ceño. Se lanzan un 50 % más rápido cuando el jugador está a menos de 260 px,
muerden cada 0,6 s (los demás, cada 0,9) empujando con el cuerpo, y gruñen (`Audio_.gruñido`, más grave cuanto
más grande el animal) en vez de gemir; al morder, ladran o braman.
Al morir, el golpe los despide hacia donde los empujó (con una explosión, el doble; vacas, ciervos, guanacos y
jefes pesan más y vuelan menos), dan una vuelta en el aire con un chillido, caen panza arriba, rebotan (con
polvo, sangre y temblor de cámara según el tamaño), patalean con espasmos 2 s echando chorros de sangre, sacan
la lengua, se les apagan los ojos y se desvanecen en su charco a los 5 s.

El jefe aparece a 700 px de la meta, entre el jugador y la casa, con su barra de vida abajo; mientras viva la meta
queda cerrada. Tiene de 22 a 55 veces la vida de un zombie común (22, 30, 40 y 55) y ningún golpe le saca más
del 8 % (una explosión o un ataque aéreo no lo matan de una). Las embestidas y las ondas se esquivan saltando.
Mientras está el jefe, salen la mitad de zombies sueltos.

- En el camino hay **corazones** (+30 de vida) y **radios**: cada radio es un ataque aéreo para pedir con la A
  (el personaje se tira cuerpo a tierra mientras caen los misiles).
- Las armas y la munición pasan de un nivel al siguiente; las cajas de cada nivel suman armas nuevas. Siempre
  lleva el cuchillo, y cada nivel empieza con 3 granadas más que se suman a las que traía.
- Al terminar cada nivel aparece un resumen (zombies, tiempo, vida, corazones, radios y armas encontradas) y el
  mapa del camino; al terminar el cuarto, el reencuentro con la hija y el fin.
- Si muere, reintenta el nivel con lo que tenía al empezarlo. El progreso queda guardado en el navegador
  (`zonaMuerta.historia.nivel`) y desde el menú se puede continuar o empezar de nuevo.
- Desniveles: `Mundo.perfil` da la altura del piso por tramos; un escalón de más de 14 px no se sube caminando
  (`ESCALON_MAX` en `js/jugador.js`), hay que saltarlo (el salto llega a unos 120 px). Trepando una escalera o
  colgado de una soga, el personaje guarda el arma en la espalda y usa las dos manos.
- Los zombies también respetan los desniveles: trepan de a poco los escalones de hasta 75 px, caen con gravedad
  al bajar, esperan al pie de las paredes más altas y en el borde de los precipicios.

## Música, configuración e idioma

- **Música**: cada escenario tiene su tema, original y tocado en vivo con WebAudio (no hay archivos de
  música). La **ciudad** (pelea infinita, misiones y defensa zombie) es música de vaqueros en la menor (Am–G–F–E):
  guitarra criolla rasgueada, guitarra grave con trémolo, silbido, armónica, birimbao y campana del pueblo
  en la calma; con acción entran el galope (rasgueo apagado y cascos de caballo), tambor, latigazo y dos
  trompetas en terceras, y con la horda encima, un coro de hombres. La **cloaca**
  es ambiente industrial en do menor: zumbido grave que late, gotas con eco, golpes metálicos en los caños,
  ostinato de sintetizador y percusión de fábrica. Las capas entran según cuántos zombies hay vivos: en el
  descanso entre rondas queda tranquila, con la horda encima suena todo. El galpón y el campo de pruebas
  no tienen música. Se pausa con el juego y se apaga al morir.
- **Configuración**: el **engranaje** de arriba a la izquierda (en todas las pantallas; en partida pausa el
  juego) abre un panel con volumen general, efectos y música, silenciar todo y un botón para probar el
  sonido; idioma; dificultad; calidad gráfica (alta: hasta 2× de resolución; normal: 1×, para celulares
  lentos); botones en pantalla (automático, siempre o nunca); vibración al tocar y pantalla completa.
  Todo queda guardado en el navegador. `Esc` lo cierra.
- **Idiomas**: español, portugués (Brasil) e inglés. Al principio se elige según el idioma del navegador.
  Se traducen menús, HUD, avisos, misiones, dificultades, controles y los carteles del escenario.

## Asistente de construcción y ramas de jugador (temporal)

Mientras se arma el juego, el panel de configuración (rueda arriba a la izquierda) tiene **Abrir asistente**: un chat
con Claude adentro del juego. Sólo anda con el juego abierto en claude.ai y la sesión iniciada; la primera vez pide
permiso, y cada mensaje gasta el uso de Claude de quien juega (usa Claude Sonnet 5.5, o el modelo estándar si a esa persona no le está disponible; un cambio de código tarda
alrededor de un minuto).

- **Ajustes de valores**: daño, cargador, cadencia, recarga, alcance y retroceso de cada arma; velocidad, salto y vida
  del jugador; vida, velocidad, daño y cantidad de zombies; frecuencia de cajas. Quedan en el navegador de quien juega;
  el dueño ve además **Fijar para todos** (documento `ajustes/compartidos` de la base del artefacto).
- **Rama del jugador** (`js/rama.js`): para lo que necesita código, el asistente lee el código del juego y escribe un
  **parche** de JavaScript que se aplica en vivo. Los parches viven en el navegador de cada jugador («Mi rama»: apagar,
  borrar, recargar) y se aplican en cada carga, después de los datos, modelos y clases y antes de la interfaz. Un parche
  que falla al aplicarse no se guarda; uno que tira un error al jugar se apaga solo y el juego se recarga; si la carga
  anterior se colgó, se apaga el último parche.
- **Enviar a revisión**: la rama va a la colección `ramas` de la base del artefacto (dueño y miembros de la
  organización). Quien no puede escribir ahí la descarga como archivo `.json` (o la copia) para mandarla.
- **Fusionar en main** (desde Claude Code, cuando el dueño lo pide): leer `ramas` con ArtifactData, crear una rama de
  git `rama/<id>`, pasar cada parche aprobado al código real (prolijo, en el archivo que corresponde), probar, fusionar
  en `main`, agregar los ids de los parches a `PARCHES_FUSIONADOS` (`js/rama.js`) para que se borren solos de las ramas
  de los jugadores, marcar la rama como fusionada en la base y publicar.
- **Al publicar**: generar `js/codigo-fuente.js` con `python3 herramientas/empaquetar-codigo.py . js/codigo-fuente.js`
  y subirlo junto al resto (es el plan B del asistente para leer el código; no se versiona).
- Para retirar todo: ver el comentario de arriba de `js/asistente.js` y `js/rama.js`.

## Servidor de construcción (para que cualquiera pueda cambiar el juego)

`servidor/servidor.mjs` (Node 24 + SDK oficial de Anthropic; `cd servidor && npm install` la primera vez):

- **Sirve el juego desde la rama `main` de git**, no desde la carpeta de trabajo: lo que se está editando sin
  commitear no le llega a nadie.
- **Cada cambio de un jugador es un commit** en la rama `rama/<código del jugador>`, en `ramas/<código>/`
  (`rama.json` con todo, y cada parche como `.js`). Lo escribe con un índice temporal de git: no toca la carpeta de
  trabajo ni la rama abierta. El jugador ve su código de rama en «Mi rama» y puede seguir en otro dispositivo.
- **Asistente**: la clave de la API va en `servidor/.env` (copia de `servidor/.env.ejemplo`; no se versiona). Modelo
  Claude Sonnet 5.5 con esfuerzo medio, respaldo automático si el modelo declina, caché del pedido fijo. Topes: 30
  pedidos por persona y por día, 300 llamadas por persona y 2000 en total por día (se cambian en `.env`).
- Arranque: `node servidor/servidor.mjs` (puerto 8790, sólo en la Mac) y un túnel de Cloudflare hacia ese puerto
  para tener la dirección pública.
- Para ver las ramas: `git branch --list 'rama/*'`; para leer una: `git log main..rama/<código>`.

## Controles

En celulares y tablets aparecen botones en pantalla: flechas a la izquierda, fuego (se puede mantener), salto y
recarga a la derecha, y abajo cambio de arma, M2, cajas (en el campo de pruebas) y pausa. Se detectan solos.

| Tecla | Acción |
|---|---|
| `→` / `←` | Avanzar / retroceder |
| `↑` | Saltar |
| `↓` (mantener) | Agacharse con rodilla en tierra: el arma baja 13 unidades (blancos bajos) y se esquiva el chorro de ácido. Junto a una M2, la monta o la suelta |
| `F` o clic izquierdo | Disparar (mantener presionado con las metralletas) |
| `S` o clic derecho | Recargar (las escopetas cargan cartucho por cartucho; disparar interrumpe la carga). El clic derecho no abre el menú del navegador |
| `1` … `5` | Grupo de armas: 1 pistolas, 2 metralletas, 3 rifles, 4 escopetas, 5 especiales (otra vez: la siguiente del grupo) |
| `Q` / `E`, `G` / `H` o rueda del mouse | Arma anterior / siguiente |
| `A` | Defensa zombie: pedir un ataque aéreo (cada 20 s) |
| `C` | Campo de pruebas: menú de cajas y ametralladoras (`X` borra todo lo generado) |
| `P` / `Esc` | Pausa |

## Armas y tiros para matar un zombie

Tiros en dificultad media:

| Tipo | Armas | Tiros |
|---|---|---|
| Pistolas | Glock 17, Magnum .44, Colt 1911, Desert Eagle, Colt Python, Beretta 92FS, Walther PPK, Mauser C96 | 3 |
| Metralletas | Uzi, AK-47, M16, MP5, Thompson M1928 (tambor de 50), Kriss Vector, P90 | 5 |
| Rifles | Remington 700, Barrett M82, Mosin-Nagant, M1 Garand, Dragunov SVD, Winchester 1894 | 1 |
| Escopetas | Recortada doble caño, Mossberg 500, SPAS-12, AA-12, Saiga-12, Benelli M4, Remington 870, Winchester 1887 | 1 |
| Ametralladora fija | M2 Browning .50, clavada en las montañas, no se puede llevar | 1 |
| Especiales (solo en montañas) | Lanzagranadas M79, Milkor MGL (6 granadas), Bazuca M9, RPG-7, Granadas M67, Láser alienígena | 1 |
| Cuerpo a cuerpo (tecla 6) | Machete y Bate con clavos (2 golpes), Katana (2, rápida), Hacha de bombero y Mazo (1, lentos; el mazo empuja lejos) | 1–2 |
| Legendarias (tecla 7, solo en montañas) | Mjölnir (llama rayos sobre 4 zombies), Excalibur (onda de luz que atraviesa), Tridente de Poseidón (ola que barre), Égida (escudo que se lanza y vuelve), Gungnir (lanza que se lanza y vuelve) | 1 |

Las armas cuerpo a cuerpo y las legendarias no usan munición ni se recargan: `F` da el golpe (alza el arma,
la baja de golpe y vuelve a la guardia) y pega a los dos o tres zombies más cercanos adelante. Las de dos
manos se toman con las dos en el mango; el machete, la Égida y Gungnir, con una. Las legendarias son de la
mitología (nórdica, artúrica y griega); 3 de cada 10 cajas de montaña traen una.

### Diseño

Cada arma está dibujada de perfil con sus medidas reales en centímetros (Glock 20 cm, AK-47 88 cm, M16 99 cm,
Barrett 145 cm…) y sus rasgos de verdad: estrías de las correderas, cachas de madera cuadriculadas, tambores
estriados y varillas extractoras en los revólveres, cajones fresados, rieles, guardamanos ventilados,
apagallamas, miras telescópicas con torretas y lentes, tornillos y juntas. La P90 y el M1 Garand se midieron
además sobre fotos de perfil.

El AK-47 y la MP5 están calcados de fotos de perfil: la foto se endereza, se escala a su largo real con una grilla
en centímetros, el modelo se dibuja encima y se superpone para comprobar que coincida; los colores se toman de la
foto. El Remington 700 toma de una foto la forma de la culata y el nogal lustrado.

**Acabado de material** (`pintar` en `js/armas-modelos.js`): cuando el arma se ve grande (desde 3 px por cm, o sea en
la ficha) cada pieza recibe la terminación de su material, que sale del color: la madera, veta que sigue la pieza,
poros, barniz (y `lustre` para la de alto brillo); el acero oscuro, grano, reflejo azulado, bisel, filo brillante y
desgaste en los cantos de arriba; el inoxidable, cepillado a lo largo; las hojas (acero claro muy alargado), pulido
espejo; el polímero, texturado; los caños finos, reflejo cilíndrico. Más chico no se nota y se omite, así que el arma
en mano se dibuja igual y no cuesta más. La ficha mide el arma en chico y la dibuja directo al tamaño final.
`remache`, `rebaje` y `sombraContacto` (en `js/armas-modelos-3.js`) agregan detalles que el acabado no puede inventar.

### Recargas

Cada arma se recarga con su mecanismo real. Durante la recarga el arma se acerca al cuerpo y se
inclina, y el personaje baja la mirada.

| Mecanismo | Armas | Qué hace |
|---|---|---|
| Cargador de pistola | Glock, Desert Eagle, Colt 1911 | Saca el cargador, lo cambia en la cadera y lo mete. Si quedó vacía, la corredera está trabada atrás: la Glock y la Deagle la tiran, la 1911 suelta el retén. |
| Tambor | Magnum .44 | Abre el tambor, boca arriba vacía los seis casquillos, boca abajo carga bala por bala y cierra. |
| Cargador rápido | Colt Python | Abre, vacía, mete las seis juntas con el cargador rápido, lo suelta al piso y cierra. |
| Peine | Mosin-Nagant, Mauser C96 | Vacía: abre el cerrojo, apoya el peine, empuja las balas y al cerrar salta el peine. A medias: completa bala por bala. |
| Cerrojo | Remington 700 | Abre la recámara, pone bala por bala por arriba y cierra. |
| Palanca | Winchester 1894 y 1887 | Gira el arma y carga por la ventana lateral de a una. Si estaba vacía, acciona la palanca. |
| Bombeo | Mossberg 500, SPAS-12 | Da vuelta el arma y mete los cartuchos por abajo de a uno; bombea si estaba vacía. Disparar interrumpe la carga. |
| Quiebre | Recortada, M79 | Se parte, boca arriba saltan los gastados, entran los nuevos y se cierra de un golpe. |
| Cargador extraíble | Uzi, AK-47, M16, MP5, P90, Barrett, AA-12, Saiga-12, láser | El vacío cae al piso. La AK y la Saiga lo enganchan con balanceo; la M16 palmea el retén; la MP5 traba la manija al empezar y la baja de un palmazo al final; las demás tiran del cerrojo si estaban vacías. |
| Cinta | M2 Browning | Levanta la tapa, tiende la cinta nueva, cierra y tira de la manija. |

Las de acción manual (Remington, Mosin, Mossberg y las dos Winchester) accionan el cerrojo, la
bomba o la palanca después de cada tiro, y el casquillo sale recién ahí. Los revólveres y la
recortada no tiran casquillos al disparar: los sueltan cuando se abren para recargar.

La granada M67 no sale de golpe: la mano de apoyo engancha la anilla y saca el pasador (se oye el tirón),
el brazo va atrás, lanza (salta la cuchara) y la mano suelta el pasador, que cae al piso. La granada se
gasta recién al soltarla.

Las armas comunes (incluidas las de cuerpo a cuerpo) aparecen en cajas por el camino. Las especiales, en una caja brillante arriba
de las montañas, y vuelven a aparecer a los 90 segundos.

## Gráficos y sonido

**Calidad gráfica y juego descargable.** La calidad viene en «Automático»: arranca en alta (hasta 2× de
resolución) y, si en 3 s de partida el cuadro promedio tarda más de 24 ms (menos de unos 42 por segundo), baja un
escalón (normal: 1×; baja: 0,75× y sin el bisel de las piezas) y avisa; recuerda lo medido en cada computadora.
También se puede fijar a mano. En la portada, «Descargar el juego» (grande, con avance animado) arma un solo `zona-muerta.html` (unos
4,6 MB, con el CSS, los 36 scripts y los sonidos adentro) para jugar con el navegador sin pasar por la página de
Claude; su progreso y su configuración se guardan aparte.

**El archivo descargado se actualiza solo.** `zona-muerta.html` es un lanzador (`js/lanzador.js`): trae el juego
entero adentro en base64 (anda sin conexión) y lo muestra en un marco `srcdoc`, que comparte el origen de la página,
así el progreso se conserva entre versiones. Al abrirlo o recargarlo usa la versión más nueva que tenga (la de
adentro o la última que bajó, guardada en IndexedDB) y, con conexión, consulta `version.json` en la web del juego:
si hay una más nueva baja `juego.html`, la guarda y la carga (si está jugando, queda para la próxima recarga).
La web se arma con `python3 -I herramientas/armar-web.py <salida> <URL pública/>` (index.html, css, js,
juego.html, zona-muerta.html, version.json) para subirla a un hosting estático como GitHub Pages; la versión es
fecha, hora y commit. Mientras `js/version.js` diga `dev` y no tenga dirección, el lanzador no busca nada.

**Muerte de los zombies.** El golpe los despide de espaldas según el arma: con pistola o metralleta trastabillan
y caen; con escopeta, rifle o ametralladora vuelan hacia atrás; con un explosivo salen por el aire dando vueltas.
Pegan contra el piso y rebotan (con el golpe del cuerpo, polvo y sangre), quedan tendidos pataleando y manoteando
con espasmos mientras echan chorros de sangre, se les apagan los ojos, los brazos caen flojos y se desvanecen en
su charco a los 5 s. Los jefes pesan y vuelan menos, y su caída hace temblar la pantalla. El zombie tóxico de la
cloaca conserva su caída de rodillas.

Si el juego deja de verse (pestaña o app en segundo plano, celular bloqueado, página cerrada o el marco del
artefacto escondido), el audio se suspende y la partida se pausa. Lo último no avisa con `visibilitychange`:
`js/audio.js` vigila además que la página siga pintando cuadros y, si se frena más de 0,7 s, silencia todo.

- El lienzo se dibuja a la resolución real de la pantalla (hasta 1920×1080) sobre una escena lógica de 960×540.
- Personajes y armas se ilustran por piezas con degradado, bisel de luz y sombra en el borde y contorno fino.
  Las armas tienen brillo metálico, veta en la madera y culatas con caída.
- Cada zombie sale distinto: pelo, heridas, desgarros, manchas y a veces un brazo colgando. Al morir cae sobre un charco de sangre.
- Los mecanismos de recarga (cargadores, correderas, cerrojos, bombeo, cartuchos, balas) son grabaciones reales
  de armas, recortadas en eventos sueltos y elegidas según el arma. Fuentes y licencias en `sonidos/CREDITOS.md`.
- Voces de zombies, pasos, impactos de bala en la carne y quejidos del protagonista también son grabaciones reales.
  El viento de fondo, la sirena de cada ronda y el latido con poca vida son sintetizados.
- Los disparos y explosiones son sintetizados y suenan a aire libre (sin eco y casi sin reverberación), salvo en el
  galpón del entrenamiento, donde tienen eco: disparos en capas (chasquido, explosión de gas, golpe grave
  y cola) con eco de exterior y reverberación, y gemidos con formantes de voz.

## Estructura

```
index.html        pantallas (menú, misiones, controles, juego)
css/estilos.css   interfaz
js/config.js      configuración guardada (volúmenes, idioma, calidad, táctiles, vibración)
js/idioma.js      textos en español, portugués e inglés, y t('clave') para usarlos
js/audio.js       disparos sintetizados con WebAudio y reproducción de las grabaciones de mecanismos
js/musica.js      música de cada escenario, tocada en vivo por capas según la intensidad
js/sonidos-datos.js  grabaciones de mecanismos embebidas en base64 (generado desde sonidos/)
js/sonidos-ambiente.js  zombies, pasos, impactos y voz embebidos en base64 (generado desde sonidos/ambiente/)
sonidos/          recortes WAV de las grabaciones reales y sus créditos
js/armas.js       catálogo de armas (daño calibrado por tiros)
js/dificultad.js  tabla de dificultades y tamaño de cada ronda
js/dibujo.js      degradados, cubos, cilindros y sombras proyectadas (el "2.5D")
js/armas-dibujo.js    dibujo de pistolas y metralletas, con sus puntos de anclaje
js/armas-dibujo-2.js  dibujo de rifles, escopetas, M2 y especiales
js/misiones.js    catálogo de misiones y seguimiento
js/fichas-armas.js  ficha real de cada arma (origen, año, munición, descripción) en tres idiomas
js/terreno.js     mundo infinito por trozos, montañas, farolas, chatarra, ruinas y primer plano
js/escenario.js   cielo, cordilleras, ciudad lejana y suelo en perspectiva
js/escenario-objetos.js  ruinas, farolas, chatarra, alambrado del frente, periódicos, bolas de paja, campo de pruebas y galpón
js/escenario-cloaca.js   canal subterráneo: bóveda, arcos, caños, desagües, vereda y canal de agua
js/jugador.js     jugador, inventario, disparo, recarga por fases
js/jugador-dibujo.js  cuerpo del jugador con los brazos siguiendo la recarga
js/skins.js       personajes elegibles: colores, capa, torso y cabeza de cada uno
js/zombie.js      zombie (verde, camiseta azul manchada, pantalón marrón roto)
js/zombie-toxico.js  zombie tóxico de la cloaca, escupitajo de ácido y charco
js/armas-modelos-2.js  las 20 armas nuevas (fuego, cuerpo a cuerpo y legendarias)
js/armas-modelos-3.js  rediseño realista de las armas de fuego (medidas reales, estrías, cuadrillé, rieles, miras)
js/poderes.js     golpe cuerpo a cuerpo y poderes de las legendarias (rayo, onda, ola, armas que vuelven)
js/objetos.js     proyectiles, explosiones, cajas, ametralladora fija, partículas, casquillos
js/juego.js       partida: rondas, aparición de enemigos y cajas, HUD
js/interfaz.js    menú, teclado, pausa, fin de partida
js/tactil.js      controles en pantalla para celulares y tablets
```

Para depurar desde la consola del navegador: `ZonaMuerta.juego()` devuelve la partida en curso.
