export const dynamic = 'force-dynamic'

import { getPages } from '@/lib/actions/it/homepage'
import { ITHomepageForm } from '@/components/forms/it-homepage-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function ITHomepagePage() {
  const initial = await getPages()
  return (
    <div>
      <PageHeader
        title="IT Pages"
        description="Homepage cards, About values, Services blurbs, business hours & HubSpot."
      />
      <ITHomepageForm initial={initial} />
    </div>
  )
}
