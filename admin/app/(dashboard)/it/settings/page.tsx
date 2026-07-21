export const dynamic = 'force-dynamic'

import { getSettings } from '@/lib/actions/it/settings'
import { ITSettingsForm } from '@/components/forms/it-settings-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function ITSettingsPage() {
  const initial = await getSettings()
  return (
    <div>
      <PageHeader
        title="IT Settings"
        description="IT-site config, contact info, socials, and top navigation."
      />
      <ITSettingsForm initial={initial} />
    </div>
  )
}
