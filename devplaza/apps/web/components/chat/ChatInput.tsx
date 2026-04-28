"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatInput() {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const input = inputRef.current;
      if (!input) return;

      e.preventDefault();

      if (document.activeElement === input) {
        // 채팅 모드 → 전송 후 이동 모드로 복귀
        const content = valueRef.current.trim();
        if (content) {
          window.dispatchEvent(
            new CustomEvent("devplaza:chat:send", { detail: { content } }),
          );
          setValue("");
        }
        input.blur();
      } else {
        // 이동 모드 → 채팅 모드 진입
        input.focus();
      }
    };

    // capture: true → React onKeyDown의 stopPropagation보다 먼저 실행됨
    window.addEventListener("keydown", onKeydown, true);
    return () => window.removeEventListener("keydown", onKeydown, true);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        background: focused ? "rgba(8, 8, 30, 0.92)" : "rgba(8, 8, 24, 0.55)",
        backdropFilter: "blur(6px)",
        borderTop: focused
          ? "1px solid rgba(80, 140, 255, 0.7)"
          : "1px solid rgba(51, 80, 140, 0.25)",
        transition: "background 0.15s, border-color 0.15s",
        zIndex: 100,
      }}
    >
      {/* 모드 표시 */}
      <span
        style={{
          fontSize: 10,
          fontFamily: "monospace",
          color: focused ? "#88bbff" : "#334466",
          whiteSpace: "nowrap",
          transition: "color 0.15s",
          userSelect: "none",
        }}
      >
        {focused ? "채팅 중" : "Enter: 채팅"}
      </span>

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === "Enter") e.stopPropagation(); }}
        placeholder={focused ? "메시지를 입력하세요…" : ""}
        maxLength={120}
        autoComplete="off"
        style={{
          flex: 1,
          height: 34,
          padding: "0 14px",
          background: focused ? "rgba(20, 25, 60, 0.95)" : "rgba(10, 10, 30, 0.4)",
          border: focused
            ? "1px solid rgba(80, 140, 255, 0.6)"
            : "1px solid rgba(40, 60, 120, 0.3)",
          borderRadius: 17,
          color: "#ddeeff",
          fontSize: 13,
          fontFamily: "monospace",
          outline: "none",
          transition: "background 0.15s, border-color 0.15s",
          caretColor: "#88bbff",
        }}
      />
    </div>
  );
}
