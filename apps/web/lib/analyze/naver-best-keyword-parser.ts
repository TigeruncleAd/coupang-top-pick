import { parse } from 'node-html-parser'
import { HTMLElement } from 'node-html-parser'

// 네이버 쇼핑 베스트 키워드 데이터 타입
export interface NaverBestKeyword {
  rank: number
  keyword: string
  category: string
  trend: 'up' | 'down' | 'stable' | 'new' | 'keep' | 'jump'
  trendText: string
  relatedProducts: {
    name: string
    price: number
    originalPrice?: number
    discountRate?: number
    image: string
    mallName: string
    productUrl: string
    isAd: boolean
    reviewCount?: number
    rating?: number
  }[]
}

// 파싱된 네이버 베스트 키워드 데이터 타입
export interface ParsedNaverBestKeywordData {
  url: string
  title: string
  timestamp: number
  categoryName: string
  keywords: NaverBestKeyword[]
  totalKeywords: number
  periodType: string
  ageType: string
}

export class NaverBestKeywordParser {
  /**
   * 네이버 쇼핑 베스트 키워드 페이지 HTML 파싱
   */
  async parseHTML(htmlContent: string, url: string): Promise<ParsedNaverBestKeywordData> {
    const root = parse(htmlContent)
    const timestamp = Date.now()

    // 페이지 제목 추출
    const title = this.extractTitle(root)

    // 카테고리명 추출 (URL에서)
    const categoryName = this.extractCategoryName(url)

    // 키워드 데이터 추출
    const keywords = await this.extractKeywords(root, url)

    // URL 파라미터에서 기타 정보 추출
    const periodType = this.extractUrlParam(url, 'periodType') || 'DAILY'
    const ageType = this.extractUrlParam(url, 'ageType') || 'MEN_30'

    return {
      url,
      title,
      timestamp,
      categoryName,
      keywords,
      totalKeywords: keywords.length,
      periodType,
      ageType,
    }
  }

  /**
   * 페이지 제목 추출
   */
  private extractTitle(root: HTMLElement): string {
    const titleElement = root.querySelector('title')
    return titleElement?.textContent?.trim() || '네이버 쇼핑 베스트 키워드'
  }

  /**
   * URL에서 카테고리명 추출
   */
  private extractCategoryName(url: string): string {
    const categoryId = this.extractUrlParam(url, 'categoryId')

    const categoryMap: Record<string, string> = {
      A: '전체',
      '50000000': '패션의류',
      '50000001': '화장품/미용',
      '50000002': '디지털/가전',
      '50000003': '가구/인테리어',
      '50000004': '출산/육아',
      '50000005': '식품',
      '50000006': '스포츠/레저',
      '50000007': '생활/건강',
      '50000008': '패션잡화',
    }

    return categoryMap[categoryId || 'A'] || '전체'
  }

  /**
   * URL 파라미터 추출
   */
  private extractUrlParam(url: string, paramName: string): string | null {
    const urlObj = new URL(url)
    return urlObj.searchParams.get(paramName)
  }

  /**
   * 키워드 데이터 추출
   */
  private async extractKeywords(root: HTMLElement, url: string): Promise<NaverBestKeyword[]> {
    const keywords: NaverBestKeyword[] = []

    // 1. 압축된 HTML에서 키워드 추출 (최신 HTML 구조)
    const compressedKeywords = this.extractKeywordsFromCompressedHTML(root)
    if (compressedKeywords.length > 0) {
      console.log(`압축된 HTML에서 ${compressedKeywords.length}개의 키워드 추출 성공`)
      return compressedKeywords
    }

    // 2. 실제 HTML 구조에서 키워드 추출 (real.html 구조 기반)
    const realHtmlKeywords = this.extractKeywordsFromRealHTML(root)
    if (realHtmlKeywords.length > 0) {
      return realHtmlKeywords
    }

    // 2. Next.js 데이터에서 키워드 추출 시도
    const htmlContent = root.toString()
    const nextJsKeywords = this.extractKeywordsFromNextJS(htmlContent)
    if (nextJsKeywords.length > 0) {
      return nextJsKeywords
    }

    // 3. HTML 구조에서 키워드 추출 시도
    const htmlKeywords = this.extractKeywordsFromHTML(root)
    if (htmlKeywords.length > 0) {
      return htmlKeywords
    }

    // 4. 텍스트 패턴에서 키워드 추출 시도
    const textKeywords = this.extractKeywordsFromText(htmlContent)
    if (textKeywords.length > 0) {
      return textKeywords
    }

    return keywords
  }

