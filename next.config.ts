import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Native + serverless PDF stack (evita bundling que quebra pdf.js / napi canvas na Vercel). */
  serverExternalPackages: ["unpdf", "@napi-rs/canvas"],
};

export default nextConfig;
