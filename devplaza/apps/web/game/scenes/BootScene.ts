import Phaser from "@/game/phaser-compat";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  create() {
    const user = this.registry.get("user");
    this.scene.start("WorldScene", user);
  }
}
