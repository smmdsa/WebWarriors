import Phaser from 'phaser';
import { Team } from './Tower';

export class Nexus extends Phaser.GameObjects.Container {
  private maxHealth: number = 25000;
  private health: number = 25000;
  private healthBar: Phaser.GameObjects.Graphics;
  private team: Team;
  private isDestroyed: boolean = false;
  private sprite: Phaser.GameObjects.Ellipse;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    team: Team
  ) {
    super(scene, x, y);
    
    this.team = team;
    
    // Crear sprite circular para el nexo
    this.sprite = scene.add.ellipse(0, 0, 48, 48, team === Team.ALLY ? 0x0000ff : 0xff0000);
    this.add(this.sprite);
    
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
  
  public getPosition(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y);
  }
  
  public setPosition(x: number, y: number): this {
    super.setPosition(x, y);
    this.updateHealthBar();
    return this;
  }
  
  public takeDamage(amount: number): void {
    if (this.isDestroyed) return;
    
    this.health -= amount;
    
    // Actualizar barra de salud
    this.updateHealthBar();
    
    // Comprobar si el nexo ha sido destruido
    if (this.health <= 0) {
      this.destroy();
    }
  }
  
  public destroy(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    // Eliminar gráficos si existen
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    // Emitir evento de nexo destruido
    if (this.scene) {
      this.scene.events.emit('nexus-destroyed', this);
    }
    
    // Llamar al método destroy de Phaser
    super.destroy();
  }
  
  private updateHealthBar(): void {
    // Verificar que healthBar existe
    if (!this.healthBar) {
      this.healthBar = this.scene.add.graphics();
    }
    
    this.healthBar.clear();
    
    // Dimensiones de la barra de salud (más grande que la de las torres)
    const width = 60;
    const height = 8;
    const x = this.x - width / 2;
    const y = this.y - 40;
    
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
  
  public update(): void {
    if (this.isDestroyed || !this.scene) return;
    
    // Actualizar posición de elementos visuales
    this.updateHealthBar();
  }
} 