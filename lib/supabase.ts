import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and key from environment variables
// These can be extracted from DATABASE_URL or set separately
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''

// Extract Supabase URL from DATABASE_URL if not set directly
// DATABASE_URL format examples:
// - postgresql://postgres.xxxxx:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
// - postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
// Supabase URL format: https://xxxxx.supabase.co
let extractedUrl = supabaseUrl
if (!extractedUrl && process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL
  // Try different patterns to extract project ID
  let projectId: string | null = null
  
  // Pattern 1: postgres.xxxxx.supabase.com or db.xxxxx.supabase.co
  const match1 = dbUrl.match(/(?:postgres|db)\.([^.]+)\.supabase\.(?:com|co)/)
  if (match1) {
    projectId = match1[1]
  }
  
  // Pattern 2: aws-0-eu-central-1.pooler.supabase.com (extract from connection pooler)
  if (!projectId) {
    const match2 = dbUrl.match(/@([^.]+)\.pooler\.supabase\.com/)
    if (match2) {
      projectId = match2[1]
    }
  }
  
  if (projectId) {
    extractedUrl = `https://${projectId}.supabase.co`
    console.log('[SUPABASE] Extracted URL from DATABASE_URL:', extractedUrl)
  }
}

if (!extractedUrl) {
  console.warn('[SUPABASE] Supabase URL not configured. Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in your .env.local')
}

if (!supabaseServiceKey) {
  console.warn('[SUPABASE] Supabase service key not configured. Please set SUPABASE_SERVICE_ROLE_KEY in your .env.local')
}

// Create Supabase client for server-side operations
export const supabase = createClient(extractedUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Storage bucket name for user uploads
export const STORAGE_BUCKET = 'user-uploads'

