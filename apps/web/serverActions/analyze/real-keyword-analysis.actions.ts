'use server'

import { prisma } from '@repo/database'
import { SmartStoreCrawlerService } from '@/lib/analyze/smartstore-crawler-service'
import type { KeywordAnalysisFilters } from './advanced-keyword-analysis.actions'

export interface RealKeywordData {
  rank: number
  keyword: string
  mainCategory: string
  keywordType: 'shopping' | 'informational' | 'brand'
  searchVolume: number
  productCount: number
  competitionScore: number
  avgAdClicks: number
  adClickCompetition: number
  costPerClick: number
  trend: 'up' | 'down' | 'stable'
  changeRate?: number
  isNew?: boolean
}

export interface RealKeywordAnalysisResult {
  keywords: RealKeywordData[]
  total: number
  page: number
  totalPages: number
  categoryName: string
  lastUpdated: Date
}

export interface KeywordCollectionJob {
  id: string
  categoryName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  totalKeywords: number
  collectedKeywords: number
  startedAt?: Date
  completedAt?: Date
  error?: string
}

// 진행 중인 작업들을 추적하는 메모리 저장소
const runningJobs = new Map<string, KeywordCollectionJob>()

/**
 * 카테고리별 실제 키워드 데이터 수집 시작
 */
export async function startKeywordCollection(categoryName: string, targetCount = 500): Promise<{ jobId: string }> {
  // 스마트스토어 크롤링을 통한 키워드 수집 활성화
  console.log(`키워드 수집 시작: ${categoryName}`)
  const jobId = `keyword-collection-${categoryName}-${Date.now()}`

  const job: KeywordCollectionJob = {
    id: jobId,
    categoryName,
    status: 'pending',
    progress: 0,
    totalKeywords: targetCount,
    collectedKeywords: 0,
    startedAt: new Date(),
  }

  runningJobs.set(jobId, job)

  // 백그라운드에서 키워드 수집 실행
  collectKeywordsInBackground(jobId, categoryName, targetCount).catch(error => {
    console.error(`키워드 수집 작업 실패 (${jobId}):`, error)
    const job = runningJobs.get(jobId)
    if (job) {
      job.status = 'failed'
      job.error = error.message
      runningJobs.set(jobId, job)
    }
  })

  return { jobId }
}

/**
 * 키워드 수집 작업 상태 조회
 */
export async function getKeywordCollectionStatus(jobId: string): Promise<KeywordCollectionJob | null> {
  return runningJobs.get(jobId) || null
}

/**
 * 백그라운드 키워드 수집 실행
 */
async function collectKeywordsInBackground(jobId: string, categoryName: string, targetCount: number): Promise<void> {
  const job = runningJobs.get(jobId)
  if (!job) return

  try {
    job.status = 'running'
    runningJobs.set(jobId, job)

    console.log(`키워드 수집 시작: ${categoryName} (목표: ${targetCount}개)`)

    // 1단계: 스마트스토어 크롤링으로 키워드 수집
    job.progress = 10
    runningJobs.set(jobId, job)

    const crawlerService = new SmartStoreCrawlerService()

    try {
      // 스마트스토어 베스트 데이터 크롤링 (카테고리별)
      const crawlResult = await crawlerService.crawlSmartStoreBestData(BigInt(1), categoryName) // 임시 사용자 ID

      if (!crawlResult.success) {
        throw new Error(crawlResult.error || '크롤링 실패')
      }

      job.progress = 50
      job.collectedKeywords = crawlResult.data?.keywords.length || 0
      runningJobs.set(jobId, job)

      // 2단계: 수집된 데이터 처리
      job.progress = 80
      runningJobs.set(jobId, job)

      // 크롤링된 키워드 데이터가 이미 DB에 저장되었으므로 추가 처리 없음
      const collectedKeywords = crawlResult.data?.keywords || []

      job.progress = 100
      job.status = 'completed'
      job.completedAt = new Date()
      job.collectedKeywords = collectedKeywords.length
      runningJobs.set(jobId, job)

      console.log(`키워드 수집 완료: ${categoryName} (${collectedKeywords.length}개 저장됨)`)
    } finally {
      // 크롤러 서비스 정리는 내부적으로 처리됨
    }
  } catch (error) {
    console.error(`키워드 수집 중 오류 발생:`, error)
    job.status = 'failed'
    job.error = error instanceof Error ? error.message : '알 수 없는 오류'
    runningJobs.set(jobId, job)
  }
}

/**
 * 실제 키워드 분석 데이터 조회
 */