  /**
   * 압축된 HTML에서 키워드 추출 (최신 HTML 구조)
   */
  private extractKeywordsFromCompressedHTML(root: HTMLElement): NaverBestKeyword[] {
    const keywords: NaverBestKeyword[] = []
    try {
      // 압축된 HTML에서 rankingTitleResponsive 구조 찾기 - 더 유연한 셀렉터 사용
      const keywordItems = root.querySelectorAll('[class*="rankingTitleResponsive_ranking_title_responsive"]')
      if (keywordItems.length > 0) {
        console.log(`압축된 HTML에서 ${keywordItems.length}개의 키워드 아이템 발견`)
        keywordItems.forEach((item, index) => {
          try {
            // 순위 추출 - 더 유연한 셀렉터 사용
            const rankElement = item.querySelector('[class*="rankingTitleResponsive_ranking"]')
            const rankText = rankElement?.textContent?.trim() || ''
            const rankMatch = rankText.match(/(\d+)/)
            const rank = rankMatch ? parseInt(rankMatch[1]) : index + 1

            // 키워드 추출 - 더 유연한 셀렉터 사용
            const titleElement = item.querySelector('[class*="rankingTitleResponsive_title"]')
            const keyword = titleElement?.textContent?.trim() || ''

            if (!keyword || keyword.length < 2) {
              console.log(`순위 ${rank}: 키워드가 비어있음`)
              return
            }

            // 트렌드 정보 추출
            const trendElement = item.querySelector('[class*="rankingTitleResponsive_up_down"]')
            let trend: 'up' | 'down' | 'stable' | 'new' | 'keep' | 'jump' = 'keep'
            let trendText = '유지'

            if (trendElement) {
              if (trendElement.querySelector('[class*="triangle"]:not([class*="down"])')) {
                trend = 'up'
                trendText = '상승'
              } else if (trendElement.querySelector('[class*="triangle"][class*="down"]')) {
                trend = 'down'
                trendText = '하락'
              } else if (trendElement.querySelector('[class*="text_new"]')) {
                trend = 'new'
                trendText = '신규'
              } else if (trendElement.querySelector('[class*="icon_jump"]')) {
                trend = 'jump'
                trendText = '급등'
              }
            }

            // 카테고리 추출
            const tagElement = item.querySelector('[class*="rankingTitleResponsive_tag"]')
            const category = tagElement?.textContent?.trim() || ''

            const keywordData: NaverBestKeyword = {
              rank,
              keyword,
              category,
              trend,
              trendText,
              relatedProducts: [],
            }

            keywords.push(keywordData)
            console.log(`추출된 키워드: ${rank}위 - ${keyword} (${trendText}) - ${category}`)
          } catch (error) {
            console.error(`키워드 아이템 ${index} 파싱 실패:`, error)
          }
        })
      }
    } catch (error) {
      console.error('압축된 HTML 구조 파싱 실패:', error)
    }
    return keywords
  }

