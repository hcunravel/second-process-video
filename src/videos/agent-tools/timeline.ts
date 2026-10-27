import { useVideoConfig } from "remotion";
import type { Caption } from "../../lib/srt";
import data from "./timeline.json";

export const LINES = 22;
export type EventId = (typeof data.events)[number]["id"];

// 把文字时间表的句子和 timeline.json 里的事件换算成帧（和第 1 集的 timeline.ts 同一套算法）
export function useTimeline(captions: Caption[]) {
  const { fps, durationInFrames } = useVideoConfig();
  const toFrame = (ms: number) => Math.round((ms / 1000) * fps);
  const end = toFrame(captions[LINES - 1].endMs);
  const start = (line: number) => (line === 1 ? 0 : toFrame(captions[line - 1].startMs));
  const next = (line: number) => (line === LINES ? end : start(line + 1));
  const dur = (line: number) => next(line) - start(line);
  const atFrac = (line: number, frac: number) => Math.round(start(line) + frac * dur(line));
  const at = (id: EventId) => {
    const e = data.events.find((x) => x.id === id)!;
    return atFrac(e.line, e.frac);
  };
  return { fps, total: durationInFrames, end, start, next, dur, atFrac, at };
}

export type Timeline = ReturnType<typeof useTimeline>;
