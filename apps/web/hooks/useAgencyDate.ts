'use client'

import { kdayjs } from '@repo/utils'
import { create } from 'zustand'

export const useAgencyDateStore = create<{
  date: string
  setDate: (date: string) => void
  query: string
  setQuery: (query: string) => void
}>(set => ({
  date: kdayjs().format('YYYY-MM-DD'),
  setDate: date => set({ date }),
  query: '',
  setQuery: query => set({ query }),
}))

export function useAgencyDate(): [string, (date: string) => void, string, (query: string) => void] {
  const { date, setDate, query, setQuery } = useAgencyDateStore()
  return [date, setDate, query, setQuery]
}
