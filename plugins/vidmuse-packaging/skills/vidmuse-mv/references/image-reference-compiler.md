# MV image-reference compiler

Use this reference to turn the approved `## Visual Direction`, `## Production Bible`, and `## Shot Plan` inside `MV-SCRIPT.md` into the smallest reliable set of image-generation requests. Query the live VidMuse model catalog before every paid run; live schemas, model availability, reference limits, sizes, quality controls, and prices override this document.

This compiler distills current first-party guidance rather than copying sample prompts:

- [OpenAI GPT Image 2 prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- [OpenAI guidance for creating images](https://openai.com/academy/image-generation/)
- [Google Gemini native image generation guide](https://ai.google.dev/gemini-api/docs/image-generation)
- [Google Nano Banana Pro prompt tips](https://blog.google/products-and-platforms/products/gemini/prompting-tips-nano-banana-pro/)

## Choose the model by the reference job

Prefer a production-grade live model for approved continuity assets. Current candidates to look for include `gpt-image-2` and Nano Banana Pro / `gemini-3-pro-image`; never invent a provider alias when the live catalog uses another name.

- Favor the strongest identity and edit-preservation path for a face sheet, character isolation, costume edit, or surgical continuity repair.
- Favor strong multi-reference composition and complex instruction following for a scene still that combines an approved character, look, prop, and location.
- Use a faster or cheaper model for disposable exploration only when the user prioritizes latency or budget and knows it is not the final continuity anchor.
- Compare live input limits, editing support, output controls, price, and expected retries. A famous model name is not a substitute for compatibility.
- Do not pay for 4K merely because it is available. Generate enough real detail for the intended crop and downstream model, then increase quality only when face, fabric, small prop, or typography fidelity requires it.

Record the exact live model name, request schema, price item, output path, and cost beside every approved reference.

## Compile in a stable order

For a new image, write a skimmable brief in this order and omit irrelevant sections:

1. **Purpose:** identity close-up, turnaround, Look card, Location card, Prop card, or scene anchor.
2. **Reference bindings:** name each input by index or stable ID and give it exactly one role.
3. **Canvas and composition:** aspect ratio, framing, viewpoint, subject scale, spatial placement, and negative space.
4. **Subject and identity:** visible anatomy, face/hair/body traits, wardrobe/look ID, gaze, pose, action, and object interaction.
5. **Location and story state:** place, time, weather, practical set detail, and what has just happened.
6. **Visual language:** approved Style traits, medium, material, texture, palette, color treatment, and realism target from `MV-SCRIPT.md` → `## Visual Direction`.
7. **Camera and light:** useful photographic or illustrative control such as shot size, angle, lens character, depth of field, light direction/quality, and exposure mood.
8. **Continuity invariants:** the exact character, Look, Location, Prop, geometry, placement, and palette facts that must survive.
9. **Exclusions:** only likely failure modes, such as extra people, extra limbs, duplicate props, text, logo, watermark, split panels, scenery on an identity sheet, or unapproved costume changes.

Use clear natural language. Labeled short sections are useful for complex requests, but prompt syntax itself is not the goal. Describe concrete materials, shapes, textures, spatial relationships, and light instead of vague praise such as “beautiful,” “epic,” or “high quality.”

## Bind references explicitly

Do not upload a pile of images and expect the model to infer their roles. Use bindings such as:

- `Image 1 / Character C01`: preserve face, hair identity, skin tone, age read, and body proportions.
- `Image 2 / Look L02`: use only the wardrobe, footwear, accessories, and hair/makeup styling.
- `Image 3 / Location S03`: use only the architecture, spatial geography, palette, weather, and light direction.
- `Image 4 / Prop P01`: preserve the object's shape, material, color, wear, and current state.
- `Style ST01`: apply only the approved medium, texture, color treatment, and camera/light language; do not copy its sample subject or composition.

Use the smallest input set that covers the shot. State where transplanted elements belong and require matching perspective, scale, light, shadow, and occlusion. Do not let a reference contribute unassigned clothing, background, pose, props, text, or branding.

## Separate change from preservation

For every edit, state both sides:

```text
Change only: <one requested dimension>.
Preserve exactly: <identity, geometry, framing, approved look/location/prop state, palette, light, and any locked text that must remain>.
Do not add: <likely unwanted elements>.
```

Repeat the critical preserve list on each iteration. Make one targeted revision at a time so a failure can be diagnosed. If the face drifts while changing a coat, restore the approved face and body invariants instead of rewriting the whole scene prompt or regenerating from prose.

## Character identity pack

Create identity references before wardrobe or location composites. Prefer separate clean images over one decorative character poster.

### Face close-up

Require:

- one person only, straight-on or near-straight-on face close-up;
- pure white or very light neutral seamless background with no visible environment;
- even neutral soft light, natural skin and hair texture, no dramatic grade;
- neutral expression, direct gaze, unobstructed face, hairline and ears readable when natural;
- shoulders may appear, but no story wardrobe, jewelry, props, text, logos, borders, inset images, or contact-sheet layout.

For a real performer edit, say `change only the background and reference framing` and explicitly preserve exact likeness, facial geometry, skin tone, hair, age read, and identity.

### Full-body three-view turnaround

Require:

- one identity shown in exactly three full-body views: front, clean side profile, and back;
- head-to-toe framing with feet visible, equal scale, neutral upright pose, and consistent anatomy;
- the same pure white or neutral seamless background and even neutral light in every view;
- neutral fitted base clothing when wardrobe changes later, or the approved invariant costume when it never changes;
- no perspective drama, crop, action pose, scenery, props, text, labels, borders, floor clutter, extra views, or duplicated limbs.

If the model cannot keep all three views coherent, generate and approve the front view first, then derive side and back through change-only edits. Do not accept a beautiful sheet with three different faces.

## Production-design cards

### Look card

Bind one `Look ID`. Show the approved clothing silhouette, fabric, fit, footwear, accessories, hair/makeup, and front/back construction under neutral light. Keep the character identity unchanged. Use a blank background so the garment cannot smuggle a location into later video shots.

### Location card

Bind one `Location ID`. Show the usable geography, entrances/exits, surfaces, palette, time, weather, practical lights, and camera headroom. Omit the lead character unless their scale is necessary; if scale is needed, use a neutral non-identity silhouette. A location card explains space rather than performing a finished hero shot.

### Prop card

Bind one `Prop ID`. Show the object's stable shape, material, color, wear, scale cue, and any approved state variants. Use a neutral background unless the prop's placement is part of its identity.

### Scene anchor

Combine only approved IDs. Describe the narrative event, subject scale, pose/action, gaze, object interaction, environment, camera, light, and ending state. Require believable contact, weight, fabric behavior, shadows, reflections, perspective, and occlusion so the result feels photographed in one world rather than pasted together.

## Realism without generic “cinematic” polish

When the approved direction is photoreal, describe an image as a plausible captured moment. Specify natural or motivated light, believable skin and material texture, worn or practical surfaces, normal optical behavior, and production detail appropriate to the location. Use camera language to control composition and mood, not to claim exact optical simulation.

Avoid automatic teal-orange grading, glossy skin, excessive haze, impossible rim light, plastic fabric, showroom-clean locations, poster staging, or shallow depth of field that erases continuity-critical detail unless the approved visual direction explicitly earns them.

## Text and multi-panel output

Identity, Look, Location, and Prop references should normally contain no generated text. File names and `MV-SCRIPT.md` carry IDs more reliably than pixels.

When text must be visible in a scene anchor:

- provide the exact text in quotes;
- state that it appears once, verbatim, with no extra characters;
- specify placement, hierarchy, font character, color, and contrast;
- keep the copy short and use a higher live quality tier when dense text matters;
- plan deterministic replacement later when spelling is delivery-critical.

For a storyboard or turnaround, specify the exact panel/view count and order. Reject extra panels, labels, decorative captions, or a different character in each panel.

## Approval gate

Approve a reference only when:

- its stable ID and single downstream role are clear;
- the selected Style traits are present without copying sample content;
- character identity is consistent across close-up and body views;
- white-background identity assets contain no environmental leakage;
- Look, Location, and Prop changes match the production-design plan rather than accidental drift;
- the framing has enough headroom for the intended video shot and target ratio;
- hands, feet, object contact, fabric, shadows, perspective, and scale are plausible where visible;
- no extra person, limb, object, text, logo, watermark, panel, or unapproved styling appears;
- the original path and every derived edit retain model and cost provenance.
