// Full site navigation (mirrors the firm's service taxonomy). Used by Nav + Footer.
// Covers all 31 English service pages — 3 Spanish slugs (creacion-de-empresas,
// servicios-contables, servicios-tributarios-en-florida) are intentionally
// excluded from EN navigation.

export const serviceMenu = [
  {
    label: 'Tax',
    href: '/services/tax-advisory-and-compliance/',
    icon: 'trending-up',
    blurb: 'Year-round planning + preparation across federal, state, and multi-jurisdictional tax.',
    items: [
      { name: 'Tax Planning', href: '/services/tax-planning-services/', desc: 'Year-round strategy to drop your effective rate' },
      { name: 'Tax Strategy', href: '/services/tax-advisory-and-compliance/', desc: 'Long-term positioning + advisory' },
      { name: 'Individual Tax', href: '/services/individual-tax-services/', desc: 'Personal returns + planning' },
      { name: 'Partnership Tax', href: '/services/partnership-tax-services/', desc: 'K-1, allocations, special partnerships' },
      { name: 'Corporate Tax', href: '/services/corporate-tax-services/', desc: 'C-Corp returns + planning' },
      { name: 'S Corps', href: '/services/s-corp-cpa-services/', desc: 'S-Corp election + ongoing comp + filing' },
      { name: 'Estate & Trust Tax', href: '/services/estate-trust-tax-planning/', desc: 'Transfer planning + 706/709' },
      { name: 'Private Client', href: '/services/private-client-services/', desc: 'Integrated HNW services' },
      { name: 'Small Business Tax', href: '/services/small-business-tax-services/', desc: 'Owner-operator filing + planning' },
      { name: 'International Tax', href: '/services/international-tax-services/', desc: 'FBAR, FATCA, foreign-source' },
      { name: 'Non-Profit Tax', href: '/services/non-profit-tax-services/', desc: 'Form 990 + compliance' },
      { name: 'Multistate Tax', href: '/services/multistate-tax-services/', desc: 'Nexus + apportionment across states' },
      { name: 'Business Tax', href: '/services/business-tax/', desc: 'General business taxation' },
    ],
  },
  {
    label: 'Accounting',
    href: '/services/business-accounting/',
    icon: 'calculator',
    blurb: 'A full back office — books, close, and reporting kept clean and current.',
    items: [
      { name: 'Outsourced Accounting', href: '/services/outsourced-accounting-services/', desc: 'Full back-office function' },
      { name: 'Outsourced Bookkeeping', href: '/services/outsourced-bookkeeping-services/', desc: 'Daily books + reconciliations' },
      { name: 'Financial Statement Prep', href: '/services/financial-statement-preparation-services/', desc: 'Investor- and lender-ready statements' },
      { name: 'Accounting Software', href: '/services/accounting-software-implementation/', desc: 'QuickBooks, NetSuite, Yardi setup' },
      { name: 'Business Accounting', href: '/services/business-accounting/', desc: 'General business accounting' },
      { name: 'Trust Accounting', href: '/services/trust-accounting-cpa/', desc: 'IOLTA + trust ledgers' },
    ],
  },
  {
    label: 'Advisory',
    href: '/services/financial-advisory/',
    icon: 'repeat',
    blurb: 'CFO-level guidance for hires, raises, models, and big decisions.',
    items: [
      { name: 'Fractional CFO', href: '/services/fractional-cfo-services/', desc: 'Senior finance leadership part-time' },
      { name: 'Transaction Advisory', href: '/services/transaction-advisory-services/', desc: 'Buy- and sell-side support' },
      { name: 'Financial Modeling', href: '/services/financial-modeling-services/', desc: 'Investor- and board-ready models' },
      { name: 'Financial Advisory', href: '/services/financial-advisory/', desc: 'Strategic financial guidance' },
    ],
  },
  {
    label: 'Compliance',
    href: '/services/financial-compliance/',
    icon: 'shield-check',
    blurb: 'Structure, filings, and payroll — kept current with shifting rules.',
    items: [
      { name: 'Entity Structuring', href: '/services/business-structure-consulting/', desc: 'Pick the right vehicle from the start' },
      { name: 'BOI Reporting', href: '/services/boi-reporting-services/', desc: 'FinCEN beneficial-ownership filing' },
      { name: 'Payroll Compliance', href: '/services/payroll-compliance-services/', desc: 'Payroll tax + filings + reciprocity' },
      { name: 'Financial Compliance', href: '/services/financial-compliance/', desc: 'Internal control + audit-readiness' },
    ],
  },
  {
    label: 'Audit & Attestation',
    href: '/services/audit-attestation-services/',
    icon: 'file-text',
    blurb: 'Independent verification for investors, lenders, and regulators.',
    items: [
      { name: 'Audit & Attestation', href: '/services/audit-attestation-services/', desc: 'Independent audit + assurance' },
      { name: 'Financial Statement Audits', href: '/services/audit-attestation-services/financial-statement-audits/', desc: 'Full GAAP / IFRS audits' },
      { name: 'Reviews & Compilations', href: '/services/audit-attestation-services/reviews-compilations/', desc: 'Limited-assurance + agreed-upon procedures' },
      { name: 'Employee Benefit Plan Audits', href: '/services/audit-attestation-services/employee-benefit-plan-audits/', desc: '401(k) + EBP audits under DOL rules' },
    ],
  },
] as const;

// Category label → its parent service landing page. Mirrors the live site so
// nav headers and breadcrumbs point at the real category page (not /services/).
export const serviceGroupParent: Record<string, string> = Object.fromEntries(
  serviceMenu.map((g) => [g.label, g.href]),
);

export const industryMenu = [
  { name: 'Construction', href: '/industries/construction-cpa-services/', icon: 'building', desc: 'Job costing, retainage, surety bonds' },
  { name: 'Family Office', href: '/industries/family-office-accounting-services/', icon: 'users', desc: 'Multi-entity consolidated reporting' },
  { name: 'Healthcare', href: '/industries/healthcare-accounting-services/', icon: 'heart-pulse', desc: 'Practice accounting + EBP audits' },
  { name: 'High Net Worth', href: '/industries/high-net-worth-accounting-cpa/', icon: 'award', desc: 'Integrated tax + estate planning' },
  { name: 'Law Firms', href: '/industries/law-firm-accounting-services/', icon: 'gavel', desc: 'IOLTA + partner allocations' },
  { name: 'Marketing Agencies', href: '/industries/marketing-agency-accounting-services/', icon: 'sparkles', desc: 'Project-based accounting + S-Corps' },
  { name: 'Real Estate', href: '/industries/real-estate-cpa-services/', icon: 'home', desc: '1031s, cost seg, depreciation' },
  { name: 'Sports & Athletes', href: '/industries/sports-accounting-services/', icon: 'trophy', desc: 'Image rights + multi-state tax' },
  { name: 'Crypto', href: '/industries/crypto-cpa-services/', icon: 'coins', desc: 'Digital-asset reporting + tax' },
  { name: 'SaaS', href: '/industries/saas-accounting-services/', icon: 'cpu', desc: 'ARR, deferred revenue, R&D credit' },
  { name: 'Startups', href: '/industries/startup-cpa-services/', icon: 'rocket', desc: 'Runway, fundraise prep, modeling' },
] as const;

export const companyMenu = [
  { name: 'About Us', href: '/about-us/' },
  { name: 'Insights', href: '/blog/' },
  { name: 'In the Media', href: '/in-the-media/' },
  { name: 'Contact', href: '/contact/' },
  { name: 'Privacy Policy', href: '/privacy-policy/' },
] as const;
