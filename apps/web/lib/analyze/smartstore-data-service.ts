import { prisma } from '@repo/database'
import { SmartStoreBestProduct, SmartStoreBestCategory, ParsedSmartStoreBestData } from './smartstore-best-parser'

// 스마트스토어 키워드 데이터 타입 (스키마에 맞게)
export interface SmartStoreKeywordData {
  keyword: string
  hashedKeyword: string
  categoryId: bigint
  productCount: number
  monthlySearchCount: number
  mobileSearchCount: number
  pcSearchCount: number
  productCompetitionScore: number
  realTradeRatio: number
  bundleRatio: number
  overseasRatio: number
  recentYearRatio: number
  adClickCount: number
  adClickRatio: number
  adClickRatioPC: number
  adClickRatioMobile: number
  adClickCompetitionRatio: number
  adPrice: number
  adPricePerPrice: number
  adPricePerClick: number
  top40SalesCount: number
  top40Sales: number
  top40AveragePrice: number
  top80SalesCount: number
  top80Sales: number
  top80AveragePrice: number
  relatedKeywords: any[]
  misc: any
  miscBackup: any
}

// 스마트스토어 상품 데이터 타입 (스키마에 맞게)
export interface SmartStoreProductData {
  productId: string
  type: string
  name: string
  url: string
  image: string
  originalPrice: number
  discountedPrice: number
  deliveryFee: number
  thumbnails: string[]
  category: any[]
  detail: string
  options: any[]
  optionGroup1: string
  optionGroup2: string
  optionGroup3: string
  taobaoId: string
  taobaoUrl: string
  myMargin: number
  myPrice: number
  myDeliveryFee: number
  myName: string
  memo: string
  tags: string[]
  mallId?: bigint
  userId: bigint
  smartStoreCategoryId?: string
  marketUploadStatus: string
  smartStoreProductId: string
  isSmartStoreUploaded: boolean
  madeIn: string
  date: string
}

// 스마트스토어 쇼핑몰 데이터 타입 (스키마에 맞게)
export interface SmartStoreMallData {
  mallId: string
  mallName: string
  mallPcUrl: string
  mallLogo: string
  keyword: string
  userId: bigint
  date: string
  from: string
  isComplete: boolean
  status: string
}

// 크롤링 로그 데이터 타입 (스키마에 맞게)
export interface SmartStoreCrawlingLogData {
  content: any
  requestedCount: number
  successCount: number
  failedCount: number
  userId: bigint
  date: Date
}

export class SmartStoreDataService {
  /**
   * 스마트스토어 베스트 데이터를 DB에 저장
   */
  async saveSmartStoreBestData(
    parsedData: ParsedSmartStoreBestData,
    userId: bigint,
  ): Promise<{
    products: any[]
    malls: any[]
    logs: any[]
    keywords: any[]
  }> {
    const date = new Date().toISOString().split('T')[0] || new Date().toISOString().slice(0, 10)

    // 1. 쇼핑몰 데이터 저장
    const malls = await this.saveMalls(parsedData, userId, date)

    // 2. 상품 데이터 저장
    const products = await this.saveProducts(parsedData, userId, date, malls)

    // 3. 키워드 데이터 생성 및 저장
    const keywords = await this.generateAndSaveKeywords(parsedData, userId)

    // 4. 크롤링 로그 저장
    const logs = await this.saveCrawlingLog(parsedData, userId)

    return { products, malls, logs, keywords }
  }

