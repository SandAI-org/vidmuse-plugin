# Preferences, recipes, and cross-project reuse

## Preferences

```bash
node <SKILL_DIR>/scripts/prefs.mjs get --project . --json
node <SKILL_DIR>/scripts/prefs.mjs record --project . \
  --key style_preset --value editorial-forest --workflow vidmuse-create
```

Only user-confirmed values are recorded. Project preferences live in
`.media/preferences.json`; a value confirmed in two projects can promote to the
personal `~/.media/preferences.json`.

## Recipes

```bash
node <SKILL_DIR>/scripts/recipe.mjs freeze --project . --name weekly-promo
node <SKILL_DIR>/scripts/recipe.mjs list --project . --workflow vidmuse-create
node <SKILL_DIR>/scripts/recipe.mjs use --project . --name weekly-promo
```

Recipes freeze an approved design/brief/storyboard skeleton as a named,
versioned bundle under `.media/recipes/` and `~/.media/recipes/`.

## Asset reuse

Generated and ingested assets are content-addressed in the project and global
cache. Run `resolve --candidates` before spending VidMuse credits, then import a
selected candidate with `--reuse <sha>`.
