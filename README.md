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
- **Campo de pruebas**: un puesto de tiro techado, sin zombies ni rondas, con las 24 armas en el
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
(un cuarto de la velocidad; el sonido sigue normal). `Z` o el botón **+ ZOMBIE DE PRUEBA** de la ficha ponen un zombie quieto
que no muerde, para probar el arma: cada uno nuevo va un poco más atrás que el anterior y puede haber hasta 5 (con uno
más se va el más viejo). Se dibuja siempre con todos los píxeles de la pantalla (hasta 3×), sin importar la calidad elegida, para que de cerca no se vea pixelado. La ficha del arma en la mano: su dibujo entero de perfil con el largo, grupo, origen, año,
munición, descripción, daño, tiros para matar, cargador, cadencia, funcionamiento, recarga, alcance y retroceso, con
la munición en vivo; va arriba a la izquierda y el personaje justo a su derecha (el juego mide dónde termina la ficha, que cambia con la
pantalla: entre el 30 % y el 42 % del ancho), así queda lugar a la derecha para los zombies de prueba, desde 140 px. `C` sigue abriendo la lista de todas las armas.

El escenario es un galpón enorme (`Escenario.dibujarCampo`). Como la cámara acercada sólo muestra unos tres metros, el
tamaño se lee por la profundidad: el piso sigue hasta la pared del fondo, dos hileras de columnas de acero cada vez más
chicas y lavadas por la neblina, estanterías lejanas, un ventanal alto, haces de luz en diagonal, lámparas colgadas y
las juntas del piso que convergen. Detrás del arma queda lo más claro (la neblina del fondo), así el acero negro
recorta; el piso de adelante es claro para ver casquillos, peines y cargadores; la línea de tiro amarilla está en la
punta de las botas y, a la derecha, la trampa de balas. Suena como galpón (eco) y apenas entra el viento de afuera.

**Luz del fogonazo** (`LuzFogonazo` en `js/objetos.js`, en todos los modos salvo la defensa ultra): cada disparo
ilumina el piso debajo de la boca (una mancha anaranjada, más ancha y tenue cuanto más alto el arma) y al tirador,
cuerpo y arma, más fuerte cerca de la boca. Dura 90 ms (un poco más que la llama) y se apaga en curva. Lo del tirador
se hace con su silueta en un lienzo aparte, sin la sombra; con la calidad liviana se omite.

## Último bastión (defensa con estrategia)

**Lo que se juega hoy es el rediseño por bandos**, que se describe más abajo, en «El juego: dos bandos con
contrapesos» (13 unidades contra 16 tipos de zombie, cuatro niveles con terreno propio). El modo anterior, de cinco
unidades, oleadas sorteadas y cinco niveles de 10 oleadas, ya no está en el menú; su motor (`js/estrategia.js`) es la
base sobre la que corre el rediseño, así que lo que sigue hasta «Arte» vale como descripción de esa base (grilla,
caminos, cuartel y taller, velocidades, cámara, dibujo) y como historia de lo que había.

Modo aparte de las defensas (`js/estrategia.js`): no se dispara, se manda. Vista de estratega sobre un campo con
grilla; a la izquierda el campamento (cuartel, taller, empalizada), y los zombies llegan por la derecha buscando el
camino más corto (un mapa de distancias por celda que se rehace cada vez que algo se construye o se rompe).

| Qué | Cuesta | Tarda | Dónde se hace | Qué hace |
|---|---|---|---|---|
| Soldado | $50 | 4 s | Cuartel, de a uno | Camina a su lugar y dispara (alcance medio). Si su lugar es un búnker, entra (hasta 4) |
| Torreta | $150 | 8 s | En el lugar, con andamio | Ametralladora con su tirador detrás de bolsas de arena: mucho fuego, poco daño |
| Búnker | $150 | 12 s | En el lugar | Mucha vida; disparan los soldados que tenga adentro, con más alcance. Si cae, salen |
| Tanque | $375 | 15 s | Taller, de a uno | Maneja hasta su lugar; dispara muy lejos con daño en área (radio 32), pero no a los que tiene pegados |
| Muro | $35 | 2 s | En el lugar | Obliga a rodear: en los huecos angostos los zombies se amontonan y van más lento. No se puede cerrar el paso del todo |

Torretas, búnkeres, tanques y muros ocupan su celda; los soldados no. Los zombies muerden lo que tienen adelante y,
si se trancan, rompen lo que los traba. La economía está ajustada para que haya que administrar: se empieza con
$150 y un ejército mínimo (3 soldados y 4 muros que dejan un pasillo), que solo no aguanta más de 4 oleadas. Cada
muerto paga poco (caminante $6, corredor $7, gordo $15, el coloso de cada 5 oleadas $90), cada oleada superada da
$30 + $5 por oleada, la vida de los zombies crece 21 % por oleada y la cantidad es 8 + 4·(n−1) + n^1,4. Entre
oleadas hay 25 s para construir (la primera, 40); se puede adelantar con Espacio o el botón, y cobra $1 por segundo
ahorrado. El que llega al campamento le saca vida (1, 3 el gordo, 8 el coloso); con 15 entradas se pierde.
Velocidad 1×, 2×, 5× o 10× con los botones de arriba a la derecha o `V` (el bucle da varios pasos normales por
cuadro, no uno grande). Teclas: `1` a `5` eligen, `6` vende, clic derecho vende a mitad de precio (o cancela entero
lo que no estaba listo), `7` (o REPARAR) arregla lo dañado pagando ¾ de lo roto, `Esc` suelta lo elegido.

Laberintos: los muros obligan a dar vueltas, pero el 60 % de los zombies comunes (y todos los gordos y el coloso)
son impacientes: si el camino es más de 4 celdas más largo que ir derecho y tienen una construcción justo del lado
del campamento, la muerden para abrirse paso. Mantener un laberinto cuesta reparaciones.

