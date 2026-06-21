"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AvatarFace from "@/components/AvatarFace";
import AvatarStream from "@/components/AvatarStream";
import StatusBadge from "@/components/StatusBadge";
import KnowledgePanel from "@/components/KnowledgePanel";
import ChatInput from "@/components/ChatInput";
import VoiceButton from "@/components/VoiceButton";
import UserOnboarding from "@/components/UserOnboarding";
import { useTwinWS, TwinState } from "@/hooks/useWebSocket";
import { useVoice } from "@/hooks/useVoice";
import { useSimli } from "@/hooks/useSimli";

const SIMLI_ENABLED =
  !!process.env.NEXT_PUBLIC_SIMLI_API_KEY && !!process.env.NEXT_PUBLIC_SIMLI_FACE_ID;

type Message = { role: "user" | "ai" | "transcript"; text: string };

export default function Home() {
  const [userName, setUserName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [amplitude, setAmplitude] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simli refs (used only when Simli is configured)
  const simliVideoRef = useRef<HTMLVideoElement>(null);
  const simliAudioRef = useRef<HTMLAudioElement>(null);
  const { ready: simliReady, sendAudio: simliSendAudio } = useSimli(
    simliVideoRef,
    simliAudioRef,
  );

  // ── response handler ────────────────────────────────────────────────────
  const handleResponseComplete = useCallback(
    async (text: string, audioBase64?: string) => {
      setMessages((prev) => [...prev, { role: "ai", text }]);

      if (!audioBase64) return;

      // If Simli is ready, feed PCM to Simli (it plays voice + animates face)
      if (SIMLI_ENABLED && simliReady) {
        await simliSendAudio(audioBase64);
        return;
      }

      // Otherwise play audio directly in browser and drive canvas amplitude
      try {
        const binary = atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
        const ctx = audioCtxRef.current;
        const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0) as ArrayBuffer);
        const source = ctx.createBufferSource();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.buffer = audioBuffer;
        source.connect(analyser);
        analyser.connect(ctx.destination);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          const rms =
            Math.sqrt(data.reduce((s, v) => s + (v - 128) ** 2, 0) / data.length) / 128;
          setAmplitude(rms);
          requestAnimationFrame(tick);
        };
        source.start();
        requestAnimationFrame(tick);
        source.onended = () => setAmplitude(0);
      } catch {
        // Audio unavailable — silent
      }
    },
    [simliReady, simliSendAudio],
  );

  const handleTranscript = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: "transcript", text }]);
  }, []);

  // ── WebSocket ───────────────────────────────────────────────────────────
  const { twinState, currentResponse, isConnected, sendMessage, sendVoice, setUser } =
    useTwinWS(handleResponseComplete, handleTranscript);

  // ── Voice recording ─────────────────────────────────────────────────────
  const { isRecording, isSupported: voiceSupported, startRecording, stopRecording } = useVoice(
    sendVoice,
  );

  // ── onboarding ──────────────────────────────────────────────────────────
  function handleOnboardingComplete(name: string) {
    setUserName(name);
    setUser(name);
  }

  function handleSend(msg: string) {
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    // Ask backend to include TTS only when Simli is NOT handling audio
    sendMessage(msg, !SIMLI_ENABLED);
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
        {SIMLI_ENABLED && (
          <div className="text-xs text-slate-600">
            {simliReady ? "🎭 Simli ready" : "🎭 Simli loading..."}
          </div>
        )}
      </aside>

      {/* Center */}
      <main className="flex-1 flex flex-col items-center py-8 px-4 gap-6">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-bold tracking-tight">Haitham AI</h1>
          <p className="text-xs text-slate-500">Healthcare IT Agent · China Medical AI</p>
          <StatusBadge state={twinState as TwinState} />
        </div>

        {/* Avatar — Simli video if configured, canvas otherwise */}
        <div className="relative">
          {SIMLI_ENABLED ? (
            <AvatarStream
              twinState={twinState as TwinState}
              videoRef={simliVideoRef}
              audioRef={simliAudioRef}
            />
          ) : (
            <>
              <AvatarFace twinState={twinState as TwinState} amplitude={amplitude} />
              <div
                className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-500 ${
                  twinState === "speaking" ? "opacity-100" : "opacity-0"
                }`}
                style={{ boxShadow: "0 0 60px 20px rgba(168,85,247,0.25)" }}
              />
            </>
          )}
        </div>

        {/* Chat history */}
        <div className="w-full max-w-xl flex flex-col gap-3 flex-1 overflow-y-auto max-h-64">
          {messages.map((m, i) => {
            if (m.role === "transcript") {
              return (
                <div key={i} className="flex justify-center">
                  <div className="text-xs text-slate-500 italic bg-slate-800/40 px-3 py-1 rounded-full">
                    🎤 "{m.text}"
                  </div>
                </div>
              );
            }
            return (
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
            );
          })}
          {currentResponse && (
            <div className="flex justify-start">
              <div className="max-w-sm px-4 py-2.5 rounded-2xl text-sm bg-slate-800 text-slate-300 rounded-bl-none opacity-80">
                {currentResponse}
                <span className="animate-pulse">▌</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="w-full max-w-xl mt-auto flex gap-3 items-end">
          <div className="flex-1">
            <ChatInput
              onSend={handleSend}
              twinState={twinState as TwinState}
              disabled={!isConnected || !userName}
            />
          </div>
          {voiceSupported && (
            <VoiceButton
              isRecording={isRecording}
              twinState={twinState as TwinState}
              disabled={!isConnected || !userName}
              onStart={startRecording}
              onStop={stopRecording}
            />
          )}
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
