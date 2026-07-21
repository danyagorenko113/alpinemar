export const dynamic = 'force-dynamic'

import { getRedirects, saveRedirects } from '@/lib/actions/redirects'
import { RedirectsForm } from '@/components/forms/redirects-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function RedirectsPage() {
  const initial = await getRedirects()
  return (
    <div>
      <PageHeader
        title="Redirects"
        description="301/302 URL redirects for alpinemar.com (applied by Vercel on deploy)."
      />
      <RedirectsForm initial={initial} saveAction={saveRedirects} filePath="vercel.json" />
    </div>
  )
}
