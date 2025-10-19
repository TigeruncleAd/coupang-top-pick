'use client'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { Textarea } from '@repo/ui/components/textarea'
import { Checkbox } from '@repo/ui/components/checkbox'
import Link from 'next/link'

export function ContactSection1() {
  return (
    <section className="bg-background py-16 lg:py-24" aria-labelledby="contact-heading">
      <div className="mx-auto max-w-xl px-6">
        <div className="flex flex-col items-center gap-10">
          {/* Section Header */}
          <div className="flex flex-col gap-4 md:gap-5 md:text-center">
            {/* Category Tag */}
            <p className="text-muted-foreground text-sm font-semibold md:text-base">Contact us</p>

            {/* Main Title */}
            <h1 id="contact-heading" className="text-3xl font-bold md:text-4xl">
              Get in touch
            </h1>

            {/* Section Description */}
            <p className="text-muted-foreground text-base leading-6">
              Write one or two welcoming sentences that encourage contact. Include your response time commitment and
              highlight your team's readiness to help.
            </p>
          </div>

          {/* Contact Form */}
          <form className="flex w-full flex-col gap-5" onSubmit={e => e.preventDefault()} aria-label="Contact form">
            {/* Name Input */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Name" required aria-required="true" />
            </div>

            {/* Email Input */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="Email" type="email" required aria-required="true" />
            </div>

            {/* Message Textarea */}
            <div className="grid gap-2">
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
            <div className="flex items-start gap-2">
              <Checkbox id="privacy" required aria-required="true" />
              <Label htmlFor="privacy" className="text-muted-foreground font-normal leading-none">
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
    </section>
  )
}
