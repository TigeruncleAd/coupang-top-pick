'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Logo } from '@repo/ui/components/proBlocks/logo'
import { Button } from '@repo/ui/components/button'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar'
import { Card } from '@repo/ui/components/card'
import { Separator } from '@repo/ui/components/separator'
import { Input } from '@repo/ui/components/input'
import { AspectRatio } from '@repo/ui/components/aspect-ratio'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@repo/ui/components/accordion'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@repo/ui/components/tooltip'
import {
  Rotate3D,
  ArrowLeftRight,
  Database,
  Combine,
  Menu,
  X,
  ArrowRight,
  Workflow,
  Check,
  Info,
  PenLine,
  ListTodo,
} from 'lucide-react'
import '../patterns/patterns-example.css'

// Pricing data
const pricingData = {
  plans: [
    {
      name: 'Starter',
      description: 'For individuals or small teams getting started.',
      features: [
        {
          name: 'Basic task management',
          tooltip: 'Essential task management features for individuals and small teams',
        },
        {
          name: '1 automation per workflow',
          tooltip: 'Create one automated workflow to streamline your processes',
        },
        {
          name: '5GB storage',
          tooltip: 'Store your files and documents securely in the cloud',
        },
      ],
      pricing: {
        monthly: 0,
        annually: 0,
      },
      variant: 'secondary',
    },
    {
      name: 'Pro',
      description: 'For growing teams ready to scale their business.',
      badge: 'Most popular',
      features: [
        {
          name: 'Unlimited boards',
          tooltip: 'Create as many boards as you need for your team',
        },
        {
          name: 'Advanced automation',
          tooltip: 'Create complex automated workflows to save time',
        },
        {
          name: '50GB storage',
          tooltip: "Expanded storage for all your team's needs",
        },
        {
          name: 'Integrations',
          tooltip: 'Connect with your favorite tools and services',
        },
      ],
      pricing: {
        monthly: 29,
        annually: 290,
      },
      variant: 'default',
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with custom needs.',
      features: [
        {
          name: 'Dedicated support',
          tooltip: 'Get priority support from our dedicated team',
        },
        {
          name: 'Custom workflows',
          tooltip: 'Build custom workflows tailored to your organization',
        },
        {
          name: '150GB storage',
          tooltip: 'Enterprise-grade storage for large teams',
        },
        {
          name: 'Advanced security',
          tooltip: 'Enhanced security features for enterprise needs',
        },
      ],
      pricing: {
        monthly: 129,
        annually: 1290,
      },
      variant: 'secondary',
    },
  ],
}

export function LandingPage1() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Navbar1 />
      <main>
        <HeroSection7 />
        <FeatureSection9 />
        <FeatureSection3 />
        <TestimonialsSection5 />
        <PricingSection4 />
        <FaqSection1 />
      </main>
      <Footer2 />
    </div>
  )
}

// You can import your components in the import section at the top of the file too, we placed them in here for the sake of the example

function Navbar1() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(prev => !prev)

  const MENU_ITEMS = [
    { label: 'Features', href: '#features' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ] as const

  interface NavMenuItemsProps {
    className?: string
  }

  const NavMenuItems = ({ className }: NavMenuItemsProps) => (
    <div className={`flex flex-col gap-1 md:flex-row ${className ?? ''}`}>
      {MENU_ITEMS.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          className="w-full md:w-auto"
          onClick={e => {
            e.preventDefault()
            document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
          }}>
          <Button variant="ghost" className="w-full md:w-auto">
            {label}
          </Button>
        </a>
      ))}
    </div>
  )

  return (
    <nav className="bg-background border-border sticky top-0 isolate z-50 border-b py-3.5 md:py-4">
      <div className="container relative m-auto flex flex-col justify-between gap-4 px-6 md:flex-row md:items-center md:gap-6">
        <div className="flex justify-between">
          <a
            href="#top"
            onClick={e => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}>
            <Logo />
          </a>
          <Button
            variant="ghost"
            className="flex size-9 items-center justify-center md:hidden"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}>
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden w-full flex-row justify-end gap-5 md:flex">
          <NavMenuItems />
          <Link href="#">
            <Button>Get started</Button>
          </Link>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="flex w-full flex-col justify-end gap-5 pb-2.5 md:hidden">
            <NavMenuItems />
            <Link href="#">
              <Button className="w-full">Get started</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

