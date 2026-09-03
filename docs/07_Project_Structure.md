# Project Structure — Build Brief for Claude Code / Antigravity

This is written so it can be pasted directly as a starting prompt/brief into Claude Code.

## Suggested repo layout

```
sizinti-app/
├── app/                          # expo-router screens (file-based routing)
│   ├── (auth)/
│   │   ├── welcome.tsx
│   │   ├── signup.tsx
│   │   └── login.tsx
│   ├── (onboarding)/
│   │   └── preferences.tsx
│   ├── (tabs)/
│   │   ├── dashboard.tsx
│   │   ├── subscriptions.tsx
│   │   └── settings.tsx
│   ├── subscription/
│   │   ├── add.tsx
│   │   ├── [id].tsx              # detail view
│   │   └── [id]/edit.tsx
│   └── _layout.tsx
├── components/
│   ├── SubscriptionCard.tsx
│   ├── CheckinCard.tsx
│   ├── CategoryChart.tsx
│   ├── LifetimeSpendHeader.tsx
│   ├── QuickAddGrid.tsx
│   └── forms/SubscriptionForm.tsx
├── lib/
│   ├── supabase.ts               # client init
│   ├── queries/                  # React Query hooks
│   │   ├── useSubscriptions.ts
│   │   ├── useProfile.ts
│   │   └── useCheckins.ts
│   └── utils/
│       ├── calculateLifetimeSpend.ts
│       ├── formatCurrency.ts
│       └── fxConvert.ts
├── supabase/
│   ├── migrations/                # SQL migrations matching Data Model doc
│   └── functions/
│       ├── daily-renewal-check/   # Edge Function — Flowchart §2
│       ├── daily-checkin-trigger/ # Edge Function — Flowchart §3
│       └── fetch-fx-rates/        # Edge Function — daily FX cache refresh
├── constants/
│   ├── categories.ts
│   └── quickAddServices.ts        # pre-set logos/names: Netflix, Spotify, etc.
├── assets/
│   └── logos/                     # service icons for quick-add grid
├── app.json                       # Expo config
├── package.json
└── README.md
```

## Build order recommendation (for the agentic build loop)

1. **Scaffold** — `npx create-expo-app` with `expo-router` template, install package list from Tech Stack doc
2. **Supabase project** — create project, run migrations from Data Model doc, enable RLS policies
3. **Auth flow** — Welcome → Signup/Login → Onboarding Preferences (Flow A)
4. **Dashboard shell** — empty state + FAB, wired to `useSubscriptions` hook returning empty array
5. **Add subscription flow** — Quick-Add Grid → Subscription Form → save to Supabase (Flow B)
6. **Dashboard population** — totals, category chart, subscription card list once data exists (Flow C)
7. **Subscription detail + edit/cancel/delete** (Flow D)
8. **Push notifications** — Expo push token registration, Edge Function for renewal reminders (Flow E)
9. **Check-in logic** — Edge Function + in-dashboard check-in card (Flow F)
10. **Settings screen** (Flow G)
11. **Polish pass** — dark mode, empty/loading/error states, FX display formatting

## Notes for the build prompt

- Feed Claude Code the **Data Model doc** first so migrations are generated correctly before any UI work starts.
- Feed the **User Flow doc** screen-by-screen rather than all at once — build and verify Flow A and B fully before moving to C, since C depends on B's data existing.
- The **Flowchart doc's Mermaid diagrams** are useful to paste directly into the Edge Function prompts (§2 and §3) since they specify exact conditional logic.
