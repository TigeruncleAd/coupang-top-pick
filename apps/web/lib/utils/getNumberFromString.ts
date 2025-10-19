export function getNumberFromString(str: string | null | number | undefined) {
  if (!str) return 0
  if (typeof str === 'number') return str
  if (typeof str === 'string') {
    const numberString = str.replace(/[^0-9]/g, '')
    if (!numberString) return 0
    return parseInt(numberString)
  }
  return 0
}
