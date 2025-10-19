'use client'

import { Button } from '@repo/ui/components/button'
import { AspectRatio } from '@repo/ui/components/aspect-ratio'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

export function CtaSection3() {
  return (
    <section className="bg-background" aria-labelledby="cta-heading">
      <div className="bg-primary mx-auto max-w-7xl px-6 py-16 lg:rounded-xl lg:p-16">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-8 lg:max-w-full lg:flex-row lg:gap-16">
          {/* Left Column - Image */}
          <div className="w-full flex-1">
            <AspectRatio ratio={1}>
              <Image
                src="https://ui.shadcn.com/placeholder.svg"
                alt="CTA section image"
                fill
                className="rounded-xl object-cover"
              />
            </AspectRatio>
          </div>
          {/* Right Column - Content */}
          <div className="flex flex-1 flex-col items-center gap-8 md:gap-10 lg:items-start">
            {/* Section Header */}
            <div className="flex flex-col gap-4 text-center md:gap-5 lg:text-left">
              {/* Category Tag */}
              <p className="text-primary-foreground text-sm font-semibold opacity-80 md:text-base">CTA section</p>
              {/* Main Title */}
              <h2 id="cta-heading" className="text-primary-foreground text-3xl font-bold md:text-4xl">
                Action-driving headline that creates urgency
              </h2>
              {/* Section Description */}
              <p className="text-primary-foreground text-base opacity-80 md:text-lg">
                Add one or two compelling sentences that reinforce your main value proposition and overcome final
                objections. End with a clear reason to act now. Align this copy with your CTA button text.
              </p>
            </div>
            {/* CTA Button */}
            <Button
              className="bg-primary-foreground hover:bg-primary-foreground/80 text-primary"
              aria-label="Get started with our service">
              Get started
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
