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
      this.destroy();
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
    
    // Emitir evento de torre destruida
    if (this.scene) {
      this.scene.events.emit('tower-destroyed', this);
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
    // Filtrar objetivos válidos (con posición y equipo)
    const validTargets = targets.filter(target => {
      return target.active && 
        'x' in target && 
        'y' in target && 
        // Verificar si es un enemigo basado en equipo
        (
          ('getTeam' in target && (target as any).getTeam() !== this.team) ||
          ('team' in target && (target as any).team !== this.team) ||
          ('minionType' in target && 
            ((this.team === Team.ALLY && (target as any).minionType === 'enemy') ||
             (this.team === Team.ENEMY && (target as any).minionType === 'ally'))
          )
        );
    });
    
    // Debug: mostrar cuántos objetivos válidos hay
    console.log(`Torre ${this.id} (${this.team}): Detectados ${validTargets.length} objetivos válidos`);
    
    // Variable para rastrear si hay algún enemigo dentro del rango
    let enemyInRange = false;
    
    if (validTargets.length === 0) {
      // Si no hay objetivos válidos, ocultar el rango
      this.showRange(false);
      return;
    }
    
    // Separar minions y campeones usando una detección más robusta
    const minions = validTargets.filter(target => 
      'minionType' in target || 
      'subtype' in target || 
      (target.constructor && (target.constructor as any).name === 'Minion')
    );
    
    const champions = validTargets.filter(target => 
      !minions.includes(target) && (
        'champion' in target || 
        (target.constructor && (target.constructor as any).name === 'Player')
      )
    );
    
    // Debug: mostrar cuántos minions y campeones hay
    console.log(`Torre ${this.id} (${this.team}): Detectados ${minions.length} minions y ${champions.length} campeones`);
    
    // Buscar primero entre los minions
    let targetToAttack = this.findClosestTargetInRange(minions);
    
    // Si no hay minions en rango, buscar entre los campeones
    if (!targetToAttack) {
      targetToAttack = this.findClosestTargetInRange(champions);
    }
    
    // Comprobar si hay algún enemigo dentro del rango (para mostrar visual)
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
    
    // Debug: mostrar información sobre el ataque
    console.log(`Torre ${this.id} (${this.team}) está atacando a un objetivo en posición ${(this.attackTarget as any).x}, ${(this.attackTarget as any).y}`);
    
    // Registrar el tiempo del último ataque
    this.lastAttackTime = time;
    
    // Verificar que el objetivo tenga el método takeDamage
    if ('takeDamage' in this.attackTarget) {
      (this.attackTarget as any).takeDamage(this.attackDamage);
      
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
} 