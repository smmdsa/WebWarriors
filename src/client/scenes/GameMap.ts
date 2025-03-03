import 'phaser';

interface TileInfo {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class GameMap {
  private scene: Phaser.Scene;
  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private layers!: {
    ground: Phaser.Tilemaps.TilemapLayer;
    paths: Phaser.Tilemaps.TilemapLayer;
    river: Phaser.Tilemaps.TilemapLayer;
    structures: Phaser.Tilemaps.TilemapLayer;
  };
  private tileIndexMap: Map<string, number> = new Map();
  private mapWidth: number = 992; // 31 tiles * 32 pixels
  private mapHeight: number = 992; // 31 tiles * 32 pixels

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  preload(): void {
    // Cargar el tileset y su configuración
    this.scene.load.image('tiles', 'assets/tiles/tileset.png');
    this.scene.load.json('tilesData', 'assets/tiles/tileset.json');
  }

  create(): void {
    // Crear el mapa vacío (31x31 tiles para un mapa de 992x992 pixels)
    this.map = this.scene.make.tilemap({
      tileWidth: 32,
      tileHeight: 32,
      width: 31,
      height: 31
    });

    // Cargar la información del tileset desde el JSON
    const tilesData = this.scene.cache.json.get('tilesData') as TileInfo[];
    
    // Crear el tileset
    const newTileset = this.map.addTilesetImage('tiles', 'tiles', 32, 32, 0, 0);

    if (!newTileset) {
      console.error('Failed to create tileset');
      return;
    }

    this.tileset = newTileset;

    // Mapear los nombres de los tiles a sus índices
    tilesData.forEach((tileInfo) => {
      const tileX = tileInfo.x / 32;
      const tileY = tileInfo.y / 32;
      const tilesPerRow = 128 / 32;
      const index = tileY * tilesPerRow + tileX;
      this.tileIndexMap.set(tileInfo.name, index);
    });

    // Crear las capas
    const ground = this.map.createBlankLayer('ground', this.tileset, 0, 0);
    const paths = this.map.createBlankLayer('paths', this.tileset, 0, 0);
    const river = this.map.createBlankLayer('river', this.tileset, 0, 0);
    const structures = this.map.createBlankLayer('structures', this.tileset, 0, 0);

    if (!ground || !paths || !river || !structures) {
      console.error('Failed to create layers');
      return;
    }

    this.layers = {
      ground,
      paths,
      river,
      structures
    };

    // Llenar el mapa con césped base
    const grassIndex = this.getTileIndex('grass');
    this.layers.ground.fill(grassIndex);

    // Crear el mapa en orden
    this.createRiver();    // Primero el río
    this.createPaths();    // Luego los caminos
    this.createBases();    // Finalmente las bases
  }

  /**
   * Obtiene el ancho del mapa en píxeles
   */
  public getWidth(): number {
    return this.mapWidth;
  }

  /**
   * Obtiene el alto del mapa en píxeles
   */
  public getHeight(): number {
    return this.mapHeight;
  }

  private getTileIndex(name: string): number {
    const index = this.tileIndexMap.get(name);
    if (index === undefined) {
      console.error(`Tile ${name} not found in tileset`);
      return 0;
    }
    return index;
  }

  private createRiver(): void {
    const riverIndex = this.getTileIndex('river');
    const edgeTopIndex = this.getTileIndex('river_edge_top');
    const edgeBottomIndex = this.getTileIndex('river_edge_bottom');

    // Crear el río diagonal
    const startX = 5;
    const startY = 5;
    const endX = 25;
    const endY = 25;

    // Dibujar el río diagonal
    const steps = 20; // Número de pasos para crear el río
    for (let i = 0; i <= steps; i++) {
      const x = Math.floor(startX + (endX - startX) * (i / steps));
      const y = Math.floor(startY + (endY - startY) * (i / steps));

      // Dibujar el río con sus bordes
      this.layers.river.putTileAt(riverIndex, x, y);
      this.layers.river.putTileAt(edgeTopIndex, x, y - 1);
      this.layers.river.putTileAt(edgeBottomIndex, x, y + 1);

      // Hacer el río más ancho
      this.layers.river.putTileAt(riverIndex, x + 1, y);
      this.layers.river.putTileAt(riverIndex, x - 1, y);
    }
  }

