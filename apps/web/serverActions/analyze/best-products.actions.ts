'use server'

import { prisma } from '@repo/database'
import { getHTMLDumper } from '@/lib/analyze/html-dumper'
import { parse } from 'node-html-parser'

// getTodayString 함수를 직접 정의
function getTodayString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export interface BestProduct {
  rank: number
  title: string
  price: number
  originalPrice?: number
  discountRate?: number
  brand: string
  rating: number
  reviewCount: number
  imageUrl?: string
  productUrl?: string
  shippingFee?: number
  isFreeShipping?: boolean
  isNaverDelivery?: boolean
}

export interface BestProductsResponse {
  success: boolean
  data?: {
    categoryName: string
    products: BestProduct[]
    totalProducts: number
    collectedAt: string
  }
  error?: string
}

/**
 * 카테고리별 베스트 상품 데이터 수집
 */
export async function collectBestProducts(
  categoryName: string,
  periodType: 'DAILY' | 'WEEKLY' = 'DAILY',
): Promise<BestProductsResponse> {
  try {
    console.log(`🛍️ 베스트 상품 데이터 수집 시작: ${categoryName} (${periodType})`)

    // 1. 카테고리 조회
    const category = await prisma.category.findFirst({
      where: {
        name: categoryName,
      },
      select: {
        id: true,
        smartStoreId: true,
      },
    })

    if (!category) {
      return {
        success: false,
        error: `카테고리 "${categoryName}"를 찾을 수 없습니다.`,
      }
    }

    // 3. 베스트 상품 URL 생성
    const smartStoreId = category.smartStoreId || 'A'
    const url = `https://snxbest.naver.com/product/best/buy?categoryId=${smartStoreId}&sortType=PRODUCT_BUY&periodType=${periodType}`

    console.log(`🔗 베스트 상품 URL: ${url}`)

    // 4. HTML 덤프 및 파싱
    const dumper = getHTMLDumper()
    await dumper.initialize()
    const dumpResult = await dumper.dumpPage(url, categoryName, false)
    await dumper.close()

    if (!dumpResult.success) {
      return {
        success: false,
        error: dumpResult.error || 'HTML 덤프 실패',
      }
    }

    // 5. 베스트 상품 데이터 파싱
    const products = parseBestProductsFromHTML(dumpResult.htmlContent)

    if (products.length === 0) {
      return {
        success: false,
        error: '베스트 상품 데이터를 파싱할 수 없습니다.',
      }
    }

    console.log(`📊 ${products.length}개 베스트 상품 파싱 완료`)

    // 6. 데이터베이스 업데이트
    const bestProductsData = {
      products,
      totalProducts: products.length,
      collectedAt: new Date().toISOString(),
    }

    // 데이터베이스 업데이트 (upsert 사용)
    const today = getTodayString()

    console.log(`🔄 데이터베이스 업데이트 시작: ${categoryName} (${periodType})`)
    console.log(`📊 베스트 상품 데이터 크기: ${JSON.stringify(bestProductsData).length} bytes`)

    // 기존 데이터 확인
    const existingTrend = await prisma.trend.findFirst({
      where: {
        categoryId: category.id,
        type: periodType,
      },
    })

    let result
    if (existingTrend) {
      // 업데이트
      result = await prisma.trend.update({
        where: {
          id: existingTrend.id,
        },
        data: {
          date: today,
          bestProducts: bestProductsData as any,
        },
      })
    } else {
      // 생성
      result = await prisma.trend.create({
        data: {
          categoryId: category.id,
          date: today,
          type: periodType,
          bestProducts: bestProductsData as any,
        },
      })
    }

    console.log(`✅ 베스트 상품 데이터 저장 완료: ${categoryName}`, {
      id: result.id,
      categoryId: result.categoryId,
      type: result.type,
      date: result.date,
      bestProductsCount: Array.isArray(result.bestProducts) ? result.bestProducts.length : 'N/A',
    })

    return {
      success: true,
      data: {
        categoryName,
        products,
        totalProducts: products.length,
        collectedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('베스트 상품 데이터 수집 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    }
  }
}

/**
 * HTML에서 베스트 상품 데이터 파싱
 */
function parseBestProductsFromHTML(htmlContent: string): BestProduct[] {
  try {
    const root = parse(htmlContent)
    const products: BestProduct[] = []

    // 상품 카드 선택자 (유연한 선택자 사용)
    const productCards = root.querySelectorAll('[class*="productCardResponsive_inner"]')

    productCards.forEach((element, index) => {
      // 순위
      const rankElement = element.querySelector('[class*="productCardResponsive_ranking"]')
      const rankText = rankElement?.textContent?.trim() || ''
      const rank = parseInt(rankText.replace(/[^0-9]/g, ''), 10) || index + 1

      // 상품명
      const titleElement = element.querySelector('[class*="productCardResponsive_title"]')
      const title = titleElement?.textContent?.trim() || ''

      // 상호명 (브랜드)
      const brandElement = element.querySelector('[class*="productCardResponsive_store"]')
      const brand = brandElement?.textContent?.trim() || ''

      // 상품 이미지
      const imageElement = element.querySelector('[class*="productCardResponsive_image"]')
      const imageUrl = imageElement?.getAttribute('src') || ''

      // 상품 상세 링크 (여러 방법으로 시도)
      let productUrl = ''

      // 방법 1: productCardResponsive_link 클래스를 가진 링크 찾기
      const linkElement = element.querySelector('a[class*="productCardResponsive_link"]')
      if (linkElement) {
        productUrl = linkElement.getAttribute('href') || ''
      }
      // 가격 정보
      const priceElement = element.querySelector(
        '[class*="productCardResponsive_price"] [class*="productCardResponsive_number"]',
      )
      const priceText = priceElement?.textContent?.trim() || ''
      const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || 0

      // 정가 (할인 전 가격)
      const originalPriceElement = element.querySelector(
        '[class*="productCardResponsive_origin_price"] [class*="productCardResponsive_number"]',
      )
      const originalPriceText = originalPriceElement?.textContent?.trim() || ''
      const originalPrice = originalPriceText ? parseInt(originalPriceText.replace(/[^0-9]/g, ''), 10) : undefined

      // 할인율
      const discountElement = element.querySelector('[class*="productCardResponsive_discount"]')
      const discountRateText = discountElement?.textContent?.trim() || ''
      const discountRate = discountRateText ? parseInt(discountRateText.replace(/[^0-9]/g, ''), 10) : undefined

      // 배송 정보
      const shippingTagElements = element.querySelectorAll('[class*="productCardResponsive_tag"]')
      const shippingTags = Array.from(shippingTagElements).map(el => el.textContent?.trim() || '')
      const isFreeShipping = shippingTags.includes('무료배송')
      const isNaverDelivery = shippingTags.some(tag => tag.includes('N배송') || tag.includes('네이버배송'))

      // 배송비 (무료배송이 아닌 경우)
      let shippingFee: number | undefined
      if (!isFreeShipping) {
        const shippingText = shippingTags.find(tag => tag.includes('배송비'))
        if (shippingText) {
          const match = shippingText.match(/([0-9,]+)원/)
          if (match) {
            shippingFee = parseInt(match[1].replace(/,/g, ''), 10)
          }
        }
      }

      // 평점 및 리뷰
      const ratingElement = element.querySelector('[class*="productCardResponsive_rating"]')
      const ratingText = ratingElement?.textContent?.trim() || ''
      const rating = parseFloat(ratingText.replace(/[^0-9.]/g, '')) || 0

      const reviewElement = element.querySelector('[class*="productCardResponsive_review"]')
      const reviewText = reviewElement?.textContent?.trim() || ''
      const reviewCountMatch = reviewText.match(/리뷰\s*([0-9,]+)/)
      const reviewCount = reviewCountMatch ? parseInt(reviewCountMatch[1].replace(/,/g, ''), 10) : 0

      if (title && price > 0) {
        products.push({
          rank,
          title,
          price,
          originalPrice,
          discountRate,
          brand,
          isFreeShipping,
          shippingFee,
          isNaverDelivery,
          rating,
          reviewCount,
          imageUrl,
          productUrl,
        })
      }
    })

    console.log(`📦 ${products.length}개 베스트 상품 파싱 완료`)
    return products
  } catch (error) {
    console.error('베스트 상품 파싱 실패:', error)
    return []
  }
}

/**
 * 베스트 상품 데이터 조회
 */
export async function getBestProducts(
  categoryName: string,
  periodType: 'DAILY' | 'WEEKLY' = 'DAILY',
): Promise<BestProductsResponse> {
  try {
    const category = await prisma.category.findFirst({
      where: {
        name: categoryName,
      },
      select: {
        id: true,
      },
    })

    if (!category) {
      return {
        success: false,
        error: `카테고리 "${categoryName}"를 찾을 수 없습니다.`,
      }
    }

    const today = getTodayString()
    const trend = await prisma.trend.findFirst({
      where: {
        categoryId: category.id,
        type: periodType,
      },
    })

    if (!trend || !trend.bestProducts) {
      return {
        success: false,
        error: '베스트 상품 데이터가 없습니다.',
      }
    }

    const bestProductsData = trend.bestProducts as any

    return {
      success: true,
      data: {
        categoryName,
        products: bestProductsData.products || [],
        totalProducts: bestProductsData.totalProducts || 0,
        collectedAt: bestProductsData.collectedAt || new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('베스트 상품 데이터 조회 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    }
  }
}

/**
 * 베스트 상품 데이터 존재 여부 확인
 */
export async function checkBestProductsExists(
  categoryName: string,
  periodType: 'DAILY' | 'WEEKLY' = 'DAILY',
): Promise<{
  exists: boolean
  data?: any
  lastUpdated?: Date
}> {
  try {
    const category = await prisma.category.findFirst({
      where: {
        name: categoryName,
      },
      select: {
        id: true,
      },
    })

    if (!category) {
      return { exists: false }
    }

    const today = getTodayString()
    const trend = await prisma.trend.findFirst({
      where: {
        categoryId: category.id,
        type: periodType,
      },
    })

    if (trend && trend.bestProducts) {
      const bestProductsData = trend.bestProducts as any
      if (bestProductsData.products && bestProductsData.products.length > 0) {
        return {
          exists: true,
          data: bestProductsData,
          lastUpdated: new Date(bestProductsData.collectedAt),
        }
      }
    }

    return { exists: false }
  } catch (error) {
    console.error('베스트 상품 데이터 확인 실패:', error)
    return { exists: false }
  }
}
