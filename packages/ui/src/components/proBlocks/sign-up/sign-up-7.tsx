'use client'

import { Logo } from '@repo/ui/components/proBlocks/logo'
import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Input } from '@repo/ui/components/input'
import Link from 'next/link'

export function SignUp7() {
  return (
    <div className="bg-background flex min-h-screen justify-center md:items-center">
      {/* Content wrapper with max width */}
      <div className="w-full max-w-md space-y-8 p-8">
        {/* Header section with logo and text */}
        <div className="flex flex-col items-center gap-6 text-center">
          <Logo />
          {/* Title and subtitle */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold md:text-3xl">Create an account</h2>
            <p className="text-muted-foreground text-sm">
              Let's get started. Fill in the details below to create your account.
            </p>
          </div>
        </div>

        {/* Form inputs section */}
        <div className="space-y-4">
          {/* Name input field */}
          <Input placeholder="Name" />

          {/* Email input field */}
          <Input type="email" placeholder="Email" />

          {/* Password input field with helper text */}
          <div className="space-y-2">
            <Input type="password" placeholder="Password" />
            <p className="text-muted-foreground text-sm">Minimum 8 characters.</p>
          </div>

          {/* Terms and conditions checkbox with link */}
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <label htmlFor="terms" className="text-sm leading-none ">
              I agree to the{' '}
              <Link href="#" className="underline">
                Terms & Conditions
              </Link>
            </label>
          </div>
        </div>

        {/* Footer section with sign up button and sign in link */}
        <div className="space-y-6">
          <Button className="w-full">Sign up</Button>
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{' '}
            <Link href="#" className="text-primary underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
