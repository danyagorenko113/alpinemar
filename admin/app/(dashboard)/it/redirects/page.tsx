export const dynamic = 'force-dynamic'

import { getRedirects, saveRedirects } from '@/lib/actions/it/redirects'
import { RedirectsForm } from '@/components/forms/redirects-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function ITRedirectsPage() {
  const initial = await getRedirects()
  return (
    <div>
      <PageHeader
        title="IT Redirects"
        description="301/302 URL redirects for it.alpinemar.com (applied by Vercel on deploy)."
      />
      <RedirectsForm initial={initial} saveAction={saveRedirects} filePath="it-site/vercel.json" />
    </div>
  )
}
