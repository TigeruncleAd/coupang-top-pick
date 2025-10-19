# 모든 카테고리 DataLab 병렬 처리 가이드

## 🚀 개요

모든 카테고리에 대해 데이터랩 키워드를 병렬로 수집하는 시스템입니다. 기존의 단일 카테고리 처리에서 대량의 카테고리를 효율적으로 처리할 수 있습니다.

## 📊 처리 방식

### 1. 카테고리별 병렬 처리

- 각 카테고리마다 25개 페이지를 병렬로 처리
- 카테고리들도 배치 단위로 병렬 처리 (기본 5개씩)
- API 제한을 고려한 대기 시간 포함

### 2. 처리 레벨 선택

- 1차 카테고리만: `categoryLevels: [1]`
- 2차 카테고리만: `categoryLevels: [2]`
- 모든 레벨: `categoryLevels: [1, 2, 3, 4]`

## 🛠️ 사용 방법

### 1. API 직접 호출

```typescript
// 모든 1차 카테고리 처리
const response = await fetch('/api/datalab-all-categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    categoryLevels: [1],
    maxPages: 25,
    concurrencyLimit: 5,
    saveToDatabase: true,
  }),
})

const result = await response.json()
console.log(`총 ${result.totalKeywords}개 키워드 수집 완료`)
```

### 2. 서버 액션 사용

```typescript
import { fetchDataLabKeywordsForAllCategories } from '@/serverActions/analyze/datalab-all-categories.actions'

// 모든 카테고리 처리
const result = await fetchDataLabKeywordsForAllCategories({
  categoryLevels: [1, 2, 3, 4],
  maxPages: 25,
  concurrencyLimit: 5,
})

// 1차 카테고리만 처리
const mainResult = await fetchDataLabKeywordsForMainCategories({
  maxPages: 25,
  concurrencyLimit: 3,
})

// 특정 레벨만 처리
const level2Result = await fetchDataLabKeywordsForLevel(2, {
  maxPages: 25,
  concurrencyLimit: 5,
})
```

### 3. 관리자 대시보드 사용

1. `/admin/datalab-bulk` 페이지 접속
2. 처리할 카테고리 레벨 선택
3. 페이지 수 및 동시 처리 수 설정
4. 데이터베이스 저장 여부 선택
5. "처리 시작" 버튼 클릭

## ⚙️ 설정 옵션

### CategoryDataLabRequest

```typescript
interface CategoryDataLabRequest {
  categoryLevels?: number[] // 처리할 카테고리 레벨 [1, 2, 3, 4]
  maxPages?: number // 페이지당 최대 페이지 수 (기본: 25)
  timeUnit?: 'date' | 'week' | 'month' // 시간 단위
  startDate?: string // 시작 날짜
  endDate?: string // 종료 날짜
  gender?: 'm' | 'f' | 'all' | '' // 성별
  ageGroup?: string // 연령대
  device?: 'pc' | 'mo' | 'all' | '' // 디바이스
  count?: string // 페이지당 키워드 수
  concurrencyLimit?: number // 동시 처리할 카테고리 수 (기본: 5)
}
```

## 📈 성능 특성

### 처리 시간 예상

- **1차 카테고리 (약 10개)**: 2-3분
- **2차 카테고리 (약 50개)**: 10-15분
- **모든 레벨 (약 200개)**: 30-60분

### 메모리 사용량

- 카테고리당 약 50-100MB
- 동시 처리 수에 따라 조정 필요

### API 제한 고려

- 배치 간 2초 대기
- 카테고리당 25페이지 × 20개 키워드 = 500개 키워드
- 총 처리량: 카테고리 수 × 500개 키워드

## 🔧 최적화 팁

### 1. 동시 처리 수 조정

```typescript
// 안정적인 처리 (API 제한 고려)
concurrencyLimit: 3

// 빠른 처리 (API 제한 위험)
concurrencyLimit: 10
```

### 2. 페이지 수 조정

```typescript
// 빠른 테스트
maxPages: 5

// 전체 데이터 수집
maxPages: 25
```

### 3. 레벨별 처리

```typescript
// 1차만 처리 (가장 중요)
categoryLevels: [1]

// 1-2차만 처리 (균형)
categoryLevels: [1, 2]

// 모든 레벨 처리 (완전)
categoryLevels: [1, 2, 3, 4]
```

## 📊 결과 분석

### AllCategoriesDataLabResponse

```typescript
interface AllCategoriesDataLabResponse {
  success: boolean // 전체 성공 여부
  totalCategories: number // 총 카테고리 수
  successfulCategories: number // 성공한 카테고리 수
  failedCategories: number // 실패한 카테고리 수
  totalKeywords: number // 총 키워드 수
  totalProcessingTime: number // 총 처리 시간 (ms)
  results: CategoryDataLabResult[] // 카테고리별 상세 결과
  errors?: string[] // 오류 목록
  message?: string // 결과 메시지
}
```

### CategoryDataLabResult

```typescript
interface CategoryDataLabResult {
  categoryId: string // 카테고리 ID
  categoryName: string // 카테고리 이름
  smartStoreId: string // 스마트스토어 ID
  level: number // 카테고리 레벨
  success: boolean // 성공 여부
  keywordCount: number // 수집된 키워드 수
  processingTime: number // 처리 시간 (ms)
  error?: string // 오류 메시지
  data?: DataLabKeyword[] // 키워드 데이터
}
```

## 🚨 주의사항

### 1. API 제한

- 네이버 DataLab API는 요청 제한이 있습니다
- 너무 많은 동시 요청 시 차단될 수 있습니다
- `concurrencyLimit`을 적절히 조정하세요

### 2. 메모리 사용량

- 대량의 카테고리 처리 시 메모리 사용량이 높습니다
- 서버 메모리를 모니터링하세요

### 3. 데이터베이스 저장

- `saveToDatabase: true` 시 기존 키워드가 삭제됩니다
- 중요한 데이터는 백업 후 사용하세요

## 🧪 테스트

### 로컬 테스트

```bash
cd apps/web
node test-all-categories.js
```

### 단계별 테스트

1. 1차 카테고리만 (5페이지)
2. 2차 카테고리만 (3페이지)
3. 모든 레벨 (2페이지)

## 📝 로그 모니터링

### 주요 로그

- `🚀 모든 카테고리 데이터랩 수집 시작`
- `📦 배치 X 처리 중: Y개 카테고리`
- `✅ 카테고리 처리 완료: 카테고리명`
- `❌ 카테고리 처리 실패: 카테고리명`

### 성능 모니터링

- 처리 시간: `totalProcessingTime`
- 성공률: `successfulCategories / totalCategories`
- 키워드 수: `totalKeywords`

이 시스템을 사용하면 수백 개의 카테고리에 대해 수만 개의 키워드를 효율적으로 수집할 수 있습니다! 🎯
