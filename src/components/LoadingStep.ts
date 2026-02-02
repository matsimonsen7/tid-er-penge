import { Step } from './Step'
import { journeyStore } from '../state/journey'
import { Calculator } from '../calculator'

const MESSAGES = [
  'Rejser tilbage i tiden...',
  'Finder historiske data...',
  'Beregner dit afkast...',
  'Næsten klar...',
]

const MARKET_TICKER = '^GSPC'

export class LoadingStep extends Step {
  private calculator: Calculator
  private messageInterval: number | null = null
  private messageIndex = 0

  constructor(containerId: string, calculator: Calculator) {
    super(containerId)
    this.calculator = calculator
  }

  render(): HTMLElement {
    const wrapper = this.createElement('div', 'loading-step')

    const content = this.createElement('div', 'loading-content')

    const spinner = this.createElement('div', 'loading-spinner')
    for (let i = 0; i < 3; i++) {
      spinner.appendChild(this.createElement('div', 'spinner-dot'))
    }

    const message = this.createElement('p', 'loading-message', MESSAGES[0])
    message.id = 'loading-message'

    const progressBar = this.createElement('div', 'loading-progress')
    const progressFill = this.createElement('div', 'loading-progress-fill')
    progressBar.appendChild(progressFill)

    content.append(spinner, message, progressBar)
    wrapper.appendChild(content)

    return wrapper
  }

  protected onMount(): void {
    this.startLoadingAnimation()
    this.performCalculation()
  }

  protected onUnmount(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval)
      this.messageInterval = null
    }
  }

  private startLoadingAnimation(): void {
    const messageEl = document.getElementById('loading-message')
    if (!messageEl) return

    this.messageInterval = window.setInterval(() => {
      this.messageIndex = (this.messageIndex + 1) % MESSAGES.length
      messageEl.textContent = MESSAGES[this.messageIndex]
    }, 800)
  }

  private async performCalculation(): Promise<void> {
    const state = journeyStore.getState()
    const { stock, amount, years } = state.data

    if (!stock) {
      journeyStore.goToStep('stock')
      return
    }

    try {
      const result = await this.calculator.calculate(stock, amount, years)

      let marketResult = null
      if (stock !== MARKET_TICKER) {
        marketResult = await this.calculator.calculate(MARKET_TICKER, amount, years)
      }

      journeyStore.setResults(result, marketResult)

      await this.minimumLoadingTime(3000)

      journeyStore.nextStep()
    } catch (error) {
      console.error('Calculation error:', error)
      journeyStore.goToStep('stock')
    }
  }

  private minimumLoadingTime(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
