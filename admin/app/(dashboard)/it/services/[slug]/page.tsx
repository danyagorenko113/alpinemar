export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getService } from '@/lib/actions/it/services'
import { ITServicesForm } from '@/components/forms/it-services-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function EditITServicePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const service = await getService(slug)
  if (!service) notFound()
  return (
    <div>
      <PageHeader
        title={service.title}
        description={`Editing it-site/src/content/services/${slug}.md`}
        backHref="/it/services"
        backLabel="Back to IT services"
      />
      <ITServicesForm initial={service} />
    </div>
  )
}
