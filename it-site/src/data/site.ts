export const site = {
  name: 'Alpine Mar IT',
  legalName: 'Alpine Mar IT',
  tagline: 'IT with a human touch.',
  description:
    'Alpine Mar IT delivers cybersecurity, cloud, and AI-forward IT services with a plain-English, business-first approach.',
  url: 'https://it.alpinemar.com',
  email: 'hello@alpinemar.com',
  phone: '(954) 208-4040',
  phoneHref: '+19542084040',
  address: {
    street: '515 E Las Olas Blvd, Suite 120',
    city: 'Fort Lauderdale',
    state: 'FL',
    zip: '33301',
  },
  parentSiteUrl: 'https://alpinemar.com',
  primaryCta: 'Book a Free IT Assessment',
} as const;

export const primaryNav = [
  { label: 'Services', href: '/services/' },
  { label: 'About', href: '/about/' },
  { label: 'Insights', href: '/blog/' },
  { label: 'Contact', href: '/contact/' },
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
