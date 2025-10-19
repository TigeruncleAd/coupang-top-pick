// 네이버 블로그 인덱스 API 문서 정리

/**
 * 1. 지수 등급 체계 (calculateIndices)
 *
 * 지수 등급별 임계값 (Score 임계값 기준):
 * - 최적 3: ≥ 0.57 (10점)
 * - 최적 2: ≥ 0.45 (9점)
 * - 최적 1: ≥ 0.35 (8점)
 * - 준최 6: ≥ 0.26 (7점)
 * - 준최 5: ≥ 0.22 (6점)
 * - 준최 4: ≥ 0.18 (5점)
 * - 준최 3: ≥ 0.14 (4점)
 * - 준최 2: ≥ 0.10 (3점)
 * - 준최 1: ≥ 0.06 (2점)
 * - 저품질: < 0.06 (1점)
 * - 없음: = 0.00 (-)
 */

// 지수 등급 타입
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

// 지수 등급별 점수 매핑
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

// 점수별 임계값
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

/**
 * 2. API 엔드포인트
 */

/**
 * 2.1 지수 추출 API
 * URL: https://s.search.naver.com/p/review/search.naver
 * Method: GET
 * Parameters:
 *   where=m_view
 *   start=1 (또는 5)
 *   query=(검색어_URL인코딩)
 *   mode=normal
 *   sm=mtb_jum
 *   api_type=1
 */

/**
 * 2.2 블로그 정보 API
 * 블로그 기본 정보: https://m.blog.naver.com/api/blogs/{blogId}
 * 게시물 목록: https://m.blog.naver.com/api/blogs/{blogId}/post-list
 * 인기 게시물: https://m.blog.naver.com/api/blogs/{blogId}/popular-post-list
 * 방문자 통계: https://blog.naver.com/NVisitorpAAjax.nhn?blogId={blogId}
 */

/**
 * 3. 점수 계산 공식
 */

/**
 * 3.1 원본 점수 → 정규화 점수
 * ScoreA = 원본값 / 0.0085
 * ScoreB = 원본값 / 0.00688  // 메인 지수 검정용
 * ScoreC = 원본값 / 0.2
 */

/**
 * 3.2 지수 결정
 * - ScoreB를 기준으로 calculateIndices() 메서드 실행
 * - ScoreB의 정규화된 값으로 지수 등급 결정
 */

/**
 * 4. 처리 프로세스
 */

/**
 * 4.1 지수 추출 플로우
 * 1. 게시물 제목 전처리
 *    - 이모지 제거
 *    - 50자 제한 적용
 *
 * 2. 검색 시도 (4단계)
 *    - 1차: 따옴표 포함 검색 (start=1)
 *    - 2차: 따옴표 제외 검색 (start=1)
 *    - 3차: 따옴표 포함 검색 (start=5)
 *    - 4차: 따옴표 제외 검색 (start=5)
 *
 * 3. 응답 파싱
 *    - "r:"로 시작하는 라인 검색
 *    - LogNo 또는 제목 매칭
 *    - 점수 추출 및 계산
 */

/**
 * 4.2 상태 분류
 * - 정상 노출: 지수가 정상적으로 추출됨
 * - 노출 누락: 2시간 경과 후에도 지수 없음
 * - 반영 대기중: 2시간 미만, 지수 없음
 * - 검색 비활용: searchYn = false
 */

/**
 * 5. 평균 지수 계산
 */

/**
 * 5.1 개별 점수 집계
 * for (PostEntity post : posts) {
 *   switch (post.getIndices()) {
 *     case "최적 3": score += 10; break;
 *     case "최적 2": score += 9; break;
 *     case "최적 1": score += 8; break;
 *     case "준최 6": score += 7; break;
 *     case "준최 5": score += 6; break;
 *     case "준최 4": score += 5; break;
 *     case "준최 3": score += 4; break;
 *     case "준최 2": score += 3; break;
 *     case "준최 1": score += 2; break;
 *     case "저품질": score += 1; break;
 *   }
 * }
 */

