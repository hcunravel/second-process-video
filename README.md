# 第二进程 · 代码视频

用 Claude 写代码做短视频：画面、配乐、音效都是代码生成的，没有用一张图片素材。[Remotion](https://www.remotion.dev/) 按帧渲染成 MP4，配乐用 Python 合成。

这是一个 build in public 的实验：每一集的分镜、旁白、提示词、耗时、自检分数、踩过的坑和发布后的数据都放在 `briefs/` 里，**失败也记**。

## 合集《AI 到底怎么干活》

| 集 | 标题 | 从开工到成片 | 抖音 24 小时数据 | 记录 |
|---|---|---|---|---|
| 1 | AI Agent 到底怎么干活？靠的不是更聪明，是转圈 | 约 20 分钟 | 播放 236，点赞 5，2 秒跳出 57% | [brief](briefs/agent-loop/brief.md) · [旁白](briefs/agent-loop/narration.md) · [log](briefs/agent-loop/log.md) |
| 2 | AI 最聪明的地方，是肯开口求人 | 约 30 分钟 | 待补 | [brief](briefs/agent-tools/brief.md) · [旁白](briefs/agent-tools/narration.md) · [log](briefs/agent-tools/log.md) |

成片在抖音：<!-- TODO: 抖音主页或合集链接 -->

耗时是墙钟时间，基本都是 Claude 在写代码和渲染。第 1 集的数据不好看：一半多的人 2 秒内就划走了，问题在开头。第 2 集只改了选题角度和第一句话，其他不动，看能不能把这个数字压下来。

## 怎么做的

每集都过两道人工关卡：

1. 写旁白稿，再写**文字分镜**：每个镜头对应哪几句话、画面怎么动。**关卡 1**，确认后才写代码
2. 先只做两个**关键帧**，渲染静帧来看。**关卡 2**，确认后才做全片
3. 全片做完，Claude 拿抽帧拼图给自己打分（开场、手机上看不看得清、动作、构图、声画同步），最多自动返工两轮

完整规矩在 [AGENTS.md](AGENTS.md)，它同时也是给 Claude 的工作说明。

## 目录

```
src/Root.tsx            每集的 Composition 和封面
src/lib/                颜色、字体、弹簧动画、字幕（至少两集在用的才放这里）
src/videos/<slug>/      这一集的画面代码和配乐脚本 music.py
public/<slug>/text.srt  文字时间表，整片的时间轴由它决定
briefs/<slug>/          brief、旁白、log、发布文案
```

## 自己跑起来

需要 Node 20 以上、[uv](https://docs.astral.sh/uv/)、ffmpeg。

```bash
npm ci

# 字体（思源黑体、思源宋体，OFL 协议，不进 git）
mkdir -p public/fonts
curl -L -o public/fonts/NotoSansSC.ttf "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf"
curl -L -o public/fonts/NotoSerifSC.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"

# 合成配乐（不进 git，跑一下就会生成 public/<slug>/music.wav）
uv run --with numpy --with scipy python3 src/videos/agent-loop/music.py

npm run studio                                        # 在浏览器里预览
npx remotion render agent-loop out/agent-loop.mp4     # 渲染成片
```

没有 `music.wav` 也能渲染，只是没有声音。

第一次渲染（`npx remotion still` 或 `render`）会自动下载 Remotion 用的无头浏览器 Chrome Headless Shell，约 170MB，只下载一次。网络慢时可能超时报错，重跑一次命令就行。

## 许可证

本仓库的代码和文档用 [MIT](LICENSE) 许可证，可以随便拿去改、拿去用。

视频是用 [Remotion](https://www.remotion.dev/) 渲染的，它有自己的授权，和本仓库的 MIT 无关：个人、3 名员工以内的营利公司、非营利组织可以免费使用（包括商用）；更大的营利公司需要购买公司授权。以 [Remotion 的许可证原文](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)为准。

字体是思源黑体、思源宋体，OFL 协议，可商用。
