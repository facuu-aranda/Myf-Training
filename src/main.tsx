import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import './index.css'
import { App } from './App'
import { AuthProvider } from './contexts/AuthContext'
import { FitnessProvider } from './contexts/FitnessContext'
import { ErrorBoundary } from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><BrowserRouter><FitnessProvider><AuthProvider><App /></AuthProvider></FitnessProvider></BrowserRouter></ErrorBoundary></React.StrictMode>)
