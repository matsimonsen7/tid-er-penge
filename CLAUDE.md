# Tid er Penge

Danish investment calculator - "What if you had invested?"

## Live Site
- Domain: tiderpenge.dk
- Hosting: Vercel
- Analytics: Plausible

## Tech Stack
- Vite + TypeScript
- Tailwind CSS
- Chart.js (lazy-loaded)

## Architecture

```
src/
  main.ts                 # Journey orchestration
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
    affiliate.ts          # eToro affiliate config
```

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
