import { Step } from './Step'
import { journeyStore, pushShareUrl } from '../state/journey'
import { countUp } from '../animations/countUp'
import { triggerConfetti } from '../animations/confetti'
import { GrowthChart } from '../chart'
import { getStockByTicker } from '../config/stocks'
import { Calculator, type CalculationResult } from '../calculator'
import { AFFILIATE, getAffiliateUrl } from '../config/affiliate'
import { track } from '../config/analytics'

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
    ctaButton.addEventListener('click', () => {
      track('eToro Clicked', {
        location: 'results',
        stock: state.data.stock || '',
        final_value: Math.round(result.finalValue),
      })
    })

    cta.append(ctaTitle, ctaText, ctaButton)

    if (AFFILIATE.disclaimer) {
      const ctaDisclaimer = this.createElement('p', 'cta-disclaimer', AFFILIATE.disclaimer)
      cta.appendChild(ctaDisclaimer)
    }

    // Share button
    const shareSection = this.createElement('div', 'share-section')
    const shareBtn = this.createElement('button', 'share-btn')
    shareBtn.setAttribute('type', 'button')
    shareBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Del dit resultat`
    shareBtn.addEventListener('click', () => this.handleShare())
    shareSection.appendChild(shareBtn)

    const toast = this.createElement('div', 'share-toast')
    toast.id = 'share-toast'
    shareSection.appendChild(toast)

    const restartNav = this.createElement('div', 'results-restart')
    const restartBtn = this.createElement('button', 'restart-btn', '← Prøv en anden aktie')
    restartBtn.setAttribute('type', 'button')
    restartBtn.addEventListener('click', () => journeyStore.reset())
    restartNav.appendChild(restartBtn)

    wrapper.append(confettiCanvas, header, card, chartContainer, cta, shareSection, restartNav)

    return wrapper
  }

  protected async onMount(): Promise<void> {
    const state = journeyStore.getState()
    if (!state.result) return

    // Push share URL to address bar
    pushShareUrl()

    // Find available positive periods
    await this.findAvailablePeriods()
    this.renderYearSelector()

    const { result, marketResult, data } = state
    const returnPct = ((result.finalValue - data.amount) / data.amount) * 100
    const stock = getStockByTicker(data.stock || '')

    track('Result Viewed', {
      stock: data.stock || '',
      amount: data.amount,
      period: data.years,
      return_pct: Math.round(returnPct),
      final_value: Math.round(result.finalValue),
    })

    if (state.isSharedLink) {
      this.showResultsImmediate(result.finalValue, returnPct, data.amount, data.stockName || '', result, marketResult, stock)
    } else {
      this.runRevealSequence(result.finalValue, returnPct, data.amount, data.stockName || '', result, marketResult, stock)
    }
  }

  protected onUnmount(): void {
    this.cancelCountUp?.()
    this.cancelConfetti?.()
    if (this.chart) {
      this.chart = null
    }
  }

  private async handleShare(): Promise<void> {
    const url = journeyStore.getShareUrl()
    const state = journeyStore.getState()
    const shareData = {
      title: 'Tid er Penge',
      text: `Se hvad ${this.formatCurrency(state.data.amount)} i ${state.data.stockName} blev til!`,
      url,
    }

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
        track('Share Success', { method: 'native' })
      } else {
        await navigator.clipboard.writeText(url)
        track('Share Success', { method: 'clipboard' })
        this.showToast('Link kopieret!')
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        track('Share Success', { method: 'clipboard' })
        this.showToast('Link kopieret!')
      } catch {
        this.showToast('Kunne ikke kopiere link')
      }
    }
  }

  private showToast(message: string): void {
    const toast = document.getElementById('share-toast')
    if (!toast) return
    toast.textContent = message
    toast.classList.add('share-toast-visible')
    setTimeout(() => toast.classList.remove('share-toast-visible'), 2500)
  }

  private showResultsImmediate(
    finalValue: number,
    _returnPct: number,
    amount: number,
    _stockName: string,
    result: CalculationResult,
    marketResult: CalculationResult | null,
    stock: ReturnType<typeof getStockByTicker>
  ): void {
    const valueEl = document.getElementById('results-value')
    const badgeEl = document.getElementById('results-badge')
    const chartContainer = this.element?.querySelector('.results-chart') as HTMLElement
    const ctaEl = this.element?.querySelector('.results-cta') as HTMLElement
    const dividendSection = document.getElementById('dividend-section')
    const dividendAmountEl = document.getElementById('dividend-amount')
    const state = journeyStore.getState()
    const years = state.data.years

    if (valueEl) valueEl.textContent = this.formatCurrency(finalValue)
    if (badgeEl) badgeEl.style.opacity = '1'

    if (stock?.dividend && stock.dividendYield && dividendSection && dividendAmountEl) {
      const dividendValue = this.calculateDividendCompound(amount, finalValue, stock.dividendYield, years)
      dividendSection.style.opacity = '1'
      dividendAmountEl.textContent = this.formatCurrency(dividendValue)
    }

    if (chartContainer) {
      chartContainer.style.opacity = '1'
      this.initChart(result, marketResult, amount, state.data.stockName || '')
    }

    if (ctaEl) ctaEl.style.opacity = '1'
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

      // Update share URL
      pushShareUrl()
    } catch (error) {
      console.error('Error changing year:', error)
    }
  }

  private updateDisplay(result: CalculationResult, amount: number, years: number, _stockName: string, stock: ReturnType<typeof getStockByTicker>): void {
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
    stock: ReturnType<typeof getStockByTicker>
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
      const dividendValue = this.calculateDividendCompound(amount, finalValue, stock.dividendYield!, years)
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
