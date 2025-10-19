import { prisma } from '@repo/database'
import ListTable from '../../(_components)/ListTable'
import { baseUrl, tableColumns, title } from './consts'
import { getServerUser } from '../../../../../lib/utils/server/getServerUser'
import { ROLE } from '@repo/database'
import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'

async function getData({ name, page = 1 }) {
  const user = await getServerUser()
  if (user.role !== ROLE.ADMIN) {
    redirect('/')
  }

  const listData = await prisma.user.findMany({
    where: {
      name: name
        ? {
            contains: name,
          }
        : undefined,
    },
    orderBy: {
      id: 'desc',
    },
  })

  return { listData }
}

export default async function DistributorPage({ searchParams }) {
  const { listData } = await getData(searchParams)

  const searchOptions = {
    options: [
      {
        label: '이름',
        value: 'name',
      },
      {
        label: '계정ID',
        value: 'accountId',
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
    />
  )
}
