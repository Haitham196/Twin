"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";

async function mp3Base64ToPcm16k(base64: string): Promise<Int16Array> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const ctx = new AudioContext({ sampleRate: 16000 });
  const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0) as ArrayBuffer);
  await ctx.close();

  const channelData = audioBuffer.getChannelData(0);
  const int16 = new Int16Array(channelData.length);
  for (let i = 0; i < channelData.length; i++) {
    int16[i] = Math.max(-32768, Math.min(32767, Math.round(channelData[i] * 32768)));
  }
  return int16;
}

interface UseSimliReturn {
  ready: boolean;
  sendAudio: (audioBase64: string) => Promise<boolean>;
}

export function useSimli(
  videoRef: RefObject<HTMLVideoElement | null>,
  audioRef: RefObject<HTMLAudioElement | null>,
): UseSimliReturn {
  const clientRef = useRef<unknown>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_SIMLI_API_KEY;
    const faceId = process.env.NEXT_PUBLIC_SIMLI_FACE_ID;
    if (!apiKey || !faceId) return;

    let mounted = true;

    (async () => {
      try {
        const { SimliClient } = await import("simli-client");
        if (!mounted) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = new (SimliClient as any)();
        clientRef.current = client;

        client.Initialize({
          apiKey,
          faceID: faceId,
          handleSilence: true,
          videoRef,
          audioRef,
        });

        await client.start();
        if (mounted) setReady(true);
      } catch (e) {
        console.warn("Simli unavailable, using canvas fallback:", e);
      }
    })();

    return () => {
      mounted = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (clientRef.current as any)?.close?.();
    };
  }, [audioRef, videoRef]);

  const sendAudio = useCallback(
    async (audioBase64: string): Promise<boolean> => {
      if (!ready || !clientRef.current) return false;
      try {
        const pcm = await mp3Base64ToPcm16k(audioBase64);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (clientRef.current as any).sendAudioData(pcm);
        return true;
      } catch {
        return false;
      }
    },
    [ready],
  );

  return { ready, sendAudio };
}
