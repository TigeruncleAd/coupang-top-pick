import PageTitle from '../../../(_components)/PageTitle'
import ItemExplorationPage from './ItemExplorationPage'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    categoryId: string
  }>
  searchParams: Promise<{
    period?: 'daily' | 'weekly'
    gender?: 'all' | 'f' | 'm'
    age?: string
  }>
}

export default async function ItemExplorationDynamicPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  return (
    <div className="w-full">
      <PageTitle title="아이템 발굴" description="카테고리별 상세 키워드 분석 및 발굴" />
      <ItemExplorationPage initialCategoryId={resolvedParams.categoryId} initialSearchParams={resolvedSearchParams} />
    </div>
  )
}
