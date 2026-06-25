export const dynamic = 'force-dynamic'

import { listIndustries } from '@/lib/actions/industries'
import { ServicesForm } from '@/components/forms/services-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function NewServicePage() {
  const industries = await listIndustries()
  return (
    <div>
      <PageHeader title="New service" backHref="/services" backLabel="Back to services" />
      <ServicesForm industrySlugs={industries.map((i) => i.slug)} />
    </div>
  )
}