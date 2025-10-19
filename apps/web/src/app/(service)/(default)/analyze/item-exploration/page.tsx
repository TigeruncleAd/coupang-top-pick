import PageTitle from '../../(_components)/PageTitle'
import CategorySelectionPage from './CategorySelectionPage'

export const dynamic = 'force-dynamic'

export default async function ItemExplorationIndexPage() {
  return (
    <div className="w-full">
      <PageTitle title="아이템 발굴" description="카테고리를 선택해서 키워드 분석을 시작하세요" />
      <CategorySelectionPage />
    </div>
  )
}
