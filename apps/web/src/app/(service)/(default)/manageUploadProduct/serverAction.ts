'use server'
import { successServerAction, throwServerAction } from '@repo/utils'
import { prisma, Product, User } from '@repo/database'
import { getServerUser } from '../../../../../lib/utils/server/getServerUser'
import { marketApiAxios } from '../../../../../lib/utils/server/marketApiAxios'
import { generateUserToken } from '../../../../../lib/utils/server/generateUserToken'
import { notFound } from 'next/navigation'

const size = 50

export async function fetchUploadProduct({ date, page = '1', name }): Promise<{
  user: User
  listData: Product[]
  totalCount: number
}> {
  const user = await getServerUser()
  if (user.license !== 'S') return notFound()
  const products = await prisma.product.findMany({
    where: {
      userId: user.id,
      marketUploadStatus: 'CRAWLED',
      date: date || undefined,
      myName: name
        ? {
            contains: name,
          }
        : undefined,
    },
    orderBy: {
      id: 'desc',
    },
    skip: (parseInt(page) - 1) * size,
    take: size,
  })
  const totalCount = await prisma.product.count({
    where: {
      userId: user.id,
      marketUploadStatus: 'CRAWLED',
      date: date || undefined,
      myName: name
        ? {
            contains: name,
          }
        : undefined,
    },
  })

  return { user, listData: products, totalCount }
}

export async function deleteUploadedProduct({ productId, market }) {
  try {
    if (!productId) {
      return throwServerAction('상품을 선택해주세요.')
    }
    const user = await getServerUser()
    const userToken = await generateUserToken({ userId: user.id })

    const smartStore = marketApiAxios
      .post('/api/smartStore/deleteProduct', {
        userToken,
        productId: productId.toString(),
      })
      .then(res => {
        const { data, status } = res
        return { data, status, market: 'SmartStore' }
      })

    const coupang = marketApiAxios
      .post('/api/coupang/deleteProduct', {
        userToken,
        productId: productId.toString(),
      })
      .then(res => {
        const { data, status } = res
        return { data, status, market: 'Coupang' }
      })

    const street11 = marketApiAxios
      .post('/api/street11/deleteProduct', {
        userToken,
        productId: productId.toString(),
      })
      .then(res => {
        const { data, status } = res
        return { data, status, market: 'Street11' }
      })

    const esm = marketApiAxios
      .post('/api/esm/deleteProduct', {
        userToken,
        productId: productId.toString(),
      })
      .then(res => {
        const { data, status } = res
        return { data, status, market: 'ESM' }
      })

    const promises = []

    switch (market) {
      case 'SmartStore':
        promises.push(smartStore)
        break
      case 'Coupang':
        promises.push(coupang)
        break
      case 'Street11':
        promises.push(street11)
        break
      case 'ESM':
        promises.push(esm)
        break
      case 'all':
        promises.push(smartStore, coupang, street11, esm)
        break
      default:
        return throwServerAction('지원하지 않는 마켓입니다.')
    }

    const responses = await Promise.all(promises)

    console.log('responses : ', responses)
    const result = {
      productId: productId,
      SmartStore: responses.find(response => response.market === 'SmartStore'),
      Coupang: responses.find(response => response.market === 'Coupang'),
      // esm: responses.find(response => response.market === 'ESM'),
      street11: responses.find(response => response.market === 'Street11'),
    }
    return successServerAction('완료되었습니다.', result)
  } catch (e) {
    console.error(e)
    return throwServerAction('상품 삭제에 실패했습니다.')
  }
}
