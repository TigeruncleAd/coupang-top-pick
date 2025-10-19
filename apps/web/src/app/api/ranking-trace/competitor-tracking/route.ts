import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../api/auth/[...nextauth]/authOption'
import { prisma } from '@repo/database'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ status: 'error', error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const userId = (session.user as any).id

    if (!productId) {
      return NextResponse.json({ status: 'error', error: 'productId가 필요합니다.' }, { status: 400 })
    }

    console.log('🔍 경쟁 상품 추적 데이터 조회 - userId:', userId, 'productId:', productId)

    // UserTrackedProduct 찾기
    const userTrackedProduct = await prisma.userTrackedProduct.findFirst({
      where: {
        productId: BigInt(productId),
        userId: BigInt(userId),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        competitors: {
          include: {
            competitorProduct: {
              select: {
                id: true,
                name: true,
                url: true,
                storeName: true,
                productImage: true,
                price: true,
                rating: true,
                reviewCount: true,
              },
            },
          },
        },
      },
    })

    if (!userTrackedProduct) {
      return NextResponse.json({ status: 'error', error: '상품을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 경쟁 상품 추적 데이터 변환
    const competitorTracking = userTrackedProduct.competitors.map(competitor => ({
      id: competitor.id.toString(),
      competitorId: competitor.competitorProduct.id.toString(),
      name: competitor.competitorProduct.name,
      url: competitor.competitorProduct.url,
      storeName: competitor.competitorProduct.storeName,
      productImage: competitor.competitorProduct.productImage,
      price: competitor.competitorProduct.price,
      rating: competitor.competitorProduct.rating,
      reviewCount: competitor.competitorProduct.reviewCount,
      addedAt: (competitor.trackingData as any)?.addedAt || new Date().toISOString().split('T')[0],
      trackingData: competitor.trackingData,
    }))

    console.log('✅ 경쟁 상품 추적 데이터 조회 완료:', {
      productId,
      competitorsCount: competitorTracking.length,
    })

    return NextResponse.json({
      status: 'success',
      result: {
        productId,
        productName: userTrackedProduct.product.name,
        competitorTracking,
      },
    })
  } catch (error) {
    console.error('❌ 경쟁 상품 추적 데이터 조회 오류:', error)
    return NextResponse.json(
      { status: 'error', error: '경쟁 상품 추적 데이터를 불러오는데 실패했습니다.' },
      { status: 500 },
    )
  }
}
