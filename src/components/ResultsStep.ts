import { Step } from './Step'
import { journeyStore, pushShareUrl } from '../state/journey'
import { countUp } from '../animations/countUp'
import { triggerConfetti } from '../animations/confetti'
import { GrowthChart } from '../chart'
import { getStockByTicker, getSlugByTicker, STOCKS } from '../config/stocks'
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

    // Share buttons
    const shareSection = this.createElement('div', 'share-section')

    const shareLabel = this.createElement('p', 'share-label', 'Del dit resultat')
    shareSection.appendChild(shareLabel)

    const shareButtons = this.createElement('div', 'share-buttons')

    const shareText = this.getShareText(data.amount, result.finalValue, data.stockName || '', data.years)
    const shareUrl = journeyStore.getShareUrl()

    // Facebook
    const fbBtn = this.createElement('a', 'share-btn share-btn-facebook') as HTMLAnchorElement
    fbBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    fbBtn.target = '_blank'
    fbBtn.rel = 'noopener'
    fbBtn.setAttribute('aria-label', 'Del på Facebook')
    fbBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
    fbBtn.addEventListener('click', (e) => {
      e.preventDefault()
      window.open(fbBtn.href, 'share', 'width=600,height=400')
      track('Share Clicked', { method: 'facebook' })
    })

    // X/Twitter
    const xBtn = this.createElement('a', 'share-btn share-btn-x') as HTMLAnchorElement
    xBtn.href = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    xBtn.target = '_blank'
    xBtn.rel = 'noopener'
    xBtn.setAttribute('aria-label', 'Del på X')
    xBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
    xBtn.addEventListener('click', (e) => {
      e.preventDefault()
      window.open(xBtn.href, 'share', 'width=600,height=400')
      track('Share Clicked', { method: 'twitter' })
    })

    // LinkedIn
    const liBtn = this.createElement('a', 'share-btn share-btn-linkedin') as HTMLAnchorElement
    liBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    liBtn.target = '_blank'
    liBtn.rel = 'noopener'
    liBtn.setAttribute('aria-label', 'Del på LinkedIn')
    liBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`
    liBtn.addEventListener('click', (e) => {
      e.preventDefault()
      window.open(liBtn.href, 'share', 'width=600,height=400')
      track('Share Clicked', { method: 'linkedin' })
    })

    // Copy link
    const copyBtn = this.createElement('button', 'share-btn share-btn-copy')
    copyBtn.setAttribute('type', 'button')
    copyBtn.setAttribute('aria-label', 'Kopier link')
    copyBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
    copyBtn.addEventListener('click', () => this.handleCopyLink())

    shareButtons.append(fbBtn, xBtn, liBtn, copyBtn)
    shareSection.appendChild(shareButtons)

    const toast = this.createElement('div', 'share-toast')
    toast.id = 'share-toast'
    toast.setAttribute('role', 'status')
    toast.setAttribute('aria-live', 'polite')
    shareSection.appendChild(toast)

    // Cross-links to other stocks
    const crossLinks = this.createElement('div', 'cross-links')
    const crossTitle = this.createElement('p', 'cross-links-title', 'Sammenlign med andre aktier')
    crossLinks.appendChild(crossTitle)

    const crossGrid = this.createElement('div', 'cross-links-grid')
    const currentTicker = data.stock || ''
    const otherStocks = STOCKS.filter(s => s.ticker !== currentTicker)
      .sort((a, b) => this.hashPair(currentTicker, a.ticker) - this.hashPair(currentTicker, b.ticker))
      .slice(0, 4)
    for (const s of otherStocks) {
      const slug = getSlugByTicker(s.ticker)
      if (!slug) continue
      const link = this.createElement('a', 'cross-link') as HTMLAnchorElement
      link.href = `/aktier/${slug}/`
      link.textContent = s.name
      crossGrid.appendChild(link)
    }
    const allLink = this.createElement('a', 'cross-link cross-link-all') as HTMLAnchorElement
    allLink.href = '/aktier/'
    allLink.textContent = 'Se alle aktier →'
    crossGrid.appendChild(allLink)
    crossLinks.appendChild(crossGrid)

    const restartNav = this.createElement('div', 'results-restart')
    const restartBtn = this.createElement('button', 'restart-btn', '← Prøv en anden aktie')
    restartBtn.setAttribute('type', 'button')
    restartBtn.addEventListener('click', () => journeyStore.reset())
    restartNav.appendChild(restartBtn)

    wrapper.append(confettiCanvas, header, card, chartContainer, cta, shareSection, crossLinks, restartNav)

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

  private getShareText(amount: number, finalValue: number, stockName: string, years: number): string {
    return `Jeg ville have haft ${this.formatCurrency(finalValue)} hvis jeg havde investeret ${this.formatCurrency(amount)} i ${stockName} for ${years} \u00e5r siden! Tjek din aktie \ud83d\udcc8`
  }

  private async handleCopyLink(): Promise<void> {
    const url = journeyStore.getShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      track('Share Clicked', { method: 'clipboard' })
      this.showToast('Link kopieret!')
    } catch {
      this.showToast('Kunne ikke kopiere link')
    }
  }

  private toastTimeout: ReturnType<typeof setTimeout> | null = null

  private showToast(message: string): void {
    const toast = document.getElementById('share-toast')
    if (!toast) return
    if (this.toastTimeout) clearTimeout(this.toastTimeout)
    toast.textContent = message
    toast.classList.add('share-toast-visible')
    this.toastTimeout = setTimeout(() => toast.classList.remove('share-toast-visible'), 2500)
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

  private static readonly currencyFormatter = new Intl.NumberFormat('da-DK', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  private formatCurrency(value: number): string {
    return ResultsStep.currencyFormatter.format(value) + ' kr.'
  }

  private hashPair(a: string, b: string): number {
    const str = `${a}-${b}`
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
    }
    return hash
  }
}
