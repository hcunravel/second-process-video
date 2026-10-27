# 第二进程的代码视频

用 Remotion 写代码出视频：Opus 写画面代码，Remotion 一帧一帧渲染成 MP4。这是 2026 年 W44 起的单条实验，不是新主线。

## 边界

- **不搭流水线**。到第 5 条视频之前，不写 skill、不做自动化、不加新的框架层。`src/lib/` 里只放已经有两条视频在用的东西。
- 每条视频一个周末，最多 6 小时。超时就按当前进度收尾发布，在 `log.md` 里记下卡在哪。
- 发布由用户手动完成，不自动操作抖音或剪映客户端。
- 工作日不改这里的工具，工具只在周日维护。

## 目录

```
./
  src/Root.tsx                    注册每条视频的 Composition 和封面 Still
  src/lib/                        品牌（颜色、字体、字号、弹簧四档）、SRT、字幕组件
  src/videos/<slug>/              这条视频的画面代码：Video.tsx、Cover.tsx、各镜头
  public/<slug>/                  narration.mp3、narration.srt、music.wav（音频不进 git）
  public/fonts/                   思源黑体、思源宋体可变字体，不进 git
  briefs/<slug>/                  brief.md、narration.md、log.md
  out/  qa/                       成片、封面、静帧、抽帧图（都不进 git）
```

字体缺失时重新下载（OFL 协议，可商用）：
`curl -L -o public/fonts/NotoSansSC.ttf "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf"`
`curl -L -C - -o public/fonts/NotoSerifSC.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"`（25MB，github.com/raw 的跳转会卡住，用 raw.githubusercontent.com）

## 规格（每条视频的默认值）

- 横屏 1920×1080，30fps，60 到 90 秒，抖音、B 站、视频号、X 都发同一个原片
- 另出一张 1080×1440（3:4）的竖版封面，给抖音宫格用
- 系列：合集《AI 到底怎么干活》，一个概念一集
- 视觉（2026-10-25 起）：暗场。近黑的蓝黑底加颗粒和微尘，Agent 自己的动作用橙金色的光（`night.light`），工具和信息用冷蓝（`night.cool`）；标题和字幕用细宋体（思源宋体），中文字幕下面配一行英文斜体小字。片尾 2 秒「第二进程」定版卡加关注引导。公众号仍然是浅色，见 `brand.ts` 的 `color`
- 抖音发布标题：`Vibe知识大赏｜<问题>？<一句钩子>`，挂 #vibe知识大赏，加进合集

## 工作流（两道确认关卡）

1. **旁白稿**：按作者的口语风格起草稿子，每句一行，75 秒约 220 字，写进 `briefs/<slug>/narration.md`。用户改完并朗读一遍，读着拗口的地方再改。
2. **配音，或者不配音**：不配音时（第 1 集就是），我直接写文字时间表 `public/<slug>/text.srt`，每句停留不少于「字数 / 5 + 0.8 秒」，画面已经写出那句话的镜头不再在底部重复。要配音时（用户在剪映做）：文本朗读生成配音 → 识别字幕 → 导出 `narration.mp3` 和 `narration.srt`，放进 `public/<slug>/`。SRT 就是整片的时间轴。导不出 SRT 时，改用本地 whisper 从 mp3 识别时间戳。
3. **文字分镜 → 关卡 1**：复制 `briefs/_template/brief.md`，按 SRT 写 `<structure>`：每个镜头对应哪几句旁白、画面讲什么、怎么动、怎么转场。**用户确认后再写代码。**
4. **关键帧 → 关卡 2**：只搭 2 个最有代表性的镜头，渲染静帧给用户看。**用户确认后再做全片。**
5. **全片**：一个镜头一个镜头做，每做完一个渲 3 张静帧自己检查。全部搭完先出低清小样看节奏和转场，节奏对了再精修细节。
6. **配乐**：用 Python 合成（`uv run --with numpy --with scipy python3 ...`），限时 30 分钟，按旁白时间轴卡段落，旁白出现时压低音乐。30 分钟内做不出能听的，就改用剪映曲库里标了「可商用」的音乐，成片导进剪映加。混音后响度约 -14 LUFS。
7. **自检**：按下面的「自检」做，最多自动返工 2 轮，之后不管几分都交给用户决定。
8. **封面**：渲染 `<slug>-cover`，主体大、一眼能看懂，最多 20 分钟。
9. **交付**：给用户成片、封面、`brief.md` 的路径，加上自检分数和已知不足。`log.md` 记好耗时、花费、用到的提示词和踩的坑，这些是实验室文章的素材。

## 代码规矩

