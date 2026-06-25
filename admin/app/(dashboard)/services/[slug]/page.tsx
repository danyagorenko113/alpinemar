export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getService } from '@/lib/actions/services'
import { listIndustries } from '@/lib/actions/industries'
import { ServicesForm } from '@/components/forms/services-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function EditServicePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const [service, industries] = await Promise.all([getService(slug), listIndustries()])
  if (!service) notFound()
  return (
    <div>
      <PageHeader
        title={service.title}
        description={`Editing src/content/services/${slug}.md`}
        backHref="/services"
        backLabel="Back to services"
      />
      <ServicesForm initial={service} industrySlugs={industries.map((i) => i.slug)} />
    </div>
  )
}