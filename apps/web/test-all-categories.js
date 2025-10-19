/**
 * 모든 카테고리 DataLab 병렬 처리 테스트 스크립트
 */

const testAllCategories = async () => {
  console.log('🚀 모든 카테고리 DataLab 병렬 처리 테스트 시작\n')

  try {
    // 1. 1차 카테고리만 테스트
    console.log('📊 1차 카테고리만 테스트...')
    const mainCategoriesResponse = await fetch('http://localhost:3000/api/datalab-all-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryLevels: [1],
        maxPages: 5, // 테스트용으로 5페이지만
        concurrencyLimit: 3, // 동시에 3개 카테고리씩
        saveToDatabase: false, // 테스트용으로 DB 저장 안함
      }),
    })

    const mainCategoriesResult = await mainCategoriesResponse.json()
    console.log('✅ 1차 카테고리 결과:', {
      success: mainCategoriesResult.success,
      totalCategories: mainCategoriesResult.totalCategories,
      successfulCategories: mainCategoriesResult.successfulCategories,
      totalKeywords: mainCategoriesResult.totalKeywords,
      processingTime: mainCategoriesResult.totalProcessingTime,
    })

    if (mainCategoriesResult.results && mainCategoriesResult.results.length > 0) {
      console.log('📋 1차 카테고리 상세 결과:')
      mainCategoriesResult.results.forEach((result, index) => {
        console.log(
          `  ${index + 1}. ${result.categoryName} (레벨 ${result.level}): ${result.success ? '성공' : '실패'} - ${result.keywordCount}개 키워드`,
        )
        if (result.error) {
          console.log(`     오류: ${result.error}`)
        }
      })
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // 2. 모든 레벨 카테고리 테스트 (작은 규모)
    console.log('📊 모든 레벨 카테고리 테스트 (작은 규모)...')
    const allCategoriesResponse = await fetch('http://localhost:3000/api/datalab-all-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryLevels: [1, 2], // 1차, 2차만
        maxPages: 3, // 테스트용으로 3페이지만
        concurrencyLimit: 2, // 동시에 2개 카테고리씩
        saveToDatabase: false,
      }),
    })

    const allCategoriesResult = await allCategoriesResponse.json()
    console.log('✅ 모든 레벨 카테고리 결과:', {
      success: allCategoriesResult.success,
      totalCategories: allCategoriesResult.totalCategories,
      successfulCategories: allCategoriesResult.successfulCategories,
      totalKeywords: allCategoriesResult.totalKeywords,
      processingTime: allCategoriesResult.totalProcessingTime,
    })

    if (allCategoriesResult.results && allCategoriesResult.results.length > 0) {
      console.log('📋 모든 레벨 카테고리 상세 결과:')
      allCategoriesResult.results.forEach((result, index) => {
        console.log(
          `  ${index + 1}. ${result.categoryName} (레벨 ${result.level}): ${result.success ? '성공' : '실패'} - ${result.keywordCount}개 키워드`,
        )
        if (result.error) {
          console.log(`     오류: ${result.error}`)
        }
      })
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // 3. 특정 레벨만 테스트
    console.log('📊 2차 카테고리만 테스트...')
    const level2Response = await fetch('http://localhost:3000/api/datalab-all-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryLevels: [2],
        maxPages: 2, // 테스트용으로 2페이지만
        concurrencyLimit: 2,
        saveToDatabase: false,
      }),
    })

    const level2Result = await level2Response.json()
    console.log('✅ 2차 카테고리 결과:', {
      success: level2Result.success,
      totalCategories: level2Result.totalCategories,
      successfulCategories: level2Result.successfulCategories,
      totalKeywords: level2Result.totalKeywords,
      processingTime: level2Result.totalProcessingTime,
    })
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error)
  }

  console.log('\n🎉 모든 카테고리 테스트 완료!')
}

// 스크립트 실행
if (require.main === module) {
  testAllCategories()
}

module.exports = { testAllCategories }
