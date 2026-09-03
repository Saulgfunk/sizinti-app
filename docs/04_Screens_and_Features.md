# Information Architecture — Screens & Features (v0.1)

## Screen inventory

| # | Screen | Purpose | Key components |
|---|--------|---------|-----------------|
| 1 | Splash | Brand + auth check | Logo, loading spinner |
| 2 | Welcome Carousel | First-impression pitch | 3 swipeable slides, skip button |
| 3 | Auth (Sign up / Log in) | Account creation | Email/password fields, Google button, Apple button, toggle sign up ↔ log in |
| 4 | Onboarding Preferences | Base currency + permissions | Currency picker, notification permission prompt |
| 5 | Dashboard (Home) | Daily-use hub | Lifetime spend header, monthly/yearly toggle, category chart, subscription card list, check-in card (conditional), FAB |
| 6 | Quick-Add Grid | Fast subscription entry | Searchable grid of common service logos, "Diğer" fallback |
| 7 | Subscription Form (Add/Edit) | Data entry | Name, category dropdown, price + currency, billing cycle, start date, renewal date (auto-calc), reminder lead time |
| 8 | Subscription Detail | Single-subscription view | All fields, lifetime spent, mini timeline, Edit/Cancel/Delete actions |
| 9 | Check-in Card (in-dashboard component, not full screen) | Leak-detection nudge | Service name, "have you used this" copy, lifetime spent, Yes/No actions |
| 10 | Settings | Account & preferences | Profile info, sign out, delete account, notification prefs, base currency, category management, CSV export |
| 11 | Category Filter View | Filtered subscription list | Same card list as Dashboard, filtered by tapped category |

## Feature list by priority

**P0 — must ship in v0.1**
- Email/Google/Apple auth
- Manual subscription CRUD
- Dashboard totals (monthly, yearly, lifetime)
- Renewal push notifications
- "Still using this?" check-in logic
- Category breakdown chart
- FX display (static daily rate, TRY equivalent shown alongside original currency)

**P1 — fast-follow (v0.2, still pre-CSV)**
- CSV export (not import) for trust-building
- Widget (home screen) showing next renewal + lifetime total
- Dark mode

**P2 — phase 2 (per Roadmap doc)**
- CSV / bank statement import + parsing
- Photo/OCR of statement
- Price-creep detection (compare charged amount to last known price)
- Shared/family subscription splitting

## Navigation structure

```
Tab bar (bottom nav, 3 tabs):
├── Dashboard (home icon)
├── Subscriptions (list icon) — full list, sortable/filterable, same data as dashboard but list-first view
└── Settings (gear icon)

Stack navigation within tabs:
Dashboard → Subscription Detail → Edit Form
Dashboard → Quick-Add Grid → Subscription Form
Subscriptions (tab) → Subscription Detail → Edit Form
```
