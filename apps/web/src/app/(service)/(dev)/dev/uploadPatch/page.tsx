'use client'

import { kdayjs, uploadS3PreSigned, useServerAction } from '@repo/utils'
import { useState } from 'react'
import { uploadPatch } from './serverAction'
import { toast } from 'sonner'

export default function UploadPatchPage() {
  const { execute, isLoading, error, data } = useServerAction(uploadPatch, {
    onSuccess: ({ message }) => {
      toast.success(message)
    },
    onError: ({ message }) => {
      toast.error(message)
    },
  })
  const [date, setDate] = useState(kdayjs().format('YYYY-MM-DD'))
  const [file, setFile] = useState<File | null>(null)
  const [detail, setDetail] = useState('')
  const [version, setVersion] = useState('')

  async function handleUpload() {
    if (!file) return
    const { public_url, s3Key } = await uploadS3PreSigned(file, ['patch'])
    const cdnHost = process.env.NEXT_PUBLIC_CDN_HOST
    const url = `${cdnHost}/${s3Key}`
    execute({ url, date, version, detail })
  }

  return (
    <div className="mx-auto my-10 flex max-w-7xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="date">날짜</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="version">버전</label>
            <input type="text" value={version} onChange={e => setVersion(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="detail">상세</label>
            <textarea value={detail} onChange={e => setDetail(e.target.value)} />
          </div>
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} accept=".zip" />
        </div>
        <button
          onClick={handleUpload}
          disabled={isLoading || !file}
          className="rounded-md bg-blue-500 px-4 py-2 text-white disabled:opacity-50">
          {isLoading ? '업로드 중...' : '업로드'}
        </button>
      </div>
    </div>
  )
}
