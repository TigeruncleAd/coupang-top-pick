import puppeteer, { Browser, Page } from 'puppeteer'
import fs from 'fs'
import path from 'path'

export interface DumpResult {
  url: string
  title: string
  htmlPath: string | null
  analysisPath: string | null
  htmlContent?: string
  success: boolean
  error?: string
  pageInfo: {
    bodyLength: number
    hasContent: boolean
    isBlocked: boolean
    selectors: {
      dataTestIds: string[]
      classes: string[]
      shoppingLinks: string[]
    }
  }
}

export class HTMLDumper {
  private browser: Browser | null = null
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  ]

  async initialize(): Promise<void> {
    if (this.browser) return

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-extensions',
        '--no-first-run',
      ],
    })
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  private getRandomUserAgent(): string {
    const randomIndex = Math.floor(Math.random() * this.userAgents.length)
    return this.userAgents[randomIndex]!
  }

  /**
   * 키워드 데이터 로드 대기 (단순화)
   */
  private async waitForKeywordData(page: Page): Promise<void> {
    try {
      // console.log(`⏳ JavaScript 렌더링 대기 시작...`)

      // 1. 페이지 완전 로드 대기
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 })
      // console.log(`✅ 페이지 완전 로드 완료`)

      // 2. JavaScript 실행을 위한 충분한 대기
      await new Promise(resolve => setTimeout(resolve, 2000))
      // console.log(`✅ JavaScript 실행 대기 완료`)

      // 3. 키워드 데이터 확인
      const hasKeywordData = await page.evaluate(() => {
        const bodyText = document.body.textContent || ''
        const keywordPatterns = [
          /(\d+)위.*?랭킹\s*(상승|하락|유지|신규|급등)/,
          /(\d+)위.*?([가-힣a-zA-Z0-9\s]+)/,
          /랭킹.*?(\d+)위/,
          /베스트.*?키워드/,
        ]

        const hasPattern = keywordPatterns.some(pattern => pattern.test(bodyText))

        // 디버깅 정보
        // console.log('Body 텍스트 길이:', bodyText.length)
        // console.log('키워드 패턴 매칭:', hasPattern)
        // if (bodyText.length > 0) {
        //   console.log('Body 텍스트 샘플:', bodyText.substring(0, 1000))
        // }

        return hasPattern
      })

      // if (hasKeywordData) {
      //   console.log(`✅ 키워드 데이터 발견`)
      // } else {
      //   console.log(`⚠️ 키워드 데이터 미발견, 계속 진행`)
      // }
    } catch (error) {
      console.warn('키워드 데이터 로드 대기 실패, 계속 진행:', error)
    }
  }

  private async simulateUserBehavior(page: Page): Promise<void> {
    try {
      // 간단한 스크롤 시뮬레이션
      await page.evaluate(() => {
        window.scrollBy(0, 300)
      })

      await new Promise(resolve => setTimeout(resolve, 1000))

      await page.evaluate(() => {
        window.scrollTo(0, 0)
      })
    } catch (error) {
      // console.log('사용자 행동 시뮬레이션 중 오류:', error)
    }
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('브라우저가 초기화되지 않았습니다. initialize()를 먼저 호출해주세요.')
    }

    const page = await this.browser.newPage()

    // 랜덤 User-Agent 사용
    const userAgent = this.getRandomUserAgent()
    await page.setUserAgent(userAgent)
    await page.setViewport({ width: 1920, height: 1080 })

    // 기본 헤더 설정
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
    })

    // 필수 자동화 탐지 우회만 적용
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      })

      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      })
    })

    // 네트워크 요청 최적화 - 이미지만 차단
    await page.setRequestInterception(true)
    page.on('request', request => {
      const resourceType = request.resourceType()
      if (resourceType === 'image') {
        request.abort()
      } else {
        request.continue()
      }
    })

    return page
  }

  /**
   * URL의 HTML을 덤프하고 분석
   */
  async dumpPage(url: string, categoryName: string, saveToFile: boolean = true): Promise<DumpResult> {
    const page = await this.createPage()
    const timestamp = Date.now()

    try {
      // console.log(`🔍 HTML 덤프 시작: ${url}`)

      // 간단한 지연 (100-400ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100))

      // 페이지 이동 (DOM 로드까지 대기)
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })

      // 접속 제한 및 캡챠 감지
      const isBlocked = await page.evaluate(() => {
        const bodyText = document.body.innerHTML.toLowerCase()

        return (
          bodyText.includes('캡챠') ||
          bodyText.includes('자동입력 방지') ||
          bodyText.includes('접속이 일시적으로 제한되었습니다') ||
          bodyText.includes('비정상적인 접근이 감지될 경우')
        )
      })

      if (isBlocked) {
        console.log(`⚠️ 접속 제한 또는 캡챠 감지됨: ${url}`)
      }

      // 페이지 정보 수집
      const pageInfo = await page.evaluate(blockedStatus => {
        const bodyHTML = document.body.innerHTML

        // 관련 클래스만 수집
        const relevantClasses = Array.from(document.querySelectorAll('*'))
          .map(el => el.className)
          .filter(className => className && typeof className === 'string')
          .flatMap(className => className.split(' '))
          .filter(
            cls => cls.includes('product') || cls.includes('item') || cls.includes('list') || cls.includes('search'),
          )
          .slice(0, 50)

        // data-testid 수집
        const dataTestIds = Array.from(document.querySelectorAll('[data-testid]'))
          .map(el => el.getAttribute('data-testid'))
          .filter((id): id is string => id !== null)
          .slice(0, 20)

        // 쇼핑 링크 수집
        const shoppingLinks = Array.from(document.querySelectorAll('a[href*="/shopping/"]'))
          .map(el => el.getAttribute('href'))
          .filter((href): href is string => href !== null)
          .slice(0, 10)

        return {
          bodyLength: bodyHTML.length,
          hasContent: bodyHTML.length > 1000,
          isBlocked: blockedStatus,
          selectors: {
            dataTestIds,
            classes: relevantClasses,
            shoppingLinks,
          },
        }
      }, isBlocked)

      // HTML 내용 가져오기
      const htmlContent = await page.content()

      // 파일 저장 (옵션에 따라)
      let htmlPath: string | null = null
      let dumpDir: string | null = null
      let fileName: string | null = null

      if (saveToFile) {
        // 덤프 디렉토리 생성
        dumpDir = path.join(process.cwd(), 'debug-html')
        if (!fs.existsSync(dumpDir)) {
          fs.mkdirSync(dumpDir, { recursive: true })
        }

        // 파일명 생성
        const safeCategoryName = categoryName.replace(/[^a-zA-Z0-9가-힣]/g, '_')
        fileName = `naver-shopping-${safeCategoryName}-${timestamp}`

        // HTML 파일 저장
        htmlPath = path.join(dumpDir, `${fileName}.html`)
        fs.writeFileSync(htmlPath, htmlContent, 'utf8')
      }

      // URL 파라미터 정보 로깅
      const urlObj = new URL(url)
      const hasKeywordInHTML =
        htmlContent.includes('1위') || htmlContent.includes('랭킹') || htmlContent.includes('키워드')

      // 분석 정보 저장
      const analysisData = {
        url,
        title: await page.title(),
        timestamp,
        categoryName,
        pageInfo,
        urlParams: {
          categoryId: urlObj.searchParams.get('categoryId'),
          sortType: urlObj.searchParams.get('sortType'),
          periodType: urlObj.searchParams.get('periodType'),
          ageType: urlObj.searchParams.get('ageType'),
          activeRankId: urlObj.searchParams.get('activeRankId'),
          syncDate: urlObj.searchParams.get('syncDate'),
        },
        hasKeywordData: hasKeywordInHTML,
      }

      let analysisPath: string | null = null
      if (saveToFile && dumpDir && fileName) {
        analysisPath = path.join(dumpDir, `${fileName}-analysis.json`)
        fs.writeFileSync(analysisPath, JSON.stringify(analysisData, null, 2), 'utf8')
        // console.log(`📁 HTML 덤프 완료: ${htmlPath}`)
        // console.log(`📊 분석 정보 저장: ${analysisPath}`)
      } else {
        // console.log(`📄 HTML 덤프 완료 (파일 저장 안함)`)
      }

      return {
        url,
        title: await page.title(),
        htmlPath,
        analysisPath,
        htmlContent,
        success: !isBlocked, // 접속 제한 감지되면 실패로 처리
        error: isBlocked ? '접속 제한 또는 캡챠 페이지가 감지되었습니다' : undefined,
        pageInfo,
      }
    } catch (error) {
      console.error(`❌ HTML 덤프 실패: ${url}`, error)

      return {
        url,
        title: '',
        htmlPath: null,
        analysisPath: null,
        htmlContent: '',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        pageInfo: {
          bodyLength: 0,
          hasContent: false,
          isBlocked: true,
          selectors: {
            dataTestIds: [],
            classes: [],
            shoppingLinks: [],
          },
        },
      }
    } finally {
      await page.close()
    }
  }

  /**
   * 여러 URL을 순차적으로 덤프
   */
  async dumpMultiplePages(urls: Array<{ url: string; categoryName: string }>): Promise<DumpResult[]> {
    const results: DumpResult[] = []

    for (const { url, categoryName } of urls) {
      try {
        const result = await this.dumpPage(url, categoryName)
        results.push(result)

        // 요청 간 대기 시간 단축 (300-500ms)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 300))
      } catch (error) {
        console.error(`${categoryName} 덤프 실패:`, error)
        results.push({
          url,
          title: '',
          htmlPath: '',
          analysisPath: '',
          success: false,
          error: error instanceof Error ? error.message : String(error),
          pageInfo: {
            bodyLength: 0,
            hasContent: false,
            isBlocked: true,
            selectors: {
              dataTestIds: [],
              classes: [],
              shoppingLinks: [],
            },
          },
        })
      }
    }

    return results
  }

  /**
   * 덤프 결과 분석 및 권장사항 생성
   */
  analyzeDumpResults(results: DumpResult[]): {
    workingUrls: DumpResult[]
    blockedUrls: DumpResult[]
    recommendations: string[]
    suggestedSelectors: string[]
  } {
    const workingUrls = results.filter(r => r.success && !r.pageInfo.isBlocked)
    const blockedUrls = results.filter(r => !r.success || r.pageInfo.isBlocked)

    const recommendations: string[] = []
    const suggestedSelectors: string[] = []

    if (blockedUrls.length > 0) {
      recommendations.push(
        '일부 URL이 봇 탐지로 차단되었습니다. User-Agent 변경, 요청 간격 조정, 프록시 사용을 고려하세요.',
      )
    }

    if (workingUrls.length > 0) {
      // 성공한 페이지들에서 공통 선택자 추출
      const allClasses = workingUrls.flatMap(r => r.pageInfo.selectors.classes)
      const allDataTestIds = workingUrls.flatMap(r => r.pageInfo.selectors.dataTestIds)

      // 가장 많이 나타나는 선택자들
      const classCounts = allClasses.reduce(
        (acc, cls) => {
          acc[cls] = (acc[cls] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const dataTestIdCounts = allDataTestIds.reduce(
        (acc, id) => {
          acc[id] = (acc[id] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      // 상위 선택자들 추천
      suggestedSelectors.push(
        ...Object.entries(classCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([cls]) => `.${cls}`),
      )

      suggestedSelectors.push(
        ...Object.entries(dataTestIdCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([id]) => `[data-testid="${id}"]`),
      )

      recommendations.push(
        `성공한 ${workingUrls.length}개 페이지에서 ${suggestedSelectors.length}개의 선택자를 발견했습니다.`,
      )
    }

    return {
      workingUrls,
      blockedUrls,
      recommendations,
      suggestedSelectors,
    }
  }
}

// 싱글톤 인스턴스
let dumperInstance: HTMLDumper | null = null

export function getHTMLDumper(): HTMLDumper {
  if (!dumperInstance) {
    dumperInstance = new HTMLDumper()
  }
  return dumperInstance
}
