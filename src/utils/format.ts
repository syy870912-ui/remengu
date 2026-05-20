// 涨跌色
export function changeColor(v: number | null | undefined): string {
  if (v == null) return 'text-gray-500'
  return v > 0 ? 'text-rise' : v < 0 ? 'text-fall' : 'text-gray-500'
}

export function changeBgColor(v: number | null | undefined): string {
  if (v == null) return 'bg-gray-200 text-gray-700'
  return v > 0 ? 'bg-rise text-white' : v < 0 ? 'bg-fall text-white' : 'bg-gray-200 text-gray-700'
}

export function formatChange(v: number | null | undefined): string {
  if (v == null) return '-'
  return v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)
}

export function formatPercent(v: number | null | undefined): string {
  if (v == null) return '-'
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'
}

export function ratingLabel(r: 'buy' | 'hold' | 'sell'): string {
  return r === 'buy' ? '买入' : r === 'hold' ? '持有' : '卖出'
}

export function ratingColor(r: 'buy' | 'hold' | 'sell'): string {
  return r === 'buy' ? 'text-rise bg-red-50' : r === 'hold' ? 'text-amber-600 bg-amber-50' : 'text-fall bg-green-50'
}
