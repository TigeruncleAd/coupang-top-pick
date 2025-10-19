import { parse } from 'node-html-parser'
import { HTMLElement } from 'node-html-parser'

// 스마트스토어 베스트 상품 데이터 타입
export interface SmartStoreBestProduct {
  productId: string
  name: string
  price: number
  image: string
  mallName: string
  mallUrl: string
  productUrl: string
  category: string
  isAd: boolean
  deliveryFee: number
  reviewCount?: number
  rating?: number
}

// 스마트스토어 베스트 카테고리 데이터 타입
export interface SmartStoreBestCategory {
  categoryId: string
  categoryName: string
  productCount: number
  products: SmartStoreBestProduct[]
}

// 파싱된 스마트스토어 베스트 데이터 타입
export interface ParsedSmartStoreBestData {
  url: string
  title: string
  timestamp: number
  categoryName: string
  categories: SmartStoreBestCategory[]
  totalProducts: number
  totalCategories: number
}

export class SmartStoreBestParser {
  /**
   * 스마트스토어 베스트 페이지 HTML 파싱
   */
  async parseHTML(htmlContent: string, url: string): Promise<ParsedSmartStoreBestData> {
    const root = parse(htmlContent)
    const timestamp = Date.now()

    // 페이지 제목 추출
    const title = this.extractTitle(root)

    // 카테고리명 추출 (URL에서)
    const categoryName = this.extractCategoryName(url)

    // 카테고리별 상품 데이터 추출
    const categories = await this.extractCategories(root, url)

    const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0)

