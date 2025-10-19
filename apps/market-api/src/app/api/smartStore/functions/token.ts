'use server'
import { MARKET, MarketSetting, User } from '@repo/database'
import { kdayjs } from '@repo/utils'
import { SMART_STORE_HOST } from './const'
import { hashSync } from 'bcryptjs'
import { prisma } from '@repo/database'

const TOKEN_URL = SMART_STORE_HOST + '/v1/oauth2/token'

interface UserWithMarketSetting extends User {
  marketSetting: MarketSetting
}

// export const getTokenSmartStore = getToken(MARKET.SMART_STORE)
export async function getTokenSmartStore(user: UserWithMarketSetting): Promise<string> {
  const marketApiToken = await prisma.marketApiToken.findUnique({
    where: {
      market_userId: {
        market: MARKET.SMART_STORE,
        userId: user.id,
      },
    },
  })

  if (marketApiToken && kdayjs(new Date()).diff(marketApiToken.date, 'hour') < 2) {
    return marketApiToken.token
  } else {
    return await requestTokenSmartStore(user)
  }
}

export async function requestTokenSmartStore(user: UserWithMarketSetting): Promise<string> {
  try {
    const { smartStoreKey: key, smartStoreSecret: secret } = user.marketSetting
    const timeStamp = Date.now()
    const password = `${key}_${timeStamp}`
    const hash = hashSync(password, secret)
    const base64Hash = Buffer.from(hash, 'utf-8').toString('base64')

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // body: `grant_type=client_credentials&client_id=${key}&client_secret_sign=${base64Hash}&timestamp=${timeStamp}&type=SELF&account_id=ncp_1oirdy_01`,
      body: `grant_type=client_credentials&client_id=${key}&client_secret_sign=${base64Hash}&timestamp=${timeStamp}&type=SELF`,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error('토큰 발급에 실패했습니다.')
    }

    const { access_token } = data
    const token = await prisma.marketApiToken.upsert({
      where: {
        market_userId: {
          market: MARKET.SMART_STORE,
          userId: user.id,
        },
      },
      update: {
        date: kdayjs().toDate(),
        token: access_token,
      },
      create: {
        market: MARKET.SMART_STORE,
        token: access_token,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    })
    return token.token
  } catch (error) {
    console.error(error)
    throw new Error('GET_TOKEN_FAILED')
  }
}
