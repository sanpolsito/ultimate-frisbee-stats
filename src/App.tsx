import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { GameScreen } from './components/GameScreen';
import { StatsScreen } from './components/StatsScreen';
import { TeamsScreen } from './components/TeamsScreen';
import { AuthModal } from './components/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
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

  // Detectar modo desarrollo - solo en localhost
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost');
  
  // Verificar si Supabase está configurado correctamente
  const supabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  // Debug: Log del entorno para verificar en producción
  console.log('🔍 Environment Debug:', {
    hostname: window.location.hostname,
    isDevelopment,
    supabaseConfigured,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'present' : 'missing',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing'
  });
  
  // Hooks de Supabase (solo si está configurado)
  let supabaseAuth, supabaseTeams, supabaseGames;
  
  try {
    if (supabaseConfigured) {
      supabaseAuth = useAuth();
      supabaseTeams = useTeams();
      supabaseGames = useGames();
    } else {
      supabaseAuth = { user: null, loading: false, signIn: () => {}, signUp: () => {}, signOut: () => {} };
      supabaseTeams = { teams: [], loading: false, createTeam: () => {}, updateTeam: () => {}, deleteTeam: () => {}, refetch: () => {} };
      supabaseGames = { games: [], loading: false, createGame: () => {}, updateGame: () => {}, deleteGame: () => {}, refetch: () => {} };
    }
  } catch (error) {
    console.error('Error initializing Supabase hooks:', error);
    supabaseAuth = { user: null, loading: false, signIn: () => {}, signUp: () => {}, signOut: () => {} };
    supabaseTeams = { teams: [], loading: false, createTeam: () => {}, updateTeam: () => {}, deleteTeam: () => {}, refetch: () => {} };
    supabaseGames = { games: [], loading: false, createGame: () => {}, updateGame: () => {}, deleteGame: () => {}, refetch: () => {} };
  }
  
  // Datos locales para desarrollo
  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  const [localGames, setLocalGames] = useState<Game[]>([]);
  
  // Usar datos según el modo - fallback a modo local si no está en localhost O si Supabase no está configurado
  const shouldUseSupabase = !isDevelopment && supabaseConfigured;
  const user = shouldUseSupabase ? supabaseAuth.user : null;
  const teams = shouldUseSupabase ? supabaseTeams.teams : localTeams;
  const games = shouldUseSupabase ? supabaseGames.games : localGames;
  const teamsLoading = shouldUseSupabase ? supabaseTeams.loading : false;
  const gamesLoading = shouldUseSupabase ? supabaseGames.loading : false;
  
  // Debug adicional
  console.log('🔧 App State:', {
    shouldUseSupabase,
    user: user ? 'authenticated' : 'not authenticated',
    teamsCount: teams.length,
    gamesCount: games.length
  });

  // Datos simulados para equipos (mantener compatibilidad)
  const allTeams = [...mockTeamsData, ...teams];

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const addTeam = async (newTeam: Team) => {
    if (!shouldUseSupabase) {
      // Modo desarrollo o Supabase no configurado - datos locales
      setLocalTeams(prev => [newTeam, ...prev]);
      console.log('Equipo agregado (modo local):', newTeam);
    } else {
      // Modo producción - Supabase
      if (!user) {
        setShowAuthModal(true);
        return;
      }
      const { error } = await supabaseTeams.createTeam(newTeam);
      if (error) {
        console.error('Error creating team:', error);
      }
    }
  };

  const startNewGame = async (teamA: string, teamB: string, config: GameConfig, profile: 'planillero' | 'coach') => {
    const teamAData = allTeams.find(team => team.name === teamA);
    const teamBData = allTeams.find(team => team.name === teamB);
    const isMixedGame = teamAData?.category === 'mixta' || teamBData?.category === 'mixta';
    
    const newGame: Game = {
      id: Date.now().toString(),
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
    
    if (!shouldUseSupabase) {
      // Modo desarrollo o Supabase no configurado - datos locales
      setLocalGames(prev => [newGame, ...prev]);
      setActiveGame(newGame);
      setCurrentScreen('game');
      console.log('Partido creado (modo local):', newGame);
    } else {
      // Modo producción - Supabase
      if (!user) {
        setShowAuthModal(true);
        return;
      }
      const { data, error } = await supabaseGames.createGame(newGame);
      if (error) {
        console.error('Error creating game:', error);
      } else if (data) {
        const createdGame: Game = {
          ...newGame,
          id: data.id
        };
        setActiveGame(createdGame);
        setCurrentScreen('game');
      }
    }
  };

  const handleUpdateGame = async (updatedGame: Game) => {
    if (!shouldUseSupabase) {
      // Modo desarrollo o Supabase no configurado - datos locales
      setLocalGames(prev => prev.map(game => 
        game.id === updatedGame.id ? updatedGame : game
      ));
      setActiveGame(updatedGame);
      console.log('Partido actualizado (modo local):', updatedGame);
    } else {
      // Modo producción - Supabase
      const { error } = await supabaseGames.updateGame(updatedGame.id, updatedGame);
      if (error) {
        console.error('Error updating game:', error);
      } else {
        setActiveGame(updatedGame);
      }
    }
  };

  const selectGame = (game: Game) => {
    setActiveGame(game);
  };

  // Mostrar loading mientras se cargan los datos
  if (teamsLoading || gamesLoading) {
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
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Indicador de modo */}
        {!shouldUseSupabase && (
          <div className="bg-yellow-500 text-black text-center py-2 text-sm font-medium">
            🚧 MODO LOCAL - Datos locales {isDevelopment ? '(desarrollo)' : '(Supabase no configurado)'}
          </div>
        )}
        
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
    </ErrorBoundary>
  );
}