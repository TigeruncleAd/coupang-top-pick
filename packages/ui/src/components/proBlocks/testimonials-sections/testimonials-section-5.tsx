'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/components/avatar'
import { Separator } from '@repo/ui/components/separator'

export function TestimonialsSection5() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="testimonial-title">
      {/* Main Content Container */}
      <div className="container mx-auto px-6">
        {/* Content Wrapper */}
        <div className="flex flex-col gap-12">
          {/* Section Header */}
          <div className="flex max-w-xl flex-col gap-4 text-center md:gap-5 md:text-left">
            {/* Category Tag */}
            <p className="text-muted-foreground text-sm font-semibold leading-[20px] md:text-base md:leading-6">
              Testimonial section
            </p>
            {/* Main Title */}
            <h2 id="testimonial-title" className="text-3xl font-bold md:text-4xl">
              Social proof section title that focuses on trust and results
            </h2>
          </div>

          {/* Testimonials Layout */}
          <div className="flex flex-col gap-8 md:flex-row md:gap-12">
            {/* First Testimonial */}
            <div className="flex flex-col gap-8">
              {/* Testimonial Quote */}
              <p className="text-foreground text-center text-lg font-medium leading-7 md:text-left">
                &quot;Shadcn UI Kit for Figma has completely transformed our design process. It&apos;s incredibly
                intuitive and saves us so much time. The components are beautifully crafted and customizable.&quot;
              </p>

              {/* Author Information */}
              <div className="flex flex-col items-center gap-5 md:flex-row">
                {/* Author Avatar */}
                <Avatar className="h-14 w-14">
                  <AvatarImage src="https://github.com/shadcn.png" alt="Lando Norris" />
                  <AvatarFallback>LN</AvatarFallback>
                </Avatar>

                {/* Author Details */}
                <div className="flex flex-col gap-1 text-center md:text-left">
                  <p className="text-foreground text-base font-semibold leading-6">Lando Norris</p>
                  <p className="text-muted-foreground text-base leading-6">Founder at Acme Inc.</p>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="bg-border hidden w-[1px] self-stretch md:block" />
            <Separator className="bg-border md:hidden" orientation="horizontal" />

            {/* Second Testimonial */}
            <div className="flex flex-col gap-8">
              {/* Testimonial Quote */}
              <p className="text-foreground text-center text-lg font-medium leading-7 md:text-left">
                &quot;Shadcn UI Kit for Figma has completely transformed our design process. It&apos;s incredibly
                intuitive and saves us so much time. The components are beautifully crafted and customizable.&quot;
              </p>

              {/* Author Information */}
              <div className="flex flex-col items-center gap-5 md:flex-row">
                {/* Author Avatar */}
                <Avatar className="h-14 w-14">
                  <AvatarImage src="https://github.com/shadcn.png" alt="Lando Norris" />
                  <AvatarFallback>LN</AvatarFallback>
                </Avatar>

                {/* Author Details */}
                <div className="flex flex-col gap-1 text-center md:text-left">
                  <p className="text-foreground text-base font-semibold leading-6">Lando Norris</p>
                  <p className="text-muted-foreground text-base leading-6">Founder at Acme Inc.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
