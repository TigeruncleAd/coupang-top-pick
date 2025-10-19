'use server'

import { prisma } from '@repo/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../api/auth/[...nextauth]/authOption'

// UserTrackedProduct 조회 결과 타입
export type TrackedProductResult = {
  id: string
  userTrackedProductId: string
  name: string
  url: string
  market: string
  storeName: string
  productImage?: string
  price?: number
  originalPrice?: number
  discountRate?: number
  rating?: number
  reviewCount?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  groupId?: string
  groupName?: string
  customName?: string
  keywords: Array<{
    id: string
    keyword: string
    market: string
    createdAt: Date
  }>
  trackingKeywords: string[]
  latestRankings: Array<{
    keyword: string
    rank: number
    change: number
    changeType: string
    createdAt: Date
  }>
  // 분리된 데이터 필드들
  historyData?: {
    reviewHistory?: Array<{
      date: string
      reviewCount: number
      addedReviews: number
    }>
    priceHistory?: Array<{
      date: string
      price: number
      originalPrice: number
      discountRate: number
    }>
    ratingHistory?: Array<{
      date: string
      rating: number
      reviewCount: number
    }>
    salesHistory?: Array<{
      date: string
      value: number
    }>
  }
  metadata?: {
    categories?: string[]
    tags?: string[]
    brand?: string
    brandName?: string
    productGroups?: string[]
  }
}

// TrackedProduct 목록 조회
export async function getTrackedProducts(): Promise<{
  status: 'success' | 'error'
  result?: TrackedProductResult[]
  error?: string
}> {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.id) {
      return {
        status: 'error',
        error: '인증이 필요합니다.',
      }
    }

    const userTrackedProducts = await prisma.userTrackedProduct.findMany({
      where: {
        userId: BigInt((session.user as any).id),
        isActive: true,
      },
      include: {
        product: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
            rankings: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 5, // 최근 5개 랭킹 데이터
              select: {
                keywordText: true,
                rank: true,
                change: true,
                changeType: true,
                createdAt: true,
              },
            },
          },
        },
        keywords: {
          where: {
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
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const result: TrackedProductResult[] = userTrackedProducts.map(userTrackedProduct => ({
      id: userTrackedProduct.product.id.toString(),
      userTrackedProductId: userTrackedProduct.id.toString(),
      name: userTrackedProduct.product.name,
      url: userTrackedProduct.product.url,
      market: userTrackedProduct.product.market,
      storeName: userTrackedProduct.product.storeName,
      productImage: userTrackedProduct.product.productImage || undefined,
      price: userTrackedProduct.product.price || undefined,
      originalPrice: userTrackedProduct.product.originalPrice || undefined,
      discountRate: userTrackedProduct.product.discountRate || undefined,
      rating: userTrackedProduct.product.rating || undefined,
      reviewCount: userTrackedProduct.product.reviewCount || undefined,
      isActive: userTrackedProduct.isActive,
      createdAt: userTrackedProduct.product.createdAt,
      updatedAt: userTrackedProduct.product.updatedAt,
      groupId: userTrackedProduct.product.group?.id.toString(),
      groupName: userTrackedProduct.product.group?.name,
      customName: userTrackedProduct.customName || undefined,
      keywords: userTrackedProduct.keywords.map(k => ({
        id: k.id.toString(),
        keyword: k.keyword,
        market: k.market,
        createdAt: k.createdAt,
      })),
      trackingKeywords: Array.from(new Set(userTrackedProduct.product.rankings.map(r => r.keywordText))),
      latestRankings: userTrackedProduct.product.rankings.map(r => ({
        keyword: r.keywordText,
        rank: r.rank,
        change: r.change || 0,
        changeType: r.changeType || 'same',
        createdAt: r.createdAt,
      })),
      // 분리된 데이터 필드들
      historyData: (userTrackedProduct.product.historyData as any) || undefined,
      metadata: (userTrackedProduct.product.metadata as any) || undefined,
    }))

    return {
      status: 'success',
      result,
    }
  } catch (error) {
    console.error('추적 상품 조회 오류:', error)
    return {
      status: 'error',
      error: '추적 상품을 불러오는데 실패했습니다.',
    }
  }
}

