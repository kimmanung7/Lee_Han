import Phaser from "@/game/phaser-compat";
import { BUILDINGS } from "@/game/data/buildings";
import { connectSocket, getSocket } from "@/game/utils/socketManager";
import { ChatBubble } from "@/game/objects/ChatBubble";
import { OtherPlayer } from "@/game/objects/OtherPlayer";

const WORLD_W = 3200;
const WORLD_H = 2400;
const SPEED = 180;
const ENTRY_RADIUS = 70;

const SKIN_COLORS: Record<string, number> = {
  light: 0xfddbb4,
  tan: 0xe8a87c,
  medium: 0xc68642,
  dark: 0x8d5524,
};

interface UserConfig {
  userId: string;
  nickname: string;
  gender: string;
  skinColor: string;
}

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerLabel!: Phaser.GameObjects.Text;
  private playerBubble: ChatBubble | null = null;
  private entryPrompt!: Phaser.GameObjects.Text;
  private otherPlayers = new Map<string, OtherPlayer>();
  private lastEmitX = 0;
  private lastEmitY = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private keyE!: Phaser.Input.Keyboard.Key;

  private chatHandler!: (e: Event) => void;

  private userConfig: UserConfig = {
    userId: "",
    nickname: "Guest",
    gender: "MALE",
    skinColor: "light",
  };

  constructor() {
    super({ key: "WorldScene" });
  }

  init(data: Partial<UserConfig>) {
    const stored = this.registry.get("user") as UserConfig | undefined;
    this.userConfig = { ...(stored ?? this.userConfig), ...(data ?? {}) };
  }

  create() {
    window.dispatchEvent(new CustomEvent("devplaza:scene", { detail: "world" }));

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    this.drawMap();
    this.buildPlayerTexture();

    const startX = WORLD_W / 2;
    const startY = WORLD_H / 2;

    this.player = this.physics.add.sprite(startX, startY, "player_sprite");
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.playerLabel = this.add
      .text(startX, startY - 20, this.userConfig.nickname, {
        fontSize: "9px",
        color: "#ffffff",
        fontFamily: "monospace",
        backgroundColor: "#00000099",
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(11);

    // Entry prompt — fixed to camera (scrollFactor 0 = screen-space)
    this.entryPrompt = this.add
      .text(0, 0, "", {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: "monospace",
        backgroundColor: "#1a2a4a",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5, 1)
      .setDepth(50)
      .setScrollFactor(0)
      .setVisible(false);

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.5);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.setupChat();

    // Connect socket
    const { userId, nickname, gender, skinColor } = this.userConfig;
    if (userId) connectSocket(userId, nickname, gender, skinColor, startX, startY);
    this.setupSocketListeners();

    // Cleanup on scene stop
    this.events.once("shutdown", () => {
      window.removeEventListener("devplaza:chat:send", this.chatHandler);
      const s = getSocket();
      s.off("world:players");
      s.off("player:joined");
      s.off("player:moved");
      s.off("player:leave");
      s.off("world:chat:message");
    });
  }

  // ── Socket listeners ─────────────────────────────────────────────────

  private setupSocketListeners() {
    const s = getSocket();

    s.on("world:players", (players: { userId: string; nickname: string; gender: string; skinColor: string; x: number; y: number }[]) => {
      players.forEach((p) => this.spawnOtherPlayer(p));
    });

    s.on("player:joined", (p: { userId: string; nickname: string; gender: string; skinColor: string; x: number; y: number }) => {
      this.spawnOtherPlayer(p);
    });

    s.on("player:moved", ({ userId, x, y }: { userId: string; x: number; y: number; direction: string }) => {
      this.otherPlayers.get(userId)?.moveTo(x, y);
    });

    s.on("player:leave", ({ userId }: { userId: string }) => {
      const op = this.otherPlayers.get(userId);
      if (op) { op.destroy(); this.otherPlayers.delete(userId); }
    });
  }

  private spawnOtherPlayer(p: { userId: string; nickname: string; gender: string; skinColor: string; x?: number; y?: number }) {
    if (this.otherPlayers.has(p.userId)) return;
    const op = new OtherPlayer(this, p.x ?? WORLD_W / 2, p.y ?? WORLD_H / 2, p.gender, p.skinColor, p.nickname);
    this.otherPlayers.set(p.userId, op);
  }

  // ── Chat ─────────────────────────────────────────────────────────────

  private setupChat() {
    // React input → show local bubble + emit to server
    this.chatHandler = (e: Event) => {
      const { content } = (e as CustomEvent<{ content: string }>).detail;
      if (!content?.trim()) return;

      this.playerBubble?.destroy();
      this.playerBubble = new ChatBubble(this, content.trim());
      this.playerBubble.setPosition(this.player.x, this.player.y - 12);

      getSocket().emit("world:chat:send", { content: content.trim() });
    };

    window.addEventListener("devplaza:chat:send", this.chatHandler);

    // Receive world chat from other players (shown when world players are added)
    getSocket().on("world:chat:message", () => {
      // Future: find remote player sprite and show bubble
    });
  }

  // ── Player texture ────────────────────────────────────────────────────

  private buildPlayerTexture() {
    if (this.textures.exists("player_sprite")) return;
    const { gender, skinColor } = this.userConfig;
    const skinHex = SKIN_COLORS[skinColor] ?? SKIN_COLORS.light;
    const shirtHex = gender === "FEMALE" ? 0xe87da8 : 0x4a90d9;

    const g = this.make.graphics();
    g.fillStyle(skinHex, 1);  g.fillRect(3, 0, 10, 8);
    g.fillStyle(shirtHex, 1); g.fillRect(2, 8, 12, 10);
    g.fillStyle(0x2c3e50, 1); g.fillRect(3, 18, 4, 6); g.fillRect(9, 18, 4, 6);
    g.generateTexture("player_sprite", 16, 24);
    g.destroy();
  }

  // ── Map ───────────────────────────────────────────────────────────────

  private drawMap() {
    this.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 0x0d0d1a);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a1a3a, 0.9);
    for (let x = 0; x <= WORLD_W; x += 256) { grid.moveTo(x, 0); grid.lineTo(x, WORLD_H); }
    for (let y = 0; y <= WORLD_H; y += 256) { grid.moveTo(0, y); grid.lineTo(WORLD_W, y); }
    grid.strokePath();

    const neon = this.add.graphics();
    neon.lineStyle(1, 0x003388, 0.07);
    for (let x = 0; x <= WORLD_W; x += 64) { neon.moveTo(x, 0); neon.lineTo(x, WORLD_H); }
    for (let y = 0; y <= WORLD_H; y += 64) { neon.moveTo(0, y); neon.lineTo(WORLD_W, y); }
    neon.strokePath();

    BUILDINGS.forEach(({ x, y, w, h, color, name }) => {
      this.add.rectangle(x + 4, y + 4, w, h, 0x000000, 0.5);
      this.add.rectangle(x, y, w, h, color).setStrokeStyle(1, 0x334466, 1);
      this.add.rectangle(x, y, w + 2, h + 2, 0x000000, 0).setStrokeStyle(1.5, 0x3366bb, 0.35);
      this.add.text(x, y + h / 2 + 10, name, {
        fontSize: "8px", color: "#4477aa", fontFamily: "monospace",
      }).setOrigin(0.5, 0);
    });

    this.add.circle(WORLD_W / 2, WORLD_H / 2, 90, 0x110011, 0.85).setStrokeStyle(2, 0x6644aa, 0.9);
    this.add.text(WORLD_W / 2, WORLD_H / 2, "DEVPLAZA\n광장", {
      fontSize: "11px", color: "#8866cc", fontFamily: "monospace", align: "center",
    }).setOrigin(0.5, 0.5);
  }

  // ── Update ────────────────────────────────────────────────────────────

  update() {
    // Block WASD/arrows while typing
    const isTyping = document.activeElement?.tagName === "INPUT";
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    let vx = 0, vy = 0;
    if (isTyping) {
      body.setVelocity(0, 0);
    } else {
      if (this.wasd.left.isDown  || this.cursors.left.isDown)  vx = -SPEED;
      else if (this.wasd.right.isDown || this.cursors.right.isDown) vx = SPEED;
      if (this.wasd.up.isDown    || this.cursors.up.isDown)    vy = -SPEED;
      else if (this.wasd.down.isDown  || this.cursors.down.isDown)  vy = SPEED;
      if (vx !== 0 && vy !== 0) { const d = 1 / Math.SQRT2; vx *= d; vy *= d; }
      body.setVelocity(vx, vy);
    }

    // Emit position if moved
    const dx = Math.abs(this.player.x - this.lastEmitX);
    const dy = Math.abs(this.player.y - this.lastEmitY);
    if (dx > 4 || dy > 4) {
      const direction = vx < 0 ? "left" : vx > 0 ? "right" : vy < 0 ? "up" : "down";
      getSocket().emit("player:move", { x: this.player.x, y: this.player.y, direction });
      this.lastEmitX = this.player.x;
      this.lastEmitY = this.player.y;
    }

    // Labels & bubble follow player
    this.playerLabel.setPosition(this.player.x, this.player.y - 16);
    if (this.playerBubble?.active) {
      this.playerBubble.setPosition(this.player.x, this.player.y - 12);
    }

    // ── Building proximity ──────────────────────────────────────────
    const { width, height } = this.cameras.main;

    const nearest = BUILDINGS.find((b) => {
      const dx = Math.abs(this.player.x - b.x);
      const dy = Math.abs(this.player.y - b.y);
      return dx < b.w / 2 + ENTRY_RADIUS && dy < b.h / 2 + ENTRY_RADIUS;
    });

    if (nearest && !isTyping) {
      this.entryPrompt
        .setText(`E: ${nearest.name} 입장`)
        .setPosition(width / 2, height - 20)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        const { userId, nickname, gender, skinColor } = this.userConfig;
        this.scene.start("BuildingScene", {
          buildingId: nearest.id,
          buildingName: nearest.name,
          userId, nickname, gender, skinColor,
        });
      }
    } else {
      this.entryPrompt.setVisible(false);
    }
  }
}
