import { SMART_STORE_HOST } from './const'
import { Product, Category, User, MarketSetting } from '@repo/database'
import { getTokenSmartStore, requestTokenSmartStore } from './token'
import { getMyOverseasAddressNo } from './getMyAddress'
import { prisma } from '@repo/database'
import { appendTopBottomImagesToDetail } from '../../../../../server/utils/appendTopBottomImagesToDetail'
import { shuffleArray } from '../../../../../server/utils/utils'
interface ProductParam extends Product {
  category: { label: string; id: string }[]
  options: { name: string; price: number }[]
  smartStoreCategory: Category
}

export async function createProductSmartStore({
  productId,
  user,
}: {
  productId: string
  user: User & { marketSetting: MarketSetting }
}) {
  //0. 상품 조회
  const product = (await prisma.product.findUnique({
    where: {
      id: BigInt(productId),
      userId: user.id,
    },
    include: {
      smartStoreCategory: true,
    },
  })) as ProductParam

  if (!product) {
    throw new Error(`상품을 찾을 수 없습니다. ${productId}`)
  }
  if (product.smartStoreProductId || product.isSmartStoreUploaded) {
    return { data: { message: '이미 스마트스토어에 등록된 상품입니다.' }, status: 'success' }
  }
  //1. 토큰
  let token = await getTokenSmartStore(user)
  const categoryId = product.smartStoreCategory?.smartStoreId

  if (!categoryId) {
    throw new Error('스마트스토어 카테고리를 찾을 수 없습니다.')
  }

  const thumbnails = product.thumbnails
  const images = {
    representativeImage: {
      url: thumbnails.length > 0 ? thumbnails[0] : product.image.split('?')[0],
    },
    optionalImages:
      thumbnails.length > 1
        ? thumbnails.slice(1).map(thumbnail => ({
            url: thumbnail,
          }))
        : null,
  }

  let overseasAddressNo = await getMyOverseasAddressNo(token)

  if (!overseasAddressNo) {
    token = await requestTokenSmartStore(user)
    overseasAddressNo = await getMyOverseasAddressNo(token)
    if (!overseasAddressNo) {
      throw new Error('스마트스토어 해외 배송주소를 찾을 수 없습니다.')
    }
  }

  const detailContent = appendTopBottomImagesToDetail(
    product.detail,
    user.marketSetting?.topImages,
    user.marketSetting?.bottomImages,
  )

  const margin = user.marketSetting?.smartStoreMargin || 0
  const myPrice = product.myPrice || product.discountedPrice - 500
  const priceWithMargin = myPrice * ((100 + margin) / 100)
  //마진떄문에 원가가 더 커지는 경우 원가를 조정
  const originalPrice =
    Math.ceil((product.originalPrice > priceWithMargin ? product.originalPrice : priceWithMargin) / 100) * 100

  const discount = Math.round((product.originalPrice - priceWithMargin) / 100) * 100

  const isNewOption = product.optionGroup1?.length > 0
  let options: any[] = []
  let optionNames = [product.optionGroup1, product.optionGroup2, product.optionGroup3].filter(n => n.length > 0)
  if (isNewOption) {
    options = product.options
  } else {
    optionNames = [product.options?.[0]?.name || '']
    options = product.options.slice(1)
  }
  let reOrderedOptions = options
  if (options[0] && options[0].price != 0) {
    const firstOption = options.findIndex(option => option.price === 0)
    if (firstOption != -1) {
      reOrderedOptions = [options[firstOption], ...options.slice(0, firstOption), ...options.slice(firstOption + 1)]
    }
  }

  const shuffledTags = shuffleArray(product.tags)

  // 2. API 요청 데이터 구성
  const requestBody = {
    originProduct: {
      statusType: 'SALE', // 상품 상태
      saleType: 'NEW', // 상품 판매 유형
      leafCategoryId: categoryId,
      name: product.myName || product.name,
      detailContent: detailContent,
      images,
      // saleStartDate: new Date().toISOString(),
      // saleEndDate: '2099-12-31T23:59:59.999+09:00',
      salePrice: originalPrice,
      stockQuantity: 9999,
      deliveryInfo: {
        deliveryType: 'DELIVERY', // 배송방식
        deliveryAttributeType: 'NORMAL', // 배송속성
        deliveryCompany: 'CJGLS',
        deliveryFee: {
          deliveryFeeType: 'FREE', // 배송비 종류
          basefee: 0,
          deliveryFeeByArea: {
            deliveryAreaType: 'AREA_3',
            area2extraFee: 4000,
            area3extraFee: 8000,
          },
        },
        claimDeliveryInfo: {
          returnDeliveryCompanyPriorityType: 'PRIMARY',
          returnDeliveryFee: 20000,
          exchangeDeliveryFee: 40000,
          shippingAddressId: overseasAddressNo,
          returnAddressId: overseasAddressNo,
          freeReturnInsuranceYn: false,
        },
        businessCustomsClearanceSaleYn: false,
      },
      detailAttribute: {
        afterServiceInfo: {
          afterServiceTelephoneNumber: user.marketSetting.smartStoreAsPhoneNumber,
          afterServiceGuideContent: '상품상세 참조',
        },
        originAreaInfo: {
          originAreaCode: '03',
          importer: '상품상세 참조',
        },
        optionInfo:
          reOrderedOptions.length > 0
            ? {
                optionCombinationGroupNames: {
                  optionGroupName1: optionNames[0],
                  optionGroupName2: optionNames[1],
                  optionGroupName3: optionNames[2],
                },
                optionCombinations: reOrderedOptions.map(option => ({
                  stockQuantity: 999,
                  price: option.price || 0,
                  usable: true,
                  optionName1: option.name || option.optionName1,
                  optionName2: option.optionName2,
                  optionName3: option.optionName3,
                })),
                useStockManagement: false,
              }
            : {},
        minorPurchasable: true,
        certificationTargetExcludeContent: {
          childCertifiedProductExclusionYn: true,
          kcExemptionType: 'OVERSEAS',
          kcCertifiedProductExclusionYn: 'KC_EXEMPTION_OBJECT',
          // greenCertifiedProductExclusionYn: 'true',
        },
        productInfoProvidedNotice: {
          productInfoProvidedNoticeType: 'ETC',
          etc: {
            itemName: '상품상세 참조',
            modelName: '상품상세 참조',
            certificateDetails: '상품상세 참조',
            manufacturer: '상품상세 참조',
            afterServiceDirector: '상품 상세 참조',
          },
        },
        seoInfo:
          product.tags.length > 0
            ? {
                sellerTags: shuffledTags.map(tag => ({
                  text: tag,
                })),
              }
            : null,
      },
      customerBenefit:
        discount > 100
          ? {
              immediateDiscountPolicy: {
                discountMethod: {
                  value: discount,
                  unitType: 'WON',
                },
              },
            }
          : null,
    },
    smartstoreChannelProduct: {
      naverShoppingRegistration: true,
      channelProductDisplayStatusType: 'ON',
    },
  }

  // 3. API 호출
  const response = await fetch(`${SMART_STORE_HOST}/v2/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`상품 등록 실패: ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  const { originProductNo, smartstoreChannelProductNo } = data
  await prisma.product.update({
    where: {
      id: BigInt(productId),
      userId: user.id,
    },
    data: {
      smartStoreProductId: smartstoreChannelProductNo?.toString(),
      isSmartStoreUploaded: true,
    },
  })

  return { data: { message: '스마트스토어 상품 등록에 성공했습니다.' }, status: 'success' }
}

// {
//   king-sourcing-ui:dev:   originProductNo: 11393026764,
//   king-sourcing-ui:dev:   smartstoreChannelProductNo: 11446465341
//   king-sourcing-ui:dev: }
