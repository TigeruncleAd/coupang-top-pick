'use client'

export default function PageTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4 mt-5 space-y-2 pl-4">
      {title && <h1 className="text-3xl font-bold">{title}</h1>}
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  )
}
