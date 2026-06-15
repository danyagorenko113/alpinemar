// Verbatim copy from alpinemar.com homepage (SEO parity — do not paraphrase).
// `image` = hover-preview thumbnail. TEMP stand-ins from client photos until
// bespoke fal.ai art is generated (then just swap the paths).
export const featuredServices = [
  {
    title: 'Tax Planning',
    href: '/services/tax-planning-services/',
    icon: 'trending-up',
    image: '/images/ind-high-net-worth.png',
    summary: 'At Alpine Mar, we understand the importance of accurate and efficient income tax preparation.',
  },
  {
    title: 'Outsourced Accounting',
    href: '/services/outsourced-accounting-services/',
    icon: 'calculator',
    image: '/images/hero-team.jpg',
    summary: 'Outsourcing accounting operations is often more cost-effective than maintaining an in-house accounting department.',
  },
  {
    title: 'Private Client Services',
    href: '/services/private-client-services/',
    icon: 'users',
    image: '/images/manifesto-portrait.webp',
    summary: 'Personalized services that support individuals and families with complex financial needs through integrated tax, estate, and wealth planning.',
  },
  {
    title: 'Transaction Advisory',
    href: '/services/transaction-advisory-services/',
    icon: 'repeat',
    image: '/images/ind-startup.jpg',
    summary: 'Financial modeling services involve building detailed models that forecast and analyze financial performance to help businesses make informed strategic decisions.',
  },
  {
    title: 'Audit & Attestation Services',
    href: '/services/audit-attestation-services/',
    icon: 'shield-check',
    image: '/images/ind-law-firm.png',
    summary: 'Independent audit and assurance services that enhance the accuracy, transparency, and credibility of financial reporting.',
  },
] as const;

// 3 industries featured on the live homepage, with verbatim descriptions.
export const featuredIndustries = [
  {
    title: 'High Net-Worth Accountants',
    href: '/industries/high-net-worth-accounting-cpa/',
    image: '/images/ind-high-net-worth.png',
    body: 'We help our high net-worth clients analyze their entity structures and various types of taxable income to strategically minimize the taxable impact.',
  },
  {
    title: 'Healthcare',
    href: '/industries/healthcare-accounting-services/',
    image: '/images/ind-healthcare.png',
    body: 'We navigate the tax complexities associated with the industry and minimize their tax expense by using all of the available deductions.',
  },
  {
    title: 'Advertising & Marketing Agencies',
    href: '/industries/marketing-agency-accounting-services/',
    image: '/images/ind-marketing.png',
    body: 'Creative service providers, trust Alpine Mar to provide a comprehensive suite of services, including financial management and strategic guidance.',
  },
] as const;

export const partnerLogos = [
  { name: 'QuickBooks', src: '/images/logos/quickbooks.webp' },
  { name: 'Oracle NetSuite', src: '/images/logos/netsuite.webp' },
  { name: 'Yardi', src: '/images/logos/yardi.webp' },
  { name: 'Mercury', src: '/images/logos/mercury.webp' },
  { name: 'ADP', src: '/images/logos/adp.webp' },
  { name: 'Sage', src: '/images/logos/sage.webp' },
  { name: 'Gusto', src: '/images/logos/gusto.webp' },
  { name: 'Justworks', src: '/images/logos/justworks.webp' },
  { name: 'Carta', src: '/images/logos/carta.webp' },
  { name: 'CoinTracker', src: '/images/logos/cointracker.png' },
  { name: 'Innflow', src: '/images/logos/innflow.webp' },
  { name: 'BDC', src: '/images/logos/bdc.webp' },
  { name: 'MakersHub', src: '/images/logos/makershub.webp' },
] as const;

