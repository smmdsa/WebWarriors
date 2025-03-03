import Phaser from 'phaser';
import { MinionSubtype } from '../managers/MinionManager';

export enum MinionType {
  ALLY = 'ally',
  ENEMY = 'enemy'
}

export class Minion extends Phaser.GameObjects.Sprite {
  protected minionType: MinionType;
  private subtype: MinionSubtype;
  private speed: number = 50; // Más lento que el jugador
  private health: number = 200;
  private maxHealth: number = 200;
  private attackDamage: number = 20;
  private attackRange: number = 50;
  private attackCooldown: number = 1500; // 1.5 segundos
  private lastAttackTime: number = 0;
  private healthBar: Phaser.GameObjects.Graphics;
  private goldValue: number = 25; // Valor por defecto
  
  // Movimiento
  private pathPoints: Phaser.Math.Vector2[] = [];
  private currentPathIndex: number = 0;
  private isMoving: boolean = false;
  private targetPosition: Phaser.Math.Vector2 | null = null;
  
  // Ataque
  private isAttacking: boolean = false;
  public currentTarget: Phaser.GameObjects.GameObject | null = null;
  private attackLine: Phaser.GameObjects.Graphics | null = null;
  
  constructor(scene: Phaser.Scene, x: number, y: number, type: MinionType, subtype: MinionSubtype) {
    // Determinar la textura según el tipo y subtipo
    let texture = '';
    if (type === MinionType.ALLY) {
      switch (subtype) {
        case MinionSubtype.MELEE:
          texture = 'ally_melee_minion';
          break;
        case MinionSubtype.CASTER:
          texture = 'ally_caster_minion';
          break;
        case MinionSubtype.CANNON:
          texture = 'ally_cannon_minion';
          break;
      }
    } else {
      switch (subtype) {
        case MinionSubtype.MELEE:
          texture = 'enemy_melee_minion';
          break;
        case MinionSubtype.CASTER:
          texture = 'enemy_caster_minion';
          break;
        case MinionSubtype.CANNON:
          texture = 'enemy_cannon_minion';
          break;
      }
    }
    
    super(scene, x, y, texture);
    
    // Añadir a la escena
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    
    // Inicializar la barra de salud antes de usarla
    this.healthBar = scene.add.graphics();
    
    // Habilitar física
    scene.physics.world.enable(this as unknown as Phaser.GameObjects.GameObject);
    
    // Configurar propiedades físicas
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCollideWorldBounds(true);
      body.setBounce(0.1, 0.1);
      body.setFriction(0, 0);
      body.setDrag(50, 50);
      
      // Reducir el tamaño del cuerpo de colisión para permitir más movimiento
      body.setSize(this.width * 0.7, this.height * 0.7);
      body.setOffset(this.width * 0.15, this.height * 0.15);
    }
    
    // Configurar propiedades básicas
    this.minionType = type;
    this.subtype = subtype;
    
    // Configurar propiedades según el subtipo
    this.configureSubtype();
    
    // Inicializar ruta vacía
    this.pathPoints = [];
    this.currentPathIndex = 0;
    
    // Inicializar estado
    this.isMoving = false;
    this.isAttacking = false;
    this.currentTarget = null;
    this.lastAttackTime = 0;
    
