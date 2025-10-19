// AWS 콘솔에서 사용할 datalab-orchestrator 함수 코드 (ES Modules)
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'

const lambdaClient = new LambdaClient({ region: 'ap-northeast-2' })

export const handler = async (event, context) => {
  const startTime = Date.now()
  console.log('🚀 DataLab 오케스트레이터 시작:', context.functionName)
  console.log('📥 이벤트:', JSON.stringify(event, null, 2))

  try {
    // 이벤트에서 요청 정보 추출
    const request = event.body ? JSON.parse(event.body) : event

    const maxPages = request.maxPages || 25
    const processingMode = request.processingMode || 'parallel'
    const concurrencyLimit = request.concurrencyLimit || 10

    console.log(`📊 처리 설정: ${maxPages}개 페이지, 모드: ${processingMode}`)

    let results = []

    if (processingMode === 'parallel') {
      // 완전 병렬 처리 (25개 동시 실행)
      results = await invokeAllPagesParallel(maxPages, request)
    } else if (processingMode === 'limited') {
      // 제한된 동시 실행 (API 제한 고려)
      results = await invokeWithConcurrencyLimit(maxPages, request, concurrencyLimit)
    } else {
      // 배치 처리
      results = await invokeInBatches(maxPages, request, 5)
    }

    // 결과 분석 및 통합
    const analysis = analyzeResults(results)
    const allKeywords = collectAllKeywords(results)

    const processingTime = Date.now() - startTime

    const response = {
      success: analysis.successfulPages > 0,
      data: allKeywords,
      totalPages: maxPages,
      successfulPages: analysis.successfulPages,
      failedPages: analysis.failedPages,
      errors: analysis.errors,
      processingTime,
      message: `총 ${maxPages}개 페이지 중 ${analysis.successfulPages}개 성공, ${analysis.failedPages}개 실패 (${processingTime}ms 소요)`,
    }

    console.log('✅ 오케스트레이터 완료:', response.message)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify(response),
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('❌ 오케스트레이터 실행 중 오류:', error)

    const errorResponse = {
      success: false,
      data: [],
      totalPages: 0,
      successfulPages: 0,
      failedPages: 0,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
      processingTime,
      message: '오케스트레이터 실행 중 오류가 발생했습니다.',
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify(errorResponse),
    }
  }
}

// 25개 페이지를 완전 병렬로 처리
async function invokeAllPagesParallel(maxPages, request) {
  console.log(`🚀 ${maxPages}개 페이지 완전 병렬 처리 시작`)

  const pages = Array.from({ length: maxPages }, (_, i) => i + 1)
  const promises = pages.map(page => invokeLambda(page, request))

  try {
    console.log(`⚡ ${promises.length}개 Lambda 함수 동시 실행`)
    const results = await Promise.all(promises)
    console.log(`✅ ${maxPages}개 페이지 완전 병렬 처리 완료`)
    return results
  } catch (error) {
    console.error('❌ 완전 병렬 처리 중 오류:', error)
    throw error
  }
}

// 제한된 동시 실행으로 처리
async function invokeWithConcurrencyLimit(maxPages, request, concurrencyLimit) {
  console.log(`🚀 ${maxPages}개 페이지를 최대 ${concurrencyLimit}개씩 병렬 처리 시작`)

  const pages = Array.from({ length: maxPages }, (_, i) => i + 1)
  const results = []
  const semaphore = new Semaphore(concurrencyLimit)

  const promises = pages.map(async page => {
    await semaphore.acquire()
    try {
      const result = await invokeLambda(page, request)
      results.push(result)
      return result
    } finally {
      semaphore.release()
    }
  })

  try {
    await Promise.all(promises)
    console.log(`✅ ${maxPages}개 페이지 제한 병렬 처리 완료`)
    return results
  } catch (error) {
    console.error('❌ 제한 병렬 처리 중 오류:', error)
    throw error
  }
}

