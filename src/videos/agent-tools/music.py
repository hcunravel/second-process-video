"""第 2 集的配乐和音效：纯代码合成，乐器和音效直接用第 1 集 music.py 里的。不配音，配乐要自己撑起整片。

段落跟着文字时间表 text.srt 走，事件时刻读 timeline.json，和画面用同一张时间表：
  扛     第 1–5 句   钢琴动机，低音区，步子沉；每叫来一个工具一声 ding
  不会   第 6–8 句   抽掉节奏，只剩铺底和稀疏的高音
  标题   第 9 句     落地一声
  纸条   第 10–15 句 轻脉冲 + 琶音，纸条飞出去、飞回来
  乱     第 16–17 句 踩镲变密、低音切分，有点乱
  插口   第 18–19 句 收住，每插上一个工具一声 ding，往上走
  高潮   第 20–22 句 反向渐强进第 22 句：四拍底鼓、主旋律唱出动机，一直唱到片尾
  片尾   主和弦从高到低一串，收在「第二进程」上

用法（在仓库根目录下）：
  uv run --with numpy --with scipy python3 src/videos/agent-tools/music.py
"""

import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
_spec = importlib.util.spec_from_file_location("agent_loop_music", HERE.parent / "agent-loop/music.py")
base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(base)

SR, BEAT, OUTRO = base.SR, base.BEAT, base.OUTRO
hz, piano, pad, bass, pluck, lead, kick, hat, shimmer = base.hz, base.piano, base.pad, base.bass, base.pluck, base.lead, base.kick, base.hat, base.shimmer
Track, stereo_reverb, reverse_swell, sfx_ding, SFX = base.Track, base.stereo_reverb, base.reverse_swell, base.sfx_ding, base.SFX
CHORDS, ROOTS, MOTIF = base.CHORDS, base.ROOTS, base.MOTIF

LINES = 22
SRT = ROOT / "public/agent-tools/text.srt"
OUT = ROOT / "public/agent-tools/music.wav"
TIMELINE = json.loads((HERE / "timeline.json").read_text())
rng = np.random.default_rng(11)


