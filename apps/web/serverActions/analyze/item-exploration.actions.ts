'use server'

import { prisma } from '@repo/database'

export interface ItemExplorationRequest {
  categoryId: bigint
  device?: string
  gender?: string
  startDate?: string
  endDate?: string
  age?: string
}

export interface ItemExplorationResult {
  id: bigint
  categoryId: bigint
  categoryName: string
  device: string
  gender: string
  startDate: string
  endDate: string
  age: string
  itemKeywords: ItemKeywordResult[]
  createdAt: Date
}

export interface ItemKeywordResult {
  id: bigint
  keyword: string
  rank: number
  monthlySearchCount: number
  productCount: number
  productCompetitionScore: number
}

/**
 * 아이템 발굴 결과를 데이터베이스에 저장
 */
export async function saveItemExploration(
  request: ItemExplorationRequest,
  keywords: Array<{
    keywordId: bigint
    rank: number
  }>,
): Promise<ItemExplorationResult | null> {
  try {
    console.log('🔍 아이템 발굴 결과 저장 시작:', request)

    // 기존 탐색 결과가 있는지 확인
    const existingExploration = await prisma.itemExploration.findFirst({
      where: {
        categoryId: request.categoryId,
        device: request.device || 'PC',
        gender: request.gender || 'ALL',
        startDate: request.startDate || '',
        endDate: request.endDate || '',
        age: request.age || 'ALL',
      },
      include: {
        category: true,
        itemKeywords: {
          include: {
            keyword: true,
          },
        },
      },
    })

    if (existingExploration) {
      // 기존 결과가 있으면 업데이트
      await prisma.itemKeyword.deleteMany({
        where: {
          itemExplorationId: existingExploration.id,
        },
      })

      // 새로운 키워드들 추가
      await prisma.itemKeyword.createMany({
        data: keywords.map(item => ({
          itemExplorationId: existingExploration.id,
          keywordId: item.keywordId,
          rank: item.rank,
        })),
      })

      // 업데이트된 결과 반환
      const updatedExploration = await prisma.itemExploration.findUnique({
        where: { id: existingExploration.id },
        include: {
          category: true,
          itemKeywords: {
            include: {
              keyword: true,
            },
            orderBy: { rank: 'asc' },
          },
        },
      })

      return transformItemExplorationResult(updatedExploration)
    } else {
      // 새로운 탐색 결과 생성
      const newExploration = await prisma.itemExploration.create({
        data: {
          categoryId: request.categoryId,
          device: request.device || 'PC',
          gender: request.gender || 'ALL',
          startDate: request.startDate || '',
          endDate: request.endDate || '',
          age: request.age || 'ALL',
          itemKeywords: {
            create: keywords.map(item => ({
              keywordId: item.keywordId,
              rank: item.rank,
            })),
          },
        },
        include: {
          category: true,
          itemKeywords: {
            include: {
              keyword: true,
            },
            orderBy: { rank: 'asc' },
          },
        },
      })

      return transformItemExplorationResult(newExploration)
    }
  } catch (error) {
    console.error('❌ 아이템 발굴 결과 저장 실패:', error)
    return null
  }
}

/**
 * 아이템 발굴 결과 조회
 */
export async function getItemExploration(
  categoryId: bigint,
  device?: string,
  gender?: string,
  startDate?: string,
  endDate?: string,
  age?: string,
): Promise<ItemExplorationResult | null> {
  try {
    const exploration = await prisma.itemExploration.findFirst({
      where: {
        categoryId,
        device: device || 'PC',
        gender: gender || 'ALL',
        startDate: startDate || '',
        endDate: endDate || '',
        age: age || 'ALL',
      },
      include: {
        category: true,
        itemKeywords: {
          include: {
            keyword: true,
          },
          orderBy: { rank: 'asc' },
        },
      },
    })

    return exploration ? transformItemExplorationResult(exploration) : null
  } catch (error) {
    console.error('❌ 아이템 발굴 결과 조회 실패:', error)
    return null
  }
}

/**
 * 카테고리별 아이템 발굴 히스토리 조회
 */
export async function getItemExplorationHistory(
  categoryId: bigint,
  limit: number = 10,
): Promise<ItemExplorationResult[]> {
  try {
    const explorations = await prisma.itemExploration.findMany({
      where: { categoryId },
      include: {
        category: true,
        itemKeywords: {
          include: {
            keyword: true,
          },
          orderBy: { rank: 'asc' },
          take: 5, // 상위 5개만
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return explorations.map(transformItemExplorationResult)
  } catch (error) {
    console.error('❌ 아이템 발굴 히스토리 조회 실패:', error)
    return []
  }
}

/**
 * 아이템 발굴 결과를 클라이언트용 형태로 변환
 */
function transformItemExplorationResult(exploration: any): ItemExplorationResult {
  return {
    id: exploration.id,
    categoryId: exploration.categoryId,
    categoryName: exploration.category.name,
    device: exploration.device,
    gender: exploration.gender,
    startDate: exploration.startDate,
    endDate: exploration.endDate,
    age: exploration.age,
    itemKeywords: exploration.itemKeywords.map((itemKeyword: any) => ({
      id: itemKeyword.id,
      keyword: itemKeyword.keyword.keyword,
      rank: itemKeyword.rank,
      monthlySearchCount: itemKeyword.keyword.monthlySearchCount,
      productCount: itemKeyword.keyword.productCount,
      productCompetitionScore: itemKeyword.keyword.productCompetitionScore,
    })),
    createdAt: exploration.createdAt,
  }
}

/**
 * 키워드 ID로 키워드 정보 조회
 */
export async function getKeywordById(keywordId: bigint): Promise<any> {
  try {
    const keyword = await prisma.keyword.findUnique({
      where: { id: keywordId },
      include: {
        category: true,
      },
    })

    return keyword
  } catch (error) {
    console.error('❌ 키워드 조회 실패:', error)
    return null
  }
}

/**
 * 키워드명으로 키워드 ID 조회 (없으면 생성)
 */
export async function getOrCreateKeywordId(keywordName: string, categoryId: bigint): Promise<bigint | null> {
  try {
    // 기존 키워드 찾기
    let keyword = await prisma.keyword.findUnique({
      where: { keyword: keywordName },
    })

    if (!keyword) {
      // 키워드가 없으면 생성
      keyword = await prisma.keyword.create({
        data: {
          keyword: keywordName,
          hashedKeyword: Buffer.from(keywordName).toString('base64'),
          categoryId,
          monthlySearchCount: 0,
          productCount: 0,
          productCompetitionScore: 0,
        },
      })
    }

    return keyword.id
  } catch (error) {
    console.error('❌ 키워드 생성/조회 실패:', error)
    return null
  }
}
