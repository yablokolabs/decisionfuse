# Demo published — 2026-11-02

The 2:23 demo is public. YouTube is the primary link because the competition asks for
one; the Vimeo copy and the MP4 release asset stay as backups. Checked, not assumed.

## Primary — YouTube

| Item | Value | How |
| --- | --- | --- |
| URL | `https://www.youtube.com/watch?v=EMhyd0Htq8o` | owner |
| Page status | **200** | `curl -sIL` |
| oEmbed status | **200** | `https://www.youtube.com/oembed?url=…&format=json` |
| Title | `decisionfuse demo` | oEmbed |
| Channel | `Santee` | oEmbed `author_name` |
| oEmbed `width`/`height` | 200x113 | embed preset, not the upload resolution |

YouTube's oEmbed does not report duration, so the five-minute cap is not provable from
YouTube alone. The file that was uploaded measured **143.3 s (2:23)** by `ffprobe`
(`evidence/2026-11-01-owner-recut.md`), and the identical cut on Vimeo reports
`duration: 143` through its oEmbed. Cap met on that evidence; if a stricter check is
needed, read the duration off the watch page itself.

## Backup — Vimeo

| Item | Value | How |
| --- | --- | --- |
| URL | `https://vimeo.com/1242318404` | owner |
| Page status | **200** | `curl -sIL` |
| oEmbed status | **200** | `https://vimeo.com/api/oembed.json?url=…` |
| Title | `decisionfuse-demo-2m23` | oEmbed |
| Duration | **143 s = 2:23** | oEmbed `duration` |
| Uploaded | 2026-11-02 05:23:03 | oEmbed `upload_date` |

The 426x240 in Vimeo's oEmbed is its embed preset, not the uploaded resolution; the
pre-upload file measured 1920x1080.

## Backup — repository release asset

`demo-2026-11-01` → `decisionfuse-demo-2m23.mp4`, 35,187,873 bytes, `curl -IL` **200**.
Not committed: `out/` is git-ignored and a 35 MB binary is awkward to remove from history.

## Still true, not fixed by publishing

- The re-cut's source is not in this repository, so `videos/decisionfuse-demo` renders a
  different 3:23 cut (`evidence/2026-11-01-owner-recut.md`).
- The music licence is recorded in `THIRD_PARTY_NOTICES.md` from the owner's statement,
  not from a licence document.
- The competition entry is submitted manually by the owner. No Marketplace listing exists.
