"""第 1 集的配乐和音效：纯代码合成，不用采样。不配音，所以配乐是唯一的声音，要自己撑起整片。

段落跟着文字时间表 text.srt 走，事件时刻读 timeline.json，和画面用同一张时间表：
  开场   第 1–3 句   钢琴动机 + 暗铺底，钩子画圈时一声上扬
  点燃   第 4 句     上扬的光 + 低频落地
  第一圈 第 5–7 句   脉冲、低音、八分琶音
  第二圈 第 8–10 句  加十六分踩镲和高八度对位，滤波打开一点，往上走
  收住   第 11 句    只剩铺底，反向渐强推进下一句
  落地   第 12–14 句 重拍：四拍底鼓、低音、主旋律唱出动机，满天小循环时加高音闪烁
  尾声   第 15 句起  退回钢琴动机，主和弦收在「第二进程」上

用法（在仓库根目录下）：
  uv run --with numpy --with scipy python3 src/videos/agent-loop/music.py
"""

import json
import re
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
BPM = 92
BEAT = 60 / BPM
OUTRO = 2.0
LINES = 15
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SRT = ROOT / "public/agent-loop/text.srt"
OUT = ROOT / "public/agent-loop/music.wav"
TIMELINE = json.loads((HERE / "timeline.json").read_text())

rng = np.random.default_rng(7)


def srt_lines(path: Path):
    stamps = re.findall(r"(\d+):(\d+):(\d+),(\d+) --> (\d+):(\d+):(\d+),(\d+)", path.read_text())
    sec = lambda h, m, s, ms: int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
    return [sec(*s[:4]) for s in stamps], sec(*stamps[-1][4:])


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def lowpass(x, cutoff, order=2):
    return sosfilt(butter(order, cutoff, "low", fs=SR, output="sos"), x)


def highpass(x, cutoff, order=2):
    return sosfilt(butter(order, cutoff, "high", fs=SR, output="sos"), x)


def secs(d):
    return np.arange(int(d * SR)) / SR


class Track:
    """立体声轨道。pan：-1 左，0 中，1 右"""

    def __init__(self, n):
        self.l = np.zeros(n)
        self.r = np.zeros(n)

    def add(self, sound, at, pan=0.0, gain=1.0):
        i = int(at * SR)
        n = len(self.l)
        if i >= n or i + len(sound) <= 0:
            return
        if i < 0:
            sound, i = sound[-i:], 0
        k = min(len(sound), n - i)
        gl = gain * np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
        gr = gain * np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
        self.l[i : i + k] += sound[:k] * gl
        self.r[i : i + k] += sound[:k] * gr


def stereo_reverb(l, r, seconds=2.6, wet=0.35):
    n = int(seconds * SR)
    out = []
    for ch, seed in ((l, 1), (r, 2)):
        g = np.random.default_rng(seed)
        ir = lowpass(g.standard_normal(n) * np.exp(-np.linspace(0, 5.5, n)), 5000)
        y = fftconvolve(ch, ir)[: len(ch)]
        out.append(y / (np.max(np.abs(y)) + 1e-9))
    peak = max(np.max(np.abs(l)), np.max(np.abs(r)), 1e-9)
    return l + wet * out[0] * peak, r + wet * out[1] * peak


# ---------- 乐器 ----------

def piano(freq, dur=2.4, vel=1.0):
    """柔和的电钢琴：略带失谐的泛音 + 琴槌的一点噪声"""
    t = secs(dur)
    partials = ((1, 1.0, 2.2), (2, 0.42, 3.5), (3, 0.2, 5.0), (4, 0.09, 7.0), (5.02, 0.05, 9.0))
    tone = sum(a * np.sin(2 * np.pi * freq * m * t + 0.3 * m) * np.exp(-t * d) for m, a, d in partials)
    hammer = lowpass(rng.standard_normal(len(t)), 3000) * np.exp(-t * 80) * 0.15
    return (tone + hammer) * np.minimum(1, t / 0.003) * vel


def pad(freq, dur, bright=900):
    t = secs(dur)
    tone = sum((0.5 / k) * np.sin(2 * np.pi * freq * k * d * t) for k in (1, 2, 3, 4) for d in (0.995, 1.005))
    env = np.minimum(1, t / 1.4) * np.clip((dur - t) / 1.4, 0, 1)
    return lowpass(tone * env, bright)


def bass(freq, dur):
    t = secs(dur)
    x = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t)
    return np.tanh(1.6 * x) * np.minimum(1, t / 0.01) * np.exp(-t * 1.4)


def pluck(freq, dur=0.6):
    t = secs(dur)
    tone = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t) + 0.1 * np.sin(2 * np.pi * freq * 3 * t)
    return tone * np.exp(-t * 7) * np.minimum(1, t / 0.004)


