import * as XLSX from 'xlsx';
import { Route, Delivery } from '../types';

export const exportReportToExcel = (routes: Route[], deliveries: Delivery[]) => {
  const wb = XLSX.utils.book_new();

  // ───────────────────────────────────────────────────────────────────────────
  // HOJA 1: RESUMEN EJECUTIVO & KPIS
  // ───────────────────────────────────────────────────────────────────────────
  const summaryData = [
    ['MERCADO FOODS - INFORME EJECUTIVO Y DIAGNÓSTICO OPERACIONAL DE RUTAS'],
    ['Fecha de Generación:', new Date().toLocaleDateString('es-CL'), 'Plataforma:', 'Supabase Esquema meli'],
    ['Resumen Ejecutivo:', 'OTD del 78.9%. Faltan datos en tabla routes (rutas huérfanas RT-C-03 y RT-D-04), faltan entregas respecto a paradas planificadas y faltan campos esenciales como vehicle_id. Rutas suboptimizadas con potencial de ahorro de hasta un 75% en distancia.'],
    [],
    ['MÉTRICA / KPI', 'VALOR OTD / ESTADO', 'META (TARGET)', 'DESCRIPCIÓN OPERACIONAL'],
    ['Cumplimiento OTD', '78.9%', '≥ 95.0%', '15 entregadas a tiempo de 19 entregas válidas'],
    ['Total Registros', deliveries.length, '-', '20 entregas registradas en 3 días (01 Ene, 02 Ene, 03 Ene)'],
    ['Entregas a Tiempo', deliveries.filter(d => d.status === 'Delivered').length, '-', '15 entregadas dentro de ventana pactada'],
    ['Entregas con Retraso', deliveries.filter(d => d.status === 'Delayed').length, '0', '4 entregas retrasadas (Tráfico, Clima, Avería, Dirección)'],
    ['Registros Nulos / Incompletos', deliveries.filter(d => d.status === null).length, '0', '1 registro con address IS NULL (DEL-20240103-004)'],
    ['Tasa Conciliación Paradas vs Entregas', '58.8%', '100.0%', '7 entregas faltantes respecto a catálogo (+3 en RT-A-01, +4 en RT-B-02)'],
    ['Índice de Rutas Huérfanas', '50.0%', '0.0%', '10 de 20 entregas (RT-C-03 y RT-D-04 operadas por DR-103 y DR-104 sin registro en catálogo)'],
    ['Flota Sobrante en Tránsito', '-75%', '1 a 2 vehículos/día', 'Sobredespacho de 4 choferes/día para 8 paquetes (1.5h/chofer)'],
    [],
    ['DIAGNÓSTICO FORENSE DE RETRASOS (4 CASOS CRÍTICOS)'],
    ['Delivery ID', 'Fecha Orden', 'Día', 'Ruta', 'VehicleTypeRecommendation', 'Hora de Envío (Salida/Turno)', 'Kilos Envío Día', 'Motivo', 'Duración', 'Causa Raíz Operacional & Sistema'],
    ['DEL-20240102-005', '2024-01-02', 'Día 2 (02 Ene)', 'RT-A-01', 'Motorcycle', '09:00 hrs', '5.9 kg', 'Vehicle Breakdown', '80 min', 'Falta de mantenimiento preventivo pre-turno. Falla en moto trasladando 5.9 kg.'],
    ['DEL-20240101-004', '2024-01-01', 'Día 1 (01 Ene)', 'RT-C-03', 'Large Van', '08:00 hrs', '7.8 kg', 'Traffic', '65 min', 'Mala selección de vehículo (Large Van de 6m asignado en taco céntrico; se sugería conmutar a vehículo ágil).'],
    ['DEL-20240101-007', '2024-01-01', 'Día 1 (01 Ene)', 'RT-C-03', 'Large Van', '08:00 hrs', '7.8 kg', 'Weather (Rain)', '55 min', 'Falta de planificación ante lluvia (Adherencia y empaquetado de alimentos sobre la marcha).'],
    ['DEL-20240102-008', '2024-01-02', 'Día 2 (02 Ene)', 'RT-D-04', 'Car', '11:00 hrs', '2.9 kg', 'Wrong Address', '90 min', 'Fuga en el checkout de la app (Falta de autocompletado y geocodificación GPS obligatoria).']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 32 },
    { wch: 22 },
    { wch: 18 },
    { wch: 75 },
    { wch: 15 },
    { wch: 75 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen & KPIs');

  // ───────────────────────────────────────────────────────────────────────────
  // HOJA 2: REGISTROS DE ENTREGAS (DELIVERIES)
  // ───────────────────────────────────────────────────────────────────────────
  const deliveriesRows = deliveries.map(d => ({
    'ID Entrega': d.delivery_id,
    'Fecha Orden': d.order_date,
    'Fecha Despacho': d.delivery_date,
    'ID Ruta': d.route_id,
    'ID Conductor': d.driver_id,
    'ID Cliente': d.customer_id,
    'Dirección': d.address || 'NULO (address IS NULL)',
    'Latitud GPS': d.latitude !== null ? d.latitude : '-',
    'Longitud GPS': d.longitude !== null ? d.longitude : '-',
    'Peso (kg)': d.package_weight_kg !== null ? d.package_weight_kg : '-',
    'Duración (min)': d.delivery_time_min !== null ? d.delivery_time_min : '-',
    'Estado': d.status === 'Delivered' ? 'A Tiempo' : d.status === 'Delayed' ? 'Retrasado' : 'Registro Nulo',
    'Motivo de Retraso': d.reason_for_delay ? translateReason(d.reason_for_delay) : '-'
  }));

  const wsDeliveries = XLSX.utils.json_to_sheet(deliveriesRows);
  wsDeliveries['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDeliveries, 'Entregas (Deliveries)');

  // ───────────────────────────────────────────────────────────────────────────
  // HOJA 3: CATÁLOGO DE RUTAS (ROUTES)
  // ───────────────────────────────────────────────────────────────────────────
  const routesRows = routes.map(r => ({
    'ID Ruta': r.route_id,
    'Nombre de Ruta': r.route_name,
    'Distancia (km)': r.route_distance_km,
    'Tiempo Meta (min)': r.average_delivery_time_min,
    'N° Paradas': r.number_of_stops,
    'Zona Atendida': r.area_served,
    'Vehículo Recomendado': r.vehicle_type_recommendation,
    'Hora Inicio': r.typical_start_time,
    'Hora Término': r.typical_end_time
  }));

  const wsRoutes = XLSX.utils.json_to_sheet(routesRows);
  wsRoutes['!cols'] = [
    { wch: 12 },
    { wch: 28 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 22 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsRoutes, 'Catálogo de Rutas');

  // ───────────────────────────────────────────────────────────────────────────
  // HOJA 4: MATRIZ DE SOLUCIONES ESTRATÉGICAS
  // ───────────────────────────────────────────────────────────────────────────
  const solutionsData = [
    {
      'N°': 'Solución 0',
      'Categoría': 'Planificación de Flota',
      'Problema Encontrado': 'Sobredespacho masivo: 4 choferes/día para 8 paquetes (1.5h de trabajo efectivo por chofer). Sobrecosto del 75%.',
      'Propuesta de Solución': 'Consolidación Diaria por Lote (Dynamic Batch VRP). Agrupar la demanda del día en 1 o 2 vehículos activos.',
      'Impacto ROI Estimado': 'Reducción del 75% en vehículos sobrantes en tránsito y ahorro masivo en combustible y remuneraciones.'
    },
    {
      'N°': 'Solución 1',
      'Categoría': 'Operación & Clima',
      'Problema Encontrado': 'Uso ineficiente de Furgones Grandes (Large Vans) en tráfico denso céntrico y bajo lluvia sin maniobrabilidad.',
      'Propuesta de Solución': 'Despacho Inteligente Sensible al Clima: conmutación a vehículos ágiles (Small Vans / Cars) ante alertas de tráfico o lluvia.',
      'Impacto ROI Estimado': 'Reducción del 40% en retrasos por congestión y lluvia, asegurando la inocuidad alimentaria.'
    },
    {
      'N°': 'Solución 2',
      'Categoría': 'Tecnología & Checkout',
      'Problema Encontrado': 'Fallas de sistema que permiten ingresar direcciones erróneas (Wrong Address), provocando retrasos de 90 min.',
      'Propuesta de Solución': 'Integrar API de Autocompletado GPS y Geocodificación (Google Maps / Mapbox) obligatoria en el checkout de la app.',
      'Impacto ROI Estimado': 'Eliminación del 100% de retrasos por direcciones erróneas o ambiguas.'
    },
    {
      'N°': 'Solución 3',
      'Categoría': 'Gestión de Despacho',
      'Problema Encontrado': 'Asignación a ciegas de choferes comodín (DR-105) a reforzar rutas limpias (RT-B-02) en lugar de auxiliar cuellos de botella (RT-C-03).',
      'Propuesta de Solución': 'Torre de Control con alertas de desviación que direccione automáticamente al personal de relevo hacia las rutas con riesgo OTD.',
      'Impacto ROI Estimado': 'Mejora del 30% en la tasa de recuperación de rutas con problemas.'
    },
    {
      'N°': 'Solución 4',
      'Categoría': 'Mantenimiento & Flota',
      'Problema Encontrado': 'Avería mecánica en moto (DEL-20240102-005) con solo 5.9 kg por falta de mantenimiento preventivo pre-turno.',
      'Propuesta de Solución': 'Checklist digital obligatorio en la app del conductor antes de iniciar el turno (Pre-trip inspection).',
      'Impacto ROI Estimado': 'Prevención del 90% de fallas mecánicas en ruta y protección de la cadena de frío.'
    },
    {
      'N°': 'Solución 5',
      'Categoría': 'Logística de Alimentos',
      'Problema Encontrado': 'Omisión del volumen cúbico (m³). Productos voluminosos pero livianos saturan maleteros independientemente del peso.',
      'Propuesta de Solución': 'Calcular Peso Volumétrico V = (L × W × H) / 5000 y fijar ocupación cúbica máxima del 85% por vehículo.',
      'Impacto ROI Estimado': 'Eliminación de rechazos de carga y prevención de aplastamiento de alimentos frágiles.'
    },
    {
      'N°': 'Solución 6',
      'Categoría': 'Gobernanza de Datos SQL',
      'Problema Encontrado': 'Inconsistencias en base de datos como la orden DEL-20240103-004 con address IS NULL y rutas huérfanas fuera de catálogo.',
      'Propuesta de Solución': 'Restricciones de integridad referencial rígidas (FOREIGN KEY) en Supabase y validación de campos obligatorios.',
      'Impacto ROI Estimado': '100% de confiabilidad e integridad de datos en el sistema relacional.'
    }
  ];

  const wsSolutions = XLSX.utils.json_to_sheet(solutionsData);
  wsSolutions['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 45 },
    { wch: 45 },
    { wch: 35 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSolutions, 'Matriz de Soluciones');

  // Descargar archivo Excel (.xlsx)
  const fileName = `Informe_Ejecutivo_Mercado_Foods_Routing_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

function translateReason(r: string): string {
  if (r === 'Traffic') return 'Tráfico Denso';
  if (r === 'Weather (Rain)') return 'Clima (Lluvia)';
  if (r === 'Vehicle Breakdown') return 'Avería de Vehículo';
  if (r === 'Wrong Address') return 'Dirección Errónea';
  return r;
}
