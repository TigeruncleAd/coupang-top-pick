import { HTMLDumper, DumpResult } from './html-dumper'
import { NaverShoppingParser, ParsedShoppingData } from './naver-shopping-parser'
import { ShoppingDataService, UserProduct, UserCrawlingLog, UserSearchedMall, UserStats } from './shopping-data-service'
import fs from 'fs'
import path from 'path'

export interface CrawlResult {
  success: boolean
  url: string
  keyword: string
  totalProducts: number
  savedProducts: number
  errors: string[]
  dumpResult?: DumpResult
  parsedData?: ParsedShoppingData
  processingTime: number
}

export interface CrawlOptions {
  userId: bigint
  keyword: string
  saveToDb?: boolean
  saveParsedData?: boolean
  outputDir?: string
}

export class ShoppingCrawlerService {
  private dumper: HTMLDumper
  private parser: NaverShoppingParser
  private dataService: ShoppingDataService

  constructor() {
    this.dumper = new HTMLDumper()
    this.parser = new NaverShoppingParser()
    this.dataService = new ShoppingDataService()
  }

  /**
   * 네이버 쇼핑 페이지 크롤링 및 데이터 저장
   */
  async crawlShoppingPage(options: CrawlOptions): Promise<CrawlResult> {
    const startTime = Date.now()
    const { userId, keyword, saveToDb = true, saveParsedData = true, outputDir } = options

    try {
      // 1. 네이버 쇼핑 URL 생성
      const url = this.generateNaverShoppingUrl(keyword)
      console.log(`🔍 크롤링 시작: ${url}`)

      // 2. HTML 덤프
      await this.dumper.initialize()
      const dumpResult = await this.dumper.dumpPage(url, keyword)

      if (!dumpResult.success) {
        throw new Error(`HTML 덤프 실패: ${dumpResult.error}`)
      }

      // 3. HTML 파싱
      const parsedData = await this.parser.parseFromFile(dumpResult.htmlPath, keyword)
      console.log(`📊 파싱 완료: ${parsedData.totalProducts}개 상품 발견`)

      // 4. DB 저장 (선택사항)
      let savedProducts = 0
      let errors: string[] = []

      if (saveToDb) {
        const saveResult = await this.dataService.saveShoppingData(userId, parsedData)
        savedProducts = saveResult.savedProducts
        errors = saveResult.errors
        console.log(`💾 DB 저장 완료: ${savedProducts}개 상품 저장`)
      }

      // 5. 파싱 데이터 저장 (선택사항)
      if (saveParsedData && outputDir) {
        const outputPath = path.join(outputDir, `parsed-${keyword}-${Date.now()}.json`)
        await this.parser.saveParsedData(parsedData, outputPath)
        console.log(`📁 파싱 데이터 저장: ${outputPath}`)
      }

      const processingTime = Date.now() - startTime

      return {
        success: true,
        url,
        keyword,
        totalProducts: parsedData.totalProducts,
        savedProducts,
        errors,
        dumpResult,
        parsedData,
        processingTime,
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMsg = error instanceof Error ? error.message : String(error)

      console.error(`❌ 크롤링 실패: ${errorMsg}`)

      return {
        success: false,
        url: this.generateNaverShoppingUrl(keyword),
        keyword,
        totalProducts: 0,
        savedProducts: 0,
        errors: [errorMsg],
        processingTime,
      }
    } finally {
      // 정리
      this.parser.cleanup()
      await this.dumper.close()
    }
  }

  /**
   * 여러 키워드로 일괄 크롤링
   */
  async crawlMultipleKeywords(
    userId: bigint,
    keywords: string[],
    options: {
      saveToDb?: boolean
      saveParsedData?: boolean
      outputDir?: string
      delayBetweenRequests?: number
    } = {},
  ): Promise<CrawlResult[]> {
    const results: CrawlResult[] = []
    const { delayBetweenRequests = 5000 } = options

    for (const keyword of keywords) {
      try {
        const result = await this.crawlShoppingPage({
          userId,
          keyword,
          saveToDb: options.saveToDb,
          saveParsedData: options.saveParsedData,
          outputDir: options.outputDir,
        })

        results.push(result)

        // 요청 간 지연
        if (delayBetweenRequests > 0 && keywords.indexOf(keyword) < keywords.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenRequests))
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        results.push({
          success: false,
          url: this.generateNaverShoppingUrl(keyword),
          keyword,
          totalProducts: 0,
          savedProducts: 0,
          errors: [errorMsg],
          processingTime: 0,
        })
      }
    }

    return results
  }

  /**
   * 기존 HTML 파일에서 데이터 추출 및 저장
   */
  async processExistingHTML(
    userId: bigint,
    htmlFilePath: string,
    keyword: string,
    options: {
      saveToDb?: boolean
      saveParsedData?: boolean
      outputDir?: string
    } = {},
  ): Promise<CrawlResult> {
    const startTime = Date.now()
    const { saveToDb = true, saveParsedData = true, outputDir } = options

    try {
      console.log(`📄 기존 HTML 파일 처리: ${htmlFilePath}`)

      // 1. HTML 파싱
      const parsedData = await this.parser.parseFromFile(htmlFilePath, keyword)
      console.log(`📊 파싱 완료: ${parsedData.totalProducts}개 상품 발견`)

      // 2. DB 저장 (선택사항)
      let savedProducts = 0
      let errors: string[] = []

      if (saveToDb) {
        const saveResult = await this.dataService.saveShoppingData(userId, parsedData)
        savedProducts = saveResult.savedProducts
        errors = saveResult.errors
        console.log(`💾 DB 저장 완료: ${savedProducts}개 상품 저장`)
      }

      // 3. 파싱 데이터 저장 (선택사항)
      if (saveParsedData && outputDir) {
        const outputPath = path.join(outputDir, `parsed-${keyword}-${Date.now()}.json`)
        await this.parser.saveParsedData(parsedData, outputPath)
        console.log(`📁 파싱 데이터 저장: ${outputPath}`)
      }

      const processingTime = Date.now() - startTime

      return {
        success: true,
        url: this.generateNaverShoppingUrl(keyword),
        keyword,
        totalProducts: parsedData.totalProducts,
        savedProducts,
        errors,
        parsedData,
        processingTime,
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMsg = error instanceof Error ? error.message : String(error)

      console.error(`❌ HTML 처리 실패: ${errorMsg}`)

      return {
        success: false,
        url: this.generateNaverShoppingUrl(keyword),
        keyword,
        totalProducts: 0,
        savedProducts: 0,
        errors: [errorMsg],
        processingTime,
      }
    } finally {
      this.parser.cleanup()
    }
  }

  /**
   * 네이버 쇼핑 URL 생성
   */
  private generateNaverShoppingUrl(keyword: string): string {
    const encodedKeyword = encodeURIComponent(keyword)
    return `https://search.shopping.naver.com/search/all?query=${encodedKeyword}&cat_id=&frm=NVSHATC&sort=rel&pagingIndex=1&pagingSize=40`
  }

  /**
   * 사용자 데이터 조회
   */
  async getUserData(userId: bigint): Promise<{
    products: UserProduct[]
    malls: UserSearchedMall[]
    logs: UserCrawlingLog[]
    stats: UserStats
  }> {
    return {
      products: await this.dataService.getUserProducts(userId),
      malls: await this.dataService.getUserSearchedMalls(userId),
      logs: await this.dataService.getUserCrawlingLogs(userId),
      stats: await this.dataService.getUserStats(userId),
    }
  }

  /**
   * 리소스 정리
   */
  async cleanup() {
    await this.dataService.disconnect()
  }
}
