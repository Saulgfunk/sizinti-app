# Flowcharts

These are written in Mermaid syntax. Paste into any Mermaid renderer (GitHub markdown preview, mermaid.live, or Claude Code's own preview) to view visually. Antigravity/Claude Code can also read these directly as build logic references.

## 1. App navigation flow

```mermaid
flowchart TD
    A[Splash Screen] --> B{Logged in?}
    B -- No --> C[Welcome Carousel]
    C --> D[Auth: Sign up / Log in]
    D --> E[Currency + Notification Permission]
    E --> F[Dashboard - Empty State]
    B -- Yes --> G[Dashboard]
    F --> H[+ Abonelik Ekle]
    G --> H
    H --> I[Quick-pick service grid]
    I --> J[Subscription Detail Form]
    J --> K[Save to backend]
    K --> G
    G --> L[Tap subscription card]
    L --> M[Subscription Detail / Edit]
    M --> N{Action}
    N -- Edit --> J
    N -- Cancel --> O[Mark as cancelled, archive]
    N -- Delete --> P[Confirm + delete]
    O --> G
    P --> G
    G --> Q[Settings]
```

## 2. Renewal reminder logic (backend/scheduled job)

```mermaid
flowchart TD
    A[Daily scheduled job runs] --> B[Fetch all active subscriptions]
    B --> C{next_renewal_date - today <= reminder_lead_days?}
    C -- Yes --> D[Send push notification]
    C -- No --> E[Skip]
    D --> F{Billing cycle = recurring?}
    F -- Yes --> G[Advance next_renewal_date by one cycle]
    F -- No / one-time --> H[Mark subscription inactive]
    G --> I[Recalculate lifetime_spent += price]
    E --> J[Wait for next daily run]
```

## 3. "Still using this?" leak-detection logic (the core differentiator)

```mermaid
flowchart TD
    A[Daily scheduled job runs] --> B[Fetch subscriptions where last_checkin_date is null OR older than checkin_interval]
    B --> C[Generate in-app check-in card for each]
    C --> D[User opens app, sees check-in card]
    D --> E{User response}
    E -- "Evet, kullanıyorum" --> F[Update last_checkin_date = today]
    F --> G[Reset checkin_interval timer]
    E -- "Hayır / Emin değilim" --> H[Navigate to Subscription Detail]
    H --> I[Highlight cancel CTA]
    I --> J{User cancels?}
    J -- Yes --> K[Mark as cancelled, log leak_found event]
    J -- No, dismisses --> L[Update last_checkin_date = today, keep active]
    D -- Ignored 5+ days --> M[Send one soft push reminder]
```

## 4. High-level system architecture

```mermaid
flowchart LR
    subgraph Client [Mobile App - React Native / Expo]
        UI[UI Screens]
        LocalCache[Local cache - offline support]
    end

    subgraph Backend [Supabase]
        Auth[Auth service]
        DB[(Postgres DB)]
        EdgeFn[Edge Functions - scheduled jobs]
        Push[Push notification dispatch]
    end

    subgraph External [External services]
        FX[FX rate API]
        APNs[Apple/Google Push]
    end

    UI --> Auth
    UI --> DB
    LocalCache <--> DB
    EdgeFn --> DB
    EdgeFn --> FX
    EdgeFn --> Push
    Push --> APNs
    APNs --> UI
```

## 5. Data flow for lifetime-spend calculation

```mermaid
flowchart TD
    A[Subscription created: start_date, price, cycle] --> B[Calculate elapsed billing periods = today - start_date / cycle length]
    B --> C[lifetime_spent = elapsed_periods * price]
    C --> D[Displayed on Dashboard header and Subscription Detail]
    E[Renewal event fires] --> F[lifetime_spent += price]
    F --> D
    G[Subscription cancelled] --> H[lifetime_spent frozen at cancellation point]
    H --> D
```