    // Configurar eventos de destrucción
    this.on('destroy', () => {
      if (this.healthBar) {
        this.healthBar.destroy();
      }
      if (this.attackLine) {
        this.attackLine.destroy();
      }
    });
  }
  
  /**
   * Configura las propiedades del minion según su subtipo
   */
  private configureSubtype(): void {
    switch (this.subtype) {
      case MinionSubtype.MELEE:
        this.maxHealth = 300;
        this.health = this.maxHealth;
        this.attackDamage = 15;
        this.attackRange = 50;
        this.attackCooldown = 1000;
        this.speed = 60;
        this.goldValue = 20;
        break;
        
      case MinionSubtype.CASTER:
        this.maxHealth = 200;
        this.health = this.maxHealth;
        this.attackDamage = 25;
        this.attackRange = 96; // 3 unidades (1 unidad = 32 píxeles)
        this.attackCooldown = 1500;
        this.speed = 60;
        this.goldValue = 25;
        break;
        
      case MinionSubtype.CANNON:
        this.maxHealth = 500;
        this.health = this.maxHealth;
        this.attackDamage = 40;
        this.attackRange = 112; // 3.5 unidades (1 unidad = 32 píxeles)
        this.attackCooldown = 2000;
        this.speed = 60;
        this.goldValue = 45;
        break;
    }
  }
  
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    
    // No hacer nada si está muriendo
    if (this.getData('isDying')) return;
    
    // Actualizar barra de salud (solo si healthBar está inicializado)
    if (this.healthBar) {
      this.updateHealthBar();
    }
    
    // Si está atacando, actualizar el ataque
    if (this.isAttacking && this.currentTarget) {
      this.updateAttack();
    } else {
      // Si no está atacando, moverse
      this.updateMovement();
    }
  }
  
  /**
   * Establece la ruta que seguirá el minion
   */
  public setPath(points: Phaser.Math.Vector2[]): void {
    this.pathPoints = points;
    this.currentPathIndex = 0;
    
    // Comenzar a moverse hacia el primer punto
    if (this.pathPoints.length > 0) {
      this.moveToNextPoint();
    }
  }
  
  /**
   * Mueve el minion al siguiente punto de la ruta
   */
  private moveToNextPoint(): void {
    if (this.currentPathIndex < this.pathPoints.length) {
      const nextPoint = this.pathPoints[this.currentPathIndex];
      this.moveToPosition(nextPoint.x, nextPoint.y);
    }
  }
  
  /**
   * Establece el destino de movimiento
   */
  private moveToPosition(x: number, y: number): void {
    this.targetPosition = new Phaser.Math.Vector2(x, y);
    this.isMoving = true;
  }
  
  /**
   * Actualiza el movimiento del minion
   */
  private updateMovement(): void {
    if (this.isMoving && this.targetPosition) {
      // Calcular dirección hacia el objetivo
      const dx = this.targetPosition.x - this.x;
      const dy = this.targetPosition.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Si estamos cerca del objetivo, pasar al siguiente punto
      if (distance < 10) {
        this.currentPathIndex++;
        
        if (this.currentPathIndex < this.pathPoints.length) {
          // Moverse al siguiente punto
          this.moveToNextPoint();
        } else {
          // Fin de la ruta
          this.isMoving = false;
        }
        
        return;
      }
      
      // Normalizar dirección
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;
      
      // Obtener el cuerpo físico
      const body = this.body as Phaser.Physics.Arcade.Body;
      
      // Verificar si hay colisión y ajustar el movimiento
      if (body && body.blocked.none === false) {
        // Si hay colisión, intentar deslizarse alrededor del obstáculo
        let adjustedDx = normalizedDx;
        let adjustedDy = normalizedDy;
        
        // Si está bloqueado horizontalmente, intentar moverse verticalmente
        if (body.blocked.left || body.blocked.right) {
          adjustedDx *= 0.1; // Reducir el movimiento horizontal
          adjustedDy *= 1.5; // Aumentar el movimiento vertical
          
          // Añadir un pequeño desplazamiento aleatorio para evitar bloqueos
          adjustedDy += (Math.random() * 0.4) - 0.2;
          
          // Si estamos bloqueados por mucho tiempo, intentar retroceder y buscar otro camino
          if (this.getData('blockedTime') === undefined) {
            this.setData('blockedTime', 0);
          }
          
          const blockedTime = this.getData('blockedTime') + 1;
          this.setData('blockedTime', blockedTime);
          
          // Si estamos bloqueados por más de 60 frames (1 segundo), intentar una solución más drástica
          if (blockedTime > 60) {
            // Retroceder y buscar otro camino
            adjustedDx = -normalizedDx * 0.5;
            adjustedDy = -normalizedDy * 0.5;
            
            // Añadir un desplazamiento aleatorio más grande
            adjustedDx += (Math.random() * 0.8) - 0.4;
            adjustedDy += (Math.random() * 0.8) - 0.4;
            
            // Reiniciar el contador si logramos movernos
            if (!body.blocked.none) {
              this.setData('blockedTime', 0);
            }
          }
        }
        
        // Si está bloqueado verticalmente, intentar moverse horizontalmente
        if (body.blocked.up || body.blocked.down) {
          adjustedDx *= 1.5; // Aumentar el movimiento horizontal
          adjustedDy *= 0.1; // Reducir el movimiento vertical
          
          // Añadir un pequeño desplazamiento aleatorio para evitar bloqueos
          adjustedDx += (Math.random() * 0.4) - 0.2;
          
          // Manejar bloqueo prolongado igual que arriba
          if (this.getData('blockedTime') === undefined) {
            this.setData('blockedTime', 0);
          }
          
          const blockedTime = this.getData('blockedTime') + 1;
          this.setData('blockedTime', blockedTime);
          
          if (blockedTime > 60) {
            adjustedDx = -normalizedDx * 0.5;
            adjustedDy = -normalizedDy * 0.5;
            adjustedDx += (Math.random() * 0.8) - 0.4;
            adjustedDy += (Math.random() * 0.8) - 0.4;
            
            if (!body.blocked.none) {
              this.setData('blockedTime', 0);
            }
          }
        }
        
        // Si no estamos bloqueados, reiniciar el contador
        if (body.blocked.none) {
          this.setData('blockedTime', 0);
        }
        
        // Aplicar velocidad directamente al cuerpo físico para mejor movimiento
        body.setVelocity(
          adjustedDx * this.speed,
          adjustedDy * this.speed
        );
      } else {
        // Movimiento normal sin colisiones
        body.setVelocity(
          normalizedDx * this.speed,
          normalizedDy * this.speed
        );
        
        // Reiniciar el contador de bloqueo
        this.setData('blockedTime', 0);
      }
      
      // Orientar el sprite en la dirección del movimiento
      if (Math.abs(dx) > Math.abs(dy)) {
        // Movimiento principalmente horizontal
        this.setFlipX(dx < 0);
      }
      
      // Actualizar la rotación si es necesario para algunos tipos de minions
      if (this.subtype === MinionSubtype.CASTER || this.subtype === MinionSubtype.CANNON) {
        this.setRotation(Math.atan2(dy, dx));
      }
    }
  }
  
  /**
   * Actualiza la barra de salud
   */
  private updateHealthBar(): void {
    // Asegurarse de que healthBar está inicializado
    if (!this.healthBar) {
      this.healthBar = this.scene.add.graphics();
    }
    
    this.healthBar.clear();
    
    // Fondo de la barra
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(this.x - 20, this.y - 30, 40, 5);
    
    // Barra de salud
    const healthPercent = this.health / this.maxHealth;
    const barColor = this.minionType === MinionType.ALLY ? 0x00ff00 : 0xff0000;
    this.healthBar.fillStyle(barColor, 1);
    this.healthBar.fillRect(this.x - 20, this.y - 30, 40 * healthPercent, 5);
  }
  
  /**
   * Busca y ataca objetivos cercanos
   */
  public findAndAttackTargets(targets: Phaser.GameObjects.GameObject[]): void {
    // Filtrar objetivos enemigos
    const enemyTargets = targets.filter(target => {
      if (this.minionType === MinionType.ALLY) {
        return 'isEnemy' in target && target.isEnemy;
      } else {
        return 'isAlly' in target && target.isAlly;
      }
    });
    
    // Buscar el objetivo más cercano dentro del rango de ataque
    let closestTarget = null;
    let closestDistance = Infinity;
    
    for (const target of enemyTargets) {
      // Asegurarse de que el objetivo tiene propiedades x e y
      if ('x' in target && 'y' in target) {
        const targetWithPosition = target as unknown as { x: number, y: number };
        const distance = Phaser.Math.Distance.Between(
          this.x, 
          this.y, 
          targetWithPosition.x, 
          targetWithPosition.y
        );
        
        if (distance <= this.attackRange && distance < closestDistance) {
          closestTarget = target;
          closestDistance = distance;
        }
      }
    }
    
    // Si encontramos un objetivo, comenzar a atacar
    if (closestTarget) {
      this.startAttacking(closestTarget);
    } else if (this.isAttacking && this.currentTarget) {
      // Si estamos atacando pero el objetivo ya no está en rango, seguir moviéndonos
      const targetWithPosition = this.currentTarget as unknown as { x: number, y: number };
      const distance = Phaser.Math.Distance.Between(
        this.x, 
        this.y, 
        targetWithPosition.x, 
        targetWithPosition.y
      );
      
      if (distance > this.attackRange) {
        console.log('Target fuera de rango, volviendo a moverse');
        this.stopAttacking();
      }
    }
  }
  
  /**
   * Comienza a atacar a un objetivo
   */
  private startAttacking(target: any): void {
    // No atacar si está muriendo
    if (this.getData('isDying')) return;
    
    this.isAttacking = true;
    this.currentTarget = target;
    
    // No detener el movimiento completamente, solo reducir la velocidad
    // this.isMoving = false;
    
    // Reducir la velocidad pero no detener completamente
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      // Reducir la velocidad a un 30% mientras ataca
      const currentVelocityX = body.velocity.x;
      const currentVelocityY = body.velocity.y;
      body.setVelocity(currentVelocityX * 0.3, currentVelocityY * 0.3);
    }
    
    // Orientar hacia el objetivo
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    this.setRotation(angle);
  }
  
  /**
   * Deja de atacar
   */
  private stopAttacking(): void {
    this.isAttacking = false;
    this.currentTarget = null;
    
    // Si hay más puntos en la ruta, continuar moviéndose
    if (this.currentPathIndex < this.pathPoints.length) {
      this.moveToNextPoint();
    }
    
    // Limpiar línea de ataque si existe
    if (this.attackLine) {
      this.attackLine.destroy();
      this.attackLine = null;
    }
  }
  
  /**
   * Actualiza el estado de ataque
   */
  private updateAttack(): void {
    if (!this.currentTarget) {
      this.stopAttacking();
      return;
    }
    
    // Verificar si el objetivo sigue activo en la escena
    if (!this.currentTarget.active) {
      console.log('Target no está activo, dejando de atacar');
      this.stopAttacking();
      return;
    }
    
    // Asegurarse de que el objetivo tiene propiedades x e y
    if (!('x' in this.currentTarget && 'y' in this.currentTarget)) {
      console.log('Target no tiene propiedades x e y, dejando de atacar');
      this.stopAttacking();
      return;
    }
    
    const targetWithPosition = this.currentTarget as unknown as { x: number, y: number };
    
    // Verificar si el objetivo sigue en rango
    const distance = Phaser.Math.Distance.Between(
      this.x, 
      this.y, 
      targetWithPosition.x, 
      targetWithPosition.y
    );
    
    if (distance > this.attackRange) {
      // Si el objetivo se alejó, dejar de atacar y seguir moviéndose
      console.log(`Target fuera de rango (${distance} > ${this.attackRange}), dejando de atacar`);
      this.stopAttacking();
      
      // Continuar moviéndose hacia el objetivo del path
      if (this.pathPoints.length > 0 && this.currentPathIndex < this.pathPoints.length) {
        this.moveToNextPoint();
      }
      
      return;
    }
    
    // Orientar hacia el objetivo
    const angle = Phaser.Math.Angle.Between(
      this.x, 
      this.y, 
      targetWithPosition.x, 
      targetWithPosition.y
    );
    this.setRotation(angle);
    
    // Verificar que this.scene y this.scene.time existen antes de acceder
    if (!this.scene || !this.scene.time) return;
    
    // Atacar si ha pasado el tiempo de enfriamiento
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastAttackTime >= this.attackCooldown) {
      this.attack(this.currentTarget);
      this.lastAttackTime = currentTime;
    }
  }
  
  /**
   * Realiza un ataque al objetivo
   */
  private attack(target: any): void {
    // No hacer nada si está muriendo
    if (this.getData('isDying')) return;
    
    console.log(`${this.minionType} ${this.subtype} minion atacando`);
    
    // Aplicar daño si el objetivo tiene el método takeDamage
    if (typeof target.takeDamage === 'function') {
      target.takeDamage(this.attackDamage);
    }
    
    // Efecto visual según el subtipo
    if (this.subtype === MinionSubtype.MELEE) {
      this.createMeleeAttack(target);
    } else {
      this.createProjectileAttack(target);
    }
  }
  
  /**
   * Crea un efecto visual de ataque cuerpo a cuerpo
   */
  private createMeleeAttack(target: any): void {
    // No hacer nada si está muriendo
    if (this.getData('isDying')) return;
    
    // Verificar que this.scene existe
    if (!this.scene) return;
    
    // Limpiar línea anterior si existe
    if (this.attackLine) {
      this.attackLine.destroy();
    }
    
    // Crear nueva línea de ataque
    this.attackLine = this.scene.add.graphics();
    
    // Color según el tipo de minion
    const lineColor = this.minionType === MinionType.ALLY ? 0x00ff00 : 0xff0000;
    
    this.attackLine.lineStyle(2, lineColor, 1);
    this.attackLine.beginPath();
    this.attackLine.moveTo(this.x, this.y);
    this.attackLine.lineTo(target.x, target.y);
    this.attackLine.closePath();
    this.attackLine.strokePath();
    
    // Desvanecer la línea
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.add({
        targets: this.attackLine,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          if (this.attackLine) {
            this.attackLine.destroy();
            this.attackLine = null;
          }
        }
      });
    }
  }
  
  /**
   * Crea un efecto visual de ataque a distancia (proyectil)
   */
  private createProjectileAttack(target: any): void {
    // No hacer nada si está muriendo
    if (this.getData('isDying')) return;
    
    // Verificar que this.scene existe
    if (!this.scene || !this.scene.add) return;
    
    // Crear gráfico para el proyectil
    const projectile = this.scene.add.graphics();
    const projectileSize = this.subtype === MinionSubtype.CANNON ? 8 : 5;
    
    // Posición inicial relativa al minion
    projectile.x = 0;
    projectile.y = 0;
    
    // Dibujar proyectil
    projectile.fillStyle(this.minionType === MinionType.ALLY ? 0x0088ff : 0xff4400, 1);
    projectile.fillCircle(this.x, this.y, projectileSize);
    
    // Animar el proyectil hacia el objetivo
    if (!this.scene.tweens) {
      // Si no hay tweens, destruir el proyectil y salir
      projectile.destroy();
      return;
    }
    
    this.scene.tweens.add({
      targets: projectile,
      x: target.x - this.x,
      y: target.y - this.y,
      duration: 300,
      onUpdate: () => {
        if (projectile && projectile.active) {
          projectile.clear();
          projectile.fillStyle(this.minionType === MinionType.ALLY ? 0x0088ff : 0xff4400, 1);
          projectile.fillCircle(this.x + projectile.x, this.y + projectile.y, projectileSize);
          projectile.lineStyle(2, 0xffffff, 0.5);
          projectile.strokeCircle(this.x + projectile.x, this.y + projectile.y, projectileSize);
        }
      },
      onComplete: () => {
        // Efecto de impacto
        if (this.scene && this.scene.add && target && target.active) {
          const impact = this.scene.add.graphics();
          impact.fillStyle(0xffff00, 0.8);
          impact.fillCircle(target.x, target.y, projectileSize * 2);
          
          // Desvanecer el impacto
          if (this.scene && this.scene.tweens) {
            this.scene.tweens.add({
              targets: impact,
              alpha: 0,
              duration: 200,
              onComplete: () => {
                if (impact && impact.active) {
                  impact.destroy();
                }
              }
            });
          } else if (impact) {
            // Si no hay tweens, destruir el impacto directamente
            impact.destroy();
          }
        }
        
        // Destruir el proyectil
        if (projectile && projectile.active) {
          projectile.destroy();
        }
      }
    });
  }
  
  /**
   * Recibe daño y actualiza la salud
   */
  public takeDamage(amount: number, fromPlayer: boolean = false): void {
    // No recibir más daño si ya está muriendo
    if (this.getData('isDying')) return;
    
    this.health -= amount;
    
    // Mostrar texto de daño
    this.showDamageText(amount);
    
    if (this.health <= 0) {
      this.health = 0;
      this.die(fromPlayer);
    }
  }
  
  /**
   * Muestra un texto flotante con el daño recibido
   */
  private showDamageText(amount: number): void {
    if (!this.scene || !this.scene.add || !this.scene.tweens) return;
    
    const damageText = this.scene.add.text(
      this.x, 
      this.y - 20, 
      `-${amount}`, 
      { font: '14px Arial', color: '#ff0000' }
    );
    damageText.setDepth(100);
    
    // Animar el texto
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        if (damageText && damageText.active) {
          damageText.destroy();
        }
      }
    });
  }
  
  /**
   * Gestiona la muerte del minion
   */
  private die(killedByPlayer: boolean = false): void {
    // Evitar múltiples llamadas
    if (this.getData('isDying')) return;
    this.setData('isDying', true);
    
    // Detener movimiento y ataques
    this.isMoving = false;
    this.stopAttacking();
    
    // Desactivar física
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
      body.setImmovable(true);
      body.setEnable(false);
    }
    
    // Mostrar animación de muerte
    this.setTint(0x666666);
    
    // Verificar que la escena existe antes de continuar
    if (!this.scene || !this.scene.children) {
      // Si la escena no existe, destruir el minion inmediatamente
      this.destroy();
      return;
    }
    
    // Notificar a otros minions que este minion ha muerto
    this.notifyDeathToAttackers();
    
    // Dar oro al jugador si fue asesinado por él
    if (killedByPlayer) {
      this.showGoldText();
      
      // Buscar jugadores aliados para darles el oro
      const players = this.scene.children.getChildren().filter(
        child => child.type === 'Sprite' && 'isAlly' in child && child.isAlly && 
        typeof (child as any).addGold === 'function' && typeof (child as any).addMinionKill === 'function'
      );
      
      if (players.length > 0) {
        // Dar oro al primer jugador encontrado
        const player = players[0] as any;
        player.addGold(this.goldValue);
        player.addMinionKill();
      }
    }
    
    // Eliminar después de un breve retraso
    // Verificar que this.scene.time existe antes de usarlo
    if (this.scene && this.scene.time) {
      this.scene.time.delayedCall(1000, () => {
        if (this.active) {
          this.destroy();
        }
      });
    } else {
      // Si no hay scene.time disponible, destruir directamente
      this.destroy();
    }
  }
  
  /**
   * Notifica a otros minions que este minion ha muerto para que limpien sus targets
   */
  private notifyDeathToAttackers(): void {
    if (!this.scene || !this.scene.children) return;
    
    // Obtener todos los minions de la escena
    const minions = this.scene.children.getChildren().filter(
      child => child instanceof Minion
    ) as Minion[];
    
    // Notificar a cada minion que este minion ha muerto
    minions.forEach(minion => {
      if (minion.currentTarget === this) {
        console.log('Notificando a un minion que su objetivo ha muerto');
        minion.stopAttacking();
      }
    });
  }
  
  /**
   * Muestra un texto flotante con el oro ganado
   */
  private showGoldText(): void {
    if (!this.scene || !this.scene.add || !this.scene.tweens) return;
    
    const goldText = this.scene.add.text(
      this.x, 
      this.y - 40, 
      `+${this.goldValue} gold`, 
      { font: '14px Arial', color: '#ffff00' }
    );
    goldText.setDepth(100);
    
    // Animar el texto
    this.scene.tweens.add({
      targets: goldText,
      y: goldText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        if (goldText && goldText.active) {
          goldText.destroy();
        }
      }
    });
  }
  
  /**
   * Cuando el jugador se acerca, el minion puede cambiar su objetivo
   */
  public aggroPlayer(player: Phaser.GameObjects.GameObject): void {
    // No cambiar objetivo si ya está muriendo
    if (this.getData('isDying')) return;
    
    // Verificar que el jugador sea enemigo
    const playerIsEnemy = (this.minionType === MinionType.ALLY && 'isEnemy' in player && player.isEnemy) ||
                         (this.minionType === MinionType.ENEMY && 'isAlly' in player && player.isAlly);
    
    if (playerIsEnemy) {
      // Asegurarse de que el jugador tiene propiedades x e y
      if ('x' in player && 'y' in player) {
        const playerWithPosition = player as unknown as { x: number, y: number };
        const distance = Phaser.Math.Distance.Between(
          this.x, 
          this.y, 
          playerWithPosition.x, 
          playerWithPosition.y
        );
        
        // Solo cambiar objetivo si está en un radio cercano
        if (distance < 150) {
          this.startAttacking(player);
        }
      }
    }
  }
  
  // Obtener el valor de oro
  get gold(): number {
    return this.goldValue;
  }
  
  // Propiedades para identificación
  get isAlly(): boolean {
    return this.minionType === MinionType.ALLY;
  }
  
  get isEnemy(): boolean {
    return this.minionType === MinionType.ENEMY;
  }
  
  // Destrucción completa
  destroy(fromScene?: boolean): void {
    // Notificar a otros minions que este minion ha muerto
    this.notifyDeathToAttackers();
    
    if (this.healthBar && this.healthBar.active) {
      this.healthBar.destroy();
    }
    
    if (this.attackLine && this.attackLine.active) {
      this.attackLine.destroy();
    }
    
    super.destroy(fromScene);
  }
} 