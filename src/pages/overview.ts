import '../style.css'
import { Calculator } from '../calculator'
import { STOCKS, getSlugByTicker } from '../config/stocks'
import type { StockOption } from '../config/stocks'
import { track } from '../config/analytics'

interface StockWithReturn {
  stock: StockOption
  slug: string
  returnPct: number | null
}

;(async () => {
  const grid = document.getElementById('overview-grid')
  if (!grid) return

  track('Overview Page Viewed')

  // Show loading spinner
  grid.innerHTML = `
    <div class="col-span-full flex justify-center py-12">
      <div class="loading-spinner"></div>
    </div>
  `

  const calc = new Calculator()

  // Fetch 10-year returns for all stocks in parallel
  const results: StockWithReturn[] = await Promise.all(
    STOCKS.map(async (stock): Promise<StockWithReturn> => {
      const slug = getSlugByTicker(stock.ticker) ?? stock.ticker.toLowerCase()
      try {
        const result = await calc.calculate(stock.ticker, 10000, 10)
        const returnPct = ((result.finalValue - 10000) / 10000) * 100
        return { stock, slug, returnPct }
      } catch {
        return { stock, slug, returnPct: null }
      }
    })
  )

  // Sort by return descending, nulls last
  results.sort((a, b) => {
    if (a.returnPct === null && b.returnPct === null) return 0
    if (a.returnPct === null) return 1
    if (b.returnPct === null) return -1
    return b.returnPct - a.returnPct
  })

  // Render card grid
  grid.innerHTML = `
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
      ${results
        .map(({ stock, slug, returnPct }) => {
          const returnLabel =
            returnPct !== null
              ? `+${Math.round(returnPct)}% (10 \u00e5r)`
              : 'Data utilg\u00e6ngelig'

          return `
            <a href="/aktier/${slug}/" class="stock-card block text-center p-4 no-underline">
              <span class="stock-logo">${stock.logo}</span>
              <span class="stock-name block mt-2">${stock.name}</span>
              <p class="text-sm gradient-text font-semibold mt-2">${returnLabel}</p>
              <span class="text-gray-500 text-xs mt-1 block">Se afkast &rarr;</span>
            </a>
          `
        })
        .join('')}
    </div>
  `
})()
