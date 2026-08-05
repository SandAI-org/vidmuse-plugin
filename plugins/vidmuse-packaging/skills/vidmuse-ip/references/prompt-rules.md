# IP prompt compilation rules

Build one internal variable record per narration beat, then compile only the clauses that matter for that beat. Do not send this schema, unused values, option lists, or placeholder syntax to the video model.

## Internal variables

```yaml
REFERENCE_BINDING:
  image_refs: []
  audio_ref: null

OUTPUT_GOAL:
  format: null
  audience_effect: null

SEMANTIC_FOCUS:
  function: hook | question | event | cause | process | evidence | contrast | opinion | conclusion
  meaning: null

IP_ROLE:
  mode: auto | presenter | actor | guide | observer | hybrid
  action: null
  emotion: null

MUST_SHOW:
  event: null
  result: null

FACT_BINDING:
  source_facts: []
  display_mode: auto | literal | symbolic
  allow_model_inference: true

CONTINUITY:
  identity: approved-reference
  style: approved
  scene: adaptive

CREATIVE_FREEDOM:
  level: high | medium | low
```

## Compilation grammar

```text
PROMPT :=
  REFERENCE_BINDING
  + OUTPUT_GOAL
  + [SEMANTIC_FOCUS]
  + [IP_ROLE]
  + [MUST_SHOW]
  + [FACT_BINDING]
  + CONTINUITY
  + CREATIVE_FREEDOM
```

Square brackets mean optional. Omit an unresolved section entirely. Never describe all allowed roles, display modes, or creative choices in the final prompt.

## Rules

1. Bind approved reference tokens and let the image carry visible identity. Do not repeat character traits unless correcting observed drift.
2. Treat audio as semantic, rhythmic, and emotional input when the model accepts it. Use the matching beat audio, not unrelated full-program audio.
3. State the viewer meaning, not a catalog of effects. Add `MUST_SHOW` only when one event or result cannot be left to interpretation.
4. Choose the IP role from the beat, not the whole film:
   - favor `presenter` or `hybrid` for direct questions, personal judgments, key reminders, and conclusions;
   - favor `actor` for causes, processes, conflicts, and consequences;
   - favor `guide` or `observer` for evidence and comparison when participation would obscure the proof;
   - use `auto` when no role is clearly superior, and omit role instructions from the compiled prompt.
5. Bind explicit narration or evidence facts under `source_facts`. Use `literal` only when exact rendering matters; use `symbolic` for trend, scale, pressure, acceleration, or comparison. Do not create unsupported exact claims as decoration.
6. Default `CREATIVE_FREEDOM.level` to `high` for capable multimodal generation:
   - `high`: specify meaning and any indispensable result; let the model invent performance, metaphor, staging, and camera;
   - `medium`: add one primary action or spatial relationship;
   - `low`: add explicit phases and camera constraints for precision shots.
7. Keep the compiled prompt concise. Do not include both “may speak” and “may not speak”; either resolve the performance choice or omit it.
8. Preserve only stable continuity requirements. Do not restate the entire visual system in every prompt when approved references already carry it.

## Retry rule

After user review, change one variable per retry. Add the missing `MUST_SHOW` result, adjust `IP_ROLE`, change fact display mode, or reduce creative freedom. Do not replace a concise prompt with a fully choreographed prompt unless the reviewed failure shows that ambiguity is the cause.

## Resolved example

Internal decision:

```yaml
SEMANTIC_FOCUS:
  function: event
  meaning: "此前高涨的市场预期突然反转并引发股价暴跌"
IP_ROLE:
  mode: actor
  action: "经历并回应突然反转"
MUST_SHOW:
  event: "市场从高涨快速转为下坠"
  result: "人物和环境都受到冲击"
CREATIVE_FREEDOM:
  level: high
```

Compiled prompt:

```text
参考 @Image1 和 @Audio1，制作一段 2D 平面科普动画。围绕音频中“市场预期突然反转并引发股价暴跌”的含义展开，让 IP 亲身经历并回应这次变化。清楚表现市场从高涨快速转为下坠以及它带来的冲击；具体动作、视觉隐喻和场景变化自由发挥。保持参考 IP 和既定风格一致，画面连贯。
```
