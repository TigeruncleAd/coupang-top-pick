export function createFetchWithSearchParams(url, searchParams, headers = {}) {
  const urlObj = new URL(url)
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })
  return fetch(urlObj.toString(), {
    headers,
  })
}

export function createFetchUrl(url, searchParams) {
  const urlObj = new URL(url)
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })
  return urlObj.toString()
}

export function createUrlWithSearchParams(url, searchParams) {
  const urlObj = new URL(url)
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })
  return urlObj.toString()
}

export async function waitRandomSleep(min = 1000, max = 2000) {
  const randomSleep = Math.floor(Math.random() * (max - min + 1)) + min
  await new Promise(resolve => setTimeout(resolve, randomSleep))
}

// 확장에서 토큰 읽는 헬퍼 (필요 시 갱신 로직 추가)
export async function getToken() {
  const { token, expiresAt } = await chrome.storage.local.get(['token', 'expiresAt'])
  if (!token) return null
  if (expiresAt && Date.now() > expiresAt) return null
  return token
}

// 백그라운드 서비스 워커에 메시지로 위임하여 API 호출
export async function callApi({ path, body, options = {} }) {
  const method = options.method || 'POST'
  const headers = options.headers || {}
  const isDev = options.isDev || false
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage({ type: 'CALL_API', path, body, method, headers, isDev }, res => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (!res) {
          reject(new Error('no_response'))
          return
        }
        if (!res.ok) {
          reject(new Error(`api_error ${res.status || ''} ${res.error || ''}`.trim()))
          return
        }
        resolve(res.data)
      })
    } catch (e) {
      reject(e)
    }
  })
}

export async function ensureOffscreen() {
  const reasons = await chrome.offscreen.hasDocument?.()
  if (reasons) return // 이미 있음
  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL('dist/scripts/naver/offscreen/offscreen.html'),
    reasons: ['DOM_SCRAPING'], // 필요한 이유 (AUDIO_PLAYBACK 등과 조합)
    justification: 'Run hidden automation against external.example', // 간단 설명
  })
}

/** Simple YYYY-MM-DD formatter. */
function formatDateYMD(date) {
  if (!date) return ''
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Simple YYYYMMDD formatter. */
function formatDateYMDCompact(date) {
  if (!date) return ''
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

/** HTTP helpers with consistent defaults. */
const Http = {
  async get(url, params, init) {
    const fullUrl = params ? `${url}${url.includes('?') ? '&' : '?'}${new URLSearchParams(params).toString()}` : url
    const resp = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include',
      ...init,
    })
    return resp
  },
  async post(url, init) {
    const resp = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      ...init,
    })
    return resp
  },
}

/* =============================
   DataLab (Shopping Insight)
============================= */

/**
 * Build application/x-www-form-urlencoded body for Shopping Insight endpoints.
 * endpoint requires: { cid, startDate, endDate, keyword }
 */
function buildShoppingInsightBody({ cid, startDate, endDate, keyword }) {
  const pieces = [
    `cid=${cid ?? 0}`,
    `timeUnit=date`,
    `startDate=${startDate ?? ''}`,
    `endDate=${endDate ?? ''}`,
    `age=`,
    `gender=`,
    `device=`,
    `keyword=${encodeURIComponent(keyword ?? '')}`,
  ]
  return pieces.join('&')
}

/**
 * Call Shopping Insight endpoint and return result array.
 * endpoint examples: getKeywordGenderRate, getKeywordDeviceRate, getKeywordAgeRate, getKeywordClickTrend
 */
async function callShoppingInsight(endpoint, payload) {
  const body = buildShoppingInsightBody(payload)
  const resp = await Http.post(`https://datalab.naver.com/shoppingInsight/${endpoint}.naver`, {
    headers: {
      Origin: 'https://datalab.naver.com',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'ko,en;q=0.9,en-US;q=0.8,ja;q=0.7',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: '*/*',
      'X-Requested-With': 'XMLHttpRequest',
      // Referer is enforced by DNR rules.
    },
    referrer: 'https://datalab.naver.com/',
    referrerPolicy: 'unsafe-url',
    body,
  })
  if (!resp.ok) return []
  const json = await resp.json().catch(() => null)
  return json?.result ?? []
}

/* =============================
   DataLab (Keyword Trend: qcHash + trendResult)
============================= */

/**
 * Build x-www-form-urlencoded body for qcHash (Keyword Trend).
 * expects { query: string[] , startDate: YYYYMMDD, endDate: YYYYMMDD }
 */
function buildTrendBody({ query, startDate, endDate }) {
  const queryGroups = (query || [])
    .map(q => `${encodeURIComponent(q)}__SZLIG__${encodeURIComponent(q)}`)
    .join('__OUML__')
  const params = [
    `queryGroups=${queryGroups}`,
    `startDate=${startDate ?? ''}`,
    `endDate=${endDate ?? ''}`,
    `timeUnit=date`,
    `gender=`,
    `age=`,
    `device=`,
  ]
  return params.join('&')
}

