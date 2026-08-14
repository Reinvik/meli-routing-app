import React, { useState } from 'react';
import { Route, Delivery } from '../types';
import type { DateFilter } from '../App';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Clock, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  TrendingDown, 
  UserCheck, 
  Search,
  Zap,
  Filter,
  ShieldCheck,
  AlertTriangle,
  CloudRain,
  Navigation,
  Wrench,
  Database,
  ChevronDown,
  ChevronUp,
  AlertOctagon
} from 'lucide-react';

interface DashboardProps {
  routes: Route[];
  deliveries: Delivery[];
  selectedDate: DateFilter;
  onDateChange: (d: DateFilter) => void;
  onSelectDelivery?: (delId: string) => void;
  onNavigateToSql?: (queryId: string) => void;
}

const DATE_OPTIONS: { value: DateFilter; label: string; short: string }[] = [
  { value: 'all',        label: 'Todos los Días', short: 'Todos' },
  { value: '2024-01-01', label: '01 Ene 2024',    short: '01 Ene' },
  { value: '2024-01-02', label: '02 Ene 2024',    short: '02 Ene' },
  { value: '2024-01-03', label: '03 Ene 2024',    short: '03 Ene' },
];

export const Dashboard: React.FC<DashboardProps> = ({ routes, deliveries, selectedDate, onDateChange, onNavigateToSql }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [driverChartMode, setDriverChartMode] = useState<'stops' | 'time'>('stops');
  const [showOtdMethodology, setShowOtdMethodology] = useState<boolean>(false);
  const [showFindingDetails, setShowFindingDetails] = useState<boolean>(false);

  // Exact Mathematical Breakdown of OTD
  const totalDatasetRecords = deliveries.length; // 20
  const validDeliveries = deliveries.filter(d => d.status !== null); // 19
  const nullDeliveriesCount = deliveries.filter(d => d.status === null).length; // 1
  const onTimeCount = validDeliveries.filter(d => d.status === 'Delivered').length; // 15
  const delayedCount = validDeliveries.filter(d => d.status === 'Delayed').length; // 4

  // OTD calculations
  const operationalOtdRate = ((onTimeCount / validDeliveries.length) * 100).toFixed(1); // 78.9%
  const strictDatasetOtdRate = ((onTimeCount / totalDatasetRecords) * 100).toFixed(1); // 75.0%

  const avgDeliveryTime = validDeliveries.length > 0 
    ? (validDeliveries.reduce((acc, d) => acc + (d.delivery_time_min || 0), 0) / validDeliveries.length).toFixed(1)
    : '0';

  // Route Delays comparison data
  const routeComparisonMap: Record<string, { actualSum: number; count: number; routeName: string; targetTime: number }> = {};
  
  deliveries.forEach(d => {
    const rt = routes.find(r => r.route_id === d.route_id);
    const target = rt ? rt.average_delivery_time_min : 0;
    const name = rt ? rt.route_name : d.route_id + ' (Sin Catálogo)';
    
    if (!routeComparisonMap[d.route_id]) {
      routeComparisonMap[d.route_id] = { actualSum: 0, count: 0, routeName: name, targetTime: target };
    }
    if (d.delivery_time_min) {
      routeComparisonMap[d.route_id].actualSum += d.delivery_time_min;
      routeComparisonMap[d.route_id].count += 1;
    }
  });

  const routeChartData = Object.keys(routeComparisonMap).map(rtId => {
    const item = routeComparisonMap[rtId];
    const avgActual = item.count > 0 ? roundVal(item.actualSum / item.count) : 0;
    return {
      route_id: rtId,
      name: rtId,
      full_name: item.routeName,
      'Tiempo Real Promedio (min)': avgActual,
      'Tiempo Objetivo (min)': item.targetTime,
      exceso: item.targetTime > 0 ? roundVal(avgActual - item.targetTime) : 0
    };
  });

  // Delay causes pie data
  const delayCausesMap: Record<string, number> = {};
  let totalDelayedEvents = 0;
  deliveries.filter(d => d.reason_for_delay).forEach(d => {
    const reason = d.reason_for_delay || 'Otro';
    delayCausesMap[reason] = (delayCausesMap[reason] || 0) + 1;
    totalDelayedEvents += 1;
  });

  const pieData = Object.keys(delayCausesMap).map(reason => ({
    name: translateReason(reason),
    value: delayCausesMap[reason]
  }));

  const COLORS = ['#F59E0B', '#EF4444', '#3483FA', '#A855F7', '#10B981'];

  // Driver performance chart data (SQL 3 & SQL 6 breakdown)
  const driverMap: Record<string, { totalTime: number; count: number; delayed: number; routes: Set<string>; totalStops: number; maxStops: number }> = {};
  deliveries.forEach(d => {
    if (!d.driver_id) return;
    const rt = routes.find(r => r.route_id === d.route_id);
    let stops = rt ? rt.number_of_stops : 8;
    if (d.route_id === 'RT-C-03') stops = 6;
    if (d.route_id === 'RT-D-04') stops = 11;

    if (!driverMap[d.driver_id]) {
      driverMap[d.driver_id] = { totalTime: 0, count: 0, delayed: 0, routes: new Set(), totalStops: 0, maxStops: 0 };
    }
    driverMap[d.driver_id].totalTime += d.delivery_time_min || 0;
    driverMap[d.driver_id].count += 1;
    driverMap[d.driver_id].routes.add(d.route_id);
    driverMap[d.driver_id].totalStops += stops;
    if (stops > driverMap[d.driver_id].maxStops) {
      driverMap[d.driver_id].maxStops = stops;
    }
    if (d.status === 'Delayed') driverMap[d.driver_id].delayed += 1;
  });

  const driverChartData = Object.keys(driverMap).map(drvId => {
    const item = driverMap[drvId];
    const avgStops = item.count > 0 ? roundVal(item.totalStops / item.count) : 0;
    const avgTime = item.count > 0 ? roundVal(item.totalTime / item.count) : 0;
    return {
      driver_id: drvId,
      'Tiempo Promedio (min)': avgTime,
      'Entregas Con Retraso': item.delayed,
      'Total Entregas': item.count,
      'Promedio Paradas por Ruta': avgStops,
      'Max Paradas Asignadas': item.maxStops,
      'Norma Base': 8.0
    };
  });

  // Filtered deliveries list
  const filteredDeliveries = deliveries.filter(d => {
    const matchesSearch = 
      d.delivery_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.driver_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.route_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.address && d.address.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'Delayed') return matchesSearch && d.status === 'Delayed';
    if (statusFilter === 'Delivered') return matchesSearch && d.status === 'Delivered';
    if (statusFilter === 'Anomaly') return matchesSearch && (d.address === null || !routes.some(r => r.route_id === d.route_id));
    return matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Banner / Title */}
      <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" /> Resumen Operativo de Rutas Mercado Foods
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Dashboard de Análisis de Rutas & Entregas
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Evaluación completa de tiempos de entrega, cuellos de botella de conductores y desviaciones operacionales.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOtdMethodology(prev => !prev)}
              className="bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 px-4 py-2 rounded-xl text-right transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-3 group shadow-md"
              title={showOtdMethodology ? "Ocultar desglose de metodología OTD" : "Presiona para ver el desglose de metodología OTD (78.9% vs 75.0%)"}
            >
              <div>
                <span className="text-[11px] text-yellow-400 font-semibold uppercase tracking-wider flex items-center justify-end gap-1">
                  Cumplimiento OTD (Operacional)
                  {showOtdMethodology ? (
                    <ChevronUp className="w-3.5 h-3.5 text-yellow-400 transition-transform" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-yellow-400 transition-transform group-hover:translate-y-0.5" />
                  )}
                </span>
                <span className="text-2xl font-extrabold text-yellow-400">{operationalOtdRate}%</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Analytical Callout Box: 78.9% vs 75.0% OTD Methodology (Collapsible) */}
      {showOtdMethodology && (
        <div className="bg-gradient-to-r from-yellow-500/10 via-slate-900 to-slate-950 border border-yellow-500/30 p-5 rounded-2xl space-y-3 shadow-xl transition-all animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-yellow-400 shrink-0" />
              <span>Medición de Cumplimiento OTD (On-Time Delivery): Metodologías de Cálculo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-400/20 text-yellow-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                Auditoría de Datos
              </span>
              <button 
                onClick={() => setShowOtdMethodology(false)}
                className="text-slate-400 hover:text-white text-xs bg-slate-800/60 hover:bg-slate-800 p-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                title="Ocultar metodología OTD"
              >
                <ChevronUp className="w-4 h-4 text-slate-300" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            {/* Method 1: Operational */}
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold text-xs">1. Enfoque Operacional (Entregas Válidas)</span>
                <span className="text-emerald-400 font-mono font-extrabold text-base">78.9% OTD</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Calculado como <code className="text-emerald-300 font-bold">15 entregadas / 19 operacionales</code>. Excluye la fila nula <code className="text-yellow-300">DEL-20240103-004</code> (`WHERE address IS NULL`) al no tratarse de una entrega completada en ruta.
              </p>
            </div>

            {/* Method 2: Strict Dataset */}
            <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold text-xs">2. Enfoque Dataset Estricto (Total Registros)</span>
                <span className="text-amber-400 font-mono font-extrabold text-base">75.0% OTD</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Calculado como <code className="text-amber-300 font-bold">15 entregadas / 20 registros totales</code>. Considera las 20 filas completas del Excel (15 a tiempo, 4 retrasadas y 1 nula computada como no conforme).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glass-card p-5 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Entregas</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{validDeliveries.length} <span className="text-sm font-normal text-slate-400">/ {totalDatasetRecords} filas</span></div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{onTimeCount} A Tiempo</span> • {delayedCount} Retrasadas
          </p>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-5 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tiempo Prom. Entrega</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{avgDeliveryTime} <span className="text-sm font-normal text-slate-400">min</span></div>
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> +19 min vs Objetivo RT-A-01
          </p>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-5 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasa de Retrasos</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400">
            {((delayedCount / validDeliveries.length) * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-slate-400">
            4 entregas fuera de ventana pactada
          </p>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-5 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Anomalías de Datos</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-purple-400">2 Rutas + 1 Nulo</div>
          <p className="text-xs text-purple-300">
            `RT-C-03`, `RT-D-04` y `DEL-20240103-004`
          </p>
        </div>
      </div>

      {/* Charts Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left Column (lg:col-span-2): Holds both Route Chart & Driver Performance Chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Chart 1: Route Actual vs Expected Delivery Time with Integrated Day Filter */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-3 shadow-xl border border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-bold text-white">Tiempo Real vs Objetivo por Ruta</h3>
                <p className="text-[11px] text-slate-400">Comparación en minutos de la duración promedio vs meta del catálogo</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                {/* Integrated Date Filter Pills */}
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
                  <span className="text-slate-400 font-semibold px-1.5 text-[11px] hidden sm:inline">Filtrar Día:</span>
                  {DATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onDateChange(opt.value)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedDate === opt.value
                          ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.short}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => onNavigateToSql && onNavigateToSql('query-1')}
                  className="text-xs bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                  title="Ver y Ejecutar Consulta SQL 1 en SQL Explorer"
                >
                  <Database className="w-3.5 h-3.5 text-yellow-400" />
                  <span>(Consulta SQL 1)</span>
                </button>
              </div>
            </div>

            {selectedDate === '2024-01-03' && (
              <div className="bg-slate-950 p-2 rounded-xl border border-yellow-500/30 text-[10.5px] text-slate-300 flex items-start gap-2">
                <span className="text-yellow-400 font-bold shrink-0">💡 Nota Día 3:</span>
                <span>
                  No hay incidentes o atrasos disruptivos (<code className="text-emerald-400 font-mono">Delivered</code>). Las variaciones de +2 a +3 min sobre la meta teórica (33m vs 30m en RT-A-01 y 40m vs 38m en RT-B-02) corresponden a variaciones normales de tráfico urbano.
                </span>
              </div>
            )}

            <div className="h-48 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={routeChartData} 
                  margin={{ top: 8, right: 15, left: -10, bottom: 0 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    domain={[0, 65]}
                    ticks={[0, 15, 30, 45, 60]}
                    width={35}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#f8fafc', fontWeight: '600' }}
                    labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '2px', color: '#cbd5e1', fontSize: '11px' }} />
                  <Bar dataKey="Tiempo Real Promedio (min)" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="Tiempo Objetivo (min)" fill="#3483FA" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Driver Performance Chart (Stops vs Time) */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-3 shadow-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-base font-bold text-white">
                  {driverChartMode === 'stops'
                    ? 'Paradas Asignadas por Conductor (Consulta SQL 3)'
                    : 'Desempeño y Tiempos por Conductor'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {driverChartMode === 'stops'
                    ? 'Evaluación de paradas asignadas en catálogo (Number of Stops) vs promedio de la flota (8 paradas)'
                    : 'Tiempos promedio de entrega y tasa de retrasos asignados'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                {/* Mode Selector Pill */}
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setDriverChartMode('stops')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      driverChartMode === 'stops'
                        ? 'bg-yellow-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🛑 Paradas por Ruta
                  </button>
                  <button
                    onClick={() => setDriverChartMode('time')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      driverChartMode === 'time'
                        ? 'bg-yellow-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⏱️ Tiempos (min)
                  </button>
                </div>

                <button
                  onClick={() => onNavigateToSql && onNavigateToSql('query-3')}
                  className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                  title="Ver y Ejecutar Consulta SQL 3 (Conductores y Paradas) en SQL Explorer"
                >
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>(Consulta SQL 3)</span>
                </button>
              </div>
            </div>

            {/* Highlighting Callout depending on active mode */}
            {driverChartMode === 'stops' ? (
              <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-500/30 text-[10.5px] flex items-center justify-between gap-2">
                <span className="text-slate-300">
                  🔥 <strong className="text-yellow-400">DR-104 (11 paradas)</strong> y <strong className="text-yellow-300">DR-102 (9 paradas)</strong> operan las rutas con mayor volumen de paradas por sobre la norma base (<code className="text-emerald-400 font-mono font-bold">8.0 paradas</code>).
                </span>
                <span className="bg-amber-500/20 text-amber-300 font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-lg border border-amber-500/30 shrink-0 whitespace-nowrap">
                  SQL 3 Evaluado
                </span>
              </div>
            ) : (
              <div className="bg-slate-950 p-2.5 rounded-xl border border-blue-500/30 text-[10.5px] flex items-center justify-between gap-2">
                <span className="text-slate-300">
                  ⏱️ <strong className="text-blue-400">DR-103 (58.3 min, 2 retrasos)</strong> y <strong className="text-yellow-300">DR-101 (47.8 min, 1 retraso)</strong> presentan las mayores duraciones promedio en ruta.
                </span>
                <span className="bg-blue-500/20 text-blue-300 font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-lg border border-blue-500/30 shrink-0 whitespace-nowrap">
                  SQL 3 / SQL 6
                </span>
              </div>
            )}

            <div className="h-48 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                {driverChartMode === 'stops' ? (
                  <BarChart 
                    data={driverChartData} 
                    margin={{ top: 8, right: 15, left: -10, bottom: 0 }}
                    barCategoryGap="25%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="driver_id" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      domain={[0, 14]}
                      ticks={[0, 3, 6, 8, 11, 14]}
                      width={30}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                      labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '2px', color: '#cbd5e1', fontSize: '11px' }} />
                    <Bar dataKey="Promedio Paradas por Ruta" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Max Paradas Asignadas" fill="#A855F7" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Total Entregas" fill="#3483FA" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                ) : (
                  <BarChart 
                    data={driverChartData} 
                    margin={{ top: 8, right: 15, left: -10, bottom: 0 }}
                    barCategoryGap="25%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="driver_id" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      domain={[0, 65]}
                      ticks={[0, 15, 30, 45, 60]}
                      width={35}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                      labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '2px', color: '#cbd5e1', fontSize: '11px' }} />
                    <Bar dataKey="Tiempo Promedio (min)" fill="#3483FA" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Entregas Con Retraso" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Driver Route Assignment Breakdown Callout */}
            <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                <span>Rutas Operadas por Cada Conductor</span>
                <button
                  onClick={() => onNavigateToSql && onNavigateToSql('query-6')}
                  className="bg-yellow-400/20 text-yellow-300 font-mono px-2 py-0.5 rounded border border-yellow-500/30 text-[10px] hover:bg-yellow-400/30 transition-all cursor-pointer"
                >
                  (Consulta SQL 6)
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                  <span className="text-slate-400 block font-sans text-[10px]">DR-101 (Titular)</span>
                  <strong className="text-white">RT-A-01</strong>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                  <span className="text-slate-400 block font-sans text-[10px]">DR-102 (Titular)</span>
                  <strong className="text-white">RT-B-02</strong>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                  <span className="text-slate-400 block font-sans text-[10px]">DR-103 (Titular)</span>
                  <strong className="text-white">RT-C-03</strong>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                  <span className="text-slate-400 block font-sans text-[10px]">DR-104 (Nulo)</span>
                  <strong className="text-white">RT-D-04</strong>
                </div>
                <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 p-2 rounded border border-yellow-500/40 text-center col-span-2 sm:col-span-1 shadow-sm">
                  <span className="text-yellow-300 block font-sans text-[10px] font-bold">DR-105 (Comodín)</span>
                  <strong className="text-yellow-400">RT-A-01 + RT-B-02</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3 (Directly Below Chart 2): Conciliation of Planned Stops vs Real Deliveries & Orphan Routes (SQL 10) */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-3 shadow-xl border border-rose-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                  Gráfico de Anomalías: Paradas Esperadas vs Realizadas & Rutas Huérfanas
                </h3>
                <p className="text-[11px] text-slate-400">
                  Conciliación cuantitativa de paradas en catálogo (esperadas) vs entregas registradas (realizadas) y detección de rutas huérfanas
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigateToSql && onNavigateToSql('query-10')}
                  className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                  title="Ver y Ejecutar Consulta SQL 10 (Conciliación de Paradas y Rutas Huérfanas) en SQL Explorer"
                >
                  <Database className="w-3.5 h-3.5 text-rose-400" />
                  <span>(Consulta SQL 10)</span>
                </button>
              </div>
            </div>

            <div className="h-48 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={[
                    { name: 'DR-101 (RT-A-01)', 'Paradas Esperadas (Catálogo)': 8, 'Entregas Realizadas (Real)': 5, 'Brecha Faltantes': 3, 'Entregas en Ruta Huérfana': 0 },
                    { name: 'DR-102 (RT-B-02)', 'Paradas Esperadas (Catálogo)': 9, 'Entregas Realizadas (Real)': 5, 'Brecha Faltantes': 4, 'Entregas en Ruta Huérfana': 0 },
                    { name: 'DR-103 (RT-C-03)', 'Paradas Esperadas (Catálogo)': 0, 'Entregas Realizadas (Real)': 5, 'Brecha Faltantes': 0, 'Entregas en Ruta Huérfana': 5 },
                    { name: 'DR-104 (RT-D-04)', 'Paradas Esperadas (Catálogo)': 0, 'Entregas Realizadas (Real)': 5, 'Brecha Faltantes': 0, 'Entregas en Ruta Huérfana': 5 },
                    { name: 'DR-105 (Comodín)', 'Paradas Esperadas (Catálogo)': 8.5, 'Entregas Realizadas (Real)': 2, 'Brecha Faltantes': 6.5, 'Entregas en Ruta Huérfana': 0 },
                  ]} 
                  margin={{ top: 8, right: 15, left: -10, bottom: 0 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    domain={[0, 12]}
                    ticks={[0, 3, 6, 9, 12]}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                    labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '2px', color: '#cbd5e1', fontSize: '11px' }} />
                  <Bar dataKey="Paradas Esperadas (Catálogo)" fill="#3483FA" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="Entregas Realizadas (Real)" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="Brecha Faltantes" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="Entregas en Ruta Huérfana" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-rose-500/30 text-[10.5px] text-slate-300 flex items-center justify-between gap-2">
              <span>
                🚨 <strong className="text-amber-400">Rutas Huérfanas:</strong> 10 entregas en <code className="text-yellow-300 font-mono">RT-C-03</code> y <code className="text-yellow-300 font-mono">RT-D-04</code> (0 paradas en catálogo). | ⚠️ <strong className="text-rose-400">Discrepancia:</strong> En <code className="text-white font-mono">RT-A-01</code> y <code className="text-white font-mono">RT-B-02</code> las entregas realizadas (5) son menores a las esperadas (8 y 9).
              </span>
              <span className="bg-rose-500/20 text-rose-300 font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-lg border border-rose-500/30 shrink-0 whitespace-nowrap">
                SQL 10 Conciliado
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-1): Delay Causes Pie Chart + Detailed Findings Callout */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4 flex flex-col justify-between border-t-2 border-t-amber-400">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Distribución de Motivos de Retraso</h3>
              <p className="text-xs text-slate-400">Factores incidentales reportados por conductores en entregas reales</p>
            </div>
            <button
              onClick={() => onNavigateToSql && onNavigateToSql('query-4')}
              className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 shadow-sm"
              title="Ver y Ejecutar Consulta SQL 4 en SQL Explorer"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>(Consulta SQL 4)</span>
            </button>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '12px', 
                      color: '#f8fafc',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                    labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-sm">Sin datos de retraso</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <div className="truncate">
                  <span className="font-bold text-slate-100 text-[11px] block truncate">{item.name}</span>
                  <span className="text-slate-400 text-[10px] font-mono">{item.value} evento(s) ({totalDelayedEvents > 0 ? ((item.value / totalDelayedEvents) * 100).toFixed(0) : 0}%)</span>
                </div>
              </div>
            ))}
          </div>

          {/* DETAILED FINDINGS CALLOUT BOX RIGHT BELOW CHART */}
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 text-xs space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2">
              <span className="font-extrabold text-yellow-400 flex items-center gap-1.5 uppercase text-[11px] shrink-0">
                <AlertTriangle className="w-4 h-4 text-yellow-400" /> Hallazgos de Retrasos
              </span>
              <button
                onClick={() => setShowFindingDetails(prev => !prev)}
                className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm whitespace-nowrap shrink-0"
                title={showFindingDetails ? "Ocultar Día, Vehículo Recomendado, Hora de Envío y Kilos" : "Ver Día, Vehículo Recomendado, Hora de Envío y Kilos del Día"}
              >
                <span>{showFindingDetails ? 'Ocultar Detalles' : 'Ver Detalles'}</span>
                {showFindingDetails ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            </div>

            <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
              {/* Finding 1: Mechanical Breakdown */}
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-rose-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-rose-400" /> 1. Avería Mecánica (80 min)
                  </span>
                  <span className="font-mono text-yellow-300 text-[10.5px]">DEL-20240102-005</span>
                </div>
                {showFindingDetails && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"><strong>Día:</strong> Día 2 (02 Ene 2024)</span>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30"><strong>VehicleTypeRecommendation:</strong> Motorcycle</span>
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30"><strong>Hora de Envío:</strong> 09:00 hrs (80 min)</span>
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30"><strong>Kilos del Día:</strong> 5.9 kg (RT-A-01)</span>
                  </div>
                )}
                <p className="text-slate-400 text-[10.5px]">
                  Falta de <strong className="text-white">mantenimiento preventivo pre-turno</strong>. Falla mecánica en la moto que trasladaba 5.9 kg en el Día 2.
                </p>
              </div>

              {/* Finding 2: Traffic */}
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-amber-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-400" /> 2. Tráfico en Furgón Grande (65 min)
                  </span>
                  <span className="font-mono text-yellow-300 text-[10.5px]">DEL-20240101-004</span>
                </div>
                {showFindingDetails && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"><strong>Día:</strong> Día 1 (01 Ene 2024)</span>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30"><strong>VehicleTypeRecommendation:</strong> Large Van</span>
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30"><strong>Hora de Envío:</strong> 08:00 hrs (65 min)</span>
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30"><strong>Kilos del Día:</strong> 7.8 kg (RT-C-03)</span>
                  </div>
                )}
                <p className="text-slate-400 text-[10.5px]">
                  Mala selección de vehículo y <strong className="text-white">flota sub-utilizada</strong>. Furgón grande (<code className="text-white">Large Van</code>) de 6m asignado en taco céntrico; no pudo filtrar carriles ni hallar estacionamiento rápido.
                </p>
              </div>

              {/* Finding 3: Weather */}
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-blue-400 font-bold">
                  <span className="flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" /> 3. Clima y Lluvia (55 min)
                  </span>
                  <span className="font-mono text-yellow-300 text-[10.5px]">DEL-20240101-007</span>
                </div>
                {showFindingDetails && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"><strong>Día:</strong> Día 1 (01 Ene 2024)</span>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30"><strong>VehicleTypeRecommendation:</strong> Large Van</span>
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30"><strong>Hora de Envío:</strong> 08:00 hrs (55 min)</span>
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30"><strong>Kilos del Día:</strong> 7.8 kg (RT-C-03)</span>
                  </div>
                )}
                <p className="text-slate-400 text-[10.5px]">
                  Falta de <strong className="text-white">planificación ante contingencias climáticas</strong>. Pista mojada redujo velocidad en vans pesadas y forzó empaquetado impermeable de alimentos sobre la marcha.
                </p>
              </div>

              {/* Finding 4: Wrong Address */}
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-purple-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-purple-400" /> 4. Dirección Errónea (90 min)
                  </span>
                  <span className="font-mono text-yellow-300 text-[10.5px]">DEL-20240102-008</span>
                </div>
                {showFindingDetails && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"><strong>Día:</strong> Día 2 (02 Ene 2024)</span>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30"><strong>VehicleTypeRecommendation:</strong> Car</span>
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30"><strong>Hora de Envío:</strong> 11:00 hrs (90 min)</span>
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30"><strong>Kilos del Día:</strong> 2.9 kg (RT-D-04)</span>
                  </div>
                )}
                <p className="text-slate-400 text-[10.5px]">
                  <strong className="text-white">Fuga del sistema en checkout</strong> de la app. El retraso individual más alto en <code className="text-white">RT-D-04</code> por falta de autocompletado y geocodificación GPS obligatoria.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deliveries Data Table */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Registros de Entregas Mercado Foods (Deliveries)</h3>
            <p className="text-xs text-slate-400">Tabla principal sincronizada desde Supabase (`meli.deliveries`)</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por ID, Conductor, Ruta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-yellow-400/50 w-48 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-slate-900">Todos</option>
                <option value="Delivered" className="bg-slate-900">A Tiempo</option>
                <option value="Delayed" className="bg-slate-900">Con Retraso</option>
                <option value="Anomaly" className="bg-slate-900">Anomalías</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-4">Delivery ID</th>
                <th className="py-3 px-4">Ruta</th>
                <th className="py-3 px-4">Conductor</th>
                <th className="py-3 px-4">Cliente / Dirección</th>
                <th className="py-3 px-4 text-center">Duración</th>
                <th className="py-3 px-4 text-center">Peso (kg)</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Motivo de Retraso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDeliveries.map((del) => {
                const isOrphan = !routes.some(r => r.route_id === del.route_id);
                const isMissingData = del.address === null;
                return (
                  <tr key={del.delivery_id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-yellow-400">{del.delivery_id}</td>
                    <td className="py-3 px-4">
                      <span className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                        isOrphan 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {del.route_id}
                        {isOrphan && ' ⚠️'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{del.driver_id}</td>
                    <td className="py-3 px-4">
                      {isMissingData ? (
                        <span className="text-rose-400 font-semibold italic">❌ Faltan Datos (`WHERE address IS NULL`)</span>
                      ) : (
                        <span className="text-slate-300">{del.address}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {del.delivery_time_min ? `${del.delivery_time_min} min` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {del.package_weight_kg ? `${del.package_weight_kg} kg` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {del.status === 'Delivered' && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Entregado
                        </span>
                      )}
                      {del.status === 'Delayed' && (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Retrasado
                        </span>
                      )}
                      {del.status === null && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full font-bold">Registro Nulo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {del.reason_for_delay ? (
                        <span className="text-amber-400 font-medium">{translateReason(del.reason_for_delay)}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Infrastructure & Tools Implemented Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 border-t-2 border-t-yellow-400">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-yellow-400" /> Infraestructura & Herramientas Implementadas
            </h3>
            <p className="text-xs text-slate-400">Stack tecnológico de ingeniería, inteligencia artificial y desplegado en producción</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-xl border border-yellow-500/30 flex items-center gap-2.5 text-yellow-300">
            <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 animate-pulse"></span>
            <div className="truncate">
              <span className="block text-[10px] text-slate-400 font-sans">Agente de IA</span>
              <strong className="text-white text-[11px] truncate">🤖 Antigravity AI</strong>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-blue-500/30 flex items-center gap-2.5 text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
            <div className="truncate">
              <span className="block text-[10px] text-slate-400 font-sans">Lenguaje Web & Framework</span>
              <strong className="text-white text-[11px] truncate">💻 TypeScript + React</strong>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <div className="truncate">
              <span className="block text-[10px] text-slate-400 font-sans">Sanitización de Datos</span>
              <strong className="text-white text-[11px] truncate">🐍 Python 3.12</strong>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/30 flex items-center gap-2.5 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
            <div className="truncate">
              <span className="block text-[10px] text-slate-400 font-sans">Base de Datos Relacional</span>
              <strong className="text-white text-[11px] truncate">⚡ Supabase (meli)</strong>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 flex items-center gap-2.5 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
            <div className="truncate">
              <span className="block text-[10px] text-slate-400 font-sans">Cartografía GPS</span>
              <strong className="text-white text-[11px] truncate">🗺️ Leaflet Maps</strong>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/30 flex items-center gap-2.5 text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
            <div className="truncate">
              <span className="block text-[10px] text-slate-400 font-sans">Hosting & Producción</span>
              <strong className="text-white text-[11px] truncate">☁️ Vercel (meli.nexus)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function roundVal(v: number): number {
  return Math.round(v * 10) / 10;
}

function translateReason(r: string): string {
  if (r === 'Traffic') return 'Tráfico Denso';
  if (r === 'Weather (Rain)') return 'Clima (Lluvia)';
  if (r === 'Vehicle Breakdown') return 'Avería de Vehículo';
  if (r === 'Wrong Address') return 'Dirección Errónea';
  return r;
}
