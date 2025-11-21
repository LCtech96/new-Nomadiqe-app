'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function DebugCheckPage() {
  // Disable debug page in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      window.location.href = '/'
    }
  }, [])
  
  if (process.env.NODE_ENV === 'production') {
    return null
  }
  const { data: session, status: sessionStatus } = useSession()
  const [checks, setChecks] = useState<Record<string, { status: 'checking' | 'success' | 'error', message: string }>>({})
  const [isRunning, setIsRunning] = useState(false)

  const runChecks = async () => {
    setIsRunning(true)
    const newChecks: Record<string, { status: 'checking' | 'success' | 'error', message: string }> = {}

    // Check 1: Session
    newChecks.session = { status: 'checking', message: 'Checking session...' }
    setChecks({ ...newChecks })
    if (sessionStatus === 'loading') {
      newChecks.session = { status: 'checking', message: 'Session is loading...' }
    } else if (sessionStatus === 'authenticated' && session) {
      newChecks.session = { 
        status: 'success', 
        message: `Authenticated as ${session.user?.email || 'Unknown'} (ID: ${session.user?.id || 'N/A'})` 
      }
    } else {
      newChecks.session = { status: 'error', message: 'No active session found' }
    }
    setChecks({ ...newChecks })

    // Check 2: Environment Variables (client-side only)
    newChecks.env = { status: 'checking', message: 'Checking environment variables...' }
    setChecks({ ...newChecks })
    const hasGoogleClientId = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const hasFacebookClientId = !!process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID
    const hasAppleId = !!process.env.NEXT_PUBLIC_APPLE_ID
    if (hasGoogleClientId || hasFacebookClientId || hasAppleId) {
      newChecks.env = { 
        status: 'success', 
        message: `OAuth configured: Google=${hasGoogleClientId ? 'Yes' : 'No'}, Facebook=${hasFacebookClientId ? 'Yes' : 'No'}, Apple=${hasAppleId ? 'Yes' : 'No'}` 
      }
    } else {
      newChecks.env = { status: 'error', message: 'No OAuth client IDs found (NEXT_PUBLIC_GOOGLE_CLIENT_ID, etc.)' }
    }
    setChecks({ ...newChecks })

    // Check 3: API Progress Endpoint
    newChecks.progress = { status: 'checking', message: 'Testing /api/onboarding/progress...' }
    setChecks({ ...newChecks })
    try {
      const response = await fetch('/api/onboarding/progress')
      const data = await response.json()
      if (response.ok) {
        newChecks.progress = { 
          status: 'success', 
          message: `Progress API works! Role: ${data.role || 'N/A'}, Step: ${data.currentStep || 'N/A'}, Status: ${data.onboardingStatus || 'N/A'}` 
        }
      } else {
        newChecks.progress = { status: 'error', message: `API Error: ${data.error || 'Unknown error'}` }
      }
    } catch (error) {
      newChecks.progress = { status: 'error', message: `Failed to call API: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
    setChecks({ ...newChecks })

    // Check 4: Database Connection (via API)
    newChecks.database = { status: 'checking', message: 'Testing database connection...' }
    setChecks({ ...newChecks })
    try {
      const response = await fetch('/api/debug/session')
      if (response.ok) {
        const data = await response.json()
        newChecks.database = { status: 'success', message: `Database connected! User found: ${data.user ? 'Yes' : 'No'}` }
      } else {
        newChecks.database = { status: 'error', message: 'Database connection test failed' }
      }
    } catch (error) {
      newChecks.database = { status: 'error', message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
    setChecks({ ...newChecks })

    // Check 5: NextAuth Configuration
    newChecks.nextauth = { status: 'checking', message: 'Checking NextAuth configuration...' }
    setChecks({ ...newChecks })
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          newChecks.nextauth = { 
            status: 'success', 
            message: `NextAuth working! User: ${data.user.email || 'N/A'}, Role: ${data.user.role || 'N/A'}` 
          }
        } else {
          newChecks.nextauth = { status: 'error', message: 'NextAuth session endpoint returned no user' }
        }
      } else {
        newChecks.nextauth = { status: 'error', message: 'NextAuth session endpoint failed' }
      }
    } catch (error) {
      newChecks.nextauth = { status: 'error', message: `NextAuth check failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
    setChecks({ ...newChecks })

    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'checking':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">System Diagnostics</h1>
          <p className="text-muted-foreground">Check all system components and configurations</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>Current authentication state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Status:</strong> {sessionStatus}</p>
              {session?.user && (
                <>
                  <p><strong>Email:</strong> {session.user.email}</p>
                  <p><strong>ID:</strong> {session.user.id}</p>
                  <p><strong>Role:</strong> {session.user.role || 'N/A'}</p>
                  <p><strong>Onboarding Status:</strong> {session.user.onboardingStatus || 'N/A'}</p>
                  <p><strong>Onboarding Step:</strong> {session.user.onboardingStep || 'N/A'}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Checks</CardTitle>
            <CardDescription>Run diagnostics to verify all components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runChecks} disabled={isRunning} className="w-full">
              {isRunning ? 'Running Checks...' : 'Run All Checks'}
            </Button>

            <div className="space-y-3 mt-4">
              {Object.entries(checks).map(([key, check]) => (
                <div key={key} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <p className="font-semibold capitalize">{key}</p>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Checks You Can Do</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Check Browser Console</h3>
              <p className="text-sm text-muted-foreground">
                Open browser DevTools (F12) and check the Console tab for any errors. Look for:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Failed API calls</li>
                  <li>Network errors</li>
                  <li>Authentication errors</li>
                </ul>
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">2. Check Vercel Environment Variables</h3>
              <p className="text-sm text-muted-foreground">
                Go to Vercel Dashboard → Your Project → Settings → Environment Variables
                <br />
                Verify these are set:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><code>DATABASE_URL</code> - Your PostgreSQL connection string</li>
                  <li><code>NEXTAUTH_SECRET</code> - NextAuth secret key</li>
                  <li><code>NEXTAUTH_URL</code> - Your production URL</li>
                  <li><code>GOOGLE_CLIENT_ID</code> (optional)</li>
                  <li><code>GOOGLE_CLIENT_SECRET</code> (optional)</li>
                  <li><code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> (optional, for client-side)</li>
                </ul>
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">3. Check Database Connection</h3>
              <p className="text-sm text-muted-foreground">
                Verify your <code>DATABASE_URL</code> is correct and the database is accessible.
                <br />
                If using Supabase or Neon, check their dashboard to ensure the database is running.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">4. Check Network Tab</h3>
              <p className="text-sm text-muted-foreground">
                In browser DevTools → Network tab, check if:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><code>/api/onboarding/progress</code> returns 200 OK</li>
                  <li><code>/api/auth/session</code> returns valid session data</li>
                  <li>No CORS errors or 401/403 responses</li>
                </ul>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

