'use client'

import { MapPin, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { AspectRatio } from '@repo/ui/components/aspect-ratio'
import Image from 'next/image'

export function ContactSection5() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="contact-heading">
      <div className="container mx-auto flex flex-col gap-8 px-6 md:items-center lg:flex-row lg:gap-12">
        {/* Left Column - Image */}
        <div className="order-2 w-full flex-1 lg:order-1">
          <AspectRatio ratio={1}>
            <Image
              src="https://ui.shadcn.com/placeholder.svg"
              alt="Contact section image"
              fill
              className="rounded-xl object-cover"
            />
          </AspectRatio>
        </div>

        {/* Right Column - Content */}
        <div className="order-1 flex flex-1 flex-col gap-6 lg:order-2">
          {/* Section Header */}
          <div className="flex flex-col gap-4">
            {/* Category Tag */}
            <p className="text-muted-foreground text-sm font-semibold md:text-base">Contact us</p>
            {/* Main Title */}
            <h2 id="contact-heading" className="text-foreground text-3xl font-bold md:text-4xl">
              Get in touch
            </h2>
            {/* Section Description */}
            <p className="text-muted-foreground text-base">
              Write a welcoming sentence that encourage contact. Include your response time commitment and highlight
              your team's readiness to help.
            </p>
          </div>

          {/* Contact Links */}
          <div className="flex flex-col gap-4">
            {/* Phone Link */}
            <Link href="#" className="flex items-start gap-3 hover:underline">
              <div className="pt-0.5">
                <Phone className="text-primary h-5 w-5" />
              </div>
              <span className="text-card-foreground text-base font-medium leading-6">(406) 555-0120</span>
            </Link>

            {/* Email Link */}
            <Link href="#" className="flex items-start gap-3 hover:underline">
              <div className="pt-0.5">
                <Mail className="text-primary h-5 w-5" />
              </div>
              <span className="text-card-foreground text-base font-medium leading-6">hello@example.com</span>
            </Link>

            {/* Location Link */}
            <Link href="#" className="flex items-start gap-3 hover:underline">
              <div className="pt-0.5">
                <MapPin className="text-primary h-5 w-5" />
              </div>
              <span className="text-card-foreground text-base font-medium leading-6">
                192 Griffin Street, Gilbert, AZ 32521
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