/** Request qcHash and return hashKey (or null). */
async function requestQcHash(params) {
  const resp = await Http.post('https://datalab.naver.com/qcHash.naver', {
    headers: {
      Origin: 'https://datalab.naver.com',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'ko,en;q=0.9,en-US;q=0.8,ja;q=0.7',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: '*/*',
      'X-Requested-With': 'XMLHttpRequest',
    },
    referrer: 'https://datalab.naver.com/',
    referrerPolicy: 'unsafe-url',
    body: buildTrendBody(params),
  })
  if (!resp.ok) return null
  const json = await resp.json().catch(() => null)
  return json?.success ? json.hashKey : null
}

/**
 * Fetch trendResult HTML and extract JSON inside #graph_data.
 */
async function fetchTrendResultGraph(hashKey) {
  const htmlResp = await Http.get(
    'https://datalab.naver.com/keyword/trendResult.naver',
    { hashKey },
    {
      headers: {
        Authority: 'datalab.naver.com',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'ko,en;q=0.9,en-US;q=0.8,ja;q=0.7',
        'Upgrade-Insecure-Requests': '1',
      },
      referrer: 'https://datalab.naver.com/keyword/trendSearch.naver',
    },
  )
  if (!htmlResp.ok) return []
  const html = await htmlResp.text()
  const marker = '<div id="graph_data" style="display:none" data-timedimension="date">'
  const start = html.indexOf(marker)
  if (start < 0) return []
  const end = html.indexOf('</div>', start)
  if (end < 0) return []
  const jsonText = html.substring(start + marker.length, end).trim()
  try {
    return JSON.parse(jsonText) || []
  } catch {
    return []
  }
}

/* =============================
   Public API (DataLabClient)
============================= */

const DataLabClient = {
  // Low-level
  callShoppingInsight,
  requestQcHash,
  fetchTrendResultGraph,

  // Charts (gender/device/age) for one keyword in date range
  async getCharts(cid, keyword, startDate, endDate) {
    const payload = {
      cid: cid ?? 0,
      startDate: formatDateYMD(startDate),
      endDate: formatDateYMD(endDate),
      keyword: keyword ?? '',
    }
    const [gender, device, age] = await Promise.all([
      callShoppingInsight('getKeywordGenderRate', payload),
      callShoppingInsight('getKeywordDeviceRate', payload),
      callShoppingInsight('getKeywordAgeRate', payload),
    ])
    return [gender?.[0]?.data ?? [], device?.[0]?.data ?? [], age?.[0]?.data ?? []]
  },

  // Keyword Trend (search volume) for up to 5 groups
  async getSearchTrendGraph(keywords, startDate, endDate) {
    const params = {
      query: (keywords || []).map(k => (k || '').split(' ').join('')),
      startDate: formatDateYMDCompact(startDate),
      endDate: formatDateYMDCompact(endDate),
    }
    const hashKey = await requestQcHash(params)
    if (!hashKey) return []
    const series = await fetchTrendResultGraph(hashKey)
    // Normalize date format
    return series.map(s => ({
      ...s,
      data: (s.data || []).map(({ period, value }) => ({
        period: `${period.slice(0, 4)}-${period.slice(4, 6)}-${period.slice(6, 8)}`,
        value,
      })),
    }))
  },

  // Shopping click trend for one or multiple keywords
  async getShoppingTrendGraph(cid, keywords, startDate, endDate) {
    const payload = {
      cid: cid ?? 0,
      startDate: formatDateYMD(startDate),
      endDate: formatDateYMD(endDate),
      keyword: (keywords || []).join(','),
    }
    const result = await callShoppingInsight('getKeywordClickTrend', payload)
    return result.map(s => ({
      ...s,
      data: (s.data || []).map(({ period, value }) => ({
        period: `${period.slice(0, 4)}-${period.slice(4, 6)}-${period.slice(6, 8)}`,
        value,
      })),
    }))
  },

  // Convenience: both search(trend) and shopping(click) trends for a keyword
  async getKeywordGraph(cid, keyword, startDate, endDate) {
    const search = await DataLabClient.getSearchTrendGraph([keyword], startDate, endDate).then(r => r?.[0]?.data ?? [])
    const payload = {
      cid: cid ?? 0,
      startDate: formatDateYMD(startDate),
      endDate: formatDateYMD(endDate),
      keyword: keyword ?? '',
    }
    const click = await callShoppingInsight('getKeywordClickTrend', payload).then(r => r?.[0]?.data ?? [])
    return [search, click]
  },
}
