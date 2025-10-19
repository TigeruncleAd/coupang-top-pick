export function getRecommendedPrice({
  originalPrice,
  cnyCurrency,
  deliveryAgencyFee = 7000,
}: {
  originalPrice: any
  cnyCurrency: number
  deliveryAgencyFee?: number
}) {
  if (!originalPrice || !cnyCurrency) return null
  const price = Number(originalPrice) * cnyCurrency * 1.41 + (deliveryAgencyFee || 7000)
  // ceil on 1000
  return Math.ceil(price / 100) * 100
  // return `￦${ceilPrice.toLocaleString('ko-KR').split('.')[0]}`
}
