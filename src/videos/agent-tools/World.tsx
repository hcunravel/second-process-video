import { Easing, spring, useCurrentFrame } from "remotion";
import { night, serif } from "../../lib/brand";
import { life, Orb, ramp, tag } from "../agent-loop/fx";
import { plugPath, ToolIcon, type PlugShape, type ToolName } from "./icons";
import { headTop, Person } from "./Person";
import type { EventId, Timeline } from "./timeline";

// 世界坐标：光点歇脚的地方是原点。ANCHOR 是原点默认落在画面上的位置，底部 180px 留给主文字
const ANCHOR = { x: 960, y: 470 };
const SLOPE_DEG = -24;
const U = { x: Math.cos((SLOPE_DEG * Math.PI) / 180), y: Math.sin((SLOPE_DEG * Math.PI) / 180) };
const onSlope = (t: number) => ({ x: U.x * t, y: U.y * t });
const SLOPE_END = 430;
const R_TOOL = 640;
const R_RING = 150;
const R_PLUG = 250;
const ICON = 104;
const BOX = 56;

const TOOLS: { name: ToolName; deg: number; plug: PlugShape; r?: number }[] = [
  { name: "wrench", deg: -40, plug: "square" },
  { name: "cloud", deg: -6, plug: "circle" },
  { name: "arrow", deg: 28, plug: "triangle" },
  { name: "calendar", deg: -96, plug: "diamond", r: 560 },
  { name: "ticket", deg: -148, plug: "hex" },
  { name: "map", deg: 172, plug: "cross" },
  { name: "mail", deg: 118, plug: "pill" },
];
const polar = (deg: number, r: number) => ({ x: r * Math.cos((deg * Math.PI) / 180), y: r * Math.sin((deg * Math.PI) / 180) });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const CAM_SPRING = { mass: 1, stiffness: 55, damping: 16 };
const FLY_SPRING = { mass: 1, stiffness: 120, damping: 20 };

