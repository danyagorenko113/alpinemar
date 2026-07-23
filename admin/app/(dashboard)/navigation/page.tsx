export const dynamic = 'force-dynamic'

import { getNavigation } from '@/lib/actions/navigation'
import { NavigationForm } from '@/components/forms/navigation-form'
import { PageHeader } from '@/components/shared/page-header'
import { StructuralNotice } from '@/components/structural-notice'

export default async function NavigationPage() {
  const initial = await getNavigation()
  return (
    <div>
      <StructuralNotice page="navigation" />
      <PageHeader
        title="Navigation"
        description="Services & Industries mega-menu dropdowns (also the service group taxonomy)."
      />
      <NavigationForm initial={initial} />
    </div>
  )
}
