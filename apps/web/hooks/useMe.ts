'use client'

import { create } from 'zustand'
import { useAsyncEffect } from '@repo/utils'

import { signOut, useSession } from 'next-auth/react'
import { getMe } from '../lib/utils/server/getServerUser'
import { PATH } from '../consts/const'

interface MeState {
  me: any
  isLoading: boolean
  status: 'loading' | 'authenticated' | 'unauthenticated'
  setMeState: (partial: Partial<Pick<MeState, 'me' | 'isLoading' | 'status'>>) => void
}

export const useMeStore = create<MeState>(set => ({
  me: null,
  isLoading: false,
  status: 'loading',
  setMeState: partial => set(partial),
}))

export function useMe() {
  if (typeof window === 'undefined') return { me: null, isLoading: true, status: 'loading' }

  const { data: session, status } = useSession()
  const { me, isLoading, status: meStatus, setMeState } = useMeStore()

  async function fetchMe(force = false) {
    if (status === 'loading') return

    if (!me || force) {
      setMeState({ isLoading: true, status: 'loading' })
      const user = await getMe()
      if (!user) {
        await signOut({
          callbackUrl: PATH.SIGNIN,
        })
        return
      } else {
        setMeState({ me: user, isLoading: false, status: 'authenticated' })
      }
    }
  }

  useAsyncEffect(async () => {
    if (isLoading) return
    if (status === 'authenticated') {
      await fetchMe()
    }
    if (status === 'unauthenticated') {
      setMeState({ me: null, status: 'unauthenticated', isLoading: false })
    }
  }, [status])

  return { me, status: meStatus, refetchMe: () => fetchMe(true) }
}