export const World: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const { start: L, at, fps } = tl;
  const sp = (from: number, config = FLY_SPRING) => spring({ frame: frame - from, fps, config });
  const S1 = ["box1", "box2", "box3"] as EventId[];
  const HANDS = ["hand1", "hand2", "hand3", "hand4", "hand5"] as EventId[];
  const PLUGS = ["plug1", "plug2", "plug3", "plug4", "plug5", "plug6", "plug7"] as EventId[];

  // ---- 开场一步一顿地爬到原点，之后光点一直停在原点 ----
  const settle = at("settle");
  const steps = Array.from({ length: 6 }, (_, k) => sp(k * 13, { mass: 1, stiffness: 180, damping: 14 })).reduce((a, b) => a + b, 0);
  const climb = -90 + (90 * Math.min(6, steps)) / 6;
  const P = onSlope(Math.min(climb, 0));

  // ---- 人：第 1 到 5 句是人在扛，第 6 句淡出、原地亮起光点（AI 也一样）；第 20 句人回到网旁边，方块分给工具，第 22 句直起腰放下手，接着就是片尾 ----
  const cutAt = at("cut");
  const leanA = 14 - 6 * ramp(frame, settle, settle + 12);
  const personA = { phase: (Math.min(climb, 0) + 90) * 0.09, alpha: 1 - ramp(frame, cutAt, cutAt + 14) };
  const head = headTop(leanA);
  const chest = { x: P.x + head.x * 0.55, y: P.y - 150 };
  const relief = Easing.inOut(Easing.cubic)(ramp(frame, at("climax"), at("summit") + 6));
  const PB = onSlope(-330 + 50 * relief);
  const leanB = 14 - 12 * relief;
  const headB = headTop(leanB);
  const personB = { phase: 50 * relief * 0.09, load: 1 - relief, alpha: ramp(frame, at("stack") - 12, at("stack") + 2) };
  const orbOn = ramp(frame, cutAt, cutAt + 8);
  const orbFlash = frame < cutAt ? 1 : ramp(frame, cutAt, cutAt + 22);
  const orbDrop = Easing.inOut(Easing.cubic)(ramp(frame, cutAt + 8, cutAt + 34));

  // ---- 镜头：每个关键帧叠一个慢弹簧 ----
  const top = onSlope(SLOPE_END);
  const keys = [
    { at: 0, x: -60, y: -230, z: 1.25 },
    { at: L(2), x: 180, y: -160, z: 0.95 },
    { at: L(3), x: 260, y: -120, z: 0.85 },
    { at: L(4), x: 290, y: -80, z: 0.78 },
    { at: L(6), x: -40, y: -90, z: 1.55 },
    { at: L(8), x: 0, y: -140, z: 1.4 },
    { at: L(10), x: 250, y: -220, z: 1.0 },
    { at: at("send"), x: 360, y: -190, z: 0.95 },
    { at: L(14), x: 120, y: -210, z: 1.0 },
    { at: L(15), x: 120, y: -40, z: 0.85 },
    { at: L(16), x: 0, y: 60, z: 0.7 },
    { at: L(18), x: 0, y: 0, z: 1.05 },
    { at: L(19), x: 0, y: 60, z: 0.7 },
    { at: L(20), x: -140, y: 60, z: 0.7 },
    { at: L(22), x: -100, y: 60, z: 0.72 },
  ];
  const cam = { ...keys[0] };
  for (let i = 1; i < keys.length; i++) {
    const s = spring({ frame: frame - keys[i].at, fps, config: CAM_SPRING });
    cam.x += (keys[i].x - keys[i - 1].x) * s;
    cam.y += (keys[i].y - keys[i - 1].y) * s;
    cam.z += (keys[i].z - keys[i - 1].z) * s;
  }
  cam.x += 10 * Math.sin(frame / 95);
  cam.y += 7 * Math.cos(frame / 120);

  // ---- 各段的可见度 ----
  const slopeOn = (1 - ramp(frame, L(6), L(6) + 15)) + ramp(frame, L(20), L(20) + 20);
  const cut = at("cut");
  const netOn = ramp(frame, L(16), L(16) + 12);
  const climax = ramp(frame, at("climax"), at("climax") + 12);
  const plugged = PLUGS.map((id) => sp(at(id), { mass: 1, stiffness: 400, damping: 30 }));
  const tangle = ramp(frame, L(17), L(17) + 10);

  // 工具图标：前三个开场被叫到；后四个在第 7 句凑近一下，第 16 句正式出场
  const tools = TOOLS.map((t, i) => {
    const far = polar(t.deg, t.r ?? R_TOOL);
    let pos = far;
    let alpha = 0;
    let lit = 0;
    if (i < 3) {
      const beam = at((["beam1", "beam2", "beam3"] as EventId[])[i]);
      alpha = sp(beam - 4, { mass: 1, stiffness: 225, damping: 22 });
      lit = ramp(frame, at((["tool1", "tool2", "tool3"] as EventId[])[i]), at((["tool1", "tool2", "tool3"] as EventId[])[i]) + 6) * (1 - ramp(frame, cut, cut + 8));
      // 第 6 到 9 句退成灰色；第 10 到 15 句只留天气
      alpha *= 1 - 0.45 * ramp(frame, cut, cut + 10) * (1 - ramp(frame, L(10), L(10) + 10));
      // 扳手和导航第 6 句起整个藏掉，留在角上像漏删的元素；第 16 句再出来
      if (i !== 1) alpha *= 1 - ramp(frame, cut, cut + 12) * (1 - ramp(frame, L(16), L(16) + 10));
      if (i === 1) lit = Math.max(lit, ramp(frame, at("arrive"), at("arrive") + 6) * (1 - ramp(frame, L(16), L(16) + 10)));
    } else {
      const near = polar(t.deg + 40 * ramp(frame, L(7), L(8)), 290);
      const visit = i === 3 || i === 4 ? life(frame, at("orbit"), L(8) - 6, 12) : 0;
      const enter = sp(at("spawn") + (i - 3) * 5, { mass: 1, stiffness: 225, damping: 22 });
      pos = visit > 0.01 && frame < L(9) ? { x: lerp(far.x, near.x, visit), y: lerp(far.y, near.y, visit) } : far;
      alpha = Math.max(visit * 0.7, enter);
    }
    if (frame >= L(16)) alpha = Math.max(alpha, i < 3 ? 1 : alpha);
    lit = Math.max(lit, frame >= L(19) ? plugged[i] : 0);
    return { ...t, pos, alpha, lit, warm: climax };
  });

  // ---- 方块：开场三块飞给三个工具，第 20 到 21 句五块分给五个工具 ----
  const restS1 = 5 - S1.filter((id) => frame >= at(id)).length;
  const stackS6 = sp(at("stack"), { mass: 1, stiffness: 225, damping: 22 });
  const restS6 = 5 - HANDS.filter((id) => frame >= at(id)).length;
  const inS6 = frame >= at("stack");
  const shake = inS6 ? (0.5 * restS6) / 5 : (restS1 / 5) * (1 - ramp(frame, settle, settle + 10));
  const rot = shake * 6 * Math.sin(frame / 4.3);
  const slot = (k: number) => {
    // 方块摞在人的头顶：开场是爬坡的人，第 20 句起是网旁边的人
    const base = inS6 ? PB : P;
    const h = inS6 ? headB : head;
    const lx = h.x;
    const ly = h.y - BOX / 2 - 4 - k * (BOX + 8);
    const r = (rot * Math.PI) / 180;
    return { x: base.x + lx * Math.cos(r) - ly * Math.sin(r), y: base.y + lx * Math.sin(r) + ly * Math.cos(r) };
  };
  type Box = { x: number; y: number; scale: number; alpha: number };
  const boxes: Box[] = [];
  for (let k = 0; k < 5; k++) {
    // 开场：上面三块按顺序飞走
    const flyIdx = 4 - k;
    let b: Box;
    if (!inS6) {
      const s0 = slot(k);
      if (flyIdx < 3 && frame >= at(S1[flyIdx])) {
        const p = sp(at(S1[flyIdx]));
        const to = tools[flyIdx].pos;
        b = {
          x: lerp(s0.x, to.x, p),
          y: lerp(s0.y, to.y, p) - Math.sin(Math.PI * Math.min(1, p)) * 90,
          scale: 1 - 0.5 * p,
          alpha: 1 - ramp(p, 0.8, 1),
        };
      } else {
        b = { ...s0, scale: 1, alpha: 1 - ramp(frame, cut, cut + 12) };
      }
    } else {
      const s0 = slot(k);
      const hand = HANDS[4 - k];
      const p = frame >= at(hand) ? sp(at(hand)) : 0;
      const to = tools[4 - k].pos;
      b = {
        x: lerp(s0.x, to.x, p),
        y: lerp(s0.y, to.y, p) - Math.sin(Math.PI * Math.min(1, p)) * 70,
        scale: stackS6 * (1 - 0.5 * p),
        alpha: Math.min(1, stackS6) * (1 - ramp(p, 0.8, 1)),
      };
    }
    boxes.push(b);
  }

  // ---- 纸条 ----
  const home = { x: P.x - 20, y: P.y - 290 };
  const noteDraw = ramp(frame, at("note"), at("note") + 30);
  const hideForTitle = ramp(frame, L(9), L(9) + 6) * (1 - ramp(frame, L(10) - 4, L(10) + 4));
  const send = frame >= at("send") ? sp(at("send"), { mass: 1, stiffness: 70, damping: 18 }) : 0;
  const cloud = tools[1].pos;
  const note = {
    x: lerp(home.x, cloud.x - 20, send),
    y: lerp(home.y, cloud.y, send) - Math.sin(Math.PI * Math.min(1, send)) * 120,
    scale: 1 - 0.65 * send,
    alpha: noteDraw > 0 ? (1 - hideForTitle) * (1 - ramp(frame, at("arrive") - 4, at("arrive") + 2)) : 0,
  };
  const back = frame >= at("reply") ? sp(at("reply"), { mass: 1, stiffness: 70, damping: 18 }) : 0;
  const reply = {
    x: lerp(cloud.x, home.x, back),
    y: lerp(cloud.y, home.y, back) - Math.sin(Math.PI * Math.min(1, back)) * 120,
    scale: 0.45 + 0.55 * back,
    alpha: ramp(frame, at("reply"), at("reply") + 6) * (1 - ramp(frame, L(16), L(16) + 10)),
  };

  const orbPulse = 1 + 0.5 * life(frame, at("read"), at("read") + 14, 6) + 0.6 * climax;
  const W = 450;
  const H = 250;

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: serif, opacity: 1 - ramp(frame, tl.end - 6, tl.end + 4) }}>
      <div style={{ position: "absolute", left: ANCHOR.x, top: ANCHOR.y, transform: `scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)`, transformOrigin: "0 0" }}>
        <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <filter id="tglow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="slope" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="rgba(236,232,225,0)" />
              <stop offset="0.55" stopColor="rgba(236,232,225,0.32)" />
              <stop offset="1" stopColor="rgba(236,232,225,0.5)" />
            </linearGradient>
          </defs>

          {/* 坡 */}
          <g opacity={Math.min(1, slopeOn)}>
            <line x1={U.x * -1500} y1={U.y * -1500} x2={top.x} y2={top.y} stroke="url(#slope)" strokeWidth={2} />
          </g>

          <Person x={P.x} y={P.y} phase={personA.phase} load={1} lean={leanA} alpha={personA.alpha} />
          <Person x={PB.x} y={PB.y} phase={personB.phase} load={personB.load} lean={leanB} alpha={personB.alpha} />

          {/* 开场三条光线：叫工具来帮忙 */}
          {[0, 1, 2].map((i) => {
            const b = at((["beam1", "beam2", "beam3"] as EventId[])[i]);
            const draw = ramp(frame, b, b + 10);
            const to = tools[i].pos;
            const len = Math.hypot(to.x - chest.x, to.y - chest.y) - ICON / 2;
            const gone = ramp(frame, cut, cut + 10);
            if (draw <= 0 || gone >= 1) return null;
            return (
              <line
                key={i}
                x1={chest.x}
                y1={chest.y}
                x2={chest.x + ((to.x - chest.x) * len) / (len + ICON / 2)}
                y2={chest.y + ((to.y - chest.y) * len) / (len + ICON / 2)}
                stroke={night.cool}
                strokeWidth={2.2}
                strokeDasharray={gone > 0 ? `${len * (1 - gone) * 0.2} 18` : `${draw * len} 9999`}
                opacity={0.85 * (1 - gone)}
                filter="url(#tglow)"
              />
            );
          })}

          {/* 纸条飞去天气工具的路线 */}
          <line
            x1={home.x}
            y1={home.y}
            x2={cloud.x - ICON / 2}
            y2={cloud.y}
            stroke={night.cool}
            strokeWidth={1.6}
            strokeDasharray="6 10"
            opacity={0.5 * life(frame, at("send") - 6, L(15), 8)}
          />

          {/* 原地的虚线圈 */}
          <ellipse cx={P.x} cy={P.y + 6} rx={80} ry={26} fill="none" stroke={night.cool} strokeWidth={1.6} strokeDasharray="5 9" opacity={0.75 * life(frame, at("ground"), L(16), 10)} />

          {/* 工具网：连线和接头 */}
          {netOn > 0 &&
            tools.map((t, i) => {
              const d = (t.deg * Math.PI) / 180;
              const pl = plugged[i];
              const r = lerp(R_PLUG, R_RING + 30, pl);
              const plug = { x: P.x + r * Math.cos(d), y: P.y + r * Math.sin(d) };
              const end = { x: t.pos.x - (ICON / 2 + 10) * Math.cos(d), y: t.pos.y - (ICON / 2 + 10) * Math.sin(d) };
              const amp = (18 + 70 * tangle) * (1 - pl);
              const mid = { x: (plug.x + end.x) / 2, y: (plug.y + end.y) / 2 };
              const wob = amp * Math.sin(frame / 5 + i * 1.7);
              const ctrl = { x: mid.x - Math.sin(d) * wob, y: mid.y + Math.cos(d) * wob };
              const enter = i < 3 ? 1 : sp(at("spawn") + (i - 3) * 5, { mass: 1, stiffness: 225, damping: 22 });
              const stroke = climax > 0.5 ? night.light : pl > 0.5 ? night.cool : "rgba(236,232,225,0.32)";
              const click = life(frame, at(PLUGS[i]) + 4, at(PLUGS[i]) + 12, 3);
              return (
                <g key={i} opacity={netOn * enter}>
                  <path d={`M${plug.x} ${plug.y} Q${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`} fill="none" stroke={stroke} strokeWidth={climax > 0.5 ? 2.6 : 1.8} opacity={pl > 0.5 ? 0.9 : 0.8} filter={pl > 0.5 ? "url(#tglow)" : undefined} />
                  <g transform={`translate(${plug.x} ${plug.y}) rotate(${t.deg + 180})`}>
                    <path d={plugPath(t.plug, 22)} fill={night.bg} stroke="rgba(236,232,225,0.7)" strokeWidth={1.8} opacity={1 - pl} />
                    <path d={plugPath("unified", 22)} fill={night.bg} stroke={climax > 0.5 ? night.light : night.cool} strokeWidth={2} opacity={pl} />
                  </g>
                  <circle cx={P.x + (R_RING + 4) * Math.cos(d)} cy={P.y + (R_RING + 4) * Math.sin(d)} r={10 + 30 * click} fill="none" stroke={night.cool} strokeWidth={2} opacity={click * (1 - climax)} />
                </g>
              );
            })}

          {/* MCP 圆环 */}
          {frame >= at("ring") && (
            <circle
              cx={P.x}
              cy={P.y}
              r={R_RING}
              fill="none"
              stroke={climax > 0.5 ? night.light : night.cool}
              strokeWidth={2.4}
              strokeDasharray={`${ramp(frame, at("ring"), at("ring") + 24) * 2 * Math.PI * R_RING} 9999`}
              transform={`rotate(-90 ${P.x} ${P.y})`}
              filter="url(#tglow)"
            />
          )}
        </svg>

        {/* MCP 标注 */}
        <div style={{ position: "absolute", left: P.x, top: P.y + 44, transform: "translateX(-50%)", textAlign: "center", opacity: ramp(frame, at("ring") + 10, at("ring") + 22) * (1 - ramp(frame, L(20), L(20) + 12)) }}>
          <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 400, letterSpacing: "0.24em", color: night.cool, paddingLeft: "0.24em" }}>MCP</div>
        </div>

        {/* 工具图标 */}
        {tools.map((t, i) =>
          t.alpha > 0.01 ? (
            <div key={i} style={{ position: "absolute", left: t.pos.x, top: t.pos.y, transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * Math.min(1, t.alpha)})`, opacity: Math.min(1, t.alpha) }}>
              <ToolIcon name={t.name} size={ICON} lit={t.lit} warm={t.warm} />
            </div>
          ) : null,
        )}

        {/* 没有指针的钟 */}
        <Clock x={P.x - 230} y={P.y - 70} alpha={life(frame, at("clock"), L(8) + 6, 10)} />

        {/* 方块 */}
        {boxes.map((b, k) =>
          b.alpha > 0.01 ? (
            <div
              key={k}
              style={{
                position: "absolute",
                left: b.x,
                top: b.y,
                width: BOX,
                height: BOX,
                border: "1.8px solid rgba(236,232,225,0.72)",
                borderRadius: 4,
                background: "rgba(16,21,33,0.9)",
                transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${b.scale})`,
                opacity: b.alpha,
              }}
            />
          ) : null,
        )}

        {/* 纸条 */}
        {note.alpha > 0.01 && (
          <div style={{ position: "absolute", left: note.x, top: note.y, width: W, height: H, transform: `translate(-50%, -50%) scale(${note.scale})`, opacity: note.alpha }}>
            <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <rect x={1} y={1} width={W - 2} height={H - 2} rx={10} fill="rgba(16,21,33,0.85)" stroke={night.light} strokeWidth={2} strokeDasharray={`${noteDraw * 2 * (W + H)} 9999`} filter="url(#tglow)" />
              {[0, 1, 2].map((r) => (
                <line key={r} x1={42} y1={74 + r * 56} x2={42 + (W - 84 - r * 70) * ramp(frame, at("note") + 22 + r * 5, at("note") + 34 + r * 5)} y2={74 + r * 56} stroke="rgba(255,138,31,0.45)" strokeWidth={2} opacity={1 - ramp(frame, at("write") - 4, at("write") + 4)} />
              ))}
            </svg>
            <div style={{ position: "absolute", left: 42, top: 34, fontSize: 52, fontWeight: 400, color: night.text, lineHeight: 1.5, letterSpacing: "0.06em" }}>
              <div style={{ opacity: ramp(frame, at("write"), at("write") + 8) }}>
                找：<span style={{ color: night.light }}>天气</span>
              </div>
              <div style={{ opacity: ramp(frame, at("fill"), at("fill") + 8) }}>
                问：<span style={{ color: night.light }}>成都，明天</span>
              </div>
            </div>
            <div style={{ ...tag, position: "absolute", left: 36, bottom: -40, textTransform: "none", letterSpacing: "0.12em", opacity: 0.9 * ramp(frame, at("fill") + 12, at("fill") + 22) }}>get_weather(city, date)</div>
          </div>
        )}

        {/* 回信 */}
        {reply.alpha > 0.01 && (
          <div
            style={{
              position: "absolute",
              left: reply.x,
              top: reply.y,
              transform: `translate(-50%, -50%) scale(${reply.scale})`,
              opacity: reply.alpha,
              border: `2px solid ${night.cool}`,
              borderRadius: 10,
              background: "rgba(16,21,33,0.9)",
              padding: "26px 40px",
              fontSize: 50,
              color: night.text,
              whiteSpace: "nowrap",
              boxShadow: "0 0 24px rgba(107,184,255,0.35)",
            }}
          >
            明天 · <span style={{ color: night.cool }}>有雨</span>
          </div>
        )}

        {/* 第 6 句光点从人的胸口亮起，再落到人原来站的地方 */}
        <Orb x={lerp(chest.x, P.x, orbDrop)} y={lerp(chest.y, P.y, orbDrop)} size={40} intensity={orbPulse * orbOn} flash={orbFlash} />
      </div>
    </div>
  );
};

// 只有表盘刻度、没有指针的钟：它不知道现在几点
const Clock: React.FC<{ x: number; y: number; alpha: number }> = ({ x, y, alpha }) => {
  if (alpha <= 0.01) return null;
  const r = 66;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: alpha, transform: "translate(-50%, -50%)" }}>
      <svg width={2 * r + 4} height={2 * r + 4} viewBox={`${-r - 2} ${-r - 2} ${2 * r + 4} ${2 * r + 4}`}>
        <circle r={r} fill="none" stroke="rgba(236,232,225,0.6)" strokeWidth={1.6} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          const r1 = i % 3 === 0 ? r - 14 : r - 8;
          return <line key={i} x1={r1 * Math.cos(a)} y1={r1 * Math.sin(a)} x2={(r - 3) * Math.cos(a)} y2={(r - 3) * Math.sin(a)} stroke="rgba(236,232,225,0.6)" strokeWidth={1.4} />;
        })}
        <circle r={3} fill="rgba(236,232,225,0.6)" />
      </svg>
      <div style={{ ...tag, position: "absolute", left: "50%", top: 2 * r + 18, transform: "translateX(-50%)" }}>--:--</div>
    </div>
  );
};