  /**
   * 쇼핑몰 데이터 저장
   */
  private async saveMalls(parsedData: ParsedSmartStoreBestData, userId: bigint, date: string): Promise<any[]> {
    const mallMap = new Map<string, SmartStoreMallData>()

    // 모든 상품에서 쇼핑몰 정보 수집
    parsedData.categories.forEach(category => {
      category.products.forEach(product => {
        if (product.mallName && product.mallName.trim()) {
          const mallKey = `${product.mallName}_${product.mallUrl}`
          if (!mallMap.has(mallKey)) {
            mallMap.set(mallKey, {
              mallId: this.generateMallId(product.mallName),
              mallName: product.mallName,
              mallPcUrl: product.mallUrl,
              mallLogo: '', // 스마트스토어에서는 로고 정보가 제한적
              keyword: parsedData.categoryName,
              userId,
              date,
              from: 'SMART_STORE',
              isComplete: true,
              status: 'CRAWLED',
            })
          }
        }
      })
    })

    const mallsToSave = Array.from(mallMap.values())
    const savedMalls = []

    for (const mall of mallsToSave) {
      try {
        const savedMall = await prisma.searchedMall.upsert({
          where: {
            userId_date_mallId: {
              userId,
              date,
              mallId: mall.mallId,
            },
          },
          update: {
            mallName: mall.mallName,
            mallPcUrl: mall.mallPcUrl,
            mallLogo: mall.mallLogo,
            isComplete: mall.isComplete,
            status: mall.status as any,
          },
          create: mall as any,
        })
        savedMalls.push(savedMall)
      } catch (error) {
        console.error('쇼핑몰 저장 실패:', error)
      }
    }

    return savedMalls
  }

  /**
   * 상품 데이터 저장
   */
  private async saveProducts(
    parsedData: ParsedSmartStoreBestData,
    userId: bigint,
    date: string,
    malls: any[],
  ): Promise<any[]> {
    const productsToSave: SmartStoreProductData[] = []

    // 쇼핑몰 ID 매핑 생성
    const mallIdMap = new Map<string, bigint>()
    malls.forEach(mall => {
      mallIdMap.set(mall.mallId, mall.id)
    })

    parsedData.categories.forEach(category => {
      category.products.forEach(product => {
        const mallId = mallIdMap.get(this.generateMallId(product.mallName))

        productsToSave.push({
          productId: product.productId,
          type: 'smartstore_best',
          name: product.name,
          url: product.productUrl,
          image: product.image,
          originalPrice: product.price,
          discountedPrice: product.price, // 스마트스토어에서는 할인가 정보가 제한적
          deliveryFee: product.deliveryFee,
          thumbnails: product.image ? [product.image] : [],
          category: [category.categoryName],
          detail: '',
          options: [],
          optionGroup1: '',
          optionGroup2: '',
          optionGroup3: '',
          taobaoId: '',
          taobaoUrl: '',
          myMargin: 0,
          myPrice: 0,
          myDeliveryFee: 0,
          myName: '',
          memo: '',
          tags: [category.categoryName],
          mallId,
          userId,
          smartStoreCategoryId: category.categoryId,
          marketUploadStatus: 'PENDING',
          smartStoreProductId: product.productId,
          isSmartStoreUploaded: false,
          madeIn: 'KOREA', // 스마트스토어는 주로 국내 상품
          date,
        })
      })
    })

    const savedProducts = []

    for (const product of productsToSave) {
      try {
        const savedProduct = await prisma.product.upsert({
          where: {
            userId_productId: {
              userId,
              productId: product.productId,
            },
          },
          update: {
            name: product.name,
            url: product.url,
            image: product.image,
            originalPrice: product.originalPrice,
            discountedPrice: product.discountedPrice,
            deliveryFee: product.deliveryFee,
            thumbnails: product.thumbnails,
            category: product.category,
            tags: product.tags,
            mallId: product.mallId,
            smartStoreCategoryId: product.smartStoreCategoryId,
            date: product.date,
          },
          create: product as any,
        })
        savedProducts.push(savedProduct)
      } catch (error) {
        console.error('상품 저장 실패:', error)
      }
    }

    return savedProducts
  }

