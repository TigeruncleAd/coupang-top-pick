import { HTMLDumper } from './html-dumper'
import { NaverBestKeywordParser } from './naver-best-keyword-parser'
import { SmartStoreDataService } from './smartstore-data-service'
import { ParsedNaverBestKeywordData } from './naver-best-keyword-parser'

export interface SmartStoreCrawlingResult {
  success: boolean
  message: string
  data?: {
    products: any[]
    malls: any[]
    logs: any[]
    keywords: any[]
  }
  error?: string
  htmlPath?: string
  analysisPath?: string
}

export class SmartStoreCrawlerService {
  private dumper: HTMLDumper
  private parser: NaverBestKeywordParser
  private dataService: SmartStoreDataService

  constructor() {
    this.dumper = new HTMLDumper()
    this.parser = new NaverBestKeywordParser()
    this.dataService = new SmartStoreDataService()
  }

  /**
   * 스마트스토어 베스트 페이지 크롤링 및 데이터 저장
   */
  async crawlSmartStoreBestData(userId: bigint, categoryName?: string): Promise<SmartStoreCrawlingResult> {
    const startTime = Date.now()

    try {
      // 1. HTML 덤퍼 초기화
      await this.dumper.initialize()

      // 2. 네이버 쇼핑 베스트 키워드 페이지 URL들 (선택된 카테고리만)
      const urls = await this.getUrlsForCategory(categoryName)

      const allResults = {
        products: [] as any[],
        malls: [] as any[],
        logs: [] as any[],
        keywords: [] as any[],
      }

      // 3. 각 URL별로 크롤링 실행
      for (const { url, title, type } of urls) {
        try {
          console.log(`🔍 스마트스토어 크롤링 시작: ${title}`)

          // HTML 덤프
          const dumpResult = await this.dumper.dumpPage(url, `smartstore-best-${type}`)

          if (!dumpResult.success || !dumpResult.htmlPath) {
            console.error(`❌ HTML 덤프 실패: ${title}`, dumpResult.error)
            continue
          }

          // HTML 파일 읽기
          const fs = await import('fs')
          const htmlContent = fs.readFileSync(dumpResult.htmlPath, 'utf-8')

          // HTML 파싱
          const parsedData = await this.parser.parseHTML(htmlContent, url)

          // 데이터베이스 저장 (네이버 키워드 데이터를 스마트스토어 형식으로 변환)
          const convertedData = this.convertNaverKeywordToSmartStoreFormat(parsedData)
          const saveResult = await this.dataService.saveSmartStoreBestData(convertedData, userId)

          // 결과 병합
          allResults.products.push(...saveResult.products)
          allResults.malls.push(...saveResult.malls)
          allResults.logs.push({
            ...saveResult.logs[0],
            htmlPath: dumpResult.htmlPath,
            analysisPath: dumpResult.analysisPath,
          })
          allResults.keywords.push(...saveResult.keywords)

          console.log(`✅ ${title} 완료: ${parsedData.totalKeywords}개 키워드`)

          // 요청 간 지연 (3-5초)
          if (urls.indexOf({ url, title, type }) < urls.length - 1) {
            const delay = Math.floor(Math.random() * 2000) + 3000
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.error(`❌ ${title} 크롤링 실패:`, errorMsg)
        }
      }

      const processingTime = Date.now() - startTime

      return {
        success: true,
        message: `네이버 베스트 키워드 크롤링 완료 (${processingTime}ms)`,
        data: allResults,
        htmlPath: allResults.logs.length > 0 ? allResults.logs[0]?.htmlPath : undefined,
        analysisPath: allResults.logs.length > 0 ? allResults.logs[0]?.analysisPath : undefined,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('스마트스토어 크롤링 실패:', errorMsg)

      return {
        success: false,
        message: '스마트스토어 크롤링 실패',
        error: errorMsg,
      }
    } finally {
      // 리소스 정리
      try {
        await this.dumper.close()
      } catch (error) {
        console.error('HTML 덤퍼 종료 실패:', error)
      }
    }
  }

  /**
   * 특정 URL의 스마트스토어 데이터 크롤링
   */
  async crawlSpecificUrl(url: string, userId: bigint): Promise<SmartStoreCrawlingResult> {
    try {
      await this.dumper.initialize()

      console.log(`🔍 특정 URL 크롤링 시작: ${url}`)

      // HTML 덤프
      const dumpResult = await this.dumper.dumpPage(url, 'smartstore-specific')

      if (!dumpResult.success || !dumpResult.htmlPath) {
        return {
          success: false,
          message: 'HTML 덤프 실패',
          error: dumpResult.error,
        }
      }

      // HTML 파일 읽기
      const fs = await import('fs')
      const htmlContent = fs.readFileSync(dumpResult.htmlPath, 'utf-8')

      // HTML 파싱
      const parsedData = await this.parser.parseHTML(htmlContent, url)

      // 데이터베이스 저장 (네이버 키워드 데이터를 스마트스토어 형식으로 변환)
      const convertedData = this.convertNaverKeywordToSmartStoreFormat(parsedData)
      const saveResult = await this.dataService.saveSmartStoreBestData(convertedData, userId)

      console.log(`✅ 특정 URL 크롤링 완료: ${parsedData.totalKeywords}개 키워드`)

      return {
        success: true,
        message: `특정 URL 크롤링 완료: ${parsedData.totalKeywords}개 키워드`,
        data: saveResult,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('특정 URL 크롤링 실패:', errorMsg)

      return {
        success: false,
        message: '특정 URL 크롤링 실패',
        error: errorMsg,
      }
    } finally {
      try {
        await this.dumper.close()
      } catch (error) {
        console.error('HTML 덤퍼 종료 실패:', error)
      }
    }
  }

  /**
   * DB에서 카테고리 정보 조회
   */
  private async getCategoryFromDB(categoryName: string): Promise<{ id: bigint; name: string } | null> {
    try {
      const { PrismaClient } = await import('@repo/database')
      const prisma = new PrismaClient()

      // 카테고리명으로 검색
      const category = await prisma.category.findFirst({
        where: {
          OR: [{ name: categoryName }, { name: { contains: categoryName } }, { fullName: { contains: categoryName } }],
        },
        select: {
          id: true,
          name: true,
        },
      })

      await prisma.$disconnect()
      return category
    } catch (error) {
      console.error('카테고리 조회 실패:', error)
      return null
    }
  }

  /**
   * 선택된 카테고리에 대한 URL 목록 생성
   */
  private async getUrlsForCategory(
    categoryName?: string,
  ): Promise<Array<{ url: string; title: string; type: string }>> {
    // 현재 날짜와 시간 정보 생성
    const now = new Date()
    const syncDate = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
    const activeRankId = Date.now().toString() // 현재 시간을 activeRankId로 사용

    // 기본 URL 생성 함수
    const createUrl = (categoryId: string) => {
      return `https://snxbest.naver.com/keyword/best?categoryId=${categoryId}&sortType=KEYWORD_POPULAR&periodType=DAILY&ageType=ALL&activeRankId=${activeRankId}&syncDate=${syncDate}`
    }

    const allUrls = [
      {
        url: createUrl('A'),
        title: '네이버 쇼핑 전체 베스트 키워드',
        type: 'naver_best_keyword_all',
        categoryName: '전체',
      },
    ]

    // 특정 카테고리가 선택된 경우 DB에서 카테고리 ID 조회
    if (categoryName && categoryName !== '전체') {
      const category = await this.getCategoryFromDB(categoryName)

      if (category) {
        const categoryId = category.id.toString()
        const url = createUrl(categoryId)

        console.log(`🎯 선택된 카테고리: ${categoryName} (ID: ${categoryId})`)
        console.log(`🔗 생성된 URL: ${url}`)

        return [
          {
            url,
            title: `네이버 쇼핑 ${categoryName} 베스트 키워드`,
            type: `naver_best_keyword_${categoryId}`,
          },
        ]
      } else {
        console.log(`⚠️ 카테고리 DB 조회 실패: ${categoryName}, 전체 카테고리로 크롤링`)
        return [allUrls[0]!] // 전체 카테고리로 fallback
      }
    }

    // 카테고리가 선택되지 않은 경우 전체 카테고리만 크롤링
    console.log(`🌐 전체 카테고리 크롤링`)
    console.log(`🔗 생성된 URL: ${allUrls[0]!.url}`)
    return [allUrls[0]!]
  }

  /**
   * 네이버 키워드 데이터를 스마트스토어 형식으로 변환
   */
  private convertNaverKeywordToSmartStoreFormat(naverData: ParsedNaverBestKeywordData): any {
    // 네이버 키워드 데이터를 스마트스토어 베스트 형식으로 변환
    const categories = [
      {
        categoryId: this.generateCategoryId(naverData.categoryName),
        categoryName: naverData.categoryName,
        productCount: naverData.keywords.length,
        products: naverData.keywords.flatMap(keyword =>
          keyword.relatedProducts.map(product => ({
            productId: this.generateProductId(product.productUrl, product.name),
            name: product.name,
            price: product.price,
            image: product.image,
            mallName: product.mallName,
            mallUrl: '',
            productUrl: product.productUrl,
            category: naverData.categoryName,
            isAd: product.isAd,
            deliveryFee: 0,
            reviewCount: product.reviewCount,
            rating: product.rating,
          })),
        ),
      },
    ]

    return {
      url: naverData.url,
      title: naverData.title,
      timestamp: naverData.timestamp,
      categoryName: naverData.categoryName,
      categories,
      totalProducts: categories.reduce((sum, cat) => sum + cat.productCount, 0),
      totalCategories: categories.length,
    }
  }

  /**
   * 카테고리 ID 생성
   */
  private generateCategoryId(categoryName: string): string {
    const categoryMap: Record<string, string> = {
      전체: 'A',
      패션의류: '50000000',
      '화장품/미용': '50000001',
      '디지털/가전': '50000002',
      '가구/인테리어': '50000003',
      '출산/육아': '50000004',
      식품: '50000005',
      '스포츠/레저': '50000006',
      '생활/건강': '50000007',
      패션잡화: '50000008',
    }
    return categoryMap[categoryName] || 'A'
  }

  /**
   * 상품 ID 생성
   */
  private generateProductId(url: string, name: string): string {
    if (url) {
      const match = url.match(/product\/(\d+)/) || url.match(/id=(\d+)/)
      if (match && match[1]) return match[1]
    }
    return `naver_${name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}`
  }

  /**
   * 사용자별 스마트스토어 데이터 조회
   */
  async getUserSmartStoreData(userId: bigint): Promise<{
    products: any[]
    malls: any[]
    logs: any[]
    keywords: any[]
  }> {
    return await this.dataService.getUserSmartStoreData(userId)
  }

  /**
   * 스마트스토어 크롤링 통계 조회
   */
  async getSmartStoreCrawlingStats(userId: bigint): Promise<{
    totalProducts: number
    totalMalls: number
    totalKeywords: number
    lastCrawledAt?: Date
    categories: string[]
  }> {
    try {
      const data = await this.dataService.getUserSmartStoreData(userId)

      const categories = [...new Set(data.products.map(p => p.category).flat())]

      const lastCrawledAt = data.logs.length > 0 ? new Date(data.logs[0].createdAt) : undefined

      return {
        totalProducts: data.products.length,
        totalMalls: data.malls.length,
        totalKeywords: data.keywords.length,
        lastCrawledAt,
        categories,
      }
    } catch (error) {
      console.error('스마트스토어 크롤링 통계 조회 실패:', error)
      return {
        totalProducts: 0,
        totalMalls: 0,
        totalKeywords: 0,
        categories: [],
      }
    }
  }
}
