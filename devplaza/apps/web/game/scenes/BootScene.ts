import Phaser from "@/game/phaser-compat";

const BASE = "/assets/sprites/wonhyukc/";
const FRAMES = [
  "front_idle", "front_walk1", "front_walk2",
  "back_idle",  "back_walk1",  "back_walk2",
  "side_idle",  "side_walk1",  "side_walk2",
];

const TILESETS = [
  "gather_islands_1.0",
  "gather_floors_2_exploration",
  "floors_3_simple_S-20C-5",
  "gather_avatars_1.0",
  "gather_chairs_1.3",
  "gather_decoration_1.21",
  "gather_decoration_exterior_1.3",
  "gather_doors_template",
  "gather_exterior_roofs_2.1",
  "gather_exterior_walls_2.1",
  "gather_facade_elements_1.2",
  "gather_floors_1.5",
  "gather_interior_walls_1.6",
  "gather_plants_1.2",
  "gather_signage_1.2",
  "gather_tables_2.1",
  "gather_terrains_3.a",
  "gather_walls_interior_template",
  "TileAndStone",
  "toppers",
  "trimsanddoors",
  "Wall_unstable",
  "walltexture",
  "WindowsObjects",
  "그림자",
  "바닥",
  "섬",
  "외벽 장식",
  "외벽",
  "지붕",
  "터레인",
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Loading progress text
    const { width, height } = this.scale;
    const loadingText = this.add.text(width / 2, height / 2, "Loading...", {
      fontSize: "16px", color: "#ffffff", fontFamily: "monospace",
    }).setOrigin(0.5);
    this.load.on("progress", (v: number) => {
      loadingText.setText(`Loading... ${Math.round(v * 100)}%`);
    });

    FRAMES.forEach((name) => {
      this.load.image(`char_${name}`, `${BASE}${name}.png`);
    });

    this.load.tilemapTiledJSON("worldmap", "/assets/maps/testmap.json");

    TILESETS.forEach((name) => {
      this.load.image(name, `/assets/tilesets/${encodeURIComponent(name)}.png`);
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