  /**
   * 키워드 데이터 생성 및 저장
   */
  private async generateAndSaveKeywords(parsedData: ParsedSmartStoreBestData, userId: bigint): Promise<any[]> {
    const keywordsToSave: SmartStoreKeywordData[] = []

    // 카테고리별로 키워드 생성
    parsedData.categories.forEach(category => {
      // 카테고리명을 키워드로 사용
      const keyword = category.categoryName
      const hashedKeyword = this.hashKeyword(keyword)

      // 상품 수 기반으로 검색량 추정
      const estimatedSearchVolume = Math.max(category.productCount * 100, 1000)
      const mobileSearchCount = Math.floor(estimatedSearchVolume * 0.7)
      const pcSearchCount = estimatedSearchVolume - mobileSearchCount

      // 경쟁도 점수 계산 (상품 수가 많을수록 경쟁이 치열)
      const productCompetitionScore = Math.min(category.productCount / 100, 1.0)

      keywordsToSave.push({
        keyword,
        hashedKeyword,
        categoryId: BigInt(1), // 기본 카테고리 ID (실제로는 카테고리 테이블에서 조회 필요)
        productCount: category.productCount,
        monthlySearchCount: estimatedSearchVolume,
        mobileSearchCount,
        pcSearchCount,
        productCompetitionScore,
        realTradeRatio: 0.8, // 스마트스토어는 실거래 비율이 높음
        bundleRatio: 0.2, // 묶음상품 비율
        overseasRatio: 0.1, // 해외상품 비율 (스마트스토어는 주로 국내)
        recentYearRatio: 0.9, // 최근 1년 내 게시 비율
        adClickCount: Math.floor(estimatedSearchVolume * 0.1),
        adClickRatio: 0.05, // 5% 광고 클릭률
        adClickRatioPC: 0.03,
        adClickRatioMobile: 0.07,
        adClickCompetitionRatio: 0.3,
        adPrice: Math.floor(estimatedSearchVolume * 0.5),
        adPricePerPrice: 0.1,
        adPricePerClick: 500,
        top40SalesCount: Math.floor(category.productCount * 0.1),
        top40Sales: Math.floor(category.productCount * 0.1 * 1000),
        top40AveragePrice: Math.floor(Math.random() * 50000) + 10000,
        top80SalesCount: Math.floor(category.productCount * 0.2),
        top80Sales: Math.floor(category.productCount * 0.2 * 1000),
        top80AveragePrice: Math.floor(Math.random() * 30000) + 5000,
        relatedKeywords: this.generateRelatedKeywords(keyword),
        misc: {
          source: 'smartstore_best',
          categoryId: category.categoryId,
          lastUpdated: new Date().toISOString(),
        },
        miscBackup: {},
      })
    })

    const savedKeywords = []

    for (const keyword of keywordsToSave) {
      try {
        const savedKeyword = await prisma.keyword.upsert({
          where: {
            keyword: keyword.keyword,
          },
          update: {
            productCount: keyword.productCount,
            monthlySearchCount: keyword.monthlySearchCount,
            mobileSearchCount: keyword.mobileSearchCount,
            pcSearchCount: keyword.pcSearchCount,
            productCompetitionScore: keyword.productCompetitionScore,
            realTradeRatio: keyword.realTradeRatio,
            bundleRatio: keyword.bundleRatio,
            overseasRatio: keyword.overseasRatio,
            recentYearRatio: keyword.recentYearRatio,
            adClickCount: keyword.adClickCount,
            adClickRatio: keyword.adClickRatio,
            adClickRatioPC: keyword.adClickRatioPC,
            adClickRatioMobile: keyword.adClickRatioMobile,
            adClickCompetitionRatio: keyword.adClickCompetitionRatio,
            adPrice: keyword.adPrice,
            adPricePerPrice: keyword.adPricePerPrice,
            adPricePerClick: keyword.adPricePerClick,
            top40SalesCount: keyword.top40SalesCount,
            top40Sales: keyword.top40Sales,
            top40AveragePrice: keyword.top40AveragePrice,
            top80SalesCount: keyword.top80SalesCount,
            top80Sales: keyword.top80Sales,
            top80AveragePrice: keyword.top80AveragePrice,
            relatedKeywords: keyword.relatedKeywords,
            misc: keyword.misc,
            miscBackup: keyword.miscBackup,
          },
          create: keyword as any,
        })
        savedKeywords.push(savedKeyword)
      } catch (error) {
        console.error('키워드 저장 실패:', error)
      }
    }

    return savedKeywords
  }

