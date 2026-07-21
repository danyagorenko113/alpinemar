export const dynamic = 'force-dynamic'

import { saveAuthor, deleteAuthor } from '@/lib/actions/it/authors'
import { AuthorForm } from '@/components/forms/author-form'
import { PageHeader } from '@/components/shared/page-header'

export default function NewITAuthorPage() {
  return (
    <div>
      <PageHeader title="New IT author" backHref="/it/authors" backLabel="Back to IT authors" />
      <AuthorForm basePath="/it/authors" saveAction={saveAuthor} deleteAction={deleteAuthor} uploadRoot="it-site/public" />
    </div>
  )
}
