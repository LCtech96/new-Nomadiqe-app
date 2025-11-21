"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  MessageCircle,
  MapPin,
  MoreHorizontal,
  X,
  Share2,
  Send,
  Repeat,
  User,
  Home,
  Sparkles,
  Edit,
  Trash2
} from 'lucide-react'
import { PostComments } from '@/components/post-comments'
import { UserMentionSearch } from '@/components/user-mention-search'
import { ShareCommentCard } from '@/components/share-comment-card'

interface PostCardProps {
  id: string
  content: string
  images: string[]
  location?: string
  createdAt: string
  author: {
    id: string
    name: string
    image?: string
    role?: string
  }
  property?: {
    id: string
    title: string
    city?: string
    country?: string
    price?: number
    currency?: string
    images?: string[]
  }
  likes: number
  comments: number
  isLiked?: boolean
  layout?: 'discover' | 'profile' // New prop to determine layout
}

export function PostCard({
  id,
  content,
  images,
  location,
  createdAt,
  author,
  property,
  likes,
  comments,
  isLiked = false,
  layout = 'discover' // Default to discover layout
}: PostCardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [liked, setLiked] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(likes)
  const [commentCount, setCommentCount] = useState(comments)
  const [showComments, setShowComments] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [showCommentCard, setShowCommentCard] = useState(false)
  const [selectedUserForShare, setSelectedUserForShare] = useState<any>(null)
  const [captionExpanded, setCaptionExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const handleLike = async () => {
    // Check if user is authenticated
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }

    // Optimistic update
    const wasLiked = liked
    const previousCount = likeCount
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)

    try {
      const response = await fetch(`/api/posts/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to update like')
      }

      const data = await response.json()

      // Update with server response
      setLiked(data.liked)
      setLikeCount(data.likeCount)
    } catch (error) {
      // Revert optimistic update on error
      console.error('Error updating like:', error)
      setLiked(wasLiked)
      setLikeCount(previousCount)
    }
  }

  const handleCommentClick = () => {
    // Check if user is authenticated
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }
    setShowComments(true)
  }

  const handleShare = () => {
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }
    setShareOpen(true)
  }

  const handleSendMessage = () => {
    setShareOpen(false)
    setShowUserSearch(true)
  }

  const handleSelectUser = (user: any) => {
    setSelectedUserForShare(user)
    setShowUserSearch(false)
    setShowCommentCard(true)
  }

  const handleSendSharedMessage = async (message: string) => {
    try {
      if (!selectedUserForShare?.id) return
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: selectedUserForShare.id, postId: id, content: message }),
      })
      // Close and reset, stay on page
      setShowCommentCard(false)
      setSelectedUserForShare(null)
    } catch (error) {
      console.error('Errore durante l\'invio del messaggio:', error)
    }
  }

  const handleRepost = () => {
    // TODO: Implement repost functionality
    console.log('Repost post:', id)
    setShareOpen(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getRoleIcon = () => {
    const role = author.role || 'GUEST'
    switch (role) {
      case 'HOST':
        return <Home className="h-4 w-4 text-blue-500" />
      case 'INFLUENCER':
        return <Sparkles className="h-4 w-4 text-purple-500" />
      case 'GUEST':
      case 'TRAVELER':
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const isOwnPost = session?.user?.id === author.id

  const handleDelete = async () => {
    if (!isOwnPost || !session?.user?.id) return
    
    if (!confirm('Sei sicuro di voler eliminare questo post?')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      // Refresh the page to remove the deleted post
      router.refresh()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Errore durante l\'eliminazione del post')
    } finally {
      setIsDeleting(false)
      setMenuOpen(false)
    }
  }

  const handleEdit = () => {
    router.push(`/create-post?edit=${id}`)
  }

  // Swipe handlers for card
  const minSwipeDistance = 50

  const onTouchStartCard = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMoveCard = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEndCard = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }
    if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }
  }

  // Swipe handlers for lightbox
  const onTouchStartLightbox = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMoveLightbox = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEndLightbox = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }
    if (isRightSwipe) {
      setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }
  }

  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-card max-w-[600px] mx-auto w-full">
      <CardHeader className="pb-1 px-2.5 pt-2">
        <div className="flex items-center justify-between w-full min-w-0">
          <div className="flex items-center space-x-1.5 min-w-0 flex-1">
            <Link href={`/profile/${author.id}`} className="flex-shrink-0">
              <div className="h-7 w-7 cursor-pointer hover:ring-2 hover:ring-primary/40 hover:ring-offset-1 hover:ring-offset-background transition-all duration-300 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 hover:scale-105 shadow-md">
                {author.image && !imageError ? (
                  <Image 
                    src={author.image} 
                    alt={author.name}
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    unoptimized
                  />
                ) : (
                  <span className="text-primary font-semibold text-xs">
                    {author.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/profile/${author.id}`}>
                <h3 className="font-bold text-xs hover:text-primary transition-colors hover:underline decoration-2 decoration-primary/50 underline-offset-2 truncate" style={{ fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>
                  {author.name}
                </h3>
              </Link>
              <p className="text-[10px] text-muted-foreground/70 font-medium mt-0 truncate">{formatDate(createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Role Icon */}
            {author.role && (
              <div className="h-5 w-5 rounded-full bg-muted/50 flex items-center justify-center border border-border/50 flex-shrink-0">
                {getRoleIcon()}
              </div>
            )}
            {/* Menu Button */}
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted/80 flex-shrink-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" align="end">
                <div className="py-2">
                  {isOwnPost ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit()
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">Modifica</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete()
                        }}
                        disabled={isDeleting}
                        className="w-full px-3 py-2 text-left hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {isDeleting ? 'Eliminazione...' : 'Elimina'}
                        </span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-3 transition-colors text-sm text-muted-foreground"
                    >
                      Segnala post
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-0 px-0 pb-1.5">
        {/* Property Link (if exists) - shown before images */}
          {property && (
          <div className="px-2 pb-1.5">
            <Link href={`/property/${property.id}`}>
              <Card className="bg-gradient-to-br from-muted/40 via-muted/30 to-muted/20 hover:from-muted/60 hover:via-muted/50 hover:to-muted/40 transition-all duration-300 cursor-pointer border-0 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-3">
                    {/* Property Image */}
                    {property.images && property.images.length > 0 && (
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover rounded-l-lg"
                        />
                      </div>
                    )}

                    {/* Property Details */}
                    <div className="flex-1 py-3 pr-3">
                      <Badge variant="secondary" className="mb-1.5 text-xs">Featured Property</Badge>
                      <h4 className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">
                        {property.title}
                      </h4>
                      {property.city && property.country && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {property.city}, {property.country}
                          </span>
                        </div>
                      )}
                      {property.price && (
                        <p className="text-sm font-semibold text-primary mt-1.5">
                          {property.currency || 'EUR'} {property.price}/night
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
          )}

      {/* Images Carousel */}
      {images.length > 0 && (
        <div 
          className="w-full relative"
          onTouchStart={images.length > 1 ? onTouchStartCard : undefined}
          onTouchMove={images.length > 1 ? onTouchMoveCard : undefined}
          onTouchEnd={images.length > 1 ? onTouchEndCard : undefined}
        >
          <div
            className={`relative group overflow-hidden cursor-pointer aspect-video max-h-60 w-full`}
            onClick={() => {
              setLightboxIndex(currentImageIndex)
              setLightboxOpen(true)
            }}
          >
            <img
              src={images[currentImageIndex]}
              alt={`Post image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Image Counter Badge */}
            {images.length > 1 && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
            
            {/* Navigation Dots */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentImageIndex(index)
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'bg-white w-4' 
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Caption - shown after images */}
      {content && (
        <div className="px-2 pt-1 pb-0">
          {!captionExpanded ? (
            <>
              <p className="text-xs leading-snug text-foreground/90 font-medium line-clamp-2">
                {content}
              </p>
              {content.length > 150 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCaptionExpanded(true)
                  }}
                  className="text-[10px] text-muted-foreground hover:text-primary mt-0 transition-colors"
                >
                  Mostra di più
                </button>
              )}
            </>
          ) : (
            <div className="relative">
              <div
                className="text-xs leading-snug text-foreground/90 font-medium overflow-y-auto max-h-[120px] pr-1"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent',
                }}
              >
                <p>{content}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCaptionExpanded(false)
                }}
                className="text-[10px] text-muted-foreground hover:text-primary mt-0 transition-colors"
              >
                Mostra meno
              </button>
            </div>
          )}
        </div>
      )}

      {/* Location - shown after caption */}
      {location && (
        <div className="px-2 pt-0.5 pb-0">
          <Link
            href={`/search?location=${encodeURIComponent(location)}`}
            className="flex items-center gap-1 hover:text-primary transition-colors group w-fit"
            onClick={(e) => e.stopPropagation()}
          >
            <MapPin className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs text-muted-foreground group-hover:text-primary group-hover:underline transition-colors">{location}</span>
          </Link>
        </div>
      )}

        {/* Actions */}
        <div className="flex items-center justify-between px-2.5 pt-1 pb-1 border-t border-border/50 mt-1">
          <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`gap-1.5 h-7 px-2 transition-all duration-200 hover:scale-105 ${
              liked ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' : 'hover:bg-muted/80'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 transition-all ${liked ? 'fill-current scale-110' : ''}`} />
            <span className="text-xs font-medium">{likeCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCommentClick}
            className="gap-1.5 h-7 px-2 transition-all duration-200 hover:scale-105 hover:bg-primary/10 hover:text-primary"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{commentCount}</span>
          </Button>
          </div>
          
          {/* Share Button */}
          <div className="relative">
            <Popover open={shareOpen} onOpenChange={setShareOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 hover:bg-muted/80"
                >
                  <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <div className="py-2">
                  <button
                    onClick={handleSendMessage}
                    className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-3 transition-colors"
                  >
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Invia con messaggio</span>
                  </button>
                  <button
                    onClick={handleRepost}
                    className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-3 transition-colors"
                  >
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Condividi</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* User Search */}
            {showUserSearch && (
              <UserMentionSearch
                onSelectUser={handleSelectUser}
                onClose={() => setShowUserSearch(false)}
              />
            )}
          </div>
        </div>
      </CardContent>

      {/* Share Comment Card */}
      {showCommentCard && selectedUserForShare && (
        <ShareCommentCard
          isOpen={showCommentCard}
          onClose={() => {
            setShowCommentCard(false)
            setSelectedUserForShare(null)
          }}
          onSend={handleSendSharedMessage}
          selectedUser={selectedUserForShare}
          post={{ id, content, images }}
        />
      )}

      {/* Comments Panel - Only render when open to avoid hydration issues */}
      {showComments && (
        <PostComments
          postId={id}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentCount(commentCount + 1)}
        />
      )}

      {/* Image Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 z-[1200] bg-black flex flex-col"
          onClick={() => {
            setLightboxOpen(false)
            setCaptionExpanded(false)
          }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Top Bar with Close Button */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div></div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                setLightboxOpen(false)
                setCaptionExpanded(false)
                }}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
              <X className="w-6 h-6" />
              </button>
          </div>

          {/* Main Content Area */}
          <div 
            className="flex-1 flex items-center justify-center relative"
            onTouchStart={images.length > 1 ? onTouchStartLightbox : undefined}
            onTouchMove={images.length > 1 ? onTouchMoveLightbox : undefined}
            onTouchEnd={images.length > 1 ? onTouchEndLightbox : undefined}
          >
            {/* Image with 4:5 aspect ratio */}
            <div
              className="relative w-full aspect-[4/5] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[lightboxIndex]}
                alt={`Image ${lightboxIndex + 1}`}
                className="w-full h-full object-cover select-none"
                draggable={false}
              />
              
              {/* Navigation Dots */}
              {images.length > 1 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        setLightboxIndex(index)
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === lightboxIndex 
                          ? 'bg-white w-6' 
                          : 'bg-white/50 hover:bg-white/80 w-2'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar with Caption and Actions */}
          <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 via-black/80 to-transparent p-6">
            {/* Caption with expand/collapse */}
            <div className="max-w-3xl mx-auto mb-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCaptionExpanded(!captionExpanded)
                }}
                className="w-full text-left"
              >
                <p className={`text-white text-sm leading-relaxed ${captionExpanded ? '' : 'line-clamp-2'}`}>
                  {content}
                </p>
              </button>
            </div>

            {/* Actions */}
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLike()
                  }}
                  className={`gap-2 text-white hover:bg-white/20 ${
                    liked ? 'text-red-400 hover:text-red-300' : ''
                  }`}
                >
                  <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                  <span className="font-medium">{likeCount}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxOpen(false)
                    setCaptionExpanded(false)
                    handleCommentClick()
                  }}
                  className="gap-2 text-white hover:bg-white/20"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">{commentCount}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleShare()
                  }}
                  className="gap-2 text-white hover:bg-white/20"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
                <div className="px-3 py-1 rounded-full bg-black/50 text-white text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
