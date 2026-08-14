import React from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  Truck, 
  Award,
  Sparkles,
  ShieldAlert,
  Box,
  ThermometerSnowflake,
  Code2
} from 'lucide-react';

export const SolutionsView: React.FC = () => {
  const solutionsList = [
    {
      id: 'sol-0',
      title: '0. Consolidación Diaria de Flota & Ruteo Dinámico por Lote (VRP)',
      problem: 'Gran cantidad de flota sub-utilizada y mal administrada: despliegue de 4 vehículos/choferes diarios para realizar solo 8 entregas por día (apenas 1.5h de trabajo efectivo por chofer), generando un sobrecosto operativo del 75%.',
      proposal: 'Implementar algoritmo de Ruteo Dinámico Diario (Vehicle Routing Problem). Consolidar la demanda del día en 1 o 2 vehículos activos, optimizando la densidad de paradas por ruta.',
      roi: 'Reducción del 75% en vehículos sobrantes en tránsito y ahorro masivo en combustible y remuneraciones de choferes.',
      category: 'Planificación de Flota'
    },
    {
      id: 'sol-1',
      title: '1. Despacho Inteligente Sensible al Clima y Tráfico Denso',
      problem: 'Uso ineficiente de furgones grandes (Large Vans) en corredores céntricos congestionados y bajo lluvia (Weather Rain / Traffic), perdiendo 55 a 65 min por no prever las condiciones ambientales y de maniobrabilidad.',
      proposal: 'Algoritmo de asignación que conmuta a vehículos ágiles (Small Vans / Cars) cuando se detecte alerta de tráfico o lluvia en la zona de entrega.',
      roi: 'Reducción del 40% en retrasos por congestión y lluvia, asegurando la inocuidad alimentaria.',
      category: 'Operacional & Clima'
    },
    {
      id: 'sol-2',
      title: '2. Validación e Inteligencia Geográfica de Direcciones en Checkout',
      problem: 'Fallas de sistema que permiten ingresar direcciones erróneas (Wrong Address), provocando retrasos extremos de hasta 90 minutos y desplazamientos de fecha de entrega.',
      proposal: 'Integrar API de Autocompletado GPS y Geocodificación (Google Maps / Mapbox) obligatoria en el checkout de la app de Mercado Foods antes de procesar el pedido.',
      roi: 'Eliminación del 100% de retrasos por direcciones erróneas o ambiguas.',
      category: 'Tecnológica & Sistema'
    },
    {
      id: 'sol-3',
      title: '3. Pautas de Inspección Preventiva de Flota (*Pre-Trip Inspection*)',
      problem: 'Averías mecánicas (`Vehicle Breakdown`) en motos debido a falta de mantenimiento preventivo y revisión técnica previa a la jornada.',
      proposal: 'Checklist digital obligatorio en la app del conductor antes de iniciar el turno (revisión de neumáticos, frenos, nivel de aceite y cadena de transmisión).',
      roi: 'Prevención del 90% de fallas mecánicas en ruta y protección de la cadena de frío.',
      category: 'Mantenimiento & Flota'
    },
    {
      id: 'sol-4',
      title: '4. Integración de Peso Volumétrico (m³) y Capacidad Cúbica de Flota',
      problem: 'El dataset omite el volumen cúbico (m³). Productos de alto volumen pero bajo peso (pañales, cereales) saturan maleteros independientemente del peso en kg.',
      proposal: 'Calcular el Peso Volumétrico V = (L × W × H) / 5000 y fijar una ocupación cúbica máxima del 85% por vehículo para evitar saturación de carga.',
      roi: 'Eliminación de rechazos de carga y prevención de aplastamiento de alimentos frágiles.',
      category: 'Logística de Alimentos'
    },
    {
      id: 'sol-5',
      title: '5. Auditoría Diaria Automatizada (Cron Jobs 08:00 AM) & Candados en Supabase',
      problem: 'Falta de datos en tablas esenciales (rutas huérfanas RT-C-03 y RT-D-04 ausentes en catálogo routes, entregas faltantes respecto a paradas planificadas, campo vehicle_id omitido en entregas y dirección nula en DEL-20240103-004).',
      proposal: 'Implementar tareas programadas diarias (Cron Jobs a las 08:00 AM) que ejecutan automáticamente las Consultas SQL 5, 9 y 10 para detectar inconsistencias y enviar un reporte diario automático por correo a logística. Respaldado con candados rígidos de Integridad Referencial (FOREIGN KEY) y reglas NOT NULL en Supabase.',
      roi: '100% de confiabilidad en la BD, reportes diarios automáticos en la bandeja de entrada y cero errores por datos faltantes.',
      category: 'Automatización & Cron Jobs'
    },
    {
      id: 'sol-6',
      title: '6. Columnas de Gobernanza: id_movil, tipo_movil, Capacidad (kg & m³) y Temperatura',
      problem: 'Ausencia de identificador único de auto/móvil (`id_movil`), clasificación técnica (`tipo_movil`), volumen cúbico del paquete ($m^3$) y temperatura exigida por el alimento.',
      proposal: 'Incorporar columnas obligatorias en la base de datos para mapear patente/ID de móvil, límite de peso (kg), volumen ($m^3$) y rango térmico (Congelado -18°C, Refrigerado 4°C-8°C, Ambiente).',
      roi: 'Trazabilidad 100% de la flota por patente, prevención de averías por sobrecarga y garantía de inocuidad alimentaria.',
      category: 'Arquitectura de Datos & Flota'
    }
  ];

  const metricsFramework = [
    {
      kpi: 'On-Time Delivery (OTD %)',
      target: '≥ 95.0%',
      current: '78.9%',
      why: 'Indicador principal de satisfacción del comprador. Mide el porcentaje de entregas realizadas a tiempo (15 de 19 válidas).'
    },
    {
      kpi: 'Kilometraje Total Recorrido',
      target: '12.57 km',
      current: '45.26 km',
      why: 'La re-sectorización por clústeres elimina el cruce en paralelo de vehículos, reduciendo 32.69 km (-72.2%).'
    },
    {
      kpi: 'Tiempo Promedio de Desviación por Ruta',
      target: '≤ +5 min',
      current: '+19 min (RT-A-01)',
      why: 'Mide la precisión del modelo de planificación de tiempos frente al tráfico urbano real.'
    },
    {
      kpi: 'Factor de Ocupación Cúbica (m³)',
      target: '≤ 85.0% Cúbico',
      current: 'Sin Medir (m³)',
      why: 'Evita sobrepasar la capacidad del maletero en productos voluminosos.'
    },
    {
      kpi: 'Tasa de Conformidad de Flota',
      target: '100.0%',
      current: 'Auditable con VehicleID',
      why: 'Asegura que cada conductor utilice el vehículo recomendado por el catálogo maestro.'
    },
    {
      kpi: 'Tasa de Conciliación Paradas vs Entregas',
      target: '100.0% Coincidente',
      current: '58.8% Cumplimiento',
      why: 'Mide la brecha entre las 17 paradas en catálogo (RT-A-01 y RT-B-02) vs las 10 entregas reales registradas.'
    },
    {
      kpi: 'Índice de Rutas Huérfanas',
      target: '0.0% Huérfanas',
      current: '50.0% en Riesgo',
      why: 'Mide las 10 entregas en RT-C-03 y RT-D-04 operadas sin estar registradas en la tabla maestro routes.'
    },
    {
      kpi: 'Tasa de Inconsistencia de Datos',
      target: '0.0%',
      current: '10.0% Anomalías',
      why: 'Garantiza que la toma de decisiones gerenciales se realice sobre datos 100% limpios y validados.'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-yellow-400/30">
        <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Lightbulb className="w-4 h-4" /> Soluciones Basadas en Datos & Marco de Métricas
        </div>
        <h2 className="text-2xl font-extrabold text-white">Plan de Acción Operativo & Métricas de Éxito</h2>
        <p className="text-slate-400 text-sm mt-1">
          Propuestas tecnológicas y operacionales para Mercado Foods acompañadas del cuadro de mando integral de KPIs.
        </p>
      </div>

      {/* Special Insight Highlight: Route Sectorization Analysis */}
      <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-slate-900 border border-yellow-400/40 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
            <h3 className="text-lg font-extrabold text-white">
              Análisis Crítico: ¿Son Óptimas las 4 Rutas Actuales?
            </h3>
          </div>
          <span className="bg-yellow-400 text-slate-950 px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider self-start md:self-auto">
            Ahorro Potencial del 72.2%
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-rose-400 font-bold">Respuesta: NO, las 4 rutas actuales no son óptimas.</strong> Al analizar las coordenadas GPS del dataset, descubrimos que las 4 rutas (<code className="text-yellow-300 font-mono">RT-A-01</code>, <code className="text-yellow-300 font-mono">RT-B-02</code>, <code className="text-yellow-300 font-mono">RT-C-03</code>, <code className="text-yellow-300 font-mono">RT-D-04</code>) se <strong className="text-white">solapan en paralelo cruzando de Este a Oeste todo el corredor metropolitano</strong> (-118.24° a -118.33°). Los 4 vehículos recorren el mismo trayecto en lugar de dividirse el territorio por zonas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                ❌ Asignación Actual (Solapada / Round-Robin)
              </span>
              <span className="font-mono text-rose-300 font-bold">45.26 km recorridos</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Los 4 vehículos recorren 45.26 km en total. Cada repartidor cruza toda la ciudad de punta a punta, pasando por al lado de entregas de otros conductores.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                ✅ Re-Sectorización Propuesta (Clústeres Geográficos)
              </span>
              <span className="font-mono text-emerald-300 font-bold">12.57 km recorridos</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Al dividir las 20 entregas en 4 clústeres zonales compactos (Sector Este, Centro-Este, Centro-Oeste y Oeste), la distancia total baja a <strong>12.57 km (-72.2%)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Solutions Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-yellow-400" /> Propuesta de Soluciones Estratégicas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {solutionsList.map((sol) => (
            <div key={sol.id} className="glass-panel p-6 rounded-2xl space-y-3 flex flex-col justify-between border-t-2 border-t-yellow-400">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-lg bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                    {sol.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase">Prioridad Alta</span>
                </div>

                <h4 className="text-base font-bold text-white">{sol.title}</h4>

                <div className="text-xs space-y-1.5 pt-1">
                  <p className="text-slate-400"><strong className="text-slate-300">Problema Detectado:</strong> {sol.problem}</p>
                  <p className="text-slate-300"><strong className="text-yellow-400">Propuesta de Solución:</strong> {sol.proposal}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-200"><strong>ROI Estimado:</strong> {sol.roi}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Capacity & Temperature Matrix Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 border-l-4 border-l-rose-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ThermometerSnowflake className="w-4 h-4 text-rose-400" /> Esquema de Gobernanza Propuesto & Aplicado
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Matriz de Especificación Térmica & Límites de Carga por Transporte (`id_movil` & `tipo_movil`)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cada transporte cuenta con identificador único (`id_movil`), tipo técnico (`tipo_movil`), peso máximo (kg), volumen máximo ($m^3$) y rango térmico para inocuidad de alimentos.
            </p>
          </div>
          <span className="bg-rose-500/20 text-rose-300 font-mono font-bold text-xs px-3 py-1.5 rounded-xl border border-rose-500/30 shrink-0 self-start md:self-auto">
            Columnas Integradas al Modelo
          </span>
        </div>

        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-300 uppercase font-bold text-[10px] tracking-wider bg-slate-950/80">
                <th className="py-3 px-3">ID Móvil (`id_movil`)</th>
                <th className="py-3 px-3">Tipo de Móvil (`tipo_movil`)</th>
                <th className="py-3 px-3 text-center">Peso Máx. (`max_weight_kg`)</th>
                <th className="py-3 px-3 text-center">Volumen Máx. (`max_volume_m3`)</th>
                <th className="py-3 px-3">Rango Térmico (`temp_control`)</th>
                <th className="py-3 px-3">Compatibilidad de Alimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-3 px-3 font-bold text-rose-400">MOV-MOTO-01 / 02</td>
                <td className="py-3 px-3 text-white font-sans font-semibold">Motocicleta Urbana con Mochila Térmica</td>
                <td className="py-3 px-3 text-center font-bold text-yellow-300">30 kg max</td>
                <td className="py-3 px-3 text-center font-bold text-cyan-300">0.12 m³ max</td>
                <td className="py-3 px-3 text-emerald-400 font-sans font-bold">Refrigerado (4°C a 8°C)</td>
                <td className="py-3 px-3 text-slate-300 font-sans">Lácteos frescos, postres, panadería ágil</td>
              </tr>
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-3 px-3 font-bold text-indigo-400">MOV-VAN-101 / 102</td>
                <td className="py-3 px-3 text-white font-sans font-semibold">Small Van Isotérmica Dual-Temp</td>
                <td className="py-3 px-3 text-center font-bold text-yellow-300">350 kg max</td>
                <td className="py-3 px-3 text-center font-bold text-cyan-300">2.50 m³ max</td>
                <td className="py-3 px-3 text-cyan-400 font-sans font-bold">Congelado (-18°C) / Refrigerado</td>
                <td className="py-3 px-3 text-slate-300 font-sans">Helados, carnes congeladas, packs semanales</td>
              </tr>
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-3 px-3 font-bold text-amber-400">MOV-FURGON-201 / 202</td>
                <td className="py-3 px-3 text-white font-sans font-semibold">Furgón Gran Tonelaje Refrigerado Activo</td>
                <td className="py-3 px-3 text-center font-bold text-yellow-300">800 kg max</td>
                <td className="py-3 px-3 text-center font-bold text-cyan-300">6.00 m³ max</td>
                <td className="py-3 px-3 text-emerald-400 font-sans font-bold">Refrigerado Activo (0°C a 5°C)</td>
                <td className="py-3 px-3 text-slate-300 font-sans">Cajas voluminosas, bebidas, abarrotes masivos</td>
              </tr>
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-3 px-3 font-bold text-purple-400">MOV-AUTO-301 / 302</td>
                <td className="py-3 px-3 text-white font-sans font-semibold">Sedán Ejecutivo Compacto (Auto)</td>
                <td className="py-3 px-3 text-center font-bold text-yellow-300">150 kg max</td>
                <td className="py-3 px-3 text-center font-bold text-cyan-300">0.45 m³ max</td>
                <td className="py-3 px-3 text-amber-400 font-sans font-bold">Ambiente / Coolbox Pasivo</td>
                <td className="py-3 px-3 text-slate-300 font-sans">Abarrotes secos, enlatados, no perecederos</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Metrics Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" /> Cuadro de Mando: Métricas de Éxito (KPIs)
            </h3>
            <p className="text-xs text-slate-400">Indicadores clave de rendimiento con justificación de impacto en el negocio</p>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
            6 KPIs Definidos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-300 uppercase font-bold text-[11px] tracking-wider">
                <th className="py-3.5 px-4 min-w-[200px]">Métrica / KPI</th>
                <th className="py-3.5 px-4 text-center min-w-[160px]">Meta (Target)</th>
                <th className="py-3.5 px-4 text-center min-w-[240px]">Estado Actual</th>
                <th className="py-3.5 px-4 min-w-[280px]">Justificación & Por qué es Clave</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metricsFramework.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-4 px-4 font-bold text-white leading-snug">{m.kpi}</td>
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl font-mono font-bold text-xs inline-block shadow-sm">
                      {m.target}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl font-mono font-bold text-xs inline-block shadow-sm">
                      {m.current}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-300 leading-relaxed text-xs">{m.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Infrastructure & Tools Implemented Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 border-t-2 border-t-yellow-400">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-yellow-400" /> Infraestructura & Herramientas Implementadas
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
