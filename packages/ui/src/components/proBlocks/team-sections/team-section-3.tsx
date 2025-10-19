'use client'

import { Avatar, AvatarImage } from '@repo/ui/components/avatar'

export function TeamSection3() {
  const teamMembers = [
    {
      name: 'Ricky Smith',
      role: 'CEO',
      image: 'https://github.com/shadcn.png',
    },
    {
      name: 'Kurt Bates',
      role: 'Innovation Specialist',
      image: 'https://github.com/shadcn.png',
    },
    {
      name: 'Dennis Callis',
      role: 'Designer',
      image: 'https://github.com/shadcn.png',
    },
    {
      name: 'Frances Swann',
      role: 'UI/UX Designer',
      image: 'https://github.com/shadcn.png',
    },
    {
      name: 'Corina McCoy',
      role: 'Culture Curator',
      image: 'https://github.com/shadcn.png',
    },
    {
      name: 'Rhonda Rhodes',
      role: 'Innovation Specialist',
      image: 'https://github.com/shadcn.png',
    },
    {
      name: 'Roger Rogers',
      role: 'Laziness Expert',
      image: 'https://github.com/shadcn.png',
    },
  ]

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-12">
          <div className="flex max-w-xl flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-sm font-semibold md:text-base">Team section</p>
            <h2 className="text-foreground text-3xl font-bold md:text-4xl">
              People-powered showcase that builds connection
            </h2>
            <p className="text-muted-foreground">
              Add a concise value statement that highlights your team's expertise and culture while maintaining a
              professional tone. Focus on collective strengths and achievements while keeping it under 2 lines.
            </p>
          </div>

          <div className="flex w-full flex-wrap justify-center gap-12 lg:gap-x-6 lg:gap-y-12">
            {teamMembers.map((member, index) => (
              <div key={index} className="flex w-full flex-col items-center gap-4 text-center md:w-1/3 lg:w-1/5">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="https://github.com/shadcn.png" alt={member.name} />
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-foreground text-base font-semibold">{member.name}</p>
                    <p className="text-muted-foreground text-sm">{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
