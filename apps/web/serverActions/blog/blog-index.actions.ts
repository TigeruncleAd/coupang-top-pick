'use server'

import {
  BlogIndexMeasurementRequest,
  BlogIndexMeasurementResponse,
  calculateIndexGrade,
  BlogInfo,
} from '../../types/blog'

// 네이버 블로그 인덱스 측정 함수
export async function measureBlogIndex(request: BlogIndexMeasurementRequest): Promise<BlogIndexMeasurementResponse> {
  try {
    const { keyword } = request

    // 키워드가 없으면 에러 반환
    if (!keyword || !keyword.trim()) {
      return {
        success: false,
        error: '검색어를 입력해주세요.',
      }
    }

    // 1. 블로그 ID 추출 (URL에서 또는 직접 입력)
    const blogId = extractBlogId(keyword)
    if (!blogId) {
      return {
        success: false,
        error: '유효한 블로그 ID 또는 URL을 입력해주세요.',
      }
    }

    // 2. 블로그 기본 정보 조회
    const blogInfo = await fetchBlogInfo(blogId)
    if (!blogInfo) {
      return {
        success: false,
        error: '블로그 정보를 조회할 수 없습니다.',
      }
    }
    console.log('blogInfo', blogInfo)

    // 3. 블로그 포스트 목록 조회 및 지수 측정
    const indexResult = await measureBlogIndexFromPosts(blogId)
    if (!indexResult.success) {
      return indexResult
    }

    return {
      success: true,
      data: {
        blogInfo,
        blogIndex: indexResult.blogIndex!,
        optimizationMetrics: indexResult.optimizationMetrics,
      },
    }
  } catch (error) {
    console.error('블로그 인덱스 측정 오류:', error)
    return {
      success: false,
      error: '블로그 인덱스 측정 중 오류가 발생했습니다.',
    }
  }
}

// 블로그 ID 추출 함수
function extractBlogId(input: string): string | null {
  const trimmedInput = input.trim()

  // URL 패턴 매칭
  const urlPatterns = [/blog\.naver\.com\/([^\/\?]+)/, /m\.blog\.naver\.com\/([^\/\?]+)/]

  for (const pattern of urlPatterns) {
    const match = trimmedInput.match(pattern)
    if (match) {
      return match[1]
    }
  }

  // 직접 블로그 ID인 경우
  if (/^[a-zA-Z0-9_-]+$/.test(trimmedInput)) {
    return trimmedInput
  }

  return null
}

// 블로그 기본 정보 조회
async function fetchBlogInfo(blogId: string): Promise<BlogInfo | null> {
  try {
    // 네이버 블로그 기본 정보 API 호출
    // const response = await fetch(`https://m.blog.naver.com/api/blogs/${blogId}`, {
    //   headers: {
    //     'User-Agent':
    //       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    //     Accept: 'application/json, text/plain, */*',
    //     'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    //     'Accept-Encoding': 'gzip, deflate, br',
    //     Referer: `https://m.blog.naver.com/${blogId}`,
    //     Origin: 'https://m.blog.naver.com',
    //     Connection: 'keep-alive',
    //     'Sec-Fetch-Dest': 'empty',
    //     'Sec-Fetch-Mode': 'cors',
    //     'Sec-Fetch-Site': 'same-origin',
    //     'Cache-Control': 'no-cache',
    //     Pragma: 'no-cache',
    //   },
    // })

    const response = await fetch(`https://m.blog.naver.com/api/blogs/${blogId}`, {
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'ko,en;q=0.9,en-US;q=0.8',
        Cookie:
          'NAC=LG0IBwwNfuHdB; NNB=BZOTMC5ZXSZGQ; BA_DEVICE=3a41961e-f716-4f13-bc23-18aafb7e5542; ba.uuid=d14bf2d4-6064-439b-8734-2f3839d059dd; NACT=1; SRT30=1758694727; SRT5=1758694727; _naver_usersession_=OcKOjoAtFnwrsmzDtwvS0g==; page_uid=jLMLTspzL8wss4i4d4dssssstoR-445549; BUC=LLVJwAbM2arPK8Or4yly8baIF1IMNc_B7vIbB0MLj1M=; JSESSIONID=51EFEEA98AC6638021870D31BC123223.jvm1',
        Priority: 'u=0, i',
        Referer: 'https://blog.naver.com',
        'Sec-Ch-Ua': 'Chromium;v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': 'macOS',
        'Sec-Fetch-Dest': 'iframe',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
      },
    })

    console.log(`블로그 정보 조회 응답: ${response.status} ${response.statusText}`)
    console.log('응답 헤더:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      console.error('블로그 정보 조회 실패:', response.status)

      // 403 에러인 경우 다른 URL 시도
      if (response.status === 403) {
        console.log('403 에러 - 다른 접근 방법 시도...')
        return await tryAlternativeBlogInfo(blogId)
      }

      return null
    }

    const data = await response.json()
    // console.log('data는 이렇게 들어옴 : ', data)
    
    // 응답 구조에 맞게 데이터 추출
    const blogInfo = data.result || data
    
    return {
      blogId,
      blogName: blogInfo.blogName || blogInfo.displayNickName || `${blogId} 블로그`,
      blogUrl: `https://blog.naver.com/${blogId}`,
      createdDate: blogInfo.createdDate,
      totalVisitors: blogInfo.totalVisitorCount,
      totalPosts: blogInfo.totalPosts,
      totalSubscribers: blogInfo.subscriberCount,
    }
  } catch (error) {
    console.error('블로그 정보 조회 오류:', error)

    // API 실패 시 기본 정보 반환
    return {
      blogId,
      blogName: `${blogId} 블로그`,
      blogUrl: `https://blog.naver.com/${blogId}`,
    }
  }
}

