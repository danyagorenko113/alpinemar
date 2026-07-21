export const dynamic = 'force-dynamic'

import { getAbout } from '@/lib/actions/about'
import { AboutForm } from '@/components/forms/about-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function AboutPageEditor() {
  const initial = await getAbout()
  return (
    <div>
      <PageHeader title="About Page" description="Copy for /about-us/ (team roster is under Team)." />
      <AboutForm initial={initial} />
    </div>
  )
}
