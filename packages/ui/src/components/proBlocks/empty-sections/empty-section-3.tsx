'use client'

import { useState } from 'react'
import { Avatar, AvatarImage } from '@repo/ui/components/avatar'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Card } from '@repo/ui/components/card'
import { Users, Plus } from 'lucide-react'

interface MemberCardProps {
  name: string
  role: string
  avatarUrl: string
  onAdd: () => void
}

function MemberCard({ name, role, avatarUrl, onAdd }: MemberCardProps) {
  return (
    <Card className="p-4 md:p-6">
      <div className="relative flex flex-col items-start gap-3 md:flex-row md:items-center">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl} alt={name} />
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{name}</h3>
          <p className="text-muted-foreground text-sm">{role}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onAdd} className="absolute right-0 top-0 md:static">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

interface InviteFormProps {
  onSubmit: (email: string) => void
}

function InviteForm({ onSubmit }: InviteFormProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      onSubmit(email)
      setEmail('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 md:flex-row">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className=""
        required
      />
      <Button type="submit">Send invite</Button>
    </form>
  )
}

export function EmptySection3() {
  const handleInvite = (email: string) => {
    // Handle invite logic here
    console.log('Sending invite to:', email)
  }

  const handleAddMember = (name: string) => {
    // Handle add member logic here
    console.log('Adding member:', name)
  }

  const suggestedMembers = [
    {
      name: 'Kurt Bates',
      role: 'Innovation Specialist',
      avatarUrl: 'https://github.com/shadcn.png',
    },
    {
      name: 'Dennis Callis',
      role: 'Designer',
      avatarUrl: 'https://github.com/shadcn.png',
    },
    {
      name: 'Frances Swann',
      role: 'UI/UX Designer',
      avatarUrl: 'https://github.com/shadcn.png',
    },
  ]

  return (
    <section className="bg-background py-12">
      {' '}
      {/* Add border border-border shadow-sm and rounded-lg class to make this section look like a card */}
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 md:px-6">
        <div className="flex w-full flex-col items-center space-y-6">
          <div className="bg-card flex h-12 w-12 items-center justify-center rounded-md border shadow-sm">
            <Users className="text-foreground h-6 w-6" />
          </div>

          <div className="flex flex-col items-center space-y-1 text-center">
            <h2 className="text-foreground text-lg font-semibold md:text-xl">Add members</h2>
            <p className="text-muted-foreground text-sm">Add the first person to start creating your team.</p>
          </div>

          <InviteForm onSubmit={handleInvite} />
        </div>

        <div className="mt-8 w-full space-y-4">
          {suggestedMembers.map(member => (
            <MemberCard key={member.name} {...member} onAdd={() => handleAddMember(member.name)} />
          ))}
        </div>
      </div>
    </section>
  )
}
