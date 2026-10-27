import { random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { night, serif, springs } from "../../lib/brand";
import { glowShadow, life, Orb, ramp, RevealText, tag, textGlow, ThinIcon, useSpringAt } from "./fx";
import { timeline, type Timeline } from "./timeline";

// 屏幕层：不随镜头移动的字和画面
// 开场画圈的光点在钩子结束后变成一粒余烬，挂在画面上方，第 4 句飞回中央点燃成 Agent
const HOOK_ORB = { x: 1012, y: 500 };

const Ember: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = tl.start(2);
  const ignite = tl.at("ignite");
  if (frame < end - 4 || frame > ignite + 6) return null;
  const up = spring({ frame: frame - (end - 4), fps, config: springs.heavy });
  const home = spring({ frame: frame - (ignite - 14), fps, config: springs.card });
  const x = HOOK_ORB.x + (960 - HOOK_ORB.x) * up;
  const y = HOOK_ORB.y + (110 - HOOK_ORB.y) * up + (540 - 110) * home;
  const fade = 1 - ramp(frame, ignite, ignite + 6);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <Orb x={x} y={y} size={26 - 12 * up + 12 * home} intensity={0.55 + 0.1 * Math.sin(frame / 7) + 0.45 * home} />
    </div>
  );
};

// 第 4 句：光点点燃时的标题卡，两道光从两侧扫向中间
const TitleCard: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const s = tl.at("ignite") + 4;
  const vis = life(frame, s, tl.start(5) + 4, 10);
  if (vis <= 0) return null;
  const sweep = ramp(frame, s, s + 16);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: vis }}>
      <div style={{ position: "absolute", left: 0, top: 712, height: 2, width: 960 * sweep - 220, background: "linear-gradient(to right, rgba(255,138,31,0), rgba(255,138,31,0.9))", boxShadow: glowShadow(0.3) }} />
      <div style={{ position: "absolute", right: 0, top: 712, height: 2, width: 960 * sweep - 220, background: "linear-gradient(to left, rgba(107,184,255,0), rgba(107,184,255,0.9))" }} />
      <div style={{ ...center, top: 640 }}>
        <RevealText text="Agent" at={s + 2} stagger={3} style={{ ...thin, fontSize: 116, fontWeight: 400, letterSpacing: "0.32em" }} />
      </div>
      <div style={{ ...center, top: 790 }}>
        <RevealText text="会动手的 AI" at={s + 12} stagger={2} style={{ ...thin, fontSize: 44, color: night.dim, letterSpacing: "0.3em" }} />
        <div style={{ ...tag, marginTop: 14, opacity: ramp(frame, s + 20, s + 30) }}>think · act · observe</div>
      </div>
    </div>
  );
};
const thin: React.CSSProperties = { fontFamily: serif, fontWeight: 300, letterSpacing: "0.1em", color: night.text, whiteSpace: "nowrap" };
const center: React.CSSProperties = { position: "absolute", left: 0, right: 0, textAlign: "center" };

export const Hud: React.FC<{ tl: Timeline }> = ({ tl }) => (
  <>
    <Hook tl={tl} />
    <Ember tl={tl} />
    <Request tl={tl} />
    <TitleCard tl={tl} />
    <Claim tl={tl} />
    <Formula tl={tl} />
    <NextEpisode tl={tl} />
    <Outro tl={tl} />
  </>
);

