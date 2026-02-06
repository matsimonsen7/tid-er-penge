import type { CalculationResult } from '../calculator'

export type JourneyStep = 'stock' | 'amount' | 'period' | 'loading' | 'results'

export interface JourneyData {
  stock: string | null
  stockName: string | null
  amount: number
  years: number
}

export interface JourneyState {
  currentStep: JourneyStep
  direction: 'forward' | 'backward'
  data: JourneyData
  result: CalculationResult | null
  marketResult: CalculationResult | null
  isSharedLink: boolean
}

const STEP_ORDER: JourneyStep[] = ['stock', 'amount', 'period', 'loading', 'results']

const PERIOD_MAP: Record<string, number> = {
  '2y': 2,
  '5y': 5,
  '10y': 10,
  '20y': 20,
}

const YEARS_TO_PERIOD: Record<number, string> = {
  2: '2y',
  5: '5y',
  10: '10y',
  20: '20y',
}

type Listener = (state: JourneyState, prevStep: JourneyStep | null) => void

class JourneyStore {
  private state: JourneyState = {
    currentStep: 'stock',
    direction: 'forward',
    data: {
      stock: null,
      stockName: null,
      amount: 5000,
      years: 5,
    },
    result: null,
    marketResult: null,
    isSharedLink: false,
  }

  private listeners: Set<Listener> = new Set()

  getState(): JourneyState {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(prevStep: JourneyStep | null): void {
    this.listeners.forEach(listener => listener(this.state, prevStep))
  }

  setStock(ticker: string, name: string): void {
    this.state = {
      ...this.state,
      data: { ...this.state.data, stock: ticker, stockName: name },
    }
  }

  setAmount(amount: number): void {
    this.state = {
      ...this.state,
      data: { ...this.state.data, amount },
    }
  }

  setYears(years: number): void {
    this.state = {
      ...this.state,
      data: { ...this.state.data, years },
    }
  }

  setResults(result: CalculationResult, marketResult: CalculationResult | null): void {
    this.state = {
      ...this.state,
      result,
      marketResult,
    }
  }

  setSharedLink(isSharedLink: boolean): void {
    this.state = { ...this.state, isSharedLink }
  }

  goToStep(step: JourneyStep): void {
    const prevStep = this.state.currentStep
    const currentIdx = STEP_ORDER.indexOf(this.state.currentStep)
    const nextIdx = STEP_ORDER.indexOf(step)

    this.state = {
      ...this.state,
      currentStep: step,
      direction: nextIdx >= currentIdx ? 'forward' : 'backward',
    }
    this.notify(prevStep)
  }

  nextStep(): void {
    const currentIdx = STEP_ORDER.indexOf(this.state.currentStep)
    if (currentIdx < STEP_ORDER.length - 1) {
      this.goToStep(STEP_ORDER[currentIdx + 1])
    }
  }

  prevStep(): void {
    const currentIdx = STEP_ORDER.indexOf(this.state.currentStep)
    if (currentIdx > 0) {
      this.goToStep(STEP_ORDER[currentIdx - 1])
    }
  }

  canGoBack(): boolean {
    return STEP_ORDER.indexOf(this.state.currentStep) > 0
  }

  getProgress(): number {
    const idx = STEP_ORDER.indexOf(this.state.currentStep)
    if (this.state.currentStep === 'results') return 100
    return ((idx + 1) / STEP_ORDER.length) * 100
  }

  reset(): void {
    const prevStep = this.state.currentStep
    this.state = {
      currentStep: 'stock',
      direction: 'forward',
      data: {
        stock: null,
        stockName: null,
        amount: 5000,
        years: 5,
      },
      result: null,
      marketResult: null,
      isSharedLink: false,
    }
    clearShareParams()
    this.notify(prevStep)
  }

  getShareUrl(): string {
    const { stock, amount, years } = this.state.data
    const period = YEARS_TO_PERIOD[years] || `${years}y`
    const params = new URLSearchParams({
      aktie: stock || '',
      beloeb: amount.toString(),
      periode: period,
    })
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`
  }
}

export const journeyStore = new JourneyStore()

export interface ShareParams {
  ticker: string
  amount: number
  years: number
}

export function parseShareParams(): ShareParams | null {
  const params = new URLSearchParams(window.location.search)
  const ticker = params.get('aktie')
  const beloeb = params.get('beloeb')
  const periode = params.get('periode')

  if (!ticker || !beloeb || !periode) return null

  const amount = parseInt(beloeb, 10)
  if (isNaN(amount) || amount <= 0) return null

  const years = PERIOD_MAP[periode]
  if (!years) return null

  return { ticker, amount, years }
}

export function pushShareUrl(): void {
  const url = journeyStore.getShareUrl()
  history.replaceState(null, '', url)
}

export function clearShareParams(): void {
  if (window.location.search) {
    history.replaceState(null, '', window.location.pathname)
  }
}
