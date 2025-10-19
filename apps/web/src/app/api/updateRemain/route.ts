import { prisma } from '@repo/database'
import { kdayjs } from '@repo/utils'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const secret = req.headers.get('authorization') || ''
    if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const misc = await prisma.misc.upsert({
      where: {
        key: 'USER_REMAINING_PRODUCT_COUNT',
      },
      update: {},
      create: {
        key: 'USER_REMAINING_PRODUCT_COUNT',
        value: {
          date: kdayjs().toDate(),
        },
      },
    })

    const lastUpdate = kdayjs((misc.value as any).date)
    console.log(kdayjs().diff(lastUpdate, 'hour'))
    //every 00:00
    if (kdayjs().diff(lastUpdate, 'hour') >= 23) {
      // await prisma.user.updateMany({
      //   data: {
      //     remainingProductCount: {
      //       increment: prisma.user.fields.maxProductCount,
      //     },
      //   },
      // })
      // await prisma.$executeRaw`UPDATE "User" SET "remainingProductCount" = "maxProductCount", "remainingUploadProductCount" = "maxUploadProductCount"`
      await prisma.$executeRaw`UPDATE "User" SET "remainingProductCount" = "maxProductCount"`
      await prisma.user.updateMany({
        where: {
          expiredAt: {
            lte: kdayjs().toDate(),
          },
        },
        data: {
          status: 'INACTIVE',
        },
      })
      await prisma.misc.update({
        where: {
          key: 'USER_REMAINING_PRODUCT_COUNT',
        },
        data: {
          value: {
            date: kdayjs().toDate(),
          },
        },
      })
      return NextResponse.json({ message: 'updated' })
    } else {
      return NextResponse.json({ message: 'Already updated' }, { status: 400 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ message: 'Error' }, { status: 500 })
  }
}
