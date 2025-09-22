-- Ultimate Frisbee Stats App - Database Schema
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  logo TEXT,
  founded INTEGER,
  coach TEXT,
  category TEXT CHECK (category IN ('masculina', 'femenina', 'mixta')) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de jugadores de equipos
CREATE TABLE IF NOT EXISTS team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number INTEGER,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de partidos
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  score_a INTEGER DEFAULT 0,
  score_b INTEGER DEFAULT 0,
  date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  start_time TIMESTAMP WITH TIME ZONE,
  game_time_elapsed INTEGER DEFAULT 0,
  config JSONB NOT NULL,
  soft_cap_reached BOOLEAN DEFAULT false,
  hard_cap_reached BOOLEAN DEFAULT false,
  is_halftime BOOLEAN DEFAULT false,
  profile TEXT CHECK (profile IN ('planillero', 'coach')) NOT NULL,
  is_mixed_game BOOLEAN DEFAULT false,
  current_point_gender TEXT CHECK (current_point_gender IN ('masculino', 'femenino')),
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de jugadores en partidos
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES team_players(id),
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  drops INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  turnovers INTEGER DEFAULT 0,
  pools INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de eventos de estadísticas
CREATE TABLE IF NOT EXISTS stat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES game_players(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('point', 'assist', 'drop', 'block', 'turnover', 'throw_away', 'pool')),
  minute INTEGER NOT NULL,
  second INTEGER NOT NULL,
  timestamp BIGINT NOT NULL,
  pool_duration INTEGER,
  pool_result TEXT CHECK (pool_result IN ('in', 'out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
CREATE INDEX IF NOT EXISTS idx_games_is_active ON games(is_active);
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_team ON game_players(team);
CREATE INDEX IF NOT EXISTS idx_stat_events_game_id ON stat_events(game_id);
CREATE INDEX IF NOT EXISTS idx_stat_events_player_id ON stat_events(player_id);
CREATE INDEX IF NOT EXISTS idx_stat_events_type ON stat_events(type);

-- Funciones para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_players_updated_at BEFORE UPDATE ON team_players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_players_updated_at BEFORE UPDATE ON game_players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_events ENABLE ROW LEVEL SECURITY;

-- Política para usuarios: solo pueden ver y modificar sus propios datos
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Política para equipos: usuarios pueden ver todos los equipos, pero solo modificar los suyos
CREATE POLICY "Anyone can view teams" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own teams" ON teams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own teams" ON teams
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own teams" ON teams
    FOR DELETE USING (auth.uid() = created_by);

-- Política para jugadores de equipos: hereda del equipo
CREATE POLICY "Anyone can view team players" ON team_players
    FOR SELECT USING (true);

CREATE POLICY "Users can insert team players for own teams" ON team_players
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_players.team_id 
            AND teams.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update team players for own teams" ON team_players
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_players.team_id 
            AND teams.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete team players for own teams" ON team_players
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_players.team_id 
            AND teams.created_by = auth.uid()
        )
    );

-- Política para partidos: usuarios pueden ver todos, pero solo modificar los suyos
CREATE POLICY "Anyone can view games" ON games
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own games" ON games
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own games" ON games
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own games" ON games
    FOR DELETE USING (auth.uid() = created_by);

-- Política para jugadores de partidos: hereda del partido
CREATE POLICY "Anyone can view game players" ON game_players
    FOR SELECT USING (true);

CREATE POLICY "Users can insert game players for own games" ON game_players
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = game_players.game_id 
            AND games.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update game players for own games" ON game_players
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = game_players.game_id 
            AND games.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete game players for own games" ON game_players
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = game_players.game_id 
            AND games.created_by = auth.uid()
        )
    );

-- Política para eventos de estadísticas: hereda del partido
CREATE POLICY "Anyone can view stat events" ON stat_events
    FOR SELECT USING (true);

CREATE POLICY "Users can insert stat events for own games" ON stat_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = stat_events.game_id 
            AND games.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update stat events for own games" ON stat_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = stat_events.game_id 
            AND games.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete stat events for own games" ON stat_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = stat_events.game_id 
            AND games.created_by = auth.uid()
        )
    );

-- Función para obtener estadísticas de un jugador
CREATE OR REPLACE FUNCTION get_player_stats(player_uuid UUID, game_uuid UUID)
RETURNS TABLE (
    points INTEGER,
    assists INTEGER,
    drops INTEGER,
    blocks INTEGER,
    turnovers INTEGER,
    pools INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN se.type = 'point' THEN 1 ELSE 0 END), 0)::INTEGER as points,
        COALESCE(SUM(CASE WHEN se.type = 'assist' THEN 1 ELSE 0 END), 0)::INTEGER as assists,
        COALESCE(SUM(CASE WHEN se.type = 'drop' THEN 1 ELSE 0 END), 0)::INTEGER as drops,
        COALESCE(SUM(CASE WHEN se.type = 'block' THEN 1 ELSE 0 END), 0)::INTEGER as blocks,
        COALESCE(SUM(CASE WHEN se.type IN ('turnover', 'throw_away') THEN 1 ELSE 0 END), 0)::INTEGER as turnovers,
        COALESCE(SUM(CASE WHEN se.type = 'pool' THEN 1 ELSE 0 END), 0)::INTEGER as pools
    FROM stat_events se
    WHERE se.player_id = player_uuid AND se.game_id = game_uuid;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de un equipo en un partido
CREATE OR REPLACE FUNCTION get_team_stats(team_name TEXT, game_uuid UUID)
RETURNS TABLE (
    points INTEGER,
    assists INTEGER,
    drops INTEGER,
    blocks INTEGER,
    turnovers INTEGER,
    pools INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN se.type = 'point' THEN 1 ELSE 0 END), 0)::INTEGER as points,
        COALESCE(SUM(CASE WHEN se.type = 'assist' THEN 1 ELSE 0 END), 0)::INTEGER as assists,
        COALESCE(SUM(CASE WHEN se.type = 'drop' THEN 1 ELSE 0 END), 0)::INTEGER as drops,
        COALESCE(SUM(CASE WHEN se.type = 'block' THEN 1 ELSE 0 END), 0)::INTEGER as blocks,
        COALESCE(SUM(CASE WHEN se.type IN ('turnover', 'throw_away') THEN 1 ELSE 0 END), 0)::INTEGER as turnovers,
        COALESCE(SUM(CASE WHEN se.type = 'pool' THEN 1 ELSE 0 END), 0)::INTEGER as pools
    FROM stat_events se
    JOIN game_players gp ON se.player_id = gp.id
    WHERE gp.team = team_name AND se.game_id = game_uuid;
END;
$$ LANGUAGE plpgsql;
