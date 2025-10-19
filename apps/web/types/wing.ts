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
}
