'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/components/dialog'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Badge } from '@repo/ui/components/badge'
import { Plus, X } from 'lucide-react'

interface KeywordManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (keywords: string[]) => void
  currentKeywords: string[]
  recommendedKeywords: string[]
}

export function KeywordManagementModal({
  isOpen,
  onClose,
  onSave,
  currentKeywords,
  recommendedKeywords,
}: KeywordManagementModalProps) {
  const [newKeywordInput, setNewKeywordInput] = useState('')
  const [selectedRecommendedKeywords, setSelectedRecommendedKeywords] = useState<string[]>([])
  const [keywords, setKeywords] = useState<string[]>(currentKeywords)

  // 추천 키워드를 메모이제이션하여 무한 루프 방지
  const memoizedRecommendedKeywords = useMemo(() => recommendedKeywords, [recommendedKeywords])

  // 키워드 추가
  const handleAddKeyword = useCallback(
    (keyword: string) => {
      if (keyword.trim() && !keywords.includes(keyword.trim())) {
        setKeywords(prev => [...prev, keyword.trim()])
      }
    },
    [keywords],
  )

  // 키워드 제거
  const handleRemoveKeyword = useCallback(
    (keyword: string) => {
      setKeywords(prev => prev.filter(k => k !== keyword))

      // 추천 키워드 목록에 있다면 체크박스도 해제
      if (selectedRecommendedKeywords.includes(keyword)) {
        setSelectedRecommendedKeywords(prev => prev.filter(k => k !== keyword))
      }
    },
    [selectedRecommendedKeywords],
  )

  // 추천 키워드 토글
  const handleRecommendedKeywordToggle = useCallback(
    (keyword: string, checked: boolean) => {
      if (checked) {
        // 체크하면 즉시 현재 키워드 목록에 추가
        handleAddKeyword(keyword)
        setSelectedRecommendedKeywords(prev => [...prev, keyword])
      } else {
        // 체크 해제하면 현재 키워드 목록에서 제거
        handleRemoveKeyword(keyword)
        setSelectedRecommendedKeywords(prev => prev.filter(k => k !== keyword))
      }
    },
    [handleAddKeyword, handleRemoveKeyword],
  )

  // 저장
  const handleSave = useCallback(() => {
    // 새로 입력된 키워드 추가
    if (newKeywordInput.trim()) {
      handleAddKeyword(newKeywordInput.trim())
      setNewKeywordInput('')
    }

    onSave(keywords)
    onClose()
  }, [newKeywordInput, keywords, handleAddKeyword, onSave, onClose])

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setKeywords(currentKeywords)
      setNewKeywordInput('')

      // 현재 키워드 중에서 추천 키워드에 포함된 것들을 체크된 상태로 설정
      const checkedRecommendedKeywords = memoizedRecommendedKeywords.filter(keyword =>
        currentKeywords.includes(keyword),
      )
      setSelectedRecommendedKeywords(checkedRecommendedKeywords)
    }
  }, [isOpen, currentKeywords, memoizedRecommendedKeywords])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-gray-700 bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">추적 키워드 관리</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 키워드 직접 입력 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">키워드 직접 입력</h3>
            <div className="flex gap-2">
              <Input
                placeholder="새 키워드 입력"
                value={newKeywordInput}
                onChange={e => setNewKeywordInput(e.target.value)}
                className="border-gray-600 bg-gray-700 text-white"
                onKeyPress={e => {
                  if (e.key === 'Enter' && newKeywordInput.trim()) {
                    handleAddKeyword(newKeywordInput.trim())
                    setNewKeywordInput('')
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (newKeywordInput.trim()) {
                    handleAddKeyword(newKeywordInput.trim())
                    setNewKeywordInput('')
                  }
                }}
                disabled={!newKeywordInput.trim()}
                className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 추천 키워드 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">추천 키워드</h3>
            <div className="grid max-h-32 grid-cols-2 gap-2 overflow-y-auto">
              {memoizedRecommendedKeywords.map(keyword => (
                <div key={keyword} className="flex items-center space-x-2">
                  <Checkbox
                    id={keyword}
                    checked={selectedRecommendedKeywords.includes(keyword)}
                    onCheckedChange={checked => handleRecommendedKeywordToggle(keyword, checked as boolean)}
                    className="border-gray-500"
                  />
                  <label htmlFor={keyword} className="cursor-pointer text-sm text-gray-300">
                    {keyword}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 현재 키워드 목록 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">현재 키워드 목록</h3>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-600 bg-gray-700 p-3">
              {keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="flex items-center gap-1 border-blue-500 text-blue-400">
                      {keyword}
                      <button onClick={() => handleRemoveKeyword(keyword)} className="ml-1 hover:text-red-400">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">키워드가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700">
            취소
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
