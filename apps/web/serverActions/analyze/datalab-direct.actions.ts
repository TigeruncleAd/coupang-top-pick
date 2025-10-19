'use server'

import { prisma } from '@repo/database'

// Lambda 함수 URL 설정
const LAMBDA_DATALAB_SINGLE_URL = process.env.LAMBDA_DATALAB_SINGLE_URL

export interface DataLabDirectRequest {
  categoryId: string
  categoryName: string
  timeUnit?: 'date' | 'week' | 'month'
  startDate?: string
  endDate?: string
  gender?: 'm' | 'f' | 'all' | ''
  ageGroup?: string
  device?: 'pc' | 'mo' | 'all' | ''
  maxPages?: number
  startPage?: number
  endPage?: number
}

export interface DataLabDirectResponse {
  success: boolean
  data?: any[]
  totalKeywords: number
  totalPages: number
  successfulPages: number
  failedPages: number
  errors?: string[]
  processingTime: number
  message?: string
}

/**
 * 카테고리 조회 및 검증
 */
async function validateAndGetCategory(request: DataLabDirectRequest) {
  const category = await prisma.category.findFirst({
    where: {
      OR: [{ smartStoreId: request.categoryId }, { name: request.categoryName }, { id: BigInt(request.categoryId) }],
    },
  })

  if (!category) {
    throw new Error(`카테고리를 찾을 수 없습니다: ${request.categoryName}`)
  }

  return category
}

/**
 * 페이지 범위별 데이터 페칭 실행
 */
