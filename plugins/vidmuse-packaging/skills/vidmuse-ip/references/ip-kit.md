# Simple IP Kit

Keep one human-readable identity file and a small asset folder. Do not introduce a schema or validator until multiple real scenarios prove that one is needed.

## `IP.md`

```markdown
# IP

## Identity
- Name:
- Source: supplied avatar / creator likeness / original character
- One-sentence identity:
- Audience impression:

## Approved style
- Source: VidMuse style id or custom reference
- Name:
- Preview/reference:
- Confirmed by user:

## Must remain consistent
- Face:
- Silhouette and proportions:
- Hair / signature marks:
- Fixed wardrobe or colors:
- Voice:

## May change
- Expressions:
- Episode props:
- Backgrounds:
- Flexible wardrobe:

## Avoid
- Identity drift:
- Style drift:
- Unapproved transformations:

## Approved assets
- Hero:
- Turnaround:
- Expressions:
- Reusable poses and cutouts:
- Reusable scenes and props:

## Consent
- Likeness:
- Voice clone:
```

## `style.json`

Save the complete result from `vidmuse style get`, plus a `confirmed_at` timestamp. For a custom reference, save its local path or URL, the user's description, and the confirmation timestamp instead.

## `provenance.json`

Keep one simple array. Each generated asset records:

- local path;
- model id;
- prompt;
- input reference paths;
- returned URL when present;
- generation time and credit cost;
- approval state.

## Episode snapshot

Copy `IP.md` into the episode as `IP-SNAPSHOT.md`. Promote a new pose, scene, or prop back into the reusable kit only when the user approves it for future episodes.