def lead(freq, dur):
    """主旋律：滤过的锯齿波 + 慢颤音"""
    t = secs(dur)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.4)
    phase = np.cumsum(freq * vib) / SR
    saw = 2 * (phase % 1) - 1
    env = np.minimum(1, t / 0.06) * np.clip((dur - t) / 0.25, 0, 1)
    return lowpass(saw, 2200) * env


def kick(depth=1.0):
    t = secs(0.45)
    f = 42 + 85 * np.exp(-t * 26)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * depth


def hat(open_=False):
    t = secs(0.18 if open_ else 0.05)
    return highpass(rng.standard_normal(len(t)), 8000) * np.exp(-t * (25 if open_ else 90))


def shimmer(freq):
    t = secs(1.2)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 3.5) * np.minimum(1, t / 0.01)


def reverse_swell(dur):
    t = secs(dur)
    noise = lowpass(rng.standard_normal(len(t)), 3500)
    return noise * (t / dur) ** 3 * 0.5


# ---------- 音效 ----------

def sfx_whoosh(d=0.55):
    t = secs(d)
    noise = rng.standard_normal(len(t))
    env = np.sin(np.pi * t / d) ** 2
    return highpass(lowpass(noise, 2500) * (t / d) + lowpass(noise, 600) * (1 - t / d), 150) * env * 0.5


def sfx_ding(freq=1318.5, d=1.6):
    t = secs(d)
    tone = sum(a * np.sin(2 * np.pi * freq * m * t) * np.exp(-t * dk) for a, m, dk in ((1, 1, 3), (0.4, 2.76, 5), (0.2, 5.4, 8)))
    return tone * np.minimum(1, t / 0.002) * 0.35


def sfx_blip():
    t = secs(0.25)
    return np.sin(2 * np.pi * (660 + 220 * t / 0.25) * t) * np.exp(-t * 14) * 0.3


def sfx_zap():
    t = secs(0.22)
    f = 1800 * np.exp(-t * 14) + 180
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + highpass(rng.standard_normal(len(t)), 3000) * 0.15) * np.exp(-t * 16)


def sfx_sparkle():
    out = np.zeros(int(0.9 * SR))
    for k in range(7):
        b = sfx_ding(freq=hz(84 + rng.integers(0, 8)), d=0.4) * 0.35
        i = int((0.06 * k + rng.random() * 0.03) * SR)
        out[i : i + len(b)] += b[: len(out) - i]
    return out


def sfx_chime():
    a, b = sfx_ding(hz(76)), sfx_ding(hz(83))
    out = np.zeros(int(2.2 * SR))
    out[: len(a)] += a
    i = int(0.14 * SR)
    out[i : i + len(b)] += b[: len(out) - i]
    return out


def sfx_ignite():
    t = secs(1.4)
    rise = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / 1.4) ** 2) / SR) * (t / 1.4) * np.exp(-np.maximum(t - 1.1, 0) * 12) * 0.18
    k = np.zeros(len(t))
    kk = kick(0.8)
    i = int(1.05 * SR)
    k[i : i + len(kk)] += kk[: len(t) - i]
    return rise + k * 0.7


def sfx_boom():
    t = secs(2.5)
    sub = np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.6)
    hit = lowpass(rng.standard_normal(len(t)), 1200) * np.exp(-t * 9) * 0.6
    return (sub + hit) * 0.9


def sfx_tick():
    t = secs(0.03)
    return highpass(rng.standard_normal(len(t)), 4000) * np.exp(-t * 200) * 0.18


def sfx_ring(d):
    t = secs(d)
    return np.sin(2 * np.pi * np.cumsum(500 + 700 * t / d) / SR) * np.sin(np.pi * t / d) * 0.08


SFX = {
    "whoosh": sfx_whoosh,
    "ding": sfx_ding,
    "blip": sfx_blip,
    "zap": sfx_zap,
    "sparkle": sfx_sparkle,
    "chime": sfx_chime,
    "ignite": sfx_ignite,
    "boom": sfx_boom,
}

# D 小调：Dm9 → B♭maj7 → Gm9 → A7sus，每句换一个
CHORDS = [[50, 57, 60, 64, 65], [46, 53, 57, 60, 62], [43, 50, 53, 57, 62], [45, 52, 55, 59, 62]]
ROOTS = [38, 34, 31, 33]
# 全片的动机：A–D–E–F，F–E–D–A（像光点绕一圈又回来）
MOTIF = [69, 74, 76, 77, 77, 76, 74, 69]


