import { Easing, random, spring, useCurrentFrame } from "remotion";
import { night, serif } from "../../lib/brand";
import { coolShadow, glowShadow, life, Orb, ramp, RevealText, tag, textGlow, ThinIcon, useSpringAt, useSpringSum, type IconName } from "./fx";
import type { Timeline } from "./timeline";

// 世界坐标：轨道圆心在原点。镜头决定哪一块出现在画面中央
const R = 300;
const STATIONS = [
  { deg: -90, label: "想", en: "think" },
  { deg: 30, label: "做", en: "act" },
  { deg: 150, label: "看", en: "observe" },
];
const polar = (deg: number, r = R) => ({ x: r * Math.cos((deg * Math.PI) / 180), y: r * Math.sin((deg * Math.PI) / 180) });
const TOOLS: Record<IconName, { x: number; y: number }> = {
  search: { x: 860, y: 120 },
  calendar: { x: 780, y: -430 },
  browser: { x: -860, y: -340 },
};
const TOOL_R = 105;
const CAM_SPRING = { mass: 1, stiffness: 55, damping: 16 };

export const World: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const { start, at, atFrac, dur, fps } = tl;
  const ignite = at("ignite");

  // 光点在轨道上的位置：以「站」为单位，3 = 回到「想」
  const moves = useSpringSum([at("move1"), at("move2"), at("move3"), at("move4"), at("move5")], "card");
  const lap = 3 * Easing.inOut(Easing.cubic)(ramp(frame, start(12), start(13) - 4));
  const keyTimes = [0, 1, 2, 3].map((k) => Math.round(start(13) + (k * dur(13)) / 4));
  const keySteps = useSpringSum(keyTimes.slice(1), "card");
  const drift = frame > start(14) ? ((frame - start(14)) / fps) * 1.2 : 0;
  const p = moves + lap + keySteps + drift;
  const orbPos = polar(-90 + 120 * p);
  const nearest = Math.round(p);
  const onStation = Math.abs(p - nearest) < 0.18;
  const activeStation = onStation ? ((nearest % 3) + 3) % 3 : -1;

  // 镜头：每个关键帧叠一个慢弹簧，镜头连续地在世界里移动
  const keys = [
    { at: ignite, x: 0, y: -300, z: 2.4 },
    { at: start(5) - 4, x: 0, y: -40, z: 1.0 },
    { at: start(5) + 6, x: -20, y: -60, z: 0.95 },
    { at: start(6), x: 460, y: 50, z: 0.95 },
    { at: atFrac(7, 0.05), x: -300, y: 110, z: 0.92 },
    { at: start(8), x: -40, y: -70, z: 0.95 },
    { at: start(9), x: 420, y: -120, z: 0.9 },
    { at: start(10), x: 110, y: -110, z: 0.8 },
    { at: start(11), x: 0, y: 0, z: 0.42 },
    { at: start(12), x: 430, y: 20, z: 1.05 },
    { at: start(13), x: 40, y: 10, z: 1.05 },
    { at: start(14), x: 0, y: 60, z: 0.3 },
  ];
  const cam = { x: keys[0].x, y: keys[0].y, z: keys[0].z };
  for (let i = 1; i < keys.length; i++) {
    const s = spring({ frame: frame - keys[i].at, fps, config: CAM_SPRING });
    cam.x += (keys[i].x - keys[i - 1].x) * s;
    cam.y += (keys[i].y - keys[i - 1].y) * s;
    cam.z += (keys[i].z - keys[i - 1].z) * s;
  }
  cam.x += 12 * Math.sin(frame / 95);
  cam.y += 8 * Math.cos(frame / 120);

  const fadeIn = ramp(frame, ignite, ignite + 14);
  const fadeOut = 1 - ramp(frame, start(15), start(15) + 14);
  const dimForClaim = ramp(frame, start(11), start(11) + 12) * (1 - ramp(frame, start(12), start(12) + 12));
  const toolsAlive = 1 - ramp(frame, start(11), start(11) + 14);
  const flash = ramp(frame, ignite, ignite + 22);

  const trail1 = Math.min(Math.max(p, 0), 3) / 3;
  const trail2 = Math.min(Math.max(p - 3, 0), 3) / 3;
  const C = 2 * Math.PI * R;
  if (frame < ignite - 2) return null;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeIn * fadeOut * (1 - 0.7 * dimForClaim), fontFamily: serif }}>
      <div style={{ position: "absolute", left: 960, top: 540, transform: `scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)`, transformOrigin: "0 0" }}>
        <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={2} strokeDasharray="2 10" />
          <circle r={R} fill="none" stroke={night.light} strokeOpacity={0.45} strokeWidth={3} strokeDasharray={`${trail1 * C} ${C}`} transform="rotate(-90)" filter="url(#glow)" />
          <circle r={R} fill="none" stroke={night.light} strokeWidth={4} strokeDasharray={`${trail2 * C} ${C}`} transform="rotate(-90)" filter="url(#glow)" />
          <Beam from={polar(30)} to={TOOLS.search} at={at("beam1")} until={start(7)} label="search_flights(成都, 下周)" />
          <Beam from={polar(30)} to={TOOLS.calendar} at={at("beam2")} until={start(10)} label="calendar.add(周二 08:00)" />
        </svg>

        {STATIONS.map((s, i) => (
          <Station key={s.label} index={i} active={activeStation === i} label={stationLabel(i, frame, keyTimes)} keyLine={frame >= keyTimes[0]} labelIn={ramp(frame, start(5) - 12, start(5))} />
        ))}

        <div style={{ position: "absolute", left: -560, top: -360, ...tag, opacity: toolsAlive * ramp(frame, start(5), start(5) + 12) }}>
          loop {p >= 2.82 ? "02" : "01"} · {Math.min(Math.round(p), 6)}/6
        </div>
        <div style={{ opacity: toolsAlive }}>
          <Tool name="search" lit={life(frame, at("tool1"), start(8), 12)} appear={ignite + 18} />
          <Tool name="calendar" lit={life(frame, at("event"), start(11), 12)} appear={ignite + 24} />
          <Tool name="browser" lit={0} appear={ignite + 30} />
          <Thought text="查机票，要先去搜" at={at("think1")} until={start(6)} />
          <Thought text="还要加进日历" at={at("think2")} until={start(9)} />
          <Results tl={tl} />
          <CalendarPanel tl={tl} />
          <Done at={at("check")} />
        </div>

        <Constellation from={start(14)} span={dur(14)} />
        <Orb x={orbPos.x} y={orbPos.y} size={30} intensity={1 + 0.12 * Math.sin(frame / 5)} flash={flash} />
      </div>
    </div>
  );
};

