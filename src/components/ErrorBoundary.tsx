import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(): State { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Train Together UI error', error, info) }
  render() {
    if (this.state.hasError) return <main className="app-loading"><div><h1>Something went wrong</h1><p>Reload the page to return to your training space.</p><button type="button" className="neon-button neon-button-primary" onClick={() => window.location.reload()}>Reload</button></div></main>
    return this.props.children
  }
}
