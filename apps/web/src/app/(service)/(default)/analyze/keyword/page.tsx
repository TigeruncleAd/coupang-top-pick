import { Button } from '@repo/ui/components/button'
import PageTitle from '../../(_components)/PageTitle'
import { Input } from '@repo/ui/components/input'
import KeywordSearchForm from './(_components)/keywordSearchForm'
import TrendKeywordsView from './components/TrendKeywordsView'
import KeywordHistoryTabs from './components/KeywordHistoryTabs'

export default function KeywordMainPage() {
  return (
    <div>
      <PageTitle title="키워드 분석" />
      <KeywordSearchForm />
      <div className="mt-12 w-full">
        <h2 className="mb-6 text-center text-2xl font-bold text-white">트렌드 키워드</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TrendKeywordsView type="daily" title="일간 트렌드 키워드" />
          <TrendKeywordsView type="weekly" title="주간 트렌드 키워드" />
        </div>
      </div>
      <div className="mt-12 w-full">
        <KeywordHistoryTabs />
      </div>
    </div>
  )
}
