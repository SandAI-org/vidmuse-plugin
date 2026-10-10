# UGC reference prompts

## Basis and adaptation

Derived from the user's supplied *The Prompting Handbook*, July 2026 V1.2,
especially pages 5, 12–18, 22, 31, and 33. These are prompting methods, not a
live model capability or pricing source. Use Sunburst as selected by the user;
resolve API details through the live VidMuse CLI catalog.

The handbook's page 17 example uses a head portrait, side portrait, and full
body. The user selected a different layout: face close-up, front full body,
and back full body on one white 16:9 image. Preserve the user's layout.
The handbook's cinematic style lines and broad negative lists are not universal
UGC requirements. Direct eye contact, centered talking shots, and smiles may
fit UGC; do not ban them mechanically. Transfer the scene-description and
identity-preservation logic without imposing a cinematic finish.

## Separate reference jobs

- Character: face, hair, skin tone, age appearance, body proportions, clothing,
  and footwear. White background removes an unintended location cue.
- Environment: camera-visible geography, usable surfaces and movement space,
  region, time of day, and light direction. No performer unless explicitly needed.
- Product: the actual item's geometry, material, color, packaging, and branding.
  Reuse supplied product images rather than redesigning a real item.

Bind each image to its role in downstream video instructions. A character sheet
depicts one person three times, not three people. It does not determine the
video's opening composition or require the white background in the video.

## Write the character sheet

1. State the purpose and one 16:9 landscape image with a pure white background.
2. Specify exactly three depictions and their order: left face close-up, middle
   front full body, right back full body. Give the face enough space to identify
   the person. Keep the two bodies equally scaled, aligned, and fully visible.
   Make the close-up an independent crop, not the physical scale of the body
   views. Balance its area against the two full-body views so it does not
   visually overwhelm the sheet. Describe coherent adult head, shoulder, torso,
   arm, leg, and foot proportions within the body views, with a sufficiently
   distant, level camera around torso height to avoid perspective enlargement
   of the head. Do not fix a ratio by only stretching the legs. Numerical
   head-height targets may guide a particular correction, but are not a universal
   body standard for every creator.
3. Define a specific plausible creator for the intended audience: face shape,
   age appearance, styled hair, skin detail, and body proportions. Do not equate
   an overseas audience with one ethnicity. Specify makeup by visible result:
   complexion finish, brow shape, eye definition, blush placement, and lip color.
   Natural texture can coexist with makeup and deliberate grooming.
4. Name one styled everyday outfit, footwear, and selected wearable accessories,
   with the same materials, colors, and details in every depiction. Describe
   fit, silhouette, color pairing, and a focal styling detail. Use relaxed neutral
   poses and an unobstructed face. Camera-ready UGC should not default to an
   unstyled T-shirt, messy hair, and a bare face. Consult the dated
   [styling research](./ugc-styling-research-2026-10.md) for starting directions,
   then adapt to the actual creator, product category, market, and season.
5. Use even neutral light and natural detail; no scene, product, labels, borders,
   extra views, props, or promotional staging. Do not add skin defects or grain
   merely to prove authenticity.

If a supplied approved performer already exists, derive the sheet through an
edit that preserves their identity. Do not replace them to satisfy a template.
For a wardrobe or hair change, edit the current sheet first and use the updated
reference consistently. Inspect identity, full-body anatomy, and outfit continuity
after generation; prompt wording alone does not prove consistency.

## Write a lived-in overseas environment

Specify an actual place and household context before decor. An American rented
apartment, a British terraced-house kitchen, and a German flat are different
briefs. Use the selected locale consistently without treating a style cue as
proof of where an image was taken.

Build the environment from the intended rear-camera viewpoint:

- Camera: fixed or operated by someone else, height, direction, shot size, and
  how far the action area is from the lens. The filming phone stays off-screen.
- Foreground: the real surface or floor visible at the lower edge, with usable
  space for hands, a product, or feet as required by the UGC format.
- Action area: the seat, standing spot, counter, or opening area the performer
  will occupy. Reserve the space physically, not through vague "negative space."
- Background: a few specific, region-compatible architectural and household
  elements at named positions, with enough depth to orient the viewer.
- Signs of use: ordinary objects left by plausible activities. Examples include
  a coffee mug next to yesterday's mail, a dish towel on an oven handle, a partly
  emptied grocery bag near the counter, or a sweater over a chair. Select only
  the traces that fit this household and keep the main action surface usable.
- Light: a named window or practical fixture with coherent direction and
  ordinary exposure. Phone-style color and readable surroundings; do not turn
  every interior into perfect golden-hour product photography.

Concrete visible evidence does the work. "Cozy, authentic, Western, lived-in"
does not replace spatial choices. Avoid showroom symmetry, identical decorative
arrangements, pristine surfaces everywhere, or a pile of random objects.

## Prompt assembly and edits

Use clear connected language: purpose and reference roles, composition,
subject or environment, light, visible texture, then a short targeted exclusion
list. Keep ratio and resolution in supported request fields. Exact focal-length
numbers are optional shorthand; describe the perspective and focus effect.

For edits, state what changes and what remains. Assign input images by their
actual order or supported reference syntax, without inventing `@image` API
fields. Preserve face identity, outfit, room geography, or product details only
where that reference owns them; match final scale, light, contact, and occlusion
when elements interact in a scene.

## Review the generated references

- One character sheet, three views, one identity and outfit, pure white
  background, complete feet, no extra panel or embedded scenery.
- Check head-to-body balance within each full-body view independently of the
  enlarged portrait. Shoulders, torso, arms, legs, and feet must form one
  plausible body; front and back match in height, scale, and anatomy.
- Environment reads as the stated household context, has coherent camera
  perspective and light, and leaves the planned action space usable.
- Intentional creator styling with natural skin, cloth, and household materials;
  recognizable makeup and hair choices without plastic skin or unplanned
  cinematic treatment.
- Reference roles remain distinct. Note any failure from the actual image and
  fix that dimension without rewriting successful elements.
