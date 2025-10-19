'use server'

// 네이버 DataLab API 관련 타입 정의
export interface DataLabKeyword {
  keyword: string
  searchCount: number
  rank: number
  trend: 'up' | 'down' | 'stable' | 'new'
  trendText: string
}

export interface DataLabResponse {
  success: boolean
  data?: DataLabKeyword[]
  error?: string
  message?: string
  requestInfo?: DataLabRequestInfo
  htmlContent?: string
}

export interface DataLabRequest {
  categoryId?: string // BigInt ID (DB의 Category.id)
  smartStoreId?: string // 네이버 스마트스토어 카테고리 ID (DataLab API용)
  timeUnit?: 'date' | 'week' | 'month'
  startDate?: string
  endDate?: string
  gender?: 'm' | 'f' | 'all' | ''
  ageGroup?: string
  device?: 'pc' | 'mo' | 'all' | ''
  page?: string
  count?: string
}

export interface DataLabRequestInfo {
  url: string
  method: string
  headers: Record<string, string>
  body: string
  timestamp: string
  responseStatus?: number
  responseHeaders?: Record<string, string>
  responseBody?: string
}

/**
 * 트렌드 값을 정규화하는 헬퍼 함수
 */
function normalizeTrend(trend: any): 'up' | 'down' | 'stable' | 'new' {
  if (!trend) return 'stable'

  const trendStr = String(trend).toLowerCase()

  if (trendStr.includes('up') || trendStr.includes('상승') || trendStr.includes('증가')) {
    return 'up'
  } else if (trendStr.includes('down') || trendStr.includes('하락') || trendStr.includes('감소')) {
    return 'down'
  } else if (trendStr.includes('new') || trendStr.includes('신규') || trendStr.includes('새로운')) {
    return 'new'
  } else {
    return 'stable'
  }
}

/**
 * 네이버 DataLab API에서 인기검색어 데이터를 가져옵니다
 */
export async function fetchDataLabKeywords(request: DataLabRequest): Promise<DataLabResponse> {
  // Prisma 클라이언트 import
  const { prisma } = await import('@repo/database')
  // DataLab API 엔드포인트 - 실제 API 엔드포인트로 수정
  const apiUrl = 'https://datalab.naver.com/shoppingInsight/getCategoryKeywordRank.naver'

  // smartStoreId 조회 (categoryId가 제공된 경우)
  let smartStoreId = request.smartStoreId || '50000000' // 기본값: 전체 카테고리

  if (request.categoryId && request.categoryId !== '1') {
    try {
      const category = await prisma.category.findUnique({
        where: { id: BigInt(request.categoryId) },
        select: { smartStoreId: true },
      })

      if (category && category.smartStoreId) {
        smartStoreId = category.smartStoreId
        console.log(`🔍 카테고리 ID ${request.categoryId}의 smartStoreId: ${smartStoreId}`)
      } else {
        console.warn(`⚠️ 카테고리 ID ${request.categoryId}의 smartStoreId를 찾을 수 없습니다. 기본값 사용.`)
      }
    } catch (error) {
      console.error('❌ smartStoreId 조회 실패:', error)
    }
  }

  // 랜덤 User-Agent 생성
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
  ]
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]

  // 요청 페이로드 설정 - x-www-form-urlencoded 형식으로 수정
  const today = new Date()
  const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())

  const formData = new URLSearchParams({
    cid: smartStoreId, // 카테고리의 smartStoreId 사용
    timeUnit: request.timeUnit || 'date',
    startDate: request.startDate || oneMonthAgo.toISOString().split('T')[0], // 한달 전
    endDate: request.endDate || today.toISOString().split('T')[0], // 오늘
    age: request.ageGroup || '',
    gender: request.gender === 'all' ? '' : request.gender || '', // 'all'을 빈 문자열로 변환
    device: request.device === 'all' ? '' : request.device || '', // 'all'을 빈 문자열로 변환
    page: request.page || '2',
    count: request.count || '20', // 최대 20개
  })

  // 요청 헤더 설정 - 서버 사이드 fetch에서는 Host와 Content-Length 직접 설정 필요
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

  // 요청 정보 저장 (Postman 비교용) - 함수 시작 부분에서 생성
  const requestInfo: DataLabRequestInfo = {
    url: apiUrl,
    method: 'POST',
    headers,
    body: formDataString,
    timestamp: new Date().toISOString(),
  }

  try {
    console.log('🔍 DataLab API 요청:', request)
    console.log('📤 DataLab API 페이로드:', formData.toString())
    console.log('🌐 요청 URL:', apiUrl)
    console.log('📋 요청 헤더:', headers)

    // API 요청 - 타임아웃 및 재시도 로직 추가
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30초 타임아웃

    console.log('🚀 DataLab API 요청 시작...')

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: formDataString, // 문자열로 전송 (Content-Length와 일치)
        signal: controller.signal,
        // 서버 사이드 fetch 설정
        credentials: 'include', // 쿠키 포함
        mode: 'cors',
        redirect: 'follow',
      })

      clearTimeout(timeoutId)
      console.log('📥 DataLab API 응답 상태:', response.status)
      console.log('📥 DataLab API 응답 헤더:', Object.fromEntries(response.headers.entries()))

      // 응답을 텍스트로 먼저 받아서 HTML인지 JSON인지 확인
      const responseText = await response.text()
      console.log('📄 응답 텍스트 (처음 500자):', responseText.substring(0, 500))

      if (!response.ok) {
        console.error('❌ DataLab API 에러 응답:', responseText)
        console.error('❌ 응답 상태:', response.status, response.statusText)
        throw new Error(`DataLab API 요청 실패: ${response.status} ${response.statusText} - ${responseText}`)
      }

      console.log('✅ DataLab API 응답 성공!')

      let responseData: any = null
      let htmlContent: string | undefined = undefined

      try {
        // JSON 파싱 시도
        responseData = JSON.parse(responseText)
        console.log('📊 DataLab API 응답 데이터 (JSON):', JSON.stringify(responseData, null, 2))
      } catch (jsonError) {
        // JSON이 아니면 HTML로 처리
        console.log('📄 응답이 JSON이 아닙니다. HTML로 처리합니다.')
        htmlContent = responseText
        console.log('📄 HTML 응답 길이:', responseText.length, '자')

        // HTML 응답에서 에러 메시지 감지
        if (
          responseText.includes('서비스 연결이 원활하지 않습니다') ||
          responseText.includes('errorResponsive_title') ||
          responseText.includes('일시적인 오류가 발생했습니다') ||
          responseText.includes('잠시 후 다시 시도해 주세요') ||
          responseText.includes('서비스 점검 중입니다')
        ) {
          console.error('❌ 네이버 서비스 에러 감지됨')
          return {
            success: false,
            data: [],
            error: '네이버 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.',
            requestInfo: {
              ...requestInfo,
              responseStatus: response.status,
              responseHeaders: Object.fromEntries(response.headers.entries()),
              responseBody: responseText,
            },
            htmlContent,
          }
        }
      }

      // 응답 데이터 파싱 및 변환
      const keywords: DataLabKeyword[] = []

      // JSON 응답이 있는 경우에만 키워드 파싱
      if (responseData) {
        console.log('🔍 응답 데이터 구조 분석 중...')
        console.log('📊 응답 데이터:', JSON.stringify(responseData, null, 2))

        // DataLab API 응답 구조: { ranks: [{ rank, keyword, linkId }] }
        if (responseData.ranks && Array.isArray(responseData.ranks)) {
          console.log('✅ responseData.ranks에서 배열 발견:', responseData.ranks.length, '개 항목')

          responseData.ranks.forEach((item: any) => {
            const keyword = item.keyword
            const rank = item.rank

            if (keyword && keyword.trim()) {
              keywords.push({
                keyword: keyword.trim(),
                searchCount: 0, // DataLab API에서는 검색량 정보를 제공하지 않음
                rank: rank,
                trend: 'stable', // 기본값
                trendText: '유지', // 기본값
              })
            }
          })
        } else {
          console.warn('⚠️ responseData.ranks를 찾을 수 없습니다. 응답 구조:', Object.keys(responseData))
        }
      }

      console.log(`✅ DataLab에서 ${keywords.length}개의 키워드 추출 완료`)

      return {
        success: true,
        data: keywords,
        message: `${keywords.length}개의 인기검색어를 성공적으로 가져왔습니다.`,
        requestInfo: {
          ...requestInfo,
          responseStatus: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          responseBody: responseText,
        },
        htmlContent,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('DataLab API 요청 타임아웃 (30초)')
      }
      throw error
    }
  } catch (error) {
    console.error('❌ DataLab API 요청 실패:', error)

    // 에러 메시지에서 HTML 추출 시도
    let htmlContent: string | undefined = undefined
    if (error instanceof Error && error.message.includes('DataLab API 요청 실패:')) {
      const errorParts = error.message.split(' - ')
      if (errorParts.length > 1) {
        htmlContent = errorParts[1]
        console.log('📄 에러에서 HTML 추출:', htmlContent.substring(0, 200))
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      requestInfo: {
        ...requestInfo,
        responseBody: htmlContent || error instanceof Error ? error.message : '알 수 없는 오류',
      },
      htmlContent,
    }
  }
}

