import { 
  ChampionDefinition, 
  ChampionRole, 
  AttackType, 
  DamageType, 
  SkillEffectType 
} from '../types/Champion';

// Campeón guerrero básico
export const warrior: ChampionDefinition = {
  id: 'warrior',
  name: 'Valiant',
  role: ChampionRole.FIGHTER,
  attackType: AttackType.MELEE,
  damageType: DamageType.PHYSICAL,
  baseStats: {
    health: 1200,
    maxHealth: 1200,
    mana: 500,
    maxMana: 500,
    attackDamage: 65,
    abilityPower: 0,
    attackSpeed: 0.7,
    moveSpeed: 75,
    physicalResistance: 20,
    magicResistance: 15,
    healthRegen: 5,
    manaRegen: 3,
    criticalChance: 0.05,
    criticalDamage: 1.5,
    lifeSteal: 0,
    cooldownReduction: 0
  },
  passive: {
    name: 'Determinación',
    description: 'Después de recibir daño, Valiant gana resistencia física y mágica durante 3 segundos.',
    effects: [
      {
        type: SkillEffectType.BUFF,
        value: 10,
        duration: 3000
      }
    ]
  },
  skills: [
    {
      id: 'warrior_q',
      name: 'Golpe Poderoso',
      description: 'Valiant golpea con fuerza, causando daño físico y aturdiendo brevemente al objetivo.',
      cooldown: 8000,
      manaCost: 60,
      range: 50,
      isUltimate: false,
      effects: [
        {
          type: SkillEffectType.DAMAGE,
          value: 80,
          damageType: DamageType.PHYSICAL
        },
        {
          type: SkillEffectType.STUN,
          value: 1,
          duration: 1000
        }
      ]
    },
    {
      id: 'warrior_w',
      name: 'Escudo Protector',
      description: 'Valiant se protege con un escudo que absorbe daño.',
      cooldown: 15000,
      manaCost: 70,
      range: 0,
      isUltimate: false,
      effects: [
        {
          type: SkillEffectType.SHIELD,
          value: 150,
          duration: 5000
        }
      ]
    },
    {
      id: 'warrior_e',
      name: 'Carga Heroica',
      description: 'Valiant carga hacia adelante, causando daño a los enemigos en su camino.',
      cooldown: 12000,
      manaCost: 65,
      range: 200,
      isUltimate: false,
      effects: [
        {
          type: SkillEffectType.DASH,
          value: 200
        },
        {
          type: SkillEffectType.DAMAGE,
          value: 60,
          damageType: DamageType.PHYSICAL,
          areaOfEffect: true,
          areaRadius: 50
        }
      ]
    },
    {
      id: 'warrior_r',
      name: 'Furia del Campeón',
      description: 'Valiant entra en un estado de furia, aumentando su daño de ataque y velocidad de ataque.',
      cooldown: 90000,
      manaCost: 100,
      range: 0,
      isUltimate: true,
      effects: [
        {
          type: SkillEffectType.BUFF,
          value: 50,
          duration: 8000
        }
      ]
    }
  ],
  description: 'Un valiente guerrero que se especializa en combate cuerpo a cuerpo y protección.',
  difficulty: 3
};

// Campeón mago básico
export const mage: ChampionDefinition = {
  id: 'mage',
  name: 'Arcana',
  role: ChampionRole.MAGE,
  attackType: AttackType.RANGED,
  damageType: DamageType.MAGICAL,
  baseStats: {
    health: 800,
    maxHealth: 800,
    mana: 900,
    maxMana: 900,
    attackDamage: 40,
    abilityPower: 70,
    attackSpeed: 0.6,
    moveSpeed: 70,
    physicalResistance: 10,
    magicResistance: 20,
    healthRegen: 3,
    manaRegen: 6,
    criticalChance: 0,
    criticalDamage: 1.5,
    lifeSteal: 0,
    cooldownReduction: 0.05
  },
  passive: {
    name: 'Resonancia Arcana',
    description: 'Después de lanzar una habilidad, el siguiente ataque básico de Arcana causa daño mágico adicional.',
    effects: [
      {
        type: SkillEffectType.DAMAGE,
        value: 30,
        damageType: DamageType.MAGICAL
      }
    ]
  },
  skills: [
    {
      id: 'mage_q',
      name: 'Orbe Arcano',
      description: 'Arcana lanza un orbe de energía mágica que causa daño al impactar.',
      cooldown: 5000,
      manaCost: 50,
      range: 300,
      projectileSpeed: 300,
      isUltimate: false,
      effects: [
        {
          type: SkillEffectType.DAMAGE,
          value: 90,
          damageType: DamageType.MAGICAL
        }
      ]
    },
    {
      id: 'mage_w',
      name: 'Barrera Mística',
      description: 'Arcana crea una barrera mágica que absorbe daño y aumenta su resistencia mágica.',
      cooldown: 18000,
      manaCost: 80,
      range: 0,
      isUltimate: false,
      effects: [
        {
          type: SkillEffectType.SHIELD,
          value: 120,
          duration: 4000
        },
        {
          type: SkillEffectType.BUFF,
          value: 15,
          duration: 4000
        }
      ]
    },
    {
      id: 'mage_e',
      name: 'Destello Arcano',
      description: 'Arcana se teletransporta a una corta distancia, dejando una explosión de energía en su posición original.',
      cooldown: 15000,
      manaCost: 70,
      range: 150,
      isUltimate: false,
      effects: [
        {
          type: SkillEffectType.TELEPORT,
          value: 150
        },
        {
          type: SkillEffectType.DAMAGE,
          value: 70,
          damageType: DamageType.MAGICAL,
          areaOfEffect: true,
          areaRadius: 100
        }
      ]
    },
    {
      id: 'mage_r',
      name: 'Tormenta Arcana',
      description: 'Arcana desata una tormenta de energía mágica en un área, causando daño a todos los enemigos afectados.',
      cooldown: 120000,
      manaCost: 150,
      range: 400,
      isUltimate: true,
      effects: [
        {
          type: SkillEffectType.DAMAGE,
          value: 300,
          damageType: DamageType.MAGICAL,
          areaOfEffect: true,
          areaRadius: 200
        }
      ]
    }
  ],
  description: 'Una poderosa maga que domina las artes arcanas y causa gran daño a distancia.',
  difficulty: 5
};

// Lista de todos los campeones disponibles
export const champions: { [key: string]: ChampionDefinition } = {
  warrior,
  mage
}; 