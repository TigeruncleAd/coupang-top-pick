import { parse, HTMLElement } from 'node-html-parser'
import fs from 'fs'

export interface NaverShoppingProduct {
  productId: string
  name: string
  price: number
  originalPrice?: number
  discountRate?: number
  image: string
  mallName: string
  mallUrl: string
  productUrl: string
  category: string
  isAd: boolean
  reviewCount?: number
  rating?: number
  deliveryFee?: number
  tags?: string[]
  brand?: string
}

export interface ParsedShoppingData {
  keyword: string
  totalProducts: number
  products: NaverShoppingProduct[]
  categories: string[]
  malls: string[]
  timestamp: Date
}

export class NaverShoppingParser {
  /**
   * HTML 파일을 파싱하여 상품 데이터 추출
   */
  async parseHTML(htmlContent: string, keyword: string): Promise<ParsedShoppingData> {
    const document = parse(htmlContent)

    const products: NaverShoppingProduct[] = []
    const categories = new Set<string>()
    const malls = new Set<string>()

    // 상품 리스트 컨테이너 찾기
    const productListContainer = document.querySelector('.basicList_list_basis__XVx_G')
    if (!productListContainer) {
      throw new Error('상품 리스트 컨테이너를 찾을 수 없습니다.')
    }

    // 광고 상품 파싱
    const adProducts = productListContainer.querySelectorAll('.adProduct_item__T7utB')
    adProducts.forEach(product => {
      const parsedProduct = this.parseAdProduct(product, keyword)
      if (parsedProduct) {
        products.push(parsedProduct)
        if (parsedProduct.category) categories.add(parsedProduct.category)
        if (parsedProduct.mallName) malls.add(parsedProduct.mallName)
      }
    })

    // 일반 상품 파싱
    const normalProducts = productListContainer.querySelectorAll('.product_item__KQayS')
    normalProducts.forEach(product => {
      const parsedProduct = this.parseNormalProduct(product, keyword)
      if (parsedProduct) {
        products.push(parsedProduct)
        if (parsedProduct.category) categories.add(parsedProduct.category)
        if (parsedProduct.mallName) malls.add(parsedProduct.mallName)
      }
    })

    return {
      keyword,
      totalProducts: products.length,
      products,
      categories: Array.from(categories),
      malls: Array.from(malls),
      timestamp: new Date(),
    }
  }

  /**
   * 광고 상품 파싱
   */
  private parseAdProduct(element: HTMLElement, keyword: string): NaverShoppingProduct | null {
    try {
      // 상품명
      const nameElement = element.querySelector('.adProduct_title__fsQU6 a')
      const name = nameElement?.getAttribute('title') || nameElement?.textContent?.trim() || ''

      // 가격 - 실제 클래스명 사용
      const priceElement = element.querySelector('.adProduct_price__aI_aG .price_num__Y66T7')
      const priceText = priceElement?.textContent?.replace(/[^0-9]/g, '') || '0'
      const price = parseInt(priceText) || 0

      // 이미지
      const imageElement = element.querySelector('img')
      const image = imageElement?.getAttribute('src') || ''

      // 쇼핑몰명 - 실제 클래스명 사용
      const mallElement = element.querySelector('.adProduct_mall__grJaU')
      const mallName = mallElement?.textContent?.trim() || ''

      // 상품 URL
      const linkElement = element.querySelector('a[href*="ader.naver.com"]')
      const productUrl = linkElement?.getAttribute('href') || ''

      // 배송비
      const deliveryElement = element.querySelector('.price_delivery__0jnYm')
      const deliveryText = deliveryElement?.textContent?.trim() || ''
      const deliveryFee = deliveryText.includes('무료') ? 0 : undefined

      // 상품 ID 추출 (URL에서)
      const productId = this.extractProductId(productUrl)

      return {
        productId,
        name,
        price,
        image,
        mallName,
        mallUrl: '', // 광고 상품은 별도 URL이 없음
        productUrl,
        category: keyword,
        isAd: true,
        deliveryFee,
      }
    } catch (error) {
      console.error('광고 상품 파싱 오류:', error)
      return null
    }
  }

  /**
   * 일반 상품 파싱
   */
  private parseNormalProduct(element: HTMLElement, keyword: string): NaverShoppingProduct | null {
    try {
      // 상품명 - 실제 구조에 맞게 수정
      const nameElement = element.querySelector('a[title]')
      const name = nameElement?.getAttribute('title') || nameElement?.textContent?.trim() || ''

      // 가격 - 실제 구조 찾기
      const priceElement = element.querySelector('[class*="price"]')
      const priceText = priceElement?.textContent?.replace(/[^0-9]/g, '') || '0'
      const price = parseInt(priceText) || 0

      // 이미지
      const imageElement = element.querySelector('img')
      const image = imageElement?.getAttribute('src') || ''

      // 쇼핑몰명 - 실제 구조 찾기
      const mallElement = element.querySelector('[class*="mall"]')
      const mallName = mallElement?.textContent?.trim() || ''

      // 상품 URL
      const linkElement = element.querySelector('a[href*="shopping.naver.com"]')
      const productUrl = linkElement?.getAttribute('href') || ''

      // 쇼핑몰 URL
      const mallLinkElement = element.querySelector('a[href*="mall.naver.com"]')
      const mallUrl = mallLinkElement?.getAttribute('href') || ''

      // 배송비
      const deliveryElement = element.querySelector('[class*="delivery"]')
      const deliveryText = deliveryElement?.textContent?.trim() || ''
      const deliveryFee = deliveryText.includes('무료') ? 0 : undefined

      // 상품 ID 추출 (URL에서)
      const productId = this.extractProductId(productUrl)

      return {
        productId,
        name,
        price,
        image,
        mallName,
        mallUrl,
        productUrl,
        category: keyword,
        isAd: false,
        deliveryFee,
      }
    } catch (error) {
      console.error('일반 상품 파싱 오류:', error)
      return null
    }
  }

  /**
   * URL에서 상품 ID 추출
   */
  private extractProductId(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname

      // 네이버 쇼핑 URL 패턴에서 상품 ID 추출
      const match = pathname.match(/\/products\/(\d+)/)
      if (match && match[1]) {
        return match[1]
      }

      // 다른 패턴들도 시도
      const segments = pathname.split('/').filter(Boolean)
      const lastSegment = segments[segments.length - 1]

      if (lastSegment && /^\d+$/.test(lastSegment)) {
        return lastSegment
      }

      // URL 전체를 해시로 변환하여 ID로 사용
      return Buffer.from(url || '')
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 20)
    } catch (error) {
      // URL 파싱 실패 시 해시 생성
      return Buffer.from(url || '')
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 20)
    }
  }

  /**
   * HTML 파일에서 파싱
   */
  async parseFromFile(filePath: string, keyword: string): Promise<ParsedShoppingData> {
    const htmlContent = fs.readFileSync(filePath, 'utf-8')
    return this.parseHTML(htmlContent, keyword)
  }

  /**
   * 파싱 결과를 JSON 파일로 저장
   */
  async saveParsedData(data: ParsedShoppingData, outputPath: string): Promise<void> {
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')
  }

  /**
   * 메모리 정리
   */
  cleanup(): void {
    // node-html-parser는 자동으로 정리됨
  }
}