  private createPaths(): void {
    const pathIndex = this.getTileIndex('path');

    // Crear el camino del perímetro (3 tiles de ancho)
    // Lado superior
    for (let x = 1; x < 30; x++) {
      for (let offset = 0; offset < 3; offset++) {
        this.layers.paths.putTileAt(pathIndex, x, 1 + offset);
      }
    }
    // Lado inferior
    for (let x = 1; x < 30; x++) {
      for (let offset = 0; offset < 3; offset++) {
        this.layers.paths.putTileAt(pathIndex, x, 27 + offset);
      }
    }
    // Lado izquierdo
    for (let y = 4; y < 27; y++) {
      for (let offset = 0; offset < 3; offset++) {
        this.layers.paths.putTileAt(pathIndex, 1 + offset, y);
      }
    }
    // Lado derecho
    for (let y = 4; y < 27; y++) {
      for (let offset = 0; offset < 3; offset++) {
        this.layers.paths.putTileAt(pathIndex, 27 + offset, y);
      }
    }

    // Crear el camino diagonal de esquina inferior izquierda a esquina superior derecha (3 tiles de ancho)
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
      const x = Math.floor(1 + (28) * (i / steps));
      const y = Math.floor(29 - (28) * (i / steps));
      
      // Hacer el camino más ancho (3 tiles)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          // Verificar que estamos dentro de los límites del mapa
          if (nx >= 1 && nx < 30 && ny >= 1 && ny < 30) {
            this.layers.paths.putTileAt(pathIndex, nx, ny);
          }
        }
      }
    }

    // Crear el camino diagonal de esquina superior izquierda a esquina inferior derecha (3 tiles de ancho)
    for (let i = 0; i <= steps; i++) {
      const x = Math.floor(1 + (28) * (i / steps));
      const y = Math.floor(1 + (28) * (i / steps));
      
      // Hacer el camino más ancho (3 tiles)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          // Verificar que estamos dentro de los límites del mapa
          if (nx >= 1 && nx < 30 && ny >= 1 && ny < 30) {
            this.layers.paths.putTileAt(pathIndex, nx, ny);
          }
        }
      }
    }
  }

  private createPath(startX: number, startY: number, endX: number, endY: number): void {
    const pathIndex = this.getTileIndex('path');
    
    for (let x = startX; x <= endX; x++) {
      this.layers.paths.putTileAt(pathIndex, x, startY);
    }
  }

  private createBases(): void {
    // Base aliada (esquina inferior izquierda)
    this.createBase(1, 25, 'ally');
    
    // Base enemiga (esquina superior derecha)
    this.createBase(25, 1, 'enemy');
  }

  private createBase(x: number, y: number, type: 'ally' | 'enemy'): void {
    const floorIndex = this.getTileIndex('base_floor');
    const wallIndex = this.getTileIndex('base_wall');
    const nexusIndex = this.getTileIndex('nexus_platform');

    // Crear plataforma de la base (6x6)
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        this.layers.structures.putTileAt(floorIndex, x + i, y + j);
      }
    }

    // Crear muros de la base
    // Muro horizontal superior
    for (let i = -1; i <= 6; i++) {
      this.layers.structures.putTileAt(wallIndex, x + i, y - 1);
    }
    // Muro horizontal inferior
    for (let i = -1; i <= 6; i++) {
      this.layers.structures.putTileAt(wallIndex, x + i, y + 6);
    }
    // Muros verticales
    for (let j = 0; j < 6; j++) {
      this.layers.structures.putTileAt(wallIndex, x - 1, y + j);
      this.layers.structures.putTileAt(wallIndex, x + 6, y + j);
    }

    // Añadir plataforma del Nexus en el centro
    this.layers.structures.putTileAt(nexusIndex, x + 3, y + 3);
  }
} 