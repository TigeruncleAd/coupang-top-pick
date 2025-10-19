import PageTitle from '../../(_components)/PageTitle'
import NoticeList from '../../(_components)/NoticeList'
import { getNotices } from './serverAction'

export const dynamic = 'force-dynamic'

export default async function NoticesPage({ searchParams }) {
  const { date } = searchParams
  return (
    <div className="w-full">
      <PageTitle title="공지사항" />
      <NoticeList getNoticesAction={getNotices} />
    </div>
  )
}
