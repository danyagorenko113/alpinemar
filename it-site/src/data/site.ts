export const site = {
  name: 'Alpine Mar IT',
  legalName: 'Alpine Mar IT',
  tagline: 'IT with a human touch.',
  description:
    'Modern IT services tailored to how you really work, backed by Alpine Mar’s proven approach to trusted guidance and real results.',
  url: 'https://it.alpinemar.com',
  email: 'hello@alpinemar.com',
  phone: '(954) 208 4040',
  phoneHref: '+19542084040',
  address: {
    street: '515 E Las Olas Blvd, Suite 120',
    city: 'Fort Lauderdale',
    state: 'FL',
    zip: '33301',
  },
  parentSiteUrl: 'https://alpinemar.com',
  clientPortal: 'https://alpinemar.clientportal.com/#/login',
  mapsUrl: 'https://maps.app.goo.gl/usDZwunFQNBLvjCYA',
  primaryCta: 'Book a Free IT Assessment',
  socials: [
    { label: 'Facebook', href: 'https://www.facebook.com/people/Alpine-Mar-CPA-Advisors/100065183311201/' },
    { label: 'X', href: 'https://x.com/alpinemarhq' },
    { label: 'Instagram', href: 'https://www.instagram.com/alpinemarhq/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/alpine-mar-cpa-advisors/' },
  ],
} as const;

export const primaryNav = [
  { label: 'Services', href: '/services/' },
  { label: 'About Us', href: '/about/' },
  { label: 'Media', href: '/media/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Contact Us', href: '/contact/' },
] as const;

export const serviceGroups = [
  {
    label: 'Cybersecurity',
    services: [
      'cybersecurity',
      'incident-response',
      'vulnerability-management',
      'network-security-monitoring',
      'email-security',
      'managed-endpoint-security',
      'managed-cloud-security',
    ],
  },
  {
    label: 'Cloud & Infrastructure',
    services: [
      'cloud-management',
      'remote-monitoring-and-management',
      'data-protection-and-data-security',
    ],
  },
  {
    label: 'Advisory',
    services: [
      'it-consulting',
      'it-risk-management',
      'it-compliance',
      'remote-it-support',
    ],
  },
  {
    label: 'AI',
    services: [
      'ai-security',
      'ai-integration',
      'ai-code-security-audit',
    ],
  },
] as const;
