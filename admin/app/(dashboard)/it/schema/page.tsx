export const dynamic = 'force-dynamic'

import { getSchemaOverrides, saveSchemaOverrides } from '@/lib/actions/it/schema'
import { SchemaForm } from '@/components/forms/schema-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function ITSchemaPage() {
  const initial = await getSchemaOverrides()
  return (
    <div>
      <PageHeader
        title="IT Schema (JSON-LD)"
        description="Structured data for it.alpinemar.com — site-wide and per-page, injected at end of <body>."
      />
      <SchemaForm initial={initial} saveAction={saveSchemaOverrides} filePath="it-site/src/data/schema-overrides.json" />
    </div>
  )
}
