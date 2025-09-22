import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Progress } from './ui/progress'
import { Loader2, CheckCircle, AlertCircle, Download, Upload, Database } from 'lucide-react'
import { migrateLocalDataToSupabase, clearLocalData, exportDataToJSON, importDataFromJSON } from '../utils/migration'

interface MigrationModalProps {
  isOpen: boolean
  onClose: () => void
  onMigrationComplete: () => void
}

export function MigrationModal({ isOpen, onClose, onMigrationComplete }: MigrationModalProps) {
  const [step, setStep] = useState<'select' | 'migrating' | 'complete' | 'error'>('select')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [migrationResult, setMigrationResult] = useState<{
    migratedTeams: number
    migratedGames: number
  } | null>(null)

  const handleMigrate = async () => {
    setStep('migrating')
    setProgress(0)
    setMessage('Iniciando migración...')
    setError('')

    try {
      setProgress(25)
      setMessage('Verificando autenticación...')

      setProgress(50)
      setMessage('Migrando datos a Supabase...')

      const result = await migrateLocalDataToSupabase()

      if (result.success) {
        setProgress(100)
        setMessage('Migración completada exitosamente!')
        setMigrationResult({
          migratedTeams: result.migratedTeams || 0,
          migratedGames: result.migratedGames || 0
        })
        setStep('complete')
      } else {
        setError(result.error || 'Error durante la migración')
        setStep('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setStep('error')
    }
  }

  const handleClearLocalData = () => {
    clearLocalData()
    setMessage('Datos locales eliminados')
  }

  const handleExport = () => {
    try {
      exportDataToJSON()
      setMessage('Datos exportados exitosamente')
    } catch (err) {
      setError('Error exportando datos')
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      importDataFromJSON(file)
        .then(() => {
          setMessage('Datos importados exitosamente')
        })
        .catch((err) => {
          setError('Error importando datos: ' + err.message)
        })
    }
  }

  const handleClose = () => {
    setStep('select')
    setProgress(0)
    setMessage('')
    setError('')
    setMigrationResult(null)
    onClose()
  }

  const handleComplete = () => {
    onMigrationComplete()
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Migración a Supabase
          </DialogTitle>
          <DialogDescription>
            Migra tus datos locales a la nube para sincronización y respaldo
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Migrar a Supabase</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Migra tus equipos y partidos guardados localmente a Supabase para:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Sincronización entre dispositivos</li>
                  <li>• Respaldo en la nube</li>
                  <li>• Colaboración en tiempo real</li>
                  <li>• Acceso desde cualquier lugar</li>
                </ul>
                <Button onClick={handleMigrate} className="w-full">
                  <Database className="mr-2 h-4 w-4" />
                  Iniciar Migración
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleExport} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'migrating' && (
          <div className="space-y-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            
            {migrationResult && (
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{migrationResult.migratedTeams}</p>
                      <p className="text-sm text-muted-foreground">Equipos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{migrationResult.migratedGames}</p>
                      <p className="text-sm text-muted-foreground">Partidos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button onClick={handleClearLocalData} variant="outline" className="flex-1">
                Limpiar Datos Locales
              </Button>
              <Button onClick={handleComplete} className="flex-1">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            <Button onClick={() => setStep('select')} className="w-full">
              Intentar de Nuevo
            </Button>
          </div>
        )}

        {message && step !== 'migrating' && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}
