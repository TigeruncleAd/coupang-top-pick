'use client'

import { Button } from '@repo/ui/components/button'
import { ArrowRight } from 'lucide-react'
import { AspectRatio } from '@repo/ui/components/aspect-ratio'
import { Avatar, AvatarImage } from '@repo/ui/components/avatar'
import Image from 'next/image'

export function FeatureSection12() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="container mx-auto flex flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16">
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm font-semibold lg:text-base">Feature section</p>
            <h2 className="text-foreground text-3xl font-bold md:text-4xl">
              Headline that shows solution's impact on user success
            </h2>
            <p className="text-muted-foreground">
              Explain in one or two concise sentences how your solution transforms users' challenges into positive
              outcomes. Focus on the end benefits that matter most to your target audience. Keep it clear and
              compelling.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button>Get access</Button>
            <Button variant="ghost">
              Learn more
              <ArrowRight />
            </Button>
          </div>
          <div className="md:border-border flex flex-col gap-6 md:border-l md:px-6 md:py-4">
            <p className="text-muted-foreground text-base">
              "This is a customer testimonial that supports the feature text above. Lorem ipsum dolor sit amet,
              consectetur adipiscing elit interdum hendrerit ex vitae sodales."
            </p>
            <div className="flex flex-row items-center gap-4">
              <Avatar className="h-10 w-10 md:h-8 md:w-8">
                <AvatarImage src="https://github.com/shadcn.png" alt="Lando Norris" />
              </Avatar>
              <p className="text-foreground font-medium">
                Lando Norris <span className="text-muted-foreground font-normal">- Product Designer</span>
              </p>
            </div>
          </div>
        </div>

        <div className="w-full flex-1">
          <AspectRatio ratio={1}>
            <Image
              src="https://ui.shadcn.com/placeholder.svg"
              alt="Hero image"
              fill
              className="h-full w-full rounded-xl object-cover"
            />
          </AspectRatio>
        </div>
      </div>
    </section>
  )
}
