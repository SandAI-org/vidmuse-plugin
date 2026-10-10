---
name: vidmuse-ads
description: "Create and revise AI product advertisements, currently focused on UGC talking, demonstration, try-on, and unboxing. Own creative research, reference images, video direction, generation, and review through vidmuse-cli."
---

# VidMuse Ads

## Status

The UGC workflow is being refined through conversation and production trials.
This skill owns advertising production; additional ad formats remain in development.

## Ownership and loading

The advertising execution path is `vidmuse-ads` + `vidmuse-cli`. Ads owns the
brief, research, concept, casting, locations, prompts, reference selection,
generation decisions, repairs, and final review. CLI owns the VidMuse command
contract, authentication, live model metadata, pricing, and provider execution.
Ads consumes the CLI's execution results and decides the next production or
review step. Advertising orchestration and dependency rules belong here.

Do not load or delegate ad operations to `vidmuse-media`, including probing,
frame extraction, audio checks, and clip repair. Do not enter `vidmuse-create`,
`vidmuse-ip`, `vidmuse-assets`, `vidmuse-design`, `vidmuse-motion`, Timeline, or
HyperFrames workflows as dependencies of an ad. Reuse supplied identities and
assets without loading the workflow that originally created them.

Read only the ads references needed for the current format and stage. Use the
host's native web, browser, file, and media-inspection tools directly. The
prompt guidance maintained here is sufficient for this workflow; do not load
external image/video prompt skills or skill-authoring skills during ad production.
A separately requested non-ad deliverable can be routed independently.

## Confirmed purpose

Provide a dedicated workflow for creating various kinds of AI advertisements.

## Initial focus: UGC

Develop UGC advertising first. UGC contains multiple formats; talking-to-camera,
unboxing, and try-on are the initial examples, not an exhaustive taxonomy.

These formats share the feel of footage recorded with a phone's rear camera.
Carry that capture premise through camera placement, framing, lighting, and
performance. Determine the camera setup from the content: fixed talking shots,
operator-held following shots, and camera-operator POV with offscreen dialogue
are all valid. Do not default all UGC to a stationary presenter. The camera
operator can participate as a character without appearing on screen.

## Generation approach: reference-to-video

Use reference-to-video generation for UGC. Prepare references for the person,
scene, product, and other relevant elements, then use them together to guide
the video. References may be supplied or generated as needed.

Do not reduce this approach to animating one generated first frame. Reference
images establish the elements to preserve; the shot instructions define their
interaction, performance, camera behavior, and speech. Seedance 2.5 was used
for the current video trials. Resolve its current input contract, audio,
duration, resolution, and price through `vidmuse-cli` before execution; a
user-selected model takes precedence.

## Creative development before asset generation

For a new ad concept, read [creative research and selection](./references/ugc-creative-research.md).
Establish market, audience, advertising objective, actual product evidence,
and the viewer's reason to watch. Research relevant real content, extract
its mechanisms, compare distinct creative directions, and eliminate weak
openings and unmotivated camera movements before paid asset generation.
Choose characters and locations to serve the selected concept. Reuse an
approved concept for narrow revisions rather than restarting research.

Choose the UGC mode by the viewer's expectation, not just the product category:

| Mode | Viewer payoff | Guidance to read |
| --- | --- | --- |
| Try-on | Judge the worn effect, styling, fit, or choice | [Try-on](./references/ugc-try-on.md) |
| Unboxing | Discover the actual contents, details, and first use | [Unboxing](./references/ugc-unboxing.md) |
| Demonstration, tasting, review, or talking | See a result, understand use, or assess a viewpoint | [Video direction](./references/ugc-video-direction.md), adapted to the brief |

Formats can combine. Name the main viewer payoff and each secondary beat's
job; do not force opening a box into a try-on or a talking-head introduction
into an unboxing. Share research and quality judgment across formats, not
one universal shot sequence. POV, camera-operator dialogue, transformations,
and rapid cuts are options, not compulsory UGC traits.

Use [reviewed creative cases](./references/ugc-creative-cases.md) to understand
why previous concepts worked or failed. They are qualitative user feedback,
not verified campaign-performance data or scripts to reproduce.

## Image model

