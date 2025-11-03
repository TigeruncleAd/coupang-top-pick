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
          } = msg.payload || {}
          // 업로드 시에는 productId를 사용 (productName 대신)
          const displayValue = String(productId || '')
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

          // 응답 성공 시 "노출상품명" input에 productId 자동 입력
          if (res.ok && data && productId) {
            console.log('[wing/inject] Setting productId to display input:', displayValue)

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

                  // "판매옵션 선택" 클릭 후 아이템 리스트에서 itemId에 해당하는 체크박스 클릭
                  setTimeout(() => {
                    console.log('[wing/inject] Waiting for item list to appear...')

                    let itemAttempts = 0
                    const maxItemAttempts = 50 // 10초 대기
                    const itemPollInterval = setInterval(() => {
                      itemAttempts++

                      // 아이템 리스트 찾기
                      const itemList = document.querySelector('.item-list')
                      if (!itemList) {
                        console.log(`[wing/inject] [${itemAttempts}/${maxItemAttempts}] Item list not found yet`)
                        if (itemAttempts >= maxItemAttempts) {
                          console.warn('[wing/inject] ❌ Timeout: Item list did not appear')
                          clearInterval(itemPollInterval)
                        }
                        return
                      }

                      // checkbox-group 내부의 모든 아이템 찾기
                      const checkboxGroup = itemList.querySelector('.checkbox-group')
                      if (!checkboxGroup) {
                        console.log(`[wing/inject] [${itemAttempts}/${maxItemAttempts}] Checkbox group not found yet`)
                        if (itemAttempts >= maxItemAttempts) {
                          console.warn('[wing/inject] ❌ Timeout: Checkbox group did not appear')
                          clearInterval(itemPollInterval)
                        }
                        return
                      }

                      // 모든 아이템 div 찾기
                      const itemDivs = checkboxGroup.querySelectorAll(
                        'div[style*="display: flex"][style*="border-top"]',
                      )
                      console.log('[wing/inject] Found item divs:', itemDivs.length)

                      if (itemDivs.length === 0) {
                        console.log(`[wing/inject] [${itemAttempts}/${maxItemAttempts}] No items found yet`)
                        if (itemAttempts >= maxItemAttempts) {
                          console.warn('[wing/inject] ❌ Timeout: No items appeared')
                          clearInterval(itemPollInterval)
                        }
                        return
                      }

                      console.log('[wing/inject] ✅ Found items! Looking for itemId:', itemId)
                      clearInterval(itemPollInterval)

                      // API 응답에서 현재 itemId의 인덱스 찾기
                      let targetIndex = -1
                      if (data && data.items && Array.isArray(data.items)) {
                        targetIndex = data.items.findIndex(item => item.itemId === itemId)
                        console.log('[wing/inject] Target itemId index in API response:', targetIndex)
                      }

                      console.log({ data })

                      if (targetIndex === -1) {
                        console.warn('[wing/inject] ❌ Could not find itemId in API response')
                        return
                      }

                      // 해당 인덱스의 아이템 div의 체크박스 클릭
                      if (targetIndex < itemDivs.length) {
                        const targetItemDiv = itemDivs[targetIndex]
                        const checkbox = targetItemDiv.querySelector('input[type="checkbox"]')

                        if (checkbox) {
                          console.log('[wing/inject] ✅ Found target checkbox! Clicking...')
                          checkbox.click()
                          console.log('[wing/inject] ✅ Checkbox clicked successfully')

                          // 체크박스 클릭 후 "선택완료" 버튼 클릭
                          setTimeout(() => {
                            console.log('[wing/inject] Looking for "선택완료" button...')

                            // 더 넓은 범위에서 "선택완료" 버튼 찾기
                            const allButtons = document.querySelectorAll('button')
                            let completeButton = null

                            allButtons.forEach(btn => {
                              const text = btn.textContent?.trim() || ''
                              if (text.includes('선택완료')) {
                                completeButton = btn
                                console.log('[wing/inject] Found matching button with text:', text)
                              }
                            })

                            if (completeButton) {
                              console.log('[wing/inject] ✅ Found "선택완료" button! Clicking...')
                              completeButton.click()
                              console.log('[wing/inject] ✅ "선택완료" button clicked successfully')

                              // "선택완료" 버튼 클릭 후 백그라운드를 통해 쿠팡 상품 페이지에서 이미지 가져오기
                              setTimeout(async () => {
                                console.log('[wing/inject] Requesting product images from background...')

                                try {
                                  // 백그라운드에 쿠팡 상품 페이지 오픈 및 이미지 추출 요청
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
                                    console.warn(
                                      '[wing/inject] ❌ Failed to get images from background:',
                                      response?.error,
                                    )
                                    // 이미지를 가져오지 못해도 계속 진행
                                    images = []
                                  }

                                  // 변수에 저장 (다음 단계에서 사용)
                                  window.__COUPANG_PRODUCT_IMAGES__ = images
                                  window.__ITEM_BRIEF_CAPTURE__ = itemBriefCapture

                                  // 가격 및 재고 설정
                                  setTimeout(() => {
                                    console.log('[wing/inject] Setting price and stock...')

                                    // 아이템위너가격 찾기
                                    const itemWinnerPriceElement = document.querySelector(
                                      '.pre-matching > div:first-child',
                                    )
                                    if (itemWinnerPriceElement) {
                                      const itemWinnerPriceText = itemWinnerPriceElement.textContent
                                        .trim()
                                        .replace(/,/g, '')
                                      const itemWinnerPrice = parseInt(itemWinnerPriceText)
                                      console.log('[wing/inject] 📊 Item Winner Price:', itemWinnerPrice)

                                      if (!isNaN(itemWinnerPrice)) {
                                        // 2배 가격 계산 후 천원 이하 절삭
                                        const doublePrice = itemWinnerPrice * 2
                                        const finalPrice = Math.floor(doublePrice / 1000) * 1000
                                        console.log('[wing/inject] 💰 Calculated Price:', finalPrice)

                                        // 옵션 테이블의 모든 row 찾기
                                        const optionRows = document.querySelectorAll(
                                          '.option-pane-table-row[data-row-id]',
                                        )
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
                                              // 4번째 이후의 center-aligned input
                                              if (!stockInput) {
                                                // 첫 번째로 찾은 것을 재고수량으로 간주
                                                stockInput = input
                                              }
                                            }
                                          })

                                          // 만약 위 방법으로 못 찾으면 배열에서 직접 선택 (inputs[4] 또는 마지막에서 3~4번째)
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
                                            console.log(
                                              `[wing/inject] ✅ Row ${index + 1}: Set sale price to ${finalPrice}`,
                                            )
                                          } else {
                                            console.warn(
                                              `[wing/inject] ⚠️ Row ${index + 1}: Sale price input not found`,
                                            )
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
                                  }, 1000)

                                  // "기본 등록" 버튼 클릭 (가격 설정 후 충분한 시간 대기)
                                  setTimeout(() => {
                                    console.log('[wing/inject] Looking for "기본 등록" button...')

                                    let basicAttempts = 0
                                    const maxBasicAttempts = 50 // 10초 대기
                                    const basicPollInterval = setInterval(() => {
                                      basicAttempts++

                                      // "기본 등록" 라디오 버튼 찾기 (첫 번째 라디오 버튼)
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

                                      if (!basicRegisterRadio || !basicRegisterLabel) {
                                        console.log(
                                          `[wing/inject] [${basicAttempts}/${maxBasicAttempts}] "기본 등록" button not found yet`,
                                        )
                                        if (basicAttempts >= maxBasicAttempts) {
                                          console.warn('[wing/inject] ❌ Timeout: "기본 등록" button did not appear')
                                          clearInterval(basicPollInterval)
                                        }
                                        return
                                      }

                                      console.log('[wing/inject] ✅ Found "기본 등록" button! Clicking...')
                                      clearInterval(basicPollInterval)

                                      // 라디오 버튼과 라벨 클릭
                                      basicRegisterRadio.click()
                                      basicRegisterLabel.click()
                                      console.log('[wing/inject] ✅ "기본 등록" button clicked successfully')

                                      // 상품이미지 섹션으로 스크롤
                                      setTimeout(() => {
                                        console.log('[wing/inject] Scrolling to 상품이미지 section...')

                                        // "상품이미지" 제목이 있는 섹션 찾기
                                        const allTitles = document.querySelectorAll('.component-title, h3, h4, .title')
                                        let imageSection = null

                                        allTitles.forEach(title => {
                                          if (
                                            title.textContent?.includes('상품이미지') ||
                                            title.textContent?.includes('상품 이미지')
                                          ) {
                                            imageSection = title
                                          }
                                        })

                                        if (imageSection) {
                                          imageSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                          console.log('[wing/inject] ✅ Scrolled to 상품이미지 section')
                                        } else {
                                          console.warn(
                                            '[wing/inject] ⚠️ Could not find 상품이미지 section, continuing anyway...',
                                          )
                                        }
                                      }, 500)

                                      // 기본 등록 탭에서 "대표이미지" 드롭존 찾기
                                      setTimeout(() => {
                                        console.log('[wing/inject] Looking for main image dropzone...')

                                        let dropzoneAttempts = 0
                                        const maxDropzoneAttempts = 50
                                        const dropzonePollInterval = setInterval(() => {
                                          dropzoneAttempts++

                                          // "대표이미지" 섹션의 dropzone 찾기
                                          const elementRows = document.querySelectorAll('.element-row')
                                          let mainImageDropzone = null

                                          elementRows.forEach(row => {
                                            const titleDiv = row.querySelector('.element-row-title')
                                            if (titleDiv && titleDiv.textContent?.includes('대표이미지')) {
                                              const contentDiv = row.querySelector('.element-row-content')
                                              if (contentDiv) {
                                                mainImageDropzone = contentDiv.querySelector('.customdropzone')
                                              }
                                            }
                                          })

                                          if (!mainImageDropzone) {
                                            console.log(
                                              `[wing/inject] [${dropzoneAttempts}/${maxDropzoneAttempts}] Main image dropzone not found yet`,
                                            )
                                            if (dropzoneAttempts >= maxDropzoneAttempts) {
                                              console.warn(
                                                '[wing/inject] ❌ Timeout: Main image dropzone did not appear',
                                              )
                                              clearInterval(dropzonePollInterval)
                                            }
                                            return
                                          }

                                          console.log('[wing/inject] ✅ Found main image dropzone!')
                                          clearInterval(dropzonePollInterval)

                                          // 대표 이미지 blob 업로드
                                          setTimeout(async () => {
                                            console.log('[wing/inject] Uploading main image via dropzone...')

                                            try {
                                              // 대표 이미지 가져오기
                                              const images = window.__COUPANG_PRODUCT_IMAGES__ || []
                                              console.log('[wing/inject] 📸 Available images:', images.length)

                                              if (images.length === 0) {
                                                console.warn('[wing/inject] ❌ No images available')
                                                return
                                              }

                                              const mainImageUrl = images[0]
                                              console.log('[wing/inject] 📤 Fetching main image:', mainImageUrl)

                                              // Background를 통해 이미지 fetch
                                              const blobResponse = await chrome.runtime.sendMessage({
                                                type: 'FETCH_IMAGE_BLOBS',
                                                payload: { imageUrls: [mainImageUrl] },
                                              })

                                              if (!blobResponse?.ok || !blobResponse?.blobs?.[0]) {
                                                console.error('[wing/inject] ❌ Failed to fetch image')
                                                return
                                              }

                                              const blobData = blobResponse.blobs[0]
                                              if (blobData.error) {
                                                console.error('[wing/inject] ❌ Blob fetch error:', blobData.error)
                                                return
                                              }

                                              // base64를 File로 변환
                                              const base64Response = await fetch(blobData.base64)
                                              const blob = await base64Response.blob()
                                              const file = new File([blob], 'main_image.jpg', {
                                                type: blobData.type || 'image/jpeg',
                                              })

                                              console.log(
                                                '[wing/inject] ✅ File created:',
                                                file.name,
                                                file.size,
                                                'bytes',
                                              )

                                              // DataTransfer 객체 생성
                                              const dataTransfer = new DataTransfer()
                                              dataTransfer.items.add(file)

                                              // drag-and-drop 이벤트 시뮬레이션
                                              console.log('[wing/inject] 🎯 Simulating drag-drop on dropzone...')

                                              const dragEnterEvent = new DragEvent('dragenter', {
                                                bubbles: true,
                                                cancelable: true,
                                                dataTransfer: dataTransfer,
                                              })
                                              mainImageDropzone.dispatchEvent(dragEnterEvent)

                                              const dragOverEvent = new DragEvent('dragover', {
                                                bubbles: true,
                                                cancelable: true,
                                                dataTransfer: dataTransfer,
                                              })
                                              mainImageDropzone.dispatchEvent(dragOverEvent)

                                              const dropEvent = new DragEvent('drop', {
                                                bubbles: true,
                                                cancelable: true,
                                                dataTransfer: dataTransfer,
                                              })
                                              mainImageDropzone.dispatchEvent(dropEvent)

                                              console.log('[wing/inject] ✅ Drop event dispatched')
                                              console.log('[wing/inject] 🎉 Main image uploaded successfully!')

                                              // 이미지 등록 완료 후 상세설명 섹션 처리
                                              setTimeout(() => {
                                                console.log('[wing/inject] Moving to 상세설명 section...')

                                                // 상세설명 섹션으로 스크롤
                                                const detailSectionTitle = Array.from(
                                                  document.querySelectorAll('.form-section-title'),
                                                ).find(el => el.textContent?.includes('상세설명'))

                                                if (detailSectionTitle) {
                                                  detailSectionTitle.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'start',
                                                  })
                                                  console.log('[wing/inject] ✅ Scrolled to 상세설명 section')
                                                }

                                                // "기본 등록" 탭 클릭
                                                setTimeout(() => {
                                                  console.log(
                                                    '[wing/inject] Looking for "기본 등록" tab in 상세설명...',
                                                  )

                                                  // name="tab-content-level"을 가진 라디오 버튼 중 "기본 등록" 찾기
                                                  const contentLevelRadios = document.querySelectorAll(
                                                    'input[name="tab-content-level"][type="radio"]',
                                                  )
                                                  let basicContentRadio = null
                                                  let basicContentLabel = null

                                                  contentLevelRadios.forEach(radio => {
                                                    const label = document.querySelector(`label[for="${radio.id}"]`)
                                                    if (label && label.textContent?.includes('기본 등록')) {
                                                      basicContentRadio = radio
                                                      basicContentLabel = label
                                                    }
                                                  })

                                                  if (basicContentRadio && basicContentLabel) {
                                                    console.log(
                                                      '[wing/inject] ✅ Found "기본 등록" tab in 상세설명! Clicking...',
                                                    )
                                                    basicContentRadio.click()
                                                    basicContentLabel.click()
                                                    console.log('[wing/inject] ✅ "기본 등록" tab clicked in 상세설명')

                                                    // "이미지 등록" 버튼 클릭
                                                    setTimeout(() => {
                                                      console.log('[wing/inject] Looking for "이미지 등록" button...')

                                                      // "이미지 등록" 버튼 찾기
                                                      const imageUploadButtons =
                                                        document.querySelectorAll('button.sc-common-btn')
                                                      let imageUploadButton = null

                                                      imageUploadButtons.forEach(btn => {
                                                        if (btn.textContent?.trim() === '이미지 등록') {
                                                          imageUploadButton = btn
                                                        }
                                                      })

                                                      if (imageUploadButton) {
                                                        console.log(
                                                          '[wing/inject] ✅ Found "이미지 등록" button! Clicking...',
                                                        )
                                                        imageUploadButton.click()
                                                        console.log('[wing/inject] ✅ "이미지 등록" button clicked')

                                                        // 모달이 열린 후 이미지 업로드
                                                        setTimeout(async () => {
                                                          console.log(
                                                            '[wing/inject] Uploading images to detail modal...',
                                                          )

                                                          const images = window.__COUPANG_PRODUCT_IMAGES__ || []
                                                          if (images.length < 2) {
                                                            console.warn(
                                                              '[wing/inject] ⚠️ Not enough images for detail upload',
                                                            )
                                                            return
                                                          }

                                                          // 모달 내부의 hidden file input 찾기
                                                          const modalDialog = document.querySelector('.modal-dialog')
                                                          if (!modalDialog) {
                                                            console.warn('[wing/inject] ⚠️ Modal dialog not found')
                                                            return
                                                          }

                                                          const fileInput = modalDialog.querySelector(
                                                            'input[type="file"][hidden][multiple]',
                                                          )
                                                          if (!fileInput) {
                                                            console.warn('[wing/inject] ⚠️ File input not found')
                                                            return
                                                          }

                                                          console.log('[wing/inject] ✅ Found file input')

                                                          try {
                                                            // 드롭존 찾기
                                                            const dropZone =
                                                              modalDialog.querySelector('.image-drop-zone')
                                                            if (!dropZone) {
                                                              console.warn('[wing/inject] ⚠️ Drop zone not found')
                                                              return
                                                            }

                                                            console.log('[wing/inject] ✅ Found drop zone')

                                                            // Vue 인스턴스 확인
                                                            console.log(
                                                              '[wing/inject] 🔍 Vue instance:',
                                                              dropZone.__vue__,
                                                            )
                                                            console.log('[wing/inject] 🔍 Dropzone:', window.Dropzone)

                                                            // hidden file input 확인
                                                            console.log('[wing/inject] 🔍 File input:', fileInput)
                                                            console.log('[wing/inject] 🔍 File input events:', {
                                                              onchange: fileInput.onchange,
                                                              listeners: fileInput._listeners || 'N/A',
                                                            })

                                                            // 상세설명 이미지 준비
                                                            const files = []
                                                            const itemBriefCapture = window.__ITEM_BRIEF_CAPTURE__

                                                            console.log('[wing/inject] 🔍 Checking itemBriefCapture...')
                                                            console.log(
                                                              '[wing/inject] 📸 itemBriefCapture exists:',
                                                              !!itemBriefCapture,
                                                            )
                                                            console.log(
                                                              '[wing/inject] 📏 itemBriefCapture length:',
                                                              itemBriefCapture?.length || 0,
                                                            )
                                                            console.log(
                                                              '[wing/inject] 📦 Available images count:',
                                                              images?.length || 0,
                                                            )

                                                            // 첫 번째 이미지: 대표 이미지 (썸네일)
                                                            const mainImageUrl = images[0]
                                                            if (mainImageUrl) {
                                                              console.log(
                                                                '[wing/inject] 📸 Fetching main image via background:',
                                                                mainImageUrl,
                                                              )

                                                              const blobResponse = await chrome.runtime.sendMessage({
                                                                type: 'FETCH_IMAGE_BLOBS',
                                                                payload: { imageUrls: [mainImageUrl] },
                                                              })

                                                              if (blobResponse?.ok && blobResponse?.blobs?.[0]) {
                                                                const blobData = blobResponse.blobs[0]
                                                                if (!blobData.error) {
                                                                  const base64Response = await fetch(blobData.base64)
                                                                  const blob = await base64Response.blob()
                                                                  const file = new File([blob], 'detail_image_1.jpg', {
                                                                    type: blobData.type || 'image/jpeg',
                                                                  })
                                                                  files.push(file)
                                                                  console.log(
                                                                    '[wing/inject] ✅ Main image file created',
                                                                  )
                                                                }
                                                              }
                                                            }

                                                            // 두 번째 이미지: 필수 표기 정보 캡처
                                                            if (itemBriefCapture) {
                                                              console.log(
                                                                '[wing/inject] 📸 Using itemBrief capture for 2nd image',
                                                              )

                                                              // base64를 Blob으로 변환
                                                              const base64Response = await fetch(itemBriefCapture)
                                                              const blob = await base64Response.blob()
                                                              const file = new File([blob], 'item_brief_info.png', {
                                                                type: 'image/png',
                                                              })
                                                              files.push(file)
                                                              console.log(
                                                                '[wing/inject] ✅ ItemBrief capture file created',
                                                              )
                                                            } else {
                                                              console.warn(
                                                                '[wing/inject] ⚠️ ItemBrief capture not available, using 2nd thumbnail',
                                                              )

                                                              // fallback: 두 번째 썸네일 사용
                                                              const secondImageUrl = images[1]
                                                              if (secondImageUrl) {
                                                                const blobResponse = await chrome.runtime.sendMessage({
                                                                  type: 'FETCH_IMAGE_BLOBS',
                                                                  payload: { imageUrls: [secondImageUrl] },
                                                                })

                                                                if (blobResponse?.ok && blobResponse?.blobs?.[0]) {
                                                                  const blobData = blobResponse.blobs[0]
                                                                  if (!blobData.error) {
                                                                    const base64Response = await fetch(blobData.base64)
                                                                    const blob = await base64Response.blob()
                                                                    const file = new File(
                                                                      [blob],
                                                                      'detail_image_2.jpg',
                                                                      {
                                                                        type: blobData.type || 'image/jpeg',
                                                                      },
                                                                    )
                                                                    files.push(file)
                                                                    console.log(
                                                                      '[wing/inject] ✅ 2nd thumbnail file created',
                                                                    )
                                                                  }
                                                                }
                                                              }
                                                            }

                                                            if (files.length === 0) {
                                                              console.warn('[wing/inject] ⚠️ No files to upload')
                                                              return
                                                            }

                                                            // DataTransfer 객체 생성
                                                            const dataTransfer = new DataTransfer()
                                                            files.forEach(file => dataTransfer.items.add(file))

                                                            // 드래그 앤 드롭 이벤트 시뮬레이션
                                                            console.log(
                                                              '[wing/inject] 🎯 Simulating drag and drop events...',
                                                            )

                                                            // dragenter 이벤트
                                                            const dragEnterEvent = new DragEvent('dragenter', {
                                                              bubbles: true,
                                                              cancelable: true,
                                                              dataTransfer: dataTransfer,
                                                            })
                                                            dropZone.dispatchEvent(dragEnterEvent)

                                                            // dragover 이벤트
                                                            const dragOverEvent = new DragEvent('dragover', {
                                                              bubbles: true,
                                                              cancelable: true,
                                                              dataTransfer: dataTransfer,
                                                            })
                                                            dropZone.dispatchEvent(dragOverEvent)

                                                            // drop 이벤트
                                                            const dropEvent = new DragEvent('drop', {
                                                              bubbles: true,
                                                              cancelable: true,
                                                              dataTransfer: dataTransfer,
                                                            })
                                                            dropZone.dispatchEvent(dropEvent)

                                                            console.log(
                                                              '[wing/inject] ✅ Drop event dispatched with',
                                                              files.length,
                                                              'files',
                                                            )

                                                            // 저장 버튼 클릭
                                                            setTimeout(() => {
                                                              const saveButton = Array.from(
                                                                modalDialog.querySelectorAll('button.sc-common-btn'),
                                                              ).find(btn => btn.textContent?.includes('저장'))

                                                              if (saveButton) {
                                                                console.log(
                                                                  '[wing/inject] ✅ Clicking "저장" button...',
                                                                )
                                                                saveButton.click()
                                                                console.log(
                                                                  '[wing/inject] 🎉 Detail images uploaded successfully!',
                                                                )

                                                                // 상세설명 이미지 저장 후 상품 주요 정보 설정
                                                                setTimeout(() => {
                                                                  console.log(
                                                                    '[wing/inject] Setting product meta info...',
                                                                  )

                                                                  // 상품 주요 정보 섹션으로 스크롤
                                                                  const productMetaInfoPanel =
                                                                    document.getElementById('panel-product-meta-info')
                                                                  if (productMetaInfoPanel) {
                                                                    productMetaInfoPanel.scrollIntoView({
                                                                      behavior: 'smooth',
                                                                      block: 'start',
                                                                    })
                                                                    console.log(
                                                                      '[wing/inject] ✅ Scrolled to 상품 주요 정보 section',
                                                                    )
                                                                  }

                                                                  // 약간의 대기 후 설정 시작
                                                                  setTimeout(() => {
                                                                    // 1. 인증정보: '상세페이지 별도표기' 선택
                                                                    const certificationRadio = document.querySelector(
                                                                      'input[name="certificationType"][value="PRESENTED_IN_DETAIL_PAGE"]',
                                                                    )
                                                                    if (certificationRadio) {
                                                                      certificationRadio.click()
                                                                      console.log(
                                                                        '[wing/inject] ✅ Certification type set to "상세페이지 별도표기"',
                                                                      )
                                                                    } else {
                                                                      console.warn(
                                                                        '[wing/inject] ⚠️ Certification radio not found',
                                                                      )
                                                                    }

                                                                    // 2. 판매기간: '설정안함' 선택
                                                                    const salePeriodRadio = document.querySelector(
                                                                      'input[name="salePeriod"][value="N"]',
                                                                    )
                                                                    if (salePeriodRadio) {
                                                                      salePeriodRadio.click()
                                                                      console.log(
                                                                        '[wing/inject] ✅ Sale period set to "설정안함"',
                                                                      )
                                                                    } else {
                                                                      console.warn(
                                                                        '[wing/inject] ⚠️ Sale period radio not found',
                                                                      )
                                                                    }

                                                                    console.log(
                                                                      '[wing/inject] 🎉 Product meta info set successfully!',
                                                                    )

                                                                    // 3. 상품정보제공고시: '전체 상품 상세페이지 참조' 체크
                                                                    setTimeout(() => {
                                                                      console.log(
                                                                        '[wing/inject] Setting notice category...',
                                                                      )

                                                                      // 상품정보제공고시 섹션으로 스크롤
                                                                      const noticeCategoryPanel =
                                                                        document.getElementById('panel-notice-category')
                                                                      if (noticeCategoryPanel) {
                                                                        noticeCategoryPanel.scrollIntoView({
                                                                          behavior: 'smooth',
                                                                          block: 'start',
                                                                        })
                                                                        console.log(
                                                                          '[wing/inject] ✅ Scrolled to 상품정보제공고시 section',
                                                                        )
                                                                      }

                                                                      // 약간의 대기 후 체크박스 클릭
                                                                      setTimeout(() => {
                                                                        // '전체 상품 상세페이지 참조' 체크박스 찾기
                                                                        const noticeCheckbox = Array.from(
                                                                          document.querySelectorAll(
                                                                            '.notice-category-option-section .sc-common-check input[type="checkbox"]',
                                                                          ),
                                                                        ).find(checkbox => {
                                                                          const label =
                                                                            checkbox.parentElement?.textContent?.trim()
                                                                          return label?.includes(
                                                                            '전체 상품 상세페이지 참조',
                                                                          )
                                                                        })

                                                                        if (noticeCheckbox) {
                                                                          noticeCheckbox.click()
                                                                          console.log(
                                                                            '[wing/inject] ✅ Notice category checkbox clicked: "전체 상품 상세페이지 참조"',
                                                                          )
                                                                        } else {
                                                                          console.warn(
                                                                            '[wing/inject] ⚠️ Notice category checkbox not found',
                                                                          )
                                                                        }

                                                                        console.log(
                                                                          '[wing/inject] 🎉 All product registration steps completed!',
                                                                        )

                                                                        // 4. 판매요청 버튼 클릭
                                                                        setTimeout(() => {
                                                                          console.log(
                                                                            '[wing/inject] Clicking 판매요청 button...',
                                                                          )

                                                                          // '판매요청' 버튼 찾기
                                                                          const saleRequestButton = Array.from(
                                                                            document.querySelectorAll(
                                                                              'footer.form-footer button.wing-web-component',
                                                                            ),
                                                                          ).find(btn =>
                                                                            btn.textContent?.includes('판매요청'),
                                                                          )

                                                                          if (saleRequestButton) {
                                                                            saleRequestButton.click()
                                                                            console.log(
                                                                              '[wing/inject] ✅ 판매요청 button clicked!',
                                                                            )

                                                                            // 확인 모달의 '판매요청' 버튼 클릭 대기
                                                                            setTimeout(() => {
                                                                              console.log(
                                                                                '[wing/inject] Looking for confirmation modal...',
                                                                              )

                                                                              // sweet-alert 모달에서 '판매요청' 확인 버튼 찾기
                                                                              const confirmButton =
                                                                                document.querySelector(
                                                                                  '.sweet-alert button.confirm.alert-confirm',
                                                                                )

                                                                              if (confirmButton) {
                                                                                confirmButton.click()
                                                                                console.log(
                                                                                  '[wing/inject] ✅ Confirmation modal "판매요청" button clicked!',
                                                                                )

                                                                                // 성공 모달 반복 체크 (최대 30초)
                                                                                console.log(
                                                                                  '[wing/inject] Starting success modal polling...',
                                                                                )

                                                                                let checkCount = 0
                                                                                const maxChecks = 30 // 30초 동안 체크
                                                                                let modalFound = false

                                                                                const pollSuccessModal = setInterval(
                                                                                  () => {
                                                                                    checkCount++
                                                                                    console.log(
                                                                                      `[wing/inject] Polling for success modal... (${checkCount}/${maxChecks})`,
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
                                                                                      document.querySelectorAll(
                                                                                        '.modal',
                                                                                      ),
                                                                                    )
                                                                                    console.log(
                                                                                      '[wing/inject] Found .modal elements:',
                                                                                      modalElements.length,
                                                                                    )

                                                                                    const visibleModal =
                                                                                      modalElements.find(modal => {
                                                                                        const display =
                                                                                          window.getComputedStyle(
                                                                                            modal,
                                                                                          ).display
                                                                                        console.log(
                                                                                          '[wing/inject] Modal display:',
                                                                                          display,
                                                                                        )
                                                                                        return display !== 'none'
                                                                                      })

                                                                                    if (!visibleModal) {
                                                                                      console.log(
                                                                                        '[wing/inject] No visible modal found',
                                                                                      )
                                                                                      return
                                                                                    }

                                                                                    console.log(
                                                                                      '[wing/inject] ✅ Visible modal found!',
                                                                                    )

                                                                                    // 성공 모달인지 확인
                                                                                    const successTitle =
                                                                                      visibleModal.querySelector(
                                                                                        '.alert-title, h2.alert-title',
                                                                                      )
                                                                                    const isSuccessModal =
                                                                                      successTitle?.textContent?.includes(
                                                                                        '상품등록이 완료되었습니다',
                                                                                      )

                                                                                    console.log(
                                                                                      '[wing/inject] Is success modal:',
                                                                                      isSuccessModal,
                                                                                    )
                                                                                    console.log(
                                                                                      '[wing/inject] Title text:',
                                                                                      successTitle?.textContent,
                                                                                    )

                                                                                    if (isSuccessModal) {
                                                                                      if (!modalFound) {
                                                                                        modalFound = true
                                                                                        console.log(
                                                                                          '[wing/inject] ✅ Success modal detected!',
                                                                                        )
                                                                                        console.log(
                                                                                          '[wing/inject] Modal text:',
                                                                                          successTitle?.textContent,
                                                                                        )

                                                                                        // 폴링 중지
                                                                                        clearInterval(pollSuccessModal)
                                                                                        console.log(
                                                                                          '[wing/inject] ⏹️ Polling stopped',
                                                                                        )

                                                                                        // 등록상품ID 추출 (visible modal 내부에서만 찾기)
                                                                                        const allParagraphs =
                                                                                          Array.from(
                                                                                            visibleModal.querySelectorAll(
                                                                                              'p',
                                                                                            ),
                                                                                          )
                                                                                        console.log(
                                                                                          '[wing/inject] Found paragraphs in visible modal:',
                                                                                          allParagraphs.length,
                                                                                        )
                                                                                        allParagraphs.forEach(
                                                                                          (p, idx) => {
                                                                                            console.log(
                                                                                              `[wing/inject] Paragraph ${idx}:`,
                                                                                              p.textContent,
                                                                                            )
                                                                                          },
                                                                                        )

                                                                                        const alertText =
                                                                                          allParagraphs.find(p =>
                                                                                            p.textContent?.includes(
                                                                                              '등록상품ID',
                                                                                            ),
                                                                                          )
                                                                                        console.log(
                                                                                          '[wing/inject] Alert text element:',
                                                                                          alertText,
                                                                                        )
                                                                                        console.log(
                                                                                          '[wing/inject] Alert text content:',
                                                                                          alertText?.textContent,
                                                                                        )

                                                                                        const match =
                                                                                          alertText?.textContent?.match(
                                                                                            /등록상품ID\s*:\s*(\d+)/,
                                                                                          )
                                                                                        const vendorInventoryId = match
                                                                                          ? match[1]
                                                                                          : null

                                                                                        console.log(
                                                                                          '[wing/inject] 🔍 Regex match result:',
                                                                                          match,
                                                                                        )
                                                                                        console.log(
                                                                                          '[wing/inject] 📝 Extracted Vendor Inventory ID:',
                                                                                          vendorInventoryId,
                                                                                        )
                                                                                        console.log(
                                                                                          '[wing/inject] VendorInventoryId type:',
                                                                                          typeof vendorInventoryId,
                                                                                        )
                                                                                        console.log(
                                                                                          '[wing/inject] VendorInventoryId is null?',
                                                                                          vendorInventoryId === null,
                                                                                        )

                                                                                        console.log(
                                                                                          '[wing/inject] 🎊 Product registration fully completed!',
                                                                                        )

                                                                                        // product-upload 페이지에 알림 전송 및 탭 닫기
                                                                                        if (productId) {
                                                                                          console.log(
                                                                                            '[wing/inject] 📤 Sending PRODUCT_UPLOAD_SUCCESS message...',
                                                                                          )
                                                                                          console.log(
                                                                                            '[wing/inject] ProductId to send:',
                                                                                            Number(productId),
                                                                                          )
                                                                                          console.log(
                                                                                            '[wing/inject] VendorInventoryId to send:',
                                                                                            vendorInventoryId,
                                                                                          )
                                                                                          console.log(
                                                                                            '[wing/inject] VendorInventoryId type to send:',
                                                                                            typeof vendorInventoryId,
                                                                                          )

                                                                                          // Background가 sender.tab.id로 탭을 닫을 것
                                                                                          chrome.runtime.sendMessage(
                                                                                            {
                                                                                              type: 'PRODUCT_UPLOAD_SUCCESS',
                                                                                              productId:
                                                                                                Number(productId),
                                                                                              vendorInventoryId:
                                                                                                vendorInventoryId,
                                                                                            },
                                                                                            response => {
                                                                                              console.log(
                                                                                                '[wing/inject] ✅ Notification sent, response:',
                                                                                                response,
                                                                                              )
                                                                                            },
                                                                                          )
                                                                                        } else {
                                                                                          console.warn(
                                                                                            '[wing/inject] ⚠️ No productId to send',
                                                                                          )
                                                                                        }
                                                                                      }
                                                                                    }

                                                                                    // 최대 체크 횟수 도달
                                                                                    if (checkCount >= maxChecks) {
                                                                                      console.log(
                                                                                        '[wing/inject] ⏰ Polling timeout reached',
                                                                                      )
                                                                                      clearInterval(pollSuccessModal)

                                                                                      if (!modalFound) {
                                                                                        console.error(
                                                                                          '[wing/inject] ❌ Success modal not found after 30 seconds',
                                                                                        )
                                                                                      }
                                                                                    }
                                                                                  },
                                                                                  1000,
                                                                                ) // 1초마다 체크
                                                                              } else {
                                                                                console.warn(
                                                                                  '[wing/inject] ⚠️ Confirmation modal button not found',
                                                                                )
                                                                              }
                                                                            }, 1000) // 판매요청 버튼 클릭 후 1초 대기
                                                                          } else {
                                                                            console.warn(
                                                                              '[wing/inject] ⚠️ 판매요청 button not found',
                                                                            )
                                                                          }
                                                                        }, 1000) // 상품정보제공고시 설정 후 1초 대기
                                                                      }, 500) // 스크롤 후 0.5초 대기
                                                                    }, 1000) // 상품 주요 정보 설정 후 1초 대기
                                                                  }, 500) // 스크롤 후 0.5초 대기
                                                                }, 1000) // 저장 후 1초 대기
                                                              } else {
                                                                console.warn('[wing/inject] ⚠️ "저장" button not found')
                                                              }
                                                            }, 2000) // 파일 추가 후 2초 대기
                                                          } catch (error) {
                                                            console.error(
                                                              '[wing/inject] ❌ Error uploading detail images:',
                                                              error,
                                                            )
                                                          }
                                                        }, 1000) // 모달 열린 후 1초 대기
                                                      } else {
                                                        console.warn('[wing/inject] ⚠️ "이미지 등록" button not found')
                                                      }
                                                    }, 1000) // "기본 등록" 탭 클릭 후 1초 대기
                                                  } else {
                                                    console.warn(
                                                      '[wing/inject] ⚠️ "기본 등록" tab not found in 상세설명',
                                                    )
                                                  }
                                                }, 1000) // 스크롤 후 1초 대기
                                              }, 2000) // 이미지 저장 후 2초 대기
                                            } catch (error) {
                                              console.error('[wing/inject] ❌ Error uploading main image:', error)
                                            }
                                          }, 2000) // 대표 이미지 업로드 후 2초 대기
                                        }, 200)
                                      }, 1000) // "기본 등록" 클릭 후 1초 대기
                                    }, 200)
                                  }, 2500) // 가격 설정 후 충분한 시간 대기
                                } catch (error) {
                                  console.error('[wing/inject] ❌ Error fetching product images:', error)
                                }
                              }, 1000) // "선택완료" 클릭 후 1초 대기
                            } else {
                              console.warn(
                                '[wing/inject] ❌ "선택완료" button not found among',
                                allButtons.length,
                                'buttons',
                              )
                            }
                          }, 1000) // 체크박스 클릭 후 1초 대기
                        } else {
                          console.warn('[wing/inject] ❌ Checkbox not found in target item')
                        }
                      } else {
                        console.warn('[wing/inject] ❌ Target index out of bounds:', targetIndex, '/', itemDivs.length)
                      }
                    }, 200)
                  }, 1000) // "판매옵션 선택" 클릭 후 1초 대기
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
