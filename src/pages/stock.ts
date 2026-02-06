import '../style.css'
import { Calculator } from '../calculator'
import { journeyStore, type JourneyStep } from '../state/journey'
import { getStockByTicker } from '../config/stocks'
import { track } from '../config/analytics'
import { AmountStep } from '../components/AmountStep'
import { PeriodStep } from '../components/PeriodStep'
import { LoadingStep } from '../components/LoadingStep'
import { ResultsStep } from '../components/ResultsStep'
import type { Step } from '../components/Step'

const STAT_PERIODS = [5, 10, 20] as const

interface StockStat {
  years: number
  returnPct: number
}

async function computeStats(calculator: Calculator, ticker: string): Promise<StockStat[]> {
  const stats: StockStat[] = []

  for (const years of STAT_PERIODS) {
    try {
      const result = await calculator.calculate(ticker, 10_000, years)
      const returnPct = ((result.finalValue - 10_000) / 10_000) * 100
      if (returnPct > 0) {
        stats.push({ years, returnPct })
      }
    } catch {
      // Not enough data for this period
    }
  }

  return stats
}

function renderStatsGrid(stats: StockStat[]): HTMLElement {
  const grid = document.createElement('div')
  grid.id = 'stock-stats'
  grid.className = 'grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8'

  for (const stat of stats) {
    const card = document.createElement('div')
    card.className = 'glass-card rounded-xl p-4 text-center'

    const pct = document.createElement('p')
    pct.className = 'text-2xl font-bold gradient-text'
    pct.textContent = `+${stat.returnPct.toFixed(0)}%`

    const label = document.createElement('p')
    label.className = 'text-gray-400 text-sm'
    label.textContent = `over ${stat.years} \u00e5r`

    card.append(pct, label)
    grid.appendChild(card)
  }

  return grid
}

class StockPageApp {
  private calculator: Calculator
  private currentStep: Step | null = null
  private progressFill: HTMLElement | null = null
  private container: HTMLElement

  constructor(container: HTMLElement, ticker: string) {
    this.calculator = new Calculator()
    this.progressFill = document.getElementById('progress-fill')
    this.container = container

    const stock = getStockByTicker(ticker)
    if (!stock) {
      container.innerHTML = '<p class="text-center text-gray-400">Ukendt aktie</p>'
      return
    }

    // Pre-select the stock in journey state
    journeyStore.setStock(stock.ticker, stock.name)
    track('Stock Page Viewed', { stock: stock.ticker })

    // Compute and render stats, then mount the calculator
    this.init(stock.ticker)
  }

  private async init(ticker: string): Promise<void> {
    const stats = await computeStats(this.calculator, ticker)

    if (stats.length > 0) {
      const grid = renderStatsGrid(stats)
      this.container.parentElement?.insertBefore(grid, this.container)
    }

    // Subscribe to journey state changes
    journeyStore.subscribe((state, prevStep) => {
      this.handleStepChange(state.currentStep, state.direction, prevStep)
      this.updateProgress(state.currentStep)
    })

    this.setupKeyboardNav()

    // Start at amount step (stock is already selected)
    this.mountStep('amount', 'forward')
    this.updateProgress('amount')
  }

  private async handleStepChange(
    step: JourneyStep,
    direction: 'forward' | 'backward',
    _prevStep: JourneyStep | null
  ): Promise<void> {
    if (this.currentStep) {
      await this.currentStep.unmount(direction)
    }

    // If user resets or goes back to stock step, redirect to overview
    if (step === 'stock') {
      window.location.href = '/aktier/'
      return
    }

    this.mountStep(step, direction)
  }

  private mountStep(step: JourneyStep, direction: 'forward' | 'backward'): void {
    const containerId = 'journey-container'

    switch (step) {
      case 'amount':
        this.currentStep = new AmountStep(containerId)
        break
      case 'period':
        this.currentStep = new PeriodStep(containerId)
        break
      case 'loading':
        this.currentStep = new LoadingStep(containerId, this.calculator)
        break
      case 'results':
        this.currentStep = new ResultsStep(containerId)
        break
      default:
        return
    }

    this.currentStep.mount(direction)
  }

  private updateProgress(_step: JourneyStep): void {
    if (!this.progressFill) return
    const progress = journeyStore.getProgress()
    this.progressFill.style.width = `${progress}%`
  }

  private setupKeyboardNav(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && journeyStore.canGoBack()) {
        const state = journeyStore.getState()
        if (state.currentStep === 'loading') return

        // If on amount step (first step for stock pages), redirect to overview
        if (state.currentStep === 'amount') {
          window.location.href = '/aktier/'
          return
        }

        journeyStore.prevStep()
      }
    })
  }
}

// --- Entry point ---
const container = document.getElementById('journey-container')
if (container) {
  const ticker = container.dataset.ticker
  if (ticker) {
    new StockPageApp(container, ticker)
  }
}
