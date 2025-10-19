import { NextResponse } from 'next/server'

import crypto from 'crypto'
import { COUPANG_HOST } from './const'

export async function checkCategorySetting({ user }) {
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const marketSetting = user.marketSetting

  const { coupangKey, coupangSecret, coupangMarketId, coupangVendorId, coupangOutboundTimeDay } = marketSetting

  const ACCESS_KEY = coupangKey
  const SECRET_KEY = coupangSecret

  const datetime = new Date().toISOString().substr(2, 17).replace(/:/gi, '').replace(/-/gi, '') + 'Z'
  const method = 'GET'
  const path = `/v2/providers/seller_api/apis/api/v1/marketplace/vendors/${coupangVendorId}/check-auto-category-agreed`
  const query = ''

  const message = datetime + method + path + query
  const urlPath = path + '?' + query

  const algorithm = 'sha256'

  const signature = crypto.createHmac(algorithm, SECRET_KEY).update(message).digest('hex')

  const authorization =
    'CEA algorithm=HmacSHA256, access-key=' + ACCESS_KEY + ', signed-date=' + datetime + ', signature=' + signature

  const isCategoryMatchingAgreedReq = await fetch(`${COUPANG_HOST}${urlPath}`, {
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: authorization,
      // 'X-EXTENDED-TIMEOUT': 90000,
    },
  })

  const response = await isCategoryMatchingAgreedReq.json()

  if (response?.code !== 'SUCCESS') {
    return { error: 'API KEY Unauthorized' }
  }

  // 카테고리 매칭 여부
  const isCategoryMatchingAgreed = response?.data

  return isCategoryMatchingAgreed
}
