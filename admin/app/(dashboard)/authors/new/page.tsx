export const dynamic = 'force-dynamic'

import { AuthorForm } from '@/components/forms/author-form'
import { PageHeader } from '@/components/shared/page-header'

export default function NewAuthorPage() {
  return (
    <div>
      <PageHeader title="New author" backHref="/authors" backLabel="Back to authors" />
      <AuthorForm />
    </div>
  )
}
