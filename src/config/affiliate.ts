export const AFFILIATE = {
  // eToro tracking link - replace with your actual link from etoropartners.com
  link: 'https://med.etoro.com/B19887_A116631_TClick.aspx',

  // UTM parameters for tracking
  utm: {
    source: 'tiderpenge',
    medium: 'calculator',
    campaign: 'results',
  },

  // CTA text
  buttonText: 'Åbn Gratis Konto',
  headline: 'Klar til at investere?',
  subtext: 'Kom i gang med aktier på eToro',

  disclaimer: '51% af private CFD-konti taber penge.',
}

export function getAffiliateUrl(): string {
  const { link, utm } = AFFILIATE
  const params = new URLSearchParams({
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign,
  })
  return `${link}?${params.toString()}`
}
