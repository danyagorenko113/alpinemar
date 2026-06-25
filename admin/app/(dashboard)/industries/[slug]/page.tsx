export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getIndustry } from '@/lib/actions/industries'
import { listServices } from '@/lib/actions/services'
import { IndustriesForm } from '@/components/forms/industries-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function EditIndustryPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const [industry, services] = await Promise.all([getIndustry(slug), listServices()])
  if (!industry) notFound()
  return (
    <div>
      <PageHeader
        title={industry.title}
        description={`Editing src/content/industries/${slug}.md`}
        backHref="/industries"
        backLabel="Back to industries"
      />
      <IndustriesForm initial={industry} serviceSlugs={services.map((s) => s.slug)} />
    </div>
  )
}