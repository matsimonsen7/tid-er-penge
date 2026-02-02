export interface StockData {
  ticker: string
  name: string
  prices: Array<{ date: string; close: number }>
}

export interface CalculationResult {
  ticker: string
  startPrice: number
  endPrice: number
  finalValue: number
  history: Array<{ date: string; value: number }>
}

const dataCache = new Map<string, StockData>()

export class Calculator {
  async loadStockData(ticker: string): Promise<StockData> {
    if (dataCache.has(ticker)) {
      return dataCache.get(ticker)!
    }

    const response = await fetch(`/data/${ticker}.json`)
    if (!response.ok) {
      throw new Error(`Failed to load data for ${ticker}`)
    }

    const data = await response.json()
    dataCache.set(ticker, data)
    return data
  }

  async calculate(ticker: string, amount: number, years: number): Promise<CalculationResult> {
    const data = await this.loadStockData(ticker)

    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - years)

    const prices = data.prices
    const startIdx = this.findClosestDateIndex(prices, startDate)
    const endIdx = prices.length - 1

    if (startIdx === -1 || endIdx < startIdx) {
      throw new Error('Insufficient data for calculation')
    }

    const startPrice = prices[startIdx].close
    const endPrice = prices[endIdx].close
    const shares = amount / startPrice
    const finalValue = shares * endPrice

    const history = prices.slice(startIdx, endIdx + 1).map(p => ({
      date: p.date,
      value: shares * p.close,
    }))

    return {
      ticker,
      startPrice,
      endPrice,
      finalValue,
      history,
    }
  }

  private findClosestDateIndex(prices: Array<{ date: string; close: number }>, targetDate: Date): number {
    const targetTime = targetDate.getTime()
    let closestIdx = 0
    let closestDiff = Infinity

    for (let i = 0; i < prices.length; i++) {
      const priceDate = new Date(prices[i].date).getTime()
      const diff = Math.abs(priceDate - targetTime)

      if (diff < closestDiff && priceDate <= targetTime + 7 * 24 * 60 * 60 * 1000) {
        closestDiff = diff
        closestIdx = i
      }
    }

    return closestIdx
  }
}
