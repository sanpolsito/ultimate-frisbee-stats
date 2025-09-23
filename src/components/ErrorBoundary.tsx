import React, { Component, ReactNode } from 'react'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Error de Configuración
              </h1>
              <p className="text-muted-foreground mb-4">
                La aplicación no pudo conectarse correctamente. Esto puede deberse a:
              </p>
            </div>
            
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Variables de entorno no configuradas en Vercel</li>
                  <li>Configuración incorrecta de Supabase</li>
                  <li>Problemas de conectividad</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Si el problema persiste, contacta al administrador.</p>
                <p className="mt-1">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {this.state.error?.message}
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
