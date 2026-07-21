export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getTeamMember } from '@/lib/actions/it/team'
import { ITTeamForm } from '@/components/forms/it-team-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function EditITTeamMemberPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const member = await getTeamMember(slug)
  if (!member) notFound()
  return (
    <div>
      <PageHeader
        title={member.name}
        description={`Editing it-site/src/content/team/${slug}.md`}
        backHref="/it/team"
        backLabel="Back to IT team"
      />
      <ITTeamForm initial={member} />
    </div>
  )
}
