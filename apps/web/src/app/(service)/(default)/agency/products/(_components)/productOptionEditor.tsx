'use client'

import { FormEvent, useState } from 'react'
import { EditProduct } from '../serverAction'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@repo/ui/components/button'
import { getRecommendedPrice } from '@/lib/utils/getRecommendedPrice'
import { Input } from '@repo/ui/components/input'

export default function ProductOptionEditor({
  form,
  handleChange,
  cnyCurrency,
}: {
  form: EditProduct
  handleChange: ({ name, value }: { name: string; value: any }) => void
  cnyCurrency: number
}) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<any[]>([])
  const { selectedTaobaoProduct } = form
  const price = selectedTaobaoProduct?.price || 0
  const options = (form?.selectedTaobaoProduct?.myData as any)?.options || []
  const deliveryAgencyFee = form.deliveryAgencyFee || 7000
  const groupedOptions = options.reduce((acc, option) => {
    acc[option.ko_prop_type] = option
    return acc
  }, {})

  function handleSelectOption(optionId: string) {
    if (selectedOptionIds.includes(optionId)) {
      setSelectedOptionIds(selectedOptionIds.filter(id => id !== optionId))
    } else {
      setSelectedOptionIds([...selectedOptionIds, optionId])
    }
  }
  function handleSelectAll() {
    if (selectedOptionIds.length >= options.length) {
      setSelectedOptionIds([])
    } else {
      setSelectedOptionIds(options.map(option => option.sku_id))
    }
  }

  function handleCopy(skuId: string) {
    navigator.clipboard.writeText(skuId)
    toast.success('복사되었습니다.')
  }

  function sortByPrice() {
    const newOptions = [...options]
    newOptions.sort((a, b) => a.price - b.price)
    handleChange({ name: 'selectedTaobaoProduct.myData.options', value: newOptions })
  }

  function handleDeleteOptions(optionIds: string[]) {
    const newOptions = [...options]
    handleChange({
      name: 'selectedTaobaoProduct.myData.options',
      value: newOptions.filter(option => !optionIds.includes(option.sku_id)),
    })
    setSelectedOptionIds([])
  }

  function handleChangeGroupName(e: FormEvent<HTMLFormElement>, originalGroupName: string) {
    e.preventDefault()
    const targetOptions = options.filter(option => option.ko_prop_type === originalGroupName)
    const newGroupName = (e.target as any).groupName.value
    const newOptions = [...options]
    targetOptions.forEach(option => {
      option.ko_prop_type = newGroupName
    })
    handleChange({ name: 'selectedTaobaoProduct.myData.options', value: newOptions })
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm">
        <Button variant="outline" size="sm" onClick={sortByPrice}>
          가격순 정렬
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleDeleteOptions(selectedOptionIds)}>
          옵션 삭제
        </Button>
      </div>
      <div className="mt-6 flex items-center gap-2 text-sm">
        <Checkbox checked={selectedOptionIds.length >= options.length} onCheckedChange={handleSelectAll} />
        선택 된 옵션 : ({selectedOptionIds.length}/{options.length})
      </div>
      <div className="mt-6 flex flex-col gap-4 text-sm">
        {Object.entries(groupedOptions).map(([key, option], idx) => {
          const groupName = key
          return (
            <div key={key} className="flex flex-col gap-2 rounded-md border px-2 py-2">
              <form
                className="flex items-center gap-2 text-lg font-medium"
                onSubmit={e => {
                  e.preventDefault()
                  handleChangeGroupName(e, groupName)
                }}>
                옵션그룹 {idx + 1} : <Input type="text" defaultValue={groupName} className="w-fit" name="groupName" />{' '}
                <Button variant="outline" size="sm" type="submit">
                  옵션 그룹명 변경
                </Button>
              </form>
              <div>
                {options.map((option, idx) => {
                  const isSelected = selectedOptionIds.includes(option.sku_id)
                  const diffPrice = (option.price - price * 100) / 100
                  const recommendedPrice = getRecommendedPrice({
                    originalPrice: option.price / 100,
                    cnyCurrency,
                    deliveryAgencyFee,
                  })
                  return (
                    <div
                      key={option.sku_id}
                      className="grid grid-cols-[100px_1fr_2fr] items-center gap-4 border-y py-2 text-sm">
                      <div className="flex items-center gap-4">
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectOption(option.sku_id)} />
                        <img src={option.img_url} alt={option.cn_name} className="h-16 w-16 rounded-md" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div>{option.cn_name}</div>
                          <button
                            onClick={() => handleCopy(option.cn_name)}
                            className="cursor-pointer hover:text-blue-500">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <div>타오바오 판매가: ￥{option.price / 100}</div>
                        <div>추천 판매가 (원): {recommendedPrice}</div>
                      </div>
                      <div className="flex w-full gap-4">
                        <div className="flex w-full flex-col gap-2">
                          <div
                            className={`${(option.myName?.length || option.ko_name?.length) > 25 ? 'text-red-500' : ''}`}>
                            내 옵션명 ({option.myName?.length || option.ko_name?.length} / 25)
                          </div>
                          <Input
                            type="text"
                            value={option.myName || option.ko_name}
                            onChange={e =>
                              handleChange({
                                name: `selectedTaobaoProduct.myData.options.${idx}.myName`,
                                value: e.target.value || option.ko_name,
                              })
                            }
                          />
                        </div>
                        <div className="flex w-full flex-col gap-2">
                          <div>내 가격</div>
                          <Input
                            type="number"
                            value={option.myPrice || recommendedPrice}
                            onChange={e =>
                              handleChange({
                                name: `selectedTaobaoProduct.myData.options.${idx}.myPrice`,
                                value: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
