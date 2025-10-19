'use server'

import { prisma } from '@repo/database'
import { getServerUser } from '@/lib/utils/server/getServerUser'

export interface KeywordHistoryItem {
  id: string
  keyword: string
  searchedAt: Date
  productCount: number
  monthlySearchCount: number
  isFavorite: boolean
}

export interface KeywordHistoryResult {
  status: 'success' | 'error'
  result?: {
    searchHistory: KeywordHistoryItem[]
    favorites: KeywordHistoryItem[]
  }
  error?: string
}

export async function getKeywordHistory(): Promise<KeywordHistoryResult> {
  try {
    const user = await getServerUser()
    if (!user) {
      return {
        status: 'error',
        error: '인증이 필요합니다.',
      }
    }

    // 사용자의 모든 UserKeyword 조회 (검색 내역만)
    const userKeywords = await prisma.userKeyword.findMany({
      where: {
        userId: user.id,
        source: 'search', // 검색으로 생성된 것만
      },
      include: {
        keyword: true,
      },
      orderBy: {
        searchedAt: 'desc',
      },
    })

    // 검색 내역과 즐겨찾기 분리
    const searchHistory: KeywordHistoryItem[] = []
    const favorites: KeywordHistoryItem[] = []

    userKeywords.forEach(uk => {
      const item: KeywordHistoryItem = {
        id: uk.id.toString(),
        keyword: uk.keyword.keyword,
        searchedAt: uk.searchedAt,
        productCount: uk.productCount,
        monthlySearchCount: uk.monthlySearchCount,
        isFavorite: uk.isBookMarked,
      }

      searchHistory.push(item)
    })

    // 즐겨찾기는 모든 source의 isBookMarked=true인 항목들을 별도로 조회
    const allFavorites = await prisma.userKeyword.findMany({
      where: {
        userId: user.id,
        isBookMarked: true,
      },
      include: {
        keyword: true,
      },
      orderBy: {
        searchedAt: 'desc',
      },
    })

    allFavorites.forEach(uk => {
      const item: KeywordHistoryItem = {
        id: uk.id.toString(),
        keyword: uk.keyword.keyword,
        searchedAt: uk.searchedAt,
        productCount: uk.productCount,
        monthlySearchCount: uk.monthlySearchCount,
        isFavorite: uk.isBookMarked,
      }
      favorites.push(item)
    })

    return {
      status: 'success',
      result: {
        searchHistory,
        favorites,
      },
    }
  } catch (error) {
    console.error('키워드 히스토리 조회 오류:', error)
    return {
      status: 'error',
      error: '키워드 히스토리를 불러오는데 실패했습니다.',
    }
  }
}

export async function toggleKeywordFavorite(keywordId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getServerUser()
    if (!user) {
      return {
        success: false,
        error: '인증이 필요합니다.',
      }
    }

    const userKeyword = await prisma.userKeyword.findFirst({
      where: {
        id: BigInt(keywordId),
        userId: user.id,
      },
    })

    if (!userKeyword) {
      return {
        success: false,
        error: '키워드를 찾을 수 없습니다.',
      }
    }

    await prisma.userKeyword.update({
      where: {
        id: BigInt(keywordId),
      },
      data: {
        isBookMarked: !userKeyword.isBookMarked,
      },
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('즐겨찾기 토글 오류:', error)
    return {
      success: false,
      error: '즐겨찾기 토글에 실패했습니다.',
    }
  }
}
