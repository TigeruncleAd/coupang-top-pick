import { Product, Category, User, MarketSetting } from '@repo/database'
import { prisma } from '@repo/database'
import { appendTopBottomImagesToDetail } from '../../../../../server/utils/appendTopBottomImagesToDetail'
import { checkCategorySetting } from './checkCategorySetting'
import { matchCategory } from './matchCategory'
import { getShippingLocations } from './getShippingLocations'
import { getReturnLocations } from './getReturnLocations'
import crypto from 'crypto'
import { COUPANG_HOST } from './const'
import { kdayjs } from '@repo/utils'
import { getCategoryMeta } from './getCategoryMeta'
interface ProductParam extends Product {
  category: { label: string; id: string }[]
  options: { name: string; price: number }[]
  smartStoreCategory: Category
}

export async function createProductCoupang({
  productId,
  user,
}: {
  productId: string
  user: User & { marketSetting: MarketSetting }
}) {
  //0. 상품 조회
  const product = await prisma.product.findUnique({
    where: {
      id: BigInt(productId),
      userId: user.id,
    },
    include: {
      smartStoreCategory: true,
    },
  })

  if (!product) {
    throw new Error(`상품을 찾을 수 없습니다. ${productId}`)
  }

  if (product.coupangProductId || product.isCoupangUploaded) {
    return { data: { message: '이미 쿠팡에 등록된 상품입니다.' }, status: 'success' }
  }

  if (!product.category) {
    throw new Error('스마트스토어 카테고리를 찾을 수 없습니다.')
  }

  //1. 출고지 확인
  const shippingLocations = await getShippingLocations({ user })

  if (shippingLocations?.code === 'ERROR') {
    throw new Error(shippingLocations?.message ?? '')
  }

  if (!shippingLocations || shippingLocations.length === 0) {
    throw new Error('출고지가 없습니다.')
  }

  const shippingLocation = shippingLocations.find(location => location.usable === true)

  if (!shippingLocation) {
    throw new Error('사용 가능한 출고지를 찾을 수 없습니다.')
  }

  const {
    outboundShippingPlaceCode,
    shippingPlaceName: outboundShippingPlaceName,
    placeAddresses: outboundPlaceAddresses,
    remoteInfos,
  } = shippingLocation

  //2. 반품지 확인
  const returnLocations = await getReturnLocations({ user })

  if (!returnLocations || returnLocations.length === 0) {
    throw new Error('반품지가 없습니다.')
  }

  const returnLocation = returnLocations.find(location => location.usable === true)

  if (!returnLocation) {
    throw new Error('사용 가능한 반품지를 찾을 수 없습니다.')
  }

  const {
    returnCenterCode,
    shippingPlaceName: returnShippingPlaceName,
    placeAddresses: returnPlaceAddresses,
  } = returnLocation

  //3. 카테고리 설정 확인
  const isCategoryMatchingAgreed = await checkCategorySetting({ user })

  //4. 카테고리 매칭
  const { matchCategoryId, matchCategoryName } = await matchCategory({ product, user })

  //5. 카테고리 메타 확인
  const {
    isAllowSingleItem,
    attributes: metaAttributes,
    noticeCategories: metaNoticeCategories,
    requiredDocumentNames,
    certifications,
    allowedOfferConditions,
    isExpirationDateRequiredForRocketGrowth,
  } = await getCategoryMeta({ user, displayCategoryCode: matchCategoryId })
  // console.error('카테고리메타', JSON.stringify({ cats: metaNoticeCategories }))

  // const mandatoryAttributes = metaAttributes
  //   .filter(attribute => attribute.required.startsWith('MANDATORY'))
  //   .map((item: any) => {
  //     return {
  //       attributeTypeName: item.attributeTypeName,
  //       attributeValueName: '상품 상세페이지 참조',
  //       exposed: 'NONE',
  //     }
  //   })

  let mandatoryNoticeCategories = metaNoticeCategories.slice(0, 1).reduce((acc, category) => {
    // console.error('category', JSON.stringify(category))
    // const mandatoryNotice = category.noticeCategoryDetailNames.filter(item => item.required.startsWith('MANDATORY'))
    // console.error('mandatoryNotice', JSON.stringify(mandatoryNotice))
    const mandatoryNotice = category.noticeCategoryDetailNames
    const newAcc = mandatoryNotice.map((item: any) => {
      return {
        noticeCategoryName: category.noticeCategoryName,
        noticeCategoryDetailName: item.noticeCategoryDetailName,
        content: '상품 상세페이지 참조',
      }
    })

    return [...acc, ...newAcc]
  }, [])
  if (mandatoryNoticeCategories.length === 0) {
    mandatoryNoticeCategories = ['품명 및 모델명', '제조국', '제조자(수입자)'].map(item => {
      return {
        noticeCategoryName: metaNoticeCategories[0].noticeCategoryName,
        noticeCategoryDetailName: item,
        content: '상품 상세페이지 참조',
      }
    })
  }
  // const mandatoryDocuments = requiredDocumentNames.filter(document => document.required.startsWith('MANDATORY'))
  // const mandatoryCertifications = certifications.filter(certification => certification.required.startsWith('MANDATORY'))

  // console.log({
  //   // outboundShippingPlaceCode,
  //   // outboundShippingPlaceName,
  //   // returnShippingPlaceName,
  //   // outboundPlaceAddresses,
  //   // returnPlaceAddresses,
  //   // remoteInfos,
  //   // returnLocations,
  //   // isCategoryMatchingAgreed,
  //   // matchCategoryId,
  //   // matchCategoryName,
  //   // isAllowSingleItem,
  //   mandatoryAttributes,
  //   mandatoryNoticeCategories,
  //   mandatoryDocuments,
  //   mandatoryCertifications,
  //   allowedOfferConditions,
  //   isExpirationDateRequiredForRocketGrowth,
  // })

  //5. 상품 업로드
  const thumbnails = product.thumbnails
  const discountedPrice = product.discountedPrice - 500

  const detailContent = appendTopBottomImagesToDetail(
    product.detail,
    user.marketSetting?.topImages,
    user.marketSetting?.bottomImages,
  )

  const marketSetting = user.marketSetting

  const {
    coupangKey,
    coupangSecret,
    coupangMarketId,
    coupangVendorId,
    coupangOutboundTimeDay,
    coupangMarketName,
    coupangMargin,
  } = marketSetting

  // 마진 적용
  const margin = coupangMargin || 0
  const myPrice = product.myPrice || product.discountedPrice - 500
  const priceWithMargin = myPrice * ((100 + margin) / 100)
  //마진떄문에 원가가 더 커지는 경우 원가를 조정
  const originalPrice = product.originalPrice > priceWithMargin ? product.originalPrice : priceWithMargin
  const ceiledOriginalPrice = Math.ceil(originalPrice / 100) * 100
  // 100원단위 올림
  const salePrice = Math.ceil(priceWithMargin / 100) * 100

  let optionGroups = [product.optionGroup1, product.optionGroup2, product.optionGroup3].filter(n => n.length > 0)
  let realOptions = optionGroups.length > 0 ? (product.options as any[]) : (product.options as any[]).slice(1)
  if (optionGroups.length === 0) {
    optionGroups = [product.options?.[0]?.name || '옵션']
  }

  if (realOptions.length === 0) {
    realOptions = [
      {
        optionName1: product.name.slice(0, 30),
        optionName2: '',
        optionName3: '',
        price: 0,
      },
    ]
  }

  const optionItems = realOptions.map((option: any, index) => {
    const optionNames = [
      option.name || option.optionName1 || '',
      option.optionName2 || '',
      option.optionName3 || '',
    ].filter(n => n.length > 0)
    return {
      itemName: `${optionNames[0]} ${optionNames[1] || ''} ${optionNames[2] || ''}`.trim(),
      originalPrice: ceiledOriginalPrice + option.price,
      // salePrice: product?.discountedPrice,
      salePrice: salePrice + option.price,
      maximumBuyCount: '100',
      maximumBuyForPerson: '0',
      outboundShippingTimeDay: coupangOutboundTimeDay.toString(),
      maximumBuyForPersonPeriod: '1',
      unitCount: 1,
      adultOnly: 'EVERYONE',
      taxType: 'TAX',
      parallelImported: 'NOT_PARALLEL_IMPORTED',
      overseasPurchased: 'OVERSEAS_PURCHASED',
      pccNeeded: 'true',
      // externalVendorSku: '0001',
      // barcode: '',
      // emptyBarcode: true,
      // emptyBarcodeReason: '상품확인불가_바코드없음사유',
      // modelNo: '1717171',
      // extraProperties: null,

      // 카테고리 API 참조
      // certifications: [
      //   {
      //     certificationType: 'NOT_REQUIRED',
      //     certificationCode: '',
      //   },
      // ],
      searchTags: product.tags,
      images: [
        {
          imageOrder: 0,
          imageType: 'REPRESENTATION',
          vendorPath: thumbnails.length > 0 ? thumbnails[0] : product.image.split('?')[0],
        },
        ...(thumbnails.length > 1
          ? product.thumbnails.slice(1).map((thumbnail, index) => ({
              imageOrder: index + 1,
              imageType: 'DETAIL',
              vendorPath: thumbnail,
            }))
          : []),
      ],
      // attributes: [...mandatoryAttributes],

      // attributes: [
      //   {
      //     attributeTypeName: product.options[0].name,
      //     attributeValueName: `${option.name}`,
      //     // exposed: 'NONE',
      //   },
      // ],
      attributes: optionGroups
        .map((optioGroup, idx) => {
          const attributeTypeName = optionGroups[idx]
          const attributeValueName = optionNames[idx]
          if (!attributeTypeName || !attributeValueName) {
            return null
          }
          return {
            attributeTypeName,
            attributeValueName,
          }
        })
        .filter(s => !!s),
      notices: [...mandatoryNoticeCategories].length > 0 ? [...mandatoryNoticeCategories] : null,
      contents: [
        {
          contentsType: 'TEXT',
          contentDetails: [
            {
              content: detailContent,
              detailType: 'TEXT',
            },
          ],
        },
      ],

      // 카테고리 API 참조
      // offerCondition: 'NEW',
      // offerDescription: '',
    }
  })

  //로깅용 임시
  // console.error(optionItems)

  const minOptionPrice = Math.min(...optionItems.map(item => item.salePrice))
  let returnCharge = 15000
  let deliveryChargeOnReturn = 15000
  if (returnCharge + deliveryChargeOnReturn > minOptionPrice) {
    returnCharge = Math.floor(minOptionPrice / 2 / 1000) * 1000 - 1000
    deliveryChargeOnReturn = Math.floor(minOptionPrice / 2 / 1000) * 1000 - 1000
  }

  const uploadBody = {
    // 카테고리 API 참조
    displayCategoryCode: matchCategoryId,
    sellerProductName: `${product?.myName}`,
    vendorId: user.marketSetting?.coupangVendorId,
    saleStartedAt: kdayjs().format('YYYY-MM-DDT00:00:00'),
    saleEndedAt: '2099-01-01T23:59:59',
    displayProductName: product?.myName,
    brand: `${coupangMarketName}협력사`, // 브랜드
    generalProductName: product?.myName,
    productGroup: matchCategoryName,
    deliveryMethod: 'AGENT_BUY', // 구매대행

    // 물류센터 API 참조 - 배송
    // deliveryCompanyCode: remoteInfos[0].deliveryCode,
    deliveryCompanyCode: 'CJGLS',

    deliveryChargeType: 'FREE',
    deliveryCharge: 0,
    freeShipOverAmount: 0,
    deliveryChargeOnReturn,
    remoteAreaDeliverable: 'Y',
    unionDeliveryType: 'UNION_DELIVERY',

    // 물류센터 API 참조 - 반품
    returnCenterCode,
    returnChargeName: returnShippingPlaceName,
    companyContactNumber: returnPlaceAddresses[0].companyContactNumber,
    returnZipCode: returnPlaceAddresses[0].returnZipCode,
    returnAddress: returnPlaceAddresses[0].returnAddress,
    returnAddressDetail: returnPlaceAddresses[0].returnAddressDetail,

    returnCharge,
    // returnChargeVendor: 'N',

    // 물류센터 API 참조 - 출고
    outboundShippingPlaceCode,
    vendorUserId: user.marketSetting?.coupangMarketId,
    requested: true, // 자동 승인 여부

    items: optionItems,

    // 카테고리 API 참조
    // requiredDocuments: [
    //   {
    //     templateName: '기타인증서류',
    //     vendorDocumentPath:
    //       'http://image11.coupangcdn.com/image/product/content/vendorItem/2018/07/02/41579010/eebc0c30-8f35-4a51-8ffd-808953414dc1.jpg',
    //   },
    // ],

    // extraInfoMessage: '',
    // manufacture: '아모레퍼시픽',
  }

  // console.log({ uploadBody })

  const ACCESS_KEY = coupangKey
  const SECRET_KEY = coupangSecret

  const uploadDatetime = new Date().toISOString().substr(2, 17).replace(/:/gi, '').replace(/-/gi, '') + 'Z'
  const uploadMethod = 'POST'
  const uploadPath = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products'
  const uploadQuery = ''

  const uploadMessage = uploadDatetime + uploadMethod + uploadPath + uploadQuery
  const uploadUrlPath = uploadPath + '?' + uploadQuery

  const algorithm = 'sha256'

  const uploadSignature = crypto.createHmac(algorithm, SECRET_KEY).update(uploadMessage).digest('hex')

  const uploadAuthorization =
    'CEA algorithm=HmacSHA256, access-key=' +
    ACCESS_KEY +
    ', signed-date=' +
    uploadDatetime +
    ', signature=' +
    uploadSignature

  const uploadReq = await fetch(`${COUPANG_HOST}${uploadUrlPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: uploadAuthorization,
      // 'X-EXTENDED-TIMEOUT': 90000,
    },
    body: JSON.stringify(uploadBody),
  })

  // console.log({ uploadReq })

  if (uploadReq.status !== 200) {
    throw new Error(`쿠팡 서버가 응답하지 않습니다.`)
  }

  const uploadResponse = await uploadReq.json()

  // console.log({ uploadResponse })

  const { code, data: coupangId, errorItems } = uploadResponse

  // console.log({ errorItems, 0: errorItems[0].itemAttributes, 1: errorItems[1].itemAttributes })

  if (code !== 'SUCCESS') {
    // throw new Error('쿠팡 상품 업로드 실패')
    // await prisma.log.create({
    //   data: {
    //     content: {
    //       uploadResponse,
    //       uploadBody,
    //       metaNoticeCategories,
    //     },
    //   },
    // })
    throw new Error(`쿠팡 업로드 실패 : ${JSON.stringify(uploadResponse)}`)
  }

  await prisma.product.update({
    where: {
      id: BigInt(productId),
      userId: user.id,
    },
    data: {
      coupangProductId: coupangId?.toString(),
      isCoupangUploaded: true,
    },
  })

  // console.log({ uploadBody, body11: uploadBody.items[0], uploadResponse })

  return { data: coupangId, status: 'success' }
}

// {
//   king-sourcing-ui:dev:   originProductNo: 11393026764,
//   king-sourcing-ui:dev:   smartstoreChannelProductNo: 11446465341
//   king-sourcing-ui:dev: }
