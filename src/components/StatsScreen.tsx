import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Trophy, Target, Shield, X, Users, Clock, TrendingUp, Download } from 'lucide-react';
import { Game, Screen, StatEvent } from '../App';
import { ExportModal } from './ExportModal';

interface StatsScreenProps {
  game: Game;
  onNavigate: (screen: Screen) => void;
}

export function StatsScreen({ game, onNavigate }: StatsScreenProps) {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const getWinner = () => {
    if (game.scoreA > game.scoreB) return game.teamA;
    if (game.scoreB > game.scoreA) return game.teamB;
    return 'Empate';
  };

  // Asegurar que hay jugadores antes de calcular tops
  const topScorer = game.players.length > 0 ? game.players.reduce((prev, current) => 
    (prev.points > current.points) ? prev : current
  ) : null;

  const topAssister = game.players.length > 0 ? game.players.reduce((prev, current) => 
    (prev.assists > current.assists) ? prev : current
  ) : null;

  const topDefender = game.players.length > 0 ? game.players.reduce((prev, current) => 
    (prev.blocks > current.blocks) ? prev : current
  ) : null;

  // Obtener todos los eventos y ordenarlos cronológicamente
  const allEvents = game.players
    .flatMap(player => player.events.map(event => ({ ...event, playerName: player.name })))
    .sort((a, b) => a.timestamp - b.timestamp);

  const formatEventTime = (minute: number, second: number) => {
    return `${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  };

  const formatGameTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'point': return <Target className="w-4 h-4" />;
      case 'assist': return <Users className="w-4 h-4" />;
      case 'block': return <Shield className="w-4 h-4" />;
      case 'drop': return <X className="w-4 h-4" />;
      case 'turnover': return <TrendingUp className="w-4 h-4 rotate-180" />;
      case 'throw_away': return <TrendingUp className="w-4 h-4 rotate-180" />;
      default: return null;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'point': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'assist': return 'text-green-600 bg-green-50 border-green-200';
      case 'block': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'drop': return 'text-red-600 bg-red-50 border-red-200';
      case 'turnover': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'throw_away': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'point': return 'Punto';
      case 'assist': return 'Asistencia';
      case 'block': return 'Bloqueo';
      case 'drop': return 'Drop';
      case 'turnover': return 'Turnover';
      case 'throw_away': return 'Throw Away';
      default: return type;
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onNavigate('home')}
          className="text-black"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Volver
        </Button>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setExportModalOpen(true)}
            variant="outline"
            size="sm"
            className="text-black border-gray-300"
          >
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
          {game.isActive && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => onNavigate('game')}
              className="text-black border-gray-300"
            >
              Continuar Partido
            </Button>
          )}
        </div>
      </div>

      {/* Game Summary */}
      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-center text-black">
            {game.teamA} vs {game.teamB}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl text-orange-500">
            {game.scoreA} - {game.scoreB}
          </div>
          
          {/* Game Duration */}
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Duración: {formatGameTime(game.gameTimeElapsed || 0)}</span>
          </div>
          
          {!game.isActive && (
            <div className="flex items-center justify-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              <span className="text-lg text-black">
                Ganador: {getWinner()}
              </span>
            </div>
          )}
          {game.isActive && (
            <Badge variant="secondary" className="bg-orange-500 text-white">
              Partido en curso
            </Badge>
          )}
          <p className="text-gray-600">
            {new Date(game.date).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </CardContent>
      </Card>

      {/* Highlights */}
      {game.players.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg text-black">Destacados del Partido</h3>
          <div className="grid grid-cols-1 gap-3">
            {topScorer && topScorer.points > 0 && (
              <Card className="border border-green-200 bg-green-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-600" />
                    <span className="text-black">Más puntos</span>
                  </div>
                  <div className="text-right">
                    <div className="text-green-600">{topScorer.name}</div>
                    <div className="text-sm text-gray-600">{topScorer.points} puntos</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {topAssister && topAssister.assists > 0 && (
              <Card className="border border-blue-200 bg-blue-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="text-black">Más asistencias</span>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-600">{topAssister.name}</div>
                    <div className="text-sm text-gray-600">{topAssister.assists} asistencias</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {topDefender && topDefender.blocks > 0 && (
              <Card className="border border-purple-200 bg-purple-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-purple-600" />
                    <span className="text-black">Mejor defensa</span>
                  </div>
                  <div className="text-right">
                    <div className="text-purple-600">{topDefender.name}</div>
                    <div className="text-sm text-gray-600">{topDefender.blocks} bloqueos</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Player Stats */}
      <div className="space-y-4">
        <h3 className="text-lg text-black">Estadísticas por Jugador</h3>
        
        {game.players.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No hay estadísticas de jugadores</p>
              <p className="text-sm text-gray-400">Las estadísticas aparecerán aquí durante el partido</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {game.players
              .sort((a, b) => b.points - a.points)
              .map((player) => (
                <Card key={player.id} className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-black">{player.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Puntos</span>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            {player.points}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Asistencias</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {player.assists}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Bloqueos</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {player.blocks}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Drops</span>
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            {player.drops}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Turnovers</span>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                            {player.turnovers}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Efectividad</span>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                            {player.points + player.assists > 0 
                              ? Math.round(((player.points + player.assists) / (player.points + player.assists + player.drops + player.turnovers)) * 100)
                              : 0}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Event Timeline */}
      {allEvents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg text-black">Cronología de Eventos</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {allEvents.map((event) => (
              <div key={event.id} className={`flex items-center justify-between p-3 rounded-lg border ${getEventColor(event.type)}`}>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getEventIcon(event.type)}
                  </div>
                  <div>
                    <div className="text-sm">{event.playerName}</div>
                    <div className="text-xs opacity-75">{getEventLabel(event.type)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{formatEventTime(event.minute, event.second)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Exportación */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        game={game}
      />
    </div>
  );
}