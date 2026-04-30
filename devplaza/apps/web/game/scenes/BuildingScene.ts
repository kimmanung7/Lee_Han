import Phaser from "@/game/phaser-compat";
import { ChatBubble } from "@/game/objects/ChatBubble";
import { getSocket, connectSocket } from "@/game/utils/socketManager";

const ROOM_W = 960;
const ROOM_H = 640;
const SPEED = 140;
const CHAR_SCALE = 0.15;
const LABEL_OFFSET_Y = Math.round(280 * CHAR_SCALE / 2) + 4;

interface SceneData {
  buildingId: string;
  buildingName: string;
  userId: string;
  nickname: string;
  gender: string;
  skinColor: string;
}

interface RemotePlayer {
  userId: string;
  nickname: string;
  gender: string;
  skinColor: string;
  sprite: Phaser.Physics.Arcade.Sprite;
  label: Phaser.GameObjects.Text;
  bubble: ChatBubble | null;
  // Spawn position (random on join, stays fixed since we don't sync positions)
  x: number;
  y: number;
}

export class BuildingScene extends Phaser.Scene {
  // ── Scene data ──────────────────────────────────────────────────────
  private sceneData!: SceneData;

  // ── Local player ────────────────────────────────────────────────────
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerLabel!: Phaser.GameObjects.Text;
  private playerBubble: ChatBubble | null = null;

  // ── Remote players ──────────────────────────────────────────────────
  private remotePlayers = new Map<string, RemotePlayer>();

  // ── Input ────────────────────────────────────────────────────────────
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private keyEsc!: Phaser.Input.Keyboard.Key;

  // ── Chat event listener ref (for cleanup) ────────────────────────────
  private chatSendHandler!: (e: Event) => void;

  // ── Position sync throttle ────────────────────────────────────────────
  private moveEmitTimer = 0;
  private lastEmittedX = 0;
  private lastEmittedY = 0;

  constructor() {
    super({ key: "BuildingScene" });
  }

  init(sceneData: SceneData) {
    this.sceneData = sceneData;
  }

  create() {
    // Notify React which scene is active
    window.dispatchEvent(new CustomEvent("devplaza:scene", { detail: "building" }));

    this.physics.world.setBounds(0, 0, ROOM_W, ROOM_H);

    this.drawInterior();
    this.createLocalPlayer();
    this.setupInput();
    this.setupSocket();
    this.setupChatEventBridge();
  }

  // ── Interior drawing ─────────────────────────────────────────────────

