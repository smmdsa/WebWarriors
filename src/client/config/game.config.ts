import 'phaser';
import { MainScene } from '../scenes/MainScene';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280, // Cambiado a resolución estándar 16:9
  height: 720,
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
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  }
}; 