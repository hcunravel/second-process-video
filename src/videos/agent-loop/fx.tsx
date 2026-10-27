import { interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { night, springs } from "../../lib/brand";

type SpringName = keyof typeof springs;

// 从第 at 帧开始的弹簧进度（0 → 1）
export function useSpringAt(at: number, preset: SpringName = "card") {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: springs[preset] });
}

// 值多次改变目标时叠加弹簧，动作连续，任意一帧都能单独算出来
export function useSpringSum(times: number[], preset: SpringName = "card") {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return times.reduce((sum, at) => sum + spring({ frame: frame - at, fps, config: springs[preset] }), 0);
}

// [from, to] 两个帧之间从 0 到 1，两头夹住
export const ramp = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// 出现后保持，到 hideAt 开始淡出
export const life = (frame: number, showAt: number, hideAt: number, fade = 10) =>
  ramp(frame, showAt, showAt + fade) * (1 - ramp(frame, hideAt, hideAt + fade));

export const glowShadow = (strength = 1) =>
  `0 0 ${14 * strength}px ${4 * strength}px rgba(255,138,31,${0.75 * Math.min(1, strength)}), 0 0 ${60 * strength}px ${18 * strength}px rgba(255,106,0,${0.35 * Math.min(1, strength)})`;

export const coolShadow = (strength = 1) =>
  `0 0 ${12 * strength}px ${3 * strength}px rgba(107,184,255,${0.7 * Math.min(1, strength)}), 0 0 ${50 * strength}px ${14 * strength}px rgba(60,140,255,${0.3 * Math.min(1, strength)})`;

// 极小的英文技术标注：只做质感，不承载必须看清的信息
export const tag: React.CSSProperties = {
  fontFamily: "Noto Sans SC",
  fontSize: 22,
  fontWeight: 400,
  letterSpacing: "0.32em",
  color: "rgba(236,232,225,0.42)",
  whiteSpace: "nowrap",
  textTransform: "uppercase",
};

export const textGlow = (strength = 1) => `0 0 ${10 * strength}px rgba(255,138,31,0.85), 0 0 ${32 * strength}px rgba(255,106,0,0.5)`;

// 暗场底：蓝黑底 + 中心略亮的暗角 + 每两帧换一次种子的胶片颗粒
export const NightBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 45%, ${night.bgLift} 0%, ${night.bg} 70%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 0.09, mixBlendMode: "screen" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(frame / 2)} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={1920} height={1080} filter="url(#grain)" />
      </svg>
    </>
  );
};

// 漂浮的微尘，位置由种子和时间算出来
export const Dust: React.FC<{ count?: number }> = ({ count = 70 }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const x = (random(`dx${i}`) * 1920 + frame * (random(`vx${i}`) - 0.5) * 0.6 + 1920) % 1920;
        const y = (random(`dy${i}`) * 1080 - frame * (0.1 + random(`vy${i}`) * 0.35) + 1080 * 4) % 1080;
        const s = 1.5 + random(`ds${i}`) * 2.5;
        const twinkle = 0.5 + 0.5 * Math.sin(frame / (12 + random(`dt${i}`) * 20) + i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: s,
              background: "#FFE2C2",
              opacity: (0.08 + random(`do${i}`) * 0.22) * (0.6 + 0.4 * twinkle),
            }}
          />
        );
      })}
    </>
  );
};

// Agent 本体：一个橙色光点。flash 是点燃时向外扩的光圈进度
export const Orb: React.FC<{ x: number; y: number; size?: number; intensity?: number; flash?: number }> = ({
  x,
  y,
  size = 26,
  intensity = 1,
  flash = 1,
}) => {
  return (
    <>
      {flash < 1 && (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 900 * flash,
            height: 900 * flash,
            borderRadius: "50%",
            border: `3px solid rgba(255,138,31,${0.8 * (1 - flash)})`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${night.core} 0%, ${night.light} 55%, rgba(255,106,0,0) 100%)`,
          boxShadow: glowShadow(intensity),
          transform: "translate(-50%, -50%)",
          opacity: Math.min(1, intensity * 1.5),
        }}
      />
    </>
  );
};

export type IconName = "search" | "calendar" | "browser";

// 细线图标，lit 时变成橙光
export const ThinIcon: React.FC<{ name: IconName; size: number; lit?: number; tint?: "warm" | "cool" }> = ({ name, size, lit = 0, tint = "warm" }) => {
  const on = tint === "cool" ? night.cool : night.light;
  const rgb = tint === "cool" ? "107,184,255" : "255,138,31";
  const stroke = lit > 0.5 ? on : "rgba(236,232,225,0.55)";
  const common = { fill: "none", stroke, strokeWidth: 1.1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ overflow: "visible", filter: lit > 0.05 ? `drop-shadow(0 0 ${8 * lit}px rgba(${rgb},${lit}))` : undefined }}
    >
      {name === "search" && (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" {...common} />
          <line x1="15.5" y1="15.5" x2="21" y2="21" {...common} />
        </>
      )}
      {name === "calendar" && (
        <>
          <rect x="3" y="5" width="18" height="16" rx="3" {...common} />
          <line x1="3" y1="10" x2="21" y2="10" {...common} />
          <line x1="8" y1="3" x2="8" y2="7" {...common} />
          <line x1="16" y1="3" x2="16" y2="7" {...common} />
        </>
      )}
      {name === "browser" && (
        <>
          <rect x="2.5" y="4" width="19" height="16" rx="3" {...common} />
          <line x1="2.5" y1="9" x2="21.5" y2="9" {...common} />
        </>
      )}
    </svg>
  );
};

// 逐字浮现的细字。每个字自己的弹簧，stagger 帧一个
export const RevealText: React.FC<{
  text: string;
  at: number;
  stagger?: number;
  style?: React.CSSProperties;
  charStyle?: (i: number) => React.CSSProperties;
}> = ({ text, at, stagger = 2, style, charStyle }) => {
  const frame = useCurrentFrame();
  return (
    <span style={{ whiteSpace: "nowrap", ...style }}>
      {Array.from(text).map((ch, i) => {
        const p = ramp(frame, at + i * stagger, at + i * stagger + 10);
        return (
          <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 14}px)`, filter: `blur(${(1 - p) * 6}px)`, ...charStyle?.(i) }}>
            {ch === " " ? " " : ch}
          </span>
        );
      })}
    </span>
  );
};