Use GPT Image 2.5 Sunburst for generating reference images. The user selected
Sunburst. Its exact entries were verified in the VidMuse production catalog on
2026-10-09:

- Text-to-image: `gpt-image-2.5/sunburst/text-to-image`.
- Reference-image editing: `gpt-image-2.5/sunburst/edit`.

The edit entry accepts 1–16 reference images. Use text-to-image for missing
assets created from a description, and the edit entry when supplied or approved
images must guide the output.

Use `vidmuse-cli` to recheck live capabilities, request fields, and pricing before
generation. Do not invent a generic `gpt-image-2.5` API identifier or silently
substitute another model.

## UGC reference-image prompts

Read [UGC reference prompts](./references/ugc-reference-prompts.md) before
writing character or environment generation prompts. It distills the supplied
Prompting Handbook V1.2 and the user's UGC-specific requirements.

When the concept needs a visible performer's identity reference, create one
native 16:9 character reference on a pure white background: a large
face close-up on the left, front full-body view in the middle, and back
full-body view on the right. Exactly three depictions of the same person,
consistent hair, body proportions, outfit, and footwear; both full-body views
include the feet at the same scale. Generate the sheet in one image, not as
separate images assembled afterward. Keep products and scenery off this sheet.
Use neutral, even light and natural skin and fabric detail. This identity
reference is distinct from the eventual phone-recorded performance frame.
Treat the face close-up as an independent crop. Describe coherent adult
proportions within each full-body view and match their scale; inspect head,
shoulders, torso, limbs, and feet together rather than only checking the face.

Design both character and environment for the overseas audience. Resolve the
actual market from the brief; "overseas" does not define one country, ethnicity,
or house style. State the chosen region when making an exploratory example.
Match creator casting and styled everyday wardrobe to the audience and concept; make regional
environment choices concrete through architecture, appliances, furniture, and
believable signs of use rather than a generic "Western" label.

Design a creator who has prepared to appear on camera: intentional clothing
silhouette and color pairing, styled hair, defined makeup, and selected
accessories where appropriate to the person and ad category. Natural skin and
phone capture do not imply a bare face, unstyled hair, or a generic T-shirt.
Describe the actual grooming and styling choices instead of only saying
"ordinary consumer," "natural," or "beautiful." When current trends matter,
research the target market and season and distinguish source observations from
our creative interpretation. See the dated
[styling research](./references/ugc-styling-research-2026-10.md) for the initial
US/UK womenswear and beauty direction and the user's supplied TikTok reference;
it is not a universal UGC uniform. The current user-selected direction is
fitted creator casual or athleisure with defined Western soft-glam makeup:
camisoles, fitted short T-shirts, and high-waisted yoga leggings are valid
starting choices. Treat "Kardashian-like" as a styling cue to translate into
visible makeup, hair, and clothing choices, not an unspecified celebrity face.
Do not let the calendar season alone dictate the outfit; the supplied reference,
ad category, indoor setting, market, and creator persona determine the look.

Describe environment references from the viewpoint of the phone's rear camera.
The output is the view recorded by that camera, not an external picture of
someone filming. Name the setup, camera height and direction, distance or
framing, and visible foreground, action space, and background. Leave the lead
out of an environment-only reference. Use a few motivated signs of life and
practical light sources; avoid both a showroom and random clutter. Do not
substitute selfie or mirror-selfie staging for the rear-camera premise.

When supplied images guide an edit, explicitly assign their roles and name the
identity or product details to preserve. Keep the white backdrop confined to
the identity sheet; the location reference supplies the video environment.
Keep reference roles separate even when their lighting differs: neutral light
reveals identity; the scene determines final illumination. A reference set does
not require a combined first frame before video generation.

Location references establish geography and lighting, not an immutable camera
angle. A multi-shot concept may move from exercise detail to creator interaction
to tabletop demonstration in the same location. Ensure the environment supports
all those actions; create additional location views only when necessary.

As working camera setups, consider eye-level medium framing for talking,
an angled or overhead table view for unboxing, and a sufficiently distant
full-body view with room to move for try-on. Choose for the actual ad rather
than turning these examples into fixed templates.

