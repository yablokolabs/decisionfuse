# Demo hosting — 2026-11-01

The 2:23 demo is published as a **release asset**, not as a file in the repository.

| Item | Value |
| --- | --- |
| Release tag | `demo-2026-11-01` |
| Asset | `decisionfuse-demo-2m23.mp4` |
| Size | 35,187,873 bytes |
| Source file | `videos/decisionfuse-demo/out/video.mp4` (git-ignored) |
| Link check | `curl -IL` → **http 200** |
| README | `## Demo` section links the asset URL |

Why not commit it: `videos/decisionfuse-demo/.gitignore` excludes `out/`, a 35 MB
binary in git history is awkward to remove, and the music bed's licence is still
unrecorded. A release asset can be deleted in one command
(`gh release delete demo-2026-11-01`), which a committed blob cannot.

What is still wrong: the file is public and its music has no recorded licence.
That is stated in the README and in the release notes rather than hidden. Either
record the composer and licence in `THIRD_PARTY_NOTICES.md`, or delete the release.
