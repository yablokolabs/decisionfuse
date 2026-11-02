# Demo published on Vimeo — 2026-11-02

The 2:23 demo is now publicly watchable on Vimeo. Checked, not assumed.

| Item | Value | How |
| --- | --- | --- |
| URL | `https://vimeo.com/1242318404` | owner |
| Page status | **200** | `curl -sIL` |
| oEmbed status | **200** | `https://vimeo.com/api/oembed.json?url=…` |
| Title | `decisionfuse-demo-2m23` | oEmbed |
| Duration | **143 s = 2:23** | oEmbed `duration` |
| Cap check | **under five minutes** | 143 < 300 |
| Uploaded | 2026-11-02 05:23:03 | oEmbed `upload_date` |
| `width`/`height` in oEmbed | 426x240 | oEmbed |

The 426x240 figures are what Vimeo's oEmbed reports for the embed preset, not the
uploaded resolution: the pre-upload file measured 1920x1080 in
`evidence/2026-11-01-owner-recut.md`. Playback resolution was not verified here.

README's `## Demo` now links the Vimeo page, with the 35 MB MP4 release asset kept
as a download fallback.

Still true and not fixed by publishing: the re-cut's source is not in this
repository, so `videos/decisionfuse-demo` renders a different 3:23 cut. The music
licence is recorded in `THIRD_PARTY_NOTICES.md` from the owner's statement.

The competition entry itself is submitted manually by the owner. Nothing in this
repository submits it, and no Marketplace listing exists.
