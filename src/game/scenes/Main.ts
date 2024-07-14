import Phaser from "phaser";
import { EventBus } from "../EventBus";

class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  graphics: Phaser.GameObjects.Graphics;
  rotation: number;
  thrust: number;
  scene: Phaser.Scene;
  radius: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, ""); // Use an empty string as there is no asset for the sprite
    this.sprite.setCircle(20); // Set the circle shape for the sprite
    this.sprite.setCollideWorldBounds(true);
    this.graphics = scene.add.graphics(); // Add a graphics object for custom drawing
    this.rotation = 0; // Initial rotation angle in radians
    this.thrust = 10;
    this.radius = 40;
  }

  updateVelocity(angle: number, thrust: number) {
    this.sprite.setVelocity(
      this.sprite.body!.velocity.x + Math.cos(angle) * thrust,
      this.sprite.body!.velocity.y + Math.sin(angle) * thrust
    );
  }

  draw() {
    const { x, y } = this.sprite;

    this.graphics.clear(); // Clear previous drawings

    // Draw the green circle
    this.graphics.fillStyle(0x00ff00, 0);
    this.graphics.beginPath();
    this.graphics.arc(x, y, this.radius, 0, Math.PI * 2, false);
    this.graphics.fillPath();

    // Draw the direction line
    const lineLength = 30;
    this.graphics.lineStyle(2, 0x0000ff, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(x, y);
    this.graphics.lineTo(
      x + Math.cos(this.rotation) * lineLength,
      y + Math.sin(this.rotation) * lineLength
    );
    this.graphics.strokePath();

    // Draw the velocity line
    this.graphics.lineStyle(2, 0xff0000, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(x, y);
    this.graphics.lineTo(
      x + this.sprite.body!.velocity.x * 0.1,
      y + this.sprite.body!.velocity.y * 0.1
    );
    this.graphics.strokePath();
  }
}

export class Main extends Phaser.Scene {
  player!: Player;
  gridGraphics!: Phaser.GameObjects.Graphics;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  camera!: Phaser.Cameras.Scene2D.Camera;
  pointer!: Phaser.Input.Pointer;
  isMouseDown: boolean;
  useMouse: boolean;
  useKeyboard: boolean;
  useGamepad: boolean;
  gamepad!: Phaser.Input.Gamepad.Gamepad | null;
  asteroids!: Phaser.Physics.Arcade.Group;

  constructor() {
    super("Main");
    this.isMouseDown = false;
    this.useMouse = true;
    this.useKeyboard = false;
    this.useGamepad = false;
    this.gamepad = null;
  }

  preload() {
    // No assets to load
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBounds(0, 0, 5000, 5000);
    this.physics.world.setBounds(0, 0, 5000, 5000);

    // Draw the grid
    this.gridGraphics = this.add.graphics();
    this.drawGrid();

    // Create the player
    this.player = new Player(this, 2500, 2500);

    // Enable camera follow
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    this.asteroids = this.physics.add.group({
      key: "asteroid",
      repeat: 100,
      setXY: { x: 2500, y: 2500, stepX: 50, stepY: 50 },
    });

    this.asteroids.children.iterate(
      (asteroid: Phaser.GameObjects.GameObject) => {
        const sprite = asteroid as Phaser.Physics.Arcade.Sprite;

        sprite.setCircle(20);
        sprite.setVelocity(Math.random() * 100 - 50, Math.random() * 100 - 50);
        sprite.setBounce(1, 1);
        sprite.setCollideWorldBounds(true);
        return true;
      }
    );

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
      if (!this.useMouse) {
        this.useMouse = true;
        this.useKeyboard = false;
        this.useGamepad = false;
      }
    });

    this.input.on("pointerdown", () => {
      this.isMouseDown = true;
      if (!this.useMouse) {
        this.useMouse = true;
        this.useKeyboard = false;
        this.useGamepad = false;
      }
    });

    this.input.on("pointerup", () => {
      this.isMouseDown = false;
    });

    this.input.gamepad?.once(
      Phaser.Input.Gamepad.Events.CONNECTED,
      (pad: Phaser.Input.Gamepad.Gamepad) => {
        this.gamepad = pad;
        this.useGamepad = true;
        this.useMouse = false;
        this.useKeyboard = false;
        console.log("Gamepad connected:", pad);
      }
    );

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
      this.useGamepad = false;
    }

    // Update player rotation and thrust with keyboard if enabled
    if (this.useKeyboard) {
      if (this.cursors.left?.isDown || this.wasd.left.isDown) {
        this.player.rotation -= 0.05; // Rotate counterclockwise
      } else if (this.cursors.right?.isDown || this.wasd.right.isDown) {
        this.player.rotation += 0.05; // Rotate clockwise
      }

      if (this.cursors.up?.isDown || this.wasd.up.isDown) {
        this.player.updateVelocity(this.player.rotation, this.player.thrust);
      }

      if (this.cursors.down?.isDown || this.wasd.down.isDown) {
        this.player.updateVelocity(
          this.player.rotation + Math.PI,
          this.player.thrust
        );
      }
    }

    // Apply force and update rotation based on gamepad left stick direction if enabled
    if (this.useGamepad && this.gamepad) {
      const leftStickX = this.gamepad.leftStick?.x || 0;
      const leftStickY = this.gamepad.leftStick?.y || 0;

      if (leftStickX !== 0 || leftStickY !== 0) {
        const angle = Math.atan2(leftStickY, leftStickX);
        this.player.rotation = angle;
        this.player.updateVelocity(angle, this.player.thrust);
      }
    }

    // Update player rotation with mouse if enabled
    if (this.useMouse) {
      const angleToPointer = Phaser.Math.Angle.Between(
        this.player.sprite.x,
        this.player.sprite.y,
        this.pointer.worldX,
        this.pointer.worldY
      );
      this.player.rotation = angleToPointer;

      // Apply thrust with mouse click
      if (this.isMouseDown) {
        this.player.updateVelocity(this.player.rotation, this.player.thrust);
      }
    }

    this.player.draw();
  }

  drawGrid() {
    const gridSize = 100;
    this.gridGraphics.lineStyle(1, 0x888888, 1);

    for (let x = 0; x < 5000; x += gridSize) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, 5000);
    }

    for (let y = 0; y < 5000; y += gridSize) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(5000, y);
    }

    this.gridGraphics.strokePath();
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}
