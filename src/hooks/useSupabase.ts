import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Game, Team, Player, StatEvent, TeamPlayer } from '../App'

// Hook para manejar autenticación
export const useAuth = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
      }
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((error) => {
      console.error('Error in getSession:', error)
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }
}

// Hook para manejar equipos
export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_players (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedTeams: Team[] = data?.map(team => ({
        id: team.id,
        name: team.name,
        city: team.city || '',
        logo: team.logo || undefined,
        founded: team.founded || 0,
        coach: team.coach || '',
        category: team.category,
        players: team.team_players?.map((player: any) => ({
          id: player.id,
          name: player.name,
          number: player.number || 0,
          position: player.position || ''
        })) || []
      })) || []

      setTeams(formattedTeams)
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async (team: Omit<Team, 'id'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: team.name,
          city: team.city,
          logo: team.logo,
          founded: team.founded,
          coach: team.coach,
          category: team.category,
          created_by: userData.user.id
        })
        .select()
        .single()

      if (error) throw error

      // Crear jugadores del equipo
      if (team.players.length > 0) {
        const playersData = team.players.map(player => ({
          team_id: data.id,
          name: player.name,
          number: player.number,
          position: player.position
        }))

        const { error: playersError } = await supabase
          .from('team_players')
          .insert(playersData)

        if (playersError) throw playersError
      }

      await fetchTeams() // Refrescar lista
      return { data, error: null }
    } catch (error) {
      console.error('Error creating team:', error)
      return { data: null, error }
    }
  }

  const updateTeam = async (id: string, updates: Partial<Team>) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: updates.name,
          city: updates.city,
          logo: updates.logo,
          founded: updates.founded,
          coach: updates.coach,
          category: updates.category
        })
        .eq('id', id)

      if (error) throw error

      // Actualizar jugadores si es necesario
      if (updates.players) {
        // Eliminar jugadores existentes
        await supabase
          .from('team_players')
          .delete()
          .eq('team_id', id)

        // Insertar nuevos jugadores
        if (updates.players.length > 0) {
          const playersData = updates.players.map(player => ({
            team_id: id,
            name: player.name,
            number: player.number,
            position: player.position
          }))

          const { error: playersError } = await supabase
            .from('team_players')
            .insert(playersData)

          if (playersError) throw playersError
        }
      }

      await fetchTeams() // Refrescar lista
      return { error: null }
    } catch (error) {
      console.error('Error updating team:', error)
      return { error }
    }
  }

  const deleteTeam = async (id: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchTeams() // Refrescar lista
      return { error: null }
    } catch (error) {
      console.error('Error deleting team:', error)
      return { error }
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  return {
    teams,
    loading,
    createTeam,
    updateTeam,
    deleteTeam,
    refetch: fetchTeams
  }
}