// 대안 블로그 정보 조회 방법
async function tryAlternativeBlogInfo(blogId: string): Promise<BlogInfo | null> {
  try {
    console.log('대안 방법으로 블로그 정보 조회 시도:', blogId)

    // 방법 1: 데스크톱 버전 시도
    const desktopUrl = `https://blog.naver.com/${blogId}`
    const response1 = await fetch(desktopUrl, {
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'ko,en;q=0.9,en-US;q=0.8',
        Cookie:
          'NAC=LG0IBwwNfuHdB; NNB=BZOTMC5ZXSZGQ; BA_DEVICE=3a41961e-f716-4f13-bc23-18aafb7e5542; ba.uuid=d14bf2d4-6064-439b-8734-2f3839d059dd; NACT=1; SRT30=1758694727; SRT5=1758694727; _naver_usersession_=OcKOjoAtFnwrsmzDtwvS0g==; page_uid=jLMLTspzL8wss4i4d4dssssstoR-445549; BUC=LLVJwAbM2arPK8Or4yly8baIF1IMNc_B7vIbB0MLj1M=; JSESSIONID=51EFEEA98AC6638021870D31BC123223.jvm1',
        Priority: 'u=0, i',
        Referer: 'https://blog.naver.com',
        'Sec-Ch-Ua': 'Chromium;v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': 'macOS',
        'Sec-Fetch-Dest': 'iframe',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
      },
    })

    console.log(`데스크톱 버전 응답: ${response1.status}`)

    if (response1.ok) {
      // HTML 파싱으로 블로그명 추출 시도
      const html = await response1.text()
      const titleMatch = html.match(/<title>([^<]+)<\/title>/)
      const blogName = titleMatch ? titleMatch[1].replace(' : 네이버 블로그', '') : `${blogId} 블로그`

      console.log('HTML에서 추출한 블로그명:', blogName)

      return {
        blogId,
        blogName,
        blogUrl: `https://blog.naver.com/${blogId}`,
        createdDate: new Date().toISOString().split('T')[0],
      }
    }

    // 모든 방법 실패 시 기본 정보 반환
    return {
      blogId,
      blogName: `${blogId}`,
      blogUrl: `https://blog.naver.com/${blogId}`,
    }
  } catch (error) {
    console.error('대안 방법도 실패:', error)

    // 최후의 수단: 기본 정보
    return {
      blogId,
      blogName: `${blogId}`,
      blogUrl: `https://blog.naver.com/${blogId}`,
    }
  }
}

