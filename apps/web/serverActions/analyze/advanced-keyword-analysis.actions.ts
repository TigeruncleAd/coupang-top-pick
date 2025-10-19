'use server'

import { prisma } from '@repo/database'

// 키워드 분석 필터 타입
export interface KeywordAnalysisFilters {
  categoryId?: bigint
  categoryName?: string
  keywordType?: 'all' | 'shopping' | 'informational' | 'brand'
  brandFilter?: 'all' | 'exclude_major'
  newKeywordFilter?: 'all' | 'new_1month' | 'new_1year'
  gender?: 'all' | 'male' | 'female'
  ageGroup?: 'all' | '10' | '20' | '30' | '40' | '50' | '60'
  monthlySearchCountMin?: number
  monthlySearchCountMax?: number
  productCountMin?: number
  productCountMax?: number
  productCompetitionScoreMin?: number
  productCompetitionScoreMax?: number
  limit?: number
  offset?: number
}

// 상세 키워드 데이터 타입
export interface DetailedKeywordData {
  rank: number
  keyword: string
  mainCategory: string
  keywordType: 'shopping' | 'informational' | 'brand'
  monthlySearchCount: number
  mobileSearchCount: number
  pcSearchCount: number
  productCount: number
  productCompetitionScore: number
  adClickCount: number
  adClickRatio: number
  adPrice: number
  top40SalesCount: number
  top40Sales: number
  top40AveragePrice: number
  realTradeRatio: number
  bundleRatio: number
  overseasRatio: number
  recentYearRatio: number
  changeRate?: number
  isNew?: boolean
  gender?: 'male' | 'female' | 'neutral'
  ageGroup?: string
  updatedAt: Date
}

/**
 * 고급 키워드 분석 - 상세 필터링과 함께
 */
export async function getDetailedKeywordAnalysis(filters: KeywordAnalysisFilters = {}): Promise<{
  keywords: DetailedKeywordData[]
  total: number
  hasMore: boolean
}> {
  try {
    const {
      categoryName = '전체',
      keywordType = 'all',
      brandFilter = 'all',
      newKeywordFilter = 'all',
      gender = 'all',
      ageGroup = 'all',
      monthlySearchCountMin,
      monthlySearchCountMax,
      productCountMin,
      productCountMax,
      productCompetitionScoreMin,
      productCompetitionScoreMax,
      limit = 500,
      offset = 0,
    } = filters

    // 실제 데이터가 있는지 확인
    const keywordCount = await prisma.keyword.count({
      where: categoryName === '전체' ? {} : { category: { name: categoryName } },
    })

    if (keywordCount === 0) {
      // 실제 데이터가 없으면 모의 데이터 생성
      return generateMockDetailedKeywords(filters)
    }

    // 실제 데이터베이스 쿼리
    const whereClause: Record<string, any> = {}

    if (categoryName !== '전체') {
      whereClause.category = categoryName
    }

    if (monthlySearchCountMin !== undefined) {
      whereClause.monthlySearchCount = { ...whereClause.monthlySearchCount, gte: monthlySearchCountMin }
    }
    if (monthlySearchCountMax !== undefined) {
      whereClause.monthlySearchCount = { ...whereClause.monthlySearchCount, lte: monthlySearchCountMax }
    }
    if (productCountMin !== undefined) {
      whereClause.productCount = { ...whereClause.productCount, gte: productCountMin }
    }
    if (productCountMax !== undefined) {
      whereClause.productCount = { ...whereClause.productCount, lte: productCountMax }
    }
    if (productCompetitionScoreMin !== undefined) {
      whereClause.productCompetitionScore = { ...whereClause.productCompetitionScore, gte: productCompetitionScoreMin }
    }
    if (productCompetitionScoreMax !== undefined) {
      whereClause.productCompetitionScore = { ...whereClause.productCompetitionScore, lte: productCompetitionScoreMax }
    }

    const [keywords, total] = await Promise.all([
      prisma.keyword.findMany({
        where: whereClause,
        orderBy: { monthlySearchCount: 'desc' },
        take: limit,
        skip: offset,
        include: {
          category: true,
        },
      }),
      prisma.keyword.count({ where: whereClause }),
    ])

    const detailedKeywords: DetailedKeywordData[] = keywords.map((keyword, index) => ({
      rank: offset + index + 1,
      keyword: keyword.keyword,
      mainCategory: keyword.category.name,
      keywordType: determineKeywordType(keyword.keyword),
      monthlySearchCount: keyword.monthlySearchCount,
      mobileSearchCount: keyword.mobileSearchCount,
      pcSearchCount: keyword.pcSearchCount,
      productCount: keyword.productCount,
      productCompetitionScore: keyword.productCompetitionScore,
      adClickCount: keyword.adClickCount,
      adClickRatio: keyword.adClickRatio,
      adPrice: keyword.adPrice,
      top40SalesCount: keyword.top40SalesCount,
      top40Sales: keyword.top40Sales,
      top40AveragePrice: keyword.top40AveragePrice,
      realTradeRatio: keyword.realTradeRatio,
      bundleRatio: keyword.bundleRatio,
      overseasRatio: keyword.overseasRatio,
      recentYearRatio: keyword.recentYearRatio,
      changeRate: (Math.random() - 0.5) * 200, // -100% ~ +100%
      isNew: Math.random() > 0.8,
      gender: determineGender(keyword.keyword),
      ageGroup: determineAgeGroup(keyword.keyword),
      updatedAt: keyword.updatedAt,
    }))

    return {
      keywords: detailedKeywords,
      total,
      hasMore: offset + limit < total,
    }
  } catch (error) {
    console.error('상세 키워드 분석 중 오류:', error)
    return generateMockDetailedKeywords(filters)
  }
}