/**
 * 5.2 평균 지수 결정
 * averageScore = score / postCount
 * if (averageScore >= 9.5) return "최적 3";
 * else if (averageScore >= 8.5) return "최적 2";
 * else if (averageScore >= 7.5) return "최적 1";
 * else if (averageScore >= 6.5) return "준최 6";
 * else if (averageScore >= 5.5) return "준최 5";
 * else if (averageScore >= 4.5) return "준최 4";
 * else if (averageScore >= 3.5) return "준최 3";
 * else if (averageScore >= 2.5) return "준최 2";
 * else if (averageScore >= 1.5) return "준최 1";
 * else return "저품질";
 */

/**
 * 7.2 응답 데이터 형식
 *
 * API 응답에서 "r:"로 시작하는 라인 파싱:
 * r:{id}:{scoreA}:{scoreB}:{scoreC}:{기타데이터}
 */

/**
 * 8. 사용 예시
 */

/**
 * 8.1 지수 추출
 * // 1. 게시물 제목으로 검색
 * String title = "블로그 게시물 제목";
 * String encodedTitle = URLEncoder.encode(title, StandardCharsets.UTF_8);
 *
 * // 2. API 호출
 * String url = "https://s.search.naver.com/p/review/search.naver" +
 *              "?where=m_view&start=1&query=" + encodedTitle +
 *              "&mode=normal&sm=mtb_jum&api_type=1";
 *
 * // 3. 응답 파싱 및 점수 추출
 * // r:로 시작하는 라인에서 점수 추출
 *
 * // 4. 지수 계산
 * double scoreB = 0.003;
 * double normalizedScoreB = scoreB / 0.00688;
 * String index = StringUtils.calculateIndices(normalizedScoreB);
 */

/**
 * 8.2 평균 지수 계산
 * List<PostEntity> posts = getPosts();
 * KeywordParams avgData = StringUtils.getAverageData(posts);
 * String averageIndex = avgData.getAverageIndices();
 */

/**
 * 플레이스 검색 지수
 *
 * API 호출 방법:
 * 1. 네이버 통합검색 페이지 접속
 *    URL: https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query={검색어URL인코딩}
 *    예시: https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=%EB%A7%9D%EC%9B%90%EB%8F%99+%EA%BB%8D%EB%8D%B0%EA%B8%B0&ackey=7zvuy7yb
 *
 * 2. JavaScript 변수에서 데이터 추출
 *    변수명: naver.search.ext.nmb.salt.query
 *    위치: 페이지 로드 후 JavaScript 전역 변수
 *
 * 3. nlu_query 필드에서 플레이스 검색 지수 데이터 파싱
 *    JSON.parse(naver.search.ext.nmb.salt.query).nlu_query
 *
 * JSON 데이터 구조:
 * {
 *   "queryResult": {
 *     "qr": [
 *       {
 *         "query": "망원동 맛집 껍데기",
 *         "c_score": 0.935066,
 *         "score": 0.988948,
 *         "qr_category": 7,
 *         "qr_type": 34
 *       },
 *       {
 *         "query": "망원 맛있는 집 껍데기",
 *         "c_score": 0.899997,
 *         "score": 0.98636,
 *         "qr_category": 2,
 *         "qr_type": 23
 *       },
 *       {
 *         "query": "망원동 껍데기",
 *         "c_score": 0.886524,
 *         "score": 0.9843,
 *         "qr_category": 7,
 *         "qr_type": 42
 *       }
 *     ]
 *   }
 * }
 *
 * 실제 응답 예시 (nlu_query):
 * {
 *   "qr": [
 *     {
 *       "query": "망원 껍데기",
 *       "c_score": 0.945433,
 *       "score": 0.957008,
 *       "qr_category": 7,
 *       "qr_type": 34
 *     },
 *     {
 *       "query": "껍데기",
 *       "c_score": -0.298,
 *       "score": -2.926,
 *       "qr_category": 4,
 *       "qr_type": 31
 *     }
 *   ],
 *   "nluQuery": "망원동 껍데기",
 *   "restaurant": {
 *     "q": "망원동 껍데기",
 *     "region": "망원동",
 *     "menu": "껍데기"
 *   }
 * }
 *
 * 전체 salt.query 구조 예시:
 * {
 *   "abt": "[{\"eid\":\"PLACEAD-DEPTH-EXP\",\"value\":{\"bt\":\"3\",\"bucket\":\"3\",\"is_control\":false}}]",
 *   "ac": "1",
 *   "adm_lat": "37.558979",
 *   "adm_long": "126.847881",
 *   "debug": "0",
 *   "ngn_country": "KR",
 *   "nlu_query": "{\"qr\":[...], \"nluQuery\":\"...\", \"restaurant\":{...}}",
 *   "query": "망원동 껍데기",
 *   "r1": "서울특별시",
 *   "r2": "강서구",
 *   "r3": "등촌3동",
 *   "rcode": "09500535",
 *   "where": "nexearch",
 *   "x": "126.847881",
 *   "y": "37.558979"
 * }
 */

