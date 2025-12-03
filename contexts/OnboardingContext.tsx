'use client'

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import { UserRole, OnboardingProgress } from '@/lib/onboarding'

interface OnboardingState {
  currentStep: string
  completedSteps: string[]
  role?: UserRole
  formData: Record<string, any>
  isLoading: boolean
  error?: string
  progress?: OnboardingProgress
}

interface OnboardingActions {
  setStep: (step: string) => void
  completeStep: (step: string) => void
  setRole: (role: UserRole) => void
  updateFormData: (data: Record<string, any>) => void
  setLoading: (loading: boolean) => void
  setError: (error?: string) => void
  setProgress: (progress: OnboardingProgress) => void
  reset: () => void
}

type OnboardingAction = 
  | { type: 'SET_STEP'; payload: string }
  | { type: 'COMPLETE_STEP'; payload: string }
  | { type: 'SET_ROLE'; payload: UserRole }
  | { type: 'UPDATE_FORM_DATA'; payload: Record<string, any> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload?: string }
  | { type: 'SET_PROGRESS'; payload: OnboardingProgress }
  | { type: 'RESET' }

const initialState: OnboardingState = {
  currentStep: 'profile-setup',
  completedSteps: [],
  formData: {},
  isLoading: false
}

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    
    case 'COMPLETE_STEP':
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.payload)
          ? state.completedSteps
          : [...state.completedSteps, action.payload]
      }
    
    case 'SET_ROLE':
      return { ...state, role: action.payload }
    
    case 'UPDATE_FORM_DATA':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload }
      }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'SET_PROGRESS':
      return {
        ...state,
        currentStep: action.payload.currentStep,
        completedSteps: action.payload.completedSteps,
        role: action.payload.role,
        progress: action.payload
      }
    
    case 'RESET':
      return initialState
    
    default:
      return state
  }
}

const OnboardingContext = createContext<(OnboardingState & OnboardingActions) | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState)

  const actions: OnboardingActions = {
    setStep: (step: string) => dispatch({ type: 'SET_STEP', payload: step }),
    completeStep: (step: string) => dispatch({ type: 'COMPLETE_STEP', payload: step }),
    setRole: (role: UserRole) => dispatch({ type: 'SET_ROLE', payload: role }),
    updateFormData: (data: Record<string, any>) => dispatch({ type: 'UPDATE_FORM_DATA', payload: data }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error?: string) => dispatch({ type: 'SET_ERROR', payload: error }),
    setProgress: (progress: OnboardingProgress) => dispatch({ type: 'SET_PROGRESS', payload: progress }),
    reset: () => dispatch({ type: 'RESET' })
  }

  return (
    <OnboardingContext.Provider value={{ ...state, ...actions }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

// Custom hooks for onboarding API calls
export function useOnboardingApi() {
  const { setLoading, setError, setProgress } = useOnboarding()

  const updateProfile = useCallback(async (data: { fullName: string; username: string; profilePicture?: string }) => {
    setLoading(true)
    setError(undefined)
    
    try {
      const response = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  const selectRole = useCallback(async (role: UserRole) => {
    setLoading(true)
    setError(undefined)
    
    try {
      const response = await fetch('/api/onboarding/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to select role')
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select role'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  const fetchProgress = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    
    try {
      const response = await fetch('/api/onboarding/progress')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch progress')
      }
      
      // Debug log to see what role we're getting
      console.log('Fetched progress with role:', result.role)
      
      setProgress(result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch progress'
      console.error('Progress fetch error:', error)
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, setProgress])

  const submitGuestInterests = useCallback(async (interests: string[]) => {
    setLoading(true)
    setError(undefined)
    
    try {
      const response = await fetch('/api/onboarding/guest/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save interests')
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save interests'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  const verifyIdentity = useCallback(async (data: { documentType?: string; documentNumber?: string; skipVerification?: boolean }) => {
    setLoading(true)
    setError(undefined)
    
    // Use unified endpoint that accepts all roles
    const endpoint = '/api/onboarding/verify-identity'
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify identity')
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify identity'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  return {
    updateProfile,
    selectRole,
    fetchProgress,
    submitGuestInterests,
    verifyIdentity
  }
}
