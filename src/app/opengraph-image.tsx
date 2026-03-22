import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "TFT Doctor — Stop coinflipping your comps";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public", "eyes.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#1B1B1F",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Subtle accent glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(204,123,115,0.15), transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(204,123,115,0.1), transparent 70%)",
            display: "flex",
          }}
        />

        {/* Icon + Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={72} height={72} alt="" />
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#E8E4E0",
              letterSpacing: "-0.02em",
            }}
          >
            TFT
          </span>
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#CC7B73",
              letterSpacing: "-0.02em",
            }}
          >
            Doctor
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#8A8A95",
            marginTop: 24,
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Stop coinflipping. Let high-elo data pick your comp.
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background:
              "linear-gradient(90deg, transparent, #CC7B73, transparent)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