// 镜头 1：AI 能帮你订机票 / 靠的不是更聪明 / 是「转圈」，光点绕着「转圈」画一圈
const Hook: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const end = tl.start(2);
  const out = 1 - ramp(frame, end - 6, end + 6);
  if (out <= 0) return null;
  const lineB = tl.atFrac(1, timeline.hook.lineB);
  const circleAt = tl.atFrac(1, timeline.hook.circle);
  const draw = ramp(frame, circleAt, end - 4);
  const r = 150;
  const cx = 960;
  const cy = 650;
  const ang = -Math.PI / 2 + draw * 2 * Math.PI;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <div style={{ ...center, top: 300 }}>
        <RevealText text="AI 能帮你订机票" at={8} stagger={3} style={{ ...thin, fontSize: 72 }} />
      </div>
      <div style={{ ...center, top: 420 }}>
        <RevealText text="靠的不是更聪明" at={lineB} stagger={3} style={{ ...thin, fontSize: 72, color: night.dim }} />
      </div>
      <div style={{ ...center, top: 590 }}>
        <RevealText
          text="是转圈"
          at={circleAt - 6}
          stagger={4}
          style={{ ...thin, fontSize: 104, fontWeight: 400 }}
          charStyle={(i) => (i > 0 ? { color: night.light, textShadow: textGlow(0.9), fontWeight: 500 } : { marginRight: 24 })}
        />
      </div>
      {draw > 0 && (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <filter id="hookGlow">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <circle cx={cx + 52} cy={cy} r={r} fill="none" stroke={night.light} strokeWidth={3} strokeDasharray={`${draw * 2 * Math.PI * r} 9999`} transform={`rotate(-90 ${cx + 52} ${cy})`} filter="url(#hookGlow)" />
          </svg>
          <Orb x={cx + 52 + r * Math.cos(ang)} y={cy + r * Math.sin(ang)} size={26} />
        </>
      )}
    </div>
  );
};

const REQUEST = "帮我找下周去成都最便宜的机票，再加进日历";
const REPLY = ["好的！找便宜机票有几个小建议：", "1. 提前两到三周预订", "2. 多个平台比比价", "3. 留意早班和红眼航班"];

// 镜头 2–3：打出请求；普通 AI 回一段灰字，然后这段字像灰一样散掉
const Request: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const s2 = tl.start(2);
  const s3 = tl.start(3);
  const s4 = tl.start(4);
  const lift = useSpringAt(s3, "card");
  const out = 1 - ramp(frame, s4, s4 + 10);
  if (frame < s2 - 4 || out <= 0) return null;
  const from = tl.atFrac(2, timeline.typing.from);
  const to = tl.atFrac(2, timeline.typing.to);
  const typed = Math.floor(REQUEST.length * ramp(frame, from, to));
  const caretOn = Math.floor(frame / 12) % 2 === 0;
  const dissolveAt = tl.atFrac(3, timeline.dissolve.frac);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out * ramp(frame, s2 - 4, s2 + 6) }}>
      <div style={{ ...center, top: 360 - lift * 150, opacity: 1 - 0.45 * lift }}>
        <div style={{ ...thin, fontSize: 40, color: night.dim, marginBottom: 22 }}>你 → AI</div>
        <div style={{ ...thin, fontSize: 62, display: "inline-flex", alignItems: "center" }}>
          {REQUEST.slice(0, typed)}
          <span style={{ width: 4, height: 66, marginLeft: 8, background: night.light, boxShadow: glowShadow(0.5), opacity: caretOn || typed < REQUEST.length ? 1 : 0 }} />
        </div>
      </div>
      {frame >= s3 &&
        REPLY.map((line, li) => (
          <div key={line} style={{ ...center, top: 450 + li * 78 }}>
            <Ash text={line} at={s3 + 6 + li * 5} dissolveAt={dissolveAt + li * 3} />
          </div>
        ))}
    </div>
  );
};

const Ash: React.FC<{ text: string; at: number; dissolveAt: number }> = ({ text, at, dissolveAt }) => {
  const frame = useCurrentFrame();
  const inP = ramp(frame, at, at + 8);
  return (
    <span style={{ ...thin, fontSize: 48, color: "#5E6573", letterSpacing: "0.06em" }}>
      {Array.from(text).map((ch, i) => {
        const d = dissolveAt + Math.floor(random(`ash${text}${i}`) * 14);
        const f = ramp(frame, d, d + 18);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: inP * (1 - f),
              transform: `translate(${(random(`ax${text}${i}`) - 0.5) * 60 * f}px, ${-90 * f - 40 * random(`ay${text}${i}`) * f}px)`,
              filter: `blur(${f * 4}px)`,
            }}
          >
            {ch === " " ? " " : ch}
          </span>
        );
      })}
    </span>
  );
};

