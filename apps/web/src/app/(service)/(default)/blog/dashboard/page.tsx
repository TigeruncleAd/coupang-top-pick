// import ProductView from './view'
// import { fetchMatchTaobao, getPatchNormal } from './serverAction'
import PageTitle from '../../(_components)/PageTitle'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ searchParams }) {
  const { date } = searchParams
  //   const { user, listData, dateString } = await fetchMatchTaobao({ date })
  //   const patch = await getPatchNormal()
  return (
    <div className="w-full">
      <PageTitle title="대시보드" />
      {/* <ProductView listData={listData} dateString={dateString} user={user} patch={patch} /> */}
    </div>
  )
}
