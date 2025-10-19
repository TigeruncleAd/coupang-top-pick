import Resizer from 'react-image-file-resizer'

export async function imageResizer(
  file,
  { maxWidth = 300, maxHeight = 300, quality = 100, compressFormat = 'WEBP' },
): Promise<File> {
  const resize: Promise<File> = new Promise(resolve => {
    Resizer.imageFileResizer(
      file,
      maxWidth,
      maxHeight,
      compressFormat,
      quality,
      0,
      file => {
        resolve(file as File)
      },
      'file',
    )
  })
  const resizedFile = await resize
  return resizedFile
}
