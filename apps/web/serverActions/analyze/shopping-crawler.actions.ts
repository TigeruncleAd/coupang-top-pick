'use server'

import { ShoppingCrawlerService } from '@/lib/analyze/shopping-crawler-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../src/app/api/auth/[...nextauth]/authOption'

export interface CrawlShoppingRequest {
  keyword: string
  saveToDb?: boolean
  saveParsedData?: boolean
}

export interface CrawlShoppingResponse {
  success: boolean
  message: string
  data?: {
    totalProducts: number
    savedProducts: number
    processingTime: number
    errors: string[]
  }
}

/**
 * 네이버 쇼핑 페이지 크롤링 및 데이터 저장
 */
export async function crawlShoppingPage(request: CrawlShoppingRequest): Promise<CrawlShoppingResponse> {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return {
        success: false,
        message: '로그인이 필요합니다.',
      }
    }

    const userId = BigInt((session.user as any).id)
    const { keyword, saveToDb = true, saveParsedData = true } = request

    // 크롤러 서비스 초기화
    const crawler = new ShoppingCrawlerService()

    try {
      // 크롤링 실행
      const result = await crawler.crawlShoppingPage({
        userId,
        keyword,
        saveToDb,
        saveParsedData,
        outputDir: process.cwd() + '/debug-html',
      })

      if (result.success) {
        return {
          success: true,
          message: `크롤링이 완료되었습니다. ${result.savedProducts}개 상품이 저장되었습니다.`,
          data: {
            totalProducts: result.totalProducts,
            savedProducts: result.savedProducts,
            processingTime: result.processingTime,
            errors: result.errors,
          },
        }
      } else {
        return {
          success: false,
          message: `크롤링 실패: ${result.errors.join(', ')}`,
          data: {
            totalProducts: result.totalProducts,
            savedProducts: result.savedProducts,
            processingTime: result.processingTime,
            errors: result.errors,
          },
        }
      }
    } finally {
      await crawler.cleanup()
    }
  } catch (error) {
    console.error('크롤링 서버 액션 오류:', error)
    return {
      success: false,
      message: `서버 오류: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * 기존 HTML 파일에서 데이터 추출 및 저장
 */
export async function processExistingHTML(
  htmlFilePath: string,
  keyword: string,
  options: { saveToDb?: boolean; saveParsedData?: boolean } = {},
): Promise<CrawlShoppingResponse> {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return {
        success: false,
        message: '로그인이 필요합니다.',
      }
    }

    const userId = BigInt((session.user as any).id)
    const { saveToDb = true, saveParsedData = true } = options

    // 크롤러 서비스 초기화
    const crawler = new ShoppingCrawlerService()

    try {
      // HTML 파일 처리
      const result = await crawler.processExistingHTML(userId, htmlFilePath, keyword, {
        saveToDb,
        saveParsedData,
        outputDir: process.cwd() + '/debug-html',
      })

      if (result.success) {
        return {
          success: true,
          message: `HTML 처리 완료. ${result.savedProducts}개 상품이 저장되었습니다.`,
          data: {
            totalProducts: result.totalProducts,
            savedProducts: result.savedProducts,
            processingTime: result.processingTime,
            errors: result.errors,
          },
        }
      } else {
        return {
          success: false,
          message: `HTML 처리 실패: ${result.errors.join(', ')}`,
          data: {
            totalProducts: result.totalProducts,
            savedProducts: result.savedProducts,
            processingTime: result.processingTime,
            errors: result.errors,
          },
        }
      }
    } finally {
      await crawler.cleanup()
    }
  } catch (error) {
    console.error('HTML 처리 서버 액션 오류:', error)
    return {
      success: false,
      message: `서버 오류: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * 사용자의 크롤링 데이터 조회
 */
export async function getUserCrawlingData() {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return {
        success: false,
        message: '로그인이 필요합니다.',
      }
    }

    const userId = BigInt((session.user as any).id)
    const crawler = new ShoppingCrawlerService()

    try {
      const data = await crawler.getUserData(userId)

      return {
        success: true,
        data: {
          products: data.products.slice(0, 20), // 최근 20개만
          malls: data.malls.slice(0, 10), // 최근 10개만
          logs: data.logs.slice(0, 10), // 최근 10개만
          stats: data.stats,
        },
      }
    } finally {
      await crawler.cleanup()
    }
  } catch (error) {
    console.error('사용자 데이터 조회 오류:', error)
    return {
      success: false,
      message: `서버 오류: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * 여러 키워드로 일괄 크롤링
 */
export async function crawlMultipleKeywords(
  keywords: string[],
  options: {
    saveToDb?: boolean
    saveParsedData?: boolean
    delayBetweenRequests?: number
  } = {},
): Promise<CrawlShoppingResponse> {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return {
        success: false,
        message: '로그인이 필요합니다.',
      }
    }

    const userId = BigInt((session.user as any).id)
    const { saveToDb = true, saveParsedData = true, delayBetweenRequests = 5000 } = options

    // 크롤러 서비스 초기화
    const crawler = new ShoppingCrawlerService()

    try {
      // 일괄 크롤링 실행
      const results = await crawler.crawlMultipleKeywords(userId, keywords, {
        saveToDb,
        saveParsedData,
        outputDir: process.cwd() + '/debug-html',
        delayBetweenRequests,
      })

      const totalProducts = results.reduce((sum, r) => sum + r.totalProducts, 0)
      const totalSaved = results.reduce((sum, r) => sum + r.savedProducts, 0)
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)
      const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0)
      const successCount = results.filter(r => r.success).length

      return {
        success: successCount > 0,
        message: `${keywords.length}개 키워드 중 ${successCount}개 성공. 총 ${totalSaved}개 상품 저장.`,
        data: {
          totalProducts,
          savedProducts: totalSaved,
          processingTime: totalTime,
          errors: results.flatMap(r => r.errors),
        },
      }
    } finally {
      await crawler.cleanup()
    }
  } catch (error) {
    console.error('일괄 크롤링 서버 액션 오류:', error)
    return {
      success: false,
      message: `서버 오류: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
