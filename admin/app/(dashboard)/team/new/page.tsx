export const dynamic = 'force-dynamic'

import { TeamForm } from '@/components/forms/team-form'
import { PageHeader } from '@/components/shared/page-header'

export default function NewTeamMemberPage() {
  return (
    <div>
      <PageHeader title="New team member" backHref="/team" backLabel="Back to team" />
      <TeamForm />
    </div>
  )
}