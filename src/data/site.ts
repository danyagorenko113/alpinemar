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
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/',
    twitter: 'https://twitter.com/',
  },
  memberships: ['AICPA', 'FICPA'],
} as const;

export const primaryNav = [
  { label: 'Services', href: '/services/' },
  { label: 'Industries', href: '/industries/' },
  { label: 'Insights', href: '/blog/' },
  { label: 'About Us', href: '/about-us/' },
] as const;
