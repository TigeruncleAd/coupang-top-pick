'use client'

import { Card, CardContent } from '@repo/ui/components/card'
import Image from 'next/image'

export function BentoGrid1() {
  return (
    <section className="bg-muted/80 py-16 md:py-24">
      <div className="container mx-auto flex flex-col gap-12 px-6">
        {/* Header Content */}
        <div className="mx-auto flex flex-col gap-4 md:gap-5 lg:max-w-xl lg:text-center">
          {/* Category Tag */}
          <p className="text-muted-foreground text-sm font-semibold md:text-base">Bento grid section</p>
          {/* Main Heading */}
          <h2 className="text-foreground text-3xl font-bold md:text-4xl">
            Feature-rich layout that captures attention
          </h2>
          {/* Description */}
          <p className="text-muted-foreground text-base">
            Add a concise value statement that highlights your product's key features and benefits in a visually dynamic
            grid. Focus on creating balanced content blocks while keeping it under 2-3 lines. Align with your grid
            layout structure.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {/* Tall Feature Card - Left */}
          <Card className="rounded-xl lg:row-span-2">
            <CardContent className="flex h-full flex-col gap-6 p-6 md:p-8">
              <div className="space-y-2">
                <h3 className="text-foreground text-lg font-semibold">Feature title</h3>
                <p className="text-muted-foreground text-sm">
                  Shortly describe how this feature solves a specific user problem. Focus on benefits.
                </p>
              </div>
              <Image
                src="https://ui.shadcn.com/placeholder.svg"
                alt="Placeholder"
                className="h-full w-full object-cover"
              />
            </CardContent>
          </Card>
          {/* Regular Feature Card - Top Right */}
          <Card className="rounded-xl">
            <CardContent className="flex h-full flex-col gap-6 p-6 md:p-8">
              <div className="space-y-2">
                <h3 className="text-foreground text-lg font-semibold">Feature title</h3>
                <p className="text-muted-foreground text-sm">
                  Shortly describe how this feature solves a specific user problem. Focus on benefits.
                </p>
              </div>
              <Image
                src="https://ui.shadcn.com/placeholder.svg"
                alt="Placeholder"
                className="h-full w-full object-cover md:aspect-[4/3]"
              />
            </CardContent>
          </Card>
          {/* Regular Feature Card - Bottom Right */}
          <Card className="rounded-xl lg:col-start-2">
            <CardContent className="flex h-full flex-col gap-6 p-6 md:p-8">
              <div className="space-y-2">
                <h3 className="text-foreground text-lg font-semibold">Feature title</h3>
                <p className="text-muted-foreground text-sm">
                  Shortly describe how this feature solves a specific user problem. Focus on benefits.
                </p>
              </div>
              <Image
                src="https://ui.shadcn.com/placeholder.svg"
                alt="Placeholder"
                className="h-full w-full object-cover md:aspect-[4/3]"
              />
            </CardContent>
          </Card>
          {/* Tall Feature Card - Right */}
          <Card className="rounded-xl lg:col-start-3 lg:row-span-2 lg:row-start-1">
            <CardContent className="flex h-full flex-col gap-6 p-6 md:p-8">
              <div className="space-y-2">
                <h3 className="text-foreground text-lg font-semibold">Feature title</h3>
                <p className="text-muted-foreground text-sm">
                  Shortly describe how this feature solves a specific user problem. Focus on benefits.
                </p>
              </div>
              <Image
                src="https://ui.shadcn.com/placeholder.svg"
                alt="Placeholder"
                className="h-full w-full object-cover"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
