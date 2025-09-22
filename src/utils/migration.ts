import { supabase } from '../lib/supabase'
import { Game, Team, Player, StatEvent } from '../App'

// Función para migrar datos locales a Supabase
export const migrateLocalDataToSupabase = async () => {
  try {
    console.log('Iniciando migración de datos locales a Supabase...')

    // Verificar si el usuario está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado. Debes iniciar sesión para migrar datos.')
    }

    // Obtener datos del localStorage (si existen)
    const localGames = localStorage.getItem('ultimate-frisbee-games')
    const localTeams = localStorage.getItem('ultimate-frisbee-teams')

    let migratedGames = 0
    let migratedTeams = 0

    // Migrar equipos
    if (localTeams) {
      try {
        const teams: Team[] = JSON.parse(localTeams)
        for (const team of teams) {
          const { error } = await supabase
            .from('teams')
            .insert({
              name: team.name,
              city: team.city,
              logo: team.logo,
              founded: team.founded,
              coach: team.coach,
              category: team.category,
              created_by: user.id
            })

          if (!error) {
            migratedTeams++
          } else {
            console.warn(`Error migrando equipo ${team.name}:`, error)
          }
        }
      } catch (error) {
        console.warn('Error parseando equipos del localStorage:', error)
      }
    }

    // Migrar partidos
    if (localGames) {
      try {
        const games: Game[] = JSON.parse(localGames)
        for (const game of games) {
          // Crear el partido
          const { data: gameData, error: gameError } = await supabase
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
              created_by: user.id
            })
            .select()
            .single()

          if (gameError) {
            console.warn(`Error migrando partido ${game.id}:`, gameError)
            continue
          }

          // Crear jugadores del partido
          if (game.players.length > 0) {
            const playersData = game.players.map(player => ({
              game_id: gameData.id,
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

            if (playersError) {
              console.warn(`Error migrando jugadores del partido ${game.id}:`, playersError)
              continue
            }

            // Crear eventos de estadísticas
            const eventsData: any[] = []
            game.players.forEach(player => {
              const gamePlayer = playersResult?.find(p => p.name === player.name)
              if (gamePlayer) {
                player.events.forEach(event => {
                  eventsData.push({
                    game_id: gameData.id,
                    player_id: gamePlayer.id,
                    type: event.type,
                    minute: event.minute,
                    second: event.second,
                    timestamp: event.timestamp,
                    pool_duration: event.poolDuration,
                    pool_result: event.poolResult
                  })
                })
              }
            })

            if (eventsData.length > 0) {
              const { error: eventsError } = await supabase
                .from('stat_events')
                .insert(eventsData)

              if (eventsError) {
                console.warn(`Error migrando eventos del partido ${game.id}:`, eventsError)
              }
            }
          }

          migratedGames++
        }
      } catch (error) {
        console.warn('Error parseando partidos del localStorage:', error)
      }
    }

    console.log(`Migración completada: ${migratedTeams} equipos y ${migratedGames} partidos migrados`)

    return {
      success: true,
      migratedTeams,
      migratedGames
    }
  } catch (error) {
    console.error('Error durante la migración:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

// Función para limpiar datos locales después de la migración
export const clearLocalData = () => {
  localStorage.removeItem('ultimate-frisbee-games')
  localStorage.removeItem('ultimate-frisbee-teams')
  console.log('Datos locales eliminados')
}

// Función para exportar datos actuales a JSON
export const exportDataToJSON = () => {
  const games = localStorage.getItem('ultimate-frisbee-games')
  const teams = localStorage.getItem('ultimate-frisbee-teams')
  
  const data = {
    games: games ? JSON.parse(games) : [],
    teams: teams ? JSON.parse(teams) : [],
    exportedAt: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ultimate-frisbee-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Función para importar datos desde JSON
export const importDataFromJSON = (file: File): Promise<{ games: Game[], teams: Team[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        resolve({
          games: data.games || [],
          teams: data.teams || []
        })
      } catch (error) {
        reject(new Error('Error parseando el archivo JSON'))
      }
    }
    reader.onerror = () => reject(new Error('Error leyendo el archivo'))
    reader.readAsText(file)
  })
}
