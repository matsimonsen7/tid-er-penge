import '../style.css'
import { Calculator } from '../calculator'
import { STOCKS, getSlugByTicker } from '../config/stocks'
import type { StockOption } from '../config/stocks'
import { track } from '../config/analytics'

interface StockWithReturn {
  stock: StockOption
  slug: string
  returnPct: number | null
  finalValue: number | null
}

const INVEST_AMOUNT = 5000

function formatDKK(value: number): string {
  return new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(value) + ' kr'
}

type Period = 5 | 10 | 20
const PERIODS: Period[] = [5, 10, 20]
const DEFAULT_PERIOD: Period = 10

;(async () => {
  const grid = document.getElementById('overview-grid')!
  if (!grid) return

  track('Overview Page Viewed')

  // Show loading spinner
  grid.innerHTML = `
    <div class="col-span-full flex justify-center py-12">
      <div class="loading-spinner"></div>
    </div>
  `

  const calc = new Calculator()
  const cache = new Map<Period, StockWithReturn[]>()
  let activePeriod: Period = DEFAULT_PERIOD

  async function fetchPeriod(years: Period): Promise<StockWithReturn[]> {
    if (cache.has(years)) return cache.get(years)!

    const results: StockWithReturn[] = await Promise.all(
      STOCKS.map(async (stock): Promise<StockWithReturn> => {
        const slug = getSlugByTicker(stock.ticker) ?? stock.ticker.toLowerCase()
        try {
          const result = await calc.calculate(stock.ticker, INVEST_AMOUNT, years)
          const returnPct = ((result.finalValue - INVEST_AMOUNT) / INVEST_AMOUNT) * 100
          return { stock, slug, returnPct, finalValue: result.finalValue }
        } catch {
          return { stock, slug, returnPct: null, finalValue: null }
        }
      })
    )

    results.sort((a, b) => {
      if (a.returnPct === null && b.returnPct === null) return 0
      if (a.returnPct === null) return 1
      if (b.returnPct === null) return -1
      return b.returnPct - a.returnPct
    })

    cache.set(years, results)
    return results
  }

  function renderList(results: StockWithReturn[], years: Period): string {
    return `
      <div class="overview-list glass-card rounded-2xl overflow-hidden">
        ${results
          .map(({ stock, slug, returnPct, finalValue }, index) => {
            const rank = index + 1
            const valueLabel = finalValue !== null ? formatDKK(Math.round(finalValue)) : '\u2014'
            const returnLabel =
              returnPct !== null
                ? `+${Math.round(returnPct)}%`
                : ''
            const returnSub = returnPct !== null ? `${years} \u00e5r` : ''

            return `
              <a href="/aktier/${slug}/" class="overview-row">
                <span class="overview-rank">${rank}</span>
                <span class="overview-logo">${stock.logo}</span>
                <span class="overview-name">${stock.name}</span>
                <span class="overview-return">
                  <span class="overview-final-value">${valueLabel}</span>
                  ${returnLabel ? `<span class="overview-return-pct gradient-text">${returnLabel}</span>` : ''}
                  ${returnSub ? `<span class="overview-return-sub">${returnSub}</span>` : ''}
                </span>
                <span class="overview-arrow">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
              </a>
            `
          })
          .join('')}
      </div>
    `
  }

  function renderSelector(active: Period): string {
    return `
      <div class="period-selector">
        ${PERIODS.map(p => `
          <button class="period-pill${p === active ? ' period-pill-active' : ''}" data-period="${p}">
            ${p} \u00e5r
          </button>
        `).join('')}
      </div>
    `
  }

  function renderFull(results: StockWithReturn[], years: Period) {
    grid.innerHTML = `
      ${renderSelector(years)}
      <div id="overview-list-container">
        ${renderList(results, years)}
      </div>
    `
    bindSelectorEvents()
  }

  function bindSelectorEvents() {
    grid.querySelectorAll<HTMLButtonElement>('.period-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const period = Number(btn.dataset.period) as Period
        if (period === activePeriod) return
        activePeriod = period
        switchPeriod(period)
      })
    })
  }

  async function switchPeriod(years: Period) {
    // Update pill active states immediately
    grid.querySelectorAll<HTMLButtonElement>('.period-pill').forEach(btn => {
      const p = Number(btn.dataset.period)
      btn.classList.toggle('period-pill-active', p === years)
    })

    const listContainer = document.getElementById('overview-list-container')
    if (!listContainer) return

    const cached = cache.get(years)
    if (cached) {
      // Instant swap with a quick fade
      listContainer.classList.add('overview-fade-out')
      await new Promise(r => setTimeout(r, 120))
      listContainer.innerHTML = renderList(cached, years)
      listContainer.classList.remove('overview-fade-out')
    } else {
      // Rare: show brief loading state while fetching
      listContainer.classList.add('overview-fade-out')
      await new Promise(r => setTimeout(r, 120))
      listContainer.innerHTML = `
        <div class="flex justify-center py-8">
          <div class="loading-spinner"></div>
        </div>
      `
      listContainer.classList.remove('overview-fade-out')
      const results = await fetchPeriod(years)
      listContainer.classList.add('overview-fade-out')
      await new Promise(r => setTimeout(r, 120))
      listContainer.innerHTML = renderList(results, years)
      listContainer.classList.remove('overview-fade-out')
    }
  }

  // Fetch default period first, render, then pre-fetch others in background
  const defaultResults = await fetchPeriod(DEFAULT_PERIOD)
  renderFull(defaultResults, DEFAULT_PERIOD)

  // Pre-fetch remaining periods in background (non-blocking)
  const otherPeriods = PERIODS.filter(p => p !== DEFAULT_PERIOD)
  Promise.all(otherPeriods.map(p => fetchPeriod(p)))
})()
