export const dynamic = 'force-dynamic'

import { ReviewForm } from '@/components/forms/review-form'
import { PageHeader } from '@/components/shared/page-header'

export default function NewReviewPage() {
  return (
    <div>
      <PageHeader title="New review" backHref="/reviews" backLabel="Back to reviews" />
      <ReviewForm />
    </div>
  )
}