function stationLabel(i: number, frame: number, keyTimes: number[]) {
  if (frame < keyTimes[0]) return STATIONS[i].label;
  if (i === 0) return frame >= keyTimes[3] ? "再想下一步" : "想一步";
  if (i === 1) return frame >= keyTimes[1] ? "做一步" : "做";
  return frame >= keyTimes[2] ? "看结果" : "看";
}

const Station: React.FC<{ index: number; active: boolean; label: string; keyLine: boolean; labelIn: number }> = ({ index, active, label, keyLine, labelIn }) => {
  const c = polar(STATIONS[index].deg);
  const l = polar(STATIONS[index].deg, R + 120);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: c.x,
          top: c.y,
          width: 108,
          height: 108,
          borderRadius: "50%",
          border: `2px solid ${active ? night.light : "rgba(236,232,225,0.35)"}`,
          background: active ? "rgba(255,106,0,0.10)" : "rgba(7,9,15,0.85)",
          boxShadow: active ? glowShadow(0.6) : undefined,
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: l.x,
          top: l.y,
          transform: "translate(-50%, -50%)",
          opacity: labelIn,
          fontSize: keyLine ? 64 : 58,
          fontWeight: active ? 500 : 300,
          letterSpacing: "0.12em",
          whiteSpace: "nowrap",
          color: active ? night.light : night.dim,
          textShadow: active ? textGlow(0.8) : undefined,
        }}
      >
        {label}
        <div style={{ ...tag, fontSize: 20, textAlign: "center", marginTop: 6, color: active ? "rgba(255,138,31,0.8)" : tag.color }}>{STATIONS[index].en}</div>
      </div>
    </>
  );
};

