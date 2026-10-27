import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { color, fontFamily, night, serif, type } from "./brand";
import type { Caption } from "./srt";

// 旁白字幕：画面底部安全区，一次只显示一句。en 是同序号的英文小字（可选）
export const Captions: React.FC<{ captions: Caption[]; en?: string[]; tone?: "light" | "dark" }> = ({
  captions,
  en,
  tone = "light",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const index = captions.findIndex((c) => ms >= c.startMs && ms < c.endMs);
  if (index < 0) return null;
  const dark = tone === "dark";

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: dark ? 52 : 72 }}>
      <div
        style={{
          fontFamily: dark ? serif : fontFamily,
          fontSize: dark ? 46 : type.caption,
          fontWeight: dark ? 400 : 600,
          color: dark ? night.text : color.ink,
          background: dark ? "transparent" : "rgba(244, 242, 238, 0.92)",
          textShadow: dark ? "0 0 18px rgba(0,0,0,0.9)" : undefined,
          letterSpacing: dark ? "0.04em" : undefined,
          padding: "10px 28px",
          borderRadius: 12,
          maxWidth: "82%",
          textAlign: "center",
          lineHeight: 1.35,
        }}
      >
        {captions[index].text.trim()}
        {en?.[index] && (
          <div style={{ fontSize: 26, fontWeight: 300, fontStyle: "italic", color: night.dim, marginTop: 6, letterSpacing: "0.02em" }}>
            {en[index]}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
