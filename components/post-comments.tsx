"use client"

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDistanceToNow } from 'date-fns'
import { X, Send, Loader2, MoreHorizontal, Trash2 } from 'lucide-react'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    image?: string
  }
}

interface PostCommentsProps {
  postId: string
  isOpen: boolean
  onClose: () => void
  onCommentAdded?: () => void
}

export function PostComments({ postId, isOpen, onClose, onCommentAdded }: PostCommentsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [swipeStartY, setSwipeStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted on client-side to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  useEffect(() => {
    if (isOpen && postId && mounted) {
      fetchComments()
    }
  }, [isOpen, postId, fetchComments, mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim() || !session?.user?.id) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments([data.comment, ...comments])
        setNewComment('')
        onCommentAdded?.()
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!session?.user?.id) return

    setDeletingCommentId(commentId)
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove comment from state
        setComments(comments.filter(c => c.id !== commentId))
        
        // Update comment count if callback exists
        if (onCommentAdded) {
          onCommentAdded()
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
    } finally {
      setDeletingCommentId(null)
    }
  }

  // Swipe down to close handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setCurrentY(e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    const diffY = currentY - swipeStartY
    
    // Close if swiped down more than 100px
    if (diffY > 100) {
      onClose()
    }
    
    // Reset
    setSwipeStartY(0)
    setCurrentY(0)
  }

  // Don't render until mounted and open to avoid hydration issues
  if (!mounted || !isOpen) return null

  return (
    <div className="fixed inset-0 z-[1300] bg-black/50" onClick={onClose}>
      <div
        className="fixed bottom-0 left-0 right-0 h-[75vh] bg-background shadow-lg rounded-t-2xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          {/* Drag Handle - Swipe to close */}
          <div 
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 pb-3">
            <h2 className="text-lg font-semibold">Commenti</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable comments area */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.user.image} alt={comment.user.name} />
                      <AvatarFallback className="p-1">
                        <Image 
                          src="/nomadiqe-logo-transparent.png" 
                          alt="Nomadiqe" 
                          width={28} 
                          height={28}
                          className="object-contain"
                        />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm truncate">{comment.user.name}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm break-words">{comment.content}</p>
                        </div>
                        
                        {/* Show menu only for own comments */}
                        {session?.user?.id === comment.user.id && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 flex-shrink-0 -mt-1"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-1" align="end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deletingCommentId === comment.id}
                                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                {deletingCommentId === comment.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Eliminazione...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Elimina Commento
                                  </>
                                )}
                              </Button>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Nessun commento</p>
                <p className="text-sm text-muted-foreground">Sii il primo a commentare!</p>
              </div>
            )}
          </div>

          {/* Comment Input - Fixed at bottom */}
          {session ? (
            <div className="border-t bg-background flex-shrink-0">
              <form onSubmit={handleSubmit} className="p-4">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Lascia un commento pubblico..."
                    className="flex-1 resize-none min-h-[44px] max-h-32"
                    disabled={isSubmitting}
                    rows={1}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newComment.trim() || isSubmitting}
                    className="flex-shrink-0 h-11 w-11 bg-nomadiqe-600 hover:bg-nomadiqe-700"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="border-t p-4 space-y-3 bg-background flex-shrink-0">
              <p className="text-center text-sm text-muted-foreground">
                Accedi per unirti alla conversazione
              </p>
              <div className="flex gap-2 justify-center">
                <Button asChild variant="outline" size="sm">
                  <Link href="/auth/signin">Accedi</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/signup">Registrati</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}