import { useCurrentFrame } from "remotion";
import { night, serif } from "../../lib/brand";
import { life, Orb, ramp, RevealText, tag, textGlow } from "../agent-loop/fx";
import type { Timeline } from "./timeline";

const thin: React.CSSProperties = { fontFamily: serif, fontWeight: 300, letterSpacing: "0.1em", color: night.text, whiteSpace: "nowrap" };
const center: React.CSSProperties = { position: "absolute", left: 0, right: 0, textAlign: "center" };

export const Hud: React.FC<{ tl: Timeline }> = ({ tl }) => (
  <>
    <TitleCard tl={tl} />
    <Question tl={tl} />
    <Outro tl={tl} />
  </>
);

// 第 9 句：纸条展开成标题卡
const TitleCard: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const s = tl.start(9);
  const e = tl.next(9);
  if (frame < s - 2 || frame > e + 8) return null;
  const open = ramp(frame, s, s + 10);
  const out = 1 - ramp(frame, e - 6, e + 4);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(7,9,15,0.55) 0%, rgba(7,9,15,0.92) 70%)", opacity: open }} />
      <div style={{ ...center, top: 300, transform: `scaleX(${0.2 + 0.8 * open})` }}>
        <div style={{ display: "inline-block", width: 900, height: 360, border: `2px solid ${night.light}`, borderRadius: 16, boxShadow: "0 0 30px rgba(255,138,31,0.35)", opacity: open }} />
      </div>
      <div style={{ ...center, top: 385 }}>
        <RevealText text="工具调用" at={s + 6} stagger={3} style={{ ...thin, fontSize: 150, fontWeight: 400, letterSpacing: "0.2em", textShadow: textGlow(0.5) }} />
      </div>
      <div style={{ ...center, top: 580, opacity: ramp(frame, s + 18, s + 28) }}>
        <span style={tag}>function calling</span>
      </div>
    </div>
  );
};

// 第 10 到 14 句：你问它的那句话，挂在画面上方
const Question: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const s = tl.start(10);
  const a = life(frame, s, tl.start(15), 10);
  if (a <= 0.01) return null;
  return (
    <div style={{ ...center, top: 70, opacity: a }}>
      <div style={{ display: "inline-block", border: "1.8px solid rgba(236,232,225,0.55)", borderRadius: 40, padding: "20px 54px", background: "rgba(16,21,33,0.8)" }}>
        <RevealText text="明天成都下雨吗？" at={s + 2} stagger={2} style={{ ...thin, fontSize: 60, fontWeight: 400 }} />
      </div>
      <div style={{ ...tag, marginTop: 14, opacity: ramp(frame, s + 16, s + 26) }}>you ask</div>
    </div>
  );
};

// 片尾：第二进程（和第 1 集同一张定版卡）
const Outro: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const s = tl.end;
  if (frame < s) return null;
  const draw = ramp(frame, s + 2, s + 34);
  const r = 70;
  const cx = 560;
  const cy = 470;
  const ang = -Math.PI / 2 + draw * 2 * Math.PI;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: ramp(frame, s, s + 8) }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={night.light} strokeWidth={3} strokeDasharray={`${draw * 2 * Math.PI * r} 9999`} transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <Orb x={cx + r * Math.cos(ang)} y={cy + r * Math.sin(ang)} size={24} />
      <div style={{ position: "absolute", left: 690, top: 395 }}>
        <RevealText text="第二进程" at={s + 4} stagger={3} style={{ ...thin, fontSize: 140, fontWeight: 500, letterSpacing: "0.18em" }} />
      </div>
      <div style={{ position: "absolute", left: 700, top: 590 }}>
        <RevealText text="AI 到底怎么干活 · 关注，下一集见" at={s + 16} stagger={1} style={{ ...thin, fontSize: 44, color: night.dim }} />
      </div>
    </div>
  );
};
