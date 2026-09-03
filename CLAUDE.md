@AGENTS.md

# Sızıntı — Project Context for Claude Code

Sızıntı ("leak" in Turkish — working title, rename freely) is a Turkish subscription and spending-leak finder: manual subscription tracking with a lifetime-spend counter and periodic "hâlâ kullanıyor musun?" (still using this?) check-ins. See `/docs` for the complete spec — this file is a fast-reference summary; the docs are the source of truth if anything here seems to conflict.

## Read this first, in order

1. `docs/01_PRD.md` — problem, target user, MVP scope, success metrics
2. `docs/02_User_Flow.md` — every screen-to-screen journey (Flows A–H)
3. `docs/03_Flowchart.md` — Mermaid diagrams for navigation, renewal logic, check-in/leak-detection logic
4. `docs/04_Screens_and_Features.md` — screen inventory and P0/P1/P2 feature priority
5. `docs/05_Data_Model.md` — schema, implemented as the Supabase migration in `supabase/migrations/`
6. `docs/06_Tech_Stack.md` — chosen stack and reasoning
7. `docs/07_Project_Structure.md` — repo layout and build order (build in this phase order — each phase should be verified before starting the next)
8. `docs/08_Roadmap.md` — phased scope; **we are building Phase 0 / v0.1 only**

## Stack (decided — see docs/06 for rationale)

- **App:** React Native + Expo (expo-router, file-based routing)
- **Backend:** Supabase (Postgres, Auth via email/Google/Apple, Row Level Security, Edge Functions for scheduled jobs)
- **State:** `@tanstack/react-query` for server state
- **Charts:** `react-native-gifted-charts`
- **Validation:** `zod`

## Non-negotiable constraints

- Manual entry only in v0.1 — no bank sync, CSV import, or OCR. Those are Phase 2+ (`docs/08_Roadmap.md`); flag it if asked to build them early.
- RLS policies must exist before any UI touches a table — never retrofit. Current policies are in `supabase/migrations/`, matching `docs/05_Data_Model.md` exactly (field names must never drift from that doc).
- `checkin_events` is append-only — no update/delete policy, by design (it's the core "leak found" analytics signal).
- Build in phases per `docs/07_Project_Structure.md` build order; stop after each phase for a verification checkpoint rather than chaining phases automatically.

## Working name

"Sızıntı" is a placeholder — nothing in the architecture depends on it.

## Current status

Phase 1 complete: Expo project scaffolded (expo-router, TypeScript), Tech Stack packages installed, Supabase local project initialized with an initial migration covering `profiles`, `subscriptions`, `checkin_events`, `fx_rates`, and RLS policies. A live Supabase project exists and the migration has been applied — `lib/supabase.ts` holds the client, credentials live in `.env` (gitignored). RLS verified live (anon read on `fx_rates` works, anon insert into `subscriptions` correctly rejected).

Phase 2 complete: Auth flow built (Splash → Welcome carousel → Signup/Login → Onboarding Preferences), per `docs/07_Project_Structure.md` step 3. Email/password auth is fully functional against the live project (verified via a real test signup — this project has "Confirm email" enabled, so the app correctly shows a "check your email" state after signup rather than an immediate session). Google/Apple buttons are wired to `signInWithOAuth` but **won't work until the user configures those providers in the Supabase dashboard** (external OAuth app setup — deliberately deferred, user needs test accounts first). Routing between logged-out / needs-onboarding / ready states lives in `lib/use-auth-gate.ts`, mounted at the root layout so it works from any screen. Added `profiles.onboarding_completed_at` (migration `20260903090457`, not in the original data model doc — needed for routing; must be applied to the live project via SQL Editor same as the initial migration).

Phase 3 complete: Dashboard shell built per `docs/07_Project_Structure.md` step 4 — empty state + FAB, wired to a real `useSubscriptions` hook (`lib/queries/useSubscriptions.ts`) that currently returns `[]` since no subscriptions exist yet. Added the `(tabs)` route group (`app/(tabs)/_layout.tsx`) with Dashboard/Subscriptions/Settings tabs — Subscriptions and Settings are stubs (their real content is later build-order steps); Settings carries the sign-out button forward from the old `dashboard-placeholder.tsx`, which is now deleted. Added `app/subscription/add.tsx` as a stub destination for the FAB/CTA (the real Quick-Add Grid + Subscription Form is step 5, Flow B). `lib/use-auth-gate.ts` now redirects onboarded users to `/(tabs)/dashboard`.

Phase 5 complete (Add Subscription, build order step 5 / Flow B): `app/subscription/add.tsx` is now a real 2-step wizard (Quick-Add Grid → Subscription Form) implemented as one route with internal state — `docs/07_Project_Structure.md`'s suggested layout lists only one `add.tsx` file, so this keeps that instead of adding a second route. Added `@react-native-community/datetimepicker` (native-only — no web build, hence `components/date-field.tsx` + `.web.tsx` platform variants) and `constants/categories.ts` / `constants/quickAddServices.ts`. Quick-add service badges are colored initials, not real logos — `assets/logos/` is still empty. `useCreateSubscription` (in `useSubscriptions.ts`) does the actual insert; Dashboard now shows a bare-bones list once subscriptions exist (not the real card design — that's step 6) plus a brief "Eklendi ✓" toast on return. Not verified against a live insert (would need a confirmed test session) — verified via clean `tsc`, clean bundle, and the insert payload's TypeScript type being constrained to match `Subscription` exactly.