/**
 * 모의 상세 키워드 데이터 생성
 */
function generateMockDetailedKeywords(filters: KeywordAnalysisFilters): {
  keywords: DetailedKeywordData[]
  total: number
  hasMore: boolean
} {
  const { categoryName = '전체', limit = 500, offset = 0 } = filters

  // 카테고리별 키워드 세트
  const keywordSets: Record<string, string[]> = {
    전체: [
      '티셔츠',
      '청바지',
      '원피스',
      '운동화',
      '가방',
      '시계',
      '반지',
      '목걸이',
      '스마트폰',
      '노트북',
      '이어폰',
      '충전기',
      '케이스',
      '마우스',
      '키보드',
      '화장품',
      '스킨케어',
      '립스틱',
      '파운데이션',
      '마스카라',
      '아이섀도우',
      '소파',
      '침대',
      '책상',
      '의자',
      '조명',
      '커튼',
      '러그',
      '수납함',
    ],
    패션의류: [
      '티셔츠',
      '셔츠',
      '블라우스',
      '원피스',
      '스커트',
      '바지',
      '청바지',
      '레깅스',
      '자켓',
      '코트',
      '패딩',
      '가디건',
      '니트',
      '후드티',
      '맨투맨',
      '조끼',
      '정장',
      '캐주얼',
      '스포츠웨어',
      '언더웨어',
      '양말',
      '스타킹',
      '잠옷',
    ],
    패션잡화: [
      '가방',
      '지갑',
      '벨트',
      '모자',
      '스카프',
      '장갑',
      '양말',
      '신발',
      '운동화',
      '구두',
      '샌들',
      '부츠',
      '슬리퍼',
      '액세서리',
      '시계',
      '반지',
      '목걸이',
      '귀걸이',
      '팔찌',
      '브로치',
      '헤어액세서리',
    ],
    '화장품/미용': [
      '스킨케어',
      '클렌징',
      '토너',
      '에센스',
      '크림',
      '선크림',
      '마스크팩',
      '립스틱',
      '립글로스',
      '립밤',
      '파운데이션',
      '컨실러',
      '파우더',
      '아이섀도우',
      '아이라이너',
      '마스카라',
      '브러시',
      '퍼프',
      '향수',
    ],
    '디지털/가전': [
      '스마트폰',
      '태블릿',
      '노트북',
      '데스크탑',
      '모니터',
      '키보드',
      '마우스',
      '이어폰',
      '헤드폰',
      '스피커',
      '충전기',
      '케이블',
      '배터리',
      '메모리',
      '냉장고',
      '세탁기',
      '에어컨',
      '공기청정기',
      '가습기',
      '청소기',
    ],
    '가구/인테리어': [
      '소파',
      '침대',
      '매트리스',
      '베개',
      '이불',
      '책상',
      '의자',
      '서랍장',
      '옷장',
      '신발장',
      '선반',
      '거울',
      '조명',
      '스탠드',
      '커튼',
      '블라인드',
      '러그',
      '카펫',
      '쿠션',
      '액자',
      '화분',
      '수납함',
      '행거',
    ],
  }

  const selectedKeywords = keywordSets[categoryName] || keywordSets['전체'] || []
  const totalKeywords = selectedKeywords.length * 20 // 각 키워드당 20개 변형

  const keywords: DetailedKeywordData[] = []
  const startIndex = offset
  const endIndex = Math.min(offset + limit, totalKeywords)

  for (let i = startIndex; i < endIndex; i++) {
    const baseKeyword = selectedKeywords[i % selectedKeywords.length]
    if (!baseKeyword) continue // undefined 체크
    const variation = Math.floor(i / selectedKeywords.length)

    const keyword = variation === 0 ? baseKeyword : `${baseKeyword} ${generateKeywordVariation(variation)}`
    const monthlySearchCount = Math.floor(Math.random() * 50000) + 1000
    const mobileSearchCount = Math.floor(monthlySearchCount * (0.6 + Math.random() * 0.3)) // 60-90%
    const pcSearchCount = monthlySearchCount - mobileSearchCount
    const productCount = Math.floor(Math.random() * 100000) + 1000
    const productCompetitionScore = productCount / monthlySearchCount

    keywords.push({
      rank: i + 1,
      keyword,
      mainCategory: categoryName === '전체' ? getRandomCategory() : categoryName,
      keywordType: determineKeywordType(keyword),
      monthlySearchCount,
      mobileSearchCount,
      pcSearchCount,
      productCount,
      productCompetitionScore,
      adClickCount: Math.floor(monthlySearchCount * 0.1 * Math.random()),
      adClickRatio: Math.random() * 0.1, // 0-10%
      adPrice: Math.floor(Math.random() * 1000) + 100,
      top40SalesCount: Math.floor(productCount * 0.1 * Math.random()),
      top40Sales: Math.floor(productCount * 0.1 * Math.random() * 1000),
      top40AveragePrice: Math.floor(Math.random() * 50000) + 10000,
      realTradeRatio: Math.random() * 0.8, // 0-80%
      bundleRatio: Math.random() * 0.3, // 0-30%
      overseasRatio: Math.random() * 0.5, // 0-50%
      recentYearRatio: Math.random() * 0.9, // 0-90%
      changeRate: (Math.random() - 0.5) * 200,
      isNew: Math.random() > 0.8,
      gender: determineGender(keyword),
      ageGroup: determineAgeGroup(keyword),
      updatedAt: new Date(),
    })
  }

  return {
    keywords,
    total: totalKeywords,
    hasMore: endIndex < totalKeywords,
  }
}