// 배치 단위로 처리
async function invokeInBatches(maxPages, request, batchSize) {
  console.log(`🚀 ${maxPages}개 페이지를 ${batchSize}개씩 배치 처리 시작`)

  const pages = Array.from({ length: maxPages }, (_, i) => i + 1)
  const allResults = []

  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize)
    console.log(`📦 배치 ${Math.floor(i / batchSize) + 1} 처리 중: 페이지 ${batch.join(', ')}`)

    const batchPromises = batch.map(page => invokeLambda(page, request))

    try {
      const batchResults = await Promise.all(batchPromises)
      allResults.push(...batchResults)
      console.log(`✅ 배치 ${Math.floor(i / batchSize) + 1} 완료`)

      if (i + batchSize < pages.length) {
        console.log('⏳ 다음 배치를 위해 1초 대기...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error(`❌ 배치 ${Math.floor(i / batchSize) + 1} 처리 중 오류:`, error)

      const failedResults = batch.map(page => ({
        page,
        success: false,
        error: error instanceof Error ? error.message : '배치 처리 중 오류',
        responseTime: 0,
      }))

      allResults.push(...failedResults)
    }
  }

  console.log(`✅ 모든 배치 처리 완료: ${allResults.length}개 결과`)
  return allResults
}

// 단일 Lambda 함수 호출
async function invokeLambda(page, request) {
  const startTime = Date.now()

  try {
    console.log(`🚀 페이지 ${page} Lambda 호출 시작`)

    const payload = {
      page,
      categoryId: request.categoryId,
      smartStoreId: request.smartStoreId,
      timeUnit: request.timeUnit,
      startDate: request.startDate,
      endDate: request.endDate,
      gender: request.gender,
      ageGroup: request.ageGroup,
      device: request.device,
      count: request.count,
    }

    const command = new InvokeCommand({
      FunctionName: 'datalab-fetcher',
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload),
    })

    const response = await lambdaClient.send(command)
    const responseTime = Date.now() - startTime

    if (response.Payload) {
      // Lambda 응답 파싱
      const lambdaResponse = JSON.parse(Buffer.from(response.Payload).toString())
      console.log(`📥 Lambda 응답:`, {
        statusCode: lambdaResponse.statusCode,
        bodyLength: lambdaResponse.body ? lambdaResponse.body.length : 0,
      })

      // body 안의 JSON 파싱
      let result
      if (lambdaResponse.body) {
        try {
          result = JSON.parse(lambdaResponse.body)
        } catch (parseError) {
          console.error(`❌ JSON 파싱 실패:`, parseError)
          throw new Error('Lambda 응답 JSON 파싱 실패')
        }
      } else {
        throw new Error('Lambda 응답에 body가 없습니다')
      }

      console.log(`✅ 페이지 ${page} Lambda 호출 완료 (${responseTime}ms):`, result.success ? '성공' : '실패')
      console.log(`📊 수집된 키워드 수:`, result.data ? result.data.length : 0)

      return {
        page,
        success: result.success,
        data: result.data,
        error: result.error,
        responseTime,
      }
    } else {
      throw new Error('Lambda 응답이 비어있습니다.')
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`❌ 페이지 ${page} Lambda 호출 실패 (${responseTime}ms):`, error)

    return {
      page,
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      responseTime,
    }
  }
}

// 결과 분석
function analyzeResults(results) {
  const successfulPages = results.filter(r => r.success).length
  const failedPages = results.filter(r => !r.success).length
  const errors = results.filter(r => !r.success && r.error).map(r => `페이지 ${r.page}: ${r.error}`)

  return {
    successfulPages,
    failedPages,
    errors,
    success: successfulPages > 0,
  }
}

// 키워드 수집
function collectAllKeywords(results) {
  const allKeywords = []

  results
    .filter(r => r.success && r.data)
    .forEach(result => {
      if (result.data) {
        allKeywords.push(...result.data)
      }
    })

  // 중복 제거
  const uniqueKeywords = allKeywords.reduce((acc, keyword) => {
    const existing = acc.find(k => k.keyword === keyword.keyword)
    if (!existing) {
      acc.push(keyword)
    } else if (keyword.rank < existing.rank) {
      const index = acc.findIndex(k => k.keyword === keyword.keyword)
      acc[index] = keyword
    }
    return acc
  }, [])

  uniqueKeywords.sort((a, b) => a.rank - b.rank)

  console.log(`📊 총 ${allKeywords.length}개 키워드에서 ${uniqueKeywords.length}개 고유 키워드 수집`)

  return uniqueKeywords
}

// 세마포어 클래스
class Semaphore {
  constructor(permits) {
    this.permits = permits
    this.waiting = []
  }

  async acquire() {
    if (this.permits > 0) {
      this.permits--
      return
    }

    return new Promise(resolve => {
      this.waiting.push(resolve)
    })
  }

  release() {
    this.permits++
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()
      if (next) {
        this.permits--
        next()
      }
    }
  }
}
