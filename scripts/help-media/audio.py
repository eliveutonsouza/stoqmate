"""Áudio dos vídeos da central de ajuda.

Para cada vídeo de videos.json: narra cada trecho com o Piper (voz pt_BR),
monta a linha do tempo pelas durações reais da fala, sintetiza uma trilha
lo-fi original (sem direitos autorais), abaixa a música sob a voz e gera as
legendas (.vtt + cues para queimar no vídeo).

Uso: python audio.py <pasta-de-saida> [chave ...]
Requer: piper-tts, numpy, ffmpeg no PATH (ou FFMPEG=/caminho) e a voz em
VOICE=/caminho/pt_BR-faber-medium.onnx.
"""
import json
import math
import os
import re
import subprocess
import sys
import wave

import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
VOICE = os.environ["VOICE"]
PIPER = os.environ.get("PIPER", "piper")
LEAD = 0.35        # silêncio antes da fala em cada trecho
TAIL = 0.65        # respiro depois da fala
MIN_CARD = 4.2     # abertura/encerramento duram pelo menos isso


def tts(text: str, out: str) -> np.ndarray:
    raw = out + ".raw.wav"
    subprocess.run([PIPER, "-m", VOICE, "--length_scale", "0.97", "--sentence_silence", "0.18", "-f", raw],
                   input=text.encode("utf-8"), check=True, capture_output=True)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", raw, "-ar", str(SR), "-ac", "1", out], check=True)
    os.remove(raw)
    with wave.open(out) as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return data


def chunks(text: str, limit: int = 88) -> list[str]:
    """Quebra a fala em legendas curtas, preferindo pontuação."""
    parts = [p.strip() for p in re.split(r"(?<=[.!?,:])\s+", text) if p.strip()]
    out: list[str] = []
    for p in parts:
        if out and len(out[-1]) + 1 + len(p) <= limit:
            out[-1] += " " + p
            continue
        while len(p) > limit:
            cut = p.rfind(" ", 0, limit)
            out.append(p[:cut])
            p = p[cut + 1:]
        out.append(p)
    return out


# ─── trilha lo-fi ─────────────────────────────────────────────────────────

def note(n: str) -> float:
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    m = re.match(r"([A-G]#?)(\d)", n)
    return 440 * 2 ** ((names[m.group(1)] + (int(m.group(2)) + 1) * 12 - 69) / 12)


def lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    a = math.exp(-2 * math.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(0, len(x), 4096):  # vetorizado por blocos seria overkill; scipy não é dependência
        seg = x[i:i + 4096]
        out = np.empty_like(seg)
        for j, v in enumerate(seg):
            acc = (1 - a) * v + a * acc
            out[j] = acc
        y[i:i + 4096] = out
    return y


def music(seconds: float, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    bpm = 82
    beat = 60 / bpm
    bar = beat * 4
    n = int((seconds + 2) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n, dtype=np.float32)
    prog = [["F3", "A3", "C4", "E4"], ["E3", "G3", "B3", "D4"], ["D3", "F3", "A3", "C4"], ["C3", "E3", "G3", "B3"]]
    roots = ["F2", "E2", "D2", "C2"]

    def add(start: float, sig: np.ndarray):
        i = int(start * SR)
        if i >= n:
            return
        j = min(n, i + len(sig))
        out[i:j] += sig[: j - i]

    def ep(freq: float, dur: float, vel: float) -> np.ndarray:
        tt = np.arange(int(dur * SR)) / SR
        env = np.minimum(1, tt / 0.012) * np.exp(-tt * 1.6)
        wob = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * tt)
        s = np.sin(2 * np.pi * freq * wob * tt) + 0.28 * np.sin(4 * np.pi * freq * tt) + 0.08 * np.sin(6 * np.pi * freq * tt)
        return (vel * env * s).astype(np.float32)

    bars = int(seconds / bar) + 2
    for b in range(bars):
        ch = prog[b % 4]
        start = b * bar
        for hit, vel in ((0.0, 0.16), (beat * 2.5, 0.11)):
            for k, nn in enumerate(ch):
                add(start + hit + k * 0.012, ep(note(nn), bar * 0.9, vel * (0.9 + 0.2 * rng.random())))
        rt = np.arange(int(bar * SR)) / SR
        add(start, (0.22 * np.sin(2 * np.pi * note(roots[b % 4]) * rt) * np.exp(-rt * 0.9)).astype(np.float32))
        for k in range(4):
            bt = start + k * beat
            if k in (0, 2):
                kt = np.arange(int(0.35 * SR)) / SR
                f = 50 + 60 * np.exp(-kt * 30)
                add(bt, (0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-kt * 9)).astype(np.float32))
            else:
                st = np.arange(int(0.18 * SR)) / SR
                add(bt, (0.07 * rng.standard_normal(len(st)) * np.exp(-st * 22)).astype(np.float32))
            for h in (0, 0.5):
                ht = np.arange(int(0.05 * SR)) / SR
                add(bt + h * beat + 0.012 * rng.random(), (0.018 * rng.standard_normal(len(ht)) * np.exp(-ht * 70)).astype(np.float32))
    out += 0.004 * rng.standard_normal(n).astype(np.float32)  # chiado de vinil
    out = lowpass(out, 3800)
    out /= max(1e-6, np.abs(out).max())
    return out[: int(seconds * SR)]


