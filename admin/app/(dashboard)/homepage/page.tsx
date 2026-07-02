export const dynamic = 'force-dynamic'

import { getHomepage } from '@/lib/actions/homepage'
import { PageHeader } from '@/components/shared/page-header'
import { HomepageForm } from '@/components/forms/homepage-form'

export default async function HomepageEditorPage() {
  const initial = await getHomepage()
  return (
    <div>
      <PageHeader
        title="Homepage"
        description="Manage featured cards, logos, value props, and pinned posts. Edits src/data/taxonomy.ts."
      />
      <HomepageForm initial={initial} />
    </div>
  )
}
