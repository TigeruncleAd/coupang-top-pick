'use server'

import { prisma } from '@repo/database'
import { fetchDataLabKeywordsSimpleParallel } from './datalab-simple-parallel.actions'
import { DataLabKeyword } from './datalab.actions'

export interface CategoryDataLabRequest {
  categoryLevels?: number[] // 처리할 카테고리 레벨 (예: [1, 2, 3, 4])
  maxPages?: number
  timeUnit?: 'date' | 'week' | 'month'
  startDate?: string
  endDate?: string
  gender?: 'm' | 'f' | 'all' | ''
  ageGroup?: string
  device?: 'pc' | 'mo' | 'all' | ''
  count?: string
  concurrencyLimit?: number // 동시 처리할 카테고리 수
}

export interface CategoryDataLabResult {
  categoryId: string
  categoryName: string
  smartStoreId: string
  level: number
  success: boolean
  keywordCount: number
  processingTime: number
  error?: string
  data?: DataLabKeyword[]
}

export interface AllCategoriesDataLabResponse {
  success: boolean
  totalCategories: number
  successfulCategories: number
  failedCategories: number
  totalKeywords: number
  totalProcessingTime: number
  results: CategoryDataLabResult[]
  errors?: string[]
  message?: string
}

/**
 * 모든 카테고리에 대해 데이터랩 키워드를 병렬로 수집합니다
 */
export async function fetchDataLabKeywordsForAllCategories(
  request: CategoryDataLabRequest = {},
): Promise<AllCategoriesDataLabResponse> {
  const startTime = Date.now()

  const {
    categoryLevels = [1, 2, 3, 4], // 기본적으로 모든 레벨 처리
    maxPages = 25,
    timeUnit = 'date',
    startDate,
    endDate,
    gender = '',
    ageGroup = '',
    device = '',
    count = '20',
    concurrencyLimit = 5, // 동시에 5개 카테고리씩 처리
  } = request

  console.log(`🚀 모든 카테고리 데이터랩 수집 시작: 레벨 ${categoryLevels.join(', ')}`)

  try {
    // 처리할 카테고리들 조회
    const categories = await getCategoriesToProcess(categoryLevels)
    console.log(`📊 처리할 카테고리 수: ${categories.length}개`)

    if (categories.length === 0) {
      return {
        success: false,
        totalCategories: 0,
        successfulCategories: 0,
        failedCategories: 0,
        totalKeywords: 0,
        totalProcessingTime: 0,
        results: [],
        message: '처리할 카테고리가 없습니다.',
      }
    }

    // 카테고리별 병렬 처리
    const results = await processCategoriesInBatches(
      categories,
      {
        maxPages,
        timeUnit,
        startDate,
        endDate,
        gender,
        ageGroup,
        device,
        count,
      },
      concurrencyLimit,
    )

    const totalProcessingTime = Date.now() - startTime
    const successfulCategories = results.filter(r => r.success).length
    const failedCategories = results.filter(r => !r.success).length
    const totalKeywords = results.reduce((sum, r) => sum + r.keywordCount, 0)
    const errors = results.filter(r => !r.success && r.error).map(r => r.error!)

    console.log(
      `✅ 모든 카테고리 처리 완료: ${successfulCategories}/${categories.length} 성공, ${totalKeywords}개 키워드`,
    )

    return {
      success: successfulCategories > 0,
      totalCategories: categories.length,
      successfulCategories,
      failedCategories,
      totalKeywords,
      totalProcessingTime,
      results,
      errors: errors.length > 0 ? errors : undefined,
      message: `총 ${categories.length}개 카테고리 중 ${successfulCategories}개 성공, ${failedCategories}개 실패 (${totalProcessingTime}ms 소요)`,
    }
  } catch (error) {
    const totalProcessingTime = Date.now() - startTime
    console.error('❌ 모든 카테고리 처리 실패:', error)

    return {
      success: false,
      totalCategories: 0,
      successfulCategories: 0,
      failedCategories: 0,
      totalKeywords: 0,
      totalProcessingTime,
      results: [],
      errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
      message: '모든 카테고리 처리 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 처리할 카테고리들을 조회합니다
 */
async function getCategoriesToProcess(levels: number[]) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        level: {
          in: levels,
        },
        smartStoreId: {
          not: '', // smartStoreId가 있는 카테고리만
        },
      },
      select: {
        id: true,
        name: true,
        fullName: true,
        smartStoreId: true,
        level: true,
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    })

    return categories.map(cat => ({
      id: cat.id.toString(),
      name: cat.name,
      fullName: cat.fullName,
      smartStoreId: cat.smartStoreId,
      level: cat.level,
    }))
  } catch (error) {
    console.error('❌ 카테고리 조회 실패:', error)
    return []
  }
}

/**
 * 카테고리들을 배치 단위로 처리합니다
 */
