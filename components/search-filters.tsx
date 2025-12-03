"use client"

import { useRouter, useSearchParams } from 'next/navigation'

export function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (value === 'any' || !value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/search?${params.toString()}`)
  }

  return (
    <section className="bg-muted py-6 border-b border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Price Range</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={searchParams?.get('priceRange') || 'any'}
              onChange={(e) => updateFilter('priceRange', e.target.value)}
            >
              <option value="any">Any price</option>
              <option value="0-50">€0 - €50</option>
              <option value="50-100">€50 - €100</option>
              <option value="100-200">€100 - €200</option>
              <option value="200+">€200+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Property Type</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={searchParams?.get('propertyType') || 'any'}
              onChange={(e) => updateFilter('propertyType', e.target.value)}
            >
              <option value="any">Any type</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="cabin">Cabin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Amenities</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={searchParams?.get('amenities') || 'any'}
              onChange={(e) => updateFilter('amenities', e.target.value)}
            >
              <option value="any">Any amenities</option>
              <option value="WiFi">WiFi</option>
              <option value="Pool">Pool</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Parking">Parking</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={searchParams?.get('rating') || 'any'}
              onChange={(e) => updateFilter('rating', e.target.value)}
            >
              <option value="any">Any rating</option>
              <option value="4.5">4.5+ stars</option>
              <option value="4.0">4.0+ stars</option>
              <option value="3.5">3.5+ stars</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  )
}