import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { GameScreen } from './components/GameScreen';
import { StatsScreen } from './components/StatsScreen';
import { TeamsScreen } from './components/TeamsScreen';
import { AuthModal } from './components/AuthModal';
import { useAuth, useTeams, useGames } from './hooks/useSupabase';

export interface StatEvent {
  id: string;
  playerId: string;
  type: 'point' | 'assist' | 'drop' | 'block' | 'turnover' | 'throw_away' | 'pool';
  minute: number;
  second: number;
  timestamp: number;
  // Campos especiales para Pool
  poolDuration?: number;
  poolResult?: 'in' | 'out';
}

export interface GameConfig {
  targetPoints: number;
  timeLimitMinutes: number;
  softCapMinutes: number;
  hardCapMinutes: number;
  halftimePoints: number;
  halftimeMinutes: number;
  timeoutDurationSeconds: number;
  timeoutsPerTeam: number;
}

export interface Player {
  id: string;
  name: string;
  team?: string; // Agregado para identificar a qué equipo pertenece
  points: number;
  assists: number;
  drops: number;
  blocks: number;
  turnovers: number;
  pools: number;
  events: StatEvent[];
}

export interface TeamPlayer {
  id: string;
  name: string;
  number: number;
  position: string;
}

export interface Team {
  id: string;
  name: string;
  city: string;
  logo?: string;
  players: TeamPlayer[];
  founded: number;
  coach: string;
  category: 'masculina' | 'femenina' | 'mixta';
}

export interface Game {
  id: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  date: string;
  isActive: boolean;
  players: Player[];
  startTime?: number;
  gameTimeElapsed: number;
  config: GameConfig;
  softCapReached: boolean;
  hardCapReached: boolean;
  isHalftime: boolean;
  profile: 'planillero' | 'coach';
  isMixedGame: boolean;
  currentPointGender?: 'masculino' | 'femenino';
}

export type Screen = 'home' | 'game' | 'stats' | 'teams';

