// Tipos de daño
export enum DamageType {
  PHYSICAL = 'physical',
  MAGICAL = 'magical',
  TRUE = 'true'
}

// Tipos de ataque
export enum AttackType {
  MELEE = 'melee',
  RANGED = 'ranged'
}

// Roles de campeones
export enum ChampionRole {
  TANK = 'tank',
  FIGHTER = 'fighter',
  ASSASSIN = 'assassin',
  MAGE = 'mage',
  MARKSMAN = 'marksman',
  SUPPORT = 'support'
}

// Efectos de habilidades
export enum SkillEffectType {
  DAMAGE = 'damage',         // Daño directo
  STUN = 'stun',             // Aturdimiento
  SHIELD = 'shield',         // Escudo
  HEAL = 'heal',             // Curación
  BUFF = 'buff',             // Mejora de estadísticas
  DEBUFF = 'debuff',         // Reducción de estadísticas
  DASH = 'dash',             // Movimiento rápido
  TELEPORT = 'teleport',     // Teletransporte
  SUMMON = 'summon'          // Invocar unidad
}

// Estadísticas base de un campeón
export interface ChampionStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  attackDamage: number;
  abilityPower: number;
  attackSpeed: number;
  moveSpeed: number;
  physicalResistance: number;
  magicResistance: number;
  healthRegen: number;
  manaRegen: number;
  criticalChance: number;
  criticalDamage: number;
  lifeSteal: number;
  cooldownReduction: number;
}

// Efecto de una habilidad
export interface SkillEffect {
  type: SkillEffectType;
  value: number;
  duration?: number;
  damageType?: DamageType;
  areaOfEffect?: boolean;
  areaRadius?: number;
}

// Habilidad de un campeón
export interface ChampionSkill {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  manaCost: number;
  range: number;
  effects: SkillEffect[];
  isUltimate: boolean;
  icon?: string;
  projectileSpeed?: number;
  castTime?: number;
}

// Definición completa de un campeón
export interface ChampionDefinition {
  id: string;
  name: string;
  role: ChampionRole;
  attackType: AttackType;
  damageType: DamageType;
  baseStats: ChampionStats;
  passive: {
    name: string;
    description: string;
    effects: SkillEffect[];
  };
  skills: ChampionSkill[];
  description: string;
  difficulty: number; // 1-10
  icon?: string;
} 