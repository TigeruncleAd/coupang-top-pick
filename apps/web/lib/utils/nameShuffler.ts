import { toast } from 'sonner'

export function nameShuffler(name: string) {
  const newName = name.split(' ')

  if (newName.length <= 1) return toast.error('3단어 이상 입력해주세요.')

  if (newName.length === 2) {
    const lastThreeWords = newName?.slice(-2)
    let shuffled = [...lastThreeWords]
    while (shuffled.toString() === lastThreeWords.toString()) {
      shuffled?.sort(() => 0.5 - Math.random())
    }
    const result = newName?.slice(0, -2).concat(shuffled).join(' ')
    return result
  }

  if (newName.length >= 3) {
    const lastThreeWords = newName?.slice(-3)
    let shuffled = [...lastThreeWords]
    while (shuffled.toString() === lastThreeWords.toString()) {
      shuffled?.sort(() => 0.5 - Math.random())
    }
    const result = newName?.slice(0, -3).concat(shuffled).join(' ')
    return result
  }
}
