'use client'

import { Button } from '@repo/ui/components/button'
import { ArrowRight } from 'lucide-react'
import { AspectRatio } from '@repo/ui/components/aspect-ratio'
import Image from 'next/image'

export function HeroSection1() {
  return (
    <section className="bg-background py-16 lg:py-24" aria-labelledby="hero-heading">
      <div className="container mx-auto flex flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16">
        {/* Left Column */}
        <div className="flex flex-1 flex-col gap-6 lg:gap-8">
          <div className="flex flex-col gap-4 lg:gap-5">
            {/* Category Tag */}
            <p className="text-muted-foreground text-sm font-semibold lg:text-base" aria-hidden="true">
              Hero section
            </p>
            {/* Main Heading */}
            <h1 id="hero-heading" className="text-foreground text-3xl font-bold md:text-5xl">
              Headline that solves user's <span className="text-primary">main problem</span>
            </h1>
            {/* Description */}
            <p className="text-muted-foreground text-base lg:text-lg">
              Follow with one or two sentences that expand on your value proposition. Focus on key benefits and address
              why users should take action now. Keep it scannable, short and benefit-driven.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button>Get started</Button>
            <Button variant="ghost">
              Explore
              <ArrowRight />
            </Button>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full flex-1">
          <AspectRatio ratio={1 / 1}>
            <Image
              src="https://ui.shadcn.com/placeholder.svg"
              alt="Hero section visual"
              fill
              priority
              className="h-full w-full rounded-xl object-cover"
            />
          </AspectRatio>
        </div>
      </div>
    </section>
  )
}
