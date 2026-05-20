import { useEffect, useState, useRef } from 'react'
import { getAds } from '../api/ads'

interface AdSlotProps {
  size?: 'banner' | 'rectangle' | 'leaderboard'
  className?: string
  label?: string
}

const heights: Record<string, string> = {
  banner: 'h-16',
  rectangle: 'h-32',
  leaderboard: 'h-24',
}

export default function AdSlot({ size = 'banner', className = '', label = '广告位' }: AdSlotProps) {
  const [ads, setAds] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    const load = async () => {
      try {
        const data = await getAds(size)
        setAds(data)
      } catch (e) {
        console.error('Failed to load ads', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [size])

  if (loading) {
    return (
      <div className={`ad-slot ${heights[size]} w-full ${className} animate-pulse`}>
        <div className="flex flex-col items-center gap-1 relative z-10">
          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Loading...</span>
        </div>
      </div>
    )
  }

  if (ads.length === 0) {
    return (
      <div className={`ad-slot ${heights[size]} w-full ${className}`}>
        <div className="flex flex-col items-center gap-1 relative z-10">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Advertisement</span>
          <span className="text-gray-400 font-medium text-xs">{label}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      {ads.map((ad) => (
        <div key={String(ad['id'])} className="mb-2 last:mb-0">
          {ad['html_code'] ? (
            <div
              className="ad-html-content"
              dangerouslySetInnerHTML={{ __html: String(ad['html_code']) }}
            />
          ) : ad['image_url'] ? (
            <a
              href={String(ad['link_url'] || '#')}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
            >
              <img
                src={String(ad['image_url'])}
                alt={String(ad['alt_text'] || 'advertisement')}
                className="max-w-full h-auto"
              />
            </a>
          ) : null}
        </div>
      ))}
    </div>
  )
}
