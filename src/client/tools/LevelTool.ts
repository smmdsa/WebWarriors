import Phaser from 'phaser';
import { MinionManager } from '../managers/MinionManager';

export class LevelTool {
  private scene: Phaser.Scene;
  private minionManager: MinionManager;
  private isActive: boolean = false;
  
  // Puntos de spawn y path
  private allySpawnPoints: Phaser.Math.Vector2[] = [];
  private enemySpawnPoints: Phaser.Math.Vector2[] = [];
  private topLanePath: Phaser.Math.Vector2[] = [];
  private midLanePath: Phaser.Math.Vector2[] = [];
  private bottomLanePath: Phaser.Math.Vector2[] = [];
  
  // Gráficos para visualizar los puntos
  private graphics: Phaser.GameObjects.Graphics;
  
  // Punto seleccionado actualmente para mover
  private selectedPoint: {
    point: Phaser.Math.Vector2,
    type: 'allySpawn' | 'enemySpawn' | 'topPath' | 'midPath' | 'bottomPath',
    index: number
  } | null = null;
  
  // Modo actual (spawn o path)
  private currentMode: 'spawn' | 'path' = 'spawn';
  private currentPathType: 'top' | 'mid' | 'bottom' = 'top';
  private currentTeam: 'ally' | 'enemy' = 'enemy';
  
  // Texto de información
  private infoText: Phaser.GameObjects.Text;
  
  // Estado anterior del spawn de minions
  private previousSpawnEnabled: boolean = true;
  
  constructor(scene: Phaser.Scene, minionManager: MinionManager) {
    this.scene = scene;
    this.minionManager = minionManager;
    
    // Crear gráficos para visualizar los puntos
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1000);
    
    // Crear texto de información
    this.infoText = scene.add.text(10, 50, 'Level Tool: Desactivada', {
      font: '14px Arial',
      color: '#ffffff',
      backgroundColor: '#000000'
    });
    this.infoText.setScrollFactor(0);
    this.infoText.setDepth(1000);
    this.infoText.setVisible(false);
    
    // Inicializar puntos desde el MinionManager
    this.initializePoints();
    
    // Configurar eventos de entrada
    this.setupInputEvents();
    
