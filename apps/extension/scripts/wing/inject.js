// Content script for https://wing.coupang.com/*
;(function () {
  // 중복 주입 방지
  if (window.__WING_INJECT_LOADED__) {
    console.log('[wing/inject] already loaded, skipping')
    return
  }
  window.__WING_INJECT_LOADED__ = true

  try {
    console.log('[wing/inject] loaded')
  } catch {}

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'PING') {
      try {
        sendResponse({ ok: true, pong: true })
      } catch {}
      return true
    }
    if (msg?.type === 'WING_SEARCH') {
      ;(async () => {
        try {
          const {
            keyword,
            searchPage = 0,
            searchOrder = 'DEFAULT',
            sortType = 'DEFAULT',
            excludedProductIds = [],
          } = msg.payload || {}

          const res = await fetch('https://wing.coupang.com/tenants/seller-web/pre-matching/search', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword, searchPage, searchOrder, sortType, excludedProductIds }),
          })

          const text = await res.text()
          let data
          try {
            data = text ? JSON.parse(text) : null
          } catch {
            data = text
          }
          try {
            sendResponse({ ok: res.ok, status: res.status, data })
          } catch {}
        } catch (e) {
          try {
            sendResponse({ ok: false, error: String(e) })
          } catch {}
        }
      })()
      return true
    }

    if (msg?.type === 'WING_PRODUCT_ITEMS') {
      ;(async () => {
        try {
          const {
            productId,
            itemId,
            allowSingleProduct = true,
            categoryId,
            productName,
            vendorItemId,
            optionOrder,
            attributeValues,
            firstAttributeValue,
            salePrice,
          } = msg.payload || {}
          // 업로드 시에는 {productName} {productId} 형식으로 검색
          const displayValue =
            productId && productName ? `${productName} ${productId}` : productId ? String(productId) : ''
          console.log('[wing/inject] Payload received:', {
            productId,
            productName,
            optionOrder,
            attributeValues,
            firstAttributeValue,
          })
          console.log('[wing/inject] 🏷️ Base salePrice from web app:', salePrice)
          console.log('[wing/inject] Display value for search:', displayValue)

          // 1. 먼저 상세페이지를 열어서 썸네일과 필수표기정보 캡처
          console.log('[wing/inject] 📸 Step 1: Getting product images from detail page...')
          let images = []
          let itemBriefCapture = null
          try {
            const imageResponse = await chrome.runtime.sendMessage({
              type: 'GET_COUPANG_PRODUCT_IMAGES',
              payload: { productId, itemId, vendorItemId },
            })

            console.log('[wing/inject] Image response:', imageResponse)

            if (imageResponse?.ok && imageResponse?.images) {
              images = imageResponse.images
              itemBriefCapture = imageResponse.itemBriefCapture
              console.log('[wing/inject] ✅ Received images from background:', images.length)
              console.log('[wing/inject] ✅ ItemBrief capture:', itemBriefCapture ? 'Available' : 'Not available')
            } else {
              console.warn('[wing/inject] ❌ Failed to get images from background:', imageResponse?.error)
              images = []
            }

            window.__COUPANG_PRODUCT_IMAGES__ = images
            window.__ITEM_BRIEF_CAPTURE__ = itemBriefCapture
          } catch (error) {
            console.error('[wing/inject] ❌ Error fetching product images:', error)
          }

          // 2. 노출상품명 입력
          console.log('[wing/inject] 📝 Step 2: Setting product name input...')
          const params = new URLSearchParams({
            productId: String(productId),
            itemId: String(itemId),
            allowSingleProduct: String(allowSingleProduct),
            categoryId: String(categoryId),
          })
          const url = `https://wing.coupang.com/tenants/seller-web/vendor-inventory/productmatch/prematch/product-items?${params.toString()}`

          const res = await fetch(url, {
            method: 'GET',
            credentials: 'include',
          })

          const text = await res.text()
          let data
          try {
            data = text ? JSON.parse(text) : null
          } catch {
            data = text
          }
          console.log('[wing/inject] WING_PRODUCT_ITEMS response:', { ok: res.ok, status: res.status, data })

          // 응답 성공 시 "노출상품명" input에 {productName} {productId} 자동 입력
          if (res.ok && data && productId) {
            console.log('[wing/inject] Setting search value to display input:', displayValue)

            // 폴링 방식으로 "노출상품명" input 찾기
            let attempts = 0
            const maxAttempts = 20
            const pollInterval = setInterval(() => {
              attempts++

              // "노출상품명" input 찾기 (placeholder: "상품명을 입력해주세요.")
              const productNameInput = document.querySelector('input[placeholder="상품명을 입력해주세요."]')

              if (!productNameInput) {
                console.log(`[wing/inject] [${attempts}/${maxAttempts}] Product name input not found yet`)
                if (attempts >= maxAttempts) {
                  console.warn('[wing/inject] ❌ Timeout: Could not find product name input')
                  clearInterval(pollInterval)
                }
                return
              }

              console.log('[wing/inject] ✅ Found product name input! Setting value:', displayValue)
              clearInterval(pollInterval)

              // Vue의 v-model을 트리거하는 방법
              productNameInput.focus()

              // 네이티브 setter 사용
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value',
              ).set
              nativeInputValueSetter.call(productNameInput, displayValue)

              // InputEvent 생성
              const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                composed: true,
                data: displayValue,
                inputType: 'insertText',
              })
              productNameInput.dispatchEvent(inputEvent)

              // 추가 이벤트들
              productNameInput.dispatchEvent(new Event('change', { bubbles: true }))
              productNameInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }))
              productNameInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }))

              productNameInput.blur()
              console.log('[wing/inject] ✅ Product name set successfully, current value:', productNameInput.value)

              // 3. 노출상품명 입력 후 API 호출하여 매칭 상품 찾기
              setTimeout(async () => {
                console.log('[wing/inject] 🔍 Calling pre-matching search API...')

                try {
                  // API 호출
                  const searchResponse = await fetch(
                    'https://wing.coupang.com/tenants/seller-web/pre-matching/search',
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        excludedProductIds: null,
                        keyword: displayValue, // 노출상품명
                        registrationType: null,
                        searchOrder: 'DEFAULT',
                        searchPage: null,
                        searchPageSize: 5,
                        sortType: 'DEFAULT',
                      }),
                    },
                  )

                  const searchData = await searchResponse.json()
                  console.log('[wing/inject] 📦 Pre-matching search response:', searchData)

                  if (!searchData || !searchData.result || searchData.result.length === 0) {
                    console.warn('[wing/inject] ❌ No matching products found in API response')
                    return
                  }

                  // 업로드하려는 상품의 productId와 일치하는 상품 찾기
                  const targetProductId = Number(productId)
                  let matchedIndex = -1

                  for (let i = 0; i < searchData.result.length; i++) {
                    if (searchData.result[i].productId === targetProductId) {
                      matchedIndex = i
                      console.log(`[wing/inject] ✅ Found matching product at index ${i}: productId ${targetProductId}`)
                      break
                    }
                  }

                  if (matchedIndex === -1) {
                    console.warn(`[wing/inject] ❌ No matching product found for productId: ${targetProductId}`)
                    console.log(
                      `[wing/inject] Available productIds: ${searchData.result.map(r => r.productId).join(', ')}`,
                    )
                    return
                  }

                  // 매칭된 상품의 순번에 해당하는 "판매옵션 선택" 버튼 찾기
                  console.log('[wing/inject] 🔍 Waiting for pre-matching products to appear in DOM...')

                  let matchAttempts = 0
                  const maxMatchAttempts = 50 // 10초 대기
                  const matchPollInterval = setInterval(() => {
                    matchAttempts++

                    // 추천 상품 패널 찾기
                    const preMatchingPane = document.querySelector('.pre-matching-product-pane')
                    if (!preMatchingPane) {
                      console.log(
                        `[wing/inject] [${matchAttempts}/${maxMatchAttempts}] Pre-matching pane not found yet`,
                      )
                      if (matchAttempts >= maxMatchAttempts) {
                        console.warn('[wing/inject] ❌ Timeout: Pre-matching products did not appear')
                        clearInterval(matchPollInterval)
                      }
                      return
                    }

                    // 모든 상품 박스 찾기
                    const productBoxes = preMatchingPane.querySelectorAll('.pre-matching-product-box')
                    if (productBoxes.length === 0) {
                      console.log(`[wing/inject] [${matchAttempts}/${maxMatchAttempts}] Product boxes not found yet`)
                      if (matchAttempts >= maxMatchAttempts) {
                        console.warn('[wing/inject] ❌ Timeout: Product boxes did not appear')
                        clearInterval(matchPollInterval)
                      }
                      return
                    }

                    // 매칭된 순번의 상품 박스 찾기 (0-based index)
                    if (matchedIndex >= productBoxes.length) {
                      console.warn(
                        `[wing/inject] ❌ Matched index ${matchedIndex} is out of range (${productBoxes.length} boxes found)`,
                      )
                      clearInterval(matchPollInterval)
                      return
                    }

                    const matchedProductBox = productBoxes[matchedIndex]
                    if (!matchedProductBox) {
                      console.log(
                        `[wing/inject] [${matchAttempts}/${maxMatchAttempts}] Matched product box (index ${matchedIndex}) not found yet`,
                      )
                      if (matchAttempts >= maxMatchAttempts) {
                        console.warn(
                          `[wing/inject] ❌ Timeout: Matched product box (index ${matchedIndex}) did not appear`,
                        )
                        clearInterval(matchPollInterval)
                      }
                      return
                    }

                    // 버튼 찾기
                    const selectButton = matchedProductBox.querySelector('button[data-wuic-props*="type:secondary"]')
                    if (!selectButton || !selectButton.textContent?.includes('판매옵션 선택')) {
                      console.log(
                        `[wing/inject] [${matchAttempts}/${maxMatchAttempts}] "판매옵션 선택" button not found yet in matched product box`,
                      )
                      if (matchAttempts >= maxMatchAttempts) {
                        console.warn(
                          `[wing/inject] ❌ Timeout: "판매옵션 선택" button did not appear in matched product box`,
                        )
                        clearInterval(matchPollInterval)
                      }
                      return
                    }

                    console.log(
                      `[wing/inject] ✅ Found "판매옵션 선택" button for matched product (index ${matchedIndex})! Clicking...`,
                    )
                    clearInterval(matchPollInterval)

                    // 버튼 클릭
                    selectButton.click()
                    console.log('[wing/inject] ✅ "판매옵션 선택" button clicked successfully')

                    // 헬퍼 함수: 요소가 나타날 때까지 대기
                    const waitForElement = (selector, maxAttempts = 50, intervalMs = 100) => {
                      return new Promise((resolve, reject) => {
                        let attempts = 0
                        const pollInterval = setInterval(() => {
                          attempts++
                          const element = document.querySelector(selector)
                          if (element) {
                            clearInterval(pollInterval)
                            resolve(element)
                          } else if (attempts >= maxAttempts) {
                            clearInterval(pollInterval)
                            reject(new Error(`Timeout: ${selector} did not appear`))
                          }
                        }, intervalMs)
                      })
                    }

                    // 헬퍼 함수: 버튼 텍스트로 찾기
                    const findButtonByText = text => {
                      const buttons = document.querySelectorAll('button')
                      for (const btn of buttons) {
                        if (btn.textContent?.trim().includes(text)) {
                          return btn
                        }
                      }
                      return null
                    }

                    // 헬퍼 함수: 지연
                    const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

                    // 메인 플로우: async/await 사용
                    ;(async () => {
                      try {
                        // attribute-selectors 테이블에서 옵션 선택
                        if (optionOrder && optionOrder.length > 0 && firstAttributeValue) {
                          const firstOption = optionOrder[0]
                          console.log('[wing/inject] 🔍 Looking for attribute-selectors table...')
                          console.log('[wing/inject] First option:', firstOption)
                          console.log('[wing/inject] FirstAttributeValue to click:', firstAttributeValue)

                          // 모달이 뜰 때까지 대기 (더 긴 대기 시간)
                          await delay(1500)

                          // attribute-selectors 테이블 찾기 (여러 번 재시도)
                          let attributeSelectorsTable = null
                          for (let i = 0; i < 30; i++) {
                            attributeSelectorsTable = document.querySelector('.attribute-selectors')
                            if (attributeSelectorsTable) {
                              // 테이블 내에 버튼이 실제로 존재하는지 확인
                              const testButtons = attributeSelectorsTable.querySelectorAll('button.wuic-button')
                              if (testButtons.length > 0) {
                                console.log('[wing/inject] ✅ Found attribute-selectors table with buttons!')
                                break
                              }
                            }
                            await delay(100)
                          }

                          if (!attributeSelectorsTable) {
                            console.warn('[wing/inject] ❌ attribute-selectors table not found')
                            return
                          }

                          console.log('[wing/inject] ✅ Found attribute-selectors table!')

                          // optionOrder 첫 번째와 일치하는 attribute-name 찾기
                          const attributeNameCells = attributeSelectorsTable.querySelectorAll('td.attribute-name div')
                          let targetRow = null
                          let targetAttributeName = null

                          attributeNameCells.forEach(cell => {
                            const attributeName = cell.textContent?.trim()
                            console.log('[wing/inject] Found attribute-name:', attributeName)
                            if (attributeName === firstOption) {
                              targetRow = cell.closest('tr')
                              targetAttributeName = attributeName
                              console.log('[wing/inject] ✅ Found matching attribute-name:', attributeName)
                            }
                          })

                          if (!targetRow) {
                            console.warn(`[wing/inject] ❌ Could not find attribute-name matching "${firstOption}"`)
                            return
                          }

                          // 해당 행의 attribute-values 찾기
                          const attributeValuesCell = targetRow.querySelector('td.attribute-values')
                          if (!attributeValuesCell) {
                            console.warn('[wing/inject] ❌ attribute-values cell not found')
                            return
                          }

                          const checkboxGroup = attributeValuesCell.querySelector('.checkbox-group')
                          if (!checkboxGroup) {
                            console.warn('[wing/inject] ❌ checkbox-group not found')
                            return
                          }

                          // 버튼들이 로드될 때까지 대기
                          await delay(500)

                          // 모든 버튼 찾기
                          const buttons = checkboxGroup.querySelectorAll('button.wuic-button')
                          console.log('[wing/inject] Found buttons:', buttons.length)

                          if (buttons.length === 0) {
                            console.warn('[wing/inject] ❌ No buttons found in checkbox-group')
                            return
                          }

                          // 버튼 텍스트 로깅
                          console.log('[wing/inject] 🔍 Button texts found:')
                          buttons.forEach((btn, idx) => {
                            console.log(`[wing/inject]   Button ${idx + 1}: "${btn.textContent?.trim()}"`)
                          })

                          // firstAttributeValue와 일치하는 버튼 찾기
                          // 버튼들은 이미 특수문자 -> 숫자(작은순) -> 영어(앞글자순) 순서로 정렬되어 있음
                          let firstMatchedButton = null
                          let firstMatchedButtonText = null

                          for (let i = 0; i < buttons.length; i++) {
                            const button = buttons[i]
                            const buttonText = button.textContent?.trim()
                            console.log(`[wing/inject] Checking button ${i + 1}: "${buttonText}"`)

                            // firstAttributeValue와 비교 (대소문자 무시, 공백 제거 후 정확히 일치해야 함)
                            const normalizedButtonText = buttonText?.toUpperCase().trim().replace(/\s+/g, '')
                            const normalizedFirstAttrValue = firstAttributeValue
                              .toUpperCase()
                              .trim()
                              .replace(/\s+/g, '')

                            // 정확히 일치하는 경우만 허용
                            if (normalizedButtonText === normalizedFirstAttrValue) {
                              console.log(
                                `[wing/inject]   ✅ Exact match: "${buttonText}" === "${firstAttributeValue}"`,
                              )
                              firstMatchedButton = button
                              firstMatchedButtonText = buttonText
                              break
                            }

                            console.log(`[wing/inject]   ⏭️ Skipping button: "${buttonText}" (no exact match)`)
                          }

                          if (firstMatchedButton && firstMatchedButtonText) {
                            console.log(`[wing/inject] ✅ Found exact matching button: "${firstMatchedButtonText}"`)
                          } else {
                            console.error(
                              `[wing/inject] ❌ No exact match found for firstAttributeValue: "${firstAttributeValue}"`,
                            )
                            console.error(
                              `[wing/inject] ❌ Available buttons: ${Array.from(buttons)
                                .map(b => `"${b.textContent?.trim()}"`)
                                .join(', ')}`,
                            )

                            // 정확히 일치하는 버튼이 없으면 에러 처리 및 탭 종료
                            try {
                              console.log('[wing/inject] 🚨 Sending BAD_OPTION_VALUE error and closing tab...')

                              // Background에 에러 메시지 전송
                              chrome.runtime.sendMessage(
                                {
                                  type: 'PRODUCT_UPLOAD_ERROR',
                                  productId: Number(productId),
                                  status: 'BAD_OPTION_VALUE',
                                  error: `정확히 일치하는 옵션을 찾을 수 없습니다. firstAttributeValue: "${firstAttributeValue}"`,
                                },
                                response => {
                                  console.log('[wing/inject] ✅ Error notification sent, response:', response)
                                },
                              )

                              // 탭 종료
                              await delay(500)
                              window.close()
                              return
                            } catch (error) {
                              console.error('[wing/inject] ❌ Error handling BAD_OPTION_VALUE:', error)
                            }
                          }

                          // 첫 번째 매칭 버튼을 1초 간격으로 3번 클릭 (정확히 일치하는 경우만)
                          if (firstMatchedButton && firstMatchedButtonText) {
                            try {
                              console.log(
                                `[wing/inject] ✅ Clicking first matching button 3 times with 1s interval: "${firstMatchedButtonText}"`,
                              )

                              // 3번 클릭 (1초 간격)
                              for (let clickCount = 0; clickCount < 3; clickCount++) {
                                // 각 클릭 사이에 1초 간격 (첫 번째 클릭 제외)
                                if (clickCount > 0) {
                                  await delay(1000)
                                }

                                // 클릭 전에 버튼을 다시 찾기 (DOM 업데이트 대응)
                                // 정확히 일치하는 버튼만 찾기
                                let currentButton = null
                                const allButtons = checkboxGroup.querySelectorAll('button.wuic-button')
                                const normalizedTargetText = firstMatchedButtonText
                                  .toUpperCase()
                                  .trim()
                                  .replace(/\s+/g, '')

                                for (let i = 0; i < allButtons.length; i++) {
                                  const button = allButtons[i]
                                  const buttonText = button.textContent?.trim()
                                  const normalizedButtonText = buttonText?.toUpperCase().trim().replace(/\s+/g, '')

                                  // 정확히 일치하는 경우만 허용
                                  if (normalizedButtonText === normalizedTargetText) {
                                    currentButton = button
                                    console.log(
                                      `[wing/inject] ✅ Found exact match for click ${clickCount + 1}/3: "${buttonText}"`,
                                    )
                                    break
                                  }
                                }

                                if (!currentButton) {
                                  console.error(
                                    `[wing/inject] ❌ Could not find exact match for "${firstMatchedButtonText}" on click ${clickCount + 1}/3`,
                                  )
                                  console.error(
                                    `[wing/inject] Available buttons: ${Array.from(allButtons)
                                      .map(b => `"${b.textContent?.trim()}"`)
                                      .join(', ')}`,
                                  )
                                  // 정확히 일치하는 버튼을 찾지 못하면 클릭 중단
                                  break
                                }

                                if (currentButton.disabled) {
                                  console.warn(
                                    `[wing/inject] ⚠️ Button is disabled for click ${clickCount + 1}/3: "${firstMatchedButtonText}"`,
                                  )
                                  continue
                                }

                                console.log(
                                  `[wing/inject] Clicking ${clickCount + 1}/3: "${currentButton.textContent?.trim()}"`,
                                )

                                // 버튼을 viewport에 보이도록 스크롤
                                currentButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                await delay(100)

                                // 버튼의 실제 위치 계산
                                const rect = currentButton.getBoundingClientRect()
                                const x = rect.left + rect.width / 2
                                const y = rect.top + rect.height / 2

                                // 실제 마우스 클릭을 더 정확하게 시뮬레이션
                                // MouseEvent를 통한 실제 마우스 클릭 시뮬레이션
                                const mouseDownEvent = new MouseEvent('mousedown', {
                                  bubbles: true,
                                  cancelable: true,
                                  view: window,
                                  detail: 1,
                                  screenX: x + window.screenX,
                                  screenY: y + window.screenY,
                                  clientX: x,
                                  clientY: y,
                                  button: 0,
                                  buttons: 1,
                                })

                                const mouseUpEvent = new MouseEvent('mouseup', {
                                  bubbles: true,
                                  cancelable: true,
                                  view: window,
                                  detail: 1,
                                  screenX: x + window.screenX,
                                  screenY: y + window.screenY,
                                  clientX: x,
                                  clientY: y,
                                  button: 0,
                                  buttons: 0,
                                })

                                const clickEvent = new MouseEvent('click', {
                                  bubbles: true,
                                  cancelable: true,
                                  view: window,
                                  detail: 1,
                                  screenX: x + window.screenX,
                                  screenY: y + window.screenY,
                                  clientX: x,
                                  clientY: y,
                                  button: 0,
                                  buttons: 0,
                                })

                                // 포인터 이벤트도 시뮬레이션 (최신 프레임워크 지원)
                                const pointerDownEvent = new PointerEvent('pointerdown', {
                                  bubbles: true,
                                  cancelable: true,
                                  view: window,
                                  detail: 1,
                                  clientX: x,
                                  clientY: y,
                                  pointerId: 1,
                                  pointerType: 'mouse',
                                  button: 0,
                                  buttons: 1,
                                })

                                const pointerUpEvent = new PointerEvent('pointerup', {
                                  bubbles: true,
                                  cancelable: true,
                                  view: window,
                                  detail: 1,
                                  clientX: x,
                                  clientY: y,
                                  pointerId: 1,
                                  pointerType: 'mouse',
                                  button: 0,
                                  buttons: 0,
                                })

                                // 이벤트를 순서대로 발생
                                currentButton.dispatchEvent(pointerDownEvent)
                                currentButton.dispatchEvent(mouseDownEvent)
                                await delay(50) // 짧은 딜레이로 실제 클릭처럼
                                currentButton.dispatchEvent(pointerUpEvent)
                                currentButton.dispatchEvent(mouseUpEvent)
                                currentButton.dispatchEvent(clickEvent)

                                // fallback: 기본 click 메서드도 호출
                                currentButton.click()

                                console.log(
                                  `[wing/inject] ✅ Successfully triggered click ${clickCount + 1}/3 on first matching button: "${currentButton.textContent?.trim()}"`,
                                )

                                // 클릭 후 DOM 업데이트 대기
                                await delay(200)
                              }

                              // 마지막 클릭 후 버튼 상태 확인
                              await delay(200)
                              const finalButton = checkboxGroup.querySelector('button.wuic-button')
                              if (finalButton) {
                                const isSelected =
                                  finalButton.getAttribute('data-wuic-props')?.includes('type:secondary') ||
                                  finalButton.classList.contains('selected') ||
                                  finalButton.getAttribute('aria-pressed') === 'true'
                                console.log(
                                  `[wing/inject] First matching button "${firstMatchedButtonText}" selected state: ${isSelected}`,
                                )
                              }
                            } catch (error) {
                              console.error(
                                `[wing/inject] ❌ Error clicking first matching button "${firstMatchedButtonText}":`,
                                error,
                              )
                            }
                          } else {
                            console.warn(
                              `[wing/inject] ⚠️ No matching button found in attributeValues for attribute "${targetAttributeName}"`,
                            )
                          }

                          console.log(
                            `[wing/inject] ✅ ${firstMatchedButton ? 'Clicked' : 'Skipped'} first matching button for attribute "${targetAttributeName}"`,
                          )

                          // 클릭 후 버튼 상태 확인
                          await delay(500)
                          const clickedButtons = checkboxGroup.querySelectorAll(
                            'button.wuic-button[data-wuic-props*="type:secondary"]',
                          )
                          console.log('[wing/inject] Buttons with secondary type (clicked):', clickedButtons.length)
                        }

                        // '선택완료' 버튼 클릭
                        await delay(1000)
                        console.log('[wing/inject] Looking for "선택완료" button...')

                        let completeButton = null
                        for (let i = 0; i < 50; i++) {
                          await delay(100)
                          completeButton = findButtonByText('선택완료')
                          if (completeButton) break
                        }

                        if (!completeButton) {
                          console.warn('[wing/inject] ❌ "선택완료" button not found')
                          return
                        }

                        console.log('[wing/inject] ✅ Found "선택완료" button! Clicking...')
                        completeButton.click()
                        console.log('[wing/inject] ✅ "선택완료" button clicked successfully')

                        // 4. 3초 대기 후 option-pane-component로 스크롤
                        await delay(3000)
                        console.log('[wing/inject] 📜 Scrolling to option-pane-component...')
                        const optionPaneComponent = document.querySelector('.option-pane-component')
                        if (optionPaneComponent) {
                          optionPaneComponent.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          await delay(500) // 스크롤 완료 대기
                          console.log('[wing/inject] ✅ Scrolled to option-pane-component')
                        } else {
                          console.warn('[wing/inject] ⚠️ option-pane-component not found')
                        }

                        // 5. 가격 및 재고 설정
                        await delay(500)
                        console.log('[wing/inject] Setting price and stock for all rows...')

                        // 옵션 테이블의 모든 row 찾기
                        const optionRows = document.querySelectorAll('.option-pane-table-row[data-row-id]')
                        console.log('[wing/inject] 📦 Found option rows:', optionRows.length)

                        if (optionRows.length === 0) {
                          console.warn('[wing/inject] ⚠️ No option rows found')
                        } else {
                          // 옵션명이 firstAttributeValue로 시작하지 않는 항목만 체크박스 클릭
                          if (firstAttributeValue) {
                            console.log(
                              `[wing/inject] 🔍 Validating option names - checking if they start with "${firstAttributeValue}"`,
                            )

                            optionRows.forEach((row, index) => {
                              try {
                                // 옵션명 셀 찾기 (체크박스 다음의 첫 번째 셀)
                                // 옵션명은 span[style*="font-weight: 700"] 안에 있음
                                const optionNameSpan = row.querySelector('span[style*="font-weight: 700"] span')
                                if (!optionNameSpan) {
                                  console.warn(`[wing/inject] ⚠️ Row ${index + 1}: Option name span not found`)
                                  return
                                }

                                // 옵션명 텍스트 추출
                                const optionNameText = optionNameSpan.textContent?.trim() || ''
                                console.log(`[wing/inject] Row ${index + 1}: Option name = "${optionNameText}"`)

                                // 옵션명이 firstAttributeValue로 시작하는지 확인 (대소문자 무시, 공백 제거)
                                const normalizedOptionName = optionNameText.toUpperCase().trim().replace(/\s+/g, '')
                                const normalizedFirstAttrValue = firstAttributeValue
                                  .toUpperCase()
                                  .trim()
                                  .replace(/\s+/g, '')

                                // firstAttributeValue로 시작하지 않으면 체크박스 클릭 (부적절한 항목)
                                if (!normalizedOptionName.startsWith(normalizedFirstAttrValue)) {
                                  const checkbox = row.querySelector('input[type="checkbox"]')
                                  if (checkbox && !checkbox.checked) {
                                    console.log(
                                      `[wing/inject] ⚠️ Row ${index + 1}: Option name does not start with "${firstAttributeValue}", clicking checkbox`,
                                    )
                                    checkbox.click()
                                  } else if (checkbox && checkbox.checked) {
                                    console.log(
                                      `[wing/inject] ✅ Row ${index + 1}: Invalid option name already checked`,
                                    )
                                  } else {
                                    console.warn(`[wing/inject] ⚠️ Row ${index + 1}: Checkbox not found`)
                                  }
                                } else {
                                  console.log(
                                    `[wing/inject] ✅ Row ${index + 1}: Valid option name (starts with "${firstAttributeValue}")`,
                                  )
                                }
                              } catch (error) {
                                console.error(`[wing/inject] ❌ Row ${index + 1}: Error validating option name:`, error)
                              }
                            })

                            // 체크박스 클릭 후 잠시 대기
                            await delay(500)

                            // '옵션 목록' 아래 있는 '삭제' 버튼 클릭
                            try {
                              console.log('[wing/inject] 🔍 Looking for "삭제" button in bulk-operations...')

                              // 여러 방법으로 '삭제' 버튼 찾기 시도
                              let deleteButton = null

                              // 방법 1: bulk-operations 내부에서 찾기
                              const bulkOperations = document.querySelector('.bulk-operations')
                              if (bulkOperations) {
                                // bulk-operations-left의 첫 번째 버튼이 '삭제' 버튼
                                const bulkOperationsLeft = bulkOperations.querySelector('.bulk-operations-left')
                                if (bulkOperationsLeft) {
                                  const firstButton = bulkOperationsLeft.querySelector('button')
                                  if (firstButton) {
                                    const buttonText = firstButton.textContent?.trim() || ''
                                    if (buttonText === '삭제') {
                                      deleteButton = firstButton
                                      console.log('[wing/inject] ✅ Found "삭제" button via bulk-operations-left')
                                    }
                                  }
                                }

                                // 방법 2: 모든 버튼 중에서 '삭제' 텍스트 찾기
                                if (!deleteButton) {
                                  deleteButton = Array.from(bulkOperations.querySelectorAll('button')).find(btn => {
                                    const buttonText = btn.textContent?.trim() || ''
                                    return buttonText === '삭제'
                                  })
                                  if (deleteButton) {
                                    console.log('[wing/inject] ✅ Found "삭제" button via text search')
                                  }
                                }
                              }

                              // 방법 3: document 전체에서 찾기 (fallback)
                              if (!deleteButton) {
                                const allButtons = document.querySelectorAll('button')
                                deleteButton = Array.from(allButtons).find(btn => {
                                  const buttonText = btn.textContent?.trim() || ''
                                  const isInBulkOperations = btn.closest('.bulk-operations') !== null
                                  return buttonText === '삭제' && isInBulkOperations
                                })
                                if (deleteButton) {
                                  console.log('[wing/inject] ✅ Found "삭제" button via document search')
                                }
                              }

                              if (deleteButton) {
                                console.log('[wing/inject] ✅ Found "삭제" button, clicking...')

                                // 버튼이 보이는지 확인하고 스크롤
                                deleteButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                await delay(300)

                                // 더 정확한 클릭을 위해 여러 이벤트 발생
                                const pointerDownEvent = new PointerEvent('pointerdown', {
                                  bubbles: true,
                                  cancelable: true,
                                  pointerId: 1,
                                  pointerType: 'mouse',
                                })
                                const mouseDownEvent = new MouseEvent('mousedown', {
                                  bubbles: true,
                                  cancelable: true,
                                  button: 0,
                                })
                                const pointerUpEvent = new PointerEvent('pointerup', {
                                  bubbles: true,
                                  cancelable: true,
                                  pointerId: 1,
                                  pointerType: 'mouse',
                                })
                                const mouseUpEvent = new MouseEvent('mouseup', {
                                  bubbles: true,
                                  cancelable: true,
                                  button: 0,
                                })
                                const clickEvent = new MouseEvent('click', {
                                  bubbles: true,
                                  cancelable: true,
                                  button: 0,
                                })

                                // 이벤트를 순서대로 발생
                                deleteButton.dispatchEvent(pointerDownEvent)
                                deleteButton.dispatchEvent(mouseDownEvent)
                                await delay(50)
                                deleteButton.dispatchEvent(pointerUpEvent)
                                deleteButton.dispatchEvent(mouseUpEvent)
                                deleteButton.dispatchEvent(clickEvent)

                                // fallback: 기본 click 메서드도 호출
                                deleteButton.click()

                                console.log('[wing/inject] ✅ "삭제" button clicked successfully')
                                await delay(500)
                              } else {
                                console.warn('[wing/inject] ⚠️ "삭제" button not found')
                              }
                            } catch (error) {
                              console.error('[wing/inject] ❌ Error clicking "삭제" button:', error)
                            }
                          }

                          // 모든 row에 대해 순회
                          optionRows.forEach((row, index) => {
                            try {
                              // 각 row의 아이템위너가격 찾기
                              const itemWinnerPriceElement = row.querySelector('.pre-matching > div:first-child')
                              if (!itemWinnerPriceElement) {
                                console.warn(`[wing/inject] ⚠️ Row ${index + 1}: Item winner price element not found`)
                                return
                              }

                              const itemWinnerPriceText = itemWinnerPriceElement.textContent.trim().replace(/,/g, '')
                              const itemWinnerPrice = parseInt(itemWinnerPriceText)
                              console.log(`[wing/inject] Row ${index + 1}: Item Winner Price = ${itemWinnerPrice}`)

                              if (isNaN(itemWinnerPrice)) {
                                console.warn(`[wing/inject] ⚠️ Row ${index + 1}: Could not parse item winner price`)
                                return
                              }

                              // 모든 input 찾기
                              const inputs = row.querySelectorAll('input.sc-common-input[type="text"]')
                              console.log(`[wing/inject] Row ${index + 1}: Found ${inputs.length} inputs`)

                              // 판매가 input (두 번째 input, index 1)
                              const salePriceInput = inputs[1]

                              // 재고수량 input 찾기 (text-align: center 스타일을 가진 input)
                              let stockInput = null
                              inputs.forEach((input, idx) => {
                                const computedStyle = window.getComputedStyle(input)
                                if (computedStyle.textAlign === 'center' && idx > 3) {
                                  if (!stockInput) {
                                    stockInput = input
                                  }
                                }
                              })

                              // 만약 위 방법으로 못 찾으면 배열에서 직접 선택
                              if (!stockInput && inputs.length >= 5) {
                                stockInput = inputs[4]
                              }

                              // 판매가 설정 (아이템위너가격보다 100원 싸게, 단 최소 가격 검증)
                              if (salePriceInput) {
                                // 기본 계산: 아이템위너가격 - 100원
                                let calculatedPrice = Math.max(0, itemWinnerPrice - 100)

                                /**
                                 * 역마진 세이프티 (현재 비활성화)
                                 *
                                 * - 목적:
                                 *   아이템위너 -100원으로 계산한 가격이
                                 *   최소 (salePrice * 1.2) 이면서 동시에 (salePrice + 5000원) 이상이 되도록 보정해서
                                 *   역마진(너무 낮은 판매가)을 방지하는 안전장치.
                                 *
                                 * - 현재는 실험/조정 단계이므로 실제 계산에는 적용하지 않고
                                 *   코드만 보존한다. (조건문 앞의 false로 항상 스킵)
                                 */
                                if (false && salePrice && salePrice > 0) {
                                  // 최소 가격 1: salePrice + 5000원
                                  const minPrice1 = salePrice + 5000
                                  // 최소 가격 2: salePrice * 1.2 (20% 이상)
                                  const minPrice2 = Math.ceil(salePrice * 1.2)
                                  // 둘 중 높은 가격
                                  const minPrice = Math.max(minPrice1, minPrice2)

                                  console.log(
                                    `[wing/inject] Row ${index + 1}: [역마진 세이프티] salePrice: ${salePrice}, minPrice1: ${minPrice1}, minPrice2: ${minPrice2}, minPrice: ${minPrice}, calculatedPrice(before): ${calculatedPrice}`,
                                  )

                                  // 계산된 가격이 최소 가격보다 낮으면 최소 가격으로 설정
                                  if (calculatedPrice < minPrice) {
                                    calculatedPrice = minPrice
                                    console.log(
                                      `[wing/inject] Row ${index + 1}: [역마진 세이프티] Calculated price (${itemWinnerPrice - 100}) is lower than minPrice (${minPrice}), using minPrice`,
                                    )
                                  }
                                }

                                const finalSalePrice = calculatedPrice
                                salePriceInput.focus()
                                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                                  window.HTMLInputElement.prototype,
                                  'value',
                                ).set
                                nativeInputValueSetter.call(salePriceInput, finalSalePrice.toString())
                                salePriceInput.dispatchEvent(new Event('input', { bubbles: true }))
                                salePriceInput.dispatchEvent(new Event('change', { bubbles: true }))
                                salePriceInput.blur()
                                console.log(
                                  `[wing/inject] ✅ Row ${index + 1}: Set sale price to ${finalSalePrice} (item winner price: ${itemWinnerPrice} - 100, validated with minPrice)`,
                                )
                              } else {
                                console.warn(`[wing/inject] ⚠️ Row ${index + 1}: Sale price input not found`)
                              }

                              // 재고수량 설정 (1000으로)
                              if (stockInput) {
                                stockInput.focus()
                                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                                  window.HTMLInputElement.prototype,
                                  'value',
                                ).set
                                nativeInputValueSetter.call(stockInput, '1000')
                                stockInput.dispatchEvent(new Event('input', { bubbles: true }))
                                stockInput.dispatchEvent(new Event('change', { bubbles: true }))
                                stockInput.blur()
                                console.log(`[wing/inject] ✅ Row ${index + 1}: Set stock to 1000`)
                              } else {
                                console.warn(`[wing/inject] ⚠️ Row ${index + 1}: Stock input not found`)
                              }
                            } catch (error) {
                              console.error(`[wing/inject] ❌ Error processing row ${index + 1}:`, error)
                            }
                          })

                          console.log(`[wing/inject] ✅ Finished setting price and stock for ${optionRows.length} rows`)

                          // 6. panel-contents로 스크롤 후 '기본 등록' 버튼 클릭
                          await delay(1000)
                          console.log('[wing/inject] 📜 Scrolling to panel-contents...')
                          const panelContents = document.getElementById('panel-contents')
                          if (panelContents) {
                            panelContents.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            await delay(500) // 스크롤 완료 대기
                            console.log('[wing/inject] ✅ Scrolled to panel-contents')

                            // '기본 등록' 버튼 찾기 및 클릭
                            await delay(500)
                            console.log('[wing/inject] Looking for "기본 등록" button...')

                            // 방법 1: radio input 찾기
                            const basicRegisterRadio = document.getElementById('tab-content-level-0')
                            if (basicRegisterRadio) {
                              console.log('[wing/inject] ✅ Found "기본 등록" radio input!')

                              // radio input 클릭
                              basicRegisterRadio.click()

                              // label도 클릭 (더 확실한 선택을 위해)
                              const basicRegisterLabel = document.querySelector('label[for="tab-content-level-0"]')
                              if (basicRegisterLabel) {
                                basicRegisterLabel.click()
                                console.log('[wing/inject] ✅ Clicked "기본 등록" label')
                              }

                              // checked 속성도 설정
                              basicRegisterRadio.checked = true
                              basicRegisterRadio.dispatchEvent(new Event('change', { bubbles: true }))

                              console.log('[wing/inject] ✅ "기본 등록" button clicked successfully')
                            } else {
                              // 방법 2: label 텍스트로 찾기
                              const labels = document.querySelectorAll('label')
                              let found = false
                              for (const label of labels) {
                                if (label.textContent?.trim().includes('기본 등록')) {
                                  console.log('[wing/inject] ✅ Found "기본 등록" label by text!')
                                  label.click()

                                  // 연결된 radio input도 클릭
                                  const radioId = label.getAttribute('for')
                                  if (radioId) {
                                    const radio = document.getElementById(radioId)
                                    if (radio) {
                                      radio.click()
                                      radio.checked = true
                                      radio.dispatchEvent(new Event('change', { bubbles: true }))
                                    }
                                  }

                                  found = true
                                  console.log('[wing/inject] ✅ "기본 등록" button clicked successfully')
                                  break
                                }
                              }

                              if (!found) {
                                console.warn('[wing/inject] ❌ "기본 등록" button not found')
                              }
                            }

                            // 7. '이미지 업로드' 탭 선택 및 '이미지 등록' 버튼 클릭
                            await delay(1000)
                            console.log('[wing/inject] Looking for "이미지 업로드" tab...')

                            // '이미지 업로드' 탭 선택 (id="tab-content-0")
                            const imageUploadRadio = document.getElementById('tab-content-0')
                            if (imageUploadRadio) {
                              console.log('[wing/inject] ✅ Found "이미지 업로드" radio input!')
                              imageUploadRadio.click()

                              const imageUploadLabel = document.querySelector('label[for="tab-content-0"]')
                              if (imageUploadLabel) {
                                imageUploadLabel.click()
                                console.log('[wing/inject] ✅ Clicked "이미지 업로드" label')
                              }

                              imageUploadRadio.checked = true
                              imageUploadRadio.dispatchEvent(new Event('change', { bubbles: true }))
                              console.log('[wing/inject] ✅ "이미지 업로드" tab selected')
                            } else {
                              console.warn('[wing/inject] ⚠️ "이미지 업로드" tab not found')
                            }

                            // '이미지 등록' 버튼 찾기 및 클릭
                            await delay(1000)
                            console.log('[wing/inject] Looking for "이미지 등록" button...')

                            let imageRegisterButton = null
                            // 방법 1: 버튼 텍스트로 찾기
                            const buttons = document.querySelectorAll('button.sc-common-btn')
                            for (const btn of buttons) {
                              if (btn.textContent?.trim().includes('이미지 등록')) {
                                imageRegisterButton = btn
                                console.log('[wing/inject] ✅ Found "이미지 등록" button by text!')
                                break
                              }
                            }

                            // 방법 2: class에 button이 포함된 버튼 찾기
                            if (!imageRegisterButton) {
                              const buttonElements = document.querySelectorAll('button.button, button.sc-common-btn')
                              for (const btn of buttonElements) {
                                if (btn.textContent?.trim().includes('이미지 등록')) {
                                  imageRegisterButton = btn
                                  console.log('[wing/inject] ✅ Found "이미지 등록" button by class!')
                                  break
                                }
                              }
                            }

                            if (imageRegisterButton) {
                              // 버튼을 viewport에 보이도록 스크롤
                              imageRegisterButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              await delay(300)

                              console.log('[wing/inject] ✅ Clicking "이미지 등록" button...')
                              imageRegisterButton.click()
                              console.log('[wing/inject] ✅ "이미지 등록" button clicked successfully')

                              // 8. 팝업이 뜰 때까지 대기 후 이미지 업로드
                              await delay(2000) // 팝업이 뜰 때까지 대기
                              console.log('[wing/inject] 📸 Waiting for image upload modal to appear...')

                              // 이미지 업로드 모달이 나타날 때까지 대기
                              let modalAppeared = false
                              for (let i = 0; i < 30; i++) {
                                const imageModal = document.querySelector('.image-modal, [class*="image-modal"]')
                                const dropZone = document.querySelector('.image-drop-zone, [class*="image-drop-zone"]')
                                const fileInput = document.querySelector(
                                  'input[type="file"][hidden], input[type="file"]',
                                )

                                if (imageModal || dropZone || fileInput) {
                                  modalAppeared = true
                                  console.log('[wing/inject] ✅ Image upload modal appeared!')
                                  break
                                }
                                await delay(200)
                              }

                              if (modalAppeared) {
                                await delay(500)
                                console.log('[wing/inject] 📤 Uploading images to dropzone...')

                                // 저장된 이미지 가져오기
                                const images = window.__COUPANG_PRODUCT_IMAGES__ || []
                                const itemBriefCapture = window.__ITEM_BRIEF_CAPTURE__ || null

                                console.log('[wing/inject] 📦 Images from window:', images)
                                console.log('[wing/inject] 📦 Images length:', images.length)
                                console.log('[wing/inject] 📄 ItemBrief capture:', !!itemBriefCapture)
                                if (images.length > 0) {
                                  console.log('[wing/inject] 📸 First image URL:', images[0])
                                }

                                // 업로드할 파일 배열
                                const filesToUpload = []

                                // 1. 썸네일 이미지 (첫 번째 이미지) - legacy 방식 사용 (FETCH_IMAGE_BLOBS)
                                if (images.length > 0 && images[0]) {
                                  try {
                                    const mainImageUrl = images[0]
                                    console.log(
                                      '[wing/inject] 📥 Fetching thumbnail image via background:',
                                      mainImageUrl,
                                    )

                                    // Background를 통해 이미지 fetch (CORS 우회)
                                    const blobResponse = await chrome.runtime.sendMessage({
                                      type: 'FETCH_IMAGE_BLOBS',
                                      payload: { imageUrls: [mainImageUrl] },
                                    })

                                    console.log('[wing/inject] 📦 Background response:', blobResponse)

                                    if (!blobResponse || !blobResponse.ok) {
                                      console.error(
                                        '[wing/inject] ❌ Failed to fetch image via background:',
                                        blobResponse?.error || 'No response',
                                      )
                                      throw new Error(blobResponse?.error || 'Failed to fetch image via background')
                                    }

                                    if (!blobResponse.blobs || blobResponse.blobs.length === 0) {
                                      console.error('[wing/inject] ❌ No blobs in response')
                                      throw new Error('No blobs in response')
                                    }

                                    const blobData = blobResponse.blobs[0]
                                    if (blobData.error) {
                                      console.error('[wing/inject] ❌ Blob fetch error:', blobData.error)
                                      throw new Error(blobData.error)
                                    }

                                    if (!blobData.base64) {
                                      console.error('[wing/inject] ❌ No base64 data in blob')
                                      throw new Error('No base64 data in blob')
                                    }

                                    console.log('[wing/inject] 📄 Blob data received:', {
                                      hasBase64: !!blobData.base64,
                                      type: blobData.type,
                                      url: blobData.url,
                                    })

                                    // base64를 File로 변환 (legacy 방식)
                                    const base64Response = await fetch(blobData.base64)
                                    const blob = await base64Response.blob()
                                    const thumbnailFile = new File([blob], 'thumbnail.jpg', {
                                      type: blobData.type || 'image/jpeg',
                                    })

                                    filesToUpload.push(thumbnailFile)
                                    console.log(
                                      '[wing/inject] ✅ Thumbnail image prepared via background, file size:',
                                      thumbnailFile.size,
                                      'bytes',
                                    )
                                  } catch (error) {
                                    console.error('[wing/inject] ❌ Failed to fetch thumbnail:', error)
                                    console.error('[wing/inject] ❌ Error details:', error.message, error.stack)
                                    // 에러 발생 시에도 계속 진행 (다음 파일 처리)
                                  }
                                } else {
                                  console.warn(
                                    '[wing/inject] ⚠️ No images available in window.__COUPANG_PRODUCT_IMAGES__',
                                  )
                                }

                                // 2. 필수 표기 정보 (itemBriefCapture)
                                if (itemBriefCapture) {
                                  try {
                                    console.log('[wing/inject] 📥 Processing itemBrief capture...')
                                    // base64 이미지를 Blob으로 변환
                                    const base64Data = itemBriefCapture.startsWith('data:')
                                      ? itemBriefCapture
                                      : `data:image/png;base64,${itemBriefCapture}`

                                    const response = await fetch(base64Data)
                                    const blob = await response.blob()
                                    const briefFile = new File([blob], 'itemBrief.png', {
                                      type: blob.type || 'image/png',
                                    })
                                    filesToUpload.push(briefFile)
                                    console.log(
                                      '[wing/inject] ✅ ItemBrief capture prepared, file size:',
                                      briefFile.size,
                                    )
                                  } catch (error) {
                                    console.error('[wing/inject] ❌ Failed to process itemBrief:', error)
                                    console.error('[wing/inject] ❌ Error details:', error.message, error.stack)
                                  }
                                } else {
                                  console.warn('[wing/inject] ⚠️ No itemBrief capture available')
                                }

                                if (filesToUpload.length === 0) {
                                  console.warn('[wing/inject] ⚠️ No files to upload')
                                } else {
                                  console.log(`[wing/inject] 📤 Preparing to upload ${filesToUpload.length} file(s)...`)

                                  // file input 찾기
                                  const fileInput = document.querySelector('input[type="file"]')
                                  if (fileInput) {
                                    console.log('[wing/inject] ✅ Found file input')

                                    // FileList 생성 (DOM API 제한으로 DataTransfer 사용)
                                    const dataTransfer = new DataTransfer()
                                    filesToUpload.forEach(file => {
                                      dataTransfer.items.add(file)
                                    })
                                    fileInput.files = dataTransfer.files

                                    // change 이벤트 발생
                                    const changeEvent = new Event('change', { bubbles: true })
                                    fileInput.dispatchEvent(changeEvent)

                                    // input 이벤트도 발생
                                    const inputEvent = new Event('input', { bubbles: true })
                                    fileInput.dispatchEvent(inputEvent)

                                    console.log('[wing/inject] ✅ Files uploaded to file input')

                                    // 9. 이미지 업로드 후 3초 대기
                                    await delay(3000)
                                    console.log('[wing/inject] ⏳ Waited 3 seconds after image upload...')

                                    // 10. '저장' 버튼 찾기 및 클릭
                                    console.log('[wing/inject] 🔍 Looking for "저장" button...')
                                    let saveButton = null
                                    for (let i = 0; i < 30; i++) {
                                      saveButton = findButtonByText('저장')
                                      if (saveButton) {
                                        console.log('[wing/inject] ✅ Found "저장" button!')
                                        break
                                      }
                                      await delay(200)
                                    }

                                    if (saveButton) {
                                      saveButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                      await delay(300)
                                      console.log('[wing/inject] ✅ Clicking "저장" button...')
                                      saveButton.click()
                                      console.log('[wing/inject] ✅ "저장" button clicked successfully')

                                      // 11. 저장 버튼 클릭 후 panel-product-meta-info로 스크롤
                                      await delay(1000)
                                      console.log('[wing/inject] 📜 Scrolling to panel-product-meta-info...')
                                      const panelProductMetaInfo = document.getElementById('panel-product-meta-info')
                                      if (panelProductMetaInfo) {
                                        panelProductMetaInfo.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                        await delay(500) // 스크롤 완료 대기
                                        console.log('[wing/inject] ✅ Scrolled to panel-product-meta-info')

                                        // 12. 인증정보 > 상세페이지 별도표기 클릭
                                        await delay(500)
                                        console.log(
                                          '[wing/inject] 🔍 Looking for "상세페이지 별도표기" radio button...',
                                        )
                                        let certificationRadio = document.getElementById(
                                          'certificationType_PRESENTED_IN_DETAIL_PAGE_1',
                                        )
                                        if (!certificationRadio) {
                                          // label로 찾기
                                          const labels = document.querySelectorAll(
                                            'label[for="certificationType_PRESENTED_IN_DETAIL_PAGE_1"]',
                                          )
                                          if (labels.length > 0) {
                                            console.log(
                                              '[wing/inject] ✅ Found "상세페이지 별도표기" label, clicking...',
                                            )
                                            labels[0].click()
                                          } else {
                                            // 텍스트로 찾기
                                            const radioButtons = document.querySelectorAll(
                                              'input[type="radio"][name="certificationType"]',
                                            )
                                            for (const radio of radioButtons) {
                                              const label = document.querySelector(`label[for="${radio.id}"]`)
                                              if (label && label.textContent?.trim().includes('상세페이지 별도표기')) {
                                                certificationRadio = radio
                                                console.log(
                                                  '[wing/inject] ✅ Found "상세페이지 별도표기" radio by text',
                                                )
                                                break
                                              }
                                            }
                                          }
                                        }

                                        if (certificationRadio) {
                                          certificationRadio.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                          await delay(200)
                                          certificationRadio.checked = true
                                          certificationRadio.click()
                                          certificationRadio.dispatchEvent(new Event('change', { bubbles: true }))
                                          console.log('[wing/inject] ✅ "상세페이지 별도표기" clicked successfully')
                                        } else {
                                          console.warn('[wing/inject] ⚠️ "상세페이지 별도표기" radio button not found')
                                        }

                                        // 13. 판매기간 > 설정안함 클릭
                                        await delay(500)
                                        console.log(
                                          '[wing/inject] 🔍 Looking for "설정안함" radio button for 판매기간...',
                                        )
                                        let salePeriodRadio = document.getElementById('salePeriod_N_1')
                                        if (!salePeriodRadio) {
                                          // label로 찾기
                                          const labels = document.querySelectorAll('label[for="salePeriod_N_1"]')
                                          if (labels.length > 0) {
                                            console.log(
                                              '[wing/inject] ✅ Found "설정안함" label for 판매기간, clicking...',
                                            )
                                            labels[0].click()
                                          } else {
                                            // 판매기간 섹션 내에서 찾기
                                            const salePeriodSection = panelProductMetaInfo.querySelector(
                                              '[data-v-242f2d92=""] .wrapper',
                                            )
                                            if (salePeriodSection) {
                                              const radioButtons = salePeriodSection.querySelectorAll(
                                                'input[type="radio"][name="salePeriod"]',
                                              )
                                              for (const radio of radioButtons) {
                                                const label = document.querySelector(`label[for="${radio.id}"]`)
                                                if (label && label.textContent?.trim().includes('설정안함')) {
                                                  salePeriodRadio = radio
                                                  console.log(
                                                    '[wing/inject] ✅ Found "설정안함" radio for 판매기간 by text',
                                                  )
                                                  break
                                                }
                                              }
                                            }
                                          }
                                        }

                                        if (salePeriodRadio) {
                                          salePeriodRadio.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                          await delay(200)
                                          salePeriodRadio.checked = true
                                          salePeriodRadio.click()
                                          salePeriodRadio.dispatchEvent(new Event('change', { bubbles: true }))
                                          console.log('[wing/inject] ✅ "설정안함" for 판매기간 clicked successfully')
                                        } else {
                                          console.warn(
                                            '[wing/inject] ⚠️ "설정안함" radio button for 판매기간 not found',
                                          )
                                        }

                                        // 14. panel-notice-category로 스크롤
                                        await delay(500)
                                        console.log('[wing/inject] 📜 Scrolling to panel-notice-category...')
                                        const panelNoticeCategory = document.getElementById('panel-notice-category')
                                        if (panelNoticeCategory) {
                                          panelNoticeCategory.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                          await delay(500) // 스크롤 완료 대기
                                          console.log('[wing/inject] ✅ Scrolled to panel-notice-category')

                                          // 15. '전체 상품 상세페이지 참조' 체크박스 클릭
                                          await delay(500)
                                          console.log(
                                            '[wing/inject] 🔍 Looking for "전체 상품 상세페이지 참조" checkbox...',
                                          )

                                          // 체크박스 찾기 (여러 방법 시도)
                                          let allPageCheckbox = null
                                          let allPageSpan = null

                                          // 방법 1: panel-notice-category 내에서 span.sc-common-check 찾기
                                          if (panelNoticeCategory) {
                                            const spans = panelNoticeCategory.querySelectorAll('span.sc-common-check')
                                            for (const span of spans) {
                                              const labelText = span.textContent?.trim().replace(/\s+/g, ' ')
                                              console.log('[wing/inject] 📝 Checking span text:', labelText)
                                              if (labelText && labelText.includes('전체 상품 상세페이지 참조')) {
                                                const checkbox = span.querySelector('input[type="checkbox"]')
                                                if (checkbox) {
                                                  allPageCheckbox = checkbox
                                                  allPageSpan = span
                                                  console.log(
                                                    '[wing/inject] ✅ Found "전체 상품 상세페이지 참조" checkbox in panel-notice-category',
                                                  )
                                                  break
                                                }
                                              }
                                            }
                                          }

                                          // 방법 2: 전체 문서에서 span.sc-common-check 찾기
                                          if (!allPageCheckbox) {
                                            const spans = document.querySelectorAll('span.sc-common-check')
                                            for (const span of spans) {
                                              const labelText = span.textContent?.trim().replace(/\s+/g, ' ')
                                              if (labelText && labelText.includes('전체 상품 상세페이지 참조')) {
                                                const checkbox = span.querySelector('input[type="checkbox"]')
                                                if (checkbox) {
                                                  allPageCheckbox = checkbox
                                                  allPageSpan = span
                                                  console.log(
                                                    '[wing/inject] ✅ Found "전체 상품 상세페이지 참조" checkbox by text in span',
                                                  )
                                                  break
                                                }
                                              }
                                            }
                                          }

                                          if (allPageCheckbox && allPageSpan) {
                                            console.log('[wing/inject] 📦 Found elements:', {
                                              checkbox: !!allPageCheckbox,
                                              span: !!allPageSpan,
                                              currentChecked: allPageCheckbox.checked,
                                            })

                                            // span을 먼저 스크롤
                                            allPageSpan.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                            await delay(500)

                                            // 체크박스가 이미 체크되어 있지 않은 경우에만 클릭
                                            if (!allPageCheckbox.checked) {
                                              // 방법 1: span의 중앙 좌표 계산하여 클릭
                                              const spanRect = allPageSpan.getBoundingClientRect()
                                              const spanX = spanRect.left + spanRect.width / 2
                                              const spanY = spanRect.top + spanRect.height / 2

                                              console.log('[wing/inject] 📍 Attempting click at coordinates:', {
                                                spanX,
                                                spanY,
                                              })

                                              // 마우스 이벤트 생성 (실제 좌표와 함께)
                                              const mouseDownEvent = new MouseEvent('mousedown', {
                                                bubbles: true,
                                                cancelable: true,
                                                view: window,
                                                clientX: spanX,
                                                clientY: spanY,
                                                button: 0,
                                              })

                                              const mouseUpEvent = new MouseEvent('mouseup', {
                                                bubbles: true,
                                                cancelable: true,
                                                view: window,
                                                clientX: spanX,
                                                clientY: spanY,
                                                button: 0,
                                              })

                                              const clickEvent = new MouseEvent('click', {
                                                bubbles: true,
                                                cancelable: true,
                                                view: window,
                                                clientX: spanX,
                                                clientY: spanY,
                                                button: 0,
                                              })

                                              // span에 마우스 이벤트 발생
                                              allPageSpan.dispatchEvent(mouseDownEvent)
                                              await delay(50)
                                              allPageSpan.dispatchEvent(mouseUpEvent)
                                              await delay(50)
                                              allPageSpan.dispatchEvent(clickEvent)
                                              allPageSpan.click()

                                              await delay(200)

                                              // 체크박스 좌표 계산하여 클릭
                                              const checkboxRect = allPageCheckbox.getBoundingClientRect()
                                              const checkboxX = checkboxRect.left + checkboxRect.width / 2
                                              const checkboxY = checkboxRect.top + checkboxRect.height / 2

                                              console.log('[wing/inject] 📍 Clicking checkbox at coordinates:', {
                                                checkboxX,
                                                checkboxY,
                                              })

                                              const checkboxMouseDown = new MouseEvent('mousedown', {
                                                bubbles: true,
                                                cancelable: true,
                                                view: window,
                                                clientX: checkboxX,
                                                clientY: checkboxY,
                                                button: 0,
                                              })

                                              const checkboxMouseUp = new MouseEvent('mouseup', {
                                                bubbles: true,
                                                cancelable: true,
                                                view: window,
                                                clientX: checkboxX,
                                                clientY: checkboxY,
                                                button: 0,
                                              })

                                              const checkboxClick = new MouseEvent('click', {
                                                bubbles: true,
                                                cancelable: true,
                                                view: window,
                                                clientX: checkboxX,
                                                clientY: checkboxY,
                                                button: 0,
                                              })

                                              // 체크박스에 직접 마우스 이벤트 발생
                                              allPageCheckbox.dispatchEvent(checkboxMouseDown)
                                              await delay(50)
                                              allPageCheckbox.checked = true
                                              allPageCheckbox.dispatchEvent(checkboxMouseUp)
                                              await delay(50)
                                              allPageCheckbox.dispatchEvent(checkboxClick)
                                              allPageCheckbox.click()

                                              // 추가 이벤트 발생
                                              allPageCheckbox.dispatchEvent(new Event('change', { bubbles: true }))
                                              allPageCheckbox.dispatchEvent(new Event('input', { bubbles: true }))
                                              allPageCheckbox.dispatchEvent(
                                                new Event('change', { bubbles: true, cancelable: true }),
                                              )

                                              await delay(300)

                                              // 상태 확인 및 재시도
                                              if (!allPageCheckbox.checked) {
                                                console.log(
                                                  '[wing/inject] ⚠️ Still not checked, trying direct manipulation...',
                                                )

                                                // 직접 속성 설정
                                                Object.defineProperty(allPageCheckbox, 'checked', {
                                                  writable: true,
                                                  value: true,
                                                })
                                                allPageCheckbox.setAttribute('checked', 'checked')

                                                // 다시 클릭 시도
                                                allPageSpan.click()
                                                allPageCheckbox.click()

                                                // 이벤트 재발생
                                                allPageCheckbox.dispatchEvent(new Event('change', { bubbles: true }))
                                                allPageCheckbox.dispatchEvent(new Event('input', { bubbles: true }))

                                                await delay(200)
                                              }

                                              console.log(
                                                '[wing/inject] ✅ Final state - Checked:',
                                                allPageCheckbox.checked,
                                                'Attribute:',
                                                allPageCheckbox.getAttribute('checked'),
                                              )
                                            } else {
                                              console.log(
                                                '[wing/inject] ℹ️ "전체 상품 상세페이지 참조" checkbox is already checked',
                                              )
                                            }
                                          } else {
                                            console.warn(
                                              '[wing/inject] ⚠️ "전체 상품 상세페이지 참조" checkbox not found',
                                            )
                                            if (!allPageCheckbox) {
                                              console.warn('[wing/inject] ⚠️ Checkbox element not found')
                                            }
                                            if (!allPageSpan) {
                                              console.warn('[wing/inject] ⚠️ Span element not found')
                                            }
                                          }

                                          // 16. '판매요청' 버튼 클릭 (1초 후)
                                          await delay(1000)
                                          console.log('[wing/inject] 🔍 Looking for "판매요청" button...')

                                          // footer.form-footer 내에서 '판매요청' 버튼 찾기 (legacy 방식)
                                          let saleRequestButton = null

                                          // 방법 1: legacy 방식 - footer.form-footer button.wing-web-component에서 찾기
                                          const formFooter = document.querySelector('footer.form-footer')
                                          if (formFooter) {
                                            const footerButtons =
                                              formFooter.querySelectorAll('button.wing-web-component')
                                            console.log('[wing/inject] 📋 Found footer buttons:', footerButtons.length)
                                            for (const button of footerButtons) {
                                              const buttonText = button.textContent?.trim() || ''
                                              console.log('[wing/inject] 📝 Checking button text:', buttonText)
                                              if (buttonText.includes('판매요청')) {
                                                saleRequestButton = button
                                                console.log(
                                                  '[wing/inject] ✅ Found "판매요청" button in footer by text:',
                                                  buttonText,
                                                )
                                                break
                                              }
                                            }
                                          }

                                          // 방법 2: 전체 문서에서 button.wing-web-component 찾기
                                          if (!saleRequestButton) {
                                            const allWingButtons =
                                              document.querySelectorAll('button.wing-web-component')
                                            console.log(
                                              '[wing/inject] 📋 Found wing-web-component buttons:',
                                              allWingButtons.length,
                                            )
                                            for (const button of allWingButtons) {
                                              const buttonText = button.textContent?.trim() || ''
                                              if (buttonText.includes('판매요청')) {
                                                saleRequestButton = button
                                                console.log(
                                                  '[wing/inject] ✅ Found "판매요청" button by wing-web-component:',
                                                  buttonText,
                                                )
                                                break
                                              }
                                            }
                                          }

                                          // 방법 3: 전체 문서에서 텍스트로 찾기
                                          if (!saleRequestButton) {
                                            const allButtons = document.querySelectorAll('button')
                                            console.log('[wing/inject] 📋 Found all buttons:', allButtons.length)
                                            for (const button of allButtons) {
                                              const buttonText = button.textContent?.trim().replace(/\s+/g, ' ') || ''
                                              if (buttonText.includes('판매요청')) {
                                                saleRequestButton = button
                                                console.log(
                                                  '[wing/inject] ✅ Found "판매요청" button by text in document:',
                                                  buttonText,
                                                )
                                                break
                                              }
                                            }
                                          }

                                          if (saleRequestButton) {
                                            console.log('[wing/inject] 📦 Button element:', saleRequestButton)
                                            console.log('[wing/inject] 📦 Button type:', saleRequestButton.type)
                                            console.log('[wing/inject] 📦 Button disabled:', saleRequestButton.disabled)
                                            console.log(
                                              '[wing/inject] 📦 Button style:',
                                              window.getComputedStyle(saleRequestButton).display,
                                            )

                                            // 버튼이 보이도록 스크롤
                                            saleRequestButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                            await delay(500)

                                            // 버튼이 disabled가 아닌지 확인
                                            if (saleRequestButton.disabled) {
                                              console.warn('[wing/inject] ⚠️ Button is disabled, waiting...')
                                              // disabled가 해제될 때까지 대기 (최대 5초)
                                              for (let i = 0; i < 10; i++) {
                                                await delay(500)
                                                if (!saleRequestButton.disabled) {
                                                  console.log('[wing/inject] ✅ Button is now enabled')
                                                  break
                                                }
                                              }
                                            }

                                            // 버튼 클릭 (여러 방법 시도)
                                            console.log('[wing/inject] ✅ Clicking "판매요청" button...')

                                            // 방법 1: 일반 click
                                            saleRequestButton.click()

                                            // 방법 2: MouseEvent로 클릭 시뮬레이션
                                            const clickEvent = new MouseEvent('click', {
                                              bubbles: true,
                                              cancelable: true,
                                              view: window,
                                            })
                                            saleRequestButton.dispatchEvent(clickEvent)

                                            // 방법 3: mousedown/mouseup 이벤트
                                            const mouseDownEvent = new MouseEvent('mousedown', {
                                              bubbles: true,
                                              cancelable: true,
                                              view: window,
                                            })
                                            const mouseUpEvent = new MouseEvent('mouseup', {
                                              bubbles: true,
                                              cancelable: true,
                                              view: window,
                                            })
                                            saleRequestButton.dispatchEvent(mouseDownEvent)
                                            await delay(100)
                                            saleRequestButton.dispatchEvent(mouseUpEvent)

                                            await delay(200)
                                            console.log('[wing/inject] ✅ "판매요청" button clicked successfully!')

                                            // 확인 모달의 '판매요청' 버튼 클릭 대기
                                            await delay(1000)
                                            console.log('[wing/inject] 🔍 Looking for confirmation modal...')

                                            // sweet-alert 모달에서 '판매요청' 확인 버튼 찾기
                                            let confirmButton = null
                                            for (let i = 0; i < 20; i++) {
                                              confirmButton = document.querySelector(
                                                '.sweet-alert button.confirm.alert-confirm',
                                              )
                                              if (confirmButton) {
                                                console.log('[wing/inject] ✅ Found confirmation modal button!')
                                                break
                                              }
                                              await delay(300)
                                            }

                                            if (confirmButton) {
                                              confirmButton.click()
                                              console.log(
                                                '[wing/inject] ✅ Confirmation modal "판매요청" button clicked!',
                                              )

                                              // 성공 모달 반복 체크 (최대 30초)
                                              console.log('[wing/inject] 🔄 Starting success modal polling...')

                                              let checkCount = 0
                                              const maxChecks = 30 // 30초 동안 체크
                                              let modalFound = false

                                              const pollSuccessModal = setInterval(async () => {
                                                checkCount++
                                                console.log(
                                                  `[wing/inject] 🔍 Polling for success modal... (${checkCount}/${maxChecks})`,
                                                )

                                                // 모달이 이미 발견되었으면 폴링 중지되어야 함
                                                if (modalFound) {
                                                  console.warn(
                                                    '[wing/inject] ⚠️ Modal already processed but polling still running',
                                                  )
                                                  clearInterval(pollSuccessModal)
                                                  return
                                                }

                                                // 실제로 표시되는 모달 찾기 (display: block 또는 display가 none이 아닌)
                                                const modalElements = Array.from(
                                                  document.querySelectorAll('.sweet-alert, .modal'),
                                                )
                                                console.log(
                                                  '[wing/inject] 📋 Found modal elements:',
                                                  modalElements.length,
                                                )

                                                const visibleModal = modalElements.find(modal => {
                                                  const display = window.getComputedStyle(modal).display
                                                  const isVisible = display !== 'none' && display !== ''
                                                  console.log(
                                                    '[wing/inject] 📊 Modal display:',
                                                    display,
                                                    'isVisible:',
                                                    isVisible,
                                                  )
                                                  return isVisible
                                                })

                                                if (!visibleModal) {
                                                  console.log('[wing/inject] ℹ️ No visible modal found yet')
                                                  // 최대 체크 횟수 도달 확인
                                                  if (checkCount >= maxChecks) {
                                                    console.log('[wing/inject] ⏰ Polling timeout reached')
                                                    clearInterval(pollSuccessModal)
                                                    if (!modalFound) {
                                                      console.error(
                                                        '[wing/inject] ❌ Success modal not found after 30 seconds',
                                                      )
                                                    }
                                                  }
                                                  return
                                                }

                                                console.log('[wing/inject] ✅ Visible modal found!')

                                                // 성공 모달인지 확인
                                                const successTitle =
                                                  visibleModal.querySelector('.alert-title, h2.alert-title')
                                                const titleText = successTitle?.textContent || ''
                                                const isSuccessModal = titleText.includes('상품등록이 완료되었습니다')

                                                console.log('[wing/inject] 📝 Is success modal:', isSuccessModal)
                                                console.log('[wing/inject] 📝 Title text:', titleText)

                                                if (isSuccessModal) {
                                                  if (!modalFound) {
                                                    modalFound = true
                                                    console.log('[wing/inject] ✅ Success modal detected!')
                                                    console.log('[wing/inject] 📝 Modal text:', titleText)

                                                    // 폴링 중지
                                                    clearInterval(pollSuccessModal)
                                                    console.log('[wing/inject] ⏹️ Polling stopped')

                                                    // 등록상품ID 추출 (visible modal 내부에서만 찾기)
                                                    const allParagraphs = Array.from(visibleModal.querySelectorAll('p'))
                                                    console.log(
                                                      '[wing/inject] 📋 Found paragraphs in visible modal:',
                                                      allParagraphs.length,
                                                    )
                                                    allParagraphs.forEach((p, idx) => {
                                                      console.log(`[wing/inject] 📄 Paragraph ${idx}:`, p.textContent)
                                                    })

                                                    const alertText = allParagraphs.find(p =>
                                                      p.textContent?.includes('등록상품ID'),
                                                    )
                                                    console.log('[wing/inject] 📝 Alert text element:', alertText)
                                                    console.log(
                                                      '[wing/inject] 📝 Alert text content:',
                                                      alertText?.textContent,
                                                    )

                                                    const match =
                                                      alertText?.textContent?.match(/등록상품ID\s*:\s*(\d+)/)
                                                    const vendorInventoryId = match ? match[1] : null

                                                    console.log('[wing/inject] 🔍 Regex match result:', match)
                                                    console.log(
                                                      '[wing/inject] 📝 Extracted Vendor Inventory ID:',
                                                      vendorInventoryId,
                                                    )

                                                    console.log(
                                                      '[wing/inject] 🎊 Product registration fully completed!',
                                                    )

                                                    // product-upload 페이지에 알림 전송 및 탭 닫기
                                                    if (productId) {
                                                      console.log(
                                                        '[wing/inject] 📤 Sending PRODUCT_UPLOAD_SUCCESS message...',
                                                      )
                                                      console.log('[wing/inject] ProductId to send:', Number(productId))
                                                      console.log(
                                                        '[wing/inject] VendorInventoryId to send:',
                                                        vendorInventoryId,
                                                      )

                                                      // Background가 sender.tab.id로 탭을 닫을 것
                                                      chrome.runtime.sendMessage(
                                                        {
                                                          type: 'PRODUCT_UPLOAD_SUCCESS',
                                                          productId: Number(productId),
                                                          vendorInventoryId: vendorInventoryId,
                                                        },
                                                        response => {
                                                          console.log(
                                                            '[wing/inject] ✅ Notification sent, response:',
                                                            response,
                                                          )
                                                        },
                                                      )
                                                    } else {
                                                      console.warn('[wing/inject] ⚠️ No productId to send')
                                                    }
                                                  }
                                                } else {
                                                  // 성공 모달이 아니면 계속 폴링
                                                  // 최대 체크 횟수 도달 확인
                                                  if (checkCount >= maxChecks) {
                                                    console.log('[wing/inject] ⏰ Polling timeout reached')
                                                    clearInterval(pollSuccessModal)
                                                    if (!modalFound) {
                                                      console.error(
                                                        '[wing/inject] ❌ Success modal not found after 30 seconds',
                                                      )
                                                    }
                                                  }
                                                }
                                              }, 1000) // 1초마다 체크
                                            } else {
                                              console.warn('[wing/inject] ⚠️ Confirmation modal button not found')
                                            }
                                          } else {
                                            console.warn('[wing/inject] ⚠️ "판매요청" button not found')
                                          }
                                        } else {
                                          console.warn('[wing/inject] ⚠️ panel-notice-category element not found')
                                        }
                                      } else {
                                        console.warn('[wing/inject] ⚠️ panel-product-meta-info element not found')
                                      }
                                    } else {
                                      console.warn('[wing/inject] ⚠️ "저장" button not found')
                                    }
                                  } else {
                                    // dropzone에 드래그 앤 드롭
                                    const dropZone = document.querySelector(
                                      '.image-drop-zone, [class*="image-drop-zone"]',
                                    )
                                    if (dropZone) {
                                      console.log('[wing/inject] ✅ Found dropzone, using drag and drop')
                                      console.log(
                                        '[wing/inject] 📤 Uploading',
                                        filesToUpload.length,
                                        'file(s) together (legacy mode)',
                                      )

                                      // DataTransfer 객체 생성 (legacy 방식 - 모든 파일을 한 번에 추가)
                                      const dataTransfer = new DataTransfer()
                                      filesToUpload.forEach(file => {
                                        dataTransfer.items.add(file)
                                        console.log(
                                          `[wing/inject] ✅ Added ${file.name} (${file.size} bytes) to DataTransfer`,
                                        )
                                      })

                                      console.log(
                                        '[wing/inject] 📋 DataTransfer contains',
                                        dataTransfer.files.length,
                                        'file(s)',
                                      )

                                      // 드래그 앤 드롭 이벤트 시뮬레이션 (legacy 방식)
                                      console.log('[wing/inject] 🎯 Simulating drag and drop events...')

                                      // dragenter 이벤트
                                      const dragEnterEvent = new DragEvent('dragenter', {
                                        bubbles: true,
                                        cancelable: true,
                                        dataTransfer: dataTransfer,
                                      })
                                      dropZone.dispatchEvent(dragEnterEvent)
                                      console.log('[wing/inject] 📍 dragenter dispatched')

                                      // dragover 이벤트
                                      const dragOverEvent = new DragEvent('dragover', {
                                        bubbles: true,
                                        cancelable: true,
                                        dataTransfer: dataTransfer,
                                      })
                                      dropZone.dispatchEvent(dragOverEvent)
                                      console.log('[wing/inject] 📍 dragover dispatched')

                                      // drop 이벤트
                                      const dropEvent = new DragEvent('drop', {
                                        bubbles: true,
                                        cancelable: true,
                                        dataTransfer: dataTransfer,
                                      })
                                      dropZone.dispatchEvent(dropEvent)
                                      console.log(
                                        '[wing/inject] ✅ Drop event dispatched with',
                                        filesToUpload.length,
                                        'files',
                                      )
                                      console.log('[wing/inject] 🎉 All files dropped to dropzone successfully!')

                                      // 9. 이미지 업로드 후 3초 대기
                                      await delay(3000)
                                      console.log('[wing/inject] ⏳ Waited 3 seconds after image upload...')

                                      // 10. '저장' 버튼 찾기 및 클릭
                                      console.log('[wing/inject] 🔍 Looking for "저장" button...')
                                      let saveButton = null
                                      for (let i = 0; i < 30; i++) {
                                        saveButton = findButtonByText('저장')
                                        if (saveButton) {
                                          console.log('[wing/inject] ✅ Found "저장" button!')
                                          break
                                        }
                                        await delay(200)
                                      }

                                      if (saveButton) {
                                        saveButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                        await delay(300)
                                        console.log('[wing/inject] ✅ Clicking "저장" button...')
                                        saveButton.click()
                                        console.log('[wing/inject] ✅ "저장" button clicked successfully')

                                        // 11. 저장 버튼 클릭 후 panel-product-meta-info로 스크롤
                                        await delay(1000)
                                        console.log('[wing/inject] 📜 Scrolling to panel-product-meta-info...')
                                        const panelProductMetaInfo = document.getElementById('panel-product-meta-info')
                                        if (panelProductMetaInfo) {
                                          panelProductMetaInfo.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                          await delay(500) // 스크롤 완료 대기
                                          console.log('[wing/inject] ✅ Scrolled to panel-product-meta-info')

                                          // 12. 인증정보 > 상세페이지 별도표기 클릭
                                          await delay(500)
                                          console.log(
                                            '[wing/inject] 🔍 Looking for "상세페이지 별도표기" radio button...',
                                          )
                                          let certificationRadio = document.getElementById(
                                            'certificationType_PRESENTED_IN_DETAIL_PAGE_1',
                                          )
                                          if (!certificationRadio) {
                                            // label로 찾기
                                            const labels = document.querySelectorAll(
                                              'label[for="certificationType_PRESENTED_IN_DETAIL_PAGE_1"]',
                                            )
                                            if (labels.length > 0) {
                                              console.log(
                                                '[wing/inject] ✅ Found "상세페이지 별도표기" label, clicking...',
                                              )
                                              labels[0].click()
                                            } else {
                                              // 텍스트로 찾기
                                              const radioButtons = document.querySelectorAll(
                                                'input[type="radio"][name="certificationType"]',
                                              )
                                              for (const radio of radioButtons) {
                                                const label = document.querySelector(`label[for="${radio.id}"]`)
                                                if (
                                                  label &&
                                                  label.textContent?.trim().includes('상세페이지 별도표기')
                                                ) {
                                                  certificationRadio = radio
                                                  console.log(
                                                    '[wing/inject] ✅ Found "상세페이지 별도표기" radio by text',
                                                  )
                                                  break
                                                }
                                              }
                                            }
                                          }

                                          if (certificationRadio) {
                                            certificationRadio.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                            await delay(200)
                                            certificationRadio.checked = true
                                            certificationRadio.click()
                                            certificationRadio.dispatchEvent(new Event('change', { bubbles: true }))
                                            console.log('[wing/inject] ✅ "상세페이지 별도표기" clicked successfully')
                                          } else {
                                            console.warn(
                                              '[wing/inject] ⚠️ "상세페이지 별도표기" radio button not found',
                                            )
                                          }

                                          // 13. 판매기간 > 설정안함 클릭
                                          await delay(500)
                                          console.log(
                                            '[wing/inject] 🔍 Looking for "설정안함" radio button for 판매기간...',
                                          )
                                          let salePeriodRadio = document.getElementById('salePeriod_N_1')
                                          if (!salePeriodRadio) {
                                            // label로 찾기
                                            const labels = document.querySelectorAll('label[for="salePeriod_N_1"]')
                                            if (labels.length > 0) {
                                              console.log(
                                                '[wing/inject] ✅ Found "설정안함" label for 판매기간, clicking...',
                                              )
                                              labels[0].click()
                                            } else {
                                              // 판매기간 섹션 내에서 찾기
                                              const salePeriodSection = panelProductMetaInfo.querySelector(
                                                '[data-v-242f2d92=""] .wrapper',
                                              )
                                              if (salePeriodSection) {
                                                const radioButtons = salePeriodSection.querySelectorAll(
                                                  'input[type="radio"][name="salePeriod"]',
                                                )
                                                for (const radio of radioButtons) {
                                                  const label = document.querySelector(`label[for="${radio.id}"]`)
                                                  if (label && label.textContent?.trim().includes('설정안함')) {
                                                    salePeriodRadio = radio
                                                    console.log(
                                                      '[wing/inject] ✅ Found "설정안함" radio for 판매기간 by text',
                                                    )
                                                    break
                                                  }
                                                }
                                              }
                                            }
                                          }

                                          if (salePeriodRadio) {
                                            salePeriodRadio.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                            await delay(200)
                                            salePeriodRadio.checked = true
                                            salePeriodRadio.click()
                                            salePeriodRadio.dispatchEvent(new Event('change', { bubbles: true }))
                                            console.log('[wing/inject] ✅ "설정안함" for 판매기간 clicked successfully')
                                          } else {
                                            console.warn(
                                              '[wing/inject] ⚠️ "설정안함" radio button for 판매기간 not found',
                                            )
                                          }

                                          // 14. panel-notice-category로 스크롤
                                          await delay(500)
                                          console.log('[wing/inject] 📜 Scrolling to panel-notice-category...')
                                          const panelNoticeCategory = document.getElementById('panel-notice-category')
                                          if (panelNoticeCategory) {
                                            panelNoticeCategory.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                            await delay(500) // 스크롤 완료 대기
                                            console.log('[wing/inject] ✅ Scrolled to panel-notice-category')

                                            // 15. '전체 상품 상세페이지 참조' 체크박스 클릭
                                            await delay(500)
                                            console.log(
                                              '[wing/inject] 🔍 Looking for "전체 상품 상세페이지 참조" checkbox...',
                                            )

                                            // 체크박스 찾기 (여러 방법 시도)
                                            let allPageCheckbox = null
                                            let allPageSpan = null

                                            // 방법 1: panel-notice-category 내에서 span.sc-common-check 찾기
                                            if (panelNoticeCategory) {
                                              const spans = panelNoticeCategory.querySelectorAll('span.sc-common-check')
                                              for (const span of spans) {
                                                const labelText = span.textContent?.trim().replace(/\s+/g, ' ')
                                                console.log('[wing/inject] 📝 Checking span text:', labelText)
                                                if (labelText && labelText.includes('전체 상품 상세페이지 참조')) {
                                                  const checkbox = span.querySelector('input[type="checkbox"]')
                                                  if (checkbox) {
                                                    allPageCheckbox = checkbox
                                                    allPageSpan = span
                                                    console.log(
                                                      '[wing/inject] ✅ Found "전체 상품 상세페이지 참조" checkbox in panel-notice-category',
                                                    )
                                                    break
                                                  }
                                                }
                                              }
                                            }

                                            // 방법 2: 전체 문서에서 span.sc-common-check 찾기
                                            if (!allPageCheckbox) {
                                              const spans = document.querySelectorAll('span.sc-common-check')
                                              for (const span of spans) {
                                                const labelText = span.textContent?.trim().replace(/\s+/g, ' ')
                                                if (labelText && labelText.includes('전체 상품 상세페이지 참조')) {
                                                  const checkbox = span.querySelector('input[type="checkbox"]')
                                                  if (checkbox) {
                                                    allPageCheckbox = checkbox
                                                    allPageSpan = span
                                                    console.log(
                                                      '[wing/inject] ✅ Found "전체 상품 상세페이지 참조" checkbox by text in span',
                                                    )
                                                    break
                                                  }
                                                }
                                              }
                                            }

                                            if (allPageCheckbox && allPageSpan) {
                                              console.log('[wing/inject] 📦 Found elements:', {
                                                checkbox: !!allPageCheckbox,
                                                span: !!allPageSpan,
                                                currentChecked: allPageCheckbox.checked,
                                              })

                                              // span을 먼저 스크롤
                                              allPageSpan.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                              await delay(500)

                                              // 체크박스가 이미 체크되어 있지 않은 경우에만 클릭
                                              if (!allPageCheckbox.checked) {
                                                // 방법 1: span의 중앙 좌표 계산하여 클릭
                                                const spanRect = allPageSpan.getBoundingClientRect()
                                                const spanX = spanRect.left + spanRect.width / 2
                                                const spanY = spanRect.top + spanRect.height / 2

                                                console.log('[wing/inject] 📍 Attempting click at coordinates:', {
                                                  spanX,
                                                  spanY,
                                                })

                                                // 마우스 이벤트 생성 (실제 좌표와 함께)
                                                const mouseDownEvent = new MouseEvent('mousedown', {
                                                  bubbles: true,
                                                  cancelable: true,
                                                  view: window,
                                                  clientX: spanX,
                                                  clientY: spanY,
                                                  button: 0,
                                                })

                                                const mouseUpEvent = new MouseEvent('mouseup', {
                                                  bubbles: true,
                                                  cancelable: true,
                                                  view: window,
                                                  clientX: spanX,
                                                  clientY: spanY,
                                                  button: 0,
                                                })

                                                const clickEvent = new MouseEvent('click', {
                                                  bubbles: true,
                                                  cancelable: true,
                                                  view: window,
                                                  clientX: spanX,
                                                  clientY: spanY,
                                                  button: 0,
                                                })

                                                // span에 마우스 이벤트 발생
                                                allPageSpan.dispatchEvent(mouseDownEvent)
                                                await delay(50)
                                                allPageSpan.dispatchEvent(mouseUpEvent)
                                                await delay(50)
                                                allPageSpan.dispatchEvent(clickEvent)
                                                allPageSpan.click()

                                                await delay(200)

                                                // 체크박스 좌표 계산하여 클릭
                                                const checkboxRect = allPageCheckbox.getBoundingClientRect()
                                                const checkboxX = checkboxRect.left + checkboxRect.width / 2
                                                const checkboxY = checkboxRect.top + checkboxRect.height / 2

                                                console.log('[wing/inject] 📍 Clicking checkbox at coordinates:', {
                                                  checkboxX,
                                                  checkboxY,
                                                })

                                                const checkboxMouseDown = new MouseEvent('mousedown', {
                                                  bubbles: true,
                                                  cancelable: true,
                                                  view: window,
                                                  clientX: checkboxX,
                                                  clientY: checkboxY,
                                                  button: 0,
                                                })

                                                const checkboxMouseUp = new MouseEvent('mouseup', {
                                                  bubbles: true,
                                                  cancelable: true,
                                                  view: window,
                                                  clientX: checkboxX,
                                                  clientY: checkboxY,
                                                  button: 0,
                                                })

                                                const checkboxClick = new MouseEvent('click', {
                                                  bubbles: true,
                                                  cancelable: true,
                                                  view: window,
                                                  clientX: checkboxX,
                                                  clientY: checkboxY,
                                                  button: 0,
                                                })

                                                // 체크박스에 직접 마우스 이벤트 발생
                                                allPageCheckbox.dispatchEvent(checkboxMouseDown)
                                                await delay(50)
                                                allPageCheckbox.checked = true
                                                allPageCheckbox.dispatchEvent(checkboxMouseUp)
                                                await delay(50)
                                                allPageCheckbox.dispatchEvent(checkboxClick)
                                                allPageCheckbox.click()

                                                // 추가 이벤트 발생
                                                allPageCheckbox.dispatchEvent(new Event('change', { bubbles: true }))
                                                allPageCheckbox.dispatchEvent(new Event('input', { bubbles: true }))
                                                allPageCheckbox.dispatchEvent(
                                                  new Event('change', { bubbles: true, cancelable: true }),
                                                )

                                                await delay(300)

                                                // 상태 확인 및 재시도
                                                if (!allPageCheckbox.checked) {
                                                  console.log(
                                                    '[wing/inject] ⚠️ Still not checked, trying direct manipulation...',
                                                  )

                                                  // 직접 속성 설정
                                                  Object.defineProperty(allPageCheckbox, 'checked', {
                                                    writable: true,
                                                    value: true,
                                                  })
                                                  allPageCheckbox.setAttribute('checked', 'checked')

                                                  // 다시 클릭 시도
                                                  allPageSpan.click()
                                                  allPageCheckbox.click()

                                                  // 이벤트 재발생
                                                  allPageCheckbox.dispatchEvent(new Event('change', { bubbles: true }))
                                                  allPageCheckbox.dispatchEvent(new Event('input', { bubbles: true }))

                                                  await delay(200)
                                                }

                                                console.log(
                                                  '[wing/inject] ✅ Final state - Checked:',
                                                  allPageCheckbox.checked,
                                                  'Attribute:',
                                                  allPageCheckbox.getAttribute('checked'),
                                                )
                                              } else {
                                                console.log(
                                                  '[wing/inject] ℹ️ "전체 상품 상세페이지 참조" checkbox is already checked',
                                                )
                                              }
                                            } else {
                                              console.warn(
                                                '[wing/inject] ⚠️ "전체 상품 상세페이지 참조" checkbox not found',
                                              )
                                              if (!allPageCheckbox) {
                                                console.warn('[wing/inject] ⚠️ Checkbox element not found')
                                              }
                                              if (!allPageSpan) {
                                                console.warn('[wing/inject] ⚠️ Span element not found')
                                              }
                                            }
                                          } else {
                                            console.warn('[wing/inject] ⚠️ panel-notice-category element not found')
                                          }
                                        } else {
                                          console.warn('[wing/inject] ⚠️ panel-product-meta-info element not found')
                                        }
                                      } else {
                                        console.warn('[wing/inject] ⚠️ "저장" button not found')
                                      }
                                    } else {
                                      console.warn('[wing/inject] ⚠️ Neither file input nor dropzone found')
                                    }
                                  }
                                }
                              } else {
                                console.warn('[wing/inject] ⚠️ Image upload modal did not appear')
                              }
                            } else {
                              console.warn('[wing/inject] ❌ "이미지 등록" button not found')
                            }
                          } else {
                            console.warn('[wing/inject] ⚠️ panel-contents element not found')
                          }
                        }
                      } catch (error) {
                        console.error('[wing/inject] ❌ Error in main upload flow:', error)
                      }
                    })()
                  }, 200)
                } catch (apiError) {
                  console.error('[wing/inject] ❌ Error in pre-matching search API:', apiError)
                }
              }, 1000) // 노출상품명 입력 후 1초 대기
            }, 200)
          }

          try {
            sendResponse({ ok: res.ok, status: res.status, data })
          } catch {}
        } catch (e) {
          console.error('[wing/inject] WING_PRODUCT_ITEMS error:', e)
          try {
            sendResponse({ ok: false, error: String(e) })
          } catch {}
        }
      })()
      return true
    }

    if (msg?.type === 'WING_ATTRIBUTE_CHECK') {
      ;(async () => {
        try {
          const { productId, itemId, categoryId, optionOrder } = msg.payload || {}
          console.log('[wing/inject] 🔍 WING_ATTRIBUTE_CHECK 시작')
          console.log('[wing/inject] 📦 Payload:', { productId, itemId, categoryId, optionOrder })

          if (!optionOrder || optionOrder.length === 0) {
            console.error('[wing/inject] ❌ optionOrder가 없습니다')
            sendResponse({ ok: false, error: 'optionOrder가 없습니다' })
            return
          }

          const firstOption = optionOrder[0]
          console.log('[wing/inject] 🎯 First option:', firstOption)
          console.log('[wing/inject] 📋 Full optionOrder:', optionOrder)

          // Wing API 호출
          const params = new URLSearchParams({
            productId: String(productId),
            itemId: String(itemId),
            allowSingleProduct: 'false',
            categoryId: String(categoryId),
          })
          const url = `https://wing.coupang.com/tenants/seller-web/vendor-inventory/productmatch/prematch/product-items?${params.toString()}`
          console.log('[wing/inject] 🌐 API URL:', url)
          console.log('[wing/inject] 📤 Fetching API...')

          const res = await fetch(url, {
            method: 'GET',
            credentials: 'include',
          })

          console.log('[wing/inject] 📥 API Response status:', res.ok, res.status)

          const text = await res.text()
          console.log('[wing/inject] 📄 Response text length:', text.length)
          console.log('[wing/inject] 📄 Response text (first 500 chars):', text.substring(0, 500))

          let data
          try {
            data = text ? JSON.parse(text) : null
            console.log('[wing/inject] ✅ JSON parsed successfully')
          } catch (parseError) {
            console.error('[wing/inject] ❌ JSON parse error:', parseError)
            data = text
          }

          console.log('[wing/inject] 📊 Full API response data:', JSON.stringify(data, null, 2))

          if (!res.ok || !data) {
            console.error('[wing/inject] ❌ API 호출 실패:', { ok: res.ok, status: res.status, hasData: !!data })
            sendResponse({ ok: false, error: `API 호출 실패: ${res.status}` })
            return
          }

          // items에서 attributeValues 추출
          const items = data.items || []
          console.log('[wing/inject] 📦 Items count:', items.length)
          console.log('[wing/inject] 📦 All items:', JSON.stringify(items, null, 2))

          if (items.length === 0) {
            console.error('[wing/inject] ❌ 상품 아이템이 없습니다')
            sendResponse({ ok: false, error: '상품 아이템이 없습니다' })
            return
          }

          // optionOrder의 첫 번째와 일치하는 attributeName의 모든 attributeValue 수집
          // items 배열의 순서를 유지하면서 수집 (첫 등장 순서)
          const allAttributeValues = []
          const seenValues = new Set()
          console.log('[wing/inject] 🔍 Starting attributeValue collection for firstOption:', firstOption)

          items.forEach((item, itemIndex) => {
            console.log(`[wing/inject] 📋 Item ${itemIndex + 1}:`, {
              itemId: item.itemId,
              attributesCount: item.attributes?.length || 0,
              attributes: item.attributes,
            })

            if (item.attributes && Array.isArray(item.attributes)) {
              item.attributes.forEach((attr, attrIndex) => {
                console.log(`[wing/inject]   Attribute ${attrIndex + 1}:`, {
                  attributeTypeId: attr.attributeTypeId,
                  attributeName: attr.attributeName,
                  attributeValue: attr.attributeValue,
                  matchesFirstOption: attr.attributeName === firstOption,
                })

                if (attr.attributeName === firstOption) {
                  const attrValue = attr.attributeValue
                  // 중복 제거하면서 첫 등장 순서 유지
                  if (!seenValues.has(attrValue)) {
                    console.log(`[wing/inject]   ✅ Match found! Adding to array: "${attrValue}"`)
                    allAttributeValues.push(attrValue)
                    seenValues.add(attrValue)
                  }
                }
              })
            } else {
              console.log(`[wing/inject]   ⚠️ Item ${itemIndex + 1} has no attributes array`)
            }
          })

          console.log('[wing/inject] 📊 All collected attributeValues (before filtering):', allAttributeValues)
          console.log('[wing/inject] 📊 Total unique values:', allAttributeValues.length)

          // 영어, 숫자, "(", "["로 시작하는 것만 필터링
          const filteredAttributeValues = allAttributeValues.filter(value => {
            if (!value || value.length === 0) {
              console.log(`[wing/inject]   ❌ Filtered out (empty): "${value}"`)
              return false
            }
            const trimmedValue = value.trim()
            const firstChar = trimmedValue[0]
            // 영어, 숫자, "(", "["로 시작하는 것 허용
            const matches = /[a-zA-Z0-9]/.test(firstChar) || firstChar === '(' || firstChar === '['
            console.log(
              `[wing/inject]   ${matches ? '✅' : '❌'} "${value}" -> firstChar: "${firstChar}", matches: ${matches}`,
            )
            return matches
          })

          // 알파벳 순서로 정렬 (대소문자 구분 없이, 괄호나 추가 텍스트 고려)
          const attributeValues = filteredAttributeValues.sort((a, b) => {
            // 기본 문자열 비교 (대소문자 구분 없이)
            const aUpper = a.trim().toUpperCase()
            const bUpper = b.trim().toUpperCase()

            // 알파벳 순서로 정렬
            if (aUpper < bUpper) return -1
            if (aUpper > bUpper) return 1

            // 대소문자 차이만 있으면 원본 순서 유지
            return 0
          })

          console.log('[wing/inject] ✅ Final filtered and sorted attributeValues:', attributeValues)
          console.log('[wing/inject] 📊 Summary:', {
            totalItems: items.length,
            totalUniqueValues: allAttributeValues.length,
            filteredValues: attributeValues.length,
            firstOption: firstOption,
          })

          sendResponse({
            ok: true,
            attributeValues: attributeValues,
            firstOption: firstOption,
            totalValues: allAttributeValues.length,
            filteredValues: attributeValues.length,
          })
        } catch (e) {
          console.error('[wing/inject] ❌ WING_ATTRIBUTE_CHECK error:', e)
          console.error('[wing/inject] Error stack:', e instanceof Error ? e.stack : 'No stack')
          try {
            sendResponse({ ok: false, error: String(e) })
          } catch {}
        }
      })()
      return true
    }

    if (msg?.type === 'WING_OPTION_MODIFY') {
      ;(async () => {
        try {
          console.log('[wing/inject] 🔍 WING_OPTION_MODIFY 시작')

          // 1. option-pane-component로 스크롤
          const optionPaneComponent = document.querySelector('.option-pane-component')
          if (!optionPaneComponent) {
            console.error('[wing/inject] ❌ option-pane-component를 찾을 수 없습니다')
            sendResponse({ ok: false, error: 'option-pane-component를 찾을 수 없습니다' })
            return
          }

          console.log('[wing/inject] ✅ option-pane-component 찾음, 스크롤 중...')
          optionPaneComponent.scrollIntoView({ behavior: 'smooth', block: 'start' })

          // 스크롤 완료 대기
          await new Promise(resolve => setTimeout(resolve, 500))

          // 2. option-pane-component 내에서 '옵션수정' 버튼 찾기
          const modifyButtons = optionPaneComponent.querySelectorAll('button')
          let modifyButton = null

          for (const button of modifyButtons) {
            const buttonText = button.textContent?.trim() || ''
            if (buttonText.includes('옵션수정')) {
              modifyButton = button
              console.log('[wing/inject] ✅ "옵션수정" 버튼 찾음:', buttonText)
              break
            }
          }

          if (!modifyButton) {
            console.error('[wing/inject] ❌ "옵션수정" 버튼을 찾을 수 없습니다')
            sendResponse({ ok: false, error: '"옵션수정" 버튼을 찾을 수 없습니다' })
            return
          }

          // 3. 버튼 클릭
          console.log('[wing/inject] ✅ "옵션수정" 버튼 클릭 중...')
          modifyButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
          await new Promise(resolve => setTimeout(resolve, 300))

          // 여러 방법으로 클릭 시뮬레이션
          modifyButton.click()

          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          })
          modifyButton.dispatchEvent(clickEvent)

          const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
          })
          const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
          })
          modifyButton.dispatchEvent(mouseDownEvent)
          await new Promise(resolve => setTimeout(resolve, 100))
          modifyButton.dispatchEvent(mouseUpEvent)

          console.log('[wing/inject] ✅ "옵션수정" 버튼 클릭 완료!')
          sendResponse({ ok: true })
        } catch (e) {
          console.error('[wing/inject] ❌ WING_OPTION_MODIFY error:', e)
          console.error('[wing/inject] Error stack:', e instanceof Error ? e.stack : 'No stack')
          try {
            sendResponse({ ok: false, error: String(e) })
          } catch {}
        }
      })()
      return true
    }

    return false
  })
})()