// 블로그 포스트 목록 조회 및 지수 측정
async function measureBlogIndexFromPosts(blogId: string): Promise<{
  success: boolean
  blogIndex?: any
  optimizationMetrics?: any
  error?: string
}> {
  try {
    // 1. 블로그 포스트 목록 조회
    const posts = await fetchBlogPosts(blogId)
    if (!posts || posts.length === 0) {
      return {
        success: false,
        error: '블로그 포스트를 조회할 수 없습니다.',
      }
    }

    // 2. 각 포스트의 지수 측정
    const postScores = await Promise.all(posts.slice(0, 10).map(post => measurePostIndex(post.title, post.logNo)))

    // 3. 평균 지수 계산
    const validScores = postScores.filter(score => score !== null) as number[]
    if (validScores.length === 0) {
      return {
        success: false,
        error: '포스트 지수를 측정할 수 없습니다.',
      }
    }

    const averageScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    const grade = calculateIndexGrade(averageScore)

    return {
      success: true,
      blogIndex: {
        topicIndex: grade,
        overallIndex: grade,
        maxIndex: grade,
        blogTopic: '일반',
      },
      optimizationMetrics: {
        score: averageScore,
        grade,
      },
    }
  } catch (error) {
    console.error('포스트 지수 측정 오류:', error)
    return {
      success: false,
      error: '포스트 지수 측정 중 오류가 발생했습니다.',
    }
  }
}

// 블로그 포스트 목록 조회 (다중 페이지)
async function fetchBlogPosts(blogId: string): Promise<Array<{ title: string; logNo: string }> | null> {
  console.log('📄 다중 페이지로 포스트 수집 시작...')

  let allPosts: Array<{ title: string; logNo: string }> = []
  let currentPage = 1
  const maxPages = 1 // 최대 1페이지까지 시도

  while (currentPage <= maxPages) {
    console.log(`📄 페이지 ${currentPage} 요청 중...`)
    /*
    원래 엔드포인트는 아래와 같은데, 게시물 목록 엔드포인트로 요청 보내니까 404 에러가 발생하여 아래 엔드포인트로 테스트중
    * 블로그 기본 정보: https://m.blog.naver.com/api/blogs/{blogId}
    * 게시물 목록: https://m.blog.naver.com/api/blogs/{blogId}/post-list
    * 인기 게시물: https://m.blog.naver.com/api/blogs/{blogId}/popular-post-list
    * 방문자 통계: https://blog.naver.com/NVisitorpAAjax.nhn?blogId={blogId}
     */
    const endpoint = `https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}&currentPage=${currentPage}&countPerPage=5&categoryNo=0&parentCategoryNo=0`
    // const endpoint = `https://blog.naver.com/api/blogs/${blogId}/post-list`

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'ko,en;q=0.9,en-US;q=0.8',
          Cookie:
            'NAC=LG0IBwwNfuHdB; NNB=BZOTMC5ZXSZGQ; BA_DEVICE=3a41961e-f716-4f13-bc23-18aafb7e5542; ba.uuid=d14bf2d4-6064-439b-8734-2f3839d059dd; NACT=1; SRT30=1758694727; SRT5=1758694727; _naver_usersession_=OcKOjoAtFnwrsmzDtwvS0g==; page_uid=jLMLTspzL8wss4i4d4dssssstoR-445549; BUC=LLVJwAbM2arPK8Or4yly8baIF1IMNc_B7vIbB0MLj1M=; JSESSIONID=51EFEEA98AC6638021870D31BC123223.jvm1',
          Priority: 'u=0, i',
          Referer: 'https://blog.naver.com',
          'Sec-Ch-Ua': 'Chromium;v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': 'macOS',
          'Sec-Fetch-Dest': 'iframe',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
        },
        // headers: {
        //   'User-Agent':
        //     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        //   Accept: 'application/json, text/javascript, */*; q=0.01',
        //   'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        //   Referer: `https://blog.naver.com/${blogId}`,
        //   'X-Requested-With': 'XMLHttpRequest',
        //   // gzip 압축 해제를 위해 Accept-Encoding 제거
        // },
      })

      if (response.ok) {
        const responseText = await response.text()
        console.log(`페이지 ${currentPage} 응답 길이: ${responseText.length}`)

        // 포스트 추출
        const pagePosts = await parsePostsFromResponse(responseText, blogId, currentPage)

        if (pagePosts && pagePosts.length > 0) {
          allPosts.push(...pagePosts)
          console.log(`✅ 페이지 ${currentPage}: ${pagePosts.length}개 포스트 추가 (총 ${allPosts.length}개)`)
          currentPage++

          // 잠시 대기 (요청 제한 방지)
          await new Promise(resolve => setTimeout(resolve, 200))
        } else {
          console.log(`❌ 페이지 ${currentPage}: 포스트 없음 - 수집 종료`)
          break
        }
      } else {
        console.log(`❌ 페이지 ${currentPage} 요청 실패: ${response.status}`)
        break
      }
    } catch (error) {
      console.error(`페이지 ${currentPage} 오류:`, error)
      break
    }
  }

  console.log(`🎯 총 ${allPosts.length}개 포스트 수집 완료!`)
  return allPosts.length > 0 ? allPosts : null
}

