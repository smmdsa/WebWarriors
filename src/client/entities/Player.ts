import Phaser from 'phaser';
import { 
  ChampionDefinition, 
  ChampionSkill, 
  SkillEffect, 
  SkillEffectType, 
  AttackType, 
  DamageType 
} from '../types/Champion';
import { champions } from '../data/champions';
import { PlayerStats } from '../types/Player';
import { Item, items as itemsData } from '../data/items';

export class Player extends Phaser.GameObjects.Sprite {
  // Movimiento
  private targetPosition: Phaser.Math.Vector2 | null = null;
  private isMoving: boolean = false;
  
  // Ataque
  private attackRange: number = 100;
  private attackCooldown: number = 1000; // 1 segundo
  private lastAttackTime: number = 0;
  
  // Elementos visuales
  private healthBar: Phaser.GameObjects.Graphics;
  private manaBar: Phaser.GameObjects.Graphics;
  private moveTarget: Phaser.GameObjects.Graphics;
  private currentMoveTargetTween: Phaser.Tweens.Tween | null = null;
  private experienceRadiusGraphics: Phaser.GameObjects.Graphics;
  
  // Estadísticas del jugador
  private gold: number = 0;
  private minionsKilled: number = 0;
  private experience: number = 0;
  private level: number = 1;
  private maxLevel: number = 20;
  private statsText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  
  // Estadísticas base
  private baseStats: PlayerStats;
  
  // Estadísticas actuales (base + items + nivel)
  private currentStats: PlayerStats;
  
  // Items comprados
  private items: Item[] = [];
  
  // Radio de experiencia
  private experienceRadius: number = 400;
  private showExperienceRadius: boolean = false;
  
  // Campeón seleccionado
  private champion: ChampionDefinition;
  
  // Habilidades
  private skills: ChampionSkill[] = [];
  private skillCooldowns: number[] = [0, 0, 0, 0]; // Q, W, E, R
  private lastSkillTimes: number[] = [0, 0, 0, 0]; // Q, W, E, R
  private skillKeys: string[] = ['Q', 'W', 'E', 'R'];
  
  // Indicadores visuales de habilidades
  private skillIndicators: Phaser.GameObjects.Graphics[] = [];
  private skillCooldownTexts: Phaser.GameObjects.Text[] = [];
  
  // Tipo de ataque
  private attackType: AttackType;
  private damageType: DamageType;
  
  // Elementos de la interfaz de items
  private itemsPanel: Phaser.GameObjects.Container;
  private itemsBackground: Phaser.GameObjects.Rectangle;
  private itemsText: Phaser.GameObjects.Text;
  private itemsList: Phaser.GameObjects.Text[] = [];
  private showItemsPanel: boolean = false;
  
  // Lista de objetivos potenciales
  private potentialTargets: Phaser.GameObjects.GameObject[] = [];
  
