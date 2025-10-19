export function appendTopBottomImagesToDetail(detail: string, topImages?: string[], bottomImages?: string[]) {
  try {
    // 첫 번째 <div> 태그를 찾아서 내용 삽입
    const firstDivIndex = detail.indexOf('<div')
    if (firstDivIndex === -1) return detail

    const firstClosingBracket = detail.indexOf('>', firstDivIndex)
    if (firstClosingBracket === -1) return detail
    const imageStyle = {
      width: '100%',
      maxWidth: '100%',
      marginTop: '10px',
      marginBottom: '10px',
    }

    const styleString = Object.entries(imageStyle)
      .map(([key, value]) => `${key}: ${value}`)
      .join(';')

    // 상단 이미지 HTML 생성
    const topImagesHtml = topImages?.length
      ? topImages.map(img => `<img src="${img}" alt="상품 상단 설명" style="${styleString}" />`).join('')
      : ''

    // 하단 이미지 HTML 생성
    const bottomImagesHtml = bottomImages?.length
      ? bottomImages.map(img => `<img src="${img}" alt="상품 하단 설명" style="${styleString}" />`).join('')
      : ''

    // HTML 조합
    const result =
      detail.slice(0, firstClosingBracket + 1) +
      topImagesHtml +
      detail.slice(firstClosingBracket + 1, -6) + // '</div>' 길이인 6을 뺌
      bottomImagesHtml +
      '</div>'

    return result
  } catch (error) {
    console.error('상세 내용 처리 중 오류:', error)
    return detail
  }
}
