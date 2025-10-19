import { NaverShoppingParser } from './naver-shopping-parser'
import path from 'path'

async function testUpdatedParser() {
  const parser = new NaverShoppingParser()

  try {
    const htmlPath = path.join(process.cwd(), 'debug-html', '식품.html')
    console.log('📄 HTML 파일 파싱 시작:', htmlPath)

    const result = await parser.parseFromFile(htmlPath, '식품')

    console.log('✅ 파싱 완료!')
    console.log('📊 결과 요약:')
    console.log(`- 키워드: ${result.keyword}`)
    console.log(`- 총 상품 수: ${result.totalProducts}`)
    console.log(`- 카테고리: ${result.categories.join(', ')}`)
    console.log(`- 쇼핑몰: ${result.malls.join(', ')}`)
    console.log(`- 파싱 시간: ${result.timestamp}`)

    // 상품 정보 출력
    if (result.products.length > 0) {
      console.log('\n🛍️ 파싱된 상품 정보:')
      result.products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`)
        console.log(`   - 가격: ${product.price.toLocaleString()}원`)
        console.log(`   - 쇼핑몰: ${product.mallName}`)
        console.log(`   - 광고상품: ${product.isAd ? '예' : '아니오'}`)
        console.log(`   - 배송비: ${product.deliveryFee === 0 ? '무료' : product.deliveryFee || '정보없음'}`)
        console.log(`   - 이미지: ${product.image}`)
        console.log(`   - URL: ${product.productUrl}`)
      })
    }

    // 파싱 결과를 JSON 파일로 저장
    const outputPath = path.join(process.cwd(), 'debug-html', 'parsed-result-updated.json')
    await parser.saveParsedData(result, outputPath)
    console.log(`\n💾 파싱 결과 저장: ${outputPath}`)
  } catch (error) {
    console.error('❌ 파싱 실패:', error)
  } finally {
    parser.cleanup()
  }
}

// 스크립트가 직접 실행될 때만 테스트 실행
if (require.main === module) {
  testUpdatedParser()
}

export { testUpdatedParser }