    // Registrar el comando en la consola del navegador
    this.registerConsoleCommands();
  }
  
  /**
   * Inicializa los puntos desde el MinionManager
   */
  private initializePoints(): void {
    // Copiar los puntos del MinionManager
    this.allySpawnPoints = this.minionManager.getAllySpawnPoints().map(p => new Phaser.Math.Vector2(p.x, p.y));
    this.enemySpawnPoints = this.minionManager.getEnemySpawnPoints().map(p => new Phaser.Math.Vector2(p.x, p.y));
    this.topLanePath = this.minionManager.getTopLanePath().map(p => new Phaser.Math.Vector2(p.x, p.y));
    this.midLanePath = this.minionManager.getMidLanePath().map(p => new Phaser.Math.Vector2(p.x, p.y));
    this.bottomLanePath = this.minionManager.getBottomLanePath().map(p => new Phaser.Math.Vector2(p.x, p.y));
  }
  
  /**
   * Configura los eventos de entrada para la herramienta
   */
  private setupInputEvents(): void {
    // Evento de clic para seleccionar/mover puntos
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isActive) return;
      
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      
      if (pointer.leftButtonDown()) {
        // Seleccionar punto existente o crear nuevo
        if (this.currentMode === 'spawn') {
          this.handleSpawnPointSelection(worldPoint);
        } else {
          this.handlePathPointSelection(worldPoint);
        }
      }
    });
    
    // Evento de movimiento para arrastrar puntos
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isActive || !this.selectedPoint || !pointer.isDown) return;
      
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.selectedPoint.point.x = worldPoint.x;
      this.selectedPoint.point.y = worldPoint.y;
      
      // Actualizar visualización
      this.drawPoints();
      
      // Actualizar información
      this.updateInfoText();
    });
    
    // Evento de soltar para dejar de mover puntos
    this.scene.input.on('pointerup', () => {
      if (!this.isActive || !this.selectedPoint) return;
      
      // Actualizar el punto en el MinionManager
      this.updateMinionManagerPoints();
      
      // Deseleccionar punto
      this.selectedPoint = null;
      
      // Actualizar información
      this.updateInfoText();
    });
    
    // Teclas para cambiar modos
    if (this.scene.input.keyboard) {
      // Tecla M para cambiar entre modo spawn y path
      this.scene.input.keyboard.on('keydown-M', () => {
        if (!this.isActive) return;
        
        this.currentMode = this.currentMode === 'spawn' ? 'path' : 'spawn';
        this.updateInfoText();
      });
      
      // Teclas 1, 2, 3 para cambiar tipo de path enemigo
      this.scene.input.keyboard.on('keydown-ONE', () => {
        if (!this.isActive) return;
        
        if (this.currentMode === 'path') {
          this.currentPathType = 'top';
          this.currentTeam = 'enemy';
          this.updateInfoText();
        }
      });
      
      this.scene.input.keyboard.on('keydown-TWO', () => {
        if (!this.isActive) return;
        
        if (this.currentMode === 'path') {
          this.currentPathType = 'mid';
          this.currentTeam = 'enemy';
          this.updateInfoText();
        }
      });
      
      this.scene.input.keyboard.on('keydown-THREE', () => {
        if (!this.isActive) return;
        
        if (this.currentMode === 'path') {
          this.currentPathType = 'bottom';
          this.currentTeam = 'enemy';
          this.updateInfoText();
        }
      });
      
      // Teclas 4, 5, 6 para cambiar tipo de path aliado
      this.scene.input.keyboard.on('keydown-FOUR', () => {
        if (!this.isActive) return;
        
        if (this.currentMode === 'path') {
          this.currentPathType = 'top';
          this.currentTeam = 'ally';
          this.updateInfoText();
        }
      });
      
      this.scene.input.keyboard.on('keydown-FIVE', () => {
        if (!this.isActive) return;
        
        if (this.currentMode === 'path') {
          this.currentPathType = 'mid';
          this.currentTeam = 'ally';
          this.updateInfoText();
        }
      });
      
      this.scene.input.keyboard.on('keydown-SIX', () => {
        if (!this.isActive) return;
        
        if (this.currentMode === 'path') {
          this.currentPathType = 'bottom';
          this.currentTeam = 'ally';
          this.updateInfoText();
        }
      });
      
      // Tecla DELETE para eliminar punto seleccionado
      this.scene.input.keyboard.on('keydown-DELETE', () => {
        if (!this.isActive || !this.selectedPoint) return;
        
        this.deleteSelectedPoint();
      });
    }
  }
  
  /**
   * Maneja la selección de puntos de spawn
   */
  private handleSpawnPointSelection(worldPoint: Phaser.Math.Vector2): void {
    // Buscar punto cercano
    const radius = 15;
    let found = false;
    
    // Comprobar puntos de spawn aliados
    for (let i = 0; i < this.allySpawnPoints.length; i++) {
      const point = this.allySpawnPoints[i];
      if (Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, point.x, point.y) <= radius) {
        this.selectedPoint = { point, type: 'allySpawn', index: i };
        found = true;
        break;
      }
    }
    
    // Comprobar puntos de spawn enemigos
    if (!found) {
      for (let i = 0; i < this.enemySpawnPoints.length; i++) {
        const point = this.enemySpawnPoints[i];
        if (Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, point.x, point.y) <= radius) {
          this.selectedPoint = { point, type: 'enemySpawn', index: i };
          found = true;
          break;
        }
      }
    }
    
    // Si no se encontró ningún punto, crear uno nuevo
    if (!found) {
      // Determinar si es punto aliado o enemigo basado en la posición
      const isAlly = worldPoint.x < this.scene.cameras.main.width / 2;
      
      if (isAlly) {
        const newPoint = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
        this.allySpawnPoints.push(newPoint);
        this.selectedPoint = { point: newPoint, type: 'allySpawn', index: this.allySpawnPoints.length - 1 };
      } else {
        const newPoint = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
        this.enemySpawnPoints.push(newPoint);
        this.selectedPoint = { point: newPoint, type: 'enemySpawn', index: this.enemySpawnPoints.length - 1 };
      }
    }
    
    // Actualizar visualización
    this.drawPoints();
    
    // Actualizar información
    this.updateInfoText();
  }
  
  /**
   * Maneja la selección de puntos de path
   */
  private handlePathPointSelection(worldPoint: Phaser.Math.Vector2): void {
    // Determinar qué array de path usar
    let pathArray: Phaser.Math.Vector2[];
    let pathType: 'topPath' | 'midPath' | 'bottomPath';
    
    switch (this.currentPathType) {
      case 'top':
        pathArray = this.topLanePath;
        pathType = 'topPath';
        break;
      case 'mid':
        pathArray = this.midLanePath;
        pathType = 'midPath';
        break;
      case 'bottom':
        pathArray = this.bottomLanePath;
        pathType = 'bottomPath';
        break;
    }
    
    // Buscar punto cercano
    const radius = 15;
    let found = false;
    
    for (let i = 0; i < pathArray.length; i++) {
      const point = pathArray[i];
      if (Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, point.x, point.y) <= radius) {
        this.selectedPoint = { point, type: pathType, index: i };
        found = true;
        break;
      }
    }
    
    // Si no se encontró ningún punto, crear uno nuevo
    if (!found) {
      const newPoint = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
      
      // Insertar el punto en la posición correcta (ordenado por distancia)
      if (pathArray.length < 2) {
        // Si hay menos de 2 puntos, simplemente añadir
        pathArray.push(newPoint);
        this.selectedPoint = { point: newPoint, type: pathType, index: pathArray.length - 1 };
      } else {
        // Encontrar el segmento de línea más cercano para insertar el punto
        let bestIndex = pathArray.length;
        let bestDistance = Infinity;
        
        for (let i = 0; i < pathArray.length - 1; i++) {
          const p1 = pathArray[i];
          const p2 = pathArray[i + 1];
          
          // Calcular distancia del punto al segmento
          const distance = this.distanceToLineSegment(p1, p2, newPoint);
          
          if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = i + 1;
          }
        }
        
        // Insertar el punto en la posición encontrada
        pathArray.splice(bestIndex, 0, newPoint);
        this.selectedPoint = { point: newPoint, type: pathType, index: bestIndex };
      }
    }
    
    // Actualizar visualización
    this.drawPoints();
    
    // Actualizar información
    this.updateInfoText();
  }
  
  /**
   * Calcula la distancia de un punto a un segmento de línea
   */
  private distanceToLineSegment(p1: Phaser.Math.Vector2, p2: Phaser.Math.Vector2, p: Phaser.Math.Vector2): number {
    const A = p.x - p1.x;
    const B = p.y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = p1.x;
      yy = p1.y;
    } else if (param > 1) {
      xx = p2.x;
      yy = p2.y;
    } else {
      xx = p1.x + param * C;
      yy = p1.y + param * D;
    }
    
    const dx = p.x - xx;
    const dy = p.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Elimina el punto seleccionado actualmente
   */
  private deleteSelectedPoint(): void {
    if (!this.selectedPoint) return;
    
    switch (this.selectedPoint.type) {
      case 'allySpawn':
        if (this.allySpawnPoints.length > 1) {
          this.allySpawnPoints.splice(this.selectedPoint.index, 1);
        }
        break;
      case 'enemySpawn':
        if (this.enemySpawnPoints.length > 1) {
          this.enemySpawnPoints.splice(this.selectedPoint.index, 1);
        }
        break;
      case 'topPath':
        if (this.topLanePath.length > 2) {
          this.topLanePath.splice(this.selectedPoint.index, 1);
        }
        break;
      case 'midPath':
        if (this.midLanePath.length > 2) {
          this.midLanePath.splice(this.selectedPoint.index, 1);
        }
        break;
      case 'bottomPath':
        if (this.bottomLanePath.length > 2) {
          this.bottomLanePath.splice(this.selectedPoint.index, 1);
        }
        break;
    }
    
    // Actualizar el MinionManager
    this.updateMinionManagerPoints();
    
    // Deseleccionar punto
    this.selectedPoint = null;
    
    // Actualizar visualización
    this.drawPoints();
    
    // Actualizar información
    this.updateInfoText();
  }
  
  /**
   * Actualiza los puntos en el MinionManager
   */
  private updateMinionManagerPoints(): void {
    this.minionManager.setAllySpawnPoints(this.allySpawnPoints);
    this.minionManager.setEnemySpawnPoints(this.enemySpawnPoints);
    this.minionManager.setTopLanePath(this.topLanePath);
    this.minionManager.setMidLanePath(this.midLanePath);
    this.minionManager.setBottomLanePath(this.bottomLanePath);
  }
  
  /**
   * Dibuja los puntos en pantalla
   */
  private drawPoints(): void {
    this.graphics.clear();
    
    // Dibujar puntos de spawn aliados
    this.graphics.fillStyle(0x00ff00, 0.8);
    for (let i = 0; i < this.allySpawnPoints.length; i++) {
      const point = this.allySpawnPoints[i];
      const isSelected = this.selectedPoint && 
                         this.selectedPoint.type === 'allySpawn' && 
                         this.selectedPoint.index === i;
      
      const radius = isSelected ? 15 : 10;
      this.graphics.fillCircle(point.x, point.y, radius);
      
      // Dibujar índice
      this.scene.add.text(point.x, point.y, `A${i}`, {
        font: '12px Arial',
        color: '#000000'
      }).setOrigin(0.5).setDepth(1001);
    }
    
    // Dibujar puntos de spawn enemigos
    this.graphics.fillStyle(0xff0000, 0.8);
    for (let i = 0; i < this.enemySpawnPoints.length; i++) {
      const point = this.enemySpawnPoints[i];
      const isSelected = this.selectedPoint && 
                         this.selectedPoint.type === 'enemySpawn' && 
                         this.selectedPoint.index === i;
      
      const radius = isSelected ? 15 : 10;
      this.graphics.fillCircle(point.x, point.y, radius);
      
      // Dibujar índice
      this.scene.add.text(point.x, point.y, `E${i}`, {
        font: '12px Arial',
        color: '#000000'
      }).setOrigin(0.5).setDepth(1001);
    }
    
    // Dibujar puntos de path superior
    this.drawPath(this.topLanePath, 0x00ffff, 'topPath', 'T');
    
    // Dibujar puntos de path medio
    this.drawPath(this.midLanePath, 0xffff00, 'midPath', 'M');
    
    // Dibujar puntos de path inferior
    this.drawPath(this.bottomLanePath, 0xff00ff, 'bottomPath', 'B');
  }
  
  /**
   * Dibuja un path específico
   */
  private drawPath(path: Phaser.Math.Vector2[], color: number, type: string, prefix: string): void {
    // Dibujar líneas entre puntos
    this.graphics.lineStyle(2, color, 0.8);
    
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      this.graphics.lineBetween(p1.x, p1.y, p2.x, p2.y);
    }
    
    // Dibujar puntos
    this.graphics.fillStyle(color, 0.8);
    
    for (let i = 0; i < path.length; i++) {
      const point = path[i];
      const isSelected = this.selectedPoint && 
                         this.selectedPoint.type === type && 
                         this.selectedPoint.index === i;
      
      const radius = isSelected ? 15 : 8;
      this.graphics.fillCircle(point.x, point.y, radius);
      
      // Dibujar índice
      this.scene.add.text(point.x, point.y, `${prefix}${i}`, {
        font: '10px Arial',
        color: '#000000'
      }).setOrigin(0.5).setDepth(1001);
    }
  }
  
  /**
   * Actualiza el texto de información
   */
  private updateInfoText(): void {
    if (!this.isActive) {
      this.infoText.setText('Level Tool: Desactivada');
      return;
    }
    
    let text = `Level Tool: Activada | Modo: ${this.currentMode === 'spawn' ? 'Spawn' : 'Path'}`;
    
    if (this.currentMode === 'path') {
      text += ` | Path: ${this.currentPathType} | Equipo: ${this.currentTeam === 'ally' ? 'Aliado' : 'Enemigo'}`;
    }
    
    if (this.selectedPoint) {
      text += `\nPunto seleccionado: ${this.selectedPoint.type} [${this.selectedPoint.index}] en (${Math.round(this.selectedPoint.point.x)}, ${Math.round(this.selectedPoint.point.y)})`;
    } else {
      text += '\nNingún punto seleccionado';
    }
    
    text += '\nControles: M = Cambiar modo | 1,2,3 = Paths enemigos | 4,5,6 = Paths aliados | DELETE = Eliminar punto';
    text += '\nComandos: cmd("show-paths") = Mostrar paths | cmd("show-spawns") = Mostrar spawns';
    
    this.infoText.setText(text);
  }
  
  /**
   * Registra los comandos en la consola del navegador
   */
  private registerConsoleCommands(): void {
    // Añadir el objeto al ámbito global (window)
    (window as any).levelTool = this;
    
    // Añadir función para activar/desactivar la herramienta
    (window as any).qaMode = (enabled: boolean = true) => {
      this.setActive(enabled);
      return `QA Mode ${enabled ? 'activado' : 'desactivado'}`;
    };
    
    // Añadir función para exportar los puntos
    (window as any).exportPoints = () => {
      const points = {
        allySpawnPoints: this.allySpawnPoints.map(p => ({ x: p.x, y: p.y })),
        enemySpawnPoints: this.enemySpawnPoints.map(p => ({ x: p.x, y: p.y })),
        topLanePath: this.topLanePath.map(p => ({ x: p.x, y: p.y })),
        midLanePath: this.midLanePath.map(p => ({ x: p.x, y: p.y })),
        bottomLanePath: this.bottomLanePath.map(p => ({ x: p.x, y: p.y }))
      };
      
      console.log('Puntos exportados:');
      console.log(JSON.stringify(points, null, 2));
      
      return 'Puntos exportados a la consola';
    };
    
    // Añadir función para mostrar los paths
    (window as any).showPaths = () => {
      console.log('Paths:');
      
      console.log('Top Lane Path:');
      this.topLanePath.forEach((p, i) => {
        console.log(`  Punto ${i}: (${Math.round(p.x)}, ${Math.round(p.y)})`);
      });
      
      console.log('Mid Lane Path:');
      this.midLanePath.forEach((p, i) => {
        console.log(`  Punto ${i}: (${Math.round(p.x)}, ${Math.round(p.y)})`);
      });
      
      console.log('Bottom Lane Path:');
      this.bottomLanePath.forEach((p, i) => {
        console.log(`  Punto ${i}: (${Math.round(p.x)}, ${Math.round(p.y)})`);
      });
      
      return 'Paths mostrados en la consola';
    };
    
    // Añadir función para mostrar los puntos de spawn
    (window as any).showSpawns = () => {
      console.log('Puntos de Spawn:');
      
      console.log('Ally Spawn Points:');
      this.allySpawnPoints.forEach((p, i) => {
        console.log(`  Punto ${i}: (${Math.round(p.x)}, ${Math.round(p.y)})`);
      });
      
      console.log('Enemy Spawn Points:');
      this.enemySpawnPoints.forEach((p, i) => {
        console.log(`  Punto ${i}: (${Math.round(p.x)}, ${Math.round(p.y)})`);
      });
      
      return 'Puntos de spawn mostrados en la consola';
    };
    
    console.log('Level Tool: Comandos registrados. Usa "cmd(\'qa-mode on\')" para activar y "cmd(\'qa-mode off\')" para desactivar.');
  }
  
  /**
   * Activa o desactiva la herramienta
   */
  public setActive(active: boolean): void {
    this.isActive = active;
    
    // Mostrar/ocultar gráficos
    this.graphics.setVisible(active);
    
    // Mostrar/ocultar texto de información
    this.infoText.setVisible(active);
    
    if (active) {
      // Detener el spawn de minions
      this.previousSpawnEnabled = this.minionManager.isSpawnEnabled();
      this.minionManager.setSpawnEnabled(false);
      
      // Inicializar puntos desde el MinionManager
      this.initializePoints();
      
      // Dibujar puntos
      this.drawPoints();
      
      // Actualizar información
      this.updateInfoText();
    } else {
      // Restaurar el estado anterior del spawn de minions
      this.minionManager.setSpawnEnabled(this.previousSpawnEnabled);
      
      // Limpiar gráficos
      this.graphics.clear();
      
      // Deseleccionar punto
      this.selectedPoint = null;
    }
  }
  
  /**
   * Actualiza la herramienta
   */
  public update(): void {
    if (!this.isActive) return;
    
    // Limpiar textos antiguos
    this.scene.children.list
      .filter(child => child.type === 'Text' && (child as any).depth === 1001)
      .forEach(child => child.destroy());
    
    // Redibujar puntos
    this.drawPoints();
  }
} 