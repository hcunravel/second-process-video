import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { fontFamily, night, serif } from "../../lib/brand";
import type { Caption } from "../../lib/srt";
import { Dust, NightBackdrop, ramp, RevealText } from "./fx";
import { Hud } from "./Hud";
import { LINES, useTimeline, type Timeline } from "./timeline";
import { World } from "./World";

export type AgentLoopProps = { captions: Caption[]; music: boolean };

// 英文小字，和文字时间表 15 句一一对应
const EN = [
  "AI can book your flight — not because it got smarter, but because it loops.",
  "You tell the AI: find me the cheapest flight to Chengdu next week, and add it to my calendar.",
  "A chat AI just replies with a paragraph.",
  "But an agent gets to work.",
  "First it thinks: to find flights, search first.",
  "Then it acts: it calls the search tool for flights to Chengdu.",
  "Then it looks: the cheapest is Tuesday morning, 680 yuan.",
  "Then it remembers: it still has to go in the calendar.",
  "So it acts again: opens the calendar, adds Tuesday, 8 a.m.",
  "One last look: it's in the calendar. Done — only now does it stop.",
  "So an agent isn't a smarter model.",
  "It's a model, plus a loop.",
  "Think a step, take a step, check the result, think again.",
  "Every AI that books tickets, writes code or sorts your files runs this same loop.",
  "Next time: the tools in its hands — what are they, really?",
];

export const AgentLoopVideo: React.FC<AgentLoopProps> = ({ captions, music }) => {
  if (captions.length !== LINES) {
    return (
      <AbsoluteFill style={{ background: night.bg, color: night.text, fontFamily, fontSize: 60, padding: 120 }}>
        SRT 有 {captions.length} 句，需要 {LINES} 句
      </AbsoluteFill>
    );
  }
  return <Film captions={captions} music={music} />;
};

const Film: React.FC<AgentLoopProps> = ({ captions, music }) => {
  const tl = useTimeline(captions);
  return (
    <AbsoluteFill style={{ background: night.bg }}>
      <NightBackdrop />
      <Dust />
      <World tl={tl} />
      <Hud tl={tl} />
      <MainText captions={captions} tl={tl} />
      {/* 不配音：声音只有代码合成的配乐和音效，整片响度在渲染后用 ffmpeg 标准化 */}
      {music && <Audio src={staticFile("agent-loop/music.wav")} />}
    </AbsoluteFill>
  );
};

// 这几句的话已经由画面上的字讲了（钩子、打字、标题卡、结论、公式、四个站名、预告），底部不再重复
const SHOWN_ON_SCREEN = new Set([1, 2, 4, 11, 12, 13, 15]);

// 不配音时的主文字：每句逐字浮现，句末淡出，下面一行英文小字
const MainText: React.FC<{ captions: Caption[]; tl: Timeline }> = ({ captions, tl }) => {
  const frame = useCurrentFrame();
  const line = captions.findIndex((_, i) => frame >= tl.start(i + 1) && frame < tl.next(i + 1)) + 1;
  if (line < 1 || SHOWN_ON_SCREEN.has(line)) return null;
  const s = tl.start(line);
  const out = 1 - ramp(frame, tl.next(line) - 8, tl.next(line));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 900, textAlign: "center", opacity: out }}>
      <RevealText
        text={captions[line - 1].text.trim()}
        at={s + 2}
        stagger={1}
        style={{ fontFamily: serif, fontSize: 54, fontWeight: 300, letterSpacing: "0.08em", color: night.text, textShadow: "0 0 18px rgba(0,0,0,0.9)" }}
      />
      <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 300, fontStyle: "italic", color: night.dim, marginTop: 10, opacity: ramp(frame, s + 14, s + 26) }}>
        {EN[line - 1]}
      </div>
    </div>
  );
};
