import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { ChampionSkill } from '../types/Champion';

export class PlayerHUD {
  private scene: Phaser.Scene;
  private player: Player;
  
  // Contenedor principal del HUD
  private container!: Phaser.GameObjects.Container;
  
  // Barras de estado
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private manaBar!: Phaser.GameObjects.Graphics;
  private manaText!: Phaser.GameObjects.Text;
  private experienceBar!: Phaser.GameObjects.Graphics;
  private experienceText!: Phaser.GameObjects.Text;
  
  // Nivel
  private levelBadge!: Phaser.GameObjects.Container;
  private levelText!: Phaser.GameObjects.Text;
  
  // Habilidades
  private skillsContainer!: Phaser.GameObjects.Container;
  private skillBackgrounds: Phaser.GameObjects.Rectangle[] = [];
  private skillIcons: Phaser.GameObjects.Image[] = [];
  private skillCooldownOverlays: Phaser.GameObjects.Graphics[] = [];
  private skillCooldownTexts: Phaser.GameObjects.Text[] = [];
  private skillKeyTexts: Phaser.GameObjects.Text[] = [];
  
  // Estadísticas
  private goldText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  
  // Dimensiones y posiciones
  private readonly HUD_HEIGHT = 60;
  private readonly SKILL_SIZE = 40;
  private readonly SKILL_SPACING = 4;
  private readonly BAR_HEIGHT = 12;
  private readonly BAR_WIDTH = 150;
  private readonly LEVEL_BADGE_SIZE = 30;
  private readonly HUD_PADDING = 8;
  private readonly HUD_BORDER_RADIUS = 6;
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    
    // Crear contenedor principal - Asegurarse de que siempre esté en la parte inferior
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);
    
    // Crear fondo del HUD
    const background = scene.add.rectangle(
      0, 
      0, 
      scene.cameras.main.width, 
      this.HUD_HEIGHT, 
      0x000000, 
      0.8
    );
    background.setOrigin(0, 0);
    this.container.add(background);
    
    // Añadir borde superior al HUD
    const borderTop = scene.add.rectangle(
      0,
      0,
      scene.cameras.main.width,
      2,
      0x666666,
      1
    );
    borderTop.setOrigin(0, 0);
    this.container.add(borderTop);
    
    // Inicializar elementos del HUD
    this.createHealthBar();
    this.createManaBar();
    this.createExperienceBar();
    this.createLevelBadge();
    this.createSkillsDisplay();
    this.createStatsDisplay();
    
    // Actualizar el HUD inicialmente
    this.update();
    
    // Asegurarse de que el HUD se reposicione cuando cambie el tamaño de la cámara
    this.scene.scale.on('resize', this.handleResize, this);
    
    // Posicionar el HUD inicialmente
    this.handleResize();
  }
  
  /**
   * Maneja el cambio de tamaño de la ventana
   */
  private handleResize(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Posicionar el HUD en la parte inferior de la pantalla
    this.container.setPosition(0, height - this.HUD_HEIGHT);
    
    // Ajustar el ancho del fondo del HUD
    const background = this.container.getAt(0) as Phaser.GameObjects.Rectangle;
    background.width = width;
    
    // Ajustar el ancho del borde superior
    const borderTop = this.container.getAt(1) as Phaser.GameObjects.Rectangle;
    borderTop.width = width;
    
    // Reposicionar la barra de experiencia
    this.updateExperienceBar();
    
    // Reposicionar las estadísticas
    this.goldText.setPosition(width - this.HUD_PADDING, 10);
    this.killsText.setPosition(width - this.HUD_PADDING, 30);
    
    // Reposicionar las habilidades en el centro
    this.skillsContainer.setPosition(
      width / 2 - (this.SKILL_SIZE * 4 + this.SKILL_SPACING * 3) / 2, 
      10
    );
  }
  
  /**
   * Actualiza todos los elementos del HUD
   */
  public update(): void {
    this.updateHealthBar();
    this.updateManaBar();
    this.updateExperienceBar();
    this.updateLevelBadge();
    this.updateSkillsDisplay();
    this.updateStatsDisplay();
  }
  
  /**
   * Crea la barra de salud
   */
  private createHealthBar(): void {
    // Contenedor para la barra de salud
    const healthContainer = this.scene.add.container(this.HUD_PADDING, 15);
    this.container.add(healthContainer);
    
    // Fondo de la barra
    const healthBackground = this.scene.add.rectangle(
      0, 
      0, 
      this.BAR_WIDTH, 
      this.BAR_HEIGHT, 
      0x333333,
      0.8
    );
    healthBackground.setOrigin(0, 0);
    healthBackground.setStrokeStyle(1, 0x666666);
    healthContainer.add(healthBackground);
    
    // Barra de salud
    this.healthBar = this.scene.add.graphics();
    healthContainer.add(this.healthBar);
    
    // Texto de salud
    this.healthText = this.scene.add.text(
      this.BAR_WIDTH / 2, 
      this.BAR_HEIGHT / 2, 
      '', 
      { 
        font: 'bold 12px Arial', 
        color: '#ffffff' 
      }
    );
    this.healthText.setOrigin(0.5);
    healthContainer.add(this.healthText);
  }
  
  /**
   * Actualiza la barra de salud
   */
  private updateHealthBar(): void {
    const health = this.player.getCurrentStats().health;
    const maxHealth = this.player.getCurrentStats().maxHealth;
    const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
    
    // Actualizar gráfico
    this.healthBar.clear();
    
    // Usar color sólido en lugar de gradiente
    this.healthBar.fillStyle(0xdd3333);
    this.healthBar.fillRoundedRect(0, 0, this.BAR_WIDTH * healthPercent, this.BAR_HEIGHT, {
      tl: 0,
      tr: 0,
      bl: 0,
      br: 0
    });
    
    // Añadir líneas decorativas
    this.healthBar.lineStyle(1, 0xffffff, 0.2);
    for (let i = 1; i < 10; i++) {
      const x = (this.BAR_WIDTH / 10) * i;
      if (x <= this.BAR_WIDTH * healthPercent) {
        this.healthBar.beginPath();
        this.healthBar.moveTo(x, 0);
        this.healthBar.lineTo(x, this.BAR_HEIGHT);
        this.healthBar.strokePath();
      }
    }
    
    // Actualizar texto
    this.healthText.setText(`${Math.floor(health)} / ${maxHealth}`);
  }
  
  /**
   * Crea la barra de mana
   */
  private createManaBar(): void {
    // Contenedor para la barra de mana
    const manaContainer = this.scene.add.container(this.HUD_PADDING, 35);
    this.container.add(manaContainer);
    
    // Fondo de la barra
    const manaBackground = this.scene.add.rectangle(
      0, 
      0, 
      this.BAR_WIDTH, 
      this.BAR_HEIGHT, 
      0x333333,
      0.8
    );
    manaBackground.setOrigin(0, 0);
    manaBackground.setStrokeStyle(1, 0x666666);
    manaContainer.add(manaBackground);
    
    // Barra de mana
    this.manaBar = this.scene.add.graphics();
    manaContainer.add(this.manaBar);
    
    // Texto de mana
    this.manaText = this.scene.add.text(
      this.BAR_WIDTH / 2, 
      this.BAR_HEIGHT / 2, 
      '', 
      { 
        font: 'bold 12px Arial', 
        color: '#ffffff' 
      }
    );
    this.manaText.setOrigin(0.5);
    manaContainer.add(this.manaText);
  }
  
  /**
   * Actualiza la barra de mana
   */
  private updateManaBar(): void {
    const mana = this.player.getCurrentStats().mana;
    const maxMana = this.player.getCurrentStats().maxMana;
    const manaPercent = Math.max(0, Math.min(1, mana / maxMana));
    
    // Actualizar gráfico
    this.manaBar.clear();
    
    // Usar color sólido en lugar de gradiente
    this.manaBar.fillStyle(0x3333dd);
    this.manaBar.fillRoundedRect(0, 0, this.BAR_WIDTH * manaPercent, this.BAR_HEIGHT, {
      tl: 0,
      tr: 0,
      bl: 0,
      br: 0
    });
    
    // Añadir líneas decorativas
    this.manaBar.lineStyle(1, 0xffffff, 0.2);
    for (let i = 1; i < 10; i++) {
      const x = (this.BAR_WIDTH / 10) * i;
      if (x <= this.BAR_WIDTH * manaPercent) {
        this.manaBar.beginPath();
        this.manaBar.moveTo(x, 0);
        this.manaBar.lineTo(x, this.BAR_HEIGHT);
        this.manaBar.strokePath();
      }
    }
    
    // Actualizar texto
    this.manaText.setText(`${Math.floor(mana)} / ${maxMana}`);
  }
  
  /**
   * Crea la barra de experiencia
   */
  private createExperienceBar(): void {
    // Barra de experiencia en la parte inferior del HUD
    const expBarHeight = 4;
    const expContainer = this.scene.add.container(0, this.HUD_HEIGHT - expBarHeight);
    this.container.add(expContainer);
    
    // Fondo de la barra
    const expBackground = this.scene.add.rectangle(
      0, 
      0, 
      this.scene.cameras.main.width, 
      expBarHeight, 
      0x333333,
      0.8
    );
    expBackground.setOrigin(0, 0);
    expContainer.add(expBackground);
    
    // Barra de experiencia
    this.experienceBar = this.scene.add.graphics();
    expContainer.add(this.experienceBar);
    
    // Texto de experiencia (se mostrará al pasar el ratón)
    this.experienceText = this.scene.add.text(
      this.scene.cameras.main.width / 2, 
      -10, 
      '', 
      { 
        font: '10px Arial',
        color: '#ffffff',
        backgroundColor: '#000000'
      }
    );
    this.experienceText.setOrigin(0.5, 1);
    this.experienceText.setAlpha(0);
    expContainer.add(this.experienceText);
    
    // Mostrar texto al pasar el ratón
    expBackground.setInteractive();
    expBackground.on('pointerover', () => {
      this.experienceText.setAlpha(1);
    });
    expBackground.on('pointerout', () => {
      this.experienceText.setAlpha(0);
    });
  }
  
  /**
   * Actualiza la barra de experiencia
   */
  private updateExperienceBar(): void {
    const experience = this.player.getExperience();
    const expNeeded = this.player.getExperienceForNextLevel();
    const expPercent = Math.max(0, Math.min(1, experience / expNeeded));
    
    // Actualizar gráfico
    this.experienceBar.clear();
    
    // Usar color sólido
    this.experienceBar.fillStyle(0x00aaaa);
    this.experienceBar.fillRect(0, 0, this.scene.cameras.main.width * expPercent, 4);
    
    // Actualizar texto
    this.experienceText.setText(`Experiencia: ${experience} / ${expNeeded}`);
  }
  
  /**
   * Crea el indicador de nivel
   */
  private createLevelBadge(): void {
    // Contenedor para el nivel
    this.levelBadge = this.scene.add.container(
      this.BAR_WIDTH + 30, 
      this.BAR_HEIGHT + 10
    );
    this.container.add(this.levelBadge);
    
    // Fondo del nivel
    const levelBackground = this.scene.add.circle(
      0, 
      0, 
      this.LEVEL_BADGE_SIZE / 2, 
      0x666666
    );
    levelBackground.setStrokeStyle(2, 0xaaaaaa);
    this.levelBadge.add(levelBackground);
    
    // Texto del nivel
    this.levelText = this.scene.add.text(
      0, 
      0, 
      '', 
      { 
        font: 'bold 16px Arial', 
        color: '#ffffff' 
      }
    );
    this.levelText.setOrigin(0.5);
    this.levelBadge.add(this.levelText);
  }
  
  /**
   * Actualiza el indicador de nivel
   */
  private updateLevelBadge(): void {
    const level = this.player.getLevel();
    this.levelText.setText(`${level}`);
  }
  
  /**
   * Crea los indicadores de habilidades
   */
  private createSkillsDisplay(): void {
    // Contenedor para las habilidades
    this.skillsContainer = this.scene.add.container(
      this.scene.cameras.main.width / 2 - (this.SKILL_SIZE * 4 + this.SKILL_SPACING * 3) / 2, 
      15
    );
    this.container.add(this.skillsContainer);
    
    // Crear indicadores para cada habilidad
    const skills = this.player.getSkills();
    const skillKeys = ['Q', 'W', 'E', 'R'];
    const skillTextures = ['skill_q', 'skill_w', 'skill_e', 'skill_r'];
    
    for (let i = 0; i < 4; i++) {
      const x = i * (this.SKILL_SIZE + this.SKILL_SPACING);
      
      // Fondo de la habilidad
      const background = this.scene.add.rectangle(
        x, 
        0, 
        this.SKILL_SIZE, 
        this.SKILL_SIZE, 
        0x333333,
        0.8
      );
      background.setOrigin(0, 0);
      background.setStrokeStyle(1, 0x666666);
      this.skillsContainer.add(background);
      this.skillBackgrounds.push(background);
      
      // Icono de la habilidad
      const icon = this.scene.add.image(
        x + this.SKILL_SIZE / 2, 
        this.SKILL_SIZE / 2, 
        skillTextures[i]
      );
      icon.setDisplaySize(this.SKILL_SIZE - 8, this.SKILL_SIZE - 8);
      this.skillsContainer.add(icon);
      this.skillIcons.push(icon);
      
      // Overlay para el cooldown
      const cooldownOverlay = this.scene.add.graphics();
      this.skillsContainer.add(cooldownOverlay);
      this.skillCooldownOverlays.push(cooldownOverlay);
      
      // Texto de cooldown
      const cooldownText = this.scene.add.text(
        x + this.SKILL_SIZE / 2, 
        this.SKILL_SIZE / 2, 
        '', 
        { 
          font: 'bold 16px Arial', 
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3
        }
      );
      cooldownText.setOrigin(0.5);
      this.skillsContainer.add(cooldownText);
      this.skillCooldownTexts.push(cooldownText);
      
      // Texto de tecla
      const keyText = this.scene.add.text(
        x + 5, 
        5, 
        skillKeys[i], 
        { 
          font: 'bold 12px Arial', 
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 3, y: 1 }
        }
      );
      this.skillsContainer.add(keyText);
      this.skillKeyTexts.push(keyText);
    }
  }
  
  /**
   * Actualiza los indicadores de habilidades
   */
  private updateSkillsDisplay(): void {
    const skills = this.player.getSkills();
    const cooldowns = this.player.getSkillCooldowns();
    const lastUseTimes = this.player.getLastSkillTimes();
    const currentTime = this.scene.time.now;
    
    for (let i = 0; i < 4; i++) {
      if (i < skills.length) {
        const skill = skills[i];
        const timeSinceLastUse = currentTime - lastUseTimes[i];
        const cooldown = skill.cooldown;
        
        if (timeSinceLastUse < cooldown) {
          // Habilidad en cooldown
          const remainingSeconds = Math.ceil((cooldown - timeSinceLastUse) / 1000);
          this.skillCooldownTexts[i].setText(remainingSeconds.toString());
          
          // Actualizar overlay de cooldown (efecto de oscurecimiento)
          const progress = timeSinceLastUse / cooldown;
          this.skillCooldownOverlays[i].clear();
          this.skillCooldownOverlays[i].fillStyle(0x000000, 0.7);
          
          // Dibujar un "pie chart" para mostrar el cooldown
          this.skillCooldownOverlays[i].beginPath();
          this.skillCooldownOverlays[i].moveTo(
            this.skillIcons[i].x, 
            this.skillIcons[i].y
          );
          this.skillCooldownOverlays[i].arc(
            this.skillIcons[i].x,
            this.skillIcons[i].y,
            this.SKILL_SIZE / 2 - 4,
            -Math.PI / 2,
            -Math.PI / 2 + (1 - progress) * Math.PI * 2,
            true
          );
          this.skillCooldownOverlays[i].closePath();
          this.skillCooldownOverlays[i].fill();
          
          // Desaturar el icono
          this.skillIcons[i].setTint(0x888888);
        } else {
          // Habilidad disponible
          this.skillCooldownTexts[i].setText('');
          this.skillCooldownOverlays[i].clear();
          this.skillIcons[i].clearTint();
        }
        
        // Verificar si hay suficiente mana
        const mana = this.player.getCurrentStats().mana;
        if (mana < skill.manaCost) {
          // No hay suficiente mana - usar setFillColor en lugar de setTint
          this.skillBackgrounds[i].setFillStyle(0x660000, 0.8);
        } else {
          // Hay suficiente mana - usar setFillColor en lugar de setTint
          this.skillBackgrounds[i].setFillStyle(0x333333, 0.8);
        }
      } else {
        // Habilidad no disponible (campeón no tiene tantas habilidades)
        this.skillCooldownTexts[i].setText('');
        this.skillCooldownOverlays[i].clear();
        // Usar setFillColor en lugar de setTint
        this.skillBackgrounds[i].setFillStyle(0x222222, 0.8);
        this.skillIcons[i].setAlpha(0.5);
      }
    }
  }
  
  /**
   * Crea los indicadores de estadísticas
   */
  private createStatsDisplay(): void {
    // Oro
    this.goldText = this.scene.add.text(
      this.scene.cameras.main.width - this.HUD_PADDING, 
      15, 
      '', 
      { 
        font: 'bold 16px Arial', 
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.goldText.setOrigin(1, 0);
    this.container.add(this.goldText);
    
    // Kills
    this.killsText = this.scene.add.text(
      this.scene.cameras.main.width - this.HUD_PADDING, 
      40, 
      '', 
      { 
        font: 'bold 16px Arial', 
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.killsText.setOrigin(1, 0);
    this.container.add(this.killsText);
  }
  
  /**
   * Actualiza los indicadores de estadísticas
   */
  private updateStatsDisplay(): void {
    this.goldText.setText(`Oro: ${this.player.getGold()}`);
    this.killsText.setText(`Minions: ${this.player.getMinionsKilled()}`);
  }
  
  /**
   * Destruye todos los elementos del HUD
   */
  public destroy(): void {
    this.scene.scale.off('resize', this.handleResize, this);
    this.container.destroy();
  }
} 