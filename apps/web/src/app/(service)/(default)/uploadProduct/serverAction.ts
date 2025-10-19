'use server'
import { kdayjs, successServerAction, throwServerAction } from '@repo/utils'
import { prisma, Product, User, MarketSetting } from '@repo/database'
import { getServerUser } from '../../../../../lib/utils/server/getServerUser'
import { marketApiAxios } from '../../../../../lib/utils/server/marketApiAxios'
import { generateUserToken } from '../../../../../lib/utils/server/generateUserToken'
import { notFound } from 'next/navigation'
import { getImagePutToS3 } from '../../../../../lib/utils/server/s3'
const CDN_HOST = process.env.NEXT_PUBLIC_CDN_HOST

export async function fetchUploadProduct({ date, productId, userId }): Promise<{
  user: User
  listData: Product[]
  marketSetting: MarketSetting
}> {
  const user = await getServerUser()
  if (user.license !== 'S') return notFound()
  if (user.role !== 'ADMIN' && (!!productId || !!userId)) return notFound()

  const marketSetting = await prisma.marketSetting.findUnique({
    where: {
      userId: user.id,
    },
  })
  if (productId) {
    const product = await prisma.product.findUnique({
      where: {
        id: BigInt(productId),
      },
      include: {
        smartStoreCategory: true,
      },
    })

    if (product) {
      return { user, listData: [product], marketSetting }
    }
  }

  if (userId) {
    const products = await prisma.product.findMany({
      where: {
        userId,
        date: date ?? kdayjs().format('YYYY-MM-DD'),
      },
      include: {
        smartStoreCategory: true,
      },
    })
    return { user, listData: products, marketSetting }
  }

  const products = await prisma.product.findMany({
    where: {
      userId: user.id,
      date: date ?? kdayjs().format('YYYY-MM-DD'),
    },
    orderBy: {
      id: 'asc',
    },
    include: {
      smartStoreCategory: true,
    },
  })

  return { user, listData: products, marketSetting }
}

export async function createProduct({ productId }) {
  try {
    if (!productId) {
      return throwServerAction('상품을 선택해주세요.')
    }
    const user = await getServerUser()
    if (user.remainingUploadProductCount <= 0) {
      return throwServerAction('상품 등록 횟수가 부족합니다.')
    }
    const userToken = await generateUserToken({ userId: user.id })

    // 먼저 상품 상태 업데이트
    const product = await prisma.product.findUnique({
      where: {
        id: BigInt(productId),
      },
      select: {
        marketUploadStatus: true,
        detail: true,
      },
    })
    if (product.marketUploadStatus === 'PENDING') {
      await prisma.product.update({
        where: {
          id: BigInt(productId),
        },
        data: {
          marketUploadStatus: 'CRAWLED',
        },
      })
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          remainingUploadProductCount: { decrement: 1 },
        },
      })
    }

    const responses = await Promise.all([
      marketApiAxios
        .post('/api/smartStore/uploadProduct', {
          userToken,
          productId: productId.toString(),
        })
        .then(res => {
          const { data, status } = res
          return { data, status, market: 'SmartStore' }
        }),
      marketApiAxios
        .post('/api/coupang/uploadProduct', {
          userToken,
          productId: productId.toString(),
        })
        .then(res => {
          const { data, status } = res
          return { data, status, market: 'Coupang' }
        }),
      // marketApiAxios.post('/api/esm/uploadProduct', {
      //   userToken,
      //   product: product,
      // }),
      marketApiAxios
        .post('/api/street11/uploadProduct', {
          userToken,
          productId: productId.toString(),
        })
        .then(res => {
          const { data, status } = res
          return { data, status, market: 'Street11' }
        }),
    ])

    // console.log('responses : ', responses)
    const result = {
      productId: productId,
      SmartStore: responses.find(response => response.market === 'SmartStore'),
      Coupang: responses.find(response => response.market === 'Coupang'),
      Street11: responses.find(response => response.market === 'Street11'),
      // esm: responses.find(response => response.market === 'ESM'),
    }
    return successServerAction('', result)
  } catch (e) {
    console.error(e)
    return throwServerAction('상품 등록에 실패했습니다.')
  }
}

export async function updateEsmResult({ productId, octionId, gmarketId }) {
  try {
    const user = await getServerUser()
    await prisma.product.update({
      where: { id: BigInt(productId), userId: user.id },
      data: {
        octionProductId: octionId || '',
        gmarketProductId: gmarketId || '',
        marketUploadStatus: 'CRAWLED',
        isEsmUploaded: true,
      },
    })
    return successServerAction('결과 업데이트에 성공했습니다.')
  } catch (e) {
    console.error(e)
    return throwServerAction('결과 업데이트에 실패했습니다.')
  }
}

