# WebWarriors

A web-based MOBA game inspired by League of Legends, built with TypeScript, Phaser.js and Socket.io.

## Description

WebWarriors is a multiplayer online battle arena (MOBA) game that runs in the browser. Players choose from a variety of unique characters and compete in teams to destroy the enemy's Nexus while defending their own.

### Key Features

- Real-time multiplayer battles with up to 5v5 players
- Unique characters with different abilities and roles
- Three-lane map with towers and minions
- Level-based progression system
- Built with modern web technologies

## Technologies Used

- TypeScript
- Phaser.js (Game Engine)
- Socket.io (Real-time Communication)
- Node.js & Express (Server)
- ESLint & Prettier (Code Quality)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:smmdsa/WebWarriors.git
   cd WebWarriors
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
WebWarriors/
├── src/
│   ├── client/         # Client-side game code
│   │   ├── scenes/     # Phaser game scenes
│   │   ├── sprites/    # Game sprites and entities
│   │   └── config/     # Game configuration
│   ├── server/         # Server-side code
│   │   ├── game/       # Game logic
│   │   └── socket/     # Socket.io handlers
│   └── shared/         # Shared types and utilities
├── public/             # Static assets
├── dist/              # Compiled code
└── tests/             # Test files
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- Inspired by League of Legends
- Built with Phaser.js game framework
- Real-time multiplayer powered by Socket.io 