Balance medido con bots que juegan solos con el código real en Node (4 corridas por caso, oleada en la que
pierden; dificultad media): no construir nada 4–5; solo torretas con muros 4–5; solo soldados 7–8; solo tanques
6–9; mezcla sin laberinto 6–10; laberinto en serpentina con torretas, tanques atrás y reparaciones 10–16.
Antes de este ajuste el laberinto llegaba a la 20 sin recibir un golpe.

### Niveles

Cada nivel son 10 oleadas fijas (`OLAS_POR_NIVEL`, `js/bastion-niveles.js`): se gana llegando al final con el
campamento en pie, y ganar abre el siguiente. Cada escenario tiene su fondo, su suelo, obstáculos que bloquean (no se
construye encima y los zombies los rodean; no se rompen) y terreno que no bloquea pero cambia el paso: el agua frena a
la mitad y ahí no se construye, el barro frena un cuarto y el hielo acelera 35 %.

| Nivel | Escenario | Obstáculos | Terreno | Dinero | Vida |
|---|---|---|---|---|---|
| 1 | La granja, de día (molino y granero) | 4 árboles, 2 fardos, tractor | camino de tierra, tierra arada (barro), estanque | $200 | ×0,75 |
| 2 | La autopista, al atardecer | 6 autos, 2 contenedores | asfalto, charcos, barro en la banquina | $175 | ×0,9 |
| 3 | El bosque, de noche | 7 pinos, 2 rocas | río de punta a punta con un puente, barro | $175 | ×1 |
| 4 | El desierto, al mediodía (mesetas) | 5 cactus, 3 rocas | oasis | $160 | ×0,9 |
| 5 | La montaña, nevando | 5 pinos nevados, 2 rocas, cabaña | lago congelado (hielo) | $160 | ×1,05 |

La partida se guarda sola al terminar cada oleada (`zonaMuerta.bastion.partida`: nivel, dificultad, oleada, dinero,
campamento y cada construcción con su vida; lo que estaba en cola se devuelve en dinero) y se sigue desde la pantalla
de niveles con CONTINUAR. Al ganar o perder se borra. Los niveles ganados quedan en `zonaMuerta.bastion.progreso`.

Con bots en Node (3 partidas por caso, dificultad media): sin construir no se gana ninguno; solo tanques gana la granja
siempre y la autopista 2 de 3; un laberinto armado para cada escenario gana los cinco (el desierto, 2 de 3). En difícil
la montaña no la gana ningún bot.

### Arte

Vista como en StarCraft 2: la cámara mira al norte desde arriba y de costado, con perspectiva suave
(`js/bastion-camara.js`). La fila de adelante queda del tamaño de siempre y la de atrás al 80 % (`CAMARA_BASTION`); los
costados del campo se cierran hacia el fondo y las filas se achican, como un tablero visto desde una punta. La
perspectiva es sólo la cámara: el juego sigue pasando en el plano (la grilla, las distancias, los alcances, el
movimiento y el guardado no cambiaron) y el toque se lleva de vuelta al plano (`desproyectar`), así que construir,
vender y reparar funcionan igual.

- **El piso** (pasto, terreno, campos, calles, el patio del campamento) se pinta plano en un lienzo aparte y se lleva a
  la pantalla en trapecio, fila por fila, cada una a su escala (`capaQuietaBastion`, una vez por nivel).
- **Lo que está parado** (unidades, zombies, obstáculos, edificios, árboles, el campamento) va en su punto proyectado,
  escalado alrededor de los pies (`enCamara`), de atrás hacia adelante. Las barras de vida y los carteles no se achican.
- **Lo que vuela** (trazadoras, proyectiles del tanque, gotas de sangre, humo) lleva su altura sobre el piso, que también
  se achica con la distancia; las gotas caen a la fila de quien sangra.

De cada cosa se ve el techo y el frente (`caja34`). La luz viene del noroeste: los techos con luz, los frentes que miran
al sur en sombra (los muros de cestones tienen el techo de arena claro y la malla del frente más oscura), y las sombras
caen abajo a la derecha (`sombraCaja`). No hay cielo.

- **Borde del mapa** (`PaisajeBastion.borde`): una meseta más alta que el campo, separada por un escalón del que se ve el
  frente (`escalon34`). El escalón va en tramos diagonales, como las barrancas de StarCraft: los que miran al suroeste,
  más claros; los que miran al sureste, más oscuros. Cada escenario tiene el suyo: barranca de tierra con piedras, raíces
  y alambrado en la granja (con una rampa por donde baja el camino); muro de contención de paneles con baranda en la
  autopista; barranca con raíces en el bosque; paredón de estratos con el cañón como rampa en el desierto; paredón de roca
  con vetas de nieve en la montaña. Arriba, con la misma cámara y hasta el borde de la pantalla: casas y granero con el
  techo a dos aguas a la vista, silo, molino, fardos y campos sembrados con la altura de las plantas (`parcela34`), entre
  caminos con cortinas de árboles; manzanas de edificios entre calles y avenidas, con las azoteas a la vista (pretil,
  máquinas, tanques de agua, agujeros quemados e incendios con humo), autos y faroles; el bosque cerrado de pinos, con la
  niebla de la noche; piedras, cactus y el cañón; peñascos y pinos nevados.
- **Terreno hundido** (`pozo34`): del agua, el barro, el hielo y la ruta entre los cordones se ve la pared de enfrente
  (la del norte) y el fondo corrido hacia abajo; contra la orilla oeste, la sombra. El agua refleja la barranca y tiene
  la línea del agua; la tierra arada, surcos con el lomo con luz; el puente de tablones queda levantado sobre el agua, con
  su canto, pilotes y barandas.
- **Muro del campamento**: como está sobre el borde izquierdo de la pantalla, la cámara lo ve un poco de costado
  (`prisma34`): además del techo de arena se ve la cara que mira al campo, con la malla y los parantes.

