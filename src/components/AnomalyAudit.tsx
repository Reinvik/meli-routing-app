import React from 'react';
import { Route, Delivery } from '../types';
import { 
  AlertOctagon, 
  FileWarning, 
  Database, 
  CheckCircle, 
  ShieldAlert, 
  Clock, 
  Truck,
  Box,
  Scale,
  ThermometerSnowflake,
  Apple,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FileCode
} from 'lucide-react';

interface AnomalyAuditProps {
  routes: Route[];
  deliveries: Delivery[];
}

export const AnomalyAudit: React.FC<AnomalyAuditProps> = ({ routes, deliveries }) => {
  // Identify orphan deliveries
  const orphanDeliveries = deliveries.filter(d => !routes.some(r => r.route_id === d.route_id));

  const auditItems = [
    {
      id: 'audit-1',
      category: 'TELEMETRÍA & FLOTA',
      title: 'Hallazgo Crítico: Ausencia de ID Móvil (`id_movil`) y Tipo de Móvil (`tipo_movil`)',
      severity: 'Severidad Crítica',
      severityColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      borderColor: 'border-rose-500/40',
      gradient: 'from-rose-500/10 via-amber-500/10 to-slate-900',
      icon: Truck,
      iconColor: 'text-rose-400',
      description: 'El dataset original registra conductores (`DriverID`) y tipo genérico (`VehicleType`), pero omite el identificador de patente del móvil (`id_movil`) y la caracterización técnica del vehículo (`tipo_movil`).',
      col1: {
        title: '1. Sin Registro de Patente (`id_movil`)',
        icon: FileWarning,
        color: 'text-amber-400',
        text: 'Imposibilita rastrear si un vehículo físico fue compartido entre choferes o asociar averías mecánicas (`Vehicle Breakdown`) a un móvil específico.'
      },
      col2: {
        title: '2. Carencia de Tipo Técnico (`tipo_movil`)',
        icon: Truck,
        color: 'text-purple-400',
        text: 'Desconoce la especificación del transporte (furgón refrigerado, moto con mochila, sedán), impidiendo validar su capacidad volumétrica (m³) y rango térmico.'
      },
      col3: {
        title: 'Solución Integrada al Modelo',
        icon: ShieldCheck,
        color: 'text-emerald-400',
        text: 'Inclusión de campos relacionales `id_movil` y `tipo_movil` en Supabase con matriz de compatibilidad por volumen, peso y temperatura.'
      }
    },
    {
      id: 'audit-2',
      category: 'CADENA DE FRÍO & INOCUIDAD',
      title: 'Logística de Alimentos: Cadena de Frío y Sensibilidad Térmica (Mercado Foods)',
      severity: 'Riesgo Sanitario',
      severityColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      borderColor: 'border-emerald-500/40',
      gradient: 'from-emerald-500/10 via-teal-500/10 to-slate-900',
      icon: Apple,
      iconColor: 'text-emerald-400',
      description: 'Al tratarse de entregas de comestibles y perecederos en línea, los retrasos provocan la degradación térmica de lácteos y el derretimiento de productos congelados.',
      col1: {
        title: '1. Ruptura Térmica por Avería',
        icon: ThermometerSnowflake,
        color: 'text-amber-400',
        text: 'En la moto (`RT-A-01`), la detención de 80 min por avería mecánica expuso los alimentos al calor urbano, generando merma total del pedido.'
      },
      col2: {
        title: '2. Condensación & Deformación de Cartón',
        icon: Box,
        color: 'text-purple-400',
        text: 'Retrasos de traslado provocan condensación por vapor de comida caliente o humedad de frío/deshielo, ablandando cajas de cartón y bolsas kraft hasta causar su deformación física.'
      },
      col3: {
        title: 'Solución Integrada al Modelo',
        icon: CheckCircle,
        color: 'text-emerald-400',
        text: 'Asignación obligatoria por rango térmico (`required_temp`) a vehículos isotérmicos o con refrigeración activa para asegurar inocuidad.'
      }
    },
    {
      id: 'audit-3',
      category: 'VOLUMETRÍA & FÍSICA DE CARGA',
      title: 'Omisión de Volumetría (m³) vs Peso (kg): El Dilema del Plomo vs las Plumas',
      severity: 'Capacidad de Carga',
      severityColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      borderColor: 'border-purple-500/40',
      gradient: 'from-purple-500/10 via-indigo-500/10 to-slate-900',
      icon: Scale,
      iconColor: 'text-purple-400',
      description: 'El archivo original sólo mide `PackageWeight (kg)`, omitiendo la volumetría (m³). Cargas livianas pero de alto volumen saturan los compartimentos independientemente del peso.',
      col1: {
        title: '1. El Dilema del Plomo vs Plumas',
        icon: Scale,
        color: 'text-amber-400',
        text: '4.0 kg de plomo ocupan el espacio de una manzana (0.001 m³), mientras 4.0 kg de cereales o pañales llenan un maletero completo (0.25 m³).'
      },
      col2: {
        title: '2. Sobrecarga en Motocicletas',
        icon: Truck,
        color: 'text-rose-400',
        text: 'Una motocicleta soporta 4 kg de peso pero colapsa ante el volumen cúbico de 8 paquetes grandes, provocando fallas mecánicas (`Vehicle Breakdown`).'
      },
      col3: {
        title: 'Solución Integrada al Modelo',
        icon: Sparkles,
        color: 'text-emerald-400',
        text: 'Cálculo de Peso Volumétrico V = (L × W × H) / 5000 y tope de llenado cúbico máximo al 85% de la capacidad útil del transporte.'
      }
    },
    {
      id: 'audit-4',
      category: 'INTEGRIDAD DE BASE DE DATOS & GOBERNANZA',
      title: 'Hallazgo Crítico: Faltan Datos en Tabla Rutas (`RT-C-03`, `RT-D-04`) y en Tabla Entregas (`deliveries`)',
      severity: 'Inconsistencia Vital',
      severityColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      borderColor: 'border-rose-500/40',
      gradient: 'from-rose-500/10 via-orange-500/10 to-slate-900',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
      description: 'Anomalía relacional dual: faltan registros maestros en la tabla de Rutas (routes) y faltan registros de entregas en la tabla de Entregas (deliveries).',
      col1: {
        title: '1. Faltan Datos en Tabla Rutas (routes)',
        icon: Database,
        color: 'text-rose-400',
        text: `Rutas RT-C-03 y RT-D-04 operan ${orphanDeliveries.length} entregas reales en la BD pero NO existen en el catálogo maestro de rutas (llaves huérfanas).`
      },
      col2: {
        title: '2. Faltan Datos en Tabla Entregas (deliveries)',
        icon: Clock,
        color: 'text-amber-400',
        text: 'Discrepancia entre las 8 a 11 paradas planificadas por catálogo vs las 5 entregas registradas por muestra, más la orden nula DEL-20240103-004 (address IS NULL).'
      },
      col3: {
        title: 'Solución Integrada al Modelo',
        icon: CheckCircle,
        color: 'text-emerald-400',
        text: 'Restricciones `FOREIGN KEY` rígidas en Supabase, trazabilidad de logs de auditoría y Join relacional resiliente.'
      }
    },
    {
      id: 'audit-5',
      category: 'DATA CLEANING & ETLS',
      title: 'Auditoría de Formatos: Corrupción de Números Flotantes por Formato Date en Excel',
      severity: 'Sanitización de Datos',
      severityColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      borderColor: 'border-cyan-500/40',
      gradient: 'from-cyan-500/10 via-blue-500/10 to-slate-900',
      icon: FileCode,
      iconColor: 'text-cyan-400',
      description: 'Valores numéricos continuos de distancia (`RouteDistance`) y peso (`PackageWeight`) fueron guardados en Excel con formato auto-convertido Date.',
      col1: {
        title: '1. Formatos Corruptos en Excel',
        icon: FileWarning,
        color: 'text-amber-400',
        text: 'Fechas como `2025-05-12` en lugar de `12.5 km`, o `2025-05-02` en lugar de `2.5 kg`, bloqueando funciones de agregación en SQL.'
      },
      col2: {
        title: '2. Mapeo de Reconstrucción',
        icon: RefreshCw,
        color: 'text-purple-400',
        text: 'Mapeo directo de componentes date: `2025-05-12` ➔ 12.5 km | `2025-08-11` ➔ 11.8 km | `2025-05-02` ➔ 2.5 kg | `2025-08-01` ➔ 1.8 kg.'
      },
      col3: {
        title: 'Solución Integrada al Modelo',
        icon: ShieldCheck,
        color: 'text-emerald-400',
        text: 'Pipeline de Sanitización ETL en Python que convirtió las instancias Date en números reales flotantes sanitizados antes de guardarlos en Supabase.'
      }
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-rose-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
              <AlertOctagon className="w-4 h-4" /> Diagnóstico de Calidad de Datos & Auditoría
            </div>
            <h2 className="text-2xl font-extrabold text-white">Análisis de Inconsistencias & Gobernanza de Datos</h2>
            <p className="text-slate-400 text-sm mt-1">
              Estándar unificado de auditoría para Mercado Foods: evaluación de hallazgos, impacto operacional y soluciones aplicadas.
            </p>
          </div>
          <span className="bg-rose-500/10 text-rose-300 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-mono font-bold shrink-0 hidden md:inline-block">
            5 Hallazgos Auditados
          </span>
        </div>

        {/* VITAL HIGHLIGHT CALLOUT BANNER */}
        <div className="bg-rose-500/10 border border-rose-500/40 p-4 rounded-xl text-xs space-y-2">
          <span className="font-extrabold text-rose-400 flex items-center gap-1.5 uppercase text-xs">
            <AlertOctagon className="w-4 h-4 text-rose-400" /> Hallazgo Vital de Auditoría: Faltan Datos en Tabla Rutas (`RT-C-03`, `RT-D-04`) y en Tabla Entregas (`deliveries`)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 text-[11.5px] leading-relaxed pt-1">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <strong className="text-rose-300 block mb-1">1. Faltan datos en Tabla Rutas (`routes`):</strong>
              Las rutas <code className="font-mono text-yellow-300">RT-C-03</code> y <code className="font-mono text-yellow-300">RT-D-04</code> operan en el dataset de entregas pero <strong>NO figuran en la tabla/catálogo maestro de rutas</strong>. Son llaves huérfanas en el sistema.
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <strong className="text-amber-300 block mb-1">2. Faltan datos en Tabla Entregas (`deliveries`):</strong>
              Existe una <strong>discrepancia crítica por entregas no registradas</strong> respecto a las paradas del catálogo (8 a 11 paradas teóricas vs 5 entregas registradas), sumado a la orden nula <code className="font-mono text-yellow-300">DEL-20240103-004</code> (<code className="font-mono">WHERE address IS NULL</code>).
            </div>
          </div>
        </div>
      </div>

      {/* Unified List of Audit Proposals */}
      <div className="space-y-6">
        {auditItems.map((item) => {
          const HeaderIcon = item.icon;
          const Col1Icon = item.col1.icon;
          const Col2Icon = item.col2.icon;
          const Col3Icon = item.col3.icon;

          return (
            <div 
              key={item.id} 
              className={`bg-gradient-to-r ${item.gradient} border ${item.borderColor} p-6 rounded-2xl space-y-4 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-slate-600`}
            >
              {/* Top Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <HeaderIcon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest block">
                      {item.category}
                    </span>
                    <h3 className="text-base font-extrabold text-white leading-snug">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${item.severityColor}`}>
                    {item.severity}
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Solución Integrada
                  </span>
                </div>
              </div>

              {/* Description Paragraph */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {item.description}
              </p>

              {/* Standard 3-Column Micro-Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
                {/* Column 1 */}
                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors">
                  <strong className={`${item.col1.color} font-bold block flex items-center gap-1.5 text-xs`}>
                    <Col1Icon className={`w-4 h-4 ${item.col1.color} shrink-0`} />
                    {item.col1.title}
                  </strong>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    {item.col1.text}
                  </p>
                </div>

                {/* Column 2 */}
                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors">
                  <strong className={`${item.col2.color} font-bold block flex items-center gap-1.5 text-xs`}>
                    <Col2Icon className={`w-4 h-4 ${item.col2.color} shrink-0`} />
                    {item.col2.title}
                  </strong>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    {item.col2.text}
                  </p>
                </div>

                {/* Column 3 - Solution */}
                <div className="bg-slate-950/90 p-4 rounded-xl border border-emerald-500/30 space-y-1.5 hover:border-emerald-500/50 transition-colors">
                  <strong className={`${item.col3.color} font-bold block flex items-center gap-1.5 text-xs`}>
                    <Col3Icon className={`w-4 h-4 ${item.col3.color} shrink-0`} />
                    {item.col3.title}
                  </strong>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {item.col3.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