function HeroSection7() {
  return (
    <section
      className="bg-background pattern-background-lp-1-example py-16 lg:py-24"
      id="top"
      aria-labelledby="hero-heading">
      <div className="container mx-auto flex flex-col items-center gap-12 px-6 lg:gap-16">
        <div className="flex gap-12 lg:gap-16">
          <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:gap-8">
            <h1 id="hero-heading" className="text-foreground flex-1 text-3xl font-bold lg:text-5xl">
              Work smarter, not harder with <span className="text-primary">Flowly</span>
            </h1>
            <div className="flex w-full flex-1 flex-col gap-8">
              <p className="text-muted-foreground text-base lg:text-lg">
                Automate workflows, streamline tasks, and collaborate seamlessly – all in one platform.
              </p>

              <div className="flex flex-col gap-3 lg:flex-row">
                <Button>Start free trial</Button>
                <Button variant="ghost">
                  Explore
                  <ArrowRight />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <AspectRatio ratio={16 / 9}>
          <Image
            src="https://ui.shadcn.com/placeholder.svg"
            alt="Hero section visual"
            fill
            priority
            className="h-full w-full rounded-xl object-cover"
          />
        </AspectRatio>
      </div>
    </section>
  )
}

function FeatureSection9() {
  return (
    <section id="features" className="bg-muted/40 py-16 md:py-24">
      <div className="container mx-auto flex flex-col gap-12 px-6 md:gap-16">
        <div className="mx-auto flex max-w-xl flex-col gap-4 text-center md:gap-5">
          <p className="text-muted-foreground text-sm font-semibold md:text-base">Features</p>
          <h2 className="text-foreground text-3xl font-bold md:text-4xl">Why choose Flowly?</h2>
          <p className="text-muted-foreground text-base">
            Transform the way your team works with these powerful features:
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
              <Rotate3D className="text-primary h-5 w-5" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-foreground font-semibold">Workflow automation</h3>
              <p className="text-muted-foreground">
                Eliminate repetitive tasks and save time with customizable automation.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
              <ArrowLeftRight className="text-primary h-5 w-5" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-foreground font-semibold">Real-time collaboration</h3>
              <p className="text-muted-foreground">Keep your team in sync with shared boards and instant updates.</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
              <Database className="text-primary h-5 w-5" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-foreground font-semibold">Data-driven insights</h3>
              <p className="text-muted-foreground">Track progress and measure success with advanced analytics.</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
              <Combine className="text-primary h-5 w-5" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-foreground font-semibold">Easy integration</h3>
              <p className="text-muted-foreground">
                Connect seamlessly with tools like Slack, Google Workspace, and Trello.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureSection3() {
  return (
    <section className="bg-background border-border border-b py-16 md:py-24">
      <div className="container mx-auto flex flex-col items-center gap-12 px-6 md:gap-16 lg:flex-row">
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col gap-4 md:gap-5">
            <p className="text-muted-foreground text-sm font-semibold md:text-base">Steps</p>
            <h2 className="text-foreground text-3xl font-bold md:text-4xl">Getting started is easy!</h2>
            <p className="text-muted-foreground text-base">In just 2 simple steps, you're ready to go:</p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
              <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
                <PenLine className="text-primary h-5 w-5" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-foreground font-semibold">Sign up</h3>
                <p className="text-muted-foreground">Create your account in under 2 minutes.</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
              <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
                <ListTodo className="text-primary h-5 w-5" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-foreground font-semibold">Set up your workflow</h3>
                <p className="text-muted-foreground">Customize tasks, boards, and automations to fit your team.</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
              <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
                <Workflow className="text-primary h-5 w-5" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-foreground font-semibold">Start collaborating</h3>
                <p className="text-muted-foreground">Work smarter with your team and watch your productivity soar.</p>
              </div>
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

function TestimonialsSection5() {
  return (
    <section id="testimonials" className="bg-background py-16 md:py-24" aria-labelledby="testimonial-title">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-12">
          <div className="flex max-w-xl flex-col gap-4 text-center md:gap-5 md:text-left">
            <p className="text-muted-foreground text-sm font-semibold leading-[20px] md:text-base md:leading-6">
              Testimonials
            </p>
            <h2 id="testimonial-title" className="text-3xl font-bold md:text-4xl">
              Trusted by the best teams
            </h2>
          </div>

          <div className="flex flex-col gap-8 md:flex-row md:gap-12">
            {/* First Testimonial */}
            <div className="flex flex-col gap-8">
              <p className="text-foreground text-center text-lg font-medium leading-7 md:text-left">
                &quot;Flowly helped us save 10+ hours per week by automating our repetitive tasks. We can't imagine
                going back!&quot;
              </p>

              <div className="flex flex-col items-center gap-5 md:flex-row">
                <Avatar className="h-14 w-14">
                  <AvatarImage src="https://github.com/shadcn.png" alt="Kurt Bates" />
                  <AvatarFallback>KB</AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-1 text-center md:text-left">
                  <p className="text-foreground text-base font-semibold leading-6">Kurt Bates</p>
                  <p className="text-muted-foreground text-base leading-6">Marketing Manager at BrightIdeas Inc.</p>
                </div>
              </div>
            </div>

            <div className="bg-border hidden w-[1px] self-stretch md:block" />
            <Separator className="bg-border md:hidden" orientation="horizontal" />

            {/* Second Testimonial */}
            <div className="flex flex-col gap-8">
              <p className="text-foreground text-center text-lg font-medium leading-7 md:text-left">
                &quot;This tool is a game-changer for our remote team. The workflow automations are insanely good.&quot;
              </p>

              <div className="flex flex-col items-center gap-5 md:flex-row">
                <Avatar className="h-14 w-14">
                  <AvatarImage src="https://github.com/shadcn.png" alt="Alex Buckmaster" />
                  <AvatarFallback>AB</AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-1 text-center md:text-left">
                  <p className="text-foreground text-base font-semibold leading-6">Alex Buckmaster</p>
                  <p className="text-muted-foreground text-base leading-6">Founder of TechWave</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PricingSection4() {
  const [billingPeriod, setBillingPeriod] = React.useState('monthly')

  return (
    <section
      id="pricing"
      className="bg-muted/40 pattern-background-lp-1-example py-16 md:py-24"
      aria-labelledby="pricing-section-title-4">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-8">
          {/* Section Header */}
          <div className="flex max-w-xl flex-col items-center gap-4 text-center md:gap-5">
            <p className="text-muted-foreground text-base font-semibold">Pricing</p>
            <h2 id="pricing-section-title-4" className="text-3xl font-bold md:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-base">Choose a plan that fits your team's needs.</p>
          </div>

          {/* Billing Period Toggle Switch */}
          <Tabs value={billingPeriod} onValueChange={setBillingPeriod} className="w-fit">
            <TabsList className="bg-muted h-10 rounded-[40px] p-1">
              <TabsTrigger
                value="monthly"
                className="data-[state=active]:bg-background rounded-full px-3 py-1.5 data-[state=active]:shadow-sm">
                Monthly
              </TabsTrigger>
              <TabsTrigger
                value="annually"
                className="data-[state=active]:bg-background rounded-full px-3 py-1.5 data-[state=active]:shadow-sm">
                Annually
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Horizontal Pricing Cards Layout - Stacks on mobile */}
          <div className="mx-auto flex w-full flex-col gap-6 lg:max-w-5xl lg:flex-row">
            {pricingData.plans.map((plan, index) => (
              <Card key={plan.name} className={`space-y-8 p-8 ${index === 2 ? 'bg-foreground text-background' : ''}`}>
                {/* Plan Content Container */}
                <div className="space-y-6">
                  {/* Plan Title and Description Block */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold leading-7">{plan.name}</h3>
                    <p className={`text-sm leading-5 ${index === 2 ? 'opacity-70' : 'text-muted-foreground'}`}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price Display with Currency and Period */}
                  <div className="flex items-end gap-0.5">
                    <span className="text-4xl font-semibold leading-10">
                      ${billingPeriod === 'monthly' ? plan.pricing.monthly : plan.pricing.annually}
                    </span>
                    <span className={`text-base leading-6 ${index === 2 ? 'opacity-70' : 'text-muted-foreground'}`}>
                      /{billingPeriod === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>

                  {/* Call-to-Action Button */}
                  <Button variant={index === 2 ? 'secondary' : 'default'} className="w-full">
                    Purchase plan
                  </Button>
                </div>

                {/* Features List Section */}
                <div className="space-y-4">
                  {/* Features Header with Plan Inheritance */}
                  <p className="text-sm font-medium">
                    {index === 0 ? "What's included:" : `Everything in ${pricingData?.plans[index - 1]?.name}, plus:`}
                  </p>
                  {/* Features Grid with Tooltips */}
                  <div className="flex flex-col gap-4">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className={`h-5 w-5 ${index === 2 ? '' : 'text-primary'}`} />
                        <span className={`flex-1 text-sm ${index === 2 ? 'opacity-70' : 'text-muted-foreground'}`}>
                          {feature.name}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info
                                className={`h-4 w-4 ${index === 2 ? 'opacity-40' : 'text-muted-foreground opacity-70'}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{feature.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqSection1() {
  return (
    <section id="faq" className="bg-background py-16 md:py-24" aria-labelledby="faq-heading">
      <div className="mx-auto flex max-w-2xl flex-col gap-12 px-6">
        {/* Section Header */}
        <div className="flex flex-col gap-5 text-center">
          <p className="text-muted-foreground text-sm font-semibold md:text-base">FAQ</p>
          <h1 id="faq-heading" className="text-foreground text-3xl font-bold md:text-4xl">
            Got questions? We've got answers.
          </h1>
          <p className="text-muted-foreground">
            We've compiled the most important information to help you get the most out of your experience. Can't find
            what you're looking for?{' '}
            <Link href="#" className="text-primary underline">
              Contact us.
            </Link>
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" defaultValue="item-1" aria-label="FAQ items">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left text-base font-medium">Is Flowly free to use?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              Yes! We offer a free plan with essential features to get you started.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left text-base font-medium">Can I cancel anytime?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              Yes, you can cancel your subscription at any time with no questions asked.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left text-base font-medium">
              Do you offer discounts for nonprofits or education?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              Yes, we offer special pricing for nonprofit organizations and educational institutions.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left text-base font-medium">
              What integrations does Flowly support?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              Flowly integrates with popular tools like Slack, Google Workspace, and Trello, among others.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* CTA Card */}
        <div className="bg-muted/60 flex w-full flex-col items-center gap-6 rounded-xl p-6 md:p-8">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-foreground text-2xl font-bold">Still have questions?</h2>
            <p className="text-muted-foreground text-base">
              Have questions or need assistance? Our team is here to help!
            </p>
          </div>
          <Button aria-label="Contact our support team">Contact us</Button>
        </div>
      </div>
    </section>
  )
}

function Footer2() {
  return (
    <footer className="bg-muted/40 border-border border-t py-16 lg:py-24" role="contentinfo" aria-label="Site footer">
      <div className="container mx-auto flex flex-col gap-12 px-6 lg:gap-16">
        <div className="flex flex-col gap-12">
          {/* Top Section */}
          <div className="flex flex-col gap-12 md:items-center md:justify-between lg:flex-row">
            {/* Logo and Navigation */}
            <div className="flex flex-col items-center gap-12 lg:flex-row">
              <a
                href="#top"
                onClick={e => {
                  e.preventDefault()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                aria-label="Go to homepage">
                <Logo />
              </a>

              {/* Main Navigation */}
              <nav
                className="flex flex-col items-center gap-6 text-center md:flex-row md:gap-8"
                aria-label="Footer navigation">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={e => {
                    e.preventDefault()
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}>
                  Home
                </a>
                <a
                  href="#features"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={e => {
                    e.preventDefault()
                    document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })
                  }}>
                  Features
                </a>
                <a
                  href="#testimonials"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={e => {
                    e.preventDefault()
                    document.querySelector('#testimonials')?.scrollIntoView({ behavior: 'smooth' })
                  }}>
                  Testimonials
                </a>
                <a
                  href="#pricing"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={e => {
                    e.preventDefault()
                    document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' })
                  }}>
                  Pricing
                </a>
                <a
                  href="#faq"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={e => {
                    e.preventDefault()
                    document.querySelector('#faq')?.scrollIntoView({ behavior: 'smooth' })
                  }}>
                  FAQ
                </a>
              </nav>
            </div>

            {/* Newsletter Form */}
            <form
              className="flex w-full flex-col gap-2 md:w-auto md:flex-row"
              onSubmit={e => e.preventDefault()}
              aria-label="Newsletter subscription form">
              <Input
                type="email"
                placeholder="Your email"
                className="md:w-[242px]"
                required
                aria-required="true"
                aria-label="Enter your email for newsletter"
              />
              <Button type="submit" className="w-full md:w-auto" aria-label="Subscribe to our newsletter">
                Subscribe
              </Button>
            </form>
          </div>

          <Separator role="presentation" />

          {/* Bottom Section */}
          <div className="flex flex-col items-center justify-between gap-12 text-center lg:flex-row">
            <p className="text-muted-foreground order-2 md:order-1">
              <span>Copyright © {new Date().getFullYear()}</span>{' '}
              <Link href="/" className="hover:underline">
                shadcndesign.com
              </Link>
              . All rights reserved.
            </p>

            <nav
              className="order-1 flex flex-col items-center gap-6 md:order-2 md:flex-row md:gap-8"
              aria-label="Legal links">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Cookies Settings
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
