'use client'

import { Button } from '@repo/ui/components/button'

export function X404Section1() {
  return (
    <section className="bg-background py-16 lg:py-24" aria-labelledby="error-title">
      <div className="container relative z-10 mx-auto flex flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16">
        <div className="m-auto flex max-w-xl flex-1 flex-col items-center gap-6 text-center lg:gap-8">
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
          <Button>Go to homepage</Button>
        </div>
      </div>
    </section>
  )
}
