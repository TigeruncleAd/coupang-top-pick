export interface KeywordCompetitionLevel {
  level: 'EXCELLENT' | 'GOOD' | 'NORMAL' | 'BAD' | 'VERY_BAD'
  label: string
  color: string
}

/**
 * 경쟁 강도에 따른 레벨 계산
 */
export function getCompetitionLevel(score: number): KeywordCompetitionLevel {
  if (score <= 1.5) {
    return { level: 'EXCELLENT', label: '아주좋음', color: 'text-green-600 bg-green-50' }
  } else if (score <= 2.5) {
    return { level: 'GOOD', label: '좋음', color: 'text-blue-600 bg-blue-50' }
  } else if (score <= 3.5) {
    return { level: 'NORMAL', label: '보통', color: 'text-yellow-600 bg-yellow-50' }
  } else if (score <= 4.5) {
    return { level: 'BAD', label: '나쁨', color: 'text-orange-600 bg-orange-50' }
  } else {
    return { level: 'VERY_BAD', label: '매우나쁨', color: 'text-red-600 bg-red-50' }
  }
}
