import { PrismaClient } from '@repo/database'
import { NaverShoppingProduct, ParsedShoppingData } from './naver-shopping-parser'

// 타입 정의
export interface UserProduct {
  id: bigint
  userId: bigint
  productId: string
  name: string
  url: string
  image: string
  originalPrice: number
  discountedPrice: number
  deliveryFee: number
  category: string[]
  tags: string[]
  memo: string
  mallId?: bigint
  status: string
  isComplete: boolean
  type: string
  date: string
  createdAt: Date
  updatedAt: Date
  mall?: {
    id: bigint
    mallName: string
    mallPcUrl: string
  }
}

export interface UserCrawlingLog {
  id: bigint
  userId: bigint
  content: any
  requestedCount: number
  successCount: number
  failedCount: number
  createdAt: Date
  updatedAt: Date
}

export interface UserSearchedMall {
  id: bigint
  userId: bigint
  mallId: string
  mallName: string
  mallPcUrl: string
  keyword: string
  date: string
  from: string
  isComplete: boolean
  status: string
  createdAt: Date
  updatedAt: Date
  products: UserProduct[]
}

export interface UserStats {
  totalProducts: number
  totalMalls: number
  totalLogs: number
  recentProducts: number
}

export class ShoppingDataService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  /**
   * 파싱된 쇼핑 데이터를 DB에 저장
   */
  async saveShoppingData(
    userId: bigint,
    parsedData: ParsedShoppingData,
    mallId?: string,
    mallName?: string,
    mallUrl?: string,
  ): Promise<{
    savedProducts: number
    savedMall?: any
    errors: string[]
  }> {
    const errors: string[] = []
    let savedProducts = 0
    let savedMall = null

    try {
      // 1. 쇼핑몰 정보 저장 (선택사항)
      if (mallId && mallName) {
        savedMall = await this.saveSearchedMall(userId, {
          mallId,
          mallName,
          mallUrl: mallUrl || '',
          keyword: parsedData.keyword,
          date: new Date().toISOString().split('T')[0] || new Date().toISOString().slice(0, 10), // YYYY-MM-DD 형식
        })
      }

      // 2. 상품 데이터 저장
      for (const product of parsedData.products) {
        try {
          await this.saveProduct(userId, product, savedMall?.id)
          savedProducts++
        } catch (error) {
          const errorMsg = `상품 저장 실패 (${product.name}): ${error instanceof Error ? error.message : String(error)}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      // 3. 크롤링 로그 저장
      await this.saveCrawlingLog(userId, {
        keyword: parsedData.keyword,
        totalProducts: parsedData.totalProducts,
        savedProducts,
        errors: errors.length,
        categories: parsedData.categories,
        malls: parsedData.malls,
      })

      return {
        savedProducts,
        savedMall,
        errors,
      }
    } catch (error) {
      const errorMsg = `쇼핑 데이터 저장 실패: ${error instanceof Error ? error.message : String(error)}`
      errors.push(errorMsg)
      console.error(errorMsg)

      return {
        savedProducts,
        savedMall,
        errors,
      }
    }
  }

  /**
   * 검색된 쇼핑몰 정보 저장
   */
  private async saveSearchedMall(
    userId: bigint,
    mallData: {
      mallId: string
      mallName: string
      mallUrl: string
      keyword: string
      date: string
    },
  ) {
    return await this.prisma.searchedMall.upsert({
      where: {
        userId_date_mallId: {
          userId,
          date: mallData.date,
          mallId: mallData.mallId,
        },
      },
      update: {
        mallName: mallData.mallName,
        mallPcUrl: mallData.mallUrl,
        keyword: mallData.keyword,
        isComplete: true,
        status: 'CRAWLED',
      },
      create: {
        userId,
        mallId: mallData.mallId,
        mallName: mallData.mallName,
        mallPcUrl: mallData.mallUrl,
        keyword: mallData.keyword,
        date: mallData.date,
        from: 'NAVER',
        isComplete: true,
        status: 'CRAWLED',
      },
    })
  }

  /**
   * 상품 정보 저장
   */
  private async saveProduct(userId: bigint, product: NaverShoppingProduct, mallId?: bigint) {
    // 상품 데이터 변환
    const productData = {
      userId,
      productId: product.productId,
      name: product.name,
      url: product.productUrl,
      image: product.image,
      originalPrice: product.originalPrice || product.price,
      discountedPrice: product.price,
      deliveryFee: product.deliveryFee || 0,
      category: [product.category], // JSON 배열로 저장
      tags: product.tags || [],
      memo: product.isAd ? '광고상품' : '',
      mallId,
      status: 'CRAWLED' as const,
      isComplete: true,
      type: 'NAVER_SHOPPING',
      date: new Date().toISOString().split('T')[0],
    }

    return await this.prisma.product.upsert({
      where: {
        userId_productId: {
          userId,
          productId: product.productId,
        },
      },
      update: {
        name: productData.name,
        url: productData.url,
        image: productData.image,
        originalPrice: productData.originalPrice,
        discountedPrice: productData.discountedPrice,
        deliveryFee: productData.deliveryFee,
        category: productData.category,
        tags: productData.tags,
        memo: productData.memo,
        mallId: productData.mallId,
        status: productData.status,
        isComplete: productData.isComplete,
      },
      create: productData,
    })
  }

  /**
   * 크롤링 로그 저장
   */
  private async saveCrawlingLog(
    userId: bigint,
    logData: {
      keyword: string
      totalProducts: number
      savedProducts: number
      errors: number
      categories: string[]
      malls: string[]
    },
  ) {
    return await this.prisma.crawlingLog.create({
      data: {
        userId,
        content: {
          keyword: logData.keyword,
          totalProducts: logData.totalProducts,
          savedProducts: logData.savedProducts,
          errors: logData.errors,
          categories: logData.categories,
          malls: logData.malls,
          timestamp: new Date().toISOString(),
        },
        requestedCount: logData.totalProducts,
        successCount: logData.savedProducts,
        failedCount: logData.errors,
      },
    })
  }

  /**
   * 사용자의 상품 데이터 조회
   */
  async getUserProducts(
    userId: bigint,
    options: {
      limit?: number
      offset?: number
      keyword?: string
      category?: string
      status?: string
    } = {},
  ): Promise<UserProduct[]> {
    const where: any = {
      userId,
    }

    if (options.keyword) {
      where.name = {
        contains: options.keyword,
      }
    }

    if (options.category) {
      where.category = {
        has: options.category,
      }
    }

    if (options.status) {
      where.status = options.status
    }

    return (await this.prisma.product.findMany({
      where,
      include: {
        mall: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options.limit || 50,
      skip: options.offset || 0,
    })) as unknown as UserProduct[]
  }

  /**
   * 사용자의 크롤링 로그 조회
   */
  async getUserCrawlingLogs(
    userId: bigint,
    options: {
      limit?: number
      offset?: number
    } = {},
  ): Promise<UserCrawlingLog[]> {
    return (await this.prisma.crawlingLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options.limit || 20,
      skip: options.offset || 0,
    })) as unknown as UserCrawlingLog[]
  }

  /**
   * 사용자의 검색된 쇼핑몰 조회
   */
  async getUserSearchedMalls(
    userId: bigint,
    options: {
      limit?: number
      offset?: number
      keyword?: string
    } = {},
  ): Promise<UserSearchedMall[]> {
    const where: any = {
      userId,
    }

    if (options.keyword) {
      where.keyword = {
        contains: options.keyword,
      }
    }

    return (await this.prisma.searchedMall.findMany({
      where,
      include: {
        products: {
          take: 5, // 각 쇼핑몰당 최근 5개 상품만
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options.limit || 20,
      skip: options.offset || 0,
    })) as unknown as UserSearchedMall[]
  }

  /**
   * 통계 정보 조회
   */
  async getUserStats(userId: bigint): Promise<UserStats> {
    const [totalProducts, totalMalls, totalLogs, recentProducts] = await Promise.all([
      this.prisma.product.count({
        where: { userId },
      }),
      this.prisma.searchedMall.count({
        where: { userId },
      }),
      this.prisma.crawlingLog.count({
        where: { userId },
      }),
      this.prisma.product.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 최근 7일
          },
        },
      }),
    ])

    return {
      totalProducts,
      totalMalls,
      totalLogs,
      recentProducts,
    }
  }

  /**
   * 연결 종료
   */
  async disconnect() {
    await this.prisma.$disconnect()
  }
}
