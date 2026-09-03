# User Flow — v0.1 MVP

## Flow A — First-time onboarding

1. **Splash screen** → auto-advances (1.5s)
2. **Welcome carousel** (3 screens): (1) "Unuttuğun abonelikler bütçeni eritiyor" (2) "Tek bakışta tüm harcamaların" (3) "Hâlâ kullanıyor musun diye sana soracağız"
3. **Auth screen**: Sign up / Log in — email+password, Google, Apple
4. **Currency & notification permission**: confirm base currency (default TRY), ask for push notification permission
5. **Empty dashboard state**: "Henüz abonelik eklemedin" + prominent "+ Abonelik Ekle" CTA
6. → goes to **Flow B**

## Flow B — Adding a subscription

1. Tap **"+ Abonelik Ekle"** (from dashboard or FAB, always visible)
2. **Quick-pick grid**: common services (Netflix, Spotify, YouTube Premium, iCloud+, ChatGPT Plus, gym templates, etc.) with logos pre-filled — tapping one pre-fills name/category/icon
   - "Diğer / Manuel Ekle" option for anything not listed
3. **Subscription detail form**:
   - Name (pre-filled or manual)
   - Category (dropdown: Streaming, SaaS/Yazılım, Spor/Sağlık, Finans, Eğitim, Diğer)
   - Price + currency selector (TRY default, USD/EUR/GBP available)
   - Billing cycle (Aylık / Yıllık / Haftalık / Özel)
   - Start date (date picker — this seeds the lifetime-spend calculation)
   - Next renewal date (auto-calculated from start date + cycle, editable)
   - Reminder lead time (1/3/7 gün önce — default 3)
4. Tap **Kaydet** → subscription saved → toast confirmation → returns to Dashboard
5. Dashboard updates: new card appears, totals recalculate

## Flow C — Dashboard (home) — daily-use loop

1. **Header**: lifetime total spend across all subscriptions (large, bold — the emotional hook number)
2. **Monthly / Yearly toggle**: current recurring spend at selected cadence
3. **Subscription list**: cards sorted by next renewal date, each showing name, price, days-until-renewal, lifetime-spent-on-this-one
4. **Category chart**: tap to filter list by category
5. Tap any card → **Flow D** (subscription detail)
6. Tap **+ FAB** → **Flow B**
7. Tap **bell icon** → **Flow F** (alerts/check-ins)

## Flow D — Subscription detail / edit

1. Full detail view: all fields from Flow B, plus **lifetime spent on this subscription** and a small timeline (start date → today, renewal markers)
2. Actions: **Düzenle** (edit any field), **Aboneliği İptal Et** (mark as cancelled — moves to archive, stops future renewal calc but keeps historical total), **Sil** (delete entirely, with confirmation)
3. Edit → same form as Flow B, pre-filled → Save → returns to detail view

## Flow E — Renewal reminder (push notification)

1. Notification fires at configured lead time: *"Netflix yenileniyor — 3 gün sonra ₺229,99 çekilecek."*
2. Tap notification → deep-links to **Flow D** for that subscription
3. From there user can edit, cancel, or dismiss

## Flow F — "Still using this?" check-in (the leak-detection moment)

1. Triggered every 60–90 days per subscription (configurable in Settings), delivered as an in-app card at the top of the Dashboard (not a push notification, to avoid nag fatigue) — plus one soft push reminder if ignored for 5+ days
2. Card: *"Spotify'ı hâlâ kullanıyor musun? Şu ana kadar ₺1.847,50 harcadın."*
3. Two swipe/tap actions:
   - **Evet, kullanıyorum** → dismisses, resets the 60–90 day timer
   - **Hayır / Emin değilim** → routes to **Flow D** with a highlighted "İptal Et" CTA and a one-line nudge on how to cancel that specific service
4. This interaction is the core metric event (see PRD §5 — "leak found" moment)

## Flow G — Settings

1. Profile (email, sign out, delete account)
2. Notification preferences (default reminder lead time, check-in cadence)
3. Base currency
4. Category management (rename/add custom categories)
5. Export data (CSV export of all subscriptions — cheap to build, good trust signal even before CSV *import* exists)

## Flow H — Returning user (session 2+)

1. Splash → (if logged in) → straight to **Dashboard (Flow C)**
2. If a check-in is due → check-in card appears at top of dashboard (Flow F)
3. If a renewal is within lead-time window → push notification already sent (Flow E) independent of app open state
