# Alpine Mar — Page Migration Tracker

Живой чек-лист переноса всех страниц с alpinemar.com (WordPress) на Astro.
**Цель: контент 1:1, ничего не потерять для SEO.** Слаги сохраняем; при изменении структуры — 301-редирект.

Статусы: `todo` · `in-progress` · `done` · `drop` (не мигрируем)

Источник инвентаря: sitemap (`https://alpinemar.com/sitemap_index.xml`), снято 2026-06-13.

---

## Core / Utility (8)

| Old URL | New route | Status |
|---|---|---|
| `/` | `/` | **done** |
| `/about-us/` | `/about-us/` | **done** |
| `/contact/` | `/contact/` | **done** |
| `/services/` | `/services/` | **done** |
| `/industries/` | `/industries/` | **done** |
| `/blog/` | `/blog/` | **done** |
| `/in-the-media/` | `/in-the-media/` | **done** |
| `/privacy-policy/` | `/privacy-policy/` | **done** |

## Services (34) — **DONE** (all detail pages incl. 3 audit children, 4 category hubs, 3 ES pages — migrated via WP REST API → `services` collection + `/services/[...slug]` template)

| Old URL | New route | Status |
|---|---|---|
| `/services/tax-planning-services/` | same | todo |
| `/services/small-business-tax-services/` | same | todo |
| `/services/corporate-tax-services/` | same | todo |
| `/services/individual-tax-services/` | same | todo |
| `/services/partnership-tax-services/` | same | todo |
| `/services/international-tax-services/` | same | todo |
| `/services/non-profit-tax-services/` | same | todo |
| `/services/multistate-tax-services/` | same | todo |
| `/services/estate-trust-tax-planning/` | same | todo |
| `/services/private-client-services/` | same | todo |
| `/services/tax-advisory-and-compliance/` | same | todo |
| `/services/outsourced-bookkeeping-services/` | same | todo |
| `/services/outsourced-accounting-services/` | same | todo |
| `/services/financial-statement-preparation-services/` | same | todo |
| `/services/accounting-software-implementation/` | same | todo |
| `/services/trust-accounting-cpa/` | same | todo |
| `/services/fractional-cfo-services/` | same | todo |
| `/services/financial-modeling-services/` | same | todo |
| `/services/transaction-advisory-services/` | same | todo |
| `/services/business-structure-consulting/` | same | todo |
| `/services/s-corp-cpa-services/` | same | todo |
| `/services/payroll-compliance-services/` | same | todo |
| `/services/boi-reporting-services/` | same | todo |
| `/services/audit-attestation-services/` (parent) | same | todo |
| `/services/audit-attestation-services/financial-statement-audits/` | same | todo |
| `/services/audit-attestation-services/employee-benefit-plan-audits/` | same | todo |
| `/services/audit-attestation-services/reviews-compilations/` | same | todo |
| `/services/business-accounting/` (category hub) | same | todo |
| `/services/business-tax/` (category hub) | same | todo |
| `/services/financial-advisory/` (category hub) | same | todo |
| `/services/financial-compliance/` (category hub) | same | todo |

### Spanish service pages (3) — **DONE** (migrated as-is, slugs preserved)

| Old URL | New route | Status |
|---|---|---|
| `/services/creacion-de-empresas/` | same | todo |
| `/services/servicios-contables/` | same | todo |
| `/services/servicios-tributarios-en-florida/` | same | todo |

## Industries (11 + hub) — **DONE** (migrated via WP REST API → `industries` collection + `/industries/[slug]` template)

| Old URL | New route | Status |
|---|---|---|
| `/industries/construction-cpa-services/` | same | todo |
| `/industries/family-office-accounting-services/` | same | todo |
| `/industries/healthcare-accounting-services/` | same | todo |
| `/industries/high-net-worth-accounting-cpa/` | same | todo |
| `/industries/law-firm-accounting-services/` | same | todo |
| `/industries/marketing-agency-accounting-services/` | same | todo |
| `/industries/real-estate-cpa-services/` | same | todo |
| `/industries/sports-accounting-services/` | same | todo |
| `/industries/crypto-cpa-services/` | same | todo |
| `/industries/saas-accounting-services/` | same | todo |
| `/industries/startup-cpa-services/` | same | todo |

## Blog / Insights (88 posts → collection `insights`) — **DONE**

Все 88 мигрированы через WP REST API в `src/content/insights/*.md` + обложки в
`public/images/blog/`. Рендер: `/blog/` (листинг) + `/blog/[slug]/` (шаблон поста).
Слаги сохранены `/blog/<slug>/`. Скрипт: `scripts/migrate-blog.mjs`.