Todo lo del modo se dibuja en `js/bastion-dibujo.js` (la cámara, en `js/bastion-camara.js`), con el mismo estilo de
ilustración que el jugador (`pintura`:
dos tonos, brillo de borde y contorno del color de cada pieza). Soldado con casco con funda, chaleco, mochila y fusil
con mira; nido de ametralladora pesada en trípode con el tirador agachado tras bolsas de arena; búnker de hormigón con
red de camuflaje, tronera con los cascos de los de adentro y antena; tanque con orugas, ruedas, faldones, torre con
escotilla, ametralladora, lanzahumos y cañón con evacuador y freno de boca; muro de cestones de malla con concertina
(se abolla y pierde arena con el daño); obra con andamio y tablón de seguridad. El campamento es una base de avanzada:
muro de cestones con portón y barrera, torre de guardia con reflector que barre el campo, bandera, carpas, cuartel
prefabricado y taller de chapa en arco. Cada escenario tiene su paisaje alrededor del campo (granja con granero, silo
y molino; ciudad con incendios; bosque de noche con luciérnagas; desierto con cañón y buitres; montaña nevando) y
terreno con bordes redondeados, orillas, juncos, carriles y surcos.

Rendimiento: cada pose de cada unidad y cada obstáculo se dibuja una sola vez y queda en una caché de imágenes
(`conSprite`, a la resolución en que se ve, que con la cámara depende de la fila); el piso en trapecio, el borde del
mapa, el campamento y la niebla de la derecha van en una capa por nivel (`capaQuietaBastion`: de 25 a 78 ms al entrar,
en Chrome sin GPU); por cuadro solo se pintan fogonazos, humo, bandera, reflector, nubes, nieve y brillos del agua. Con
43 unidades en pantalla el dibujo pasó de 26 ms a 3,4 ms por cuadro (sin la caché, el arte nuevo era inviable). La
cámara le suma algo al cuadro: en una batalla chica (6 unidades, 4 o 5 zombies), de 5,2–6,0 ms a 6,4–7,9 ms (Chrome sin
GPU), por las unidades y los zombies escalados.

### El juego: dos bandos con contrapesos (archivos `bastion-v2*`)

El botón «ÚLTIMO BASTIÓN» del menú abre la lista de niveles (cuatro, de 12 oleadas, todos abiertos) y la partida
guardada, si hay. Es el rediseño por bandos, que en el código sigue llamándose «v2»: el plantel completo, 13 unidades
contra 16 tipos de zombie y un jefe por nivel, donde ninguna unidad sirve contra todo, no todos los zombies vienen de
frente y cada escenario limita a su manera dónde entra cada cosa. La guía de los dos bandos (qué hace cada uno, fuerte,
débil, cómo usarlo) no es una pantalla previa: es una capa que se abre desde la lista de niveles o desde adentro de la
partida, con el botón **GUÍA** o la tecla `H`, y deja el juego en pausa mientras se lee; en partida, los tipos que no
vienen en ese nivel quedan apagados. Los archivos `js/bastion-v2*.js` envuelven los métodos de `js/estrategia.js`; lo
nuevo corre si `juego.v2`, que hoy es siempre (la interfaz no inicia el modo anterior).

| Archivo | Qué tiene |
|---|---|
| `js/bastion-v2.js` | Los números de los dos bandos (`BASTION2`), las oleadas, colocar, vender, mover y guardar |
| `js/bastion-v2-horda.js` | Cómo se crea y cómo se porta cada tipo de zombie |
| `js/bastion-v2-tropa.js` | Armas y oficios de cada unidad, explosiones, gas y granadas |
| `js/bastion-v2-dibujo.js` | El dibujo de lo nuevo: unidades, zombies, aves y efectos |
| `js/bastion-v2-ui.js` | Lista de niveles, panel, parte de la oleada, marcas de contrapeso, guía y textos |

Los contrapesos salen de seis reglas que valen para todos, no de una tabla de multiplicadores:

- **Blindaje**: le resta puntos a cada bala, con un mínimo de 1 (al acorazado, 2: la torreta le hace la mitad y el fusil,
  un tercio). No frena al francotirador, al cañón, al fuego ni a las explosiones.
- **Área**: el fuego y las explosiones pegan a todos los que están juntos; la granada del mortero tarda 1,5 s en caer
  donde estaba el blanco, así que falla contra lo rápido.
- **Aire**: lo que vuela pasa sobre todo. Sólo le tiran los fusiles (soldado, francotirador, también desde un búnker)
  y la antiaérea, que no puede tirarle a nada más.
- **Velocidad**: cuanto más rápido el zombie, menos tiempo pasa bajo fuego: cadencia alta y alambrado.
- **Vista**: cada zombie va por el primer humano que ve. El que tira desde más lejos que esa vista, tira escondido.
- **Altura**: arriba de un obstáculo con techo (`BASTION2.techos`: el contenedor) o de una cornisa de la montaña sólo
  sube la infantería, de a uno. Desde ahí tira 25 % más lejos y los que caminan no la alcanzan ni la toman de presa; sí
  la alcanzan lo que vuela (bandada, buitre), el escupidor, lo que arrojan el lanzador y el Coloso, el gas y las
  explosiones.

**Suelos** (`BASTION2.suelos`, `BastionV2.noAguanta`): cada terreno aguanta lo suyo, y eso es lo que hace distinto a
cada nivel. Al elegir qué poner, el campo marca dónde entra: si casi ningún suelo lo aguanta se pintan en verde las
celdas donde sí; si no, se tachan las que no.

| Suelo | Dónde | Qué se puede parar | La horda |
|---|---|---|---|
| Firme | Pasto, asfalto, banquina, nieve, losa de piedra | Todo | Pasa |
| Blando | Barro, tierra arada | Gente a pie, alambrado y señuelo | Pasa al 75 % |
| Suelto | Arena | Gente a pie, alambrado, señuelo y el tanque | Pasa |
| Liso | Hielo | Sólo gente a pie | Resbala: va 35 % más rápido |
| Pared | Risco | Nada | No lo pisa (lo que vuela, sí) |
| Alto | Cornisa | Sólo gente a pie, de a uno (regla de altura) | No la pisa |
| Agua | Estanque, oasis, charco | Nada | No pasa a pie |

