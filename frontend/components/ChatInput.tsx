"use client";

import { FormEvent, useState } from "react";
import { TwinState } from "@/hooks/useWebSocket";

interface ChatInputProps {
  onSend: (message: string) => void;
  twinState: TwinState;
  disabled?: boolean;
}

export default function ChatInput({ onSend, twinState, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          twinState === "thinking"
            ? "Thinking..."
            : twinState === "speaking"
            ? "Speaking..."
            : "Ask me anything about the China AI trip..."
        }
        disabled={disabled || twinState === "thinking" || twinState === "speaking"}
        className={`
          flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3
          text-white placeholder-slate-500 text-sm outline-none
          focus:border-blue-500 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled || twinState === "thinking" || twinState === "speaking"}
        className={`
          px-5 py-3 rounded-xl text-sm font-medium transition-all
          bg-blue-600 hover:bg-blue-500 text-white
          disabled:opacity-40 disabled:cursor-not-allowed
        `}
      >
        Send
      </button>
    </form>
  );
}
