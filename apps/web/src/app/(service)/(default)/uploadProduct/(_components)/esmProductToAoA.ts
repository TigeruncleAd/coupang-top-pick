import { Product, Category } from '@repo/database'

interface productType extends Product {
  smartStoreCategory: Category
}

export function esmProductToAoA(products: productType[]) {
  const aoa: any[] = []
  products.forEach(product => {
    const myPrice = product.myPrice || product.discountedPrice - 500
    const discount = product.originalPrice - myPrice

    const result = [
      product.myName, //상품명
      null, //A프로모션문구
      null, //G프로모션문구
      null, //G영문
      null, //G중문
      null, //카테고리템플릿코드
      product.smartStoreCategory.esmId, //카테고리코드
      null, //A노출코드
      null, //G노출코드
      '무제한', //판매기간,
      product.myPrice || product.originalPrice, //A판매가
      product.myPrice || product.originalPrice, //G판매가
      '정액(원)', //A할인유형
      discount, //A할인가
      '정액(원)', //G할인유형
      discount, //G할인가
      999, //A재고
      999, //G재고
      '단독형', //옵션타입
      product.options[0]?.name?.replace(',', ''), //옵션명
      (product.options as any)
        .slice(1)
        .map(option => `${option.name},정상,노출,999,999`)
        .join('\n'), //옵션값
    ]
    aoa.push(result)
  })
}
