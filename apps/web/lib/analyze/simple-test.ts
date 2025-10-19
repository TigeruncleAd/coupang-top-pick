import { parse } from 'node-html-parser'
import fs from 'fs'

// 간단한 HTML 파싱 테스트
function testSimpleParsing() {
  try {
    const htmlPath = '/Users/kimseonghyun/Desktop/projects/titan-tools-ui/apps/web/debug-html/식품.html'
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

    console.log('📄 HTML 파일 읽기 완료')
    console.log(`📊 파일 크기: ${(htmlContent.length / 1024 / 1024).toFixed(2)}MB`)

    // HTML 파싱
    const document = parse(htmlContent)
    console.log('✅ HTML 파싱 완료')

    // 상품 리스트 컨테이너 찾기
    const productListContainer = document.querySelector('.basicList_list_basis__XVx_G')
    if (!productListContainer) {
      console.log('❌ 상품 리스트 컨테이너를 찾을 수 없습니다.')
      return
    }

    console.log('✅ 상품 리스트 컨테이너 발견')

    // 광고 상품 찾기
    const adProducts = productListContainer.querySelectorAll('.adProduct_item__T7utB')
    console.log(`📊 광고 상품 수: ${adProducts.length}`)

    // 첫 번째 광고 상품 분석
    if (adProducts.length > 0) {
      const firstAdProduct = adProducts[0]
      if (!firstAdProduct) return

      console.log('\n🔍 첫 번째 광고 상품 분석:')

      // 상품명
      const nameElement = firstAdProduct.querySelector('.adProduct_title__fsQU6 a')
      const name = nameElement?.getAttribute('title') || nameElement?.textContent?.trim() || ''
      console.log(`- 상품명: ${name}`)

      // 이미지
      const imageElement = firstAdProduct.querySelector('img')
      const image = imageElement?.getAttribute('src') || ''
      console.log(`- 이미지: ${image}`)

      // 링크
      const linkElement = firstAdProduct.querySelector('a[href*="ader.naver.com"]')
      const productUrl = linkElement?.getAttribute('href') || ''
      console.log(`- 상품 URL: ${productUrl}`)

      // 가격 정보 찾기
      const priceElements = firstAdProduct.querySelectorAll('[class*="price"]')
      console.log(`- 가격 요소 수: ${priceElements.length}`)
      priceElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.textContent?.trim()}`)
      })

      // 쇼핑몰 정보 찾기
      const mallElements = firstAdProduct.querySelectorAll('[class*="mall"]')
      console.log(`- 쇼핑몰 요소 수: ${mallElements.length}`)
      mallElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.textContent?.trim()}`)
      })
    }

    // 일반 상품 찾기
    const normalProducts = productListContainer.querySelectorAll('.basicList_item__2XT81')
    console.log(`\n📊 일반 상품 수: ${normalProducts.length}`)

    // 모든 클래스명 분석
    const allClasses = new Set<string>()
    productListContainer.querySelectorAll('*').forEach(el => {
      if (el.classNames) {
        el.classNames.split(' ').forEach(cls => {
          if (cls.includes('product') || cls.includes('price') || cls.includes('mall') || cls.includes('title')) {
            allClasses.add(cls)
          }
        })
      }
    })

    console.log('\n🏷️ 관련 클래스명들:')
    Array.from(allClasses)
      .slice(0, 20)
      .forEach(cls => {
        console.log(`- ${cls}`)
      })
  } catch (error) {
    console.error('❌ 테스트 실패:', error)
  }
}

testSimpleParsing()
