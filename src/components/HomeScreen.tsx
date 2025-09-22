import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trophy, Calendar, Users, Clock, Settings } from 'lucide-react';
import { Game, Screen, GameConfig, Team } from '../App';

interface HomeScreenProps {
  games: Game[];
  teams: Team[];
  onNavigate: (screen: Screen) => void;
  onStartNewGame: (teamA: string, teamB: string, config: GameConfig, profile: 'planillero' | 'coach') => void;
  onSelectGame: (game: Game) => void;
  user?: any;
  onShowAuth?: () => void;
}

export function HomeScreen({ games, teams, onNavigate, onStartNewGame, onSelectGame, user, onShowAuth }: HomeScreenProps) {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [customTeamA, setCustomTeamA] = useState('');
  const [customTeamB, setCustomTeamB] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [configMode, setConfigMode] = useState<'quick' | 'wfdf' | 'custom'>('wfdf');
  const [profile, setProfile] = useState<'planillero' | 'coach'>('planillero');
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    targetPoints: 15,
    timeLimitMinutes: 100,
    softCapMinutes: 75,
    hardCapMinutes: 100,
    halftimePoints: 8,
    halftimeMinutes: 50,
    timeoutDurationSeconds: 70,
    timeoutsPerTeam: 2
  });

  // Configuraciones predefinidas
  const wfdfConfig: GameConfig = {
    targetPoints: 15,
    timeLimitMinutes: 100,
    softCapMinutes: 75,
    hardCapMinutes: 100,
    halftimePoints: 8,
    halftimeMinutes: 50,
    timeoutDurationSeconds: 70,
    timeoutsPerTeam: 2
  };

  const quickConfig: GameConfig = {
    targetPoints: 11,
    timeLimitMinutes: 60,
    softCapMinutes: 45,
    hardCapMinutes: 60,
    halftimePoints: 6,
    halftimeMinutes: 30,
    timeoutDurationSeconds: 60,
    timeoutsPerTeam: 1
  };

  const handleStartGame = () => {
    const finalTeamA = teamA === 'custom-team-a' ? customTeamA.trim() : teamA.trim();
    const finalTeamB = teamB === 'custom-team-b' ? customTeamB.trim() : teamB.trim();
    
    if (finalTeamA && finalTeamB && finalTeamA !== finalTeamB) {
      onStartNewGame(finalTeamA, finalTeamB, gameConfig, profile);
      setTeamA('');
      setTeamB('');
      setCustomTeamA('');
      setCustomTeamB('');
      setDialogOpen(false);
    }
  };

  const handleConfigModeChange = (mode: 'quick' | 'wfdf' | 'custom') => {
    setConfigMode(mode);
    if (mode === 'wfdf') {
      setGameConfig(wfdfConfig);
    } else if (mode === 'quick') {
      setGameConfig(quickConfig);
    }
  };

  const handleGameSelect = (game: Game) => {
    onSelectGame(game);
    if (game.isActive) {
      onNavigate('game');
    } else {
      onNavigate('stats');
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto bg-orange-500 rounded-full flex items-center justify-center">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl text-black">Ultimate Stats</h1>
        <p className="text-gray-600">Registra estadísticas de tus partidos</p>
      </div>

      {/* New Game Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white text-lg"
            size="lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            Nuevo Partido
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Crear Nuevo Partido
            </DialogTitle>
            <DialogDescription>
              Configura los equipos y las reglas de tiempo para tu nuevo partido de Ultimate Frisbee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="teamA">Equipo A</Label>
              <Select value={teamA} onValueChange={(value) => setTeamA(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un equipo..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.name}>
                      <div className="flex items-center space-x-2">
                        <span>{team.name}</span>
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          {team.players.length} jugadores
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom-team-a">
                    <span className="text-gray-600">Otro equipo...</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {teamA === 'custom-team-a' && (
                <Input
                  placeholder="Escribe el nombre del equipo A"
                  value={customTeamA}
                  onChange={(e) => setCustomTeamA(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <Label htmlFor="teamB">Equipo B</Label>
              <Select value={teamB} onValueChange={(value) => setTeamB(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un equipo..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.filter(team => team.name !== teamA).map((team) => (
                    <SelectItem key={team.id} value={team.name}>
                      <div className="flex items-center space-x-2">
                        <span>{team.name}</span>
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          {team.players.length} jugadores
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom-team-b">
                    <span className="text-gray-600">Otro equipo...</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {teamB === 'custom-team-b' && (
                <Input
                  placeholder="Escribe el nombre del equipo B"
                  value={customTeamB}
                  onChange={(e) => setCustomTeamB(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <Separator />

            {/* Configuración de Tiempo */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <Label className="text-sm">Configuración de Tiempo</Label>
              </div>
              
              {/* Selector de Modo */}
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  type="button"
                  variant={configMode === 'quick' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleConfigModeChange('quick')}
                  className={configMode === 'quick' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  Rápido
                </Button>
                <Button 
                  type="button"
                  variant={configMode === 'wfdf' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleConfigModeChange('wfdf')}
                  className={configMode === 'wfdf' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  WFDF
                </Button>
                <Button 
                  type="button"
                  variant={configMode === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleConfigModeChange('custom')}
                  className={configMode === 'custom' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  Custom
                </Button>
              </div>

              {/* Información del Modo Seleccionado */}
              {configMode === 'wfdf' && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="text-sm text-orange-800 mb-2">Reglamento WFDF Oficial</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-orange-700">
                    <div>• Puntos objetivo: 15</div>
                    <div>• Hard cap: 100 min</div>
                    <div>• Soft cap: 75 min</div>
                    <div>• Medio tiempo: 8 pts</div>
                    <div>• Timeouts: 70 seg</div>
                    <div>• Por equipo: 2</div>
                  </div>
                </div>
              )}

              {configMode === 'quick' && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm text-blue-800 mb-2">Partida Rápida</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                    <div>• Puntos objetivo: 11</div>
                    <div>• Hard cap: 60 min</div>
                    <div>• Soft cap: 45 min</div>
                    <div>• Medio tiempo: 6 pts</div>
                    <div>• Timeouts: 60 seg</div>
                    <div>• Por equipo: 1</div>
                  </div>
                </div>
              )}

              {configMode === 'custom' && (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm text-gray-800 mb-3">Configuración Personalizada</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="targetPoints" className="text-xs">Puntos objetivo</Label>
                        <Input
                          id="targetPoints"
                          type="number"
                          value={gameConfig.targetPoints}
                          onChange={(e) => setGameConfig(prev => ({ ...prev, targetPoints: parseInt(e.target.value) || 15 }))}
                          className="mt-1 h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hardCapMinutes" className="text-xs">Hard cap (min)</Label>
                        <Input
                          id="hardCapMinutes"
                          type="number"
                          value={gameConfig.hardCapMinutes}
                          onChange={(e) => setGameConfig(prev => ({ ...prev, hardCapMinutes: parseInt(e.target.value) || 100 }))}
                          className="mt-1 h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="softCapMinutes" className="text-xs">Soft cap (min)</Label>
                        <Input
                          id="softCapMinutes"
                          type="number"
                          value={gameConfig.softCapMinutes}
                          onChange={(e) => setGameConfig(prev => ({ ...prev, softCapMinutes: parseInt(e.target.value) || 75 }))}
                          className="mt-1 h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="halftimePoints" className="text-xs">Medio tiempo (pts)</Label>
                        <Input
                          id="halftimePoints"
                          type="number"
                          value={gameConfig.halftimePoints}
                          onChange={(e) => setGameConfig(prev => ({ ...prev, halftimePoints: parseInt(e.target.value) || 8 }))}
                          className="mt-1 h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="timeoutDurationSeconds" className="text-xs">Timeout (seg)</Label>
                        <Input
                          id="timeoutDurationSeconds"
                          type="number"
                          value={gameConfig.timeoutDurationSeconds}
                          onChange={(e) => setGameConfig(prev => ({ ...prev, timeoutDurationSeconds: parseInt(e.target.value) || 70 }))}
                          className="mt-1 h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="timeoutsPerTeam" className="text-xs">Timeouts/equipo</Label>
                        <Input
                          id="timeoutsPerTeam"
                          type="number"
                          value={gameConfig.timeoutsPerTeam}
                          onChange={(e) => setGameConfig(prev => ({ ...prev, timeoutsPerTeam: parseInt(e.target.value) || 2 }))}
                          className="mt-1 h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle de Perfil */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Modo de Registro</Label>
              <div className="bg-gray-100 rounded-lg p-1">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setProfile('planillero')}
                    className={`h-16 rounded-lg transition-all duration-200 ${
                      profile === 'planillero'
                        ? 'bg-white text-orange-600 shadow-md border border-orange-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📊</div>
                      <div className="text-sm font-medium">Planillero</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfile('coach')}
                    className={`h-16 rounded-lg transition-all duration-200 ${
                      profile === 'coach'
                        ? 'bg-white text-orange-600 shadow-md border border-orange-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🏆</div>
                      <div className="text-sm font-medium">Coach</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleStartGame}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={(() => {
                const finalTeamA = teamA === 'custom-team-a' ? customTeamA.trim() : teamA.trim();
                const finalTeamB = teamB === 'custom-team-b' ? customTeamB.trim() : teamB.trim();
                return !finalTeamA || !finalTeamB || finalTeamA === finalTeamB;
              })()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Iniciar Partido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Teams Button */}
      <Button 
        onClick={() => onNavigate('teams')}
        variant="outline"
        className="w-full h-12 text-black border-gray-300 hover:bg-gray-50"
        size="lg"
      >
        <Users className="w-5 h-5 mr-2" />
        Gestionar Equipos
      </Button>

      {/* Recent Games */}
      <div className="space-y-4">
        <h2 className="text-xl text-black">Partidos Recientes</h2>
        
        {games.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No hay partidos registrados</p>
              <p className="text-sm text-gray-400">Crea tu primer partido para comenzar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <Card 
                key={game.id} 
                className="border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleGameSelect(game)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-black">
                      {game.teamA} vs {game.teamB}
                    </CardTitle>
                    {game.isActive && (
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
                        Activo
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl text-orange-500">
                      {game.scoreA} - {game.scoreB}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(game.date).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  {!game.isActive && game.players.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>👤 {game.players.length} jugadores registrados</div>
                        <div>⚡ {game.players.reduce((sum, p) => sum + p.points + p.assists, 0)} eventos registrados</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}