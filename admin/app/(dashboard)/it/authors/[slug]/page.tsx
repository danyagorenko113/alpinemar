export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getAuthor, saveAuthor, deleteAuthor } from '@/lib/actions/it/authors'
import { AuthorForm } from '@/components/forms/author-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function EditITAuthorPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const author = await getAuthor(slug)
  if (!author) notFound()
  return (
    <div>
      <PageHeader
        title={author.name}
        description={`Editing it-site/src/content/authors/${slug}.md`}
        backHref="/it/authors"
        backLabel="Back to IT authors"
      />
      <AuthorForm initial={author} basePath="/it/authors" saveAction={saveAuthor} deleteAction={deleteAuthor} uploadRoot="it-site/public" />
    </div>
  )
}