async function fetchMultiplePages(
  category: any,
  request: DataLabDirectRequest,
  startPage: number,
  endPage: number,
  maxPages: number,
) {
  const allKeywords: any[] = []
  let successfulPages = 0
  let failedPages = 0
  const errors: string[] = []

  for (let page = startPage; page <= endPage; page++) {
    try {
      const pageKeywords = await fetchSinglePageKeywords({
        page,
        categoryId: category.smartStoreId,
        timeUnit: request.timeUnit || 'date',
        startDate: request.startDate,
        endDate: request.endDate,
        gender: request.gender || '',
        ageGroup: request.ageGroup || '',
        device: request.device || '',
      })

      if (pageKeywords.length > 0) {
        allKeywords.push(...pageKeywords)
        successfulPages++
      } else {
      }
    } catch (error) {
      failedPages++
      const errorMsg = `페이지 ${page} 페칭 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      errors.push(errorMsg)
      console.error(`❌ ${errorMsg}`)
    }
  }

  return { allKeywords, successfulPages, failedPages, errors }
}

/**
 * 페칭 결과를 응답 형태로 변환
 */
function createResponse(
  success: boolean,
  allKeywords: any[],
  maxPages: number,
  successfulPages: number,
  failedPages: number,
  errors: string[],
  processingTime: number,
  errorMessage?: string,
): DataLabDirectResponse {
  if (success) {
    return {
      success: true,
      data: allKeywords,
      totalKeywords: allKeywords.length,
      totalPages: maxPages,
      successfulPages,
      failedPages,
      errors: errors.length > 0 ? errors : undefined,
      processingTime,
      message: `${allKeywords.length}개의 키워드를 성공적으로 페칭했습니다.`,
    }
  } else {
    return {
      success: false,
      data: [],
      totalKeywords: 0,
      totalPages: 0,
      successfulPages: 0,
      failedPages: 0,
      errors: [errorMessage || '알 수 없는 오류가 발생했습니다.'],
      processingTime,
      message: '데이터랩 페칭 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 데이터랩에서 직접 키워드를 페칭하고 DB에 저장합니다
 */
export async function fetchDataLabKeywordsDirect(request: DataLabDirectRequest): Promise<DataLabDirectResponse> {
  const startTime = Date.now()

  try {
    // 1. 카테고리 검증
    const category = await validateAndGetCategory(request)

    // 2. 페이지 범위 설정
    const maxPages = request.maxPages || 25
    const startPage = request.startPage || 1
    const endPage = request.endPage || maxPages

    // 3. 다중 페이지 페칭
    const { allKeywords, successfulPages, failedPages, errors } = await fetchMultiplePages(
      category,
      request,
      startPage,
      endPage,
      maxPages,
    )

    // 4. DB 저장
    if (allKeywords.length > 0) {
      await saveDataLabKeywordsToDB(category.id, allKeywords, request, request.categoryName)
    }

    const processingTime = Date.now() - startTime

    // 5. 응답 생성
    return createResponse(true, allKeywords, maxPages, successfulPages, failedPages, errors, processingTime)
  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    return createResponse(false, [], 0, 0, 0, [], processingTime, errorMessage)
  }
}

/**
 * fetchDataLabKeywordsDirect와 동일한 payload로 단일 페이지를 처리하는 함수
 */
export async function fetchDataLabKeywordsSinglePage(request: DataLabDirectRequest): Promise<DataLabDirectResponse> {
  const startTime = Date.now()

  try {
    // 1. 카테고리 검증
    const category = await validateAndGetCategory(request)

    // 2. 단일 페이지 처리 (startPage와 endPage가 같아야 함)
    const page = request.startPage || 1
    if (request.endPage && request.endPage !== page) {
      throw new Error('단일 페이지 처리에서는 startPage와 endPage가 같아야 합니다.')
    }

    // 3. Lambda 함수 URL이 설정되어 있으면 Lambda 사용, 아니면 직접 API 호출
    let keywords: any[] = []

    keywords = await fetchSinglePageKeywords({
      page,
      categoryId: category.smartStoreId,
      timeUnit: request.timeUnit || 'date',
      startDate: request.startDate,
      endDate: request.endDate,
      gender: request.gender || '',
      ageGroup: request.ageGroup || '',
      device: request.device || '',
    })

    // 4. DB 저장
    if (keywords.length > 0) {
      await saveDataLabKeywordsToDB(category.id, keywords, request, request.categoryName)
    }

    const processingTime = Date.now() - startTime

    // 5. 응답 생성
    return createResponse(true, keywords, 1, 1, 0, [], processingTime)
  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    console.error(`❌ fetchDataLabKeywordsSinglePage 에러:`, errorMessage)
    return createResponse(false, [], 0, 0, 1, [errorMessage], processingTime, errorMessage)
  }
}

/**
 * 단일 페이지 키워드 페칭 (Lambda 또는 직접 API 호출)
 */
async function fetchSinglePageKeywords(request: {
  page: number
  categoryId: string
  timeUnit: string
  startDate?: string
  endDate?: string
  gender: string
  ageGroup: string
  device: string
}): Promise<any[]> {
  // Lambda 함수 URL이 설정되어 있으면 Lambda 사용, 아니면 직접 API 호출
  if (LAMBDA_DATALAB_SINGLE_URL) {
    console.log(`🔗 Lambda URL 사용하여 페이지 ${request.page} 처리`)
    return await fetchWithLambda(request)
  } else {
    console.log(`🔗 직접 API 호출 사용하여 페이지 ${request.page} 처리`)
    return await fetchWithDirectAPI(request)
  }
}

/**
 * Lambda 함수를 통한 데이터랩 페칭
 */
async function fetchWithLambda(request: {
  page: number
  categoryId: string
  timeUnit: string
  startDate?: string
  endDate?: string
  gender: string
  ageGroup: string
  device: string
}): Promise<any[]> {
  try {
    console.log(`📈 Lambda를 통한 단일 페이지 ${request.page} 페칭 시작`)

    const lambdaPayload = {
      page: request.page,
      categoryId: request.categoryId,
      timeUnit: request.timeUnit,
      startDate: request.startDate,
      endDate: request.endDate,
      gender: request.gender,
      ageGroup: request.ageGroup,
      device: request.device,
    }

    const response = await fetch(LAMBDA_DATALAB_SINGLE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lambdaPayload),
    })

    if (!response.ok) {
      throw new Error(`Lambda 함수 호출 실패: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    // Lambda Function URL 응답 형식 처리
    let parsedResult
    if (result.body) {
      parsedResult = typeof result.body === 'string' ? JSON.parse(result.body) : result.body
    } else {
      parsedResult = result
    }

    if (!parsedResult.success) {
      throw new Error(parsedResult.error || 'Lambda 함수에서 오류 발생')
    }

    console.log(`✅ Lambda 페이지 ${request.page} 페칭 완료: ${parsedResult.keywords?.length || 0}개 키워드`)

    return parsedResult.keywords || []
  } catch (error) {
    console.error(`❌ Lambda 페이지 ${request.page} 페칭 실패:`, error)
    throw error
  }
}

/**
 * 직접 API 호출을 통한 데이터랩 페칭
 */
async function fetchWithDirectAPI(request: {
  page: number
  categoryId: string
  timeUnit: string
  startDate?: string
  endDate?: string
  gender: string
  ageGroup: string
  device: string
}): Promise<any[]> {
  const apiUrl = 'https://datalab.naver.com/shoppingInsight/getCategoryKeywordRank.naver'

  // 랜덤 User-Agent
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  ]
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]

  // 날짜 설정
  const today = new Date()
  const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())

  const finalStartDate = request.startDate || oneMonthAgo.toISOString().split('T')[0]
  const finalEndDate = request.endDate || today.toISOString().split('T')[0]

  // 요청 페이로드
  const formData = new URLSearchParams({
    cid: request.categoryId,
    timeUnit: request.timeUnit,
    startDate: finalStartDate,
    endDate: finalEndDate,
    age: request.ageGroup,
    gender: request.gender === 'all' ? '' : request.gender,
    device: request.device === 'all' ? '' : request.device,
    page: request.page.toString(),
    count: '20',
  })

  const formDataString = formData.toString()
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'ko,en;q=0.9,en-US;q=0.8,ja;q=0.7',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Content-Length': Buffer.byteLength(formDataString, 'utf8').toString(),
    Host: 'datalab.naver.com',
    Origin: 'https://datalab.naver.com',
    Referer: 'https://datalab.naver.com/shoppingInsight/sCategory.naver',
    'User-Agent': randomUserAgent,
    'X-Requested-With': 'XMLHttpRequest',
  }

  // API 요청
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: formDataString,
      signal: controller.signal,
      credentials: 'include',
      mode: 'cors',
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`DataLab API 요청 실패: ${response.status} ${response.statusText}`)
    }

    const responseText = await response.text()

    // 에러 체크
    if (
      responseText.includes('서비스 연결이 원활하지 않습니다') ||
      responseText.includes('errorResponsive_title') ||
      responseText.includes('일시적인 오류가 발생했습니다') ||
      responseText.includes('잠시 후 다시 시도해 주세요') ||
      responseText.includes('서비스 점검 중입니다')
    ) {
      throw new Error('네이버 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.')
    }

    // JSON 파싱
    let responseData = null
    try {
      responseData = JSON.parse(responseText)
    } catch (jsonError) {
      throw new Error('응답 데이터를 파싱할 수 없습니다.')
    }

    // 키워드 데이터 파싱
    const keywords: any[] = []

    if (responseData && responseData.ranks && Array.isArray(responseData.ranks)) {
      responseData.ranks.forEach((item: any) => {
        const keyword = item.keyword
        const rank = item.rank

        if (keyword && keyword.trim()) {
          keywords.push({
            keyword: keyword.trim(),
            rank: rank,
            searchCount: 0,
            trend: 'stable',
            trendText: '유지',
          })
        }
      })
    }

    return keywords
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`페이지 ${request.page} DataLab API 요청 타임아웃 (30초)`)
    }
    throw error
  }
}

