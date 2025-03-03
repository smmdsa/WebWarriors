### Respuesta a la Query del Usuario

Para responder a tu solicitud, he creado un **backlog completo de tareas** para desarrollar **WebWarriors**, un MOBA web inspirado en *League of Legends*, con un enfoque en simplicidad y accesibilidad. Este plan está diseñado para ser seguido de forma lineal, desde los cimientos hasta el lanzamiento, asegurando que cada paso sea lógico y construya sobre el anterior. Aumenté el número de personajes a **20**, con un mínimo de **2 por rol/clase**, y añadí un sistema de bots para rellenar partidas si el matchmaking excede los 5 minutos, como parte del MVP (Producto Mínimo Viable). El desarrollo utilizará JavaScript con TypeScript, Phaser.js para el cliente y Socket.io para la conexión multijugador.

A continuación, te presento el **backlog detallado de tareas**, organizado en fases para garantizar un desarrollo estructurado:

---

## Backlog Completo de Tareas para el Desarrollo de WebWarriors

### Fase 1: Configuración y Preparación del Entorno
1. ✅ **Configurar el entorno de desarrollo**
   - ✅ Instalar Node.js y npm para gestionar dependencias y el servidor.
   - ✅ Configurar un proyecto con TypeScript para un código más robusto.
   - ✅ Instalar Phaser.js (motor gráfico 2D) y Socket.io (conexión multijugador).
   - ✅ Crear un servidor básico con Node.js para pruebas locales.

2. ✅ **Configurar el repositorio y herramientas**
   - ✅ Crear un repositorio en GitHub para control de versiones.
   - ✅ Establecer ramas `develop` (desarrollo) y `main` (producción).
   - ✅ Configurar ESLint y Prettier para mantener el código limpio y consistente.

---

### Fase 2: Desarrollo del Cliente (Phaser.js)
3. ✅ **Crear la estructura básica del juego**
   - ✅ Inicializar una escena en Phaser.js con un lienzo vacío.
   - ✅ Configurar la cámara (vista superior) y los controles básicos (teclado WASD y ratón).

4. ✅ **Diseñar y crear el mapa del juego**
   - ✅ Diseñar un mapa 2D simple con tres carriles (superior, medio, inferior) y bases en cada extremo.
   - ✅ Usar tiles básicos (caminos, hierba, ríos) para el diseño visual.
   - ✅ Añadir estructuras estáticas: bases, Nexus (salud: 2000), y posiciones para torres.
   - ✅ Implementar un río diagonal que cruza el mapa.
   - ✅ Crear caminos perimetrales y diagonales de 3 tiles de ancho.
   - ✅ Posicionar correctamente las bases en esquinas opuestas.

5. ✅ **Implementar el movimiento de personajes**
   - ✅ Crear un sprite base (32x32 píxeles) para personajes jugables.
   - ✅ Programar movimiento con clic derecho para desplazamiento y posicionamiento.
   - ✅ Añadir indicador visual de destino de movimiento.
   - ✅ Implementar rotación del personaje hacia la dirección de movimiento.
   - ✅ Configurar control de cámara con teclas de flecha y tecla espacio para seguimiento.
   - ✅ Implementar zoom in/zoom out con la rueda del mouse.
   - ✅ Añadir barra de salud y sistema básico de habilidades (Q, W).

6. ✅ **Añadir minions**
   - ✅ Diseñar sprites temporales para minions aliados y enemigos con diferentes tipos (melee, caster, cannon).
   - ✅ Implementar estructura base para la clase Minion con movimiento y ataque.
   - ✅ Crear MinionManager para gestionar la generación y actualización de minions.
   - ✅ Implementar generación automática de minions cada 30 segundos desde las bases.
   - ✅ Programar rutas predefinidas para que avancen por los carriles.
   - ✅ Añadir lógica de ataque básico de minions a enemigos cercanos.
   - ✅ Implementar sistema de oleadas con 4 minions por carril (2 melee, 2 caster).
   - ✅ Añadir minion cannon especial cada 5 oleadas.
   - ✅ Implementar sistema de oro al matar minions (25 oro para melee, 12 para caster, 50 para cannon).
   - ✅ Añadir contador de minions matados para el jugador.
   - ✅ Implementar cambio de objetivo de minions cuando el jugador ataca a un campeón enemigo.
   - ✅ Mejorar comportamiento de minions para que no se bloqueen entre sí durante ataques.
   - ✅ Ajustar rangos de ataque: caster (3 unidades/96 píxeles), cannon (3.5 unidades/112 píxeles).
   - ✅ Implementar movimiento continuo durante ataques (velocidad reducida al 30%).
   - ✅ Añadir sistema de notificación cuando el objetivo muere.
   - ✅ Corregir errores de referencia nula en métodos de ataque.

