import jwt from 'jsonwebtoken'
import { prisma } from '@repo/database'
export async function getUserFromUserToken(userToken: string) {
  try {
    const { id } = jwt.verify(userToken, process.env.NEXTAUTH_SECRET!) as { id: string }
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: BigInt(id),
      },
      include: {
        marketSetting: true,
      },
    })
    return user
  } catch (e) {
    console.error(e)
    return null
  }
}
