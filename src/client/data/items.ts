import { PlayerStats } from '../types/Player';

export interface Item {
  id: string;
  name: string;
  cost: number;
  description: string;
  stats: Partial<PlayerStats>;
  icon?: string;
}

// Catálogo de items disponibles en la tienda
export const items: Record<string, Item> = {
  // Items básicos
  dorans_blade: {
    id: 'dorans_blade',
    name: 'Espada de Doran',
    cost: 450,
    description: 'Un arma básica que proporciona daño físico y salud.',
    stats: {
      physicalDamage: 8,
      maxHealth: 80
    },
    icon: 'dorans_blade'
  },
  dorans_ring: {
    id: 'dorans_ring',
    name: 'Anillo de Doran',
    cost: 400,
    description: 'Un anillo mágico que proporciona poder de habilidad y mana.',
    stats: {
      magicDamage: 15,
      maxMana: 50
    },
    icon: 'dorans_ring'
  },
  dorans_shield: {
    id: 'dorans_shield',
    name: 'Escudo de Doran',
    cost: 450,
    description: 'Un escudo resistente que proporciona salud y resistencias.',
    stats: {
      maxHealth: 120,
      physicalResistance: 5,
      magicResistance: 5
    },
    icon: 'dorans_shield'
  },
  
  // Items de daño físico
  long_sword: {
    id: 'long_sword',
    name: 'Espada Larga',
    cost: 350,
    description: 'Una espada básica que aumenta el daño físico.',
    stats: {
      physicalDamage: 10
    },
    icon: 'long_sword'
  },
  bf_sword: {
    id: 'bf_sword',
    name: 'Espada B.F.',
    cost: 1300,
    description: 'Una espada poderosa que proporciona un gran aumento de daño físico.',
    stats: {
      physicalDamage: 40
    },
    icon: 'bf_sword'
  },
  
  // Items de daño mágico
  amplifying_tome: {
    id: 'amplifying_tome',
    name: 'Tomo Amplificador',
    cost: 435,
    description: 'Un libro que aumenta el poder de habilidad.',
    stats: {
      magicDamage: 20
    },
    icon: 'amplifying_tome'
  },
  needlessly_large_rod: {
    id: 'needlessly_large_rod',
    name: 'Vara Innecesariamente Grande',
    cost: 1250,
    description: 'Una vara mágica que proporciona un gran aumento de poder de habilidad.',
    stats: {
      magicDamage: 60
    },
    icon: 'needlessly_large_rod'
  },
  
  // Items defensivos
  cloth_armor: {
    id: 'cloth_armor',
    name: 'Armadura de Tela',
    cost: 300,
    description: 'Una armadura básica que aumenta la resistencia física.',
    stats: {
      physicalResistance: 15
    },
    icon: 'cloth_armor'
  },
  null_magic_mantle: {
    id: 'null_magic_mantle',
    name: 'Manto de Magia Nula',
    cost: 450,
    description: 'Un manto que aumenta la resistencia mágica.',
    stats: {
      magicResistance: 25
    },
    icon: 'null_magic_mantle'
  },
  
  // Items de velocidad
  boots_of_speed: {
    id: 'boots_of_speed',
    name: 'Botas de Velocidad',
    cost: 300,
    description: 'Botas básicas que aumentan la velocidad de movimiento.',
    stats: {
      moveSpeed: 25
    },
    icon: 'boots_of_speed'
  },
  
  // Items compuestos
  infinity_edge: {
    id: 'infinity_edge',
    name: 'Filo Infinito',
    cost: 3400,
    description: 'Un arma legendaria que proporciona un enorme daño físico.',
    stats: {
      physicalDamage: 70,
      trueDamage: 10
    },
    icon: 'infinity_edge'
  },
  rabadon_deathcap: {
    id: 'rabadon_deathcap',
    name: 'Sombrero Mortal de Rabadon',
    cost: 3600,
    description: 'Un sombrero mágico que proporciona un enorme poder de habilidad.',
    stats: {
      magicDamage: 120
    },
    icon: 'rabadon_deathcap'
  },
  thornmail: {
    id: 'thornmail',
    name: 'Cota de Espinas',
    cost: 2700,
    description: 'Una armadura que refleja el daño físico recibido.',
    stats: {
      physicalResistance: 80,
      maxHealth: 350
    },
    icon: 'thornmail'
  }
}; 