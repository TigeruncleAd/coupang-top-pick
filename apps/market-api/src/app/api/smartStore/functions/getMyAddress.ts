import { requestTokenSmartStore } from './token'

export async function getMyAddress(token: string) {
  try {
    const response = await fetch(`https://api.commerce.naver.com/external/v1/seller/addressbooks-for-page?page=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await response.json()
    return data.addressBooks
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function getMyOverseasAddress(token: string) {
  try {
    const address = await getMyAddress(token)
    const overseasAddress = address?.find(content => content.overseasAddress)
    if (!overseasAddress) return null
    return overseasAddress
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function getMyOverseasAddressNo(token: string) {
  try {
    const address = await getMyOverseasAddress(token)
    if (!address) return null
    return address.addressBookNo
  } catch (error) {
    console.error(error)
    return null
  }
}
