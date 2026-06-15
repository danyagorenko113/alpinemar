export const site = {
  name: 'Alpine Mar',
  legalName: 'Alpine Mar CPAs & Advisors',
  tagline: 'The Modern Day Accounting Firm',
  description:
    'Alpine Mar is a Fort Lauderdale CPA firm blending industry experience, technology, and hands-on care across tax, accounting, advisory, and audit services.',
  url: 'https://alpinemar.com',
  email: 'hello@alpinemar.com',
  phone: '(954) 743-0147',
  phoneHref: '+19547430147',
  address: {
    street: '515 E Las Olas Blvd, Suite 120',
    city: 'Fort Lauderdale',
    state: 'FL',
    zip: '33301',
  },
  socials: {
    // TODO: replace placeholders with real handles once provided by client.
    // Empty strings hide the icons in Footer (see Footer.astro filter).
    facebook: '',
    instagram: '',
    linkedin: '',
    twitter: '',
  },
  memberships: ['AICPA', 'FICPA'],
  clientPortal: 'https://alpinemar.clientportal.com/#/login',
  itPortal: 'https://it.alpinemar.com',
} as const;

export const primaryNav = [
  { label: 'Services', href: '/services/' },
  { label: 'Industries', href: '/industries/' },
  { label: 'Insights', href: '/blog/' },
  { label: 'About Us', href: '/about-us/' },
] as const;
