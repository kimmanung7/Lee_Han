"use client";

import { useEffect, useRef } from "react";
import { createGame } from "@/game/index";
import type Phaser from "phaser";

interface Props {
  userId: string;
  nickname: string;
  gender: string;
  skinColor: string;
}

export default function GameCanvas({ userId, nickname, gender, skinColor }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = createGame(containerRef.current, {
      userId,
      nickname,
      gender,
      skinColor,
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
}
