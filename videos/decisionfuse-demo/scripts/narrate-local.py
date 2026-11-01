#!/usr/bin/env python3
"""Narrate the demo locally with piper and mux it into the rendered video.

ElevenLabs refused synthesis (402 on a free tier at 9907/10000 characters), so
the same script is spoken by the local piper voice that is already installed:
en_GB-alba-medium, a British female voice. Nothing is downloaded and no service
is called.

Each scene's line is spoken separately, then placed at that scene's start time on
a 44.1 kHz mono track, so a line never runs into the next scene. A line that
overruns its window is sped up (atempo, capped) rather than cut.
"""
import json
import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.path.expanduser("~/.local/share/piper/en_GB-alba-medium.onnx")
RATE = 44100
BYTES_PER_FRAME = 2  # s16le mono

# Scene starts in seconds, mirroring src/storyboard.tsx.
STARTS = {"hook": 0, "problem": 9, "how": 61, "arch": 143, "real": 165, "outro": 191}


def speak(text: str, destination: str, length_scale: float) -> None:
    subprocess.run(
        ["piper", "-m", MODEL, "-f", destination, "--length-scale", f"{length_scale:.3f}", "--sentence-silence", "0.22"],
        input=text.encode("utf-8"),
        check=True,
        capture_output=True,
    )


def pcm(path: str, tempo: float = 1.0) -> bytes:
    filters = ["-af", f"atempo={tempo:.4f}"] if abs(tempo - 1.0) > 0.001 else []
    return subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, *filters, "-ar", str(RATE), "-ac", "1", "-f", "s16le", "-"],
        check=True,
        capture_output=True,
    ).stdout


def duration(path: str) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(out.stdout.strip())


def main() -> None:
    with open(os.path.join(ROOT, "narration.json"), encoding="utf-8") as handle:
        scenes = json.load(handle)

    total_seconds = 203
    track = bytearray(total_seconds * RATE * BYTES_PER_FRAME)

    with tempfile.TemporaryDirectory() as tmp:
        for scene in scenes:
            clip = os.path.join(tmp, f"{scene['id']}.wav")
            speak(scene["text"], clip, 1.0)
            seconds = duration(clip)
            window = float(scene["window"])
            tempo = 1.0
            if seconds > window - 0.6:
                tempo = min(1.35, seconds / (window - 0.6))
            data = pcm(clip, tempo)
            offset = int(STARTS[scene["id"]] * RATE) * BYTES_PER_FRAME
            end = min(len(track), offset + len(data))
            track[offset:end] = data[: end - offset]
            print(f"{scene['id']:8s} {seconds:6.2f}s  window {window:5.1f}s  tempo {tempo:4.2f}")

    raw_path = os.path.join(ROOT, "out", "narration.raw")
    wav_path = os.path.join(ROOT, "out", "narration.wav")
    with open(raw_path, "wb") as handle:
        handle.write(track)
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(RATE), "-ac", "1", "-i", raw_path, wav_path],
        check=True,
    )
    os.remove(raw_path)

    video = os.path.join(ROOT, "out", "video.mp4")
    silent = os.path.join(ROOT, "out", "video-silent.mp4")
    if not os.path.exists(silent):
        os.replace(video, silent)
    narrated = os.path.join(ROOT, "out", "video-narrated.mp4")
    subprocess.run(
        [
            "ffmpeg", "-y", "-v", "error", "-i", silent, "-i", wav_path,
            "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
            "-shortest", narrated,
        ],
        check=True,
    )
    os.replace(narrated, video)
    print(f"narrated track: {duration(wav_path):.2f}s -> {video}")


if __name__ == "__main__":
    main()
