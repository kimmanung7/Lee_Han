"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

interface UserSnippet {
  id: string;
  nickname: string | null;
  username: string;
  avatarUrl: string;
}

interface DMMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; nickname: string | null; avatarUrl: string };
}

interface Props {
  myId: string;
  target: UserSnippet;
  socket: Socket | null;
  onClose: () => void;
}

export default function DMModal({ myId, target, socket, onClose }: Props) {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/dm/${target.id}`)
      .then((r) => r.json())
      .then((json) => setMessages(json.messages ?? []));
  }, [target.id]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg: DMMessage) => {
      if (msg.sender.id === target.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("dm:message", handler);
    return () => { socket.off("dm:message", handler); };
  }, [socket, target.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/dm/${target.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setMessages((prev) => [...prev, message]);
        setInput("");
        socket?.emit("dm:send", { toUserId: target.id, message });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-80 h-96 bg-gray-900 border border-gray-700 rounded-xl flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={target.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
          <span className="flex-1 text-sm font-semibold text-gray-200">
            {target.nickname ?? target.username}
          </span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1">
          {messages.map((msg) => {
            const isMine = msg.sender.id === myId;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] text-xs px-3 py-1.5 rounded-2xl ${
                    isMine
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-gray-800 text-gray-200 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 px-3 py-2 border-t border-gray-800">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") send(); }}
            placeholder="메시지 입력..."
            className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5 text-gray-200 outline-none focus:border-indigo-500"
          />
          <button
            onClick={send}
            disabled={sending}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-full"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
