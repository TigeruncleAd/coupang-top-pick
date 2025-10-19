'use server'

import { DataLabKeyword } from './datalab.actions'

// Lambda 함수 URL (환경 변수에서 가져오거나 직접 설정)
const LAMBDA_FUNCTION_URL = process.env.DATALAB_ORCHESTRATOR_URL

export interface DataLabParallelRequest {
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

export interface DataLabParallelResponse {
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
 * 25개의 Lambda 함수를 사용하여 데이터랩 키워드를 병렬로 수집합니다
 */
export async function fetchDataLabKeywordsParallel(request: DataLabParallelRequest): Promise<DataLabParallelResponse> {
  try {
    console.log('🚀 DataLab 병렬 처리 시작:', request)

    // Lambda 함수 URL로 HTTP 요청
    const response = await fetch(LAMBDA_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryId: request.categoryId,
        smartStoreId: request.smartStoreId,
        timeUnit: request.timeUnit || 'date',
        startDate: request.startDate,
        endDate: request.endDate,
        gender: request.gender || '',
        ageGroup: request.ageGroup || '',
        device: request.device || '',
        count: request.count || '20',
        maxPages: request.maxPages || 25,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: DataLabParallelResponse = await response.json()

    console.log('✅ DataLab 병렬 처리 완료:', {
      success: result.success,
      totalPages: result.totalPages,
      successfulPages: result.successfulPages,
      failedPages: result.failedPages,
      keywordCount: result.data?.length || 0,
      processingTime: result.processingTime,
    })

    return result
  } catch (error) {
    console.error('❌ DataLab 병렬 처리 실패:', error)

    return {
      success: false,
      data: [],
      totalPages: 0,
      successfulPages: 0,
      failedPages: 0,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'],
      processingTime: 0,
      message: 'DataLab 병렬 처리 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 카테고리별 DataLab 키워드 병렬 수집
 */
export async function fetchDataLabKeywordsByCategoryParallel(
  categoryId: string,
  maxPages: number = 25,
): Promise<DataLabParallelResponse> {
  return fetchDataLabKeywordsParallel({
    categoryId,
    timeUnit: 'date',
    gender: '',
    ageGroup: '',
    device: '',
    count: '20',
    maxPages,
  })
}

/**
 * 전체 카테고리 DataLab 키워드 병렬 수집
 */
export async function fetchDataLabAllKeywordsParallel(maxPages: number = 25): Promise<DataLabParallelResponse> {
  return fetchDataLabKeywordsParallel({
    categoryId: '50000000', // 전체 카테고리
    timeUnit: 'date',
    gender: '',
    ageGroup: '',
    device: '',
    count: '20',
    maxPages,
  })
}

/**
 * 특정 기간의 DataLab 키워드 병렬 수집
 */
export async function fetchDataLabKeywordsByPeriodParallel(
  startDate: string,
  endDate: string,
  categoryId?: string,
  maxPages: number = 25,
): Promise<DataLabParallelResponse> {
  return fetchDataLabKeywordsParallel({
    categoryId: categoryId || '50000000',
    timeUnit: 'date',
    startDate,
    endDate,
    gender: '',
    ageGroup: '',
    device: '',
    count: '20',
    maxPages,
  })
}
