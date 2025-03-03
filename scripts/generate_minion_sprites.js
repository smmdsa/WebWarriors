const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Asegurarse de que el directorio assets existe
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Función para crear un sprite circular
function createCircleSprite(filename, color, size, details = {}) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Dibujar un círculo
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Añadir un borde
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Añadir detalles específicos según el tipo
  if (details.type === 'melee') {
    // Añadir una espada simple
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(size * 0.75, size / 3, size / 3, size / 12);
  } else if (details.type === 'caster') {
    // Añadir una varita mágica
    ctx.fillStyle = '#8888ff';
    ctx.fillRect(size * 0.65, size / 6, size / 12, size / 3);
    
    // Añadir un orbe brillante
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(size * 0.7, size / 6, size / 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Añadir brillo
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (details.type === 'cannon') {
    // Añadir un cañón
    ctx.fillStyle = '#444444';
    ctx.fillRect(size * 0.65, size / 3, size / 2.5, size / 4);
    
    // Añadir detalles del cañón
    ctx.fillStyle = '#222222';
    ctx.fillRect(size * 0.85, size / 3 - 2, size / 10, size / 4 + 4);
  }
  
  // Guardar como PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(assetsDir, filename), buffer);
  
  console.log(`Sprite ${filename} creado con éxito.`);
}

// Crear sprites para minions melee
createCircleSprite('ally_melee_minion.png', '#00ff00', 24, { type: 'melee' }); // Verde para aliados
createCircleSprite('enemy_melee_minion.png', '#ff0000', 24, { type: 'melee' }); // Rojo para enemigos

// Crear sprites para minions caster
createCircleSprite('ally_caster_minion.png', '#88ff88', 24, { type: 'caster' }); // Verde claro para aliados
createCircleSprite('enemy_caster_minion.png', '#ff8888', 24, { type: 'caster' }); // Rojo claro para enemigos

// Crear sprites para minions cannon
createCircleSprite('ally_cannon_minion.png', '#008800', 28, { type: 'cannon' }); // Verde oscuro para aliados
createCircleSprite('enemy_cannon_minion.png', '#880000', 28, { type: 'cannon' }); // Rojo oscuro para enemigos

console.log('Sprites de minions generados con éxito.'); 