'use server'

import { prisma } from '@repo/database'

export interface FavoriteToggleResult {
  success: boolean
  isFavorite: boolean
  error?: string
}

export async function toggleKeywordFavorite(
  keyword: string,
  userId: string,
  source: 'search' | 'trend' = 'trend',
): Promise<FavoriteToggleResult> {
  try {
    // 키워드 조회
    const keywordRecord = await prisma.keyword.findUnique({
      where: {
        keyword: keyword,
      },
      select: {
        id: true,
      },
    })

    if (!keywordRecord) {
      return {
        success: false,
        isFavorite: false,
        error: '키워드를 찾을 수 없습니다.',
      }
    }

    // 기존 UserKeyword 조회
    const existingUserKeyword = await prisma.userKeyword.findFirst({
      where: {
        keywordId: keywordRecord.id,
        userId: BigInt(userId),
      },
    })

    if (existingUserKeyword) {
      // isFavorite 필드 토글
      await prisma.userKeyword.update({
        where: {
          id: existingUserKeyword.id,
        },
        data: {
          isBookMarked: !existingUserKeyword.isBookMarked,
        },
      })

      return {
        success: true,
        isFavorite: !existingUserKeyword.isBookMarked,
      }
    } else {
      // UserKeyword가 없으면 새로 생성 (즐겨찾기로)
      await prisma.userKeyword.create({
        data: {
          keywordId: keywordRecord.id,
          userId: BigInt(userId),
          source: source,
          // 기본값들 설정
          productCount: 0,
          monthlySearchCount: 0,
          mobileSearchCount: 0,
          pcSearchCount: 0,
          top40SalesCount: 0,
          top40Sales: 0,
          top40AveragePrice: 0,
          top80SalesCount: 0,
          top80Sales: 0,
          top80AveragePrice: 0,
          productCompetitionScore: 0,
          realTradeRatio: 0,
          bundleRatio: 0,
          overseasRatio: 0,
          recentYearRatio: 0,
          adClickCount: 0,
          adClickRatio: 0,
          adClickRatioPC: 0,
          adClickRatioMobile: 0,
          adClickCompetitionRatio: 0,
          adPrice: 0,
          adPricePerPrice: 0,
          adPricePerClick: 0,
          coupangProductCount: 0,
          coupangRocketProductCount: 0,
          coupangProductAveragePrice: 0,
          coupangeAverageReviewCount: 0,
          coupangRocketProductRatio: 0,
          coupangProductCompetitionScore: 0,
          coupangBundleRatio: 0,
          coupangOverseasRatio: 0,
          coupangRecentYearRatio: 0,
          isBookMarked: true,
          misc: {},
        },
      })

      return {
        success: true,
        isFavorite: true,
      }
    }
  } catch (error) {
    console.error('즐겨찾기 토글 오류:', error)
    return {
      success: false,
      isFavorite: false,
      error: '즐겨찾기 토글에 실패했습니다.',
    }
  }
}

export async function checkKeywordFavorite(keyword: string, userId: string): Promise<{ isFavorite: boolean }> {
  try {
    const keywordRecord = await prisma.keyword.findUnique({
      where: {
        keyword: keyword,
      },
      select: {
        id: true,
      },
    })

    if (!keywordRecord) {
      return { isFavorite: false }
    }

    const existingUserKeyword = await prisma.userKeyword.findFirst({
      where: {
        keywordId: keywordRecord.id,
        userId: BigInt(userId),
      },
    })

    if (!existingUserKeyword) {
      return { isFavorite: false }
    }

    return {
      isFavorite: existingUserKeyword.isBookMarked,
    }
  } catch (error) {
    console.error('즐겨찾기 확인 오류:', error)
    return { isFavorite: false }
  }
}
