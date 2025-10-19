'use server'

import { prisma } from '@repo/database'
import { getServerUser } from '@/lib/utils/server/getServerUser'

export interface TrendKeyword {
  keyword: string
  searchVolume: number
  rank: number
  change: number // 순위 변동 (양수: 상승, 음수: 하락, 0: 유지)
  productCount: number
  competitionScore: number
  category: string
  isFavorite?: boolean
}

export interface TrendData {
  daily: TrendKeyword[]
  weekly: TrendKeyword[]
}

export async function getTrendKeywords(): Promise<{ status: 'success' | 'error'; result?: TrendData; error?: string }> {
  try {
    // 사용자 ID 가져오기
    const user = await getServerUser()
    if (!user) {
      return {
        status: 'error',
        error: '인증이 필요합니다.',
      }
    }

    // 일간 트렌드 키워드 (전체 카테고리, DAILY 타입)
    const dailyTrend = await prisma.trend.findFirst({
      where: {
        categoryId: 1,
        type: 'DAILY',
      },
      include: {
        TrendKeyword: {
          include: {
            keyword: true,
          },
          orderBy: {
            rank: 'asc',
          },
          take: 10,
        },
        category: true,
      },
    })

    // 주간 트렌드 키워드 (전체 카테고리, WEEKLY 타입)
    const weeklyTrend = await prisma.trend.findFirst({
      where: {
        categoryId: 1,
        type: 'WEEKLY',
      },
      include: {
        TrendKeyword: {
          include: {
            keyword: true,
          },
          orderBy: {
            rank: 'asc',
          },
          take: 10,
        },
        category: true,
      },
    })

    // 모든 트렌드 키워드 수집
    const allTrendKeywords = [...(dailyTrend?.TrendKeyword || []), ...(weeklyTrend?.TrendKeyword || [])]

    // 키워드 ID 목록 추출
    const keywordIds = allTrendKeywords.map(tk => tk.keyword.id)

    // 사용자의 즐겨찾기 상태 조회
    const userFavorites = await prisma.userKeyword.findMany({
      where: {
        userId: user.id,
        keywordId: { in: keywordIds },
        isBookMarked: true,
      },
      select: {
        keywordId: true,
      },
    })

    const favoriteKeywordIds = new Set(userFavorites.map(uf => uf.keywordId))

    // 일간 트렌드 키워드 변환
    const dailyKeywords: TrendKeyword[] =
      dailyTrend?.TrendKeyword.map(tk => {
        const adMisc = tk.keyword.adMisc as any
        const misc = tk.misc as any

        // adMisc에서 검색수 데이터 추출 (PC + 모바일)
        const pcSearchCount = adMisc?.monthlyPcQcCnt || 0
        const mobileSearchCount = adMisc?.monthlyMobileQcCnt || 0
        const totalSearchCount = pcSearchCount + mobileSearchCount

        // adMisc에서 경쟁강도 데이터 추출 (compIdx를 점수로 변환)
        const compIdx = adMisc?.compIdx || '중간'
        const competitionScore = compIdx === '높음' ? 0.8 : compIdx === '중간' ? 0.5 : 0.2

        return {
          keyword: tk.keyword.keyword,
          searchVolume: totalSearchCount || tk.keyword.monthlySearchCount, // adMisc 우선, 없으면 기존 데이터
          rank: tk.rank,
          change: parseFloat(tk.changeRate) || 0, // changeRate를 숫자로 변환
          productCount: tk.keyword.productCount,
          competitionScore: competitionScore,
          category: misc?.category || '기타',
          isFavorite: favoriteKeywordIds.has(tk.keyword.id),
        }
      }) || []

    // 주간 트렌드 키워드 변환
    const weeklyKeywords: TrendKeyword[] =
      weeklyTrend?.TrendKeyword.map(tk => {
        const adMisc = tk.keyword.adMisc as any
        const misc = tk.misc as any

        // adMisc에서 검색수 데이터 추출 (PC + 모바일)
        const pcSearchCount = adMisc?.monthlyPcQcCnt || 0
        const mobileSearchCount = adMisc?.monthlyMobileQcCnt || 0
        const totalSearchCount = pcSearchCount + mobileSearchCount

        // adMisc에서 경쟁강도 데이터 추출 (compIdx를 점수로 변환)
        const compIdx = adMisc?.compIdx || '중간'
        const competitionScore = compIdx === '높음' ? 0.8 : compIdx === '중간' ? 0.5 : 0.2

        return {
          keyword: tk.keyword.keyword,
          searchVolume: totalSearchCount || tk.keyword.monthlySearchCount, // adMisc 우선, 없으면 기존 데이터
          rank: tk.rank,
          change: parseFloat(tk.changeRate) || 0, // changeRate를 숫자로 변환
          productCount: tk.keyword.productCount,
          competitionScore: competitionScore,
          category: misc?.category || '기타',
          isFavorite: favoriteKeywordIds.has(tk.keyword.id),
        }
      }) || []

    return {
      status: 'success',
      result: {
        daily: dailyKeywords,
        weekly: weeklyKeywords,
      },
    }
  } catch (error) {
    console.error('트렌드 키워드 조회 오류:', error)
    return {
      status: 'error',
      error: '트렌드 키워드를 불러오는데 실패했습니다.',
    }
  }
}