  /**
   * 실제 HTML 구조에서 키워드 추출 (real.html 구조 기반)
   */
  private extractKeywordsFromRealHTML(root: HTMLElement): NaverBestKeyword[] {
    const keywords: NaverBestKeyword[] = []

    try {
      // 1. rankingTitleResponsive 구조 (smartstore.html)
      const keywordItems = root.querySelectorAll('.rankingTitleResponsive_ranking_title_responsive__ZoQ7e')

      if (keywordItems.length > 0) {
        console.log(`rankingTitleResponsive 구조에서 ${keywordItems.length}개의 키워드 아이템 발견`)

        keywordItems.forEach((item, index) => {
          try {
            // 순위 추출
            const rankElement = item.querySelector('.rankingTitleResponsive_ranking__g38oq')
            const rankText = rankElement?.textContent?.trim() || ''
            const rankMatch = rankText.match(/(\d+)/)
            const rank = rankMatch ? parseInt(rankMatch[1]) : index + 1

            // 키워드명 추출
            const titleElement = item.querySelector('.rankingTitleResponsive_title__z9c4V')
            const keyword = titleElement?.textContent?.trim() || ''

            if (!keyword || keyword.length < 2) {
              console.log(`순위 ${rank}: 키워드명이 비어있음`)
              return
            }

            // 트렌드 추출
            let trend: 'up' | 'down' | 'stable' | 'new' = 'stable'
            let trendText = '유지'

            // 랭킹 변화 상태 확인
            const upDownElement = item.querySelector('.rankingTitleResponsive_up_down__EZ9OW')
            if (upDownElement) {
              // 급등 아이콘 확인
              const surgeIcon = upDownElement.querySelector('svg')
              if (surgeIcon) {
                trend = 'up'
                trendText = '급등'
              } else {
                // 상승/하락/유지 확인
                const triangleElement = upDownElement.querySelector('.rankingTitleResponsive_triangle__sbx_K')
                const keepElement = upDownElement.querySelector('.rankingTitleResponsive_keep__73Y35')

                if (triangleElement) {
                  trend = 'up'
                  trendText = '상승'
                } else if (keepElement) {
                  trend = 'stable'
                  trendText = '유지'
                }
              }
            }

            // 카테고리 태그 추출
            const tagElement = item.querySelector('.rankingTitleResponsive_tag__eA_lS')
            const category = tagElement?.textContent?.trim() || ''

            const keywordData: NaverBestKeyword = {
              rank,
              keyword,
              category,
              trend,
              trendText,
              relatedProducts: [],
            }

            keywords.push(keywordData)
            console.log(`추출된 키워드: ${rank}위 - ${keyword} (${trendText}) - ${category}`)
          } catch (error) {
            console.error(`키워드 아이템 ${index} 파싱 실패:`, error)
          }
        })
      }

      // 2. productCardResponsive 구조 (real.html)
      const productCards = root.querySelectorAll('.productCardResponsive_product_card_responsive__yDxRB')

      if (productCards.length > 0 && keywords.length === 0) {
        console.log(`productCardResponsive 구조에서 ${productCards.length}개의 상품 카드 발견`)

        productCards.forEach((card, index) => {
          try {
            // 순위 추출
            const rankElement = card.querySelector('.productCardResponsive_ranking__eUd6F')
            const rankText = rankElement?.textContent?.trim() || ''
            const rankMatch = rankText.match(/(\d+)/)
            const rank = rankMatch ? parseInt(rankMatch[1]) : index + 1

            // 상품명 추출 (키워드로 사용)
            const titleElement = card.querySelector('.productCardResponsive_title__n77mU')
            const keyword = titleElement?.textContent?.trim() || ''

            if (!keyword || keyword.length < 2) {
              console.log(`순위 ${rank}: 상품명이 비어있음`)
              return
            }

            // 스토어명 추출 (카테고리로 사용)
            const storeElement = card.querySelector('.productCardResponsive_store__GaHMN')
            const category = storeElement?.textContent?.trim() || ''

            // 가격 정보 추출
            const priceElement = card.querySelector('.productCardResponsive_price__JeSTN')
            const priceText = priceElement?.textContent?.trim() || ''

            const keywordData: NaverBestKeyword = {
              rank,
              keyword,
              category,
              trend: 'stable',
              trendText: '유지',
              relatedProducts: [
                {
                  name: keyword,
                  price: this.extractPriceFromText(priceText),
                  image: '',
                  mallName: category,
                  productUrl: '',
                  isAd: false,
                },
              ],
            }

            keywords.push(keywordData)
            console.log(`추출된 상품: ${rank}위 - ${keyword} - ${category}`)
          } catch (error) {
            console.error(`상품 카드 ${index} 파싱 실패:`, error)
          }
        })
      }

      // 순위순으로 정렬
      keywords.sort((a, b) => a.rank - b.rank)

      console.log(`총 ${keywords.length}개의 키워드 추출 완료`)
      return keywords
    } catch (error) {
      console.error('실제 HTML 구조 파싱 실패:', error)
      return keywords
    }
  }

