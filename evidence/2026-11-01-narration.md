# Demo narration attempt — 2026-11-01

## Request

Narration for the demo using a young British female voice, with `ELEVENLABS_API_KEY` from the shared credential file
if it works, and no narration otherwise.

## What was tried

1. `GET https://api.elevenlabs.io/v1/voices` with the key read by name from `~/.hermes/.env` (never printed, copied or
   put on a command line) → **200**, 23 voices returned.
2. Voice selection from the account's own voice list, filtered on `labels.accent = british`, `labels.gender = female`,
   `labels.age = young`:
   - `zH7TN9vEZAsEway9xWev` — **Beth, British female, playful and witty, young** ← chosen
   - `bGnz83yTAb7caZSC7BBz` — Georgia K, British, female, young
   - `Xb7hH8MSUJpSbSDYk0k2` — Alice, British, female, middle-aged
   - `pFZP5JQG7iQjIQuC4Bku` — Lily, British, female, middle-aged
3. Narration script written to `videos/decisionfuse-demo/narration.json`, one entry per scene, each with the window it
   has to fit.
4. `python3 scripts/voiceover.py` → `POST /v1/text-to-speech/zH7TN9vEZAsEway9xWev`
   → **402 Payment Required**.

## Result

The key authenticates (voice listing succeeded) but the account cannot synthesise speech: ElevenLabs answered
`402 Payment Required`, which is a credit or plan limit, not a credential error. Per the instruction, no paid
subscription was created and no substitute provider was used.

**The demo video is therefore silent.** The scene copy carries the explanation on screen. If narration is added later,
`scripts/voiceover.py` and `narration.json` are ready and the voice id is documented above.

## What this does not claim

- No narration audio exists in the repository.
- Nothing here is evidence of an ElevenLabs integration; it is evidence that the request failed with 402.
