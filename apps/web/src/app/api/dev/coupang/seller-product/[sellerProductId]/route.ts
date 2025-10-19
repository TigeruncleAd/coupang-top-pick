import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const COUPANG_API_HOST = 'https://api-gateway.coupang.com'

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}
function getSignedDate(): string {
  // Coupang 요구 포맷: YYMMDDTHHmmssZ (UTC)
  const d = new Date()
  const yy = pad2(d.getUTCFullYear() % 100)
  const MM = pad2(d.getUTCMonth() + 1)
  const DD = pad2(d.getUTCDate())
  const hh = pad2(d.getUTCHours())
  const mm = pad2(d.getUTCMinutes())
  const ss = pad2(d.getUTCSeconds())
  return `${yy}${MM}${DD}T${hh}${mm}${ss}Z`
}

function makeAuthorization({
  method,
  pathWithQuery,
  accessKey,
  secretKey,
  signedDate,
}: {
  method: string
  pathWithQuery: string
  accessKey: string
  secretKey: string
  signedDate: string
}) {
  // message = signedDate + method + path + query (query는 '?' 제외, 없으면 빈 문자열)
  const [path, query = ''] = pathWithQuery.split('?')
  const message = `${signedDate}${method}${path}${query}`
  const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex')
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`
}

export async function GET(request: NextRequest, context: { params: { sellerProductId: string } }) {
  try {
    const accessKey = process.env.COUPANG_WING_ACCESS_KEY
    const secretKey = process.env.COUPANG_WING_SECRET_KEY

    if (!accessKey || !secretKey) {
      return NextResponse.json({ error: 'COUPANG_WING_ACCESS_KEY / COUPANG_WING_SECRET_KEY 누락' }, { status: 500 })
    }

    const { sellerProductId } = context.params || {}
    if (!sellerProductId) {
      return NextResponse.json({ error: 'sellerProductId 누락' }, { status: 400 })
    }

    const method = 'GET'
    const path = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${encodeURIComponent(sellerProductId)}`
    const signedDate = getSignedDate()
    const authorization = makeAuthorization({ method, pathWithQuery: path, accessKey, secretKey, signedDate })

    const res = await fetch(`${COUPANG_API_HOST}${path}`, {
      method,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json;charset=UTF-8',
        Accept: 'application/json',
      },
      // next: { revalidate: 0 }, // 항상 최신 호출 원하면 주석 해제
    })

    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    const text = await res.text()
    return new NextResponse(text, { status: res.status })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'coupang request failed' }, { status: 500 })
  }
}
