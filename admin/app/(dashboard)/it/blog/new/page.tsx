export const dynamic = 'force-dynamic'

import { listAllTags, listAllCategories, saveBlogPost, deleteBlogPost } from '@/lib/actions/it/blog'
import { listAuthorNames } from '@/lib/actions/it/authors'
import { BlogForm } from '@/components/forms/blog-form'
import { PageHeader } from '@/components/shared/page-header'
import { IT_SITE_URL } from '@/lib/it-site'

export default async function NewITBlogPostPage() {
  const [tags, categories, authorNames] = await Promise.all([listAllTags(), listAllCategories(), listAuthorNames()])
  return (
    <div>
      <PageHeader title="New IT blog post" backHref="/it/blog" backLabel="Back to IT blog" />
      <BlogForm
        tagSuggestions={tags}
        categorySuggestions={categories}
        authorOptions={authorNames}
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
