import 'phaser';
import { GameMap } from './GameMap';

export class MainScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private gameMap!: GameMap;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Inicializar y precargar el mapa
    this.gameMap = new GameMap(this);
    this.gameMap.preload();
  }

  create(): void {
    // Configurar controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as any;

    // Crear el mapa
    this.gameMap.create();

    // Configurar la cámara principal
    this.cameras.main.setZoom(0.75); // Zoom out inicial para ver más del mapa
    this.cameras.main.centerOn(496, 496); // Centrar en el medio del mapa (992/2)

    // Crear un rectángulo temporal para representar el jugador
    const tempPlayer = this.add.rectangle(496, 496, 32, 32, 0xff0000);
    this.physics.add.existing(tempPlayer);

    // Hacer que la cámara siga al jugador
    this.cameras.main.startFollow(tempPlayer);
  }

  update(): void {
    // Aquí implementaremos la lógica de movimiento cuando tengamos los sprites
    // Por ahora solo mostramos que los controles funcionan
    if (this.wasdKeys.W.isDown || this.cursors.up.isDown) {
      console.log('Moving up');
    }
    if (this.wasdKeys.S.isDown || this.cursors.down.isDown) {
      console.log('Moving down');
    }
    if (this.wasdKeys.A.isDown || this.cursors.left.isDown) {
      console.log('Moving left');
    }
    if (this.wasdKeys.D.isDown || this.cursors.right.isDown) {
      console.log('Moving right');
    }
  }
} 