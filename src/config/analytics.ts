// Analytics: Supabase for custom events, Plausible for pageviews
//
// Supabase anon key is safe to expose client-side — RLS restricts to insert-only.
// Plausible continues handling pageviews, bounce rate, and time-on-site for free.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const SITE = 'tiderpenge.dk'

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void
  }
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent
  let browser = 'Unknown'
  if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome/')) browser = 'Chrome'
  else if (ua.includes('Safari/')) browser = 'Safari'

  let os = 'Unknown'
  if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  return `${browser} ${os}`
}

export function track(event: string, props?: Record<string, string | number>): void {
  // Plausible: fire event (free tier tracks event counts, no props)
  window.plausible?.(event, props ? { props } : undefined)

  // Supabase: store event with full props in our own DB
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return

  const payload = {
    site: SITE,
    event,
    props: props ?? {},
    pathname: window.location.pathname,
    referrer: document.referrer || null,
    user_agent: getBrowserInfo(),
    screen_width: window.innerWidth,
  }

  fetch(`${SUPABASE_URL}/rest/v1/events`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(payload),
  }).catch((err) => {
    if (import.meta.env.DEV) console.warn('[analytics]', err)
  })
}
