# PRD — Turkish Subscription & Spending Leak Finder
**Working title:** Sızıntı *(placeholder — "leak" in Turkish; rename freely)*
**Version:** v0.1 (MVP scope)
**Owner:** Barlas
**Platform:** Cross-platform (iOS + Android)
**Backend:** Cloud sync with account/login

---

## 1. Problem

ING Türkiye research found that 36% of consumers forget subscriptions tied to automatic payment instructions. Mid-income Turkish households now carry 10–15 small recurring charges (₺79–199 each) that individually look negligible but together cost ₺2,000–4,000/month. The pain is worse for foreign-currency subscriptions (Netflix, ChatGPT Plus, Spotify, cloud storage) where prices silently jump 30–40% via email-only notices that most users never read, and the change doesn't stand out on a TL-denominated card statement.

Existing Turkish apps (Sublio, Subtracky, Abonelik Takip) solve **reminders** — "your payment is coming up" — but none solve **awareness** — "you've spent ₺X on this since you started and here's what's crept up in price." None target FX price creep. None make the sunk-cost total emotionally visible.

## 2. Target user

- Turkish urban professionals, 25–45, with 8+ active subscriptions (streaming, SaaS, gym, cloud, AI tools, insurance add-ons).
- Comfortable with mobile banking apps but doesn't manually audit card statements.
- Has at least one FX-billed subscription (Netflix, Spotify Premium, ChatGPT Plus, iCloud+, etc.).

## 3. Core value proposition

> "Kaç para harcadığını biliyor musun?" — one number, updated live, that shows the lifetime cost of every subscription, plus gentle nudges asking "hâlâ kullanıyor musun?" before the emotional sunk-cost number gets bigger.

## 4. MVP scope (v0.1) — what we're building first

**In scope:**
- Email/password + Google/Apple sign-in (cloud account, syncs across devices)
- Manual subscription entry: name, category, price, currency (TRY/USD/EUR/GBP), billing cycle, start date, next renewal date
- Dashboard: total monthly spend, total yearly spend, and the headline **lifetime spend counter per subscription and in aggregate**
- Renewal reminder notifications (1–7 days before, user-configurable)
- Periodic "still using this?" check-in prompts (every 60–90 days per subscription) with swipe-to-confirm / swipe-to-mark-for-cancellation
- Category breakdown (pie/bar chart: streaming, SaaS, fitness, finance, other)
- Basic FX display: if subscription currency ≠ TRY, show current TL equivalent using a daily exchange rate

**Explicitly out of scope for v0.1** (planned for later phases — see Roadmap doc):
- CSV / bank statement import
- Photo/OCR of statements
- Automatic price-creep detection
- Push-based bank transaction sync (Open Banking / Plaid-equivalent)
- Family/shared subscription splitting

## 5. Success metrics

- % of users who add 5+ subscriptions in first session
- % of "still using this?" prompts that result in a cancellation-intent tap (this is the core "leak found" moment — track it explicitly)
- D7 / D30 retention (notifications should be the main retention driver at this stage)
- Average lifetime-spend number surfaced per user (useful for marketing — "our users found an average of ₺X in forgotten spend")

## 6. Monetization (not built in v0.1, but design should not block it)

- Free tier: up to 5 tracked subscriptions
- Paid tier (~₺20–40/mo or annual): unlimited subscriptions, CSV import (phase 2), price-creep alerts (phase 2)

## 7. Risks / open questions

- Exchange rate source needs to be reliable and free/cheap at MVP scale (see Tech Stack doc for recommendation)
- "Still using this?" nudges must not feel naggy — cadence and copy need testing
- Apple/Google subscription detection (native OS-level subscriptions) is a possible fast-follow that would meaningfully increase auto-detection without needing bank access — worth scoping after v0.1 ships
