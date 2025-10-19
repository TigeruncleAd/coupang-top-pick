import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'

export default function MinMaxPriceManager({
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
}: {
  minPrice: number
  setMinPrice: (minPrice: number) => void
  maxPrice: number
  setMaxPrice: (maxPrice: number) => void
}) {
  return (
    <div className="flex w-[140px] flex-col gap-3">
      <div className="space-y-2">
        <Label htmlFor="minPrice" className="text-sm font-semibold">
          최소 가격
        </Label>
        <Input
          id="minPrice"
          type="number"
          value={minPrice}
          onChange={e => setMinPrice(parseInt(e.target.value) || 0)}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxPrice" className="text-sm font-semibold">
          최대 가격
        </Label>
        <Input
          id="maxPrice"
          type="number"
          value={maxPrice}
          onChange={e => setMaxPrice(parseInt(e.target.value) || 0)}
          className="w-full"
        />
      </div>
    </div>
  )
}