async function processCategoriesInBatches(
  categories: Array<{
    id: string
    name: string
    fullName: string
    smartStoreId: string
    level: number
  }>,
  request: {
    maxPages: number
    timeUnit: string
    startDate?: string
    endDate?: string
    gender: string
    ageGroup: string
    device: string
    count: string
  },
  batchSize: number,
): Promise<CategoryDataLabResult[]> {
  const results: CategoryDataLabResult[] = []

  // 카테고리를 배치 단위로 나누기
  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = categories.slice(i, i + batchSize)
    console.log(`📦 배치 ${Math.floor(i / batchSize) + 1} 처리 중: ${batch.length}개 카테고리`)

    // 배치 내에서 병렬 처리
    const batchPromises = batch.map(async category => {
      const categoryStartTime = Date.now()

      try {
        console.log(`🚀 카테고리 처리 시작: ${category.name} (${category.smartStoreId})`)

        const result = await fetchDataLabKeywordsSimpleParallel({
          categoryId: category.id,
          smartStoreId: category.smartStoreId,
          timeUnit: request.timeUnit as any,
          startDate: request.startDate,
          endDate: request.endDate,
          gender: request.gender as any,
          ageGroup: request.ageGroup,
          device: request.device as any,
          count: request.count,
          maxPages: request.maxPages,
        })

        const processingTime = Date.now() - categoryStartTime

        console.log(
          `✅ 카테고리 처리 완료: ${category.name} - ${result.successfulPages}/${result.totalPages} 페이지, ${result.data?.length || 0}개 키워드`,
        )

        return {
          categoryId: category.id,
          categoryName: category.name,
          smartStoreId: category.smartStoreId,
          level: category.level,
          success: result.success,
          keywordCount: result.data?.length || 0,
          processingTime,
          error: result.errors?.[0],
          data: result.data,
        }
      } catch (error) {
        const processingTime = Date.now() - categoryStartTime
        console.error(`❌ 카테고리 처리 실패: ${category.name}`, error)

        return {
          categoryId: category.id,
          categoryName: category.name,
          smartStoreId: category.smartStoreId,
          level: category.level,
          success: false,
          keywordCount: 0,
          processingTime,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        }
      }
    })

    try {
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      console.log(`✅ 배치 ${Math.floor(i / batchSize) + 1} 완료`)

      // 배치 간 잠시 대기 (API 제한 방지)
      if (i + batchSize < categories.length) {
        console.log('⏳ 다음 배치를 위해 2초 대기...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } catch (error) {
      console.error(`❌ 배치 ${Math.floor(i / batchSize) + 1} 처리 중 오류:`, error)

      // 실패한 배치의 카테고리들을 실패로 기록
      const failedResults: CategoryDataLabResult[] = batch.map(category => ({
        categoryId: category.id,
        categoryName: category.name,
        smartStoreId: category.smartStoreId,
        level: category.level,
        success: false,
        keywordCount: 0,
        processingTime: 0,
        error: error instanceof Error ? error.message : '배치 처리 중 오류',
      }))

      results.push(...failedResults)
    }
  }

  return results
}

/**
 * 1차 카테고리만 처리합니다
 */
export async function fetchDataLabKeywordsForMainCategories(
  request: Omit<CategoryDataLabRequest, 'categoryLevels'> = {},
): Promise<AllCategoriesDataLabResponse> {
  return fetchDataLabKeywordsForAllCategories({
    ...request,
    categoryLevels: [1],
  })
}

/**
 * 특정 레벨의 카테고리만 처리합니다
 */
export async function fetchDataLabKeywordsForLevel(
  level: number,
  request: Omit<CategoryDataLabRequest, 'categoryLevels'> = {},
): Promise<AllCategoriesDataLabResponse> {
  return fetchDataLabKeywordsForAllCategories({
    ...request,
    categoryLevels: [level],
  })
}

/**
 * 카테고리별 키워드를 데이터베이스에 저장합니다
 */
export async function saveCategoryKeywordsToDatabase(
  results: CategoryDataLabResult[],
): Promise<{ success: boolean; savedCount: number; message: string }> {
  try {
    let savedCount = 0

    for (const result of results) {
      if (result.success && result.data && result.data.length > 0) {
        try {
          // 기존 키워드 삭제 (해당 카테고리의 기존 데이터)
          await prisma.keyword.deleteMany({
            where: {
              categoryId: BigInt(result.categoryId),
            },
          })

          // 새 키워드들 저장
          const keywordData = result.data.map((keyword, index) => ({
            keyword: keyword.keyword,
            hashedKeyword: Buffer.from(keyword.keyword).toString('base64'),
            categoryId: BigInt(result.categoryId),
            productCount: 0,
            monthlySearchCount: keyword.searchCount,
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
            relatedKeywords: [],
            misc: {
              rank: keyword.rank,
              trend: keyword.trend,
              trendText: keyword.trendText,
            },
          }))

          await prisma.keyword.createMany({
            data: keywordData,
            skipDuplicates: true,
          })

          savedCount += keywordData.length
          console.log(`💾 카테고리 ${result.categoryName}에 ${keywordData.length}개 키워드 저장 완료`)
        } catch (error) {
          console.error(`❌ 카테고리 ${result.categoryName} 키워드 저장 실패:`, error)
        }
      }
    }

    return {
      success: true,
      savedCount,
      message: `총 ${savedCount}개 키워드를 데이터베이스에 저장했습니다.`,
    }
  } catch (error) {
    console.error('❌ 키워드 저장 실패:', error)
    return {
      success: false,
      savedCount: 0,
      message: '키워드 저장 중 오류가 발생했습니다.',
    }
  }
}
