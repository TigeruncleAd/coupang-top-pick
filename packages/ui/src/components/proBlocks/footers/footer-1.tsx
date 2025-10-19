'use client'

import { Logo } from '@repo/ui/components/proBlocks/logo'
import Link from 'next/link'
import { Separator } from '@repo/ui/components/separator'

export function Footer1() {
  return (
    <footer className="bg-background py-16 lg:py-24" role="contentinfo" aria-label="Site footer">
      <div className="container mx-auto flex flex-col gap-12 px-6 lg:gap-16">
        {/* Top Section */}
        <div className="flex w-full flex-col items-center gap-12 text-center">
          {/* Logo Section */}
          <Link href="/" aria-label="Go to homepage">
            <Logo />
          </Link>

          {/* Main Navigation */}
          <nav className="flex flex-col items-center gap-8 md:flex-row" aria-label="Footer navigation">
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Products
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Services
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>
        </div>

        {/* Section Divider */}
        <Separator role="presentation" />

        {/* Bottom Section */}
        <div className="flex w-full flex-col-reverse items-center gap-12 lg:flex-row lg:justify-between lg:gap-6">
          {/* Copyright Text */}
          <p className="text-muted-foreground text-center lg:text-left">
            <span>Copyright © {new Date().getFullYear()}</span>{' '}
            <Link href="/" className="hover:underline">
              shadcndesign.com
            </Link>
            . All rights reserved.
          </p>

          {/* Legal Navigation */}
          <nav className="flex flex-col items-center gap-6 md:flex-row md:gap-8" aria-label="Legal links">
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
    </footer>
  )
}
