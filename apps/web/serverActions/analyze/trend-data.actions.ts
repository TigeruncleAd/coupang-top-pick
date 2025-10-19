'use server'

import { prisma } from '@repo/database'
import { getHTMLDumper } from '@/lib/analyze/html-dumper'
import { NaverBestKeywordParser } from '@/lib/analyze/naver-best-keyword-parser'

/**
 * 오늘 날짜 문자열 생성 (YYYY-MM-DD)
 */
function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * 카테고리명으로 DB에서 smartStoreId 조회
 */
async function getSmartStoreIdFromCategoryName(categoryName: string): Promise<string> {
  try {
    const category = await prisma.category.findFirst({
      where: {
        name: categoryName,
      },
      select: {
        smartStoreId: true,
      },
    })

    if (category && category.smartStoreId) {
      // console.log(`📋 카테고리 "${categoryName}"의 smartStoreId: ${category.smartStoreId}`)
      return category.smartStoreId
    }

    // console.log(`⚠️ 카테고리 "${categoryName}"의 smartStoreId를 찾을 수 없음, 전체(A)로 설정`)
    return 'A'
  } catch (error) {
    console.error(`❌ 카테고리 "${categoryName}" 조회 실패:`, error)
    return 'A'
  }
}

/**
 * 오늘 날짜에 해당 카테고리의 트렌드 데이터가 있는지 확인
 */
export async function checkTrendDataExists(
  categoryName: string,
  periodType: 'DAILY' | 'WEEKLY' = 'DAILY',
): Promise<{
  exists: boolean
  data?: any
  lastUpdated?: Date
}> {
  try {
    const today = getTodayString()

    // 카테고리 조회
    const category = await prisma.category.findFirst({
      where: {
        name: categoryName,
      },
    })

    if (!category) {
      return { exists: false }
    }

    // 트렌드 데이터 조회
    const trend = await prisma.trend.findFirst({
      where: {
        categoryId: category.id,
        type: periodType,
      },
      include: {
        TrendKeyword: {
          include: {
            keyword: true,
          },
          orderBy: {
            rank: 'asc',
          },
        },
      },
    })

    if (trend && trend.TrendKeyword.length > 0) {
      return {
        exists: true,
        data: trend,
        lastUpdated: trend.TrendKeyword[0]?.keyword.updatedAt,
      }
    }

    return { exists: false }
  } catch (error) {
    console.error('트렌드 데이터 확인 실패:', error)
    return { exists: false }
  }
}

/**
 * 카테고리별 트렌드 데이터 수집 (HTML 덤프 → 파싱 → DB 저장)
 */
