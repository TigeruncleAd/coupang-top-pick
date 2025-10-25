// Content script for product-upload page
;(function () {
  console.log('[product-upload/inject] 🚀 Script loaded on:', window.location.href)
  console.log('[product-upload/inject] 🔧 Chrome runtime available:', !!chrome.runtime)

  // Background로부터 메시지 받기
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('[product-upload/inject] 📨 Received message from background')
    console.log('[product-upload/inject] Message type:', msg?.type)
    console.log('[product-upload/inject] Full message:', JSON.stringify(msg))
    console.log('[product-upload/inject] Sender:', sender)

    if (msg?.type === 'UPDATE_PRODUCT_STATUS') {
      console.log('[product-upload/inject] ✅ Message type matched!')
      console.log('[product-upload/inject] ProductId:', msg.productId)
      console.log('[product-upload/inject] 📤 Forwarding to web page via window.postMessage')

      // Web page로 메시지 전달
      const messageToSend = {
        type: 'UPDATE_PRODUCT_STATUS',
        productId: msg.productId,
        source: 'coupang-extension',
      }
      console.log('[product-upload/inject] Message to send:', messageToSend)

      window.postMessage(messageToSend, '*')
      console.log('[product-upload/inject] ✅ window.postMessage sent')

      sendResponse({ ok: true })
      return true
    }

    console.log('[product-upload/inject] ⚠️ Message type did not match')
    return false
  })

  console.log('[product-upload/inject] ✅ Message listener registered')
  console.log('[product-upload/inject] ℹ️ Waiting for messages from background...')
})()
