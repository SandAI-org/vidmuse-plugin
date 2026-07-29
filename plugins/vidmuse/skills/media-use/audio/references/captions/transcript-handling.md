# Transcript handling

Preferred inputs:

1. user-supplied subtitle/script text;
2. VidMuse ASR when no text exists.

Both paths use VidMuse ATA for word timing. Check recognized text for proper
nouns, products, numbers, duplicated spans, missing passages, and language
drift. Correct text, then rerun ATA. Do not use local Whisper/Parakeet or an
external transcription API from this skill.