  /**
   * Next.js 데이터에서 키워드 추출
   */
  private extractKeywordsFromNextJS(htmlContent: string): NaverBestKeyword[] {
    const keywords: NaverBestKeyword[] = []

    try {
      // Next.js 데이터 패턴 찾기
      const nextDataMatches = htmlContent.match(/self\.__next_f\.push\(\[.*?\]\)/gs)
      if (!nextDataMatches) return keywords

      for (const match of nextDataMatches) {
        if (match.includes('BEST_KEYWORD') || match.includes('키워드')) {
          // JSON 데이터 추출 시도
          const jsonMatch = match.match(/self\.__next_f\.push\(\[1,"8:\[.*?\]"\]\)/s)
          if (jsonMatch) {
            try {
              const jsonStr = jsonMatch[0].replace(/self\.__next_f\.push\(\[1,"8:\[/, '').replace(/"\]\)$/, '')
              const decodedJson = JSON.parse(jsonStr)

              if (decodedJson.data && decodedJson.data.keywords) {
                return this.parseKeywordArray(decodedJson.data.keywords)
              }
            } catch (e) {
              console.log('Next.js JSON 파싱 실패:', e)
            }
          }
        }
      }
    } catch (e) {
      console.log('Next.js 데이터 추출 실패:', e)
    }

    return keywords
  }

  /**
   * HTML 구조에서 키워드 추출
   */
  private extractKeywordsFromHTML(root: HTMLElement): NaverBestKeyword[] {
    const keywords: NaverBestKeyword[] = []

    try {
      // 키워드 리스트 컨테이너 찾기
      const keywordContainers = root.querySelectorAll('[class*="keyword"], [class*="rank"], [class*="chart"]')

      for (const container of keywordContainers) {
        const keywordItems = container.querySelectorAll('li, div, span')

        for (let i = 0; i < keywordItems.length; i++) {
          const item = keywordItems[i]
          const text = item.text?.trim()

          if (text && this.isValidKeyword(text)) {
            const keyword = this.parseKeywordFromText(text, i + 1)
            if (keyword) {
              keywords.push(keyword)
            }
          }
        }
      }
    } catch (e) {
      console.log('HTML 구조 파싱 실패:', e)
    }

    return keywords
  }

