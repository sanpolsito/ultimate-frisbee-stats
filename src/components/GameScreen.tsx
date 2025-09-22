import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ArrowLeft, Plus, Target, Shield, X, Users, BarChart3, Play, Pause, Clock, Search, TrendingDown, Zap } from 'lucide-react';
import { Game, Player, Screen, StatEvent, Team, TeamPlayer } from '../App';

interface GameScreenProps {
  game: Game;
  teams: Team[];
  onNavigate: (screen: Screen) => void;
  onUpdateGame: (game: Game) => void;
}

export function GameScreen({ game, teams, onNavigate, onUpdateGame }: GameScreenProps) {
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [pointDialogTeamA, setPointDialogTeamA] = useState(false);
  const [pointDialogTeamB, setPointDialogTeamB] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState<string>(game.teamA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<'all' | 'teamA' | 'teamB'>('all');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(() => {
    // Calcular tiempo restante inicial
    const timeLimitSeconds = game.config.timeLimitMinutes * 60;
    return timeLimitSeconds - (game.gameTimeElapsed || 0);
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estados para modales de puntos
  const [selectedGoalScorerA, setSelectedGoalScorerA] = useState<string>('');
  const [selectedAssistA, setSelectedAssistA] = useState<string>('');
  const [selectedGoalScorerB, setSelectedGoalScorerB] = useState<string>('');
  const [selectedAssistB, setSelectedAssistB] = useState<string>('');
  
  // Nuevos estados para modales de eventos
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<'point' | 'assist' | 'turnover' | 'block' | 'drop' | 'pool' | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [turnoverSubType, setTurnoverSubType] = useState<'drop' | 'throw_away'>('drop');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  
  // Estados para el nuevo modal estandarizado
  const [playerSelectionModalOpen, setPlayerSelectionModalOpen] = useState(false);
  const [currentEventType, setCurrentEventType] = useState<'point' | 'assist' | 'turnover' | 'block' | 'drop' | 'pool'>('block');
  const [currentSelectedTeam, setCurrentSelectedTeam] = useState('');
  
  // Estados para modal de anotación (equipo + anotador + asistidor)
  const [selectedScoringTeam, setSelectedScoringTeam] = useState<string>('');
  const [selectedScorer, setSelectedScorer] = useState<string>('');
  const [selectedAssister, setSelectedAssister] = useState<string>('');
  const [scorerSearchQuery, setScorerSearchQuery] = useState('');
  const [assisterSearchQuery, setAssisterSearchQuery] = useState('');
  
  // Estados para confirmación de eventos
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<{
    type: 'point' | 'assist' | 'turnover' | 'block' | 'drop';
    playerId: string;
    playerName: string;
    team: string;
    subType?: string;
  } | null>(null);
  
  // Usar el perfil del juego (no se puede cambiar durante el partido)
  const activeProfile = game.profile;

  // Helper function para actualizar el juego preservando el currentPointGender
  const updateGamePreservingGender = (updatedGame: Partial<Game>) => {
    const finalGame = {
      ...game,
      ...updatedGame,
      // Siempre preservar el currentPointGender
      currentPointGender: updatedGame.currentPointGender !== undefined 
        ? updatedGame.currentPointGender 
        : game.currentPointGender
    };
    onUpdateGame(finalGame);
  };
  
  // Estados para modal de tipo de turnover (Coach)
  const [turnoverTypeModalOpen, setTurnoverTypeModalOpen] = useState(false);
  const [selectedTurnoverType, setSelectedTurnoverType] = useState<'drop' | 'throw_away' | null>(null);
  
  // Estados para modal de anotación del Coach
  const [coachPointModalOpen, setCoachPointModalOpen] = useState(false);
  
  // Estados para el modal especial de Pool
  const [poolModalOpen, setPoolModalOpen] = useState(false);
  const [selectedPoolPlayer, setSelectedPoolPlayer] = useState<string>('');
  const [poolTimer, setPoolTimer] = useState(0);
  const [isPoolTimerRunning, setIsPoolTimerRunning] = useState(false);
  const [poolResult, setPoolResult] = useState<'in' | 'out' | null>(null);
  const poolTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  
  // Colores para las posiciones
  const positionColors = {
    'Handler': 'bg-blue-100 text-blue-700',
    'Cutter': 'bg-green-100 text-green-700',
    'Deep': 'bg-purple-100 text-purple-700',
    'Hybrid': 'bg-orange-100 text-orange-700',
  };

  // Encontrar equipos que participan en el partido
  const gameTeams = teams.filter(team => 
    team.name === game.teamA || team.name === game.teamB
  );

  // Obtener todos los jugadores de los equipos participantes
  const availablePlayers = gameTeams.flatMap(team => 
    team.players.map(player => ({
      ...player,
      teamName: team.name,
      teamId: team.id
    }))
  );

  // Filtrar jugadores que ya están agregados al partido
  const playersNotInGame = availablePlayers.filter(player => 
    !game.players.some(gamePlayer => gamePlayer.name === player.name)
  );

  // Filtrar jugadores basado en la búsqueda (priorizar número)
  const filteredPlayers = playersNotInGame.filter(player => {
    const query = searchQuery.toLowerCase().trim();
    
    // Filtro por equipo
    let teamMatch = true;
    if (selectedTeamFilter === 'teamA') {
      teamMatch = player.teamName === game.teamA;
    } else if (selectedTeamFilter === 'teamB') {
      teamMatch = player.teamName === game.teamB;
    }
    
    // Filtro por búsqueda
    let searchMatch = true;
    if (query) {
      // Priorizar búsqueda por número
      if (query.match(/^\d+$/)) {
        searchMatch = player.number.toString().includes(query);
      } else {
        // Búsqueda por nombre
        searchMatch = player.name.toLowerCase().includes(query);
      }
    }
    
    return teamMatch && searchMatch;
  }).sort((a, b) => {
    // Ordenar por número si es búsqueda numérica, sino por nombre
    const query = searchQuery.toLowerCase().trim();
    if (query.match(/^\d+$/)) {
      return a.number - b.number;
    }
    return a.name.localeCompare(b.name);
  });

  // Filtrar jugadores del partido por equipo (para modales de puntos)
  const getTeamPlayers = (teamName: string) => {
    // Primero buscar en los jugadores del partido actual
    const gamePlayers = game.players.filter(player => {
      if (player.team) {
        return player.team === teamName;
      }
      
      const playerTeam = gameTeams.find(team => 
        team.players.some(tp => tp.name === player.name)
      );
      return playerTeam?.name === teamName;
    });

    // Si hay jugadores en el partido, devolverlos
    if (gamePlayers.length > 0) {
      return gamePlayers;
    }

    // Si no hay jugadores en el partido, buscar en la base de datos de equipos
    const teamData = gameTeams.find(team => team.name === teamName);
    if (teamData) {
      return teamData.players.map(dbPlayer => ({
        id: dbPlayer.id,
        name: dbPlayer.name,
        team: teamName,
        points: 0,
        assists: 0,
        drops: 0,
        blocks: 0,
        turnovers: 0,
        pools: 0,
        events: []
      }));
    }

    return [];
  };

  const teamAPlayers = getTeamPlayers(game.teamA);
  const teamBPlayers = getTeamPlayers(game.teamB);
  
  // Debug logging temporal (se puede remover después)
  console.log('Game players:', game.players);
  console.log('Team A players:', teamAPlayers);
  console.log('Game teams:', gameTeams);
  console.log('Team A name:', game.teamA);
  console.log('Team B players:', teamBPlayers);
  
  // Iniciar automáticamente el cronómetro si el juego está activo y no tiene tiempo de inicio
  useEffect(() => {
    const timeLimitSeconds = game.config.timeLimitMinutes * 60;
    
    if (game.isActive) {
      if (game.startTime) {
        // El juego ya está corriendo, calcular tiempo restante
        const now = Date.now();
        const elapsed = Math.floor((now - game.startTime) / 1000) + (game.gameTimeElapsed || 0);
        const remaining = Math.max(0, timeLimitSeconds - elapsed);
        setRemainingTime(remaining);
        setIsTimerRunning(remaining > 0); // Solo continuar si hay tiempo restante
      } else if (game.gameTimeElapsed === 0) {
        // Nuevo juego, iniciar cronómetro automáticamente con tiempo completo
        setRemainingTime(timeLimitSeconds);
        updateGamePreservingGender({
          startTime: Date.now()
        });
        setIsTimerRunning(true);
      } else {
        // Juego pausado, mostrar tiempo restante
        const remaining = Math.max(0, timeLimitSeconds - game.gameTimeElapsed);
        setRemainingTime(remaining);
        setIsTimerRunning(false);
      }
    } else {
      // Juego terminado
      const remaining = Math.max(0, timeLimitSeconds - (game.gameTimeElapsed || 0));
      setRemainingTime(remaining);
      setIsTimerRunning(false);
    }
  }, []);

  // Manejar el cronómetro
  useEffect(() => {
    const timeLimitSeconds = game.config.timeLimitMinutes * 60;
    
    if (isTimerRunning && game.startTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - game.startTime!) / 1000) + (game.gameTimeElapsed || 0);
        const remaining = Math.max(0, timeLimitSeconds - elapsed);
        setRemainingTime(remaining);
        
        // Si se acaba el tiempo, finalizar automáticamente el partido
        if (remaining === 0) {
          setIsTimerRunning(false);
          updateGamePreservingGender({
            isActive: false,
            gameTimeElapsed: timeLimitSeconds,
            startTime: undefined
          });
          // Opcional: navegar automáticamente a estadísticas
          // onNavigate('stats');
        }
        
        // Actualizar el juego cada 10 segundos para persistir el tiempo
        if (elapsed % 10 === 0) {
          updateGamePreservingGender({
            gameTimeElapsed: elapsed
          });
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTimerRunning, game.startTime]);

  // Efecto para limpiar el timer de Pool al desmontar
  useEffect(() => {
    return () => {
      if (poolTimerRef.current) {
        clearInterval(poolTimerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper para títulos centrados sin iconos
  const getCenteredTitle = (title: string) => (
    <DialogTitle className="text-center text-lg sm:text-xl font-semibold">
      {title}
    </DialogTitle>
  );

  const toggleTimer = () => {
    if (isTimerRunning) {
      // Pausar: actualizar el tiempo transcurrido
      const timeLimitSeconds = game.config.timeLimitMinutes * 60;
      const elapsedTime = timeLimitSeconds - remainingTime;
      updateGamePreservingGender({
        gameTimeElapsed: elapsedTime,
        startTime: undefined
      });
    } else {
      // Reanudar: establecer nuevo tiempo de inicio solo si hay tiempo restante
      if (remainingTime > 0) {
        updateGamePreservingGender({
          startTime: Date.now()
        });
        setIsTimerRunning(true);
      }
    }
    if (remainingTime > 0) {
      setIsTimerRunning(!isTimerRunning);
    }
  };

  const addPointWithDetails = (team: 'A' | 'B', goalScorerId: string, assistPlayerId?: string) => {
    // Calcular el tiempo transcurrido para el evento
    const timeLimitSeconds = game.config.timeLimitMinutes * 60;
    const elapsedTime = timeLimitSeconds - remainingTime;
    const minute = Math.floor(elapsedTime / 60);
    const second = elapsedTime % 60;
    const timestamp = Date.now();

    const updatedPlayers = game.players.map(player => {
      if (player.id === goalScorerId) {
        // Agregar gol al goleador
        const goalEvent: StatEvent = {
          id: timestamp.toString() + '_goal',
          playerId: goalScorerId,
          type: 'point',
          minute,
          second,
          timestamp
        };
        
        return {
          ...player,
          points: player.points + 1,
          events: [...player.events, goalEvent]
        };
      } else if (assistPlayerId && player.id === assistPlayerId) {
        // Agregar asistencia al asistidor
        const assistEvent: StatEvent = {
          id: timestamp.toString() + '_assist',
          playerId: assistPlayerId,
          type: 'assist',
          minute,
          second,
          timestamp
        };
        
        return {
          ...player,
          assists: player.assists + 1,
          events: [...player.events, assistEvent]
        };
      }
      return player;
    });

    updateGamePreservingGender({
      scoreA: team === 'A' ? game.scoreA + 1 : game.scoreA,
      scoreB: team === 'B' ? game.scoreB + 1 : game.scoreB,
      players: updatedPlayers,
    });
    
    // Resetear estados y cerrar modal después de procesar
    if (team === 'A') {
      setSelectedGoalScorerA('');
      setSelectedAssistA('');
      setPointDialogTeamA(false);
    } else {
      setSelectedGoalScorerB('');
      setSelectedAssistB('');
      setPointDialogTeamB(false);
    }
    
    // Log para debugging (temporal)
    const remainingMinutes = Math.floor(remainingTime / 60);
    const remainingSeconds = remainingTime % 60;
    console.log('Punto registrado:', {
      team,
      goalScorer: game.players.find(p => p.id === goalScorerId)?.name,
      assister: assistPlayerId ? game.players.find(p => p.id === assistPlayerId)?.name : 'Sin asistencia',
      timeElapsed: `${minute}:${second.toString().padStart(2, '0')}`,
      timeRemaining: `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`,
      newScore: team === 'A' ? `${game.scoreA + 1}-${game.scoreB}` : `${game.scoreA}-${game.scoreB + 1}`
    });
  };

  const addPoint = (team: 'A' | 'B') => {
    updateGamePreservingGender({
      scoreA: team === 'A' ? game.scoreA + 1 : game.scoreA,
      scoreB: team === 'B' ? game.scoreB + 1 : game.scoreB,
    });
  };

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        team: newPlayerTeam, // Asignar el equipo correctamente
        points: 0,
        assists: 0,
        drops: 0,
        blocks: 0,
        turnovers: 0,
        pools: 0,
        events: []
      };
      
      updateGamePreservingGender({
        players: [...game.players, newPlayer],
      });
      setNewPlayerName('');
      setNewPlayerTeam(game.teamA); // Reset al equipo A por defecto
      setPlayerDialogOpen(false);
    }
  };

  const addTeamPlayer = (teamPlayer: TeamPlayer & { teamName: string }) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: teamPlayer.name,
      team: teamPlayer.teamName, // Asignar el equipo correctamente
      points: 0,
      assists: 0,
      drops: 0,
      blocks: 0,
      turnovers: 0,
      pools: 0,
      events: []
    };
    
    updateGamePreservingGender({
      players: [...game.players, newPlayer],
    });
    setSearchQuery('');
    setPlayerDialogOpen(false);
  };

  const updatePlayerStat = (playerId: string, stat: keyof Omit<Player, 'id' | 'name' | 'events'>, increment: number) => {
    // Calcular el tiempo transcurrido para el evento
    const timeLimitSeconds = game.config.timeLimitMinutes * 60;
    const elapsedTime = timeLimitSeconds - remainingTime;
    const minute = Math.floor(elapsedTime / 60);
    const second = elapsedTime % 60;
    
    const updatedPlayers = game.players.map(player => {
      if (player.id === playerId) {
        const newEvent: StatEvent = {
          id: Date.now().toString(),
          playerId,
          type: stat as StatEvent['type'],
          minute,
          second,
          timestamp: Date.now()
        };
        
        return {
          ...player,
          [stat]: Math.max(0, (player[stat] as number) + increment),
          events: [...player.events, newEvent]
        };
      }
      return player;
    });

    updateGamePreservingGender({
      players: updatedPlayers,
    });
  };

  const finishGame = () => {
    // Pausar el cronómetro y finalizar el juego
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    const timeLimitSeconds = game.config.timeLimitMinutes * 60;
    const elapsedTime = timeLimitSeconds - remainingTime;
    
    updateGamePreservingGender({
      isActive: false,
      gameTimeElapsed: elapsedTime,
      startTime: undefined
    });
    onNavigate('stats');
  };

  const handleTeamFilterChange = (filter: 'all' | 'teamA' | 'teamB') => {
    setSelectedTeamFilter(filter);
    setSearchQuery(''); // Limpiar búsqueda al cambiar filtro
  };

  // Funciones para manejar apertura de modales de puntos
  const openPointModalA = () => {
    setSelectedGoalScorerA('');
    setSelectedAssistA('');
    setPointDialogTeamA(true);
  };

  const openPointModalB = () => {
    setSelectedGoalScorerB('');
    setSelectedAssistB('');
    setPointDialogTeamB(true);
  };

  // Función para abrir modal de eventos
  const openEventModal = (eventType: 'point' | 'assist' | 'turnover' | 'block' | 'drop' | 'pool') => {
    setSelectedEventType(eventType);
    setSelectedTeam('');
    setSelectedPlayer('');
    setPlayerSearchQuery('');
    setSelectedScoringTeam('');
    setSelectedScorer('');
    setSelectedAssister('');
    setScorerSearchQuery('');
    setAssisterSearchQuery('');
    setEventModalOpen(true);
  };

  // Función para abrir el nuevo modal estandarizado
  const openPlayerSelectionModal = (eventType: 'point' | 'assist' | 'turnover' | 'block' | 'drop' | 'pool') => {
    setCurrentEventType(eventType);
    setCurrentSelectedTeam('');
    setPlayerSelectionModalOpen(true);
  };

  // Función para abrir modal de tipo de turnover (Coach)
  const openTurnoverTypeModal = () => {
    setSelectedTurnoverType(null);
    setTurnoverTypeModalOpen(true);
  };

  // Función para manejar selección de tipo de turnover
  const handleTurnoverTypeSelection = (type: 'drop' | 'throw_away') => {
    setSelectedTurnoverType(type);
    setTurnoverTypeModalOpen(false);
    // Abrir modal de selección de jugador con el tipo específico
    setCurrentEventType('turnover');
    setCurrentSelectedTeam('');
    setPlayerSelectionModalOpen(true);
  };

  // Función para manejar selección de tipo de turnover (Coach - solo equipo A)
  const handleTurnoverTypeSelectionCoach = (type: 'drop' | 'throw_away') => {
    setSelectedTurnoverType(type);
    setTurnoverTypeModalOpen(false);
    // Abrir modal de selección de jugador con el tipo específico (solo equipo A)
    setCurrentEventType('turnover');
    setCurrentSelectedTeam(game.teamA); // Forzar equipo A
    setPlayerSelectionModalOpen(true);
  };

  // Funciones específicas para Coach (solo equipo A)
  const openPlayerSelectionModalCoach = (eventType: 'block' | 'turnover' | 'pool') => {
    if (eventType === 'pool') {
      // Abrir modal especial de Pool
      setSelectedPoolPlayer('');
      setPoolTimer(0);
      setIsPoolTimerRunning(false);
      setPoolResult(null);
      setPoolModalOpen(true);
    } else {
      setCurrentEventType(eventType);
      setCurrentSelectedTeam(game.teamA); // Forzar equipo A
      setPlayerSelectionModalOpen(true);
    }
  };

  // Funciones para el cronómetro de Pool
  const startPoolTimer = () => {
    console.log('startPoolTimer called, isPoolTimerRunning:', isPoolTimerRunning);
    if (!isPoolTimerRunning) {
      setIsPoolTimerRunning(true);
      setPoolTimer(0);
      poolTimerRef.current = setInterval(() => {
        setPoolTimer(prev => prev + 0.1);
      }, 100);
    }
  };

  const stopPoolTimer = () => {
    console.log('stopPoolTimer called, isPoolTimerRunning:', isPoolTimerRunning);
    if (isPoolTimerRunning) {
      setIsPoolTimerRunning(false);
      if (poolTimerRef.current) {
        clearInterval(poolTimerRef.current);
        poolTimerRef.current = null;
      }
    }
  };

  const togglePoolTimer = () => {
    console.log('togglePoolTimer called, isPoolTimerRunning:', isPoolTimerRunning);
    if (isPoolTimerRunning) {
      stopPoolTimer();
    } else {
      startPoolTimer();
    }
  };

  const resetPoolTimer = () => {
    setPoolTimer(0);
    setIsPoolTimerRunning(false);
    if (poolTimerRef.current) {
      clearInterval(poolTimerRef.current);
      poolTimerRef.current = null;
    }
  };

  const formatPoolTime = (time: number) => {
    const seconds = Math.floor(time);
    const milliseconds = Math.floor((time % 1) * 10);
    return `${seconds}.${milliseconds}s`;
  };

  const confirmPoolResult = (result: 'in' | 'out') => {
    if (selectedPoolPlayer && poolTimer > 0) {
      // Registrar el evento de Pool con el tiempo
      addPoolEvent(selectedPoolPlayer, poolTimer, result);
      setPoolModalOpen(false);
      setSelectedPoolPlayer('');
      setPoolTimer(0);
      setIsPoolTimerRunning(false);
      setPoolResult(null);
    }
  };

  // Función para agregar evento de Pool con tiempo
  const addPoolEvent = (playerId: string, duration: number, result: 'in' | 'out') => {
    console.log('addPoolEvent llamado:', { playerId, duration, result });
    
    // Calcular el tiempo transcurrido para el evento
    const timeLimitSeconds = game.config.timeLimitMinutes * 60;
    const elapsedTime = timeLimitSeconds - remainingTime;
    const minute = Math.floor(elapsedTime / 60);
    const second = elapsedTime % 60;
    const timestamp = Date.now();

    // Buscar el jugador por ID o por nombre si no se encuentra por ID
    let targetPlayer = game.players.find(player => player.id === playerId);
    
    // Si no se encuentra por ID, buscar por nombre (para casos donde se usa ID de la base de datos)
    if (!targetPlayer) {
      // Buscar en todos los equipos para encontrar el jugador
      for (const team of teams) {
        const dbPlayer = team.players.find(p => p.id === playerId);
        if (dbPlayer) {
          targetPlayer = game.players.find(p => p.name === dbPlayer.name);
          break;
        }
      }
    }

    if (!targetPlayer) {
      console.error('Jugador no encontrado:', playerId);
      return;
    }

    const updatedPlayers = game.players.map(player => {
      if (player.id === targetPlayer!.id) {
        const newEvent: StatEvent = {
          id: timestamp.toString(),
          playerId: targetPlayer.id,
          type: 'pool',
          minute,
          second,
          timestamp,
          // Agregar datos especiales del Pool
          poolDuration: duration,
          poolResult: result
        };

        // Actualizar estadística de pools
        const updatedPlayer = { ...player };
        updatedPlayer.pools += 1;

        return {
          ...updatedPlayer,
          events: [...updatedPlayer.events, newEvent]
        };
      }
      return player;
    });

    // Crear el juego actualizado
    updateGamePreservingGender({
      players: updatedPlayers,
    });
    console.log('Evento Pool registrado exitosamente:', { playerId: targetPlayer.id, duration, result });
  };

  const openTurnoverTypeModalCoach = () => {
    setSelectedTurnoverType(null);
    setTurnoverTypeModalOpen(true);
  };

  // Función para abrir modal de anotación del Coach
  const openCoachPointModal = () => {
    setCoachPointModalOpen(true);
  };

  // Función para agregar punto del equipo A (con jugador específico)
  const addCoachTeamAPoint = (goalScorerId: string, assistPlayerId?: string) => {
    addPointWithDetails('A', goalScorerId, assistPlayerId);
    setCoachPointModalOpen(false);
  };

  // Función para agregar punto del equipo B (sin jugador específico)
  const addCoachTeamBPoint = () => {
    addPoint('B');
    setCoachPointModalOpen(false);
  };

  // Función para manejar selección de equipo en el nuevo modal
  const handleTeamSelection = (teamName: string) => {
    setCurrentSelectedTeam(teamName);
  };

  // Función para manejar selección de jugador en el nuevo modal
  const handlePlayerSelection = (playerId: string, eventType: string) => {
    // Buscar el jugador en la base de datos
    const selectedTeamData = teams.find(team => team.name === currentSelectedTeam);
    if (!selectedTeamData) return;

    const dbPlayer = selectedTeamData.players.find(p => p.id === playerId);
    if (!dbPlayer) return;

    // Buscar si el jugador ya está en el partido
    let playerInGame = game.players.find(p => p.name === dbPlayer.name);
    
    if (!playerInGame) {
      // Crear nuevo jugador
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: dbPlayer.name,
        team: currentSelectedTeam,
        points: 0,
        assists: 0,
        drops: 0,
        blocks: 0,
        turnovers: 0,
        pools: 0,
        events: []
      };
      
      updateGamePreservingGender({
        players: [...game.players, newPlayer],
      });
      playerInGame = newPlayer;
    }

    // Si es un evento de pool, abrir el modal especial de pool
    if (eventType === 'pool') {
      console.log('Pool: Jugador seleccionado:', playerInGame);
      console.log('Pool: ID del jugador:', playerInGame.id);
      console.log('Pool: Nombre del jugador:', playerInGame.name);
      setSelectedPoolPlayer(playerInGame.id);
      setPoolModalOpen(true);
      setPlayerSelectionModalOpen(false);
      setCurrentSelectedTeam('');
      return;
    }

    // Mostrar confirmación en lugar de registrar directamente
    setPendingEvent({
      type: eventType as any,
      playerId: playerInGame.id,
      playerName: dbPlayer.name,
      team: currentSelectedTeam,
      subType: eventType === 'turnover' ? (selectedTurnoverType || 'drop') : undefined
    });
    setConfirmationModalOpen(true);
    
    // Cerrar modal de selección
    setPlayerSelectionModalOpen(false);
    setCurrentSelectedTeam('');
  };

  // Función para confirmar evento
  const confirmEvent = () => {
    if (!pendingEvent) return;
    
    addEventToPlayer(pendingEvent.playerId, pendingEvent.type, pendingEvent.subType as 'drop' | 'throw_away' | undefined);
    setConfirmationModalOpen(false);
    setPendingEvent(null);
  };

  // Función para cancelar evento
  const cancelEvent = () => {
    setConfirmationModalOpen(false);
    setPendingEvent(null);
  };

  // Función para eliminar evento del historial
  const removeEvent = (eventId: string, playerId: string) => {
    const updatedPlayers = game.players.map(player => {
      if (player.id === playerId) {
        const event = player.events.find(e => e.id === eventId);
        if (!event) return player;

        // Revertir estadística
        const updatedPlayer = { ...player };
        switch (event.type) {
          case 'point':
            updatedPlayer.points = Math.max(0, updatedPlayer.points - 1);
            break;
          case 'assist':
            updatedPlayer.assists = Math.max(0, updatedPlayer.assists - 1);
            break;
          case 'block':
            updatedPlayer.blocks = Math.max(0, updatedPlayer.blocks - 1);
            break;
          case 'drop':
            updatedPlayer.drops = Math.max(0, updatedPlayer.drops - 1);
            break;
          case 'turnover':
            updatedPlayer.turnovers = Math.max(0, updatedPlayer.turnovers - 1);
            break;
          case 'pool':
            updatedPlayer.pools = Math.max(0, updatedPlayer.pools - 1);
            break;
        }

        // Remover evento
        updatedPlayer.events = updatedPlayer.events.filter(e => e.id !== eventId);
        return updatedPlayer;
      }
      return player;
    });

    updateGamePreservingGender({
      players: updatedPlayers
    });
  };

  // Función para manejar selección de equipo en modal de eventos (legacy)
  const handleLegacyTeamSelection = (teamName: string) => {
    setSelectedTeam(teamName);
  };

  // Función para agregar anotación con asistencia
  const addGoalWithAssist = (scorerId: string, assisterId: string) => {
    // Calcular el tiempo transcurrido para el evento
    const timeLimitSeconds = game.config.timeLimitMinutes * 60;
    const elapsedTime = timeLimitSeconds - remainingTime;
    const minute = Math.floor(elapsedTime / 60);
    const second = elapsedTime % 60;
    const timestamp = Date.now();

    // Encontrar los jugadores en la base de datos de equipos
    const selectedTeamData = teams.find(team => team.name === selectedScoringTeam);
    if (!selectedTeamData) return;

    const scorerData = selectedTeamData.players.find(p => p.id === scorerId);
    const assisterData = selectedTeamData.players.find(p => p.id === assisterId);

    if (!scorerData || !assisterData) return;

    // Buscar si los jugadores ya están en el partido
    let scorer = game.players.find(p => p.name === scorerData.name);
    let assister = game.players.find(p => p.name === assisterData.name);

    // Si no están en el partido, agregarlos
    if (!scorer) {
      scorer = {
        id: scorerData.id,
        name: scorerData.name,
        team: selectedScoringTeam,
        points: 0,
        assists: 0,
        drops: 0,
        blocks: 0,
        turnovers: 0,
        pools: 0,
        events: []
      };
    }

    if (!assister) {
      assister = {
        id: assisterData.id,
        name: assisterData.name,
        team: selectedScoringTeam,
        points: 0,
        assists: 0,
        drops: 0,
        blocks: 0,
        turnovers: 0,
        pools: 0,
        events: []
      };
    }

    // Usar el equipo seleccionado para actualizar el marcador
    let scoreAUpdate = game.scoreA;
    let scoreBUpdate = game.scoreB;

    if (selectedScoringTeam === game.teamA) {
      scoreAUpdate = game.scoreA + 1;
    } else if (selectedScoringTeam === game.teamB) {
      scoreBUpdate = game.scoreB + 1;
    }

    // Crear eventos para ambos jugadores
    const scorerEvent: StatEvent = {
      id: `scorer_${timestamp}`,
      playerId: scorerId,
      type: 'point',
      minute,
      second,
      timestamp
    };

    const assisterEvent: StatEvent = {
      id: `assister_${timestamp}`,
      playerId: assisterId,
      type: 'assist',
      minute,
      second,
      timestamp: timestamp + 1 // Un milisegundo después para mantener orden
    };

    // Actualizar jugadores
    let updatedPlayers = [...game.players];
    
    // Actualizar o agregar anotador
    const scorerIndex = updatedPlayers.findIndex(p => p.name === scorerData.name);
    if (scorerIndex >= 0) {
      updatedPlayers[scorerIndex] = {
        ...updatedPlayers[scorerIndex],
        points: updatedPlayers[scorerIndex].points + 1,
        events: [...updatedPlayers[scorerIndex].events, scorerEvent]
      };
    } else {
      updatedPlayers.push({
        ...scorer,
        points: 1,
        events: [scorerEvent]
      });
    }

    // Actualizar o agregar asistidor
    const assisterIndex = updatedPlayers.findIndex(p => p.name === assisterData.name);
    if (assisterIndex >= 0) {
      updatedPlayers[assisterIndex] = {
        ...updatedPlayers[assisterIndex],
        assists: updatedPlayers[assisterIndex].assists + 1,
        events: [...updatedPlayers[assisterIndex].events, assisterEvent]
      };
    } else {
      updatedPlayers.push({
        ...assister,
        assists: 1,
        events: [assisterEvent]
      });
    }

    // Crear el juego actualizado
    updateGamePreservingGender({
      scoreA: scoreAUpdate,
      scoreB: scoreBUpdate,
      players: updatedPlayers,
    });
    setEventModalOpen(false);
    setSelectedEventType(null);
    setSelectedTeam('');
    setSelectedScoringTeam('');
    setSelectedScorer('');
    setSelectedAssister('');
  };

  // Función para agregar evento
  const addEventToPlayer = (playerId: string, eventType: 'point' | 'assist' | 'turnover' | 'block' | 'drop' | 'pool', subType?: 'drop' | 'throw_away') => {
    console.log('addEventToPlayer llamado:', { playerId, eventType, subType });
    
    // Calcular el tiempo transcurrido para el evento
    const timeLimitSeconds = game.config.timeLimitMinutes * 60;
    const elapsedTime = timeLimitSeconds - remainingTime;
    const minute = Math.floor(elapsedTime / 60);
    const second = elapsedTime % 60;
    const timestamp = Date.now();

    // Determinar el tipo de evento final
    let finalEventType: StatEvent['type'] = eventType;
    if (eventType === 'turnover' && subType === 'throw_away') {
      finalEventType = 'throw_away';
    }

    // Variables para actualizar el marcador si es necesario
    let scoreAUpdate = game.scoreA;
    let scoreBUpdate = game.scoreB;

    // Buscar el jugador por ID o por nombre si no se encuentra por ID
    let targetPlayer = game.players.find(player => player.id === playerId);
    
    // Si no se encuentra por ID, buscar por nombre (para casos donde se usa ID de la base de datos)
    if (!targetPlayer) {
      // Buscar en todos los equipos para encontrar el jugador
      for (const team of teams) {
        const dbPlayer = team.players.find(p => p.id === playerId);
        if (dbPlayer) {
          targetPlayer = game.players.find(p => p.name === dbPlayer.name);
          break;
        }
      }
    }

    if (!targetPlayer) {
      console.error('Jugador no encontrado:', playerId);
      console.log('Jugadores disponibles en el partido:', game.players.map(p => ({ id: p.id, name: p.name })));
      console.log('Equipos disponibles:', teams.map(t => ({ name: t.name, players: t.players.map(p => ({ id: p.id, name: p.name })) })));
      return;
    }

    const updatedPlayers = game.players.map(player => {
      if (player.id === targetPlayer!.id) {
        const newEvent: StatEvent = {
          id: timestamp.toString(),
          playerId: targetPlayer.id, // Usar el ID correcto del jugador en el partido
          type: finalEventType,
          minute,
          second,
          timestamp
        };

        // Actualizar las estadísticas correspondientes
        let updatedPlayer = { ...player };
        
        if (eventType === 'point') {
          updatedPlayer.points += 1;
          // Determinar qué equipo anota para actualizar el marcador
          const playerTeam = player.team || getPlayerTeam(player);
          if (playerTeam === game.teamA) {
            scoreAUpdate = game.scoreA + 1;
          } else if (playerTeam === game.teamB) {
            scoreBUpdate = game.scoreB + 1;
          }
        } else if (eventType === 'assist') {
          updatedPlayer.assists += 1;
        } else if (eventType === 'block') {
          updatedPlayer.blocks += 1;
        } else if (eventType === 'drop') {
          updatedPlayer.drops += 1;
        } else if (eventType === 'turnover') {
          updatedPlayer.turnovers += 1;
          if (subType === 'drop') {
            updatedPlayer.drops += 1;
          }
        } else if (eventType === 'pool') {
          updatedPlayer.pools += 1;
        }

        return {
          ...updatedPlayer,
          events: [...updatedPlayer.events, newEvent]
        };
      }
      return player;
    });

    // Crear el juego actualizado con todas las modificaciones
    updateGamePreservingGender({
      scoreA: scoreAUpdate,
      scoreB: scoreBUpdate,
      players: updatedPlayers,
    });
    console.log('Evento registrado exitosamente:', { eventType, finalEventType, playerId: targetPlayer.id });
    setEventModalOpen(false);
    setSelectedEventType(null);
    setSelectedTeam('');
    setSelectedPlayer('');
  };

  // Función helper para obtener el equipo de un jugador
  const getPlayerTeam = (player: Player) => {
    if (player.team) return player.team;
    const playerTeam = gameTeams.find(team => 
      team.players.some(tp => tp.name === player.name)
    );
    return playerTeam?.name || '';
  };

  // Función para obtener jugadores potenciales de la base de datos
  const getPotentialTeamPlayers = (teamName: string) => {
    const team = teams.find(t => t.name === teamName);
    if (!team) return [];
    
    // Retornar jugadores que no han sido agregados al partido
    return team.players.filter(teamPlayer => 
      !game.players.some(gamePlayer => gamePlayer.name === teamPlayer.name)
    );
  };

  // Componente para modal de puntos
  const PointModal = ({ 
    isOpen, 
    onClose, 
    teamName, 
    teamPlayers, 
    selectedGoalScorer,
    setSelectedGoalScorer,
    selectedAssist,
    setSelectedAssist,
    onPointScored 
  }: {
    isOpen: boolean;
    onClose: () => void;
    teamName: string;
    teamPlayers: Player[];
    selectedGoalScorer: string;
    setSelectedGoalScorer: (id: string) => void;
    selectedAssist: string;
    setSelectedAssist: (id: string) => void;
    onPointScored: (goalScorerId: string, assistPlayerId?: string) => void;
  }) => {
    // Resetear estados cuando se abre el modal
    useEffect(() => {
      if (isOpen) {
        // Solo resetear si no hay selecciones previas
        if (!selectedGoalScorer && !selectedAssist) {
          setSelectedGoalScorer('');
          setSelectedAssist('');
        }
      }
    }, [isOpen, setSelectedGoalScorer, setSelectedAssist, selectedGoalScorer, selectedAssist]);

    const handleSubmit = () => {
      if (selectedGoalScorer) {
        // Validar que se haya seleccionado el género del punto en partidos mixtos
        if (game.isMixedGame && !game.currentPointGender) {
          return; // No hacer nada si no se ha seleccionado el género
        }
        onPointScored(selectedGoalScorer, selectedAssist || undefined);
      }
    };

    const handleClose = () => {
      setSelectedGoalScorer('');
      setSelectedAssist('');
      onClose();
    };

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            {getCenteredTitle(`Punto para ${teamName}`)}
            <DialogDescription className="text-center">
              Selecciona quién anotó el gol y quién dio la asistencia (opcional).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {teamPlayers.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  No hay jugadores de {teamName} registrados en el partido.
                </p>
                <Button 
                  onClick={() => {
                    addPoint(teamName === game.teamA ? 'A' : 'B');
                    handleClose();
                  }}
                  className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Agregar Punto Sin Detalles
                </Button>
              </div>
            ) : (
              <>
                {/* Selección de goleador */}
                <div className="space-y-3">
                  <Label className="text-sm text-gray-700">¿Quién anotó el gol? *</Label>
                  {selectedGoalScorer && (
                    <div className="text-xs text-green-600 mb-2">
                      ✓ Seleccionado: {teamPlayers.find(p => p.id === selectedGoalScorer)?.name}
                    </div>
                  )}
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {teamPlayers.map((player) => (
                      <Button
                        key={player.id}
                        variant={selectedGoalScorer === player.id ? "default" : "outline"}
                        className={`w-full justify-start p-3 h-auto transition-colors ${
                          selectedGoalScorer === player.id 
                            ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600' 
                            : 'hover:bg-orange-50 border-gray-200'
                        }`}
                        onClick={() => setSelectedGoalScorer(player.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <div className={selectedGoalScorer === player.id ? 'text-white' : 'text-black'}>
                              {player.name}
                            </div>
                            <div className="text-xs opacity-75">
                              {player.points} goles, {player.assists} asistencias
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Selección de asistidor */}
                <div className="space-y-3">
                  <Label className="text-sm text-gray-700">¿Quién dio la asistencia? (opcional)</Label>
                  {selectedAssist !== undefined && (
                    <div className="text-xs text-green-600 mb-2">
                      ✓ Asistencia: {selectedAssist === '' ? 'Sin asistencia' : teamPlayers.find(p => p.id === selectedAssist)?.name || 'Sin asistencia'}
                    </div>
                  )}
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    <Button
                      variant={selectedAssist === '' ? "default" : "outline"}
                      className={`w-full justify-center transition-colors ${
                        selectedAssist === '' 
                          ? 'bg-gray-500 text-white hover:bg-gray-600' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedAssist('')}
                    >
                      Sin asistencia
                    </Button>
                    
                    {teamPlayers.filter(p => p.id !== selectedGoalScorer).map((player) => (
                      <Button
                        key={player.id}
                        variant={selectedAssist === player.id ? "default" : "outline"}
                        className={`w-full justify-start p-3 h-auto transition-colors ${
                          selectedAssist === player.id 
                            ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' 
                            : 'hover:bg-green-50 border-gray-200'
                        }`}
                        onClick={() => setSelectedAssist(player.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <div className={selectedAssist === player.id ? 'text-white' : 'text-black'}>
                              {player.name}
                            </div>
                            <div className="text-xs opacity-75">
                              {player.points} goles, {player.assists} asistencias
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!selectedGoalScorer || (game.isMixedGame && !game.currentPointGender)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Confirmar Punto
                  </Button>
                </div>

                {/* Contenido de prueba para forzar scroll */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700">Información adicional</h4>
                  <div className="space-y-2">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                        Línea de prueba {i + 1} para verificar el scroll del modal
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alerta para partidos mixtos */}
                {game.isMixedGame && !game.currentPointGender && (
                  <div className="text-amber-600 text-sm p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
                    ⚠️ Primero selecciona el género del punto arriba
                  </div>
                )}

                {/* Opción rápida */}
                <div className="pt-2 border-t">
                  <Button 
                    onClick={() => {
                      addPoint(teamName === game.teamA ? 'A' : 'B');
                      handleClose();
                    }}
                    variant="ghost"
                    className="w-full text-sm text-gray-600 hover:text-gray-800"
                  >
                    O agregar punto sin detalles
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Funciones para manejar cierre de modales de puntos
  const closePointModalA = () => {
    setSelectedGoalScorerA('');
    setSelectedAssistA('');
    setPointDialogTeamA(false);
  };

  const closePointModalB = () => {
    setSelectedGoalScorerB('');
    setSelectedAssistB('');
    setPointDialogTeamB(false);
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
        <Button 
          variant="outline"
          size="sm"
          onClick={() => onNavigate('stats')}
          className="text-black border-gray-300"
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          Stats
        </Button>
      </div>

      {/* Indicador de Perfil */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">{activeProfile === 'planillero' ? '📊' : '🏆'}</div>
            <div className="text-lg font-medium">
              {activeProfile === 'planillero' ? 'Planillero' : 'Coach'}
            </div>
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      <Card className={`border ${remainingTime <= 300 && remainingTime > 0 ? 'border-red-300 bg-red-50' : remainingTime === 0 ? 'border-red-500 bg-red-100' : 'border-gray-200'}`}>
        <CardContent className="py-6 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock className={`w-5 h-5 ${remainingTime <= 300 && remainingTime > 0 ? 'text-red-600' : remainingTime === 0 ? 'text-red-700' : 'text-gray-600'}`} />
              <div className={`text-2xl ${remainingTime <= 300 && remainingTime > 0 ? 'text-red-700' : remainingTime === 0 ? 'text-red-800' : 'text-black'}`}>
                {formatTime(remainingTime)}
              </div>
              {remainingTime <= 300 && remainingTime > 60 && (
                <div className="text-sm text-red-600 animate-pulse">
                  ⚠️ Últimos 5 minutos
                </div>
              )}
              {remainingTime <= 60 && remainingTime > 0 && (
                <div className="text-sm text-red-700 animate-pulse">
                  🚨 Último minuto
                </div>
              )}
              {remainingTime === 0 && (
                <div className="text-sm text-red-800">
                  ⏰ Tiempo agotado
                </div>
              )}
            </div>
            <Button 
              onClick={toggleTimer}
              variant="outline"
              size="sm"
              className={`${isTimerRunning ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'} ${remainingTime === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={remainingTime === 0}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  {remainingTime === 0 ? 'Tiempo Agotado' : 'Reanudar'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scoreboard */}
      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-lg text-black mb-1">{game.teamA}</div>
              <div className="text-4xl text-orange-500">{game.scoreA}</div>
            </div>
            <div className="text-2xl text-gray-400 mx-4">VS</div>
            <div className="text-center flex-1">
              <div className="text-lg text-black mb-1">{game.teamB}</div>
              <div className="text-4xl text-orange-500">{game.scoreB}</div>
            </div>
          </div>
          
          {/* Botón de acción dentro del recuadro */}
          <div className="mt-4 pt-4 border-t border-orange-200">
            <Button 
              onClick={finishGame}
              className="w-full h-10 bg-red-500 hover:bg-red-600 text-white"
            >
              Finalizar Partido
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selector de Género del Punto (Solo para partidos mixtos) */}
        {game.isMixedGame && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">Género del Punto Actual</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => updateGamePreservingGender({ currentPointGender: 'masculino' })}
                variant="outline"
                className={`h-10 transition-all duration-200 ${
                  game.currentPointGender === 'masculino' 
                    ? 'bg-orange-500 text-white border-2 border-orange-600 shadow-lg' 
                    : 'bg-white text-orange-600 border-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">👨</span>
                  <span className="text-sm font-medium">Masculino</span>
                </div>
              </Button>
              <Button
                onClick={() => updateGamePreservingGender({ currentPointGender: 'femenino' })}
                variant="outline"
                className={`h-10 transition-all duration-200 ${
                  game.currentPointGender === 'femenino' 
                    ? 'bg-orange-500 text-white border-2 border-orange-600 shadow-lg' 
                    : 'bg-white text-orange-600 border-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">👩</span>
                  <span className="text-sm font-medium">Femenino</span>
                </div>
              </Button>
            </div>
          </div>
        )}


      {/* Point Modals */}
      <PointModal
        isOpen={pointDialogTeamA}
        onClose={closePointModalA}
        teamName={game.teamA}
        teamPlayers={teamAPlayers}
        selectedGoalScorer={selectedGoalScorerA}
        setSelectedGoalScorer={setSelectedGoalScorerA}
        selectedAssist={selectedAssistA}
        setSelectedAssist={setSelectedAssistA}
        onPointScored={(goalScorerId, assistPlayerId) => 
          addPointWithDetails('A', goalScorerId, assistPlayerId)
        }
      />
      
      <PointModal
        isOpen={pointDialogTeamB}
        onClose={closePointModalB}
        teamName={game.teamB}
        teamPlayers={teamBPlayers}
        selectedGoalScorer={selectedGoalScorerB}
        setSelectedGoalScorer={setSelectedGoalScorerB}
        selectedAssist={selectedAssistB}
        setSelectedAssist={setSelectedAssistB}
        onPointScored={(goalScorerId, assistPlayerId) => 
          addPointWithDetails('B', goalScorerId, assistPlayerId)
        }
      />

      {/* Event Buttons */}
      <div className="space-y-4">
        <h3 className="text-lg text-black">
          Registrar Eventos - {activeProfile === 'planillero' ? 'Planillero' : 'Coach'}
        </h3>
        
        {activeProfile === 'planillero' ? (
          // Perfil Planillero: Solo eventos básicos
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <Button 
                onClick={() => openEventModal('point')}
                variant="default"
                size="lg"
                className="!h-16 !bg-orange-500 hover:!bg-orange-600 !text-white !w-full"
              >
                <div className="text-center">
                  <Target className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-sm font-medium">Anotación</div>
                </div>
              </Button>
              <Button 
                onClick={() => openPlayerSelectionModal('block')}
                variant="default"
                size="lg"
                className="!h-16 !bg-blue-500 hover:!bg-blue-600 !text-white !w-full"
              >
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-sm font-medium">Defensa</div>
                </div>
              </Button>
              <Button 
                onClick={() => openPlayerSelectionModal('turnover')}
                variant="default"
                size="lg"
                className="!h-16 !bg-yellow-500 hover:!bg-yellow-600 !text-white !w-full"
              >
                <div className="text-center">
                  <TrendingDown className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-sm font-medium">Turnover</div>
                </div>
              </Button>
            </div>
          </div>
        ) : (
          // Perfil Coach: Solo para equipo A + anotación de ambos equipos
          <div className="flex justify-center">
            <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
              <Button 
                onClick={() => openCoachPointModal()}
                variant="default"
                size="lg"
                className="!h-20 !bg-orange-500 hover:!bg-orange-600 !text-white !shadow-lg !border-0 !rounded-lg !w-full"
              >
                <div className="text-center w-full">
                  <Target className="w-7 h-7 mx-auto mb-2" />
                  <div className="text-base font-semibold">Anotación</div>
                </div>
              </Button>
              <Button 
                onClick={() => openPlayerSelectionModalCoach('block')}
                variant="default"
                size="lg"
                className="!h-20 !bg-blue-500 hover:!bg-blue-600 !text-white !shadow-lg !border-0 !rounded-lg !w-full"
              >
                <div className="text-center w-full">
                  <Shield className="w-7 h-7 mx-auto mb-2" />
                  <div className="text-base font-semibold">Defensa</div>
                </div>
              </Button>
              <Button 
                onClick={() => openTurnoverTypeModalCoach()}
                variant="default"
                size="lg"
                className="!h-20 !bg-yellow-500 hover:!bg-yellow-600 !text-white !shadow-lg !border-0 !rounded-lg !w-full"
              >
                <div className="text-center w-full">
                  <TrendingDown className="w-7 h-7 mx-auto mb-2" />
                  <div className="text-base font-semibold">Turnover</div>
                </div>
              </Button>
              <Button 
                onClick={() => openPlayerSelectionModalCoach('pool')}
                variant="default"
                size="lg"
                className="!h-20 !bg-purple-500 hover:!bg-purple-600 !text-white !shadow-lg !border-0 !rounded-lg !w-full"
              >
                <div className="text-center w-full">
                  <Zap className="w-7 h-7 mx-auto mb-2" />
                  <div className="text-base font-semibold">Pool</div>
                </div>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Anotación (especial) */}
      <Dialog open={eventModalOpen} onOpenChange={(open: boolean) => {
        if (!open) {
          setEventModalOpen(false);
          setSelectedEventType(null);
          setSelectedTeam('');
          setSelectedPlayer('');
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            {getCenteredTitle('Registrar Anotación')}
            <DialogDescription className="text-center">
              Selecciona el jugador que anota y quien le hizo la asistencia
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Modal especial para anotación (equipo + anotador + asistidor) */}
            <div className="space-y-6">
                {!selectedScoringTeam ? (
                  // Paso 1: Selección de equipo que anota
                  <div className="space-y-3">
                    <Label className="text-sm text-gray-700 font-medium">1. ¿Qué equipo anotó?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => setSelectedScoringTeam(game.teamA)}
                        className="h-16 bg-orange-500 hover:bg-orange-600 text-white"
                        size="lg"
                      >
                        <div className="text-center">
                          <div className="text-lg">{game.teamA}</div>
                          <div className="text-xs opacity-75">
                            {getTeamPlayers(game.teamA).length} jugadores
                          </div>
                        </div>
                      </Button>
                      <Button
                        onClick={() => setSelectedScoringTeam(game.teamB)}
                        className="h-16 bg-orange-500 hover:bg-orange-600 text-white"
                        size="lg"
                      >
                        <div className="text-center">
                          <div className="text-lg">{game.teamB}</div>
                          <div className="text-xs opacity-75">
                            {getTeamPlayers(game.teamB).length} jugadores
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Header con equipo seleccionado */}
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center">
                        <Target className="w-5 h-5 mr-2 text-orange-600" />
                        <span className="font-medium text-orange-800">Equipo: {selectedScoringTeam}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedScoringTeam('')}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        ← Cambiar
                      </Button>
                    </div>

                    {/* Selección de Anotador */}
                    <div className="space-y-3">
                      <Label className="text-sm text-gray-700 font-medium">2. ¿Quién anotó?</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar anotador por número o nombre..."
                          value={scorerSearchQuery}
                          onChange={(e) => setScorerSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {(() => {
                          // Obtener jugadores del equipo seleccionado desde la base de datos
                          const selectedTeamData = teams.find(team => team.name === selectedScoringTeam);
                          if (!selectedTeamData) return null;

                          // Filtrar jugadores por búsqueda
                          const filteredPlayers = selectedTeamData.players.filter(player => {
                            const query = scorerSearchQuery.toLowerCase().trim();
                            if (!query) return true;
                            return player.name.toLowerCase().includes(query) || 
                                   player.number.toString().includes(query);
                          });

                          return filteredPlayers.map((player) => {
                            // Buscar si el jugador ya está en el partido para mostrar sus estadísticas
                            const gamePlayer = game.players.find(gp => gp.name === player.name);
                            const points = gamePlayer?.points || 0;

                            return (
                              <Button
                                key={player.id}
                                onClick={() => setSelectedScorer(player.id)}
                                variant={selectedScorer === player.id ? "default" : "outline"}
                                className={`w-full justify-start h-12 ${
                                  selectedScorer === player.id 
                                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                                    : 'text-black border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="text-left">
                                    <div className="font-medium">{player.name}</div>
                                    <div className="text-xs opacity-75">
                                      #{player.number} • {points} puntos
                                    </div>
                                  </div>
                                  <Target className="w-4 h-4" />
                                </div>
                              </Button>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Selección de Asistidor */}
                    <div className="space-y-3">
                      <Label className="text-sm text-gray-700 font-medium">3. ¿Quién hizo la asistencia?</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar asistidor por número o nombre..."
                          value={assisterSearchQuery}
                          onChange={(e) => setAssisterSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {(() => {
                          // Obtener jugadores del equipo seleccionado desde la base de datos
                          const selectedTeamData = teams.find(team => team.name === selectedScoringTeam);
                          if (!selectedTeamData) return null;

                          // Filtrar jugadores por búsqueda
                          const filteredPlayers = selectedTeamData.players.filter(player => {
                            const query = assisterSearchQuery.toLowerCase().trim();
                            if (!query) return true;
                            return player.name.toLowerCase().includes(query) || 
                                   player.number.toString().includes(query);
                          });

                          return filteredPlayers.map((player) => {
                            // Buscar si el jugador ya está en el partido para mostrar sus estadísticas
                            const gamePlayer = game.players.find(gp => gp.name === player.name);
                            const assists = gamePlayer?.assists || 0;

                            return (
                              <Button
                                key={player.id}
                                onClick={() => setSelectedAssister(player.id)}
                                variant={selectedAssister === player.id ? "default" : "outline"}
                                className={`w-full justify-start h-12 ${
                                  selectedAssister === player.id 
                                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                                    : 'text-black border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="text-left">
                                    <div className="font-medium">{player.name}</div>
                                    <div className="text-xs opacity-75">
                                      #{player.number} • {assists} asistencias
                                    </div>
                                  </div>
                                  <Zap className="w-4 h-4" />
                                </div>
                              </Button>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Botón de confirmación */}
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        onClick={() => addGoalWithAssist(selectedScorer, selectedAssister)}
                        disabled={!selectedScorer || !selectedAssister}
                        className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Target className="w-5 h-5 mr-2" />
                        Registrar Anotación
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-black">Historial de Eventos</h3>
          <Badge variant="outline" className="text-xs">
            {(() => {
              const allEvents = game.players.flatMap(player => player.events);
              return `${allEvents.length} eventos`;
            })()}
          </Badge>
        </div>

        {(() => {
          // Obtener todos los eventos de todos los jugadores y ordenarlos cronológicamente
          const allEvents = game.players
            .flatMap(player => 
              player.events.map(event => ({ 
                ...event, 
                playerName: player.name,
                playerTeam: player.team || getPlayerTeam(player)
              }))
            )
            .sort((a, b) => b.timestamp - a.timestamp); // Más recientes primero

          const formatEventTime = (minute: number, second: number) => {
            return `${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
          };

          const getEventIcon = (type: string) => {
            switch (type) {
              case 'point': return <Target className="w-4 h-4" />;
              case 'assist': return <Zap className="w-4 h-4" />;
              case 'block': return <Shield className="w-4 h-4" />;
              case 'drop': return <X className="w-4 h-4" />;
              case 'turnover': return <TrendingDown className="w-4 h-4" />;
              case 'throw_away': return <TrendingDown className="w-4 h-4" />;
              case 'pool': return <Zap className="w-4 h-4" />;
              default: return null;
            }
          };

          const getEventColor = (type: string) => {
            switch (type) {
              case 'point': return 'text-orange-600 bg-orange-50 border-orange-200';
              case 'assist': return 'text-green-600 bg-green-50 border-green-200';
              case 'block': return 'text-blue-600 bg-blue-50 border-blue-200';
              case 'drop': return 'text-gray-600 bg-gray-50 border-gray-200';
              case 'turnover': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
              case 'throw_away': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
              case 'pool': return 'text-purple-600 bg-purple-50 border-purple-200';
              default: return 'text-gray-600 bg-gray-50 border-gray-200';
            }
          };

          const getEventLabel = (type: string) => {
            switch (type) {
              case 'point': return 'Gol';
              case 'assist': return 'Asistencia';
              case 'block': return 'Defensa';
              case 'drop': return 'Drop';
              case 'turnover': return 'Turnover';
              case 'throw_away': return 'Throw Away';
              case 'pool': return 'Pool';
              default: return type;
            }
          };

          if (allEvents.length === 0) {
            return (
              <Card className="border border-gray-200">
                <CardContent className="p-6 text-center">
                  <Target className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay eventos registrados</p>
                  <p className="text-sm text-gray-400">Los eventos aparecerán aquí durante el partido</p>
                </CardContent>
              </Card>
            );
          }

          return (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allEvents.map((event, index) => (
                <div 
                  key={`${event.id}-${index}`} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${getEventColor(event.type)}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{event.playerName}</div>
                      <div className="text-xs opacity-75">
                        {getEventLabel(event.type)} • {event.playerTeam}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatEventTime(event.minute, event.second)}</div>
                      <div className="text-xs opacity-75">
                        {new Date(event.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <Button
                      onClick={() => removeEvent(event.id, event.playerId)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Modal Estandarizado para Otros Eventos */}
      <Dialog open={playerSelectionModalOpen} onOpenChange={(open: boolean) => {
        if (!open) {
          setPlayerSelectionModalOpen(false);
          setCurrentSelectedTeam('');
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            {getCenteredTitle(`Registrar ${currentEventType === 'block' ? 'Defensa' : currentEventType === 'drop' ? 'Drop' : 'Turnover'}`)}
            <DialogDescription className="text-center">
              {!currentSelectedTeam 
                ? 'Paso 1 de 2: Selecciona el equipo'
                : 'Paso 2 de 2: Selecciona el jugador'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!currentSelectedTeam ? (
              // Paso 1: Selección de equipo (solo si no es Coach)
              <div className="space-y-3">
                <Label className="text-sm text-gray-700 font-medium">¿De qué equipo es el evento?</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setCurrentSelectedTeam(game.teamA)}
                    className="h-16 bg-orange-500 hover:bg-orange-600 text-white"
                    size="lg"
                  >
                    <div className="text-center">
                      <div className="text-lg">{game.teamA}</div>
                      <div className="text-xs opacity-75">
                        {getTeamPlayers(game.teamA).length} jugadores
                      </div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => setCurrentSelectedTeam(game.teamB)}
                    className="h-16 bg-orange-500 hover:bg-orange-600 text-white"
                    size="lg"
                  >
                    <div className="text-center">
                      <div className="text-lg">{game.teamB}</div>
                      <div className="text-xs opacity-75">
                        {getTeamPlayers(game.teamB).length} jugadores
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              // Paso 2: Selección de jugador
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-700 font-medium">
                    Jugadores de {currentSelectedTeam}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentSelectedTeam('')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← Cambiar equipo
                  </Button>
                </div>

                {(() => {
                  // Obtener jugadores del equipo desde la base de datos
                  const teamFromDatabase = teams.find(t => t.name === currentSelectedTeam);
                  const allTeamPlayers = teamFromDatabase ? teamFromDatabase.players : [];

                  if (allTeamPlayers.length === 0) {
                    return (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600 text-center">
                          No se encontraron jugadores para el equipo {currentSelectedTeam}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {allTeamPlayers.map((dbPlayer) => {
                        const playerInGame = game.players.find(p => p.name === dbPlayer.name);
                        
                        return (
                          <Button
                            key={dbPlayer.id}
                            variant="outline"
                            className="w-full justify-start p-3 h-auto hover:bg-orange-50 border-gray-200"
                            onClick={() => handlePlayerSelection(dbPlayer.id, currentEventType)}
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">
                                {dbPlayer.number}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="text-black flex items-center gap-2">
                                  {dbPlayer.name}
                                  {!playerInGame && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                      Agregar al partido
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {playerInGame ? (
                                    `${playerInGame.points} pts, ${playerInGame.assists} ast, ${playerInGame.blocks} blk`
                                  ) : (
                                    `#${dbPlayer.number} - ${dbPlayer.position}`
                                  )}
                                </div>
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Evento */}
      <Dialog open={confirmationModalOpen} onOpenChange={(open: boolean) => {
        if (!open) {
          setConfirmationModalOpen(false);
          setPendingEvent(null);
        }
      }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {pendingEvent?.type === 'block' && <Shield className="w-5 h-5 mr-2 text-blue-500" />}
              {pendingEvent?.type === 'drop' && <X className="w-5 h-5 mr-2 text-gray-500" />}
              {pendingEvent?.type === 'turnover' && <TrendingDown className="w-5 h-5 mr-2 text-yellow-500" />}
              Confirmar Evento
            </DialogTitle>
            <DialogDescription>
              Revisa los detalles antes de registrar el evento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pb-20">
            {pendingEvent && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Jugador:</span>
                    <span className="text-sm text-gray-900">{pendingEvent.playerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Equipo:</span>
                    <span className="text-sm text-gray-900">{pendingEvent.team}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Evento:</span>
                    <span className="text-sm text-gray-900">
                      {pendingEvent.type === 'block' ? 'Defensa' : 
                       pendingEvent.type === 'drop' ? 'Drop' : 
                       pendingEvent.type === 'turnover' ? 'Turnover' : 
                       pendingEvent.type}
                    </span>
                  </div>
                  {pendingEvent.subType && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Tipo:</span>
                      <span className="text-sm text-gray-900">
                        {pendingEvent.subType === 'drop' ? 'Drop del Receptor' : 'Throw Away del Lanzador'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Botones de acción */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              onClick={cancelEvent}
              variant="outline"
              className="flex-1 h-12"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmEvent}
              className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white"
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Tipo de Turnover */}
      <Dialog open={turnoverTypeModalOpen} onOpenChange={(open: boolean) => {
        if (!open) {
          setTurnoverTypeModalOpen(false);
          setSelectedTurnoverType(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {getCenteredTitle('Tipo de Turnover')}
            <DialogDescription className="text-center">
              {activeProfile === 'coach' 
                ? `Especifica qué tipo de turnover ocurrió en ${game.teamA}`
                : 'Especifica qué tipo de turnover ocurrió'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => activeProfile === 'coach' 
                  ? handleTurnoverTypeSelectionCoach('drop')
                  : handleTurnoverTypeSelection('drop')
                }
                className="h-16 bg-gray-500 hover:bg-gray-600 text-white"
                size="lg"
              >
                <div className="text-center">
                  <X className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-sm font-medium">Drop del Receptor</div>
                  <div className="text-xs opacity-75">El receptor no atrapó el disco</div>
                </div>
              </Button>
              <Button
                onClick={() => activeProfile === 'coach' 
                  ? handleTurnoverTypeSelectionCoach('throw_away')
                  : handleTurnoverTypeSelection('throw_away')
                }
                className="h-16 bg-red-500 hover:bg-red-600 text-white"
                size="lg"
              >
                <div className="text-center">
                  <TrendingDown className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-sm font-medium">Throw Away del Lanzador</div>
                  <div className="text-xs opacity-75">El lanzador perdió el disco</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Anotación del Coach */}
      <Dialog open={coachPointModalOpen} onOpenChange={(open: boolean) => {
        if (!open) {
          setCoachPointModalOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {getCenteredTitle('Registrar Anotación')}
            <DialogDescription className="text-center">
              Selecciona qué equipo anotó
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  setCoachPointModalOpen(false);
                  openEventModal('point');
                }}
                disabled={game.isMixedGame && !game.currentPointGender}
                className="h-20 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                <div className="text-center">
                  <div className="text-lg font-medium">{game.teamA}</div>
                </div>
              </Button>

              <Button
                onClick={addCoachTeamBPoint}
                disabled={game.isMixedGame && !game.currentPointGender}
                className="h-20 bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                <div className="text-center">
                  <div className="text-lg font-medium">{game.teamB}</div>
                </div>
              </Button>
            </div>

            {/* Alerta para partidos mixtos */}
            {game.isMixedGame && !game.currentPointGender && (
              <div className="text-amber-600 text-sm p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
                ⚠️ Primero selecciona el género del punto arriba
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Especial de Pool */}
      <Dialog open={poolModalOpen} onOpenChange={(open: boolean) => {
        if (!open) {
          setPoolModalOpen(false);
          resetPoolTimer();
        }
      }}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto mx-4 p-6">
          <DialogHeader className="pb-4">
            {getCenteredTitle('Registrar Pool')}
            <DialogDescription className="text-center text-sm sm:text-base">
              Selecciona el jugador que lanzará el pool y cronometra el tiempo en el aire
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pb-6">
            {/* Selección de Jugador */}
            {!selectedPoolPlayer ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Label className="text-sm font-medium text-gray-700">Selecciona el jugador que lanzará el pool</Label>
                  <Button
                    onClick={() => {
                      setPoolModalOpen(false);
                      setPlayerSelectionModalOpen(true);
                      setCurrentEventType('pool');
                      setCurrentSelectedTeam(game.teamA);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 w-full sm:w-auto"
                  >
                    + Agregar Jugador
                  </Button>
                </div>
                <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                  {teamAPlayers.length > 0 ? (
                    teamAPlayers.map((player) => (
                      <Button
                        key={player.id}
                        variant="outline"
                        className="w-full justify-start p-3 sm:p-4 h-auto hover:bg-orange-50 border-orange-200"
                        onClick={() => setSelectedPoolPlayer(player.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <div className="font-medium text-sm sm:text-base truncate">{player.name}</div>
                            <div className="text-xs text-gray-500">
                              {player.pools} pools • {player.points} goles, {player.assists} asistencias
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-lg mb-2">⚠️</div>
                      <div className="font-medium">No hay jugadores disponibles</div>
                      <div className="text-sm">Haz clic en "Agregar Jugador" para registrar jugadores del equipo {game.teamA}</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Jugador Seleccionado */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-500 text-white rounded-full flex items-center justify-center text-lg font-medium">
                      {(() => {
                        const player = teamAPlayers.find(p => p.id === selectedPoolPlayer);
                        console.log('Pool Modal - selectedPoolPlayer:', selectedPoolPlayer);
                        console.log('Pool Modal - teamAPlayers:', teamAPlayers);
                        console.log('Pool Modal - player encontrado:', player);
                        return player?.name.charAt(0).toUpperCase() || '?';
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-base sm:text-lg truncate">
                        {(() => {
                          const player = teamAPlayers.find(p => p.id === selectedPoolPlayer);
                          return player?.name || 'Jugador no encontrado';
                        })()}
                      </div>
                      <div className="text-sm text-orange-600">Jugador seleccionado</div>
                    </div>
                  </div>
                </div>

                {/* Cronómetro */}
                <div className="text-center space-y-4">
                  <div className="text-4xl sm:text-6xl font-mono font-bold text-orange-600">
                    {formatPoolTime(poolTimer)}
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={togglePoolTimer}
                      onMouseDown={startPoolTimer}
                      onMouseUp={stopPoolTimer}
                      onMouseLeave={stopPoolTimer}
                      onTouchStart={startPoolTimer}
                      onTouchEnd={stopPoolTimer}
                      className={`w-full h-16 sm:h-20 text-lg sm:text-xl font-bold shadow-lg border-0 rounded-lg ${
                        isPoolTimerRunning 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                      disabled={false}
                    >
                      {isPoolTimerRunning ? 'PARAR CRONOMETRO' : 'INICIAR CRONOMETRO'}
                    </Button>
                    
                    {poolTimer > 0 && (
                      <Button
                        onClick={resetPoolTimer}
                        variant="outline"
                        className="w-full h-12 border-orange-200 text-orange-600 hover:bg-orange-50 shadow-md rounded-lg"
                      >
                        Reiniciar Cronómetro
                      </Button>
                    )}
                  </div>
                </div>

                {/* Confirmación de Resultado */}
                {poolTimer > 0 && !isPoolTimerRunning && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">¿El disco quedó dentro o fuera de la cancha?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => confirmPoolResult('in')}
                        className="h-16 bg-green-500 hover:bg-green-600 text-white shadow-lg border-0 rounded-lg"
                        size="lg"
                      >
                        <div className="text-center w-full">
                          <div className="text-2xl mb-1">✅</div>
                          <div className="text-sm font-semibold">Dentro</div>
                        </div>
                      </Button>
                      <Button
                        onClick={() => confirmPoolResult('out')}
                        className="h-16 bg-red-500 hover:bg-red-600 text-white shadow-lg border-0 rounded-lg"
                        size="lg"
                      >
                        <div className="text-center w-full">
                          <div className="text-2xl mb-1">❌</div>
                          <div className="text-sm font-semibold">Fuera</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}