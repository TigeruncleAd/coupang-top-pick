# 확장 프로그램 Extension Storage 구현 가이드

## 📦 개요

`noopener`로 열린 창에서는 `window.parent`로 통신할 수 없으므로, Extension Storage를 사용하여 productId를 전달합니다.

## 🔧 확장 프로그램 Background Script 구현

```javascript
// background.js 또는 service-worker.js

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('📨 External message received:', request.type)

  // 1. 최신 productId 가져오기
  if (request.type === 'GET_LATEST_PRODUCT_ID') {
    chrome.storage.local.get(['latestProductId'], result => {
      if (result.latestProductId) {
        console.log('✅ Sending productId:', result.latestProductId)
        sendResponse({ status: 'success', productId: result.latestProductId })
      } else {
        console.log('❌ No productId found')
        sendResponse({ status: 'error' })
      }
    })
    return true // 비동기 응답을 위해 필요
  }

  // 2. productId 삭제
  if (request.type === 'CLEAR_LATEST_PRODUCT_ID') {
    chrome.storage.local.remove(['latestProductId'], () => {
      console.log('🗑️ productId cleared')
      sendResponse({ status: 'success' })
    })
    return true
  }

  // 기존 RUN_HIDDEN_TASK 처리...
})
```

## 📝 확장 프로그램 Content Script 또는 Inject Script 구현

```javascript
// 상품 데이터 수집 완료 후 API 호출
async function sendProductDataToServer(productData) {
  try {
    // JWT 토큰 가져오기
    const tokenData = await chrome.storage.local.get(['extToken'])
    const token = tokenData.extToken

    if (!token) {
      console.error('❌ Token not found')
      return
    }

    // API 호출
    const response = await fetch('https://your-domain.com/api/rankingSearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    })

    const result = await response.json()

    if (result.status === 'success' && result.productId) {
      console.log('✅ API 성공, productId:', result.productId)

      // Extension Storage에 productId 저장
      await chrome.storage.local.set({ latestProductId: result.productId })
      console.log('💾 productId saved to extension storage')

      // 창 닫기 (선택사항)
      // window.close()
    } else {
      console.error('❌ API 실패:', result)
    }
  } catch (error) {
    console.error('❌ API 호출 오류:', error)
  }
}

// 사용 예시
const productData = {
  productName: '...',
  productUrl: '...',
  market: 'naver',
  // ... 기타 필드
}

sendProductDataToServer(productData)
```

## 🔄 전체 플로우

```
1. 웹 앱: 확장 프로그램에 RUN_HIDDEN_TASK 요청
   ↓
2. 확장 프로그램: 새 창에서 데이터 수집
   ↓
3. 확장 프로그램: API 호출하여 productId 받음
   ↓
4. 확장 프로그램: chrome.storage.local에 productId 저장
   ↓
5. 웹 앱: 2초마다 GET_LATEST_PRODUCT_ID 메시지로 확인
   ↓
6. 확장 프로그램: storage에서 productId 반환
   ↓
7. 웹 앱: productId 받아서 상세 페이지로 이동
   ↓
8. 웹 앱: CLEAR_LATEST_PRODUCT_ID로 storage 정리
```

## ⚠️ 주의사항

1. **타임아웃 설정**: 웹 앱에서 30초 타임아웃이 있으므로 확장 프로그램도 적절한 시간 내에 완료해야 함
2. **에러 처리**: API 실패 시 적절한 에러 메시지를 사용자에게 표시
3. **Storage 정리**: 사용 후 반드시 storage에서 productId를 삭제하여 오래된 데이터가 남지 않도록 함
4. **보안**: JWT 토큰을 안전하게 관리하고, HTTPS를 사용

## 🧪 테스트

Chrome DevTools에서 확인:

```javascript
// Storage 확인
chrome.storage.local.get(['latestProductId'], console.log)

// Storage 설정
chrome.storage.local.set({ latestProductId: 'test-123' })

// Storage 삭제
chrome.storage.local.remove(['latestProductId'])
```
