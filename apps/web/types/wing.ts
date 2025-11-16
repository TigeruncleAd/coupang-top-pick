// WING Pre-matching Search API response types

export interface WingDisplayCategoryInfo {
  leafCategoryCode: number
  rootCategoryCode: number
  categoryHierarchy: string
}

export type WingDeliveryMethod = 'DOMESTIC' | 'OVERSEAS' | string

export interface WingProductSummary {
  productId: number
  productName: string
  brandName?: string | null
  itemId: number
  itemName?: string | null
  displayCategoryInfo: WingDisplayCategoryInfo[]
  manufacture?: string | null
  categoryId: number
  itemCountOfProduct: number
  imagePath: string
  matchType?: string | null
  salePrice: number
  vendorItemId: number
  ratingCount?: number | null
  rating?: number | null
  sponsored?: boolean | null
  matchingResultId?: number | string | null
  pvLast28Day?: number | null
  salesLast28d?: number | null
  deliveryMethod?: WingDeliveryMethod | null
  attributeTypes?: unknown | null
  optionOrder?: string[]
  rocketAttributeValues?: string[]
  rocketAttributeMaps?: Array<Array<{ attributeTypeId: number; attributeName: string; attributeValue: string }>>
  firstAttributeValue?: string | null
   goodAttributeValues?: string[]
}

export interface WingPreMatchingSearchResult {
  nextSearchPage: number
  result: WingProductSummary[]
}

// Envelope returned by content script to the web via extension
export interface WingSearchHttpEnvelope {
  ok: boolean
  status: number
  data: WingPreMatchingSearchResult
  keyword?: string
}

// Product-items detail API response types

export interface WingItemAttribute {
  attributeTypeId: number
  attributeName: string
  attributeValue: string
}

export interface WingItemControlFlags {
  DELIVERY_SOURCE: string
  DO_NOT_MERGE: string
  MAIN_LOCALE: string
  VALID: string
  HAS_ROD?: string
  HAS_RETAIL?: string
  HAS_JIKGU?: string
  BAD_ATTRIBUTE?: string
}

export interface WingProductItem {
  itemId: number
  buyboxWinnerPrice: number | null
  itemBuyboxCompetitorCount: number
  itemImage: string
  deliveryMethod: WingDeliveryMethod
  attributes: WingItemAttribute[]
  controlFlags: WingItemControlFlags
  vendorItemIds: number[]
}

export interface WingProductItemsDetail {
  productId: number
  productName: string
  categoryPath: string
  brand: string
  manufacture: string
  productImage: string
  productRating: number
  ratingCount: number
  deliveryMethod: WingDeliveryMethod
  items: WingProductItem[]
}

export interface WingProductItemsHttpEnvelope {
  ok: boolean
  status: number
  data: WingProductItemsDetail
}
