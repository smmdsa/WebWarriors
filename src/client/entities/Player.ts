import Phaser from 'phaser';

export class Player extends Phaser.GameObjects.Sprite {
  private speed: number = 150;
  private targetPosition: Phaser.Math.Vector2 | null = null;
  private isMoving: boolean = false;
  private health: number = 1000;
  private maxHealth: number = 1000;
  private attackRange: number = 100;
  private attackDamage: number = 50;
  private attackCooldown: number = 1000; // 1 segundo
  private lastAttackTime: number = 0;
  private healthBar: Phaser.GameObjects.Graphics;
  private moveTarget: Phaser.GameObjects.Graphics;
  private currentMoveTargetTween: Phaser.Tweens.Tween | null = null;
  
  // Habilidades
  private skill1Cooldown: number = 5000; // 5 segundos
  private skill2Cooldown: number = 10000; // 10 segundos
  private lastSkill1Time: number = 0;
  private lastSkill2Time: number = 0;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Temporalmente usamos un placeholder para el sprite
    super(scene, x, y, 'player');
    
    // Añadir el sprite a la escena
    scene.add.existing(this);
    
    // Añadir física al jugador
    scene.physics.add.existing(this);
    
    // Configurar el cuerpo físico
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(32, 32);
    
    // Crear barra de salud
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
    
    // Crear indicador de destino de movimiento
    this.moveTarget = scene.add.graphics();
    
    // Configurar entrada de mouse
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Solo procesar clic derecho
      if (pointer.rightButtonDown()) {
        // Obtener posición del clic en coordenadas del mundo
        const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.moveToPosition(worldPoint.x, worldPoint.y);
        
        // Mostrar indicador de destino
        this.showMoveTarget(worldPoint.x, worldPoint.y);
      }
    });
    
    // Configurar teclas para habilidades
    if (scene.input.keyboard) {
      scene.input.keyboard.on('keydown-Q', () => {
        this.useSkill1();
      });
      
      scene.input.keyboard.on('keydown-W', () => {
        this.useSkill2();
      });
    }
  }
  
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    
    // Actualizar movimiento
    this.updateMovement();
    
    // Actualizar barra de salud
    this.updateHealthBar();
  }
  
  private updateMovement() {
    if (this.targetPosition && this.isMoving) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      
      // Calcular dirección hacia el objetivo
      const direction = new Phaser.Math.Vector2(
        this.targetPosition.x - this.x,
        this.targetPosition.y - this.y
      );
      
      // Normalizar y escalar por velocidad
      if (direction.length() > 5) {
        direction.normalize().scale(this.speed);
        body.setVelocity(direction.x, direction.y);
        
        // Orientar el sprite hacia la dirección del movimiento
        // Calcular el ángulo en radianes y convertir a grados
        const angle = Math.atan2(direction.y, direction.x) * (180 / Math.PI);
        
        // Ajustar la rotación del sprite
        // Nota: Podríamos usar diferentes sprites para diferentes direcciones
        // en lugar de rotar, pero por ahora usamos rotación
        this.setRotation(angle * (Math.PI / 180));
      } else {
        // Detener cuando estemos cerca del objetivo
        body.setVelocity(0, 0);
        this.isMoving = false;
      }
    }
  }
  
  private moveToPosition(x: number, y: number) {
    this.targetPosition = new Phaser.Math.Vector2(x, y);
    this.isMoving = true;
  }
  
  private showMoveTarget(x: number, y: number) {
    // Detener cualquier animación previa del indicador
    if (this.currentMoveTargetTween) {
      this.currentMoveTargetTween.stop();
      this.currentMoveTargetTween = null;
    }
    
    // Restablecer la opacidad y limpiar el gráfico anterior
    this.moveTarget.clear();
    this.moveTarget.alpha = 1;
    
    // Dibujar un círculo más visible en la posición de destino
    this.moveTarget.lineStyle(3, 0x00ff00, 1); // Línea más gruesa y totalmente opaca
    this.moveTarget.strokeCircle(x, y, 15); // Círculo más grande
    
    // Añadir un efecto de "pulso" para mayor visibilidad
    this.moveTarget.lineStyle(1, 0xffffff, 0.7); // Línea interior blanca
    this.moveTarget.strokeCircle(x, y, 12);
    
    // Añadir una X en el centro para mayor claridad
    this.moveTarget.lineStyle(2, 0x00ff00, 1);
    this.moveTarget.beginPath();
    this.moveTarget.moveTo(x - 5, y - 5);
    this.moveTarget.lineTo(x + 5, y + 5);
    this.moveTarget.moveTo(x + 5, y - 5);
    this.moveTarget.lineTo(x - 5, y + 5);
    this.moveTarget.closePath();
    this.moveTarget.strokePath();
    
    // Añadir un efecto de desvanecimiento más rápido (500ms en lugar de 1000ms)
    this.currentMoveTargetTween = this.scene.tweens.add({
      targets: this.moveTarget,
      alpha: 0,
      duration: 500, // Duración reducida a la mitad
      onComplete: () => {
        this.moveTarget.clear();
        this.moveTarget.alpha = 1;
        this.currentMoveTargetTween = null;
      }
    });
  }
  
  private updateHealthBar() {
    this.healthBar.clear();
    
    // Dibujar fondo de la barra (rojo)
    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(this.x - 20, this.y - 40, 40, 5);
    
    // Dibujar barra de salud (verde)
    const healthPercentage = this.health / this.maxHealth;
    this.healthBar.fillStyle(0x00ff00);
    this.healthBar.fillRect(this.x - 20, this.y - 40, 40 * healthPercentage, 5);
  }
  
  private useSkill1() {
    const currentTime = this.scene.time.now;
    
    if (currentTime - this.lastSkill1Time >= this.skill1Cooldown) {
      console.log('Usando habilidad 1');
      // Implementar lógica de la habilidad 1
      
      this.lastSkill1Time = currentTime;
    } else {
      console.log('Habilidad 1 en enfriamiento');
    }
  }
  
  private useSkill2() {
    const currentTime = this.scene.time.now;
    
    if (currentTime - this.lastSkill2Time >= this.skill2Cooldown) {
      console.log('Usando habilidad 2');
      // Implementar lógica de la habilidad 2
      
      this.lastSkill2Time = currentTime;
    } else {
      console.log('Habilidad 2 en enfriamiento');
    }
  }
  
  public attack(target: any) {
    const currentTime = this.scene.time.now;
    
    if (currentTime - this.lastAttackTime >= this.attackCooldown) {
      console.log('Atacando objetivo');
      // Implementar lógica de ataque
      
      this.lastAttackTime = currentTime;
    }
  }
  
  public takeDamage(amount: number) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }
  
  private die() {
    console.log('Jugador ha muerto');
    // Implementar lógica de muerte
  }
} 