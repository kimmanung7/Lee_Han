import Phaser from "@/game/phaser-compat";
import { connectSocket, getSocket } from "@/game/utils/socketManager";
import { ChatBubble } from "@/game/objects/ChatBubble";
import { OtherPlayer } from "@/game/objects/OtherPlayer";

const WORLD_W = 1600;
const WORLD_H = 1600;
const SPEED = 180;
const ENTRY_RADIUS = 60;
const CHAR_SCALE = 0.15;

interface PortalInfo {
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  id: string;
}

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
  private lastDirection = "down";
  private collisionLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private portals: PortalInfo[] = [];

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

    this.setupTilemap();

    const startX = WORLD_W / 2;
    const startY = WORLD_H / 2;

    this.player = this.physics.add.sprite(startX, startY, "char_front_idle");
    this.player.setScale(CHAR_SCALE);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.play("anim_front_idle");

    if (this.collisionLayer) {
      this.physics.add.collider(this.player, this.collisionLayer);
    }

    const labelOffsetY = Math.round(280 * CHAR_SCALE / 2) + 4;
    this.playerLabel = this.add
      .text(startX, startY - labelOffsetY, this.userConfig.nickname, {
        fontSize: "9px",
        color: "#ffffff",
        fontFamily: "monospace",
        backgroundColor: "#00000099",
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(11);

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

    const { userId, nickname, gender, skinColor } = this.userConfig;
    if (userId) connectSocket(userId, nickname, gender, skinColor, startX, startY);
    this.setupSocketListeners();

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

  // ── Tilemap ───────────────────────────────────────────────────────────

  private setupTilemap() {
    const map = this.make.tilemap({ key: "worldmap" });

    // Set images on all tilesets, including duplicates (same name, different firstgid)
    const seenNames = new Set<string>();
    (map.tilesets as any[]).forEach((ts) => {
      const name: string = ts.name;
      if (!seenNames.has(name)) {
        map.addTilesetImage(name, name);
        seenNames.add(name);
      } else if (this.textures.exists(name)) {
        ts.setImage(this.textures.get(name));
      }
    });

    const allTilesets = map.tilesets;

    // BG layers (depth 1–7, beneath player)
    const bgLayers = ["BG/길", "BG/문뒤", "BG/장식", "BG/타일", "BG/풀", "BG/건물"];
    bgLayers.forEach((name, i) => {
      const layer = map.createLayer(name, allTilesets, 0, 0) as Phaser.Tilemaps.TilemapLayer | null;
      if (layer) layer.setDepth(i + 1);
    });

    // Invisible collision layer
    const colLayer = map.createLayer("BG/충돌레이어", allTilesets, 0, 0) as Phaser.Tilemaps.TilemapLayer | null;
    if (colLayer) {
      colLayer.setDepth(0).setVisible(false);
      colLayer.setCollisionByExclusion([-1, 0]);
      this.collisionLayer = colLayer;
    }

    // FG layers (depth 20–25, above player at depth 10)
    const fgLayers = ["FG/건물상단", "FG/지붕", "FG/2층건물", "FG/2층지붕", "FG/장식", "FG/그림자"];
    fgLayers.forEach((name, i) => {
      const layer = map.createLayer(name, allTilesets, 0, 0) as Phaser.Tilemaps.TilemapLayer | null;
      if (layer) layer.setDepth(20 + i);
    });

    // Extract portal zones from objectgroup
    const portalLayer = map.getObjectLayer("포탈");
    if (portalLayer) {
      portalLayer.objects.forEach((obj) => {
        const w = obj.width ?? 0;
        const h = obj.height ?? 0;
        const x = obj.x ?? 0;
        const y = obj.y ?? 0;
        if (w > 0 && h > 0) {
          this.portals.push({
            x: x + w / 2,
            y: y + h / 2,
            w,
            h,
            name: obj.name || "입장",
            id: `portal_${obj.id}`,
          });
        }
      });
    }
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
      this.otherPlayers.get(userId)?.moveToPosition(x, y);
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
    this.chatHandler = (e: Event) => {
      const { content } = (e as CustomEvent<{ content: string }>).detail;
      if (!content?.trim()) return;

      this.playerBubble?.destroy();
      this.playerBubble = new ChatBubble(this, content.trim());
      this.playerBubble.setPosition(this.player.x, this.player.y - Math.round(280 * CHAR_SCALE / 2) - 6);

      getSocket().emit("world:chat:send", { content: content.trim() });
    };

    window.addEventListener("devplaza:chat:send", this.chatHandler);

    getSocket().on("world:chat:message", ({ userId, content }: { userId: string; nickname: string; content: string }) => {
      this.otherPlayers.get(userId)?.showBubble(content);
    });
  }

  // ── Update ────────────────────────────────────────────────────────────

  update() {
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

    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      if (Math.abs(vx) >= Math.abs(vy)) {
        this.lastDirection = vx > 0 ? "right" : "left";
        this.player.setFlipX(vx < 0);
        if (this.player.anims.currentAnim?.key !== "anim_side_walk") this.player.play("anim_side_walk");
      } else {
        this.lastDirection = vy > 0 ? "down" : "up";
        this.player.setFlipX(false);
        const anim = vy > 0 ? "anim_front_walk" : "anim_back_walk";
        if (this.player.anims.currentAnim?.key !== anim) this.player.play(anim);
      }
    } else {
      const idleAnim =
        this.lastDirection === "up" ? "anim_back_idle" :
        (this.lastDirection === "left" || this.lastDirection === "right") ? "anim_side_idle" :
        "anim_front_idle";
      if (this.player.anims.currentAnim?.key !== idleAnim) this.player.play(idleAnim);
    }

    const dx = Math.abs(this.player.x - this.lastEmitX);
    const dy = Math.abs(this.player.y - this.lastEmitY);
    if (dx > 4 || dy > 4) {
      getSocket().emit("player:move", { x: this.player.x, y: this.player.y, direction: this.lastDirection });
      this.lastEmitX = this.player.x;
      this.lastEmitY = this.player.y;
    }

    this.otherPlayers.forEach((op) => op.tickBubble());

    const labelOffsetY = Math.round(280 * CHAR_SCALE / 2) + 4;
    this.playerLabel.setPosition(this.player.x, this.player.y - labelOffsetY);
    if (this.playerBubble?.active) {
      this.playerBubble.setPosition(this.player.x, this.player.y - Math.round(280 * CHAR_SCALE / 2) - 6);
    }

    // ── Portal proximity ────────────────────────────────────────────────
    const { width, height } = this.cameras.main;

    const nearestPortal = this.portals.find((p) => {
      const dx = Math.abs(this.player.x - p.x);
      const dy = Math.abs(this.player.y - p.y);
      return dx < p.w / 2 + ENTRY_RADIUS && dy < p.h / 2 + ENTRY_RADIUS;
    });

    if (nearestPortal && !isTyping) {
      this.entryPrompt
        .setText(`E: ${nearestPortal.name} 입장`)
        .setPosition(width / 2, height - 20)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        const { userId, nickname, gender, skinColor } = this.userConfig;
        this.scene.start("BuildingScene", {
          buildingId: nearestPortal.id,
          buildingName: nearestPortal.name,
          userId, nickname, gender, skinColor,
        });
      }
    } else {
      this.entryPrompt.setVisible(false);
    }
  }
}
