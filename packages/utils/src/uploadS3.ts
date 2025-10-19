'use client'
import { kdayjs } from './dayjs'
import { v4 as uuidv4 } from 'uuid'
const CDN_HOST = process.env.NEXT_PUBLIC_CDN_HOST

export async function uploadS3PreSigned(file: File, keys: string[], useUUid = true) {
  // const formData = new FormData();
  // formData.append("file", file);

  const keyString = keys.join('/')
  let s3Key = ''
  if (useUUid) {
    const uuid = uuidv4()
    s3Key = `${keyString}/${kdayjs().format('YYYY-MM/DD')}/${uuid}/${file.name}`
  } else {
    s3Key = `${keyString}/${kdayjs().format('YYYY-MM/DD')}/${file.name}`
  }

  let res = await fetch('/api/aws', {
    method: 'POST',
    body: JSON.stringify({
      name: s3Key,
      type: file.type,
    }),
  })
  let data = await res.json()
  const url = data.url
  // const public_url = data.url.split('?')[0]
  const cdn_url = `${CDN_HOST}/${s3Key}`
  const returnUrl = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-type': file.type,
    },
    body: file,
  })

  return { public_url: cdn_url, s3Key }
}
