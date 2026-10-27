import { parseSrt, type Caption } from "@remotion/captions";
import { staticFile } from "remotion";

export type { Caption };

export async function loadSrt(path: string): Promise<Caption[]> {
  const res = await fetch(staticFile(path));
  if (!res.ok) throw new Error(`读不到字幕文件 ${path}（${res.status}）`);
  return parseSrt({ input: await res.text() }).captions;
}

// 旁白最后一句结束的时刻，用来定整片时长
export function srtEndMs(captions: Caption[]): number {
  return captions.reduce((max, c) => Math.max(max, c.endMs), 0);
}
