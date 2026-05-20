import { changeColor, formatPercent } from '../utils/format'

interface StockBadgeProps {
  change: number
  className?: string
}

export function ChangeBadge({ change, className = '' }: StockBadgeProps) {
  const base = change > 0
    ? 'bg-rise text-white shadow-sm shadow-red-500/20'
    : change < 0
    ? 'bg-fall text-white shadow-sm shadow-green-500/20'
    : 'bg-gray-200 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${base} ${className}`}>
      {formatPercent(change)}
    </span>
  )
}

interface RatingBadgeProps {
  rating: string
  className?: string
}

export function RatingBadge({ rating, className = '' }: RatingBadgeProps) {
  const r = (rating === 'buy' || rating === 'hold' || rating === 'sell') ? rating : 'hold'
  const map = {
    buy: 'bg-red-50 text-rise border border-red-200 shadow-sm',
    hold: 'bg-amber-50 text-amber-600 border border-amber-200 shadow-sm',
    sell: 'bg-green-50 text-fall border border-green-200 shadow-sm',
  }
  const labels = { buy: '买入', hold: '持有', sell: '卖出' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${map[r]} ${className}`}>
      {labels[r]}
    </span>
  )
}

interface SectorTagProps {
  sector: string
  className?: string
}

const sectorColors: Record<string, string> = {
  '科技': 'bg-blue-50 text-blue-600 border border-blue-100',
  '消费': 'bg-purple-50 text-purple-600 border border-purple-100',
  '医药': 'bg-teal-50 text-teal-600 border border-teal-100',
  '金融': 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  '能源': 'bg-orange-50 text-orange-600 border border-orange-100',
  '新能源': 'bg-green-50 text-green-600 border border-green-100',
  '军工': 'bg-red-50 text-red-700 border border-red-100',
  '地产': 'bg-gray-100 text-gray-600 border border-gray-200',
  '农业': 'bg-lime-50 text-lime-600 border border-lime-100',
  '传媒': 'bg-pink-50 text-pink-600 border border-pink-100',
  '通信': 'bg-cyan-50 text-cyan-600 border border-cyan-100',
  '有色金属': 'bg-yellow-50 text-yellow-600 border border-yellow-100',
}

export function SectorTag({ sector, className = '' }: SectorTagProps) {
  const color = sectorColors[sector] || 'bg-gray-100 text-gray-600 border border-gray-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${color} ${className}`}>
      {sector}
    </span>
  )
}
