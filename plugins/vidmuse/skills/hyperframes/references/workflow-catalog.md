# Workflow catalog — VidMuse plugin

> **VidMuse plugin inventory.** Not an active product router.
> Every fresh request → **`/vidmuse`**; it selects one owner by deliverable.
> Do not install `/talking-head-recut` or other HF creation workflows from this doc.
> Authority: `/vidmuse` + selected owner ≫ `/hyperframes` ≫ this file.


| Input state | Active product workflow |
| --- | --- |
| Existing person speaking on camera | `/vidmuse-recut` |
| No speaking plate: script, URL, prompt, TTS, or generated-media film | `/vidmuse-create` |
| Standalone ASR, ATA, TTS, generation, or media transform | `/media-use` |
| Semantic asset/library work | `/vidmuse-assets` |
| Existing VidMuse run needs semantic composition motion | `/vidmuse-motion` |
| Existing HyperFrames project needs a specific CLI operation | `/hyperframes-cli` |

Files under `references/routes/` are frozen upstream provenance only. Do not
invoke or install the workflow names found there.
