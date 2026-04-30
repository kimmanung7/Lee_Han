import Phaser from "@/game/phaser-compat";
import { ChatBubble } from "@/game/objects/ChatBubble";

const CHAR_SCALE = 0.15;
const LABEL_OFFSET_Y = Math.round(280 * CHAR_SCALE / 2) + 4;
const BUBBLE_OFFSET_Y = Math.round(280 * CHAR_SCALE / 2) + 6;

export class OtherPlayer extends Phaser.GameObjects.Container {
  private sprite!: Phaser.GameObjects.Sprite;
  private label!: Phaser.GameObjects.Text;
  private bubble: ChatBubble | null = null;
  private lastDirection = "down";

  constructor(scene: Phaser.Scene, x: number, y: number, _gender: string, _skinColor: string, nickname: string) {
    super(scene, x, y);

    this.sprite = scene.add.sprite(0, 0, "char_front_idle").setScale(CHAR_SCALE);
    this.sprite.play("anim_front_idle");

    this.label = scene.add.text(0, -LABEL_OFFSET_Y, nickname, {
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
    this.bubble.setPosition(this.x, this.y - BUBBLE_OFFSET_Y);
  }

  tickBubble() {
    if (this.bubble?.active) {
      this.bubble.setPosition(this.x, this.y - BUBBLE_OFFSET_Y);
    }
  }

  moveToPosition(x: number, y: number) {
    const dx = x - this.x;
    const dy = y - this.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      this.lastDirection = dx > 0 ? "right" : "left";
      this.sprite.setFlipX(dx < 0);
      if (this.sprite.anims.currentAnim?.key !== "anim_side_walk") this.sprite.play("anim_side_walk");
    } else {
      this.lastDirection = dy > 0 ? "down" : "up";
      this.sprite.setFlipX(false);
      const anim = dy > 0 ? "anim_front_walk" : "anim_back_walk";
      if (this.sprite.anims.currentAnim?.key !== anim) this.sprite.play(anim);
    }

    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration: 100,
      ease: "Linear",
      onComplete: () => {
        const idleAnim =
          this.lastDirection === "up" ? "anim_back_idle" :
          (this.lastDirection === "left" || this.lastDirection === "right") ? "anim_side_idle" :
          "anim_front_idle";
        this.sprite.play(idleAnim);
      },
    });
  }
}
