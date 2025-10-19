'use server'
import { successServerAction, throwServerAction } from '@repo/utils'
import { prisma } from '@repo/database'
import { getServerUser } from '../../../../../lib/utils/server/getServerUser'
import { revalidatePath } from 'next/cache'
import { PATH } from '../../../../../consts/const'
import { hash } from 'bcryptjs'
const basePath = PATH.USER

export async function upsertMutation({ form }) {
  const user = await getServerUser()
  if (user.role !== 'ADMIN') throw new Error('권한이 없습니다.')
  try {
    const {
      id,
      name,
      password,
      accountId,
      role,
      maxProductCount,
      remainingProductCount,
      memo,
      expiredAt,
      status,
      license,
      maxUploadProductCount,
      remainingUploadProductCount,
    } = form
    const hashedPassword = password ? await hash(password, 10) : undefined
    if (id) {
      await prisma.user.update({
        where: { id },
        data: {
          name,
          accountId,
          role,
          maxProductCount,
          remainingProductCount,
          memo,
          expiredAt,
          status,
          password: hashedPassword,
          license,
          maxUploadProductCount,
          remainingUploadProductCount,
        },
      })
    } else {
      await prisma.user.create({
        data: {
          name,
          accountId,
          role,
          maxProductCount,
          remainingProductCount,
          memo,
          expiredAt,
          status,
          password: hashedPassword,
          license,
          maxUploadProductCount,
          remainingUploadProductCount,
        },
      })
    }

    revalidatePath(basePath)
    return successServerAction('저장되었습니다.')
  } catch (e) {
    console.error(e)
    return throwServerAction('저장에 실패했습니다.')
  }
}
