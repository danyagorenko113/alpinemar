export const dynamic = 'force-dynamic'

import { getSitemap } from '@/lib/actions/sitemap'
import { SitemapForm } from '@/components/forms/sitemap-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function SitemapPageEditor() {
  const initial = await getSitemap()
  return (
    <div>
      <PageHeader title="HTML Sitemap" description="Hero copy and manual link sections for /sitemap/." />
      <SitemapForm initial={initial} />
    </div>
  )
}
