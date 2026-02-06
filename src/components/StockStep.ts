import { Step } from './Step'
import { journeyStore } from '../state/journey'
import { STOCKS } from '../config/stocks'
import { track } from '../config/analytics'

export { STOCKS, getStockByTicker } from '../config/stocks'
export type { StockOption } from '../config/stocks'

export class StockStep extends Step {
  render(): HTMLElement {
    const wrapper = this.createElement('div', 'stock-step')

    const header = this.createElement('div', 'step-header')
    const title = this.createElement('h2', 'step-title', 'Vælg en aktie')
    const subtitle = this.createElement('p', 'step-subtitle', 'Hvilken investering vil du tidsrejse med?')
    header.append(title, subtitle)

    const grid = this.createElement('div', 'stock-grid')

    STOCKS.forEach(stock => {
      const card = this.createElement('button', 'stock-card')
      card.setAttribute('data-ticker', stock.ticker)
      card.setAttribute('type', 'button')

      const logoWrapper = this.createElement('span', 'stock-logo')
      logoWrapper.innerHTML = stock.logo

      const name = this.createElement('span', 'stock-name', stock.name)

      card.append(logoWrapper, name)

      if (stock.dividend) {
        const badge = this.createElement('span', 'dividend-badge', 'Udbytte')
        card.appendChild(badge)
      }

      card.addEventListener('click', () => {
        track('Stock Selected', { stock: stock.ticker, name: stock.name })
        journeyStore.setStock(stock.ticker, stock.name)
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

    wrapper.append(header, grid)
    return wrapper
  }
}
