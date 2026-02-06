// Plausible custom event tracking
// Plausible exposes window.plausible() when loaded

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void
  }
}

export function track(event: string, props?: Record<string, string | number>): void {
  window.plausible?.(event, props ? { props } : undefined)
}
