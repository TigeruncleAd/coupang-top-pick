import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/authOption'
import { prisma } from '@repo/database'

// 키워드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ status: 'error', error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ status: 'error', error: '상품 ID가 필요합니다.' }, { status: 400 })
    }

    // UserTrackedProduct 찾기
    const userTrackedProduct = await prisma.userTrackedProduct.findFirst({
      where: {
        productId: BigInt(productId),
        userId: BigInt(userId),
      },
    })

    if (!userTrackedProduct) {
      return NextResponse.json({ status: 'error', error: '상품을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 상품의 키워드 목록 조회
    const keywords = await prisma.trackedKeyword.findMany({
      where: {
        userTrackedProductId: userTrackedProduct.id,
        isActive: true,
      },
      select: {
        id: true,
        keyword: true,
        market: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({
      status: 'success',
      keywords: keywords.map(k => ({
        id: k.id.toString(),
        keyword: k.keyword,
        market: k.market,
        createdAt: k.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('키워드 조회 오류:', error)
    return NextResponse.json({ status: 'error', error: '키워드 조회에 실패했습니다.' }, { status: 500 })
  }
}

// 키워드 목록 업데이트
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ status: 'error', error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { productId, keywords } = body

    if (!productId || !Array.isArray(keywords)) {
      return NextResponse.json({ status: 'error', error: '상품 ID와 키워드 목록이 필요합니다.' }, { status: 400 })
    }

    // UserTrackedProduct 찾기
    const userTrackedProduct = await prisma.userTrackedProduct.findFirst({
      where: {
        productId: BigInt(productId),
        userId: BigInt(userId),
      },
    })

    if (!userTrackedProduct) {
      return NextResponse.json({ status: 'error', error: '상품을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 트랜잭션으로 키워드 업데이트
    await prisma.$transaction(async tx => {
      // 기존 키워드들을 비활성화
      await tx.trackedKeyword.updateMany({
        where: {
          userTrackedProductId: userTrackedProduct.id,
        },
        data: {
          isActive: false,
        },
      })

      // 새로운 키워드들을 추가
      for (const keyword of keywords) {
        if (keyword.trim()) {
          await tx.trackedKeyword.upsert({
            where: {
              userTrackedProductId_keyword: {
                userTrackedProductId: userTrackedProduct.id,
                keyword: keyword.trim(),
              },
            },
            update: {
              isActive: true,
              updatedAt: new Date(),
            },
            create: {
              keyword: keyword.trim(),
              market: 'naver', // 기본값, 필요시 수정
              isActive: true,
              userTrackedProductId: userTrackedProduct.id,
            },
          })
        }
      }
    })

    return NextResponse.json({ status: 'success', message: '키워드가 업데이트되었습니다.' })
  } catch (error) {
    console.error('키워드 업데이트 오류:', error)
    return NextResponse.json({ status: 'error', error: '키워드 업데이트에 실패했습니다.' }, { status: 500 })
  }
}

// 키워드 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ status: 'error', error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const keywordId = searchParams.get('keywordId')

    if (!productId || !keywordId) {
      return NextResponse.json({ status: 'error', error: '상품 ID와 키워드 ID가 필요합니다.' }, { status: 400 })
    }

    // UserTrackedProduct 찾기
    const userTrackedProduct = await prisma.userTrackedProduct.findFirst({
      where: {
        productId: BigInt(productId),
        userId: BigInt(userId),
      },
    })

    if (!userTrackedProduct) {
      return NextResponse.json({ status: 'error', error: '상품을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 키워드 삭제 (비활성화)
    await prisma.trackedKeyword.updateMany({
      where: {
        id: BigInt(keywordId),
        userTrackedProductId: userTrackedProduct.id,
      },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({ status: 'success', message: '키워드가 삭제되었습니다.' })
  } catch (error) {
    console.error('키워드 삭제 오류:', error)
    return NextResponse.json({ status: 'error', error: '키워드 삭제에 실패했습니다.' }, { status: 500 })
  }
}
