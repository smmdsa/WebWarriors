import 'phaser';
import { GameConfig } from './config/game.config';

window.addEventListener('load', () => {
  // Crear el contenedor del juego
  const gameContainer = document.createElement('div');
  gameContainer.id = 'game';
  document.body.appendChild(gameContainer);

  // Inicializar el juego
  new Phaser.Game(GameConfig);
}); 