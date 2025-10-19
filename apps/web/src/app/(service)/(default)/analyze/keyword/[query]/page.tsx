import { getExtensionId } from '@/serverActions/extension/extension.action'
import PageTitle from '@/src/app/(service)/(default)/(_components)/PageTitle'
import KeywordSearchForm from '@/src/app/(service)/(default)/analyze/keyword/(_components)/keywordSearchForm'
import KeywordAnalysisView from './view'
import { getServerUser } from '@/lib/utils/server/getServerUser'
export default async function KeywordPage({ params }: { params: Promise<{ query: string }> }) {
  const { query } = await params
  const decodedQuery = decodeURIComponent(query)
  const extensionId = await getExtensionId()
  if (!extensionId) {
    return <div>Extension is not installed. Please install the extension first.</div>
  }
  return (
    <div className="relative flex min-h-screen w-full max-w-screen-2xl flex-col">
      <PageTitle title="키워드 분석 결과" />
      <KeywordSearchForm initialKeyword={decodedQuery} />
      <KeywordAnalysisView extensionId={extensionId} query={decodedQuery} />
    </div>
  )
}
