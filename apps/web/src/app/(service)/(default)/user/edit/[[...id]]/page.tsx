import { Suspense } from 'react'
import EditUserView from './view'
import { prisma } from '@repo/database'
import { getServerUser } from '../../../../../../../lib/utils/server/getServerUser'
import { redirect } from 'next/navigation'

async function getData(id) {
  const user = await getServerUser()
  if (user.role !== 'ADMIN') {
    redirect('/')
  }
  if (!id) {
    return { item: null }
  }
  let item = await prisma.user.findUnique({
    where: { id: BigInt(id) },
  })
  delete item.password

  return { item: item }
}

export default async function UserEditPage({ params }) {
  const { id } = params
  const { item } = await getData(id)
  return (
    <div>
      <Suspense>
        <EditUserView id={id} item={item} profiles={[]} />
      </Suspense>
    </div>
  )
}
