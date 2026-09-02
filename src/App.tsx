import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from './contexts/AuthContext'
import { AppShell } from './layouts/AppShell'

const CouplePage = lazy(async () => ({ default: (await import('./pages/CouplePage')).CouplePage }))
const DashboardPage = lazy(async () => ({ default: (await import('./pages/DashboardPage')).DashboardPage }))
const ExerciseLibraryPage = lazy(async () => ({ default: (await import('./pages/ExerciseLibraryPage')).ExerciseLibraryPage }))
const FoodLibraryPage = lazy(async () => ({ default: (await import('./pages/FoodLibraryPage')).FoodLibraryPage }))
const RecipesPage = lazy(async () => ({ default: (await import('./pages/RecipesPage')).RecipesPage }))
const FoodLogPage = lazy(async () => ({ default: (await import('./pages/FoodLogPage')).FoodLogPage }))
const MealPlannerPage = lazy(async () => ({ default: (await import('./pages/MealPlannerPage')).MealPlannerPage }))
const GroceryPage = lazy(async () => ({ default: (await import('./pages/GroceryPage')).GroceryPage }))
const NutritionInsightsPage = lazy(async () => ({ default: (await import('./pages/NutritionInsightsPage')).NutritionInsightsPage }))
const HistoryPage = lazy(async () => ({ default: (await import('./pages/HistoryPage')).HistoryPage }))
const LandingPage = lazy(async () => ({ default: (await import('./pages/LandingPage')).LandingPage }))
const LiveTrainingPage = lazy(async () => ({ default: (await import('./pages/LiveTrainingPage')).LiveTrainingPage }))
const LoginPage = lazy(async () => ({ default: (await import('./pages/LoginPage')).LoginPage }))
const ManualTrainingPage = lazy(async () => ({ default: (await import('./pages/ManualTrainingPage')).ManualTrainingPage }))
const QuickLogPage = lazy(async () => ({ default: (await import('./pages/QuickLogPage')).QuickLogPage }))
const ProfilePage = lazy(async () => ({ default: (await import('./pages/ProfilePage')).ProfilePage }))
const ProgressPage = lazy(async () => ({ default: (await import('./pages/ProgressPage')).ProgressPage }))
const StrategyPage = lazy(async () => ({ default: (await import('./pages/StrategyPage')).StrategyPage }))

function LoadingPage() {
  const { t } = useTranslation()
  return <div className="app-loading"><div className="loading-orbit" /><span>{t('common.loading')}</span></div>
}

function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <LoadingPage />
  return user ? <AppShell /> : <Navigate to="/login" replace />
}

export function App() {
  return <Suspense fallback={<LoadingPage />}><Routes><Route path="/" element={<LandingPage />} /><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route path="/app" element={<DashboardPage />} /><Route path="/app/strategy" element={<StrategyPage />} /><Route path="/app/live" element={<LiveTrainingPage />} /><Route path="/app/manual" element={<ManualTrainingPage />} /><Route path="/app/quick-log" element={<QuickLogPage />} /><Route path="/app/progress" element={<ProgressPage />} /><Route path="/app/history" element={<HistoryPage />} /><Route path="/app/couple" element={<CouplePage />} /><Route path="/app/exercises" element={<ExerciseLibraryPage />} /><Route path="/app/nutrition/foods" element={<FoodLibraryPage />} /><Route path="/app/nutrition/recipes" element={<RecipesPage />} /><Route path="/app/nutrition/log" element={<FoodLogPage />} /><Route path="/app/nutrition/planner" element={<MealPlannerPage />} /><Route path="/app/nutrition/grocery" element={<GroceryPage />} /><Route path="/app/nutrition/insights" element={<NutritionInsightsPage />} /><Route path="/app/profile" element={<ProfilePage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense>
}