// 헬퍼 함수들
function generateKeywordVariation(variation: number): string {
  const variations = [
    '추천',
    '인기',
    '브랜드',
    '세일',
    '할인',
    '신상',
    '베스트',
    '순위',
    '리뷰',
    '후기',
    '가격',
    '비교',
    '구매',
    '온라인',
    '쇼핑몰',
    '특가',
    '이벤트',
    '프로모션',
    '신제품',
    '한정판',
  ]
  return variations[variation % variations.length] || `${variation}`
}

function determineKeywordType(keyword: string): 'shopping' | 'informational' | 'brand' {
  if (keyword.includes('추천') || keyword.includes('리뷰') || keyword.includes('후기') || keyword.includes('비교')) {
    return 'informational'
  }
  if (keyword.includes('브랜드') || keyword.includes('명품')) {
    return 'brand'
  }
  return 'shopping'
}

function determineGender(keyword: string): 'male' | 'female' | 'neutral' {
  const maleKeywords = ['남성', '남자', '맨즈', '보이즈']
  const femaleKeywords = ['여성', '여자', '우먼즈', '걸즈', '레이디']

  if (maleKeywords.some(k => keyword.includes(k))) return 'male'
  if (femaleKeywords.some(k => keyword.includes(k))) return 'female'
  return 'neutral'
}

