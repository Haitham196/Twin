"use client";

import { useEffect, useRef } from "react";
import { TwinState } from "@/hooks/useWebSocket";

interface AvatarFaceProps {
  twinState: TwinState;
  amplitude?: number; // 0–1, for lip sync
}

/**
 * Canvas-based animated avatar.
 * Displays haitham.jpg and overlays subtle idle animations:
 * eye blinks, micro head drift, and amplitude-based lip indication.
 *
 * Phase 1 implementation — will be replaced by LivePortrait stream in Phase 2+.
 */
export default function AvatarFace({ twinState, amplitude = 0 }: AvatarFaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<number>(0);
  const stateRef = useRef(twinState);
  const amplitudeRef = useRef(amplitude);

  // Keep refs current without re-running the animation loop
  useEffect(() => { stateRef.current = twinState; }, [twinState]);
  useEffect(() => { amplitudeRef.current = amplitude; }, [amplitude]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const img = new Image();
    img.src = "/haitham.jpg";
    imgRef.current = img;

    let blinkState = 0;          // 0=open, 1=closing, 2=opening
    let blinkTimer = 0;
    let nextBlink = 3 + Math.random() * 3;
    let t = 0;
    const phaseYaw = Math.random() * Math.PI * 2;
    const phasePitch = Math.random() * Math.PI * 2;

    function draw(ts: number) {
      t = ts / 1000;
      const w = canvas!.width;
      const h = canvas!.height;

      // Micro drift: shift canvas origin slightly to simulate head sway
      const driftX = 3 * Math.sin(t * 0.25 + phaseYaw);
      const driftY = 2 * Math.sin(t * 0.18 + phasePitch);

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(driftX, driftY);

      if (img.complete && img.naturalWidth > 0) {
        const aspect = img.naturalWidth / img.naturalHeight;
        const drawH = h + 10;
        const drawW = drawH * aspect;
        const x = (w - drawW) / 2;
        ctx.drawImage(img, x, -5, drawW, drawH);
      } else {
        // Placeholder: dark background + initials while photo loads or is missing
        ctx.fillStyle = "#1a2332";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#334155";
        ctx.font = `bold ${h * 0.25}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("H", w / 2, h / 2);
      }

      ctx.restore();

      // Blink overlay (dark semi-transparent bar over upper half of face)
      blinkTimer += 1 / 60;
      if (blinkState === 0 && blinkTimer >= nextBlink) {
        blinkState = 1;
        blinkTimer = 0;
      }
      if (blinkState === 1) {
        const progress = Math.min(blinkTimer / 0.06, 1);
        ctx.fillStyle = `rgba(0,0,0,${progress * 0.9})`;
        const eyeY = h * 0.28;
        const eyeH = h * 0.08;
        ctx.fillRect(0, eyeY, w, eyeH);
        if (progress >= 1) { blinkState = 2; blinkTimer = 0; }
      }
      if (blinkState === 2) {
        const progress = Math.min(blinkTimer / 0.08, 1);
        ctx.fillStyle = `rgba(0,0,0,${(1 - progress) * 0.9})`;
        const eyeY = h * 0.28;
        const eyeH = h * 0.08;
        ctx.fillRect(0, eyeY, w, eyeH);
        if (progress >= 1) {
          blinkState = 0;
          blinkTimer = 0;
          nextBlink = 3 + Math.random() * 3;
        }
      }

      // Lip sync: pulsing glow at mouth area when speaking
      if (stateRef.current === "speaking" && amplitudeRef.current > 0.05) {
        const mouthY = h * 0.72;
        const mouthH = h * 0.06 * amplitudeRef.current;
        const grad = ctx.createLinearGradient(0, mouthY - mouthH, 0, mouthY + mouthH);
        grad.addColorStop(0, "rgba(100,200,255,0)");
        grad.addColorStop(0.5, `rgba(100,200,255,${amplitudeRef.current * 0.3})`);
        grad.addColorStop(1, "rgba(100,200,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(w * 0.25, mouthY - mouthH, w * 0.5, mouthH * 2);
      }

      // State indicator ring
      const ringColor =
        stateRef.current === "idle" ? "rgba(34,197,94,0.6)"
        : stateRef.current === "listening" ? "rgba(59,130,246,0.8)"
        : stateRef.current === "thinking" ? "rgba(234,179,8,0.8)"
        : "rgba(168,85,247,0.8)"; // speaking

      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 4, 0, Math.PI * 2);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      frameRef.current = requestAnimationFrame(draw);
    }

    img.onload = () => {
      frameRef.current = requestAnimationFrame(draw);
    };
    // Start even before image loads (shows placeholder)
    frameRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={560}
      className="rounded-full object-cover shadow-2xl"
      style={{ background: "#0f172a" }}
    />
  );
}
