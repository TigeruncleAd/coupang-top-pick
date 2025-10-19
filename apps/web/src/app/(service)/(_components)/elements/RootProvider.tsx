'use client'
import dynamic from 'next/dynamic'
import { SidebarProvider } from '@repo/ui/components/sidebar'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ThemeProvider } from 'next-themes'
const ThemeProvider = dynamic(() => import('next-themes').then(mod => mod.ThemeProvider), { ssr: false })
const ExpensionTokenSetter = dynamic(() => import('@/components/extensionTokenSetter'), { ssr: false })

export default function RootProvider({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SidebarProvider>
            {children}
            <ExpensionTokenSetter />
          </SidebarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
