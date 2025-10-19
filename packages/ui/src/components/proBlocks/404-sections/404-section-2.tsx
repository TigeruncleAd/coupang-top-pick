'use client'

import { Button } from '@repo/ui/components/button'
import { ArrowRight } from 'lucide-react'
import { AspectRatio } from '@repo/ui/components/aspect-ratio'
import Image from 'next/image'

export function X404Section2() {
  return (
    <section
      className="bg-background relative flex flex-col items-center overflow-hidden py-16 lg:py-24"
      aria-labelledby="error-title">
      <div className="container flex flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16">
        <div className="flex flex-1 flex-col gap-6 lg:gap-8">
          <div className="flex flex-col gap-4 lg:gap-5">
            <p className="text-muted-foreground text-sm font-semibold lg:text-base" aria-label="Error code">
              404
            </p>
            <h1 id="error-title" className="text-foreground text-3xl font-bold md:text-5xl">
              Page not found
            </h1>
            <p className="text-muted-foreground text-base lg:text-lg">
              Sorry, we couldn't find the page you're looking for. Please check the URL or navigate back home.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button>Go back home</Button>
            <Button variant="ghost">
              Contact support
              <ArrowRight />
            </Button>
          </div>
        </div>

        <div className="w-full flex-1">
          <AspectRatio ratio={1 / 1}>
            <Image
              src="https://ui.shadcn.com/placeholder.svg"
              alt="404 illustration"
              fill
              className="h-full w-full rounded-xl object-cover"
              priority
            />
          </AspectRatio>
        </div>
      </div>
    </section>
  )
}