/**
 * 계산 공식
 *
 * // 원본 JSON에서 N1, N2, N3 계산
 * const qr = JSON.parse(jsonString).queryResult.qr;
 *
 * const N1 = qr[0].c_score / 2.332033;  // 0.400966 (검색어 일치)
 * const N2 = qr[1].c_score / 2.093834;  // 0.429832 (연관성)
 * const N3 = qr[2].c_score / 3.717768;  // 0.238456 (유사도)
 */

/**
 * 함수 버전
 *
 * function getSearchMetrics(jsonString) {
 *   const qr = JSON.parse(jsonString).queryResult.qr;
 *
 *   // 스케일링 팩터들 - 이 상수들은 역산으로 구한 값으로, 실제 내부 알고리즘 다를 수 있음
 *   const SCALING_FACTORS = {
 *     EXACT_MATCH: 2.332033,
 *     RELEVANCE: 2.093834,
 *     SIMILARITY: 3.717768
 *   };
 *
 *   return {
 *     exactMatch: qr[0].c_score / SCALING_FACTORS.EXACT_MATCH,
 *     relevance: qr[1].c_score / SCALING_FACTORS.RELEVANCE,
 *     similarity: qr[2].c_score / SCALING_FACTORS.SIMILARITY
 *   };
 * }
 *
 * 2.332033 = 0.935066 / 0.400966  (c_score[0] / N1)
 * 2.093834 = 0.899997 / 0.429832  (c_score[1] / N2)
 * 3.717768 = 0.886524 / 0.238456  (c_score[2] / N3)
 */

/**
 * 기술적 구현
 *
 * 실시간 모니터링
 *
 * // 실시간 검색 메트릭 추출
 * class NaverSearchAnalyzer {
 *   constructor() {
 *     this.scalingFactors = {
 *       exactMatch: 2.332033,
 *       relevance: 2.093834,
 *       similarity: 3.717768
 *     };
 *   }
 *
 *   analyze(searchResponse) {
 *     const qr = searchResponse.queryResult.qr;
 *
 *     return {
 *       timestamp: new Date().toISOString(),
 *       query: searchResponse.queryResult.q,
 *       metrics: {
 *         exactMatch: qr[0].c_score / this.scalingFactors.exactMatch,
 *         relevance: qr[1].c_score / this.scalingFactors.relevance,
 *         similarity: qr[2].c_score / this.scalingFactors.similarity
 *       },
 *       rawScores: qr.map(item => ({
 *         query: item.query,
 *         c_score: item.c_score,
 *         score: item.score
 *       }))
 *     };
 *   }
 * }
 */
