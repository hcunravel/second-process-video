import { AbsoluteFill } from "remotion";
import { night, serif } from "../../lib/brand";
import { Orb, textGlow } from "../agent-loop/fx";
import { plugPath, ToolIcon, type ToolName } from "./icons";
import { Person } from "./Person";

// 抖音要两张封面：竖版 3:4 给宫格，横版 4:3 给横屏推荐位。画面是第 22 句那一刻：整张工具网亮成暖色，人空着手站在旁边
// 字离边缘至少 8%，抖音会裁边

const Backdrop: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 60%, ${night.bgLift} 0%, ${night.bg} 72%)` }} />
);

const SeriesLabel: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={{ position: "absolute", fontSize: 44, fontWeight: 300, letterSpacing: "0.3em", color: night.light, textShadow: textGlow(0.5), whiteSpace: "nowrap", ...style }}>
    AI 到底怎么干活 · 第 2 集
  </div>
);

const Title: React.FC<{ style: React.CSSProperties; size: number }> = ({ style, size }) => (
  <div style={{ position: "absolute", fontSize: size, fontWeight: 400, letterSpacing: "0.06em", lineHeight: 1.35, whiteSpace: "nowrap", ...style }}>
    AI 最聪明的地方
    <br />
    是肯<span style={{ color: night.light, fontWeight: 600, textShadow: textGlow(1) }}>开口求人</span>
  </div>
);

const TOOLS: { name: ToolName; deg: number }[] = [
  { name: "wrench", deg: -40 },
  { name: "cloud", deg: -4 },
  { name: "arrow", deg: 32 },
  { name: "calendar", deg: -92 },
  { name: "ticket", deg: -140 },
  { name: "mail", deg: 80 },
];

// 一个光点、一圈 MCP、六个工具；人站在左下
const Network: React.FC<{ cx: number; cy: number; s: number; w: number; h: number }> = ({ cx, cy, s, w, h }) => {
  const ring = 110 * s;
  const reach = 330 * s;
  const icon = 76 * s;
  return (
    <>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <filter id="cg">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {TOOLS.map((t) => {
          const a = (t.deg * Math.PI) / 180;
          const p = { x: cx + (ring + 22 * s) * Math.cos(a), y: cy + (ring + 22 * s) * Math.sin(a) };
          const e = { x: cx + (reach - icon / 2 - 8) * Math.cos(a), y: cy + (reach - icon / 2 - 8) * Math.sin(a) };
          return (
            <g key={t.name}>
              <line x1={p.x} y1={p.y} x2={e.x} y2={e.y} stroke={night.light} strokeWidth={3} filter="url(#cg)" />
              <g transform={`translate(${p.x} ${p.y}) rotate(${t.deg + 180}) scale(${s})`}>
                <path d={plugPath("unified", 20)} fill={night.bg} stroke={night.light} strokeWidth={2.4} />
              </g>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={ring} fill="none" stroke={night.light} strokeWidth={3.5} filter="url(#cg)" />
        <g transform={`translate(${cx - 250 * s} ${cy + 175 * s}) scale(${s})`}>
          <Person x={0} y={0} phase={0.6} load={0} lean={3} alpha={1} />
        </g>
      </svg>
      {TOOLS.map((t) => {
        const a = (t.deg * Math.PI) / 180;
        return (
          <div key={t.name} style={{ position: "absolute", left: cx + reach * Math.cos(a) - icon / 2, top: cy + reach * Math.sin(a) - icon / 2 }}>
            <ToolIcon name={t.name} size={icon} warm={1} />
          </div>
        );
      })}
      <Orb x={cx} y={cy} size={44 * s} intensity={1.5} />
    </>
  );
};

// 竖版 3:4（1080×1440）
export const AgentToolsCover: React.FC = () => (
  <AbsoluteFill style={{ background: night.bg, fontFamily: serif, color: night.text }}>
    <Backdrop />
    <SeriesLabel style={{ left: 0, right: 0, top: 110, textAlign: "center" }} />
    <Title size={104} style={{ left: 0, right: 0, top: 220, textAlign: "center" }} />
    <Network cx={600} cy={960} s={1.05} w={1080} h={1440} />
  </AbsoluteFill>
);

// 横版 4:3（1440×1080）：左边标题，右边工具网
export const AgentToolsCoverWide: React.FC = () => (
  <AbsoluteFill style={{ background: night.bg, fontFamily: serif, color: night.text }}>
    <Backdrop />
    <SeriesLabel style={{ left: 110, top: 345, fontSize: 30 }} />
    <Title size={74} style={{ left: 110, top: 410 }} />
    <Network cx={1075} cy={520} s={0.9} w={1440} h={1080} />
  </AbsoluteFill>
);