// Industry descriptions are verbatim from alpinemar.com/industries/ (SEO parity).
export const industries = [
  { title: 'Construction', href: '/industries/construction-cpa-services/', image: '/images/ind-construction.png', desc: 'Given all of the moving parts involved, our ability to manage the specific accounting and tax complexities makes us an invaluable asset to your budget.' },
  { title: 'Family Office', href: '/industries/family-office-accounting-services/', image: '/images/ind-family-office.png', desc: 'As families look to safeguard their assets for future generations, they need someone they can depend on.' },
  { title: 'Healthcare', href: '/industries/healthcare-accounting-services/', image: '/images/ind-healthcare.png', desc: 'We navigate the tax complexities associated with the industry and minimize their tax expense by using all of the available deductions.' },
  { title: 'High Net Worth', href: '/industries/high-net-worth-accounting-cpa/', image: '/images/ind-high-net-worth.png', desc: 'We help our high net-worth clients analyze their entity structures and various types of taxable income to strategically minimize the taxable impact.' },
  { title: 'Law Firms', href: '/industries/law-firm-accounting-services/', image: '/images/ind-law-firm.png', desc: 'Professional service firms, including law firms, turn to Alpine Mar for a full-service, outsourced accounting function and ongoing tax advice.' },
  { title: 'Marketing Agencies', href: '/industries/marketing-agency-accounting-services/', image: '/images/ind-marketing.png', desc: 'Creative service providers, trust Alpine Mar to provide a comprehensive suite of services, including financial management and strategic guidance.' },
  { title: 'Real Estate', href: '/industries/real-estate-cpa-services/', image: '/images/ind-real-estate.png', desc: 'We help plan for each transaction, understand all available deferral options, and maximize each year’s deductions.' },
  { title: 'Sports & Athletes', href: '/industries/sports-accounting-services/', image: '/images/ind-sports.png', desc: 'From professional and collegiate athletes to performers at packed concert venues, our clients spend their time sharing their talents.' },
  { title: 'Crypto', href: '/industries/crypto-cpa-services/', image: '/images/ind-crypto.jpg', desc: 'Individuals and businesses that trade in digital assets rely on our team for compliant reporting and tax optimization.' },
  { title: 'SaaS', href: '/industries/saas-accounting-services/', image: '/images/ind-saas.jpg', desc: 'We help SaaS companies with accurate revenue recognition, cash flow management, key metrics, and tax compliance.' },
  { title: 'Startups', href: '/industries/startup-cpa-services/', image: '/images/ind-startup.jpg', desc: 'We provide essential financial management, strategic planning, and accounting expertise to support early-stage and high-growth companies.' },
] as const;

// Services hub list — verbatim names & summaries from alpinemar.com/services/.
// `group` = the firm's own service taxonomy; `image` = hover-preview (TEMP client
// photos until bespoke fal art is generated).
export const allServices = [
  { title: 'Tax Planning', group: 'Tax', href: '/services/tax-planning-services/', image: '/images/ind-high-net-worth.png', summary: 'At Alpine Mar, we understand the importance of accurate and efficient income tax preparation.' },
  { title: 'Tax Strategy', group: 'Tax', href: '/services/tax-advisory-and-compliance/', image: '/images/ind-startup.jpg', summary: 'We provide comprehensive, long-term approaches to taxation that align with your financial goals, using innovative and strategic measures to maximize tax advantages over time.' },
  { title: 'Multistate Tax Services', group: 'Tax', href: '/services/multistate-tax-services/', image: '/images/ind-real-estate.png', summary: 'Simplify and optimize your interstate tax obligations with our expert multistate tax services for businesses.' },
  { title: 'Outsourced Accounting', group: 'Accounting', href: '/services/outsourced-accounting-services/', image: '/images/hero-team.jpg', summary: 'Outsourcing accounting operations is often more cost-effective than maintaining an in-house accounting department.' },
  { title: 'Outsourced Bookkeeping', group: 'Accounting', href: '/services/outsourced-bookkeeping-services/', image: '/images/ind-healthcare.png', summary: 'Discover the cost-effective and efficient approach to managing your company’s financial records with our virtual bookkeeping team.' },
  { title: 'Financial Statement Preparation', group: 'Accounting', href: '/services/financial-statement-preparation-services/', image: '/images/ind-law-firm.png', summary: 'We specialize in financial statement preparation services, a crucial component of financial management that unveils the financial story of your organization.' },
  { title: 'Accounting System Implementation', group: 'Accounting', href: '/services/accounting-software-implementation/', image: '/images/ind-saas.jpg', summary: 'We guide you through the implementation process, offering expert accounting software implementation services that will revolutionize your financial operations.' },
  { title: 'Fractional CFO', group: 'Advisory', href: '/services/fractional-cfo-services/', image: '/images/manifesto-portrait.webp', summary: 'Our part-time CFOs offer strategic, high-level financial expertise without the full-time CFO commitment, thereby providing small and medium-sized businesses access to skills typically reserved for larger corporations.' },
  { title: 'Transaction Advisory', group: 'Advisory', href: '/services/transaction-advisory-services/', image: '/images/ind-family-office.png', summary: 'Alpine Mar offers expert transaction advisory services to help you navigate complex financial transactions and maximize your growth potential.' },
  { title: 'Financial Modeling Services', group: 'Advisory', href: '/services/financial-modeling-services/', image: '/images/ind-sports.png', summary: 'Our financial modeling services help businesses make informed strategic decisions for long-term success.' },
  { title: 'Entity Structuring', group: 'Compliance', href: '/services/business-structure-consulting/', image: '/images/ind-construction.png', summary: 'We can help you figure out the right structure, help you incorporate with states, and register to do business.' },
  { title: 'S Corp CPA & Accounting', group: 'Compliance', href: '/services/s-corp-cpa-services/', image: '/images/ind-marketing.png', summary: 'As your trusted S Corp Certified Public Accountants (CPAs), our accounting firm provides an array of services to enhance your legal entity’s financial management.' },
  { title: 'BOI Reporting Services', group: 'Compliance', href: '/services/boi-reporting-services/', image: '/images/ind-crypto.jpg', summary: 'Streamline the process of filing Beneficial Ownership Information (BOI), mandated by the 2017 Corporate Transparency Act.' },
  { title: 'Payroll Compliance Services', group: 'Compliance', href: '/services/payroll-compliance-services/', image: '/images/ind-high-net-worth.png', summary: 'Our payroll compliance service streamlines this process, ensuring that your payroll tax obligations are met efficiently and accurately.' },
] as const;

