import ProductView from './view'
import { fetchMatchTaobao, getPatchNormal } from './serverAction'
import PageTitle from '../../../(_components)/PageTitle'
import { getServerUser } from '@/lib/utils/server/getServerUser'

export const dynamic = 'force-dynamic'

export default async function ProductPage() {
  const user = await getServerUser()
  const patch = await getPatchNormal()
  return (
    <div className="w-full">
      <PageTitle title="AI 소싱 > 타오바오 매칭" />
      <ProductView patch={patch} />
    </div>
  )
}
