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
    this.cameras.main.setZoom(1.5); // Zoom más cercano al personaje
    this.cameras.main.setBounds(0, 0, 992, 992); // Límites del mapa
    
    // Configurar evento para la tecla espacio (alternar seguimiento de cámara)
    this.input.keyboard.on('keydown-SPACE', () => {
      this.cameraFollowsPlayer = !this.cameraFollowsPlayer;
      
      if (this.cameraFollowsPlayer) {
        this.cameras.main.startFollow(this.player);
      } else {
        this.cameras.main.stopFollow();
      }
    });
    
    // Inicialmente, la cámara no sigue al jugador
    this.cameras.main.centerOn(496, 496); // Centrar en el medio del mapa
    
    // Prevenir el menú contextual del navegador al hacer clic derecho
    this.input.mouse.disableContextMenu();
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