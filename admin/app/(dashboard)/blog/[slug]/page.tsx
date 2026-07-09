export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getBlogPost, listAllTags, listAllCategories } from '@/lib/actions/blog'
import { listAuthorNames } from '@/lib/actions/authors'
import { BlogForm } from '@/components/forms/blog-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function EditBlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const [post, tags, categories, authorNames] = await Promise.all([
    getBlogPost(slug),
    listAllTags(),
    listAllCategories(),
    listAuthorNames(),
  ])
  if (!post) notFound()
  return (
    <div>
      <PageHeader
        title={post.title}
        description={`Editing src/content/insights/${slug}.md`}
        backHref="/blog"
        backLabel="Back to blog"
      />
      <BlogForm initial={post} tagSuggestions={tags} categorySuggestions={categories} authorOptions={authorNames} />
    </div>
  )
}
