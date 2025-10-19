export type NaverSearchType = {
  item: {
    productName: string
    productTitle: string
    productTitleOrg: string
    imageUrl: string
    overseaTp: string // 해외면 "1", 국내면 "0"

    originalMallProductId: string
    openDate: string
    officialCertifiedLowPrice: string
    manuTag: string
    isAdult: number
    isAdultExpsRstct: number
    isBrandStore: number
    isHotDeal: number
    keepCnt: number
    maker: string
    makerNo: string
    attributeValue: string
    attributeValueSeqs: string
    brand: string
    brandNo: string
    category1Id: string
    category1Name: string
    category2Id: string
    category2Name: string
    category3Id: string
    category3Name: string
    category4Id: string
    category4Name: string
    categoryLevel: string
    characterValue: string
    comNm: string
    purchaseCnt: number
    wdNm: string

    listPrice: number
    lowPrice: number
    dlvryLowPrice: number
    price: string
    priceUnit: string
    dlvryPrice: string // important

    mallNo: string
    mallCount: string
    mallName: string
    mallNameOrg: string
    mallPcUrl: string // important 몰 주소, id
    mallProdMblUrl: string
    mallProductId: string
    mallProductUrl: string
    mallSectionNo: string

    mallInfoCache: {
      seq: string
      prodCnt: string
      name: string
      mallLogos: {
        REPRESENTATIVE: string
        FORYOU: string
      }
      mallGrade: string
      goodService: boolean
      talkAccountId: string
      adsrType: string
      naverPay: boolean
      npaySellerNo: string
      ssAcntNo: string
    }

    parentId: string
    parentCatalogId: string
  }
  type: string
}
