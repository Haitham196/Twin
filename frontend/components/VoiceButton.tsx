"use client";

import { TwinState } from "@/hooks/useWebSocket";

interface VoiceButtonProps {
  isRecording: boolean;
  twinState: TwinState;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function VoiceButton({
  isRecording,
  twinState,
  disabled,
  onStart,
  onStop,
}: VoiceButtonProps) {
  const busy = twinState === "thinking" || twinState === "speaking";

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onMouseDown={onStart}
      onMouseUp={onStop}
      onMouseLeave={isRecording ? onStop : undefined}
      onTouchStart={(e) => {
        e.preventDefault();
        onStart();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onStop();
      }}
      aria-label={isRecording ? "Release to send" : "Hold to speak"}
      title={isRecording ? "Release to send" : "Hold to speak"}
      className={`
        flex items-center justify-center w-12 h-12 rounded-full
        text-xl transition-all duration-150 select-none
        ${
          isRecording
            ? "bg-red-500 scale-110 shadow-lg shadow-red-500/40 animate-pulse"
            : busy
              ? "bg-slate-700 opacity-40 cursor-not-allowed"
              : "bg-slate-700 hover:bg-slate-600 active:scale-95"
        }
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      🎤
    </button>
  );
}
