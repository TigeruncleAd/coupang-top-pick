'use server'

import { getHTMLDumper, DumpResult } from '@/lib/analyze/html-dumper'
import { prisma } from '@repo/database'

/**
 * 단일 URL HTML 덤프
 */
export async function dumpSinglePage(url: string, categoryName: string): Promise<DumpResult> {
  const dumper = getHTMLDumper()

  try {
    await dumper.initialize()
    const result = await dumper.dumpPage(url, categoryName)
    return result
  } catch (error) {
    console.error('HTML 덤프 실패:', error)
    throw error
  } finally {
    await dumper.close()
  }
}

/**
 * DB에서 레벨 1 카테고리들 가져오기
 */
export async function getLevel1Categories(): Promise<{ id: string; name: string }[]> {
  try {
    const categories = await prisma.category.findMany({
      where: {
        level: 1,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return categories.map(cat => ({
      id: cat.id.toString(),
      name: cat.name,
    }))
  } catch (error) {
    console.error('카테고리 조회 실패:', error)
    return []
  }
}

/**
 * 카테고리별 네이버 쇼핑 URL 생성
 */
function generateCategoryUrls(
  categories: { id: string; name: string }[],
): Array<{ url: string; categoryName: string }> {
  const urls = [
    {
      url: 'https://shopping.naver.com/home',
      categoryName: '전체_메인',
    },
  ]

  // 각 카테고리별 검색 URL 추가 (실제 브라우저와 동일한 구조)
  categories.forEach(category => {
    const encodedName = encodeURIComponent(category.name)
    urls.push({
      url: `https://search.shopping.naver.com/search/all?query=${encodedName}&vertical=search`,
      categoryName: category.name,
    })
  })

  return urls
}

/**
 * 지연 함수
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 랜덤 지연 함수 (더 자연스러운 패턴)
 */
function randomDelay(min: number = 5000, max: number = 15000): Promise<void> {
  const delay = Math.random() * (max - min) + min
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * IP 로테이션을 위한 프록시 목록 (실제 사용 시 유료 프록시 서비스 권장)
 */
const PROXY_LIST: string[] = [
  // 실제 사용 시 유료 프록시 서비스의 프록시 목록을 여기에 추가
  // 예: 'http://proxy1.example.com:8080', 'http://proxy2.example.com:8080'
]

/**
 * 랜덤 프록시 선택
 */
function getRandomProxy(): string | undefined {
  if (PROXY_LIST.length === 0) return undefined
  return PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)]
}

/**
 * 네이버 쇼핑 주요 URL들 덤프 (지연 시간 포함)
 */
export async function dumpNaverShoppingPages(): Promise<DumpResult[]> {
  const dumper = getHTMLDumper()

  // DB에서 레벨 1 카테고리들 가져오기
  const categories = await getLevel1Categories()
  const urls = generateCategoryUrls(categories)

  console.log(`📋 총 ${urls.length}개 페이지 덤프 시작 (각 페이지마다 30초-2분 랜덤 대기)`)

  try {
    await dumper.initialize()
    const results: DumpResult[] = []

    // 각 URL을 순차적으로 처리 (10초 간격)
    for (let i = 0; i < urls.length; i++) {
      const urlInfo = urls[i]
      if (!urlInfo) continue

      console.log(`🔄 [${i + 1}/${urls.length}] ${urlInfo.categoryName} 덤프 중...`)

      try {
        const result = await dumper.dumpPage(urlInfo.url, urlInfo.categoryName)
        results.push(result)
        console.log(`✅ ${urlInfo.categoryName} 덤프 완료`)

        // 마지막 페이지가 아니면 랜덤 대기 (30초-2분)
        if (i < urls.length - 1) {
          const waitTime = Math.random() * 90000 + 30000 // 30초-2분
          console.log(`⏳ ${Math.round(waitTime / 1000)}초 대기 중... (캡챠 방지)`)
          await randomDelay(30000, 120000)
        }
      } catch (error) {
        console.error(`❌ ${urlInfo.categoryName} 덤프 실패:`, error)
        results.push({
          url: urlInfo.url,
          title: '',
          htmlPath: '',
          analysisPath: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          pageInfo: {
            isBlocked: true,
            hasContent: false,
            bodyLength: 0,
            selectors: {
              dataTestIds: [],
              classes: [],
              shoppingLinks: [],
            },
          },
        })
      }
    }

    // 결과 분석
    const analysis = dumper.analyzeDumpResults(results)

    console.log('📊 덤프 결과 분석:')
    console.log(`✅ 성공: ${analysis.workingUrls.length}개`)
    console.log(`❌ 실패: ${analysis.blockedUrls.length}개`)
    console.log('🎯 권장 선택자:', analysis.suggestedSelectors.slice(0, 10))

    return results
  } catch (error) {
    console.error('네이버 쇼핑 페이지 덤프 실패:', error)
    throw error
  } finally {
    await dumper.close()
  }
}

/**
 * 특정 카테고리만 덤프
 */
export async function dumpSpecificCategory(categoryName: string): Promise<DumpResult> {
  const dumper = getHTMLDumper()
  const encodedName = encodeURIComponent(categoryName)
  const url = `https://search.shopping.naver.com/search/all?query=${encodedName}&cat_id=&frm=NVSHATC&sort=rel&pagingIndex=1&pagingSize=40`

  try {
    await dumper.initialize()
    const result = await dumper.dumpPage(url, categoryName)
    console.log(`✅ ${categoryName} 카테고리 덤프 완료`)
    return result
  } catch (error) {
    console.error(`${categoryName} 카테고리 덤프 실패:`, error)
    throw error
  } finally {
    await dumper.close()
  }
}

/**
 * 덤프 결과 분석 및 권장사항 반환
 */
export async function analyzeDumpResults(): Promise<{
  workingUrls: DumpResult[]
  blockedUrls: DumpResult[]
  recommendations: string[]
  suggestedSelectors: string[]
}> {
  const dumper = getHTMLDumper()

  // 최근 덤프 파일들 읽기
  const fs = await import('fs')
  const path = await import('path')

  const dumpDir = path.join(process.cwd(), 'debug-html')

  if (!fs.existsSync(dumpDir)) {
    return {
      workingUrls: [],
      blockedUrls: [],
      recommendations: ['덤프 파일이 없습니다. 먼저 HTML 덤프를 실행해주세요.'],
      suggestedSelectors: [],
    }
  }

  const files = fs.readdirSync(dumpDir)
  const analysisFiles = files.filter(f => f.endsWith('-analysis.json'))

  const results: DumpResult[] = []

  for (const file of analysisFiles) {
    try {
      const filePath = path.join(dumpDir, file)
      const content = fs.readFileSync(filePath, 'utf8')
      const data = JSON.parse(content)

      results.push({
        url: data.url,
        title: data.title,
        htmlPath: filePath.replace('-analysis.json', '.html'),
        analysisPath: filePath,
        success: !data.pageInfo.isBlocked,
        pageInfo: data.pageInfo,
      })
    } catch (error) {
      console.error(`분석 파일 읽기 실패: ${file}`, error)
    }
  }

  return dumper.analyzeDumpResults(results)
}

/**
 * 최근 HTML 덤프 결과 조회
 */
export async function getRecentDumpResults(): Promise<{
  totalDumps: number
  successfulDumps: number
  failedDumps: number
  recentResults: Array<{
    categoryName: string
    timestamp: string
    success: boolean
    selectors: {
      dataTestIds: string[]
      classes: string[]
      shoppingLinks: string[]
    }
    bodyLength: number
    isBlocked: boolean
  }>
}> {
  const fs = await import('fs')
  const path = await import('path')

  const dumpDir = path.join(process.cwd(), 'debug-html')

  if (!fs.existsSync(dumpDir)) {
    return {
      totalDumps: 0,
      successfulDumps: 0,
      failedDumps: 0,
      recentResults: [],
    }
  }

  const files = fs.readdirSync(dumpDir)
  const analysisFiles = files.filter(f => f.endsWith('-analysis.json'))

  const results: Array<{
    categoryName: string
    timestamp: string
    success: boolean
    selectors: {
      dataTestIds: string[]
      classes: string[]
      shoppingLinks: string[]
    }
    bodyLength: number
    isBlocked: boolean
  }> = []

  for (const file of analysisFiles) {
    try {
      const filePath = path.join(dumpDir, file)
      const content = fs.readFileSync(filePath, 'utf8')
      const data = JSON.parse(content)

      // 파일명에서 카테고리명과 타임스탬프 추출
      const fileName = file.replace('-analysis.json', '')
      const parts = fileName.split('-')
      const categoryName = parts.slice(1, -1).join('-') || '전체'
      const timestamp = parts[parts.length - 1] || ''

      results.push({
        categoryName,
        timestamp,
        success: !data.pageInfo.isBlocked,
        selectors: data.pageInfo.selectors || {
          dataTestIds: [],
          classes: [],
          shoppingLinks: [],
        },
        bodyLength: data.pageInfo.bodyLength || 0,
        isBlocked: data.pageInfo.isBlocked || false,
      })
    } catch (error) {
      console.error(`분석 파일 읽기 실패: ${file}`, error)
    }
  }

  // 최신 순으로 정렬
  results.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const successfulDumps = results.filter(r => r.success).length
  const failedDumps = results.filter(r => !r.success).length

  return {
    totalDumps: results.length,
    successfulDumps,
    failedDumps,
    recentResults: results.slice(0, 10), // 최근 10개만
  }
}