**Bug found via real device testing (fixed, commit `db71493`):** `nextRenewalDate` started as `''`, and `DateField` rendered with that before the seeding `useEffect` ran — `parseISO('')` → Invalid Date → `date-fns format()` threw on native. The web `DateField` variant didn't hit this (raw string passed straight to an HTML date input), which is why web-only testing missed it — worth remembering that this project's platform-split components (`date-field.tsx` / `.web.tsx`) need native device testing, not just web curl checks, to fully verify.

Phase 6 complete (Dashboard population, build order step 6): Added `LifetimeSpendHeader`, `CategoryChart` (react-native-gifted-charts PieChart — needed an undocumented `expo-linear-gradient` peer dependency, installed), and `SubscriptionCard` components. Also fixed a Phase 5 gap: `lifetime_spent` was left at the DB default of 0 on creation — now seeded via `lib/utils/calculateLifetimeSpend.ts` per `docs/03_Flowchart.md` §5 (elapsed billing periods × price, counting the payment made at start_date itself). Totals and the category chart are scoped to the profile's `base_currency` only — cross-currency aggregation needs `fx_rates` populated, which is Polish pass (step 11), not this one; subscriptions in other currencies still show up as individual cards, just aren't summed into the header/chart yet. Subscriptions tab now reuses `SubscriptionCard` too (same data, per Screen 6's own description). Added `app/subscription/[id].tsx` as a stub detail-view destination for tapping a card — full Flow D (edit/cancel/delete) is step 7.

**Also fixed (post-Phase-6, real device testing):** `expo-secure-store` has a 2048-byte per-key limit that a real Supabase session (access + refresh token) exceeds — writes were failing silently, so sessions never survived a full app restart (hot reloads masked it since the session stayed in memory). Switched `lib/supabase.ts` to `@react-native-async-storage/async-storage` and removed the now-unused `expo-secure-store` dependency + config plugin.

Phase 7 complete (Subscription detail + edit/cancel/delete, build order step 7 / Flow D): `app/subscription/[id].tsx` is now the real detail view — all fields, lifetime spent on that subscription, a simple textual start/renewal timeline, and Düzenle/Aboneliği İptal Et/Sil actions (cancel and delete hidden once a subscription is already cancelled, since only Sil applies then). `SubscriptionForm` (from Phase 5) now supports an `editingSubscription` prop for full pre-fill + update-instead-of-insert — reused rather than duplicated, per Flow D step 3 ("same form as Flow B"). Added `app/subscription/[id]/edit.tsx` matching `docs/07_Project_Structure.md`'s exact suggested route (unlike `add.tsx`, the doc lists this as its own file, so it is one, not folded into `[id].tsx`). `useUpdateSubscription` and `useDeleteSubscription` added to `useSubscriptions.ts`; cancel sets `status`/`cancelled_at` only — `lifetime_spent` is frozen, not recalculated, matching `docs/03_Flowchart.md` §5. Edit does not touch `lifetime_spent` either (only seeded once, at creation). One subtlety worth remembering: the next-renewal-date auto-calc `useEffect` in `SubscriptionForm` had to skip its first run in edit mode, or it would silently overwrite the subscription's actual stored `next_renewal_date` the instant the edit form opened, before the user touched anything.

**Also fixed (post-Phase-7, real device testing):** editing/deleting a subscription didn't update the Dashboard's totals — `invalidateQueries` alone isn't reliable after a `router.replace` navigation (no guarantee it reaches the same mounted screen instance in time). `useUpdateSubscription`/`useDeleteSubscription` now also write directly into the query cache on success.

Phase 8 in progress (Push notifications, build order step 8 / Flow E): `lib/push-notifications.ts` registers an Expo push token to `profiles.push_token` (new migration `20260903143927`, not in the data model doc) whenever notification permission is granted — wired into both the root layout (on session change) and onboarding's permission-request handler. `supabase/functions/daily-renewal-check/index.ts` implements the reminder + renewal-advance logic from `docs/03_Flowchart.md` §2, split into two independent checks (reminder fires once on the exact lead day; renewal-date/lifetime_spent advance fires once the date has arrived) rather than the flowchart's single combined condition, which read literally would re-fire every day inside the reminder window. Migration `20260903144316` schedules it via pg_cron + pg_net, using a Supabase Vault secret for the service_role key so nothing sensitive is ever committed.

**Known limitation, not a bug**: Expo Go no longer supports registering for remote push tokens (deprecated since SDK 53) — `registerPushToken` will silently no-op there. Actually testing push delivery needs a custom EAS dev client build or a production/TestFlight build, neither of which exist yet. The Edge Function also isn't deployed — that needs `supabase functions deploy daily-renewal-check` via an authenticated CLI (same `supabase login` step as `gh auth login` was), which wasn't run. Code is written and self-consistent but genuinely unverified end-to-end.
