import { getServerUser } from '../../../../../lib/utils/server/getServerUser'
import { kdayjs } from '@repo/utils'
import { prisma } from '@repo/database'
// import ProductView from './view'
import { fetchUploadProduct } from './serverAction'
import { Category } from '@repo/database'
import UploadProductViewBridge from '@/src/app/(service)/(default)/uploadProduct/viewBridge'
export const revalidate = 0
export const maxDuration = 180

async function getCategory() {
  const categories = await prisma.category.findMany({
    orderBy: {
      id: 'asc',
    },
    select: {
      id: true,
      parentId: true,
      smartStoreId: true,
      smartStoreName: true,
    },
  })
  const patch = await prisma.misc.findUnique({
    where: {
      key: 'patch',
    },
  })

  return { categories, patch: patch?.value as { url: string; date: string; version: string; detail: string } | null }
}

export default async function UploadProductPage({ searchParams }) {
  const { date, productId, userId } = searchParams
  const { user, listData, marketSetting } = await fetchUploadProduct({ date, productId, userId })
  const { categories, patch } = await getCategory()
  return (
    <UploadProductViewBridge
      listData={listData}
      date={date ?? kdayjs().format('YYYY-MM-DD')}
      user={user}
      marketSetting={marketSetting}
      categories={categories as Category[]}
      patch={patch}
    />
  )
}