Build the phone look through plausible perspective, readable surroundings,
ordinary available light, and restrained processing. Avoid automatic cinematic
grading, heavy portrait blur, studio beauty lighting, or added grain and shake
as a substitute for a coherent capture setup. Keep aspect ratio and resolution
in the supported request fields as well as any necessary composition guidance.

## Product-led UGC casting

Design the creator and setting around the product's actual use. Before writing
prompts, connect the product benefit, the creator's reason to use it, visible
styling choices, and the demonstration action. A generic attractive person in
a generic home is insufficient. Keep camera-ready grooming, but adapt its
emphasis to the category: trained physique for a fitness creator, readable eye
makeup for eyeliner, and unobstructed ears for headphone demonstrations.

Choose the scene's camera placement from the action: a mixing surface for
protein powder, a face-level close view for eyeliner, a downward view of the
surface for cleaner, a food foreground for tasting, or a usable desk for
headphone unboxing. Reserve physical space for the performer, hands, and
product rather than merely choosing an attractive room.

Read [product-led casting examples](./references/ugc-product-casting.md) when
developing category-specific characters and scenes. These are exploratory
US TikTok directions, not mandatory demographic assignments. Preserve approved
identities when adapting their styling. Keep actual products in their own
reference; do not invent their packaging or add them to the identity sheet.

## UGC video creative direction

For demonstrations and interaction-led concepts, read
[UGC video direction](./references/ugc-video-direction.md). For try-on and
unboxing, follow their own mode guidance above. Design a reason to watch and
a clear payoff supported by the actual product: a worn effect, discovery,
use/result, or informed viewpoint as appropriate, with a relevant CTA.
A natural-sounding monologue and subtle gestures alone are insufficient.
Judge whether the opening creates interest and whether each beat advances
the selected mode's promise.

Select POV, operator interaction, movement, shot changes, and close-ups when
they serve the idea. Name whose viewpoint the camera represents and who speaks
offscreen. Do not confuse camera-operator POV with the performer's own eyes.
The user's fitness example starts with handheld following of exercise/muscle
details and an offscreen question, then follows the creator getting up,
revealing the product, demonstrating preparation and drinking, and closing
with a CTA. Treat it as an example of content progression, not a template that
every category must copy.

Choose total duration from the actions, speech, reactions, and transitions.
Twenty or thirty seconds can be appropriate, but neither is a fixed UGC length;
do not compress a complete demonstration into a predetermined short clip or
pad an idea to fill a model limit. Fit individual requests to the live model's
limits and preserve continuity across segments when needed. Verify that a
preparation-and-drinking sequence actually shows those actions rather than
substituting a prefilled shaker and implying the demonstration is complete.

## Local speech and human presence

The user requires highly conversational, locally plausible short-video speech
and strong human presence ("活人感"). Resolve the market, audience, and creator
persona before writing dialogue; fluent English alone does not establish a
local voice. Research relevant creator examples when making current-language
or trend claims. Distinguish sourced observations from original creative lines.

Write speech around a concrete situation, preference, reaction, or minor
frustration that belongs to this creator. Use natural contractions, short
phrases, and conversational rhythm. Avoid generic presentation lines and
formal benefit lists. Slang is optional and must fit the speaker; do not force
memes, a demographic dialect, or the same catchphrases onto every category.
Product benefits and personal-use assertions must follow the actual brief,
not be invented to make a script sound authentic.

Make speech and behavior affect each other: a glance at the item, a brief
pause to perform the action, or a reaction to a visible result. Choose a few
motivated details rather than prescribing every blink, shake count, filler,
and smile. Maintain deliberate grooming and the rear-camera premise. Human
presence does not require constant camera shake, exaggerated reactions, or
artificial mistakes.

Review spoken naturalness, creator fit, hook relevance, action/dialogue timing,
and actual generated prosody and gaze separately. A well-written script is
not evidence that the generated performance sounds local or feels human.

## Collaborative authoring

Turn decisions agreed with the user into concise instructions in this file.
Keep proposed ideas separate from confirmed requirements. Define supported ad
formats, creative development, production, and acceptance criteria as the
conversation establishes them.

Skill development is separate from ad production. Production uses the ownership
and loading rules above; changing this skill does not make authoring tools or
other film workflows runtime dependencies.
