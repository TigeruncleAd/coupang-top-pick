import type { Metadata } from 'next'
import { METADATA } from './const'

export const defaultMetadata: Metadata = {
  title: METADATA.common.TITLE,
  description: METADATA.common.DESCRIPTION,
  openGraph: {
    type: 'website',
    title: METADATA.common.TITLE,
    description: METADATA.common.DESCRIPTION,
    url: METADATA.common.URL,
    images: [
      {
        url: `${METADATA.common.URL}${METADATA.common.KAKAO_THUMBNAIL}`,
        width: METADATA.common.KAKAO_IMAGE_WIDTH,
        height: METADATA.common.KAKAO_IMAGE_HEIGHT,
      },
    ],
  },
  icons: '/favicon.ico',
}
