import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get file from FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const uniqueFilename = `${session.user.id}/${randomUUID()}.${fileExtension}`

    console.log('[UPLOAD] Uploading file to Supabase Storage:', {
      filename: uniqueFilename,
      size: file.size,
      type: file.type,
      userId: session.user.id,
    })

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(uniqueFilename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('[UPLOAD] Supabase Storage error:', error)
      
      // If bucket doesn't exist, try to create it
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found') || error.statusCode === '404') {
        console.log('[UPLOAD] Bucket not found, attempting to create it...')
        
        // Try to create the bucket
        const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 10485760, // 10MB
        })
        
        if (bucketError) {
          console.error('[UPLOAD] Failed to create bucket:', bucketError)
          return NextResponse.json(
            { 
              error: `Storage bucket '${STORAGE_BUCKET}' not found and could not be created. Please create it manually in Supabase Dashboard → Storage. Error: ${bucketError.message}`,
              code: 'BUCKET_NOT_FOUND',
              details: bucketError.message
            },
            { status: 500 }
          )
        }
        
        console.log('[UPLOAD] Bucket created successfully, retrying upload...')
        
        // Retry upload after creating bucket
        const { data: retryData, error: retryError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(uniqueFilename, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          })
        
        if (retryError) {
          return NextResponse.json(
            { 
              error: retryError.message || 'Upload failed after creating bucket',
              code: 'UPLOAD_ERROR',
              details: retryError
            },
            { status: 400 }
          )
        }
        
        // Get public URL for retry
        const { data: retryUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(uniqueFilename)
        
        return NextResponse.json({
          url: retryUrlData.publicUrl,
          path: retryData.path,
          size: file.size,
          contentType: file.type,
        })
      }
      
      return NextResponse.json(
        { 
          error: error.message || 'Upload failed',
          code: 'UPLOAD_ERROR',
          details: error
        },
        { status: 400 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(uniqueFilename)

    const publicUrl = urlData.publicUrl

    console.log('[UPLOAD] Upload successful:', {
      path: data.path,
      url: publicUrl,
      size: file.size,
    })

    return NextResponse.json({
      url: publicUrl,
      path: data.path,
      size: file.size,
      contentType: file.type,
    })
  } catch (error: any) {
    console.error('[UPLOAD] Error:', error)
    console.error('[UPLOAD] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Upload failed'
    let statusCode = 400
    
    // Check if it's a Supabase configuration error
    if (error.message?.includes('Supabase') || error.message?.includes('SUPABASE')) {
      errorMessage = 'Supabase Storage is not configured correctly. Please check your SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local'
      statusCode = 500
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: error.code || 'UPLOAD_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: statusCode }
    )
  }
}
