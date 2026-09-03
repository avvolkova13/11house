# ElevenHouse Remaining Landing Sections — Design Specification

## Scope

Continue the approved Architecture A after the locked `CosmicHero` and the existing `OneClientStory`. Build the remaining narrative as one continuous commercial sequence:

1. product proof;
2. AI routine;
3. one cabinet;
4. pricing;
5. FAQ;
6. final CTA and minimal footer.

The Hero, its handoff, and existing global rules remain unchanged. Reviews are not rendered until real practitioner photos, names, and concrete outcomes are supplied.

## Reference traceability

| Section | Composition and motion origin | Product UI source |
| --- | --- | --- |
| Product proof | PRODUX pinned product storytelling; GLYPHIC hierarchy and spacing; NOTHIN’ scene changes | EH-P05 Products, EH-P07 Numerology, EH-P01 Calendar |
| AI routine | NAYA restraint; MESH3D depth; KREPLING causal workflow | EH-P04 Funnel, EH-P07 Numerology |
| One cabinet | SQUARESPACE transformation principle; GLYPHIC disciplined layout | EH-P01, P02, P03, P04, P05, P09 |
| Pricing | OBSCURA commercial surface treatment used sparingly; SHARPLINK restrained light | Exact pricing data from the new brief |
| FAQ and CTA | NAYA pacing; SHARPLINK typographic relationships | Exact brief content only |

Reference sites govern presentation only. ElevenHouse screenshots govern product anatomy and product claims.

## Visual direction

The current light client story resolves into a dark editorial product theatre rather than a card grid. Real interfaces appear as large, legible planes with restrained perspective and crop changes. Thin rules, numbered captions, wide typography and generous negative space carry the system.

The AI section is a cause-and-effect sequence, not an abstract AI illustration: client data flows into a confirmed funnel node, then into a real numerology result. The copy explicitly preserves astrologer authority.

The “one cabinet” section compresses six real product surfaces into one aligned workspace index. It avoids equal SaaS cards: one primary screen stays readable while secondary planes form a controlled stack and change focus on scroll.

Pricing uses a comparison table on desktop and stacked plans on mobile. `Pro` is the editorial focal point, but all exact limits, commissions and feature differences remain readable. No invented discounts or badges.

FAQ is a native accessible accordion. The closing CTA returns to the dark palette with a single typographic statement and a direct action. Missing contact, document and requisites links are not fabricated.

## Motion

- Product proof uses a sticky stage with three deterministic scroll scenes and crossfading/cropping of real screenshots.
- AI uses a short linear handoff animation between confirmed product states; no autonomous claims are implied.
- One cabinet uses a restrained depth stack whose focus changes with scroll.
- Pricing, FAQ and CTA use minimal entrance motion only.
- `prefers-reduced-motion` removes sticky choreography and presents all content sequentially.
- All scroll listeners use one `requestAnimationFrame` gate and are cleaned up on unmount.

## Responsive behavior

- At widths below 900px, sticky product stories become normal document flow.
- Screens remain uncropped enough to preserve visible UI anatomy; labels sit outside screenshots.
- Pricing becomes three sequential plans with the same exact content.
- No horizontal page overflow.

## Evidence and blockers

- Populated analytics, checkout, payment confirmation, real review content, a public personal-page screenshot and expanded AI analysis are not available.
- Product proof therefore uses only confirmed product catalogue, calendar and calculated numerology states.
- Finance may be shown only as the captured zero-state inside the cabinet overview, never as proof of revenue.
- Reviews are omitted rather than invented.
- Footer legal/contact links remain absent until exact destinations are supplied.

