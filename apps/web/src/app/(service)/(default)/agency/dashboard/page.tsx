// import ProductView from './view'
// import { fetchMatchTaobao, getPatchNormal } from './serverAction'
import PageTitle from '../../(_components)/PageTitle'
import Dashboard from './Dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  return (
    <div className="w-full">
      <PageTitle title="대시보드" />
      <Dashboard />
    </div>
  )
}