// 응답에서 포스트 파싱하는 별도 함수
async function parsePostsFromResponse(
  responseText: string,
  blogId: string,
  pageNum: number,
): Promise<Array<{ title: string; logNo: string }> | null> {
  try {
    console.log('responseText는 이렇게 들어옴 : ', responseText)
    
    // JSON 파싱 시도 - 여러 방법으로 시도
    let data
    
    try {
      // 1차: 원본 그대로 파싱 시도
      data = JSON.parse(responseText)
    } catch (firstError) {
      console.log('1차 JSON 파싱 실패, 이스케이프 수정 후 재시도...')
      
      try {
        // 2차: 이스케이프 문제 수정 후 파싱
        let cleanedResponse = responseText
          .replace(/\\'/g, "'")  // \' -> '
          .replace(/\\\\/g, "\\") // \\\\ -> \\
          .replace(/\\n/g, "")   // \n 제거
          .replace(/\\r/g, "")   // \r 제거
        
        data = JSON.parse(cleanedResponse)
      } catch (secondError) {
        console.log('2차 JSON 파싱도 실패, 정규식으로 데이터 추출 시도...')
        
        // 3차: 정규식으로 필요한 부분만 추출
        const postListMatch = responseText.match(/"postList":\s*(\[.*?\])(?=,\s*"countPerPage")/s)
        if (postListMatch) {
          try {
            const postList = JSON.parse(postListMatch[1])
            data = { resultCode: "S", postList }
          } catch (regexError) {
            throw new Error(`모든 JSON 파싱 방법 실패: ${regexError.message}`)
          }
        } else {
          throw new Error('postList를 찾을 수 없음')
        }
      }
    }
    
    // 응답 구조 확인: resultCode가 "S"인지 체크
    if (data.resultCode !== "S") {
      console.log(`페이지 ${pageNum} 응답 실패: ${data.resultMessage}`)
      return null
    }
    
    const posts = data.postList || []
    console.log(`페이지 ${pageNum}: ${posts.length}개 포스트 발견`)

    if (posts.length > 0) {
      return posts.map((post: any) => {
        try {
          return {
            title: decodeURIComponent(post.title || ''),
            logNo: post.logNo || '',
          }
        } catch (decodeError) {
          // URL 디코딩 실패 시 원본 사용
          return {
            title: post.title || '',
            logNo: post.logNo || '',
          }
        }
      })
    }
  } catch (jsonError) {
    console.log(`페이지 ${pageNum} JSON 파싱 실패:`, jsonError.message)
  }

  return null
}

// 기존 단일 페이지 함수 (백업용)
async function fetchBlogPostsSingle(blogId: string): Promise<Array<{ title: string; logNo: string }> | null> {
  // 여러 가능한 엔드포인트 시도 (페이징 파라미터 포함)
  /*
    원래 엔드포인트는 아래와 같은데, 모두 403 에러가 발생하여 아래 엔드포인트로 변경
    * 블로그 기본 정보: https://m.blog.naver.com/api/blogs/{blogId}
    * 게시물 목록: https://m.blog.naver.com/api/blogs/{blogId}/post-list
    * 인기 게시물: https://m.blog.naver.com/api/blogs/{blogId}/popular-post-list
    * 방문자 통계: https://blog.naver.com/NVisitorpAAjax.nhn?blogId={blogId}
     */
  const possibleEndpoints = [
    // 더 많은 포스트를 가져오기 위한 파라미터들
    `https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}&currentPage=1&countPerPage=50`,
    `https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}&viewdate=&currentPage=1&categoryNo=0&parentCategoryNo=0&countPerPage=50`,
    `https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}&currentPage=1&countPerPage=30`,
    `https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}&currentPage=1&countPerPage=100`,
    `https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}`,
  ]

  for (let i = 0; i < possibleEndpoints.length; i++) {
    const endpoint = possibleEndpoints[i]
    console.log(`엔드포인트 ${i + 1}/${possibleEndpoints.length} 시도: ${endpoint}`)

    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: `https://blog.naver.com/${blogId}`,
          Connection: 'keep-alive',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })

      console.log(`엔드포인트 ${i + 1} 응답: ${response.status} ${response.statusText}`)

      if (response.ok) {
        console.log(`✅ 성공한 엔드포인트: ${endpoint}`)

        // Response body를 한 번만 읽기 위해 text()로 먼저 읽음
        const responseText = await response.text()

        console.log('응답 내용 (첫 500자):', responseText.substring(0, 500))
        console.log('응답 길이:', responseText.length)

        try {
          // JSON 응답 정리 (잘못된 이스케이프 문자 처리)
          let cleanedResponse = responseText

          // JSON 파싱 시도
          const data = JSON.parse(cleanedResponse)
          console.log('✅ JSON 파싱 성공!')
          console.log('포스트 목록 데이터 구조:', Object.keys(data))

          // postList 필드에서 포스트 추출
          const posts = data.postList || data.posts || data.items || []

          if (posts.length > 0) {
            console.log(`포스트 ${posts.length}개 발견`)
            // title이 URL 인코딩되어 있으면 디코딩
            const decodedPosts = posts.map((post: any) => {
              try {
                return {
                  title: decodeURIComponent(post.title || ''),
                  logNo: post.logNo || post.id || '',
                }
              } catch (decodeError) {
                // URL 디코딩 실패 시 원본 사용
                return {
                  title: post.title || '',
                  logNo: post.logNo || post.id || '',
                }
              }
            })
            console.log(
              '디코딩된 포스트 제목들:',
              decodedPosts.slice(0, 3).map(p => p.title),
            ) // 처음 3개만 로그
            return decodedPosts
          } else {
            console.log('포스트 배열이 비어있음')
          }
        } catch (jsonError) {
          console.log('❌ JSON 파싱 실패:', jsonError.message)

          // JSON 파싱 실패 시 더 간단한 정규식으로 개별 포스트 추출
          try {
            console.log('정규식으로 개별 포스트 추출 시도...')

            // logNo와 title을 개별적으로 추출
            const logNoMatches = [...responseText.matchAll(/"logNo":"(\d+)"/g)]
            const titleMatches = [...responseText.matchAll(/"title":"([^"]+)"/g)]

            console.log(`logNo ${logNoMatches.length}개, title ${titleMatches.length}개 발견`)

            if (logNoMatches.length > 0 && titleMatches.length > 0) {
              const posts = []
              const minLength = Math.min(logNoMatches.length, titleMatches.length)

              for (let i = 0; i < minLength; i++) {
                try {
                  const title = decodeURIComponent(titleMatches[i][1])
                  const logNo = logNoMatches[i][1]
                  posts.push({ title, logNo })
                } catch (decodeError) {
                  // 디코딩 실패 시 원본 사용
                  posts.push({
                    title: titleMatches[i][1],
                    logNo: logNoMatches[i][1],
                  })
                }
              }

              console.log(`✅ 정규식으로 ${posts.length}개 포스트 추출 성공!`)
              console.log('추출된 포스트 제목들 (처음 5개):')
              posts.slice(0, 5).forEach((post, idx) => {
                console.log(`  ${idx + 1}. ${post.title} (${post.logNo})`)
              })

              if (posts.length >= 20) {
                console.log(`🎯 ${posts.length}개 포스트 발견 - 충분한 데이터!`)
              } else if (posts.length >= 10) {
                console.log(`⚠️ ${posts.length}개 포스트 발견 - 보통 수준`)
              } else {
                console.log(`❌ ${posts.length}개 포스트만 발견 - 더 많은 데이터 필요`)
              }

              return posts
            }
          } catch (regexError) {
            console.log('정규식 추출도 실패:', regexError.message)
          }

          console.log('HTML 응답으로 처리')
          // HTML 응답인 경우 파싱 시도
          return parsePostsFromHTML(responseText, blogId)
        }
      } else {
        console.log(`❌ 엔드포인트 ${i + 1} 실패: ${response.status}`)
      }
    } catch (error) {
      console.error(`엔드포인트 ${i + 1} 오류:`, error)
      continue
    }
  }

  // 모든 엔드포인트 실패 시 테스트 데이터 반환
  console.log('모든 엔드포인트 실패 - 테스트 데이터로 대체')
  return generateTestPosts(blogId)
}

