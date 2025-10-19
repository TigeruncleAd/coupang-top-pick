import { Suspense } from 'react'
import RankingTraceDetailPage from './RankingTraceDetailPage'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RankingTraceDetailPage />
    </Suspense>
  )
}