La bala que no pasa el blindaje (la torreta contra el acorazado, casi todo contra El Escudo) rebota: saca 1 punto, sin
destello ni empujón.

**El Bastión** (alcances en celdas de 44 px):

| Clase | Unidad | $ | Vida | Qué hace |
|---|---|---|---|---|
| Infantería | Soldado raso | 50 | 30 | Fusil: 3 por bala cada 0,65 s a 4 celdas. Le tira también a lo que vuela |
| | Francotirador | 120 | 20 | 45 cada 3 s a 7,7 celdas, al más peligroso. Ignora el blindaje |
| | Lanzallamas | 110 | 45 | 14 por segundo a todos los del cono, a 2 celdas, y los deja prendidos. Perros y toro no cruzan el fuego |
| | Médico | 90 | 25 | Cura 4 por segundo a la infantería a 2 celdas. Quien cae a su lado no se contagia; con él cerca el gas no vacía los búnkeres |
| Mecanizados | Torreta | 150 | 90 | 2 por bala cada 0,13 s a 4,4 celdas. No apunta al aire |
| | Tanque | 375 | 400 | Cañón de 70 cada 1,8 s a 5 celdas, al que más vida tiene. Las mordidas le hacen un tercio. Se mueve. Ningún topo pasa por debajo a 2 celdas |
| | Mortero | 130 | 60 | 14 en un radio de 40 px cada 3,5 s, de 4 a 9 celdas, adonde hay más juntos |
| | Antiaérea | 140 | 80 | 6 en un radio de 34 px cada 0,4 s a 6 celdas, sólo a lo que vuela |
| Estructuras | Muro | 35 | 150 | Bloquea el paso (nunca del todo) y es el escudo de quien está detrás |
| | Alambrado | 15 | 40 | No bloquea: frena al 45 % y saca 20 % de la vida. Aguanta 20 pisadas |
| | Búnker | 120 | 280 | Refugio para 4 de infantería de cualquier oficio, que tiran desde adentro con 20 % más de alcance |
| | Señuelo | 50 | 100 | Llama a los caminantes a 5 celdas, que lo golpean 5 s. Una vez por zombie. El topo sale junto a él |
| | Torre de vigía | 60 | 80 | No dispara: descubre a los topos enterrados a 4 celdas y los obliga a salir, encandilados 2,5 s |

La infantería se forma en el cuartel de a uno y camina a su puesto (uno por celda); en el barro sólo van la infantería,
el alambrado y el señuelo. Al romperse una máquina queda un soldado a pie, herido. **Mover** (tecla `C`) cambia de lugar
a la infantería, al tanque o al último que entró a un búnker, también en plena oleada.

**La Horda** (vida: veces la de un común de esa oleada, que crece 17 % por oleada):

| Clase | Zombie | Vida | px/s | Qué hace |
|---|---|---|---|---|
| Caminantes | Común | 1 | 24 | Ve a 3 celdas. Entra en hordas de 6. Rodea si el rodeo es corto; si no, rompe lo que tapa a su presa |
| | Corredor | 0,8 | 46 | Ve a 4. Rodea buscando el hueco y nunca rompe |
| | Gordo | 3,2 | 16 | Ve a 2. Nunca rodea: rompe toda construcción. Aplasta alambrado y señuelo |
| | Acorazado | 2 | 20 | Como el común, con casco y escudo: blindaje 2 |
| Especiales | Gritón | 0,8 | 26 | Ve a 6 y grita: los zombies a 5 celdas van por los humanos que él ve y se apuran 30 % |
| | Hinchado | 5 | 14 | Camina a lo construido más cercano (a 5 celdas) y estalla al tocarlo o al morir: radio 60 px, también mata zombies |
| | Dinamitero | 0,8 | 50 | Corre derecho al campamento y le saca 120 a la primera construcción que le corta el paso |
| | Tóxico | 3 | 18 | Caza donde hay más gente junta. Al morir deja 5 s de gas: daña a la infantería y vacía los búnkeres de a uno |
| Animales | Jauría | 0,5 | 62 | Cinco perros que huelen a la gente a pie a 6 celdas, rodean y saltan el alambrado, los fardos y el tractor |
| | Toro | 6 | 20 | Ve a 6. Avisa, embiste en línea recta (96 px/s) y aturde 2 s a quien atropella; después queda quieto 2 s |
| | Bandada | 0,4 | 55 | Seis cuervos que vuelan: picotean a la gente a pie o, si no hay, le sacan 1 cada uno al campamento |
| | Buitre | 2,5 | 40 | Vuela hasta alguien a pie (primero el francotirador), lo levanta y lo suelta junto al caminante más cercano |
| Acechadores | Topo | 1,6 | 36 | Se entierra al entrar y va por debajo de todo, sin que se le pueda tirar, hasta lo que hay más atrás (mortero, francotirador, médico, antiaérea); sale en 0,8 s y muerde ×1,5 |
| | Lanzador | 6 | 16 | Agarra al zombie que tiene al lado y lo arroja hasta 7 celdas, junto al humano que esté más atrás; sin zombies a mano, tira cascotes a lo construido |
| | Escupidor | 1,2 | 20 | Se planta a 5 celdas de la gente (más de lo que alcanzan el soldado y la torreta) y escupe ácido en arco: un charco de 3,5 s |
| | Rabioso | 0,7 | 120 | De a cuatro, en zigzag, directo al campamento sin detenerse. El francotirador y el cañón le erran 6 de cada 10 tiros |

Los acechadores son los que no vienen de frente: el topo pasa por debajo de la línea, el lanzador por arriba, el
escupidor tira desde más lejos y el rabioso corre más rápido que las armas lentas. El soldado que cae se levanta a los
3 s como soldado zombie (blindaje 1), salvo que lo haya matado una explosión o tenga un médico cerca.

Cada nivel tiene su jefe, en las oleadas 6 y 12, y cada uno cambia una regla mientras vive:

- **El Coloso** (La granja; vida ×22): rompe todo y arroja fardos a lo que tiene a 5 celdas.
- **El Escudo** (La autopista; ×22): un acorazado gigante (blindaje 4: las balas chicas le hacen 1) que sale adelante y
  **cubre** a los que marchan pegados detrás de él, a 2,2 celdas: a esos no les entra ninguna bala tirada desde el
  piso. Les llegan el fuego, las granadas y los tiros de quien está arriba de un contenedor; a él, el francotirador y
  el cañón.
- **La Cisterna** (El desierto; ×18): una hinchada gigante. Va a lo primero construido que ve y, donde cae, estalla a
  3 celdas (220 a lo construido, 60 a la gente). Si muere lejos, su estallido sólo mata zombies; un señuelo o un
  alambrado adelantado la aparta.
- **La Sirena** (La montaña; ×18): una gritona gigante. Ve a toda la gente del campo, esté donde esté, y su grito llega
  a todos los zombies: cada 6 s les muestra adónde ir y los apura un 35 %.

**Niveles** (`BASTION2.niveles`, en el orden de `BASTION2.ordenNiveles`). Cada nivel usa el escenario del modo de
siempre con ese nombre (`BastionV2.escenario`) y puede redefinir su mapa (`mapa`: terreno y obstáculos), con qué se
empieza (`inicio`) y el aviso inicial. Los tipos de zombie son siempre los mismos: cada nivel elige un grupo.

| Nivel | Terreno que manda | Horda | Jefe |
|---|---|---|---|
| 1. La granja | Campo abierto, sin embudo. Tierra arada (suelo blando: sólo infantería, alambrado y señuelo) y un estanque | Los 16 tipos, uno o dos nuevos por oleada | El Coloso |
| 2. La autopista | Dos líneas de autos chocados arman pasillos (en la de cerca, 4 pasos; en la de lejos, 2, y el del sur es barro: no se cierra con un muro). Cuatro contenedores con techo. Los perros saltan los autos | 11 tipos: común, corredor, acorazado, hinchado, dinamitero, jauría, bandada, buitre, escupidor, lanzador y rabioso (bajo el asfalto no hay topos) | El Escudo |
| 3. El desierto | Arena suelta: no se construye nada. Lo que pesa va en 12 celdas de losa de piedra, en seis afloramientos; sobre la arena sólo van la gente a pie, el tanque (se empieza con uno), el alambrado y el señuelo. Sin muros no hay embudo, y el oasis parte el frente en dos | 10 tipos: común, corredor, hinchado, dinamitero, toro, bandada, buitre, topo, escupidor y rabioso | La Cisterna |
| 4. La montaña | Un paso entre riscos: 84 de las 162 celdas son pared. El paso se angosta dos veces a tres filas, y esos cuellos son hielo (no se construye; la horda resbala). Se construye en la plaza del medio (20 celdas) y en la retaguardia (15), pegada al campamento. Cuatro cornisas | 12 tipos: común, corredor, gordo, acorazado, dinamitero, tóxico, toro, bandada, topo, lanzador, escupidor y rabioso | La Sirena |

En los niveles 3 y 4 la horda aguanta un 5 % más (`vida: 1.05`).

El progreso (`zonaMuerta.bastion2.progreso`) guarda qué niveles se ganaron; la partida guardada es una sola, la última,
y recuerda su nivel. Al ganar, la pantalla de fin ofrece el nivel siguiente.

**Información sin tapar el campo.** Cada oleada estrena un tipo y el parte de arriba dice qué viene, con el debutante
marcado. Al elegir una unidad, en el parte quedan en verde los zombies que frena y en rojo aquellos contra los que
rinde poco; al tocar un zombie del parte, en la barra quedan marcadas las unidades que lo frenan y las que no sirven
(`BASTION2.contra`). De texto hay un solo renglón arriba de la barra; la guía completa se abre aparte (botón GUÍA o
`H`). La partida se guarda al empezar cada oleada: al perder, la pantalla de fin dice quiénes entraron, con qué se los
frena, y ofrece repetir esa oleada con todo como estaba. Lo mismo se puede pedir en cualquier momento desde la pausa,
con **REINICIAR LA OLEADA n**: unidades, dinero y campamento vuelven a como estaban al empezar la última oleada que se
largó (`fotoInicioV2`; si todavía no empezó ninguna, el nivel arranca de cero). En el descanso que sigue a una oleada
ganada el botón sigue apuntando a esa oleada, así que sirve para rehacerla aunque se haya ganado mal.

**Elegir una unidad del campo.** Con la mano vacía, tocar una unidad la elige (`unidadBajoV2`, `elegirDelCampoV2`): en
el campo se ve hasta dónde llega desde donde está (el arma, el mínimo del mortero, la cura, el llamado del señuelo, lo
que descubre la vigía; para un búnker, el alcance de cada uno de los de adentro, que tiran 20 % más lejos), su botón
queda marcado en la barra y las tres herramientas pasan a actuar sobre ella: **Vender** dice lo que devuelve (`+$`),
**Reparar** lo que cuesta (`−$`) y **Mover** la levanta para tocar adónde va (ahí se ve el alcance que tendría y desde
dónde la verían). Las que no aplican quedan apagadas. El renglón de arriba de la barra dice su vida y su alcance.
Tocarla de nuevo, tocar el suelo, el botón derecho o `Esc` la sueltan. Sin unidad elegida, las herramientas funcionan
como antes (se elige la herramienta y después a quién).

Teclas: `1` a `4` la infantería, `Q W E R` los mecanizados, `A S D F G` las estructuras; `Z` vende (75 % en el descanso,
50 % en la oleada), `X` repara, `C` mueve (sobre la unidad elegida, si hay una); `H` abre la guía.

**Balance medido en La granja** con bots que juegan con el código real, en dificultad media. Cruce por cruce (una defensa de un solo
tipo y unos $300 contra una tanda de un solo tipo, en la oleada 6 los doce primeros y en la 8 los acechadores;
campamento que queda sobre 15 y parte de la defensa en pie):