def main():
    starts, end = base.srt_lines(SRT)
    if len(starts) != LINES:
        sys.exit(f"text.srt 有 {len(starts)} 句，需要 {LINES} 句")
    total = end + OUTRO
    n = int(total * SR)
    nxt = lambda line: starts[line] if line < LINES else end
    at = lambda line, frac: starts[line - 1] + frac * (nxt(line) - starts[line - 1])
    line_of = lambda t: max(j for j, s in enumerate(starts) if s <= t) + 1 if t >= starts[0] else 1
    S = lambda line: starts[line - 1]

    music = Track(n)
    fx = Track(n)

    # 铺底：每句一个和弦；纸条段亮一点，高潮最亮
    bounds = starts + [end, total]
    for i in range(LINES + 1):
        a, b = bounds[i], bounds[i + 1] + 1.2
        line = i + 1
        chord = CHORDS[0] if line > LINES else CHORDS[i % 4]
        bright = 650 if line <= 5 else 550 if line <= 9 else 1000 if line <= 15 else 1200 if line <= 19 else 1600 if line <= 22 else 800
        for j, m in enumerate(chord):
            music.add(pad(hz(m), b - a, bright), a, pan=(j - 2) * 0.25, gain=0.075)

    def motif(t0, octave=0, vel=0.5, step=BEAT / 2):
        for j, m in enumerate(MOTIF):
            music.add(piano(hz(m + octave)), t0 + j * step, pan=-0.3 + 0.6 * (j % 2), gain=vel * 0.32)

    # 开场就有声音：第 0 秒钢琴进来，第 3 句低八度再来一遍
    motif(0.05, octave=-12, vel=0.8, step=BEAT * 0.75)
    motif(S(3), octave=-12, vel=0.6, step=BEAT * 0.75)
    motif(S(8) + 0.3, vel=0.45, step=BEAT)

    # 第 1–5 句：沉的步子，半拍一下低音底鼓，像爬坡
    t = 0.0
    while t < S(6):
        music.add(kick(0.55), t, gain=0.35)
        t += BEAT * 2

    # 第 6–8 句：只剩铺底和几颗高音
    for k in range(10):
        tt = S(6) + k * BEAT * 1.5
        if tt < S(9):
            music.add(shimmer(hz(CHORDS[1][k % 5] + 24)), tt, pan=rng.uniform(-0.7, 0.7), gain=0.04)

    # 节拍网格：第 10 句起；第 18–19 句只留琶音；第 22 句落地
    drop = S(22)
    t = S(10)
    k = 0
    while t < end - BEAT / 2:
        line = line_of(t)
        chord = CHORDS[(line - 1) % 4]
        root = ROOTS[(line - 1) % 4]
        messy = 16 <= line <= 17
        plug = 18 <= line <= 19
        build = 20 <= line <= 21
        full = line == 22
        if plug:
            # 插口段：只留琶音，一步一步往上
            note = chord[1 + k % (len(chord) - 1)] + 12 + (k // 4) * 2
            music.add(pluck(hz(note)), t, pan=-0.4 if k % 2 else 0.4, gain=0.09)
            t += BEAT
            k += 1
            continue
        if full or k % 2 == 0:
            music.add(kick(1.0 if full else 0.7), t, gain=0.5 if full else 0.38)
        if k % 2 == 0:
            music.add(bass(hz(root), BEAT * 2), t, gain=0.32 if full else 0.22)
        if messy:
            music.add(bass(hz(root + 1), BEAT * 0.5), t + BEAT * 0.75, gain=0.14)
        music.add(hat(), t + BEAT / 2, pan=0.35, gain=0.14 if full else 0.09)
        if messy or build or full:
            music.add(hat(), t + BEAT / 4, pan=-0.35, gain=0.05)
            music.add(hat(), t + 3 * BEAT / 4, pan=-0.35, gain=0.05)
        if full and k % 4 == 3:
            music.add(hat(open_=True), t + BEAT / 2, pan=0.2, gain=0.08)
        steps = 4 if (messy or build or full) else 2
        for s_ in range(steps):
            note = chord[1 + (k * steps + s_) % (len(chord) - 1)] + 12
            music.add(pluck(hz(note)), t + s_ * BEAT / steps, pan=-0.5 if s_ % 2 else 0.5, gain=0.1)
        if full:
            for s_ in range(2):
                music.add(shimmer(hz(chord[(k + s_) % len(chord)] + 36)), t + s_ * BEAT / 2, pan=rng.uniform(-0.8, 0.8), gain=0.05)
        t += BEAT
        k += 1

    # 高潮主旋律：动机拉长，每拍一个音
    t = drop
    j = 0
    while t < end - BEAT:
        dur = BEAT * (2 if j % 4 == 3 else 1)
        music.add(lead(hz(MOTIF[j % len(MOTIF)]), dur * 0.95), t, gain=0.1)
        t += dur
        j += 1

    # 第 21 句：反向渐强推进高潮
    music.add(reverse_swell(drop - S(21)), S(21), gain=0.6)

    # 音效：时间表里的事件
    # 落地声压到一半，不然两声 boom 把整片的峰值占满，标准化后其他部分太轻
    for e in TIMELINE["events"]:
        fx.add(SFX[e["sfx"]](), at(e["line"], e["frac"]), gain=0.5 if e["sfx"] == "boom" else 1.0)
    # 片尾：主和弦从高到低一串
    for i, m in enumerate(CHORDS[0][1:]):
        fx.add(sfx_ding(hz(m + 24), 2.0) * 0.5, end + 0.1 + i * 0.07, pan=-0.4 + 0.2 * i)
    music.add(pad(hz(50), OUTRO + 1.0, 600), end, gain=0.12)

    ml, mr = stereo_reverb(music.l, music.r, wet=0.32)
    fl, fr = stereo_reverb(fx.l, fx.r, seconds=1.2, wet=0.22)
    left, right = ml + fl * 1.1, mr + fr * 1.1
    tail = int(1.5 * SR)
    fade = np.linspace(1, 0, tail)
    left[-tail:] *= fade
    right[-tail:] *= fade
    peak = max(np.max(np.abs(left)), np.max(np.abs(right)))
    stereo = np.stack([left, right], axis=1) / peak * 0.8
    wavfile.write(OUT, SR, (stereo * 32767).astype(np.int16))
    print(f"写入 {OUT}，{total:.1f} 秒")


if __name__ == "__main__":
    main()
