"use client";

import { RefObject } from "react";
import { TwinState } from "@/hooks/useWebSocket";

interface AvatarStreamProps {
  twinState: TwinState;
  videoRef: RefObject<HTMLVideoElement | null>;
  audioRef: RefObject<HTMLAudioElement | null>;
}

const ringColor: Record<TwinState, string> = {
  idle: "rgba(34,197,94,0.7)",
  listening: "rgba(59,130,246,0.9)",
  thinking: "rgba(234,179,8,0.9)",
  speaking: "rgba(168,85,247,0.9)",
};

export default function AvatarStream({ twinState, videoRef, audioRef }: AvatarStreamProps) {
  return (
    <div className="relative w-full h-full">
      {/* Simli video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        className="rounded-full shadow-2xl object-cover w-full h-full"
        style={{ background: "#0f172a" }}
      />
      {/* Simli audio (Simli renders voice here, not via browser AudioContext) */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} autoPlay />

      {/* Glow when speaking */}
      <div
        className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-500 ${
          twinState === "speaking" ? "opacity-100" : "opacity-0"
        }`}
        style={{ boxShadow: "0 0 60px 20px rgba(168,85,247,0.25)" }}
      />

      {/* State ring */}
      <svg
        className="absolute inset-0 pointer-events-none w-full h-full"
        viewBox="0 0 480 480"
        style={{ top: 0, left: 0 }}
      >
        <circle
          cx={240}
          cy={240}
          r={236}
          fill="none"
          stroke={ringColor[twinState]}
          strokeWidth={3}
          className="transition-colors duration-300"
        />
      </svg>
    </div>
  );
}
