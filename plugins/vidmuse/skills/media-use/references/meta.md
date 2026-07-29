# Ownership, stats, and privacy

## Ownership

| Concern | Owner |
| --- | --- |
| Existing speaking footage, ASR/ATA policy, SRT/caption delivery | `vidmuse-recut` |
| No-source film and TTS narrative spine | `vidmuse-create` |
| AI image / voice / music / video execution | Media Use through VidMuse CLI |
| Official logos | Media Use official-source cascade |
| File transforms, LUTs, probing | Media Use deterministic local tools |
| Asset ledger, cache, preferences, recipes | Media Use `.media/` stores |

All AI provenance records `provider: vidmuse.model`, the selected
`model_name`, `generation_type`, and prompt. Media Use does not hold
provider-specific credentials.

## Local stats

```bash
node <SKILL_DIR>/scripts/resolve.mjs --stats --project . --days 7
```

Stats cover project/global cache hits, misses, provider/model provenance, and
disk use. Intent text and paths stay local.

## Privacy

VidMuse CLI owns authentication and remote model requests. Local asset records
contain the prompts and provenance needed for reproducibility. Do not place
secrets, credentials, or private identifiers in prompts or manifests.

Media Use telemetry remains coarse and optional; `DO_NOT_TRACK=1` disables it.
It must never send media contents, prompts, file names, or paths.
