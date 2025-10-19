import { MarketApiKey, User, MARKET, MarketSetting } from '@repo/database'
export type keys = {
  key: string
  secret: string
}

export interface myForm extends User {
  marketSetting: MarketSetting
}
