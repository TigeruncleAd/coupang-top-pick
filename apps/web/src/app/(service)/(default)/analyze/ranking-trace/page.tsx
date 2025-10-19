import PageTitle from '../../(_components)/PageTitle'
import RankingTracePage from './RankingTracePage'
import { getExtensionId } from '@/serverActions/extension/extension.action'

export const dynamic = 'force-dynamic'

export default async function RankingTraceIndexPage() {
  const extensionId = await getExtensionId()
  if (!extensionId) {
    return <div>Extension is not installed. Please install the extension first.</div>
  }

  return (
    <div className="w-full">
      <PageTitle title="랭킹 추적" description="상품과 키워드의 일간 랭킹 변화를 추적하고 분석하세요" />
      <RankingTracePage extensionId={extensionId} />
    </div>
  )
}
