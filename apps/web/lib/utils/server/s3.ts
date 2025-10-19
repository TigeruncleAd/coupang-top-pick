'use server'
import {
  DeleteObjectCommand,
  DeleteObjectTaggingCommand,
  GetObjectCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  PutObjectTaggingCommand,
  S3,
} from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@repo/database'
import sharp from 'sharp'
const s3 = new S3()
const uuid = uuidv4()

const bucketName = process.env.AWS_BUCKET_NAME
const CDN_HOST = process.env.CDN_HOST
const IMAGE_RESIZER_URL = process.env.IMAGE_RESIZER_URL
const IMAGE_RESIZER_API_KEY = process.env.IMAGE_RESIZER_API_KEY

export async function putImageToS3(imageBuffer: Buffer, contentType: string, key: string[]) {
  const uuid = uuidv4()
  const extension = contentType.split('/')[1]
  const keyString = key.join('/') + '/' + uuid + '.' + extension

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: keyString,
    Body: imageBuffer,
    ContentType: contentType,
  })
  await s3.send(command)
  return keyString
}

export async function getImageFromUrl(url: string) {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function getImagePutToS3(url: string, userId: string) {
  try {
    // const imageBuffer = await getImageFromUrl(url)

    // // resize image with sharp
    // const sharpImage = sharp(imageBuffer)

    // // 이미지 메타데이터 가져오기
    // const metadata = await sharpImage.metadata()

    // // 이미지 리사이징 (width가 1280px 이상인 경우)
    // let resizedImage = sharpImage
    // if (metadata.width && metadata.width > 1280) {
    //   resizedImage = sharpImage.resize({
    //     width: metadata.width && metadata.width > 1280 ? 1280 : undefined,
    //     fit: 'inside', // 비율 유지
    //   })
    // }

    // // webp 형식으로 변환 (0.95 품질)
    // const processedImageBuffer = await resizedImage.webp({ quality: 95 }).toBuffer()

    // const s3Key = await putImageToS3(processedImageBuffer, 'image/webp', key)
    const params = new URLSearchParams({
      userId,
      url,
      apiKey: IMAGE_RESIZER_API_KEY,
    })
    const response = await fetch(`${IMAGE_RESIZER_URL}?${params.toString()}`)
    if (!response.ok) {
      const { message } = await response.json()
      console.error(message)
      return null
    }
    const { key, status } = await response.json()
    if (status !== 'success') {
      console.error(status)
      return null
    }

    return key
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function getImageFromS3(key: string) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })
  const result = await s3.send(command)
  return result
}

export async function deleteImageFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  })
  await s3.send(command)
}

export async function disableImageFromS3(key: string) {
  const command = new PutObjectTaggingCommand({
    Bucket: bucketName,
    Key: key,
    Tagging: {
      TagSet: [{ Key: 'disabled', Value: 'true' }],
    },
  })
  await s3.send(command)
}

export async function enableImageFromS3(key: string) {
  const command = new DeleteObjectTaggingCommand({
    Bucket: bucketName,
    Key: key,
  })
  await s3.send(command)
}
export async function enableUsersHostedImages(userId: bigint) {
  const hostedImages = await prisma.hostedImage.findMany({
    where: { userId },
  })
  if (hostedImages.length === 0) return
  const keys = hostedImages.map(hostedImage => hostedImage.keys).flat()
  await Promise.all(keys.map(key => enableImageFromS3(key)))
}

export async function disableUsersHostedImages(userId: bigint) {
  const hostedImages = await prisma.hostedImage.findMany({
    where: { userId },
  })
  if (hostedImages.length === 0) return
  const keys = hostedImages.map(hostedImage => hostedImage.keys).flat()
  await Promise.all(keys.map(key => disableImageFromS3(key)))
}
