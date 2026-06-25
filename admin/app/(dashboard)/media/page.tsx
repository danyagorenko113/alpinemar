import { listImages } from '@/lib/actions/media'
import { MediaLibrary } from '@/components/media/media-library'
import { PageHeader } from '@/components/shared/page-header'

export const dynamic = 'force-dynamic'

export default async function MediaPage() {
  const items = await listImages('images')
  return (
    <div>
      <PageHeader
        title="Media"
        description={`${items.length} images in public/images/`}
      />
      <MediaLibrary initial={items} />
    </div>
  )
}
