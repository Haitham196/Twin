import { useCallback, useEffect, useRef, useState } from "react";

export type TwinState = "idle" | "listening" | "thinking" | "speaking";

interface WSMessage {
  type:
    | "chunk"
    | "done"
    | "transcript"
    | "state"
    | "user_recognized"
    | "user_registered"
    | "error";
  text?: string;
  full?: string;
  name?: string;
  state?: TwinState;
  audio_base64?: string;
  message?: string;
}

interface UseTwinWSReturn {
  twinState: TwinState;
  transcript: string;
  currentResponse: string;
  isConnected: boolean;
  sendMessage: (msg: string, withTts?: boolean) => void;
  sendVoice: (audioBase64: string) => void;
  sendRaw: (obj: object) => void;
  setUser: (name: string) => void;
}

export function useTwinWS(
  onResponseComplete?: (text: string, audioBase64?: string) => void,
  onTranscript?: (text: string) => void,
): UseTwinWSReturn {
  const ws = useRef<WebSocket | null>(null);
  const [twinState, setTwinState] = useState<TwinState>("idle");
  const [transcript, setTranscript] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const bufferRef = useRef<string[]>([]);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/chat";
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    socket.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 3 s
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    socket.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data);

      if (msg.type === "state" && msg.state) {
        setTwinState(msg.state);
      }

      if (msg.type === "transcript" && msg.text) {
        setTranscript(msg.text);
        onTranscript?.(msg.text);
      }

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
        onResponseComplete?.(full, msg.audio_base64);
      }

      if (msg.type === "error") {
        console.error("[Twin WS]", msg.message);
        setTwinState("idle");
        bufferRef.current = [];
        setCurrentResponse("");
      }
    };
  }, [onResponseComplete, onTranscript]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const sendRaw = useCallback((obj: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(obj));
    }
  }, []);

  const sendMessage = useCallback(
    (text: string, withTts = false) => {
      setTranscript(text);
      setTwinState("thinking");
      bufferRef.current = [];
      sendRaw({ action: "chat", message: text, tts: withTts });
    },
    [sendRaw],
  );

  const sendVoice = useCallback(
    (audioBase64: string) => {
      setTwinState("thinking");
      bufferRef.current = [];
      sendRaw({ action: "voice", audio_base64: audioBase64 });
    },
    [sendRaw],
  );

  const setUser = useCallback(
    (name: string) => sendRaw({ action: "set_user", name }),
    [sendRaw],
  );

  return {
    twinState,
    transcript,
    currentResponse,
    isConnected,
    sendMessage,
    sendVoice,
    sendRaw,
    setUser,
  };
}
