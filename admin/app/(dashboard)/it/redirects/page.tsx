export const dynamic = 'force-dynamic'

import { getRedirects, saveRedirects } from '@/lib/actions/it/redirects'
import { RedirectsForm } from '@/components/forms/redirects-form'
import { PageHeader } from '@/components/shared/page-header'
import { StructuralNotice } from '@/components/structural-notice'

export default async function ITRedirectsPage() {
  const initial = await getRedirects()
  return (
    <div>
      <StructuralNotice page="redirects" />
      <PageHeader
        title="IT Redirects"
        description="301/302 URL redirects for it.alpinemar.com (applied by Vercel on deploy)."
      />
      <RedirectsForm initial={initial} saveAction={saveRedirects} filePath="it-site/vercel.json" />
    </div>
  )
}
