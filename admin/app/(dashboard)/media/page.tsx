import { listImages, listImageFolders } from '@/lib/actions/media'
import { MediaLibrary } from '@/components/media/media-library'
import { PageHeader } from '@/components/shared/page-header'

export const dynamic = 'force-dynamic'

export default async function MediaPage() {
  const [items, folders] = await Promise.all([listImages('images'), listImageFolders()])
  return (
    <div>
      <PageHeader
        title="Media"
        description={`${items.length} images in public/images/`}
      />
      <MediaLibrary initial={items} initialFolders={folders} />
    </div>
  )
}