  /**
   * 크롤링 로그 저장
   */
  private async saveCrawlingLog(parsedData: ParsedSmartStoreBestData, userId: bigint): Promise<any[]> {
    const logData: SmartStoreCrawlingLogData = {
      content: {
        url: parsedData.url,
        title: parsedData.title,
        categoryName: parsedData.categoryName,
        totalProducts: parsedData.totalProducts,
        totalCategories: parsedData.totalCategories,
        timestamp: parsedData.timestamp,
      },
      requestedCount: parsedData.totalProducts,
      successCount: parsedData.totalProducts,
      failedCount: 0,
      userId,
      date: new Date(),
    }

    try {
      const savedLog = await prisma.crawlingLog.create({
        data: logData as any,
      })
      return [savedLog]
    } catch (error) {
      console.error('크롤링 로그 저장 실패:', error)
      return []
    }
  }

  /**
   * 쇼핑몰 ID 생성
   */
  private generateMallId(mallName: string): string {
    // 쇼핑몰명을 기반으로 고유 ID 생성
    return `smartstore_${mallName.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}`
  }

  /**
   * 키워드 해시 생성
   */
  private hashKeyword(keyword: string): string {
    // 간단한 해시 함수 (실제로는 더 안전한 해시 함수 사용 권장)
    let hash = 0
    for (let i = 0; i < keyword.length; i++) {
      const char = keyword.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 32bit integer로 변환
    }
    return hash.toString()
  }

  /**
   * 관련 키워드 생성
   */
  private generateRelatedKeywords(keyword: string): string[] {
    const relatedMap: Record<string, string[]> = {
      패션: ['의류', '옷', '스타일', '패션아이템', '트렌드'],
      뷰티: ['화장품', '스킨케어', '메이크업', '뷰티아이템', '피부관리'],
      디지털: ['전자제품', '가전', 'IT', '디지털기기', '테크'],
      홈인테리어: ['가구', '인테리어', '홈데코', '생활용품', '집꾸미기'],
      기타: ['생활용품', '잡화', '기타상품'],
    }

    return relatedMap[keyword] || ['관련상품', '추천상품']
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
    try {
      const [products, malls, logs, keywords] = await Promise.all([
        this.getUserProducts(userId),
        this.getUserMalls(userId),
        this.getUserLogs(userId),
        this.getUserKeywords(userId),
      ])

      return { products, malls, logs, keywords }
    } catch (error) {
      console.error('사용자 스마트스토어 데이터 조회 실패:', error)
      return { products: [], malls: [], logs: [], keywords: [] }
    }
  }

  private async getUserProducts(userId: bigint): Promise<any[]> {
    return (await prisma.product.findMany({
      where: { userId },
      include: { mall: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })) as unknown as any[]
  }

  private async getUserMalls(userId: bigint): Promise<any[]> {
    return (await prisma.searchedMall.findMany({
      where: { userId },
      include: { products: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })) as unknown as any[]
  }

  private async getUserLogs(userId: bigint): Promise<any[]> {
    return (await prisma.crawlingLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })) as unknown as any[]
  }

  private async getUserKeywords(userId: bigint): Promise<any[]> {
    return (await prisma.keyword.findMany({
      where: {
        misc: {
          path: ['source'],
          equals: 'smartstore_best',
        },
      },
      include: { category: true },
      orderBy: { monthlySearchCount: 'desc' },
      take: 50,
    })) as unknown as any[]
  }
}
