import { Composition, Still, staticFile } from "remotion";
import { loadSrt, srtEndMs } from "./lib/srt";
import { AgentLoopCover, AgentLoopCoverWide, SeriesCover } from "./videos/agent-loop/Cover";
import { AgentLoopVideo, type AgentLoopProps } from "./videos/agent-loop/Video";
import { AgentToolsCover, AgentToolsCoverWide } from "./videos/agent-tools/Cover";
import { AgentToolsVideo, type AgentToolsProps } from "./videos/agent-tools/Video";

const FPS = 30;
const OUTRO_SECONDS = 2; // 片尾「第二进程」定版卡

export const Root: React.FC = () => {
  return (
    <>
      {/* 第 1 集：AI Agent 到底怎么干活。不配音，时长 = 文字时间表 text.srt 的最后一句 + 片尾 */}
      <Composition
        id="agent-loop"
        component={AgentLoopVideo}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={75 * FPS}
        defaultProps={{ captions: [], music: false } satisfies AgentLoopProps}
        calculateMetadata={async () => {
          const captions = await loadSrt("agent-loop/text.srt");
          const seconds = srtEndMs(captions) / 1000 + OUTRO_SECONDS;
          // 配乐文件还没合成时先不挂，免得渲染报错
          const music = (await fetch(staticFile("agent-loop/music.wav"), { method: "HEAD" })).ok;
          return { durationInFrames: Math.ceil(seconds * FPS), props: { captions, music } };
        }}
      />
      <Still id="agent-loop-cover" component={AgentLoopCover} width={1080} height={1440} />
      <Still id="agent-loop-cover-wide" component={AgentLoopCoverWide} width={1440} height={1080} />
      {/* 第 2 集：AI 最聪明的地方，是肯开口求人。同样不配音，时长按 text.srt 算 */}
      <Composition
        id="agent-tools"
        component={AgentToolsVideo}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={92 * FPS}
        defaultProps={{ captions: [], music: false } satisfies AgentToolsProps}
        calculateMetadata={async () => {
          const captions = await loadSrt("agent-tools/text.srt");
          const seconds = srtEndMs(captions) / 1000 + OUTRO_SECONDS;
          const music = (await fetch(staticFile("agent-tools/music.wav"), { method: "HEAD" })).ok;
          return { durationInFrames: Math.ceil(seconds * FPS), props: { captions, music } };
        }}
      />
      <Still id="agent-tools-cover" component={AgentToolsCover} width={1080} height={1440} />
      <Still id="agent-tools-cover-wide" component={AgentToolsCoverWide} width={1440} height={1080} />
      {/* 合集《AI 到底怎么干活》的封面，各集共用 */}
      <Still id="series-cover" component={SeriesCover} width={1080} height={1080} />
    </>
  );
};
