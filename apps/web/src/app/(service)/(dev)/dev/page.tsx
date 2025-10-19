import { notFound } from 'next/navigation'
import { getServerUser } from '../../../../../lib/utils/server/getServerUser'
import { PATH } from '../../../../../consts/const'

const dynamic = 'force-dynamic'

export default async function DevPage() {
  const user = await getServerUser()
  if (user.role !== 'ADMIN') {
    return notFound()
  }

  return (
    <div className="mx-auto my-10 flex max-w-7xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <a href={PATH.DEV_UPLOAD_PATCH} className="text-blue-500">
          마스터버전 패치 업로드
        </a>
        <a href={PATH.DEV_UPLOAD_PATCH_NORMAL} className="text-blue-500">
          일반버전 패치 업로드
        </a>
      </div>
    </div>
  )
}
