'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useOnboarding, useOnboardingApi } from '@/contexts/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Instagram, Music, Youtube, AlertCircle, CheckCircle, ExternalLink, Users, Camera, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getNextStep } from '@/lib/onboarding'

type SocialPlatform = 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK' | 'TWITTER' | 'LINKEDIN' | 'PINTEREST' | 'TWITCH'

interface PlatformConfig {
  id: SocialPlatform
  name: string
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  description: string
  minFollowers: number
}

const platforms: PlatformConfig[] = [
  {
    id: 'INSTAGRAM',
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    description: 'Connect your Instagram account to showcase your visual content',
    minFollowers: 1000
  },
  {
    id: 'TIKTOK',
    name: 'TikTok',
    icon: Music,
    color: 'text-foreground',
    bgColor: 'bg-muted border-border',
    description: 'Link your TikTok for short-form video content collaborations',
    minFollowers: 1000
  },
  {
    id: 'YOUTUBE',
    name: 'YouTube',
    icon: Youtube,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Connect YouTube for long-form video and vlog opportunities',
    minFollowers: 1000
  },
  {
    id: 'FACEBOOK',
    name: 'Facebook',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Connect Facebook for community engagement and reach',
    minFollowers: 1000
  },
  {
    id: 'TWITTER',
    name: 'Twitter/X',
    icon: MessageSquare,
    color: 'text-sky-500',
    bgColor: 'bg-sky-50 border-sky-200',
    description: 'Link your Twitter/X for real-time updates and conversations',
    minFollowers: 1000
  },
  {
    id: 'LINKEDIN',
    name: 'LinkedIn',
    icon: Users,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Connect LinkedIn for professional networking and B2B opportunities',
    minFollowers: 500
  },
  {
    id: 'PINTEREST',
    name: 'Pinterest',
    icon: Camera,
    color: 'text-red-500',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Link Pinterest for visual inspiration and lifestyle content',
    minFollowers: 1000
  },
  {
    id: 'TWITCH',
    name: 'Twitch',
    icon: Music,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'Connect Twitch for live streaming and gaming content',
    minFollowers: 500
  }
]

interface MockConnectionData {
  platform: SocialPlatform
  username: string
  followerCount: string
  platformUserId: string
}

interface SocialMediaConnectProps {
  onComplete?: () => void
}

