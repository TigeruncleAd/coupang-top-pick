export const borderStyle = {
  style: 'thin',
  color: 'FFFFFF',
}
export const border = {
  top: borderStyle,
  bottom: borderStyle,
  right: borderStyle,
  left: borderStyle,
}

export const boldFont = {
  font: {
    name: '맑은 고딕',
    sz: 11,
    bold: true,
  },
  alignment: {
    vertical: 'center',
    horizontal: 'center',
  },
  fill: {
    patternType: 'solid',
    fgColor: {
      rgb: 'FFFFDB',
    },
  },
  border,
}

export const normalFont = {
  font: {
    name: '맑은 고딕',
  },
  alignment: {
    vertical: 'center',
    horizontal: 'center',
  },
  border,
}
