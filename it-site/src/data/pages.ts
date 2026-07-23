// ─────────────────────────────────────────────────────────────────────────────
// Page-level editable copy for the IT site.
//
// This file holds the marketing copy that used to be hardcoded inside .astro
// pages, so the CMS (admin → IT Site → Homepage) can edit it. The .astro pages
// import from here; do not re-inline these values.
// ─────────────────────────────────────────────────────────────────────────────

/** Homepage "IT solutions that move your business forward." cards (5). */
export const homeServices = [
  {
    title: 'Technology & Cybersecurity',
    href: '/services/',
    blurb:
      'Our technology consulting services help businesses modernize systems, implement the right tools, and minimize risk without overwhelming your teams. From cloud migrations to endpoint security, we build resilient, flexible infrastructures designed for growth.',
  },
  {
    title: 'Internet & Network Cybersecurity',
    href: '/services/cybersecurity/',
    blurb:
      'Our cybersecurity consulting services are built to outpace today’s threats. We secure your networks, safeguard your data, and keep your operations running with 24/7 visibility and protection.',
  },
  {
    title: 'Managed IT Services',
    href: '/services/',
    blurb:
      'With Alpine Mar’s managed IT services, you get ongoing support, system monitoring, and strategic planning from a team that acts like an extension of yours. Scalable, secure, and backed by real people who pick up the phone when you call.',
  },
  {
    title: 'IT Consulting Services',
    href: '/services/it-consulting/',
    blurb:
      'Technology should drive your business forward, not slow it down. Our IT consulting services help align your tech with your goals, so you can make smarter decisions, avoid costly pitfalls, and plan for what’s next.',
  },
  {
    title: 'Remote IT Support',
    href: '/services/remote-it-support/',
    blurb:
      'Whether you’re remote-first or have satellite offices, our remote IT support team delivers fast, reliable help when and where you need it. We fix issues before they disrupt your business.',
  },
];

/** About page "What guides us" principles (5). */
export const values = [
  {
    title: 'Clarity',
    body: 'Tech doesn’t have to be confusing. We explain everything clearly and make smart solutions feel simple.',
  },
  {
    title: 'Responsiveness',
    body: 'You won’t wait on hold. You’ll get a person, quickly.',
  },
  {
    title: 'Trust',
    body: 'We give honest advice, even if it’s not what’s easiest for us.',
  },
  {
    title: 'Proactivity',
    body: 'We don’t just fix things, we prevent problems before they start.',
  },
  {
    title: 'Partnership',
    body: 'We see ourselves as an extension of your team, not just another vendor.',
  },
];

/**
 * Services page — the four service-line cards (title + blurb). These are
 * separate marketing blurbs, distinct from each service's own `summary`.
 * `slug` links the card to its service page.
 */
export const serviceLineCards = [
  {
    slug: 'cybersecurity',
    title: 'Ongoing Cybersecurity Protection',
    blurb:
      "Most attacks don't target your computer anymore. They target your email and your cloud drive, because that's where your business actually lives now. We get inside your Workspace or 365 environment as an admin, watch for anyone trying to get in who shouldn't, and shut it down before it becomes a real problem.",
  },
  {
    slug: 'workspace-it-support',
    title: 'Workspace IT Support',
    blurb:
      "Computers, printers, scanners, the software your team touches every day. We handle setup, troubleshooting, and the small stuff that eats up your afternoon, backed by a curated list of hardware we already know works with everything else you use.",
  },
  {
    slug: 'custom-solutions',
    title: 'Custom Solutions',
    blurb:
      "Some requests don't fit a standard plan. A legacy server you can't retire. A custom app. A specialty integration. We bring in the right specialists and scope it properly instead of forcing it into a box it doesn't belong in.",
  },
];

/**
 * Per-service CTA band — the "Ready to Secure What's Next?" block shown near the
 * bottom of every service page on the live site (static, same on all services).
 */
export const serviceCta = {
  heading: 'Ready to Secure What’s Next?',
  body: 'Get a free IT assessment and see how our remote IT support services strengthen your systems, reduce risk, and keep your business running without disruption or on-site visits.',
  primaryLabel: 'Book a Free IT Assessment',
  primaryHref: '/contact/',
  secondaryLabel: 'Explore Our Services',
  secondaryHref: '/services/',
};

/** Business hours line shown next to the phone number across the site. */
export const businessHours = 'Monday–Friday, 9 AM–5 PM ET';

/** HubSpot embed config for the contact forms. */
export const hubspot = {
  region: 'na1',
  portalId: '42958375',
  formId: '1636ed35-b770-47ad-87c7-127ccaa449d0',
};
