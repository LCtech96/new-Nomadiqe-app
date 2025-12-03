// Onboarding flow configuration and utilities
// Flow: Welcome → Role Selection → Profile Setup → Role-Specific Steps → Complete
// Role-Specific Steps:
//   - Traveler: Interest selection
//   - Host: Identity verification → Property listing → Collaboration setup
//   - Influencer: Identity verification → Social connect → Media kit
export const ONBOARDING_STEPS = {
  common: ['welcome', 'role-selection', 'profile-setup'],
  TRAVELER: ['interest-selection'],
  HOST: ['listing-creation', 'collaboration-setup'],
  INFLUENCER: ['social-connect', 'media-kit-setup']
} as const

export type UserRole = 'TRAVELER' | 'HOST' | 'INFLUENCER'
export type OnboardingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export interface OnboardingProgress {
  currentStep: string
  completedSteps: string[]
  role?: UserRole
  onboardingStatus: OnboardingStatus
  metadata?: Record<string, any>
  startedAt?: Date
  completedAt?: Date
}

export const getNextStep = (currentStep: string, role: UserRole): string => {
  // Validate role before accessing ONBOARDING_STEPS
  if (!role || !ONBOARDING_STEPS[role]) {
    return 'role-selection'
  }

  const allSteps: string[] = [...ONBOARDING_STEPS.common, ...ONBOARDING_STEPS[role]]
  const currentIndex = allSteps.indexOf(currentStep)

  if (currentIndex === -1) {
    // If current step not found, return first step
    return allSteps[0] || 'role-selection'
  }

  const nextStep = allSteps[currentIndex + 1]
  return nextStep || 'complete'
}

export const getPreviousStep = (currentStep: string, role: UserRole): string => {
  // Validate role before accessing ONBOARDING_STEPS
  if (!role || !ONBOARDING_STEPS[role]) {
    return 'role-selection'
  }

  const allSteps: string[] = [...ONBOARDING_STEPS.common, ...ONBOARDING_STEPS[role]]
  const currentIndex = allSteps.indexOf(currentStep)

  if (currentIndex <= 0) {
    return allSteps[0] || 'role-selection'
  }

  return allSteps[currentIndex - 1]
}

export const getStepProgress = (currentStep: string, completedSteps: string[], role: UserRole): number => {
  // Validate role before accessing ONBOARDING_STEPS
  if (!role || !ONBOARDING_STEPS[role]) {
    return 0
  }
  
  const allSteps: string[] = [...ONBOARDING_STEPS.common, ...ONBOARDING_STEPS[role]]
  const totalSteps = allSteps.length
  const completed = completedSteps.filter(step => allSteps.includes(step)).length
  
  return Math.round((completed / totalSteps) * 100)
}

export const isStepCompleted = (step: string, completedSteps: string[]): boolean => {
  return completedSteps.includes(step)
}

export const getStepTitle = (step: string): string => {
  const titles: Record<string, string> = {
    'welcome': 'Welcome to Nomadiqe',
    'profile-setup': 'Profile Setup',
    'role-selection': 'Choose Your Role',
    'interest-selection': 'Travel Interests',
    'identity-verification': 'Identity Verification',
    'listing-creation': 'Create Your Listing',
    'collaboration-setup': 'Collaboration Preferences',
    'social-connect': 'Connect Social Media',
    'media-kit-setup': 'Setup Your Media Kit',
    'complete': 'Welcome to Nomadiqe!'
  }
  
  return titles[step] || 'Onboarding Step'
}

export const getStepDescription = (step: string): string => {
  const descriptions: Record<string, string> = {
    'welcome': 'Let\'s get you started on your Nomadiqe journey',
    'profile-setup': 'Tell us about yourself to get started',
    'role-selection': 'Select how you plan to use Nomadiqe',
    'interest-selection': 'Help us personalize your experience',
    'identity-verification': 'Verify your identity for security',
    'listing-creation': 'Create your first property listing',
    'collaboration-setup': 'Set your collaboration preferences',
    'social-connect': 'Connect your social media accounts',
    'media-kit-setup': 'Complete your influencer profile and media kit',
    'complete': 'You\'re all set to start using Nomadiqe!'
  }
  
  return descriptions[step] || 'Complete this step to continue'
}

export const TRAVEL_INTERESTS = [
  'Adventure',
  'Beach',
  'City Breaks',
  'Culture',
  'Food & Drink',
  'History',
  'Luxury',
  'Nature',
  'Nightlife',
  'Photography',
  'Relaxation',
  'Romance',
  'Shopping',
  'Sports',
  'Wellness'
]

export const CONTENT_NICHES = [
  'travel',
  'lifestyle',
  'food',
  'fashion',
  'photography',
  'adventure',
  'luxury',
  'budget',
  'family',
  'couple',
  'solo',
  'business',
  'wellness',
  'culture',
  'nature',
  'tech',
  'fitness',
  'beauty',
  'art'
]

export const PROPERTY_AMENITIES = {
  wifi: 'Wi-Fi',
  airConditioning: 'Air Conditioning',
  heating: 'Heating',
  tv: 'TV / Smart TV',
  kitchen: 'Equipped Kitchen',
  washingMachine: 'Washing Machine',
  dryer: 'Dryer',
  refrigerator: 'Refrigerator / Freezer',
  dishwasher: 'Dishwasher',
  coffeeMachine: 'Coffee Machine / Kettle',
  balcony: 'Balcony / Terrace',
  seaView: 'Sea View / Panoramic View',
  pool: 'Private or Shared Pool',
  jacuzzi: 'Jacuzzi / Sauna',
  gym: 'Gym',
  fireplace: 'Fireplace',
  workspace: 'Desk / Dedicated Workspace',
  towels: 'Towels and Bed Linen',
  shampoo: 'Shampoo / Soaps',
  toiletPaper: 'Toilet Paper',
  hairDryer: 'Hair Dryer',
  iron: 'Iron',
  crib: 'Crib / Baby Cot',
  highChair: 'High Chair',
  toys: 'Toys / Books for Children',
  elevator: 'Elevator',
  wheelchairAccessible: 'Wheelchair Accessible',
  parking: 'Reserved Parking',
  privateEntrance: 'Private Entrance',
  smokeDetector: 'Smoke Detector',
  carbonMonoxide: 'Carbon Monoxide Detector',
  fireExtinguisher: 'Fire Extinguisher',
  firstAidKit: 'First Aid Kit',
  securityCameras: 'Security Cameras'
}

// Error codes from our technical plan
export enum OnboardingErrorCodes {
  USERNAME_TAKEN = 'ONBOARDING_001',
  INVALID_USERNAME = 'ONBOARDING_002',
  VERIFICATION_FAILED = 'ONBOARDING_003',
  SOCIAL_CONNECTION_FAILED = 'ONBOARDING_004',
  FILE_UPLOAD_FAILED = 'ONBOARDING_005',
  INVALID_ROLE = 'ONBOARDING_006',
  SESSION_EXPIRED = 'ONBOARDING_007'
}
