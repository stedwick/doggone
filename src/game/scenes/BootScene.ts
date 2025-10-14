import Phaser from 'phaser';

const DOG_KEY = 'player-dog';
const BACKGROUND_KEY = 'background-sky';
const FOREGROUND_KEY = 'foreground-ground';
const HAT_KEY = 'wizard-hat';
const NPC_KEY = 'forest-npc';
const INTERACTABLE_KEY = 'interactable-crystal';
const BUTTON_KEY = 'virtual-button';
const BUTTON_PRESSED_KEY = 'virtual-button-pressed';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('MainScene');
  }

  private createPlaceholderTextures(): void {
    this.createDogTexture();
    this.createEnvironmentTextures();
    this.createItemTextures();
    this.createButtonTextures();
  }

  private createDogTexture(): void {
    const gfx = this.makeGraphics();
    gfx.fillStyle(0xf4b860, 1);
    gfx.fillRect(0, 0, 32, 24);
    gfx.fillStyle(0x432534, 1);
    gfx.fillRect(4, 4, 8, 4);
    gfx.fillRect(20, 4, 8, 4);
    gfx.fillRect(10, 18, 4, 6);
    gfx.fillRect(18, 18, 4, 6);
    gfx.generateTexture(DOG_KEY, 32, 24);
    gfx.destroy();
  }

  private createEnvironmentTextures(): void {
    const background = this.makeGraphics();
    const gradientHeight = 300;
    background.fillStyle(0x312d52, 1);
    background.fillRect(0, 0, 800, gradientHeight);
    background.fillStyle(0x493a7c, 1);
    background.fillRect(0, gradientHeight - 80, 800, 80);
    background.generateTexture(BACKGROUND_KEY, 800, gradientHeight);
    background.destroy();

    const foreground = this.makeGraphics();
    foreground.fillStyle(0x2f1e1d, 1);
    foreground.fillRect(0, 0, 800, 300);
    foreground.fillStyle(0x4f2f2f, 1);
    foreground.fillRect(0, 0, 800, 60);
    foreground.generateTexture(FOREGROUND_KEY, 800, 300);
    foreground.destroy();
  }

  private createItemTextures(): void {
    const hat = this.makeGraphics();
    hat.fillStyle(0x5e3fa0, 1);
    hat.fillTriangle(16, 0, 0, 24, 32, 24);
    hat.fillStyle(0xd4c2fc, 1);
    hat.fillRect(4, 24, 24, 6);
    hat.generateTexture(HAT_KEY, 32, 30);
    hat.destroy();

    const npc = this.makeGraphics();
    npc.fillStyle(0x8cc0de, 1);
    npc.fillRect(0, 0, 28, 36);
    npc.fillStyle(0x143642, 1);
    npc.fillRect(4, 4, 8, 8);
    npc.fillRect(16, 4, 8, 8);
    npc.fillRect(8, 20, 12, 6);
    npc.generateTexture(NPC_KEY, 28, 36);
    npc.destroy();

    const interactable = this.makeGraphics();
    interactable.fillStyle(0xff9f1c, 1);
    interactable.fillRect(0, 0, 24, 24);
    interactable.fillStyle(0xffffff, 1);
    interactable.fillRect(8, 8, 8, 8);
    interactable.generateTexture(INTERACTABLE_KEY, 24, 24);
    interactable.destroy();
  }

  private createButtonTextures(): void {
    const button = this.makeGraphics();
    button.fillStyle(0x1f1b2e, 0.7);
    button.fillRoundedRect(0, 0, 36, 36, 6);
    button.lineStyle(2, 0x7353ba);
    button.strokeRoundedRect(1, 1, 34, 34, 6);
    button.generateTexture(BUTTON_KEY, 36, 36);
    button.destroy();

    const buttonPressed = this.makeGraphics();
    buttonPressed.fillStyle(0x312d52, 0.9);
    buttonPressed.fillRoundedRect(0, 0, 36, 36, 6);
    buttonPressed.lineStyle(2, 0xd4c2fc);
    buttonPressed.strokeRoundedRect(1, 1, 34, 34, 6);
    buttonPressed.generateTexture(BUTTON_PRESSED_KEY, 36, 36);
    buttonPressed.destroy();
  }

  private makeGraphics(): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics({ x: 0, y: 0 });
    graphics.setVisible(false);
    return graphics;
  }
}

export const TextureKeys = {
  DOG_KEY,
  BACKGROUND_KEY,
  FOREGROUND_KEY,
  HAT_KEY,
  NPC_KEY,
  INTERACTABLE_KEY,
  BUTTON_KEY,
  BUTTON_PRESSED_KEY,
} as const;
