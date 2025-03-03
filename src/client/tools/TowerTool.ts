import Phaser from 'phaser';
import { TowerManager } from '../managers/TowerManager';
import { Team } from '../entities/Tower';

export class TowerTool {
  private scene: Phaser.Scene;
  private towerManager: TowerManager;
  private isActive: boolean = false;
  
  // Gráficos para visualizar los puntos
  private graphics: Phaser.GameObjects.Graphics;
  
  // Punto seleccionado actualmente para mover
  private selectedPoint: {
    team: Team,
    id: string,
    pointType: 'tower' | 'nexus'
  } | null = null;
  
  // Equipo actual
  private currentTeam: Team = Team.ALLY;
  
  // Texto de información
  private infoText: Phaser.GameObjects.Text;
  
  constructor(scene: Phaser.Scene, towerManager: TowerManager) {
    this.scene = scene;
    this.towerManager = towerManager;
    
    // Crear gráficos para visualizar los puntos
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1000);
    
    // Crear texto de información
    this.infoText = scene.add.text(10, 90, 'Tower Tool: Desactivada', {
      font: '14px Arial',
      color: '#ffffff',
      backgroundColor: '#000000'
    });
    this.infoText.setDepth(1000);
    this.infoText.setScrollFactor(0);
    this.infoText.setVisible(false);
    
    // Configurar eventos de entrada
    this.setupInputEvents();
  }
  
  private setupInputEvents(): void {
    // Evento de clic para seleccionar/mover puntos
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isActive) return;
      
      // Obtener posición del mundo
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      
      // Si ya hay un punto seleccionado, moverlo
      if (this.selectedPoint) {
        this.moveSelectedPoint(worldPoint);
      } else {
        // Si no hay punto seleccionado, intentar seleccionar uno
        this.selectPoint(worldPoint);
      }
    });
    
    // Evento de tecla para cambiar de equipo
    this.scene.input.keyboard.on('keydown-T', () => {
      if (!this.isActive) return;
      
      // Cambiar equipo
      this.currentTeam = this.currentTeam === Team.ALLY ? Team.ENEMY : Team.ALLY;
      
      // Actualizar texto de información
      this.updateInfoText();
    });
    
    // Evento de tecla para eliminar el punto seleccionado
    this.scene.input.keyboard.on('keydown-DELETE', () => {
      if (!this.isActive || !this.selectedPoint) return;
      
      // No se pueden eliminar torres o nexos, solo moverlos
      console.log('No se pueden eliminar torres o nexos, solo moverlos.');
    });
    
    // Evento de tecla para cancelar la selección
    this.scene.input.keyboard.on('keydown-ESC', () => {
      if (!this.isActive) return;
      
      // Cancelar selección
      this.selectedPoint = null;
      
      // Actualizar texto de información
      this.updateInfoText();
    });
  }
  
  private selectPoint(worldPoint: Phaser.Math.Vector2): void {
    // Buscar la torre o nexo más cercano
    let closestDistance = 30; // Distancia máxima para seleccionar
    let closestPoint = null;
    
    // Comprobar torres
    const towerPositions = this.currentTeam === Team.ALLY ? 
      Array.from(this.towerManager['allyTowerPositions'].entries()) : 
      Array.from(this.towerManager['enemyTowerPositions'].entries());
    
    for (const [id, position] of towerPositions) {
      const distance = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, position.x, position.y);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = {
          team: this.currentTeam,
          id,
          pointType: 'tower' as const
        };
      }
    }
    
    // Comprobar nexo
    const nexusPosition = this.towerManager.getNexusPosition(this.currentTeam);
    const nexusDistance = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, nexusPosition.x, nexusPosition.y);
    
    if (nexusDistance < closestDistance) {
      closestDistance = nexusDistance;
      closestPoint = {
        team: this.currentTeam,
        id: 'nexus',
        pointType: 'nexus' as const
      };
    }
    
    // Seleccionar el punto más cercano
    this.selectedPoint = closestPoint;
    
    // Actualizar texto de información
    this.updateInfoText();
  }
  
  private moveSelectedPoint(worldPoint: Phaser.Math.Vector2): void {
    if (!this.selectedPoint) return;
    
    // Mover el punto seleccionado
    if (this.selectedPoint.pointType === 'tower') {
      this.towerManager.setTowerPosition(
        this.selectedPoint.team,
        this.selectedPoint.id,
        new Phaser.Math.Vector2(worldPoint.x, worldPoint.y)
      );
    } else if (this.selectedPoint.pointType === 'nexus') {
      this.towerManager.setNexusPosition(
        this.selectedPoint.team,
        new Phaser.Math.Vector2(worldPoint.x, worldPoint.y)
      );
    }
    
    // Actualizar texto de información
    this.updateInfoText();
  }
  
  private updateInfoText(): void {
    let text = `Tower Tool: ${this.isActive ? 'Activada' : 'Desactivada'}\n`;
    text += `Equipo: ${this.currentTeam === Team.ALLY ? 'Aliado (Azul)' : 'Enemigo (Rojo)'}\n`;
    
    if (this.selectedPoint) {
      text += `Seleccionado: ${this.selectedPoint.pointType === 'tower' ? 'Torre' : 'Nexo'} `;
      text += `${this.selectedPoint.pointType === 'tower' ? this.selectedPoint.id : ''}\n`;
      text += 'Haz clic para mover';
    } else {
      text += 'Haz clic en una torre o nexo para seleccionar\n';
      text += 'Presiona T para cambiar de equipo';
    }
    
    this.infoText.setText(text);
  }
  
  public setActive(active: boolean): void {
    this.isActive = active;
    this.infoText.setVisible(active);
    
    // Mostrar/ocultar posiciones de torres
    this.towerManager.showTowerPositions(active);
    
    // Mostrar/ocultar rangos de torres
    this.towerManager.showTowerRanges(active);
    
    // Actualizar texto de información
    this.updateInfoText();
    
    // Limpiar selección
    this.selectedPoint = null;
  }
  
  public isToolActive(): boolean {
    return this.isActive;
  }
  
  public registerConsoleCommands(): void {
    // Comando para mostrar/ocultar rangos de torres
    (window as any).showTowerRanges = (visible: boolean = true) => {
      this.towerManager.showTowerRanges(visible);
      console.log(`Rangos de torres ${visible ? 'mostrados' : 'ocultados'}`);
    };
    
    // Comando para mostrar/ocultar posiciones de torres
    (window as any).showTowerPositions = (visible: boolean = true) => {
      this.towerManager.showTowerPositions(visible);
      console.log(`Posiciones de torres ${visible ? 'mostradas' : 'ocultadas'}`);
      
      // Mostrar las posiciones en la consola
      if (visible) {
        console.log(this.towerManager.getTowerPositionsAsText());
      }
    };
    
    // Comando para activar/desactivar la herramienta
    (window as any).towerTool = (active: boolean = true) => {
      this.setActive(active);
      console.log(`Herramienta de torres ${active ? 'activada' : 'desactivada'}`);
    };
  }
  
  public update(): void {
    if (!this.isActive) return;
    
    // No es necesario actualizar nada aquí por ahora
  }
} 