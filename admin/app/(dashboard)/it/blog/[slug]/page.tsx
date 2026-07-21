export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getBlogPost, listAllTags, listAllCategories, saveBlogPost, deleteBlogPost } from '@/lib/actions/it/blog'
import { BlogForm } from '@/components/forms/blog-form'
import { PageHeader } from '@/components/shared/page-header'
import { IT_SITE_URL } from '@/lib/it-site'

export default async function EditITBlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const [post, tags, categories] = await Promise.all([
    getBlogPost(slug),
    listAllTags(),
    listAllCategories(),
  ])
  if (!post) notFound()
  return (
    <div>
      <PageHeader
        title={post.title}
        description={`Editing it-site/src/content/insights/${slug}.md`}
        backHref="/it/blog"
        backLabel="Back to IT blog"
      />
      <BlogForm
        initial={post}
        tagSuggestions={tags}
        categorySuggestions={categories}
        authorOptions={[]}
        basePath="/it/blog"
        siteUrl={IT_SITE_URL}
        saveAction={saveBlogPost}
        deleteAction={deleteBlogPost}
        uploadRoot="it-site/public"
        showFeatured
        showCanonical={false}
      />
    </div>
  )
}
