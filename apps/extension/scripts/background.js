import { ENDPOINT, DEV_ENDPOINT } from '../endpoint'
import { ensureOffscreen } from './utils'

const ALLOWLIST = new Set([DEV_ENDPOINT, ENDPOINT])
chrome.runtime.onMessageExternal.addListener(async (msg, sender, sendResponse) => {
  if (!ALLOWLIST.has(sender.origin)) {
    sendResponse({ ok: false, error: 'forbidden' })
    return // 응답 후 종료
  }

  if (msg?.type === 'EXT_READY') {
    sendResponse({ ok: true })
    return true
  }

  if (msg?.type === 'OPEN_BG_TAB') {
    // (보안) 허용 origin 화이트리스트 체크

    const openIn = windowId => {
      chrome.tabs.create(
        { url: msg.url, active: false, windowId }, // 백그라운드 탭
        () => sendResponse({ ok: true }),
      )
    }

    // 메시지를 보낸 탭과 같은 창에 열기 (가급적 UX 좋게)
    if (sender.tab?.windowId) {
      openIn(sender.tab.windowId)
    } else {
      chrome.windows.getLastFocused({}, win => openIn(win?.id))
    }
    return true
  }

  if (msg?.type === 'SET_TOKEN') {
    ;(async () => {
      try {
        const token = msg.token
        const expiresAt = msg.expiresAt

        await chrome.storage.local.set({ token, expiresAt })
        sendResponse({ ok: true })
      } catch (e) {
        console.error(e)
        sendResponse({ ok: false, error: String(e) })
      }
    })()
    return true
  }

  if (msg?.type === 'RM_TOKEN') {
    ;(async () => {
      try {
        await chrome.storage.local.remove(['token', 'expiresAt'])
        sendResponse({ ok: true })
      } catch (e) {
        console.error(e)
        sendResponse({ ok: false, error: String(e) })
      }
    })()
    sendResponse({ ok: true })
    return true
  }

  if (msg?.type === 'RUN_HIDDEN_TASK') {
    await ensureOffscreen()
    // 오프스크린 문서로 작업 요청 전달
    await chrome.runtime.sendMessage({ type: 'OFFSCREEN_TASK', payload: msg.payload })
    sendResponse({ ok: true })
  }

  if (msg?.type === 'CLOSE_SEARCH_TAB') {
    ;(async () => {
      try {
        console.log('[background] CLOSE_SEARCH_TAB requested')
        // WING 검색 탭 찾기
        const tabs = await chrome.tabs.query({
          url: 'https://wing.coupang.com/tenants/seller-web/vendor-inventory/formV2',
        })
        console.log('[background] Found WING search tabs:', tabs.length)

        if (tabs.length > 0) {
          // 모든 검색 탭 닫기
          for (const tab of tabs) {
            await chrome.tabs.remove(tab.id)
            console.log('[background] Closed tab:', tab.id)
          }
          sendResponse({ ok: true, closed: tabs.length })
        } else {
          sendResponse({ ok: true, closed: 0 })
        }
      } catch (e) {
        console.error('[background] CLOSE_SEARCH_TAB error:', e)
        sendResponse({ ok: false, error: String(e) })
      }
    })()
    return true
  }

  if (msg?.type === 'CLOSE_FORMV2_TAB') {
    ;(async () => {
      try {
        console.log('[background] CLOSE_FORMV2_TAB requested')
        // formV2 탭 찾기
        const tabs = await chrome.tabs.query({
          url: '*://wing.coupang.com/*/vendor-inventory/formV2*',
        })
        console.log('[background] Found formV2 tabs:', tabs.length)

        if (tabs.length > 0) {
          // 모든 formV2 탭 닫기
          for (const tab of tabs) {
            await chrome.tabs.remove(tab.id)
            console.log('[background] Closed formV2 tab:', tab.id)
          }
          sendResponse({ ok: true, closed: tabs.length })
        } else {
          sendResponse({ ok: true, closed: 0 })
        }
      } catch (e) {
        console.error('[background] CLOSE_FORMV2_TAB error:', e)
        sendResponse({ ok: false, error: String(e) })
      }
    })()
    return true
  }

  if (msg?.type === 'CHECK_COUPANG_OPTION_PICKER') {
    ;(async () => {
      try {
        const { productId, itemId, vendorItemId } = msg.payload || {}
        console.log('[background] 🔍 CHECK_COUPANG_OPTION_PICKER:', { productId, itemId, vendorItemId })

        // 쿠팡 상품 페이지 URL
        const coupangUrl = `https://www.coupang.com/vp/products/${productId}?itemId=${itemId}&vendorItemId=${vendorItemId || ''}`
        console.log('[background] 🌐 Coupang URL:', coupangUrl)

        // 새 탭 생성 (비활성 탭)
        const tab = await chrome.tabs.create({ url: coupangUrl, active: false })
        console.log('[background] ✅ Tab created - ID:', tab.id)

        // 탭이 로드될 때까지 대기
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(onUpdated)
            reject(new Error('Timeout waiting for tab to load'))
          }, 15000)

          const onUpdated = (tabId, info) => {
            if (tabId === tab.id && info.status === 'complete') {
              clearTimeout(timeout)
              chrome.tabs.onUpdated.removeListener(onUpdated)
              resolve()
            }
          }

          chrome.tabs.onUpdated.addListener(onUpdated)
        })

        // content script 로드 대기
        await new Promise(r => setTimeout(r, 1000))

        // content script에 옵션 피커 체크 요청
        const result = await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_OPTION_PICKER' })

        // 탭 닫기
        await chrome.tabs.remove(tab.id)

        if (result?.ok) {
          console.log('[background] ✅ Option picker check result:', {
            hasOptionPicker: result.hasOptionPicker,
            optionCount: result.optionCount,
            optionOrder: result.optionOrder || [],
            firstAttributeValue: result.firstAttributeValue,
            rocketBadgeRatio: result.rocketBadgeRatio,
            rocketBadgeCount: result.rocketBadgeCount,
            totalOptionCount: result.totalOptionCount,
            isFirstOptionSoldOut: result.isFirstOptionSoldOut,
          })
          sendResponse({
            ok: true,
            hasOptionPicker: result.hasOptionPicker,
            optionCount: result.optionCount,
            optionOrder: result.optionOrder || [],
            firstAttributeValue: result.firstAttributeValue || null,
            rocketBadgeRatio: result.rocketBadgeRatio || 0,
            rocketBadgeCount: result.rocketBadgeCount || 0,
            totalOptionCount: result.totalOptionCount || 0,
            isFirstOptionSoldOut: result.isFirstOptionSoldOut || false,
          })
        } else {
          console.log('[background] ❌ Option picker check failed:', result?.error)
          sendResponse({ ok: false, error: result?.error || 'Failed to check option picker' })
        }
      } catch (e) {
        console.error('[background] ❌ CHECK_COUPANG_OPTION_PICKER error:', e)
        sendResponse({ ok: false, error: String(e) })
      }
    })()
    return true
  }

  if (msg?.type === 'WING_ATTRIBUTE_CHECK') {
    console.log('[background] Received message:', msg.type, msg.payload)
    // wing 탭을 찾아 없으면 비활성 탭으로 생성 후, 콘텐츠 스크립트에 요청 위임
    const targetUrl = 'https://wing.coupang.com/tenants/seller-web/vendor-inventory/formV2'

    async function ensureWingTab() {
      // formV2 탭 찾기
      const tabs = await chrome.tabs.query({ url: '*://wing.coupang.com/*/vendor-inventory/formV2*' })
      console.log(
        '[background] Found tabs:',
        tabs.length,
        tabs.map(t => ({ id: t.id, url: t.url, status: t.status })),
      )
      // 최근 생성된 탭 하나만 반환 (id가 큰 순서로 정렬)
      if (tabs && tabs.length > 0) {
        tabs.sort((a, b) => (b.id || 0) - (a.id || 0))
        const existingTab = tabs[0]
        console.log('[background] Using existing tab:', existingTab.id, existingTab.url, existingTab.status)

        // 기존 탭이 이미 완전히 로드되었는지 확인
        const tabInfo = await chrome.tabs.get(existingTab.id)
        if (tabInfo.status === 'complete') {
          console.log('[background] ✅ Existing tab is already loaded')
          // 콘텐츠 스크립트가 준비될 시간을 주기 위해 약간 대기
          await new Promise(resolve => setTimeout(resolve, 1000))
          return existingTab
        } else {
          console.log('[background] ⏳ Existing tab is still loading, waiting...')
          // 탭이 로드될 때까지 대기
          return new Promise(resolve => {
            const tabId = existingTab.id
            const onUpdated = (updatedTabId, info) => {
              if (updatedTabId === tabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(onUpdated)
                console.log('[background] ✅ Existing tab finished loading')
                // 콘텐츠 스크립트가 준비될 시간을 주기 위해 약간 대기
                setTimeout(() => {
                  resolve(existingTab)
                }, 1000)
              }
            }
            chrome.tabs.onUpdated.addListener(onUpdated)

            // 탭이 이미 완료되었을 수도 있으므로 다시 확인
            chrome.tabs.get(tabId, tab => {
              if (tab.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(onUpdated)
                console.log('[background] ✅ Existing tab is already complete')
                setTimeout(() => {
                  resolve(existingTab)
                }, 1000)
              }
            })
          })
        }
      }
      // 탭이 없으면 새로 생성
      console.log('[background] No existing tab found, creating new one...')
      return new Promise(resolve => {
        chrome.tabs.create({ url: targetUrl, active: false }, tab => {
          console.log('[background] Created new tab:', tab.id)
          const tabId = tab.id
          const onUpdated = (updatedTabId, info) => {
            if (updatedTabId === tabId && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(onUpdated)
              console.log('[background] ✅ New tab finished loading')
              // 콘텐츠 스크립트가 준비될 시간을 주기 위해 약간 대기
              setTimeout(() => {
                resolve(tab)
              }, 1000)
            }
          }
          chrome.tabs.onUpdated.addListener(onUpdated)
        })
      })
    }

    const wingTab = await ensureWingTab()
    console.log('[background] ✅ wingTab ready:', wingTab.id, wingTab.url)

    // 콘텐츠 스크립트가 미주입인 경우를 대비해 강제 주입 시도
    try {
      await chrome.scripting.executeScript({
        target: { tabId: wingTab.id },
        files: ['dist/scripts/wing/inject.js'],
      })
    } catch (e) {
      // ignore; manifest에 의해 이미 주입되었을 수 있음
    }

    const response = await new Promise(resolve => {
      let settled = false
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true
          resolve({ ok: false, error: 'no_response' })
        }
      }, 10000)

      // 1) 핸드셰이크(PING)로 콘텐츠 스크립트 준비 확인
      const messageType = msg.type
      const messagePayload = msg.payload
      chrome.tabs.sendMessage(wingTab.id, { type: 'PING' }, pong => {
        const err1 = chrome.runtime.lastError && chrome.runtime.lastError.message
        if (settled) return
        if (err1 || !pong?.ok) {
          // 2) 실패 시 소폭 지연 후 재시도
          setTimeout(() => {
            if (settled) return
            chrome.tabs.sendMessage(wingTab.id, { type: 'PING' }, pong2 => {
              const err2 = chrome.runtime.lastError && chrome.runtime.lastError.message
              if (settled) return
              if (err2 || !pong2?.ok) {
                settled = true
                clearTimeout(timeout)
                resolve({ ok: false, error: err2 || 'no_content_script' })
                return
              }
              // 준비 완료 → 본 요청 전송
              chrome.tabs.sendMessage(wingTab.id, { type: messageType, payload: messagePayload }, res => {
                const err3 = chrome.runtime.lastError && chrome.runtime.lastError.message
                if (settled) return
                settled = true
                clearTimeout(timeout)
                if (err3) {
                  resolve({ ok: false, error: err3 })
                  return
                }
                resolve(res || { ok: false, error: 'no_response' })
              })
            })
          }, 500)
          return
        }
        // 준비 완료 → 본 요청 전송 (첫 PING 성공)
        settled = true
        clearTimeout(timeout)
        chrome.tabs.sendMessage(wingTab.id, { type: messageType, payload: messagePayload }, res => {
          const err3 = chrome.runtime.lastError && chrome.runtime.lastError.message
          if (err3) {
            resolve({ ok: false, error: err3 })
            return
          }
          resolve(res || { ok: false, error: 'no_response' })
        })
      })
    })

    console.log('[background] 📥 WING_ATTRIBUTE_CHECK response:', response)
    console.log('[background] 📥 Response ok:', response?.ok)
    console.log('[background] 📥 Response attributeValues:', response?.attributeValues)
    console.log('[background] 📥 Response attributeValues length:', response?.attributeValues?.length)

    // 응답 받은 후 1초 대기 (attributeValues 추출 완료 대기)
    console.log('[background] ⏳ WING_ATTRIBUTE_CHECK response received, waiting 1 second...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('[background] ✅ 1 second wait completed')

    // 응답 형식을 { status: 'success', data: {...} } 형태로 래핑
    const wrappedResponse = {
      status: response?.ok ? 'success' : 'error',
      data: response || { ok: false, error: 'no_response' },
    }

    console.log('[background] 📤 Sending wrapped response to web app:', wrappedResponse)
    sendResponse(wrappedResponse)
    return true
  }

  if (msg?.type === 'WING_OPTION_MODIFY') {
    console.log('[background] Received message:', msg.type, msg.payload)
    // wing 탭을 찾아 없으면 비활성 탭으로 생성 후, 콘텐츠 스크립트에 요청 위임
    const { vendorInventoryId, targetTabUrl } = msg.payload || {}
    const modifyUrl = `https://wing.coupang.com/tenants/seller-web/vendor-inventory/modify?vendorInventoryId=${vendorInventoryId}`
    const targetUrl = targetTabUrl || modifyUrl

    async function ensureWingTab() {
      // targetTabUrl이 있으면 해당 URL의 탭만 찾기 (최근 생성된 탭 우선)
      const searchUrl = targetTabUrl ? targetTabUrl.split('?')[0] + '*' : '*://wing.coupang.com/*'
      const tabs = await chrome.tabs.query({ url: searchUrl })
      console.log(
        '[background] Found tabs:',
        tabs.length,
        tabs.map(t => ({ id: t.id, url: t.url })),
      )
      // 최근 생성된 탭 하나만 반환 (id가 큰 순서로 정렬)
      if (tabs && tabs.length > 0) {
        tabs.sort((a, b) => (b.id || 0) - (a.id || 0))
        console.log('[background] Using tab:', tabs[0].id, tabs[0].url)
        // 탭 활성화
        await chrome.tabs.update(tabs[0].id, { active: true })
        return tabs[0]
      }
      return new Promise(resolve => {
        chrome.tabs.create({ url: targetUrl, active: true }, tab => {
          console.log('[background] Created new tab:', tab.id)
          const tabId = tab.id
          const onUpdated = (updatedTabId, info) => {
            if (updatedTabId === tabId && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(onUpdated)
              resolve(tab)
            }
          }
          chrome.tabs.onUpdated.addListener(onUpdated)
        })
      })
    }

    const wingTab = await ensureWingTab()
    console.log('[background] wingTab:', wingTab.id)

    // 콘텐츠 스크립트가 미주입인 경우를 대비해 강제 주입 시도
    try {
      await chrome.scripting.executeScript({
        target: { tabId: wingTab.id },
        files: ['dist/scripts/wing/inject.js'],
      })
    } catch (e) {
      // ignore; manifest에 의해 이미 주입되었을 수 있음
    }

    const response = await new Promise(resolve => {
      let settled = false
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true
          resolve({ ok: false, error: 'no_response' })
        }
      }, 10000)

      // 1) 핸드셰이크(PING)로 콘텐츠 스크립트 준비 확인
      const messageType = msg.type
      const messagePayload = msg.payload
      chrome.tabs.sendMessage(wingTab.id, { type: 'PING' }, pong => {
        const err1 = chrome.runtime.lastError && chrome.runtime.lastError.message
        if (settled) return
        if (err1 || !pong?.ok) {
          // 2) 실패 시 소폭 지연 후 재시도
          setTimeout(() => {
            if (settled) return
            chrome.tabs.sendMessage(wingTab.id, { type: 'PING' }, pong2 => {
              const err2 = chrome.runtime.lastError && chrome.runtime.lastError.message
              if (settled) return
              if (err2 || !pong2?.ok) {
                settled = true
                clearTimeout(timeout)
                resolve({ ok: false, error: err2 || 'no_content_script' })
                return
              }
              // 준비 완료 → 본 요청 전송
              chrome.tabs.sendMessage(wingTab.id, { type: messageType, payload: messagePayload }, res => {
                const err3 = chrome.runtime.lastError && chrome.runtime.lastError.message
                if (settled) return
                settled = true
                clearTimeout(timeout)
                if (err3) {
                  resolve({ ok: false, error: err3 })
                  return
                }
                resolve(res || { ok: false, error: 'no_response' })
              })
            })
          }, 500)
          return
        }
        // 준비 완료 → 본 요청 전송 (첫 PING 성공)
        settled = true
        clearTimeout(timeout)
        chrome.tabs.sendMessage(wingTab.id, { type: messageType, payload: messagePayload }, res => {
          const err3 = chrome.runtime.lastError && chrome.runtime.lastError.message
          if (err3) {
            resolve({ ok: false, error: err3 })
            return
          }
          resolve(res || { ok: false, error: 'no_response' })
        })
      })
    })

    sendResponse({ status: 'success', data: response })
    return true
  }

  if (msg?.type === 'WING_SEARCH' || msg?.type === 'WING_PRODUCT_ITEMS') {
    console.log('[background] Received message:', msg.type, msg.payload)
    // wing 탭을 찾아 없으면 비활성 탭으로 생성 후, 콘텐츠 스크립트에 요청 위임
    const targetUrl = 'https://wing.coupang.com/tenants/seller-web/vendor-inventory/formV2'
    const targetTabUrl = msg?.payload?.targetTabUrl

    async function ensureWingTab() {
      // targetTabUrl이 있으면 해당 URL의 탭만 찾기 (최근 생성된 탭 우선)
      const searchUrl = targetTabUrl ? targetTabUrl.split('?')[0] + '*' : '*://wing.coupang.com/*'
      const tabs = await chrome.tabs.query({ url: searchUrl })
      console.log(
        '[background] Found tabs:',
        tabs.length,
        tabs.map(t => ({ id: t.id, url: t.url })),
      )
      // 최근 생성된 탭 하나만 반환 (id가 큰 순서로 정렬)
      if (tabs && tabs.length > 0) {
        tabs.sort((a, b) => (b.id || 0) - (a.id || 0))
        console.log('[background] Using tab:', tabs[0].id, tabs[0].url)
        return tabs[0]
      }
      return new Promise(resolve => {
        chrome.tabs.create({ url: targetUrl, active: false }, tab => {
          console.log('[background] Created new tab:', tab.id)
          const tabId = tab.id
          const onUpdated = (updatedTabId, info) => {
            if (updatedTabId === tabId && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(onUpdated)
              resolve(tab)
            }
          }
          chrome.tabs.onUpdated.addListener(onUpdated)
        })
      })
    }

    const wingTab = await ensureWingTab()
    console.log('[background] wingTab:', wingTab.id)

    // 콘텐츠 스크립트가 미주입인 경우를 대비해 강제 주입 시도
    try {
      await chrome.scripting.executeScript({
        target: { tabId: wingTab.id },
        files: ['dist/scripts/wing/inject.js'],
      })
    } catch (e) {
      // ignore; manifest에 의해 이미 주입되었을 수 있음
    }

    const response = await new Promise(resolve => {
      let settled = false
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true
          resolve({ ok: false, error: 'no_response' })
        }
      }, 10000)

      // 1) 핸드셰이크(PING)로 콘텐츠 스크립트 준비 확인
      const messageType = msg.type
      const messagePayload = msg.payload
      chrome.tabs.sendMessage(wingTab.id, { type: 'PING' }, pong => {
        const err1 = chrome.runtime.lastError && chrome.runtime.lastError.message
        if (settled) return
        if (err1 || !pong?.ok) {
          // 2) 실패 시 소폭 지연 후 재시도
          setTimeout(() => {
            if (settled) return
            chrome.tabs.sendMessage(wingTab.id, { type: 'PING' }, pong2 => {
              const err2 = chrome.runtime.lastError && chrome.runtime.lastError.message
              if (settled) return
              if (err2 || !pong2?.ok) {
                settled = true
                clearTimeout(timeout)
                resolve({ ok: false, error: err2 || 'no_content_script' })
                return
              }
              // 준비 완료 → 본 요청 전송
              chrome.tabs.sendMessage(wingTab.id, { type: messageType, payload: messagePayload }, res => {
                const err3 = chrome.runtime.lastError && chrome.runtime.lastError.message
                if (settled) return
                settled = true
                clearTimeout(timeout)
                if (err3) {
                  resolve({ ok: false, error: err3 })
                  return
                }
                resolve(res || { ok: false, error: 'no_response' })
              })
            })
          }, 500)
          return
        }
        // 준비 완료 → 본 요청 전송 (첫 PING 성공)
        settled = true
        clearTimeout(timeout)
        chrome.tabs.sendMessage(wingTab.id, { type: messageType, payload: messagePayload }, res => {
          const err3 = chrome.runtime.lastError && chrome.runtime.lastError.message
          if (err3) {
            resolve({ ok: false, error: err3 })
            return
          }
          resolve(res || { ok: false, error: 'no_response' })
        })
      })
    })

    sendResponse({ status: 'success', data: response })
    return true
  }
  return true // async 응답

  sendResponse({ ok: false, error: 'bad_request' })
  return true
})