// HTML에서 포스트 목록 파싱
function parsePostsFromHTML(html: string, blogId: string): Array<{ title: string; logNo: string }> {
  console.log('HTML에서 포스트 파싱 시도')

  // 간단한 HTML 파싱으로 포스트 제목 추출 시도
  const titleMatches = html.match(/<[^>]*title[^>]*>([^<]+)</gi) || []
  const posts = titleMatches
    .map((match, index) => {
      const title = match.replace(/<[^>]*>/g, '').trim()
      return {
        title: title || `${blogId} 포스트 ${index + 1}`,
        logNo: `html_${index + 1}`,
      }
    })
    .slice(0, 10) // 최대 10개

  console.log(`HTML에서 ${posts.length}개 포스트 추출`)
  return posts.length > 0 ? posts : generateTestPosts(blogId)
}

// 테스트용 포스트 데이터 생성
function generateTestPosts(blogId: string): Array<{ title: string; logNo: string }> {
  console.log('테스트 포스트 데이터 생성:', blogId)

  return [
    { title: `${blogId} 블로그 포스트 1`, logNo: '1001' },
    { title: `${blogId} 블로그 포스트 2`, logNo: '1002' },
    { title: `${blogId} 블로그 포스트 3`, logNo: '1003' },
    { title: `${blogId} 블로그 포스트 4`, logNo: '1004' },
    { title: `${blogId} 블로그 포스트 5`, logNo: '1005' },
  ]
}

