import 'phaser';
import { GameMap } from './GameMap';
import { Player } from '../entities/Player';
import { MinionManager, MinionSubtype } from '../managers/MinionManager';
import { PlayerHUD } from '../ui/PlayerHUD';
import { LevelTool } from '../tools/LevelTool';

export class MainScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private gameMap!: GameMap;
  private player!: Player;
  private minionManager!: MinionManager;
  private cameraFollowsPlayer: boolean = false;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  
  // Configuración de zoom
  private minZoom: number = 1.0;
  private maxZoom: number = 3.0;
  private currentZoom: number = 2.25;
  private zoomFactor: number = 0.05;
  
  // Elemento de texto para mostrar información de zoom
  private zoomText!: Phaser.GameObjects.Text;
  
  private playerHUD!: PlayerHUD;
  
  // Grupos de física
  private minionsGroup!: Phaser.Physics.Arcade.Group;
  
  // Herramienta de nivel
  private levelTool!: LevelTool;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Inicializar y precargar el mapa
    this.gameMap = new GameMap(this);
    this.gameMap.preload();
    
    // Crear una textura temporal para el jugador
    this.createPlayerTexture();
    
    // Crear texturas para los minions
    this.createMinionTextures();
    
    // Crear texturas para los iconos de habilidades
    this.createSkillIcons();
  }

  create(): void {
    // Configurar controles
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as any;
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // Crear el mapa
    this.gameMap.create();
    
    // Crear el jugador en el centro del mapa
    const mapWidth = this.gameMap.getWidth();
    const mapHeight = this.gameMap.getHeight();
    this.player = new Player(this, mapWidth / 2, mapHeight / 2);
    
    // Habilitar física para el jugador
    this.physics.world.enable(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(32, 32); // Ajustar tamaño de colisión
    
    // Crear grupo de física para minions
    this.minionsGroup = this.physics.add.group({
      collideWorldBounds: true,
      bounceX: 0.1,
      bounceY: 0.1
    });
    
    // Crear el HUD del jugador
    this.playerHUD = new PlayerHUD(this, this.player);
    
    // Configurar la cámara
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setZoom(this.currentZoom);
    
    // Crear texto para mostrar información de zoom
    this.zoomText = this.add.text(10, 10, `Zoom: ${this.currentZoom.toFixed(2)}`, {
      font: '16px Arial',
      color: '#ffffff',
      backgroundColor: '#000000'
    });
    this.zoomText.setScrollFactor(0); // Fijar a la cámara
    this.zoomText.setDepth(100);
    
    // Inicializar el gestor de minions
    this.minionManager = new MinionManager(this);
    
    // Inicializar la herramienta de nivel
    this.levelTool = new LevelTool(this, this.minionManager);
    
    // Configurar colisiones
    this.setupCollisions();
    
    // Configurar evento para la tecla espacio (alternar seguimiento de cámara)
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => {
        this.cameraFollowsPlayer = !this.cameraFollowsPlayer;
        
        if (this.cameraFollowsPlayer) {
          this.cameras.main.startFollow(this.player);
        } else {
          this.cameras.main.stopFollow();
        }
        
        console.log(`Seguimiento de cámara: ${this.cameraFollowsPlayer ? 'Activado' : 'Desactivado'}`);
      });
    }
    
    // Prevenir el menú contextual del navegador al hacer clic derecho
    if (this.input.mouse) {
      this.input.mouse.disableContextMenu();
    }
    
    // Configurar zoom con la rueda del mouse
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
      // Ajustar el zoom según la dirección de la rueda
      if (deltaY > 0) {
        // Zoom out
        this.currentZoom = Math.max(this.minZoom, this.currentZoom - this.zoomFactor);
      } else {
        // Zoom in
        this.currentZoom = Math.min(this.maxZoom, this.currentZoom + this.zoomFactor);
      }
      
      // Aplicar el nuevo zoom
      this.cameras.main.setZoom(this.currentZoom);
      
      // Actualizar el texto de zoom
      this.updateZoomText();
      
      console.log(`Zoom: ${this.currentZoom.toFixed(2)}`);
    });
    
    // Iniciar con la cámara siguiendo al jugador
    this.cameraFollowsPlayer = true;
    this.cameras.main.startFollow(this.player);
    
    // Actualizar el texto de zoom inicial
    this.updateZoomText();
    
    // Configurar evento para procesar comandos de consola
    this.setupConsoleCommands();
  }

  update(time: number, delta: number): void {
    // Mover la cámara con las teclas de flecha si no está siguiendo al jugador
    if (!this.cameraFollowsPlayer) {
      const camera = this.cameras.main;
      const speed = 10;
      
      if (this.cursors.left?.isDown ) {
        camera.scrollX -= speed / this.currentZoom;
      }
      if (this.cursors.right?.isDown ) {
        camera.scrollX += speed / this.currentZoom;
      }
      if (this.cursors.up?.isDown ) {
        camera.scrollY -= speed / this.currentZoom;
      }
      if (this.cursors.down?.isDown ) {
        camera.scrollY += speed / this.currentZoom;
      }
    }
    
    // Actualizar colisionadores de minions
    this.updateMinionsColliders();
    
    // Actualizar el gestor de minions
    this.minionManager.update();
    
    // Actualizar el HUD del jugador
    this.playerHUD.update();
    
    // Actualizar la herramienta de nivel
    if (this.levelTool) {
      this.levelTool.update();
    }
  }
  
  private updateZoomText(): void {
    if (this.zoomText) {
      this.zoomText.setText(`Zoom: ${this.currentZoom.toFixed(2)}`);
    }
  }
  
  private createPlayerTexture(): void {
    // Crear un gráfico para el jugador
    const graphics = this.add.graphics();
    
    // Dibujar un círculo azul
    graphics.fillStyle(0x0000ff, 1);
    graphics.fillCircle(16, 16, 16);
    
    // Añadir un borde blanco
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeCircle(16, 16, 16);
    
    // Generar textura
    graphics.generateTexture('player', 32, 32);
    
    // Limpiar el gráfico
    graphics.destroy();
  }
  
  private createMinionTextures(): void {
    // Crear gráficos para los minions aliados
    
    // Minion melee aliado (verde con espada)
    const allyMeleeGraphics = this.add.graphics();
    allyMeleeGraphics.fillStyle(0x00aa00, 1); // Verde oscuro
    allyMeleeGraphics.fillCircle(16, 16, 12);
    allyMeleeGraphics.lineStyle(2, 0xffffff, 1);
    allyMeleeGraphics.strokeCircle(16, 16, 12);
    
    // Añadir una espada simple
    allyMeleeGraphics.lineStyle(2, 0xcccccc, 1);
    allyMeleeGraphics.moveTo(16, 8);
    allyMeleeGraphics.lineTo(16, 24);
    allyMeleeGraphics.moveTo(12, 12);
    allyMeleeGraphics.lineTo(20, 12);
    
    // Generar textura
    if (allyMeleeGraphics.scene) {
      allyMeleeGraphics.generateTexture('ally_melee_minion', 32, 32);
    }
    allyMeleeGraphics.destroy();
    
    // Minion caster aliado (verde claro con varita)
    const allyCasterGraphics = this.add.graphics();
    allyCasterGraphics.fillStyle(0x00ff00, 1); // Verde claro
    allyCasterGraphics.fillCircle(16, 16, 12);
    allyCasterGraphics.lineStyle(2, 0xffffff, 1);
    allyCasterGraphics.strokeCircle(16, 16, 12);
    
    // Añadir una varita mágica
    allyCasterGraphics.lineStyle(2, 0xcccccc, 1);
    allyCasterGraphics.moveTo(16, 10);
    allyCasterGraphics.lineTo(22, 4);
    
    // Añadir un orbe brillante
    allyCasterGraphics.fillStyle(0x00ffff, 1);
    allyCasterGraphics.fillCircle(22, 4, 3);
    
    // Generar textura
    if (allyCasterGraphics.scene) {
      allyCasterGraphics.generateTexture('ally_caster_minion', 32, 32);
    }
    allyCasterGraphics.destroy();
    
    // Minion cannon aliado (verde muy oscuro con cañón)
    const allyCannonGraphics = this.add.graphics();
    allyCannonGraphics.fillStyle(0x006600, 1); // Verde muy oscuro
    allyCannonGraphics.fillCircle(16, 16, 14);
    allyCannonGraphics.lineStyle(2, 0xffffff, 1);
    allyCannonGraphics.strokeCircle(16, 16, 14);
    
    // Añadir un cañón
    allyCannonGraphics.fillStyle(0x333333, 1);
    allyCannonGraphics.fillRect(12, 8, 8, 16);
    allyCannonGraphics.lineStyle(1, 0xffffff, 1);
    allyCannonGraphics.strokeRect(12, 8, 8, 16);
    
    // Generar textura
    if (allyCannonGraphics.scene) {
      allyCannonGraphics.generateTexture('ally_cannon_minion', 32, 32);
    }
    allyCannonGraphics.destroy();
    
    // Crear gráficos para los minions enemigos
    
    // Minion melee enemigo (rojo con espada)
    const enemyMeleeGraphics = this.add.graphics();
    enemyMeleeGraphics.fillStyle(0xaa0000, 1); // Rojo oscuro
    enemyMeleeGraphics.fillCircle(16, 16, 12);
    enemyMeleeGraphics.lineStyle(2, 0xffffff, 1);
    enemyMeleeGraphics.strokeCircle(16, 16, 12);
    
    // Añadir una espada simple
    enemyMeleeGraphics.lineStyle(2, 0xcccccc, 1);
    enemyMeleeGraphics.moveTo(16, 8);
    enemyMeleeGraphics.lineTo(16, 24);
    enemyMeleeGraphics.moveTo(12, 12);
    enemyMeleeGraphics.lineTo(20, 12);
    
    // Generar textura
    if (enemyMeleeGraphics.scene) {
      enemyMeleeGraphics.generateTexture('enemy_melee_minion', 32, 32);
    }
    enemyMeleeGraphics.destroy();
    
    // Minion caster enemigo (rojo claro con varita)
    const enemyCasterGraphics = this.add.graphics();
    enemyCasterGraphics.fillStyle(0xff0000, 1); // Rojo claro
    enemyCasterGraphics.fillCircle(16, 16, 12);
    enemyCasterGraphics.lineStyle(2, 0xffffff, 1);
    enemyCasterGraphics.strokeCircle(16, 16, 12);
    
    // Añadir una varita mágica
    enemyCasterGraphics.lineStyle(2, 0xcccccc, 1);
    enemyCasterGraphics.moveTo(16, 10);
    enemyCasterGraphics.lineTo(22, 4);
    
    // Añadir un orbe brillante
    enemyCasterGraphics.fillStyle(0xff00ff, 1);
    enemyCasterGraphics.fillCircle(22, 4, 3);
    
    // Generar textura
    if (enemyCasterGraphics.scene) {
      enemyCasterGraphics.generateTexture('enemy_caster_minion', 32, 32);
    }
    enemyCasterGraphics.destroy();
    
    // Minion cannon enemigo (rojo muy oscuro con cañón)
    const enemyCannonGraphics = this.add.graphics();
    enemyCannonGraphics.fillStyle(0x660000, 1); // Rojo muy oscuro
    enemyCannonGraphics.fillCircle(16, 16, 14);
    enemyCannonGraphics.lineStyle(2, 0xffffff, 1);
    enemyCannonGraphics.strokeCircle(16, 16, 14);
    
    // Añadir un cañón
    enemyCannonGraphics.fillStyle(0x333333, 1);
    enemyCannonGraphics.fillRect(12, 8, 8, 16);
    enemyCannonGraphics.lineStyle(1, 0xffffff, 1);
    enemyCannonGraphics.strokeRect(12, 8, 8, 16);
    
    // Generar textura
    if (enemyCannonGraphics.scene) {
      enemyCannonGraphics.generateTexture('enemy_cannon_minion', 32, 32);
    }
    enemyCannonGraphics.destroy();
  }

  /**
   * Crea texturas para los iconos de habilidades
   */
  private createSkillIcons(): void {
    // Icono de habilidad Q (ataque)
    const qSkillGraphics = this.add.graphics();
    qSkillGraphics.fillStyle(0x0088ff, 1);
    qSkillGraphics.fillCircle(16, 16, 16);
    qSkillGraphics.lineStyle(2, 0xffffff, 1);
    qSkillGraphics.strokeCircle(16, 16, 16);
    
    // Añadir un símbolo de ataque
    qSkillGraphics.lineStyle(3, 0xffffff, 1);
    qSkillGraphics.moveTo(8, 8);
    qSkillGraphics.lineTo(24, 24);
    qSkillGraphics.moveTo(8, 24);
    qSkillGraphics.lineTo(24, 8);
    
    // Generar textura
    qSkillGraphics.generateTexture('skill_q', 32, 32);
    qSkillGraphics.destroy();
    
    // Icono de habilidad W (escudo)
    const wSkillGraphics = this.add.graphics();
    wSkillGraphics.fillStyle(0x00aaff, 1);
    wSkillGraphics.fillCircle(16, 16, 16);
    wSkillGraphics.lineStyle(2, 0xffffff, 1);
    wSkillGraphics.strokeCircle(16, 16, 16);
    
    // Añadir un símbolo de escudo
    wSkillGraphics.lineStyle(3, 0xffffff, 1);
    wSkillGraphics.beginPath();
    wSkillGraphics.moveTo(16, 6);
    wSkillGraphics.lineTo(8, 10);
    wSkillGraphics.lineTo(8, 20);
    wSkillGraphics.lineTo(16, 26);
    wSkillGraphics.lineTo(24, 20);
    wSkillGraphics.lineTo(24, 10);
    wSkillGraphics.closePath();
    wSkillGraphics.strokePath();
    
    // Generar textura
    wSkillGraphics.generateTexture('skill_w', 32, 32);
    wSkillGraphics.destroy();
    
    // Icono de habilidad E (movimiento)
    const eSkillGraphics = this.add.graphics();
    eSkillGraphics.fillStyle(0x00ffaa, 1);
    eSkillGraphics.fillCircle(16, 16, 16);
    eSkillGraphics.lineStyle(2, 0xffffff, 1);
    eSkillGraphics.strokeCircle(16, 16, 16);
    
    // Añadir un símbolo de movimiento
    eSkillGraphics.lineStyle(3, 0xffffff, 1);
    eSkillGraphics.moveTo(8, 16);
    eSkillGraphics.lineTo(24, 16);
    eSkillGraphics.moveTo(20, 10);
    eSkillGraphics.lineTo(24, 16);
    eSkillGraphics.lineTo(20, 22);
    
    // Generar textura
    eSkillGraphics.generateTexture('skill_e', 32, 32);
    eSkillGraphics.destroy();
    
    // Icono de habilidad R (ultimate)
    const rSkillGraphics = this.add.graphics();
    rSkillGraphics.fillStyle(0xff0000, 1);
    rSkillGraphics.fillCircle(16, 16, 16);
    rSkillGraphics.lineStyle(2, 0xffffff, 1);
    rSkillGraphics.strokeCircle(16, 16, 16);
    
    // Añadir un símbolo de ultimate
    rSkillGraphics.lineStyle(3, 0xffffff, 1);
    rSkillGraphics.beginPath();
    rSkillGraphics.moveTo(16, 6);
    rSkillGraphics.lineTo(10, 12);
    rSkillGraphics.lineTo(10, 20);
    rSkillGraphics.lineTo(16, 26);
    rSkillGraphics.lineTo(22, 20);
    rSkillGraphics.lineTo(22, 12);
    rSkillGraphics.closePath();
    rSkillGraphics.strokePath();
    
    // Añadir un efecto brillante
    rSkillGraphics.lineStyle(1, 0xffff00, 1);
    rSkillGraphics.beginPath();
    rSkillGraphics.moveTo(10, 10);
    rSkillGraphics.lineTo(22, 22);
    rSkillGraphics.moveTo(10, 22);
    rSkillGraphics.lineTo(22, 10);
    rSkillGraphics.strokePath();
    
    // Generar textura
    rSkillGraphics.generateTexture('skill_r', 32, 32);
    rSkillGraphics.destroy();
  }

  /**
   * Configura las colisiones entre entidades
   */
  private setupCollisions(): void {
    // Añadir los minions existentes al grupo de física
    this.updateMinionsColliders();
    
    // Configurar colisión entre jugador y minions con menor intensidad
    this.physics.add.collider(
      this.player, 
      this.minionsGroup,
      undefined,
      (player, minion) => {
        // Reducir el efecto de la colisión entre jugador y minions
        // El jugador puede empujar a los minions
        return true;
      },
      this
    );
    
    // Configurar colisión entre minions con menor fuerza
    this.physics.add.collider(
      this.minionsGroup, 
      this.minionsGroup,
      undefined,
      (obj1, obj2) => {
        // Reducir el efecto de la colisión entre minions
        // Devolver false para algunos minions para permitir que se superpongan parcialmente
        // Esto ayuda a evitar bloqueos en el movimiento
        
        // Obtener los minions
        const minion1 = obj1 as any;
        const minion2 = obj2 as any;
        
        // Si ambos minions son del mismo tipo (aliados o enemigos), 
        // permitir superposición parcial (80% de las veces)
        if (minion1.minionType === minion2.minionType) {
          return Math.random() > 0.8;
        }
        
        // Si son de tipos diferentes, mantener la colisión pero con 20% de probabilidad de pasar
        return Math.random() > 0.2;
      }
    );
  }
  
  /**
   * Actualiza los colisionadores de los minions
   */
  private updateMinionsColliders(): void {
    // Obtener todos los minions del manager
    const minions = this.minionManager.getMinions();
    
    // Si no hay grupo de minions, crearlo
    if (!this.minionsGroup) {
      this.minionsGroup = this.physics.add.group({
        bounceX: 0.1,
        bounceY: 0.1,
        collideWorldBounds: true
      });
    }
    
    // Añadir los minions al grupo de física
    for (const minion of minions) {
      if (!this.minionsGroup.contains(minion)) {
        this.minionsGroup.add(minion);
        
        // Ajustar propiedades físicas para mejorar el movimiento
        const body = minion.body as Phaser.Physics.Arcade.Body;
        if (body) {
          // Reducir el tamaño del cuerpo de colisión para permitir más movimiento
          body.setSize(minion.width * 0.6, minion.height * 0.6);
          body.setOffset(minion.width * 0.2, minion.height * 0.2);
          
          // Ajustar propiedades físicas
          body.setDrag(50, 50);
          body.setFriction(0, 0);
          body.setBounce(0.1, 0.1);
          body.setMaxVelocity(200, 200);
        }
      }
    }
  }

  /**
   * Configura los comandos de consola
   */
  private setupConsoleCommands(): void {
    // Añadir función para procesar comandos de texto
    (window as any).processCommand = (command: string) => {
      // Eliminar el prefijo '/' si existe
      const cleanCommand = command.startsWith('/') ? command.substring(1) : command;
      
      if (cleanCommand.startsWith('qa-mode')) {
        const enabled = cleanCommand.includes('on');
        (window as any).qaMode(enabled);
        return `QA Mode ${enabled ? 'activado' : 'desactivado'}`;
      } else if (cleanCommand === 'show-paths') {
        return (window as any).showPaths();
      } else if (cleanCommand === 'show-spawns') {
        return (window as any).showSpawns();
      }
      
      return `Comando desconocido: ${command}`;
    };
    
    // No sobrescribimos console.log ya que causa el error de expresión regular
    // En su lugar, exponemos una función global para ejecutar comandos
    (window as any).cmd = (command: string) => {
      const result = (window as any).processCommand(command);
      console.log(result);
      return result;
    };
    
    console.log('Comandos de consola configurados. Usa "cmd(\'qa-mode on\')" para activar el modo QA.');
    console.log('Otros comandos disponibles: "cmd(\'show-paths\')", "cmd(\'show-spawns\')"');
  }
} 