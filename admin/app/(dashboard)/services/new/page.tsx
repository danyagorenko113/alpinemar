export const dynamic = 'force-dynamic'

import { listIndustries } from '@/lib/actions/industries'
import { listReviews } from '@/lib/actions/reviews'
import { ServicesForm } from '@/components/forms/services-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function NewServicePage() {
  const [industries, reviews] = await Promise.all([listIndustries(), listReviews()])
  return (
    <div>
      <PageHeader title="New service" backHref="/services" backLabel="Back to services" />
      <ServicesForm industrySlugs={industries.map((i) => i.slug)} reviewNames={reviews.map((r) => r.name)} />
    </div>
  )
}