export const dynamic = 'force-dynamic'

import { ITTeamForm } from '@/components/forms/it-team-form'
import { PageHeader } from '@/components/shared/page-header'

export default function NewITTeamMemberPage() {
  return (
    <div>
      <PageHeader title="New IT team member" backHref="/it/team" backLabel="Back to IT team" />
      <ITTeamForm />
    </div>
  )
}
