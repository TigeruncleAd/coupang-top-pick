'use client'

import { Button } from '@repo/ui/components/button'
import { ArrowRight } from 'lucide-react'

export function HeroSection6() {
  return (
    <section
      className="bg-placeholder relative overflow-hidden bg-cover bg-center py-16 lg:py-24"
      aria-labelledby="hero-heading">
      <div className="absolute inset-0 z-0 bg-black/80" />
      <div className="z-1 container relative mx-auto flex flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16">
        <div className="m-auto flex max-w-2xl flex-1 flex-col items-center gap-6 text-center lg:gap-8">
          <div className="flex flex-col gap-4 lg:gap-5">
            <p className="text-sm font-semibold text-white/80 lg:text-base" aria-hidden="true">
              Hero section
            </p>
            <h1 id="hero-heading" className="text-3xl font-bold text-white md:text-5xl">
              Headline that solves user's main problem
            </h1>
            <p className="text-base text-white/80 lg:text-lg">
              Follow with one or two sentences that expand on your value proposition. Focus on key benefits and address
              why users should take action now. Keep it scannable, short and benefit-driven.
            </p>
          </div>
          <Button>
            Get started
            <ArrowRight />
          </Button>
        </div>
      </div>
    </section>
  )
}
