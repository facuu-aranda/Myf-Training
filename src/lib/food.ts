import type { Food } from '../types'

export function localizedFoodName(food: Food, language: 'en' | 'es') {
  return language === 'es' ? food.nameEs || food.name : food.nameEn || food.name
}

export function localizedFoodCategory(food: Food, language: 'en' | 'es') {
  return language === 'es' ? food.categoryEs || food.category : food.categoryEn || food.category
}

export function localizedFoodSubcategory(food: Food, language: 'en' | 'es') {
  return language === 'es' ? food.subcategoryEs || food.subcategory : food.subcategoryEn || food.subcategory
}
