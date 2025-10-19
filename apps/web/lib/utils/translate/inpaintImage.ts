'use server'
import Replicate from 'replicate'
import { putImageToS3 } from '@/lib/utils/server/s3'
const CDN_HOST = process.env.NEXT_PUBLIC_CDN_HOST

export async function inpaintImage(image: { data: Buffer; id: string }, mask: { data: Buffer; id: string }) {
  const imageKey = await putImageToS3(image.data, 'image/jpeg', ['imageTest', image.id])
  const maskKey = await putImageToS3(mask.data, 'image/jpeg', ['imageTest', mask.id])
  const imageUrl = `${CDN_HOST}/${imageKey}`
  const maskUrl = `${CDN_HOST}/${maskKey}`

  const replicate = new Replicate()
  const output = (await replicate.run(
    'zylim0702/remove-object:0e3a841c913f597c1e4c321560aa69e2bc1f15c65f8c366caafc379240efd8ba',
    {
      input: {
        image: imageUrl,
        mask: maskUrl,
      },
    },
  )) as any
  const url = output.url()
  return url.href
}