def main():
    starts, end = srt_lines(SRT)
    if len(starts) != LINES:
        sys.exit(f"text.srt 有 {len(starts)} 句，需要 {LINES} 句")
    total = end + OUTRO
    n = int(total * SR)
    nxt = lambda line: starts[line] if line < LINES else end
    at = lambda line, frac: starts[line - 1] + frac * (nxt(line) - starts[line - 1])
    line_of = lambda t: max(j for j, s in enumerate(starts) if s <= t) + 1 if t >= starts[0] else 1

    music = Track(n)
    fx = Track(n)

    # 铺底：每句一个和弦；第二圈和落地段滤波打开
    bounds = starts + [end, total]
    for i in range(LINES + 1):
        a, b = bounds[i], bounds[i + 1] + 1.2
        chord = CHORDS[0] if i == LINES else CHORDS[i % 4]
        line = i + 1
        bright = 700 if line <= 7 else 1100 if line <= 10 else 800 if line == 11 else 1500 if line <= 14 else 900
        for j, m in enumerate(chord):
            music.add(pad(hz(m), b - a, bright), a, pan=(j - 2) * 0.25, gain=0.075)

    # 开场和尾声：钢琴动机
    def motif(t0, octave=0, vel=0.5, step=BEAT / 2):
        for j, m in enumerate(MOTIF):
            music.add(piano(hz(m + octave)), t0 + j * step, pan=-0.3 + 0.6 * (j % 2), gain=vel * 0.32)

    motif(starts[0] + 0.4, vel=0.75, step=BEAT * 0.75)
    motif(starts[2] + 0.2, octave=-12, vel=0.65, step=BEAT * 0.75)
    motif(starts[14] + 0.2, vel=0.5, step=BEAT * 0.6)

    # 节拍网格：从第 5 句开始；第 11 句收住；第 12 句起落地
    beat_from = starts[4]
    hush, drop = starts[10], starts[11]
    t = beat_from
    k = 0
    while t < end - BEAT:
        line = line_of(t)
        chord = CHORDS[(line - 1) % 4]
        root = ROOTS[(line - 1) % 4]
        if hush <= t < drop:
            t += BEAT
            k += 1
            continue
        round2 = 8 <= line <= 10
        full = 12 <= line <= 14
        outro = line >= 15
        g = 0.5 if outro else 1.0
        # 底鼓：第一圈二、四拍轻，落地段四拍都有
        if full or k % 2 == 0:
            music.add(kick(1.0 if full else 0.7), t, gain=0.5 * g)
        # 低音
        if k % 2 == 0 and not outro:
            music.add(bass(hz(root), BEAT * 2), t, gain=0.32 if full else 0.24)
        # 踩镲
        music.add(hat(), t + BEAT / 2, pan=0.35, gain=(0.14 if full else 0.09) * g)
        if round2 or full:
            music.add(hat(), t + BEAT / 4, pan=-0.35, gain=0.05 * g)
            music.add(hat(), t + 3 * BEAT / 4, pan=-0.35, gain=0.05 * g)
        if full and k % 4 == 3:
            music.add(hat(open_=True), t + BEAT / 2, pan=0.2, gain=0.08)
        # 琶音
        steps = 4 if (full or round2) else 2
        for s_ in range(steps):
            note = chord[1 + (k * steps + s_) % (len(chord) - 1)] + 12
            music.add(pluck(hz(note)), t + s_ * BEAT / steps, pan=-0.5 if s_ % 2 else 0.5, gain=0.1 * g)
        # 第二圈：高八度对位，动机的影子
        if round2 and k % 2 == 0:
            m = MOTIF[(k // 2) % len(MOTIF)] + 12
            music.add(piano(hz(m), 1.6), t, pan=0.4, gain=0.09)
        # 满天小循环：高音闪烁
        if line == 14:
            for s_ in range(2):
                music.add(shimmer(hz(chord[(k + s_) % len(chord)] + 36)), t + s_ * BEAT / 2, pan=rng.uniform(-0.8, 0.8), gain=0.05)
        t += BEAT
        k += 1

    # 落地段的主旋律：动机拉长，每拍一个音
    t = drop
    j = 0
    while t < starts[14] - BEAT:
        dur = BEAT * (2 if j % 4 == 3 else 1)
        music.add(lead(hz(MOTIF[j % len(MOTIF)]), dur * 0.95), t, gain=0.09)
        t += dur
        j += 1

    # 第 11 句：反向渐强推进落地
    music.add(reverse_swell(drop - hush), hush, gain=0.6)

    # 音效：钩子画圈、打字、灰字散掉、时间表里的事件
    c0 = at(1, TIMELINE["hook"]["circle"])
    fx.add(sfx_ring(max(0.5, starts[1] - c0)), c0)
    ty = TIMELINE["typing"]
    a, b = at(ty["line"], ty["from"]), at(ty["line"], ty["to"])
    for i in range(20):
        fx.add(sfx_tick(), a + (b - a) * i / 20, pan=rng.uniform(-0.2, 0.2))
    fx.add(sfx_whoosh(1.0) * 0.5, at(3, TIMELINE["dissolve"]["frac"]))
    for e in TIMELINE["events"]:
        fx.add(SFX[e["sfx"]](), at(e["line"], e["frac"]))
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