// Hook para manejar partidos
export const useGames = () => {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGames = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          game_players (
            *,
            stat_events (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedGames: Game[] = data?.map(game => ({
        id: game.id,
        teamA: game.team_a,
        teamB: game.team_b,
        scoreA: game.score_a,
        scoreB: game.score_b,
        date: game.date,
        isActive: game.is_active,
        startTime: game.start_time ? new Date(game.start_time).getTime() : undefined,
        gameTimeElapsed: game.game_time_elapsed,
        config: game.config,
        softCapReached: game.soft_cap_reached,
        hardCapReached: game.hard_cap_reached,
        isHalftime: game.is_halftime,
        profile: game.profile,
        isMixedGame: game.is_mixed_game,
        currentPointGender: game.current_point_gender,
        players: game.game_players?.map((player: any) => ({
          id: player.id,
          name: player.name,
          team: player.team,
          points: player.points,
          assists: player.assists,
          drops: player.drops,
          blocks: player.blocks,
          turnovers: player.turnovers,
          pools: player.pools,
          events: player.stat_events?.map((event: any) => ({
            id: event.id,
            playerId: event.player_id,
            type: event.type,
            minute: event.minute,
            second: event.second,
            timestamp: event.timestamp,
            poolDuration: event.pool_duration,
            poolResult: event.pool_result
          })) || []
        })) || []
      })) || []

      setGames(formattedGames)
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGame = async (game: Omit<Game, 'id'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('games')
        .insert({
          team_a: game.teamA,
          team_b: game.teamB,
          score_a: game.scoreA,
          score_b: game.scoreB,
          date: game.date,
          is_active: game.isActive,
          start_time: game.startTime ? new Date(game.startTime).toISOString() : null,
          game_time_elapsed: game.gameTimeElapsed,
          config: game.config,
          soft_cap_reached: game.softCapReached,
          hard_cap_reached: game.hardCapReached,
          is_halftime: game.isHalftime,
          profile: game.profile,
          is_mixed_game: game.isMixedGame,
          current_point_gender: game.currentPointGender,
          created_by: userData.user.id
        })
        .select()
        .single()

      if (error) throw error

      // Crear jugadores del partido
      if (game.players.length > 0) {
        const playersData = game.players.map(player => ({
          game_id: data.id,
          name: player.name,
          team: player.team || '',
          points: player.points,
          assists: player.assists,
          drops: player.drops,
          blocks: player.blocks,
          turnovers: player.turnovers,
          pools: player.pools
        }))

        const { data: playersResult, error: playersError } = await supabase
          .from('game_players')
          .insert(playersData)
          .select()

        if (playersError) throw playersError

        // Crear eventos de estadísticas
        const eventsData: any[] = []
        game.players.forEach(player => {
          player.events.forEach(event => {
            eventsData.push({
              game_id: data.id,
              player_id: playersResult?.find(p => p.name === player.name)?.id,
              type: event.type,
              minute: event.minute,
              second: event.second,
              timestamp: event.timestamp,
              pool_duration: event.poolDuration,
              pool_result: event.poolResult
            })
          })
        })

        if (eventsData.length > 0) {
          const { error: eventsError } = await supabase
            .from('stat_events')
            .insert(eventsData)

          if (eventsError) throw eventsError
        }
      }

      await fetchGames() // Refrescar lista
      return { data, error: null }
    } catch (error) {
      console.error('Error creating game:', error)
      return { data: null, error }
    }
  }

  const updateGame = async (id: string, updates: Partial<Game>) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({
          team_a: updates.teamA,
          team_b: updates.teamB,
          score_a: updates.scoreA,
          score_b: updates.scoreB,
          date: updates.date,
          is_active: updates.isActive,
          start_time: updates.startTime ? new Date(updates.startTime).toISOString() : null,
          game_time_elapsed: updates.gameTimeElapsed,
          config: updates.config,
          soft_cap_reached: updates.softCapReached,
          hard_cap_reached: updates.hardCapReached,
          is_halftime: updates.isHalftime,
          profile: updates.profile,
          is_mixed_game: updates.isMixedGame,
          current_point_gender: updates.currentPointGender
        })
        .eq('id', id)

      if (error) throw error

      await fetchGames() // Refrescar lista
      return { error: null }
    } catch (error) {
      console.error('Error updating game:', error)
      return { error }
    }
  }

  const deleteGame = async (id: string) => {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchGames() // Refrescar lista
      return { error: null }
    } catch (error) {
      console.error('Error deleting game:', error)
      return { error }
    }
  }

  useEffect(() => {
    fetchGames()
  }, [])

  return {
    games,
    loading,
    createGame,
    updateGame,
    deleteGame,
    refetch: fetchGames
  }
}

// Hook para sincronización en tiempo real
export const useRealtimeSync = (gameId?: string) => {
  useEffect(() => {
    if (!gameId) return

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          console.log('Game updated:', payload)
          // Aquí puedes emitir un evento personalizado o actualizar el estado
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log('Game players updated:', payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stat_events',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log('Stat events updated:', payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])
}
