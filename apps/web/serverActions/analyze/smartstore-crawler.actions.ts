'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '../../src/app/api/auth/[...nextauth]/authOption'
import { SmartStoreCrawlerService } from '@/lib/analyze/smartstore-crawler-service'

const smartStoreCrawlerService = new SmartStoreCrawlerService()

/**
 * 스마트스토어 베스트 데이터 크롤링
 */
export async function crawlSmartStoreBestData(categoryName?: string): Promise<{
  success: boolean
  message: string
  data?: any
  error?: string
}> {
  try {
    // 임시 사용자 ID 사용 (개발/테스트용)
    const userId = BigInt(1) // 임시 사용자 ID

    console.log(`🚀 네이버 베스트 키워드 크롤링 시작 (임시 사용자: ${userId})`)

    const result = await smartStoreCrawlerService.crawlSmartStoreBestData(userId, categoryName)

    if (result.success) {
      console.log(`✅ 네이버 베스트 키워드 크롤링 완료: ${result.data?.keywords.length || 0}개 키워드`)
    } else {
      console.error(`❌ 네이버 베스트 키워드 크롤링 실패: ${result.error}`)
    }

    return result
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('네이버 베스트 키워드 크롤링 서버 액션 실패:', errorMsg)

    return {
      success: false,
      message: '네이버 베스트 키워드 크롤링 중 오류가 발생했습니다.',
      error: errorMsg,
    }
  }
}

/**
 * 특정 URL의 스마트스토어 데이터 크롤링
 */
export async function crawlSmartStoreSpecificUrl(url: string): Promise<{
  success: boolean
  message: string
  data?: any
  error?: string
}> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return {
        success: false,
        message: '로그인이 필요합니다.',
        error: 'Unauthorized',
      }
    }

    const userId = BigInt((session.user as any).id)

    // URL 유효성 검사
    if (!url || !url.includes('smartstore.naver.com')) {
      return {
        success: false,
        message: '유효한 스마트스토어 URL이 아닙니다.',
        error: 'Invalid URL',
      }
    }

    console.log(`🚀 특정 스마트스토어 URL 크롤링 시작: ${url}`)

    const result = await smartStoreCrawlerService.crawlSpecificUrl(url, userId)

    if (result.success) {
      console.log(`✅ 특정 URL 크롤링 완료: ${result.data?.products.length || 0}개 상품`)
    } else {
      console.error(`❌ 특정 URL 크롤링 실패: ${result.error}`)
    }

    return result
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('특정 URL 크롤링 서버 액션 실패:', errorMsg)

    return {
      success: false,
      message: '특정 URL 크롤링 중 오류가 발생했습니다.',
      error: errorMsg,
    }
  }
}

/**
 * 사용자별 스마트스토어 데이터 조회
 */
export async function getSmartStoreUserData(): Promise<{
  success: boolean
  data?: {
    products: any[]
    malls: any[]
    logs: any[]
    keywords: any[]
  }
  error?: string
}> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const userId = BigInt((session.user as any).id)

    const data = await smartStoreCrawlerService.getUserSmartStoreData(userId)

    return {
      success: true,
      data,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('스마트스토어 사용자 데이터 조회 실패:', errorMsg)

    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * 스마트스토어 크롤링 통계 조회
 */
export async function getSmartStoreCrawlingStats(): Promise<{
  success: boolean
  data?: {
    totalProducts: number
    totalMalls: number
    totalKeywords: number
    lastCrawledAt?: Date
    categories: string[]
  }
  error?: string
}> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const userId = BigInt((session.user as any).id)

    const stats = await smartStoreCrawlerService.getSmartStoreCrawlingStats(userId)

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('스마트스토어 크롤링 통계 조회 실패:', errorMsg)

    return {
      success: false,
      error: errorMsg,
    }
  }
}
