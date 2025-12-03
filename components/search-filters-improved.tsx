'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Filter, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const propertyTypes = ['Apartment', 'House', 'Villa', 'Cabin', 'Loft']
const amenitiesList = ['WiFi', 'Pool', 'Kitchen', 'Parking', 'Air Conditioning', 'Workspace']

export function SearchFiltersContent({ onApply }: { onApply?: () => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize from URL params
  const initializePriceRange = () => {
    const priceParam = searchParams?.get('priceRange')
    if (!priceParam) return [0, 500]
    if (priceParam.includes('+')) {
      const min = parseInt(priceParam.replace('+', ''))
      return [min, 500]
    }
    if (priceParam.includes('-')) {
      const [min, max] = priceParam.split('-').map(Number)
      return [min, max]
    }
    return [0, 500]
  }

  const [priceRange, setPriceRange] = useState(initializePriceRange())
  const [selectedType, setSelectedType] = useState<string>(searchParams?.get('propertyType') || '')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams?.get('amenities') ? searchParams.get('amenities')!.split(',') : []
  )
  const [minRating, setMinRating] = useState<string>(searchParams?.get('rating') || '')

  const activeFiltersCount =
    (selectedType ? 1 : 0) +
    selectedAmenities.length +
    (minRating ? 1 : 0) +
    (priceRange[0] !== 0 || priceRange[1] !== 500 ? 1 : 0)

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Price range
    if (priceRange[0] !== 0 || priceRange[1] !== 500) {
      if (priceRange[1] >= 500) {
        params.set('priceRange', `${priceRange[0]}+`)
      } else {
        params.set('priceRange', `${priceRange[0]}-${priceRange[1]}`)
      }
    } else {
      params.delete('priceRange')
    }

    // Property type
    if (selectedType) {
      params.set('propertyType', selectedType.toLowerCase())
    } else {
      params.delete('propertyType')
    }

    // Amenities
    if (selectedAmenities.length > 0) {
      params.set('amenities', selectedAmenities.join(','))
    } else {
      params.delete('amenities')
    }

    // Rating
    if (minRating) {
      params.set('rating', minRating)
    } else {
      params.delete('rating')
    }

    router.push(`/search?${params.toString()}`)

    // Call onApply callback to close the sheet on mobile
    if (onApply) {
      onApply()
    }
  }

  const clearFilters = () => {
    setPriceRange([0, 500])
    setSelectedType('')
    setSelectedAmenities([])
    setMinRating('')
    router.push('/search')
  }

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    )
  }

  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-white">Price Range</Label>
          <span className="text-sm text-gray-300">
            €{priceRange[0]} - €{priceRange[1] >= 500 ? '500+' : priceRange[1]}
          </span>
        </div>
        <Slider
          min={0}
          max={500}
          step={10}
          value={priceRange}
          onValueChange={setPriceRange}
          className="w-full"
        />
      </div>

      <Separator />

      {/* Property Type */}
      <div className="space-y-3">
        <Label className="text-white">Property Type</Label>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any type</SelectItem>
            {propertyTypes.map(type => (
              <SelectItem key={type} value={type.toLowerCase()}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Amenities */}
      <div className="space-y-3">
        <Label className="text-white">Amenities</Label>
        <div className="grid grid-cols-2 gap-3">
          {amenitiesList.map(amenity => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={selectedAmenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              <label
                htmlFor={amenity}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-200"
              >
                {amenity}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div className="space-y-3">
        <Label className="text-white">Minimum Rating</Label>
        <Select value={minRating} onValueChange={setMinRating}>
          <SelectTrigger>
            <SelectValue placeholder="Any rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any rating</SelectItem>
            <SelectItem value="4.5">4.5+ stars</SelectItem>
            <SelectItem value="4.0">4.0+ stars</SelectItem>
            <SelectItem value="3.5">3.5+ stars</SelectItem>
            <SelectItem value="3.0">3.0+ stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button 
          onClick={applyFilters} 
          className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
        >
          Apply Filters
        </Button>
        {activeFiltersCount > 0 && (
          <Button 
            onClick={clearFilters} 
            variant="outline"
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function SearchFiltersImproved() {
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const activeFiltersCount =
    (searchParams?.get('priceRange') ? 1 : 0) +
    (searchParams?.get('propertyType') ? 1 : 0) +
    (searchParams?.get('amenities') ? searchParams.get('amenities')!.split(',').length : 0) +
    (searchParams?.get('rating') ? 1 : 0)

  const handleCloseSheet = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile: Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full relative">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] bg-gray-800/95 border-blue-400/30 backdrop-blur-sm">
            <SheetHeader>
              <SheetTitle className="text-white">Filters</SheetTitle>
              <SheetDescription className="text-gray-300">
                Refine your search with these filters
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 overflow-y-auto max-h-[calc(85vh-8rem)]">
              <SearchFiltersContent onApply={handleCloseSheet} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Inline */}
      <div className="hidden lg:block">
        <Card className="bg-gray-800/90 border border-blue-400/30 shadow-lg shadow-blue-500/20 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Filters</h3>
              {activeFiltersCount > 0 && (
                <Badge className="bg-pink-500 text-white">{activeFiltersCount} active</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <SearchFiltersContent />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
