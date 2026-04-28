import Phaser from "@/game/phaser-compat";
import { BootScene } from "./scenes/BootScene";
import { WorldScene } from "./scenes/WorldScene";
import { BuildingScene } from "./scenes/BuildingScene";

interface UserConfig {
  userId: string;
  nickname: string;
  gender: string;
  skinColor: string;
}

export function createGame(parent: HTMLElement, user: UserConfig): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#0d0d1a",
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [BootScene, WorldScene, BuildingScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  const game = new Phaser.Game(config);
  game.registry.set("user", user);
  return game;
}
