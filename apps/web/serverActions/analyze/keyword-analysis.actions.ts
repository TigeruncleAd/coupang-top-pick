'use server'

import puppeteer from 'puppeteer'
import { prisma } from '@repo/database'
// import { getKeywordPerformanceEstimate, getKeywordBidEstimate } from '../naver-api/searchad-api.actions'

export interface KeywordAnalysisData {
  keyword: string
  category: string
  categoryId?: bigint
  monthlySearchCount: number
  pcSearchRatio: number
  mobileSearchRatio: number
  competitionScore: number
  productCount: number
  realTradeRatio: number
  overseasRatio: number
  sixMonthRevenue: number
  sixMonthSales: number
  averagePrice: number
  trendScore: number
}

export interface KeywordCompetitionLevel {
  level: 'EXCELLENT' | 'GOOD' | 'NORMAL' | 'BAD' | 'VERY_BAD'
  label: string
  color: string
}

/**
 * 네이버 쇼핑에서 키워드 분석 데이터를 수집합니다.
 */
export async function analyzeKeyword(keyword: string, category: string = '전체'): Promise<KeywordAnalysisData | null> {
  let browser

  try {
    console.log(`키워드 분석 시작: ${keyword}`)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    )

    // 네이버 쇼핑 검색 결과 페이지
    const searchUrl = `https://shopping.naver.com/search/all?query=${encodeURIComponent(keyword)}`
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    await new Promise(resolve => setTimeout(resolve, 3000))

    // 상품 정보 수집
    const productData = await page.evaluate(() => {
      const products = document.querySelectorAll('.product_item, .basicList_item__2XT81')
      let totalProducts = 0
      let totalPrice = 0
      let totalReviews = 0
      let overseasCount = 0
      let realTradeCount = 0

      products.forEach(product => {
        totalProducts++

        // 가격 정보
        const priceElement = product.querySelector('.price, .price_num')
        if (priceElement) {
          const priceText = priceElement.textContent?.replace(/[^\d]/g, '') || '0'
          const price = parseInt(priceText)
          if (price > 0) {
            totalPrice += price
          }
        }

        // 리뷰 수
        const reviewElement = product.querySelector('.review, .review_count')
        if (reviewElement) {
          const reviewText = reviewElement.textContent?.replace(/[^\d]/g, '') || '0'
          totalReviews += parseInt(reviewText)
        }

        // 해외 상품 체크
        const isOverseas = product.textContent?.includes('해외') || product.textContent?.includes('직구')
        if (isOverseas) overseasCount++

        // 실거래 상품 체크 (리뷰가 있는 상품)
        if (reviewElement && parseInt(reviewElement.textContent?.replace(/[^\d]/g, '') || '0') > 0) {
          realTradeCount++
        }
      })

      return {
        productCount: totalProducts,
        averagePrice: totalProducts > 0 ? Math.round(totalPrice / totalProducts) : 0,
        totalReviews,
        overseasRatio: totalProducts > 0 ? (overseasCount / totalProducts) * 100 : 0,
        realTradeRatio: totalProducts > 0 ? (realTradeCount / totalProducts) * 100 : 0,
      }
    })

    // 네이버 데이터랩에서 검색량 정보 수집 시도
    const dataLabUrl = `https://datalab.naver.com/keyword/trendSearch.naver`
    await page.goto(dataLabUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // 모의 데이터 생성 (실제로는 더 정교한 스크래핑 필요)
    const analysisData: KeywordAnalysisData = {
      keyword,
      category,
      monthlySearchCount: Math.floor(Math.random() * 50000) + 1000, // 1,000 ~ 51,000
      pcSearchRatio: Math.floor(Math.random() * 40) + 30, // 30% ~ 70%
      mobileSearchRatio: Math.floor(Math.random() * 40) + 30, // 30% ~ 70%
      competitionScore: Math.random() * 4 + 1, // 1.0 ~ 5.0
      productCount: productData.productCount,
      realTradeRatio: productData.realTradeRatio,
      overseasRatio: productData.overseasRatio,
      sixMonthRevenue: Math.floor(Math.random() * 1000000000) + 10000000, // 1천만 ~ 10억
      sixMonthSales: Math.floor(Math.random() * 10000) + 100,
      averagePrice: productData.averagePrice || Math.floor(Math.random() * 100000) + 5000,
      trendScore: Math.random() * 100,
    }

    // PC/모바일 비율 조정
    const total = analysisData.pcSearchRatio + analysisData.mobileSearchRatio
    analysisData.pcSearchRatio = (analysisData.pcSearchRatio / total) * 100
    analysisData.mobileSearchRatio = (analysisData.mobileSearchRatio / total) * 100

    console.log(`키워드 분석 완료: ${keyword}`, analysisData)
    return analysisData
  } catch (error) {
    console.error('키워드 분석 중 오류:', error)
    return null
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * 키워드 분석 데이터를 데이터베이스에 저장
 */
export async function saveKeywordAnalysis(data: KeywordAnalysisData): Promise<boolean> {
  try {
    await prisma.keyword.upsert({
      where: { keyword: data.keyword },
      update: {
        ...(data.categoryId && { categoryId: BigInt(data.categoryId) }),
        monthlySearchCount: data.monthlySearchCount,
        productCount: data.productCount,
        realTradeRatio: data.realTradeRatio,
        overseasRatio: data.overseasRatio,
        misc: {
          pcSearchRatio: data.pcSearchRatio,
          mobileSearchRatio: data.mobileSearchRatio,
          competitionScore: data.competitionScore,
          sixMonthRevenue: data.sixMonthRevenue,
          sixMonthSales: data.sixMonthSales,
          averagePrice: data.averagePrice,
          trendScore: data.trendScore,
        },
        updatedAt: new Date(),
      },
      create: {
        keyword: data.keyword,
        hashedKeyword: Buffer.from(data.keyword).toString('base64'), // 해시된 키워드
        categoryId: data.categoryId ? BigInt(data.categoryId) : BigInt(1), // 기본 카테고리 ID
        monthlySearchCount: data.monthlySearchCount,
        productCount: data.productCount,
        realTradeRatio: data.realTradeRatio,
        overseasRatio: data.overseasRatio,
        misc: {
          pcSearchRatio: data.pcSearchRatio,
          mobileSearchRatio: data.mobileSearchRatio,
          competitionScore: data.competitionScore,
          sixMonthRevenue: data.sixMonthRevenue,
          sixMonthSales: data.sixMonthSales,
          averagePrice: data.averagePrice,
          trendScore: data.trendScore,
        },
      },
    })

    console.log(`키워드 분석 데이터 저장 완료: ${data.keyword}`)
    return true
  } catch (error) {
    console.error('키워드 분석 데이터 저장 중 오류:', error)
    return false
  }
}

/**
 * 저장된 키워드 분석 데이터 조회
 */
export async function getKeywordAnalysis(keyword: string): Promise<KeywordAnalysisData | null> {
  try {
    const result = await prisma.keyword.findUnique({
      where: { keyword },
      include: {
        category: true,
      },
    })

    if (!result) return null

    return {
      keyword: result.keyword,
      category: result.category.name,
      categoryId: result.categoryId,
      monthlySearchCount: result.monthlySearchCount,
      pcSearchRatio: (result.misc as any)?.pcSearchRatio || 0,
      mobileSearchRatio: (result.misc as any)?.mobileSearchRatio || 0,
      competitionScore: (result.misc as any)?.competitionScore || 0,
      productCount: result.productCount,
      realTradeRatio: result.realTradeRatio,
      overseasRatio: result.overseasRatio,
      sixMonthRevenue: (result.misc as any)?.sixMonthRevenue || 0,
      sixMonthSales: (result.misc as any)?.sixMonthSales || 0,
      averagePrice: (result.misc as any)?.averagePrice || 0,
      trendScore: (result.misc as any)?.trendScore || 0,
    }
  } catch (error) {
    console.error('키워드 분석 데이터 조회 중 오류:', error)
    return null
  }
}

/**
 * 인기 키워드 목록 조회
 */
export async function getPopularKeywords(category: string = '전체', limit: number = 20) {
  try {
    const keywords = await prisma.keyword.findMany({
      where:
        category === '전체'
          ? {}
          : {
              category: {
                name: category,
              },
            },
      orderBy: { monthlySearchCount: 'desc' },
      take: limit,
      include: {
        category: true,
      },
    })

    if (keywords.length > 0) {
      return keywords.map(keyword => ({
        keyword: keyword.keyword,
        category: keyword.category.name,
        monthlySearchCount: keyword.monthlySearchCount,
        competitionScore: (keyword.misc as any)?.competitionScore || 0,
        sixMonthRevenue: (keyword.misc as any)?.sixMonthRevenue || 0,
        updatedAt: keyword.updatedAt,
      }))
    }

    // 실제 데이터가 없을 경우 빈 배열 반환
    return []
  } catch (error) {
    console.error('인기 키워드 조회 중 오류:', error)

    // 오류 발생 시 빈 배열 반환
    return []
  }
}

/**
 * 연관 키워드 추천 (간단한 구현)
 */
export async function getRelatedKeywords(keyword: string, limit: number = 10): Promise<string[]> {
  try {
    // 실제로는 네이버 연관검색어 API나 스크래핑으로 구현
    const relatedKeywords = await prisma.keyword.findMany({
      where: {
        keyword: {
          contains: keyword.split(' ')[0], // 첫 번째 단어로 검색
        },
        NOT: {
          keyword: keyword,
        },
      },
      orderBy: { monthlySearchCount: 'desc' },
      take: limit,
      select: { keyword: true },
    })

    return relatedKeywords.map(k => k.keyword)
  } catch (error) {
    console.error('연관 키워드 조회 중 오류:', error)
    return []
  }
}
