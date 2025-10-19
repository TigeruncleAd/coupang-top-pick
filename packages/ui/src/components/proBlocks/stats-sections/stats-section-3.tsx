'use client'

import { AspectRatio } from '@repo/ui/components/aspect-ratio'
import Image from 'next/image'

export function StatsSection3() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="container mx-auto flex flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16">
        <div className="w-full flex-1 lg:max-w-lg">
          <AspectRatio ratio={1}>
            <Image
              src="https://ui.shadcn.com/placeholder.svg"
              alt="Hero image"
              fill
              className="h-full w-full rounded-xl object-cover"
            />
          </AspectRatio>
        </div>
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm font-semibold lg:text-base">Stats section</p>
            <h2 className="text-foreground text-3xl font-bold md:text-4xl">
              Data-driven highlights that showcase impact
            </h2>
            <p className="text-muted-foreground">
              Add a concise value statement that explains how your metrics demonstrate success and growth. Focus on
              transformation and measurable outcomes while keeping it under 2 lines. Align with your statistical data
              display.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
            <div className="flex flex-col gap-3">
              <h3 className="text-foreground text-2xl font-bold md:text-3xl">42,263</h3>
              <p className=" text-muted-foreground">
                Each stat should include a bold numerical figure followed by a brief, compelling description.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-foreground text-2xl font-bold md:text-3xl">$23M</h3>
              <p className=" text-muted-foreground">
                Each stat should include a bold numerical figure followed by a brief, compelling description.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
