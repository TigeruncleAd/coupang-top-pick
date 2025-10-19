import { Product, Category, User, MarketSetting } from '@repo/database'
import { prisma } from '@repo/database'
import { appendTopBottomImagesToDetail } from '../../../../../server/utils/appendTopBottomImagesToDetail'
import { getProductXmlTemplate } from '../utils/template'
import { getStreet11CategoryFromSmartStore } from './getCategory'
import iconv from 'iconv-lite'

interface ProductParam extends Product {
  category: { label: string; id: string }[]
  options: { name: string; price: number }[]
  smartStoreCategory: Category
}

export async function createProduct11Street({
  productId,
  user,
}: {
  productId: string
  user: User & { marketSetting: MarketSetting }
}) {
  //0. 상품 조회)
  const product = await prisma.product.findUnique({
    where: {
      id: BigInt(productId),
      userId: user.id,
    },
    include: {
      smartStoreCategory: true,
    },
  })

  console.log('user.marketSetting?.street11IsGlobal : ', user.marketSetting?.street11IsGlobal)
  if (!product) {
    throw new Error(`상품을 찾을 수 없습니다. ${productId}`)
  }

  if (product.street11ProductId || product.isStreet11Uploaded) {
    return { data: { message: '이미 11번가에 등록된 상품입니다.' }, status: 'success' }
  }

  if (!product.category) {
    throw new Error('카테고리를 찾을 수 없습니다.')
  }

  //1. 토큰
  // const token = await getTokenSmartStore(user)
  const categoryId = product.smartStoreCategory?.smartStoreId

  if (!categoryId) {
    throw new Error('카테고리를 찾을 수 없습니다.')
  }

  // 썸네일 정의
  let imageXmlTags = ''
  if (!product.thumbnails || product.thumbnails.length === 0) {
    imageXmlTags = `<prdImage01>${product.image.split('?')[0]}</prdImage01>`
  } else {
    imageXmlTags = product.thumbnails
      .map((imgUrl, idx) => {
        // 11번가는 1부터 시작하는 인덱스 사용
        return `<prdImage0${idx + 1}>${imgUrl}</prdImage0${idx + 1}>`
      })
      .join('\n  ')
  }

  // 할인 가격 정의
  const margin = user.marketSetting?.street11Margin || 0
  const myPrice = product.myPrice || product.discountedPrice - 500
  const priceWithMargin = myPrice * ((100 + margin) / 100)
  //마진떄문에 원가가 더 커지는 경우 원가를 조정
  const originalPrice = product.originalPrice > priceWithMargin ? product.originalPrice : priceWithMargin
  //100원단위 올림
  const discount = Math.ceil(priceWithMargin / 100) * 100

  // 상세 내용 정의
  const detailContent = appendTopBottomImagesToDetail(
    product.detail,
    user.marketSetting?.topImages,
    user.marketSetting?.bottomImages,
  )

  // 해외구매대행 여부 정의
  const forAbrdBuyClf = user.marketSetting?.street11IsGlobal ? '1' : '0'
  // const forAbrdBuyClf = '1'
  // smartStoreId로 11번가 카테고리 ID 조회
  const getStreet11Category = async (forAbrdBuyClf: string) => {
    if (forAbrdBuyClf === '0') {
      const category = await getStreet11CategoryFromSmartStore(categoryId)
      return category.street11Id
    } else {
      return 939966 // 해외직구>리빙/생활>생활용품>생활잡화
    }
  }
  const street11Category = await getStreet11Category(forAbrdBuyClf)
  // console.log('street11Category : ', street11Category)
  // console.log('forAbrdBuyClf : ', forAbrdBuyClf)

  // 옵션 XML 태그 생성
  let optionGroups = [product.optionGroup1, product.optionGroup2, product.optionGroup3].filter(n => n.length > 0)
  if (optionGroups.length === 0) {
    optionGroups = [product.options[0].name]
  }
  const realOptions = optionGroups.length > 0 ? (product.options as any[]) : (product.options as any[]).slice(1)

  const optionGroupXmlTags = `<colTitle>${optionGroups.join('-')}</colTitle>
    <prdExposeClfCd>01</prdExposeClfCd>
    `

  const optionsXmlTags =
    optionGroupXmlTags +
    realOptions.reduce((acc, option, idx) => {
      const optionNames = [option.name || option.optionName1 || '', option.optionName2 || '', option.optionName3 || '']
      const optionName = optionNames.filter(n => n.length > 0).join(' - ')
      return (
        acc +
        `
        <ProductOption>
        <useYn>Y</useYn>
        <colOptPrice>${option.price}</colOptPrice>
        <colValue0>${optionName}</colValue0>
        <colCount>999</colCount>
      </ProductOption>`
      )
    }, '')
  // 상품 업로드
  const requestBody = await getProductXmlTemplate({
    product_name: product.myName,
    category_id: street11Category.toString(),
    forAbrdBuyClf: forAbrdBuyClf,
    html_detail: detailContent,
    price: discount.toString(),
    island_dilivery_cost: '5000',
    return_delivery_cost: '20000',
    exchange_delivery_cost: '20000',
    thumbnails: imageXmlTags,
    options: optionsXmlTags,
  })

  // 상품 업로드 완료
  const apiKey = user.marketSetting?.street11Key
  const url = 'http://api.11st.co.kr/rest/prodservices/product'

  // requestBody를 EUC-KR로 인코딩
  const encodedBody = iconv.encode(requestBody, 'euc-kr')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=EUC-KR',
      openapikey: apiKey,
    },
    body: encodedBody as any,
  })

  // 응답도 EUC-KR로 디코딩
  const buffer = await response.arrayBuffer()
  const responseBody = iconv.decode(Buffer.from(buffer), 'euc-kr')

  console.log('responseBody : ', responseBody)

  const getMessage = xml => {
    const messageMatch = xml.match(/<message>(.*?)<\/message>/)
    return messageMatch ? messageMatch[1] : ''
  }

  const getProductNo = xml => {
    const productMatch = xml.match(/<productNo>(.*?)<\/productNo>/)
    return productMatch ? productMatch[1] : ''
  }

  const getResultCode = xml => {
    const codeMatch = xml.match(/<resultCode>(.*?)<\/resultCode>/)
    return codeMatch ? codeMatch[1] : ''
  }

  const resultCode = getResultCode(responseBody)
  const message = getMessage(responseBody)
  console.log('resultCode : ', resultCode)

  // responseBody에 <resultCode>200</resultCode>가 있으면 성공
  if (resultCode === '200') {
    const productNo = getProductNo(responseBody)

    await prisma.product.update({
      where: {
        id: BigInt(productId),
        userId: user.id,
      },
      data: {
        street11ProductId: productNo,
        isStreet11Uploaded: true,
      },
    })

    const response = {
      message,
      productNo,
    }

    return {
      status: 'success',
      message: '상품이 성공적으로 등록되었습니다.',
      data: response,
    }
  } else {
    throw new Error('11번가 ' + message)
  }
}
