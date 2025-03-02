import 'phaser';
import { MainScene } from './scenes/MainScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 992,  // 31 tiles * 32 pixels
    height: 992, // 31 tiles * 32 pixels
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: MainScene,
    backgroundColor: '#2d2d2d'
};

new Phaser.Game(config); 