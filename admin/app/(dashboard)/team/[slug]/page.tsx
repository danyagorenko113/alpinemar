export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getTeamMember } from '@/lib/actions/team'
import { TeamForm } from '@/components/forms/team-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function EditTeamMemberPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const member = await getTeamMember(slug)
  if (!member) notFound()
  return (
    <div>
      <PageHeader
        title={member.name}
        description={`Editing src/content/team/${slug}.md`}
        backHref="/team"
        backLabel="Back to team"
      />
      <TeamForm initial={member} />
    </div>
  )
}