import '@repo/ui/globals.css'

import type { Metadata, Viewport } from 'next'
import RootProvider from './(_components)/elements/RootProvider'
import { defaultMetadata } from '../../../consts/metadata'
import { ToastContainer } from 'react-toastify'
import { Toaster } from '@repo/ui/components/sonner'

export const metadata: Metadata = defaultMetadata
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      {/*<Head>*/}
      {/*  <meta name="robots" content="index,follow" />*/}
      {/*  <link rel="icon" href="/favicon.ico" sizes="192x192" />*/}
      {/*</Head>*/}
      <body>
        <div className="root">
          <RootProvider>{children}</RootProvider>
          <ToastContainer
            position="bottom-center"
            autoClose={3000}
            hideProgressBar={true}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss={false}
            draggable={false}
            pauseOnHover={false}
            toastStyle={{
              backgroundColor: '#333',
              color: '#fff',
              accentColor: '#fff',
            }}
            style={{
              color: '#fff',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
            }}
            theme="dark"
          />
          <Toaster />
        </div>
      </body>
    </html>
  )
}
