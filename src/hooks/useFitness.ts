import { useContext } from 'react'
import { FitnessContext } from '../contexts/FitnessContext'

export function useFitness() {
  const context = useContext(FitnessContext)
  if (!context) throw new Error('useFitness must be used within FitnessProvider')
  return context
}
