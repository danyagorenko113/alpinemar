export const dynamic = 'force-dynamic'

import { listAllTags, listAllCategories } from '@/lib/actions/blog'
import { listAuthorNames } from '@/lib/actions/authors'
import { BlogForm } from '@/components/forms/blog-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function NewBlogPostPage() {
  const [tags, categories, authorNames] = await Promise.all([
    listAllTags(),
    listAllCategories(),
    listAuthorNames(),
  ])
  return (
    <div>
      <PageHeader title="New blog post" backHref="/blog" backLabel="Back to blog" />
      <BlogForm tagSuggestions={tags} categorySuggestions={categories} authorOptions={authorNames} />
    </div>
  )
}
