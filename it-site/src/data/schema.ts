import { site } from './site';

const ORG_ID = `${site.url}/#organization`;
const abs = (p: string) => new URL(p, site.url).href;

// Site-wide Organization for the IT division (ProfessionalService + LocalBusiness).
export const orgSchema = {
  '@context': 'https://schema.org',
  '@type': ['ProfessionalService', 'LocalBusiness'],
  '@id': ORG_ID,
  name: site.legalName,
  description: site.description,
  url: site.url,
  telephone: site.phoneHref,
  email: site.email,
  image: abs('/og-default.jpg'),
  logo: abs('/favicon.png'),
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    postalCode: site.address.zip,
    addressCountry: 'US',
  },
  areaServed: { '@type': 'State', name: 'Florida' },
  sameAs: site.socials.map((s) => s.href).filter(Boolean),
  parentOrganization: { '@type': 'Organization', name: 'Alpine Mar', url: site.parentSiteUrl },
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${site.url}/#website`,
  url: site.url,
  name: site.name,
  publisher: { '@id': ORG_ID },
};
