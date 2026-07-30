# @lobby/shared — design system

Single source of truth for Lobby visual tokens and React Native UI primitives.
Extracted from `Lobby_mockup_final.html` (dark + gold, Space Grotesk / Inter / Poppins, glass surfaces, venue seal).

## Layout

| Path | Contents |
|------|----------|
| `src/tokens/` (also re-exported via `tokens/`) | `colors`, `spacing`, `radius`, `typography` |
| `src/ui/` | `Button`, `Chip`, `Avatar`, `Seal`, `VerifiedBadge`, `Card`/`Glass`, `BottomSheet`, `MatchScore` |

```ts
import { colors, typography, tokens } from '@lobby/shared';
import { Button, Seal, VerifiedBadge } from '@lobby/shared/ui';
```

RN UI is **not** on the root export so Next.js back-office can import tokens without a `react-native` peer.

## Token summary (from HTML)

- **Surfaces**: `#070809` / `#0C0E11`, glass `rgba(255,255,255,.04)`, line `rgba(255,255,255,.07)`
- **Ink**: `#F3EEE3`, muted `#9BA6B6` / `#6B7686`
- **Gold**: `#E7C684`, CTA `#F4D58D → #D2A856`, on-gold `#241A08`
- **Live/match**: `#5FE0A6`
- **Type**: Display = Space Grotesk, Body = Inter, Wordmark = Poppins
- **Radii**: glass 18, button 13, sheet 26, chips/pills 999
- **Seal**: gold ring + venue mark + green check — issued by the **venue**, never self-claimed

Load custom fonts in the Expo app (`SpaceGrotesk`, `Inter`, `Poppins`) to match token `fontFamily` keys.

## Peer dependencies

UI primitives expect `react` + `react-native` (provided by `apps/mobile`).

## Screens already in the HTML mockup

Welcome · Discover (room) · Profile/seal sheet · Matches · Showcase · Your Card · Member access.

Complementary flows in the interactive prototype (Signals, Chat, Host/Spaces, Travel) were **not** regenerated via Stitch in this pass — see below.

## Extending screens with Stitch MCP

Keep new UI coherent with these tokens. Do **not** invent a new palette or type system.

1. **Extract design context first** (required by Lobby MCP rules):
   - Call Stitch `extract design context` so `design.md` / token context reflects Lobby dark+gold.
   - Anchor on this package: gold CTA, glass cards, Space Grotesk titles, venue `Seal` / `VerifiedBadge`.

2. **Generate** only screens missing vs the HTML gallery (small complementary set: e.g. Signals, Chat).

3. **Refine for React Native**:
   - Replace raw Stitch dump with `@lobby/shared` primitives.
   - Colors / spacing / type **only** from `src/tokens/` — no hard-coded hex outside tokens.
   - Respect product privacy copy: invisible by default, visible only in-room, mutual consent, seal from venue.

4. If Stitch MCP is unavailable or auth fails: skip generation; extend screens manually using tokens + primitives.

### Stitch status (this delivery)

`user-stitch` MCP server was **not available** in the agent environment (not listed among connected MCP servers). No Stitch screens were generated. Tokens + RN primitives were delivered from the HTML source of truth.

## Privacy / product (UI)

When building presence or discovery UI:

- Default invisible; visibility only in the current room; off on exit.
- Connection only by mutual consent.
- Membership seal is venue-issued (`Seal` / `VerifiedBadge`).
- Selective invisibility is a first-class control, not a buried setting.
