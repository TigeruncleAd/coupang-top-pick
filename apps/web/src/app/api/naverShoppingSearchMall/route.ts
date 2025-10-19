import { NextResponse } from 'next/server'
import { getUserIdFromToken } from '@/lib/utils/server/getServerUser'
import { prisma } from '@repo/database'
import { kdayjs } from '@repo/utils'

export async function POST(req: Request) {
  try {
    const { data, ksToken, query } = await req.json()
    const userId = await getUserIdFromToken(decodeURIComponent(ksToken))
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const blackLists = await prisma.mallBlackList.findMany({
      // where: {
      //   OR: [{ userId: user.id }, { userId: null }],
      // },
      select: {
        mallId: true,
      },
    })
    if (!data) {
      return NextResponse.json({ message: 'no data' }, { status: 200 })
    }

    const filteredData = data.filter(item => {
      const mallId = item.mallPcUrl?.split('/')?.pop()?.split('?')[0] || ''
      return !blackLists.some(blackList => blackList.mallId === mallId)
    })

    await prisma.searchedMall.createMany({
      data: filteredData.map(item => ({
        userId: user.id,
        mallId: item.mallNo,
        mallLogo: item.mallInfoCache?.mallLogos?.REPRESENTATIVE,
        mallPcUrl: item.mallPcUrl,
        mallName: item.mallName,
        date: kdayjs().format('YYYY-MM-DD'),
        keyword: query,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ message: 'ok' }, { status: 200 })
  } catch (e) {
    // console.error(e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