export async function getRealKeywordAnalysis({
  categoryName,
  filters,
  page = 1,
  limit = 50,
}: {
  categoryName: string
  filters: KeywordAnalysisFilters
  page?: number
  limit?: number
}): Promise<RealKeywordAnalysisResult> {
  try {
    // 데이터베이스에서 실제 키워드 데이터 조회
    const whereConditions: any = {}

    // 카테고리 필터링 (categoryId 사용)
    if (categoryName !== '전체') {
      const category = await prisma.category.findFirst({
        where: {
          OR: [{ name: categoryName }, { name: { contains: categoryName } }, { fullName: { contains: categoryName } }],
        },
      })
      if (category) {
        whereConditions.categoryId = category.id
      }
    }

    // 필터 적용 (실제 DB 필드 기반)
    // keywordType과 isNew 필드는 DB에 없으므로 필터링 제거

    if (filters.monthlySearchCountMin !== undefined) {
      whereConditions.monthlySearchCount = { gte: filters.monthlySearchCountMin }
    }

    if (filters.monthlySearchCountMax !== undefined) {
      whereConditions.monthlySearchCount = {
        ...whereConditions.monthlySearchCount,
        lte: filters.monthlySearchCountMax,
      }
    }

    if (filters.productCountMin !== undefined) {
      whereConditions.productCount = { gte: filters.productCountMin }
    }

    if (filters.productCountMax !== undefined) {
      whereConditions.productCount = {
        ...whereConditions.productCount,
        lte: filters.productCountMax,
      }
    }

    if (filters.productCompetitionScoreMin !== undefined) {
      whereConditions.productCompetitionScore = { gte: filters.productCompetitionScoreMin }
    }

    if (filters.productCompetitionScoreMax !== undefined) {
      whereConditions.productCompetitionScore = {
        ...whereConditions.productCompetitionScore,
        lte: filters.productCompetitionScoreMax,
      }
    }

    // 전체 개수 조회
    const total = await prisma.keyword.count({
      where: whereConditions,
    })

    // 페이징된 데이터 조회 (실제 DB 필드만 사용)
    const keywords = await prisma.keyword.findMany({
      where: whereConditions,
      orderBy: [{ monthlySearchCount: 'desc' }, { productCompetitionScore: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: true,
      },
    })

    // 데이터 변환 (실제 DB 필드 기반)
    const transformedKeywords: RealKeywordData[] = keywords.map((keyword, index) => ({
      rank: (page - 1) * limit + index + 1, // 순위 계산
      keyword: keyword.keyword,
      mainCategory: keyword.category.name,
      keywordType: 'shopping', // 기본값
      searchVolume: keyword.monthlySearchCount || 0,
      productCount: keyword.productCount || 0,
      competitionScore: keyword.productCompetitionScore || 0,
      avgAdClicks: Math.floor((keyword.monthlySearchCount || 0) * 0.1), // 예상 광고 클릭수
      adClickCompetition: keyword.productCompetitionScore || 0,
      costPerClick: Math.floor(Math.random() * 1000) + 100, // 임시 데이터
      trend: 'stable', // 기본값
      changeRate: 0, // 기본값
      isNew: false, // 기본값
    }))

    const totalPages = Math.ceil(total / limit)
    const lastUpdated = keywords.length > 0 ? keywords[0]?.updatedAt || new Date() : new Date()

    return {
      keywords: transformedKeywords,
      total,
      page,
      totalPages,
      categoryName,
      lastUpdated,
    }
  } catch (error) {
    console.error('실제 키워드 분석 데이터 조회 중 오류:', error)

    // 실제 데이터가 없으면 빈 결과 반환
    return {
      keywords: [],
      total: 0,
      page,
      totalPages: 0,
      categoryName,
      lastUpdated: new Date(),
    }
  }
}

/**
 * 카테고리별 키워드 데이터 존재 여부 확인
 */
export async function checkKeywordDataExists(categoryName: string): Promise<{
  exists: boolean
  count: number
  lastUpdated?: Date
}> {
  try {
    const whereConditions: any = {}

    // 카테고리 필터링 (categoryId 사용)
    if (categoryName !== '전체') {
      const category = await prisma.category.findFirst({
        where: {
          OR: [{ name: categoryName }, { name: { contains: categoryName } }, { fullName: { contains: categoryName } }],
        },
      })
      if (category) {
        whereConditions.categoryId = category.id
      }
    }

    const count = await prisma.keyword.count({
      where: whereConditions,
    })

    if (count === 0) {
      return { exists: false, count: 0 }
    }

    const latestKeyword = await prisma.keyword.findFirst({
      where: whereConditions,
      orderBy: { updatedAt: 'desc' },
    })

    return {
      exists: true,
      count,
      lastUpdated: latestKeyword?.updatedAt || undefined,
    }
  } catch (error) {
    console.error('키워드 데이터 존재 여부 확인 중 오류:', error)
    return { exists: false, count: 0 }
  }
}

/**
 * 모든 진행 중인 작업 목록 조회
 */
export async function getActiveKeywordCollectionJobs(): Promise<KeywordCollectionJob[]> {
  return Array.from(runningJobs.values())
}

export async function getCrawlingResults(limit = 10): Promise<
  {
    id: string
    categoryName: string
    accessedUrl?: string
    htmlDump?: string
    pageTitle?: string
    isBlocked: boolean
    scrapedAt: Date
    keywordCount: number
  }[]
> {
  try {
    const results = await prisma.keyword.findMany({
      where: {
        keyword: { not: null },
      },
      select: {
        id: true,
        keyword: true,
        categoryId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // 카테고리별로 그룹화하여 최신 결과만 반환
    const groupedResults = results.reduce(
      (acc, keyword) => {
        const key = keyword.categoryId.toString()
        if (!acc[key] || keyword.createdAt > acc[key].createdAt) {
          acc[key] = keyword
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(groupedResults).map((keyword: any) => ({
      id: keyword.id.toString(),
      categoryName: `Category ${keyword.categoryId}`,
      accessedUrl: '',
      htmlDump: '',
      pageTitle: keyword.keyword,
      isBlocked: false,
      scrapedAt: keyword.createdAt,
      keywordCount: 0, // TODO: 실제 키워드 수 계산
    }))
  } catch (error) {
    console.error('크롤링 결과 조회 실패:', error)
    return []
  }
}

/**
 * 완료된 작업 정리
 */
export async function cleanupCompletedJobs(): Promise<void> {
  const cutoffTime = Date.now() - 24 * 60 * 60 * 1000 // 24시간 전

  for (const [jobId, job] of runningJobs.entries()) {
    if (job.status === 'completed' || job.status === 'failed') {
      const jobTime = job.completedAt?.getTime() || job.startedAt?.getTime() || 0
      if (jobTime < cutoffTime) {
        runningJobs.delete(jobId)
      }
    }
  }
}
