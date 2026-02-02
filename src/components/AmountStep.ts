import { Step } from './Step'
import { journeyStore } from '../state/journey'

const PRESETS = [1000, 5000, 10000, 50000]

export class AmountStep extends Step {
  private input: HTMLInputElement | null = null

  render(): HTMLElement {
    const wrapper = this.createElement('div', 'amount-step')
    const state = journeyStore.getState()

    const header = this.createElement('div', 'step-header')
    const title = this.createElement('h2', 'step-title', 'Hvor meget ville du investere?')
    const subtitle = this.createElement('p', 'step-subtitle', `i ${state.data.stockName || 'aktien'}`)
    header.append(title, subtitle)

    const inputGroup = this.createElement('div', 'amount-input-group')

    const inputWrapper = this.createElement('div', 'amount-input-wrapper')
    const prefix = this.createElement('span', 'amount-prefix', 'kr.')
    this.input = document.createElement('input')
    this.input.type = 'text'
    this.input.inputMode = 'numeric'
    this.input.className = 'amount-input'
    this.input.value = this.formatNumber(state.data.amount)
    this.input.setAttribute('aria-label', 'Investeringsbeløb')

    this.input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement
      const raw = target.value.replace(/\D/g, '')
      const num = parseInt(raw) || 0
      target.value = this.formatNumber(num)
      journeyStore.setAmount(num)
    })

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleContinue()
      }
    })

    inputWrapper.append(prefix, this.input)

    const presets = this.createElement('div', 'amount-presets')
    PRESETS.forEach(amount => {
      const btn = this.createElement('button', 'preset-btn', this.formatShortAmount(amount))
      btn.setAttribute('type', 'button')
      btn.addEventListener('click', () => {
        journeyStore.setAmount(amount)
        if (this.input) this.input.value = this.formatNumber(amount)
      })
      presets.appendChild(btn)
    })

    inputGroup.append(inputWrapper, presets)

    const nav = this.createElement('div', 'step-nav')

    const backBtn = this.createElement('button', 'nav-btn nav-btn-secondary', '← Tilbage')
    backBtn.setAttribute('type', 'button')
    backBtn.addEventListener('click', () => journeyStore.prevStep())

    const continueBtn = this.createElement('button', 'nav-btn nav-btn-primary', 'Fortsæt')
    continueBtn.setAttribute('type', 'button')
    continueBtn.addEventListener('click', () => this.handleContinue())

    nav.append(backBtn, continueBtn)

    wrapper.append(header, inputGroup, nav)
    return wrapper
  }

  protected onMount(): void {
    setTimeout(() => this.input?.focus(), 400)
  }

  private handleContinue(): void {
    const amount = journeyStore.getState().data.amount
    if (amount > 0) {
      journeyStore.nextStep()
    }
  }

  private formatNumber(n: number): string {
    return n.toLocaleString('da-DK')
  }

  private formatShortAmount(n: number): string {
    if (n >= 1000) return `${n / 1000}k`
    return n.toString()
  }
}
