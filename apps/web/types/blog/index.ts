// 블로그 인덱스 관련 타입 정의

export type IndexGrade =
  | '최적3'
  | '최적2'
  | '최적1'
  | '준최6'
  | '준최5'
  | '준최4'
  | '준최3'
  | '준최2'
  | '준최1'
  | '저품질'
  | '없음'

export const INDEX_GRADE_SCORES: Record<IndexGrade, number> = {
  최적3: 10,
  최적2: 9,
  최적1: 8,
  준최6: 7,
  준최5: 6,
  준최4: 5,
  준최3: 4,
  준최2: 3,
  준최1: 2,
  저품질: 1,
  없음: 0,
}

export const SCORE_THRESHOLDS = [
  { grade: '최적3' as IndexGrade, minScore: 0.57, points: 10 },
  { grade: '최적2' as IndexGrade, minScore: 0.45, points: 9 },
  { grade: '최적1' as IndexGrade, minScore: 0.35, points: 8 },
  { grade: '준최6' as IndexGrade, minScore: 0.26, points: 7 },
  { grade: '준최5' as IndexGrade, minScore: 0.22, points: 6 },
  { grade: '준최4' as IndexGrade, minScore: 0.18, points: 5 },
  { grade: '준최3' as IndexGrade, minScore: 0.14, points: 4 },
  { grade: '준최2' as IndexGrade, minScore: 0.1, points: 3 },
  { grade: '준최1' as IndexGrade, minScore: 0.06, points: 2 },
  { grade: '저품질' as IndexGrade, minScore: 0.0, points: 1 },
]

// 블로그 기본 정보
export interface BlogInfo {
  blogId: string
  blogName: string
  blogUrl?: string
  createdDate?: string
  totalVisitors?: number
  totalPosts?: number
  totalSubscribers?: number
  lastUpdated?: string
}

// 블로그 지수 정보
export interface BlogIndex {
  topicIndex: IndexGrade
  overallIndex: IndexGrade
  maxIndex: IndexGrade
  blogTopic?: string
  topicRanking?: {
    rank: number
    percentage: number
  }
  overallRanking?: {
    rank: number
    percentage: number
  }
}

// 블로그 인덱스 측정 요청
export interface BlogIndexMeasurementRequest {
  keyword: string
  blogId?: string
  refreshData?: boolean
}

// 블로그 인덱스 측정 응답
export interface BlogIndexMeasurementResponse {
  success: boolean
  data?: {
    blogInfo: BlogInfo
    blogIndex: BlogIndex
    optimizationMetrics?: {
      score: number
      grade: IndexGrade
      recommendations?: string[]
    }
  }
  error?: string
  message?: string
}

// 지수 계산 유틸리티 함수
export function calculateIndexGrade(score: number): IndexGrade {
  if (score === 0) return '없음'

  for (const threshold of SCORE_THRESHOLDS) {
    if (score >= threshold.minScore) {
      return threshold.grade
    }
  }

  return '저품질'
}

// 지수 등급을 점수로 변환
export function getScoreFromGrade(grade: IndexGrade): number {
  return INDEX_GRADE_SCORES[grade]
}
