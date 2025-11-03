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
          } = msg.payload || {}
          // 업로드 시에는 {productId} {productName} 형식으로 검색
          const displayValue =
            productId && productName ? `${productId} ${productName}` : productId ? String(productId) : ''
          console.log('[wing/inject] Payload received:', {
            productId,
            productName,
            optionOrder,
            attributeValues,
          })
          console.log('[wing/inject] Display value for search:', displayValue)
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

          // 응답 성공 시 "노출상품명" input에 {productId} {productName} 자동 입력
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

              // 노출상품명 입력 후 추천 상품이 나타날 때까지 대기하고 "판매옵션 선택" 버튼 클릭
              setTimeout(() => {
                console.log('[wing/inject] Waiting for recommended products to appear...')

                let matchAttempts = 0
                const maxMatchAttempts = 50 // 10초 대기
                const matchPollInterval = setInterval(() => {
                  matchAttempts++

                  // 첫 번째 추천 상품의 "판매옵션 선택" 버튼 찾기
                  const preMatchingPane = document.querySelector('.pre-matching-product-pane')
                  if (!preMatchingPane) {
                    console.log(`[wing/inject] [${matchAttempts}/${maxMatchAttempts}] Pre-matching pane not found yet`)
                    if (matchAttempts >= maxMatchAttempts) {
                      console.warn('[wing/inject] ❌ Timeout: Pre-matching products did not appear')
                      clearInterval(matchPollInterval)
                    }
                    return
                  }

                  // 첫 번째 상품 박스의 "판매옵션 선택" 버튼 찾기
                  const firstProductBox = preMatchingPane.querySelector('.pre-matching-product-box')
                  if (!firstProductBox) {
                    console.log(`[wing/inject] [${matchAttempts}/${maxMatchAttempts}] Product box not found yet`)
                    if (matchAttempts >= maxMatchAttempts) {
                      console.warn('[wing/inject] ❌ Timeout: Product box did not appear')
                      clearInterval(matchPollInterval)
                    }
                    return
                  }

                  // 버튼 찾기
                  const selectButton = firstProductBox.querySelector('button[data-wuic-props*="type:secondary"]')
                  if (!selectButton || !selectButton.textContent?.includes('판매옵션 선택')) {
                    console.log(
                      `[wing/inject] [${matchAttempts}/${maxMatchAttempts}] "판매옵션 선택" button not found yet`,
                    )
                    if (matchAttempts >= maxMatchAttempts) {
                      console.warn('[wing/inject] ❌ Timeout: "판매옵션 선택" button did not appear')
                      clearInterval(matchPollInterval)
                    }
                    return
                  }

                  console.log('[wing/inject] ✅ Found "판매옵션 선택" button! Clicking...')
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
                      if (optionOrder && optionOrder.length > 0 && attributeValues && attributeValues.length > 0) {
                        const firstOption = optionOrder[0]
                        console.log('[wing/inject] 🔍 Looking for attribute-selectors table...')
                        console.log('[wing/inject] First option:', firstOption)
                        console.log('[wing/inject] AttributeValues to click:', attributeValues)

                        await delay(500) // 모달이 뜰 때까지 대기

                        // attribute-selectors 테이블 찾기
                        const attributeSelectorsTable = await waitForElement('.attribute-selectors')

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

                        // 모든 버튼 찾기
                        const buttons = checkboxGroup.querySelectorAll('button.wuic-button')
                        console.log('[wing/inject] Found buttons:', buttons.length)

                        // attributeValues에 해당하는 버튼들만 클릭
                        let clickedCount = 0
                        buttons.forEach(button => {
                          const buttonText = button.textContent?.trim()
                          console.log('[wing/inject] Button text:', buttonText)

                          // attributeValues 배열과 비교 (대소문자 무시)
                          const shouldClick = attributeValues.some(attrValue => {
                            const normalizedButtonText = buttonText?.toUpperCase().trim()
                            const normalizedAttrValue = attrValue.toUpperCase().trim()
                            return normalizedButtonText === normalizedAttrValue
                          })

                          if (shouldClick) {
                            console.log(`[wing/inject] ✅ Clicking button: "${buttonText}" (matches attributeValue)`)
                            button.click()
                            clickedCount++
                          }
                        })

                        console.log(
                          `[wing/inject] ✅ Clicked ${clickedCount} button(s) for attribute "${targetAttributeName}"`,
                        )
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

                      // 이미지 가져오기
                      await delay(1000)
                      console.log('[wing/inject] Requesting product images from background...')

                      try {
                        const response = await chrome.runtime.sendMessage({
                          type: 'GET_COUPANG_PRODUCT_IMAGES',
                          payload: { productId, itemId, vendorItemId },
                        })

                        console.log('[wing/inject] Background response:', response)

                        let images = []
                        let itemBriefCapture = null
                        if (response?.ok && response?.images) {
                          images = response.images
                          itemBriefCapture = response.itemBriefCapture
                          console.log('[wing/inject] ✅ Received images from background:', images.length)
                          console.log(
                            '[wing/inject] ✅ ItemBrief capture:',
                            itemBriefCapture ? 'Available' : 'Not available',
                          )
                        } else {
                          console.warn('[wing/inject] ❌ Failed to get images from background:', response?.error)
                          images = []
                        }

                        window.__COUPANG_PRODUCT_IMAGES__ = images
                        window.__ITEM_BRIEF_CAPTURE__ = itemBriefCapture
                      } catch (error) {
                        console.error('[wing/inject] ❌ Error fetching product images:', error)
                      }

                      // 가격 및 재고 설정
                      await delay(1000)
                      console.log('[wing/inject] Setting price and stock...')

                      const itemWinnerPriceElement = document.querySelector('.pre-matching > div:first-child')
                      if (itemWinnerPriceElement) {
                        const itemWinnerPriceText = itemWinnerPriceElement.textContent.trim().replace(/,/g, '')
                        const itemWinnerPrice = parseInt(itemWinnerPriceText)
                        console.log('[wing/inject] 📊 Item Winner Price:', itemWinnerPrice)

                        if (!isNaN(itemWinnerPrice)) {
                          // 2배 가격 계산 후 천원 이하 절삭
                          const doublePrice = itemWinnerPrice * 2
                          const finalPrice = Math.floor(doublePrice / 1000) * 1000
                          console.log('[wing/inject] 💰 Calculated Price:', finalPrice)

                          // 옵션 테이블의 모든 row 찾기
                          const optionRows = document.querySelectorAll('.option-pane-table-row[data-row-id]')
                          console.log('[wing/inject] 📦 Found option rows:', optionRows.length)

                          optionRows.forEach((row, index) => {
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

                            // 판매가 설정
                            if (salePriceInput) {
                              salePriceInput.focus()
                              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                                window.HTMLInputElement.prototype,
                                'value',
                              ).set
                              nativeInputValueSetter.call(salePriceInput, finalPrice.toString())
                              salePriceInput.dispatchEvent(new Event('input', { bubbles: true }))
                              salePriceInput.dispatchEvent(new Event('change', { bubbles: true }))
                              salePriceInput.blur()
                              console.log(`[wing/inject] ✅ Row ${index + 1}: Set sale price to ${finalPrice}`)
                            } else {
                              console.warn(`[wing/inject] ⚠️ Row ${index + 1}: Sale price input not found`)
                            }

                            // 재고수량 설정
                            if (stockInput) {
                              stockInput.focus()
                              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                                window.HTMLInputElement.prototype,
                                'value',
                              ).set
                              nativeInputValueSetter.call(stockInput, '500')
                              stockInput.dispatchEvent(new Event('input', { bubbles: true }))
                              stockInput.dispatchEvent(new Event('change', { bubbles: true }))
                              stockInput.blur()
                              console.log(`[wing/inject] ✅ Row ${index + 1}: Set stock to 500`)
                            } else {
                              console.warn(`[wing/inject] ⚠️ Row ${index + 1}: Stock input not found`)
                            }
                          })
                        } else {
                          console.warn('[wing/inject] ⚠️ Could not parse item winner price')
                        }
                      } else {
                        console.warn('[wing/inject] ⚠️ Item winner price element not found')
                      }

                      // "기본 등록" 버튼 클릭 처리 (기존 코드 유지)
                      await delay(2500)
                      console.log('[wing/inject] Looking for "기본 등록" button...')

                      let basicAttempts = 0
                      const maxBasicAttempts = 50
                      const basicRegisterRadio = await new Promise(resolve => {
                        const basicPollInterval = setInterval(() => {
                          basicAttempts++

                          const allRadios = document.querySelectorAll(
                            'input[name="tab-product-image-pane"][type="radio"]',
                          )
                          let basicRegisterRadio = null
                          let basicRegisterLabel = null

                          allRadios.forEach(radio => {
                            const label = document.querySelector(`label[for="${radio.id}"]`)
                            if (label && label.textContent?.includes('기본 등록')) {
                              basicRegisterRadio = radio
                              basicRegisterLabel = label
                            }
                          })

                          if (basicRegisterRadio && basicRegisterLabel) {
                            clearInterval(basicPollInterval)
                            resolve({ radio: basicRegisterRadio, label: basicRegisterLabel })
                          } else if (basicAttempts >= maxBasicAttempts) {
                            clearInterval(basicPollInterval)
                            resolve(null)
                          }
                        }, 200)
                      })

                      if (basicRegisterRadio) {
                        console.log('[wing/inject] ✅ Found "기본 등록" button! Clicking...')
                        basicRegisterRadio.radio.click()
                        basicRegisterRadio.label.click()
                        console.log('[wing/inject] ✅ "기본 등록" button clicked successfully')
                      } else {
                        console.warn('[wing/inject] ❌ Timeout: "기본 등록" button did not appear')
                      }
                    } catch (error) {
                      console.error('[wing/inject] ❌ Error in main upload flow:', error)
                    }
                  })()
                }, 200)
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
          const allAttributeValues = new Set()
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
                  console.log(`[wing/inject]   ✅ Match found! Adding to Set: "${attr.attributeValue}"`)
                  allAttributeValues.add(attr.attributeValue)
                }
              })
            } else {
              console.log(`[wing/inject]   ⚠️ Item ${itemIndex + 1} has no attributes array`)
            }
          })

          console.log(
            '[wing/inject] 📊 All collected attributeValues (before filtering):',
            Array.from(allAttributeValues),
          )
          console.log('[wing/inject] 📊 Total unique values:', allAttributeValues.size)

          // 영어 또는 숫자로 시작하는 것만 필터링
          const attributeValues = Array.from(allAttributeValues).filter(value => {
            if (!value || value.length === 0) {
              console.log(`[wing/inject]   ❌ Filtered out (empty): "${value}"`)
              return false
            }
            const trimmedValue = value.trim()
            const firstChar = trimmedValue[0]
            const matches = /[a-zA-Z0-9]/.test(firstChar)
            console.log(
              `[wing/inject]   ${matches ? '✅' : '❌'} "${value}" -> firstChar: "${firstChar}", matches: ${matches}`,
            )
            return matches
          })

          console.log('[wing/inject] ✅ Final filtered attributeValues:', attributeValues)
          console.log('[wing/inject] 📊 Summary:', {
            totalItems: items.length,
            totalUniqueValues: allAttributeValues.size,
            filteredValues: attributeValues.length,
            firstOption: firstOption,
          })

          sendResponse({
            ok: true,
            attributeValues: attributeValues,
            firstOption: firstOption,
            totalValues: allAttributeValues.size,
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

    return false
  })
})()