| Tanda | Lo que frena | Lo que no |
|---|---|---|
| 10 acorazados | 3 francotiradores 15 y 100 %; 3 lanzallamas 15 y 100 % | 2 torretas 1 y 0 %; 6 soldados 0 y 0 %; búnker con 4: 0 y 0 % |
| 20 corredores | 2 torretas con 3 alambrados 15 y 87 % (sin alambrado, 56 %) | 6 soldados 4 y 0 %, con 6 contagiados |
| 15 perros | 3 lanzallamas 15 y 100 %; 2 torretas 12 y 100 % | 6 soldados 4 y 0 %; 2 antiaéreas 0 (ni los miran) |
| 3 toros | 3 francotiradores 15 y 100 %; 3 lanzallamas 15 y 100 % | 6 soldados 0 y 0 % |
| 18 cuervos | 2 antiaéreas 15; búnker con 4 soldados 12 | 2 torretas 0; tanque 0; 2 morteros 0 |
| 4 topos | tanque 15 y 100 %; 3 lanzallamas 15 y 67 % | 3 francotiradores 11 y 0 %; 2 torretas 9 y 0 %; búnker con 4: 7 y 0 % |
| 5 escupidores | 3 francotiradores 15 y 100 %; tanque 15 y 100 % | 2 torretas 3 y 0 %; 6 soldados 0 y 0 %; búnker con 4: 1 y 0 % |
| 12 rabiosos | 3 lanzallamas 15 y 100 % | 3 francotiradores 7; 2 torretas 6; 2 morteros 3 |
| 3 lanzadores con 12 comunes | búnker con 4 francotiradores 15 y 100 %; tanque con 2 francotiradores 15 y 100 % | 4 francotiradores a pie 10 y 25 %; tanque solo 1 y 0 % |

El topo es el caso de detector: contra una retaguardia de dos francotiradores, mortero y antiaérea, 4 topos la dejan en
0 % con 4 contagiados; con una torre de vigía adelante y una torreta, o con un señuelo y una torreta, o con el tanque
adelante, la retaguardia queda entera y no entra ninguno.

La partida entera, con tres planes de distinta calidad:

| Plan | Resultado |
|---|---|
| No construir | pierde en la oleada 2 o 3 |
| Sólo soldados | pierde en la 3 o 4 |
| Sólo torretas | pierde en la 4 o 5 |
| Respuesta a cada debut sin pensar en los acechadores | pierde 4 de 4, en la 10 u 11 |
| Embudo (columna 7 cerrada, lanzallamas en el hueco, francotiradores y mortero atrás) | pierde 6 de 6, en la 11 |
| El embudo adaptado: francotiradores dentro de un búnker, dos torres de vigía adelante, torretas atrás, dos antiaéreas | gana 6 de 8, con el campamento en 7 de 15 |

El plan adaptado sin francotiradores pierde en la oleada 4 (5 de 5); sin antiaéreas gana 1 de 5; sin torres de vigía o
sin mortero, 3 de 5. En fácil, el embudo y el adaptado ganan 3 de 3 sin perder campamento; en difícil el adaptado
pierde en la 10. El embudo ganaba 4 de 4 sin recibir un golpe antes de los acechadores.

La plata por zombie es la perilla de la dificultad: con las pagas de antes (un común, $3) ningún plan llegaba al final;
con las actuales (un común, $4, y un poco más por los demás) gana el que se adapta. El resultado es brusco, no gradual: en los planes que pierden, el campamento suele estar entero hasta la
oleada 8 o 9 y la defensa se derrumba en una sola oleada, porque cada baja se levanta en contra. No está medido con
jugadores.

**Balance medido en La autopista**, igual (dificultad media, partidas enteras):

| Plan | Resultado |
|---|---|
| No construir | pierde en la oleada 2 |
| Sólo torretas | pierde 4 de 4, en la 5 |
| Embudo como en la granja, sin usar los techos (una línea de autos cerrada salvo un pasillo, lanzallamas en el hueco, francotiradores y mortero atrás, en el piso) | pierde 6 de 6, en la 10 u 11 |
| El plan adaptado con los mismos francotiradores en el piso en vez de en los techos | pierde 8 de 8, en la 6 o 7 |
| Adaptado al nivel: francotiradores arriba de los dos contenedores de cerca, los dos pasillos abiertos con lanzallamas detrás y alambrado delante, las banquinas cerradas, mortero, dos antiaéreas y tanque de ancla | gana 9 de 12 |

El plan adaptado sin francotiradores pierde 5 de 5 en la oleada 6 (no hay con qué frenar a El Escudo); sin antiaéreas,
5 de 5 en la 11 o 12 (la bandada); sin mortero gana 1 de 5; sin tanque, 4 de 5; sin lanzallamas, 5 de 5. En fácil el
adaptado y el embudo ganan 5 de 5 sin perder campamento; en difícil el adaptado gana 1 de 5. Contra El Escudo con 14
comunes detrás, en la oleada 6 y con unos $300: 3 francotiradores o un tanque lo frenan sin perder campamento; 3
lanzallamas matan a los que cubre pero caen (campamento 5); 2 torretas, 6 soldados, un búnker con 4 soldados, 2
morteros u 8 muros no lo paran (campamento 0 a 4). Cuatro soldados arriba de los contenedores matan a los 14 que cubre
sin recibir un golpe, pero el jefe entra igual. Como en La granja, el resultado es brusco: las partidas del plan
adaptado terminan con el campamento entero o se pierden de golpe en la oleada 12.

**Balance medido en El desierto** (dificultad media, partidas enteras):

| Plan | Resultado |
|---|---|
| No construir | pierde en la oleada 3 |
| Sólo torretas, en todas las losas | pierde 4 de 4, en la 7 |
| Como en la granja pero sin muros: búnker y torretas en las losas, francotiradores a pie, mortero y antiaérea; sin sumar tanques, señuelos ni vigías | pierde 6 de 6, en la 8 |
| Adaptado: el tanque de ancla en la arena con alambrado delante, dos búnkeres con francotiradores en las losas, vigías en las losas del frente, señuelos adelantados, dos tanques más, antiaéreas y morteros atrás | gana 7 de 12, con el campamento en 6 de 15 |

