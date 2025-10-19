'use server'

import { HTMLDumper } from '@/lib/analyze/html-dumper'
import fs from 'fs'
import path from 'path'

export interface BestDumpResult {
  success: boolean
  message: string
  data?: {
    totalKeywords: number
    totalCategories: number
    processingTime: number
    results: {
      url: string
      title: string
      success: boolean
      keywordsCount: number
      error?: string
    }[]
  }
}

/**
 * 네이버 베스트 키워드 페이지 덤프
 */
export async function dumpNaverBestKeywords(): Promise<BestDumpResult> {
  const startTime = Date.now()
  const dumper = new HTMLDumper()

  try {
    await dumper.initialize()

    const urls = [
      {
        url: 'https://smartstore.naver.com/category/best',
        title: '스마트스토어 전체 베스트',
        type: 'smartstore_best',
      },
      {
        url: 'https://smartstore.naver.com/category/best?categoryId=50000000',
        title: '스마트스토어 패션 베스트',
        type: 'smartstore_fashion',
      },
      {
        url: 'https://smartstore.naver.com/category/best?categoryId=50000001',
        title: '스마트스토어 뷰티 베스트',
        type: 'smartstore_beauty',
      },
      {
        url: 'https://smartstore.naver.com/category/best?categoryId=50000002',
        title: '스마트스토어 디지털 베스트',
        type: 'smartstore_digital',
      },
      {
        url: 'https://smartstore.naver.com/category/best?categoryId=50000003',
        title: '스마트스토어 홈인테리어 베스트',
        type: 'smartstore_home',
      },
    ]

    const results = []
    let totalKeywords = 0
    let totalCategories = 0

    for (const { url, title, type } of urls) {
      try {
        console.log(`🔍 덤프 시작: ${title}`)

        const dumpResult = await dumper.dumpPage(url, `smartstore-best-${type}`)

        if (dumpResult.success) {
          // HTML 파일에서 키워드 수 추출
          const keywordsCount = await extractKeywordsCount(dumpResult.htmlPath)
          totalKeywords += keywordsCount
          totalCategories += 1

          results.push({
            url,
            title,
            success: true,
            keywordsCount,
          })

          console.log(`✅ ${title} 완료: ${keywordsCount}개 키워드`)
        } else {
          results.push({
            url,
            title,
            success: false,
            keywordsCount: 0,
            error: dumpResult.error,
          })

          console.log(`❌ ${title} 실패: ${dumpResult.error}`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        results.push({
          url,
          title,
          success: false,
          keywordsCount: 0,
          error: errorMsg,
        })

        console.error(`❌ ${title} 오류:`, errorMsg)
      }

      // 요청 간 지연 (3-5초)
      if (urls.indexOf({ url, title, type }) < urls.length - 1) {
        const delay = Math.random() * 2000 + 3000 // 3-5초
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    const processingTime = Date.now() - startTime
    const successCount = results.filter(r => r.success).length

    return {
      success: successCount > 0,
      message: `${urls.length}개 페이지 중 ${successCount}개 성공. 총 ${totalKeywords}개 키워드 수집.`,
      data: {
        totalKeywords,
        totalCategories,
        processingTime,
        results,
      },
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : String(error)

    console.error('베스트 키워드 덤프 실패:', errorMsg)

    return {
      success: false,
      message: `덤프 실패: ${errorMsg}`,
      data: {
        totalKeywords: 0,
        totalCategories: 0,
        processingTime,
        results: [],
      },
    }
  } finally {
    await dumper.close()
  }
}

/**
 * HTML 파일에서 키워드 수 추출
 */
async function extractKeywordsCount(htmlPath: string): Promise<number> {
  try {
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

    // 간단한 키워드 수 추출 (실제 구조에 따라 조정 필요)
    const keywordMatches = htmlContent.match(/class="[^"]*keyword[^"]*"/g) || []
    const titleMatches = htmlContent.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/g) || []

    // 더 정확한 추출을 위해 특정 선택자들을 찾아보기
    const listItems = htmlContent.match(/<li[^>]*>.*?<\/li>/g) || []
    const linkItems = htmlContent.match(/<a[^>]*href[^>]*>.*?<\/a>/g) || []

    // 추정 키워드 수 (실제 구조 분석 후 조정)
    const estimatedCount = Math.max(
      keywordMatches.length,
      titleMatches.length,
      listItems.length / 2, // 리스트 아이템의 절반 정도가 키워드일 것으로 추정
      linkItems.length / 3, // 링크의 1/3 정도가 키워드일 것으로 추정
    )

    return Math.min(estimatedCount, 100) // 최대 100개로 제한
  } catch (error) {
    console.error('키워드 수 추출 실패:', error)
    return 0
  }
}
