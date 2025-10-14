import Phaser from 'phaser';
import './style.css';
import { BootScene } from './game/scenes/BootScene';
import { MainScene } from './game/scenes/MainScene';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'app',
  backgroundColor: '#120f1b',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MainScene],
};

const game = new Phaser.Game(config);

export default game;
