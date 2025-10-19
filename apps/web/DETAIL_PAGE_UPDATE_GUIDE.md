# 상세 페이지 데이터 업데이트 가이드

## 📦 개요

`RankingTraceDetailPage`에서 URL 파라미터를 통해 확장 프로그램을 호출하여 상품 데이터를 업데이트할 수 있습니다.

## 🔧 URL 파라미터

### 기본 접속 (자동 업데이트)

```
/analyze/ranking-trace/detail?productId=123
```

### 업데이트 방지 접속

```
/analyze/ranking-trace/detail?productId=123&noUpdate=true
```

### 파라미터 설명

- `productId`: 상품 ID (필수)
- `noUpdate`: 업데이트 방지 여부 (`true`일 때 업데이트 안함, 기본값: `false`)
- `extensionId`: 서버에서 자동으로 가져옴 (URL 파라미터 불필요)

## 🚀 사용 방법

### 1. 일반 접속 (자동 업데이트)

```typescript
// TrackedProductItem에서 상품 클릭 시 (기본적으로 업데이트)
router.push(`/analyze/ranking-trace/detail?productId=${productId}`)
```

### 2. 업데이트 방지 접속

```typescript
// addProduct에서 상품 추가 후 이동 시 (업데이트 방지)
const params = new URLSearchParams({
  productId: '123',
  noUpdate: 'true',
})
router.push(`/analyze/ranking-trace/detail?${params.toString()}`)
```

### 3. 수동 업데이트

상세 페이지에서 "데이터 업데이트" 버튼을 클릭하여 수동으로 업데이트할 수 있습니다.

## 🔄 업데이트 플로우

```
1. 페이지 로드 시 update=true 확인
   ↓
2. 상품 데이터 로드 완료 후 자동 실행
   ↓
3. 확장 프로그램으로 상품 URL 전송
   ↓
4. 확장 프로그램이 데이터 수집 후 API 호출
   ↓
5. Extension Storage에 productId 저장
   ↓
6. 웹에서 2초마다 productId 확인
   ↓
7. productId 수신 시 상품 데이터 새로고침
   ↓
8. 업데이트 완료
```

## 🎯 주요 기능

### 자동 업데이트

- 기본적으로 상품 데이터 로드 후 자동 실행
- `noUpdate=true` 파라미터가 있을 때만 업데이트 방지
- 확장 프로그램 ID는 서버에서 자동으로 가져옴

### 수동 업데이트

- 상품 헤더의 "데이터 업데이트" 버튼 클릭
- 업데이트 중일 때는 버튼이 비활성화됨

### 상태 표시

- 업데이트 중일 때 상단에 로딩 상태 표시
- 버튼에 로딩 스피너와 텍스트 변경

### 타임아웃 처리

- 30초 타임아웃 설정
- 타임아웃 시 자동으로 업데이트 중단

## ⚠️ 주의사항

1. **확장 프로그램 ID 필수**: 업데이트 기능을 사용하려면 `extensionId` 파라미터가 필요
2. **상품 URL 필수**: 상품 데이터에 `url` 필드가 있어야 확장 프로그램 호출 가능
3. **타임아웃**: 30초 내에 업데이트가 완료되지 않으면 자동 중단
4. **중복 실행 방지**: 이미 업데이트 중일 때는 추가 실행되지 않음

## 🧪 테스트

### 자동 업데이트 테스트

```javascript
// 브라우저 콘솔에서 (기본적으로 업데이트됨)
window.location.href = '/analyze/ranking-trace/detail?productId=123'

// 업데이트 방지 테스트
window.location.href = '/analyze/ranking-trace/detail?productId=123&noUpdate=true'
```

### 수동 업데이트 테스트

1. 일반 접속으로 상세 페이지 열기
2. "데이터 업데이트" 버튼 클릭
3. 업데이트 진행 상황 확인

## 🔧 확장 프로그램 측 구현

확장 프로그램에서는 다음 메시지 타입을 처리해야 합니다:

```javascript
// Background Script
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_LATEST_PRODUCT_ID') {
    // Extension Storage에서 productId 반환
  }

  if (request.type === 'CLEAR_LATEST_PRODUCT_ID') {
    // Extension Storage에서 productId 삭제
  }
})
```

자세한 구현 방법은 `EXTENSION_STORAGE_GUIDE.md`를 참고하세요.