    return {
      url,
      title,
      timestamp,
      categoryName,
      categories,
      totalProducts,
      totalCategories: categories.length,
    }
  }

  /**
   * 페이지 제목 추출
   */
  private extractTitle(root: HTMLElement): string {
    const titleElement = root.querySelector('title')
    return titleElement?.textContent?.trim() || '스마트스토어 베스트'
  }

  /**
   * URL에서 카테고리명 추출
   */
  private extractCategoryName(url: string): string {
    if (url.includes('categoryId=50000000')) return 'smartstore_fashion'
    if (url.includes('categoryId=50000001')) return 'smartstore_beauty'
    if (url.includes('categoryId=50000002')) return 'smartstore_digital'
    if (url.includes('categoryId=50000003')) return 'smartstore_home'
    return 'smartstore_best'
  }

  /**
   * 카테고리별 상품 데이터 추출
   */
  private async extractCategories(root: HTMLElement, url: string): Promise<SmartStoreBestCategory[]> {
    const categories: SmartStoreBestCategory[] = []

    // 스마트스토어 베스트 페이지의 상품 리스트 선택자들
    const productSelectors = [
      // 메인 상품 리스트
      '.product_list .product_item',
      '.best_product_list .product_item',
      '.category_best .product_item',
      // 카테고리별 상품 리스트
      '.category_list .product_item',
      '.tab_content .product_item',
      // 그리드 레이아웃 상품
      '.product_grid .product_item',
      '.best_grid .product_item',
    ]

    let products: SmartStoreBestProduct[] = []

    // 각 선택자로 상품 추출 시도
    for (const selector of productSelectors) {
      const productElements = root.querySelectorAll(selector)
      if (productElements.length > 0) {
        products = this.parseProducts(productElements, url)
        break
      }
    }

    // 상품이 없으면 대체 방법으로 추출
    if (products.length === 0) {
      products = await this.extractProductsAlternative(root, url)
    }

    // 카테고리별로 그룹화
    const categoryMap = new Map<string, SmartStoreBestProduct[]>()

    products.forEach(product => {
      const categoryKey = product.category || '기타'
      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, [])
      }
      categoryMap.get(categoryKey)!.push(product)
    })

    // 카테고리 데이터 생성
    categoryMap.forEach((categoryProducts, categoryName) => {
      categories.push({
        categoryId: this.generateCategoryId(categoryName),
        categoryName,
        productCount: categoryProducts.length,
        products: categoryProducts,
      })
    })

    return categories
  }

  /**
   * 상품 요소들 파싱
   */
  private parseProducts(productElements: HTMLElement[], url: string): SmartStoreBestProduct[] {
    return productElements
      .map((element, index) => {
        const productId = this.extractProductId(element, index)
        const name = this.extractProductName(element)
        const price = this.extractProductPrice(element)
        const image = this.extractProductImage(element)
        const mallName = this.extractMallName(element)
        const mallUrl = this.extractMallUrl(element)
        const productUrl = this.extractProductUrl(element)
        const category = this.extractProductCategory(element, url)
        const isAd = this.isAdProduct(element)
        const deliveryFee = this.extractDeliveryFee(element)
        const reviewCount = this.extractReviewCount(element)
        const rating = this.extractRating(element)

        return {
          productId,
          name,
          price,
          image,
          mallName,
          mallUrl,
          productUrl,
          category,
          isAd,
          deliveryFee,
          reviewCount,
          rating,
        }
      })
      .filter(product => product.name && product.name.trim() !== '')
  }

  /**
   * 대체 방법으로 상품 추출
   */
  private async extractProductsAlternative(root: HTMLElement, url: string): Promise<SmartStoreBestProduct[]> {
    const products: SmartStoreBestProduct[] = []

    // 링크에서 상품 정보 추출
    const links = root.querySelectorAll('a[href*="shopping.naver.com"], a[href*="smartstore.naver.com"]')

    links.forEach((link, index) => {
      const href = link.getAttribute('href')
      if (!href) return

      const name = this.extractTextFromElement(link)
      if (!name || name.length < 2) return

      const productId = this.generateProductId(href, index)
      const price = this.extractPriceFromText(link.textContent || '')
      const image = this.extractImageFromLink(link)
      const category = this.extractCategoryFromUrl(url)

      products.push({
        productId,
        name: name.trim(),
        price,
        image,
        mallName: '스마트스토어',
        mallUrl: '',
        productUrl: href,
        category,
        isAd: false,
        deliveryFee: 0,
      })
    })

    return products
  }

  /**
   * 상품 ID 추출
   */
  private extractProductId(element: HTMLElement, index: number): string {
    // data-product-id 속성
    const dataId = element.getAttribute('data-product-id')
    if (dataId) return dataId

    // data-id 속성
    const id = element.getAttribute('data-id')
    if (id) return id

    // 링크에서 ID 추출
    const link = element.querySelector('a')
    if (link) {
      const href = link.getAttribute('href')
      if (href) {
        const match = href.match(/product\/(\d+)/) || href.match(/id=(\d+)/)
        if (match && match[1]) return match[1]
      }
    }

    // 기본 ID 생성
    return `smartstore_product_${index}_${Date.now()}`
  }

  /**
   * 상품명 추출
   */
  private extractProductName(element: HTMLElement): string {
    // 상품명 선택자들
    const nameSelectors = [
      '.product_name',
      '.product_title',
      '.item_name',
      '.goods_name',
      '.product_info .name',
      '.product_info .title',
      'h3',
      'h4',
      '.title',
      '.name',
    ]

    for (const selector of nameSelectors) {
      const nameElement = element.querySelector(selector)
      if (nameElement) {
        const text = this.extractTextFromElement(nameElement)
        if (text && text.trim()) return text.trim()
      }
    }

    // 링크 텍스트에서 추출
    const link = element.querySelector('a')
    if (link) {
      const text = this.extractTextFromElement(link)
      if (text && text.trim()) return text.trim()
    }

    return ''
  }

  /**
   * 상품 가격 추출
   */
  private extractProductPrice(element: HTMLElement): number {
    // 가격 선택자들
    const priceSelectors = [
      '.price',
      '.product_price',
      '.item_price',
      '.goods_price',
      '.price_info .price',
      '.price_info .amount',
      '.cost',
      '.amount',
    ]

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
   * 상품 이미지 추출
   */
  private extractProductImage(element: HTMLElement): string {
    // 이미지 선택자들
    const imageSelectors = [
      '.product_image img',
      '.product_thumb img',
      '.item_image img',
      '.goods_image img',
      '.thumbnail img',
      'img',
    ]

    for (const selector of imageSelectors) {
      const imgElement = element.querySelector(selector)
      if (imgElement) {
        const src = imgElement.getAttribute('src') || imgElement.getAttribute('data-src')
        if (src && src.startsWith('http')) return src
      }
    }

    return ''
  }

  /**
   * 쇼핑몰명 추출
   */
  private extractMallName(element: HTMLElement): string {
    // 쇼핑몰명 선택자들
    const mallSelectors = [
      '.mall_name',
      '.store_name',
      '.shop_name',
      '.seller_name',
      '.brand_name',
      '.mall_info .name',
      '.store_info .name',
    ]

    for (const selector of mallSelectors) {
      const mallElement = element.querySelector(selector)
      if (mallElement) {
        const text = this.extractTextFromElement(mallElement)
        if (text && text.trim()) return text.trim()
      }
    }

    return '스마트스토어'
  }

  /**
   * 쇼핑몰 URL 추출
   */
  private extractMallUrl(element: HTMLElement): string {
    const mallLink = element.querySelector('a[href*="smartstore.naver.com"]')
    if (mallLink) {
      return mallLink.getAttribute('href') || ''
    }
    return ''
  }

  /**
   * 상품 URL 추출
   */
  private extractProductUrl(element: HTMLElement): string {
    const link = element.querySelector('a')
    if (link) {
      return link.getAttribute('href') || ''
    }
    return ''
  }

  /**
   * 상품 카테고리 추출
   */
  private extractProductCategory(element: HTMLElement, url: string): string {
    // 카테고리 선택자들
    const categorySelectors = [
      '.category',
      '.product_category',
      '.item_category',
      '.goods_category',
      '.breadcrumb .category',
    ]

    for (const selector of categorySelectors) {
      const categoryElement = element.querySelector(selector)
      if (categoryElement) {
        const text = this.extractTextFromElement(categoryElement)
        if (text && text.trim()) return text.trim()
      }
    }

    // URL에서 카테고리 추출
    return this.extractCategoryFromUrl(url)
  }

  /**
   * 광고 상품 여부 확인
   */
  private isAdProduct(element: HTMLElement): boolean {
    // 광고 관련 클래스나 속성 확인
    const adIndicators = ['.ad_product', '.ad_item', '.sponsored', '.promotion', '[data-ad]', '[data-sponsored]']

    return adIndicators.some(indicator => element.querySelector(indicator) !== null)
  }

  /**
   * 배송비 추출
   */
  private extractDeliveryFee(element: HTMLElement): number {
    const deliveryElement = element.querySelector('.delivery_fee, .shipping_fee, .delivery_cost')
    if (deliveryElement) {
      const text = deliveryElement.textContent || ''
      if (text.includes('무료') || text.includes('무료배송')) return 0
      return this.extractPriceFromText(text)
    }
    return 0
  }

  /**
   * 리뷰 수 추출
   */
  private extractReviewCount(element: HTMLElement): number {
    const reviewElement = element.querySelector('.review_count, .review_num, .rating_count')
    if (reviewElement) {
      const text = reviewElement.textContent || ''
      const match = text.match(/(\d+)/)
      if (match && match[1]) return parseInt(match[1])
    }
    return 0
  }

  /**
   * 평점 추출
   */
  private extractRating(element: HTMLElement): number {
    const ratingElement = element.querySelector('.rating, .score, .star_rating')
    if (ratingElement) {
      const text = ratingElement.textContent || ''
      const match = text.match(/(\d+\.?\d*)/)
      if (match && match[1]) return parseFloat(match[1])
    }
    return 0
  }

  /**
   * 요소에서 텍스트 추출 (중첩 요소 제외)
   */
  private extractTextFromElement(element: HTMLElement): string {
    // 직접적인 텍스트 노드만 추출
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
    // 숫자와 콤마만 추출
    const match = text.replace(/[^\d,]/g, '').match(/(\d{1,3}(?:,\d{3})*)/)
    if (match && match[1]) {
      return parseInt(match[1].replace(/,/g, ''))
    }
    return 0
  }

  /**
   * 링크에서 이미지 추출
   */
  private extractImageFromLink(link: HTMLElement): string {
    const img = link.querySelector('img')
    if (img) {
      return img.getAttribute('src') || img.getAttribute('data-src') || ''
    }
    return ''
  }

  /**
   * URL에서 카테고리 추출
   */
  private extractCategoryFromUrl(url: string): string {
    if (url.includes('categoryId=50000000')) return '패션'
    if (url.includes('categoryId=50000001')) return '뷰티'
    if (url.includes('categoryId=50000002')) return '디지털'
    if (url.includes('categoryId=50000003')) return '홈인테리어'
    return '기타'
  }

  /**
   * 카테고리 ID 생성
   */
  private generateCategoryId(categoryName: string): string {
    const categoryMap: Record<string, string> = {
      패션: '50000000',
      뷰티: '50000001',
      디지털: '50000002',
      홈인테리어: '50000003',
      기타: '50000004',
    }
    return categoryMap[categoryName] || '50000004'
  }

  /**
   * 상품 ID 생성
   */
  private generateProductId(href: string, index: number): string {
    const match = href.match(/product\/(\d+)/) || href.match(/id=(\d+)/)
    if (match && match[1]) return match[1]
    return `smartstore_${index}_${Date.now()}`
  }
}