  private drawInterior() {
    const { buildingName } = this.sceneData;

    // Background
    this.add.rectangle(ROOM_W / 2, ROOM_H / 2, ROOM_W, ROOM_H, 0x0a0a1a);

    // Floor grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a1a3a, 0.6);
    for (let x = 0; x <= ROOM_W; x += 64) {
      grid.moveTo(x, 0);
      grid.lineTo(x, ROOM_H);
    }
    for (let y = 0; y <= ROOM_H; y += 64) {
      grid.moveTo(0, y);
      grid.lineTo(ROOM_W, y);
    }
    grid.strokePath();

    // Room border glow
    const border = this.add.graphics();
    border.lineStyle(2, 0x3355aa, 0.5);
    border.strokeRect(4, 4, ROOM_W - 8, ROOM_H - 8);

    // Header bar
    this.add.rectangle(ROOM_W / 2, 24, ROOM_W, 48, 0x0d0d2a);
    this.add.graphics().lineStyle(1, 0x2244aa, 0.8).strokeRect(0, 0, ROOM_W, 48);
    this.add
      .text(ROOM_W / 2, 24, buildingName, {
        fontSize: "14px",
        color: "#88aaff",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);

    // ESC hint (fixed to camera)
    this.add
      .text(ROOM_W - 12, 24, "ESC: 나가기", {
        fontSize: "9px",
        color: "#446688",
        fontFamily: "monospace",
      })
      .setOrigin(1, 0.5)
      .setDepth(5)
      .setScrollFactor(0);

    // Camera — fixed, covers the whole room
    this.cameras.main.setBounds(0, 0, ROOM_W, ROOM_H);
    this.cameras.main.setScroll(0, 0);
  }

  // ── Local player ─────────────────────────────────────────────────────

  private createLocalPlayer() {
    const { nickname, gender, skinColor } = this.sceneData;
    const startX = ROOM_W / 2;
    const startY = ROOM_H - 120;

    this.player = this.physics.add.sprite(startX, startY, "char_front_idle");
    this.player.setScale(CHAR_SCALE);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.play("anim_front_idle");

    this.playerLabel = this.add
      .text(startX, startY - LABEL_OFFSET_Y, nickname, {
        fontSize: "9px",
        color: "#ccddff",
        fontFamily: "monospace",
        backgroundColor: "#00000099",
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(11);
  }

  // ── Input ─────────────────────────────────────────────────────────────

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.keyEsc = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  // ── Socket setup ──────────────────────────────────────────────────────

  private setupSocket() {
    const { buildingId, userId, nickname, gender, skinColor } = this.sceneData;
    const socket = getSocket();

    // Ensure socket is connected
    if (!socket.connected) {
      connectSocket(userId, nickname, gender, skinColor);
    }

    // Tell server we entered this building
    socket.emit("building:enter", { buildingId, userId, nickname, gender, skinColor });

    // Receive current users already in the room
    socket.once("building:users", ({ users }: { users: Array<{ userId: string; nickname: string; gender: string; skinColor: string }> }) => {
      users.forEach((u) => this.spawnRemotePlayer(u));
    });

    // New user joins
    socket.on("building:user_joined", (u: { userId: string; nickname: string; gender: string; skinColor: string }) => {
      if (u.userId === this.sceneData.userId) return; // shouldn't happen, but guard
      this.spawnRemotePlayer(u);
    });

    // User leaves
    socket.on("building:user_left", ({ userId }: { userId: string }) => {
      this.removeRemotePlayer(userId);
    });

    // Incoming chat message (from other users — our own is shown locally)
    socket.on(
      "chat:message",
      ({ userId: senderId, content }: { userId: string; nickname: string; content: string; createdAt: string }) => {
        if (senderId === this.sceneData.userId) return; // skip echo (server uses socket.to)
        const remote = this.remotePlayers.get(senderId);
        if (remote) this.showBubble(remote, content);
      },
    );

    // Remote player movement
    socket.on(
      "building:player_moved",
      ({ userId, x, y }: { userId: string; x: number; y: number }) => {
        const remote = this.remotePlayers.get(userId);
        if (!remote) return;
        remote.sprite.setPosition(x, y);
        remote.x = x;
        remote.y = y;
      },
    );
  }

  // ── Chat event bridge (React input → Phaser) ─────────────────────────

  private setupChatEventBridge() {
    this.chatSendHandler = (e: Event) => {
      const { content } = (e as CustomEvent<{ content: string }>).detail;
      if (!content?.trim()) return;

      // Show bubble on local player immediately
      this.showLocalBubble(content.trim());

      // Send to server
      getSocket().emit("chat:send", {
        buildingId: this.sceneData.buildingId,
        content: content.trim(),
      });
    };

    window.addEventListener("devplaza:chat:send", this.chatSendHandler);
  }

  // ── Bubble helpers ────────────────────────────────────────────────────

  private showLocalBubble(content: string) {
    this.playerBubble?.destroy();
    this.playerBubble = new ChatBubble(this, content);
    this.playerBubble.setPosition(this.player.x, this.player.y - 12);
  }

  private showBubble(remote: RemotePlayer, content: string) {
    remote.bubble?.destroy();
    remote.bubble = new ChatBubble(this, content);
    remote.bubble.setPosition(remote.sprite.x, remote.sprite.y - 12);
  }

  // ── Remote player management ─────────────────────────────────────────

  private spawnRemotePlayer(u: { userId: string; nickname: string; gender: string; skinColor: string }) {
    if (this.remotePlayers.has(u.userId)) return;

    const spread = 200;
    const rx = ROOM_W / 2 + (Math.random() - 0.5) * spread * 2;
    const ry = ROOM_H / 2 + (Math.random() - 0.5) * spread;

    const sprite = this.physics.add.sprite(rx, ry, "char_front_idle")
      .setScale(CHAR_SCALE).setDepth(10);
    sprite.play("anim_front_idle");

    const label = this.add
      .text(rx, ry - LABEL_OFFSET_Y, u.nickname, {
        fontSize: "9px",
        color: "#aabbdd",
        fontFamily: "monospace",
        backgroundColor: "#00000099",
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(11);

    this.remotePlayers.set(u.userId, {
      ...u,
      sprite,
      label,
      bubble: null,
      x: rx,
      y: ry,
    });
  }

  private removeRemotePlayer(userId: string) {
    const p = this.remotePlayers.get(userId);
    if (!p) return;
    p.bubble?.destroy();
    p.sprite?.destroy();
    p.label?.destroy();
    this.remotePlayers.delete(userId);
  }

  // ── Texture factory (removed — using wonhyukc sprites) ───────────────

  private ensurePlayerTexture(_key: string, _gender: string, _skinColor: string): string {
    return "char_front_idle";
  }

  // ── Leave building ────────────────────────────────────────────────────

  private leaveBuilding() {
    const socket = getSocket();
    socket.emit("building:leave", { buildingId: this.sceneData.buildingId });
    socket.off("building:user_joined");
    socket.off("building:user_left");
    socket.off("chat:message");
    socket.off("building:player_moved");

    window.removeEventListener("devplaza:chat:send", this.chatSendHandler);

    // Return to world scene with user config preserved
    const { userId, nickname, gender, skinColor } = this.sceneData;
    window.dispatchEvent(new CustomEvent("devplaza:scene", { detail: "world" }));
    this.scene.start("WorldScene", { userId, nickname, gender, skinColor });
  }

  // ── Update loop ───────────────────────────────────────────────────────

  update(_t: number, delta: number) {
    // ESC → leave
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.leaveBuilding();
      return;
    }

    const isInputFocused = document.activeElement?.tagName === "INPUT";
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (isInputFocused) {
      body.setVelocity(0, 0);
    } else {
      let vx = 0, vy = 0;
      if (this.wasd.left.isDown  || this.cursors.left.isDown)  vx = -SPEED;
      else if (this.wasd.right.isDown || this.cursors.right.isDown) vx = SPEED;
      if (this.wasd.up.isDown    || this.cursors.up.isDown)    vy = -SPEED;
      else if (this.wasd.down.isDown  || this.cursors.down.isDown)  vy = SPEED;
      if (vx !== 0 && vy !== 0) { const d = 1 / Math.SQRT2; vx *= d; vy *= d; }
      body.setVelocity(vx, vy);
    }

    // Local player label + bubble follow
    this.playerLabel.setPosition(this.player.x, this.player.y - LABEL_OFFSET_Y);
    if (this.playerBubble?.active) {
      this.playerBubble.setPosition(this.player.x, this.player.y - 12);
    }

    // Remote player labels + bubbles follow their sprites
    this.remotePlayers.forEach((remote) => {
      remote.label.setPosition(remote.sprite.x, remote.sprite.y - LABEL_OFFSET_Y);
      if (remote.bubble?.active) {
        remote.bubble.setPosition(remote.sprite.x, remote.sprite.y - 12);
      }
    });

    // Emit local position to building room (throttled every 50 ms)
    this.moveEmitTimer += delta;
    if (this.moveEmitTimer >= 50) {
      this.moveEmitTimer = 0;
      const px = this.player.x;
      const py = this.player.y;
      if (Math.abs(px - this.lastEmittedX) > 1 || Math.abs(py - this.lastEmittedY) > 1) {
        getSocket().emit("building:player_move", {
          buildingId: this.sceneData.buildingId,
          x: px,
          y: py,
        });
        this.lastEmittedX = px;
        this.lastEmittedY = py;
      }
    }
  }
}
