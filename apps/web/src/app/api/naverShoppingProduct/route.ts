import { getUserIdFromToken } from '../../../../lib/utils/server/getServerUser'
import { prisma } from '@repo/database'
import { kdayjs } from '@repo/utils'
import { NextResponse } from 'next/server'
import { getNumberFromString } from '@/lib/utils/getNumberFromString'

export async function POST(req: Request) {
  try {
    const { data, ksToken } = await req.json()

    if (!data || !ksToken) {
      return NextResponse.json({ error: 'Invalid Request' }, { status: 400 })
    }
    const userId = await getUserIdFromToken(decodeURIComponent(ksToken))
    if (!userId) {
      return NextResponse.json({ error: 'Invalid Request' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        banWords: true,
      },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    const {
      link,
      img,
      del,
      strong,
      productName,
      mallId,
      categories,
      deliveryFee,
      productId,
      date,
      options,
      thumbnails,
      details,
      tags,
      optionGroup1,
      optionGroup2,
      optionGroup3,
    } = data

    if (!link || !img || !strong || !productName || !mallId || !productId) {
      return NextResponse.json({ error: 'Invalid Request' }, { status: 400 })
    }
    const exist = await prisma.product.findFirst({
      where: {
        productId: productId,
        userId: user.id,
      },
    })
    if (exist) {
      return NextResponse.json({ message: 'ok' }, { status: 200 })
    }

    const banWords = user.banWords?.banWords || []
    const isBanWord = banWords.some(word => productName.includes(word))
    if (isBanWord) {
      return NextResponse.json({ message: 'ok' }, { status: 200 })
    }

    const discountPrice = getNumberFromString(strong) || getNumberFromString(del)
    const originalPrice = getNumberFromString(del) || getNumberFromString(strong)
    const deliveryFeeNumber = getNumberFromString(deliveryFee) || 0
    const refinedCategories =
      categories
        ?.filter(category => {
          const test = testStringHasOnlyNumber(category.id)
          return test
        })
        ?.map(category => {
          return {
            label: category.label?.split('\n')[1] || category.label || '',
            id: category.id,
          }
        }) || []

    const lastCategoryId = refinedCategories.length > 0 ? refinedCategories[refinedCategories.length - 1]?.id : null

    await prisma.product.create({
      data: {
        userId: user.id,
        url: link,
        image: img,
        name: productName,
        mallId,
        discountedPrice: discountPrice,
        originalPrice,
        deliveryFee: deliveryFeeNumber,
        category: refinedCategories,
        date: kdayjs().format('YYYY-MM-DD'),
        productId: productId,
        myName: productName,
        detail: details || '',
        thumbnails: thumbnails || [],
        options: options || [],
        smartStoreCategoryId: lastCategoryId,
        optionGroup1,
        optionGroup2,
        optionGroup3,
        tags,
      },
    })

    return NextResponse.json({ message: 'ok' }, { status: 200 })
  } catch (e) {
    // console.error(e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function testStringHasOnlyNumber(str) {
  return /^\d+$/.test(str)
}