7. ✅ **Implementar sistema de progresión del jugador**
   - ✅ Añadir sistema de experiencia para el jugador.
   - ✅ Implementar niveles (máximo nivel 20) con umbrales de experiencia.
   - ✅ Ganar experiencia por minions que mueren cerca del jugador.
   - ✅ Mejorar estadísticas al subir de nivel (salud, mana, daño, resistencias).
   - ✅ Añadir estadísticas base: velocidad, daño físico, daño mágico, daño verdadero, vida, mana, resistencias.
   - ✅ Implementar sistema de oro para comprar items.
   - ✅ Añadir visualización de radio de experiencia.

8. ✅ **Implementar sistema de items**
   - ✅ Crear una lista de items básicos con diferentes efectos en las estadísticas.
   - ✅ Implementar la compra de items con el oro ganado.
   - ✅ Añadir interfaz para visualizar los items comprados.
   - ✅ Implementar mejora de estadísticas basada en los items adquiridos.
   - ✅ Añadir efectos visuales para la compra de items.
   - ✅ Implementar mensajes de error cuando no hay suficiente oro.
   - 🔄 **Mejoras futuras del sistema de items**:
     - Implementar una tienda visual con interfaz gráfica.
     - Añadir items con efectos especiales o habilidades activas.
     - Implementar sistema de inventario limitado.
     - Crear árboles de items para combinar items básicos en más poderosos.

9. 🔄 **Implementar sistema de personajes** [EN PROGRESO]
   - Diseñar una arquitectura modular para cargar personajes desde archivos de configuración.
   - Crear un sistema de archivos JSON para definir estadísticas y habilidades de personajes.
   - Implementar carga dinámica de personajes basada en selección del jugador.
   - Añadir diferentes tipos de ataques:
     - Ataques cuerpo a cuerpo (melee)
     - Ataques a distancia (ranged)
     - Daño físico, mágico y verdadero
   - Implementar efectos especiales para habilidades:
     - Aturdimiento (stun): impide movimiento y uso de habilidades
     - Escudos: absorben daño durante un tiempo limitado
     - Mejoras de estadísticas temporales para aliados (velocidad, ataque, etc.)
     - Curación de aliados
   - Añadir sistema de enfriamiento (cooldown) para habilidades.
   - Implementar efectos visuales para cada tipo de habilidad.

10. 🔄 **Implementar torres defensivas** [EN PROGRESO]
    - Crear sprites para torres (salud: 1000) y posicionarlas (dos por carril por equipo).
    - Programar ataque automático a minions y personajes enemigos dentro del rango.
    - Implementar destrucción de torres cuando su salud llegue a 0.
    - ⚠️ **Problema pendiente:** Las torres actualmente no disparan correctamente a minions ni al jugador enemigo.
    - ✅ Ajuste realizado: Las torres ya tienen física y son completamente inmóviles.

11. **Crear personajes jugables (20 personajes, mínimo 2 por rol)**
    - Definir roles: Tanque, Dealer de Daño, Soporte, Asesino, Mago (mínimo 2 por rol, total 20).
      - Ejemplo: 4 Tanques, 6 Dealers de Daño, 4 Soportes, 4 Asesinos, 2 Magos.
    - Diseñar sprites únicos para cada personaje.
    - Asignar estadísticas base (salud, daño, velocidad).
    - Programar dos habilidades únicas por personaje (con enfriamientos de 5-15 segundos).
    - Asegurar variedad estratégica entre roles y personajes.

12. **Implementar sistema de items**
    - Crear una tienda de items accesible para el jugador.
    - Diseñar items que mejoren diferentes estadísticas (daño, resistencia, velocidad, etc.).
    - Implementar la compra de items con el oro ganado.
    - Limitar el número de items que un jugador puede llevar.

13. **Añadir el Nexus y condición de victoria**
    - Programar ataques de minions al Nexus si llegan a la base enemiga.
    - Definir victoria: el equipo que destruya el Nexus enemigo gana.

14. **Implementar interfaz de usuario (UI)**
    - Añadir barras de salud visibles para personajes, torres y Nexus.
    - Mostrar enfriamientos de habilidades en pantalla.
    - Crear un minimapa simple para mostrar posiciones de aliados, enemigos y estructuras.
    - Añadir un chat básico para comunicación entre jugadores.

