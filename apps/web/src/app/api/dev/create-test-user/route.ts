import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { hash } from 'bcryptjs'
import { parseBigintJson } from '@repo/utils'

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const accountId = 'test'
    const password = 'test'

    const hashedPassword = await hash(password, 10)
    const user = await prisma.user.upsert({
      where: { accountId },
      update: {
        name: '테스트 사용자',
        password: hashedPassword,
        status: 'ACTIVE',
        role: 'USER',
      },
      create: {
        accountId,
        name: '테스트 사용자',
        password: hashedPassword,
        status: 'ACTIVE',
        role: 'USER',
      },
    })

    return NextResponse.json({ status: 'ok', user: user.id.toString() })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
