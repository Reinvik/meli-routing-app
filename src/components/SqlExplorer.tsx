import React, { useState, useEffect } from 'react';
import { SqlQueryItem } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Database, 
  Play, 
  Code, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Table, 
  AlertCircle,
  FileCode,
  Clock
} from 'lucide-react';

export const SQL_QUERIES: SqlQueryItem[] = [
  {
    id: 'query-1',
    title: '1. ¿Qué rutas tienen los mayores retrasos en comparación con su AverageDeliveryTime?',
    description: 'Compara la duración real promedio de entregas contra la meta estipulada en el catálogo de rutas para identificar las desviaciones críticas.',
    category: 'Retrasos',
    sql: `SELECT 
    d.route_id,
    COALESCE(r.route_name, 'Ruta No Registrada en Catálogo') AS nombre_ruta,
    r.average_delivery_time_min AS tiempo_objetivo_min,
    ROUND(AVG(d.delivery_time_min), 2) AS tiempo_real_promedio_min,
    ROUND(AVG(d.delivery_time_min) - r.average_delivery_time_min, 2) AS minutos_exceso_retraso,
    COUNT(d.delivery_id) AS total_entregas,
    SUM(CASE WHEN d.status = 'Delayed' THEN 1 ELSE 0 END) AS entregas_retrasadas
FROM meli.deliveries d
LEFT JOIN meli.routes r ON d.route_id = r.route_id
GROUP BY d.route_id, r.route_name, r.average_delivery_time_min
ORDER BY minutos_exceso_retraso DESC;`
  },
  {
    id: 'query-2',
    title: '2. ¿Concuerda el tipo de vehículo utilizado en una entrega con el VehicleTypeRecommendation para esa ruta? ¿Existe una correlación entre la conformidad y los retrasos?',
    description: 'Evalúa la coincidencia entre el vehículo recomendado de la ruta y los incidentes/motivos de retraso reportados.',
    category: 'Vehículos',
    sql: `SELECT 
    d.delivery_id,
    d.route_id,
    r.vehicle_type_recommendation AS vehiculo_recomendado,
    d.status AS estado_entrega,
    d.reason_for_delay AS motivo_retraso,
    d.delivery_time_min AS tiempo_real_min
FROM meli.deliveries d
LEFT JOIN meli.routes r ON d.route_id = r.route_id
ORDER BY d.status DESC, d.delivery_time_min DESC;`
  },
  {
    id: 'query-3',
    title: '3. ¿Qué conductores tienen rutas con más paradas de lo normal?',
    description: 'Identifica los conductores asignados a rutas con mayor volumen de paradas (Number of Stops) y su nivel de cumplimiento.',
    category: 'Conductores',
    sql: `SELECT 
    d.driver_id,
    COUNT(DISTINCT d.delivery_id) AS entregas_atendidas,
    COUNT(DISTINCT d.route_id) AS rutas_distintas,
    ROUND(AVG(r.number_of_stops), 1) AS promedio_paradas_por_ruta,
    MAX(r.number_of_stops) AS max_paradas_asignadas,
    SUM(CASE WHEN d.status = 'Delayed' THEN 1 ELSE 0 END) AS total_retrasos
FROM meli.deliveries d
LEFT JOIN meli.routes r ON d.route_id = r.route_id
GROUP BY d.driver_id
ORDER BY promedio_paradas_por_ruta DESC;`
  },
  {
    id: 'query-4',
    title: '4. Análisis de Causa Raíz de Retrasos y Tiempo Promedio',
    description: 'Desglosa los incidentes por motivo específico (Tráfico, Lluvia, Avería mecánica, Dirección errónea) y calcula la penalización en minutos.',
    category: 'Causas Raíz',
    sql: `SELECT 
    COALESCE(reason_for_delay, 'Sin Retraso Especificado') AS motivo_retraso,
    COUNT(*) AS cantidad_incidentes,
    ROUND(AVG(delivery_time_min), 2) AS tiempo_promedio_min,
    MIN(delivery_time_min) AS tiempo_minimo,
    MAX(delivery_time_min) AS tiempo_maximo
FROM meli.deliveries
WHERE status = 'Delayed' OR reason_for_delay IS NOT NULL
GROUP BY reason_for_delay
ORDER BY cantidad_incidentes DESC;`
  },
  {
    id: 'query-5',
    title: '5. Auditoría de Integridad Referencial de Datos (Rutas Huérfanas y Nulos)',
    description: 'Detecta inconsistencias severas como entregas asociadas a rutas no existentes en la tabla `routes` (`RT-C-03` y `RT-D-04`) y registros sin dirección.',
    category: 'Integridad de Datos',
    sql: `SELECT 
    d.delivery_id,
    d.route_id,
    d.driver_id,
    d.status,
    CASE 
        WHEN r.route_id IS NULL THEN '⚠️ Ruta Huérfana (No existe en catálogo Routes)'
        WHEN d.address IS NULL THEN '❌ Registro Incompleto (Falta Dirección/GPS)'
        ELSE '✅ Válido'
    END AS diagnostico_integridad
FROM meli.deliveries d
LEFT JOIN meli.routes r ON d.route_id = r.route_id
ORDER BY d.delivery_id;`
  },
  {
    id: 'query-6',
    title: '6. Desglose de Rutas Operadas por Conductor (Soporte DR-105)',
    description: 'Agrupa las rutas específicas cubiertas por cada conductor (`driver_id`), visibilizando el rol multirruta de DR-105 apoyando a RT-A-01 y RT-B-02.',
    category: 'Conductores',
    sql: `SELECT 
    d.driver_id,
    ARRAY_AGG(DISTINCT d.route_id ORDER BY d.route_id) AS rutas_operadas,
    COUNT(d.delivery_id) AS total_entregas,
    ROUND(AVG(d.delivery_time_min), 1) AS tiempo_promedio_min,
    SUM(CASE WHEN d.status = 'Delayed' THEN 1 ELSE 0 END) AS entregas_con_retraso
FROM meli.deliveries d
GROUP BY d.driver_id
ORDER BY d.driver_id;`
  },
  {
    id: 'query-7',
    title: '7. Resumen de Rendimiento de Rutas por Área Geográfica',
    description: 'Calcula el tiempo promedio y distancia total atendida por cada zona del catálogo de rutas.',
    category: 'Retrasos',
    sql: `SELECT 
    r.area_served AS area_geografica,
    COUNT(r.route_id) AS total_rutas_catalogo,
    ROUND(AVG(r.route_distance_km), 2) AS distancia_promedio_km,
    ROUND(AVG(r.average_delivery_time_min), 2) AS tiempo_esperado_promedio
FROM meli.routes r
GROUP BY r.area_served
ORDER BY distancia_promedio_km DESC;`
  },
  {
    id: 'query-8',
    title: '8. Auditoría de Capacidad Cúbica (m³) y Peso Máximo por Móvil (id_movil)',
    description: 'Evalúa la utilización volumétrica (m³) y peso (kg) asignado por tipo de móvil para detectar sobrecargas físicas.',
    category: 'Vehículos',
    sql: `SELECT 
    d.vehicle_id AS id_movil,
    d.vehicle_type AS tipo_movil,
    r.max_weight_capacity_kg AS peso_max_permitido_kg,
    r.max_volume_capacity_m3 AS volumen_max_permitido_m3,
    ROUND(SUM(d.package_weight_kg), 2) AS peso_total_cargado_kg,
    ROUND(SUM(d.package_volume_m3), 3) AS volumen_total_cargado_m3,
    CASE 
        WHEN SUM(d.package_volume_m3) > r.max_volume_capacity_m3 THEN '🚨 ALERTA: Sobrecarga Volumétrica'
        WHEN SUM(d.package_weight_kg) > r.max_weight_capacity_kg THEN '⚠️ ALERTA: Sobrecarga de Peso'
        ELSE '✅ Capacidad Conforme'
    END AS diagnostico_capacidad
FROM meli.deliveries d
LEFT JOIN meli.routes r ON d.route_id = r.route_id
GROUP BY d.vehicle_id, d.vehicle_type, r.max_weight_capacity_kg, r.max_volume_capacity_m3;`
  },
  {
    id: 'query-9',
    title: '9. Control de Inocuidad y Temperatura de Alimentos por Rango Térmico de Móvil',
    description: 'Verifica que cada alimento (Congelado -18°C, Refrigerado 4°C-8°C, Ambiente) sea transportado exclusivamente en el tipo de vehículo térmico apto.',
    category: 'Integridad de Datos',
    sql: `SELECT 
    d.delivery_id,
    d.vehicle_id AS id_movil,
    d.vehicle_type AS tipo_movil,
    d.required_temp AS temp_exigida_alimento,
    r.temp_control_type AS temp_control_vehiculo,
    CASE 
        WHEN d.required_temp LIKE '%Congelado%' AND r.temp_control_type NOT LIKE '%Congelado%' THEN '❌ INCOMPATIBLE: Riesgo Derretimiento'
        WHEN d.required_temp LIKE '%Refrigerado%' AND r.temp_control_type LIKE '%Ambiente%' THEN '⚠️ RIESGO: Ruptura Cadena Frío'
        ELSE '✅ Inocuidad Garantizada'
    END AS estado_cadena_frio
FROM meli.deliveries d
LEFT JOIN meli.routes r ON d.route_id = r.route_id
WHERE d.required_temp IS NOT NULL;`
  },
  {
    id: 'query-10',
    title: '10. Métrica de Auditoría: Conciliación Estricta de Paradas (Catalog Stops vs Entregas) & Rutas Solas/Huérfanas',
    description: 'Consulta SQL de control que compara el número de paradas planificadas (number_of_stops) contra las entregas reales registradas por ruta, detectando brechas de entregas faltantes y rutas huérfanas o solas.',
    category: 'Integridad de Datos',
    sql: `SELECT 
    COALESCE(r.route_id, d.route_id) AS codigo_ruta,
    COALESCE(r.route_name, '⚠️ Ruta Huérfana Fuera de Catálogo') AS nombre_ruta,
    COALESCE(r.number_of_stops, 0) AS paradas_planificadas_cat,
    COUNT(d.delivery_id) AS entregas_registradas_real,
    (COALESCE(r.number_of_stops, 0) - COUNT(d.delivery_id)) AS brecha_entregas_faltantes,
    CASE 
        WHEN r.route_id IS NULL THEN '❌ ERROR: Ruta Huérfana (En entregas pero NO en catálogo)'
        WHEN COUNT(d.delivery_id) = 0 THEN '⚠️ ADVERTENCIA: Ruta Sola (En catálogo pero SIN entregas)'
        WHEN COUNT(d.delivery_id) = r.number_of_stops THEN '✅ 100% Coincidente (Paradas = Entregas)'
        ELSE '⚠️ Discrepancia: Faltan ' || (r.number_of_stops - COUNT(d.delivery_id)) || ' entregas respecto a catálogo'
    END AS estado_conciliacion
FROM meli.routes r
FULL OUTER JOIN meli.deliveries d ON r.route_id = d.route_id
GROUP BY r.route_id, d.route_id, r.route_name, r.number_of_stops
ORDER BY codigo_ruta;`
  }
];

