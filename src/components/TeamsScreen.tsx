import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Search, Users, MapPin, Calendar, User, Plus, Shield, Upload, FileSpreadsheet } from 'lucide-react';
import { Team, TeamPlayer, Screen } from '../App';

interface TeamsScreenProps {
  teams: Team[];
  onNavigate: (screen: Screen) => void;
  onAddTeam: (team: Team) => void;
  user?: any;
  onShowAuth?: () => void;
}

// Datos simulados de equipos de una base de datos externa
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

const positionColors = {
  'Handler': 'bg-blue-100 text-blue-700',
  'Cutter': 'bg-green-100 text-green-700',
  'Deep': 'bg-purple-100 text-purple-700',
  'Hybrid': 'bg-orange-100 text-orange-700',
};

export function TeamsScreen({ teams, onNavigate, onAddTeam, user, onShowAuth }: TeamsScreenProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false);
  const [newTeamForm, setNewTeamForm] = useState({
    name: '',
    city: '',
    founded: new Date().getFullYear(),
    coach: '',
    category: 'masculina' as 'masculina' | 'femenina' | 'mixta',
    players: [] as TeamPlayer[]
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [newPlayerForm, setNewPlayerForm] = useState({
    name: '',
    number: '',
    position: 'Handler'
  });

  // Combinar equipos mock con equipos del usuario
  const allTeams = [...mockTeamsData, ...teams];
  
  const filteredTeams = allTeams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPlayer = () => {
    if (newPlayerForm.name.trim() && newPlayerForm.number.trim()) {
      const player: TeamPlayer = {
        id: Date.now().toString(),
        name: newPlayerForm.name.trim(),
        number: parseInt(newPlayerForm.number),
        position: newPlayerForm.position
      };
      
      setNewTeamForm(prev => ({
        ...prev,
        players: [...prev.players, player]
      }));
      
      setNewPlayerForm({ name: '', number: '', position: 'Handler' });
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    setNewTeamForm(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId)
    }));
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      
      // Leer el archivo CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        const players: TeamPlayer[] = lines.map((line, index) => {
          // Formato: # nombre y posición
          const match = line.trim().match(/^#\s*(\d+)\s+(.+?)\s+y\s+(.+)$/);
          if (match) {
            const [, number, name, position] = match;
            return {
              id: `csv-${index}`,
              name: name.trim(),
              number: parseInt(number),
              position: position.trim() as 'Handler' | 'Cutter' | 'Deep' | 'Hybrid'
            };
          }
          return null;
        }).filter(Boolean) as TeamPlayer[];
        
        setNewTeamForm(prev => ({
          ...prev,
          players: [...prev.players, ...players]
        }));
      };
      reader.readAsText(file);
    }
  };

  const handleCreateTeam = () => {
    if (newTeamForm.name.trim() && newTeamForm.city.trim() && newTeamForm.coach.trim()) {
      const newTeam: Team = {
        id: Date.now().toString(),
        name: newTeamForm.name.trim(),
        city: newTeamForm.city.trim(),
        founded: newTeamForm.founded,
        coach: newTeamForm.coach.trim(),
        category: newTeamForm.category,
        players: newTeamForm.players
      };
      
      onAddTeam(newTeam);
      setNewTeamForm({
        name: '',
        city: '',
        founded: new Date().getFullYear(),
        coach: '',
        category: 'masculina',
        players: []
      });
      setCsvFile(null);
      setAddTeamDialogOpen(false);
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
        <h1 className="text-xl text-black">Equipos</h1>
        <div className="w-16"></div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar equipos o ciudades..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Teams List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-black">Liga Nacional de Ultimate</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {filteredTeams.length} equipos
            </Badge>
            <Dialog open={addTeamDialogOpen} onOpenChange={setAddTeamDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-black border-gray-300"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Equipo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto mx-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-orange-500" />
                    Crear Nuevo Equipo
                  </DialogTitle>
                  <DialogDescription>
                    Crea un nuevo equipo añadiendo la información básica y su roster de jugadores.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Basic Team Info */}
                  <div className="space-y-4">
                    <h3 className="text-base text-black">Información Básica</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="teamName">Nombre del Equipo</Label>
                        <Input
                          id="teamName"
                          placeholder="Ej: Thunderbirds"
                          value={newTeamForm.name}
                          onChange={(e) => setNewTeamForm(prev => ({
                            ...prev,
                            name: e.target.value
                          }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="teamCity">Ciudad</Label>
                        <Input
                          id="teamCity"
                          placeholder="Ej: Buenos Aires"
                          value={newTeamForm.city}
                          onChange={(e) => setNewTeamForm(prev => ({
                            ...prev,
                            city: e.target.value
                          }))}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="teamFounded">Año Fundado</Label>
                        <Input
                          id="teamFounded"
                          type="number"
                          placeholder="2020"
                          value={newTeamForm.founded}
                          onChange={(e) => setNewTeamForm(prev => ({
                            ...prev,
                            founded: parseInt(e.target.value) || new Date().getFullYear()
                          }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="teamCoach">Entrenador</Label>
                        <Input
                          id="teamCoach"
                          placeholder="Ej: María González"
                          value={newTeamForm.coach}
                          onChange={(e) => setNewTeamForm(prev => ({
                            ...prev,
                            coach: e.target.value
                          }))}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="teamCategory">Categoría</Label>
                      <Select 
                        value={newTeamForm.category} 
                        onValueChange={(value: 'masculina' | 'femenina' | 'mixta') => 
                          setNewTeamForm(prev => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculina">
                            <div className="flex items-center space-x-2">
                              <span>👨</span>
                              <span>Masculina</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="femenina">
                            <div className="flex items-center space-x-2">
                              <span>👩</span>
                              <span>Femenina</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="mixta">
                            <div className="flex items-center space-x-2">
                              <span>👥</span>
                              <span>Mixta</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Player Management */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base text-black">Roster de Jugadores</h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {newTeamForm.players.length} jugadores
                      </Badge>
                    </div>
                    
                    {/* CSV Upload */}
                    <div className="p-4 border border-dashed border-gray-300 rounded-lg">
                      <div className="text-center space-y-2">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-gray-400" />
                        <div>
                          <Label htmlFor="csvUpload" className="cursor-pointer text-orange-600 hover:text-orange-700">
                            Subir hoja de cálculo (CSV)
                          </Label>
                          <Input
                            id="csvUpload"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleCsvUpload}
                            className="hidden"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Formato: # nombre y posición
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Ejemplo: # 7 Carlos Mendez y Handler
                          </p>
                        </div>
                        {csvFile && (
                          <p className="text-sm text-green-600">
                            ✓ Archivo cargado: {csvFile.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Manual Player Addition */}
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <Label className="text-sm text-gray-700">Agregar jugador manualmente</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Nombre"
                          value={newPlayerForm.name}
                          onChange={(e) => setNewPlayerForm(prev => ({
                            ...prev,
                            name: e.target.value
                          }))}
                        />
                        <Input
                          placeholder="Número"
                          type="number"
                          value={newPlayerForm.number}
                          onChange={(e) => setNewPlayerForm(prev => ({
                            ...prev,
                            number: e.target.value
                          }))}
                        />
                        <select
                          value={newPlayerForm.position}
                          onChange={(e) => setNewPlayerForm(prev => ({
                            ...prev,
                            position: e.target.value
                          }))}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="Handler">Handler</option>
                          <option value="Cutter">Cutter</option>
                          <option value="Deep">Deep</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                      </div>
                      <Button 
                        onClick={handleAddPlayer}
                        variant="outline"
                        size="sm"
                        disabled={!newPlayerForm.name.trim() || !newPlayerForm.number.trim()}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar Jugador
                      </Button>
                    </div>

                    {/* Players List */}
                    {newTeamForm.players.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Jugadores agregados</Label>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {newTeamForm.players.map((player) => (
                            <div 
                              key={player.id}
                              className="flex items-center justify-between p-2 bg-white border rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">
                                  {player.number}
                                </div>
                                <div className="text-sm text-black">{player.name}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${positionColors[player.position as keyof typeof positionColors]}`}
                                >
                                  {player.position}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemovePlayer(player.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button 
                      variant="outline"
                      onClick={() => setAddTeamDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateTeam}
                      disabled={!newTeamForm.name.trim() || !newTeamForm.city.trim() || !newTeamForm.coach.trim()}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Crear Equipo
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTeams.map((team) => (
            <Dialog key={team.id}>
              <DialogTrigger asChild>
                <Card className="border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-black">
                        {team.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-gray-600">
                        {team.players.length} jugadores
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {team.city}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Fundado {team.founded}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        Entrenador: {team.coach}
                      </div>
                      <div className="flex items-center">
                        <Badge 
                          variant="secondary" 
                          className={`${
                            team.category === 'masculina' ? 'bg-blue-100 text-blue-700' :
                            team.category === 'femenina' ? 'bg-pink-100 text-pink-700' :
                            'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {team.category === 'masculina' ? '👨 Masculina' :
                           team.category === 'femenina' ? '👩 Femenina' :
                           '👥 Mixta'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {Object.entries(
                        team.players.reduce((acc, player) => {
                          acc[player.position] = (acc[player.position] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([position, count]) => (
                        <Badge 
                          key={position} 
                          variant="secondary" 
                          className={`text-xs ${positionColors[position as keyof typeof positionColors]}`}
                        >
                          {position}: {count}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto mx-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-orange-500" />
                    {team.name} - Roster Completo
                  </DialogTitle>
                  <DialogDescription>
                    Información completa del equipo y lista de todos los jugadores registrados.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Ciudad:</span>
                        <div className="text-black">{team.city}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Fundado:</span>
                        <div className="text-black">{team.founded}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Entrenador:</span>
                        <div className="text-black">{team.coach}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Jugadores:</span>
                        <div className="text-black">{team.players.length}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-base text-black">Jugadores</h4>
                    <div className="grid gap-2">
                      {team.players
                        .sort((a, b) => a.number - b.number)
                        .map((player) => (
                          <div 
                            key={player.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">
                                {player.number}
                              </div>
                              <div>
                                <div className="text-black">{player.name}</div>
                              </div>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={positionColors[player.position as keyof typeof positionColors]}
                            >
                              {player.position}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No se encontraron equipos</p>
              <p className="text-sm text-gray-400">Intenta con otros términos de búsqueda</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Datos sincronizados desde la Liga Nacional
          </p>
          <p className="text-xs text-gray-500">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AddTeamScreen({ onNavigate, onAddTeam }: TeamsScreenProps) {
  const [teamName, setTeamName] = useState('');
  const [teamCity, setTeamCity] = useState('');
  const [teamFounded, setTeamFounded] = useState(0);
  const [teamCoach, setTeamCoach] = useState('');
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);

  const handleAddPlayer = () => {
    const newPlayer: TeamPlayer = {
      id: teamPlayers.length.toString(),
      name: teamName,
      number: teamFounded,
      position: teamCoach
    };
    setTeamPlayers([...teamPlayers, newPlayer]);
    setTeamName('');
    setTeamCity('');
    setTeamFounded(0);
    setTeamCoach('');
  };

  const handleAddTeam = () => {
    const newTeam: Team = {
      id: teamPlayers.length.toString(),
      name: teamName,
      city: teamCity,
      founded: teamFounded,
      coach: teamCoach,
      category: 'masculina', // Default category for this screen
      players: teamPlayers
    };
    onAddTeam(newTeam);
    onNavigate('teams');
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
        <h1 className="text-xl text-black">Agregar Equipo</h1>
        <div className="w-16"></div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <Label className="text-sm text-gray-600">Nombre del Equipo</Label>
        <Input
          placeholder="Nombre del Equipo..."
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="pl-10"
        />

        <Label className="text-sm text-gray-600">Ciudad</Label>
        <Input
          placeholder="Ciudad..."
          value={teamCity}
          onChange={(e) => setTeamCity(e.target.value)}
          className="pl-10"
        />

        <Label className="text-sm text-gray-600">Año Fundado</Label>
        <Input
          placeholder="Año Fundado..."
          value={teamFounded.toString()}
          onChange={(e) => setTeamFounded(parseInt(e.target.value))}
          className="pl-10"
        />

        <Label className="text-sm text-gray-600">Entrenador</Label>
        <Input
          placeholder="Entrenador..."
          value={teamCoach}
          onChange={(e) => setTeamCoach(e.target.value)}
          className="pl-10"
        />

        <Label className="text-sm text-gray-600">Jugadores</Label>
        <div className="grid gap-2">
          {teamPlayers.map((player) => (
            <div 
              key={player.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">
                  {player.number}
                </div>
                <div>
                  <div className="text-black">{player.name}</div>
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className={positionColors[player.position as keyof typeof positionColors]}
              >
                {player.position}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleAddPlayer}
            className="text-black border-gray-300"
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar Jugador
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleAddTeam}
            className="text-black border-gray-300"
          >
            <Upload className="w-4 h-4 mr-1" />
            Agregar Equipo
          </Button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Datos sincronizados desde la Liga Nacional
          </p>
          <p className="text-xs text-gray-500">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>
    </div>
  );
}