export async function saveProducts({ products }) {
  try {
    const targetProducts = products.filter(product => product.isEdited)
    const user = await getServerUser()
    for (const product of targetProducts) {
      try {
        await prisma.product.update({
          where: {
            id: BigInt(product.id),
            userId: user.id,
          },
          data: {
            myPrice: product.myPrice,
            myMargin: product.myMargin,
            myDeliveryFee: product.myDeliveryFee,
            myName: product.myName || product.name,
            memo: product.memo,
            detail: product.detail,
            smartStoreCategoryId: product.smartStoreCategoryId,
            options: product.options,
            tags: product.tags,
          },
        })
      } catch (e) {
        console.error(e)
        continue
      }
    }
    return successServerAction('변경사항이 저장되었습니다.')
  } catch (e) {
    console.error(e)
    return throwServerAction('저장에 실패했습니다.')
  }
}

export async function deleteProducts({ productIds }) {
  try {
    const user = await getServerUser()
    const deletedProducts = await prisma.product.deleteMany({
      where: {
        id: { in: productIds },
        userId: user.id,
        marketUploadStatus: 'PENDING',
      },
    })
    // const deletedProducts = await prisma.product.updateMany({
    //   where: {
    //     id: { in: productIds },
    //     userId: user.id,
    //   },
    //   data: {
    //     esmProductId: '',
    //     isEsmUploaded: false,
    //     gmarketProductId: '',
    //     octionProductId: '',
    //   },
    // })
    // return successServerAction('상품이 삭제되었습니다.')
    return {
      status: 'success',
      message: `${deletedProducts.count}개의 상품이 삭제되었습니다.`,
    }
  } catch (e) {
    console.error(e)
    return throwServerAction('상품 삭제에 실패했습니다.')
  }
}

export async function getImageBlob(imageUrl) {
  const imageBlob = await fetch(imageUrl).then(res => res.blob())
  const imageBase64 = await imageBlob.arrayBuffer()
  const imageBase64String = Buffer.from(imageBase64).toString('base64')
  return imageBase64String
}

export async function refineDetailImages({ productIds }) {
  if (productIds?.length > 50) {
    return throwServerAction('최대 50개의 상품만 처리할 수 있습니다.')
  }
  const user = await getServerUser()
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      userId: user.id,
    },
    select: {
      id: true,
      detail: true,
      userId: true,
    },
  })
  let successCount = 0
  const hostedImageKeys = []

  for (const product of products) {
    try {
      const { refinedDetail, imageUrls } = await refineDetail(product.detail, user.id)
      hostedImageKeys.push(...(imageUrls?.map(image => image.s3Key) || []))
      await prisma.product.update({
        where: { id: product.id },
        data: {
          detail: refinedDetail,
        },
      })
      successCount++
    } catch (e) {
      console.error(e)
      continue
    }
  }
  if (hostedImageKeys.length > 0) {
    await prisma.hostedImage.create({
      data: {
        keys: hostedImageKeys,
        userId: user.id,
      },
    })
  }

  return successServerAction(
    `${successCount}개의 이미지 변환에 성공했습니다. (${products.length - successCount}개 실패)`,
  )
}

export async function refineDetail(detail: string, userId: bigint) {
  const imageSrcs = detail.match(/<img[^>]*src="([^"]+)"[^>]*>/g)
  const imageUrls = imageSrcs
    ?.map(src => src.match(/src="([^"]+)"/)?.[1])
    ?.filter(src => src.includes('proxy-smartstore.naver.net'))
    ?.map(url => ({
      originalUrl: url,
      s3Key: '',
      newUrl: '',
    }))
  let refinedDetail = detail
  const date = kdayjs().format('MMDD')
  for (const imageUrl of imageUrls) {
    // const s3Key = await getImagePutToS3(imageUrl.originalUrl, ['product', 'detail', userId.toString(), date])
    const s3Key = await getImagePutToS3(imageUrl.originalUrl, userId.toString())
    if (!s3Key) continue
    imageUrl.s3Key = s3Key
    imageUrl.newUrl = `${CDN_HOST}/${s3Key}`
    refinedDetail = refinedDetail.replaceAll(imageUrl.originalUrl, imageUrl.newUrl)
  }

  return {
    refinedDetail,
    imageUrls,
  }
}