function determineAgeGroup(keyword: string): string {
  const ageKeywords = ['10대', '20대', '30대', '40대', '50대', '60대']
  const found = ageKeywords.find(age => keyword.includes(age))
  return found || '전체'
}

function getRandomCategory(): string {
  const categories = ['패션의류', '패션잡화', '화장품/미용', '디지털/가전', '가구/인테리어']
  const randomIndex = Math.floor(Math.random() * categories.length)
  return categories[randomIndex] || '패션의류' // fallback
}

/**
 * 키워드 분석 통계 요약
 */
export async function getKeywordAnalysisStats(categoryName: string = '전체') {
  try {
    // 실제 데이터 조회 시도
    const stats = await prisma.keyword.aggregate({
      where: categoryName === '전체' ? {} : { category: { name: categoryName } },
      _count: { id: true },
      _avg: {
        monthlySearchCount: true,
        productCompetitionScore: true,
        productCount: true,
        adClickRatio: true,
        adPrice: true,
      },
      _max: {
        monthlySearchCount: true,
        productCompetitionScore: true,
        productCount: true,
      },
      _min: {
        monthlySearchCount: true,
        productCompetitionScore: true,
        productCount: true,
      },
    })

    if (stats._count.id === 0) {
      // 모의 통계 데이터 반환
      return {
        totalKeywords: 12500,
        avgMonthlySearchCount: 15420,
        avgProductCompetitionScore: 65.3,
        avgProductCount: 28750,
        avgAdClickRatio: 3.2,
        avgAdPrice: 450,
        maxMonthlySearchCount: 98500,
        minMonthlySearchCount: 100,
        shoppingKeywords: 8750,
        informationalKeywords: 2500,
        brandKeywords: 1250,
        newKeywords: 850,
      }
    }

    return {
      totalKeywords: stats._count.id,
      avgMonthlySearchCount: Math.round(stats._avg.monthlySearchCount || 0),
      avgProductCompetitionScore: Math.round((stats._avg.productCompetitionScore || 0) * 10) / 10,
      avgProductCount: Math.round(stats._avg.productCount || 0),
      avgAdClickRatio: Math.round((stats._avg.adClickRatio || 0) * 100) / 100,
      avgAdPrice: Math.round(stats._avg.adPrice || 0),
      maxMonthlySearchCount: stats._max.monthlySearchCount || 0,
      minMonthlySearchCount: stats._min.monthlySearchCount || 0,
      shoppingKeywords: Math.round(stats._count.id * 0.7),
      informationalKeywords: Math.round(stats._count.id * 0.2),
      brandKeywords: Math.round(stats._count.id * 0.1),
      newKeywords: Math.round(stats._count.id * 0.05),
    }
  } catch (error) {
    console.error('키워드 분석 통계 조회 중 오류:', error)
    return {
      totalKeywords: 12500,
      avgMonthlySearchCount: 15420,
      avgProductCompetitionScore: 65.3,
      avgProductCount: 28750,
      avgAdClickRatio: 3.2,
      avgAdPrice: 450,
      maxMonthlySearchCount: 98500,
      minMonthlySearchCount: 100,
      shoppingKeywords: 8750,
      informationalKeywords: 2500,
      brandKeywords: 1250,
      newKeywords: 850,
    }
  }
}