El adaptado sin francotiradores pierde 5 de 5 en la oleada 10; sin antiaéreas gana 1 de 5; sin mortero o sin
lanzallamas, 3 de 5; sin sumar tanques o sin vigías, 4 de 5. En fácil gana 5 de 5 sin perder campamento, y el plan
«como en la granja» pierde 5 de 5 también en fácil (en la 11); en difícil el adaptado pierde 5 de 5 en la 12. Acá las
derrotas son por goteo y no de golpe: lo que entra son rabiosos, de a pocos por oleada.

**Balance medido en La montaña**:

| Plan | Resultado |
|---|---|
| No construir | pierde en la oleada 2 o 3 |
| Sólo torretas | pierde 4 de 4, en la 5 |
| Embudo en la plaza: dos muros en la boca del cuello de lejos, lanzallamas y búnker con médico detrás del hueco, francotiradores a pie, tanque, mortero en la retaguardia y dos antiaéreas | gana 7 de 12, con el campamento en 12 de 15 |
| El mismo embudo con los francotiradores arriba de las cornisas de atrás | gana 6 de 12, con el campamento en 8 de 15 |

Ese embudo sin francotiradores pierde 5 de 5 en la oleada 6 (La Sirena); sin lanzallamas, sin mortero, sin antiaéreas
o sin tanque, 5 de 5; sin médico gana 2 de 5. En fácil gana 4 de 5; en difícil pierde 5 de 5 en la 12. Dos cosas a
mirar jugando: con los bots, poner a los francotiradores en las cornisas no rinde más que dejarlos a pie detrás del
tapón (los pican los cuervos y caen contagiados), así que las cornisas todavía no son la ventaja que deberían; y el
nivel es muy sensible: con la horda al 104 % ese embudo ganó 9 de 12 y al 106 %, 6 de 12 (quedó en 105 %).

Rendimiento: con 87 zombies de todos los tipos y 26 unidades, 0,8 ms de lógica y 13,6 ms de dibujo por cuadro (Chrome
de escritorio, lienzo a escala 2). No está medido en un celular.

## Publicar

- **Código y web**: `herramientas/publicar-web.sh` sube el último commit a https://github.com/zenebord/zona-muerta
  (rama `main`) y arma la web con `herramientas/armar-web.py` en la rama `gh-pages`, que GitHub Pages sirve en
  https://zenebord.github.io/zona-muerta/. Solo va lo commiteado. Imprime la versión publicada (`AAAAMMDD-HHMM-commit`).
- **Artefacto de Claude**: `herramientas/armar-artefacto.py <proyecto> <salida> <versión> https://zenebord.github.io/zona-muerta/`
  arma la página con cada script pedido con su huella (`?v=`, para que el celular no use copias viejas) y un
  `js/version.js` con esa versión y esa dirección, que se publica como archivo del artefacto. Así el juego que se
  descarga desde el artefacto o desde la web (`zona-muerta.html`) consulta `version.json` en la web y se actualiza solo.
- Los commits van firmados como `zenebord` con la dirección anónima de GitHub (configurada en este repositorio).

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
| Especiales (solo en montañas) | Lanzagranadas M79, Milkor MGL (6 granadas), Bazuca M9, RPG-7, Granadas M67, Lanzallamas M2, Minigun M134 (300 tiros), Láser alienígena | 1 (el lanzallamas: 0,9 s de fuego) |
| Cuerpo a cuerpo (tecla 6) | Machete y Bate con clavos (2 golpes), Katana (2, rápida), Hacha de bombero y Mazo (1, lentos; el mazo empuja lejos), Machete del cazador (1; solo con el cazador enmascarado) | 1–2 |
| Legendarias (tecla 7, solo en montañas) | Mjölnir (llama rayos sobre 4 zombies), Excalibur (onda de luz que atraviesa), Tridente de Poseidón (ola que barre), Égida (escudo que se lanza y vuelve), Gungnir (lanza que se lanza y vuelve) | 1 |

Las armas cuerpo a cuerpo y las legendarias no usan munición ni se recargan: `F` da el golpe (alza el arma,
la baja de golpe y vuelve a la guardia) y pega a los dos o tres zombies más cercanos adelante. Las de dos
manos se toman con las dos en el mango; el machete, la Égida y Gungnir, con una. Las legendarias son de la
mitología (nórdica, artúrica y griega); 3 de cada 10 cajas de montaña traen una.

### Machete del cazador y Minigun M134

Armas especiales de `js/armas-especiales.js`, que se engancha envolviendo métodos de `Jugador` y de `Juego`.

- **Machete del cazador**: es del personaje enmascarado (skin `cazador`) y de nadie más. Con él está siempre en el
  inventario, al lado del machete común; con otro personaje no aparece en ninguna lista (ni en el campo de pruebas),
  no se puede recoger ni equipar, y si se cambia de personaje con el machete en la mano pasa a la siguiente arma. Hoja
  de 58 cm (76 de punta a punta), vieja: óxido, cuatro mellas, sangre seca, mango rajado con cinta aisladora y un
  cordón. Una mano, alcance 60 y daño 15: tumba a un zombie de un golpe. Suena el susurro «ch ch ch… ja ja ja» de las
  películas de terror, sintetizado (`Audio_.susurroCazador`, sin grabaciones): al sacarlo (2,5 s como mínimo entre
  uno y otro) y, si pasaron 8 s del último, al matar con él o en 4 de cada 10 golpes. El nombre sigue la regla de los
  personajes: sin nombres de marcas ni de películas.
