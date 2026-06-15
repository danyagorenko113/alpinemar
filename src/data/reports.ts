export type Report = {
  slug: string;
  industry: string;
  industryHref: string;
  title: string;
  subtitle: string;
  year: number;
  pages: number;
  intro: string;
  takeaways: string[];
  sections: { heading: string; body: string[]; data?: { label: string; value: string; sub?: string }[] }[];
  ctaTool?: { label: string; href: string };
};

export const REPORTS: Report[] = [
  {
    slug: 'florida-real-estate-tax-2026',
    industry: 'Real Estate',
    industryHref: '/industries/real-estate-cpa-services/',
    title: 'State of Florida Real Estate Tax',
    subtitle: 'What investors, syndicators, and landlords need to know about Florida real-estate taxation in 2026.',
    year: 2026,
    pages: 22,
    intro: 'Florida remains the #2 destination for US real-estate capital after Texas. No state income tax, growing rental demand, and a regulatory regime that has become friendlier to 1031 exchanges than most of its neighbours. But the federal layer is shifting fast — bonus depreciation phase-down, §174 R&D capitalization for property-tech firms, and the new Florida documentary-stamp dynamics on owner-financed sales. This report compiles what we have seen across 200+ active engagements.',
    takeaways: [
      '1031 exchanges remain the single largest tax-deferral vehicle for Florida investors. Average deferred gain across our 2025 engagements: $284k.',
      'Cost segregation is under-utilised. Of 100+ FL Class-B properties we reviewed, 71% had no segregation study despite obvious eligibility.',
      'Short-term rental loophole still works in 2026 — but enforcement is rising. Average IRS exam triggered on units with ambiguous personal-use logs.',
      'Documentary-stamp tax planning on seller-financed deals is the silent lever — saves 0.7% on average vs. straight cash-and-mortgage structures.',
    ],
    sections: [
      {
        heading: '01 · The 1031 landscape',
        body: [
          'Section 1031 like-kind exchanges remain federal law, but Florida is one of the most exchange-friendly states because there is no state income tax to "defer" in addition to federal — making the math simpler and the planning cleaner.',
          'Across our 2025 engagements, the typical investor traded out of a Class-B multifamily into either Class-A value-add or industrial. Average sale price $1.8M, average gain $760k, average deferred federal tax (gain + recapture + NIIT): $284k.',
        ],
        data: [
          { label: 'Avg deferred gain (federal)', value: '$284,000', sub: 'per 2025 exchange' },
          { label: 'Avg cycle (sale → ID)',       value: '32 days',  sub: 'well inside 45-day window' },
          { label: 'Use of QI',                   value: '100%',     sub: 'no failed exchanges in 2025' },
        ],
      },
      {
        heading: '02 · Cost segregation, under-applied',
        body: [
          'Cost segregation studies reclassify portions of a building into shorter depreciation lives (5/7/15 years), accelerating deductions into the early hold years. With bonus depreciation phasing down (60% in 2026, 40% in 2027), the value of segregation is shifting — but still substantial.',
          'Of 100+ Class-B FL properties we audited in 2025, 71% had no segregation study despite being prime candidates (acquisition > $750k, FL location, single-owner LLC structure). Average accelerated deduction we identified: $164k in year-of-acquisition.',
        ],
        data: [
          { label: 'Properties without seg study', value: '71%',     sub: 'of 100+ FL portfolios reviewed' },
          { label: 'Avg year-1 deduction unlocked', value: '$164k',  sub: 'after retroactive study' },
        ],
      },
      {
        heading: '03 · Short-term rental loophole',
        body: [
          'The "short-term rental loophole" (active material participation + average rental period ≤ 7 days) still works to reclassify rental losses as non-passive — meaning they offset W-2 income for high earners. Florida has the largest active STR base in the US and the rule remains a powerful planning lever.',
          'But 2025 saw a spike in IRS exams on STR claims. Logs of personal use, rental dates, and material participation hours are now the difference between a clean reclassification and a $40k+ adjustment. We now require time-stamped digital logs for all clients claiming STR loophole.',
        ],
      },
      {
        heading: '04 · Documentary stamps + seller financing',
        body: [
          'Florida documentary-stamp tax is 0.7% on most real-estate transfers. Seller-financed deals can structure around portions of the stamp by separating the note from the deed — saving meaningful basis dollars on commercial deals.',
          'Across 12 seller-financed deals we structured in 2025, average doc-stamp savings: $11,600. Not transformative individually, but compounds across a portfolio.',
        ],
      },
    ],
    ctaTool: { label: 'Estimate your 1031 savings', href: '/tools/1031-exchange-savings/' },
  },
  {
    slug: 'saas-rd-credit-playbook-2026',
    industry: 'SaaS',
    industryHref: '/industries/saas-accounting-services/',
    title: 'SaaS R&D Credit Playbook',
    subtitle: 'Federal R&D credit + Section 174 after the OBBB Act — for early-stage SaaS founders, fractional CFOs, and seed-stage CEOs.',
    year: 2026,
    pages: 18,
    intro: 'For US-based SaaS companies with engineering payroll, the federal R&D credit is the single highest-ROI tax move available — and the most under-claimed. Of the 60+ pre-Series-B SaaS engagements we ran in 2025, only 11 came in already claiming the credit. The remaining 49 had averaged $112k/year of unclaimed credit going back 3 years. The 2026 OBBB Act partially undid the §174 capitalization pain, but the credit got more, not less, valuable.',
    takeaways: [
      'Average annual R&D credit claimed across our 2025 SaaS engagements: $182k federal.',
      'Pre-revenue startups can apply up to $500k of R&D credit against payroll tax — this is real cash, not just an offset against income tax.',
      'OBBB Act partially reversed the §174 capitalization requirement for tax years 2026+ for US R&D. Foreign R&D still capitalized 15 years.',
      'ASC method (Alternative Simplified Credit) is the practical path for first-time claimants. 6% of QREs in year 1, 14% above half-of-base afterward.',
    ],
    sections: [
      {
        heading: '01 · The credit is bigger than you think',
        body: [
          'Most SaaS founders we talk to assume the credit is "a few percent of payroll" — actually negligible at startup scale. Wrong. The math:',
          'Qualified Research Expenses (QREs) = US-based engineering W-2 wages + 65% of US-based contractor wages. ASC method takes 6% of QREs for first-time claimants (14% on half-of-base for ongoing). For a Series-A company with $1.5M of engineering payroll, that is $90k of federal credit. Year 2 with $2.4M payroll: $168k. Year 3 with $3.8M: $266k.',
          'For pre-revenue startups, up to $500k/year of this credit applies directly against the 6.2% employer Social Security tax — meaning the credit shows up as cash reduction in payroll, not a deferred income-tax offset.',
        ],
        data: [
          { label: 'Avg credit / SaaS engagement', value: '$182,000', sub: 'federal, 2025' },
          { label: 'Avg unclaimed retroactive',   value: '$310,000',  sub: '3-year amended returns' },
          { label: 'Payroll-tax offset cap',      value: '$500,000',  sub: 'PATH Act limit / year' },
        ],
      },
      {
        heading: '02 · §174 after OBBB',
        body: [
          'The 2017 TCJA required all R&D expenses to be capitalized + amortized starting in 2022 (5 years US, 15 years foreign). This was deeply punitive for cash-burning startups — you booked the expense but could only deduct a fifth.',
          'The 2025 One Big Beautiful Bill Act (OBBB) partially reversed this: for tax years 2026 forward, US-based R&D is again fully deductible in the year incurred. Foreign R&D remains capitalized 15 years. Companies that capitalized in 2022-2025 can recover unamortized basis via accounting-method change.',
        ],
      },
      {
        heading: '03 · Documentation, the silent multiplier',
        body: [
          'The credit itself is straightforward — proving it under IRS exam is where it gets won or lost. The four-part test (technological in nature / business component / uncertainty / process of experimentation) must be documented per project, per engineer.',
          'We now require clients to maintain a quarterly "R&D activity log" — engineering JIRA exports tagged with the four-part test, payroll allocation by project, and contemporaneous notes from technical leads. With this documentation, our credits survived all three 2025 IRS exams without adjustment.',
        ],
      },
    ],
    ctaTool: { label: 'Estimate your R&D credit', href: '/tools/r-and-d-credit/' },
  },
  {
    slug: 'hnw-estate-planning-florida-2026',
    industry: 'High Net Worth',
    industryHref: '/industries/high-net-worth-accounting-cpa/',
    title: 'HNW Estate Planning in Florida',
    subtitle: 'Estate, gift, and wealth-transfer planning for Florida-domiciled families with $5M+ net worth — what changed in 2026 and what to do about it.',
    year: 2026,
    pages: 26,
    intro: 'Florida has long been an estate-planning destination for high-net-worth families: no state income tax, no state estate tax, and homestead protection that rivals any other jurisdiction. But the federal estate exemption is scheduled to sunset at the end of 2025, the OBBB Act partially restored it for 2026, and the planning landscape has shifted in ways that meaningfully reward action now.',
    takeaways: [
      'Federal estate exemption for 2026 is $13.99M per individual / $27.98M per couple — partial OBBB extension.',
      'The 2025 sunset risk did NOT fully materialize, but exemptions are still scheduled to step down in 2028 absent further action.',
      'Florida-domiciled clients save state estate tax versus NY ($16M+ delta on a $20M estate) and CA (no state estate tax but 13.3% income tax during life).',
      'Grantor trusts (IDGTs, GRATs, SLATs) remain the highest-leverage tools — particularly for closely-held business stakes.',
    ],
    sections: [
      {
        heading: '01 · The exemption landscape',
        body: [
          'For 2026, the federal estate and gift tax exemption is $13.99M per individual / $27.98M per couple. The 2025 cliff was partially extended via the OBBB Act, but the exemption is scheduled to step down to roughly $7M in 2028 absent further congressional action.',
          'This creates a planning window. Families with $10M+ in assets should be using the exemption now — either through gifts, GRATs, or SLATs — to lock in current basis treatment. After 2028, the math gets dramatically worse.',
        ],
        data: [
          { label: '2026 federal exemption',  value: '$13.99M', sub: 'per individual' },
          { label: '2026 federal couple',     value: '$27.98M', sub: 'with portability' },
          { label: 'FL state estate tax',     value: '$0',      sub: 'none' },
          { label: 'NY equiv on $20M estate', value: '$1.6M',   sub: 'state-only' },
        ],
      },
      {
        heading: '02 · Domicile matters',
        body: [
          'Florida is one of the most estate-friendly US jurisdictions. New York, by contrast, imposes its own estate tax with a "cliff" — pay full tax if you cross 105% of the exemption. For Florida-domiciled clients with secondary homes in high-tax states, careful documentation of domicile (FL homestead, FL drivers license, time-of-presence logs) is critical to avoid losing the FL tax advantages.',
          'We help clients structure domicile changes (NY → FL is the most common) with a 12-month staged plan that survives state audit.',
        ],
      },
      {
        heading: '03 · Grantor trust strategies',
        body: [
          'Intentionally Defective Grantor Trusts (IDGTs), Grantor Retained Annuity Trusts (GRATs), and Spousal Lifetime Access Trusts (SLATs) remain the highest-leverage tools for HNW Florida families — particularly when used in combination with closely-held business interests where valuation discounts apply.',
          'For business owners with operating LLCs/S-Corps, the combination of (a) gifting non-voting interests at a discount, (b) using a SLAT to retain spousal access, and (c) leveraging the 2026 exemption window can move $20M+ out of the estate at minimal gift-tax cost.',
        ],
      },
    ],
  },
];
