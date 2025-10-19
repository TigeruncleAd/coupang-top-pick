'use client'

import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { Textarea } from '@repo/ui/components/textarea'
import { MapPin, Phone, Mail } from 'lucide-react'
import { Separator } from '@repo/ui/components/separator'
import Link from 'next/link'

export function ContactSection2() {
  return (
    <section className="bg-background py-16 md:py-0" aria-labelledby="contact-heading">
      <div className="flex flex-col gap-8 md:flex-row md:gap-0">
        {/* Left Column */}
        <div className="flex flex-1 flex-1 items-center justify-center px-6 py-0 md:py-24">
          <div className="flex max-w-md flex-col gap-8">
            {/* Section Header */}
            <div className="flex flex-col gap-4">
              {/* Category Tag */}
              <p className="text-muted-foreground text-sm font-semibold md:text-base">Contact us</p>
              {/* Main Title */}
              <h1 id="contact-heading" className="text-foreground text-3xl font-bold md:text-4xl">
                Get in touch
              </h1>
              {/* Section Description */}
              <p className="text-muted-foreground text-base">
                Write a welcoming sentence that encourage contact. Include your response time commitment and highlight
                your team's readiness to help.
              </p>
            </div>

            {/* Contact Form */}
            <form className="flex flex-col gap-5 md:gap-6" onSubmit={e => e.preventDefault()} aria-label="Contact form">
              {/* Name Input */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Name" required aria-required="true" />
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Email" required aria-required="true" />
              </div>

              {/* Message Textarea */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message"
                  className="min-h-[106px]"
                  required
                  aria-required="true"
                />
              </div>

              {/* Privacy Policy Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox id="privacy" required aria-required="true" />
                <Label htmlFor="privacy" className="text-muted-foreground font-normal leading-tight">
                  By selecting this you agree to our{' '}
                  <Link href="#" className="text-foreground underline">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full">
                Send message
              </Button>
            </form>
          </div>
        </div>

        {/* Mobile Separator */}
        <Separator className="block md:hidden" />

        {/* Right Column */}
        <div className="md:bg-muted/40 flex flex-1 flex-col items-center justify-center px-6">
          <div className="flex flex-col gap-12">
            {/* Phone Card */}
            <Link href="#" className="flex cursor-pointer flex-col items-center gap-5 md:flex-row md:items-start">
              <div className="bg-background flex h-10 w-10 items-center justify-center rounded-md border shadow-sm">
                <Phone className="text-primary h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1 text-center md:text-left">
                <h3 className="text-card-foreground text-base font-semibold leading-6">Call us</h3>
                <span className="text-muted-foreground text-base underline">+1 400 500 600</span>
              </div>
            </Link>

            {/* Email Card */}
            <Link href="#" className="flex cursor-pointer flex-col items-center gap-5 md:flex-row md:items-start">
              <div className="bg-background flex h-10 w-10 items-center justify-center rounded-md border shadow-sm">
                <Mail className="text-primary h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1 text-center md:text-left">
                <h3 className="text-card-foreground text-base font-semibold leading-6">Write an email</h3>
                <span className="text-muted-foreground text-base underline">hello@example.com</span>
              </div>
            </Link>

            {/* Location Card */}
            <Link href="#" className="flex cursor-pointer flex-col items-center gap-5 md:flex-row md:items-start">
              <div className="bg-background flex h-10 w-10 items-center justify-center rounded-md border shadow-sm">
                <MapPin className="text-primary h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1 text-center md:text-left">
                <h3 className="text-card-foreground text-base font-semibold leading-6">Visit our office</h3>
                <span className="text-muted-foreground text-base underline">192 Griffin Street, Gilbert, AZ 32521</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
