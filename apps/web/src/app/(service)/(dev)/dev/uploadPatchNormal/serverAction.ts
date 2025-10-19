'use server'

import { successServerAction, throwServerAction } from '@repo/utils'
import { prisma } from '@repo/database'
import { getServerUser } from '../../../../../../lib/utils/server/getServerUser'

const PATCH_KEY = 'patch_normal'

export async function uploadPatchNormal({
  url,
  date,
  version,
  detail,
}: {
  url: string
  date: string
  version: string
  detail: string
}) {
  try {
    const user = await getServerUser()
    if (user.role !== 'ADMIN') {
      return throwServerAction('권한이 없습니다.')
    }
    if (!url || !date || !version) {
      return throwServerAction('모든 필드를 입력해주세요.')
    }

    await prisma.misc.upsert({
      where: {
        key: PATCH_KEY,
      },
      update: {
        value: {
          url,
          date,
          version,
          detail,
        },
      },
      create: {
        key: PATCH_KEY,
        value: {
          url,
          date,
          version,
          detail,
        },
      },
    })
    return successServerAction('ok')
  } catch (e) {
    console.error(e)
    return throwServerAction(e.message)
  }
}
