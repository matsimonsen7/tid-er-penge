# Tid er Penge

Danish investment calculator - "What if you had invested?"

## Live Site
- Domain: tiderpenge.dk
- Hosting: Vercel
- Analytics: Plausible (pageviews) + thisideafucks.com dashboard (funnel events)

## Tech Stack
- Vite + TypeScript
- Tailwind CSS
- Chart.js (lazy-loaded)

## Architecture

```
src/
  main.ts                 # Journey orchestration + pageview tracking
  calculator.ts           # Stock calculation logic
  chart.ts                # Chart.js wrapper
  state/journey.ts        # State machine (stock → amount → period → loading → results)
  components/
    Step.ts               # Base class with enter/exit animations
    StockStep.ts          # Stock card picker (9 stocks)
    AmountStep.ts         # Input + presets (1k/5k/10k/50k)
    PeriodStep.ts         # Period cards (only positive returns shown)
    LoadingStep.ts        # 3-sec suspense with rotating messages
    ResultsStep.ts        # Animated reveal + year selector + chart
  animations/
    countUp.ts            # Number counting animation
    confetti.ts           # Canvas confetti (triggers on >50% return)
  config/
    analytics.ts          # Tracking: sends events to thisideafucks.com/api/track
    affiliate.ts          # eToro affiliate config
```

## Analytics / Tracking
- `src/config/analytics.ts` — sends funnel events to `https://thisideafucks.com/api/track`
- Visitor ID: `crypto.randomUUID()` persisted in localStorage (`_vid`)
- Session ID: `crypto.randomUUID()` persisted in sessionStorage (`_sid`)
- Events tracked:
  - `pageview` — on app init (main.ts constructor)
  - `Stock Selected` — StockStep.ts (stock picker click)
  - `Amount Set` — AmountStep.ts (preset or custom input)
  - `Period Selected` — PeriodStep.ts (period card click)
  - `Result Viewed` — ResultsStep.ts (results page rendered)
  - `eToro Clicked` — ResultsStep.ts (affiliate CTA click)
  - `Share Clicked` — ResultsStep.ts (social share buttons)
  - `Shared Link Opened` — main.ts (URL share param detected)
- Dashboard: https://thisideafucks.com/tid-er-penge

## Key Features
- Only shows periods with positive returns (no negative outcomes)
- Dividend stocks (Carlsberg, Apple, Microsoft) show compound interest bonus
- Year selector on results page for instant recalculation
- Confetti: >100% = 80 particles, 50-100% = 40 particles
- Respects `prefers-reduced-motion`

## Affiliate
- Partner: eToro
- Config: `src/config/affiliate.ts`
- Update `link` with actual eToro partner tracking URL

## Stock Data
- Location: `public/data/{TICKER}.json`
- Update script: `build_data.py`
- GitHub Action: `.github/workflows/update-data.yml`

## Commands
```bash
npm run dev      # Development server
npm run build    # Production build
vercel --prod    # Deploy to production
```

## DNS (Simply.com)
- A record: @ → 216.198.79.1
- TXT record: _vercel → vc-domain-verify=tiderpenge.dk,0d4170282997b0f80c67
- CNAME: www → cname.vercel-dns.com
