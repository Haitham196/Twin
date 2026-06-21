"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AvatarFace from "@/components/AvatarFace";
import StatusBadge from "@/components/StatusBadge";
import KnowledgePanel from "@/components/KnowledgePanel";
import ChatInput from "@/components/ChatInput";
import UserOnboarding from "@/components/UserOnboarding";
import { useTwinWS, TwinState } from "@/hooks/useWebSocket";

export default function Home() {
  const [userName, setUserName] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [amplitude, setAmplitude] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleResponseComplete = useCallback(async (text: string) => {
    setMessages((prev) => [...prev, { role: "ai", text }]);
    try {
      const res = await fetch("http://localhost:8000/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: 0, user_name: userName ?? "Unknown" }),
      });
      if (!res.ok) return;
      const { audio_base64 } = await res.json();
      const binary = atob(audio_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const arrayBuffer = await (await fetch(url)).arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((s, v) => s + (v - 128) ** 2, 0) / data.length) / 128;
        setAmplitude(rms);
        requestAnimationFrame(tick);
      };
      source.start();
      requestAnimationFrame(tick);
      source.onended = () => setAmplitude(0);
    } catch {
      // TTS not configured or unavailable — silent is fine
    }
  }, [userName]);

  const { twinState, sendMessage, setUser, isConnected, currentResponse } =
    useTwinWS(handleResponseComplete);

  function handleOnboardingComplete(name: string) {
    setUserName(name);
    setUser(name);
  }

  function handleSend(msg: string) {
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    sendMessage(msg);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {!userName && <UserOnboarding onComplete={handleOnboardingComplete} />}

      {/* Left sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-slate-800 p-5 gap-4 shrink-0">
        <div className="text-xs text-slate-600 font-mono">HAITHAM AI</div>
        <KnowledgePanel />
        <div className="mt-auto text-xs text-slate-600">
          {isConnected ? "🟢 Connected" : "🔴 Connecting..."}
        </div>
      </aside>

      {/* Center */}
      <main className="flex-1 flex flex-col items-center py-8 px-4 gap-6">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-bold tracking-tight">Haitham AI</h1>
          <p className="text-xs text-slate-500">Healthcare IT Agent · China Medical AI</p>
          <StatusBadge state={twinState as TwinState} />
        </div>

        <div className="relative">
          <AvatarFace twinState={twinState as TwinState} amplitude={amplitude} />
          <div
            className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-500 ${
              twinState === "speaking" ? "opacity-100" : "opacity-0"
            }`}
            style={{ boxShadow: "0 0 60px 20px rgba(168,85,247,0.25)" }}
          />
        </div>

        <div className="w-full max-w-xl flex flex-col gap-3 flex-1 overflow-y-auto max-h-64">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-slate-800 text-slate-100 rounded-bl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {currentResponse && (
            <div className="flex justify-start">
              <div className="max-w-sm px-4 py-2.5 rounded-2xl text-sm bg-slate-800 text-slate-300 rounded-bl-none opacity-80">
                {currentResponse}<span className="animate-pulse">▌</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="w-full max-w-xl mt-auto">
          <ChatInput onSend={handleSend} twinState={twinState as TwinState} disabled={!isConnected || !userName} />
        </div>
      </main>

      {/* Right sidebar */}
      <aside className="hidden xl:flex w-56 border-l border-slate-800 p-5 flex-col gap-4 shrink-0">
        <div className="text-xs text-slate-600 font-mono">PROJECTS</div>
        <div className="flex flex-col gap-2 text-sm text-slate-400">
          <div className="bg-slate-800/50 rounded-lg px-3 py-2">🤖 AI Projects</div>
          <div className="bg-slate-800/50 rounded-lg px-3 py-2">📈 Active Projects</div>
          <div className="bg-slate-800/50 rounded-lg px-3 py-2">🔧 App Support</div>
        </div>
      </aside>
    </div>
  );
}
