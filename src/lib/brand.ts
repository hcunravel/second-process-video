import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// 第二进程的品牌：浅色底、黑白组件、只用一个强调色（公众号主题橙）
export const color = {
  bg: "#F4F2EE",
  ink: "#111111",
  muted: "#8A8680",
  line: "#D9D5CE",
  card: "#FFFFFF",
  accent: "#FF6A00",
};

// 视频系列的暗场：近黑的蓝黑底，橙色是唯一的光（2026-10-25 参考抖音「信息论」那条改的）
export const night = {
  bg: "#07090F",
  bgLift: "#101521",
  text: "#ECE8E1",
  dim: "#8A909A",
  faint: "rgba(255,255,255,0.14)",
  light: "#FF8A1F",
  core: "#FFF1DC",
  cool: "#6BB8FF", // 工具和信息用冷蓝，Agent 自己的动作用橙光
};

export const fontFamily = "Noto Sans SC";
// 暗场视频的标题和字幕用细宋体（思源宋体可变字体，文件不进 git）
export const serif = '"Noto Serif SC", "Noto Sans SC", serif';
export const serifReady = loadFont({
  family: "Noto Serif SC",
  url: staticFile("fonts/NotoSerifSC.ttf"),
  weight: "200 900",
});

// 思源黑体可变字体，文件不进 git，来源见 AGENTS.md
export const fontReady = loadFont({
  family: fontFamily,
  url: staticFile("fonts/NotoSansSC.ttf"),
  weight: "100 900",
});

// 横屏在手机上只占屏幕中间一条，字号按这个下限来
export const type = {
  title: 120,
  heading: 88,
  body: 64,
  caption: 56,
  min: 44,
};

// 弹簧四档（Remotion spring 的 config），同一支片子里同类元素用同一档
export const springs = {
  snappy: { mass: 1, stiffness: 576, damping: 38 }, // 按钮、开关、指示条
  card: { mass: 1, stiffness: 225, damping: 22 }, // 卡片、容器、镜头
  heavy: { mass: 1, stiffness: 100, damping: 18 }, // 大字、定版
  playful: { mass: 1, stiffness: 324, damping: 16 }, // 贴纸、小角色
};
