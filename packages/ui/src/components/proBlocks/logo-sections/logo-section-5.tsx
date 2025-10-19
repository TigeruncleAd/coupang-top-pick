'use client'

import { PlaceholderLogo } from '@repo/ui/components/proBlocks/placeholder-logo'

export function LogoSection5() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="grid w-full flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-muted flex min-h-[88px] items-center justify-center p-6">
              <PlaceholderLogo />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
