// AWS 콘솔에서 사용할 datalab-fetcher 함수 코드 (ES Modules)
export const handler = async (event, context) => {
  console.log('🚀 Lambda 함수 시작:', context.functionName)
  console.log('📥 이벤트:', JSON.stringify(event, null, 2))

  try {
    // 이벤트에서 페이지 정보 추출
    const lambdaEvent = event.body ? JSON.parse(event.body) : event

    if (!lambdaEvent.page) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({
          success: false,
          error: '페이지 번호가 필요합니다.',
        }),
      }
    }

    console.log(`📄 페이지 ${lambdaEvent.page} 처리 시작`)

    // DataLab API 호출
    const result = await fetchDataLabKeywords(lambdaEvent)

    console.log(`✅ 페이지 ${lambdaEvent.page} 처리 완료:`, result.success ? '성공' : '실패')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify(result),
    }
  } catch (error) {
    console.error('❌ Lambda 함수 실행 중 오류:', error)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      }),
    }
  }
}

// DataLab API 호출 함수
async function fetchDataLabKeywords(request) {
  const {
    page,
    categoryId = '50000000',
    smartStoreId = '50000000',
    timeUnit = 'date',
    startDate,
    endDate,
    gender = '',
    ageGroup = '',
    device = '',
    count = '20',
  } = request

  console.log(`🚀 페이지 ${page} 데이터랩 API 요청 시작...`)

  try {
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

    const finalStartDate = startDate || oneMonthAgo.toISOString().split('T')[0]
    const finalEndDate = endDate || today.toISOString().split('T')[0]

    // 요청 페이로드
    const formData = new URLSearchParams({
      cid: smartStoreId,
      timeUnit,
      startDate: finalStartDate,
      endDate: finalEndDate,
      age: ageGroup,
      gender: gender === 'all' ? '' : gender,
      device: device === 'all' ? '' : device,
      page: page.toString(),
      count,
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

    console.log(`📤 페이지 ${page} 요청 페이로드:`, formData.toString())

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
      console.log(`📥 페이지 ${page} 응답 상태:`, response.status)

      const responseText = await response.text()
      console.log(`📄 페이지 ${page} 응답 텍스트 (처음 200자):`, responseText.substring(0, 200))

      if (!response.ok) {
        console.error(`❌ 페이지 ${page} API 에러 응답:`, responseText)
        throw new Error(`DataLab API 요청 실패: ${response.status} ${response.statusText}`)
      }

      // JSON 파싱
      let responseData = null
      let htmlContent = undefined

      try {
        responseData = JSON.parse(responseText)
        console.log(`📊 페이지 ${page} JSON 응답 데이터:`, JSON.stringify(responseData, null, 2))
      } catch (jsonError) {
        console.log(`📄 페이지 ${page} 응답이 JSON이 아닙니다. HTML로 처리합니다.`)
        htmlContent = responseText

        if (
          responseText.includes('서비스 연결이 원활하지 않습니다') ||
          responseText.includes('errorResponsive_title') ||
          responseText.includes('일시적인 오류가 발생했습니다') ||
          responseText.includes('잠시 후 다시 시도해 주세요') ||
          responseText.includes('서비스 점검 중입니다')
        ) {
          console.error(`❌ 페이지 ${page} 네이버 서비스 에러 감지됨`)
          return {
            success: false,
            data: [],
            error: '네이버 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.',
            page,
            htmlContent,
          }
        }
      }

      // 키워드 데이터 파싱
      const keywords = []

      if (responseData && responseData.ranks && Array.isArray(responseData.ranks)) {
        console.log(`✅ 페이지 ${page}에서 ${responseData.ranks.length}개 키워드 발견`)

        responseData.ranks.forEach(item => {
          const keyword = item.keyword
          const rank = item.rank

          if (keyword && keyword.trim()) {
            keywords.push({
              keyword: keyword.trim(),
              searchCount: 0,
              rank: rank,
              trend: 'stable',
              trendText: '유지',
            })
          }
        })
      } else {
        console.warn(`⚠️ 페이지 ${page}에서 키워드를 찾을 수 없습니다.`)
      }

      console.log(`✅ 페이지 ${page}에서 ${keywords.length}개 키워드 추출 완료`)

      return {
        success: true,
        data: keywords,
        message: `페이지 ${page}에서 ${keywords.length}개의 키워드를 성공적으로 가져왔습니다.`,
        page,
        htmlContent,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error(`페이지 ${page} DataLab API 요청 타임아웃 (30초)`)
      }
      throw error
    }
  } catch (error) {
    console.error(`❌ 페이지 ${page} DataLab API 요청 실패:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      page,
    }
  }
}
