import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { NaverBestKeywordParser } from './lib/analyze/naver-best-keyword-parser.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// HTML 파일 읽기 (압축된 HTML 파일 사용)
const htmlPath = path.join(__dirname, 'debug-html', 'naver-shopping-단화-1757314377710.html')
const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

console.log('HTML 파일 크기:', htmlContent.length, 'bytes')

// 키워드 관련 패턴 찾기
const patterns = [
  /랭킹.*?(\d+)위/g,
  /(\d+)위.*?랭킹/g,
  /키워드.*?(\d+)/g,
  /순위.*?(\d+)/g,
  /(\d+)위/g,
  /랭킹/g,
  /키워드/g,
  /순위/g,
]

console.log('\n=== 패턴 매칭 결과 ===')
patterns.forEach((pattern, index) => {
  const matches = htmlContent.match(pattern)
  if (matches) {
    console.log(`패턴 ${index + 1}: ${matches.length}개 매칭`)
    console.log('샘플:', matches.slice(0, 5))
  } else {
    console.log(`패턴 ${index + 1}: 매칭 없음`)
  }
})

// 특정 텍스트 패턴 찾기
const textPatterns = [
  '1위',
  '2위',
  '3위',
  '4위',
  '5위',
  '랭킹',
  '키워드',
  '순위',
  '상승',
  '하락',
  '유지',
  '신규',
  '베스트',
  '인기',
  '트렌드',
  '검색',
  '상품',
  '쇼핑',
  '네이버',
  '운동화',
  '신발',
  '의류',
  '화장품',
  '디지털',
  '가전',
]

console.log('\n=== 텍스트 패턴 검색 ===')
textPatterns.forEach(text => {
  const count = (htmlContent.match(new RegExp(text, 'g')) || []).length
  if (count > 0) {
    console.log(`"${text}": ${count}개 발견`)
  }
})

// "신규" 텍스트 주변 컨텍스트 찾기
console.log('\n=== "신규" 주변 컨텍스트 분석 ===')
const newKeywordMatches = htmlContent.match(/신규/g)
if (newKeywordMatches) {
  console.log(`"신규" 발견: ${newKeywordMatches.length}개`)

  // "신규" 주변 100자씩 추출
  const newKeywordIndexes = []
  let index = htmlContent.indexOf('신규')
  while (index !== -1) {
    newKeywordIndexes.push(index)
    index = htmlContent.indexOf('신규', index + 1)
  }

  newKeywordIndexes.forEach((idx, i) => {
    const start = Math.max(0, idx - 100)
    const end = Math.min(htmlContent.length, idx + 100)
    const context = htmlContent.substring(start, end)
    console.log(`\n신규 ${i + 1}번째 주변 컨텍스트:`)
    console.log(context)
  })
}

// 실제 키워드 데이터 구조 찾기
console.log('\n=== 실제 키워드 데이터 구조 분석 ===')

// 1. "의류" 키워드 주변 컨텍스트 분석
const clothingIndex = htmlContent.indexOf('의류')
if (clothingIndex !== -1) {
  const start = Math.max(0, clothingIndex - 200)
  const end = Math.min(htmlContent.length, clothingIndex + 200)
  const context = htmlContent.substring(start, end)
  console.log('=== "의류" 키워드 주변 컨텍스트 ===')
  console.log(context)
}

// 2. 실제 키워드 데이터가 있는 부분 찾기
console.log('\n=== 키워드 데이터 영역 검색 ===')
const keywordDataPatterns = [
  /window\.__INITIAL_STATE__\s*=\s*({.*?});/gs,
  /window\.__PRELOADED_STATE__\s*=\s*({.*?});/gs,
  /window\.__NEXT_DATA__\s*=\s*({.*?});/gs,
  /"keywords"\s*:\s*\[(.*?)\]/gs,
  /"data"\s*:\s*\[(.*?)\]/gs,
  /"items"\s*:\s*\[(.*?)\]/gs,
  /"list"\s*:\s*\[(.*?)\]/gs,
  /"results"\s*:\s*\[(.*?)\]/gs,
]

