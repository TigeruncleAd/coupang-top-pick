import { createContext } from 'react'

interface Props {
  children: React.ReactNode
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-title-2 w-full pb-[16px] pt-[24px]">{children}</h2>
}

export default function Section({ children }: Props) {
  return <section className="bg-color-bg-white w-full px-[16px]">{children}</section>
}

Section.Title = SectionTitle
