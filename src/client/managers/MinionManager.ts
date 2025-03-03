import Phaser from 'phaser';
import { Minion, MinionType } from '../entities/Minion';

// Tipos de minions
export enum MinionSubtype {
  MELEE = 'melee',
  CASTER = 'caster',
  CANNON = 'cannon'
}

export class MinionManager {
  private scene: Phaser.Scene;
  private minions: Minion[] = [];
  private spawnTimer: Phaser.Time.TimerEvent;
  private spawnInterval: number = 30000; // 30 segundos
  private waveCount: number = 0;
  
  // Puntos de generación (3 por nexo)
  private allySpawnPoints: Phaser.Math.Vector2[] = [];
  private enemySpawnPoints: Phaser.Math.Vector2[] = [];
  
  // Rutas para los minions (3 rutas diferentes)
  private topLanePath: Phaser.Math.Vector2[] = [];
  private midLanePath: Phaser.Math.Vector2[] = [];
  private bottomLanePath: Phaser.Math.Vector2[] = [];
  
  // Gizmos para visualizar puntos de spawn
  private spawnGizmos!: Phaser.GameObjects.Graphics;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  
  // Control de spawn
  private spawnEnabled: boolean = true;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Configurar puntos de spawn para aliados (3 puntos)
    // Actualizados según la información proporcionada
    this.allySpawnPoints = [
      new Phaser.Math.Vector2(83, 828),   // Punto 0
      new Phaser.Math.Vector2(188, 928),  // Punto 1
      new Phaser.Math.Vector2(177, 833)   // Punto 2
    ];
    
    // Configurar puntos de spawn para enemigos (3 puntos)
    // Actualizados según la información proporcionada
    this.enemySpawnPoints = [
      new Phaser.Math.Vector2(829, 86),   // Punto 0
      new Phaser.Math.Vector2(862, 151),  // Punto 1
      new Phaser.Math.Vector2(895, 199)   // Punto 2
    ];
    
    // Configurar rutas
    this.setupPaths();
    
    // Dibujar gizmos para visualizar los puntos de spawn
    this.drawSpawnGizmos();
    
    // Dibujar rutas para visualización
    this.drawPaths();
    
    // Iniciar generación de minions
    this.spawnTimer = this.scene.time.addEvent({
      delay: this.spawnInterval,
      callback: this.spawnMinions,
      callbackScope: this,
      loop: true
    });
    