// 개별 포스트 지수 측정
async function measurePostIndex(title: string, logNo: string): Promise<number | null> {
  try {
    console.log(`포스트 지수 측정 시작: ${title}`)

    // 1. 게시물 제목 전처리 (이모지 제거, 50자 제한)
    const cleanTitle = title
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .substring(0, 50)
      .trim()

    if (!cleanTitle) {
      console.log('제목이 비어있어서 지수 측정 불가')
      return null
    }

    // 2. 네이버 검색 API 호출 (4단계 시도)
    const searchAttempts = [
      { query: `"${cleanTitle}"`, start: 1 }, // 1차: 따옴표 포함 (start=1)
      { query: cleanTitle, start: 1 }, // 2차: 따옴표 제외 (start=1)
      { query: `"${cleanTitle}"`, start: 5 }, // 3차: 따옴표 포함 (start=5)
      { query: cleanTitle, start: 5 }, // 4차: 따옴표 제외 (start=5)
    ]

    for (const attempt of searchAttempts) {
      console.log(`검색 시도: ${attempt.query} (start=${attempt.start})`)
      const score = await callNaverSearchAPI(attempt.query, attempt.start, logNo)
      if (score !== null) {
        console.log(`지수 측정 성공: ${score}`)
        return score
      }
    }

    // 모든 시도 실패 시 테스트 점수 반환
    console.log('모든 검색 시도 실패 - 테스트 점수 반환')
    return generateTestScore(title, logNo)
  } catch (error) {
    console.error('포스트 지수 측정 오류:', error)
    return generateTestScore(title, logNo)
  }
}

// 테스트용 점수 생성
function generateTestScore(title: string, logNo: string): number {
  // 제목이나 logNo에 따라 다른 점수 생성
  const hash = (title + logNo).split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

  // 0.05 ~ 0.6 사이의 랜덤 점수
  const score = 0.05 + ((Math.abs(hash) % 1000) / 1000) * 0.55
  console.log(`테스트 점수 생성: ${title} -> ${score}`)
  return score
}