s-corp-vs-llc-business-structure · erp-vs-accounting-software · benefits-of-fractional-cfo · best-tax-strategies-for-small-business-owners · quality-of-earnings-report-explained · short-term-rental-tax-loophole-explained · construction-job-costing-guide · what-is-fractional-cfo · florida-llc-tax-benefits · qualified-small-business-stock-qsbs · florida-self-employment-tax-guide · s-corp-vs-c-corp-tax-advantages · florida-capital-gains-tax-overview · reasonable-salary-s-corp · outsourcing-accounting-services-pros-cons · what-is-accounting-system · importance-of-financial-statements · s-corp-right-for-you · revenue-recognition-principle · business-structure-for-construction-company · capital-gains-on-investment-property · payroll-services-quickbooks-integration · hurricane-damage-tax-deductible · safe-harbor-for-landlords · husband-wife-business-structure · offset-capital-gains-with-business-losses · taxes-for-flipping-houses · tax-planning-for-real-estate-investors · best-business-structure-for-ecommerce · family-office-tax-structure · cost-segregation-real-estate · best-business-structure-for-tech-startup · best-tax-deductions-for-high-earners · cfo-vs-vp-finance · best-business-structure-for-asset-protection · business-structure-for-real-estate-investors · startup-investment-tax-deduction · documents-required-for-business-sale · bookings-vs-arr-vs-revenue · stock-options-tax-guide · iso-vs-nso-taxes · outsourced-accounting-service-cost · business-acquisition-analysis · top-accounting-firms-florida · jock-tax-explained · tax-implications-of-selling-business · selling-business-tax-strategies · tax-free-reorganization · consolidated-tax-return · safe-notes-tax-treatment · tax-implications-mergers-acquisitions · budget-vs-actual · gaap-audit-explained · audit-vs-review · find-cryptocurrency-tax-accountant · hifo-vs-fifo-vs-lifo · unfiled-cryptocurrency-tax-consequences · crypto-friendly-states · crypto-tax-form-1099 · crypto-mining-tax-explained · defi-taxes · ethereum-tax-guide · crypto-tax-loss-harvesting · cryptocurrency-taxes-guide · dao-taxes · crypto-staking-taxes · controller-vs-cfo · crypto-gift-tax-considerations · 721-exchange-real-estate · how-to-gift-money-tax-free · how-to-increase-company-valuation · passive-activity-loss-rule · beneficial-ownership-reporting-guide · generation-skipping-tax · rippling-vs-gusto-review · most-important-financial-statements · m-a-integration-finance-checklist · amortizing-startup-cost · startup-pre-seed-valuations · inheritance-tax-planning · research-development-tax-credits · what-happens-to-401k-after-you-die · llc-distribution-taxes · cash-burn-rate-gross-vs-net-burn · tech-startup-budget-example · estate-tax-planning-guide · startup-tax-guide · new-york-city-pied-a-terre

## Team (24) — **DONE differently** (bios/photos not exposed in WP REST; all 24 listed verbatim on /about-us/; old `/blog/team-member/*` URLs 301→/about-us/ via vercel.json)

Old slug: `/blog/team-member/<slug>/`. Решить новый роут (предложение: `/about-us/` секция или `/team/<slug>/` + 301 со старого). Статусы — todo.

pablo-martell-cpa · kevin-decicco-cpa · cristina-decicco-cpa · brian-fine-cpa · ian-schlakman · emily-bradey · jennifer-lopez · derby-norvilus · kirill-reznik-cpa · matthew-senger · vanessa-holub · reymar-gulan · brian-hancock-cpa · dana-muntean-cpa · kathleen-lax · diane-spinelli · devin-christie · rommel-linatoc · jessica-lawrence · marileisi-hernandez · luis-alberto-marquez · javier-villa-rivas · sean-maloney · ashley-quintal-schwab

## Legacy / Junk — подтвердить выброс (`drop`)

| Old URL | Решение |
|---|---|
| `/in-the-media-backup/` | drop (бэкап) |
| `/services-trial2/` | drop (черновик) |
| `/services-trial3/` | drop (черновик) |
| `/services-trial4/` | drop (черновик) |
| `/blog-old/` | drop (старый блог) |
| `/html-sitemap/` | drop (генерится автоматически) |
| `/services/boi-reporting-updated/` | drop? (дубль `boi-reporting-services`) — подтвердить |

---

### Открытые вопросы по миграции
- Способ забора контента: WP REST API / экспорт XML / ручной скрейп.
- 301-редиректы: team-member `/blog/team-member/...` → новый роут; любые изменённые слаги.
- Spanish-страницы: как есть или полноценный i18n.
- Подтвердить список `drop`.
