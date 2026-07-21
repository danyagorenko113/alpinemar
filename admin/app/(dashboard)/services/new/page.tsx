export const dynamic = 'force-dynamic'

import { listIndustries } from '@/lib/actions/industries'
import { listReviews } from '@/lib/actions/reviews'
import { listServiceGroups } from '@/lib/actions/services'
import { ServicesForm } from '@/components/forms/services-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function NewServicePage() {
  const [industries, reviews, groups] = await Promise.all([listIndustries(), listReviews(), listServiceGroups()])
  return (
    <div>
      <PageHeader title="New service" backHref="/services" backLabel="Back to services" />
      <ServicesForm industrySlugs={industries.map((i) => i.slug)} reviewNames={reviews.map((r) => r.name)} groupOptions={groups} />
    </div>
  )
}