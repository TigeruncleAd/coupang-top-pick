// import SearchMallView from './view'

// import { getSearchMall } from './serverAction'
import { generateUserToken } from '@/lib/utils/server/generateUserToken'
import PageTitle from '../../(_components)/PageTitle'
import { notFound } from 'next/navigation'
import { getServerUser } from '@/lib/utils/server/getServerUser'
import { prisma } from '@repo/database'
import { getExtensionId } from '@/serverActions/extension/extension.action'

export const dynamic = 'force-dynamic'

export default async function SearchMallPage() {
  const user = await getServerUser()
  // banWords를 포함한 user 데이터 가져오기
  const userWithBanWords = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      license: true,
      banWords: true,
    },
  })

  const detailClassCode = (
    await prisma.setting.findUniqueOrThrow({
      where: {
        key: 'DETAIL_CLASS_CODE',
      },
    })
  ).value
  const extensionId = await getExtensionId()
  const token = await generateUserToken({ userId: user.id })

  if (!token) {
    return notFound()
  }

  return (
    <div className="w-full">
      <PageTitle title="핸드픽 소싱" />
      {/* <SearchMallView
        user={userWithBanWords as any}
        token={token}
        detailClassCode={detailClassCode}
        extensionId={extensionId}
      /> */}
    </div>
  )
}
