export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getAuthor } from '@/lib/actions/authors'
import { AuthorForm } from '@/components/forms/author-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function EditAuthorPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const author = await getAuthor(slug)
  if (!author) notFound()
  return (
    <div>
      <PageHeader
        title={author.name}
        description={`Editing src/content/authors/${slug}.md`}
        backHref="/authors"
        backLabel="Back to authors"
      />
      <AuthorForm initial={author} />
    </div>
  )
}