export async function collectTrendData(
  categoryName: string,
  periodType: 'DAILY' | 'WEEKLY' = 'DAILY',
): Promise<{
  success: boolean
  message: string
  data?: any
  error?: string
}> {
  try {
    // 1. HTML 덤프
    const dumper = getHTMLDumper()
    await dumper.initialize()

    let url: string
    if (categoryName === '전체') {
      url = `https://snxbest.naver.com/keyword/best?categoryId=A&sortType=KEYWORD_POPULAR&periodType=${periodType}&ageType=ALL`
    } else {
      const smartStoreId = await getSmartStoreIdFromCategoryName(categoryName)
      url = `https://snxbest.naver.com/keyword/best?categoryId=${smartStoreId}&sortType=KEYWORD_POPULAR&periodType=${periodType}&ageType=ALL`
    }

    const dumpResult = await dumper.dumpPage(url, categoryName, false) // 파일 저장 비활성화
    await dumper.close()

    // 2. HTML 응답에서 에러 메시지 감지
    const htmlContent = dumpResult.htmlContent || ''
    if (
      htmlContent.includes('서비스 연결이 원활하지 않습니다') ||
      htmlContent.includes('errorResponsive_title') ||
      htmlContent.includes('일시적인 오류가 발생했습니다') ||
      htmlContent.includes('잠시 후 다시 시도해 주세요') ||
      htmlContent.includes('서비스 점검 중입니다')
    ) {
      console.error('❌ 서비스 에러 감지됨')
      return {
        success: false,
        message: '카테고리 정보가 만료되었거나 서비스가 일시적으로 불안정합니다.',
        error: '카테고리 정보가 만료되었거나 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.',
      }
    }

    // 3. HTML 파싱
    const parser = new NaverBestKeywordParser()
    const parsedData = await parser.parseHTML(htmlContent, url)

    if (parsedData.keywords.length === 0) {
      return {
        success: false,
        message: '키워드 데이터를 찾을 수 없습니다.',
        error: 'No keywords found in HTML',
      }
    }

    // 3. DB 저장
    const today = getTodayString()

    // 카테고리 조회
    const category = await prisma.category.findFirst({
      where: {
        name: categoryName,
      },
    })

    if (!category) {
      return {
        success: false,
        message: '카테고리를 찾을 수 없습니다.',
        error: 'Category not found',
      }
    }

    // 기존 트렌드 데이터 확인
    const existingTrend = await prisma.trend.findFirst({
      where: {
        categoryId: category.id,
        type: periodType,
      },
    })

    let trend
    if (existingTrend) {
      // 업데이트
      trend = await prisma.trend.update({
        where: {
          id: existingTrend.id,
        },
        data: {
          date: today,
          bestProducts: [],
          misc: {
            url,
            totalKeywords: parsedData.keywords.length,
            collectedAt: new Date().toISOString(),
          },
        },
      })
    } else {
      // 생성
      trend = await prisma.trend.create({
        data: {
          categoryId: category.id,
          date: today,
          type: periodType,
          bestProducts: [],
          misc: {
            url,
            totalKeywords: parsedData.keywords.length,
            collectedAt: new Date().toISOString(),
          },
        },
      })
    }

    // 기존 트렌드 키워드 삭제 (새로운 키워드 데이터로 교체하기 위해)
    await prisma.trendKeyword.deleteMany({
      where: {
        trendId: trend.id,
      },
    })

    // 키워드 데이터 저장
    const TrendKeyword = []

    for (const keywordData of parsedData.keywords) {
      // 키워드가 이미 존재하는지 확인
      let keyword = await prisma.keyword.findUnique({
        where: {
          keyword: keywordData.keyword,
        },
      })

      // 키워드가 없으면 생성
      if (!keyword) {
        keyword = await prisma.keyword.create({
          data: {
            keyword: keywordData.keyword,
            hashedKeyword: keywordData.keyword, // 간단히 키워드와 동일하게 설정
            categoryId: category.id,
            productCount: 0,
            monthlySearchCount: 0,
            mobileSearchCount: 0,
            pcSearchCount: 0,
            top40SalesCount: 0,
            top40Sales: 0,
            top40AveragePrice: 0,
            top80SalesCount: 0,
            top80Sales: 0,
            top80AveragePrice: 0,
            relatedKeywords: [],
            productCompetitionScore: 0,
            realTradeRatio: 0,
            bundleRatio: 0,
            overseasRatio: 0,
            recentYearRatio: 0,
            adClickCount: 0,
            adClickRatio: 0,
            adClickRatioPC: 0,
            adClickRatioMobile: 0,
            adClickCompetitionRatio: 0,
            adPrice: 0,
            adPricePerPrice: 0,
            adPricePerClick: 0,
            coupangProductCount: 0,
            coupangRocketProductCount: 0,
            coupangProductAveragePrice: 0,
            coupangeAverageReviewCount: 0,
            coupangRocketProductRatio: 0,
            coupangProductCompetitionScore: 0,
            coupangBundleRatio: 0,
            coupangOverseasRatio: 0,
            coupangRecentYearRatio: 0,
            misc: {
              trend: keywordData.trend,
              trendText: keywordData.trendText,
              category: keywordData.category,
            },
          },
        })
      }

      // 트렌드 키워드 생성 (keyword 관계 포함)
      const trendKeyword = await prisma.trendKeyword.create({
        data: {
          trendId: trend.id,
          keywordId: keyword.id,
          rank: keywordData.rank,
          changeRate: keywordData.trendText,
          misc: {
            trend: keywordData.trend,
            category: keywordData.category,
            relatedProducts: keywordData.relatedProducts,
          },
        },
        include: {
          keyword: true,
        },
      })

      TrendKeyword.push(trendKeyword)
    }

    // 키워드 데이터를 UI에서 사용할 수 있는 형태로 변환
    const keywords = TrendKeyword.map(tk => {
      return {
        rank: tk.rank,
        keyword: tk.keyword?.keyword || '알 수 없음',
        trend: (tk.misc as any)?.trend || 'stable',
        trendText: tk.changeRate || '유지',
        category: (tk.misc as any)?.category || categoryName,
        relatedProducts: (tk.misc as any)?.relatedProducts || [],
        searchVolume: tk.keyword?.monthlySearchCount || 0,
        competitionScore: tk.keyword?.productCompetitionScore || 0,
      }
    })

    // BigInt를 문자열로 변환하는 헬퍼 함수
    const serializeBigInt = (obj: any): any => {
      if (obj === null || obj === undefined) return obj
      if (typeof obj === 'bigint') return obj.toString()
      if (Array.isArray(obj)) return obj.map(serializeBigInt)
      if (typeof obj === 'object') {
        const serialized: any = {}
        for (const [key, value] of Object.entries(obj)) {
          serialized[key] = serializeBigInt(value)
        }
        return serialized
      }
      return obj
    }

    return {
      success: true,
      message: `${categoryName} 트렌드 데이터 수집 완료`,
      data: {
        trend: serializeBigInt(trend),
        keywords,
        totalKeywords: TrendKeyword.length,
        categoryName,
        date: today,
        // 디버깅 정보 추가
        htmlContent: dumpResult.htmlContent,
        parsedData: parsedData,
        rawTrendKeywords: serializeBigInt(TrendKeyword),
      },
    }
  } catch (error) {
    console.error('트렌드 데이터 수집 실패:', error)
    return {
      success: false,
      message: '트렌드 데이터 수집 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 트렌드 데이터 조회
 */
export async function getTrendData(
  categoryName: string,
  periodType: 'DAILY' | 'WEEKLY' = 'DAILY',
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const today = getTodayString()

    // 카테고리 조회
    const category = await prisma.category.findFirst({
      where: {
        name: categoryName,
      },
    })

    if (!category) {
      return {
        success: false,
        error: 'Category not found',
      }
    }

    // 트렌드 데이터 조회
    const trend = await prisma.trend.findFirst({
      where: {
        categoryId: category.id,
        type: periodType,
      },
      include: {
        TrendKeyword: {
          include: {
            keyword: true,
          },
          orderBy: {
            rank: 'asc',
          },
        },
        category: true,
      },
    })

    if (!trend) {
      return {
        success: false,
        error: 'No trend data found',
      }
    }

    // 데이터 변환
    const trendData = {
      categoryName: trend.category.name,
      date: trend.date,
      type: trend.type,
      totalKeywords: trend.TrendKeyword.length,
      keywords: trend.TrendKeyword.map(tk => ({
        rank: tk.rank,
        keyword: tk.keyword.keyword,
        trend: (tk.misc as any)?.trend || 'stable',
        trendText: tk.changeRate,
        category: (tk.misc as any)?.category || '',
        relatedProducts: (tk.misc as any)?.relatedProducts || [],
        searchVolume: tk.keyword.monthlySearchCount,
        competitionScore: tk.keyword.productCompetitionScore,
      })),
      collectedAt: (trend.misc as any)?.collectedAt,
    }

    // BigInt를 문자열로 변환하는 헬퍼 함수
    const serializeBigInt = (obj: any): any => {
      if (obj === null || obj === undefined) return obj
      if (typeof obj === 'bigint') return obj.toString()
      if (Array.isArray(obj)) return obj.map(serializeBigInt)
      if (typeof obj === 'object') {
        const serialized: any = {}
        for (const [key, value] of Object.entries(obj)) {
          serialized[key] = serializeBigInt(value)
        }
        return serialized
      }
      return obj
    }

    return {
      success: true,
      data: serializeBigInt(trendData),
    }
  } catch (error) {
    console.error('트렌드 데이터 조회 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
