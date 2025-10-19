import type { Metadata } from 'next'
import { defaultMetadata } from '../../../../consts/metadata'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-material.css'

import SideNav from './(_components)/SideNav'
import ExpireChecker from '../(_components)/expireChecker/ExpireChecker'
import { Suspense } from 'react'

export const metadata: Metadata = defaultMetadata

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* <DefaultHeader /> */}
      {/* <ExpireChecker /> */}
      <SideNav />

      <main className="w-full max-w-screen-2xl p-4">{children}</main>
      {/* <NavigationBar /> */}
    </>
  )
}
