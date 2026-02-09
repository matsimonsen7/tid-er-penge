import './style.css'
import { Calculator } from './calculator'
import { journeyStore, parseShareParams, type JourneyStep } from './state/journey'
import { getStockByTicker } from './config/stocks'
import { track } from './config/analytics'
import { StockStep } from './components/StockStep'
import { AmountStep } from './components/AmountStep'
import { PeriodStep } from './components/PeriodStep'
import { LoadingStep } from './components/LoadingStep'
import { ResultsStep } from './components/ResultsStep'
import type { Step } from './components/Step'

class JourneyApp {
  private calculator: Calculator
  private currentStep: Step | null = null
  private progressFill: HTMLElement | null = null

  constructor() {
    this.calculator = new Calculator()
    this.progressFill = document.getElementById('progress-fill')

    track('pageview')

    journeyStore.subscribe((state, prevStep) => {
      this.handleStepChange(state.currentStep, state.direction, prevStep)
      this.updateProgress(state.currentStep)
    })

    this.setupKeyboardNav()
    this.initFromUrl()
  }

  private initFromUrl(): void {
    const shareParams = parseShareParams()

    if (shareParams) {
      const stock = getStockByTicker(shareParams.ticker)
      if (stock) {
        track('Shared Link Opened', { stock: stock.ticker, amount: shareParams.amount, period: shareParams.years })
        journeyStore.setStock(stock.ticker, stock.name)
        journeyStore.setAmount(shareParams.amount)
        journeyStore.setYears(shareParams.years)
        journeyStore.setSharedLink(true)
        this.mountStep('loading', 'forward')
        this.updateProgress('loading')
        return
      }
    }

    // Normal start
    this.mountStep('stock', 'forward')
    this.updateProgress('stock')
  }

  private async handleStepChange(
    step: JourneyStep,
    direction: 'forward' | 'backward',
    _prevStep: JourneyStep | null
  ): Promise<void> {
    if (this.currentStep) {
      await this.currentStep.unmount(direction)
    }

    this.mountStep(step, direction)
  }

  private mountStep(step: JourneyStep, direction: 'forward' | 'backward'): void {
    const containerId = 'journey-container'
    const isSharedLink = journeyStore.getState().isSharedLink

    switch (step) {
      case 'stock':
        this.currentStep = new StockStep(containerId)
        break
      case 'amount':
        this.currentStep = new AmountStep(containerId)
        break
      case 'period':
        this.currentStep = new PeriodStep(containerId)
        break
      case 'loading':
        this.currentStep = new LoadingStep(containerId, this.calculator, isSharedLink)
        break
      case 'results':
        this.currentStep = new ResultsStep(containerId)
        break
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
        if (state.currentStep !== 'loading') {
          journeyStore.prevStep()
        }
      }
    })
  }
}

new JourneyApp()
