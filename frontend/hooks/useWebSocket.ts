import { useCallback, useEffect, useRef, useState } from "react";

export type TwinState = "idle" | "listening" | "thinking" | "speaking";

interface WSMessage {
  type: "chunk" | "done" | "user_recognized" | "user_registered";
  text?: string;
  full?: string;
  name?: string;
}

interface UseTwinWSReturn {
  twinState: TwinState;
  transcript: string;
  currentResponse: string;
  sendMessage: (msg: string) => void;
  setUser: (name: string) => void;
  isConnected: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function useTwinWS(
  onResponseComplete?: (text: string, audioB64?: string) => void
): UseTwinWSReturn {
  const ws = useRef<WebSocket | null>(null);
  const [twinState, setTwinState] = useState<TwinState>("idle");
  const [transcript, setTranscript] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bufferRef = useRef<string[]>([]);

  useEffect(() => {
    const socket = new WebSocket(
      process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/chat"
    );
    ws.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);

    socket.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data);

      if (msg.type === "chunk" && msg.text) {
        bufferRef.current.push(msg.text);
        setCurrentResponse(bufferRef.current.join(""));
        setTwinState("speaking");
      }

      if (msg.type === "done") {
        const full = msg.full ?? bufferRef.current.join("");
        bufferRef.current = [];
        setCurrentResponse("");
        setTwinState("idle");
        onResponseComplete?.(full);
      }

      if (msg.type === "user_recognized" || msg.type === "user_registered") {
        // user identity confirmed
      }
    };

    return () => socket.close();
  }, [onResponseComplete]);

  const sendMessage = useCallback(
    (text: string) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        setTranscript(text);
        setTwinState("thinking");
        bufferRef.current = [];
        ws.current.send(JSON.stringify({ action: "chat", message: text }));
      }
    },
    []
  );

  const setUser = useCallback((name: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: "set_user", name }));
    }
  }, []);

  return {
    twinState,
    transcript,
    currentResponse,
    sendMessage,
    setUser,
    isConnected,
    audioRef,
  };
}
