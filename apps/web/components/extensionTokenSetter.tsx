'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { generateExtToken } from '@/serverActions/extension/extension.action'
import { getExtensionId } from '@/serverActions/extension/extension.action'
import { pushToExtension } from '@/lib/utils/extension'

export default function ExtensionTokenSetter() {
  const { status } = useSession()
  const [extensionId, setExtensionId] = useState<string | undefined>(undefined)
  const [isExtReady, setIsExtReady] = useState<boolean>(false)

  useEffect(() => {
    getExtensionId().then(setExtensionId)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (!extensionId || isExtReady) return

    interval = setInterval(() => {
      pushToExtension({ extensionId, payload: { type: 'EXT_READY' } }).then(result => {
        if (result) {
          clearInterval(interval)
          setIsExtReady(true)
        }
      })
    }, 500)

    return () => clearInterval(interval)
  }, [extensionId, isExtReady])

  useEffect(() => {
    if (!extensionId || !isExtReady) return

    const loop = async () => {
      if (status === 'authenticated') {
        // 로그인 상태라면 토큰 발급
        const tokenData = await generateExtToken()
        if (!tokenData) return
        const { token, expiredAt } = tokenData
        // 확장으로 푸시
        pushToExtension({ extensionId, payload: { type: 'SET_TOKEN', token, expiresAt: expiredAt } })
      }
      if (status === 'unauthenticated') pushToExtension({ extensionId, payload: { type: 'RM_TOKEN' } })
    }
    loop()
  }, [status, extensionId, isExtReady])

  return null
}
