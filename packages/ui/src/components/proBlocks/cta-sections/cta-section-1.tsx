'use client'

import { Button } from '@repo/ui/components/button'
import { ArrowRight } from 'lucide-react'

export function CtaSection1() {
  return (
    <section className="bg-primary py-16 md:py-24" aria-labelledby="cta-heading">
      <div className="container mx-auto px-6">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-8 md:gap-10">
          {/* Section Header */}
          <div className="flex flex-col items-center gap-4 md:gap-5">
            {/* Category Tag */}
            <p className="text-primary-foreground text-center text-sm font-semibold opacity-80 md:text-base">
              CTA section
            </p>
            {/* Main Title */}
            <h2 id="cta-heading" className="text-primary-foreground text-center text-3xl font-bold md:text-4xl">
              Action-driving headline that creates urgency
            </h2>
            {/* Section Description */}
            <p className="text-primary-foreground text-center text-base opacity-80 md:text-lg">
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
    </section>
  )
}
