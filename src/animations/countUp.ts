interface CountUpOptions {
  duration?: number
  easing?: (t: number) => number
  onUpdate?: (value: number) => void
  onComplete?: () => void
}

const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)

export function countUp(
  element: HTMLElement,
  endValue: number,
  formatFn: (value: number) => string,
  options: CountUpOptions = {}
): () => void {
  const {
    duration = 2000,
    easing = easeOutExpo,
    onUpdate,
    onComplete,
  } = options

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    element.textContent = formatFn(endValue)
    onUpdate?.(endValue)
    onComplete?.()
    return () => {}
  }

  let startTime: number | null = null
  let animationFrame: number
  let cancelled = false

  const animate = (currentTime: number): void => {
    if (cancelled) return

    if (!startTime) startTime = currentTime
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = easing(progress)
    const currentValue = easedProgress * endValue

    element.textContent = formatFn(currentValue)
    onUpdate?.(currentValue)

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate)
    } else {
      element.textContent = formatFn(endValue)
      onComplete?.()
    }
  }

  animationFrame = requestAnimationFrame(animate)

  return () => {
    cancelled = true
    cancelAnimationFrame(animationFrame)
  }
}
