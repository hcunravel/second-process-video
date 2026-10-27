import { night } from "../../lib/brand";

export type ToolName = "wrench" | "cloud" | "arrow" | "ticket" | "calendar" | "map" | "mail";

// 细线图标，24 网格。路径照 Feather Icons（MIT）的画法改写；lit 亮冷蓝（被叫到的工具），warm 亮橙（高潮时整张网）
export const ToolIcon: React.FC<{ name: ToolName; size: number; lit?: number; warm?: number }> = ({ name, size, lit = 0, warm = 0 }) => {
  const stroke = warm > 0.5 ? night.light : lit > 0.5 ? night.cool : "rgba(236,232,225,0.5)";
  const rgb = warm > 0.5 ? "255,138,31" : "107,184,255";
  const glow = Math.max(lit, warm);
  const c = { fill: "none", stroke, strokeWidth: 1.1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ overflow: "visible", filter: glow > 0.05 ? `drop-shadow(0 0 ${8 * glow}px rgba(${rgb},${glow}))` : undefined }}
    >
      {name === "wrench" && <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z" {...c} />}
      {name === "cloud" && <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" {...c} />}
      {name === "arrow" && <polygon points="3 11 22 2 13 21 11 13 3 11" {...c} />}
      {name === "ticket" && (
        <>
          <path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z" {...c} />
          <line x1="15" y1="6" x2="15" y2="18" {...c} strokeDasharray="1.5 1.8" />
        </>
      )}
      {name === "calendar" && (
        <>
          <rect x="3" y="5" width="18" height="16" rx="3" {...c} />
          <line x1="3" y1="10" x2="21" y2="10" {...c} />
          <line x1="8" y1="3" x2="8" y2="7" {...c} />
          <line x1="16" y1="3" x2="16" y2="7" {...c} />
        </>
      )}
      {name === "map" && (
        <>
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" {...c} />
          <line x1="8" y1="2" x2="8" y2="18" {...c} />
          <line x1="16" y1="6" x2="16" y2="22" {...c} />
        </>
      )}
      {name === "mail" && (
        <>
          <rect x="2" y="4" width="20" height="16" rx="2" {...c} />
          <polyline points="22 6 12 13 2 6" {...c} />
        </>
      )}
    </svg>
  );
};

export type PlugShape = "square" | "circle" | "triangle" | "diamond" | "hex" | "cross" | "pill";

// 工具接头：MCP 出现前各是各的形状，出现后统一成同一种
export const plugPath = (shape: PlugShape | "unified", s: number): string => {
  switch (shape) {
    case "square":
      return `M${-s} ${-s}h${2 * s}v${2 * s}h${-2 * s}z`;
    case "circle":
      return `M${-s} 0a${s} ${s} 0 1 0 ${2 * s} 0a${s} ${s} 0 1 0 ${-2 * s} 0z`;
    case "triangle":
      return `M0 ${-1.2 * s}L${1.1 * s} ${0.8 * s}L${-1.1 * s} ${0.8 * s}z`;
    case "diamond":
      return `M0 ${-1.3 * s}L${1.3 * s} 0L0 ${1.3 * s}L${-1.3 * s} 0z`;
    case "hex": {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i;
        return `${(1.15 * s * Math.cos(a)).toFixed(1)} ${(1.15 * s * Math.sin(a)).toFixed(1)}`;
      });
      return `M${pts.join("L")}z`;
    }
    case "cross": {
      const a = 0.4 * s;
      return `M${-a} ${-s}h${2 * a}v${s - a}h${s - a}v${2 * a}h${a - s}v${s - a}h${-2 * a}v${a - s}h${a - s}v${-2 * a}h${s - a}z`;
    }
    case "pill":
      return `M${-1.4 * s} ${-0.6 * s}h${2.8 * s}a${0.6 * s} ${0.6 * s} 0 0 1 0 ${1.2 * s}h${-2.8 * s}a${0.6 * s} ${0.6 * s} 0 0 1 0 ${-1.2 * s}z`;
    case "unified":
      // 统一接头：一个圆角小方块加两根插脚，插脚朝向圆环
      return `M${-s} ${-0.8 * s}h${1.6 * s}v${1.6 * s}h${-1.6 * s}z M${0.6 * s} ${-0.4 * s}h${0.8 * s} M${0.6 * s} ${0.4 * s}h${0.8 * s}`;
  }
};