15. **Optimizar el rendimiento del cliente**
    - Reducir el tamaño de assets (usar pixel art o sprites simples).
    - Implementar pooling de objetos para minions y efectos visuales.
    - Probar rendimiento en navegadores comunes (Chrome, Firefox).

---

### Fase 3: Desarrollo del Servidor (Node.js con Socket.io)
16. **Configurar el servidor multijugador**
    - Inicializar un servidor Node.js con Socket.io.
    - Crear salas de juego para soportar múltiples partidas simultáneas.
    - Gestionar conexiones/desconexiones de jugadores.

17. **Sincronizar el estado del juego**
    - Enviar actualizaciones del estado (posiciones, salud, acciones) a los clientes 30 veces por segundo.
    - Usar interpolación para suavizar movimientos en el cliente.

18. **Implementar lógica de juego en el servidor**
    - Controlar generación y movimiento de minions.
    - Calcular daño a torres y Nexus.
    - Gestionar colisiones y ataques entre entidades (jugadores, minions, torres).

19. **Implementar sistema de matchmaking**
    - Crear una cola de jugadores para emparejar en partidas de 5v5.
    - Si no se encuentra partida en 5 minutos, iniciar una con bots.

20. **Añadir bots para rellenar partidas**
    - Desarrollar IA básica para bots (moverse por carriles, atacar enemigos cercanos).
    - Programar bots para unirse automáticamente a partidas incompletas tras 5 minutos de matchmaking.

21. **Implementar seguridad básica**
    - Validar entradas del cliente en el servidor (evitar movimientos imposibles).
    - Añadir medidas anti-cheat simples (límites de velocidad, rango de habilidades).

---

### Fase 4: Integración y Pruebas
22. **Integrar cliente y servidor**
    - Conectar Phaser.js con Socket.io para enviar/recibir acciones en tiempo real.
    - Sincronizar movimientos, habilidades y estado del juego entre clientes.

23. **Implementar sistema de cuentas**
    - Crear un sistema básico de registro/login para guardar progresión.
    - Usar una base de datos simple (ej. MongoDB) para almacenar datos de jugadores.

24. **Añadir sonidos y música**
    - Implementar efectos de sonido (ataques, habilidades, destrucción de torres).
    - Añadir música de fondo para ambientación.

25. **Realizar pruebas exhaustivas**
    - Probar jugabilidad, equilibrio de personajes y mecánicas.
    - Testear rendimiento y latencia en diferentes conexiones.
    - Corregir bugs y optimizar según resultados.

26. **Preparar para el lanzamiento**
    - Configurar un servidor de producción (ej. AWS, Heroku).
    - Implementar despliegue continuo con GitHub Actions.
    - Lanzar una beta pública para feedback inicial.

---

### Fase 5: Post-Lanzamiento
27. **Monitorear y mantener el juego**
    - Supervisar rendimiento del servidor y reportes de errores.
    - Corregir bugs reportados por los jugadores.
    - Implementar mejoras basadas en feedback.

28. **Expandir contenido**
    - Añadir más personajes o mapas según demanda.
    - Implementar cosméticos (skins) como opción de monetización freemium.

29. ✅ **Herramientas de desarrollo y QA**
    - ✅ Implementar modo QA activable mediante comando de consola (/qa-mode on).
    - ✅ Crear herramienta de nivel (LevelTool) para ajustar puntos de generación y rutas.
    - ✅ Añadir comandos para mostrar rutas y puntos de generación (/show-paths, /show-spawns).
    - ✅ Implementar selección de carriles mediante teclas numéricas (1, 2, 3).
    - ✅ Añadir funcionalidad para detener la generación de minions durante pruebas.
    - ✅ Permitir ajuste de posiciones de puntos de generación y rutas en tiempo real.
    - ✅ Implementar sistema de comandos de consola para facilitar pruebas.

---

### Resumen
Este backlog asegura que **WebWarriors** se desarrolle de manera lineal y eficiente, desde la configuración inicial hasta un MVP funcional. Con **20 personajes** (mínimo 2 por rol), un mapa 2D simple, y mecánicas que incluyen subir de nivel y comprar items, el juego será accesible y optimizado para navegadores. El sistema de personajes modular permitirá añadir nuevos campeones fácilmente mediante archivos de configuración, sin necesidad de modificar la lógica del juego. El sistema de matchmaking con bots garantiza partidas rápidas, incluso con pocos jugadores. Siguiendo estas tareas en orden, tendrás un MOBA web competitivo listo para captar la atención de los fans de *League of Legends*. ¡A desarrollar!