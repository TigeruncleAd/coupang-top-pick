import { kdayjs } from '@repo/utils'
import ManageUploadProductView from './view'
import { fetchUploadProduct } from './serverAction'
export const dynamic = 'force-dynamic'

export default async function UploadProductPage({ searchParams }) {
  const { date, page, name } = searchParams

  const { user, listData, totalCount } = await fetchUploadProduct({ date, page, name })
  return <ManageUploadProductView listData={listData} dateString={date} user={user} totalCount={totalCount} />
}
