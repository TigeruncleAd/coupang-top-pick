'use server'

import { DataLabKeyword } from './datalab.actions'

export interface DataLabSimpleParallelRequest {
  categoryId?: string
  smartStoreId?: string
  timeUnit?: 'date' | 'week' | 'month'
  startDate?: string
  endDate?: string
  gender?: 'm' | 'f' | 'all' | ''
  ageGroup?: string
  device?: 'pc' | 'mo' | 'all' | ''
  count?: string
  maxPages?: number
}

export interface DataLabSimpleParallelResponse {
  success: boolean
  data?: DataLabKeyword[]
  totalPages: number
  successfulPages: number
  failedPages: number
  errors?: string[]
  processingTime: number
  message?: string
}

/**
 * 현재 서버에서 25개 페이지를 병렬로 처리하는 간단한 방법
 * Lambda 없이 직접 병렬 처리
 */
export async function fetchDataLabKeywordsSimpleParallel(
  request: DataLabSimpleParallelRequest,
): Promise<DataLabSimpleParallelResponse> {
  const startTime = Date.now()
  const maxPages = request.maxPages || 25

  console.log(`🚀 DataLab 간단 병렬 처리 시작: ${maxPages}개 페이지`)

  try {
    // 25개 페이지를 동시에 처리
    const pages = Array.from({ length: maxPages }, (_, i) => i + 1)

    const promises = pages.map(async page => {
      try {
        // 기존 fetchDataLabKeywords 함수를 사용하되 페이지 번호만 변경
        const { fetchDataLabKeywords } = await import('./datalab.actions')

        const result = await fetchDataLabKeywords({
          ...request,
          page: page.toString(),
        })

        return {
          page,
          success: result.success,
          data: result.data,
          error: result.error,
        }
      } catch (error) {
        return {
          page,
          success: false,
          data: [],
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        }
      }
    })

    // 모든 페이지를 동시에 처리
    const results = await Promise.all(promises)
    const processingTime = Date.now() - startTime

    // 결과 분석
    const successfulPages = results.filter(r => r.success).length
    const failedPages = results.filter(r => !r.success).length
    const errors = results.filter(r => !r.success && r.error).map(r => `페이지 ${r.page}: ${r.error}`)

    // 모든 키워드 수집
    const allKeywords: DataLabKeyword[] = []
    results
      .filter(r => r.success && r.data)
      .forEach(result => {
        if (result.data) {
          allKeywords.push(...result.data)
        }
      })

    // 중복 제거 및 정렬
    const uniqueKeywords = allKeywords.reduce((acc, keyword) => {
      const existing = acc.find(k => k.keyword === keyword.keyword)
      if (!existing) {
        acc.push(keyword)
      } else if (keyword.rank < existing.rank) {
        const index = acc.findIndex(k => k.keyword === keyword.keyword)
        acc[index] = keyword
      }
      return acc
    }, [] as DataLabKeyword[])

    uniqueKeywords.sort((a, b) => a.rank - b.rank)

    console.log(`✅ 간단 병렬 처리 완료: ${successfulPages}/${maxPages} 페이지 성공, ${uniqueKeywords.length}개 키워드`)

    return {
      success: successfulPages > 0,
      data: uniqueKeywords,
      totalPages: maxPages,
      successfulPages,
      failedPages,
      errors: errors.length > 0 ? errors : undefined,
      processingTime,
      message: `총 ${maxPages}개 페이지 중 ${successfulPages}개 성공, ${failedPages}개 실패 (${processingTime}ms 소요)`,
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('❌ 간단 병렬 처리 실패:', error)

    return {
      success: false,
      data: [],
      totalPages: maxPages,
      successfulPages: 0,
      failedPages: maxPages,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
      processingTime,
      message: '간단 병렬 처리 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 카테고리별 DataLab 키워드 간단 병렬 수집
 */
export async function fetchDataLabKeywordsByCategorySimpleParallel(
  categoryId: string,
  maxPages: number = 25,
): Promise<DataLabSimpleParallelResponse> {
  return fetchDataLabKeywordsSimpleParallel({
    categoryId,
    timeUnit: 'date',
    gender: '',
    ageGroup: '',
    device: '',
    count: '20',
    maxPages,
  })
}
