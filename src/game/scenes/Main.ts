import Phaser from "phaser";
import { EventBus } from "../EventBus";

export class Main extends Phaser.Scene {
  player!: Phaser.GameObjects.Graphics;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  camera!: Phaser.Cameras.Scene2D.Camera;
  background!: Phaser.GameObjects.Graphics;
  playerX: number;
  playerY: number;
  playerVelocityX: number;
  playerVelocityY: number;
  playerRotation: number;
  thrust: number;
  pointer!: Phaser.Input.Pointer;
  isMouseDown: boolean;
  useMouse: boolean;
  useKeyboard: boolean;

  constructor() {
    super("Main");
    this.playerX = 400;
    this.playerY = 300;
    this.playerVelocityX = 0;
    this.playerVelocityY = 0;
    this.playerRotation = 0; // Initial rotation angle in radians
    this.thrust = 0.1;
    this.isMouseDown = false;
    this.useMouse = true;
    this.useKeyboard = false;
  }

  preload() {
    // No assets to load
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x000000);

    // Draw the player as a circle
    this.player = this.add.graphics();
    this.drawPlayer(this.playerX, this.playerY);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.pointer = this.input.activePointer;

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.pointer = pointer;
      this.useKeyboard = false;
      this.useMouse = true;
    });

    this.input.on("pointerdown", () => {
      this.isMouseDown = true;
      this.useKeyboard = false;
      this.useMouse = true;
    });

    this.input.on("pointerup", () => {
      this.isMouseDown = false;
    });

    EventBus.emit("current-scene-ready", this);
  }

  update() {
    // Check if any keyboard key is pressed
    if (
      this.cursors.left?.isDown ||
      this.cursors.right?.isDown ||
      this.cursors.up?.isDown ||
      this.cursors.down?.isDown ||
      this.wasd.left.isDown ||
      this.wasd.right.isDown ||
      this.wasd.up.isDown ||
      this.wasd.down.isDown
    ) {
      this.useKeyboard = true;
      this.useMouse = false;
    }

    // Update player rotation with keyboard if enabled
    if (this.useKeyboard) {
      if (this.cursors.left?.isDown || this.wasd.left.isDown) {
        this.playerRotation -= 0.05; // Rotate counterclockwise
      } else if (this.cursors.right?.isDown || this.wasd.right.isDown) {
        this.playerRotation += 0.05; // Rotate clockwise
      }

      // Apply thrust with keyboard
      if (this.cursors.up?.isDown || this.wasd.up.isDown) {
        this.playerVelocityX += Math.cos(this.playerRotation) * this.thrust;
        this.playerVelocityY += Math.sin(this.playerRotation) * this.thrust;
      }

      // Apply reverse thrust with keyboard
      if (this.cursors.down?.isDown || this.wasd.down.isDown) {
        this.playerVelocityX -= Math.cos(this.playerRotation) * this.thrust;
        this.playerVelocityY -= Math.sin(this.playerRotation) * this.thrust;
      }
    }

    // Update player rotation with mouse if enabled
    if (this.useMouse) {
      const angleToPointer = Phaser.Math.Angle.Between(
        this.playerX,
        this.playerY,
        this.pointer.worldX,
        this.pointer.worldY
      );
      this.playerRotation = angleToPointer;

      // Apply thrust with mouse click
      if (this.isMouseDown) {
        this.playerVelocityX += Math.cos(this.playerRotation) * this.thrust;
        this.playerVelocityY += Math.sin(this.playerRotation) * this.thrust;
      }
    }

    // Update player position
    this.playerX += this.playerVelocityX;
    this.playerY += this.playerVelocityY;

    // Wrap around screen edges
    if (this.playerX < 0) this.playerX = this.scale.width;
    if (this.playerX > this.scale.width) this.playerX = 0;
    if (this.playerY < 0) this.playerY = this.scale.height;
    if (this.playerY > this.scale.height) this.playerY = 0;

    this.player.clear();
    this.drawPlayer(this.playerX, this.playerY);
  }

  drawPlayer(x: number, y: number) {
    const radius = 20;

    // Draw the player as a circle
    this.player.fillStyle(0xffffff, 1);
    this.player.beginPath();
    this.player.arc(x, y, radius, 0, Math.PI * 2, false);
    this.player.fillPath();

    // Draw the direction line
    const lineLength = 30;
    this.player.lineStyle(2, 0x0000ff, 1);
    this.player.beginPath();
    this.player.moveTo(x, y);
    this.player.lineTo(
      x + Math.cos(this.playerRotation) * lineLength,
      y + Math.sin(this.playerRotation) * lineLength
    );
    this.player.strokePath();

    // Draw the velocity line
    this.player.lineStyle(2, 0xff0000, 1);
    this.player.beginPath();
    this.player.moveTo(x, y);
    this.player.lineTo(
      x + this.playerVelocityX * 10,
      y + this.playerVelocityY * 10
    );
    this.player.strokePath();
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}
