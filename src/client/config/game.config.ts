import 'phaser';
import { MainScene } from '../scenes/MainScene';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1000, // Según el GDD, mapa de 1000x1000 píxeles
  height: 1000,
  parent: 'game',
  backgroundColor: '#2d2d2d',
  scene: MainScene,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // Sin gravedad para vista superior
      debug: process.env.NODE_ENV === 'development'
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
}; 