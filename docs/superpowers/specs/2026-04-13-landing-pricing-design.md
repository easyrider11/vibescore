# Landing Page + Pricing Design

Date: 2026-04-13
Project: Buildscore marketing surfaces
Scope: `/` and `/pricing`

## Summary

Finish the marketing site as a dark, operator-grade, demo-first experience that qualifies higher-intent buyers while preserving a clear self-serve fallback. The landing page should sell the shift from puzzle interviews to AI-native evaluation. The pricing page should frame plans as stages of team maturity rather than a checkout matrix.

Primary CTA: `Book a demo`
Secondary CTA: `Start free`

## Goals

- Increase demo intent from engineering leaders and recruiting teams.
- Make the product feel credible for structured, repeatable hiring workflows.
- Keep the current dark product aesthetic, but make it more editorial and conversion-focused.
- Align landing and pricing so they feel like one cohesive marketing system.

## Non-Goals

- Building a new booking flow or CRM integration.
- Reworking in-app billing behavior.
- Fixing unrelated billing or webhook findings from earlier PR review.
- Adding new routes beyond the existing marketing surfaces.

## Audience

### Primary audience

- Engineering managers
- Heads of engineering
- Technical recruiting leads
- Founders hiring their first few engineers with structured process needs

### Secondary audience

- Individual evaluators exploring the product through the free tier

## Product Positioning

Buildscore is not a generic coding test platform. It is the interview system for teams that want to evaluate how candidates solve realistic engineering work with AI in the loop.

The page should communicate:

- real codebases over toy puzzles
- AI collaboration as a measurable skill
- structured signal over interviewer gut feel
- recruiting workflow readiness over hacker-demo novelty

## Conversion Strategy

### Landing page

- Lead with demo intent.
- Use `Start free` as a lower-friction fallback, not the dominant action.
- Introduce proof and workflow credibility before listing broad features.

### Pricing page

- Use package language, not direct self-serve checkout energy.
- Keep `Free` visible.
- Position `Pro` as `Starting at` language.
- Position `Enterprise` as a custom engagement.
- Reinforce `Book a demo` as the default next step for serious teams.

## CTA Assumptions

Because there is no dedicated demo-booking route in the repo today, `Book a demo` will point to a sales contact action that can ship immediately. Default assumption:

- `Book a demo` links to `mailto:sales@buildscore.dev?subject=Buildscore%20Demo`
- `Start free` links to `/login`

If a calendaring link exists later, the CTA destination can be swapped without redesigning the pages.

## Visual Direction

### Aesthetic

Dark, premium, technical, and controlled. The feel should stay close to the product’s operator UI, but with more polish and pacing than a dashboard.

### Visual principles

- Keep the dark surface hierarchy already established in `globals.css`.
- Use stronger type scale contrast for the hero, section headers, and plan framing.
- Reduce repeated “card grid” monotony by mixing narrative sections with focused proof bands.
- Keep gradients restrained and purposeful.
- Preserve product credibility by showing realistic interface fragments rather than abstract marketing blobs.

## Information Architecture

### Landing page structure

1. Fixed navigation with `Book a demo` primary and `Start free` secondary.
2. Hero with clear enterprise promise:
   Evaluate real AI-assisted engineering work, not whiteboard performance.
3. Credibility strip:
   concise proof points such as structured scoring, live pair sessions, AI usage analytics, and org controls.
4. “Why teams switch” section:
   before/after framing around signal quality, consistency, and hiring confidence.
5. “How it works” section:
   create, invite, evaluate.
6. Differentiators section:
   fewer but stronger features with workflow relevance.
7. Pricing preview:
   a short package summary with link into the full pricing page.
8. Closing CTA:
   framed as booking a walkthrough, not just trying software.
9. Footer with cleaned-up marketing links and consistent CTA language.

### Pricing page structure

1. Hero framing pricing as rollout stages rather than a generic plan table.
2. Three package cards:
   - Free: pilot and evaluation
   - Pro: growing hiring teams, `starting at`
   - Enterprise: custom rollout, security, integrations, onboarding
3. “Who this is for” strip or short identity section to help buyers self-select fast.
4. Comparison table with decision-critical differences only.
5. FAQ rewritten for procurement, rollout, team usage, and evaluation policy questions.
6. CTA section with `Book a demo` primary and `Start free` secondary.

## Messaging Requirements

### Landing page copy themes

- interviewing for the AI era
- realistic engineering environments
- measurable AI collaboration
- consistent evaluation across candidates
- recruiting workflow speed without losing rigor

### Pricing page copy themes

- transparent enough to build trust
- enterprise-oriented enough to invite conversation
- emphasize rollout fit, not just feature count
- explain why teams graduate from Free to Pro to Enterprise

## Component Strategy

Refactor shared marketing UI into small reusable components so the landing and pricing pages stay aligned.

Candidate shared components:

- marketing nav
- section header / eyebrow block
- proof strip
- package card
- CTA banner
- FAQ accordion

Utility extraction is acceptable if it simplifies repeated pricing or label logic, but no large abstraction layer is needed.

## Content and Interaction Details

- Keep light motion such as reveal-on-scroll and subtle hover elevation.
- Avoid over-animating the pricing page.
- Use a consistent CTA order across both pages:
  `Book a demo` first, `Start free` second.
- Pricing cards should visually support the sales funnel:
  `Free` muted, `Pro` emphasized, `Enterprise` premium and consultative.

## Accessibility and Responsiveness

- All CTA contrast must remain legible on dark backgrounds.
- Comparison table must remain readable on mobile, even if stacked or simplified.
- FAQ interactions must be keyboard-usable.
- Mobile nav must preserve both primary and secondary actions without collapsing the funnel.

## Testing Strategy

Write tests before implementation changes for extracted helpers and any reusable marketing components introduced during the refactor.

Minimum verification:

- render tests for shared marketing components with CTA labels and package messaging
- route-level smoke checks for `/` and `/pricing`
- manual visual verification at desktop and mobile widths

## Implementation Notes

- Reuse the existing dark palette variables from `app/globals.css`.
- Preserve the current product name and metadata unless copy updates require a tighter description.
- Keep the landing hero’s product-demo feel, but tighten the narrative around qualified buyers.
- Do not wire pricing CTAs directly into paid checkout from the marketing surface in this pass.

## Risks

- Over-correcting toward enterprise polish could hide the self-serve path too much.
- Leaving too much of the current “feature gallery” style in place could make the site feel like a prototype instead of a buying surface.
- Pricing language can drift into vagueness if custom-quote framing is too opaque.

## Success Criteria

- Both pages feel like one cohesive, finished marketing system.
- Demo CTA is visually and narratively dominant.
- Self-serve is still available but clearly secondary.
- Pricing communicates team-fit and maturity progression, not just feature density.
- The resulting UI matches the product’s dark technical identity while improving marketing clarity.
