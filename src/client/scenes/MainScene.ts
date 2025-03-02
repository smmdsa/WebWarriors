import 'phaser';
import { GameMap } from './GameMap';
import { Player } from '../entities/Player';

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
  private cameraFollowsPlayer: boolean = false;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  
  // Configuración de zoom
  private minZoom: number = 0.5;
  private maxZoom: number = 2.0;
  private currentZoom: number = 1.5;
  private zoomFactor: number = 0.1;
  
  // Elemento de texto para mostrar información de zoom
  private zoomText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Inicializar y precargar el mapa
    this.gameMap = new GameMap(this);
    this.gameMap.preload();
    
    // Crear una textura temporal para el jugador
    this.createPlayerTexture();
  }

  create(): void {
    // Configurar controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as any;
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Crear el mapa
    this.gameMap.create();

    // Crear el jugador en la base aliada (esquina inferior izquierda)
    this.player = new Player(this, 100, 900);
    
    // Configurar la cámara principal
    this.cameras.main.setZoom(this.currentZoom); // Zoom inicial
    this.cameras.main.setBounds(0, 0, 992, 992); // Límites del mapa
    
    // Crear texto para mostrar información de zoom
    this.zoomText = this.add.text(10, 10, `Zoom: ${this.currentZoom.toFixed(2)} [Min: ${this.minZoom} | Max: ${this.maxZoom}]`, {
      font: '16px Arial',
      color: '#ffffff',
      backgroundColor: '#000000'
    });
    this.zoomText.setScrollFactor(0); // Fijar a la cámara
    this.zoomText.setDepth(100); // Asegurar que esté por encima de otros elementos
    
    // Configurar evento para la tecla espacio (alternar seguimiento de cámara)
    this.input.keyboard.on('keydown-SPACE', () => {
      this.cameraFollowsPlayer = !this.cameraFollowsPlayer;
      
      if (this.cameraFollowsPlayer) {
        this.cameras.main.startFollow(this.player);
      } else {
        this.cameras.main.stopFollow();
      }
      
      // Actualizar texto con estado de seguimiento
      this.updateZoomText();
    });
    
    // Inicialmente, la cámara no sigue al jugador
    this.cameras.main.centerOn(496, 496); // Centrar en el medio del mapa
    
    // Prevenir el menú contextual del navegador al hacer clic derecho
    this.input.mouse.disableContextMenu();
    
    // Configurar zoom con la rueda del mouse
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
      // Guardar zoom anterior para comparación
      const previousZoom = this.currentZoom;
      
      // deltaY es positivo cuando se rueda hacia abajo (zoom out)
      // deltaY es negativo cuando se rueda hacia arriba (zoom in)
      if (deltaY > 0) {
        // Zoom out
        this.currentZoom = Math.max(this.minZoom, this.currentZoom - this.zoomFactor);
      } else if (deltaY < 0) {
        // Zoom in
        this.currentZoom = Math.min(this.maxZoom, this.currentZoom + this.zoomFactor);
      }
      
      // Aplicar el nuevo nivel de zoom
      this.cameras.main.setZoom(this.currentZoom);
      
      // Actualizar texto con información de zoom
      this.updateZoomText();
      
      // Mostrar información detallada en la consola
      console.log(`Zoom: ${this.currentZoom.toFixed(2)} | Delta: ${(this.currentZoom - previousZoom).toFixed(2)} | Min: ${this.minZoom} | Max: ${this.maxZoom}`);
    });
    
    // Log inicial de configuración de zoom
    console.log(`Configuración inicial de zoom - Actual: ${this.currentZoom} | Min: ${this.minZoom} | Max: ${this.maxZoom} | Factor: ${this.zoomFactor}`);
  }

  update(): void {
    // Mover la cámara con las flechas cuando no está siguiendo al jugador
    if (!this.cameraFollowsPlayer) {
      const cameraSpeed = 10;
      
      if (this.cursors.up.isDown) {
        this.cameras.main.scrollY -= cameraSpeed;
      }
      if (this.cursors.down.isDown) {
        this.cameras.main.scrollY += cameraSpeed;
      }
      if (this.cursors.left.isDown) {
        this.cameras.main.scrollX -= cameraSpeed;
      }
      if (this.cursors.right.isDown) {
        this.cameras.main.scrollX += cameraSpeed;
      }
    }
  }
  
  private updateZoomText(): void {
    // Actualizar el texto con la información actual de zoom y seguimiento
    const followText = this.cameraFollowsPlayer ? "Siguiendo al jugador" : "Cámara libre";
    this.zoomText.setText(`Zoom: ${this.currentZoom.toFixed(2)} [Min: ${this.minZoom} | Max: ${this.maxZoom}] | ${followText}`);
  }
  
  private createPlayerTexture(): void {
    // Crear una textura temporal para el jugador (un círculo azul)
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0000ff, 1); // Color azul
    graphics.fillCircle(16, 16, 16); // Círculo centrado en (16,16) con radio 16
    
    // Generar textura a partir del gráfico
    graphics.generateTexture('player', 32, 32);
    
    // Destruir el gráfico temporal
    graphics.destroy();
  }
} 