'use server'

import { prisma } from '@repo/database'

// 확장 프로그램에서 받는 상품 데이터 타입
export type ExtensionProductData = {
  name: string
  url: string
  market: 'naver' | 'coupang'
  storeName: string
  productImage?: string
  price?: number
  originalPrice?: number
  discountRate?: number
  rating?: number
  reviewCount?: number
  keywords: string[]
  rankings: Array<{
    keyword: string
    rank: number
    searchType?: 'all' | 'ad' | 'organic'
  }>
  // 분리된 데이터 필드들
  metadata?: any
}

// 히스토리 데이터 업데이트 함수
function updateHistoryData(existingHistory: any[], newData: any): any[] {
  const currentDate = newData.date
  const existingIndex = existingHistory.findIndex(item => item.date === currentDate)

  if (existingIndex >= 0) {
    // 같은 날짜가 있으면 업데이트
    existingHistory[existingIndex] = { ...existingHistory[existingIndex], ...newData }
  } else {
    // 새로운 날짜면 추가
    existingHistory.push(newData)
  }

  // 날짜순으로 정렬 (최신순)
  return existingHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// TrackedProduct 생성 또는 업데이트
export async function upsertTrackedProduct(
  userId: string,
  productData: ExtensionProductData,
): Promise<{
  status: 'success' | 'error'
  result?: {
    productId: string
    isNew: boolean
  }
  error?: string
}> {
  try {
    const userIdBigInt = BigInt(userId)

    // 1. TrackedProduct 찾기 또는 생성 (URL 기준)
    let trackedProduct = await prisma.trackedProduct.findFirst({
      where: {
        url: productData.url,
      },
    })

    let productId: string
    let isNew = false

    if (trackedProduct) {
      // 기존 TrackedProduct 업데이트
      const currentDate = new Date().toISOString().split('T')[0]
      const existingHistoryData = (trackedProduct.historyData as any) || {}
      const existingMetadata = (trackedProduct.metadata as any) || {}

      // 히스토리 데이터 업데이트
      const updatedHistoryData = {
        ...existingHistoryData,
        reviewHistory: updateHistoryData(existingHistoryData.reviewHistory || [], {
          date: currentDate,
          reviewCount: productData.reviewCount,
        }),
        priceHistory: updateHistoryData(existingHistoryData.priceHistory || [], {
          date: currentDate,
          price: productData.price,
          originalPrice: productData.originalPrice,
          discountRate: productData.discountRate,
        }),
        ratingHistory: updateHistoryData(existingHistoryData.ratingHistory || [], {
          date: currentDate,
          rating: productData.rating,
          reviewCount: productData.reviewCount,
        }),
      }

      const updatedProduct = await prisma.trackedProduct.update({
        where: {
          id: trackedProduct.id,
        },
        data: {
          name: productData.name,
          storeName: productData.storeName,
          productImage: productData.productImage,
          price: productData.price,
          originalPrice: productData.originalPrice,
          discountRate: productData.discountRate,
          rating: productData.rating,
          reviewCount: productData.reviewCount,
          isActive: true,
          historyData: updatedHistoryData,
          metadata: {
            ...existingMetadata,
            ...productData.metadata,
          },
        },
      })

      productId = updatedProduct.id.toString()
    } else {
      // 새 TrackedProduct 생성
      const currentDate = new Date().toISOString().split('T')[0]
      const initialHistoryData = {
        reviewHistory: [
          {
            date: currentDate,
            reviewCount: productData.reviewCount || 0,
            addedReviews: 0,
          },
        ],
        priceHistory: [
          {
            date: currentDate,
            price: productData.price || 0,
            originalPrice: productData.originalPrice || 0,
            discountRate: productData.discountRate || 0,
          },
        ],
        ratingHistory: [
          {
            date: currentDate,
            rating: productData.rating || 0,
            reviewCount: productData.reviewCount || 0,
          },
        ],
        salesHistory: [], // 예상 판매량은 나중에 추가
      }

      const newProduct = await prisma.trackedProduct.create({
        data: {
          name: productData.name,
          url: productData.url,
          market: productData.market,
          storeName: productData.storeName,
          productImage: productData.productImage,
          price: productData.price,
          originalPrice: productData.originalPrice,
          discountRate: productData.discountRate,
          rating: productData.rating,
          reviewCount: productData.reviewCount,
          isActive: true,
          historyData: initialHistoryData,
          metadata: productData.metadata || {},
        },
      })

      productId = newProduct.id.toString()
      isNew = true
    }

    // 2. UserTrackedProduct 찾기 또는 생성
    let userTrackedProduct = await prisma.userTrackedProduct.findFirst({
      where: {
        userId: userIdBigInt,
        productId: BigInt(productId),
      },
    })

    if (!userTrackedProduct) {
      // 새 UserTrackedProduct 생성
      userTrackedProduct = await prisma.userTrackedProduct.create({
        data: {
          userId: userIdBigInt,
          productId: BigInt(productId),
          isActive: true,
        },
      })
    } else {
      // 기존 UserTrackedProduct 활성화
      await prisma.userTrackedProduct.update({
        where: {
          id: userTrackedProduct.id,
        },
        data: {
          isActive: true,
        },
      })
    }

    // 3. 키워드 처리
    if (productData.keywords && productData.keywords.length > 0) {
      await processKeywords(userIdBigInt, userTrackedProduct.id.toString(), productData.keywords, productData.market)
    }

    // 4. 랭킹 데이터 처리
    if (productData.rankings && productData.rankings.length > 0) {
      await processRankings(BigInt(productId), productData.rankings)
    }

    return {
      status: 'success',
      result: {
        productId,
        isNew,
      },
    }
  } catch (error) {
    console.error('상품 생성/업데이트 오류:', error)
    return {
      status: 'error',
      error: '상품 정보를 저장하는데 실패했습니다.',
    }
  }
}

// 키워드 처리 함수
async function processKeywords(
  userId: bigint,
  userTrackedProductId: string,
  keywords: string[],
  market: string,
): Promise<void> {
  for (const keywordText of keywords) {
    await prisma.trackedKeyword.upsert({
      where: {
        userTrackedProductId_keyword: {
          userTrackedProductId: BigInt(userTrackedProductId),
          keyword: keywordText,
        },
      },
      update: { isActive: true },
      create: {
        keyword: keywordText,
        market,
        userTrackedProductId: BigInt(userTrackedProductId),
        isActive: true,
      },
    })
  }
}

// 랭킹 데이터 처리 함수
async function processRankings(
  productId: bigint,
  rankings: Array<{ keyword: string; rank: number; searchType?: string }>,
): Promise<void> {
  for (const ranking of rankings) {
    await prisma.productRanking.create({
      data: {
        rank: ranking.rank,
        keywordText: ranking.keyword,
        market: 'naver', // 기본값, 필요시 수정
        searchType: ranking.searchType || 'all',
        productId: productId,
      },
    })
  }
}
