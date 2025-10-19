'use client'

import { PlaceholderLogo } from '@repo/ui/components/proBlocks/placeholder-logo'

export function LogoSection2() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="flex w-full flex-col items-start gap-12 md:flex-row md:gap-16">
          <div className="flex flex-col items-center gap-4 text-center md:items-start md:gap-5 md:text-left">
            <p className="text-muted-foreground font-semibold">Logo section</p>
            <h2 className="text-foreground text-3xl font-bold md:text-4xl">Showcase that builds trust</h2>
            <p className="text-muted-foreground">
              Add logos of notable companies using your product. Include 4-6 recognizable brands in grayscale to
              maintain visual consistency. Ensure logos are properly scaled and aligned with equal spacing.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-6 p-0 md:gap-8 md:p-6">
            {[...Array(6)].map((_, index) => (
              <PlaceholderLogo key={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
