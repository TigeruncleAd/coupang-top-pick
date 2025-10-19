import crypto from 'crypto'
import { COUPANG_HOST } from './const'

export async function getShippingLocations({ user }) {
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const marketSetting = user.marketSetting

  const { coupangKey, coupangSecret, coupangMarketId, coupangVendorId, coupangOutboundTimeDay } = marketSetting

  const ACCESS_KEY = coupangKey
  const SECRET_KEY = coupangSecret

  const datetime = new Date().toISOString().substr(2, 17).replace(/:/gi, '').replace(/-/gi, '') + 'Z'
  const method = 'GET'
  const path = '/v2/providers/marketplace_openapi/apis/api/v1/vendor/shipping-place/outbound'
  const query = 'pageNum=1&pageSize=50'

  const message = datetime + method + path + query
  const urlPath = path + '?' + query

  const algorithm = 'sha256'

  const signature = crypto.createHmac(algorithm, SECRET_KEY).update(message).digest('hex')

  const authorization =
    'CEA algorithm=HmacSHA256, access-key=' + ACCESS_KEY + ', signed-date=' + datetime + ', signature=' + signature

  const shippingLocationReq = await fetch(`${COUPANG_HOST}${urlPath}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: authorization,
      // 'X-EXTENDED-TIMEOUT': 90000,
    },
  })

  const response = await shippingLocationReq.json()

  if (response?.code === 'ERROR') {
    return response
  } else {
    return response?.content
  }
}
