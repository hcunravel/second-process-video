// 人的细线轮廓：开场顶着方块爬坡的人，第 22 句空着手跟着光点上坡的人。
// 坐标以脚下为原点，向上为负；画在 World 的 svg 里，跟着世界一起推拉。
const HIP = 92;
const TORSO = 72;
const NECK = 23;
const HEAD_R = 19;
const THIGH = 50;
const SHIN = 46;
const UPPER = 30;
const FORE = 30;
const SLOPE_K = Math.tan((24 * Math.PI) / 180); // 和 World 的坡一样陡，前脚踩得高一点

type Pt = { x: number; y: number };
const add = (a: Pt, len: number, ang: number): Pt => ({ x: a.x + len * Math.sin(ang), y: a.y + len * Math.cos(ang) });

// 头顶相对脚下的位置，方块就摞在这里
export const headTop = (lean: number) => {
  const l = (lean * Math.PI) / 180;
  return { x: (TORSO + NECK) * Math.sin(l), y: -HIP - (TORSO + NECK) * Math.cos(l) - HEAD_R };
};

export const Person: React.FC<{ x: number; y: number; phase: number; load: number; lean: number; alpha: number; stroke?: string }> = ({
  x,
  y,
  phase,
  load,
  lean,
  alpha,
  stroke = "rgba(236,232,225,0.85)",
}) => {
  if (alpha <= 0.01) return null;
  const l = (lean * Math.PI) / 180;
  const hip = { x: 0, y: -HIP };
  const neck = { x: TORSO * Math.sin(l), y: -HIP - TORSO * Math.cos(l) };
  const head = { x: (TORSO + NECK) * Math.sin(l), y: -HIP - (TORSO + NECK) * Math.cos(l) };

  // 腿：两条腿反相摆动，往后摆的那条膝盖弯
  const legs = [0, Math.PI].map((off) => {
    const p = phase + off;
    const a = 0.42 * Math.sin(p);
    const knee = add(hip, THIGH, a);
    const foot = add(knee, SHIN, a - 0.55 * Math.max(0, -Math.cos(p)));
    foot.y -= foot.x * SLOPE_K;
    return [hip, knee, foot];
  });

  // 手：负重时两只手举过头顶托住方块；空手时自然前后摆
  const top = headTop(lean);
  const arms = [-1, 1].map((side) => {
    const swing = 0.5 * Math.sin(phase + (side > 0 ? 0 : Math.PI));
    const freeElbow = add(neck, UPPER, swing + 0.15);
    const freeHand = add(freeElbow, FORE, swing + 0.45);
    const upElbow = { x: neck.x + side * 20, y: neck.y - 22 };
    const upHand = { x: top.x + side * 16, y: top.y - 2 };
    const mix = (a: Pt, b: Pt) => ({ x: a.x + (b.x - a.x) * load, y: a.y + (b.y - a.y) * load });
    return [neck, mix(freeElbow, upElbow), mix(freeHand, upHand)];
  });

  const path = (list: Pt[][]) => list.map((pts) => `M${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L")}`).join(" ");
  const d = path([...legs, ...arms]);
  const torso = path([[{ x: hip.x, y: hip.y - 6 }, { x: neck.x * 0.92, y: neck.y + 8 }]]);
  return (
    <g transform={`translate(${x} ${y})`} opacity={alpha}>
      {/* 先画一层粗的亮线，再在上面压一层细的底色，留下的就是轮廓，关节处不会有内线 */}
      <g style={{ filter: "drop-shadow(0 0 6px rgba(236,232,225,0.35))" }}>
        <path d={d} fill="none" stroke={stroke} strokeWidth={19} strokeLinecap="round" strokeLinejoin="round" />
        <path d={torso} fill="none" stroke={stroke} strokeWidth={34} strokeLinecap="round" />
        <circle cx={head.x} cy={head.y} r={HEAD_R + 1.3} fill={stroke} />
      </g>
      <path d={d} fill="none" stroke="#0C1018" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      <path d={torso} fill="none" stroke="#0C1018" strokeWidth={29} strokeLinecap="round" />
      <circle cx={head.x} cy={head.y} r={HEAD_R - 1.3} fill="#0C1018" />
    </g>
  );
};
