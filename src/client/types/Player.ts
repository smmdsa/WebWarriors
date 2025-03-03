/**
 * Interfaz para las estadísticas del jugador
 */
export interface PlayerStats {
  moveSpeed: number;
  physicalDamage: number;
  magicDamage: number;
  trueDamage: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  physicalResistance: number;
  magicResistance: number;
}

/**
 * Interfaz para los items del jugador
 */
export interface PlayerItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  stats: Partial<PlayerStats>;
  icon?: string;
} 