'use client'
import { useState } from 'react'
import { canUseFeature, type Feature, type PlanType } from '@/lib/stripe'

export function useFeatureAccess(userPlan: PlanType, feature: Feature) {
  const [showModal, setShowModal] = useState(false)
  
  const canUse = canUseFeature(userPlan, feature)
  
  const checkAndExecute = (action: () => void | Promise<void>) => {
    if (canUse) {
      action()
    } else {
      setShowModal(true)
    }
  }
  
  return {
    canUse,
    showModal,
    setShowModal,
    checkAndExecute
  }
}
