export const dynamic = 'force-dynamic'

import { getSchemaOverrides, saveSchemaOverrides } from '@/lib/actions/schema'
import { SchemaForm } from '@/components/forms/schema-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function SchemaPage() {
  const initial = await getSchemaOverrides()
  return (
    <div>
      <PageHeader
        title="Schema (JSON-LD)"
        description="Structured data for alpinemar.com — site-wide and per-page, injected at end of <body>."
      />
      <SchemaForm initial={initial} saveAction={saveSchemaOverrides} filePath="src/data/schema-overrides.json" />
    </div>
  )
}
