'use client'

import { PlaceholderLogo } from '@repo/ui/components/proBlocks/placeholder-logo'

export function LogoSection6() {
  return (
    <section className="bg-zinc-950 py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="grid w-full flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex min-h-[88px] items-center justify-center bg-zinc-900 p-6">
              <PlaceholderLogo variant="white" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
