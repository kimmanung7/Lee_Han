import Phaser from "@/game/phaser-compat";
import { ChatBubble } from "@/game/objects/ChatBubble";

const SKIN_COLORS: Record<string, number> = {
  light: 0xfddbb4,
  tan:   0xe8a87c,
  medium: 0xc68642,
  dark:  0x8d5524,
};

export class OtherPlayer extends Phaser.GameObjects.Container {
  private sprite!: Phaser.GameObjects.Image;
  private label!: Phaser.GameObjects.Text;
  private bubble: ChatBubble | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    gender: string,
    skinColor: string,
    nickname: string,
  ) {
    super(scene, x, y);

    const textureKey = `other_${gender}_${skinColor}`;
    if (!scene.textures.exists(textureKey)) {
      const skinHex = SKIN_COLORS[skinColor] ?? SKIN_COLORS.light;
      const shirtHex = gender === "FEMALE" ? 0xe87da8 : 0x4a90d9;
      const g = scene.make.graphics();
      g.fillStyle(skinHex, 1);  g.fillRect(3, 0, 10, 8);
      g.fillStyle(shirtHex, 1); g.fillRect(2, 8, 12, 10);
      g.fillStyle(0x2c3e50, 1); g.fillRect(3, 18, 4, 6); g.fillRect(9, 18, 4, 6);
      g.generateTexture(textureKey, 16, 24);
      g.destroy();
    }

    this.sprite = scene.add.image(0, 0, textureKey);
    this.label = scene.add.text(0, -16, nickname, {
      fontSize: "9px",
      color: "#ccccff",
      fontFamily: "monospace",
      backgroundColor: "#00000099",
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 1);

    this.add([this.sprite, this.label]);
    scene.add.existing(this);
    this.setDepth(9);
  }

  showBubble(message: string) {
    this.bubble?.destroy();
    this.bubble = new ChatBubble(this.scene, message);
    this.bubble.setPosition(this.x, this.y - 12);
  }

  tickBubble() {
    if (this.bubble?.active) {
      this.bubble.setPosition(this.x, this.y - 12);
    }
  }

  moveToPosition(x: number, y: number) {
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration: 100,
      ease: "Linear",
    });
  }
}
