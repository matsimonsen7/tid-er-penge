import { Step } from './Step'
import { journeyStore } from '../state/journey'
import { countUp } from '../animations/countUp'
import { triggerConfetti } from '../animations/confetti'
import { GrowthChart } from '../chart'
import { getStockByTicker } from './StockStep'
import { Calculator, type CalculationResult } from '../calculator'
import { AFFILIATE, getAffiliateUrl } from '../config/affiliate'

const MARKET_TICKER = '^GSPC'
const ALL_PERIODS = [2, 5, 10, 20]

export class ResultsStep extends Step {
  private chart: GrowthChart | null = null
  private cancelCountUp: (() => void) | null = null
  private cancelConfetti: (() => void) | null = null
  private calculator = new Calculator()
  private availablePeriods: number[] = []

  render(): HTMLElement {
    const wrapper = this.createElement('div', 'results-step')
    const state = journeyStore.getState()

    if (!state.result) {
      const error = this.createElement('p', 'results-error', 'Kunne ikke beregne resultat')
      wrapper.appendChild(error)
      return wrapper
    }

    const { result, data } = state
    const returnPct = ((result.finalValue - data.amount) / data.amount) * 100
    const stock = getStockByTicker(data.stock || '')

    const header = this.createElement('div', 'results-header fade-in')
    const title = this.createElement('h2', 'results-title', 'Dine penge blev til...')
    header.appendChild(title)

    const card = this.createElement('div', 'results-card slide-up')

    const amountLabel = this.createElement('p', 'results-amount-label')
    amountLabel.id = 'results-amount-label'
    amountLabel.innerHTML = `Dine <span class="text-white">${this.formatCurrency(data.amount)}</span> i ${data.stockName} over`

    // Year selector
    const yearSelector = this.createElement('div', 'year-selector')
    yearSelector.id = 'year-selector'

    const valueDisplay = this.createElement('p', 'results-value gradient-text')
    valueDisplay.id = 'results-value'
    valueDisplay.textContent = '0 kr.'

    const returnBadge = this.createElement('span', `results-badge badge-positive bounce-in`)
    returnBadge.id = 'results-badge'
    returnBadge.style.opacity = '0'
    returnBadge.textContent = `+${returnPct.toFixed(0)}%`

    card.append(amountLabel, yearSelector, valueDisplay, returnBadge)

    // Dividend bonus section
    if (stock?.dividend && stock.dividendYield) {
      const dividendSection = this.createElement('div', 'dividend-section fade-in-delayed')
      dividendSection.id = 'dividend-section'
      dividendSection.style.opacity = '0'

      const dividendIcon = this.createElement('span', 'dividend-icon', '💰')
      const dividendText = this.createElement('p', 'dividend-text')
      dividendText.innerHTML = `Med <strong>geninvesteret udbytte</strong> ville du have`
      const dividendAmount = this.createElement('p', 'dividend-amount gradient-text')
      dividendAmount.id = 'dividend-amount'
      dividendAmount.textContent = this.formatCurrency(0)
      const dividendNote = this.createElement('p', 'dividend-note')
      dividendNote.id = 'dividend-note'
      dividendNote.textContent = `Baseret på ~${(stock.dividendYield * 100).toFixed(1)}% årligt udbytte`

      dividendSection.append(dividendIcon, dividendText, dividendAmount, dividendNote)
      card.appendChild(dividendSection)
    }

    const confettiCanvas = document.createElement('canvas')
    confettiCanvas.id = 'confetti-canvas'
    confettiCanvas.className = 'confetti-canvas'

    const chartContainer = this.createElement('div', 'results-chart fade-in-delayed')
    chartContainer.style.opacity = '0'
    const canvas = document.createElement('canvas')
    canvas.id = 'results-chart-canvas'
    chartContainer.appendChild(canvas)

    const cta = this.createElement('div', 'results-cta scale-in')
    cta.style.opacity = '0'

    const ctaTitle = this.createElement('h3', 'cta-title', AFFILIATE.headline)
    const ctaText = this.createElement('p', 'cta-text', AFFILIATE.subtext)

    const ctaButton = this.createElement('a', 'cta-button glow-pulse') as HTMLAnchorElement
    ctaButton.href = getAffiliateUrl()
    ctaButton.target = '_blank'
    ctaButton.rel = 'noopener sponsored'
    ctaButton.textContent = AFFILIATE.buttonText
    ctaButton.setAttribute('data-track', 'etoro-click')

    const ctaDisclaimer = this.createElement('p', 'cta-disclaimer', AFFILIATE.disclaimer)

    cta.append(ctaTitle, ctaText, ctaButton, ctaDisclaimer)

    const restartNav = this.createElement('div', 'results-restart')
    const restartBtn = this.createElement('button', 'restart-btn', '← Prøv en anden aktie')
    restartBtn.setAttribute('type', 'button')
    restartBtn.addEventListener('click', () => journeyStore.reset())
    restartNav.appendChild(restartBtn)

    wrapper.append(confettiCanvas, header, card, chartContainer, cta, restartNav)

    return wrapper
  }

  protected async onMount(): Promise<void> {
    const state = journeyStore.getState()
    if (!state.result) return

    // Find available positive periods
    await this.findAvailablePeriods()
    this.renderYearSelector()

    const { result, marketResult, data } = state
    const returnPct = ((result.finalValue - data.amount) / data.amount) * 100
    const stock = getStockByTicker(data.stock || '')

    this.runRevealSequence(result.finalValue, returnPct, data.amount, data.stockName || '', result, marketResult, stock)
  }

  protected onUnmount(): void {
    this.cancelCountUp?.()
    this.cancelConfetti?.()
    if (this.chart) {
      this.chart = null
    }
  }