// 镜头 11：Agent ≠ 更聪明的大模型，「更聪明的」被一道光划掉
const Claim: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const s = tl.start(11);
  const vis = life(frame, s + 2, tl.start(12) - 8, 8);
  if (vis <= 0) return null;
  const strike = ramp(frame, tl.at("strike"), tl.at("strike") + 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: vis }}>
      <div style={{ ...center, top: 330 }}>
        <RevealText text="Agent" at={s + 2} stagger={3} style={{ ...thin, fontSize: 96, fontWeight: 400, letterSpacing: "0.2em" }} />
      </div>
      <div style={{ ...center, top: 490 }}>
        <span style={{ ...thin, fontSize: 92 }}>
          ≠{" "}
          <span style={{ position: "relative", color: strike > 0.5 ? night.dim : night.text }}>
            更聪明的
            <span style={{ position: "absolute", left: -8, top: "54%", height: 5, width: `calc(${strike * 100}% + 16px)`, background: night.light, boxShadow: glowShadow(0.6) }} />
          </span>
          大模型
        </span>
      </div>
    </div>
  );
};

// 镜头 12：右侧写出「大模型 + 循环」，左边的轨道正在转
const Formula: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const s = tl.start(12);
  const vis = life(frame, s, tl.start(13), 10);
  if (vis <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 1180, top: 300, opacity: vis, display: "flex", flexDirection: "column", gap: 18 }}>
      <RevealText text="大模型" at={s + 2} stagger={3} style={{ ...thin, fontSize: 104 }} />
      <RevealText text="＋" at={s + 10} style={{ ...thin, fontSize: 80, color: night.dim, paddingLeft: 12 }} />
      <RevealText text="循环" at={s + 16} stagger={4} style={{ ...thin, fontSize: 104, fontWeight: 500, color: night.light, textShadow: textGlow(0.9) }} />
    </div>
  );
};

const NEXT_TOOLS = ["search", "calendar", "browser"] as const;

// 镜头 15：下一集预告
const NextEpisode: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const s = tl.start(15);
  const vis = life(frame, s + 6, tl.end - 8, 8);
  if (vis <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: vis }}>
      <div style={{ position: "absolute", left: 200, top: 300 }}>
        <RevealText text="下一集" at={s + 6} stagger={3} style={{ ...thin, fontSize: 48, color: night.light, letterSpacing: "0.3em" }} />
        <div style={{ marginTop: 30 }}>
          <RevealText text="它手里的工具" at={s + 12} stagger={3} style={{ ...thin, fontSize: 108 }} />
        </div>
        <div style={{ marginTop: 18 }}>
          <RevealText text="到底是什么" at={s + 30} stagger={3} style={{ ...thin, fontSize: 108, color: night.dim }} />
        </div>
      </div>
      {NEXT_TOOLS.map((n, i) => {
        const lit = ramp(frame, s + 20 + i * 10, s + 28 + i * 10);
        return (
          <div
            key={n}
            style={{
              position: "absolute",
              left: 1220 + i * 190,
              top: 440,
              width: 160,
              height: 160,
              borderRadius: "50%",
              border: `2px solid ${lit > 0.5 ? night.light : "rgba(236,232,225,0.2)"}`,
              boxShadow: lit > 0.05 ? glowShadow(0.6 * lit) : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ThinIcon name={n} size={92} lit={lit} />
          </div>
        );
      })}
    </div>
  );
};

// 片尾：第二进程。光点在名字左边画一圈后停住
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
