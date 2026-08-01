# VidMuse plugin runtime policy

This policy is shared by `/vidmuse-recut` and `/vidmuse-create`. Read it once
when a film workflow starts; do not duplicate it in each workflow.

## Namespace

VidMuse owns its film deliverables. The plugin intentionally does not ship
upstream HyperFrames creation workflows such as `talking-head-recut`,
`product-launch-video`, `embedded-captions`, or `general-video`.

- Enter fresh work through `/vidmuse`.
- Once `/vidmuse-recut` or `/vidmuse-create` owns a film, domain skills cannot
  reopen routing.
- If the selected workflow's input contract is wrong, return to `/vidmuse`;
  never install a competing upstream workflow.

## Vendored skills

The plugin ships its required HyperFrames, GSAP, media, asset, and motion
skills under `skills/`. Treat those copies as part of the plugin version.

- Do not run `npx hyperframes skills update`, with or without a workflow name.
- Ignore stale-skill update reminders printed by HyperFrames CLI commands.
  Record the notice in the run log instead of replacing plugin-owned skill
  text.
- A missing bundled skill means the plugin payload is incomplete. Reinstall or
  update VidMuse rather than downloading an upstream skill as repair.

## HyperFrames initialization

Bare `npx hyperframes init` may refresh skills. Initialize with:

```bash
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init …
```

The environment variable remains required until the vendored
`hyperframes-cli/references/init-and-scaffold.md` confirms that the CLI flag alone
prevents skill refresh.

## Preview and delivery

VidMuse Timeline is the user review surface:

```bash
vidmuse serve <project>/dsl.json
```

Do not auto-open HyperFrames Studio or `npx hyperframes preview`. Use
HyperFrames `lint`, `check`, `snapshot`, `keyframes`, and optional renders for
craft verification. Open Studio only when the user explicitly requests it.
The query-only forms `preview --context --json` and
`preview --selection --json` are allowed against an already running,
user-requested Studio session because they do not start or open Studio.

## Work directories

Skill directories are read-only. Put all run artifacts under the user's
workspace, normally `videos/<project-name>/`, or another directory the user
names.
