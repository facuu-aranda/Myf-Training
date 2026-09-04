import { describe, expect, it } from 'vitest'
import { validateCustomFoodInput } from '../src/lib/custom-food'
import type { CreateCustomFoodInput } from '../src/types'

const validFood: CreateCustomFoodInput = {
  name: 'Homemade pizza',
  servingSize: 100,
  servingUnit: 'g',
  calories: 240,
  protein: 10,
  carbs: 28,
  fat: 9,
  fiber: null,
}

describe('custom food validation', () => {
  it('accepts a valid custom food while preserving optional null values', () => {
    expect(validateCustomFoodInput(validFood)).toBeNull()
  })

  it('rejects missing names and non-positive serving sizes', () => {
    expect(validateCustomFoodInput({ ...validFood, name: '  ' })).toBe('name_required')
    expect(validateCustomFoodInput({ ...validFood, servingSize: 0 })).toBe('serving_size_invalid')
  })

  it('rejects negative calories and optional nutrients', () => {
    expect(validateCustomFoodInput({ ...validFood, calories: -1 })).toBe('calories_invalid')
    expect(validateCustomFoodInput({ ...validFood, protein: -1 })).toBe('nutrient_invalid')
  })
})
