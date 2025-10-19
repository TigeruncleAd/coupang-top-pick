import crypto from 'crypto'
import { COUPANG_HOST } from './const'

export async function getCategoryMeta({ user, displayCategoryCode }) {
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const marketSetting = user.marketSetting

  const { coupangKey, coupangSecret, coupangMarketId, coupangVendorId, coupangOutboundTimeDay } = marketSetting

  const ACCESS_KEY = coupangKey
  const SECRET_KEY = coupangSecret

  const datetime = new Date().toISOString().substr(2, 17).replace(/:/gi, '').replace(/-/gi, '') + 'Z'
  const method = 'GET'
  const path = `/v2/providers/seller_api/apis/api/v1/marketplace/meta/category-related-metas/display-category-codes/${displayCategoryCode}`
  const query = ''

  const message = datetime + method + path + query
  const urlPath = path + '?' + query

  const algorithm = 'sha256'

  const signature = crypto.createHmac(algorithm, SECRET_KEY).update(message).digest('hex')

  const authorization =
    'CEA algorithm=HmacSHA256, access-key=' + ACCESS_KEY + ', signed-date=' + datetime + ', signature=' + signature

  const categoryMetaReq = await fetch(`${COUPANG_HOST}${urlPath}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: authorization,
      // 'X-EXTENDED-TIMEOUT': 90000,
    },
  })

  const response = await categoryMetaReq.json()
  // console.error(response)

  return response?.data
}
