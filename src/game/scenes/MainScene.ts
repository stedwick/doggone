import Phaser from 'phaser';
import { TextureKeys } from './BootScene';
import type { InventoryItem, InteractionConfig, InputDirection, InputMethod } from '../types';
import { createInventory, addItemToInventory, formatInventoryLabel, type InventoryState } from '../logic/inventory';
import { resolveMovementVector, type MovementInput } from '../logic/movement';
import { createDialogueState, getNextDialogueLine, type DialogueState } from '../logic/dialogue';

interface VirtualButtonConfig {
  label: string;
  direction: InputDirection;
  offsetX: number;
  offsetY: number;
}

const WORLD_HEIGHT = 600;
const WORLD_WIDTH = 1600;
const PLAYER_SPEED = 140;

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private hatAccessory!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private interactables!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private controlsPanel!: Phaser.GameObjects.Container;
  private wasdContainer!: Phaser.GameObjects.Container;
  private arrowContainer!: Phaser.GameObjects.Container;
  private controlLabel!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private inventoryText!: Phaser.GameObjects.Text;
  private sceneMessageText!: Phaser.GameObjects.Text;
  private dialogueContainer!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;

  private inventory: InventoryState = createInventory();
  private lastKeyboardMethod: Extract<InputMethod, 'wasd' | 'arrows'> = 'wasd';
  private virtualInputState: Record<InputDirection, boolean> = {
    up: false,
    down: false,
    left: false,
    right: false,
  };
  private activeDialogue: DialogueState | null = null;
  private awaitingDialogueAdvance = false;
  private interactionCooldown = false;
  private transitionMessageArmed = false;
  private sceneMessageTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('MainScene');
  }

  create(): void {
    this.createEnvironment();
    this.createPlayer();
    this.createUI();
    this.createControls();
    this.createObstacles();
    this.createInteractables();
    this.registerInputHandlers();

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  update(): void {
    if (!this.player) {
      return;
    }

    if (!this.isDialogueActive()) {
      this.updatePlayerMovement();
    } else {
      this.player.setVelocity(0, 0);
    }

    this.updateHatPosition();
    this.updateSceneTransitionState();
  }

  private createEnvironment(): void {
    const bg = this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT / 2, TextureKeys.BACKGROUND_KEY);
    bg.setOrigin(0, 0);
    bg.setScrollFactor(1, 0);

    const fg = this.add.tileSprite(0, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT / 2, TextureKeys.FOREGROUND_KEY);
    fg.setOrigin(0, 0);
    fg.setScrollFactor(1, 0);
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(200, 420, TextureKeys.DOG_KEY);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(28, 20).setOffset(2, 4);

    this.hatAccessory = this.add.image(this.player.x, this.player.y - 18, TextureKeys.HAT_KEY);
    this.hatAccessory.setVisible(false);
    this.hatAccessory.setDepth(10);
    this.hatAccessory.setScrollFactor(1, 1);
  }

  private createObstacles(): void {
    this.obstacles = this.physics.add.staticGroup();
    const log = this.obstacles.create(500, 480, TextureKeys.INTERACTABLE_KEY);
    log.setScale(2, 0.7).refreshBody();

    const rock = this.obstacles.create(900, 450, TextureKeys.INTERACTABLE_KEY);
    rock.setScale(1.5, 1.2).refreshBody();

    this.physics.add.collider(this.player, this.obstacles);
  }

  private createInteractables(): void {
    this.interactables = this.physics.add.staticGroup();

    const wizardHat = this.interactables.create(700, 430, TextureKeys.HAT_KEY);
    wizardHat.setData('config', {
      type: 'item',
      id: 'wizard-hat',
      itemId: 'wizard-hat',
      name: 'Wizard Hat',
      description: 'A hat imbued with canine wizardry.',
      once: true,
    } satisfies InteractionConfig & InventoryItem);

    const forestSpirit = this.interactables.create(1100, 420, TextureKeys.NPC_KEY);
    forestSpirit.setData('config', {
      type: 'dialogue',
      once: false,
      dialogue: [
        'Forest Spirit: The wind whispers your human is near the glade.',
        'Doggone: Thank you! I will keep searching.',
      ],
    } satisfies InteractionConfig);

    this.physics.add.overlap(this.player, this.interactables, (_player, target) => {
      if (this.interactionCooldown) {
        return;
      }

      const sprite = target as Phaser.Physics.Arcade.Sprite;
      const config = sprite.getData('config') as (InteractionConfig & Partial<InventoryItem>) | undefined;
      if (!config) {
        return;
      }

      if (config.type === 'item') {
        this.collectItem(sprite, config as InteractionConfig & InventoryItem);
      }

      if (config.type === 'dialogue' && config.dialogue) {
        this.startDialogue(config.dialogue);
      }

      if (config.once) {
        sprite.disableBody(true, true);
      }

      this.interactionCooldown = true;
      this.time.delayedCall(500, () => {
        this.interactionCooldown = false;
      });
    });
  }

  private collectItem(target: Phaser.Physics.Arcade.Sprite, itemConfig: InteractionConfig & InventoryItem): void {
    this.inventory = addItemToInventory(this.inventory, {
      id: itemConfig.itemId ?? itemConfig.id,
      name: itemConfig.name,
      description: itemConfig.description,
      equipped: true,
    });
    this.inventoryText.setText(formatInventoryLabel(this.inventory));
    this.objectiveText.setText('Objective: Track the trail to your human');

    this.hatAccessory.setVisible(true);
    target.disableBody(true, true);

    this.showSceneMessage('You don the wizard hat. Arcane senses awaken.');
  }

  private createUI(): void {
    const cameraWidth = this.cameras.main.worldView.width;

    this.objectiveText = this.add.text(24, 24, 'Objective: Find your lost human', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f9f7ff',
      backgroundColor: '#312d52',
      padding: { left: 12, right: 12, top: 6, bottom: 6 },
    });
    this.objectiveText.setScrollFactor(0);

    this.inventoryText = this.add.text(cameraWidth - 24, 24, formatInventoryLabel(this.inventory), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f9f7ff',
      backgroundColor: '#312d52',
      align: 'right',
      padding: { left: 12, right: 12, top: 6, bottom: 6 },
    });
    this.inventoryText.setScrollFactor(0).setOrigin(1, 0);

    this.sceneMessageText = this.add.text(cameraWidth / 2, WORLD_HEIGHT - 100, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f9f7ff',
      backgroundColor: '#1f1b2e',
      padding: { left: 18, right: 18, top: 8, bottom: 8 },
    });
    this.sceneMessageText.setScrollFactor(0).setOrigin(0.5, 0.5).setAlpha(0);

    this.createDialogueUI();
  }

  private createDialogueUI(): void {
    this.dialogueContainer = this.add.container(this.cameras.main.width / 2, WORLD_HEIGHT - 200).setScrollFactor(0);

    const background = this.add.rectangle(0, 0, 520, 140, 0x1f1b2e, 0.92);
    background.setStrokeStyle(2, 0xd4c2fc);

    this.dialogueText = this.add.text(-240, -50, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f9f7ff',
      wordWrap: { width: 480 },
    });

    const continueHint = this.add.text(0, 50, '[Press space or click to continue]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#d4c2fc',
    });
    continueHint.setOrigin(0.5, 0.5);

    this.dialogueContainer.add([background, this.dialogueText, continueHint]);
    this.dialogueContainer.setVisible(false);
    this.dialogueContainer.setSize(520, 140);
    this.dialogueContainer.setInteractive({ useHandCursor: true });

    this.dialogueContainer.on('pointerdown', () => {
      if (this.awaitingDialogueAdvance) {
        this.advanceDialogue();
      }
    });
  }

  private createControls(): void {
    this.controlsPanel = this.add.container(32, WORLD_HEIGHT - 140).setScrollFactor(0);

    this.controlLabel = this.add.text(0, -80, 'Controls: WASD', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f9f7ff',
      backgroundColor: '#312d52',
      padding: { left: 8, right: 8, top: 4, bottom: 4 },
    });

    this.controlsPanel.add(this.controlLabel);

    this.wasdContainer = this.buildControlCluster([
      { label: 'W', direction: 'up', offsetX: 40, offsetY: 0 },
      { label: 'A', direction: 'left', offsetX: 0, offsetY: 42 },
      { label: 'S', direction: 'down', offsetX: 40, offsetY: 42 },
      { label: 'D', direction: 'right', offsetX: 80, offsetY: 42 },
    ], 'wasd');

    this.arrowContainer = this.buildControlCluster([
      { label: '↑', direction: 'up', offsetX: 40, offsetY: 0 },
      { label: '←', direction: 'left', offsetX: 0, offsetY: 42 },
      { label: '↓', direction: 'down', offsetX: 40, offsetY: 42 },
      { label: '→', direction: 'right', offsetX: 80, offsetY: 42 },
    ], 'arrows');

    this.controlsPanel.add([this.wasdContainer, this.arrowContainer]);
    this.setControlVisibility('wasd');
  }

  private buildControlCluster(configs: VirtualButtonConfig[], method: InputMethod): Phaser.GameObjects.Container {
    const cluster = this.add.container(0, 0);

    configs.forEach((config) => {
      const button = this.add.image(config.offsetX, config.offsetY, TextureKeys.BUTTON_KEY);
      button.setInteractive({ useHandCursor: true });

      const label = this.add.text(config.offsetX, config.offsetY, config.label, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#f9f7ff',
      });
      label.setOrigin(0.5, 0.5);

      button.on('pointerdown', () => {
        this.setVirtualInput(config.direction, true);
        this.setControlVisibility(method);
        button.setTexture(TextureKeys.BUTTON_PRESSED_KEY);
      });

      button.on('pointerup', () => {
        this.setVirtualInput(config.direction, false);
        button.setTexture(TextureKeys.BUTTON_KEY);
      });

      button.on('pointerout', () => {
        this.setVirtualInput(config.direction, false);
        button.setTexture(TextureKeys.BUTTON_KEY);
      });

      button.on('pointerupoutside', () => {
        this.setVirtualInput(config.direction, false);
        button.setTexture(TextureKeys.BUTTON_KEY);
      });

      cluster.add(button);
      cluster.add(label);
    });

    return cluster;
  }

  private setControlVisibility(method: InputMethod): void {
    if (method !== 'virtual') {
      this.lastKeyboardMethod = method;
    }
    this.wasdContainer.setVisible(method === 'wasd');
    this.arrowContainer.setVisible(method === 'arrows');
    const label = method === 'wasd' ? 'Controls: WASD' : method === 'arrows' ? 'Controls: Arrow Keys' : 'Controls: On-screen';
    this.controlLabel.setText(label);
  }

  private createInteractableHint(target: Phaser.Physics.Arcade.Sprite): void {
    const hint = this.add.text(target.x, target.y - 40, 'Interact', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f9f7ff',
      backgroundColor: '#312d52',
      padding: { left: 6, right: 6, top: 4, bottom: 4 },
    });
    hint.setOrigin(0.5, 0.5);
    this.time.delayedCall(1500, () => {
      hint.destroy();
    });
  }

  private registerInputHandlers(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is not available in this scene.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

    keyboard.on('keydown', (event: KeyboardEvent) => {
      if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
        this.setControlVisibility('wasd');
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(event.key.toLowerCase())) {
        this.setControlVisibility('arrows');
      }
      if (this.isDialogueActive() && event.key.toLowerCase() === ' ') {
        this.advanceDialogue();
      }
    });

    this.input.on('pointerup', () => {
      (Object.keys(this.virtualInputState) as InputDirection[]).forEach((direction) => {
        this.setVirtualInput(direction, false);
      });
    });

    keyboard.on('keydown-E', () => {
      const closest = this.getClosestInteractable(64);
      if (closest) {
        this.createInteractableHint(closest);
      }
    });
  }

  private getClosestInteractable(radius: number): Phaser.Physics.Arcade.Sprite | null {
    let closest: Phaser.Physics.Arcade.Sprite | null = null;
    let minDistance = Number.POSITIVE_INFINITY;

    for (const child of this.interactables.getChildren()) {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (!sprite.active) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (distance < radius && distance < minDistance) {
        minDistance = distance;
        closest = sprite;
      }
    }

    return closest;
  }

  private updatePlayerMovement(): void {
    const keyboardInput: MovementInput = {
      up: (this.cursors.up?.isDown ?? false) || this.wasd.W.isDown,
      down: (this.cursors.down?.isDown ?? false) || this.wasd.S.isDown,
      left: (this.cursors.left?.isDown ?? false) || this.wasd.A.isDown,
      right: (this.cursors.right?.isDown ?? false) || this.wasd.D.isDown,
    };

    const combinedInput: MovementInput = {
      up: keyboardInput.up || this.virtualInputState.up,
      down: keyboardInput.down || this.virtualInputState.down,
      left: keyboardInput.left || this.virtualInputState.left,
      right: keyboardInput.right || this.virtualInputState.right,
    };

    const movement = resolveMovementVector(combinedInput);
    this.player.setVelocity(movement.x * PLAYER_SPEED, movement.y * PLAYER_SPEED);

    if (movement.x !== 0) {
      this.player.setFlipX(movement.x < 0);
    }
  }

  private updateHatPosition(): void {
    if (!this.hatAccessory.visible) {
      return;
    }

    this.hatAccessory.setPosition(this.player.x, this.player.y - 18);
  }

  private updateSceneTransitionState(): void {
    if (this.player.x <= 8 && !this.transitionMessageArmed) {
      this.transitionMessageArmed = true;
      this.showSceneMessage('Entering the next scene to the west...');
    } else if (this.player.x >= WORLD_WIDTH - 8 && !this.transitionMessageArmed) {
      this.transitionMessageArmed = true;
      this.showSceneMessage('Entering the next scene to the east...');
    } else if (this.player.x > 32 && this.player.x < WORLD_WIDTH - 32) {
      this.transitionMessageArmed = false;
    }
  }

  private showSceneMessage(message: string): void {
    this.sceneMessageText.setText(message);
    this.sceneMessageText.setAlpha(1);

    if (this.sceneMessageTimer) {
      this.sceneMessageTimer.remove();
    }

    this.sceneMessageTimer = this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: this.sceneMessageText,
        alpha: 0,
        duration: 400,
        ease: 'Sine.easeOut',
      });
    });
  }

  private setVirtualInput(direction: InputDirection, pressed: boolean): void {
    this.virtualInputState[direction] = pressed;
    if (pressed) {
      this.controlLabel.setText('Controls: On-screen');
    } else if (!this.virtualInputState.up && !this.virtualInputState.down && !this.virtualInputState.left && !this.virtualInputState.right) {
      this.setControlVisibility(this.lastKeyboardMethod);
    }
  }

  private startDialogue(lines: string[]): void {
    this.activeDialogue = createDialogueState(lines);
    this.dialogueContainer.setVisible(true);
    this.awaitingDialogueAdvance = false;
    this.advanceDialogue();
  }

  private advanceDialogue(): void {
    if (!this.activeDialogue) {
      return;
    }

    this.awaitingDialogueAdvance = false;
    const { line, done, nextState } = getNextDialogueLine(this.activeDialogue);
    this.activeDialogue = nextState;

    if (line) {
      this.dialogueText.setText(line);
      this.awaitingDialogueAdvance = true;
    }

    if (done && !line) {
      this.dialogueContainer.setVisible(false);
      this.activeDialogue = null;
      this.awaitingDialogueAdvance = false;
    } else {
      this.awaitingDialogueAdvance = true;
    }
  }

  private isDialogueActive(): boolean {
    return this.activeDialogue !== null;
  }
}
