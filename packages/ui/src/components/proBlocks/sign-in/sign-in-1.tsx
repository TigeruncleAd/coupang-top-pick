'use client'

import { Logo } from '@repo/ui/components/proBlocks/logo'
import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import Image from 'next/image'
import Link from 'next/link'

export function SignIn1() {
  return (
    <div className="bg-background gap-x-6 py-6 md:flex md:min-h-screen md:p-6">
      {/* Left side: Sign-in form */}
      <div className="flex items-center justify-center md:w-1/2">
        <div className="w-full max-w-sm px-6 py-16 md:p-0 ">
          {/* Header section with logo and title */}
          <div className="mb-6 space-y-6">
            <Link href="https://www.shadcndesign.com/" target="_blank">
              <Logo />
            </Link>
            {/* Title and description */}
            <div className="flex flex-col gap-y-3">
              <h1 className="text-2xl font-bold md:text-3xl">Sign in</h1>
              <p className="text-muted-foreground text-sm">
                Log in to unlock tailored content and stay connected with your community.
              </p>
            </div>
          </div>
          {/* Sign-in form */}
          <div className="mb-6 space-y-4">
            {/* Email input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="Email" type="email" />
            </div>
            {/* Password input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" placeholder="Password" type="password" />
            </div>
            {/* Remember me checkbox and Forgot password link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="keep-signed-in" />
                <Label htmlFor="keep-signed-in" className="text-sm font-medium">
                  Keep me signed in
                </Label>
              </div>
              <Link href="#" className="text-muted-foreground hover:text-foreground text-sm underline">
                Forgot password?
              </Link>
            </div>
          </div>
          {/* Sign-in button and Sign-up link */}
          <div className="flex flex-col space-y-4">
            <Button className="w-full">Sign in</Button>
            <p className="text-muted-foreground text-center text-sm">
              Don't have an account?{' '}
              <Link className="text-foreground underline" href="#">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Right side: Image (hidden on mobile) */}
      <Image
        src="https://ui.shadcn.com/placeholder.svg"
        alt="Image"
        width="1800"
        height="1800"
        className="hidden w-1/2 rounded-xl object-cover md:block"
      />
    </div>
  )
}
