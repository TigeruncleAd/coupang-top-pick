import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/authOption'
import { prisma } from '@repo/database'

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // 최근 5분 내에 생성된 UserTrackedProduct 조회 (사용자별로)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const latestUserTrackedProduct = await prisma.userTrackedProduct.findFirst({
      where: {
        userId: BigInt(userId),
        updatedAt: {
          gte: fiveMinutesAgo, // 5분 이내에 업데이트된 것만
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            updatedAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    if (!latestUserTrackedProduct) {
      return NextResponse.json(
        {
          status: 'error',
          error: '생성된 상품이 없습니다.',
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      status: 'success',
      productId: latestUserTrackedProduct.product.id.toString(),
      productName: latestUserTrackedProduct.product.name,
      createdAt: latestUserTrackedProduct.product.createdAt,
    })
  } catch (error) {
    console.error('최근 TrackedProduct 조회 오류:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 },
    )
  }
}
