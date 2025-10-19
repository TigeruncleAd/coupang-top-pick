'use client'

import { Button } from '@repo/ui/components/button'
import { ArrowUpRight } from 'lucide-react'

// FAQ items data
const faqItems = [
  {
    question: 'What is shadcn/ui?',
    answer:
      'The shadcn/ui is a popular, open-source UI component library for React that focuses on flexibility and customization. It provides a set of accessible, customizable components that you can use to build modern web applications.',
  },
  {
    question: 'What is shadcn/ui kit for Figma?',
    answer:
      'The shadcn/ui kit for Figma is our comprehensive design kit that brings the shadcn/ui components into the Figma environment. It allows designers to create interfaces using shadcn/ui components directly in Figma, ensuring consistency between design and development.',
  },
  {
    question: "I'm not familiar with shadcn/ui. Can I still use this kit?",
    answer:
      'Absolutely! Our kit is intuitive and comes with documentation to help you get started, regardless of your familiarity with Figma or shadcn/ui.',
  },
  {
    question: 'Can I create multi-brand design systems with this UI kit?',
    answer:
      'Yes! Our kit is designed with multi-brand support in mind. You can easily create and manage multiple styles for different brands within a single design system using Figma variables.',
  },
  {
    question: 'How will this kit save me time?',
    answer:
      'By providing pre-built, customizable components and templates, you can skip the repetitive setup work and focus on the unique aspects of your design. Our comprehensive asset library and pre-built screens also help speed up your workflow. What is more you can also save time on development and use shadcn/ui React library to code your designed interfaces.',
  },
  {
    question: 'How does this improve my collaboration with developers?',
    answer:
      'Our components are built to closely match the shadcn/ui library, significantly reducing misinterpretations and implementation errors. This leads to smoother handoffs and fewer back-and-forths between design and development teams.',
  },
]

export function FaqSection3() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="faq-heading">
      <div className="container mx-auto px-6">
        <div className="flex w-full flex-col gap-12 md:gap-16">
          {/* Section Header */}
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            {/* Header Content */}
            <div className="flex max-w-xl flex-col gap-4 text-center md:gap-5 md:text-left">
              {/* Category Tag */}
              <p className="text-muted-foreground text-base font-semibold">FAQ section</p>
              {/* Main Title */}
              <h1 id="faq-heading" className="text-foreground text-3xl font-bold md:text-4xl">
                Frequently asked questions
              </h1>
              {/* Section Description */}
              <p className="text-muted-foreground">
                We've compiled the most important information to help you get the most out of your experience. Can't
                find what you're looking for? Contact us.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 md:flex-row">
              <Button variant="outline" aria-label="Contact our support team">
                Contact us
                <ArrowUpRight />
              </Button>
              <Button variant="outline" aria-label="View documentation">
                View documentation
                <ArrowUpRight />
              </Button>
            </div>
          </div>

          {/* FAQ Grid */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2" role="list">
            {faqItems.map((item, index) => (
              <div key={index} className="flex flex-col gap-2" role="listitem">
                <h3 className="text-card-foreground text-base font-semibold">{item.question}</h3>
                <p className="text-muted-foreground text-base">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
