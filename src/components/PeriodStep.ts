import { Step } from './Step'
import { journeyStore } from '../state/journey'
import { Calculator } from '../calculator'
import { track } from '../config/analytics'

interface PeriodOption {
  years: number
  label: string
  description: string
}

const ALL_PERIODS: PeriodOption[] = [
  { years: 2, label: '2 år', description: 'Kort sigt' },
  { years: 5, label: '5 år', description: 'Medium sigt' },
  { years: 10, label: '10 år', description: 'Langt sigt' },
  { years: 20, label: '20 år', description: 'Meget langt' },
]

export class PeriodStep extends Step {
  private calculator = new Calculator()
  private availablePeriods: PeriodOption[] = []

  render(): HTMLElement {
    const wrapper = this.createElement('div', 'period-step')
    const state = journeyStore.getState()

    const header = this.createElement('div', 'step-header')
    const title = this.createElement('h2', 'step-title', 'Hvor langt tilbage?')
    const subtitle = this.createElement('p', 'step-subtitle',
      `${this.formatCurrency(state.data.amount)} i ${state.data.stockName}`)
    header.append(title, subtitle)

    const grid = this.createElement('div', 'period-grid')
    grid.id = 'period-grid'

    const loadingEl = this.createElement('div', 'period-loading')
    loadingEl.id = 'period-loading'
    loadingEl.innerHTML = '<div class="loading-spinner"><div class="spinner-dot"></div><div class="spinner-dot"></div><div class="spinner-dot"></div></div><p>Finder de bedste perioder...</p>'

    const nav = this.createElement('div', 'step-nav step-nav-single')

    const backBtn = this.createElement('button', 'nav-btn nav-btn-secondary', '← Tilbage')
    backBtn.setAttribute('type', 'button')
    backBtn.addEventListener('click', () => journeyStore.prevStep())

    nav.appendChild(backBtn)

    wrapper.append(header, loadingEl, grid, nav)
    return wrapper
  }

  protected async onMount(): Promise<void> {
    await this.checkPositivePeriods()
    this.renderPeriodCards()
  }

  private async checkPositivePeriods(): Promise<void> {
    const state = journeyStore.getState()
    const ticker = state.data.stock
    const amount = state.data.amount

    if (!ticker) return

    this.availablePeriods = []

    for (const period of ALL_PERIODS) {
      try {
        const result = await this.calculator.calculate(ticker, amount, period.years)
        const returnPct = ((result.finalValue - amount) / amount) * 100
        if (returnPct > 0) {
          this.availablePeriods.push(period)
        }
      } catch {
        // Period not available (not enough data), skip
      }
    }
  }

  private renderPeriodCards(): void {
    const loadingEl = document.getElementById('period-loading')
    const grid = document.getElementById('period-grid')
    if (!grid || !loadingEl) return

    loadingEl.style.display = 'none'

    if (this.availablePeriods.length === 0) {
      const message = this.createElement('p', 'period-no-results',
        'Ingen positive perioder fundet for denne aktie. Prøv en anden.')
      grid.appendChild(message)
      return
    }

    this.availablePeriods.forEach(period => {
      const card = this.createElement('button', 'period-card')
      card.setAttribute('type', 'button')
      card.setAttribute('data-years', period.years.toString())

      const years = this.createElement('span', 'period-years', period.label)
      const desc = this.createElement('span', 'period-desc', period.description)

      card.append(years, desc)

      card.addEventListener('click', () => {
        const state = journeyStore.getState()
        track('Period Selected', { stock: state.data.stock || '', period: period.years })
        journeyStore.setYears(period.years)
        journeyStore.nextStep()
      })

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          card.click()
        }
      })

      grid.appendChild(card)
    })
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('da-DK', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' kr.'
  }
}