keywordDataPatterns.forEach((pattern, index) => {
  const matches = htmlContent.match(pattern)
  if (matches) {
    console.log(`데이터 패턴 ${index + 1}: ${matches.length}개 매칭`)
    matches.forEach((match, i) => {
      if (match.includes('의류') || match.includes('화장품') || match.includes('디지털') || match.includes('키워드')) {
        console.log(`  매칭 ${i + 1}:`, match.substring(0, 300) + '...')
      }
    })
  }
})

// 3. script 태그 내의 데이터 찾기
console.log('\n=== Script 태그 내 데이터 검색 ===')
const scriptMatches = htmlContent.match(/<script[^>]*>(.*?)<\/script>/gs)
if (scriptMatches) {
  console.log(`Script 태그: ${scriptMatches.length}개 발견`)

  scriptMatches.forEach((script, index) => {
    if (
      script.includes('의류') ||
      script.includes('화장품') ||
      script.includes('디지털') ||
      script.includes('키워드')
    ) {
      console.log(`\nScript ${index + 1} (키워드 관련):`)
      console.log(script.substring(0, 1000) + '...')

      // JSON 데이터 추출 시도
      try {
        const jsonMatch = script.match(/\{.*\}/s)
        if (jsonMatch) {
          console.log('\n=== JSON 데이터 추출 시도 ===')
          const jsonData = JSON.parse(jsonMatch[0])
          console.log('JSON 파싱 성공!')
          console.log('키:', Object.keys(jsonData))

          // 키워드 데이터 찾기
          if (jsonData.data && jsonData.data.keywords) {
            console.log('키워드 데이터 발견:', jsonData.data.keywords.length, '개')
          }
        }
      } catch (e) {
        console.log('JSON 파싱 실패:', e.message)
      }
    }
  })
}

// 4. Next.js 데이터 추출
console.log('\n=== Next.js 데이터 추출 ===')
const nextDataMatches = htmlContent.match(/self\.__next_f\.push\(\[.*?\]\)/gs)
if (nextDataMatches) {
  console.log(`Next.js 데이터: ${nextDataMatches.length}개 발견`)

  nextDataMatches.forEach((match, index) => {
    if (match.includes('키워드') || match.includes('BEST_KEYWORD')) {
      console.log(`\nNext.js 데이터 ${index + 1}:`)
      console.log(match.substring(0, 2000) + '...')

      // JSON 데이터 추출 시도
      try {
        // self.__next_f.push([1,"8:[\"$\",\"$L12\",null,{\"data\":{...}}]]") 형태에서 JSON 부분 추출
        const jsonMatch = match.match(/self\.__next_f\.push\(\[1,"8:\[.*?\]"\]\)/s)
        if (jsonMatch) {
          const jsonStr = jsonMatch[0].replace(/self\.__next_f\.push\(\[1,"8:\[/, '').replace(/"\]\)$/, '')
          const decodedJson = JSON.parse(jsonStr)
          console.log('\n=== Next.js JSON 파싱 성공 ===')
          console.log('데이터 구조:', Object.keys(decodedJson))

          if (decodedJson.data) {
            console.log('data 키:', Object.keys(decodedJson.data))

            if (decodedJson.data.chartTypeData) {
              console.log('차트 타입:', decodedJson.data.chartTypeData)
            }

            // 키워드 데이터 찾기
            if (decodedJson.data.keywords) {
              console.log('키워드 데이터 발견:', decodedJson.data.keywords.length, '개')
              console.log('샘플 키워드:', decodedJson.data.keywords.slice(0, 3))
            }

            // 카테고리 데이터 찾기
            if (decodedJson.data.categories) {
              console.log('카테고리 데이터 발견:', decodedJson.data.categories.length, '개')
            }
          }
        }
      } catch (e) {
        console.log('Next.js JSON 파싱 실패:', e.message)
      }
    }
  })
}

// 2. HTML 태그 구조에서 키워드 찾기
console.log('\n=== HTML 태그 구조 분석 ===')
const tagPatterns = [
  /<span[^>]*>([가-힣\w\s]+)<\/span>/g,
  /<div[^>]*>([가-힣\w\s]+)<\/div>/g,
  /<a[^>]*>([가-힣\w\s]+)<\/a>/g,
  /<li[^>]*>([가-힣\w\s]+)<\/li>/g,
  /<td[^>]*>([가-힣\w\s]+)<\/td>/g,
]

