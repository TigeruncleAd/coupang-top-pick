'use client'

import { Button } from '@repo/ui/components/button'

export function CtaSection2() {
  return (
    <section className="bg-primary py-16 md:py-24" aria-labelledby="cta-heading">
      <div className="container mx-auto px-6">
        <div className="flex w-full flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
          {/* Main Title */}
          <h2 id="cta-heading" className="text-primary-foreground max-w-lg text-3xl font-bold md:text-4xl">
            Action-driving headline that creates urgency
          </h2>
          {/* CTA Buttons */}
          <div className="align-right flex flex-col gap-3 md:flex-row">
            {/* Primary Button */}
            <Button
              className="bg-primary-foreground hover:bg-primary-foreground/80 text-primary"
              aria-label="Get started with our service">
              Get started
            </Button>
            {/* Secondary Button */}
            <Button
              variant="ghost"
              className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
              aria-label="Learn more about our service">
              Learn more
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
