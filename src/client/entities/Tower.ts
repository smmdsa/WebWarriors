import Phaser from 'phaser';

export enum TowerType {
  LANE = 'lane',           // Torres de línea (2 por línea)
  NEXUS_ENTRANCE = 'nexus_entrance', // Torre en la entrada al nexo
  NEXUS_GUARDIAN = 'nexus_guardian'  // Torres que protegen el nexo
}

export enum Team {
  ALLY = 'ally',
  ENEMY = 'enemy'
}

export class Tower extends Phaser.GameObjects.Container {
  private maxHealth: number = 6000;
  private health: number = 6000;
  private attackRange: number = 128; // 4 unidades (1 unidad = 32 píxeles), reducido de 5 unidades
  private attackCooldown: number = 3000; // 3 segundos
  private attackDamage: number = 100;
  private lastAttackTime: number = 0;
  private rangeCircle: Phaser.GameObjects.Graphics;
  private healthBar: Phaser.GameObjects.Graphics;
  private team: Team;
  private towerType: TowerType;
  private attackTarget: Phaser.GameObjects.GameObject | null = null;
  private isDestroyed: boolean = false;
  private id: string;
  private sprite: Phaser.GameObjects.Rectangle;
  private attackLine: Phaser.GameObjects.Graphics | null = null;
  private goldValue: number = 300;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    team: Team,
    towerType: TowerType,
    id: string
  ) {
    super(scene, x, y);
    
    this.team = team;
    this.towerType = towerType;
    this.id = id;
    
    // Configurar la torre según su tipo
    switch (towerType) {
      case TowerType.NEXUS_GUARDIAN:
        this.maxHealth = 8000;
        this.health = 8000;
        this.attackDamage = 120;
        break;
      case TowerType.NEXUS_ENTRANCE:
        this.maxHealth = 7000;
        this.health = 7000;
        this.attackDamage = 110;
        break;
      case TowerType.LANE:
      default:
        this.maxHealth = 6000;
        this.health = 6000;
        break;
    }
    
    // Crear el sprite rectangular para la torre
    this.sprite = scene.add.rectangle(0, 0, 40, 40, team === Team.ALLY ? 0x0000ff : 0xff0000);
    this.add(this.sprite);
    
    // Crear círculo de rango de ataque (inicialmente invisible)
    this.rangeCircle = scene.add.graphics();
    this.rangeCircle.setDepth(0);
    this.rangeCircle.setVisible(false);
    this.updateRangeCircle();
    
    // Crear barra de salud
    this.healthBar = scene.add.graphics();
    
    // Añadir al escenario
    scene.add.existing(this);
    
    // Actualizar la barra de salud
    this.updateHealthBar();
    
    // Activar la física para la torre con configuración mejorada
    if (scene.physics && scene.physics.world) {
      scene.physics.world.enable(this);
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setImmovable(true);
        body.setCircle(20); // Radio ajustado al tamaño de la torre
        body.setCollideWorldBounds(true);
        
        // Configuración adicional para asegurar que sea completamente estática
        body.allowGravity = false;
        body.pushable = false; // Asegurar que no pueda ser empujada
        body.moves = false; // No se mueve por sí misma
        
        // Eliminar cualquier velocidad o aceleración residual
        body.setVelocity(0, 0);
        body.setAcceleration(0, 0);
        body.setDrag(0, 0);
        body.setBounce(0, 0);
      }
    }
  }
  
  public getTeam(): Team {
    return this.team;
  }
  
  public getTowerType(): TowerType {
    return this.towerType;
  }
  
  public getId(): string {
    return this.id;
  }
  
  public getPosition(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y);
  }
  
  public setPosition(x: number, y: number): this {
    super.setPosition(x, y);
    this.updateHealthBar();
    this.updateRangeCircle();
    return this;
  }
  
  public takeDamage(amount: number): void {
    if (this.isDestroyed) return;
    
    this.health -= amount;
    
    // Actualizar barra de salud
    this.updateHealthBar();
    
    // Comprobar si la torre ha sido destruida
    if (this.health <= 0) {
      // Distribuir oro
      this.distributeGold();
      
      // Marcar como destruida
      this.destroy();
      
      // Emitir evento de torre destruida
      if (this.scene) {
        this.scene.events.emit('tower-destroyed', this);
      }
    }
  }
  
  public destroy(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    // Eliminar gráficos si existen
    if (this.rangeCircle) {
      this.rangeCircle.destroy();
    }
    
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    // Llamar al método destroy de Phaser
    super.destroy();
  }
  
  public showRange(visible: boolean): void {
    if (!this.rangeCircle) {
      this.rangeCircle = this.scene.add.graphics();
    }
    
    this.rangeCircle.setVisible(visible);
    if (visible) {
      this.updateRangeCircle();
    }
  }
  
  private updateRangeCircle(): void {
    if (!this.rangeCircle) {
      this.rangeCircle = this.scene.add.graphics();
    }
    
    this.rangeCircle.clear();
    this.rangeCircle.lineStyle(2, this.team === Team.ALLY ? 0x0000ff : 0xff0000, 0.3);
    this.rangeCircle.fillStyle(this.team === Team.ALLY ? 0x0000ff : 0xff0000, 0.1);
    this.rangeCircle.strokeCircle(this.x, this.y, this.attackRange);
    this.rangeCircle.fillCircle(this.x, this.y, this.attackRange);
  }
  
  private updateHealthBar(): void {
    // Verificar que healthBar existe
    if (!this.healthBar) {
      this.healthBar = this.scene.add.graphics();
    }
    
    this.healthBar.clear();
    
    // Dimensiones de la barra de salud
    const width = 40;
    const height = 5;
    const x = this.x - width / 2;
    const y = this.y - 30;
    
    // Fondo de la barra (gris)
    this.healthBar.fillStyle(0x666666);
    this.healthBar.fillRect(x, y, width, height);
    
    // Calcular porcentaje de salud
    const healthPercent = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
    
    // Color de la barra según la salud
    let color = 0x00ff00; // Verde
    if (healthPercent < 0.6) color = 0xffff00; // Amarillo
    if (healthPercent < 0.3) color = 0xff0000; // Rojo
    
    // Dibujar barra de salud
    this.healthBar.fillStyle(color);
    this.healthBar.fillRect(x, y, width * healthPercent, height);
  }
  
  public update(time: number, delta: number, targets: Phaser.GameObjects.GameObject[]): void {
    if (this.isDestroyed || !this.scene) return;
    
    // Actualizar posición de elementos visuales
    this.updateHealthBar();
    
    // Si el rango es visible, actualizarlo
    if (this.rangeCircle && this.rangeCircle.visible) {
      this.updateRangeCircle();
    }
    
    // Si ya tenemos un objetivo, verificar si sigue siendo válido
    if (this.attackTarget && this.attackTarget.active && 
        'x' in this.attackTarget && 'y' in this.attackTarget) {
      
      // Comprobar si el objetivo sigue dentro del rango
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y, 
        (this.attackTarget as any).x, (this.attackTarget as any).y
      );
      
      if (distance <= this.attackRange) {
        // El objetivo sigue siendo válido, continuar atacándolo
        if (time - this.lastAttackTime >= this.attackCooldown) {
          this.attack(time);
        }
        return; // No buscar nuevos objetivos mientras tengamos uno válido
      } else {
        // El objetivo se ha salido del rango, limpiar
        console.log(`Torre ${this.id} (${this.team}): Objetivo fuera de rango, buscando nuevo objetivo`);
        this.attackTarget = null;
      }
    } else if (this.attackTarget) {
      // El objetivo ya no es válido (probablemente fue destruido)
      console.log(`Torre ${this.id} (${this.team}): Objetivo destruido o no válido, buscando nuevo objetivo`);
      this.attackTarget = null;
    }
    
    // Comprobar si podemos atacar un nuevo objetivo
    if (time - this.lastAttackTime >= this.attackCooldown) {
      this.findAndAttackTarget(time, targets);
    }
  }
  
  private findAndAttackTarget(time: number, targets: Phaser.GameObjects.GameObject[]): void {
    if (targets.length === 0) return;
    
    // Filtrar para obtener solo objetivos válidos (minions enemigos, jugadores enemigos)
    const validTargets = targets.filter(target => {
      if (!target.active) return false;
      
      // Verificar que el objetivo tiene posición
      if (!('x' in target) || !('y' in target)) return false;
      
      // Clasificar el tipo de objetivo
      const isEnemyMinion = 'minionType' in target && (target as any).minionType === 'enemy' && this.team === Team.ALLY;
      const isAllyMinion = 'minionType' in target && (target as any).minionType === 'ally' && this.team === Team.ENEMY;
      
      // Para jugadores, verificar si el equipo es opuesto a la torre
      const isEnemyPlayer = 'isPlayer' in target && (target as any).isPlayer === true;
      let isPlayerValidTarget = false;
      
      if (isEnemyPlayer) {
        // El jugador siempre es aliado, así que solo las torres enemigas lo atacan
        isPlayerValidTarget = (this.team === Team.ENEMY);
      }
      
      return isEnemyMinion || isAllyMinion || isPlayerValidTarget;
    });
    
    // Si no hay objetivos válidos, no hacer nada
    if (validTargets.length === 0) {
      this.showRange(false);
      return;
    }
    
    // Si ya tenemos un objetivo, verificar si sigue siendo válido (vivo y dentro del rango)
    let targetToAttack = null;
    let enemyInRange = false;
    
    if (this.attackTarget && this.attackTarget.active) {
      // Verificar si el objetivo actual está dentro del rango
      const distance = Phaser.Math.Distance.Between(this.x, this.y, (this.attackTarget as any).x, (this.attackTarget as any).y);
      if (distance <= this.attackRange) {
        targetToAttack = this.attackTarget;
        enemyInRange = true;
        console.log(`Torre ${this.id} (${this.team}): Manteniendo objetivo actual`);
      } else {
        console.log(`Torre ${this.id} (${this.team}): Objetivo actual fuera de rango, buscando nuevo objetivo`);
        this.attackTarget = null;
      }
    }
    
    // Si no tenemos un objetivo válido, buscar el más cercano
    if (!targetToAttack) {
      targetToAttack = this.findClosestTargetInRange(validTargets);
      if (targetToAttack) {
        enemyInRange = true;
        console.log(`Torre ${this.id} (${this.team}): Objetivo encontrado para atacar`);
      } else {
        // Comprobar manualmente si hay enemigos dentro del rango
        for (const target of validTargets) {
          const distance = Phaser.Math.Distance.Between(this.x, this.y, (target as any).x, (target as any).y);
          if (distance <= this.attackRange) {
            enemyInRange = true;
            console.log(`Torre ${this.id} (${this.team}): Enemigo dentro del rango pero no seleccionado como objetivo`);
            break;
          }
        }
      }
    }
    
    // Mostrar el rango si hay enemigos cercanos
    this.showRange(enemyInRange);
    
    // Si encontramos un objetivo, atacarlo
    if (targetToAttack) {
      this.attackTarget = targetToAttack;
      this.attack(time);
    } else {
      this.attackTarget = null;
    }
  }
  
  private findClosestTargetInRange(targets: Phaser.GameObjects.GameObject[]): Phaser.GameObjects.GameObject | null {
    if (targets.length === 0) return null;
    
    let closestTarget = null;
    let closestDistance = this.attackRange;
    
    for (const target of targets) {
      // Calcular distancia
      const distance = Phaser.Math.Distance.Between(this.x, this.y, (target as any).x, (target as any).y);
      
      // Debug: mostrar distancia a cada objetivo
      console.log(`Torre ${this.id} (${this.team}): Distancia a objetivo: ${distance}, rango de ataque: ${this.attackRange}`);
      
      // Si está dentro del rango y es más cercano que el objetivo actual
      if (distance <= this.attackRange && (closestTarget === null || distance < closestDistance)) {
        closestTarget = target;
        closestDistance = distance;
        console.log(`Torre ${this.id} (${this.team}): Nuevo objetivo más cercano encontrado a distancia ${distance}`);
      }
    }
    
    return closestTarget;
  }
  
  private attack(time: number): void {
    if (!this.attackTarget || !this.attackTarget.active) return;
    
    // Registrar el tiempo del último ataque
    this.lastAttackTime = time;
    
    // Identificar el tipo de objetivo
    const isMinion = 'minionType' in this.attackTarget;
    const isPlayer = 'isPlayer' in this.attackTarget && (this.attackTarget as any).isPlayer === true;
    
    console.log(`Torre ${this.id} (${this.team}) está atacando a un ${isMinion ? 'minion' : (isPlayer ? 'jugador' : 'objetivo desconocido')}`);
    
    // Verificar que el objetivo tenga el método takeDamage
    if ('takeDamage' in this.attackTarget) {
      // Aplicar daño - para jugadores, podemos aplicar un multiplicador diferente
      const damage = isPlayer ? this.attackDamage * 1.5 : this.attackDamage;
      (this.attackTarget as any).takeDamage(damage);
      
      // Crear efecto visual de ataque
      this.createAttackEffect();
    }
  }
  
  private createAttackEffect(): void {
    if (!this.attackTarget || !this.scene) return;
    
    // Eliminar la línea anterior si existe
    if (this.attackLine) {
      this.attackLine.destroy();
      this.attackLine = null;
    }
    
    // Crear línea de ataque permanente
    this.attackLine = this.scene.add.graphics();
    this.attackLine.lineStyle(2, this.team === Team.ALLY ? 0x0088ff : 0xff8800, 1);
    this.attackLine.beginPath();
    this.attackLine.moveTo(this.x, this.y);
    this.attackLine.lineTo((this.attackTarget as any).x, (this.attackTarget as any).y);
    this.attackLine.strokePath();
    
    // Crear efecto de destello
    const flashGraphics = this.scene.add.graphics();
    flashGraphics.lineStyle(3, 0xffffff, 0.8);
    flashGraphics.beginPath();
    flashGraphics.moveTo(this.x, this.y);
    flashGraphics.lineTo((this.attackTarget as any).x, (this.attackTarget as any).y);
    flashGraphics.strokePath();
    
    // Animar el destello
    this.scene.tweens.add({
      targets: flashGraphics,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        flashGraphics.destroy();
      }
    });
  }
  
  private distributeGold(): void {
    // Buscar jugadores en la escena
    const players = this.scene.children.getChildren().filter(child => 
      'isPlayer' in child && (child as any).isPlayer === true
    );
    
    if (players.length > 0) {
      // Calcular oro por jugador
      const goldPerPlayer = Math.floor(this.goldValue / players.length);
      
      // Distribuir oro a cada jugador
      players.forEach(player => {
        // Primero convertir a unknown para evitar errores de tipo
        const playerObj = player as unknown;
        
        // Luego verificar que tiene las propiedades necesarias
        if ('addGold' in player && typeof (player as any).addGold === 'function' &&
            'x' in player && 'y' in player) {
          
          // Ahora es seguro hacer el cast
          const typedPlayer = playerObj as { 
            addGold: (amount: number) => void;
            x: number;
            y: number;
          };
          
          // Llamar al método addGold
          typedPlayer.addGold(goldPerPlayer);
          
          // Mostrar texto informativo
          const goldText = this.scene.add.text(
            typedPlayer.x,
            typedPlayer.y - 30,
            `+${goldPerPlayer} oro`,
            {
              fontSize: '16px',
              color: '#ffff00',
              stroke: '#000000',
              strokeThickness: 3
            }
          );
          goldText.setOrigin(0.5);
          
          // Animar el texto
          this.scene.tweens.add({
            targets: goldText,
            y: goldText.y - 50,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
              goldText.destroy();
            }
          });
        }
      });
      
      console.log(`Torre ${this.id} distribuye ${this.goldValue} de oro entre ${players.length} jugadores (${Math.floor(this.goldValue / players.length)} por jugador)`);
    }
  }
} 