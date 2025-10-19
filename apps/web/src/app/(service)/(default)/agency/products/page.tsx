import { getServerUser } from '../../../../../../lib/utils/server/getServerUser'
import { kdayjs } from '@repo/utils'
import { prisma } from '@repo/database'
import ProductView from './view'
import PageTitle from '../../(_components)/PageTitle'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProductPage() {
  const user = await getServerUser()
  if (!user) return notFound()
  return (
    <div className="w-full">
      <PageTitle title="상품관리" />
      <ProductView />
    </div>
  )
}