  private async findAvailablePeriods(): Promise<void> {
    const state = journeyStore.getState()
    const { stock, amount } = state.data
    if (!stock) return

    this.availablePeriods = []

    for (const years of ALL_PERIODS) {
      try {
        const result = await this.calculator.calculate(stock, amount, years)
        const returnPct = ((result.finalValue - amount) / amount) * 100
        if (returnPct > 0) {
          this.availablePeriods.push(years)
        }
      } catch {
        // Not enough data
      }
    }
  }

  private renderYearSelector(): void {
    const container = document.getElementById('year-selector')
    if (!container) return

    const state = journeyStore.getState()
    const currentYears = state.data.years

    this.availablePeriods.forEach(years => {
      const btn = this.createElement('button', `year-btn ${years === currentYears ? 'year-btn-active' : ''}`)
      btn.setAttribute('type', 'button')
      btn.setAttribute('data-years', years.toString())
      btn.textContent = `${years} år`

      btn.addEventListener('click', () => this.handleYearChange(years))

      container.appendChild(btn)
    })
  }

  private async handleYearChange(years: number): Promise<void> {
    const state = journeyStore.getState()
    const { stock, amount, stockName } = state.data
    if (!stock) return

    // Update button states
    document.querySelectorAll('.year-btn').forEach(btn => {
      btn.classList.toggle('year-btn-active', btn.getAttribute('data-years') === years.toString())
    })

    // Calculate new results
    try {
      const result = await this.calculator.calculate(stock, amount, years)
      let marketResult = null
      if (stock !== MARKET_TICKER) {
        marketResult = await this.calculator.calculate(MARKET_TICKER, amount, years)
      }

      // Update display
      this.updateDisplay(result, amount, years, stockName || '', getStockByTicker(stock))

      // Update chart
      this.initChart(result, marketResult, amount, stockName || '')

      // Update store
      journeyStore.setYears(years)
      journeyStore.setResults(result, marketResult)
    } catch (error) {
      console.error('Error changing year:', error)
    }
  }

  private updateDisplay(result: CalculationResult, amount: number, years: number, _stockName: string, stock: any): void {
    const valueEl = document.getElementById('results-value')
    const badgeEl = document.getElementById('results-badge')
    const dividendAmountEl = document.getElementById('dividend-amount')

    const returnPct = ((result.finalValue - amount) / amount) * 100

    if (valueEl) {
      valueEl.textContent = this.formatCurrency(result.finalValue)
    }

    if (badgeEl) {
      badgeEl.textContent = `+${returnPct.toFixed(0)}%`
      badgeEl.style.opacity = '1'
    }

    // Update dividend if applicable
    if (stock?.dividend && stock.dividendYield && dividendAmountEl) {
      const dividendValue = this.calculateDividendCompound(amount, result.finalValue, stock.dividendYield, years)
      dividendAmountEl.textContent = this.formatCurrency(dividendValue)
    }
  }

  private calculateDividendCompound(initialAmount: number, finalValue: number, dividendYield: number, years: number): number {
    const priceGrowthRate = Math.pow(finalValue / initialAmount, 1 / years) - 1
    const totalReturnRate = priceGrowthRate + dividendYield
    return initialAmount * Math.pow(1 + totalReturnRate, years)
  }

  private runRevealSequence(
    finalValue: number,
    returnPct: number,
    amount: number,
    stockName: string,
    result: CalculationResult,
    marketResult: CalculationResult | null,
    stock: any
  ): void {
    const valueEl = document.getElementById('results-value')
    const badgeEl = document.getElementById('results-badge')
    const chartContainer = this.element?.querySelector('.results-chart') as HTMLElement
    const ctaEl = this.element?.querySelector('.results-cta') as HTMLElement
    const dividendSection = document.getElementById('dividend-section')
    const dividendAmountEl = document.getElementById('dividend-amount')

    const state = journeyStore.getState()
    const years = state.data.years

    setTimeout(() => {
      if (valueEl) {
        this.cancelCountUp = countUp(valueEl, finalValue, this.formatCurrency.bind(this), {
          duration: 2000,
          onComplete: () => {
            setTimeout(() => {
              this.cancelConfetti = triggerConfetti(returnPct)
            }, 100)
          }
        })
      }
    }, 500)

    setTimeout(() => {
      if (badgeEl) {
        badgeEl.style.opacity = '1'
      }
    }, 2800)

    // Show dividend section after badge
    const hasDividend = stock?.dividend && stock?.dividendYield
    if (hasDividend && dividendSection && dividendAmountEl) {
      const dividendValue = this.calculateDividendCompound(amount, finalValue, stock.dividendYield, years)
      setTimeout(() => {
        dividendSection.style.opacity = '1'
        dividendAmountEl.textContent = this.formatCurrency(dividendValue)
      }, 3200)
    }

    setTimeout(() => {
      if (chartContainer) {
        chartContainer.style.opacity = '1'
        this.initChart(result, marketResult, amount, stockName)
      }
    }, hasDividend ? 3800 : 3200)

    setTimeout(() => {
      if (ctaEl) {
        ctaEl.style.opacity = '1'
      }
    }, hasDividend ? 4400 : 3800)
  }

  private initChart(result: CalculationResult, marketResult: CalculationResult | null, amount: number, stockName: string): void {
    const canvas = document.getElementById('results-chart-canvas') as HTMLCanvasElement
    if (!canvas) return

    if (this.chart) {
      // Chart exists, just update data
    }

    this.chart = new GrowthChart('results-chart-canvas')

    if (marketResult) {
      this.chart.updateWithComparison(result.history, marketResult.history, amount, stockName)
    } else {
      this.chart.update(result.history, amount)
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('da-DK', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' kr.'
  }
}