  /**
   * 텍스트 패턴에서 키워드 추출
   */
  private extractKeywordsFromText(htmlContent: string): NaverBestKeyword[] {
    const keywords: NaverBestKeyword[] = []

    try {
      // 다양한 키워드 패턴 시도
      const patterns = [
        // "1위 키워드명 상승" 패턴
        /(\d+)위\s*([가-힣\w\s]+?)\s*(상승|하락|유지|신규)/g,
        // "랭킹 상승 키워드명" 패턴
        /랭킹\s*상승\s*([가-힣\w\s]+)/g,
        // "키워드명 1위" 패턴
        /([가-힣\w\s]+?)\s*(\d+)위/g,
        // "상승 키워드명" 패턴
        /상승\s*([가-힣\w\s]+)/g,
        // "하락 키워드명" 패턴
        /하락\s*([가-힣\w\s]+)/g,
        // "신규 키워드명" 패턴
        /신규\s*([가-힣\w\s]+)/g,
      ]

      for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(htmlContent)) !== null) {
          const keyword = this.parseKeywordFromMatch(match, pattern)
          if (keyword && !keywords.find(k => k.keyword === keyword.keyword)) {
            keywords.push(keyword)
          }
        }
      }
    } catch (e) {
      console.log('텍스트 패턴 파싱 실패:', e)
    }

    return keywords
  }

  /**
   * 키워드 배열 파싱
   */
  private parseKeywordArray(keywordArray: any[]): NaverBestKeyword[] {
    const keywords: NaverBestKeyword[] = []

    for (let i = 0; i < keywordArray.length; i++) {
      const item = keywordArray[i]

      if (typeof item === 'string') {
        const keyword = this.parseKeywordFromText(item, i + 1)
        if (keyword) {
          keywords.push(keyword)
        }
      } else if (typeof item === 'object' && item !== null) {
        const keyword: NaverBestKeyword = {
          rank: i + 1,
          keyword: item.keyword || item.name || item.title || '',
          category: item.category || '',
          trend: this.parseTrendType(item.changeType || item.trend || '유지'),
          trendText: item.changeType || item.trend || '유지',
          relatedProducts: [],
        }

        if (keyword.keyword) {
          keywords.push(keyword)
        }
      }
    }

    return keywords
  }

  /**
   * 텍스트에서 키워드 파싱
   */
  private parseKeywordFromText(text: string, rank: number): NaverBestKeyword | null {
    if (!this.isValidKeyword(text)) return null

    // 순위, 키워드명, 변화 추출
    const patterns = [
      /(\d+)위\s*([가-힣\w\s]+?)\s*(상승|하락|유지|신규)/,
      /([가-힣\w\s]+?)\s*(\d+)위/,
      /(상승|하락|유지|신규)\s*([가-힣\w\s]+)/,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        return this.parseKeywordFromMatch(match, pattern)
      }
    }

    // 단순 키워드명만 있는 경우
    return {
      rank,
      keyword: text.trim(),
      category: '',
      trend: 'stable',
      trendText: '유지',
      relatedProducts: [],
    }
  }

  /**
   * 매치 결과에서 키워드 파싱
   */
  private parseKeywordFromMatch(match: RegExpMatchArray, pattern: RegExp): NaverBestKeyword | null {
    if (!match || match.length < 2) return null

    const keyword: NaverBestKeyword = {
      rank: 0,
      keyword: '',
      category: '',
      trend: 'stable',
      trendText: '유지',
      relatedProducts: [],
    }

    if (pattern.source.includes('(\\d+)위')) {
      // "1위 키워드명 상승" 패턴
      keyword.rank = parseInt(match[1]) || 0
      keyword.keyword = match[2]?.trim() || ''
      keyword.trend = this.parseTrendType(match[3] || '유지')
      keyword.trendText = match[3] || '유지'
    } else if (pattern.source.includes('키워드명.*(\\d+)위')) {
      // "키워드명 1위" 패턴
      keyword.keyword = match[1]?.trim() || ''
      keyword.rank = parseInt(match[2]) || 0
    } else if (pattern.source.includes('(상승|하락|유지|신규)')) {
      // "상승 키워드명" 패턴
      keyword.trend = this.parseTrendType(match[1] || '유지')
      keyword.trendText = match[1] || '유지'
      keyword.keyword = match[2]?.trim() || ''
    }

    return keyword.keyword ? keyword : null
  }

  /**
   * 유효한 키워드인지 확인
   */
  private isValidKeyword(text: string): boolean {
    if (!text || text.length < 2) return false

    // 너무 짧거나 긴 텍스트 제외
    if (text.length < 2 || text.length > 50) return false

    // HTML 태그나 특수문자만 있는 경우 제외
    if (/^[<>&"']+$/.test(text)) return false

    // 숫자만 있는 경우 제외
    if (/^\d+$/.test(text)) return false

    // 한글이나 영문이 포함된 경우만 유효
    return /[가-힣a-zA-Z]/.test(text)
  }

  /**
   * 트렌드 타입 파싱
   */
  private parseTrendType(trendText: string): 'up' | 'down' | 'stable' | 'new' {
    const text = trendText.trim()

    if (text.includes('상승') || text.includes('급등')) {
      return 'up'
    } else if (text.includes('하락')) {
      return 'down'
    } else if (text.includes('신규')) {
      return 'new'
    } else {
      return 'stable'
    }
  }

  /**
   * 대체 방법으로 키워드 추출 (실제 HTML 구조 기반)
   */
  private async extractKeywordsAlternative(root: HTMLElement): Promise<HTMLElement[]> {
    const elements: HTMLElement[] = []

    // 실제 HTML 구조에서 키워드와 순위 정보를 함께 찾기
    const keywordTitles = root.querySelectorAll(
      '.rankingTitleResponsive_title__z9c4V, strong[class*="rankingTitleResponsive_title"], span[class*="rankingTitleResponsive_title"]',
    )

    keywordTitles.forEach((titleElement, index) => {
      const keyword = titleElement.textContent?.trim()
      if (keyword && keyword.length > 1) {
        // 부모 요소에서 순위 정보 찾기
        let parent = (titleElement as any).parentElement
        let rank = index + 1 // 기본 순위

        // 부모 요소들을 순회하며 순위 정보 찾기
        while (parent && parent !== root) {
          const parentText = parent.textContent || ''
          const rankMatch = parentText.match(/(\d+)위/)
          if (rankMatch) {
            rank = parseInt(rankMatch[1])
            break
          }
          parent = parent.parentElement
        }

        // 트렌드 정보 찾기
        let trend = '유지'
        parent = (titleElement as any).parentElement
        while (parent && parent !== root) {
          const parentText = parent.textContent || ''
          if (parentText.includes('상승') || parentText.includes('급등')) {
            trend = '상승'
            break
          } else if (parentText.includes('하락')) {
            trend = '하락'
            break
          } else if (parentText.includes('신규')) {
            trend = '신규'
            break
          }
          parent = parent.parentElement
        }

        const virtualElement = this.createVirtualKeywordElement(rank.toString(), trend, keyword)
        if (virtualElement) {
          elements.push(virtualElement)
        }
      }
    })

    // 텍스트에서 키워드 패턴 찾기 (fallback)
    if (elements.length === 0) {
      const textContent = root.textContent || ''
      const rankPatterns = [
        // 기본 패턴: "1위 랭킹 유지 라부부"
        /(\d+)위.*?랭킹\s*(상승|하락|유지|신규|급등).*?([가-힣a-zA-Z0-9\s]+)/g,
        // 대체 패턴: "1위 라부부 _수집품_"
        /(\d+)위.*?([가-힣a-zA-Z0-9\s]+).*?_([가-힣a-zA-Z0-9\s]+)_/g,
        // 간단한 패턴: "1위 갤럭시s25"
        /(\d+)위.*?([가-힣a-zA-Z0-9\s]+)/g,
      ]

      // 각 패턴으로 키워드 추출 시도
      for (const pattern of rankPatterns) {
        let match
        while ((match = pattern.exec(textContent)) !== null) {
          // 가상의 키워드 요소 생성
          if (match[1] && match[2]) {
            const trend = match[3] || '유지' // 트렌드가 없으면 기본값
            const keyword = match[3] || match[2] // 키워드는 3번째 또는 2번째 매치
            const virtualElement = this.createVirtualKeywordElement(match[1], trend, keyword)
            if (virtualElement) {
              elements.push(virtualElement)
            }
          }
        }
      }
    }

    return elements
  }

  /**
   * 가상 키워드 요소 생성
   */
  private createVirtualKeywordElement(rank: string, trend: string, keyword: string): HTMLElement | null {
    if (!keyword || keyword.trim().length < 2) return null

    // 간단한 가상 요소 생성 (실제로는 더 복잡한 구조 필요)
    const html = `
      <div class="keyword_item" data-rank="${rank}" data-trend="${trend}">
        <span class="rank">${rank}위</span>
        <span class="trend">${trend}</span>
        <span class="keyword">${keyword.trim()}</span>
      </div>
    `

    const parsed = parse(html)
    return parsed.querySelector('.keyword_item')
  }

  /**
   * 키워드 요소 파싱
   */
  private parseKeywordElement(element: HTMLElement, defaultRank: number, url: string): NaverBestKeyword | null {
    try {
      // 순위 추출
      const rank = this.extractRank(element, defaultRank)

      // 키워드명 추출
      const keyword = this.extractKeywordName(element)
      if (!keyword || keyword.trim().length < 2) return null

      // 트렌드 추출
      const trend = this.extractTrend(element)

      // 관련 상품 추출
      const relatedProducts = this.extractRelatedProducts(element)

      // 카테고리 추출
      const category = this.extractCategoryFromUrl(url)

      return {
        rank,
        keyword: keyword.trim(),
        category,
        trend: trend.type,
        trendText: trend.text,
        relatedProducts,
      }
    } catch (error) {
      console.error('키워드 요소 파싱 실패:', error)
      return null
    }
  }

  /**
   * 순위 추출
   */
  private extractRank(element: HTMLElement, defaultRank: number): number {
    // 순위 선택자들
    const rankSelectors = ['.rank', '.ranking', '.order', '.position', '[data-rank]']

    for (const selector of rankSelectors) {
      const rankElement = element.querySelector(selector)
      if (rankElement) {
        const rankText = rankElement.textContent || ''
        const match = rankText.match(/(\d+)위/)
        if (match && match[1]) {
          return parseInt(match[1])
        }
      }
    }

    // data-rank 속성에서 추출
    const dataRank = element.getAttribute('data-rank')
    if (dataRank) {
      const rank = parseInt(dataRank)
      if (!isNaN(rank)) return rank
    }

    return defaultRank
  }

  /**
   * 키워드명 추출
   */
  private extractKeywordName(element: HTMLElement): string {
    // 키워드명 선택자들
    const keywordSelectors = ['.keyword', '.keyword_name', '.name', '.title', 'strong', 'b']

    for (const selector of keywordSelectors) {
      const keywordElement = element.querySelector(selector)
      if (keywordElement) {
        const text = this.extractTextFromElement(keywordElement)
        if (text && text.trim()) return text.trim()
      }
    }

    // 전체 텍스트에서 키워드 추출
    const fullText = element.textContent || ''
    const keywordMatch = fullText.match(/(\d+)위.*?랭킹\s*(상승|하락|유지|신규|급등)\s*([가-힣a-zA-Z0-9\s]+)/)
    if (keywordMatch && keywordMatch[3]) {
      return keywordMatch[3].trim()
    }

    return ''
  }

  /**
   * 트렌드 추출
   */
  private extractTrend(element: HTMLElement): { type: 'up' | 'down' | 'stable' | 'new'; text: string } {
    // 트렌드 선택자들
    const trendSelectors = ['.trend', '.change', '.movement', '.status']

    for (const selector of trendSelectors) {
      const trendElement = element.querySelector(selector)
      if (trendElement) {
        const trendText = trendElement.textContent || ''
        return this.parseTrendText(trendText)
      }
    }

    // data-trend 속성에서 추출
    const dataTrend = element.getAttribute('data-trend')
    if (dataTrend) {
      return this.parseTrendText(dataTrend)
    }

    // 전체 텍스트에서 트렌드 추출
    const fullText = element.textContent || ''
    const trendMatch = fullText.match(/랭킹\s*(상승|하락|유지|신규|급등)/)
    if (trendMatch && trendMatch[1]) {
      return this.parseTrendText(trendMatch[1])
    }

    return { type: 'stable', text: '유지' }
  }

  /**
   * 트렌드 텍스트 파싱
   */
  private parseTrendText(trendText: string): { type: 'up' | 'down' | 'stable' | 'new'; text: string } {
    const text = trendText.trim()

    if (text.includes('상승') || text.includes('급등')) {
      return { type: 'up', text }
    } else if (text.includes('하락')) {
      return { type: 'down', text }
    } else if (text.includes('신규')) {
      return { type: 'new', text }
    } else {
      return { type: 'stable', text: '유지' }
    }
  }

  /**
   * 관련 상품 추출
   */
  private extractRelatedProducts(element: HTMLElement): NaverBestKeyword['relatedProducts'] {
    const products: NaverBestKeyword['relatedProducts'] = []

    // 관련 상품 선택자들
    const productSelectors = [
      '.related_products .product',
      '.product_list .product_item',
      '.goods_list .goods_item',
      '.item_list .item',
    ]

    for (const selector of productSelectors) {
      const productElements = element.querySelectorAll(selector)
      productElements.forEach(productEl => {
        const product = this.parseProductElement(productEl)
        if (product) {
          products.push(product)
        }
      })
    }

    return products
  }

  /**
   * 상품 요소 파싱
   */
  private parseProductElement(element: HTMLElement): NaverBestKeyword['relatedProducts'][0] | null {
    try {
      const name = this.extractProductName(element)
      if (!name) return null

      const price = this.extractProductPrice(element)
      const originalPrice = this.extractOriginalPrice(element)
      const discountRate = this.extractDiscountRate(element)
      const image = this.extractProductImage(element)
      const mallName = this.extractMallName(element)
      const productUrl = this.extractProductUrl(element)
      const isAd = this.isAdProduct(element)
      const reviewCount = this.extractReviewCount(element)
      const rating = this.extractRating(element)

      return {
        name,
        price,
        originalPrice,
        discountRate,
        image,
        mallName,
        productUrl,
        isAd,
        reviewCount,
        rating,
      }
    } catch (error) {
      console.error('상품 요소 파싱 실패:', error)
      return null
    }
  }

  /**
   * 상품명 추출
   */
  private extractProductName(element: HTMLElement): string {
    const nameSelectors = ['.product_name', '.goods_name', '.item_name', '.title', 'h3', 'h4', 'strong']

    for (const selector of nameSelectors) {
      const nameElement = element.querySelector(selector)
      if (nameElement) {
        const text = this.extractTextFromElement(nameElement)
        if (text && text.trim()) return text.trim()
      }
    }

    return ''
  }

  /**
   * 상품 가격 추출
   */
  private extractProductPrice(element: HTMLElement): number {
    const priceSelectors = ['.price', '.current_price', '.sale_price', '.discount_price']

    for (const selector of priceSelectors) {
      const priceElement = element.querySelector(selector)
      if (priceElement) {
        const price = this.extractPriceFromText(priceElement.textContent || '')
        if (price > 0) return price
      }
    }

    return 0
  }

  /**
   * 원가 추출
   */
  private extractOriginalPrice(element: HTMLElement): number | undefined {
    const originalPriceSelectors = ['.original_price', '.list_price', '.before_price']

    for (const selector of originalPriceSelectors) {
      const priceElement = element.querySelector(selector)
      if (priceElement) {
        const price = this.extractPriceFromText(priceElement.textContent || '')
        if (price > 0) return price
      }
    }

    return undefined
  }

  /**
   * 할인율 추출
   */
  private extractDiscountRate(element: HTMLElement): number | undefined {
    const discountSelectors = ['.discount_rate', '.sale_rate', '.discount_percent']

    for (const selector of discountSelectors) {
      const discountElement = element.querySelector(selector)
      if (discountElement) {
        const discountText = discountElement.textContent || ''
        const match = discountText.match(/(\d+)%/)
        if (match && match[1]) {
          return parseInt(match[1])
        }
      }
    }

    return undefined
  }

  /**
   * 상품 이미지 추출
   */
  private extractProductImage(element: HTMLElement): string {
    const imgElement = element.querySelector('img')
    if (imgElement) {
      return imgElement.getAttribute('src') || imgElement.getAttribute('data-src') || ''
    }
    return ''
  }

  /**
   * 쇼핑몰명 추출
   */
  private extractMallName(element: HTMLElement): string {
    const mallSelectors = ['.mall_name', '.store_name', '.shop_name', '.seller_name']

    for (const selector of mallSelectors) {
      const mallElement = element.querySelector(selector)
      if (mallElement) {
        const text = this.extractTextFromElement(mallElement)
        if (text && text.trim()) return text.trim()
      }
    }

    return '네이버쇼핑'
  }

  /**
   * 상품 URL 추출
   */
  private extractProductUrl(element: HTMLElement): string {
    const linkElement = element.querySelector('a')
    if (linkElement) {
      return linkElement.getAttribute('href') || ''
    }
    return ''
  }

  /**
   * 광고 상품 여부 확인
   */
  private isAdProduct(element: HTMLElement): boolean {
    const adIndicators = ['.ad_product', '.sponsored', '.promotion', '[data-ad]']

    return adIndicators.some(indicator => element.querySelector(indicator) !== null)
  }

  /**
   * 리뷰 수 추출
   */
  private extractReviewCount(element: HTMLElement): number | undefined {
    const reviewElement = element.querySelector('.review_count, .review_num')
    if (reviewElement) {
      const text = reviewElement.textContent || ''
      const match = text.match(/(\d+)/)
      if (match && match[1]) {
        return parseInt(match[1])
      }
    }
    return undefined
  }

  /**
   * 평점 추출
   */
  private extractRating(element: HTMLElement): number | undefined {
    const ratingElement = element.querySelector('.rating, .score, .star_rating')
    if (ratingElement) {
      const text = ratingElement.textContent || ''
      const match = text.match(/(\d+\.?\d*)/)
      if (match && match[1]) {
        return parseFloat(match[1])
      }
    }
    return undefined
  }

  /**
   * URL에서 카테고리 추출
   */
  private extractCategoryFromUrl(url: string): string {
    return this.extractCategoryName(url)
  }

  /**
   * 요소에서 텍스트 추출 (중첩 요소 제외)
   */
  private extractTextFromElement(element: HTMLElement): string {
    let text = ''
    element.childNodes.forEach(node => {
      if (node.nodeType === 3) {
        // Text node
        text += node.textContent || ''
      }
    })
    return text.trim()
  }

  /**
   * 텍스트에서 가격 추출
   */
  private extractPriceFromText(text: string): number {
    const match = text.replace(/[^\d,]/g, '').match(/(\d{1,3}(?:,\d{3})*)/)
    if (match && match[1]) {
      return parseInt(match[1].replace(/,/g, ''))
    }
    return 0
  }
}
