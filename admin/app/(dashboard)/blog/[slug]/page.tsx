export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getBlogPost, listAllTags } from '@/lib/actions/blog'
import { BlogForm } from '@/components/forms/blog-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function EditBlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const [post, tags] = await Promise.all([getBlogPost(slug), listAllTags()])
  if (!post) notFound()
  return (
    <div>
      <PageHeader
        title={post.title}
        description={`Editing src/content/insights/${slug}.md`}
        backHref="/blog"
        backLabel="Back to blog"
      />
      <BlogForm initial={post} tagSuggestions={tags} />
    </div>
  )
}