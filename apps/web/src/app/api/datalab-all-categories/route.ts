import { NextRequest, NextResponse } from 'next/server'
import {
  fetchDataLabKeywordsForAllCategories,
  saveCategoryKeywordsToDatabase,
} from '@/serverActions/analyze/datalab-all-categories.actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('🚀 모든 카테고리 DataLab 병렬 처리 API 호출:', body)

    // 모든 카테고리에 대해 데이터랩 키워드 수집
    const result = await fetchDataLabKeywordsForAllCategories({
      categoryLevels: body.categoryLevels || [1, 2, 3, 4],
      maxPages: body.maxPages || 25,
      timeUnit: body.timeUnit || 'date',
      startDate: body.startDate,
      endDate: body.endDate,
      gender: body.gender || '',
      ageGroup: body.ageGroup || '',
      device: body.device || '',
      count: body.count || '20',
      concurrencyLimit: body.concurrencyLimit || 5,
    })

    // 데이터베이스에 저장 (옵션)
    if (body.saveToDatabase && result.success) {
      console.log('💾 키워드를 데이터베이스에 저장 중...')
      const saveResult = await saveCategoryKeywordsToDatabase(result.results)
      console.log('💾 저장 결과:', saveResult.message)
    }

    console.log('✅ 모든 카테고리 DataLab 병렬 처리 완료:', {
      success: result.success,
      totalCategories: result.totalCategories,
      successfulCategories: result.successfulCategories,
      failedCategories: result.failedCategories,
      totalKeywords: result.totalKeywords,
      totalProcessingTime: result.totalProcessingTime,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ 모든 카테고리 DataLab 병렬 처리 API 오류:', error)

    return NextResponse.json(
      {
        success: false,
        totalCategories: 0,
        successfulCategories: 0,
        failedCategories: 0,
        totalKeywords: 0,
        totalProcessingTime: 0,
        results: [],
        errors: [error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'],
        message: '모든 카테고리 처리 중 오류가 발생했습니다.',
      },
      { status: 500 },
    )
  }
}
