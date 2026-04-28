"use client";

import dynamic from "next/dynamic";
import ChatInput from "@/components/chat/ChatInput";

const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), {
  ssr: false,
});

interface Props {
  userId: string;
  nickname: string;
  gender: string;
  skinColor: string;
}

export default function WorldClient({ userId, nickname, gender, skinColor }: Props) {
  return (
    <>
      <main
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          background: "#0d0d1a",
        }}
      >
        <GameCanvas
          userId={userId}
          nickname={nickname}
          gender={gender}
          skinColor={skinColor}
        />
      </main>

      <ChatInput />
    </>
  );
}
