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
  private attackDamage: number = 150;
  private lastAttackTime: number = 0;
  private rangeCircle: Phaser.GameObjects.Graphics;
  private healthBar: Phaser.GameObjects.Graphics;
  private team: Team;
  private towerType: TowerType;
  private attackTarget: Phaser.GameObjects.GameObject | null = null;
  private isDestroyed: boolean = false;
  private id: string;
  private sprite: Phaser.GameObjects.Rectangle;

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
    
    // Crear sprite rectangular para la torre
    this.sprite = scene.add.rectangle(0, 0, 32, 32, team === Team.ALLY ? 0x0000ff : 0xff0000);
    this.add(this.sprite);
    
    // Crear círculo de rango
    this.rangeCircle = scene.add.graphics();
    this.rangeCircle.setVisible(false);
    
    // Crear barra de salud
    this.healthBar = scene.add.graphics();
    
    // Añadir al escenario
    scene.add.existing(this);
    
    // Actualizar la barra de salud
    this.updateHealthBar();
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
    
    // Comprobar si podemos atacar
    if (time - this.lastAttackTime >= this.attackCooldown) {
      this.findAndAttackTarget(time, targets);
    }
  }
  
  private findAndAttackTarget(time: number, targets: Phaser.GameObjects.GameObject[]): void {
    // Buscar el objetivo más cercano dentro del rango
    let closestTarget = null;
    let closestDistance = this.attackRange;
    
    for (const target of targets) {
      // Verificar que el objetivo tenga posición y equipo
      if (!target.active || !('x' in target) || !('y' in target) || !('getTeam' in target)) continue;
      
      // Verificar que el objetivo sea del equipo contrario
      const targetTeam = (target as any).getTeam();
      if (targetTeam === this.team) continue;
      
      // Calcular distancia
      const distance = Phaser.Math.Distance.Between(this.x, this.y, (target as any).x, (target as any).y);
      
      // Si está dentro del rango y es más cercano que el objetivo actual
      if (distance <= this.attackRange && (closestTarget === null || distance < closestDistance)) {
        closestTarget = target;
        closestDistance = distance;
      }
    }
    
    // Si encontramos un objetivo, atacarlo
    if (closestTarget !== null) {
      this.attackTarget = closestTarget;
      this.attack(time);
    } else {
      this.attackTarget = null;
    }
  }
  
  private attack(time: number): void {
    if (!this.attackTarget || !this.attackTarget.active) return;
    
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
    
    // Crear línea de ataque
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, this.team === Team.ALLY ? 0x0088ff : 0xff8800, 1);
    graphics.beginPath();
    graphics.moveTo(this.x, this.y);
    graphics.lineTo((this.attackTarget as any).x, (this.attackTarget as any).y);
    graphics.strokePath();
    
    // Animar desvanecimiento
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        graphics.destroy();
      }
    });
  }
} 