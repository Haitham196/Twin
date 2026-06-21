import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/chat",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
    NEXT_PUBLIC_SIMLI_API_KEY: process.env.NEXT_PUBLIC_SIMLI_API_KEY ?? "",
    NEXT_PUBLIC_SIMLI_FACE_ID: process.env.NEXT_PUBLIC_SIMLI_FACE_ID ?? "",
  },
};

export default nextConfig;
