import PageTitle from '../../(_components)/PageTitle'
import HomePage from './HomePage'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  return (
    <div className="w-full">
      <PageTitle title="키워드 트렌드 분석" description="카테고리별 일간/주간 키워드 트렌드 분석" />
      <HomePage />
    </div>
  )
}
