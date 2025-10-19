'use server'
import { getServerSession } from 'next-auth'
import { prisma } from '@repo/database'
import { redirect } from 'next/navigation'
import { authOptions } from '../../../src/app/api/auth/[...nextauth]/authOption'
import { PATH } from '../../../consts/const'
import jwt from 'jsonwebtoken'
import { kdayjs } from '@repo/utils'

export async function getServerUser() {
  const user = await getServerUserFromToken()
  const me = await prisma.user.findUnique({
    where: {
      id: BigInt(user.id),
    },
  })
  if (me && 'password' in me) {
    delete (me as any).password
  }
  if (!me) {
    redirect(PATH.SIGNIN)
  }

  return me
}

export async function getServerUserFromToken() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any

  if (!user) redirect(PATH.SIGNIN)
  return { ...user, id: BigInt(user.id) }
}

export async function getUserIdFromToken(token: string) {
  try {
    const { id } = (await jwt.verify(token, process.env.NEXTAUTH_SECRET!)) as { id: string }

    return BigInt(id)
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function getMe() {
  const user = await getServerUserFromToken()
  const me = await prisma.user.findUnique({
    where: {
      id: BigInt(user.id),
    },
    select: {
      id: true,
      name: true,
      role: true,
      license: true,
      maxProductCount: true,
      remainingProductCount: true,
      maxUploadProductCount: true,
      remainingUploadProductCount: true,
      expiredAt: true,
      status: true,
      memo: true,
      accountId: true,
      password: true,
      lastLoginAt: true,
      lastPaidAt: true,
    },
  })

  return me
}
