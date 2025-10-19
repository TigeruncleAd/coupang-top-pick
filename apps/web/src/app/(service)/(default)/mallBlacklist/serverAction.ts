'use server'

import { successServerAction, throwServerAction } from '@repo/utils'
import { getServerUser } from '../../../../../lib/utils/server/getServerUser'
import { MallBlackList } from '@repo/database'
import { prisma } from '@repo/database'

export async function upsertMallBlacklist(mall: MallBlackList) {
  try {
    const user = await getServerUser()
    if (user.role !== 'ADMIN') return throwServerAction('권한이 없습니다.')

    if (!mall.mallId) return throwServerAction('쇼핑몰 아이디가 없습니다.')
    if (!mall.mallName) return throwServerAction('쇼핑몰 이름이 없습니다.')

    await prisma.mallBlackList.upsert({
      where: { id: mall.id ?? -1 },
      update: {
        mallId: mall.mallId,
        mallName: mall.mallName,
        memo: mall.memo,
      },
      create: {
        mallId: mall.mallId,
        mallName: mall.mallName,
        memo: mall.memo,
      },
    })
    return successServerAction('블랙리스트 저장에 성공했습니다.')
  } catch (e) {
    console.error(e)
    return throwServerAction('블랙리스트 저장에 실패했습니다.')
  }
}

export async function deleteMallBlacklist(ids: number[]) {
  try {
    const user = await getServerUser()
    if (user.role !== 'ADMIN') return throwServerAction('권한이 없습니다.')

    await prisma.mallBlackList.deleteMany({
      where: {
        id: { in: ids },
      },
    })
    return successServerAction('블랙리스트 삭제에 성공했습니다.')
  } catch (e) {
    console.error(e)
    return throwServerAction('블랙리스트 삭제에 실패했습니다.')
  }
}
