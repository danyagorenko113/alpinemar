import { site } from './site';

const ORG_ID = `${site.url}/#organization`;
const abs = (p: string) => new URL(p, site.url).href;

// Site-wide Organization (AccountingService + LocalBusiness)
export const orgSchema = {
  '@context': 'https://schema.org',
  '@type': ['AccountingService', 'LocalBusiness'],
  '@id': ORG_ID,
  name: site.legalName,
  description: site.description,
  url: site.url,
  telephone: site.phoneHref,
  email: site.email,
  foundingDate: '2020',
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
  sameAs: Object.values(site.socials).filter((url): url is string => !!url),
  memberOf: [
    { '@type': 'Organization', name: 'American Institute of Certified Public Accountants', alternateName: 'AICPA' },
    { '@type': 'Organization', name: 'Florida Institute of Certified Public Accountants', alternateName: 'FICPA' },
  ],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${site.url}/#website`,
  url: site.url,
  name: site.name,
  publisher: { '@id': ORG_ID },
};

// Hub / list page (services, industries, insights archive)
export function collectionPageSchema(opts: { name: string; description: string; path: string; itemCount?: number }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: abs(opts.path),
    isPartOf: { '@id': `${site.url}/#website` },
    publisher: { '@id': ORG_ID },
    ...(opts.itemCount ? { numberOfItems: opts.itemCount } : {}),
  };
}

export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

export function articleSchema(opts: { title: string; description: string; date: Date; dateModified?: Date; cover?: string; path: string; author?: string }) {
  const authorName = opts.author ?? 'The Alpine Mar editorial team';
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${abs(opts.path)}#article`,
    headline: opts.title.slice(0, 110),
    description: opts.description,
    datePublished: opts.date.toISOString(),
    dateModified: (opts.dateModified ?? opts.date).toISOString(),
    image: opts.cover ? abs(opts.cover) : abs('/og-default.jpg'),
    author: {
      '@type': 'Organization',
      name: authorName,
      url: abs('/about-us/'),
    },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': abs(opts.path) },
  };
}

export function serviceSchema(opts: { name: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${abs(opts.path)}#service`,
    name: opts.name,
    description: opts.description,
    url: abs(opts.path),
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'State', name: 'Florida' },
  };
}

export function personGraph(team: readonly { name: string; role: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': team.map((m) => {
      const cpa = /,\s*CPA$/.test(m.name);
      return {
        '@type': 'Person',
        name: m.name.replace(/,\s*CPA$/, ''),
        ...(cpa ? { honorificSuffix: 'CPA' } : {}),
        jobTitle: m.role,
        worksFor: { '@id': ORG_ID },
      };
    }),
  };
}