export const integrations = [
  'QuickBooks',
  'Oracle NetSuite',
  'Yardi',
  'Mercury',
  'Xero',
  'Vestwell',
  'CoinTracker',
  'Sage',
  'ADP',
  'Innflow',
] as const;

// Latest posts shown on the live homepage (temporary — will come from the
// `insights` collection after content migration).
export const latestPosts = [
  {
    title: 'What You Need to Know About the New York City Pied-à-Terre Tax',
    href: '/blog/new-york-city-pied-a-terre/',
    cover: '/images/post-nyc-pied-a-terre.jpg',
    excerpt: 'The New York City Pied-à-Terre Tax was signed into law on May 28, 2026, as part of New York’s broader effort to tax high-value second homes.',
  },
  {
    title: 'How to Optimize Cash Burn Rate for a Longer Runway',
    href: '/blog/cash-burn-rate-gross-vs-net-burn/',
    cover: '/images/post-cash-burn-rate.jpg',
    excerpt: 'Cash burn rate determines a startup’s operational lifespan. Precise tracking allows founders to extend their runway and secure investor confidence.',
  },
  {
    title: 'How to Create a Budget for Your Tech Startup',
    href: '/blog/tech-startup-budget-example/',
    cover: '/images/post-tech-startup-budget.jpg',
    excerpt: 'Create a tech startup budget by identifying your core growth milestones and calculating your monthly burn rate to plan ahead.',
  },
] as const;

// Team — verbatim names & roles from alpinemar.com/about-us/ (SEO parity).
export const team = [
  { name: 'Pablo Martell, CPA', role: 'CEO & Managing Partner' },
  { name: 'Kevin DeCicco, CPA', role: 'COO & Managing Tax Partner' },
  { name: 'Cristina DeCicco, CPA', role: 'Partner' },
  { name: 'Brian Fine, CPA', role: 'Partner' },
  { name: 'Ian Schlakman', role: 'CIO and Head of IT Services' },
  { name: 'Emily Bradey', role: 'Director – Client Accounting Services' },
  { name: 'Jennifer Lopez', role: 'Director – Compliance Services' },
  { name: 'Derby Norvilus', role: 'Director – Audit & Assurance' },
  { name: 'Kirill Reznik, CPA', role: 'Director – Tax' },
  { name: 'Matthew Senger', role: 'Director – Financial Advisory Services' },
  { name: 'Vanessa Holub', role: 'IT Director' },
  { name: 'Ashley Quintal-Schwab', role: 'Director – Tax' },
  { name: 'Reymar Gulan', role: 'Manager – Client Accounting Services' },
  { name: 'Brian Hancock, CPA', role: 'Manager – Tax' },
  { name: 'Dana Muntean, CPA', role: 'Manager – Tax & Client Accounting Services' },
  { name: 'Kathleen Lax', role: 'Office Manager' },
  { name: 'Diane Spinelli', role: 'Manager – Tax & Client Accounting Services' },
  { name: 'Luis Alberto Marquez', role: 'Manager – Audit & Assurance' },
  { name: 'Javier Villa Rivas', role: 'Senior Manager – Tax' },
  { name: 'Sean Maloney', role: 'Manager – Tax' },
  { name: 'Devin Christie', role: 'Associate – Tax & Client Accounting Services' },
  { name: 'Rommel Linatoc', role: 'Associate – Client Accounting Services' },
  { name: 'Jessica Lawrence', role: 'Associate – Client Accounting Services' },
  { name: 'Marileisi Hernandez', role: 'Senior Associate – Tax' },
] as const;

export const valueProps = [
  {
    title: 'Big-firm experience',
    icon: 'award',
    body: "Backgrounds from the world's largest organizations — applied to your books, not buried in bureaucracy.",
  },
  {
    title: 'Personalized attention',
    icon: 'message-circle',
    body: 'You get a team that knows your name and your numbers, not a ticket in a queue.',
  },
  {
    title: 'A fresh perspective',
    icon: 'sparkles',
    body: 'Technology-first workflows that turn accounting from a cost center into a decision engine.',
  },
  {
    title: 'Privacy & trust',
    icon: 'lock',
    body: 'Discretion and security built into everything we touch — especially the sensitive stuff.',
  },
] as const;
