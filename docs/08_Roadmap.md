# Roadmap

## Phase 0 — v0.1 (MVP, this document set covers this phase)
- Manual entry only
- Cloud sync + auth (Supabase)
- Cross-platform (iOS + Android via Expo)
- Renewal reminders
- "Still using this?" check-in loop
- Lifetime spend counter
- Category breakdown
- Static daily FX display

**Goal:** validate that the "lifetime spend + still using this" hook actually drives cancellations and retention, before investing in harder auto-detection features.

## Phase 1 — v0.2
- CSV export (trust-building, cheap to build)
- Home screen widget (next renewal + lifetime total)
- Dark mode
- Refine check-in cadence based on real usage data from Phase 0

## Phase 2 — v0.3 (the real differentiator vs. existing Turkish apps)
- CSV / bank statement import — user exports statement from their banking app, uploads, app parses recurring charges
- Photo/OCR of statement as an alternative input path
- **Price-creep detection**: compare newly-detected charge amount against last known price for the same merchant — flag "Netflix fiyatı %35 arttı" style alerts
- FX-specific alerts: flag when a foreign-currency subscription's TL-equivalent cost has risen due to exchange rate movement, separate from the underlying price change

## Phase 3 — v1.0
- Shared/family subscription splitting (who owes what)
- Native OS-level subscription detection (Apple/Google subscription APIs) as an additional auto-detection source that doesn't require bank access
- Cancellation assistance content (step-by-step guides per service, similar to LowerMySubs' retention-script library, localized for Turkish billing/cancellation flows)
- Monetization: paid tier unlock (unlimited subscriptions, CSV import, price-creep alerts)

## Deferred / needs more research before committing
- Direct bank account linking (Open Banking equivalent in Turkey) — regulatory and integration complexity is high; CSV/OCR is a reasonable substitute until this is clearly worth the investment
- Push-based real-time bank transaction sync
