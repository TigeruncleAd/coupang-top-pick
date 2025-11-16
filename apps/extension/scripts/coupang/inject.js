// Content script for https://www.coupang.com/*
import html2canvas from 'html2canvas'
;(function () {
  try {
    console.log('[coupang/inject] 🚀 Script loaded on:', window.location.href)
  } catch {}

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    console.log('[coupang/inject] 📨 Received message:', msg?.type)

    if (msg?.type === 'EXTRACT_PRODUCT_IMAGES') {
      ;(async () => {
        console.log('[coupang/inject] 🔍 Starting image extraction...')
        console.log('[coupang/inject] 📄 Document ready state:', document.readyState)
        console.log('[coupang/inject] 🌐 Current URL:', window.location.href)

        try {
          // JSON-LD에서 이미지 추출 - src 속성이 있어도 찾도록 개선
          const allScripts = document.querySelectorAll('script')
          const jsonLdScripts = []

          console.log('[coupang/inject] 📜 Total script tags:', allScripts.length)

          allScripts.forEach((script, idx) => {
            const type = script.getAttribute('type')
            const src = script.getAttribute('src')
            if (type === 'application/ld+json') {
              jsonLdScripts.push(script)
              console.log(`[coupang/inject] 🎯 Found JSON-LD script #${jsonLdScripts.length}:`, {
                src,
                hasContent: !!script.textContent,
              })
            }
          })

          console.log('[coupang/inject] 📜 Found JSON-LD script tags:', jsonLdScripts.length)

          if (jsonLdScripts.length === 0) {
            console.warn('[coupang/inject] ⚠️ No JSON-LD scripts found in document')
            console.log('[coupang/inject] 📝 Document body length:', document.body?.innerHTML?.length || 0)
            // 샘플 script 태그들 출력
            console.log(
              '[coupang/inject] 🔍 Sample script types:',
              Array.from(allScripts)
                .slice(0, 5)
                .map(s => s.getAttribute('type')),
            )
          }

          let images = []

          for (let i = 0; i < jsonLdScripts.length; i++) {
            const script = jsonLdScripts[i]
            try {
              const textContent = script.textContent
              console.log(`[coupang/inject] 🔍 Parsing script ${i + 1}/${jsonLdScripts.length}`)
              console.log(`[coupang/inject] 📏 Script content length:`, textContent?.length || 0)

              if (!textContent || textContent.trim().length === 0) {
                console.warn(`[coupang/inject] ⚠️ Script ${i + 1} has no content`)
                continue
              }

              const jsonLd = JSON.parse(textContent)
              console.log('[coupang/inject] 📊 JSON-LD type:', jsonLd['@type'])

              if (jsonLd['@type'] === 'Product') {
                console.log('[coupang/inject] 🎯 Found Product JSON-LD!')
                console.log('[coupang/inject] 🖼️ Has image property:', !!jsonLd.image)
                console.log(
                  '[coupang/inject] 📦 Image array length:',
                  Array.isArray(jsonLd.image) ? jsonLd.image.length : 'not array',
                )

                if (jsonLd.image) {
                  console.log('[coupang/inject] 📦 Full image value:', JSON.stringify(jsonLd.image).substring(0, 200))
                }

                if (jsonLd.image && Array.isArray(jsonLd.image)) {
                  images = jsonLd.image
                  console.log('[coupang/inject] ✅ Found Product with images:', images.length)
                  console.log('[coupang/inject] 🎨 First image:', images[0])
                  break
                }
              }
            } catch (e) {
              console.warn(`[coupang/inject] ❌ Failed to parse script ${i + 1}:`, e.message)
              console.error(`[coupang/inject] 🔍 Error details:`, e)
              continue
            }
          }

          if (images.length === 0) {
            console.error('[coupang/inject] ❌ No images found in any JSON-LD')
            sendResponse({ ok: false, error: 'No images found' })
            return
          }

          // 492x492ex를 1000x1000ex로 변환
          const convertedImages = images.map(img => img.replace('492x492ex', '1000x1000'))
          console.log('[coupang/inject] ✅ Converted images:', convertedImages.length)
          console.log('[coupang/inject] 🎨 Sample converted:', convertedImages[0])

          // 필수 표기 정보 캡처
          console.log('[coupang/inject] 📸 Starting to capture 필수 표기 정보...')

          // '필수 표기 정보 더보기' 버튼 찾기
          const moreButton = Array.from(document.querySelectorAll('.twc-cursor-pointer')).find(el =>
            el.textContent?.includes('필수 표기 정보 더보기'),
          )

          if (moreButton) {
            console.log('[coupang/inject] ✅ Found "필수 표기 정보 더보기" button')
            moreButton.click()
            console.log('[coupang/inject] ✅ Clicked "필수 표기 정보 더보기"')

            // 버튼 클릭 후 약간 대기
            await new Promise(r => setTimeout(r, 500))
          } else {
            console.warn('[coupang/inject] ⚠️ "필수 표기 정보 더보기" button not found')
          }

          // itemBrief 캡처 (html2canvas는 이미 import됨)
          let itemBriefBase64 = null
          const itemBriefElement = document.getElementById('itemBrief')

          console.log('[coupang/inject] 🔍 itemBrief element:', !!itemBriefElement)
          console.log('[coupang/inject] 🔍 html2canvas imported:', typeof html2canvas)

          if (itemBriefElement && html2canvas) {
            console.log('[coupang/inject] 📸 Capturing itemBrief...')
            try {
              const canvas = await html2canvas(itemBriefElement, {
                backgroundColor: '#ffffff',
                scale: 2, // 고해상도
                logging: false,
                useCORS: true,
                allowTaint: false,
              })
              console.log('[coupang/inject] 🎨 Canvas created:', canvas.width, 'x', canvas.height)
              itemBriefBase64 = canvas.toDataURL('image/png')
              console.log('[coupang/inject] ✅ itemBrief captured successfully, length:', itemBriefBase64.length)
            } catch (captureError) {
              console.error('[coupang/inject] ❌ Error capturing itemBrief:', captureError)
              console.error('[coupang/inject] 🔍 Error stack:', captureError.stack)
            }
          } else {
            if (!itemBriefElement) {
              console.warn('[coupang/inject] ⚠️ itemBrief element not found')
            }
            if (!html2canvas) {
              console.warn('[coupang/inject] ⚠️ html2canvas not imported')
            }
          }

          sendResponse({
            ok: true,
            images: convertedImages,
            itemBriefCapture: itemBriefBase64,
          })
          console.log('[coupang/inject] 📤 Response sent successfully')
        } catch (e) {
          console.error('[coupang/inject] ❌ Error extracting images:', e)
          console.error('[coupang/inject] 🔍 Stack trace:', e.stack)
          sendResponse({ ok: false, error: String(e) })
        }
      })()
      return true
    }

    if (msg?.type === 'CHECK_OPTION_PICKER') {
      ;(async () => {
        console.log('[coupang/inject] 🔍 Checking for option-picker-container...')
        console.log('[coupang/inject] 🌐 Current URL:', window.location.href)

        try {
          // option-picker-container 또는 option-picker-select 클래스 존재 여부 확인
          const optionPickerContainer = document.querySelector('.option-picker-container')
          const optionPickerSelect = document.querySelector('.option-picker-select')
          const hasOptionPicker = !!optionPickerContainer || !!optionPickerSelect

          console.log('[coupang/inject] 📦 Has option-picker-container:', !!optionPickerContainer)
          console.log('[coupang/inject] 📦 Has option-picker-select:', !!optionPickerSelect)
          console.log('[coupang/inject] 📦 Has option picker (combined):', hasOptionPicker)

          if (hasOptionPicker) {
            // option-picker-container가 없으면 option-picker-select를 사용
            const container =
              optionPickerContainer ||
              (optionPickerSelect
                ? optionPickerSelect.closest('.option-picker-container') || optionPickerSelect.parentElement
                : null)

            // container가 없어도 option-picker-select가 있으면 계속 진행
            if (!container && optionPickerSelect) {
              console.log('[coupang/inject] ⚠️ No container found, using option-picker-select directly')
            }

            // 추가 정보: 옵션 개수 확인
            const options = container ? container.querySelectorAll('.option-item, .prod-option__item') : []
            console.log('[coupang/inject] 🎯 Number of options:', options.length)

            // option-picker-select 내부의 첫 번째 .twc-text-[12px] 텍스트 읽기
            let optionOrder = null
            const selectElement =
              optionPickerSelect || (container ? container.querySelector('.option-picker-select') : null)
            if (selectElement) {
              // CSS 클래스에 대괄호가 있어서 속성 선택자 사용
              const allTextElements = selectElement.querySelectorAll('[class*="twc-text"]')
              for (const el of allTextElements) {
                // 클래스에 twc-text-[12px]가 포함되어 있는지 확인
                if (el.className.includes('twc-text-[12px]')) {
                  const optionText = el.textContent?.trim()
                  if (optionText) {
                    console.log('[coupang/inject] 📝 Option text:', optionText)
                    // "×" 또는 "x"로 split하여 배열 생성
                    optionOrder = optionText
                      .split(/[×x]/)
                      .map(s => s.trim())
                      .filter(s => s.length > 0)
                    console.log('[coupang/inject] 📋 Option order:', optionOrder)
                    break
                  }
                }
              }
            }

            // 옵션 목록에서 첫 번째 옵션 찾기 (ul.custom-scrollbar 또는 유사한 구조, twc-hidden이어도 DOM에는 존재)
            // container가 없으면 document 전체에서 찾기
            let optionList = null
            if (container) {
              optionList = container.querySelector('ul.custom-scrollbar, ul[class*="custom-scrollbar"]')
            } else if (optionPickerSelect) {
              // option-picker-select 주변에서 찾기
              optionList =
                optionPickerSelect
                  .closest('.option-picker-container')
                  ?.querySelector('ul.custom-scrollbar, ul[class*="custom-scrollbar"]') ||
                optionPickerSelect.parentElement?.querySelector('ul.custom-scrollbar, ul[class*="custom-scrollbar"]') ||
                document.querySelector('ul.custom-scrollbar, ul[class*="custom-scrollbar"]')
            } else {
              optionList = document.querySelector('ul.custom-scrollbar, ul[class*="custom-scrollbar"]')
            }
            console.log('[coupang/inject] 🔍 optionList found:', !!optionList)

            // 첫 번째 옵션이 품절인지 확인 및 firstAttributeValue 추출
            let isFirstOptionSoldOut = false
            let firstAttributeValue = null
            if (optionList) {
              const firstOptionItem = optionList.querySelector('li:first-child')
              console.log('[coupang/inject] 🔍 firstOptionItem found:', !!firstOptionItem)
              if (firstOptionItem) {
                // 첫 번째 옵션 내에서 "품절" 텍스트 찾기 (단, "품절임박"은 제외)
                const soldOutText = firstOptionItem.textContent || ''
                // '품절'이 포함되어 있지만 '품절임박'은 아닌 경우만 체크
                if (soldOutText.includes('품절') && !soldOutText.includes('품절임박')) {
                  isFirstOptionSoldOut = true
                  console.log('[coupang/inject] ⚠️ First option is sold out')
                } else if (soldOutText.includes('품절임박')) {
                  console.log('[coupang/inject] ✅ First option is "품절임박" - validation will pass')
                }

                // 첫 번째 옵션의 첫 번째 속성 값 추출
                console.log('[coupang/inject] 🔍 Starting firstAttributeValue extraction...')
                // 첫 번째 옵션의 .twc-text-[12px]와 .twc-font-bold가 모두 포함된 텍스트 찾기
                // select-item 내부의 div.twc-flex-1 안에 있는 요소 찾기
                const flexContainer = firstOptionItem.querySelector('.select-item .twc-flex-1')
                console.log('[coupang/inject] 🔍 flexContainer found:', !!flexContainer)
                if (flexContainer) {
                  // twc-text-[12px]와 twc-font-bold가 모두 포함된 div 찾기
                  const allDivs = flexContainer.querySelectorAll('div')
                  console.log('[coupang/inject] 🔍 allDivs count:', allDivs.length)
                  for (const div of allDivs) {
                    const classList = div.className || ''
                    console.log('[coupang/inject] 🔍 div className:', classList)
                    if (classList.includes('twc-text-[12px]') && classList.includes('twc-font-bold')) {
                      const firstOptionText = div.textContent?.trim()
                      console.log('[coupang/inject] 📝 First option text:', firstOptionText)
                      if (firstOptionText) {
                        // "×" 또는 "x"로 split하여 첫 번째 부분만 가져오기
                        const parts = firstOptionText
                          .split(/[×x]/)
                          .map(s => s.trim())
                          .filter(s => s.length > 0)
                        console.log('[coupang/inject] 📝 Parts:', parts)
                        if (parts.length > 0) {
                          firstAttributeValue = parts[0]
                          console.log('[coupang/inject] ✅ First attribute value:', firstAttributeValue)
                        }
                        break
                      }
                    }
                  }
                } else {
                  console.log('[coupang/inject] ⚠️ flexContainer not found, trying alternative selector...')
                  // 대안: firstOptionItem 내부의 모든 div를 찾아서 확인
                  const allDivsInItem = firstOptionItem.querySelectorAll('div')
                  console.log('[coupang/inject] 🔍 allDivsInItem count:', allDivsInItem.length)
                  for (const div of allDivsInItem) {
                    const classList = div.className || ''
                    if (classList.includes('twc-text-[12px]') && classList.includes('twc-font-bold')) {
                      const firstOptionText = div.textContent?.trim()
                      if (firstOptionText) {
                        console.log('[coupang/inject] 📝 First option text (alternative):', firstOptionText)
                        const parts = firstOptionText
                          .split(/[×x]/)
                          .map(s => s.trim())
                          .filter(s => s.length > 0)
                        if (parts.length > 0) {
                          firstAttributeValue = parts[0]
                          console.log('[coupang/inject] ✅ First attribute value (alternative):', firstAttributeValue)
                        }
                        break
                      }
                    }
                  }
                }
              } else {
                console.log('[coupang/inject] ⚠️ firstOptionItem not found')
              }
            } else {
              console.log('[coupang/inject] ⚠️ optionList not found')
            }
            console.log('[coupang/inject] 🔍 Final firstAttributeValue:', firstAttributeValue)

            // 로켓 배송 배지 이미지 비율 확인
            let rocketBadgeRatio = 0
            let rocketBadgeCount = 0
            let totalOptionCount = 0
            if (optionList) {
              const allOptionItems = optionList.querySelectorAll('li')
              totalOptionCount = allOptionItems.length
              console.log('[coupang/inject] 🔍 Total option items:', totalOptionCount)

              // 각 옵션에서 배지 이미지 확인
              allOptionItems.forEach((item, index) => {
                // 배지 이미지 찾기: 쿠팡 배송 배지 경로가 포함된 img 태그
                // 예: https://image.coupangcdn.com/image/rds/delivery_badge_ext/badge_199559e56f7.png
                const badgeImages = item.querySelectorAll(
                  'img[src*="delivery_badge_ext/badge_"]',
                )
                if (badgeImages.length > 0) {
                  rocketBadgeCount++
                  console.log(`[coupang/inject] 🚀 Option ${index + 1} has rocket badge`)
                }
              })

              if (totalOptionCount > 0) {
                rocketBadgeRatio = rocketBadgeCount / totalOptionCount
                console.log('[coupang/inject] 🚀 Rocket badge count:', rocketBadgeCount, 'out of', totalOptionCount)
                console.log('[coupang/inject] 🚀 Rocket badge ratio:', (rocketBadgeRatio * 100).toFixed(2) + '%')
              }
            }

            // 첫 번째 속성 값 추출 완료 후 10초 대기
            console.log('[coupang/inject] ⏳ Waiting 100 mili-seconds after extracting first attribute value...')
            await new Promise(resolve => setTimeout(resolve, 100))
            console.log('[coupang/inject] ✅ Wait completed')
            console.log('[coupang/inject] 📤 Sending response with firstAttributeValue:', firstAttributeValue)

            const response = {
              ok: true,
              hasOptionPicker: !isFirstOptionSoldOut, // 첫 번째 옵션이 품절이면 false
              optionCount: options.length,
              optionOrder: optionOrder || [],
              firstAttributeValue: firstAttributeValue || null,
              rocketBadgeRatio: rocketBadgeRatio,
              rocketBadgeCount: rocketBadgeCount,
              totalOptionCount: totalOptionCount,
              isFirstOptionSoldOut: isFirstOptionSoldOut,
            }
            console.log('[coupang/inject] 📤 Full response:', response)
            sendResponse(response)
          } else {
            console.log('[coupang/inject] ⚠️ No option-picker-container found')
            sendResponse({
              ok: true,
              hasOptionPicker: false,
              optionCount: 0,
              optionOrder: [],
            })
          }
        } catch (e) {
          console.error('[coupang/inject] ❌ Error checking option picker:', e)
          sendResponse({ ok: false, error: String(e) })
        }
      })()
      return true
    }

    return false
  })
})()
