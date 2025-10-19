'use client'
import { useState } from 'react'

type AsyncFunction = (...args: any) => Promise<any>
export function useServerAction<T extends AsyncFunction>(
  action: T,
  {
    onSuccess,
    onError,
  }: { onSuccess?: (result?: any) => any; onError?: (error?: any) => any; defaultToast?: boolean } = {},
) {
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null | undefined>(null)
  const [data, setData] = useState<Awaited<ReturnType<T>> | null | undefined>(null)

  async function execute(...payload: Parameters<T>) {
    if (isLoading) return
    setLoading(true)
    setError(null)
    setData(null)

    try {
      // @ts-ignore
      const data = await action(...payload)
      if (data?.status === 'error') {
        onError && onError(data)
      }
      if (data?.status === 'success') {
        onSuccess && onSuccess(data)
      }
      setData(data)
    } catch (e: any) {
      setError(e)
    }

    setLoading(false)
  }

  return { execute, isLoading, error, data }
}
