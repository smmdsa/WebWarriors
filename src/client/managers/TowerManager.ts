import Phaser from 'phaser';
import { Tower, TowerType, Team } from '../entities/Tower';
import { Nexus } from '../entities/Nexus';

export class TowerManager {
  private scene: Phaser.Scene;
  private towers: Tower[] = [];
  private nexuses: Nexus[] = [];
  
  // Posiciones de torres
  private allyTowerPositions: Map<string, Phaser.Math.Vector2> = new Map();
  private enemyTowerPositions: Map<string, Phaser.Math.Vector2> = new Map();
  
  // Posiciones de nexos
  private allyNexusPosition: Phaser.Math.Vector2;
  private enemyNexusPosition: Phaser.Math.Vector2;
  
  // Gráficos para visualizar posiciones
  private towerGraphics: Phaser.GameObjects.Graphics;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Crear gráficos para visualizar posiciones
    this.towerGraphics = scene.add.graphics();
    this.towerGraphics.setDepth(1000);
    this.towerGraphics.setVisible(false);
    
    // Inicializar posiciones predeterminadas
    this.initializePositions();
  }
  
  private initializePositions(): void {
    // Posiciones de torres aliadas
    // Top lane
    this.allyTowerPositions.set('top_1', new Phaser.Math.Vector2(121, 564));
    this.allyTowerPositions.set('top_2', new Phaser.Math.Vector2(47, 152));
    
    // Mid lane
    this.allyTowerPositions.set('mid_1', new Phaser.Math.Vector2(305, 743));
    this.allyTowerPositions.set('mid_2', new Phaser.Math.Vector2(401, 536));
    
    // Bottom lane
    this.allyTowerPositions.set('bot_1', new Phaser.Math.Vector2(429, 884));
    this.allyTowerPositions.set('bot_2', new Phaser.Math.Vector2(751, 954));
    
    // Entrada al nexo
    this.allyTowerPositions.set('nexus_entrance', new Phaser.Math.Vector2(159, 841));
    
    // Guardianes del nexo
    this.allyTowerPositions.set('nexus_guardian_1', new Phaser.Math.Vector2(69, 865));
    this.allyTowerPositions.set('nexus_guardian_2', new Phaser.Math.Vector2(141, 929));
    
    // Posiciones de torres enemigas
    // Top lane
    this.enemyTowerPositions.set('top_1', new Phaser.Math.Vector2(562, 111));
    this.enemyTowerPositions.set('top_2', new Phaser.Math.Vector2(249, 51));
    
    // Mid lane
    this.enemyTowerPositions.set('mid_1', new Phaser.Math.Vector2(673, 272));
    this.enemyTowerPositions.set('mid_2', new Phaser.Math.Vector2(584, 454));
    
    // Bottom lane
    this.enemyTowerPositions.set('bot_1', new Phaser.Math.Vector2(881, 422));
    this.enemyTowerPositions.set('bot_2', new Phaser.Math.Vector2(929, 752));
    
    // Entrada al nexo
    this.enemyTowerPositions.set('nexus_entrance', new Phaser.Math.Vector2(818, 187));
    
    // Guardianes del nexo
    this.enemyTowerPositions.set('nexus_guardian_1', new Phaser.Math.Vector2(873, 92));
    this.enemyTowerPositions.set('nexus_guardian_2', new Phaser.Math.Vector2(940, 172));
    
    // Posiciones de nexos
    this.allyNexusPosition = new Phaser.Math.Vector2(54, 950);
    this.enemyNexusPosition = new Phaser.Math.Vector2(964, 65);
  }
  
  public createTowersAndNexuses(): void {
    // Crear torres aliadas
    this.createTeamTowers(Team.ALLY);
    
    // Crear torres enemigas
    this.createTeamTowers(Team.ENEMY);
    
    // Crear nexos
    this.createNexuses();
    
    // Configurar eventos de destrucción
    this.setupDestructionEvents();
  }
  
  private createTeamTowers(team: Team): void {
    const positions = team === Team.ALLY ? this.allyTowerPositions : this.enemyTowerPositions;
    
    // Crear torres de línea
    for (const lane of ['top', 'mid', 'bot']) {
      for (const num of [1, 2]) {
        const id = `${lane}_${num}`;
        const position = positions.get(id);
        
        if (position) {
          const tower = new Tower(
            this.scene,
            position.x,
            position.y,
            team,
            TowerType.LANE,
            id
          );
          
          this.towers.push(tower);
        }
      }
    }
    
    // Crear torre de entrada al nexo
    const entrancePosition = positions.get('nexus_entrance');
    if (entrancePosition) {
      const tower = new Tower(
        this.scene,
        entrancePosition.x,
        entrancePosition.y,
        team,
        TowerType.NEXUS_ENTRANCE,
        'nexus_entrance'
      );
      
      this.towers.push(tower);
    }
    
    // Crear torres guardianas del nexo
    for (const num of [1, 2]) {
      const id = `nexus_guardian_${num}`;
      const position = positions.get(id);
      
      if (position) {
        const tower = new Tower(
          this.scene,
          position.x,
          position.y,
          team,
          TowerType.NEXUS_GUARDIAN,
          id
        );
        
        this.towers.push(tower);
      }
    }
  }
  
  private createNexuses(): void {
    // Crear nexo aliado
    const allyNexus = new Nexus(
      this.scene,
      this.allyNexusPosition.x,
      this.allyNexusPosition.y,
      Team.ALLY
    );
    
    // Crear nexo enemigo
    const enemyNexus = new Nexus(
      this.scene,
      this.enemyNexusPosition.x,
      this.enemyNexusPosition.y,
      Team.ENEMY
    );
    
    this.nexuses.push(allyNexus, enemyNexus);
  }
  
  private setupDestructionEvents(): void {
    // Evento de torre destruida
    this.scene.events.on('tower-destroyed', (tower: Tower) => {
      // Eliminar la torre de la lista
      const index = this.towers.indexOf(tower);
      if (index !== -1) {
        this.towers.splice(index, 1);
      }
      
      console.log(`Torre ${tower.getId()} del equipo ${tower.getTeam()} destruida`);
    });
    
    // Evento de nexo destruido
    this.scene.events.on('nexus-destroyed', (nexus: Nexus) => {
      // Eliminar el nexo de la lista
      const index = this.nexuses.indexOf(nexus);
      if (index !== -1) {
        this.nexuses.splice(index, 1);
      }
      
      // Determinar el equipo ganador
      const winningTeam = nexus.getTeam() === Team.ALLY ? Team.ENEMY : Team.ALLY;
      
      console.log(`Nexo del equipo ${nexus.getTeam()} destruido. ¡El equipo ${winningTeam} gana!`);
      
      // Emitir evento de fin de juego
      this.scene.events.emit('game-over', winningTeam);
    });
  }
  
  public update(time: number, delta: number, targets: Phaser.GameObjects.GameObject[]): void {
    // Actualizar torres
    for (const tower of this.towers) {
      tower.update(time, delta, targets);
    }
    
    // Actualizar nexos
    for (const nexus of this.nexuses) {
      nexus.update();
    }
  }
  
  public showTowerRanges(visible: boolean): void {
    for (const tower of this.towers) {
      tower.showRange(visible);
    }
  }
  
  public showTowerPositions(visible: boolean): void {
    this.towerGraphics.setVisible(visible);
    
    if (visible) {
      this.drawTowerPositions();
    }
  }
  
  private drawTowerPositions(): void {
    this.towerGraphics.clear();
    
    // Dibujar posiciones de torres aliadas
    this.drawTeamTowerPositions(this.allyTowerPositions, 0x0000ff);
    
    // Dibujar posiciones de torres enemigas
    this.drawTeamTowerPositions(this.enemyTowerPositions, 0xff0000);
    
    // Dibujar posiciones de nexos
    this.drawNexusPosition(this.allyNexusPosition, 0x0000ff);
    this.drawNexusPosition(this.enemyNexusPosition, 0xff0000);
  }
  
  private drawTeamTowerPositions(positions: Map<string, Phaser.Math.Vector2>, color: number): void {
    this.towerGraphics.lineStyle(2, color, 0.8);
    
    for (const [id, position] of positions.entries()) {
      // Dibujar círculo en la posición
      this.towerGraphics.strokeCircle(position.x, position.y, 16);
      
      // Añadir texto con el ID
      const text = this.scene.add.text(position.x, position.y - 30, id, {
        font: '12px Arial',
        color: color === 0x0000ff ? '#0000ff' : '#ff0000'
      });
      text.setOrigin(0.5);
      text.setDepth(1001);
      
      // Guardar referencia al texto para poder eliminarlo después
      (this.towerGraphics as any)[`text_${id}_${color}`] = text;
    }
  }
  
  private drawNexusPosition(position: Phaser.Math.Vector2, color: number): void {
    this.towerGraphics.lineStyle(3, color, 0.8);
    
    // Dibujar círculo más grande para el nexo
    this.towerGraphics.strokeCircle(position.x, position.y, 24);
    
    // Añadir texto "NEXUS"
    const text = this.scene.add.text(position.x, position.y - 40, 'NEXUS', {
      font: '14px Arial',
      color: color === 0x0000ff ? '#0000ff' : '#ff0000'
    });
    text.setOrigin(0.5);
    text.setDepth(1001);
    
    // Guardar referencia al texto
    (this.towerGraphics as any)[`text_nexus_${color}`] = text;
  }
  
  public hideTowerPositions(): void {
    this.towerGraphics.setVisible(false);
    
    // Eliminar textos
    for (const key in this.towerGraphics) {
      if (key.startsWith('text_') && (this.towerGraphics as any)[key]) {
        (this.towerGraphics as any)[key].destroy();
        delete (this.towerGraphics as any)[key];
      }
    }
  }
  
  public getTowerPosition(team: Team, id: string): Phaser.Math.Vector2 | undefined {
    const positions = team === Team.ALLY ? this.allyTowerPositions : this.enemyTowerPositions;
    return positions.get(id);
  }
  
  public setTowerPosition(team: Team, id: string, position: Phaser.Math.Vector2): void {
    const positions = team === Team.ALLY ? this.allyTowerPositions : this.enemyTowerPositions;
    positions.set(id, position);
    
    // Actualizar la posición de la torre si existe
    const tower = this.towers.find(t => t.getTeam() === team && t.getId() === id);
    if (tower) {
      tower.setPosition(position.x, position.y);
    }
    
    // Actualizar visualización si está visible
    if (this.towerGraphics.visible) {
      this.drawTowerPositions();
    }
  }
  
  public getNexusPosition(team: Team): Phaser.Math.Vector2 {
    return team === Team.ALLY ? this.allyNexusPosition : this.enemyNexusPosition;
  }
  
  public setNexusPosition(team: Team, position: Phaser.Math.Vector2): void {
    if (team === Team.ALLY) {
      this.allyNexusPosition = position;
    } else {
      this.enemyNexusPosition = position;
    }
    
    // Actualizar la posición del nexo si existe
    const nexus = this.nexuses.find(n => n.getTeam() === team);
    if (nexus) {
      nexus.setPosition(position.x, position.y);
    }
    
    // Actualizar visualización si está visible
    if (this.towerGraphics.visible) {
      this.drawTowerPositions();
    }
  }
  
  public getAllTowers(): Tower[] {
    return this.towers;
  }
  
  public getAllNexuses(): Nexus[] {
    return this.nexuses;
  }
  
  public getTowerById(id: string, team: Team): Tower | undefined {
    return this.towers.find(t => t.getId() === id && t.getTeam() === team);
  }
  
  public getNexusByTeam(team: Team): Nexus | undefined {
    return this.nexuses.find(n => n.getTeam() === team);
  }
  
  public getTowerPositionsAsText(): string {
    let result = "=== POSICIONES DE TORRES Y NEXOS ===\n\n";
    
    // Posiciones de torres aliadas
    result += "== TORRES ALIADAS ==\n";
    for (const [id, position] of this.allyTowerPositions.entries()) {
      result += `${id}: (${Math.round(position.x)}, ${Math.round(position.y)})\n`;
    }
    
    // Posiciones de torres enemigas
    result += "\n== TORRES ENEMIGAS ==\n";
    for (const [id, position] of this.enemyTowerPositions.entries()) {
      result += `${id}: (${Math.round(position.x)}, ${Math.round(position.y)})\n`;
    }
    
    // Posiciones de nexos
    result += "\n== NEXOS ==\n";
    result += `Nexo Aliado: (${Math.round(this.allyNexusPosition.x)}, ${Math.round(this.allyNexusPosition.y)})\n`;
    result += `Nexo Enemigo: (${Math.round(this.enemyNexusPosition.x)}, ${Math.round(this.enemyNexusPosition.y)})\n`;
    
    return result;
  }
} 