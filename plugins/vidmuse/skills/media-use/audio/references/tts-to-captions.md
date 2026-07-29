# TTS to captions

VidMuse TTS produces the voice asset; VidMuse ATA produces caption timing from
the exact locked line and generated audio.

```text
locked text -> VidMuse TTS -> local audio
locked text + local audio -> VidMuse ATA -> words[] + utterances[]
```

Regenerating voice invalidates prior timing and requires ATA again. Caption
grouping begins from ATA utterance boundaries; styling belongs to the owning
VidMuse product workflow.
