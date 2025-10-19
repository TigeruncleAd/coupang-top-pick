'use client'

import { Button } from '@repo/ui/components/button'
import { AspectRatio } from '@repo/ui/components/aspect-ratio'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export function FeatureSection7() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto flex max-w-2xl flex-col gap-12 px-6">
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col gap-4 md:gap-5">
            <p className="text-muted-foreground text-sm font-semibold md:text-base">Feature section</p>
            <h2 className="text-foreground text-3xl font-bold md:text-4xl">
              Headline that shows solution's impact on user success
            </h2>
            <p className="text-muted-foreground text-base">
              Explain in one or two concise sentences how your solution transforms users' challenges into positive
              outcomes. Focus on the end benefits that matter most to your target audience. Keep it clear and
              compelling.
            </p>
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
          <AspectRatio ratio={4 / 3}>
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
