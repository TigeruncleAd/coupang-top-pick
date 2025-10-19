import { S3 } from '@aws-sdk/client-s3'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'

const s3 = new S3()

export async function POST(req: Request) {
  try {
    let { name, type } = await req.json()

    const fileParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: name,
      ContentType: type,
    }
    const url = await getSignedUrl(s3, new PutObjectCommand(fileParams), {
      expiresIn: 60,
    })
    return NextResponse.json({ url, key: fileParams.Key })
    // return NextResponse.json({})
  } catch (e) {
    console.log(e)
    return NextResponse.json({ message: 'error' }, { status: 500 })
  }
}