export default function SocialMediaConnect({ onComplete }: SocialMediaConnectProps) {
  const { update: updateSession } = useSession()
  const { role, completeStep, setStep } = useOnboarding()
  const router = useRouter()

  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStep, setConnectionStep] = useState<'select' | 'mock' | 'connecting' | 'success'>('select')
  const [mockData, setMockData] = useState<MockConnectionData>({
    platform: 'INSTAGRAM',
    username: '',
    followerCount: '',
    platformUserId: ''
  })
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)

  // Fetch existing social connections on mount
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch('/api/onboarding/influencer/social-connections')
        if (response.ok) {
          const data = await response.json()
          setConnectedAccounts(data.connections || [])
        }
      } catch (error) {
        console.error('Failed to fetch social connections:', error)
      } finally {
        setIsLoadingConnections(false)
      }
    }

    fetchConnections()
  }, [])

  const handlePlatformSelect = (platform: SocialPlatform) => {
    setSelectedPlatform(platform)
    setConnectionStep('mock')
    setMockData(prev => ({ ...prev, platform }))
    setError('')
  }

  const handleMockDataSubmit = async () => {
    if (!mockData.username || !mockData.followerCount) {
      setError('Please fill in all fields')
      return
    }

    const followerCount = parseInt(mockData.followerCount)
    if (followerCount < 1000) {
      setError('Minimum 1000 followers required')
      return
    }

    setIsConnecting(true)
    setConnectionStep('connecting')

    try {
      const response = await fetch('/api/onboarding/influencer/connect-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: mockData.platform,
          authCode: 'demo_auth_code',
          mockData: {
            username: mockData.username,
            followerCount: followerCount,
            platformUserId: `${mockData.platform.toLowerCase()}_${Date.now()}`
          }
        })
      })

      const result = await response.json()

      if (response.ok && result.connected) {
        setConnectedAccounts(prev => [...prev, result.profile])
        setConnectionStep('success')
        setMockData({ platform: 'INSTAGRAM', username: '', followerCount: '', platformUserId: '' })
      } else {
        setError(result.error || 'Failed to connect account')
        setConnectionStep('mock')
      }
    } catch (error) {
      setError('Connection failed. Please try again.')
      setConnectionStep('mock')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleContinue = async () => {
    if (connectedAccounts.length === 0) {
      setError('Please connect at least one social media account')
      return
    }

    // Update context
    completeStep('social-connect')
    const nextStep = getNextStep('social-connect', role!)
    setStep(nextStep)

    // Update session after connecting social accounts
    await updateSession()
    
    // Small delay to ensure session is fully updated
    await new Promise(resolve => setTimeout(resolve, 300))

    if (onComplete) {
      onComplete()
    } else {
      // Simple client-side navigation - the database was already updated
      // when the social connection was created, so just navigate
      router.push(`/onboarding/${nextStep}`)
    }
  }

  const resetToSelect = () => {
    setConnectionStep('select')
    setSelectedPlatform(null)
    setError('')
  }

  const renderSelectPlatform = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mb-4">
          <Instagram className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          Connect Your Social Media
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Connect at least one social media account to start collaborating with hosts. 
          You need a minimum of 1,000 followers on each platform.
        </p>
      </div>

      <div className="grid gap-4">
        {platforms.map((platform) => {
          const Icon = platform.icon
          const isConnected = connectedAccounts.some(acc => acc.platform === platform.id)
          
          return (
            <Card
              key={platform.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isConnected
                  ? 'ring-2 ring-nomadiqe-success border-nomadiqe-success bg-nomadiqe-success/10'
                  : 'border-border hover:border-border/80'
              }`}
              onClick={() => !isConnected && handlePlatformSelect(platform.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    isConnected ? 'bg-nomadiqe-success/10' : platform.bgColor
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      isConnected ? 'text-nomadiqe-success' : platform.color
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-foreground">{platform.name}</h4>
                      {isConnected && (
                        <CheckCircle className="h-5 w-5 text-nomadiqe-success" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{platform.description}</p>
                    {isConnected && (
                      <p className="text-sm text-nomadiqe-success mt-1">
                        Connected as @{connectedAccounts.find(acc => acc.platform === platform.id)?.username}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Min. {platform.minFollowers.toLocaleString()} followers</p>
                    {!isConnected && (
                      <Button size="sm" className="mt-2">
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => router.push('/onboarding/role-selection')}
          disabled={isConnecting}
        >
          Back to Role Selection
        </Button>

        {connectedAccounts.length > 0 && (
          <Button onClick={handleContinue} className="px-8">
            Continue to Media Kit
          </Button>
        )}
      </div>
    </div>
  )

  const renderMockConnection = () => {
    const platform = platforms.find(p => p.id === selectedPlatform)!
    const Icon = platform.icon

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${platform.bgColor}`}>
            <Icon className={`h-8 w-8 ${platform.color}`} />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Connect {platform.name}
          </h3>
          <p className="text-muted-foreground">
            Enter your {platform.name} details for this demo
          </p>
        </div>

        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-primary">
              <strong>Demo Mode:</strong> In the full version, you would be redirected to {platform.name} 
              to authorize the connection. For this demo, please enter your account details manually.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Username *</label>
            <Input
              value={mockData.username}
              onChange={(e) => setMockData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="your_username"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Follower Count *</label>
            <Input
              type="number"
              value={mockData.followerCount}
              onChange={(e) => setMockData(prev => ({ ...prev, followerCount: e.target.value }))}
              placeholder="10000"
              className="mt-1"
              min="1000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 1,000 followers required
            </p>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-700 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={resetToSelect}>
            Back to Platforms
          </Button>
          <Button onClick={handleMockDataSubmit} disabled={isConnecting}>
            Connect Account
          </Button>
        </div>
      </div>
    )
  }

  const renderConnecting = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Connecting Your Account
        </h3>
        <p className="text-muted-foreground">
          Please wait while we connect your {selectedPlatform?.toLowerCase()} account...
        </p>
      </div>
    </div>
  )

  const renderSuccess = () => {
    const platform = platforms.find(p => p.id === selectedPlatform)!
    const Icon = platform.icon
    const connectedAccount = connectedAccounts[connectedAccounts.length - 1]

    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-nomadiqe-success/10 rounded-full">
          <CheckCircle className="h-8 w-8 text-nomadiqe-success" />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Successfully Connected!
          </h3>
          <p className="text-muted-foreground">
            Your {platform.name} account has been connected to Nomadiqe.
          </p>
        </div>

        <Card className="bg-nomadiqe-success/10 border-nomadiqe-success/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-4">
              <Icon className={`h-8 w-8 ${platform.color}`} />
              <div className="text-left">
                <p className="font-medium text-foreground">@{connectedAccount.username}</p>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {connectedAccount.followerCount.toLocaleString()} followers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button onClick={resetToSelect} variant="outline" className="w-full">
            Connect Another Platform
          </Button>
          <Button onClick={handleContinue} className="w-full">
            Continue to Media Kit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {connectionStep === 'select' && renderSelectPlatform()}
      {connectionStep === 'mock' && renderMockConnection()}
      {connectionStep === 'connecting' && renderConnecting()}
      {connectionStep === 'success' && renderSuccess()}

      {/* Connected Accounts Summary */}
      {connectedAccounts.length > 0 && connectionStep === 'select' && (
        <Card className="mt-6 bg-muted border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Connected Accounts ({connectedAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {connectedAccounts.map((account, index) => {
                const platform = platforms.find(p => p.id === account.platform)!
                const Icon = platform.icon
                
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${platform.color}`} />
                    <span className="text-sm font-medium">@{account.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {account.followerCount.toLocaleString()} followers
                    </span>
                    <CheckCircle className="h-4 w-4 text-nomadiqe-success ml-auto" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && connectionStep === 'select' && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-700 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="mt-6 bg-purple-50 border-purple-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
            <ExternalLink className="h-4 w-4 mr-2" />
            Social Media Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm text-purple-700 space-y-1">
            <p>• Ensure your profiles are public and professional</p>
            <p>• High-quality content increases collaboration opportunities</p>
            <p>• Regular posting shows you&#39;re an active creator</p>
            <p>• Authentic engagement matters more than follower count</p>
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
