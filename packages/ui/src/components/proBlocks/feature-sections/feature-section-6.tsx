'use client'

import { Button } from '@repo/ui/components/button'
import { ArrowRight, Rocket } from 'lucide-react'
import { AspectRatio } from '@repo/ui/components/aspect-ratio'
import Image from 'next/image'

export function FeatureSection6() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="container mx-auto flex flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16">
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm font-semibold lg:text-base">Feature section</p>
            <h2 className="text-foreground text-3xl font-bold md:text-4xl">
              Headline that shows solution's impact on user success
            </h2>
            <p className="text-muted-foreground">
              Explain in one or two concise sentences how your solution transforms users' challenges into positive
              outcomes. Focus on the end benefits that matter most to your target audience. Keep it clear and
              compelling.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
            <div className="flex flex-col gap-5">
              <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
                <Rocket className="text-primary h-5 w-5" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-foreground font-semibold">Benefit driven feature title</h3>
                <p className="text-muted-foreground md:text-sm">
                  Shortly describe how this feature solves a specific user problem. Focus on benefits not on technical
                  details.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
                <Rocket className="text-primary h-5 w-5" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-foreground font-semibold">Benefit driven feature title</h3>
                <p className="text-muted-foreground md:text-sm">
                  Shortly describe how this feature solves a specific user problem. Focus on benefits not on technical
                  details.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button>Get access</Button>
            <Button variant="ghost">
              Learn more
              <ArrowRight />
            </Button>
          </div>
        </div>

        <div className="w-full flex-1">
          <AspectRatio ratio={1}>
            <Image
              src="https://ui.shadcn.com/placeholder.svg"
              alt="Hero image"
              fill
              className="h-full w-full rounded-xl object-cover"
            />
          </AspectRatio>
        </div>
      </div>
    </section>
  )
}
