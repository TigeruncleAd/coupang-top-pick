'use client'

import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/components/dropdown-menu'
import { Input } from '@repo/ui/components/input'
import { Separator } from '@repo/ui/components/separator'
import Link from 'next/link'
import { useState } from 'react'

export function SignIn10() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    // Main container
    <div className="bg-muted items-top flex min-h-screen justify-center pt-16">
      {/* Dropdown menu for sign-in form */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        {/* Trigger button for dropdown */}
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Sign in</Button>
        </DropdownMenuTrigger>
        {/* Dropdown content */}
        <DropdownMenuContent className="w-screen rounded-none border-none p-6 md:w-[320px] md:rounded-lg md:border">
          <div className="grid gap-4">
            {/* Sign-in form title */}
            <h2 className="text-lg font-bold">Sign in</h2>
            {/* Email input field */}
            <Input id="email" placeholder="Email" type="email" />
            {/* Password input field */}
            <Input id="password" placeholder="Password" type="password" />
            {/* Remember me checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <label htmlFor="remember" className="text-sm font-medium leading-none">
                Remember me
              </label>
            </div>
            {/* Sign-in button */}
            <Button>Sign in</Button>
            {/* Forgot password link */}
            <div className="text-center">
              <Link href="#" className="text-muted-foreground hover:text-foreground text-sm underline">
                Forgot password?
              </Link>
            </div>
            <Separator />
            {/* Sign-up section */}
            <div>
              <p className="text-muted-foreground text-center text-sm">Don't have an account?</p>
              {/* Sign-up button */}
              <Button variant="secondary" className="mt-2 w-full">
                Sign up
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
