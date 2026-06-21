"use client";

import { TwinState } from "@/hooks/useWebSocket";

const STATE_CONFIG = {
  idle: { color: "bg-green-500", label: "Available", pulse: false },
  listening: { color: "bg-blue-500", label: "Listening...", pulse: true },
  thinking: { color: "bg-yellow-500", label: "Thinking...", pulse: true },
  speaking: { color: "bg-purple-500", label: "Speaking", pulse: true },
};

export default function StatusBadge({ state }: { state: TwinState }) {
  const { color, label, pulse } = STATE_CONFIG[state];
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`}
      />
      <span className="text-sm text-slate-300 font-medium">{label}</span>
    </div>
  );
}
