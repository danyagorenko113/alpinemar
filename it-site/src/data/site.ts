export const site = {
  name: 'Alpine Mar IT',
  legalName: 'Alpine Mar IT',
  tagline: 'IT with a human touch.',
  description:
    'Modern IT services tailored to how you really work, backed by Alpine Mar’s proven approach to trusted guidance and real results.',
  url: 'https://it.alpinemar.com',
  email: 'hello@alpinemar.com',
  phone: '(954) 743 0147',
  phoneHref: '+19547430147',
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

// Service navigation — order mirrors the live it.alpinemar.com mega menu:
// Three primary service lines, then the remaining detail services.
export const serviceLines = [
  'cybersecurity',
  'workspace-it-support',
  'custom-solutions',
] as const;

// Flat "Explore All Our Services" list on the Services page — every detail
// service. Incident Response is now a detail service under Cybersecurity;
// AI Integration is kept here (not under a line) pending a decision.
export const moreServices = [
  'incident-response',
  'it-compliance',
  'network-security-monitoring',
  'data-protection-and-data-security',
  'email-security',
  'managed-cloud-security',
  'managed-endpoint-security',
  'ai-security',
  'vulnerability-management',
  'it-risk-management',
  'ai-code-security-audit',
  'cloud-management',
  'remote-monitoring-and-management',
  'ai-integration',
] as const;

// Grouped Services mega menu — three primary lines, each owning its detail
// services (shown when that tab is active).
export const serviceMenu = [
  {
    line: 'cybersecurity',
    children: [
      'incident-response',
      'it-compliance',
      'network-security-monitoring',
      'data-protection-and-data-security',
      'email-security',
      'managed-cloud-security',
      'managed-endpoint-security',
      'ai-security',
      'vulnerability-management',
      'it-risk-management',
      'ai-code-security-audit',
    ],
  },
  {
    line: 'workspace-it-support',
    children: [
      'cloud-management',
      'remote-monitoring-and-management',
    ],
  },
  { line: 'custom-solutions', children: [] },
] as const;
