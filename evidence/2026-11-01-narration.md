# Demo narration — 2026-11-01

## Request

A young British female voice for the demo, using `ELEVENLABS_API_KEY` from the shared credential file if it works,
and no paid subscription.

## ElevenLabs: refused

1. `GET /v1/voices` with the key read by name from `~/.hermes/.env` (never printed, copied or put on a command line)
   → **200**, 23 voices.
2. Voice chosen from the account's own labels: `zH7TN9vEZAsEway9xWev` — **Beth, British female, young**.
3. `POST /v1/text-to-speech/zH7TN9vEZAsEway9xWev` → **402 Payment Required**.
4. `GET /v1/user/subscription` → `tier: free`, `character_count: 9907` of `character_limit: 10000`.

So the key authenticates and the request shape is right; the account has **93 characters left**. That is why every
line was refused. No paid plan was created and no other hosted provider was called.

## Fallback: piper, already on the host

`piper` and the voice `~/.local/share/piper/en_GB-alba-medium.onnx` (British female) were already installed, so the
same script in `narration.json` was spoken locally. Nothing was downloaded; no network service was used.

`python3 scripts/narrate-local.py` → per-scene clips placed at each scene's start time on one 44.1 kHz mono track,
then muxed into the rendered video with the video stream copied, not re-encoded.

| Scene | Clip | Window | Tempo |
| --- | --- | --- | --- |
| hook | 5.36 s | 9.0 s | 1.00 |
| problem | 29.68 s | 52.0 s | 1.00 |
| how | 62.99 s | 82.0 s | 1.00 |
| arch | 18.96 s | 22.0 s | 1.00 |
| real | 27.26 s | 26.0 s | 1.07 |
| outro | 8.75 s | 12.0 s | 1.00 |

Only the `real` scene overran its window, so only that line was sped up (1.07×, below the 1.35× cap); nothing was cut.

## Result

`ffprobe out/video.mp4`:

```
0,h264,video
1,aac,audio,44100,1
duration 203.000000
```

The video now carries audio for its full length. `out/video-silent.mp4` and `out/narration.wav` are local render
artefacts and are not committed (`videos/decisionfuse-demo/.gitignore` excludes `out/`).

## Honest limits

- The voice is piper's `en_GB-alba-medium`, not ElevenLabs Beth. It is a British female synthetic voice; it is not
  the commercial voice originally requested, and it should not be described as one.
- The privacy/pilot wording in the narration matches the code: no automatic closure, no model-approved writes.
- If ElevenLabs credits are added later, `scripts/voiceover.py` + `narration.json` reproduce the same script with the
  chosen voice; the mux step in `scripts/narrate-local.py` still applies.
