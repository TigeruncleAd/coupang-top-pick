'use server'

import { prisma } from '@repo/database'
import { getServerUser } from '@/lib/utils/server/getServerUser'

export type SaveKeywordAnalysisResult = {
  status: 'success' | 'error'
  message: string
}

export async function saveKeywordAnalysis(data: {
  keyword: string
  total: number
  nluTerms: Array<{ type: string; keyword: string }>
  categories: Array<{ id: string; name: string; relevance: number }>
  productInfos: Array<{
    rank: string | number
    brand: string | null
    pcUrl: string
    price: number
    score: string | number
    mblUrl: string
    mallUrl: string
    mallName: string
    keepCount: number
    mallGrade: string
    overseaTp: string
    categories: Array<{ id: string; name: string }>
    deliveryFee: number
    reviewCount: number
    isBrandStore: string | number
    purchaseCount: number
  }>
  queryValidate: { status: string; isAdultQuery: boolean }
  average10Price: number
  average40Price: number
  average80Price: number
  recommendTrend: {
    gdid: string
    tags: Array<{
      gdid: string
      tagId: string
      imgUrl: string
      recInfo: string
      tagName: string
      tagReason: string
    }>
  }
  relatedQueries: Array<{ query: string; imageUrl: string }>
  product10Prices: { price: number; purchaseCount: number }
  product40Prices: { price: number; purchaseCount: number }
  product80Prices: { price: number; purchaseCount: number }
}): Promise<SaveKeywordAnalysisResult> {
  try {
    const user = await getServerUser()
    if (!user) {
      return { status: 'error', message: '인증이 필요합니다.' }
    }

    // 1. Keyword 테이블에 키워드 정보 저장/업데이트
    const keyword = await prisma.keyword.upsert({
      where: { keyword: data.keyword },
      update: {
        productCount: data.total,
        top40AveragePrice: data.average40Price,
        top80AveragePrice: data.average80Price,
        top40Sales: data.product40Prices.price,
        top40SalesCount: data.product40Prices.purchaseCount,
        top80Sales: data.product80Prices.price,
        top80SalesCount: data.product80Prices.purchaseCount,
        relatedKeywords: data.relatedQueries.map(q => q.query),
        adMisc: {
          nluTerms: data.nluTerms,
          categories: data.categories,
          recommendTrend: data.recommendTrend,
          queryValidate: data.queryValidate,
        },
        misc: {
          average10Price: data.average10Price,
          product10Prices: data.product10Prices,
        },
        adInfoUpdatedAt: new Date(),
      },
      create: {
        keyword: data.keyword,
        hashedKeyword: Buffer.from(data.keyword).toString('base64'),
        productCount: data.total,
        top40AveragePrice: data.average40Price,
        top80AveragePrice: data.average80Price,
        top40Sales: data.product40Prices.price,
        top40SalesCount: data.product40Prices.purchaseCount,
        top80Sales: data.product80Prices.price,
        top80SalesCount: data.product80Prices.purchaseCount,
        relatedKeywords: data.relatedQueries.map(q => q.query),
        adMisc: {
          nluTerms: data.nluTerms,
          categories: data.categories,
          recommendTrend: data.recommendTrend,
          queryValidate: data.queryValidate,
        },
        misc: {
          average10Price: data.average10Price,
          product10Prices: data.product10Prices,
        },
        categoryId: 1, // 기본 카테고리 ID (실제로는 적절한 카테고리 ID를 설정해야 함)
        adInfoUpdatedAt: new Date(),
      },
    })

    // 2. UserKeyword 테이블에 사용자별 키워드 분석 결과 저장
    await prisma.userKeyword.create({
      data: {
        keywordId: keyword.id,
        userId: user.id,
        searchedAt: new Date(),
        productCount: data.total,
        monthlySearchCount: data.total, // 임시로 total을 사용
        top40AveragePrice: data.average40Price,
        top80AveragePrice: data.average80Price,
        top40Sales: data.product40Prices.price,
        top40SalesCount: data.product40Prices.purchaseCount,
        top80Sales: data.product80Prices.price,
        top80SalesCount: data.product80Prices.purchaseCount,
        relatedKeywords: data.relatedQueries.map(q => q.query),
        productInfos: data.productInfos,
        misc: {
          nluTerms: data.nluTerms,
          categories: data.categories,
          recommendTrend: data.recommendTrend,
          queryValidate: data.queryValidate,
          average10Price: data.average10Price,
          product10Prices: data.product10Prices,
        },
      },
    })

    return { status: 'success', message: '키워드 분석 데이터가 저장되었습니다.' }
  } catch (error) {
    console.error('키워드 분석 데이터 저장 실패:', error)
    return { status: 'error', message: '데이터 저장에 실패했습니다.' }
  }
}
