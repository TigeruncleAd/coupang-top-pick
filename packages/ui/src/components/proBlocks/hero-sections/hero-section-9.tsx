'use client'

import { Button } from '@repo/ui/components/button'
import { ArrowRight } from 'lucide-react'
import { AspectRatio } from '@repo/ui/components/aspect-ratio'

export function HeroSection9() {
  return (
    <section className="bg-background py-16 lg:py-24" aria-labelledby="hero-heading">
      <div className="container m-auto flex flex-col items-center gap-12 px-6 lg:gap-16">
        {/* Hero Content */}
        <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center gap-6 text-center lg:gap-8">
          <div className="flex flex-col gap-4 lg:gap-5">
            {/* Category Tag */}
            <p className="text-muted-foreground text-sm font-semibold lg:text-base" aria-hidden="true">
              Hero section
            </p>
            {/* Main Title */}
            <h1 id="hero-heading" className="text-foreground text-3xl font-bold md:text-5xl">
              Headline that solves user's main problem
            </h1>
            {/* Description */}
            <p className="text-muted-foreground text-base lg:text-lg">
              Follow with one or two sentences that expand on your value proposition. Focus on key benefits and address
              why users should take action now. Keep it scannable, short and benefit-driven.
            </p>
          </div>
          {/* CTA Button */}
          <Button className="md:flex-1" aria-label="Get started with our service">
            Get started
            <ArrowRight />
          </Button>
        </div>

        {/* Video Section */}
        <AspectRatio ratio={16 / 9}>
          <video
            className="h-full w-full rounded-lg object-cover"
            controls
            preload="none"
            aria-label="Product demonstration video">
            <source src="/path/to/video.mp4" type="video/mp4" />
            <track src="/path/to/captions.vtt" kind="subtitles" srcLang="en" label="English" />
            Your browser does not support the video tag.
          </video>
        </AspectRatio>
      </div>
    </section>
  )
}
