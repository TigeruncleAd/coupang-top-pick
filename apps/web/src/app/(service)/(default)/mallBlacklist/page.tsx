import { prisma } from '@repo/database'
import ListTable from '../../(_components)/ListTable'
import { baseUrl, tableColumns, title } from './consts'
import { getServerUser } from '../../../../../lib/utils/server/getServerUser'
import { ROLE } from '@repo/database'
import { notFound, redirect } from 'next/navigation'
import EditModal from './EditModal'
import { deleteMallBlacklist } from './serverAction'
export const dynamic = 'force-dynamic'

async function getData({ mallName, mallId }) {
  const user = await getServerUser()
  if (user.role !== ROLE.ADMIN) {
    return notFound()
  }

  const listData = await prisma.mallBlackList.findMany({
    orderBy: {
      id: 'desc',
    },
    where: {
      mallName: mallName ? { contains: mallName } : undefined,
      mallId: mallId ? { contains: mallId } : undefined,
    },
  })

  return { listData }
}

export default async function DistributorPage({ searchParams }) {
  const { listData } = await getData(searchParams)

  const searchOptions = {
    options: [
      {
        label: '몰 이름',
        value: 'mallName',
      },
      {
        label: '몰 아이디',
        value: 'mallId',
      },
    ],
  }
  return (
    <ListTable
      title={title}
      basePath={baseUrl}
      listData={listData}
      totalCount={listData.length}
      tableColumns={tableColumns}
      pagination={false}
      searchOption={searchOptions}
      isCreatable={true}
      isEditable={true}
      EditModal={EditModal}
      deleteMutation={deleteMallBlacklist}
      isPrintable={true}
    />
  )
}
