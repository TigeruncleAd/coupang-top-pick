import { NextResponse } from 'next/server'
import { getUserIdFromToken } from '@/lib/utils/server/getServerUser'
import { prisma } from '@repo/database'
export async function POST(req: Request) {
  try {
    const { data, ksToken } = await req.json()
    const userId = await getUserIdFromToken(decodeURIComponent(ksToken))
    const mallId = data?.mallId
    const status = data?.status
    if (!userId || !mallId || !status) {
      return NextResponse.json({ error: 'Invalid Request' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    const searchedMall = await prisma.searchedMall.update({
      where: {
        id: mallId,
        // userId: user.id,
      },
      data: {
        isComplete: true,
        status: status,
      },
    })

    return NextResponse.json({ message: 'ok' }, { status: 200 })
  } catch (e) {
    // console.error(e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