/**
 * 카테고리별 DataLab 키워드 조회
 */
export async function fetchDataLabKeywordsByCategory(categoryId: string): Promise<DataLabResponse> {
  return fetchDataLabKeywords({
    categoryId,
    timeUnit: 'date',
    gender: '',
    ageGroup: '',
    device: '',
    page: '2',
    count: '20',
  })
}

/**
 * 전체 카테고리 DataLab 키워드 조회
 */
export async function fetchDataLabAllKeywords(): Promise<DataLabResponse> {
  return fetchDataLabKeywords({
    categoryId: '50000000', // 전체 카테고리
    timeUnit: 'date',
    gender: '',
    ageGroup: '',
    device: '',
    page: '2',
    count: '20',
  })
}

/**
 * 특정 기간의 DataLab 키워드 조회
 */
export async function fetchDataLabKeywordsByPeriod(
  startDate: string,
  endDate: string,
  categoryId?: string,
): Promise<DataLabResponse> {
  return fetchDataLabKeywords({
    categoryId: categoryId || '50000000',
    timeUnit: 'date',
    startDate,
    endDate,
    gender: '',
    ageGroup: '',
    device: '',
    page: '2',
    count: '20',
  })
}

/**
 * 성별/연령대별 DataLab 키워드 조회
 */
export async function fetchDataLabKeywordsByDemographics(
  gender: 'm' | 'f' | 'all' | '',
  ageGroup: string,
  categoryId?: string,
): Promise<DataLabResponse> {
  return fetchDataLabKeywords({
    categoryId: categoryId || '50000000',
    timeUnit: 'date',
    gender,
    ageGroup,
    device: '',
    page: '2',
    count: '20',
  })
}

/**
 * 디바이스별 DataLab 키워드 조회
 */
export async function fetchDataLabKeywordsByDevice(
  device: 'pc' | 'mo' | 'all' | '',
  categoryId?: string,
): Promise<DataLabResponse> {
  return fetchDataLabKeywords({
    categoryId: categoryId || '50000000',
    timeUnit: 'date',
    gender: '',
    ageGroup: '',
    device,
    page: '2',
    count: '20',
  })
}
