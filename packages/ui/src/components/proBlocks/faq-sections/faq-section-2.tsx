'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@repo/ui/components/accordion'
import Link from 'next/link'

export function FaqSection2() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="faq-heading">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-16">
          {/* Left Column */}
          <div className="flex flex-1 flex-col gap-5">
            {/* Category Tag */}
            <p className="text-muted-foreground text-sm font-semibold md:text-base">FAQ section</p>
            {/* Main Title */}
            <h1 id="faq-heading" className="text-foreground text-3xl font-bold md:text-4xl">
              Frequently asked questions
            </h1>
            {/* Section Description */}
            <p className="text-muted-foreground">
              We've compiled the most important information to help you get the most out of your experience. Can't find
              what you're looking for?{' '}
              <Link href="#" className="text-primary underline">
                Contact us.
              </Link>
            </p>
          </div>

          {/* Right Column */}
          <div className="flex flex-1 flex-col gap-8">
            {/* General FAQ Section */}
            <div className="flex flex-col gap-2">
              {/* Section Title */}
              <h2 className="text-foreground text-lg font-semibold md:text-xl">General</h2>
              {/* FAQ Accordion */}
              <Accordion type="single" collapsible aria-label="General FAQ items">
                {/* FAQ Item 1 */}
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">What is shadcn/ui?</AccordionTrigger>
                  <AccordionContent>Content goes here</AccordionContent>
                </AccordionItem>

                {/* FAQ Item 2 */}
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">What is shadcn/ui kit for Figma?</AccordionTrigger>
                  <AccordionContent>Content goes here</AccordionContent>
                </AccordionItem>

                {/* FAQ Item 3 */}
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">
                    I'm not familiar with shadcn/ui. Can I still use this kit?
                  </AccordionTrigger>
                  <AccordionContent>Content goes here</AccordionContent>
                </AccordionItem>

                {/* FAQ Item 4 */}
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    Can I create multi-brand design systems with this UI kit?
                  </AccordionTrigger>
                  <AccordionContent>Content goes here</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Billing FAQ Section */}
            <div className="flex flex-col gap-2">
              {/* Section Title */}
              <h2 className="text-foreground text-lg font-semibold md:text-xl">Billing</h2>
              {/* FAQ Accordion */}
              <Accordion type="single" collapsible aria-label="Billing FAQ items">
                {/* FAQ Item 1 */}
                <AccordionItem value="billing-1">
                  <AccordionTrigger className="text-left">What is shadcn/ui?</AccordionTrigger>
                  <AccordionContent>Content goes here</AccordionContent>
                </AccordionItem>

                {/* FAQ Item 2 */}
                <AccordionItem value="billing-2">
                  <AccordionTrigger className="text-left">What is shadcn/ui kit for Figma?</AccordionTrigger>
                  <AccordionContent>Content goes here</AccordionContent>
                </AccordionItem>

                {/* FAQ Item 3 */}
                <AccordionItem value="billing-3">
                  <AccordionTrigger className="text-left">
                    I'm not familiar with shadcn/ui. Can I still use this kit?
                  </AccordionTrigger>
                  <AccordionContent>Content goes here</AccordionContent>
                </AccordionItem>

                {/* FAQ Item 4 */}
                <AccordionItem value="billing-4">
                  <AccordionTrigger className="text-left">
                    Can I create multi-brand design systems with this UI kit?
                  </AccordionTrigger>
                  <AccordionContent>Content goes here</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