    // Generar primera oleada inmediatamente
    this.spawnMinions();
  }
  
  /**
   * Dibuja gizmos para visualizar los puntos de spawn
   */
  private drawSpawnGizmos(): void {
    this.spawnGizmos = this.scene.add.graphics();
    
    // Estilo para puntos aliados
    this.spawnGizmos.fillStyle(0x00ff00, 0.8);
    
    // Dibujar puntos de spawn aliados
    for (const point of this.allySpawnPoints) {
      this.spawnGizmos.fillCircle(point.x, point.y, 10);
    }
    
    // Estilo para puntos enemigos
    this.spawnGizmos.fillStyle(0xff0000, 0.8);
    
    // Dibujar puntos de spawn enemigos
    for (const point of this.enemySpawnPoints) {
      this.spawnGizmos.fillCircle(point.x, point.y, 10);
    }
    
    // Añadir textos para identificar los puntos
    const allyText = this.scene.add.text(
      this.allySpawnPoints[1].x, 
      this.allySpawnPoints[1].y - 30, 
      'Ally Spawn', 
      { color: '#00ff00' }
    );
    allyText.setOrigin(0.5);
    
    const enemyText = this.scene.add.text(
      this.enemySpawnPoints[1].x, 
      this.enemySpawnPoints[1].y - 30, 
      'Enemy Spawn', 
      { color: '#ff0000' }
    );
    enemyText.setOrigin(0.5);
    
    // Destruir textos después de 5 segundos
    this.scene.time.delayedCall(5000, () => {
      allyText.destroy();
      enemyText.destroy();
    });
  }
  
  /**
   * Configura las rutas para los tres carriles
   * Actualizadas según la información proporcionada
   */
  private setupPaths(): void {
    // Ruta superior (Top Lane Path)
    this.topLanePath = [
      new Phaser.Math.Vector2(774, 82),   // Punto 0
      new Phaser.Math.Vector2(189, 83),   // Punto 1
      new Phaser.Math.Vector2(88, 109),   // Punto 2
      new Phaser.Math.Vector2(77, 215),   // Punto 3
      new Phaser.Math.Vector2(73, 748)    // Punto 4
    ];
    
    // Ruta media (Mid Lane Path)
    this.midLanePath = [
      new Phaser.Math.Vector2(805, 209),  // Punto 0
      new Phaser.Math.Vector2(254, 741)   // Punto 1
    ];
    
    // Ruta inferior (Bottom Lane Path)
    this.bottomLanePath = [
      new Phaser.Math.Vector2(913, 254),  // Punto 0
      new Phaser.Math.Vector2(915, 795),  // Punto 1
      new Phaser.Math.Vector2(898, 873),  // Punto 2
      new Phaser.Math.Vector2(809, 896),  // Punto 3
      new Phaser.Math.Vector2(268, 903)   // Punto 4
    ];
  }
  
  /**
   * Dibuja las rutas para visualización
   */
  private drawPaths(): void {
    // Crear o limpiar el gráfico de paths
    if (!this.pathGraphics) {
      this.pathGraphics = this.scene.add.graphics();
    } else {
      this.pathGraphics.clear();
    }
    
    // Estilo para la ruta superior
    this.pathGraphics.lineStyle(3, 0x00ffff, 0.7);
    this.pathGraphics.beginPath();
    
    if (this.topLanePath.length > 0) {
      this.pathGraphics.moveTo(this.topLanePath[0].x, this.topLanePath[0].y);
      
      for (let i = 1; i < this.topLanePath.length; i++) {
        this.pathGraphics.lineTo(this.topLanePath[i].x, this.topLanePath[i].y);
      }
    }
    
    // Estilo para la ruta media
    this.pathGraphics.lineStyle(3, 0xffff00, 0.7);
    
    if (this.midLanePath.length > 0) {
      this.pathGraphics.moveTo(this.midLanePath[0].x, this.midLanePath[0].y);
      
      for (let i = 1; i < this.midLanePath.length; i++) {
        this.pathGraphics.lineTo(this.midLanePath[i].x, this.midLanePath[i].y);
      }
    }
    
    // Estilo para la ruta inferior
    this.pathGraphics.lineStyle(3, 0xff00ff, 0.7);
    
    if (this.bottomLanePath.length > 0) {
      this.pathGraphics.moveTo(this.bottomLanePath[0].x, this.bottomLanePath[0].y);
      
      for (let i = 1; i < this.bottomLanePath.length; i++) {
        this.pathGraphics.lineTo(this.bottomLanePath[i].x, this.bottomLanePath[i].y);
      }
    }
    
    this.pathGraphics.strokePath();
  }
  
  /**
   * Genera un nuevo lote de minions (12 aliados y 12 enemigos)
   * con un delay entre cada carril
   */
  private spawnMinions(): void {
    // Si el spawn está deshabilitado, no hacer nada
    if (!this.spawnEnabled) return;
    
    this.waveCount++;
    console.log(`Generando oleada #${this.waveCount} de minions`);
    
    const isCannonWave = this.waveCount % 5 === 0;
    
    // Generar minions con delay entre carriles
    
    // Carril superior - inmediato
    this.spawnMinionWave(MinionType.ALLY, 'top', isCannonWave);
    this.spawnMinionWave(MinionType.ENEMY, 'top', isCannonWave);
    
    // Carril medio - después de 1 segundo
    this.scene.time.delayedCall(1000, () => {
      this.spawnMinionWave(MinionType.ALLY, 'mid', isCannonWave);
      this.spawnMinionWave(MinionType.ENEMY, 'mid', isCannonWave);
    });
    
    // Carril inferior - después de 2 segundos
    this.scene.time.delayedCall(2000, () => {
      this.spawnMinionWave(MinionType.ALLY, 'bottom', isCannonWave);
      this.spawnMinionWave(MinionType.ENEMY, 'bottom', isCannonWave);
    });
  }
  
  /**
   * Genera una oleada de minions para un carril específico
   * @param type Tipo de minion (ALLY o ENEMY)
   * @param lane Carril (top, mid, bottom)
   * @param isCannonWave Indica si es una oleada con cañón
   */
  private spawnMinionWave(type: MinionType, lane: 'top' | 'mid' | 'bottom', isCannonWave: boolean): void {
    if (!this.spawnEnabled) return;
    
    // Determinar el punto de spawn según el tipo y carril
    let spawnPoint: Phaser.Math.Vector2;
    let path: Phaser.Math.Vector2[];
    
    // Obtener el punto de spawn según el tipo y carril
    if (type === MinionType.ALLY) {
      // Para aliados, usamos el punto de spawn correspondiente al carril
      switch (lane) {
        case 'top':
          spawnPoint = this.allySpawnPoints[0];
          path = this.topLanePath.slice().reverse(); // Invertimos el camino para aliados
          break;
        case 'mid':
          spawnPoint = this.allySpawnPoints[1];
          path = this.midLanePath.slice().reverse(); // Invertimos el camino para aliados
          break;
        case 'bottom':
          spawnPoint = this.allySpawnPoints[2];
          path = this.bottomLanePath.slice().reverse(); // Invertimos el camino para aliados
          break;
      }
    } else {
      // Para enemigos, usamos el punto de spawn correspondiente al carril
      switch (lane) {
        case 'top':
          spawnPoint = this.enemySpawnPoints[0];
          path = this.topLanePath;
          break;
        case 'mid':
          spawnPoint = this.enemySpawnPoints[1];
          path = this.midLanePath;
          break;
        case 'bottom':
          spawnPoint = this.enemySpawnPoints[2];
          path = this.bottomLanePath;
          break;
      }
    }
    
    // Asegurarse de que tenemos un punto de spawn válido
    if (!spawnPoint) {
      console.error(`No se encontró punto de spawn para ${type} en carril ${lane}`);
      return;
    }
    
    // Determinar el path más cercano si no se ha asignado uno específico
    if (!path) {
      path = this.findClosestPath(spawnPoint, type);
    }
    
    // Crear minions según el tipo de oleada
    if (isCannonWave) {
      // Oleada con cañón: 3 melee, 3 caster, 1 cannon
      this.createMinion(type, MinionSubtype.MELEE, spawnPoint.x, spawnPoint.y, path);
      this.createMinion(type, MinionSubtype.MELEE, spawnPoint.x + 20, spawnPoint.y, path);
      this.createMinion(type, MinionSubtype.MELEE, spawnPoint.x - 20, spawnPoint.y, path);
      this.createMinion(type, MinionSubtype.CASTER, spawnPoint.x + 40, spawnPoint.y, path);
      this.createMinion(type, MinionSubtype.CASTER, spawnPoint.x, spawnPoint.y + 20, path);
      this.createMinion(type, MinionSubtype.CASTER, spawnPoint.x - 40, spawnPoint.y, path);
      this.createMinion(type, MinionSubtype.CANNON, spawnPoint.x, spawnPoint.y - 20, path);
    } else {
      // Oleada normal: 3 melee, 3 caster
      this.createMinion(type, MinionSubtype.MELEE, spawnPoint.x, spawnPoint.y, path);
      this.createMinion(type, MinionSubtype.MELEE, spawnPoint.x + 20, spawnPoint.y, path);
      this.createMinion(type, MinionSubtype.MELEE, spawnPoint.x - 20, spawnPoint.y, path);
      this.createMinion(type, MinionSubtype.CASTER, spawnPoint.x + 40, spawnPoint.y, path);
      this.createMinion(type, MinionSubtype.CASTER, spawnPoint.x, spawnPoint.y + 20, path);
      this.createMinion(type, MinionSubtype.CASTER, spawnPoint.x - 40, spawnPoint.y, path);
    }
  }
  
  /**
   * Encuentra el path más cercano a un punto de spawn
   * @param spawnPoint Punto de spawn
   * @param type Tipo de minion (ALLY o ENEMY)
   * @returns El path más cercano
   */
  private findClosestPath(spawnPoint: Phaser.Math.Vector2, type: MinionType): Phaser.Math.Vector2[] {
    // Calcular distancias a los puntos iniciales de cada path
    const paths = [
      { path: this.topLanePath, distance: 0 },
      { path: this.midLanePath, distance: 0 },
      { path: this.bottomLanePath, distance: 0 }
    ];
    
    // Para aliados, calculamos la distancia al último punto del path (invertido)
    // Para enemigos, calculamos la distancia al primer punto del path
    paths.forEach(pathInfo => {
      const pathArray = pathInfo.path;
      const referencePoint = type === MinionType.ALLY ? pathArray[pathArray.length - 1] : pathArray[0];
      
      // Calcular distancia euclidiana
      const dx = spawnPoint.x - referencePoint.x;
      const dy = spawnPoint.y - referencePoint.y;
      pathInfo.distance = Math.sqrt(dx * dx + dy * dy);
    });
    
    // Ordenar por distancia y obtener el path más cercano
    paths.sort((a, b) => a.distance - b.distance);
    
    // Devolver el path más cercano (invertido para aliados)
    return type === MinionType.ALLY ? paths[0].path.slice().reverse() : paths[0].path;
  }
  
  /**
   * Crea un minion con el tipo y subtipo especificados
   * @param type Tipo de minion (ALLY o ENEMY)
   * @param subtype Subtipo de minion (MELEE, CASTER, CANNON)
   * @param x Posición X
   * @param y Posición Y
   * @param path Camino a seguir
   */
  private createMinion(type: MinionType, subtype: MinionSubtype, x: number, y: number, path: Phaser.Math.Vector2[]): void {
    if (!this.scene) return;
    
    const minion = new Minion(this.scene, x, y, type, subtype);
    minion.setPath(path);
    this.minions.push(minion);
  }
  
  /**
   * Elimina los minions destruidos de la lista
   */
  private cleanupDestroyedMinions(): void {
    this.minions = this.minions.filter(minion => minion.active);
  }
  
  /**
   * Actualiza todos los minions
   */
  public update(): void {
    // Limpiar minions destruidos
    this.cleanupDestroyedMinions();
    
    // Obtener referencias a las torres y al jugador desde la escena
    const towerManager = this.scene.towerManager || (this.scene as any).towerManager;
    const player = this.scene.player || (this.scene as any).player;
    
    // Preparar la lista completa de objetivos posibles
    let targets = [...this.minions];
    
    // Añadir torres si están disponibles
    if (towerManager && typeof towerManager.getAllTowers === 'function') {
      try {
        const towers = towerManager.getAllTowers();
        if (Array.isArray(towers)) {
          targets = [...targets, ...towers];
        }
      } catch (error) {
        console.error("Error al obtener torres:", error);
      }
    }
    
    // Añadir jugador si está disponible
    if (player) {
      targets.push(player);
    }
    
    // Hacer que los minions busquen objetivos
    for (const minion of this.minions) {
      if (minion && minion.active && typeof minion.findAndAttackTargets === 'function') {
        minion.findAndAttackTargets(targets);
      }
    }
  }
  
  /**
   * Obtiene la lista de minions
   */
  public getMinions(): Minion[] {
    return this.minions;
  }
  
  /**
   * Destruye el manager y todos los minions
   */
  public destroy(): void {
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }
    
    for (const minion of this.minions) {
      minion.destroy();
    }
    
    this.minions = [];
    
    if (this.spawnGizmos) {
      this.spawnGizmos.destroy();
    }
    
    if (this.pathGraphics) {
      this.pathGraphics.destroy();
    }
  }
  
  /**
   * Obtiene los puntos de spawn de aliados
   */
  public getAllySpawnPoints(): Phaser.Math.Vector2[] {
    return this.allySpawnPoints;
  }
  
  /**
   * Obtiene los puntos de spawn de enemigos
   */
  public getEnemySpawnPoints(): Phaser.Math.Vector2[] {
    return this.enemySpawnPoints;
  }
  
  /**
   * Obtiene los puntos del path superior
   */
  public getTopLanePath(): Phaser.Math.Vector2[] {
    return this.topLanePath;
  }
  
  /**
   * Obtiene los puntos del path medio
   */
  public getMidLanePath(): Phaser.Math.Vector2[] {
    return this.midLanePath;
  }
  
  /**
   * Obtiene los puntos del path inferior
   */
  public getBottomLanePath(): Phaser.Math.Vector2[] {
    return this.bottomLanePath;
  }
  
  /**
   * Obtiene todos los minions activos
   */
  public getAllMinions(): Phaser.GameObjects.GameObject[] {
    return this.minions;
  }
  
  /**
   * Establece los puntos de spawn de aliados
   */
  public setAllySpawnPoints(points: Phaser.Math.Vector2[]): void {
    this.allySpawnPoints = points;
    this.redrawGizmos();
  }
  
  /**
   * Establece los puntos de spawn de enemigos
   */
  public setEnemySpawnPoints(points: Phaser.Math.Vector2[]): void {
    this.enemySpawnPoints = points;
    this.redrawGizmos();
  }
  
  /**
   * Establece los puntos del path superior
   */
  public setTopLanePath(points: Phaser.Math.Vector2[]): void {
    this.topLanePath = points;
    this.redrawGizmos();
  }
  
  /**
   * Establece los puntos del path medio
   */
  public setMidLanePath(points: Phaser.Math.Vector2[]): void {
    this.midLanePath = points;
    this.redrawGizmos();
  }
  
  /**
   * Establece los puntos del path inferior
   */
  public setBottomLanePath(points: Phaser.Math.Vector2[]): void {
    this.bottomLanePath = points;
    this.redrawGizmos();
  }
  
  /**
   * Redibuja los gizmos después de cambiar los puntos
   */
  private redrawGizmos(): void {
    // Limpiar gizmos existentes
    if (this.spawnGizmos) {
      this.spawnGizmos.clear();
    }
    
    if (this.pathGraphics) {
      this.pathGraphics.clear();
    }
    
    // Redibujar
    this.drawSpawnGizmos();
    this.drawPaths();
  }
  
  /**
   * Verifica si el spawn de minions está habilitado
   */
  public isSpawnEnabled(): boolean {
    return this.spawnEnabled;
  }
  
  /**
   * Habilita o deshabilita el spawn de minions
   */
  public setSpawnEnabled(enabled: boolean): void {
    this.spawnEnabled = enabled;
    
    // Si se está habilitando el spawn, reiniciar el timer
    if (enabled && this.spawnTimer && !this.spawnTimer.paused) {
      this.spawnTimer.paused = false;
    }
    
    // Si se está deshabilitando el spawn, pausar el timer
    if (!enabled && this.spawnTimer && !this.spawnTimer.paused) {
      this.spawnTimer.paused = true;
    }
  }
} 