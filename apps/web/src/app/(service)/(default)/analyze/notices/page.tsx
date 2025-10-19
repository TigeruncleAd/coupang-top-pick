import PageTitle from '../../(_components)/PageTitle'
import NoticeList from '../../(_components)/NoticeList'
import { getAnalyzeNotices } from './serverAction'

export const dynamic = 'force-dynamic'

export default function AnalyzeNoticesPage() {
  // const { date } = searchParams
  return (
    <div className="w-full">
      <PageTitle title="공지사항" />
      <NoticeList getNoticesAction={getAnalyzeNotices} />
    </div>
  )
}