- **Minigun M134**: seis cañones que gira un motor eléctrico, 300 tiros en la caja y dos de repuesto. Al apretar, los
  cañones tardan 350 ms en llegar a la velocidad de tiro (giran sin tirar); después tira cada 30 ms (2000 por minuto) y
  la vaina salta por la ventana del costado. Al soltar siguen girando 1,4 s hasta parar. Tirando mucho, las bocas se
  ponen rojas. El motor sube y baja de tono con la velocidad y la ráfaga ruge debajo de cada tiro. Recargar es cambiar
  la caja: la vacía cae al piso y la nueva llega con la punta de la cinta. Un tiro por zombie, como la M2; la misión
  «Artillero» sigue contando solo la M2.

### Lanzallamas M2

El lanzallamas de mochila de Estados Unidos (1943), en el grupo de especiales. La lanza (111 cm) tiene la válvula de
combustible atrás con la manguera, dos empuñaduras de madera con sus gatillos (combustible e ignición), el cilindro de
ignición en la punta y la llama piloto que titila; en la espalda van los dos tanques de combustible y el de nitrógeno, y
la manguera baja por detrás del cuerpo hasta la válvula siguiendo al arma.

- **Chorro**: automático, una descarga cada 50 ms con tres llamas escalonadas que se estiran hacia donde vuelan, frenan
  con el aire, caen un poco y pasan de blanco amarillento a anaranjado, rojo y humo (alcance unos 7 m). Lo que toca el
  piso sigue ardiendo un poco más de un segundo. La luz del chorro ilumina el piso y al tirador (`LuzLlama`).
- **Daño**: cada llama pega una vez (0,4) y prende fuego al zombie, que se sigue quemando 3 s (4 por segundo), con lenguas
  de fuego por el cuerpo y su luz. Sin destello, ruido de impacto, empujón ni sangre por llama. Un zombie cae con
  0,6 s de fuego en fácil y 0,9 s en medio y difícil; la ficha y el HUD lo muestran en segundos.
- **Carga**: 7 s de fuego (140 descargas) y 4 de reserva. Recargar cambia el cilindro de ignición (`recargaTipo: 'ignicion'`).
- **Sonido**: un rugido grave que se encadena entre descargas, con algún chisporroteo.

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

**Recámara a la vista** (`js/armas-recamara.js`): el casquillo no aparece en el momento del tiro, sale por la
ventana de expulsión cuando la recámara está abierta. En las que se recargan solas (Uzi, AK-47, M16, MP5,
Thompson, Vector, Garand, SVD, Barrett, SPAS-12, AA-12, Saiga-12, Benelli) el cerrojo va atrás con cada tiro:
la ventana, que en reposo muestra el costado del cerrojo, queda abierta un instante con la vaina tomada de la uña
del extractor; a los 0,3 del ciclo la escupe, y al cerrar se ve entrar la bala nueva. El ciclo dura 130 ms (160 en
la Barrett), y nunca más que tres cuartos de la cadencia: en la AK, 75 ms. En las pistolas la ventana se abre con
la corredera (la vaina sale a los 20 ms; si se vació, la recámara queda abierta), en las de bomba con la bomba y
en las de palanca con la palanca. La manija de carga va con el portacerrojo donde en el arma real va (AK, SVD,
Saiga, SPAS-12, Benelli, Uzi, Thompson); en la M16, la MP5, la Vector, la Barrett y la AA-12 queda quieta. En
cámara lenta (L, en el campo de pruebas) se ve cada paso.

**Cargadores** (`js/cargadores.js`): cada arma con cargador extraíble tiene el suyo, el mismo dibujo que se ve
puesto en el arma (el modelo lo llama desde ahí). El que se saca, el que va en la mano y el que cae al piso son ese
cargador y de esa medida; antes eran un palito de 2 × 10 o tres cubitos apilados. La mano lo agarra cerca de la
base y lo saca y lo mete a lo largo de su eje (inclinado como la empuñadura en las pistolas) y no lo suelta hasta
que encastra. En la mano se dibuja antes que el arma, así el pozo o la empuñadura tapan lo que todavía está adentro
(el de la P90, que va encima, después). En las pistolas y la Uzi, puesto se ve solo la base; suelto, el cuerpo
entero con los agujeros de control. El nuevo trae la bala de arriba asomando. Al piso cae girado como estaba en la
mano, se va acostando y queda tendido sobre su lado largo.

**Manos**: todas son la misma mano con guante (mismo color, el mismo trazo que el resto del cuerpo, mismas
medidas), empuñe lo que empuñe; antes cada agarre tenía su dibujo, con degradados y contornos distintos, y al
recargar la mano cambiaba de color y de forma. La mano libre sigue al antebrazo: la muñeca dobla como mucho 50° y
lo demás lo gira el brazo, que llega a la muñeca y no al centro de la mano. Se abre o se cierra según la fase:
entreabierta mientras viaja, se cierra al agarrar, en puño mientras sostiene un cargador, en pinza con una bala o
un cartucho, abierta al soltar o al palmear, con los dedos hacia abajo en el portacargador. En cuerpo a cuerpo los
dos puños giran con el mango.

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
- El jugador (`js/jugador-dibujo.js` y `js/skins.js`) tiene proporciones reales (unas 6,5 cabezas de alto), se
  dibuja al 116 % de su esqueleto (`ESCALA_JUGADOR`, para quedar a la altura de los zombies; `puntoArma` y la soga
  lo tienen en cuenta) y se
  pinta con sombreado de dos tonos tipo ilustración (`pintura`): la forma en tono oscuro, encima la misma forma
  corrida hacia la luz, un brillo en el borde y contorno del mismo color más oscuro. El sobreviviente es un
  soldado: camisa de combate oliva con parche, portaplacas coyote, pantalón camuflado (`camuflaje`, manchas fijas
  a la tela), rodilleras, botas de desierto, guantes arena, barba corta y shemagh. Los torsos de las otras skins
  se dibujan al 64 % de ancho (perfil) y todas las cabezas al 72 %. La sombra del jugador se pinta en una capa
  aparte (`sombraPareja` en `js/dibujo.js`) para que las piezas encimadas no la manchen.
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
