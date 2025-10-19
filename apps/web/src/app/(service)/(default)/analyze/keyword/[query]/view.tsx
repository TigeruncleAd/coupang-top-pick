'use client'

import dynamic from 'next/dynamic'
const KeywordAnalysisResultView = dynamic(() => import('./KeywordAnalysisResultView'), { ssr: false })

export default function KeywordAnalysisView({ extensionId, query }: { extensionId: string; query: string }) {
  return <KeywordAnalysisResultView keyword={query} extensionId={extensionId} />
}
