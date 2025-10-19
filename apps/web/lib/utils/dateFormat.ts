export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return ''
  if (typeof date === 'string') {
    // 이미 YYYY-MM-DD면 그대로 반환
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
    // ISO 문자열이면 앞 10글자만 반환
    if (/^\d{4}-\d{2}-\d{2}T/.test(date)) return date.slice(0, 10)
    // 기타 문자열은 Date로 변환
    return new Date(date).toISOString().slice(0, 10)
  }
  // Date 객체면
  return date.toISOString().slice(0, 10)
}

export function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${remainingSeconds}초`
  }
  if (minutes > 0) {
    return `${minutes}분 ${remainingSeconds}초`
  }
  return `${remainingSeconds}초`
}
