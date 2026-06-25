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
    facebook: 'https://www.facebook.com/Alpine-Mar-CPA-Advisors-101176861735141/',
    instagram: 'https://www.instagram.com/alpinemarhq/',
    linkedin: 'https://www.linkedin.com/company/alpine-mar-cpa-advisors/',
    twitter: 'https://twitter.com/alpinemarhq',
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
