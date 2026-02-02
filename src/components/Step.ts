export abstract class Step {
  protected container: HTMLElement
  protected element: HTMLElement | null = null

  constructor(containerId: string) {
    const container = document.getElementById(containerId)
    if (!container) throw new Error(`Container ${containerId} not found`)
    this.container = container
  }

  abstract render(): HTMLElement

  mount(direction: 'forward' | 'backward' = 'forward'): void {
    this.element = this.render()
    this.element.classList.add('step')

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      this.element.classList.add('step-active')
      this.container.appendChild(this.element)
      this.onMount()
      return
    }

    this.element.classList.add(direction === 'forward' ? 'step-enter-right' : 'step-enter-left')
    this.container.appendChild(this.element)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.element?.classList.remove('step-enter-right', 'step-enter-left')
        this.element?.classList.add('step-active')
      })
    })

    this.onMount()
  }

  unmount(direction: 'forward' | 'backward' = 'forward'): Promise<void> {
    return new Promise(resolve => {
      if (!this.element) {
        resolve()
        return
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (prefersReducedMotion) {
        this.element.remove()
        this.element = null
        this.onUnmount()
        resolve()
        return
      }

      this.element.classList.remove('step-active')
      this.element.classList.add(direction === 'forward' ? 'step-exit-left' : 'step-exit-right')

      this.element.addEventListener('transitionend', () => {
        this.element?.remove()
        this.element = null
        this.onUnmount()
        resolve()
      }, { once: true })

      setTimeout(() => {
        if (this.element) {
          this.element.remove()
          this.element = null
          this.onUnmount()
          resolve()
        }
      }, 500)
    })
  }

  protected onMount(): void {}
  protected onUnmount(): void {}

  protected createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className?: string,
    content?: string
  ): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag)
    if (className) el.className = className
    if (content) el.textContent = content
    return el
  }
}