const Tool: React.FC<{ name: IconName; lit: number; appear: number }> = ({ name, lit, appear }) => {
  const p = useSpringAt(appear, "heavy");
  const { x, y } = TOOLS[name];
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: TOOL_R * 2,
        height: TOOL_R * 2,
        borderRadius: "50%",
        border: `2px solid ${lit > 0.5 ? night.cool : "rgba(236,232,225,0.18)"}`,
        boxShadow: lit > 0.05 ? coolShadow(0.7 * lit) : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * p})`,
        opacity: p * (0.55 + 0.45 * lit),
      }}
    >
      <ThinIcon name={name} size={120} lit={lit} tint="cool" />
    </div>
  );
};

const Beam: React.FC<{ from: { x: number; y: number }; to: { x: number; y: number }; at: number; until: number; label: string }> = ({ from, to, at, until, label }) => {
  const frame = useCurrentFrame();
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const a = { x: from.x + ux * 58, y: from.y + uy * 58 };
  const b = { x: to.x - ux * TOOL_R, y: to.y - uy * TOOL_R };
  const grow = ramp(frame, at, at + 8);
  const fade = life(frame, at, until, 12);
  if (fade <= 0) return null;
  const head = { x: a.x + (b.x - a.x) * grow, y: a.y + (b.y - a.y) * grow };
  const pulse = ((frame - at) % 24) / 24;
  const dot = { x: a.x + (b.x - a.x) * pulse, y: a.y + (b.y - a.y) * pulse };
  return (
    <g opacity={fade}>
      <line x1={a.x} y1={a.y} x2={head.x} y2={head.y} stroke={night.light} strokeWidth={3} filter="url(#glow)" />
      {grow >= 1 && <circle cx={dot.x} cy={dot.y} r={6} fill={night.core} filter="url(#glow)" />}
      <text
        x={(a.x + b.x) / 2}
        y={(a.y + b.y) / 2 - 22}
        textAnchor="middle"
        transform={`rotate(${(Math.atan2(dy, dx) * 180) / Math.PI} ${(a.x + b.x) / 2} ${(a.y + b.y) / 2})`}
        fontFamily="Noto Sans SC"
        fontSize={26}
        letterSpacing="0.08em"
        fill={night.cool}
        opacity={ramp(frame, at + 6, at + 14)}
      >
        {label}
      </text>
    </g>
  );
};

const Thought: React.FC<{ text: string; at: number; until: number }> = ({ text, at, until }) => {
  const frame = useCurrentFrame();
  const out = 1 - ramp(frame, until, until + 10);
  if (frame < at || out <= 0) return null;
  return (
    <div style={{ position: "absolute", left: -60, top: -530, transform: "translate(-50%, -50%)", opacity: out }}>
      <RevealText text={text} at={at} stagger={2} style={{ fontSize: 56, fontWeight: 300, letterSpacing: "0.1em", color: night.text }} />
    </div>
  );
};

const FLIGHTS = [
  { day: "周一 12:30", price: "¥920" },
  { day: "周二 07:50", price: "¥680" },
  { day: "周三 18:10", price: "¥1150" },
];

const Results: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  const t0 = tl.at("results");
  const pick = ramp(frame, tl.at("pick"), tl.at("pick") + 8);
  const later = ramp(frame, tl.start(8), tl.start(8) + 12);
  return (
    <>
      <div style={{ position: "absolute", left: -1060, top: -60, ...tag, color: "rgba(107,184,255,0.7)", opacity: ramp(frame, t0 + 10, t0 + 20) * (1 - 0.7 * later) }}>
        3 results · 320 ms
      </div>
      {FLIGHTS.map((f, i) => (
        <FlightRow key={f.day} {...f} index={i} at={t0 + i * 5} pick={i === 1 ? pick : 0} dim={i === 1 ? 0 : pick} later={later} />
      ))}
    </>
  );
};

const FlightRow: React.FC<{ day: string; price: string; index: number; at: number; pick: number; dim: number; later: number }> = ({
  day,
  price,
  index,
  at,
  pick,
  dim,
  later,
}) => {
  const p = useSpringAt(at, "heavy");
  if (p <= 0.001) return null;
  const slot = { x: -780, y: 30 + index * 120 };
  const src = TOOLS.search;
  const x = src.x + (slot.x - src.x) * p;
  const y = src.y + (slot.y - src.y) * p;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 560,
        height: 96,
        transform: `translate(-50%, -50%) scale(${0.3 + 0.7 * p})`,
        borderRadius: 16,
        border: `2px solid ${pick > 0.5 ? night.light : "rgba(107,184,255,0.35)"}`,
        boxShadow: pick > 0.05 ? glowShadow(0.6 * pick) : undefined,
        background: "rgba(7,9,15,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        fontSize: 50,
        fontWeight: 300,
        letterSpacing: "0.04em",
        color: pick > 0.5 ? night.light : night.text,
        textShadow: pick > 0.5 ? textGlow(0.6) : undefined,
        opacity: Math.min(1, p * 1.4) * (1 - 0.65 * dim) * (1 - 0.7 * later),
        whiteSpace: "nowrap",
      }}
    >
      <span>{day}</span>
      <span style={{ fontWeight: pick > 0.5 ? 500 : 300 }}>{price}</span>
    </div>
  );
};

const DAYS = ["一", "二", "三", "四", "五"];

const CalendarPanel: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const show = useSpringAt(tl.at("beam2") + 8, "heavy");
  const drop = useSpringAt(tl.at("event"), "playful");
  if (show <= 0.001) return null;
  const left = 150;
  const top = -650;
  const colW = 104;
  return (
    <div style={{ position: "absolute", left, top, width: colW * 5, height: 360, opacity: show, transform: `scale(${0.9 + 0.1 * show})`, transformOrigin: "100% 50%" }}>
      {DAYS.map((d, i) => (
        <div key={d} style={{ position: "absolute", left: i * colW, top: 0, width: colW, height: 360 }}>
          <div style={{ textAlign: "center", fontSize: 44, fontWeight: 300, color: i === 1 ? night.text : night.dim }}>{d}</div>
          <div style={{ position: "absolute", left: colW / 2, top: 70, width: 1.5, height: 280, background: "rgba(236,232,225,0.16)" }} />
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: colW + 6,
          top: 100,
          width: colW * 1.9,
          height: 150,
          borderRadius: 16,
          background: "rgba(255,106,0,0.16)",
          border: `2px solid ${night.light}`,
          boxShadow: glowShadow(0.7),
          color: night.light,
          fontSize: 44,
          fontWeight: 500,
          lineHeight: 1.2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 20,
          textShadow: textGlow(0.5),
          opacity: Math.min(1, drop * 2),
          transform: `translateY(${(1 - drop) * -120}px)`,
          whiteSpace: "nowrap",
        }}
      >
        <span>08:00</span>
        <span>飞成都</span>
      </div>
    </div>
  );
};

const Done: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const draw = ramp(frame, at, at + 14);
  if (draw <= 0) return null;
  // 勾画在日程块上，「完成」浮在「看」站旁边
  const cx = 150 + 104 * 2.9;
  const cy = -650 + 100;
  return (
    <>
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={34} fill={night.bg} stroke={night.light} strokeWidth={3} filter="url(#glow)" opacity={draw} />
        <polyline
          points={`${cx - 15},${cy + 1} ${cx - 4},${cy + 12} ${cx + 16},${cy - 12}`}
          fill="none"
          stroke={night.core}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={60}
          strokeDashoffset={60 * (1 - draw)}
        />
      </svg>
      <div style={{ position: "absolute", left: 0, top: 20, transform: "translate(-50%, -50%)", textAlign: "center" }}>
        <RevealText text="完成，停下" at={at + 6} stagger={3} style={{ fontSize: 50, fontWeight: 400, letterSpacing: "0.14em", color: night.light, textShadow: textGlow(0.6) }} />
        <div style={{ ...tag, textAlign: "center", marginTop: 10, opacity: ramp(frame, at + 16, at + 26) }}>status · done</div>
      </div>
    </>
  );
};

// 镜头 14：拉远后，四周亮起很多个同样的小循环
const USES = [
  { x: -2050, y: -620, label: "订票" },
  { x: 2050, y: -560, label: "写代码" },
  { x: -120, y: -1280, label: "整理文件" },
];

const Constellation: React.FC<{ from: number; span: number }> = ({ from, span }) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  const minis = Array.from({ length: 34 }).map((_, i) => {
    let x = (random(`cx${i}`) - 0.5) * 6400;
    let y = (random(`cy${i}`) - 0.5) * 3400;
    if (Math.hypot(x, y) < 900) {
      x *= 2.2;
      y *= 2.2;
    }
    return { x, y, r: 70 + random(`cr${i}`) * 110, at: from + Math.round(random(`ct${i}`) * span * 0.55), speed: 0.6 + random(`cs${i}`) * 1.2 };
  });
  return (
    <>
      {minis.map((m, i) => (
        <MiniLoop key={i} {...m} />
      ))}
      {USES.map((u, i) => (
        <MiniLoop key={u.label} x={u.x} y={u.y} r={220} at={from + 6 + i * 8} speed={1.4} label={u.label} />
      ))}
    </>
  );
};

const MiniLoop: React.FC<{ x: number; y: number; r: number; at: number; speed: number; label?: string }> = ({ x, y, r, at, speed, label }) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, at, at + 16);
  if (p <= 0) return null;
  const ang = ((frame - at) / 30) * speed * 2 * Math.PI - Math.PI / 2;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: p * (label ? 1 : 0.7) }}>
      <div style={{ position: "absolute", left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: "50%", border: `${label ? 4 : 3}px solid rgba(255,138,31,${label ? 0.75 : 0.4})`, boxShadow: label ? glowShadow(0.6) : undefined }} />
      <Orb x={r * Math.cos(ang)} y={r * Math.sin(ang)} size={label ? 40 : 26} intensity={label ? 1.4 : 0.9} />
      {label && (
        <div style={{ position: "absolute", left: 0, top: r + 140, transform: "translate(-50%, -50%)", fontSize: 150, fontWeight: 400, letterSpacing: "0.12em", color: night.text, whiteSpace: "nowrap" }}>
          {label}
        </div>
      )}
    </div>
  );
};

