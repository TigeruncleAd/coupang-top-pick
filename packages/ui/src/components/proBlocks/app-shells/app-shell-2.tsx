'use client'

import { Logo } from '@repo/ui/components/proBlocks/logo'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar'
import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { Separator } from '@repo/ui/components/separator'
import { Menu, Zap, X, EllipsisVertical } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function Navbar2() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  // Mobile top bar component
  const MobileTopBar = () => (
    <div
      className={`bg-background flex h-14 items-center justify-between px-4 ${
        !isMenuOpen ? 'border-border border-b' : ''
      }`}>
      {/* Mobile menu toggle button */}
      <Button
        variant="ghost"
        onClick={toggleMenu}
        className="relative -ml-2 flex h-9 w-9 items-center justify-center [&_svg]:size-5">
        <span
          className={`absolute transition-all duration-300 ${
            isMenuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
          }`}>
          <Menu />
        </span>
        <span
          className={`absolute transition-all duration-300 ${
            isMenuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
          }`}>
          <X />
        </span>
      </Button>

      {/* Logo */}
      <Logo className="absolute left-1/2 h-8 w-8 -translate-x-1/2 transform" />

      {/* Mobile upgrade button */}
      <div className="absolute right-4 flex items-center gap-3">
        <Button className="h-9 w-9 p-0 [&_svg]:size-5">
          <Zap />
        </Button>
      </div>
    </div>
  )

  // Navigation items component
  const NavItems = ({ isMobile = false }) => {
    const linkClasses = `font-medium ${isMobile ? 'text-base' : 'text-sm'} ${
      isMobile ? 'text-muted-foreground' : 'text-muted-foreground hover:bg-primary/5'
    } px-3 py-2 rounded-md`

    return (
      <>
        {/* Main navigation links */}
        <Link className={linkClasses} href="#">
          Dashboard
        </Link>
        <Link className={linkClasses} href="#">
          Orders
        </Link>
        <Link className={linkClasses} href="#">
          Products
        </Link>
        <Link className={linkClasses} href="#">
          Customers
        </Link>
        <Link href="#" className={`${linkClasses} ${isMobile ? 'text-primary' : 'text-primary'}`}>
          Settings
        </Link>
      </>
    )
  }

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="bg-background border-border hidden h-16 border-b shadow-sm lg:block">
        <div className="container mx-auto flex h-full items-center justify-between px-6">
          {/* Left section: Logo */}
          <div className="flex items-center gap-x-4">
            <Logo />
          </div>
          {/* Right section: user menu and button */}
          <div className="flex items-center gap-x-4">
            <div className="flex items-center gap-x-1">
              <NavItems />
            </div>
            <Button>
              <Zap className="h-4 w-4" /> Upgrade
            </Button>
            {/* User menu dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>My Profile</DropdownMenuItem>
                <DropdownMenuItem>Account</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* New item button */}
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="lg:hidden">
        <MobileTopBar />
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="bg-background border-border border-b lg:hidden">
          <div className="flex flex-col">
            {/* Mobile menu content */}
            <div className="flex-grow overflow-y-auto p-2">
              <div className="flex flex-col">
                <NavItems isMobile={true} />
              </div>
            </div>
            <Separator />
            {/* Mobile user profile section */}
            <div className="p-2">
              {/* User info */}
              <div className="flex items-center space-x-3 p-2">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-muted-foreground text-sm">hi@shadcndesign.com</p>
                </div>
              </div>
              {/* User-related links */}
              <div>
                <Link href="#" className="text-muted-foreground block rounded-md px-2 py-2 font-medium">
                  My profile
                </Link>
                <Link href="#" className="text-muted-foreground block rounded-md px-2 py-2 font-medium">
                  Account settings
                </Link>
                <Link href="#" className="text-muted-foreground block rounded-md px-2 py-2 font-medium">
                  Billing
                </Link>
                <Link href="#" className="text-muted-foreground block rounded-md px-2 py-2 font-medium">
                  Sign out
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PageHeader3() {
  return (
    <div className="bg-background border-border border-b pb-4 pt-0 md:pb-6">
      <nav className="border-border mb-6 border-b">
        <div className="container mx-auto flex overflow-x-auto px-4 lg:px-3">
          <Link href="#" className="border-primary text-foreground flex-shrink-0 border-b-2 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2 md:px-3">Profile</span>
          </Link>
          <Link href="#" className="text-muted-foreground flex-shrink-0 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2 md:px-3">Reports</span>
          </Link>
          <Link href="#" className="text-muted-foreground flex-shrink-0 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2 md:px-3">Analytics</span>
          </Link>
          <Link href="#" className="text-muted-foreground flex-shrink-0 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2 md:px-3">Notifications</span>
          </Link>
          <Link href="#" className="text-muted-foreground flex-shrink-0 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2 md:px-3">Help Center</span>
          </Link>
        </div>
      </nav>
      <div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Profile details</h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Manage your profile details such as name, image, description and settings.
            </p>
          </div>
          <div className="flex flex-row-reverse justify-end gap-2 md:flex-row">
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Share</DropdownMenuItem>
                  <DropdownMenuItem>View</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button variant="outline" className="hidden lg:inline-flex">
              View
            </Button>
            <Button variant="outline">Edit</Button>
            <Button>Save</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppShell2() {
  return (
    <div className="bg-muted">
      <Navbar2 />
      <PageHeader3 />
      <div className="container mx-auto flex flex-col gap-6 px-4 py-6 lg:px-6">
        <div className="bg-background border-border rounded-lg border shadow-sm">
          <div className="pt-4 md:pt-6">
            <div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
              <div className="text-muted-foreground border-border bg-muted w-full rounded-md border border-dashed p-6 text-center">
                Replace this div with your content
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 py-6 lg:px-6">
            <div className="text-muted-foreground border-border bg-muted w-full rounded-md border border-dashed p-6 text-center">
              Replace this div with your content
            </div>
          </div>
          <div className="border-border border-t py-4">
            <div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
              <div className="text-muted-foreground border-border bg-muted w-full rounded-md border border-dashed p-6 text-center">
                Replace this div with your content
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
