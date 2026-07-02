export const dynamic = 'force-dynamic'

import { getSettings } from '@/lib/actions/settings'
import { SettingsForm } from '@/components/forms/settings-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function SettingsPage() {
  const initial = await getSettings()
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Site-wide config, contact info, and top navigation."
      />
      <SettingsForm initial={initial} />
    </div>
  )
}
