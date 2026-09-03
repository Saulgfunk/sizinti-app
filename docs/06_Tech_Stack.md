# Tech Stack Recommendation

Chosen for: cross-platform delivery from one codebase, cloud sync with auth, and a stack Claude Code / Antigravity can scaffold and iterate on quickly without heavy manual DevOps.

## Frontend — React Native + Expo

- **Why:** single codebase → iOS + Android; Expo's managed workflow means Claude Code can scaffold, run, and hot-reload without you touching Xcode/Android Studio config directly; huge ecosystem of pre-built components (charts, date pickers, notification handling) that map well to an AI-agent build loop.
- **Navigation:** `expo-router` (file-based routing — maps cleanly onto the screen list in the IA doc)
- **Charts:** `victory-native` or `react-native-gifted-charts` for the category breakdown and lifetime-spend visuals
- **State management:** React Query (`@tanstack/react-query`) for server state (subscriptions, profile) + local component state for forms — avoids needing Redux for an app this size
- **Notifications:** `expo-notifications` for local + push

## Backend — Supabase

- **Why:** Postgres + Auth + Row-Level Security + Edge Functions + realtime, all in one managed service with a generous free tier — meaningfully faster to stand up than a custom Node/Express + separate auth provider setup, and Claude Code can generate SQL migrations directly against it.
- **Auth:** Supabase Auth (email/password + Google + Apple OAuth providers)
- **Scheduled jobs:** Supabase Edge Functions + `pg_cron` for the daily renewal-check and check-in-trigger jobs (Flowchart §2 and §3)
- **Push dispatch:** Edge Function calls Expo's push notification service (`expo-server-sdk`), which handles APNs/FCM routing for you — avoids managing Apple/Google push certs directly

## FX rates

- Use a free-tier FX API (e.g. exchangerate-api.com or a Turkish-friendly alternative) fetched once daily by a scheduled Edge Function into the `fx_rates` cache table — never call a live FX API from the client, to avoid rate limits and latency on every dashboard load.

## Local/offline

- `@react-native-async-storage/async-storage` or Expo's `SecureStore` for lightweight local caching so the dashboard renders instantly on app open before the network fetch resolves (not full offline-first — that's not needed for v0.1 given cloud sync is the chosen model).

## Why not Flutter

Flutter is a reasonable alternative and equally cross-platform, but React Native + Expo has a larger training/example surface for AI coding agents (more common patterns, more Stack Overflow/GitHub reference material), which tends to produce more reliable output from an agentic IDE like Claude Code/Antigravity. If you or your team has existing Flutter/Dart familiarity, that would be a reason to reconsider — otherwise RN+Expo is the safer default here.

## Suggested package list (starting point)

```
expo
expo-router
expo-notifications
expo-secure-store
@supabase/supabase-js
@tanstack/react-query
react-native-gifted-charts
date-fns
zod  (form validation)
```

## Environment / secrets

- Supabase URL + anon key → client-side env vars (safe to expose, protected by RLS)
- Supabase service role key → **only** inside Edge Functions, never in client bundle
- FX API key → **only** inside Edge Functions