// 특정 TrackedProduct 상세 조회
export async function getTrackedProductDetail(productId: string): Promise<{
  status: 'success' | 'error'
  result?: TrackedProductResult & {
    rankings: Array<{
      keyword: string
      rank: number
      change: number
      changeType: string
      createdAt: Date
    }>
    changes: Array<{
      changeType: string
      beforeValue: string
      afterValue: string
      description?: string
      createdAt: Date
    }>
  }
  error?: string
}> {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.id) {
      return {
        status: 'error',
        error: '인증이 필요합니다.',
      }
    }

    const userTrackedProduct = await prisma.userTrackedProduct.findFirst({
      where: {
        productId: BigInt(productId),
        userId: BigInt((session.user as any).id),
      },
      include: {
        product: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
            rankings: {
              orderBy: {
                createdAt: 'desc',
              },
              select: {
                keywordText: true,
                rank: true,
                change: true,
                changeType: true,
                createdAt: true,
              },
            },
            changes: {
              orderBy: {
                createdAt: 'desc',
              },
              select: {
                changeType: true,
                beforeValue: true,
                afterValue: true,
                description: true,
                createdAt: true,
              },
            },
          },
        },
        keywords: {
          where: {
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
        },
      },
    })

    if (!userTrackedProduct) {
      return {
        status: 'error',
        error: '상품을 찾을 수 없습니다.',
      }
    }

    const result: TrackedProductResult & {
      rankings: Array<{
        keyword: string
        rank: number
        change: number
        changeType: string
        createdAt: Date
      }>
      changes: Array<{
        changeType: string
        beforeValue: string
        afterValue: string
        description?: string
        createdAt: Date
      }>
    } = {
      id: userTrackedProduct.product.id.toString(),
      userTrackedProductId: userTrackedProduct.id.toString(),
      name: userTrackedProduct.product.name,
      url: userTrackedProduct.product.url,
      market: userTrackedProduct.product.market,
      storeName: userTrackedProduct.product.storeName,
      productImage: userTrackedProduct.product.productImage || undefined,
      price: userTrackedProduct.product.price || undefined,
      originalPrice: userTrackedProduct.product.originalPrice || undefined,
      discountRate: userTrackedProduct.product.discountRate || undefined,
      rating: userTrackedProduct.product.rating || undefined,
      reviewCount: userTrackedProduct.product.reviewCount || undefined,
      isActive: userTrackedProduct.isActive,
      createdAt: userTrackedProduct.product.createdAt,
      updatedAt: userTrackedProduct.product.updatedAt,
      groupId: userTrackedProduct.product.group?.id.toString(),
      groupName: userTrackedProduct.product.group?.name,
      customName: userTrackedProduct.customName || undefined,
      keywords: userTrackedProduct.keywords.map(k => ({
        id: k.id.toString(),
        keyword: k.keyword,
        market: k.market,
        createdAt: k.createdAt,
      })),
      trackingKeywords: Array.from(new Set(userTrackedProduct.product.rankings.map(r => r.keywordText))),
      latestRankings: userTrackedProduct.product.rankings.slice(0, 5).map(r => ({
        keyword: r.keywordText,
        rank: r.rank,
        change: r.change || 0,
        changeType: r.changeType || 'same',
        createdAt: r.createdAt,
      })),
      // 분리된 데이터 필드들
      historyData: (userTrackedProduct.product.historyData as any) || undefined,
      metadata: (userTrackedProduct.product.metadata as any) || undefined,
      rankings: userTrackedProduct.product.rankings.map(r => ({
        keyword: r.keywordText,
        rank: r.rank,
        change: r.change || 0,
        changeType: r.changeType || 'same',
        createdAt: r.createdAt,
      })),
      changes: userTrackedProduct.product.changes.map(c => ({
        changeType: c.changeType,
        beforeValue: c.beforeValue,
        afterValue: c.afterValue,
        description: c.description || undefined,
        createdAt: c.createdAt,
      })),
    }

    return {
      status: 'success',
      result,
    }
  } catch (error) {
    console.error('추적 상품 상세 조회 오류:', error)
    return {
      status: 'error',
      error: '상품 상세 정보를 불러오는데 실패했습니다.',
    }
  }
}

// TrackedProduct 삭제
export async function deleteTrackedProduct(productId: string): Promise<{
  status: 'success' | 'error'
  error?: string
}> {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.id) {
      return {
        status: 'error',
        error: '인증이 필요합니다.',
      }
    }

    await prisma.userTrackedProduct.updateMany({
      where: {
        productId: BigInt(productId),
        userId: BigInt((session.user as any).id),
      },
      data: {
        isActive: false,
      },
    })

    return {
      status: 'success',
    }
  } catch (error) {
    console.error('추적 상품 삭제 오류:', error)
    return {
      status: 'error',
      error: '상품 삭제에 실패했습니다.',
    }
  }
}
