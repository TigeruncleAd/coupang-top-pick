'use client'

import { Logo } from '@repo/ui/components/proBlocks/logo'
import { Button } from '@repo/ui/components/button'
import { Separator } from '@repo/ui/components/separator'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

const MENU_ITEMS = [
  { label: 'Products', href: '#' },
  { label: 'Use cases', href: '#' },
  { label: 'Docs', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'FAQ', href: '#' },
] as const

interface NavMenuItemsProps {
  className?: string
}

const NavMenuItems = ({ className }: NavMenuItemsProps) => (
  <div className={`flex flex-col gap-1 md:flex-row ${className ?? ''}`}>
    {MENU_ITEMS.map(({ label, href }) => (
      <Link key={label} href={href}>
        <Button variant="ghost" className="w-full md:w-auto">
          {label}
        </Button>
      </Link>
    ))}
  </div>
)

export function LpNavbar3() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(prev => !prev)

  return (
    <nav className="bg-background sticky top-0 isolate z-50 py-3.5 md:py-4">
      <div className="container m-auto px-6">
        {/* Main navbar row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Logo />
            </Link>

            {/* Desktop menu */}
            <div className="hidden md:flex">
              <NavMenuItems />
            </div>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden gap-3 md:flex">
            <Link href="/signin">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign up</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            className="flex size-9 items-center justify-center md:hidden"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}>
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="flex flex-col gap-2.5 pt-4 md:hidden">
            <NavMenuItems />
            <Separator className="my-2" />
            <div className="flex flex-col gap-3">
              <Link href="/signin">
                <Button variant="ghost" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="w-full">Sign up</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