/**
 * 데이터랩 키워드를 DB에 저장합니다
 */
async function saveDataLabKeywordsToDB(
  categoryId: bigint,
  keywords: any[],
  request: DataLabDirectRequest,
  categoryName: string,
): Promise<void> {
  try {
    // 연령대 정규화 (저장 시에도 동일하게 적용)
    const normalizedAgeGroup = request.ageGroup
      ? request.ageGroup
          .split(',')
          .map(age => age.trim())
          .sort((a, b) => parseInt(a) - parseInt(b))
          .join(',')
      : 'ALL'

    // 기존 ItemExploration 확인 (24시간 이내)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    let itemExploration = await prisma.itemExploration.findFirst({
      where: {
        categoryId,
        gender: request.gender === 'm' ? 'MALE' : request.gender === 'f' ? 'FEMALE' : 'ALL',
        age: normalizedAgeGroup,
        createdAt: {
          gte: oneDayAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 기존 ItemExploration이 없으면 새로 생성
    if (!itemExploration) {
      itemExploration = await prisma.itemExploration.create({
        data: {
          categoryId,
          device: request.device === 'pc' ? 'PC' : request.device === 'mo' ? 'MOBILE' : 'ALL',
          gender: request.gender === 'm' ? 'MALE' : request.gender === 'f' ? 'FEMALE' : 'ALL',
          age: normalizedAgeGroup,
          startDate: request.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: request.endDate || new Date().toISOString().split('T')[0],
        },
      })
    } else {
    }

    // 각 키워드에 대해 Keyword 레코드 생성 또는 조회
    for (const keywordData of keywords) {
      // Keyword 레코드 생성 또는 조회
      let keyword = await prisma.keyword.findUnique({
        where: {
          keyword: keywordData.keyword,
        },
      })

      if (!keyword) {
        keyword = await prisma.keyword.create({
          data: {
            keyword: keywordData.keyword,
            hashedKeyword: keywordData.keyword, // hashedKeyword는 keyword와 동일하게 설정
            categoryId: categoryId,
            monthlySearchCount: keywordData.searchCount || 0,
            productCount: 0,
            realTradeRatio: 0,
            overseasRatio: 0,
            adClickCompetitionRatio: 0,
            adClickCount: 0,
            adClickRatio: 0,
            adClickRatioMobile: 0,
            adClickRatioPC: 0,
            adPrice: 0,
            adPricePerClick: 0,
            adPricePerPrice: 0,
            bundleRatio: 0,
            coupangBundleRatio: 0,
            coupangOverseasRatio: 0,
            coupangProductAveragePrice: 0,
            coupangProductCompetitionScore: 0,
            coupangProductCount: 0,
            coupangRecentYearRatio: 0,
            coupangRocketProductCount: 0,
            coupangRocketProductRatio: 0,
            coupangeAverageReviewCount: 0,
            productCompetitionScore: 0,
            recentYearRatio: 0,
            top40AveragePrice: 0,
            top40Sales: 0,
            top40SalesCount: 0,
            top80AveragePrice: 0,
            top80Sales: 0,
            top80SalesCount: 0,
            mobileSearchCount: 0,
            pcSearchCount: 0,
            relatedKeywords: [],
            misc: {
              trend: keywordData.trend,
              trendText: keywordData.trendText,
            },
          } as any,
        })
      }

      // ItemKeyword 중복 확인 후 생성
      const existingItemKeyword = await prisma.itemKeyword.findFirst({
        where: {
          itemExplorationId: itemExploration.id,
          rank: keywordData.rank,
        },
      })

      if (!existingItemKeyword) {
        await prisma.itemKeyword.create({
          data: {
            itemExplorationId: itemExploration.id,
            keywordId: keyword.id,
            rank: keywordData.rank,
          },
        })
      } else {
      }
    }

    // 캐시 무효화 - 새로운 데이터가 저장되었으므로
    const periodType = request.timeUnit === 'week' ? 'WEEKLY' : 'DAILY'
    invalidateKeywordCache(categoryName, periodType, request.gender, normalizedAgeGroup)
  } catch (error) {
    console.error('❌ DB 저장 실패:', error)
    throw error
  }
}

// 카테고리별 키워드 캐시
const keywordCache = new Map<
  string,
  {
    keywords: any[]
    metadata: any
    cachedAt: number
  }
>()

/**
 * 카테고리의 전체 키워드 데이터를 캐시에서 조회하거나 DB에서 로드
 */
async function getOrLoadCategoryKeywords(
  categoryName: string,
  periodType: 'DAILY' | 'WEEKLY' = 'DAILY',
  gender?: string,
  ageGroup?: string,
) {
  // 연령대 정규화 (오름차순 정렬)
  const normalizedAgeGroup = ageGroup
    ? ageGroup
        .split(',')
        .map(age => age.trim())
        .sort((a, b) => parseInt(a) - parseInt(b))
        .join(',')
    : 'all'

  const cacheKey = `${categoryName}-${periodType}-${gender || 'all'}-${normalizedAgeGroup}`
  const cached = keywordCache.get(cacheKey)

  // 캐시가 있고 5분 이내라면 캐시 사용
  if (cached && Date.now() - cached.cachedAt < 5 * 60 * 1000) {
    return cached
  }

  const category = await prisma.category.findFirst({
    where: { name: categoryName },
  })

  if (!category) {
    throw new Error(`카테고리를 찾을 수 없습니다: ${categoryName}`)
  }

  const itemExploration = await prisma.itemExploration.findFirst({
    where: {
      categoryId: category.id,
      gender: gender === 'f' ? 'FEMALE' : gender === 'm' ? 'MALE' : 'ALL',
      age: normalizedAgeGroup === 'all' ? 'ALL' : normalizedAgeGroup,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      itemKeywords: {
        include: {
          keyword: true,
        },
        orderBy: {
          rank: 'asc',
        },
      },
    },
  })

  if (!itemExploration || !itemExploration.itemKeywords.length) {
    throw new Error('데이터랩 키워드 데이터가 없습니다.')
  }

  const keywords = itemExploration.itemKeywords.map(ik => ({
    keyword: ik.keyword.keyword,
    rank: ik.rank,
    searchCount: ik.keyword.monthlySearchCount,
    trend: (ik.keyword.misc as any)?.trend || 'stable',
    trendText: (ik.keyword.misc as any)?.trendText || '유지',
  }))

  const metadata = {
    categoryName,
    totalKeywords: itemExploration.itemKeywords.length,
    totalPages: Math.ceil(itemExploration.itemKeywords.length / 20),
    collectedAt: itemExploration.createdAt,
    device: itemExploration.device,
    gender: itemExploration.gender,
    age: itemExploration.age,
    startDate: itemExploration.startDate,
    endDate: itemExploration.endDate,
  }

  // 캐시에 저장
  const cacheData = {
    keywords,
    metadata,
    cachedAt: Date.now(),
  }
  keywordCache.set(cacheKey, cacheData)

  return cacheData
}

/**
 * 특정 페이지의 데이터랩 키워드 조회 (최적화된 버전)
 */
export async function getDataLabKeywordsByPage(
  categoryName: string,
  periodType: 'DAILY' | 'WEEKLY' = 'DAILY',
  page: number,
  gender?: string,
  ageGroup?: string,
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    // 1. 캐시에서 전체 키워드 데이터 로드 (최초 1회만 DB 조회)
    const cachedData = await getOrLoadCategoryKeywords(categoryName, periodType, gender, ageGroup)

    // 2. 해당 페이지의 랭크 범위 계산
    const expectedStartRank = (page - 1) * 20 + 1
    const expectedEndRank = page * 20

    // 3. 캐시된 키워드에서 해당 페이지 데이터만 필터링
    const pageKeywords = cachedData.keywords.filter(
      keyword => keyword.rank >= expectedStartRank && keyword.rank <= expectedEndRank,
    )

    const actualRanks = pageKeywords.map(k => k.rank).sort((a, b) => a - b)

    // 4. 해당 페이지에 데이터가 없으면 실패 반환 (데이터랩 페칭 유도)
    if (pageKeywords.length === 0) {
      return {
        success: false,
        error: `페이지 ${page}에 데이터가 없습니다. 데이터랩에서 페칭이 필요합니다.`,
      }
    }

    // 5. 데이터 신선도 확인 (24시간)
    const dataAge = Date.now() - new Date(cachedData.metadata.collectedAt).getTime()
    const isDataFresh = dataAge < 24 * 60 * 60 * 1000

    if (!isDataFresh) {
      return {
        success: false,
        error: `데이터가 오래되었습니다. 데이터랩에서 새로운 데이터를 가져오겠습니다.`,
      }
    }

    // 6. 성공 - 캐시된 데이터 반환

    return {
      success: true,
      data: {
        ...cachedData.metadata,
        keywords: pageKeywords,
        pageKeywords: pageKeywords.length,
        currentPage: page,
      },
    }
  } catch (error) {
    console.error('❌ 데이터랩 키워드 조회 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    }
  }
}

/**
 * 캐시 무효화 (새로운 데이터 저장 후 호출)
 */
function invalidateKeywordCache(
  categoryName: string,
  periodType: 'DAILY' | 'WEEKLY' = 'DAILY',
  gender?: string,
  ageGroup?: string,
) {
  // 연령대 정규화 (캐시 무효화 시에도 동일하게 적용)
  const normalizedAgeGroup =
    ageGroup && ageGroup !== 'ALL'
      ? ageGroup
          .split(',')
          .map(age => age.trim())
          .sort((a, b) => parseInt(a) - parseInt(b))
          .join(',')
      : 'all'

  const cacheKey = `${categoryName}-${periodType}-${gender || 'all'}-${normalizedAgeGroup}`
  keywordCache.delete(cacheKey)
}

/**
 * 카테고리별 데이터랩 키워드 조회 (전체)
 */
export async function getDataLabKeywords(
  categoryName: string,
  periodType: 'DAILY' | 'WEEKLY' = 'DAILY',
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const category = await prisma.category.findFirst({
      where: { name: categoryName },
    })

    if (!category) {
      return {
        success: false,
        error: `카테고리를 찾을 수 없습니다: ${categoryName}`,
      }
    }

    // 최근 ItemExploration 조회
    const itemExploration = await prisma.itemExploration.findFirst({
      where: {
        categoryId: category.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        itemKeywords: {
          include: {
            keyword: true,
          },
          orderBy: {
            rank: 'asc',
          },
        },
      },
    })

    if (!itemExploration) {
      return {
        success: false,
        error: '데이터랩 키워드 데이터가 없습니다.',
      }
    }

    return {
      success: true,
      data: {
        categoryName,
        keywords: itemExploration.itemKeywords.map(ik => ({
          keyword: ik.keyword.keyword,
          rank: ik.rank,
          searchCount: ik.keyword.monthlySearchCount,
          trend: (ik.keyword.misc as any)?.trend || 'stable',
          trendText: (ik.keyword.misc as any)?.trendText || '유지',
        })),
        totalKeywords: itemExploration.itemKeywords.length,
        collectedAt: itemExploration.createdAt,
        device: itemExploration.device,
        gender: itemExploration.gender,
        age: itemExploration.age,
        startDate: itemExploration.startDate,
        endDate: itemExploration.endDate,
      },
    }
  } catch (error) {
    console.error('❌ 데이터랩 키워드 조회 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    }
  }
}
