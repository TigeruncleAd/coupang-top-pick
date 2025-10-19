'use client'

import { Button } from '@repo/ui/components/button'
import { AspectRatio } from '@repo/ui/components/aspect-ratio'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export function CtaSection5() {
  return (
    <section className="bg-background py-0 lg:py-24" aria-labelledby="cta-heading">
      <div className="container mx-auto">
        <div className="bg-primary max-w-7xl overflow-hidden pt-16 lg:rounded-xl lg:pl-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            {/* Left Column - Content */}
            <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-between gap-4 px-6 text-center lg:max-w-full lg:items-start lg:gap-8 lg:px-0 lg:pb-16 lg:text-left">
              {/* Section Header */}
              <div className="flex flex-col gap-4 lg:gap-5">
                {/* Category Tag */}
                <p className="text-primary-foreground/80 text-sm font-semibold lg:text-base">CTA section</p>
                {/* Main Title */}
                <h2 id="cta-heading" className="text-primary-foreground text-3xl font-bold md:text-4xl">
                  Action-driving headline that creates urgency
                </h2>
              </div>
              {/* CTA Content */}
              <div className="flex flex-col items-center gap-6 lg:items-start">
                {/* Section Description */}
                <p className="text-primary-foreground/80 text-base">
                  Add one or two compelling sentences that reinforce your main value proposition and overcome final
                  objections.
                </p>
                {/* CTA Button */}
                <Button
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/80"
                  aria-label="Get started with our service">
                  Get started <ArrowRight />
                </Button>
              </div>
            </div>
            {/* Right Column - Image */}
            <div className="w-full flex-1 pl-6 lg:pl-0">
              <AspectRatio ratio={4 / 3}>
                <Image
                  src="https://ui.shadcn.com/placeholder.svg"
                  alt="CTA section image"
                  fill
                  className="h-full w-full rounded-tl-lg object-cover"
                />
              </AspectRatio>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
