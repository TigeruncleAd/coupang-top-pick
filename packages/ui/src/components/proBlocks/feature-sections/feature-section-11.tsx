'use client'

import { Rocket } from 'lucide-react'
import Image from 'next/image'
import { AspectRatio } from '@repo/ui/components/aspect-ratio'

export function FeatureSection11() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto flex flex-col gap-12 px-6 md:gap-16">
        <div className="mx-auto flex max-w-xl flex-col gap-4 text-center md:gap-5">
          <p className="text-muted-foreground text-sm font-semibold md:text-base">Feature section</p>
          <h2 className="text-foreground text-3xl font-bold md:text-4xl">
            Headline that shows solution's impact on user success
          </h2>
          <p className="text-muted-foreground text-base">
            Explain in one or two concise sentences how your solution transforms users' challenges into positive
            outcomes. Focus on the end benefits that matter most to your target audience. Keep it clear and compelling.
          </p>
        </div>
        <div className="w-full flex-1">
          <AspectRatio ratio={16 / 9}>
            <Image
              src="https://ui.shadcn.com/placeholder.svg"
              alt="Hero image"
              fill
              className="h-full w-full rounded-xl object-cover"
            />
          </AspectRatio>
        </div>
        <div className="grid grid-cols-1 gap-8 md:gap-6 lg:grid-cols-3">
          <div className="flex flex-col items-center gap-4 text-center sm:gap-5 md:flex-row md:items-start md:text-left">
            <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
              <Rocket className="text-primary h-5 w-5" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-foreground font-semibold">Benefit driven feature title</h3>
              <p className="text-muted-foreground">
                Shortly describe how this feature solves a specific user problem. Focus on benefits not on technical
                details.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 text-center sm:gap-5 md:flex-row md:items-start md:text-left">
            <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
              <Rocket className="text-primary h-5 w-5" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-foreground font-semibold">Benefit driven feature title</h3>
              <p className="text-muted-foreground">
                Shortly describe how this feature solves a specific user problem. Focus on benefits not on technical
                details.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 text-center sm:gap-5 md:flex-row md:items-start md:text-left">
            <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
              <Rocket className="text-primary h-5 w-5" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-foreground font-semibold">Benefit driven feature title</h3>
              <p className="text-muted-foreground">
                Shortly describe how this feature solves a specific user problem. Focus on benefits not on technical
                details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
