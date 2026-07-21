export const dynamic = 'force-dynamic'

import { getPress } from '@/lib/actions/press'
import { PressForm } from '@/components/forms/press-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function PressPage() {
  const initial = await getPress()
  return (
    <div>
      <PageHeader title="In the Media" description="Press mentions and page copy for /in-the-media/." />
      <PressForm initial={initial} />
    </div>
  )
}
