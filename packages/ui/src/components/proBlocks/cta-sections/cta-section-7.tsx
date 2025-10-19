'use client'

import { Button } from '@repo/ui/components/button'
import { ArrowRight } from 'lucide-react'

export function CtaSection7() {
  return (
    <section className="bg-background" aria-labelledby="cta-heading">
      <div className="container mx-auto">
        <div className="bg-primary px-6 py-16 sm:rounded-xl md:p-16">
          <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 text-center">
            {/* Section Header */}
            <div className="flex flex-col gap-5">
              {/* Category Tag */}
              <p className="text-primary-foreground/80 text-sm font-semibold lg:text-base">CTA section</p>
              {/* Main Title */}
              <h2 id="cta-heading" className="text-primary-foreground text-3xl font-bold md:text-4xl">
                Action-driving headline that creates urgency
              </h2>
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
