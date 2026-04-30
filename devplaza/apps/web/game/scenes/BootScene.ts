import Phaser from "@/game/phaser-compat";

const BASE = "/assets/sprites/wonhyukc/";
const FRAMES = [
  "front_idle", "front_walk1", "front_walk2",
  "back_idle",  "back_walk1",  "back_walk2",
  "side_idle",  "side_walk1",  "side_walk2",
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    FRAMES.forEach((name) => {
      this.load.image(`char_${name}`, `${BASE}${name}.png`);
    });
  }

  create() {
    this.anims.create({
      key: "anim_front_idle",
      frames: [{ key: "char_front_idle" }],
      frameRate: 1,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_front_walk",
      frames: [
        { key: "char_front_walk1" },
        { key: "char_front_idle" },
        { key: "char_front_walk2" },
        { key: "char_front_idle" },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_back_idle",
      frames: [{ key: "char_back_idle" }],
      frameRate: 1,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_back_walk",
      frames: [
        { key: "char_back_walk1" },
        { key: "char_back_idle" },
        { key: "char_back_walk2" },
        { key: "char_back_idle" },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_side_idle",
      frames: [{ key: "char_side_idle" }],
      frameRate: 1,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_side_walk",
      frames: [
        { key: "char_side_walk1" },
        { key: "char_side_idle" },
        { key: "char_side_walk2" },
        { key: "char_side_idle" },
      ],
      frameRate: 8,
      repeat: -1,
    });

    const user = this.registry.get("user");
    this.scene.start("WorldScene", user);
  }
}
