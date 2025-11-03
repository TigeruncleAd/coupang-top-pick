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
      console.log('[coupang/inject] 🔍 Checking for option-picker-container...')
      console.log('[coupang/inject] 🌐 Current URL:', window.location.href)

      try {
        // option-picker-container 클래스 존재 여부 확인
        const optionPickerContainer = document.querySelector('.option-picker-container')
        const hasOptionPicker = !!optionPickerContainer

        console.log('[coupang/inject] 📦 Has option-picker-container:', hasOptionPicker)

        if (hasOptionPicker) {
          // 추가 정보: 옵션 개수 확인
          const options = optionPickerContainer.querySelectorAll('.option-item, .prod-option__item')
          console.log('[coupang/inject] 🎯 Number of options:', options.length)

          // option-picker-select 내부의 첫 번째 .twc-text-[12px] 텍스트 읽기
          let optionOrder = null
          const optionPickerSelect = optionPickerContainer.querySelector('.option-picker-select')
          if (optionPickerSelect) {
            // CSS 클래스에 대괄호가 있어서 속성 선택자 사용
            const allTextElements = optionPickerSelect.querySelectorAll('[class*="twc-text"]')
            for (const el of allTextElements) {
              // 클래스에 twc-text-[12px]가 포함되어 있는지 확인
              if (el.className.includes('twc-text-[12px]')) {
                const optionText = el.textContent?.trim()
                if (optionText) {
                  console.log('[coupang/inject] 📝 Option text:', optionText)
                  // "×" 또는 "x"로 split하여 배열 생성
                  optionOrder = optionText.split(/[×x]/).map(s => s.trim()).filter(s => s.length > 0)
                  console.log('[coupang/inject] 📋 Option order:', optionOrder)
                  break
                }
              }
            }
          }

          sendResponse({
            ok: true,
            hasOptionPicker: true,
            optionCount: options.length,
            optionOrder: optionOrder || [],
          })
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

      return true
    }

    return false
  })
})()
