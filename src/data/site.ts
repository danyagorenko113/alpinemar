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
  maps: {
    // Google Business Profile embed + "get directions" deep link (footer + contact page).
    embed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3582.3543621564572!2d-80.13819389999999!3d26.1199865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xab2fdb87775c598f%3A0x9a40be289abdc209!2sAlpine%20Mar%20%E2%80%93%20Florida%20CPA%20Firm!5e0!3m2!1sen!2smk!4v1784042480893!5m2!1sen!2smk',
    directions:
      'https://www.google.com/maps/dir//Alpine+Mar+%E2%80%93+Florida+CPA+Firm,+515+E+Las+Olas+Blvd+Suite+120,+Fort+Lauderdale,+FL+33301,+United+States/@26.1199913,-80.1407688,17z/data=!4m17!1m7!3m6!1s0xab2fdb87775c598f:0x9a40be289abdc209!2sAlpine+Mar+%E2%80%93+Florida+CPA+Firm!8m2!3d26.1199865!4d-80.1381939!16s%2Fg%2F11vkl8qtnd!4m8!1m0!1m5!1m1!1s0xab2fdb87775c598f:0x9a40be289abdc209!2m2!1d-80.1381939!2d26.1199865!3e0?entry=ttu',
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
