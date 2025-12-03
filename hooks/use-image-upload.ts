import { useState, useCallback } from 'react'
import { 
  validateImageFiles, 
  generateUniqueFilename, 
  compressImage,
  createImagePreview,
  type ImageUploadOptions,
  DEFAULT_UPLOAD_OPTIONS 
} from '@/lib/image-upload'
import { useToast } from '@/hooks/use-toast'

export interface UploadedImage {
  id: string
  url: string
  file: File
  preview: string
  size: number
  width?: number
  height?: number
}

export interface UploadProgress {
  fileIndex: number
  fileName: string
  percentage: number
}

export interface UseImageUploadOptions extends ImageUploadOptions {
  onUploadComplete?: (images: UploadedImage[]) => void
  onUploadError?: (error: string) => void
  autoCompress?: boolean
}

export interface UseImageUploadReturn {
  images: UploadedImage[]
  isUploading: boolean
  uploadProgress: UploadProgress | null
  uploadImages: (files: File[]) => Promise<void>
  removeImage: (id: string) => void
  clearImages: () => void
  replaceImage: (id: string, file: File) => Promise<void>
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const { toast } = useToast()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)

  const {
    onUploadComplete,
    onUploadError,
    autoCompress = true,
    ...uploadOptions
  } = { ...DEFAULT_UPLOAD_OPTIONS, ...options }

  const uploadImages = useCallback(async (files: File[]) => {
    try {
      setIsUploading(true)
      setUploadProgress(null)

      // Validate files
      const validation = validateImageFiles(files, uploadOptions)
      
      if (!validation.valid) {
        const errorMessage = validation.errors.join('\n')
        onUploadError?.(errorMessage)
        toast({
          title: 'Upload Error',
          description: errorMessage,
          variant: 'destructive',
        })
        return
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        toast({
          title: 'Upload Warning',
          description: validation.warnings.join('\n'),
          variant: 'default',
        })
      }

      const uploadedImages: UploadedImage[] = []

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        setUploadProgress({
          fileIndex: i,
          fileName: file.name,
          percentage: 0,
        })

        try {
          // Compress image if enabled
          let fileToUpload = file
          if (autoCompress && file.type.startsWith('image/') && file.size > 500 * 1024) {
            try {
              fileToUpload = await compressImage(file, uploadOptions.compressionQuality)
            } catch (compressionError) {
              console.warn('Image compression failed, using original file:', compressionError)
            }
          }

          // Generate unique filename
          const uniqueFilename = generateUniqueFilename(fileToUpload.name)

          // Create preview
          const preview = await createImagePreview(fileToUpload)

          // Upload to Supabase Storage via API
          const formData = new FormData()
          formData.append('file', fileToUpload)

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}))
            throw new Error(errorData.error || `Upload failed with status ${uploadResponse.status}`)
          }

          const uploadData = await uploadResponse.json()

          const uploadedImage: UploadedImage = {
            id: Math.random().toString(36).substring(2),
            url: uploadData.url,
            file: fileToUpload,
            preview,
            size: fileToUpload.size,
          }

          uploadedImages.push(uploadedImage)

        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error)
          
          // Provide more helpful error messages
          let errorMessage = `Failed to upload ${file.name}: ${error.message || 'Unknown error'}`
          
          // Check if it's a Supabase configuration error
          if (error.message?.includes('Bucket not found') || error.message?.includes('BUCKET_NOT_FOUND')) {
            errorMessage = `Storage bucket not found. The bucket will be created automatically, but if this error persists, please create it manually in Supabase Dashboard → Storage.`
          } else if (error.message?.includes('Supabase') || error.message?.includes('SUPABASE')) {
            errorMessage = `Upload configuration error: Supabase Storage is not configured correctly. Please check your SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local`
          }
          
          onUploadError?.(errorMessage)
          toast({
            title: 'Upload Error',
            description: errorMessage,
            variant: 'destructive',
            duration: 10000, // Show for 10 seconds so user can read it
          })
        }
      }

      // Update images state
      setImages(prev => [...prev, ...uploadedImages])

      // Call completion callback
      onUploadComplete?.(uploadedImages)

      // Success toast
      if (uploadedImages.length > 0) {
        toast({
          title: 'Upload Complete',
          description: `Successfully uploaded ${uploadedImages.length} image${uploadedImages.length === 1 ? '' : 's'}`,
        })
      }

    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMessage = error.message || 'Upload failed'
      
      onUploadError?.(errorMessage)
      toast({
        title: 'Upload Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }, [uploadOptions, autoCompress, onUploadComplete, onUploadError, toast])

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image) {
        // Revoke preview URL to prevent memory leaks
        URL.revokeObjectURL(image.preview)
      }
      return prev.filter(img => img.id !== id)
    })
  }, [])

  const clearImages = useCallback(() => {
    // Revoke all preview URLs
    images.forEach(image => {
      URL.revokeObjectURL(image.preview)
    })
    setImages([])
  }, [images])

  const replaceImage = useCallback(async (id: string, file: File) => {
    const existingImageIndex = images.findIndex(img => img.id === id)
    if (existingImageIndex === -1) return

    await uploadImages([file])
    removeImage(id)
  }, [images, uploadImages, removeImage])

  return {
    images,
    isUploading,
    uploadProgress,
    uploadImages,
    removeImage,
    clearImages,
    replaceImage,
  }
}

