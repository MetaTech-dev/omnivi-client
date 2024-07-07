import { GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";

export class MainMenu extends Scene {
  background!: GameObjects.Image;
  logo!: GameObjects.Image;
  title!: GameObjects.Text;
  logoTween!: Phaser.Tweens.Tween | null;

  constructor() {
    super("MainMenu");
  }

  create() {
    this.title = this.add
      .text(512, 399, "omnivi", {
        fontFamily: "Arial Black",
        fontSize: 38,
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    EventBus.emit("current-scene-ready", this);
  }

  changeScene() {
    this.scene.start("Main");
  }
}
