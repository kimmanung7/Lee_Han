import Phaser from "@/game/phaser-compat";

const PAD = 8;
const MAX_TEXT_W = 160;
const TAIL_H = 8;
const LIFETIME_MS = 3500;

export class ChatBubble {
  private container: Phaser.GameObjects.Container;
  private timer: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, message: string, lifetime = LIFETIME_MS) {
    const textObj = scene.add.text(0, 0, message, {
      fontSize: "11px",
      color: "#1a1a2e",
      fontFamily: "monospace",
      wordWrap: { width: MAX_TEXT_W, useAdvancedWrap: true },
      maxLines: 4,
    });

    const w = Math.min(textObj.width + PAD * 2, MAX_TEXT_W + PAD * 2);
    const h = textObj.height + PAD * 2;

    // Bubble sits above the container origin.
    // Origin is placed at player.y - 12 (sprite top).
    // Top of bubble: -(TAIL_H + h + 4)
    const bubbleBottom = -(TAIL_H + 4);
    const bubbleTop = bubbleBottom - h;

    const bg = scene.add.graphics();

    // White rounded rectangle
    bg.fillStyle(0xffffff, 0.96);
    bg.fillRoundedRect(-w / 2, bubbleTop, w, h, 5);

    // Subtle border
    bg.lineStyle(1, 0x2244aa, 0.7);
    bg.strokeRoundedRect(-w / 2, bubbleTop, w, h, 5);

    // Triangle tail pointing downward toward the player
    bg.fillStyle(0xffffff, 0.96);
    bg.fillTriangle(-6, bubbleBottom, 6, bubbleBottom, 0, bubbleBottom + TAIL_H);

    // Reposition text inside bubble
    textObj.setPosition(-w / 2 + PAD, bubbleTop + PAD);

    this.container = scene.add.container(0, 0, [bg, textObj]).setDepth(30);

    this.timer = scene.time.addEvent({
      delay: lifetime,
      callback: () => this.destroy(),
    });
  }

  /** Update container world position. Call every frame from update(). */
  setPosition(x: number, y: number): void {
    this.container?.setPosition(x, y);
  }

  destroy(): void {
    this.timer?.remove(false);
    if (this.container?.active) this.container.destroy(true);
  }

  get active(): boolean {
    return this.container?.active ?? false;
  }
}
