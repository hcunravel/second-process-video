import { AbsoluteFill } from "remotion";
import { night, serif } from "../../lib/brand";
import { glowShadow, Orb, textGlow } from "./fx";

// 抖音要两张封面：竖版 3:4 给宫格，横版 4:3 给横屏推荐位。都是暗场、一圈光轨、一个光点
// 字离边缘至少 8%，抖音会裁边，太靠边会被提示「文字展示不全」

const Backdrop: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, ${night.bgLift} 0%, ${night.bg} 72%)` }} />
);

const SeriesLabel: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={{ position: "absolute", fontSize: 44, fontWeight: 300, letterSpacing: "0.3em", color: night.light, textShadow: textGlow(0.5), whiteSpace: "nowrap", ...style }}>
    AI 到底怎么干活 · 第 1 集
  </div>
);

const Title: React.FC<{ style: React.CSSProperties; size: number }> = ({ style, size }) => (
  <div style={{ position: "absolute", fontSize: size, fontWeight: 400, letterSpacing: "0.08em", lineHeight: 1.3, whiteSpace: "nowrap", ...style }}>
    AI Agent
    <br />
    到底怎么<span style={{ color: night.light, fontWeight: 600, textShadow: textGlow(1) }}>干活</span>
  </div>
);

// 光轨走了 300°，光点停在「看」和「想」之间
const Ring: React.FC<{ cx: number; cy: number; r: number; w: number; h: number }> = ({ cx, cy, r, w, h }) => {
  const ang = (-90 + 300) * (Math.PI / 180);
  const node = r * 0.25;
  return (
    <>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <filter id="cg">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={2} strokeDasharray="2 10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={night.light} strokeWidth={4} strokeDasharray={`${(300 / 360) * 2 * Math.PI * r} 9999`} transform={`rotate(-90 ${cx} ${cy})`} filter="url(#cg)" />
      </svg>
      {[
        { deg: -90, t: "想" },
        { deg: 30, t: "做" },
        { deg: 150, t: "看" },
      ].map((s) => {
        const a = (s.deg * Math.PI) / 180;
        const on = s.t === "想";
        return (
          <div
            key={s.t}
            style={{
              position: "absolute",
              left: cx + r * Math.cos(a) - node,
              top: cy + r * Math.sin(a) - node,
              width: node * 2,
              height: node * 2,
              borderRadius: "50%",
              border: `3px solid ${on ? night.light : "rgba(236,232,225,0.4)"}`,
              background: night.bg,
              boxShadow: on ? glowShadow(0.7) : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: node * 0.95,
              fontWeight: on ? 500 : 300,
              color: on ? night.light : night.text,
            }}
          >
            {s.t}
          </div>
        );
      })}
      <Orb x={cx + r * Math.cos(ang)} y={cy + r * Math.sin(ang)} size={40} intensity={1.4} />
    </>
  );
};

// 竖版 3:4（1080×1440）
export const AgentLoopCover: React.FC = () => (
  <AbsoluteFill style={{ background: night.bg, fontFamily: serif, color: night.text }}>
    <Backdrop />
    <SeriesLabel style={{ left: 0, right: 0, top: 110, textAlign: "center" }} />
    <Title size={128} style={{ left: 0, right: 0, top: 230, textAlign: "center" }} />
    <Ring cx={540} cy={980} r={250} w={1080} h={1440} />
  </AbsoluteFill>
);

// 横版 4:3（1440×1080）：左边标题，右边光轨
export const AgentLoopCoverWide: React.FC = () => (
  <AbsoluteFill style={{ background: night.bg, fontFamily: serif, color: night.text }}>
    <Backdrop />
    <SeriesLabel style={{ left: 130, top: 290, fontSize: 34 }} />
    <Title size={104} style={{ left: 130, top: 370 }} />
    <Ring cx={1100} cy={560} r={200} w={1440} h={1080} />
  </AbsoluteFill>
);

// 合集封面 1:1（1080×1080）：整个系列共用，不写集数
export const SeriesCover: React.FC = () => (
  <AbsoluteFill style={{ background: night.bg, fontFamily: serif, color: night.text }}>
    <Backdrop />
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontSize: 40, fontWeight: 300, letterSpacing: "0.4em", color: night.light, textShadow: textGlow(0.5) }}>
      第二进程 · 合集
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 205, textAlign: "center", fontSize: 98, fontWeight: 400, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
      AI 到底怎么<span style={{ color: night.light, fontWeight: 600, textShadow: textGlow(1) }}>干活</span>
    </div>
    <Ring cx={540} cy={680} r={210} w={1080} h={1080} />
  </AbsoluteFill>
);