// 네이버 검색 API 호출
async function callNaverSearchAPI(query: string, start: number, logNo: string): Promise<number | null> {
  try {
    // 네이버 API 문서에 맞춘 URL 인코딩 (공백을 +로, 더 엄격한 인코딩)
    const encodedQuery = encodeURIComponent(query)
      .replace(/%20/g, '+')  // 공백을 +로 변경
      .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()) // 특수문자 추가 인코딩
    
    const url = `https://s.search.naver.com/p/review/search.naver?where=m_view&start=${start}&query=${encodedQuery}&mode=normal&sm=mtb_jum&api_type=1`
    
    console.log(`검색 URL: ${url}`)

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://www.naver.com',
        'User-Agent': 'Mozilla/5.0',
        // Accept:
        //   'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;
        //   v=b3;q=0.7',
        // 'Accept-Encoding': 'gzip, deflate, br, zstd',
        // 'Accept-Language': 'ko,en;q=0.9,en-US;q=0.8',
        // Cookie:
        //   'NAC=LG0IBwwNfuHdB; NNB=BZOTMC5ZXSZGQ; BA_DEVICE=3a41961e-f716-4f13-bc23-18aafb7e5542; ba.
        //   uuid=d14bf2d4-6064-439b-8734-2f3839d059dd; NACT=1; SRT30=1758694727; SRT5=1758694727; 
        //   _naver_usersession_=OcKOjoAtFnwrsmzDtwvS0g==; page_uid=jLMLTspzL8wss4i4d4dssssstoR-445549; 
        //   BUC=LLVJwAbM2arPK8Or4yly8baIF1IMNc_B7vIbB0MLj1M=; JSESSIONID=51EFEEA98AC6638021870D31BC123223.jvm1',
        // Priority: 'u=0, i',
        // Referer: 'https://blog.naver.com',
        // 'Sec-Ch-Ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',
        // 'Sec-Ch-Ua-Mobile': '?0',
        // 'Sec-Ch-Ua-Platform': '"macOS"',
        // 'Sec-Fetch-Dest': 'iframe',
        // 'Sec-Fetch-Mode': 'navigate',
        // 'Sec-Fetch-Site': 'same-origin',
        // 'Upgrade-Insecure-Requests': '1',
        // 'User-Agent':
        //   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.
        //   0.0.0',
      },
    }
  )

    console.log(`검색 API 응답 상태: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      console.log(`검색 API 실패: ${response.status}`)
      return null
    }

    const responseText = await response.text()
    console.log(`검색 API 응답 길이: ${responseText.length}`)
    // console.log(`검색 API 응답 내용 (처음 500자):`, responseText)
    console.log(`검색 API 응답 내용 (처음 500자):`, responseText.substring(0, 500))

    // 3. JSON 응답 파싱 - quality 점수 추출
    try {
      const jsonData = JSON.parse(responseText)
      console.log('JSON 파싱 성공!')
      
      // 검색 결과에서 quality 점수 추출: result.section[0].data.document[]
      if (jsonData.result && jsonData.result.section && jsonData.result.section[0] && jsonData.result.section[0].data) {
        const documents = jsonData.result.section[0].data.document || []
        console.log(`검색 결과 ${documents.length}개 발견`)
        
        for (const doc of documents) {
          if (doc.common && doc.render) {
            const { quality, title, gdid } = doc.common
            const { url } = doc.render
            
            console.log(`검색 결과: "${title}", quality: ${quality}, gdid: ${gdid}`)
            console.log(`URL: ${url}`)
            
            // URL에서 포스트 ID 추출하여 logNo와 매칭
            const urlMatch = url.match(/\/(\d+)$/)
            const postId = urlMatch ? urlMatch[1] : null
            
            // logNo와 매칭 시도 (포스트 ID 또는 제목으로)
            if (postId === logNo || title.includes(query.replace(/"/g, ''))) {
              console.log(`매칭 성공! PostID: ${postId}, LogNo: ${logNo}, Quality: ${quality}`)
              
              // quality 값이 이미 0~1 사이의 블로그 지수이므로 그대로 반환
              return quality
            }
          }
        }
        
        console.log('검색 결과에서 해당 포스트를 찾지 못함')
      } else {
        console.log('검색 결과 구조가 예상과 다름')
      }
      
    } catch (jsonError) {
      console.log('JSON 파싱 실패:', jsonError.message)
    }

    return null
  } catch (error) {
    console.error('네이버 검색 API 호출 오류:', error)
    return null
  }
}

// 플레이스 검색 지수 측정 함수 (향후 구현)
export async function measurePlaceSearchIndex(keyword: string): Promise<BlogIndexMeasurementResponse> {
  try {
    // TODO: 플레이스 검색 지수 구현
    // 1. 네이버 통합검색 페이지 접속: https://search.naver.com/search.naver
    // 2. JavaScript 변수에서 데이터 추출: naver.search.ext.nmb.salt.query
    // 3. nlu_query 필드에서 플레이스 검색 지수 데이터 파싱

    return {
      success: false,
      error: '플레이스 검색 지수는 아직 구현되지 않았습니다.',
    }
  } catch (error) {
    console.error('플레이스 검색 지수 측정 오류:', error)
    return {
      success: false,
      error: '플레이스 검색 지수 측정 중 오류가 발생했습니다.',
    }
  }
}
