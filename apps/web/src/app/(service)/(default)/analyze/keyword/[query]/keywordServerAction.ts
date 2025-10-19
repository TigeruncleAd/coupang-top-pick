'use server'

import { Keyword, prisma, UserKeyword } from '@repo/database'

export type GetKeywordListResult = {
  status: 'success' | 'error' | 'retry'
  result: UserKeyword & { keyword: Keyword }
}

export async function getKeywordList(keyword: string, userId: string): Promise<GetKeywordListResult> {
  console.log('getKeywordList', keyword, userId)
  const result = await prisma.userKeyword.findFirst({
    where: {
      keyword: {
        keyword: keyword,
      },
      userId: BigInt(userId),
      source: 'search', // 검색으로 생성된 데이터만
    },
    include: {
      keyword: true,
    },
    orderBy: {
      searchedAt: 'desc',
    },
  })
  if (!result) {
    return {
      status: 'retry',
      result: null,
    }
  }
  console.log('🔍 result', result)

  // UserKeyword에서 데이터를 포맷팅
  const misc = result.misc as any

  const formattedResult = {
    ...result,
    // UserKeyword 데이터를 기존 구조에 맞게 변환
    total: misc?.total || result.productCount,
    productCount: result.productCount,
    nluTerms: misc?.nluTerms || [],
    categories: misc?.categories || [],
    productInfos: (result.productInfos as any[]) || [],
    queryValidate: misc?.queryValidate || { status: 'NORMAL', isAdultQuery: false },
    average10Price: misc?.average10Price || 0,
    average40Price: misc?.average40Price || 0,
    average80Price: misc?.average80Price || 0,
    recommendTrend: misc?.recommendTrend || { gdid: '', tags: [] },
    relatedQueries: misc?.relatedQueries || [],
    relatedQueriesBottom: misc?.relatedQueriesBottom || [],
    product10Prices: misc?.product10Prices || { price: 0, purchaseCount: 0 },
    product40Prices: misc?.product40Prices || { price: 0, purchaseCount: 0 },
    product80Prices: misc?.product80Prices || { price: 0, purchaseCount: 0 },
    // 추가 필드들
    relatedKeywords: misc?.relatedQueries?.map((q: any) => q.query) || [],
    top40Sales: misc?.product40Prices?.price || 0,
    top40SalesCount: misc?.product40Prices?.purchaseCount || 0,
    top80Sales: misc?.product80Prices?.price || 0,
    top80SalesCount: misc?.product80Prices?.purchaseCount || 0,
    top40AveragePrice: misc?.average40Price || 0,
    top80AveragePrice: misc?.average80Price || 0,
  }

  return {
    status: 'success',
    result: formattedResult,
  }
}
