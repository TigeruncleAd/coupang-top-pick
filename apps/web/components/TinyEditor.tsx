'use client'

// import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { imageResizer, uploadS3PreSigned } from '@repo/utils'

interface Props {
  value: string
  onChange: (content: string) => void
  uiSelector?: string
}

const cdnHost = process.env.NEXT_PUBLIC_CDN_HOST

export default function TinyEditor({ value, onChange, uiSelector }: Props) {
  const editorRef = useRef(null)

  const handleImageUpload = async (blobInfo): Promise<string> => {
    try {
      // 이미지 리사이징
      const resizedFile = await imageResizer(blobInfo.blob(), {
        maxWidth: 800,
        maxHeight: 800,
        quality: 80,
      })
      const { public_url, s3Key } = await uploadS3PreSigned(resizedFile, ['product'])

      return `${cdnHost}/${s3Key}`
    } catch (error) {
      console.error('Image upload failed:', error)
      throw error
    }
  }

  return (
    <Editor
      licenseKey="gpl"
      tinymceScriptSrc="/lib/tinymce/tinymce.min.js" // self-hosted tinymce 경로 지정
      onInit={(evt, editor) => (editorRef.current = editor)}
      value={value}
      init={{
        height: '100%',
        menubar: true,
        plugins: [
          'advlist',
          'autolink',
          'lists',
          'link',
          'image',
          'charmap',
          'preview',
          // 'anchor',
          'searchreplace',
          // 'visualblocks',
          // 'code',
          'fullscreen',
          // 'insertdatetime',
          'media',
          'table',
        ],
        toolbar:
          'undo redo | fontfamily fontsize | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | table image | preview',
        content_style: 'body { font-family:NanumGothic; font-size:14px }',
        // self-hosted 이미지, CSS 등의 리소스 경로 지정
        content_css: '/lib/tinymce/skins/content/default/content.min.css',
        skin_url: '/lib/tinymce/skins/ui/oxide',
        // 이미지 업로드 설정 추가
        images_upload_handler: handleImageUpload,
        automatic_uploads: true,
        file_picker_types: 'image',
        // 이미지 업로드 관련 추가 설정
        image_advtab: true,
        image_uploadtab: true,
        promotion: false,
        z_index: 20000,
        ui_mode: 'split',
      }}
      onEditorChange={content => onChange(content)}
    />
  )
}
