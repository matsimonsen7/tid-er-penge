export interface StockOption {
  ticker: string
  name: string
  logo: string
  dividend?: boolean
  dividendYield?: number
}

const LOGOS: Record<string, string> = {
  'NOVO-B.CO': `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
  'DSV.CO': `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`,
  'CARL-B.CO': `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 5v14h14V5H5zm12 12H7V7h10v10zM9 9h6v2H9V9zm0 4h6v2H9v-2z"/></svg>`,
  'NVDA': `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  'AAPL': `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>`,
  'MSFT': `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>`,
  'GOOGL': `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>`,
  'AMZN': `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.502.14.112.188.068.382-.14.576-.36.346-.966.753-1.82 1.22-1.836 1.003-3.857 1.694-6.063 2.067-.976.162-1.97.244-2.983.244-2.58 0-5.04-.482-7.378-1.448-1.708-.703-3.184-1.613-4.43-2.733-.104-.093-.156-.186-.156-.28 0-.05.024-.1.073-.15z"/></svg>`,
  'NFLX': `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.913.002-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/></svg>`,
}

export const STOCKS: StockOption[] = [
  { ticker: 'NOVO-B.CO', name: 'Novo Nordisk', logo: LOGOS['NOVO-B.CO'] },
  { ticker: 'DSV.CO', name: 'DSV', logo: LOGOS['DSV.CO'] },
  { ticker: 'CARL-B.CO', name: 'Carlsberg', logo: LOGOS['CARL-B.CO'], dividend: true, dividendYield: 0.022 },
  { ticker: 'NVDA', name: 'NVIDIA', logo: LOGOS['NVDA'] },
  { ticker: 'AAPL', name: 'Apple', logo: LOGOS['AAPL'], dividend: true, dividendYield: 0.005 },
  { ticker: 'MSFT', name: 'Microsoft', logo: LOGOS['MSFT'], dividend: true, dividendYield: 0.008 },
  { ticker: 'GOOGL', name: 'Google', logo: LOGOS['GOOGL'] },
  { ticker: 'AMZN', name: 'Amazon', logo: LOGOS['AMZN'] },
  { ticker: 'NFLX', name: 'Netflix', logo: LOGOS['NFLX'] },
]

export function getStockByTicker(ticker: string): StockOption | undefined {
  return STOCKS.find(s => s.ticker === ticker)
}

// Slug mapping: ticker -> URL-friendly slug
export const STOCK_SLUGS: Record<string, string> = {
  'NOVO-B.CO': 'novo-nordisk',
  'DSV.CO': 'dsv',
  'CARL-B.CO': 'carlsberg',
  'NVDA': 'nvidia',
  'AAPL': 'apple',
  'MSFT': 'microsoft',
  'GOOGL': 'google',
  'AMZN': 'amazon',
  'NFLX': 'netflix',
}

export const SLUG_TO_TICKER: Record<string, string> = Object.fromEntries(
  Object.entries(STOCK_SLUGS).map(([ticker, slug]) => [slug, ticker])
)

export function getStockBySlug(slug: string): StockOption | undefined {
  const ticker = SLUG_TO_TICKER[slug]
  return ticker ? getStockByTicker(ticker) : undefined
}

export function getSlugByTicker(ticker: string): string | undefined {
  return STOCK_SLUGS[ticker]
}
