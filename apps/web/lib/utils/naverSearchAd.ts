'use server'

import crypto from 'crypto'

const APIKEY = process.env.NAVER_SEARCHAD_API_LICENSE!
const SECRET = process.env.NAVER_SEARCHAD_API_SECRET!
const CUSTOMER_ID = process.env.NAVER_SEARCHAD_API_ID!
const API_URL = 'https://api.searchad.naver.com'

function signNaverSearchAd({ method, uri }: { method: string; uri: string }) {
  const timestamp = new Date().getTime().toString()
  const preHash = timestamp + '.' + method.toUpperCase() + '.' + uri
  const signature = crypto.createHmac('sha256', SECRET).update(preHash).digest('base64')
  return {
    'X-Timestamp': timestamp,
    'X-API-KEY': APIKEY,
    'X-Signature': signature,
    'X-Customer': CUSTOMER_ID,
    'Content-Type': 'application/json',
  }
}

export async function fetchNaverSearchAd({
  method,
  url,
  searchParams,
  body,
}: {
  method: string
  url: string
  searchParams?: Record<string, string>
  body?: Record<string, any>
}) {
  let uri = searchParams ? url + '?' + new URLSearchParams(searchParams).toString() : url

  const headers = signNaverSearchAd({ method, uri: url })
  // console.log(headers)
  const response = await fetch(API_URL + uri, { method, headers, body: body ? JSON.stringify(body) : undefined })
  // console.log(response)
  if (!response.ok) {
    const text = await response.text()
    console.log(text)
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}
