"use client";

import { useState, useTransition } from "react";
import PixelCharacter from "@/components/PixelCharacter";
import { saveSetup } from "@/app/setup/actions";

const SKIN_OPTIONS = [
  { id: "light",  label: "라이트",  hex: "#FDDBB4" },
  { id: "tan",    label: "탄",     hex: "#E8A87C" },
  { id: "medium", label: "미디엄", hex: "#C68642" },
  { id: "dark",   label: "다크",   hex: "#8D5524" },
];

export default function SetupForm() {
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [skinColor, setSkinColor] = useState("light");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => saveSetup(fd));
  }

  return (
    <div className="flex flex-col lg:flex-row gap-12 items-center justify-center w-full">
      {/* Preview */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest">미리보기</p>
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 flex items-end justify-center" style={{ minHeight: 340 }}>
          <PixelCharacter gender={gender} skinColor={skinColor} pixelSize={18} />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-sm">
        {/* nickname */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">닉네임</label>
          <input
            name="nickname"
            type="text"
            required
            maxLength={20}
            placeholder="닉네임 입력"
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* gender */}
        <input type="hidden" name="gender" value={gender} />
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">성별</label>
          <div className="flex gap-3">
            {(["MALE", "FEMALE"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  gender === g
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-indigo-500"
                }`}
              >
                {g === "MALE" ? "남" : "여"}
              </button>
            ))}
          </div>
        </div>

        {/* skin color */}
        <input type="hidden" name="skinColor" value={skinColor} />
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">피부색</label>
          <div className="flex gap-3">
            {SKIN_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSkinColor(opt.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors ${
                  skinColor === opt.id ? "border-indigo-500" : "border-transparent"
                }`}
              >
                <span
                  className="w-8 h-8 rounded-full block"
                  style={{ backgroundColor: opt.hex }}
                />
                <span className="text-xs text-gray-400">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors text-white font-semibold py-3 rounded-lg"
        >
          {pending ? "저장 중…" : "설정 완료"}
        </button>
      </form>
    </div>
  );
}
