// Analytics: Dashboard API for funnel tracking, Plausible for pageviews

const DASHBOARD_URL = 'https://thisideafucks.com'
const PROJECT_ID = 'tid-er-penge'

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void
  }
}

function getVisitorId(): string {
  let id = localStorage.getItem('_vid')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('_vid', id)
  }
  return id
}

function getSessionId(): string {
  let id = sessionStorage.getItem('_sid')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('_sid', id)
  }
  return id
}

export function track(event: string, props?: Record<string, string | number>): void {
  // Plausible: fire event
  window.plausible?.(event, props ? { props } : undefined)

  // Dashboard: send to our own tracking API
  const payload = {
    project: PROJECT_ID,
    event,
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    referrer: document.referrer || null,
    pathname: window.location.pathname,
    properties: props ?? {},
  }

  fetch(`${DASHBOARD_URL}/api/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => {
    if (import.meta.env.DEV) console.warn('[analytics]', err)
  })
}
