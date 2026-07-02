export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getReview } from '@/lib/actions/reviews'
import { ReviewForm } from '@/components/forms/review-form'
import { PageHeader } from '@/components/shared/page-header'

export default async function EditReviewPage(props: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await props.params
  const id = Number.parseInt(idParam, 10)
  if (!Number.isInteger(id) || id < 0) notFound()
  const review = await getReview(id)
  if (!review) notFound()
  return (
    <div>
      <PageHeader
        title={review.name}
        description={`Editing review #${id} in src/data/googleReviews.ts`}
        backHref="/reviews"
        backLabel="Back to reviews"
      />
      <ReviewForm id={id} initial={review} />
    </div>
  )
}