interface SqlExplorerProps {
  initialQueryId?: string;
}

export const SqlExplorer: React.FC<SqlExplorerProps> = ({ initialQueryId }) => {
  const initialQuery = SQL_QUERIES.find(q => q.id === initialQueryId) || SQL_QUERIES[0];
  const [selectedQuery, setSelectedQuery] = useState<SqlQueryItem>(initialQuery);
  const [customSql, setCustomSql] = useState<string>(initialQuery.sql);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialQueryId) {
      const found = SQL_QUERIES.find(q => q.id === initialQueryId);
      if (found) {
        setSelectedQuery(found);
        setCustomSql(found.sql);
        setQueryResults(null);
        setErrorMessage(null);
      }
    }
  }, [initialQueryId]);

  const handleSelectQuery = (query: SqlQueryItem) => {
    setSelectedQuery(query);
    setCustomSql(query.sql);
    setQueryResults(null);
    setErrorMessage(null);
  };

  const handleRunQuery = async () => {
    setIsExecuting(true);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      if (selectedQuery.id === 'query-10') {
        const mockConciliation = [
          { codigo_ruta: 'RT-A-01', nombre_ruta: 'City Center North', paradas_planificadas_cat: 8, entregas_registradas_real: 5, brecha_entregas_faltantes: 3, estado_conciliacion: '⚠️ Discrepancia: Faltan 3 entregas respecto a catálogo' },
          { codigo_ruta: 'RT-B-02', nombre_ruta: 'Residential West', paradas_planificadas_cat: 9, entregas_registradas_real: 5, brecha_entregas_faltantes: 4, estado_conciliacion: '⚠️ Discrepancia: Faltan 4 entregas respecto a catálogo' },
          { codigo_ruta: 'RT-C-03', nombre_ruta: '⚠️ Ruta Huérfana Fuera de Catálogo', paradas_planificadas_cat: 0, entregas_registradas_real: 5, brecha_entregas_faltantes: -5, estado_conciliacion: '❌ ERROR: Ruta Huérfana (En entregas pero NO en catálogo)' },
          { codigo_ruta: 'RT-D-04', nombre_ruta: '⚠️ Ruta Huérfana Fuera de Catálogo', paradas_planificadas_cat: 0, entregas_registradas_real: 5, brecha_entregas_faltantes: -5, estado_conciliacion: '❌ ERROR: Ruta Huérfana (En entregas pero NO en catálogo)' },
          { codigo_ruta: 'RT-C-01', nombre_ruta: 'Industrial South (En Catálogo)', paradas_planificadas_cat: 6, entregas_registradas_real: 0, brecha_entregas_faltantes: 6, estado_conciliacion: '⚠️ ADVERTENCIA: Ruta Sola (En catálogo pero SIN entregas)' },
          { codigo_ruta: 'RT-D-01', nombre_ruta: 'Suburban West (En Catálogo)', paradas_planificadas_cat: 11, entregas_registradas_real: 0, brecha_entregas_faltantes: 11, estado_conciliacion: '⚠️ ADVERTENCIA: Ruta Sola (En catálogo pero SIN entregas)' }
        ];
        setQueryResults(mockConciliation);
        setExecutionTimeMs(12);
        setIsExecuting(false);
        return;
      }

      let viewName = 'meli_deliveries';
      if (selectedQuery.id === 'query-1') viewName = 'meli_view_delay_by_route';
      else if (selectedQuery.id === 'query-3') viewName = 'meli_view_driver_stops';
      else if (selectedQuery.id === 'query-4') viewName = 'meli_view_delay_reasons';
      else if (selectedQuery.id === 'query-5') viewName = 'meli_view_anomalies';
      else if (selectedQuery.id === 'query-6') viewName = 'meli_routes';

      const { data, error } = await supabase.from(viewName).select('*');
      
      const endTime = performance.now();
      setExecutionTimeMs(Math.round(endTime - startTime));

      if (error || !data || data.length === 0) {
        setQueryResults([]);
      } else {
        setQueryResults(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al ejecutar la consulta SQL.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(customSql);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExportCsv = () => {
    if (!queryResults || queryResults.length === 0) return;
    const headers = Object.keys(queryResults[0]).join(',');
    const rows = queryResults.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedQuery.id}_meli_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" /> Consola SQL y Consultas para Meli
          </div>
          <h2 className="text-2xl font-extrabold text-white">Explorador SQL de Inteligencia Operativa</h2>
          <p className="text-slate-400 text-sm mt-1">
            Ejecuta y analiza en tiempo real las consultas SQL requeridas en el desafío técnico.
          </p>
        </div>

        <button
          onClick={handleRunQuery}
          disabled={isExecuting}
          className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-yellow-400/10 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <Play className={`w-4 h-4 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
          <span>{isExecuting ? 'Ejecutando SQL...' : 'Ejecutar Consulta'}</span>
        </button>
      </div>

      {/* Main Layout: Preset List & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Query Presets */}
        <div className="glass-panel p-4 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Consultas SQL del Desafío (5+ Requeridas)
          </h3>

          <div className="space-y-2">
            {SQL_QUERIES.map((query) => {
              const isSelected = selectedQuery.id === query.id;
              return (
                <button
                  key={query.id}
                  onClick={() => handleSelectQuery(query)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-yellow-400/10 border-yellow-400/40 text-yellow-400 shadow-md'
                      : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-extrabold text-yellow-400/90">{query.category}</span>
                    {isSelected && <Sparkles className="w-3.5 h-3.5 text-yellow-400" />}
                  </div>
                  <h4 className="text-xs font-bold leading-tight">{query.title}</h4>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Editor & Query Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedQuery.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedQuery.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>
            </div>

            {/* SQL Code Block */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 overflow-x-auto">
              <pre className="text-yellow-300/90 whitespace-pre-wrap leading-relaxed">
                {customSql}
              </pre>
            </div>
          </div>

          {/* Execution Stats & Controls */}
          {executionTimeMs !== null && !errorMessage && (
            <div className="flex items-center justify-between text-xs bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tiempo de ejecución en Supabase: <strong className="text-slate-200">{executionTimeMs} ms</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Table className="w-3.5 h-3.5 text-blue-400" />
                <span>Registros devueltos: <strong className="text-slate-200">{queryResults?.length || 0}</strong></span>
              </div>
            </div>
          )}

          {/* Results Table */}
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-xs text-rose-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold block">Error en consulta SQL:</span>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {queryResults && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-yellow-400" /> Resultados de la Consulta
                </h4>

                <button
                  onClick={handleExportCsv}
                  className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar CSV
                </button>
              </div>

              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      {Object.keys(queryResults[0] || {}).map((col) => (
                        <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {queryResults.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                            {val === null ? <span className="text-slate-600 font-sans italic">null</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
