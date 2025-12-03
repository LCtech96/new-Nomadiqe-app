'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, Calendar, Users, ChevronDown, AtSign, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import Image from 'next/image'

export function SearchHeaderImproved() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [location, setLocation] = useState(searchParams?.get('location') || '')
  const [checkIn, setCheckIn] = useState<Date>()
  const [checkOut, setCheckOut] = useState<Date>()
  const [guests, setGuests] = useState(parseInt(searchParams?.get('guests') || '1'))
  const [openPopover, setOpenPopover] = useState<'checkIn' | 'checkOut' | 'guests' | null>(null)
  
  // User search state
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [searchUsers, setSearchUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams?.toString())

    if (location) {
      params.set('location', location)
    } else {
      params.delete('location')
    }

    if (checkIn) {
      params.set('checkIn', format(checkIn, 'yyyy-MM-dd'))
    } else {
      params.delete('checkIn')
    }

    if (checkOut) {
      params.set('checkOut', format(checkOut, 'yyyy-MM-dd'))
    } else {
      params.delete('checkOut')
    }

    if (guests > 1) {
      params.set('guests', guests.toString())
    } else {
      params.delete('guests')
    }

    router.push(`/search?${params.toString()}`)
  }

  // User search logic
  useEffect(() => {
    const searchUsers = async () => {
      if (!showUserSearch || location.trim().length < 2 || !location.startsWith('@')) {
        setSearchUsers([])
        return
      }

      const cleanQuery = location.replace(/@/g, '')
      
      if (cleanQuery.length < 1) {
        setSearchUsers([])
        return
      }

      setLoadingUsers(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(cleanQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchUsers(data.users || [])
        }
      } catch (error) {
        console.error('Error searching users:', error)
        setSearchUsers([])
      } finally {
        setLoadingUsers(false)
      }
    }

    const debounceTimer = setTimeout(searchUsers, 200)
    return () => clearTimeout(debounceTimer)
  }, [location, showUserSearch])

  // Check if location starts with @
  useEffect(() => {
    setShowUserSearch(location.startsWith('@'))
  }, [location])

  // Handle click outside user search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        if (showUserSearch && !event.target) {
          setShowUserSearch(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserSearch])

  const handleSelectUser = (user: any) => {
    router.push(`/profile/${user.id}`)
    setShowUserSearch(false)
    setLocation('')
  }

  // Show next step based on completed fields
  const canShowCheckIn = location.trim() !== '' && !showUserSearch
  const canShowCheckOut = canShowCheckIn && checkIn !== undefined
  const canShowGuests = canShowCheckOut && checkOut !== undefined

  return (
    <div className="w-full max-w-4xl mx-auto relative" style={{ zIndex: 1000 }}>
      <div className="bg-card dark:bg-secondary/40 border border-primary/30 shadow-lg shadow-primary/20 backdrop-blur-sm rounded-2xl p-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Location - Always visible */}
          <div className="flex-1 min-w-[200px] relative" ref={searchContainerRef}>
            {showUserSearch ? (
              <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4 z-10" />
            ) : (
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
            )}
            <Input
              placeholder={showUserSearch ? "Cerca utenti..." : "Dove vai?"}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 h-12 border-0 bg-muted/30 dark:bg-muted/20 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
            />
            {showUserSearch && searchUsers.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-primary/30 rounded-lg shadow-2xl backdrop-blur-sm max-h-64 overflow-y-auto"
                style={{ zIndex: 99999 }}
              >
                {searchUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors text-left border-b border-border/50 last:border-0"
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                      {user.image || user.profilePictureUrl ? (
                        <Image
                          src={user.image || user.profilePictureUrl || ''}
                          alt={user.name || 'User'}
                          width={40}
                          height={40}
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-lg font-semibold text-foreground">
                          {(user.name || user.fullName || 'U')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {user.fullName || user.name || 'User'}
                      </div>
                      {user.username && (
                        <div className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showUserSearch && loadingUsers && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-primary/30 rounded-lg shadow-2xl backdrop-blur-sm p-4"
                style={{ zIndex: 99999 }}
              >
                <div className="text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              </div>
            )}
            {showUserSearch && !loadingUsers && searchUsers.length === 0 && location.length > 1 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-primary/30 rounded-lg shadow-2xl backdrop-blur-sm p-4"
                style={{ zIndex: 99999 }}
              >
                <div className="text-center text-sm text-muted-foreground">
                  No users found
                </div>
              </div>
            )}
          </div>

          {/* Search Button - Small circular button with paper plane icon */}
          {!showUserSearch && (
            <Button 
              onClick={handleSearch} 
              size="icon"
              className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-white transition-all shadow-lg hover:shadow-xl flex-shrink-0"
              aria-label="Search"
            >
              <Send className="w-5 h-5" />
            </Button>
          )}

          {/* Divider - appears after location */}
          {canShowCheckIn && (
            <>
              <div className="h-8 w-px bg-border hidden sm:block" />
              
              {/* Check-in */}
              <Popover open={openPopover === 'checkIn'} onOpenChange={(open) => setOpenPopover(open ? 'checkIn' : null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="justify-start text-left font-normal h-12 px-3 bg-muted/30 dark:bg-muted/20 hover:bg-muted/50 dark:hover:bg-muted/30 border-0 min-w-[140px] text-foreground"
                  >
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className={checkIn ? 'text-foreground' : 'text-muted-foreground'}>
                      {checkIn ? format(checkIn, 'MMM dd') : 'Check-in'}
                    </span>
                    <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={checkIn}
                    onSelect={(date) => {
                      setCheckIn(date)
                      setOpenPopover('checkOut')
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </>
          )}

          {/* Divider - appears after check-in */}
          {canShowCheckOut && (
            <>
              <div className="h-8 w-px bg-border hidden sm:block" />
              
              {/* Check-out */}
              <Popover open={openPopover === 'checkOut'} onOpenChange={(open) => setOpenPopover(open ? 'checkOut' : null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="justify-start text-left font-normal h-12 px-3 bg-muted/30 hover:bg-muted/50 border-0 min-w-[140px]"
                  >
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className={checkOut ? 'text-foreground' : 'text-muted-foreground'}>
                      {checkOut ? format(checkOut, 'MMM dd') : 'Check-out'}
                    </span>
                    <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={checkOut}
                    onSelect={(date) => {
                      setCheckOut(date)
                      setOpenPopover('guests')
                    }}
                    initialFocus
                    disabled={(date) => checkIn ? date < checkIn : false}
                  />
                </PopoverContent>
              </Popover>
            </>
          )}

          {/* Divider - appears after check-out */}
          {canShowGuests && (
            <>
              <div className="h-8 w-px bg-border hidden sm:block" />
              
              {/* Guests */}
              <Popover open={openPopover === 'guests'} onOpenChange={(open) => setOpenPopover(open ? 'guests' : null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="justify-start text-left font-normal h-12 px-3 bg-muted/30 dark:bg-muted/20 hover:bg-muted/50 dark:hover:bg-muted/30 border-0 text-foreground"
                  >
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {guests} {guests === 1 ? 'ospite' : 'ospiti'}
                    </span>
                    <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Ospiti</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                        className="h-8 w-8"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-medium">{guests}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGuests(Math.min(16, guests + 1))}
                        disabled={guests >= 16}
                        className="h-8 w-8"
                      >
                        +
                      </Button>
                    </div>
                    <Button 
                      onClick={() => setOpenPopover(null)} 
                      className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                    >
                      Done
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
