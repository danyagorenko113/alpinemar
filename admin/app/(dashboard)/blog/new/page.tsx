export const dynamic = 'force-dynamic'

import { listAllTags } from '@/lib/actions/blog'
import { BlogForm } from '@/components/forms/blog-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function NewBlogPostPage() {
  const tags = await listAllTags()
  return (
    <div>
      <PageHeader title="New blog post" backHref="/blog" backLabel="Back to blog" />
      <BlogForm tagSuggestions={tags} />
    </div>
  )
}