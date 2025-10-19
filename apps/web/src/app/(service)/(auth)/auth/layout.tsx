import type { Metadata } from 'next'
import { defaultMetadata } from '../../../../../consts/metadata'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-material.css'

export const metadata: Metadata = defaultMetadata

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <main className="w-full">{children}</main>
}
