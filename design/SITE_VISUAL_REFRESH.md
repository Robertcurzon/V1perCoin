# V1PER site visual refresh — 8 October 2026

## Outcome

Carry the owner's selected emblem across every page: fierce silver snake, black and graphite surfaces, silver text, lime eyes and actions. Give each participation topic a distinct narrative and composition: forward strike, inverted coin offering, chaotic banquet, figure-eight vault guardian, interwoven community, sweeping burn and stealthy verification. Closed mouths, varied camera angles and expressive tail gestures add range. Keep the pages separate, the fixed snakeskin navigation visible, and Back to home easy to find.

## Scope and constraints

- Seven generated scenes: home, free tokens, Feast, locks, community, supply, verification.
- Home cards preview each destination; participation intros put concise copy beside art on desktop and above art on mobile.
- Forms, status messages, data and disclosures use opaque readable panels. Coin lists are accessible HTML, not image text.
- Rules stays concise and expandable; Monitor continues to label unavailable data. White Paper keeps the real centered scrollable PDF with black sidebars and the shared header.
- No changes to contracts, economics, launch configuration, wallet signatures, transaction checks or social destinations. Participation remains closed until verified deployment.

## Asset inventory

| File | Pages |
| --- | --- |
| `public/art/home.webp` | Home hero |
| `public/art/free-tokens.webp` | Free Tokens, home preview |
| `public/feast-menu.webp` | Feast, home preview, social kit |
| `public/art/lock.webp` | Lock & Earn, home preview |
| `public/art/community.webp` | Community, home preview, social kit |
| `public/art/supply.webp` | Supply, home preview |
| `public/art/verify.webp` | Rules, Monitor, home preview |
| `public/social-preview.png` | Public sharing metadata |

Built-in image generation used the exact selected `public/v1per-emblem.png` as a style and character reference. It did not modify that emblem. Final generation prompts are recorded in [SITE_ART_PROMPTS.json](SITE_ART_PROMPTS.json). Delivery copies use WebP at 1280px wide (1792px for the hero), roughly 150–250 KB each. The social PNG is a mechanical resize of the same hero scene.

## Acceptance checks

All nine physical routes load directly under `/V1perCoin/`; header links stay visible and fixed on desktop and phone. Artwork loads without horizontal overflow; meaningful information is readable without artwork. Verify text and hover contrast, legacy redirects, Back to home, the limited claim copy, Feast closed-state and menu fallback, lock calculator, and PDF proof gating. Review desktop and phone screenshots before publishing through the required GitHub checks.
