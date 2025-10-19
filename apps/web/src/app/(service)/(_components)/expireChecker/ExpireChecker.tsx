'use client'

import { useMe } from '@/hooks/useMe'
import { useEffect } from 'react'
import { signOut } from 'next-auth/react'

export default function ExpireChecker() {
  const { me } = useMe()
  useEffect(() => {
    if (me && (me.expiredAt < new Date().getTime() || me.status === 'INACTIVE')) {
      signOut({
        callbackUrl: '/',
      })
    }
  }, [me])
  return <div />
}
