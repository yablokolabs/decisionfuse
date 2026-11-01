#!/usr/bin/env python3
"""Generate one narration clip per scene with ElevenLabs.

The API key is read from ELEVENLABS_API_KEY in the environment or from
~/.hermes/.env by name only; it is never printed, copied or passed on a command
line. Voice: Beth, a young British female stock voice.
"""
import json
import os
import re
import subprocess
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.expanduser("~/.hermes/.env")
VOICE_ID = os.environ.get("DECISIONFUSE_VOICE", "zH7TN9vEZAsEway9xWev")  # Beth: British, female, young
MODEL_ID = "eleven_multilingual_v2"


def api_key() -> str:
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"]
    with open(ENV_FILE, encoding="utf-8") as handle:
        for line in handle:
            match = re.match(r"\s*ELEVENLABS_API_KEY\s*=\s*(.*)$", line)
            if match:
                return match.group(1).strip().strip('"').strip("'")
    raise SystemExit("ELEVENLABS_API_KEY not found")


def synthesise(text: str, destination: str, key: str) -> None:
    payload = json.dumps(
        {
            "text": text,
            "model_id": MODEL_ID,
            "voice_settings": {
                "stability": 0.45,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True,
            },
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128",
        data=payload,
        headers={"xi-api-key": key, "content-type": "application/json", "accept": "audio/mpeg"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            audio = response.read()
    except urllib.error.HTTPError as error:
        raise SystemExit(f"ElevenLabs refused the request: {error.code} {error.reason}") from error
    with open(destination, "wb") as handle:
        handle.write(audio)


def duration(path: str) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(result.stdout.strip())


def main() -> None:
    key = api_key()
    with open(os.path.join(ROOT, "narration.json"), encoding="utf-8") as handle:
        scenes = json.load(handle)
    total = 0.0
    for scene in scenes:
        destination = os.path.join(ROOT, "public", f"vo-{scene['id']}.mp3")
        synthesise(scene["text"], destination, key)
        seconds = duration(destination)
        total += seconds
        status = "ok" if seconds <= scene["window"] else "OVER"
        print(f"{scene['id']:8s} {seconds:6.2f}s  window {scene['window']:5.1f}s  {status}")
    print(f"total {total:.1f}s")


if __name__ == "__main__":
    main()