def build(key: str, spec: dict, outdir: str):
    os.makedirs(os.path.join(outdir, key), exist_ok=True)
    segs = [{"type": "intro", "text": spec["intro"]}]
    segs += [{"type": "scene", "shot": s["shot"], "text": s["text"], "step": i + 1} for i, s in enumerate(spec["scenes"])]
    segs.append({"type": "outro", "text": spec["outro"]})
    total_steps = len(spec["scenes"])

    voices = []
    t = 0.0
    cues = []
    for i, s in enumerate(segs):
        wav = os.path.join(outdir, key, f"seg{i:02d}.wav")
        v = tts(s["text"], wav)
        dur = len(v) / SR
        length = LEAD + dur + TAIL
        if s["type"] != "scene":
            length = max(length, MIN_CARD)
        s.update(start=round(t, 3), end=round(t + length, 3), speech=[round(t + LEAD, 3), round(t + LEAD + dur, 3)])
        voices.append((t + LEAD, v))
        # legendas proporcionais ao tamanho de cada pedaço
        parts = chunks(s["text"])
        weights = [len(p) + 8 for p in parts]
        acc = t + LEAD
        for p, w in zip(parts, weights):
            d = dur * w / sum(weights)
            cues.append({"start": round(acc, 3), "end": round(acc + d, 3), "text": p})
            acc += d
        t += length

    total = t + 0.4
    n = int(total * SR)
    narration = np.zeros(n, dtype=np.float32)
    presence = np.zeros(n, dtype=np.float32)
    for start, v in voices:
        i = int(start * SR)
        narration[i:i + len(v)] += v
        presence[max(0, i - int(0.25 * SR)):i + len(v) + int(0.3 * SR)] = 1
    # envelope suave para o ducking (sem cliques)
    k = int(0.25 * SR)
    kernel = np.ones(k, dtype=np.float32) / k
    presence = np.convolve(presence, kernel, mode="same")
    bgm = music(total, seed=sum(map(ord, key)))
    gain = 0.20 - 0.13 * presence
    fade = np.minimum(1, np.minimum(np.arange(n) / (1.2 * SR), (n - np.arange(n)) / (2.0 * SR)))
    mix = narration * 0.95 + bgm[:n] * gain * fade
    mix /= max(1.0, np.abs(mix).max() / 0.97)
    with wave.open(os.path.join(outdir, key, "mix.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())

    def ts(x: float) -> str:
        h, rem = divmod(x, 3600)
        m, s = divmod(rem, 60)
        return f"{int(h):02d}:{int(m):02d}:{s:06.3f}"

    with open(os.path.join(outdir, key, f"{key}.vtt"), "w", encoding="utf-8") as f:
        f.write("WEBVTT\n\n")
        for i, c in enumerate(cues, 1):
            f.write(f"{i}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['text']}\n\n")

    timeline = {"key": key, "title": spec["title"], "subtitle": spec["subtitle"], "duration": round(total, 3),
                "steps": total_steps, "segments": segs, "cues": cues}
    with open(os.path.join(outdir, key, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(timeline, f, ensure_ascii=False, indent=2)
    print(key, f"{total:.1f}s", len(cues), "legendas")


if __name__ == "__main__":
    outdir = sys.argv[1]
    specs = json.load(open(os.path.join(HERE, "videos.json"), encoding="utf-8"))
    keys = sys.argv[2:] or list(specs)
    for k in keys:
        build(k, specs[k], outdir)
