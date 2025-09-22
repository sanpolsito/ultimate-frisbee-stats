import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Download, FileText, Table, BarChart3, Target, Users, Clock } from 'lucide-react';
import { Game, Player, StatEvent } from '../App';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

export function ExportModal({ isOpen, onClose, game }: ExportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Calcular estadísticas del partido
  const gameStats = {
    totalPoints: game.players.reduce((sum, player) => sum + player.points, 0),
    totalAssists: game.players.reduce((sum, player) => sum + player.assists, 0),
    totalBlocks: game.players.reduce((sum, player) => sum + player.blocks, 0),
    totalDrops: game.players.reduce((sum, player) => sum + player.drops, 0),
    totalTurnovers: game.players.reduce((sum, player) => sum + player.turnovers, 0),
    totalEvents: game.players.reduce((sum, player) => sum + player.events.length, 0),
    duration: game.config.timeLimitMinutes,
    teamA: game.teamA,
    teamB: game.teamB,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
  };

  // Calcular eficiencia de jugadores
  const calculateEfficiency = (player: Player) => {
    const totalActions = player.points + player.assists + player.blocks + player.drops + player.turnovers;
    if (totalActions === 0) return 0;
    const positiveActions = player.points + player.assists + player.blocks;
    return Math.round((positiveActions / totalActions) * 100);
  };

  // Generar PDF visual
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REPORTE DE PARTIDO', pageWidth / 2, 20, { align: 'center' });
      
      // Información del partido
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${game.teamA} vs ${game.teamB}`, pageWidth / 2, 35, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Marcador Final: ${game.scoreA} - ${game.scoreB}`, pageWidth / 2, 45, { align: 'center' });
      pdf.text(`Duración: ${game.duration} minutos`, pageWidth / 2, 52, { align: 'center' });
      
      // Estadísticas generales
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ESTADÍSTICAS GENERALES', 20, 70);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const stats = [
        `Total de Puntos: ${gameStats.totalPoints}`,
        `Total de Asistencias: ${gameStats.totalAssists}`,
        `Total de Defensas: ${gameStats.totalBlocks}`,
        `Total de Drops: ${gameStats.totalDrops}`,
        `Total de Turnovers: ${gameStats.totalTurnovers}`,
        `Total de Eventos: ${gameStats.totalEvents}`
      ];
      
      stats.forEach((stat, index) => {
        pdf.text(stat, 20, 80 + (index * 8));
      });
      
      // Tabla de jugadores
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RENDIMIENTO DE JUGADORES', 20, 140);
      
      // Headers de la tabla
      const headers = ['Jugador', 'Equipo', 'Puntos', 'Asist.', 'Defensas', 'Drops', 'Turnovers', 'Eficiencia'];
      const colWidths = [40, 25, 15, 15, 15, 15, 15, 20];
      let xPos = 20;
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        pdf.text(header, xPos, 150);
        xPos += colWidths[index];
      });
      
      // Datos de jugadores
      pdf.setFont('helvetica', 'normal');
      let yPos = 160;
      
      game.players.forEach((player) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        
        xPos = 20;
        const playerData = [
          player.name,
          player.team || 'N/A',
          player.points.toString(),
          player.assists.toString(),
          player.blocks.toString(),
          player.drops.toString(),
          player.turnovers.toString(),
          `${calculateEfficiency(player)}%`
        ];
        
        playerData.forEach((data, index) => {
          pdf.text(data, xPos, yPos);
          xPos += colWidths[index];
        });
        
        yPos += 8;
      });
      
      // Footer
      pdf.setFontSize(8);
      pdf.text(`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Guardar PDF
      pdf.save(`partido_${game.teamA}_vs_${game.teamB}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generar Excel con datos tabulares
  const generateExcel = () => {
    setIsGenerating(true);
    try {
      // Hoja 1: Resumen del partido
      const gameSummary = [
        ['RESUMEN DEL PARTIDO'],
        ['Equipo A', game.teamA],
        ['Equipo B', game.teamB],
        ['Marcador Final', `${game.scoreA} - ${game.scoreB}`],
        ['Duración (minutos)', game.duration],
        ['Total de Puntos', gameStats.totalPoints],
        ['Total de Asistencias', gameStats.totalAssists],
        ['Total de Defensas', gameStats.totalBlocks],
        ['Total de Drops', gameStats.totalDrops],
        ['Total de Turnovers', gameStats.totalTurnovers],
        ['Total de Eventos', gameStats.totalEvents],
        [''],
        ['Fecha de generación', new Date().toLocaleString('es-ES')]
      ];

      // Hoja 2: Estadísticas de jugadores
      const playerStats = [
        ['JUGADOR', 'EQUIPO', 'PUNTOS', 'ASISTENCIAS', 'DEFENSAS', 'DROPS', 'TURNOVERS', 'EFICIENCIA (%)', 'TOTAL EVENTOS'],
        ...game.players.map(player => [
          player.name,
          player.team || 'N/A',
          player.points,
          player.assists,
          player.blocks,
          player.drops,
          player.turnovers,
          calculateEfficiency(player),
          player.events.length
        ])
      ];

      // Hoja 3: Cronología de eventos
      const allEvents = game.players
        .flatMap(player => 
          player.events.map(event => ({
            ...event,
            playerName: player.name,
            playerTeam: player.team || 'N/A'
          }))
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      const eventTimeline = [
        ['CRONOLOGÍA DE EVENTOS'],
        ['TIEMPO', 'JUGADOR', 'EQUIPO', 'EVENTO', 'TIPO', 'MINUTO', 'SEGUNDO', 'TIMESTAMP'],
        ...allEvents.map(event => [
          `${event.minute.toString().padStart(2, '0')}:${event.second.toString().padStart(2, '0')}`,
          event.playerName,
          event.playerTeam,
          event.type === 'point' ? 'Gol' : 
          event.type === 'assist' ? 'Asistencia' :
          event.type === 'block' ? 'Defensa' :
          event.type === 'drop' ? 'Drop' :
          event.type === 'turnover' ? 'Turnover' : event.type,
          event.subType || 'N/A',
          event.minute,
          event.second,
          new Date(event.timestamp).toLocaleString('es-ES')
        ])
      ];

      // Crear workbook
      const wb = XLSX.utils.book_new();
      
      // Agregar hojas
      wb.SheetNames.push('Resumen', 'Jugadores', 'Eventos');
      wb.Sheets['Resumen'] = XLSX.utils.aoa_to_sheet(gameSummary);
      wb.Sheets['Jugadores'] = XLSX.utils.aoa_to_sheet(playerStats);
      wb.Sheets['Eventos'] = XLSX.utils.aoa_to_sheet(eventTimeline);

      // Generar archivo
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      saveAs(blob, `partido_${game.teamA}_vs_${game.teamB}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error('Error generando Excel:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2 text-orange-500" />
            Exportar Datos del Partido
          </DialogTitle>
          <DialogDescription>
            Genera reportes en PDF o Excel con las estadísticas del partido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen del partido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Resumen del Partido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Partido:</span>
                    <span className="text-sm">{game.teamA} vs {game.teamB}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Marcador:</span>
                    <span className="text-sm font-bold text-orange-600">{game.scoreA} - {game.scoreB}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Duración:</span>
                    <span className="text-sm">{game.duration} minutos</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Puntos:</span>
                    <Badge variant="outline">{gameStats.totalPoints}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Eventos:</span>
                    <Badge variant="outline">{gameStats.totalEvents}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Jugadores:</span>
                    <Badge variant="outline">{game.players.length}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opciones de exportación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PDF Visual */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Reporte PDF</h3>
                    <p className="text-sm text-gray-600">
                      Diseño visual profesional con estadísticas y gráficos
                    </p>
                  </div>
                  <Button 
                    onClick={generatePDF}
                    disabled={isGenerating}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    {isGenerating ? 'Generando...' : 'Generar PDF'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Excel/CSV */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Table className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Datos Excel</h3>
                    <p className="text-sm text-gray-600">
                      Tablas planas para análisis en Excel o Google Sheets
                    </p>
                  </div>
                  <Button 
                    onClick={generateExcel}
                    disabled={isGenerating}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
                    {isGenerating ? 'Generando...' : 'Generar Excel'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información adicional */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Información de Exportación</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Los archivos se descargarán automáticamente. El PDF incluye gráficos visuales 
                    mientras que el Excel contiene datos tabulares para análisis detallado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

