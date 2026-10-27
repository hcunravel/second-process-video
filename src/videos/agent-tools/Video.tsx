import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { fontFamily, night, serif } from "../../lib/brand";
import type { Caption } from "../../lib/srt";
import { Dust, NightBackdrop, ramp, RevealText } from "../agent-loop/fx";
import { Hud } from "./Hud";
import { LINES, useTimeline, type Timeline } from "./timeline";
import { World } from "./World";

export type AgentToolsProps = { captions: Caption[]; music: boolean };

// 英文小字，和文字时间表 22 句一一对应
const EN = [
  "Carrying everything alone is the most exhausting.",
  "When a pipe bursts, you call a plumber.",
  "Not sure if it'll rain tomorrow? You check the forecast.",
  "Lost? You ask the map.",
  "Nobody thinks that makes you useless.",
  "AI is the same. It doesn't even know what time it is.",
  "It can't book tickets, check the weather, or open your calendar.",
  "It does one thing: knows who to ask, and asks clearly.",
  "That's called tool calling.",
  "Say you ask it: will it rain in Chengdu tomorrow?",
  "It doesn't look at the sky. First, it writes a note:",
  "Ask: weather. About: Chengdu, tomorrow.",
  "The note goes to the weather tool, which writes back the answer.",
  "It reads the reply, then tells you: rain tomorrow, take an umbrella.",
  "It never touched the weather. It only wrote a note and read the reply.",
  "But the tools keep piling up: tickets, calendars, maps, email…",
  "Each one plugs in differently.",
  "Then came MCP: one universal socket.",
  "Any tool, in the same format, just plugs in.",
  "So the smartest AI isn't the one that can do everything.",
  "It's the one that knows what it can't do, and is willing to ask.",
  "You don't have to carry it all alone, either.",
];

export const AgentToolsVideo: React.FC<AgentToolsProps> = ({ captions, music }) => {
  if (captions.length !== LINES) {
    return (
      <AbsoluteFill style={{ background: night.bg, color: night.text, fontFamily, fontSize: 60, padding: 120 }}>
        SRT 有 {captions.length} 句，需要 {LINES} 句
      </AbsoluteFill>
    );
  }
  return <Film captions={captions} music={music} />;
};

const Film: React.FC<AgentToolsProps> = ({ captions, music }) => {
  const tl = useTimeline(captions);
  return (
    <AbsoluteFill style={{ background: night.bg }}>
      <NightBackdrop />
      <Dust />
      <World tl={tl} />
      <Hud tl={tl} />
      <MainText captions={captions} tl={tl} />
      {/* 不配音：声音只有代码合成的配乐和音效，整片响度在渲染后用 ffmpeg 标准化 */}
      {music && <Audio src={staticFile("agent-tools/music.wav")} />}
    </AbsoluteFill>
  );
};

// 这几句由画面上的字讲了（标题卡、提问气泡、纸条），底部不再重复
const SHOWN_ON_SCREEN = new Set([9, 10, 12]);
// 情绪最高点的三句压在画面中央偏下，字更大
const BIG = new Set([20, 21, 22]);

// 不配音时的主文字：每句逐字浮现，句末淡出，下面一行英文小字
const MainText: React.FC<{ captions: Caption[]; tl: Timeline }> = ({ captions, tl }) => {
  const frame = useCurrentFrame();
  const line = captions.findIndex((_, i) => frame >= tl.start(i + 1) && frame < tl.next(i + 1)) + 1;
  if (line < 1 || SHOWN_ON_SCREEN.has(line)) return null;
  const s = tl.start(line);
  const out = 1 - ramp(frame, tl.next(line) - 8, tl.next(line));
  const big = BIG.has(line);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: big ? 840 : 900, textAlign: "center", opacity: out }}>
      <RevealText
        text={captions[line - 1].text.trim()}
        at={line === 1 ? 2 : s + 2}
        stagger={1}
        style={{ fontFamily: serif, fontSize: big ? 66 : 56, fontWeight: 300, letterSpacing: "0.08em", color: night.text, textShadow: "0 0 18px rgba(0,0,0,0.9)" }}
      />
      <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 300, fontStyle: "italic", color: night.dim, marginTop: 10, opacity: ramp(frame, s + 14, s + 26) }}>
        {EN[line - 1]}
      </div>
    </div>
  );
};
