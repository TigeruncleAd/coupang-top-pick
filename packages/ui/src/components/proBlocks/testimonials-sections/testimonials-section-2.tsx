'use client'

import { Avatar, AvatarImage } from '@repo/ui/components/avatar'
import { Separator } from '@repo/ui/components/separator'

export function TestimonialsSection2() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="testimonial-title">
      <div className="container m-auto px-6">
        <div className="flex flex-col gap-8 md:flex-row md:gap-12">
          {/* First Testimonial */}
          <div className="flex flex-1 flex-col items-center gap-8">
            <blockquote className="text-foreground text-center text-lg leading-7">
              &quot;Shadcn UI Kit for Figma has completely transformed our design process. It&apos;s incredibly
              intuitive and saves us so much time. The components are beautifully crafted and customizable.&quot;
            </blockquote>
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-12 w-12 rounded-lg">
                <AvatarImage src="https://github.com/shadcn.png" alt="Lando Norris" />
              </Avatar>
              <div className="flex flex-col items-center gap-1">
                <p className="text-foreground text-base font-semibold leading-6">Lando Norris</p>
                <p className="text-muted-foreground text-sm leading-5">Founder at Acme Inc.</p>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="bg-border hidden w-[1px] self-stretch md:block" />
          <Separator className="bg-border md:hidden" orientation="horizontal" />

          {/* Second Testimonial */}
          <div className="flex flex-1 flex-col items-center gap-8">
            <blockquote className="text-foreground text-center text-lg leading-7">
              &quot;Shadcn UI Kit for Figma has completely transformed our design process. It&apos;s incredibly
              intuitive and saves us so much time. The components are beautifully crafted and customizable.&quot;
            </blockquote>
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-12 w-12 rounded-lg">
                <AvatarImage src="https://github.com/shadcn.png" alt="Lando Norris" />
              </Avatar>
              <div className="flex flex-col items-center gap-1">
                <p className="text-foreground text-base font-semibold leading-6">Lando Norris</p>
                <p className="text-muted-foreground text-sm leading-5">Founder at Acme Inc.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
