import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function NutritionSubnav() {
  const { t } = useTranslation()
  return <nav className="nutrition-subnav" aria-label={t('nav.nutrition')}><NavLink to="/app/nutrition/foods" className={({ isActive }) => isActive ? 'active' : ''}>{t('nutrition.foods')}</NavLink><NavLink to="/app/nutrition/recipes" className={({ isActive }) => isActive ? 'active' : ''}>{t('nutrition.recipes')}</NavLink><NavLink to="/app/nutrition/log" className={({ isActive }) => isActive ? 'active' : ''}>{t('nutrition.foodLog')}</NavLink><NavLink to="/app/nutrition/planner" className={({ isActive }) => isActive ? 'active' : ''}>{t('nutrition.planner')}</NavLink><NavLink to="/app/nutrition/grocery" className={({ isActive }) => isActive ? 'active' : ''}>{t('nutrition.grocery')}</NavLink><NavLink to="/app/nutrition/insights" className={({ isActive }) => isActive ? 'active' : ''}>{t('nutrition.insights')}</NavLink></nav>
}
