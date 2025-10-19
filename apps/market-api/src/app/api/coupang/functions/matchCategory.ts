import { NextResponse } from 'next/server'

import crypto from 'crypto'
import { COUPANG_HOST } from './const'

export async function matchCategory({ product, user }) {
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const marketSetting = user.marketSetting

  const { coupangKey, coupangSecret, coupangMarketId, coupangVendorId, coupangOutboundTimeDay } = marketSetting

  const ACCESS_KEY = coupangKey
  const SECRET_KEY = coupangSecret

  const datetime = new Date().toISOString().substr(2, 17).replace(/:/gi, '').replace(/-/gi, '') + 'Z'
  const method = 'POST'
  const path = '/v2/providers/openapi/apis/api/v1/categorization/predict'
  const query = ''

  const message = datetime + method + path + query
  const urlPath = path + '?' + query

  const algorithm = 'sha256'

  const signature = crypto.createHmac(algorithm, SECRET_KEY).update(message).digest('hex')

  const authorization =
    'CEA algorithm=HmacSHA256, access-key=' + ACCESS_KEY + ', signed-date=' + datetime + ', signature=' + signature

  const body = {
    productName: product?.name,
    productDescription: (product?.category as any[])?.map?.(c => c.label).join(', '),
    // productDescription:
    //   '모니터 해상도, 밝기, 컴퓨터 사양 등에 따라 실물과 약간의 색상차이가 있을 수 있습니다. 캐주얼하지만 큐티한디자인이 돋보이는 싱글코트에요 약간박시한핏이라 여유있고 편하게  스타일링하기 좋은 캐주얼 싱글코트입니다. 컬러:베이지,네이비 사이즈:FREE 실측(측정자,측정기준,제작과정에따라 다소차이가있을수있습니다) 단면기준 CM 단위  가슴단면:61 어깨:54 팔기장:55(어깨절개선기준) 총장:88',
    // brand: '코데즈컴바인',
    // attributes: {
    //   '제품 소재': '모달:53.8 폴리:43.2 레이온:2.4 면:0.6',
    //   색상: '베이지,네이비',
    //   제조국: '한국',
    // },
    // sellerSkuCode: '123123',
  }

  const matchCategoryReq = await fetch(`${COUPANG_HOST}${urlPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: authorization,
      // 'X-EXTENDED-TIMEOUT': 90000,
    },
    body: JSON.stringify(body),
  })

  const response = await matchCategoryReq.json()

  if (response?.code !== 200) {
    return { error: 'Match Request Failed' }
  }

  if (response?.data?.autoCategorizationPredictionResultType !== 'SUCCESS') {
    return { error: 'Prediction Failed' }
  }

  const matchCategoryId = response?.data?.predictedCategoryId
  const matchCategoryName = response?.data?.predictedCategoryName

  return {
    matchCategoryId,
    matchCategoryName,
  }
}
