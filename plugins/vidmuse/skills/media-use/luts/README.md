# LUT library

`index.json` is the deterministic color-look catalog used by media-use. LUTs
are built locally and frozen into the project; they do not depend on an
external provider or CDN.

Each look has:

- `id`, `description`, `tags`, and `intensity` for matching and application.
- `params`, a deterministic `buildCube` specification.

To add a look, create a new catalog entry with a unique ID and valid `params`,
then run the LUT provider tests. AI model calls are not used for color grading.