  constructor(scene: Phaser.Scene, x: number, y: number, championId: string = 'warrior') {
    // Cargar el campeón seleccionado (por defecto el guerrero)
    const champion = champions[championId];
    
    // Si no existe el campeón, usar el guerrero por defecto
    const selectedChampion = champion || champions['warrior'];
    if (!champion) {
      console.warn(`Champion ${championId} not found, using default warrior`);
    }
    
    // Usar la textura correspondiente al campeón (por ahora usamos 'player')
    super(scene, x, y, 'player');
    
    // Guardar referencia al campeón
    this.champion = selectedChampion;
    
    // Guardar tipo de ataque y daño
    this.attackType = this.champion.attackType;
    this.damageType = this.champion.damageType;
    
    // Configurar habilidades
    this.skills = [...this.champion.skills];
    
    // Inicializar estadísticas base desde el campeón
    this.baseStats = {
      moveSpeed: this.champion.baseStats.moveSpeed,
      physicalDamage: this.champion.baseStats.attackDamage,
      magicDamage: this.champion.baseStats.abilityPower,
      trueDamage: 0,
      health: this.champion.baseStats.health,
      maxHealth: this.champion.baseStats.maxHealth,
      mana: this.champion.baseStats.mana,
      maxMana: this.champion.baseStats.maxMana,
      physicalResistance: this.champion.baseStats.physicalResistance,
      magicResistance: this.champion.baseStats.magicResistance
    };
    
    // Inicializar estadísticas actuales
    this.currentStats = { ...this.baseStats };
    
    // Añadir el sprite a la escena
    scene.add.existing(this);
    
    // Añadir física al jugador
    scene.physics.add.existing(this);
    
    // Configurar el cuerpo físico
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(32, 32);
    
    // Crear barras de salud y mana
    this.healthBar = scene.add.graphics();
    this.manaBar = scene.add.graphics();
    this.updateBars();
    
    // Crear indicador de destino de movimiento
    this.moveTarget = scene.add.graphics();
    
    // Crear gráfico para el radio de experiencia
    this.experienceRadiusGraphics = scene.add.graphics();
    
    // Crear texto de estadísticas
    this.statsText = scene.add.text(10, 40, this.getStatsText(), {
      font: '14px Arial',
      color: '#ffffff',
      backgroundColor: '#000000'
    });
    this.statsText.setScrollFactor(0); // Fijar a la cámara
    this.statsText.setDepth(100);
    
    // Crear texto de nivel
    this.levelText = scene.add.text(this.x, this.y - 50, `Lvl ${this.level}`, {
      font: '12px Arial',
      color: '#ffffff',
      backgroundColor: '#000000'
    });
    this.levelText.setDepth(100);
    
    // Crear panel de items (inicialmente oculto)
    this.itemsPanel = scene.add.container(10, 150);
    this.itemsBackground = scene.add.rectangle(0, 0, 200, 300, 0x000000, 0.7);
    this.itemsBackground.setOrigin(0, 0);
    this.itemsText = scene.add.text(10, 10, 'Items Comprados:', {
      font: '16px Arial',
      color: '#ffffff'
    });
    
    this.itemsPanel.add(this.itemsBackground);
    this.itemsPanel.add(this.itemsText);
    this.itemsPanel.setScrollFactor(0);
    this.itemsPanel.setDepth(100);
    this.itemsPanel.setVisible(false);
    
    // Configurar entrada de mouse
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Solo procesar clic derecho
      if (pointer.rightButtonDown()) {
        // Obtener posición del clic en coordenadas del mundo
        const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // Verificar si hay un minion en esa posición
        const clickedMinion = this.findMinionAtPosition(worldPoint.x, worldPoint.y);
        
        if (clickedMinion && clickedMinion.isEnemy) {
          // Si hay un minion enemigo, atacarlo
          this.attackMinion(clickedMinion);
        } else {
          // Si no, moverse a la posición
          this.moveToPosition(worldPoint.x, worldPoint.y);
          
          // Mostrar indicador de destino
          this.showMoveTarget(worldPoint.x, worldPoint.y);
        }
      }
    });
    
    // Configurar teclas para habilidades
    if (scene.input.keyboard) {
      scene.input.keyboard.on('keydown-Q', () => {
        this.useSkill(0); // Q - Primera habilidad
      });
      
      scene.input.keyboard.on('keydown-W', () => {
        this.useSkill(1); // W - Segunda habilidad
      });
      
      scene.input.keyboard.on('keydown-E', () => {
        this.useSkill(2); // E - Tercera habilidad
      });
      
      scene.input.keyboard.on('keydown-R', () => {
        this.useSkill(3); // R - Habilidad definitiva
      });
      
      // Tecla para mostrar/ocultar el radio de experiencia
      scene.input.keyboard.on('keydown-E', () => {
        this.showExperienceRadius = !this.showExperienceRadius;
        this.updateExperienceRadius();
      });
      
      // Tecla para mostrar/ocultar el panel de items
      scene.input.keyboard.on('keydown-I', () => {
        this.showItemsPanel = !this.showItemsPanel;
        this.itemsPanel.setVisible(this.showItemsPanel);
      });
      
      // Teclas numéricas para comprar items (para pruebas)
      scene.input.keyboard.on('keydown-ONE', () => {
        this.buyItem(itemsData.dorans_blade);
      });
      
      scene.input.keyboard.on('keydown-TWO', () => {
        this.buyItem(itemsData.dorans_ring);
      });
      
      scene.input.keyboard.on('keydown-THREE', () => {
        this.buyItem(itemsData.boots_of_speed);
      });
      
      scene.input.keyboard.on('keydown-FOUR', () => {
        this.buyItem(itemsData.cloth_armor);
      });
      
      scene.input.keyboard.on('keydown-FIVE', () => {
        this.buyItem(itemsData.null_magic_mantle);
      });
      
      scene.input.keyboard.on('keydown-SIX', () => {
        this.buyItem(itemsData.dorans_shield);
      });
      
      scene.input.keyboard.on('keydown-SEVEN', () => {
        this.buyItem(itemsData.long_sword);
      });
      
      scene.input.keyboard.on('keydown-EIGHT', () => {
        this.buyItem(itemsData.amplifying_tome);
      });
    }
    
    // Crear indicadores visuales para las habilidades
    this.createSkillIndicators();
  }
  
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    
    // Actualizar movimiento
    this.updateMovement();
    
    // Actualizar posición del texto de nivel
    this.levelText.setPosition(this.x - 15, this.y - 50);
    
    // Actualizar barras de salud y mana
    this.updateBars();
    
    // Actualizar radio de experiencia si está visible
    if (this.showExperienceRadius) {
      this.updateExperienceRadius();
    }
    
    // Verificar si hay un minion objetivo guardado y si estamos en rango para atacarlo
    const targetMinion = this.getData('targetMinion');
    if (targetMinion) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, targetMinion.x, targetMinion.y);
      if (distance <= this.attackRange) {
        // Verificar si ha pasado suficiente tiempo desde el último ataque
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
          this.attack(targetMinion);
          this.lastAttackTime = currentTime;
        }
      }
    }
    
    // Verificar minions cercanos para ganar experiencia
    this.checkNearbyMinionsForExperience();
    
    // Actualizar indicadores de enfriamiento de habilidades
    this.updateSkillCooldowns(time);
  }
  
  private updateMovement() {
    if (this.isMoving && this.targetPosition) {
      // Calcular dirección hacia el objetivo
      const dx = this.targetPosition.x - this.x;
      const dy = this.targetPosition.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Si estamos cerca del objetivo, detenernos
      if (distance < 5) {
        this.isMoving = false;
        return;
      }
      
      // Normalizar dirección
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;
      
      // Mover el jugador
      this.x += normalizedDx * this.currentStats.moveSpeed * (1/60);
      this.y += normalizedDy * this.currentStats.moveSpeed * (1/60);
      
      // Orientar hacia la dirección de movimiento
      this.setRotation(Math.atan2(dy, dx));
      
      // Actualizar el cuerpo físico si existe
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(
          normalizedDx * this.currentStats.moveSpeed,
          normalizedDy * this.currentStats.moveSpeed
        );
      }
    } else {
      // Detener el movimiento
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(0, 0);
      }
    }
  }
  
  private moveToPosition(x: number, y: number) {
    this.targetPosition = new Phaser.Math.Vector2(x, y);
    this.isMoving = true;
  }
  
  private showMoveTarget(x: number, y: number) {
    // Limpiar el gráfico anterior
    this.moveTarget.clear();
    
    // Dibujar nuevo indicador de destino
    this.moveTarget.lineStyle(2, 0x00ff00, 0.8);
    this.moveTarget.strokeCircle(x, y, 10);
    
    // Añadir efecto de pulso
    if (this.currentMoveTargetTween) {
      this.currentMoveTargetTween.stop();
    }
    
    this.moveTarget.lineStyle(4, 0x00ff00, 0.4);
    this.moveTarget.strokeCircle(x, y, 15);
    
    // Crear un efecto de pulso que no elimine el indicador al finalizar
    this.currentMoveTargetTween = this.scene.tweens.add({
      targets: this.moveTarget,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // Restaurar alpha pero mantener el indicador visible
        this.moveTarget.setAlpha(1);
      }
    });
  }
  
  private updateBars() {
    // Actualizar barra de salud
    this.healthBar.clear();
    
    // Fondo de la barra
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(this.x - 25, this.y - 40, 50, 5);
    
    // Barra de salud
    const healthPercent = this.currentStats.health / this.currentStats.maxHealth;
    this.healthBar.fillStyle(0xff0000, 1);
    this.healthBar.fillRect(this.x - 25, this.y - 40, 50 * healthPercent, 5);
    
    // Actualizar barra de mana
    this.manaBar.clear();
    
    // Fondo de la barra
    this.manaBar.fillStyle(0x000000, 0.5);
    this.manaBar.fillRect(this.x - 25, this.y - 35, 50, 5);
    
    // Barra de mana
    const manaPercent = this.currentStats.mana / this.currentStats.maxMana;
    this.manaBar.fillStyle(0x0000ff, 1);
    this.manaBar.fillRect(this.x - 25, this.y - 35, 50 * manaPercent, 5);
  }
  
  private updateExperienceRadius() {
    this.experienceRadiusGraphics.clear();
    
    if (this.showExperienceRadius) {
      this.experienceRadiusGraphics.lineStyle(2, 0x00ffff, 0.3);
      this.experienceRadiusGraphics.strokeCircle(this.x, this.y, this.experienceRadius);
    }
  }
  
  /**
   * Crea los indicadores visuales para las habilidades
   */
  private createSkillIndicators() {
    const startX = 10;
    const startY = this.scene.cameras.main.height - 60;
    const size = 40;
    const spacing = 10;
    
    for (let i = 0; i < 4; i++) {
      // Crear fondo del indicador
      const indicator = this.scene.add.graphics();
      indicator.fillStyle(0x333333, 0.8);
      indicator.fillRect(startX + i * (size + spacing), startY, size, size);
      indicator.setScrollFactor(0);
      indicator.setDepth(100);
      this.skillIndicators.push(indicator);
      
      // Crear texto de tecla
      const keyText = this.scene.add.text(
        startX + i * (size + spacing) + size / 2,
        startY + size / 2,
        this.skillKeys[i],
        { font: '16px Arial', color: '#ffffff' }
      );
      keyText.setOrigin(0.5);
      keyText.setScrollFactor(0);
      keyText.setDepth(101);
      
      // Crear texto de enfriamiento
      const cooldownText = this.scene.add.text(
        startX + i * (size + spacing) + size / 2,
        startY + size / 2,
        '',
        { font: '14px Arial', color: '#ff0000' }
      );
      cooldownText.setOrigin(0.5);
      cooldownText.setScrollFactor(0);
      cooldownText.setDepth(102);
      this.skillCooldownTexts.push(cooldownText);
    }
  }
  
  /**
   * Actualiza los indicadores de enfriamiento de habilidades
   */
  private updateSkillCooldowns(time: number) {
    for (let i = 0; i < 4; i++) {
      if (i < this.skills.length) {
        const skill = this.skills[i];
        const timeSinceLastUse = time - this.lastSkillTimes[i];
        const cooldown = skill.cooldown;
        
        if (timeSinceLastUse < cooldown) {
          // Mostrar tiempo restante
          const remainingSeconds = Math.ceil((cooldown - timeSinceLastUse) / 1000);
          this.skillCooldownTexts[i].setText(remainingSeconds.toString());
          
          // Actualizar indicador visual
          const indicator = this.skillIndicators[i];
          indicator.clear();
          indicator.fillStyle(0x333333, 0.8);
          indicator.fillRect(indicator.x, indicator.y, 40, 40);
          
          // Dibujar "pie chart" de enfriamiento
          const progress = timeSinceLastUse / cooldown;
          indicator.fillStyle(0x666666, 0.8);
          indicator.slice(
            indicator.x + 20,
            indicator.y + 20,
            20,
            0,
            Math.PI * 2 * progress,
            true
          );
        } else {
          // Habilidad disponible
          this.skillCooldownTexts[i].setText('');
          
          // Actualizar indicador visual
          const indicator = this.skillIndicators[i];
          indicator.clear();
          indicator.fillStyle(0x444444, 0.8);
          indicator.fillRect(indicator.x, indicator.y, 40, 40);
        }
      }
    }
  }
  
  /**
   * Usa una habilidad específica
   */
  private useSkill(index: number) {
    if (index >= this.skills.length) return;
    
    const currentTime = this.scene.time.now;
    const skill = this.skills[index];
    
    // Verificar enfriamiento
    if (currentTime - this.lastSkillTimes[index] < skill.cooldown) {
      console.log(`Habilidad ${this.skillKeys[index]} en enfriamiento`);
      return;
    }
    
    // Verificar mana
    if (this.currentStats.mana < skill.manaCost) {
      console.log(`Mana insuficiente para usar ${skill.name}`);
      return;
    }
    
    console.log(`Usando habilidad ${skill.name}`);
    
    // Consumir mana
    this.currentStats.mana -= skill.manaCost;
    
    // Aplicar efectos de la habilidad
    this.applySkillEffects(skill);
    
    // Actualizar tiempo de último uso
    this.lastSkillTimes[index] = currentTime;
    
    // Actualizar barras
    this.updateBars();
  }
  
  /**
   * Aplica los efectos de una habilidad
   */
  private applySkillEffects(skill: ChampionSkill) {
    for (const effect of skill.effects) {
      switch (effect.type) {
        case SkillEffectType.DAMAGE:
          this.applyDamageEffect(effect);
          break;
        case SkillEffectType.STUN:
          this.applyStunEffect(effect);
          break;
        case SkillEffectType.SHIELD:
          this.applyShieldEffect(effect);
          break;
        case SkillEffectType.HEAL:
          this.applyHealEffect(effect);
          break;
        case SkillEffectType.BUFF:
          this.applyBuffEffect(effect);
          break;
        case SkillEffectType.DASH:
          this.applyDashEffect(effect);
          break;
        case SkillEffectType.TELEPORT:
          this.applyTeleportEffect(effect);
          break;
        default:
          console.log(`Efecto no implementado: ${effect.type}`);
      }
    }
  }
  
  /**
   * Aplica un efecto de daño
   */
  private applyDamageEffect(effect: SkillEffect) {
    // Determinar el tipo de daño
    const damageType = effect.damageType || this.damageType;
    const range = effect.areaRadius || 100;
    
    // Si es área de efecto
    if (effect.areaOfEffect) {
      // Obtener todos los minions enemigos en el área
      const enemies = this.scene.children.getChildren().filter(
        child => child.type === 'Sprite' && 'isEnemy' in child && child.isEnemy
      ) as Phaser.GameObjects.Sprite[];
      
      const radius = effect.areaRadius || 100;
      
      for (const enemy of enemies) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
        if (distance <= radius && 'takeDamage' in enemy && typeof enemy.takeDamage === 'function') {
          // Aplicar daño según el tipo
          let damage = effect.value;
          if (damageType === DamageType.MAGICAL) {
            damage += this.currentStats.magicDamage;
          } else if (damageType === DamageType.PHYSICAL) {
            damage += this.currentStats.physicalDamage;
          }
          
          enemy.takeDamage(damage, true);
          
          // Crear efecto visual
          this.createDamageEffect(enemy, damageType);
        }
      }
    } else {
      // Buscar el enemigo más cercano en la dirección del ratón
      const pointer = this.scene.input.activePointer;
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      
      const enemy = this.findEnemyInDirection(worldPoint.x, worldPoint.y, range);
      
      if (enemy && 'takeDamage' in enemy && typeof enemy.takeDamage === 'function') {
        // Aplicar daño según el tipo
        let damage = effect.value;
        if (damageType === DamageType.MAGICAL) {
          damage += this.currentStats.magicDamage;
        } else if (damageType === DamageType.PHYSICAL) {
          damage += this.currentStats.physicalDamage;
        }
        
        enemy.takeDamage(damage, true);
        
        // Crear efecto visual
        this.createDamageEffect(enemy, damageType);
      }
    }
  }
  
  /**
   * Encuentra un enemigo en una dirección específica
   */
  private findEnemyInDirection(targetX: number, targetY: number, range: number): any {
    // Obtener todos los minions enemigos
    const enemies = this.scene.children.getChildren().filter(
      child => child.type === 'Sprite' && 'isEnemy' in child && child.isEnemy
    ) as Phaser.GameObjects.Sprite[];
    
    // Calcular dirección
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    
    // Buscar el enemigo más cercano en esa dirección
    let closestEnemy = null;
    let closestDistance = range;
    
    for (const enemy of enemies) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (distance <= range) {
        // Calcular ángulo hacia el enemigo
        const enemyAngle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
        
        // Calcular diferencia de ángulos
        const angleDiff = Phaser.Math.Angle.Wrap(enemyAngle - angle);
        
        // Si está en un cono de 45 grados
        if (Math.abs(angleDiff) <= Math.PI / 4) {
          if (distance < closestDistance) {
            closestEnemy = enemy;
            closestDistance = distance;
          }
        }
      }
    }
    
    return closestEnemy;
  }
  
  /**
   * Crea un efecto visual de daño
   */
  private createDamageEffect(target: any, damageType: DamageType) {
    // Color según tipo de daño
    let color = 0xffffff;
    if (damageType === DamageType.PHYSICAL) {
      color = 0xff0000;
    } else if (damageType === DamageType.MAGICAL) {
      color = 0x00ffff;
    } else if (damageType === DamageType.TRUE) {
      color = 0xffff00;
    }
    
    // Crear efecto de impacto
    const impact = this.scene.add.graphics();
    impact.fillStyle(color, 0.7);
    impact.fillCircle(target.x, target.y, 20);
    
    // Animar el efecto
    this.scene.tweens.add({
      targets: impact,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => {
        impact.destroy();
      }
    });
  }
  
  /**
   * Aplica un efecto de aturdimiento
   */
  private applyStunEffect(effect: SkillEffect) {
    // Similar a applyDamageEffect pero aplicando aturdimiento
    // Implementación básica: buscar enemigo y aplicar efecto
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    const enemy = this.findEnemyInDirection(worldPoint.x, worldPoint.y, 200);
    
    if (enemy && 'stun' in enemy && typeof enemy.stun === 'function') {
      enemy.stun(effect.duration || 1000);
      
      // Crear efecto visual
      const stunEffect = this.scene.add.graphics();
      stunEffect.lineStyle(2, 0xffff00, 1);
      stunEffect.strokeCircle(enemy.x, enemy.y, 30);
      
      // Animar el efecto
      this.scene.tweens.add({
        targets: stunEffect,
        alpha: 0,
        duration: effect.duration || 1000,
        onComplete: () => {
          stunEffect.destroy();
        }
      });
    }
  }
  
  /**
   * Aplica un efecto de escudo
   */
  private applyShieldEffect(effect: SkillEffect) {
    // Implementación básica: crear un escudo temporal
    console.log(`Escudo aplicado por ${effect.value} puntos durante ${effect.duration}ms`);
    
    // Crear efecto visual
    const shieldEffect = this.scene.add.graphics();
    shieldEffect.lineStyle(4, 0x00ffff, 0.7);
    shieldEffect.strokeCircle(this.x, this.y, 40);
    
    // Animar el efecto
    this.scene.tweens.add({
      targets: shieldEffect,
      alpha: 0,
      duration: effect.duration || 5000,
      onComplete: () => {
        shieldEffect.destroy();
      }
    });
  }
  
  /**
   * Aplica un efecto de curación
   */
  private applyHealEffect(effect: SkillEffect) {
    // Implementación básica: curar al jugador
    this.currentStats.health = Math.min(
      this.currentStats.health + effect.value,
      this.currentStats.maxHealth
    );
    
    // Crear efecto visual
    const healEffect = this.scene.add.graphics();
    healEffect.fillStyle(0x00ff00, 0.5);
    healEffect.fillCircle(this.x, this.y, 30);
    
    // Animar el efecto
    this.scene.tweens.add({
      targets: healEffect,
      alpha: 0,
      scale: 2,
      duration: 500,
      onComplete: () => {
        healEffect.destroy();
      }
    });
    
    // Mostrar texto de curación
    const healText = this.scene.add.text(
      this.x, 
      this.y - 50, 
      `+${effect.value} HP`, 
      { font: '16px Arial', color: '#00ff00' }
    );
    healText.setOrigin(0.5);
    
    // Animar el texto
    this.scene.tweens.add({
      targets: healText,
      y: healText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        healText.destroy();
      }
    });
  }
  
  /**
   * Aplica un efecto de mejora
   */
  private applyBuffEffect(effect: SkillEffect) {
    // Implementación básica: aumentar estadísticas temporalmente
    console.log(`Buff aplicado por ${effect.value} puntos durante ${effect.duration}ms`);
    
    // Crear efecto visual
    const buffEffect = this.scene.add.graphics();
    buffEffect.fillStyle(0xffaa00, 0.3);
    buffEffect.fillCircle(this.x, this.y, 35);
    
    // Animar el efecto
    this.scene.tweens.add({
      targets: buffEffect,
      alpha: 0,
      scale: 1.5,
      duration: 500,
      onComplete: () => {
        buffEffect.destroy();
      }
    });
  }
  
  /**
   * Aplica un efecto de dash (carga rápida)
   */
  private applyDashEffect(effect: SkillEffect) {
    // Implementación básica: moverse rápidamente en la dirección del ratón
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
    const distance = Math.min(
      Phaser.Math.Distance.Between(this.x, this.y, worldPoint.x, worldPoint.y),
      effect.value
    );
    
    const targetX = this.x + Math.cos(angle) * distance;
    const targetY = this.y + Math.sin(angle) * distance;
    
    // Crear efecto de estela
    const trail = this.scene.add.graphics();
    trail.lineStyle(3, 0xffffff, 0.5);
    trail.lineBetween(this.x, this.y, targetX, targetY);
    
    // Animar el dash
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        // Desvanecer la estela
        this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            trail.destroy();
          }
        });
      }
    });
  }
  
  /**
   * Aplica un efecto de teletransporte
   */
  private applyTeleportEffect(effect: SkillEffect) {
    // Implementación básica: teletransportarse a la posición del ratón
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
    const distance = Math.min(
      Phaser.Math.Distance.Between(this.x, this.y, worldPoint.x, worldPoint.y),
      effect.value
    );
    
    const targetX = this.x + Math.cos(angle) * distance;
    const targetY = this.y + Math.sin(angle) * distance;
    
    // Crear efecto de desaparición
    const disappearEffect = this.scene.add.graphics();
    disappearEffect.fillStyle(0x0000ff, 0.5);
    disappearEffect.fillCircle(this.x, this.y, 30);
    
    // Crear efecto de aparición
    const appearEffect = this.scene.add.graphics();
    appearEffect.fillStyle(0x0000ff, 0);
    appearEffect.fillCircle(targetX, targetY, 30);
    
    // Animar desaparición
    this.scene.tweens.add({
      targets: disappearEffect,
      alpha: 0,
      scale: 0.5,
      duration: 200,
      onComplete: () => {
        disappearEffect.destroy();
        
        // Teletransportar
        this.x = targetX;
        this.y = targetY;
        
        // Animar aparición
        appearEffect.alpha = 0.5;
        this.scene.tweens.add({
          targets: appearEffect,
          alpha: 0,
          scale: 2,
          duration: 300,
          onComplete: () => {
            appearEffect.destroy();
          }
        });
      }
    });
  }
  
  public attack(target: any) {
    // Verificar que el objetivo es válido
    if (!target || !target.active) return;
    
    // Verificar que el objetivo tiene posición
    if (!('x' in target) && !('y' in target)) return;
    
    // Verificar que el objetivo es un enemigo (minion, torre o campeón)
    const isEnemyMinion = 'minionType' in target && target.minionType === 'enemy';
    const isEnemyTower = 'getTeam' in target && target.getTeam() === 'enemy';
    const isEnemyChampion = 'isEnemy' in target && target.isEnemy;
    
    if (!isEnemyMinion && !isEnemyTower && !isEnemyChampion) return;
    
    // Verificar que el objetivo está en rango
    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    if (distance > this.attackRange) return;
    
    // Verificar que ha pasado el tiempo de enfriamiento
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastAttackTime < this.attackCooldown) return;
    
    // Registrar el tiempo del último ataque
    this.lastAttackTime = currentTime;
    
    // Calcular daño según estadísticas
    let damage = this.currentStats.physicalDamage;
    
    // Aplicar daño al objetivo
    if ('takeDamage' in target && typeof target.takeDamage === 'function') {
      target.takeDamage(damage);
      
      // Crear efecto visual según el tipo de ataque
      if (this.attackType === AttackType.MELEE) {
        this.createMeleeAttackEffect(target);
      } else {
        this.createRangedAttackEffect(target);
      }
      
      // Si el objetivo es un minion, alertar a los minions aliados cercanos
      if (isEnemyMinion) {
        this.alertNearbyAllies(target);
      }
    }
  }
  
  /**
   * Crea un efecto visual de ataque cuerpo a cuerpo
   */
  private createMeleeAttackEffect(target: any): void {
    // Crear efecto de golpe
    const attackEffect = this.scene.add.graphics();
    attackEffect.fillStyle(0xffffff, 0.7);
    attackEffect.fillCircle(target.x, target.y, 15);
    
    // Desvanecer el efecto
    this.scene.tweens.add({
      targets: attackEffect,
      alpha: 0,
      scale: 1.5,
      duration: 200,
      onComplete: () => {
        attackEffect.destroy();
      }
    });
  }
  
  /**
   * Crea un efecto visual de ataque a distancia
   */
  private createRangedAttackEffect(target: any): void {
    // Crear proyectil
    const projectile = this.scene.add.graphics();
    
    // Color según tipo de daño
    let color = 0xffffff;
    if (this.damageType === DamageType.PHYSICAL) {
      color = 0xff8800;
    } else if (this.damageType === DamageType.MAGICAL) {
      color = 0x00ffff;
    }
    
    projectile.fillStyle(color, 1);
    projectile.fillCircle(this.x, this.y, 5);
    
    // Animar el proyectil
    this.scene.tweens.add({
      targets: projectile,
      x: target.x,
      y: target.y,
      duration: 200,
      onComplete: () => {
        // Crear efecto de impacto
        const impact = this.scene.add.graphics();
        impact.fillStyle(color, 0.7);
        impact.fillCircle(target.x, target.y, 15);
        
        // Desvanecer el impacto
        this.scene.tweens.add({
          targets: impact,
          alpha: 0,
          scale: 1.5,
          duration: 200,
          onComplete: () => {
            impact.destroy();
          }
        });
        
        projectile.destroy();
      }
    });
  }
  
  /**
   * Verifica minions cercanos para ganar experiencia
   */
  private checkNearbyMinionsForExperience(): void {
    // Obtener todos los minions
    const minions = this.scene.children.getChildren().filter(
      child => child.type === 'Sprite' && 
      ('isAlly' in child || 'isEnemy' in child) &&
      'getData' in child
    ) as Phaser.GameObjects.Sprite[];
    
    // Verificar minions que murieron recientemente
    for (const minion of minions) {
      const isDying = minion.getData('isDying');
      const experienceGiven = minion.getData('experienceGiven');
      
      if (isDying && !experienceGiven) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, minion.x, minion.y);
        
        // Si el minion está dentro del radio de experiencia, ganar experiencia
        if (distance <= this.experienceRadius) {
          // Marcar que ya dio experiencia
          minion.setData('experienceGiven', true);
          
          // Ganar experiencia
          this.addExperience(10);
        }
      }
    }
  }
  
  /**
   * Añade oro al jugador (solo cuando el jugador da el último golpe)
   */
  public addGold(amount: number): void {
    this.gold += amount;
    this.updateStatsText();
    
    // Mostrar texto flotante con el oro ganado
    this.showGoldText(amount);
  }
  
  /**
   * Incrementa el contador de minions matados (solo cuando el jugador da el último golpe)
   */
  public addMinionKill(): void {
    this.minionsKilled++;
    this.updateStatsText();
  }
  
  /**
   * Añade experiencia al jugador y sube de nivel si es necesario
   */
  public addExperience(amount: number): void {
    if (this.level >= this.maxLevel) return;
    
    this.experience += amount;
    
    // Mostrar texto flotante con la experiencia ganada
    this.showExperienceText(amount);
    
    // Verificar si subimos de nivel
    this.checkLevelUp();
    
    this.updateStatsText();
  }
  
  /**
   * Verifica si el jugador sube de nivel
   */
  private checkLevelUp(): void {
    // Experiencia necesaria para el siguiente nivel: 100 * nivel actual
    const expNeeded = 100 * this.level;
    
    if (this.experience >= expNeeded) {
      // Subir de nivel
      this.levelUp();
      
      // Restar la experiencia usada
      this.experience -= expNeeded;
      
      // Verificar si podemos subir más niveles
      this.checkLevelUp();
    }
  }
  
  /**
   * Sube de nivel al jugador y mejora sus estadísticas
   */
  private levelUp(): void {
    if (this.level >= this.maxLevel) return;
    
    this.level++;
    
    // Mejorar estadísticas base
    this.baseStats.maxHealth += 100;
    this.baseStats.health = this.baseStats.maxHealth;
    this.baseStats.maxMana += 50;
    this.baseStats.mana = this.baseStats.maxMana;
    this.baseStats.physicalDamage += 10;
    this.baseStats.magicDamage += 5;
    this.baseStats.physicalResistance += 2;
    this.baseStats.magicResistance += 2;
    
    // Actualizar estadísticas actuales
    this.recalculateStats();
    
    // Mostrar efecto de subida de nivel
    this.showLevelUpEffect();
    
    // Actualizar texto de nivel
    this.levelText.setText(`Lvl ${this.level}`);
  }
  
  /**
   * Recalcula las estadísticas actuales basadas en las estadísticas base y los items
   */
  private recalculateStats(): void {
    // Reiniciar a las estadísticas base
    this.currentStats = { ...this.baseStats };
    
    // Aplicar bonificaciones de items
    for (const item of this.items) {
      for (const [key, value] of Object.entries(item.stats)) {
        if (value !== undefined) {
          this.currentStats[key as keyof PlayerStats] += value;
        }
      }
    }
    
    // Asegurarse de que la salud y el mana no excedan los máximos
    this.currentStats.health = Math.min(this.currentStats.health, this.currentStats.maxHealth);
    this.currentStats.mana = Math.min(this.currentStats.mana, this.currentStats.maxMana);
  }
  
  /**
   * Muestra un efecto visual de subida de nivel
   */
  private showLevelUpEffect(): void {
    // Crear efecto de subida de nivel
    const levelUpEffect = this.scene.add.graphics();
    levelUpEffect.fillStyle(0xffff00, 0.5);
    levelUpEffect.fillCircle(this.x, this.y, 50);
    
    // Animar el efecto
    this.scene.tweens.add({
      targets: levelUpEffect,
      alpha: 0,
      scale: 2,
      duration: 1000,
      onComplete: () => {
        levelUpEffect.destroy();
      }
    });
    
    // Mostrar texto de subida de nivel
    const levelUpText = this.scene.add.text(
      this.x, 
      this.y - 60, 
      'LEVEL UP!', 
      { font: '18px Arial', color: '#ffff00' }
    );
    levelUpText.setOrigin(0.5);
    levelUpText.setDepth(100);
    
    // Animar el texto
    this.scene.tweens.add({
      targets: levelUpText,
      y: levelUpText.y - 30,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        levelUpText.destroy();
      }
    });
  }
  
  /**
   * Muestra un texto flotante con el oro ganado
   */
  private showGoldText(amount: number): void {
    const goldText = this.scene.add.text(
      this.x, 
      this.y - 40, 
      `+${amount} gold`, 
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
        goldText.destroy();
      }
    });
  }
  
  /**
   * Muestra un texto flotante con la experiencia ganada
   */
  private showExperienceText(amount: number): void {
    const expText = this.scene.add.text(
      this.x + 20, 
      this.y - 40, 
      `+${amount} exp`, 
      { font: '14px Arial', color: '#00ffff' }
    );
    expText.setDepth(100);
    
    // Animar el texto
    this.scene.tweens.add({
      targets: expText,
      y: expText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        expText.destroy();
      }
    });
  }
  
  /**
   * Actualiza el texto de estadísticas
   */
  private updateStatsText(): void {
    this.statsText.setText(this.getStatsText());
  }
  
  /**
   * Obtiene el texto de estadísticas
   */
  private getStatsText(): string {
    return `Gold: ${this.gold} | Minions: ${this.minionsKilled} | Level: ${this.level} | Exp: ${this.experience}/${100 * this.level}
HP: ${Math.floor(this.currentStats.health)}/${this.currentStats.maxHealth} | Mana: ${Math.floor(this.currentStats.mana)}/${this.currentStats.maxMana}
Dmg: ${this.currentStats.physicalDamage} | M.Dmg: ${this.currentStats.magicDamage} | T.Dmg: ${this.currentStats.trueDamage}
Res: ${this.currentStats.physicalResistance} | M.Res: ${this.currentStats.magicResistance} | Speed: ${this.currentStats.moveSpeed}`;
  }
  
  /**
   * Busca un minion en una posición específica
   */
  private findMinionAtPosition(x: number, y: number): any {
    return this.findTargetAtPosition(x, y);
  }
  
  /**
   * Actualiza la lista de objetivos potenciales
   */
  public updateTargets(targets: Phaser.GameObjects.GameObject[]): void {
    this.potentialTargets = targets.filter(t => t && t !== this && t.active);
  }
  
  /**
   * Encuentra el objetivo en una posición específica
   */
  private findTargetAtPosition(x: number, y: number): any {
    // Buscar entre todos los objetivos potenciales
    for (const target of this.potentialTargets) {
      if (!target.active) continue;
      
      // Asegurarse de que el objetivo tiene posición
      if (!('x' in target) || !('y' in target)) continue;
      
      // Verificar si el objetivo está en la posición
      const distance = Phaser.Math.Distance.Between(x, y, (target as any).x, (target as any).y);
      if (distance <= 32) {  // Radio de colisión aproximado
        return target;
      }
    }
    
    return null;
  }
  
  /**
   * Ataca a un minion específico
   */
  private attackMinion(minion: any): void {
    // Guardar el minion como objetivo
    this.setData('targetMinion', minion);
    
    // Calcular la distancia al minion
    const distance = Phaser.Math.Distance.Between(this.x, this.y, minion.x, minion.y);
    
    if (distance <= this.attackRange) {
      // Si estamos en rango, atacar directamente
      this.attack(minion);
    } else {
      // Si no estamos en rango, movernos hacia el minion
      // Calcular posición para estar en rango de ataque
      const angle = Phaser.Math.Angle.Between(this.x, this.y, minion.x, minion.y);
      
      // Calcular una posición que esté a la distancia de ataque del minion
      // Restamos un pequeño margen para no quedarnos justo en el borde
      const attackDistance = this.attackRange * 0.9;
      const targetX = minion.x - Math.cos(angle) * attackDistance;
      const targetY = minion.y - Math.sin(angle) * attackDistance;
      
      // Movernos a esa posición
      this.moveToPosition(targetX, targetY);
      
      // Mostrar indicador de movimiento
      this.showMoveTarget(targetX, targetY);
    }
  }
  
  /**
   * Compra un item si tiene suficiente oro
   */
  public buyItem(item: Item): boolean {
    if (this.gold >= item.cost) {
      this.gold -= item.cost;
      this.items.push(item);
      
      // Recalcular estadísticas
      this.recalculateStats();
      
      // Actualizar texto de estadísticas
      this.updateStatsText();
      
      // Actualizar lista de items
      this.updateItemsList();
      
      // Mostrar mensaje de compra
      this.showItemPurchaseMessage(item);
      
      return true;
    } else {
      // Mostrar mensaje de oro insuficiente
      this.showInsufficientGoldMessage();
      return false;
    }
  }
  
  /**
   * Actualiza la lista de items en el panel
   */
  private updateItemsList(): void {
    // Limpiar lista anterior
    for (const itemText of this.itemsList) {
      itemText.destroy();
    }
    this.itemsList = [];
    
    // Crear nueva lista
    let y = 40;
    for (const item of this.items) {
      const itemText = this.scene.add.text(10, y, `${item.icon || ''} ${item.name}`, {
        font: '14px Arial',
        color: '#ffffff'
      });
      this.itemsPanel.add(itemText);
      this.itemsList.push(itemText);
      y += 20;
    }
    
    // Ajustar tamaño del fondo
    const height = Math.max(300, y + 10);
    this.itemsBackground.height = height;
  }
  
  /**
   * Muestra un mensaje de compra exitosa
   */
  private showItemPurchaseMessage(item: Item): void {
    const purchaseText = this.scene.add.text(
      this.scene.cameras.main.centerX, 
      this.scene.cameras.main.centerY - 100, 
      `¡Comprado: ${item.icon || ''} ${item.name}!`, 
      { font: '18px Arial', color: '#00ff00', backgroundColor: '#000000' }
    );
    purchaseText.setOrigin(0.5);
    purchaseText.setScrollFactor(0);
    purchaseText.setDepth(100);
    
    // Animar el texto
    this.scene.tweens.add({
      targets: purchaseText,
      y: purchaseText.y - 50,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        purchaseText.destroy();
      }
    });
  }
  
  /**
   * Muestra un mensaje de oro insuficiente
   */
  private showInsufficientGoldMessage(): void {
    const errorText = this.scene.add.text(
      this.scene.cameras.main.centerX, 
      this.scene.cameras.main.centerY - 100, 
      '¡Oro insuficiente!', 
      { font: '18px Arial', color: '#ff0000', backgroundColor: '#000000' }
    );
    errorText.setOrigin(0.5);
    errorText.setScrollFactor(0);
    errorText.setDepth(100);
    
    // Animar el texto
    this.scene.tweens.add({
      targets: errorText,
      y: errorText.y - 50,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        errorText.destroy();
      }
    });
  }
  
  // Propiedades para identificación
  get isAlly(): boolean {
    return true;
  }
  
  get isEnemy(): boolean {
    return false;
  }
  
  // Destrucción completa
  destroy(fromScene?: boolean): void {
    if (this.healthBar) this.healthBar.destroy();
    if (this.manaBar) this.manaBar.destroy();
    if (this.moveTarget) this.moveTarget.destroy();
    if (this.statsText) this.statsText.destroy();
    if (this.levelText) this.levelText.destroy();
    if (this.experienceRadiusGraphics) this.experienceRadiusGraphics.destroy();
    if (this.itemsPanel) this.itemsPanel.destroy();
    
    // Destruir indicadores de habilidades
    for (const indicator of this.skillIndicators) {
      indicator.destroy();
    }
    
    for (const text of this.skillCooldownTexts) {
      text.destroy();
    }
    
    super.destroy(fromScene);
  }
  
  /**
   * Alerta a los minions aliados cercanos para que ataquen al objetivo
   */
  private alertNearbyAllies(target: any): void {
    // Obtener todos los minions aliados
    const allyMinions = this.scene.children.getChildren().filter(
      child => child.type === 'Sprite' && 'isAlly' in child && child.isAlly
    ) as Phaser.GameObjects.Sprite[];
    
    // Radio de alerta
    const alertRadius = 150;
    
    // Alertar a los minions cercanos
    for (const minion of allyMinions) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, minion.x, minion.y);
      if (distance <= alertRadius && 'aggroPlayer' in minion && typeof minion.aggroPlayer === 'function') {
        // Hacer que el minion ataque al objetivo
        minion.aggroPlayer(target);
      }
    }
  }
  
  /**
   * Obtiene las estadísticas actuales del jugador
   */
  public getCurrentStats(): PlayerStats {
    return this.currentStats;
  }
  
  /**
   * Obtiene el nivel actual del jugador
   */
  public getLevel(): number {
    return this.level;
  }
  
  /**
   * Obtiene la experiencia actual del jugador
   */
  public getExperience(): number {
    return this.experience;
  }
  
  /**
   * Obtiene la experiencia necesaria para el siguiente nivel
   */
  public getExperienceForNextLevel(): number {
    return 100 * this.level;
  }
  
  /**
   * Obtiene la cantidad de oro del jugador
   */
  public getGold(): number {
    return this.gold;
  }
  
  /**
   * Obtiene la cantidad de minions eliminados por el jugador
   */
  public getMinionsKilled(): number {
    return this.minionsKilled;
  }
  
  /**
   * Obtiene las habilidades del jugador
   */
  public getSkills(): ChampionSkill[] {
    return this.skills;
  }
  
  /**
   * Obtiene los cooldowns de las habilidades
   */
  public getSkillCooldowns(): number[] {
    return this.skillCooldowns;
  }
  
  /**
   * Obtiene los tiempos de último uso de las habilidades
   */
  public getLastSkillTimes(): number[] {
    return this.lastSkillTimes;
  }
  
  /**
   * Obtiene el campeón seleccionado
   */
  public getChampion(): ChampionDefinition {
    return this.champion;
  }
} 