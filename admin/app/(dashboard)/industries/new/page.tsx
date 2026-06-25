export const dynamic = 'force-dynamic'

import { listServices } from '@/lib/actions/services'
import { IndustriesForm } from '@/components/forms/industries-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function NewIndustryPage() {
  const services = await listServices()
  return (
    <div>
      <PageHeader title="New industry" backHref="/industries" backLabel="Back to industries" />
      <IndustriesForm serviceSlugs={services.map((s) => s.slug)} />
    </div>
  )
}