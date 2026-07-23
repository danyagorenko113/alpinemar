export const dynamic = 'force-dynamic'

import { getServiceMenu } from '@/lib/actions/it/navigation'
import { listServices } from '@/lib/actions/it/services'
import { ITNavigationForm } from '@/components/forms/it-navigation-form'
import { PageHeader } from '@/components/shared/page-header'
import { StructuralNotice } from '@/components/structural-notice'

export default async function ITNavigationPage() {
  const [menu, services] = await Promise.all([getServiceMenu(), listServices()])
  return (
    <div>
      <StructuralNotice page="navigation" />
      <PageHeader
        title="IT Navigation"
        description="The IT Services mega-menu — primary tabs and their sub-services."
      />
      <ITNavigationForm initial={menu} serviceSlugs={services.map((s) => s.slug)} />
    </div>
  )
}
