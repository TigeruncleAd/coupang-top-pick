import axios from 'axios'
const marketApiUrl = process.env.MARKET_API_URL
export const marketApiAxios = axios.create({
  baseURL: marketApiUrl,
  headers: {
    ApiKey: process.env.MARKET_API_KEY,
  },
  validateStatus: function (status) {
    return true // 모든 상태 코드를 성공으로 처리
  },
})
