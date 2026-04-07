import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Capturo — Prospecção com IA, Maps e WhatsApp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(145deg, #080C14 0%, #0D1F35 45%, #080C14 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#00FFA3",
              boxShadow: "0 0 20px #00FFA3",
            }}
          />
          <span style={{ fontSize: 28, fontWeight: 700, color: "#00E5FF" }}>
            Capturo
          </span>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.05,
            color: "#E2EAF4",
            letterSpacing: -2,
            maxWidth: 980,
          }}
        >
          Prospecção com IA, <span style={{ color: "#00E5FF" }}>Maps</span> e
          WhatsApp
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: "#6B7FA8",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Qualifique leads, personalize mensagens e acompanhe o pipeline — comece grátis.
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            gap: 28,
            fontSize: 22,
            color: "#3D4F6E",
          }}
        >
          <span>100 leads/mês no Free</span>
          <span>·</span>
          <span>GPT-4o + Places</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