// Datos simulados de equipos
const mockTeamsData: Team[] = [
  {
    id: '1',
    name: 'Thunderbirds',
    city: 'Buenos Aires',
    founded: 2018,
    coach: 'María González',
    category: 'mixta',
    players: [
      { id: '1', name: 'Carlos Mendez', number: 7, position: 'Handler' },
      { id: '2', name: 'Ana Rodriguez', number: 23, position: 'Cutter' },
      { id: '3', name: 'Diego Silva', number: 11, position: 'Deep' },
      { id: '4', name: 'Lucía Torres', number: 15, position: 'Handler' },
      { id: '5', name: 'Martín López', number: 8, position: 'Hybrid' },
      { id: '6', name: 'Sofía Herrera', number: 31, position: 'Cutter' },
      { id: '7', name: 'Andrés Morales', number: 42, position: 'Deep' },
    ]
  },
  {
    id: '2',
    name: 'Lightning',
    city: 'Córdoba',
    founded: 2020,
    coach: 'Roberto Fernández',
    category: 'femenina',
    players: [
      { id: '8', name: 'Valentina Castro', number: 9, position: 'Handler' },
      { id: '9', name: 'Joaquín Romero', number: 14, position: 'Cutter' },
      { id: '10', name: 'Camila Vega', number: 26, position: 'Deep' },
      { id: '11', name: 'Sebastián Ruiz', number: 3, position: 'Hybrid' },
      { id: '12', name: 'Isabella Paz', number: 17, position: 'Handler' },
      { id: '13', name: 'Federico Blanco', number: 33, position: 'Cutter' },
    ]
  },
  {
    id: '3',
    name: 'Storm Riders',
    city: 'Rosario',
    founded: 2016,
    coach: 'Elena Vargas',
    category: 'masculina',
    players: [
      { id: '14', name: 'Tomás Jiménez', number: 21, position: 'Handler' },
      { id: '15', name: 'Agustina Cruz', number: 12, position: 'Cutter' },
      { id: '16', name: 'Nicolás Ramos', number: 5, position: 'Deep' },
      { id: '17', name: 'Florencia Díaz', number: 29, position: 'Hybrid' },
      { id: '18', name: 'Maximiliano Soto', number: 16, position: 'Handler' },
    ]
  },
  {
    id: '4',
    name: 'Wind Runners',
    city: 'Mendoza',
    founded: 2019,
    coach: 'Luis Martínez',
    category: 'mixta',
    players: [
      { id: '19', name: 'Gabriela Acosta', number: 10, position: 'Handler' },
      { id: '20', name: 'Emiliano Gutiérrez', number: 22, position: 'Cutter' },
      { id: '21', name: 'Valeria Navarro', number: 18, position: 'Deep' },
      { id: '22', name: 'Santiago Molina', number: 6, position: 'Hybrid' },
      { id: '23', name: 'Renata Espinoza', number: 27, position: 'Cutter' },
      { id: '24', name: 'Ignacio Paredes', number: 4, position: 'Deep' },
    ]
  }
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Hooks de Supabase
  const { user, loading: authLoading } = useAuth();
  const { teams, loading: teamsLoading, createTeam, updateTeam, deleteTeam } = useTeams();
  const { games, loading: gamesLoading, createGame, updateGame, deleteGame } = useGames();

  // Datos simulados para equipos (mantener compatibilidad)
  const allTeams = [...mockTeamsData, ...teams];

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const addTeam = async (newTeam: Team) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    const { error } = await createTeam(newTeam);
    if (error) {
      console.error('Error creating team:', error);
      // Aquí podrías mostrar un toast de error
    }
  };

  const startNewGame = async (teamA: string, teamB: string, config: GameConfig, profile: 'planillero' | 'coach') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Verificar si alguno de los equipos es mixto
    const teamAData = allTeams.find(team => team.name === teamA);
    const teamBData = allTeams.find(team => team.name === teamB);
    const isMixedGame = teamAData?.category === 'mixta' || teamBData?.category === 'mixta';
    
    const newGame: Omit<Game, 'id'> = {
      teamA,
      teamB,
      scoreA: 0,
      scoreB: 0,
      date: new Date().toISOString().split('T')[0],
      isActive: true,
      players: [],
      gameTimeElapsed: 0,
      config,
      softCapReached: false,
      hardCapReached: false,
      isHalftime: false,
      profile,
      isMixedGame,
      currentPointGender: undefined
    };
    
    const { data, error } = await createGame(newGame);
    if (error) {
      console.error('Error creating game:', error);
      // Aquí podrías mostrar un toast de error
    } else if (data) {
      // Convertir el juego creado al formato esperado
      const createdGame: Game = {
        id: data.id,
        ...newGame
      };
      setActiveGame(createdGame);
      setCurrentScreen('game');
    }
  };

  const handleUpdateGame = async (updatedGame: Game) => {
    const { error } = await updateGame(updatedGame.id, updatedGame);
    if (error) {
      console.error('Error updating game:', error);
      // Aquí podrías mostrar un toast de error
    } else {
      setActiveGame(updatedGame);
    }
  };

  const selectGame = (game: Game) => {
    setActiveGame(game);
  };

  // Mostrar loading mientras se cargan los datos
  if (authLoading || teamsLoading || gamesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === 'home' && (
        <HomeScreen 
          games={games}
          teams={allTeams}
          onNavigate={navigateTo}
          onStartNewGame={startNewGame}
          onSelectGame={selectGame}
          user={user}
          onShowAuth={() => setShowAuthModal(true)}
        />
      )}
      
      {currentScreen === 'game' && activeGame && (
        <GameScreen 
          game={activeGame}
          teams={allTeams}
          onNavigate={navigateTo}
          onUpdateGame={handleUpdateGame}
        />
      )}
      
      {currentScreen === 'stats' && activeGame && (
        <StatsScreen 
          game={activeGame}
          onNavigate={navigateTo}
        />
      )}
      
      {currentScreen === 'teams' && (
        <TeamsScreen 
          teams={teams}
          onNavigate={navigateTo}
          onAddTeam={addTeam}
          user={user}
          onShowAuth={() => setShowAuthModal(true)}
        />
      )}

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}