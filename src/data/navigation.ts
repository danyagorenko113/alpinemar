// Full site navigation (mirrors the firm's service taxonomy). Used by Nav + Footer.
// Covers all 31 English service pages — 3 Spanish slugs (creacion-de-empresas,
// servicios-contables, servicios-tributarios-en-florida) are intentionally
// excluded from EN navigation.

export const serviceMenu = [
  {
    label: 'Tax',
    items: [
      { name: 'Tax Planning', href: '/services/tax-planning-services/' },
      { name: 'Tax Strategy', href: '/services/tax-advisory-and-compliance/' },
      { name: 'Individual Tax', href: '/services/individual-tax-services/' },
      { name: 'Partnership Tax', href: '/services/partnership-tax-services/' },
      { name: 'Corporate Tax', href: '/services/corporate-tax-services/' },
      { name: 'S Corps', href: '/services/s-corp-cpa-services/' },
      { name: 'Estate & Trust Tax Planning', href: '/services/estate-trust-tax-planning/' },
      { name: 'Private Client Services', href: '/services/private-client-services/' },
      { name: 'Small Business Tax', href: '/services/small-business-tax-services/' },
      { name: 'International Tax', href: '/services/international-tax-services/' },
      { name: 'Non-Profit Tax', href: '/services/non-profit-tax-services/' },
      { name: 'Multistate Tax', href: '/services/multistate-tax-services/' },
      { name: 'Business Tax', href: '/services/business-tax/' },
    ],
  },
  {
    label: 'Accounting',
    items: [
      { name: 'Outsourced Accounting', href: '/services/outsourced-accounting-services/' },
      { name: 'Outsourced Bookkeeping', href: '/services/outsourced-bookkeeping-services/' },
      { name: 'Financial Statement Preparation', href: '/services/financial-statement-preparation-services/' },
      { name: 'Accounting Software Implementation', href: '/services/accounting-software-implementation/' },
      { name: 'Business Accounting', href: '/services/business-accounting/' },
      { name: 'Trust Accounting', href: '/services/trust-accounting-cpa/' },
    ],
  },
  {
    label: 'Advisory',
    items: [
      { name: 'Fractional CFO', href: '/services/fractional-cfo-services/' },
      { name: 'Transaction Advisory', href: '/services/transaction-advisory-services/' },
      { name: 'Financial Modeling', href: '/services/financial-modeling-services/' },
      { name: 'Financial Advisory', href: '/services/financial-advisory/' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { name: 'Entity Structuring', href: '/services/business-structure-consulting/' },
      { name: 'BOI Reporting', href: '/services/boi-reporting-services/' },
      { name: 'Payroll Compliance', href: '/services/payroll-compliance-services/' },
      { name: 'Financial Compliance', href: '/services/financial-compliance/' },
    ],
  },
  {
    label: 'Audit & Attestation',
    items: [
      { name: 'Audit & Attestation Services', href: '/services/audit-attestation-services/' },
      { name: 'Financial Statement Audits', href: '/services/audit-attestation-services/financial-statement-audits/' },
      { name: 'Reviews & Compilations', href: '/services/audit-attestation-services/reviews-compilations/' },
      { name: 'Employee Benefit Plan Audits', href: '/services/audit-attestation-services/employee-benefit-plan-audits/' },
    ],
  },
] as const;

export const industryMenu = [
  { name: 'Construction', href: '/industries/construction-cpa-services/' },
  { name: 'Family Office', href: '/industries/family-office-accounting-services/' },
  { name: 'Healthcare', href: '/industries/healthcare-accounting-services/' },
  { name: 'High Net Worth', href: '/industries/high-net-worth-accounting-cpa/' },
  { name: 'Law Firms', href: '/industries/law-firm-accounting-services/' },
  { name: 'Marketing Agencies', href: '/industries/marketing-agency-accounting-services/' },
  { name: 'Real Estate', href: '/industries/real-estate-cpa-services/' },
  { name: 'Sports & Athletes', href: '/industries/sports-accounting-services/' },
  { name: 'Crypto', href: '/industries/crypto-cpa-services/' },
  { name: 'SaaS', href: '/industries/saas-accounting-services/' },
  { name: 'Startups', href: '/industries/startup-cpa-services/' },
] as const;

export const companyMenu = [
  { name: 'About Us', href: '/about-us/' },
  { name: 'Insights', href: '/blog/' },
  { name: 'In the Media', href: '/in-the-media/' },
  { name: 'Contact', href: '/contact/' },
  { name: 'Privacy Policy', href: '/privacy-policy/' },
] as const;