// 내부 메시지 처리: 컨텐츠 스크립트 → 백그라운드 API 프록시
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'GET_LATEST_PRODUCT_ID') {
    ;(async () => {
      try {
        const { latestProductId } = await chrome.storage.local.get(['latestProductId'])
        sendResponse({ ok: true, productId: latestProductId || null })
      } catch (e) {
        console.error(e)
        sendResponse({ ok: false, error: String(e) })
      }
    })()
    return true
  }

  if (msg?.type === 'CLEAR_LATEST_PRODUCT_ID') {
    ;(async () => {
      try {
        await chrome.storage.local.remove(['latestProductId'])
        sendResponse({ ok: true })
      } catch (e) {
        console.error(e)
        sendResponse({ ok: false, error: String(e) })
      }
    })()
    return true
  }

  if (msg?.type === 'FETCH_IMAGE_BLOBS') {
    ;(async () => {
      try {
        const { imageUrls } = msg.payload || {}
        console.log('[background] 🔍 FETCH_IMAGE_BLOBS:', imageUrls?.length, 'images')
        console.log('[background] 📋 Image URLs:', imageUrls)

        if (!imageUrls || imageUrls.length === 0) {
          console.error('[background] ❌ No image URLs provided')
          sendResponse({ ok: false, error: 'No image URLs provided' })
          return
        }

        const blobs = []
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i]
          try {
            console.log(`[background] 📥 Fetching image ${i + 1}/${imageUrls.length}:`, imageUrl)
            const response = await fetch(imageUrl)

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const blob = await response.blob()
            console.log(`[background] ✅ Blob received:`, {
              size: blob.size,
              type: blob.type,
            })

            // Blob을 base64로 변환 (전송을 위해)
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                console.log(`[background] ✅ Base64 conversion complete for image ${i + 1}`)
                resolve(reader.result)
              }
              reader.onerror = () => {
                console.error(`[background] ❌ FileReader error for image ${i + 1}`)
                reject(new Error('FileReader error'))
              }
              reader.readAsDataURL(blob)
            })

            blobs.push({ url: imageUrl, base64, type: blob.type })
            console.log(
              `[background] ✅ Fetched and converted image ${i + 1}:`,
              imageUrl,
              `(base64 length: ${base64.length})`,
            )
          } catch (error) {
            console.error(`[background] ❌ Error fetching image ${i + 1}:`, imageUrl, error)
            console.error('[background] ❌ Error details:', error.message, error.stack)
            blobs.push({ url: imageUrl, error: String(error) })
          }
        }

        console.log('[background] 📤 Sending response with', blobs.length, 'blob(s)')
        sendResponse({ ok: true, blobs })
      } catch (e) {
        console.error('[background] ❌ FETCH_IMAGE_BLOBS error:', e)
        console.error('[background] ❌ Error stack:', e.stack)
        sendResponse({ ok: false, error: String(e) })
      }
    })()
    return true
  }

  if (msg?.type === 'GET_COUPANG_PRODUCT_IMAGES') {
    ;(async () => {
      try {
        const { productId, itemId, vendorItemId } = msg.payload || {}
        console.log('[background] 🔍 GET_COUPANG_PRODUCT_IMAGES:', { productId, itemId, vendorItemId })

        // 쿠팡 상품 페이지 URL
        const coupangUrl = `https://www.coupang.com/vp/products/${productId}?itemId=${itemId}&vendorItemId=${vendorItemId || ''}`
        console.log('[background] 🌐 Coupang URL:', coupangUrl)

        // 새 탭 생성 (비활성 탭)
        console.log('[background] 🔗 Opening tab with URL:', coupangUrl)
        const tab = await chrome.tabs.create({ url: coupangUrl, active: false })
        console.log('[background] ✅ Tab created - ID:', tab.id)
        console.log('[background] 📍 Tab URL:', tab.url)

        // 탭이 로드될 때까지 대기
        const loadPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(onUpdated)
            console.error('[background] ❌ Timeout waiting for tab to load')
            reject(new Error('Timeout waiting for tab to load'))
          }, 30000) // 30초 타임아웃

          const onUpdated = (tabId, info) => {
            if (tabId === tab.id) {
              console.log('[background] 📡 Tab update - ID:', tabId, 'Status:', info.status)
              if (info.url) {
                console.log('[background] 🌐 Updated URL:', info.url)
              }
              if (info.status === 'complete') {
                clearTimeout(timeout)
                chrome.tabs.onUpdated.removeListener(onUpdated)
                console.log('[background] ✅ Tab fully loaded!')
                // 탭의 최종 URL 확인
                chrome.tabs.get(tabId, finalTab => {
                  console.log('[background] 🎯 Final tab URL:', finalTab.url)
                  resolve()
                })
              }
            }
          }

          chrome.tabs.onUpdated.addListener(onUpdated)
        })

        await loadPromise

        // 최종 URL 다시 확인
        const finalTabInfo = await chrome.tabs.get(tab.id)
        console.log('[background] 🔍 Final tab info before extraction:')
        console.log('[background]   - ID:', finalTabInfo.id)
        console.log('[background]   - URL:', finalTabInfo.url)
        console.log('[background]   - Title:', finalTabInfo.title)
        console.log('[background]   - Status:', finalTabInfo.status)

        console.log('[background] 📤 Sending EXTRACT_PRODUCT_IMAGES message to tab:', tab.id)

        // 약간의 대기 후 content script에 메시지 전송 (content script 로드 보장)
        await new Promise(r => setTimeout(r, 1000))

        // content script에 이미지 추출 요청
        let result
        try {
          result = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PRODUCT_IMAGES' })
          console.log('[background] 📥 Extract result:')
          console.log('[background]   - ok:', result?.ok)
          console.log('[background]   - images:', result?.images?.length || 0)
          console.log('[background]   - error:', result?.error)
          if (result?.images?.length > 0) {
            console.log('[background]   - first image:', result.images[0])
          }
        } catch (sendError) {
          console.error('[background] ❌ Error sending message to content script:', sendError)
          console.log('[background] 🔍 This usually means the content script is not loaded.')
          console.log('[background] 💡 Check if manifest.json includes www.coupang.com in content_scripts')
          result = { ok: false, error: `Message send failed: ${sendError.message}` }
        }

        // 탭 닫기
        await chrome.tabs.remove(tab.id)
        console.log('[background] 🗑️ Tab closed')

        if (result?.ok && result?.images) {
          console.log('[background] ✅ Successfully extracted', result.images.length, 'images')
          console.log('[background] 📸 ItemBrief capture available:', !!result.itemBriefCapture)
          sendResponse({
            ok: true,
            images: result.images,
            itemBriefCapture: result.itemBriefCapture,
          })
        } else {
          console.warn('[background] ❌ Failed to extract images:', result?.error)
          sendResponse({ ok: false, error: result?.error || 'Failed to extract images' })
        }
      } catch (e) {
        console.error('[background] ❌ GET_COUPANG_PRODUCT_IMAGES error:', e)
        sendResponse({ ok: false, error: String(e) })
      }
    })()
    return true
  }

  if (msg?.type === 'CALL_API') {
    ;(async () => {
      try {
        const method = msg.method || 'POST'
        const path = msg.path
        const body = msg.body
        const extraHeaders = msg.headers || {}
        const isDev = msg.isDev || false

        const { token, expiresAt } = await chrome.storage.local.get(['token', 'expiresAt'])
        console.log('🔍 토큰 상태:', {
          hasToken: !!token,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isExpired: expiresAt ? Date.now() > expiresAt : false,
          currentTime: new Date(),
        })
        if (!token || (expiresAt && Date.now() > expiresAt)) {
          sendResponse({ ok: false, error: 'no_token' })
          return
        }

        const res = await fetch(`${isDev ? DEV_ENDPOINT : ENDPOINT}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...extraHeaders,
          },
          body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(body ?? {}),
        })

        const text = await res.text()
        let data
        try {
          data = text ? JSON.parse(text) : null
        } catch {
          data = text
        }

        sendResponse({ ok: res.ok, status: res.status, data })
      } catch (e) {
        console.error(e)
        sendResponse({ ok: false, error: String(e) })
      }
    })()
    return true
  }

  if (msg.action === 'getCompletedProductIds') {
    const isDev = msg.isDev || false
    const mallId = msg.mallId
    const ksToken = msg.ksToken

    const baseUrl = isDev ? DEV_ENDPOINT : ENDPOINT

    fetch(`${baseUrl}/api/naverCrawlCompletedProductIds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          mallId: mallId,
        },
        ksToken,
      }),
    })
      .then(response => response.json())
      .then(data => {
        sendResponse({ success: true, data: data })
      })
      .catch(error => {
        console.error('Error fetching completed product IDs:', error)
        sendResponse({ success: false, error: error.message })
      })

    return true // 비동기 응답을 위해 true 반환
  }

  if (msg?.type === 'PRODUCT_UPLOAD_SUCCESS') {
    ;(async () => {
      try {
        const { productId, vendorInventoryId } = msg
        console.log('[background] 🎉 PRODUCT_UPLOAD_SUCCESS message received!')
        console.log('[background] ProductId:', productId)
        console.log('[background] VendorInventoryId:', vendorInventoryId)
        console.log('[background] Sender tab ID:', sender.tab?.id)

        // 먼저 응답 전송 (탭이 닫히기 전에)
        sendResponse({ ok: true })
        console.log('[background] ✅ Response sent to wing tab')

        // Wing 탭 닫기 (sender.tab.id 사용)
        const wingTabId = sender.tab?.id
        if (wingTabId) {
          console.log('[background] 🗑️ Closing Wing tab:', wingTabId)
          try {
            await chrome.tabs.remove(wingTabId)
            console.log('[background] ✅ Wing tab closed successfully')
          } catch (closeError) {
            console.error('[background] ❌ Error closing Wing tab:', closeError)
            console.error('[background] Error details:', closeError.message)
          }
        } else {
          console.warn('[background] ⚠️ No sender tab ID available')
        }

        // /top-pick/product-upload 페이지 찾기
        console.log('[background] 🔍 Searching for product-upload tab...')
        const tabs = await chrome.tabs.query({})
        console.log('[background] Total tabs:', tabs.length)

        const productUploadTab = tabs.find(tab => {
          console.log('[background] Checking tab:', tab.id, tab.url)
          return tab.url?.includes('/top-pick/product-upload')
        })

        if (productUploadTab?.id) {
          console.log('[background] ✅ Found product-upload tab:', productUploadTab.id)
          console.log('[background] Tab URL:', productUploadTab.url)

          // product-upload 탭에 메시지 전송 (window.postMessage 사용)
          const messageToSend = {
            source: 'coupang-extension',
            type: 'UPDATE_PRODUCT_STATUS',
            productId: productId,
            vendorInventoryId: vendorInventoryId,
          }
          console.log('[background] 📤 Sending message via window.postMessage:', messageToSend)

          try {
            await chrome.scripting.executeScript({
              target: { tabId: productUploadTab.id },
              func: message => {
                window.postMessage(message, '*')
              },
              args: [messageToSend],
            })
            console.log('[background] ✅ Message sent to product-upload page')
          } catch (sendError) {
            console.error('[background] ❌ Error sending message to product-upload page:', sendError)
          }

          // 탭을 활성화
          console.log('[background] 🎯 Activating product-upload tab...')
          await chrome.tabs.update(productUploadTab.id, { active: true })
          console.log('[background] ✅ Product-upload tab activated')
        } else {
          console.warn('[background] ⚠️ Product-upload tab not found')
          console.log('[background] Available tabs:')
          tabs.forEach(tab => console.log(`  - ${tab.id}: ${tab.url}`))
        }
      } catch (e) {
        console.error('[background] ❌ Error handling product upload success:', e)
        console.error('[background] Error stack:', e.stack)
      }
    })()
    return true
  }

  if (msg?.type === 'PRODUCT_UPLOAD_ERROR') {
    ;(async () => {
      try {
        const { productId, status, error } = msg
        console.log('[background] 🚨 PRODUCT_UPLOAD_ERROR message received!')
        console.log('[background] ProductId:', productId)
        console.log('[background] Status:', status)
        console.log('[background] Error:', error)
        console.log('[background] Sender tab ID:', sender.tab?.id)

        // 먼저 응답 전송 (탭이 닫히기 전에)
        sendResponse({ ok: true })
        console.log('[background] ✅ Response sent to wing tab')

        // Wing 탭 닫기 (sender.tab.id 사용)
        const wingTabId = sender.tab?.id
        if (wingTabId) {
          console.log('[background] 🗑️ Closing Wing tab:', wingTabId)
          try {
            await chrome.tabs.remove(wingTabId)
            console.log('[background] ✅ Wing tab closed successfully')
          } catch (closeError) {
            console.error('[background] ❌ Error closing Wing tab:', closeError)
            console.error('[background] Error details:', closeError.message)
          }
        } else {
          console.warn('[background] ⚠️ No sender tab ID available')
        }

        // /top-pick/product-upload 페이지 찾기
        console.log('[background] 🔍 Searching for product-upload tab...')
        const tabs = await chrome.tabs.query({})
        console.log('[background] Total tabs:', tabs.length)

        const productUploadTab = tabs.find(tab => {
          console.log('[background] Checking tab:', tab.id, tab.url)
          return tab.url?.includes('/top-pick/product-upload')
        })

        if (productUploadTab?.id) {
          console.log('[background] ✅ Found product-upload tab:', productUploadTab.id)
          console.log('[background] Tab URL:', productUploadTab.url)

          // product-upload 탭에 에러 메시지 전송 (window.postMessage 사용)
          const messageToSend = {
            source: 'coupang-extension',
            type: 'UPDATE_PRODUCT_STATUS_ERROR',
            productId: productId,
            status: status,
            error: error,
          }
          console.log('[background] 📤 Sending error message via window.postMessage:', messageToSend)

          try {
            await chrome.scripting.executeScript({
              target: { tabId: productUploadTab.id },
              func: message => {
                window.postMessage(message, '*')
              },
              args: [messageToSend],
            })
            console.log('[background] ✅ Error message sent to product-upload page')
          } catch (sendError) {
            console.error('[background] ❌ Error sending message to product-upload page:', sendError)
          }

          // 탭을 활성화
          console.log('[background] 🎯 Activating product-upload tab...')
          await chrome.tabs.update(productUploadTab.id, { active: true })
          console.log('[background] ✅ Product-upload tab activated')
        } else {
          console.warn('[background] ⚠️ Product-upload tab not found')
          console.log('[background] Available tabs:')
          tabs.forEach(tab => console.log(`  - ${tab.id}: ${tab.url}`))
        }
      } catch (e) {
        console.error('[background] ❌ Error handling product upload error:', e)
        console.error('[background] Error stack:', e.stack)
      }
    })()
    return true
  }

  // 기타 내부 메시지 기본 응답
  return false
})