- 画面只由当前帧决定：所有状态从 `useCurrentFrame()` 算出来。不用 CSS transition、animation、`setTimeout`；随机数用 Remotion 的 `random(seed)`，不用 `Math.random()`。
- 每个镜头一个 `<Sequence>`，镜头的起止时间从 SRT 的句子时刻算，不手写秒数。改旁白之后重新导出 SRT，画面会自动对齐。
- 运动用 `spring()` 加 `src/lib/brand.ts` 里的弹簧四档，同一类元素用同一档；不用匀速运动。
- 字号按手机来定：横屏在手机上只占屏幕中间一条，正文不小于 `type.body`（64px），任何字都不小于 `type.min`（44px）。一屏最多一句话，每句至少停留 2.5 秒。
- 镜头要动：推、拉、跟随，主体至少占画面三分之一。
- 被缩放的文字元素不加 `will-change`，否则会糊。

## 禁止清单（Opus 不加限制就会回到这些默认样子）

- 没有设计的深色模板：深色底加居中大字，所有元素一起淡入淡出
- 弹跳缓动、粒子爆炸、组件上的装饰渐变
- 光只给主角：光晕只用在 Agent 的光点、它的轨迹和它点亮的东西上，不要满屏发光
- 角落里多余的水印、边框
- 满屏小字、一屏好几句话。例外：英文技术小标注（`fx.tsx` 的 `tag`）可以小于 44px，但只做质感，不能承载必须看清的信息
- 粗细不统一的图标，看起来像模板的东西

## 参考别人的视频

参考视频只学手法，不搬它独有的表达。暗场、细宋体、光沿线跑、技术小标注、双语字幕是这个题材的通用语言，可以用；某条视频标志性的钩子（比如「床前明月▁」的填空游戏）、它的原句和措辞、它的片头标题格式不能用。拿不准时先问用户。

## 常用命令

```bash
npm run studio                                                  # 浏览器里预览和拖时间轴
npx remotion still <slug> qa/<slug>-s1-2s.png --frame=60         # 渲一张静帧
npx remotion render <slug> out/<slug>-draft.mp4 --scale=0.5      # 低清小样
npx remotion render <slug> out/<slug>.mp4                        # 正式成片
npx remotion still <slug>-cover out/<slug>-cover.png             # 竖版封面
npm run typecheck
uv run --with numpy --with scipy python3 src/videos/<slug>/music.py   # 合成配乐
```

渲染出 `out/<slug>-raw.mp4` 后，用两遍 loudnorm 把整片标准化到 -14 LUFS（单遍会差 1 LU 左右）：先用 `loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json` 测一遍，再把测出的 `measured_*` 和 `offset` 填回去，加 `linear=true`，视频流 `-c:v copy`，输出 `out/<slug>.mp4`。

临时配音：剪映配音还没到时，可以先用 `uvx edge-tts --voice zh-CN-YunxiNeural -f <旁白纯文本> --write-media public/<slug>/narration.mp3 --write-subtitles public/<slug>/narration.srt` 把整片跑通，每行一句对应一条字幕。

抽帧拼图（每 3 秒一张）和手机小窗尺寸的拼图：

```bash
ffmpeg -y -i out/<slug>.mp4 -vf "fps=1/3,scale=480:-1,tile=5x6" -frames:v 1 qa/<slug>-sheet.png
ffmpeg -y -i out/<slug>.mp4 -vf "fps=1/3,scale=390:-1,tile=5x6" -frames:v 1 qa/<slug>-phone.png
ffmpeg -i out/<slug>.mp4 -af loudnorm=print_format=summary -f null -   # 看响度
```

## 自检

整片渲完后，先出两张抽帧拼图，再用挑毛病的眼光看，别当自己是作者。下面每项打 1 到 10 分：

| 项 | 看什么 |
|---|---|
| 开场 | 前 2 秒有没有一个抓人的画面 |
| 手机可读 | 390 像素宽的拼图里，字还看不看得清 |
| 动作 | 有没有匀速滑动、有没有什么都不动的空拍 |
| 变化 | 每 2 到 4 秒有没有新东西出现 |
| 构图 | 主体够不够大，有没有空一大块或挤成一团 |
| 贴合 brief | 品牌色、字体、事实和 brief 一致 |
| 声画同步 | 旁白说到的东西，画面上是不是正好出现 |

列出最严重的 3 个问题并标上时间点。重点找：切换时新旧文字叠在一起、禁止清单里的默认画面、缩放后变糊的字。改完只重渲有问题的几秒，再出新拼图和新分数。最多自动返工 2 轮，每一轮的分数和问题记在 `log.md`。

## 验收清单

- [ ] 时长、画幅、帧率和 brief 一致，有声音轨
- [ ] 抽帧图里没有空白帧，没有残留到下一个镜头的元素
- [ ] 所有文字都在安全区内，没有溢出、没有被字幕挡住
- [ ] 事实类内容有出处，不确定的单独列给用户核对
- [ ] 响度约 -14 LUFS，峰值低于 -1 dBTP
- [ ] 封面缩成宫格大小也能读出标题
