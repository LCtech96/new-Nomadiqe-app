"use client"

import { useEffect, useRef } from 'react'

interface GlassParallaxProps {
  children: React.ReactNode
  className?: string
  intensity?: number
}

/**
 * Glass Parallax Component
 * Adds parallax effect to background based on mouse movement
 * Similar to the CodePen "Liquid Glass" effect
 */
export function GlassParallax({ 
  children, 
  className = '',
  intensity = 10 
}: GlassParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const xPercent = (e.clientX / window.innerWidth - 0.5) * intensity
      const yPercent = (e.clientY / window.innerHeight - 0.5) * intensity

      const backgroundElement = containerRef.current.querySelector('.glass-parallax-bg') as HTMLElement
      if (backgroundElement) {
        backgroundElement.style.backgroundPosition = `calc(50% + ${xPercent}px) calc(50% + ${yPercent}px)`
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [intensity])

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

