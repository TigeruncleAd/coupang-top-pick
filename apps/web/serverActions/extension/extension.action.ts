'use server'

import { getServerUser } from '@/lib/utils/server/getServerUser'
import { prisma } from '@repo/database'
import { sign } from 'jsonwebtoken'

export async function getExtensionId() {
  const settings = await prisma.setting.findUnique({
    where: {
      key: 'EXTENSION_ID',
    },
  })
  return settings?.value
}

export async function generateExtToken() {
  const user = await getServerUser()

  if (!user) {
    return null
  }
  const token = sign({ userId: user.id.toString() }, process.env.EXT_TOKEN_SECRET!, { expiresIn: '30d' })
  const expiredAt = Date.now() + 30 * 24 * 60 * 60 * 1000
  return { token, expiredAt }
}
