export const dynamic = 'force-dynamic'

import { ITServicesForm } from '@/components/forms/it-services-form'
import { PageHeader } from '@/components/shared/page-header'

export default function NewITServicePage() {
  return (
    <div>
      <PageHeader title="New IT service" backHref="/it/services" backLabel="Back to IT services" />
      <ITServicesForm />
    </div>
  )
}