tagPatterns.forEach((pattern, index) => {
  const matches = htmlContent.match(pattern)
  if (matches) {
    // 키워드 관련 태그만 필터링
    const keywordMatches = matches.filter(match => {
      const text = match.replace(/<[^>]*>/g, '')
      return ['의류', '화장품', '디지털', '가전', '운동화', '신발'].includes(text.trim())
    })

    if (keywordMatches.length > 0) {
      console.log(`태그 패턴 ${index + 1}: ${keywordMatches.length}개 키워드 관련 매칭`)
      console.log('샘플:', keywordMatches.slice(0, 3))
    }
  }
})

// 3. JSON 데이터나 JavaScript 변수에서 키워드 찾기
console.log('\n=== JavaScript/JSON 데이터 검색 ===')
const jsPatterns = [
  /var\s+\w+\s*=\s*\[(.*?)\]/gs,
  /const\s+\w+\s*=\s*\[(.*?)\]/gs,
  /let\s+\w+\s*=\s*\[(.*?)\]/gs,
  /window\.\w+\s*=\s*\[(.*?)\]/gs,
  /"keywords"\s*:\s*\[(.*?)\]/gs,
  /"data"\s*:\s*\[(.*?)\]/gs,
]

jsPatterns.forEach((pattern, index) => {
  const matches = htmlContent.match(pattern)
  if (matches) {
    console.log(`JS 패턴 ${index + 1}: ${matches.length}개 매칭`)
    matches.forEach((match, i) => {
      if (match.includes('의류') || match.includes('화장품') || match.includes('디지털')) {
        console.log(`  매칭 ${i + 1}:`, match.substring(0, 200) + '...')
      }
    })
  }
})

// JSON 데이터 찾기
console.log('\n=== JSON 데이터 검색 ===')
const jsonPatterns = [
  /window\.__INITIAL_STATE__\s*=\s*({.*?});/g,
  /window\.__NEXT_DATA__\s*=\s*({.*?});/g,
  /__NEXT_DATA__\s*=\s*({.*?});/g,
  /"keywords":\s*\[(.*?)\]/g,
  /"ranking":\s*\[(.*?)\]/g,
]

jsonPatterns.forEach((pattern, index) => {
  const matches = htmlContent.match(pattern)
  if (matches) {
    console.log(`JSON 패턴 ${index + 1}: ${matches.length}개 매칭`)
    console.log('샘플:', matches[0].substring(0, 200) + '...')
  } else {
    console.log(`JSON 패턴 ${index + 1}: 매칭 없음`)
  }
})

// HTML 구조 분석
console.log('\n=== HTML 구조 분석 ===')
const structurePatterns = [
  /<div[^>]*class="[^"]*ranking[^"]*"[^>]*>/g,
  /<div[^>]*class="[^"]*keyword[^"]*"[^>]*>/g,
  /<div[^>]*class="[^"]*rank[^"]*"[^>]*>/g,
  /<span[^>]*class="[^"]*rank[^"]*"[^>]*>/g,
  /<li[^>]*class="[^"]*item[^"]*"[^>]*>/g,
]

structurePatterns.forEach((pattern, index) => {
  const matches = htmlContent.match(pattern)
  if (matches) {
    console.log(`구조 패턴 ${index + 1}: ${matches.length}개 매칭`)
    console.log('샘플:', matches.slice(0, 3))
  } else {
    console.log(`구조 패턴 ${index + 1}: 매칭 없음`)
  }
})

// 파서 테스트
console.log('\n=== 파서 테스트 ===')
try {
  const parser = new NaverBestKeywordParser()
  const result = await parser.parseHTML(htmlContent, 'https://snxbest.naver.com/keyword/best?categoryId=17210')

  console.log('파싱 결과:')
  console.log('- URL:', result.url)
  console.log('- 제목:', result.title)
  console.log('- 카테고리:', result.categoryName)
  console.log('- 키워드 수:', result.totalKeywords)
  console.log('- 기간:', result.periodType)
  console.log('- 연령:', result.ageType)

  if (result.keywords.length > 0) {
    console.log('\n키워드 샘플:')
    result.keywords.slice(0, 5).forEach(keyword => {
      console.log(`  ${keyword.rank}위: ${keyword.keyword} (${keyword.trendText})`)
    })
  } else {
    console.log('키워드 데이터를 찾을 수 없습니다.')
  }
} catch (error) {
  console.log('파서 테스트 실패:', error.message)
}
