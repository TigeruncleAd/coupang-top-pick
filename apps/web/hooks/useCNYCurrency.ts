'use client'

import { useQuery } from '@tanstack/react-query'
import { getCNYCurrency } from '@/lib/utils/server/getCNYCurrency'

export function useCNYCurrency(): { cnyCurrency: number; isCNYCurrencyLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['CNY_CURRENCY'],
    queryFn: getCNYCurrency,
    staleTime: Infinity,
  })
  return { cnyCurrency: data, isCNYCurrencyLoading: isLoading }
}
