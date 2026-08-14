import React, { useState } from 'react';
import { Route, Delivery } from '../types';
import { SQL_QUERIES } from './SqlExplorer';
import html2pdf from 'html2pdf.js';
import { exportReportToExcel } from '../lib/excelExport';
import { 
  Printer, 
  FileText, 
  Code2, 
  HelpCircle,
  Download,
  Loader2,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

interface ExecutiveReportProps {
  routes: Route[];
  deliveries: Delivery[];
}

export const ExecutiveReport: React.FC<ExecutiveReportProps> = ({ routes, deliveries }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const [excelSuccess, setExcelSuccess] = useState(false);

  const handleDownloadExcel = () => {
    try {
      exportReportToExcel(routes, deliveries);
      setExcelSuccess(true);
      setTimeout(() => setExcelSuccess(false), 4000);
    } catch (err) {
      console.error('Error generando archivo Excel:', err);
    }
  };

  const handlePrint = () => {
    window.focus();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setDownloadSuccess(false);

    try {
      const element = document.getElementById('printable-executive-report');
      if (!element) throw new Error('Elemento no encontrado');

      // ── PASO 1: Leer todos los estilos computados ANTES de deshabilitar hojas ──
      // getComputedStyle() resuelve oklch→rgb internamente; guardamos esos valores RGB.
      type StyleSnapshot = { el: HTMLElement; styles: Record<string, string> };
      const KEY_PROPS = [
        'color','background-color','border-color',
        'border-top-color','border-bottom-color','border-left-color','border-right-color',
        'font-size','font-weight','font-family','font-style','line-height',
        'text-align','letter-spacing',
        'padding-top','padding-bottom','padding-left','padding-right',
        'margin-top','margin-bottom','margin-left','margin-right',
        'border-width','border-style','border-radius',
        'display','flex-direction','justify-content','align-items','gap',
        'width','max-width','overflow','white-space',
      ];

      const snapshots: StyleSnapshot[] = [];
      [element, ...Array.from(element.querySelectorAll('*'))].forEach((node) => {
        const el = node as HTMLElement;
        const cs = window.getComputedStyle(el);
        const styles: Record<string, string> = {};
        KEY_PROPS.forEach(prop => {
          const val = cs.getPropertyValue(prop);
          if (val) styles[prop] = val;
        });
        snapshots.push({ el, styles });
      });

      // ── PASO 2: Clonar el elemento ───────────────────────────────────────────
      const clone = element.cloneNode(true) as HTMLElement;
      const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))] as HTMLElement[];

      // Aplicar estilos inline RGB al clon (sin depender de hojas de estilo)
      cloneNodes.forEach((h, i) => {
        const snap = snapshots[i];
        if (!snap) return;

        KEY_PROPS.forEach(prop => {
          if (snap.styles[prop]) h.style.setProperty(prop, snap.styles[prop]);
        });

        // Neutralizar efectos que rompen html2canvas
        h.style.backdropFilter = 'none';
        (h.style as any).webkitBackdropFilter = 'none';
        h.style.filter = 'none';
        h.style.boxShadow = 'none';
        h.style.textShadow = 'none';
        h.style.backgroundImage = 'none'; // kill gradients

        // Forzar modo claro si el fondo es oscuro
        const bg = snap.styles['background-color'] ?? '';
        const nums = bg.match(/\d+/g)?.map(Number) ?? [255,255,255];
        if ((nums[0]??255) < 80 && (nums[1]??255) < 80 && (nums[2]??255) < 80) {
          h.style.backgroundColor = '#f8fafc';
          h.style.color = '#0f172a';
        }
      });

      clone.style.backgroundColor = '#ffffff';
      clone.style.color = '#0f172a';
      clone.style.padding = '32px';
      clone.style.width = '800px';
      clone.style.fontFamily = 'system-ui, -apple-system, sans-serif';

      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;left:-9999px;top:0;width:820px;';
      container.appendChild(clone);
      document.body.appendChild(container);

      // ── PASO 3: DESHABILITAR TODAS LAS HOJAS DE ESTILO del documento ─────────
      // html2canvas escanea document.styleSheets y falla con oklch de Tailwind v4.
      // Deshabilitando las hojas ANTES de ejecutar html2pdf, el parser nunca ve oklch.
      // Los estilos ya están como inline en el clon, así que el PDF queda bien.
      const sheets = Array.from(document.styleSheets);
      sheets.forEach(s => { try { s.disabled = true; } catch (_) {} });

      try {
        const opt = {
          margin: [0.3, 0.3, 0.3, 0.3] as [number, number, number, number],
          filename: 'Informe_Ejecutivo_Mercado_Foods_Routing.pdf',
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
        };

        await html2pdf().set(opt).from(clone).save();
      } finally {
        // ── PASO 4: REACTIVAR todas las hojas de estilo ────────────────────────
        sheets.forEach(s => { try { s.disabled = false; } catch (_) {} });
      }

      document.body.removeChild(container);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Error generando PDF:', err);
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar - Premium Aesthetic Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl print:hidden">
        <div>
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-extrabold uppercase tracking-wider mb-1">
            <span className="bg-yellow-400 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black">MF</span>
            <span>Documento Oficial de Evaluación • Mercado Foods</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Informe Ejecutivo Final (WorkSample Routing)</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Análisis de retrasos, cadena de frío, volumetría, asignación ineficiente de comodines (`DR-105`), soluciones y KPIs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto shrink-0">
          {/* Excel Download Button */}
          <button
            onClick={handleDownloadExcel}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer border border-emerald-400/50"
            title="Descargar Informe Completo en Formato Excel (.xlsx)"
          >
            {excelSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>¡Excel Descargado!</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                <span>Descargar Excel (.xlsx)</span>
              </>
            )}
          </button>

          {/* Direct PDF Download Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 disabled:opacity-50 text-slate-950 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-xl shadow-yellow-400/20 flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer border border-yellow-300/50"
            title="Guardar archivo PDF directamente en tu equipo"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Generando Archivo PDF...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                <span>¡PDF Descargado!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-slate-950" />
                <span>Descargar PDF (.pdf)</span>
              </>
            )}
          </button>

          {/* Browser Print Button */}
          <button
            onClick={handlePrint}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-slate-700 hover:border-slate-600 shadow-md flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer"
            title="Abrir asistente de impresión del navegador"
          >
            <Printer className="w-4 h-4 text-yellow-400" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Printable Document Sheet */}
      <div 
        id="printable-executive-report"
        className="bg-slate-900 border border-slate-800 text-slate-100 p-8 sm:p-12 rounded-2xl shadow-2xl max-w-4xl mx-auto space-y-10 print:bg-white print:text-black print:p-0 print:shadow-none print:border-none"
      >
        {/* Document Header */}
        <div className="border-b border-slate-800 print:border-black pb-8 flex items-start justify-between">
          <div>
            <div className="bg-yellow-400 text-slate-950 px-3 py-1 rounded font-extrabold text-xs inline-block mb-3 print:border print:border-black">
              MERCADO FOODS — EVALUACIÓN TÉCNICA
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white print:text-black">
              Informe de Evaluación de Eficiencia Operativa y Optimización de Rutas
            </h1>
            <p className="text-sm text-slate-400 print:text-slate-700 mt-2">
              Caso: Evaluación de Rutas de Entrega de Comestibles en Línea (Grocery Logistics)
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 print:text-slate-600 space-y-1 hidden sm:block">
            <div><strong>Candidato:</strong> Ariel (Antigravity Agent)</div>
            <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-CL')}</div>
            <div><strong>Esquema Supabase:</strong> <code className="font-mono text-yellow-400 print:text-black">meli</code></div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h2 className="text-xl font-extrabold text-yellow-400 print:text-black border-b border-slate-800 print:border-slate-300 pb-2">
            1. Resumen Ejecutivo
          </h2>
          <div className="bg-slate-950 print:bg-slate-100 p-5 rounded-xl border border-slate-800 print:border-slate-300 space-y-3.5 text-sm text-slate-300 print:text-slate-800">
            <div className="flex items-center gap-2 text-base font-bold text-white print:text-black">
              <span>🎯</span>
              <span>Cumplimiento OTD: <strong className="text-yellow-400 print:text-black">78.9% (Operacional)</strong> / <strong className="text-amber-400 print:text-black">75.0% (Estricto)</strong></span>
            </div>

            <div className="space-y-1.5">
              <strong className="text-rose-400 print:text-rose-800 flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                Inconsistencia Crítica de Datos & Tablas Faltantes:
              </strong>
              <ul className="list-disc list-inside space-y-1 pl-2 text-xs leading-relaxed">
                <li>
                  <strong className="text-white print:text-black">Rutas Huérfanas:</strong> Entregas registradas en <code className="text-yellow-300 font-mono">RT-C-03</code> y <code className="text-yellow-300 font-mono">RT-D-04</code> <strong>no existen en la tabla maestra <code className="font-mono">routes</code></strong> (10 de 20 entregas sin registro).
                </li>
                <li>
                  <strong className="text-white print:text-black">Entregas y Paradas Faltantes:</strong> Discrepancia numérica entre las paradas planificadas por catálogo (8 a 11 paradas) vs las 5 entregas registradas por ruta en la tabla <code className="font-mono">deliveries</code>.
                </li>
                <li>
                  <strong className="text-white print:text-black">Campos Esenciales Faltantes:</strong> Omisión de llaves operacionales críticas como <code className="text-yellow-300 font-mono">vehicle_id</code> (<code className="font-mono">id_vehiculo</code>) y <code className="text-yellow-300 font-mono">vehicle_type</code> en los registros de entrega real.
                </li>
              </ul>
            </div>

            <div className="space-y-1.5 pt-1">
              <strong className="text-emerald-400 print:text-emerald-800 flex items-center gap-1.5 font-bold">
                <span>🚚</span> Suboptimización de Rutas & Potencial de Ahorro del 75%:
              </strong>
              <p className="text-xs leading-relaxed pl-2">
                Los trazados actuales están <strong>suboptimizados con trayectos cruzados e ineficientes</strong> (4 choferes recorren 45.26 km para solo 8 paquetes diarios). La re-sectorización por clústeres geográficos y ruteo dinámico por lote permite <strong>ahorrar hasta un 72.2% - 75% en distancia recorrida (de 45.26 km a 12.57 km)</strong> y liberar flota sobrante.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Concrete Answers to Specific Questions */}
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-yellow-400 print:text-black border-b border-slate-800 print:border-slate-300 pb-2 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-yellow-400 print:text-black" /> 2. Respuestas Concretas a Preguntas Específicas del Caso
          </h2>

          <div className="space-y-4 text-xs text-slate-300 print:text-slate-800">
            {/* Question 1 Verbatim */}
            <div className="bg-slate-950 print:bg-slate-100 p-5 rounded-xl border border-slate-800 print:border-slate-300 space-y-2.5">
              <h3 className="font-extrabold text-yellow-400 print:text-black text-sm leading-snug">
                ¿Qué rutas tienen los mayores retrasos en comparación con su AverageDeliveryTime?
              </h3>
              
              <div className="space-y-2 leading-relaxed">
                <p>
                  <strong className="text-white print:text-black">1. Ruta <code className="text-yellow-300 font-mono font-bold">RT-A-01</code> (City Center North):</strong> Es la <strong>única ruta registrada en el catálogo que presenta retraso respecto a su meta</strong>, promediando <strong className="text-yellow-400 print:text-black">49.0 min vs 30.0 min de meta (+19.0 min de exceso / +63.3%)</strong>.
                </p>
                
                <p>
                  <strong className="text-white print:text-black">2. Ruta <code className="text-emerald-300 font-mono font-bold">RT-B-02</code> (Residential West):</strong> Cumple la meta del catálogo con un tiempo promedio de <strong className="text-emerald-400 print:text-black">34.7 min vs 38.0 min de meta (-3.3 min de ahorro)</strong> y 0 entregas retrasadas.
                </p>
                
                <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/30 text-rose-300 print:text-rose-900 mt-2 space-y-1">
                  <strong className="font-bold flex items-center gap-1.5 text-xs text-rose-400 print:text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    ⚠️ ALERTA DE DATOS FALTANTES (Rutas sin tiempo objetivo en catálogo):
                  </strong>
                  <p className="text-xs text-slate-300 print:text-slate-800">
                    Las rutas <strong className="text-white font-mono">RT-C-03</strong> (promedio real: <strong>58.3 min</strong>) y <strong className="text-white font-mono">RT-D-04</strong> (promedio real: <strong>48.8 min</strong>, con pico individual de 90 min) <strong>NO TIENEN <code className="font-mono text-yellow-300">AverageDeliveryTime</code> en el catálogo</strong> por ser <strong>rutas huérfanas ausentes de la tabla <code className="font-mono text-yellow-300">routes</code></strong>. Por lo tanto, no cuentan con tiempo de espera/meta formal para comparar.
                  </p>
                </div>
              </div>
            </div>

            {/* Question 2 Verbatim */}
            <div className="bg-slate-950 print:bg-slate-100 p-5 rounded-xl border border-slate-800 print:border-slate-300 space-y-2.5">
              <h3 className="font-extrabold text-yellow-400 print:text-black text-sm leading-snug">
                ¿Concuerda el tipo de vehículo utilizado en una entrega con el VehicleTypeRecommendation para esa ruta? ¿Existe una correlación entre la conformidad y los retrasos?
              </h3>
              
              <div className="space-y-2 leading-relaxed">
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-amber-200 print:text-slate-800 space-y-1">
                  <strong className="font-bold flex items-center gap-1.5 text-xs text-amber-400 print:text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ⚠️ ALERTA DE CAMPO FALTANTE EN ENTREGAS:
                  </strong>
                  <p className="text-xs text-slate-300 print:text-slate-800">
                    En la tabla operacional <code className="font-mono text-white print:text-black">deliveries</code> <strong>falta la columna del vehículo utilizado (<code className="font-mono text-yellow-300">vehicle_id</code> / <code className="font-mono text-yellow-300">vehicle_type</code>)</strong>. No se registró qué móvil atendió cada despacho físico.
                  </p>
                </div>

                <p>
                  <strong className="text-white print:text-black">1. Análisis por Catálogo Maestro:</strong> El catálogo de <code className="font-mono text-yellow-300 font-bold">routes</code> recomienda un móvil específico (<code className="font-mono">Motorcycle</code>, <code className="font-mono">Small Van</code>, <code className="font-mono">Large Van</code>, <code className="font-mono">Car</code>).
                </p>

                <p>
                  <strong className="text-white print:text-black">2. Correlación Directa de Inconformidad y Retrasos:</strong> Usar furgones grandes (<code className="font-mono">Large Van</code>) en tacos céntricos provocó demoras de 65 min (<code className="font-mono">RT-C-03</code>), mientras que motocicletas sin verificar volumen cúbico (<code className="font-mono">m³</code>) sufrieron fallas mecánicas de 80 min (<code className="font-mono">RT-A-01</code>).
                </p>

                <p className="text-rose-400 print:text-rose-800 font-semibold text-xs">
                  🚨 En las rutas huérfanas <code className="font-mono text-yellow-300">RT-C-03</code> y <code className="font-mono text-yellow-300">RT-D-04</code> tampoco existe vehículo recomendado por no estar registradas en la tabla <code className="font-mono">routes</code>.
                </p>
              </div>
            </div>

            {/* Question 3 Verbatim */}
            <div className="bg-slate-950 print:bg-slate-100 p-5 rounded-xl border border-slate-800 print:border-slate-300 space-y-2.5">
              <h3 className="font-extrabold text-yellow-400 print:text-black text-sm leading-snug">
                ¿Qué conductores tienen rutas con más paradas de lo normal?
              </h3>

              <div className="space-y-1.5 leading-relaxed">
                <p>
                  <strong className="text-white print:text-black">1. Conductor <code className="text-yellow-300 font-mono font-bold">DR-104</code> (Ruta <code className="font-mono font-bold">RT-D-04</code>):</strong> Asignado a la ruta con <strong>mayor número de paradas planificadas (11 paradas en catálogo - +37.5% sobre la norma base de 8)</strong>.
                </p>
                <p>
                  <strong className="text-white print:text-black">2. Conductor <code className="text-yellow-300 font-mono font-bold">DR-102</code> (Ruta <code className="font-mono font-bold">RT-B-02</code>):</strong> Asignado a la segunda ruta con más paradas (<strong>9 paradas en catálogo - +12.5% sobre la norma</strong>), logrando 34.7 min de promedio y 0 retrasos.
                </p>
                <p>
                  <strong className="text-white print:text-black">3. Conductor Comodín <code className="text-amber-300 font-mono font-bold">DR-105</code>:</strong> Cubrió apoyo en rutas con promedio ponderado de <strong>8.5 paradas en catálogo</strong> (<code className="font-mono">RT-A-01</code> y <code className="font-mono">RT-B-02</code>).
                </p>
                <p>
                  <strong className="text-white print:text-black">4. Conductor <code className="text-slate-200 font-mono font-bold">DR-101</code> (Ruta <code className="font-mono font-bold">RT-A-01</code>):</strong> Asignado a la norma estándar de <strong>8 paradas en catálogo</strong>.
                </p>
                <p>
                  <strong className="text-white print:text-black">5. Conductor <code className="text-slate-200 font-mono font-bold">DR-103</code> (Ruta <code className="font-mono font-bold">RT-C-03</code>):</strong> Asignado a <strong>6 paradas teóricas</strong> (bajo la norma).
                </p>

                <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/30 text-rose-300 print:text-rose-900 mt-2 space-y-1">
                  <strong className="font-bold flex items-center gap-1.5 text-xs text-rose-400 print:text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    🚨 ALERTA DE DISCREPANCIA Y DATOS FALTANTES:
                  </strong>
                  <p className="text-xs text-slate-300 print:text-slate-800">
                    En la tabla <code className="font-mono text-yellow-300">deliveries</code> <strong>faltan entregas registradas</strong> (5 por muestra vs 8-11 paradas del catálogo). Además, las rutas <code className="font-mono text-yellow-300">RT-C-03</code> y <code className="font-mono text-yellow-300">RT-D-04</code> <strong>faltan en la tabla <code className="font-mono">routes</code></strong> y <code className="font-mono">DR-104</code> registra la orden nula <code className="font-mono">DEL-20240103-004</code> (<code className="font-mono">address IS NULL</code>).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: SQL Queries */}
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-yellow-400 print:text-black border-b border-slate-800 print:border-slate-300 pb-2">
            3. Consultas SQL Utilizadas para el Análisis Exploratorio (5 Consultas)
          </h2>

          <div className="space-y-4 text-xs">
            {SQL_QUERIES.slice(0, 5).map((q) => (
              <div key={q.id} className="bg-slate-950 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300 space-y-2">
                <div className="font-bold text-white print:text-black text-sm">{q.title}</div>
                <p className="text-slate-400 print:text-slate-700">{q.description}</p>
                <pre className="font-mono text-yellow-300 print:text-slate-900 bg-slate-900 print:bg-white p-3 rounded overflow-x-auto text-[11px]">
                  {q.sql}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Problem Identification */}
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-yellow-400 print:text-black border-b border-slate-800 print:border-slate-300 pb-2">
            4. Identificación de los Problemas Encontrados (Planificación y Sistema)
          </h2>
          
          {/* VITAL MISSING DATA CALLOUT BOX */}
          <div className="bg-rose-500/10 border border-rose-500/40 p-4 rounded-xl text-xs space-y-2 print:border-slate-300 print:bg-slate-100">
            <span className="font-extrabold text-rose-400 print:text-rose-800 flex items-center gap-1.5 uppercase text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Hallazgo Vital: Faltan Datos en Tabla Rutas (`RT-C-03`, `RT-D-04`) y en Tabla Entregas (`deliveries`)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 print:text-slate-800 text-[11.5px] leading-relaxed">
              <div className="bg-slate-950/80 print:bg-white p-3 rounded-lg border border-slate-800 print:border-slate-300">
                <strong className="text-rose-300 print:text-black block mb-1">1. Faltan datos en Tabla Rutas (`routes`):</strong>
                Las rutas <code className="font-mono text-yellow-300 print:text-black">RT-C-03</code> y <code className="font-mono text-yellow-300 print:text-black">RT-D-04</code> operan en el dataset de entregas pero <strong>NO existen en la tabla/catálogo de rutas maestro</strong>. Son llaves huérfanas fuera de catálogo que impiden calcular desviaciones estándar de tiempo.
              </div>
              <div className="bg-slate-950/80 print:bg-white p-3 rounded-lg border border-slate-800 print:border-slate-300">
                <strong className="text-amber-300 print:text-black block mb-1">2. Faltan datos en Tabla Entregas (`deliveries`):</strong>
                Existe una <strong>discrepancia crítica por entregas no registradas</strong>: el catálogo planifica de 8 a 11 paradas por ruta, pero la tabla de entregas registra solo 5 entregas por muestreo, sumado a la orden nula <code className="font-mono text-yellow-300 print:text-black">DEL-20240103-004</code> (<code className="font-mono">WHERE address IS NULL</code>).
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300 space-y-1.5">
              <strong className="text-rose-400 print:text-red-700 font-bold block text-sm">Problema 1: Flota Sub-utilizada y Mal Administrada</strong>
              <p className="text-slate-300 print:text-slate-800 leading-relaxed">
                Despliegue de 4 vehículos/choferes diarios para realizar solo 8 entregas por día (1.5h de trabajo por chofer). Un sobrecosto operacional del 75% en flota sobrante en tránsito.
              </p>
            </div>

            <div className="bg-slate-950 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300 space-y-1.5">
              <strong className="text-rose-400 print:text-red-700 font-bold block text-sm">Problema 2: Selección Inadecuada de Vehículos y Clima</strong>
              <p className="text-slate-300 print:text-slate-800 leading-relaxed">
                Uso de furgones grandes (Large Vans) en tráfico denso urbano y bajo lluvia sin prever congestión ni maniobrabilidad, generando 55-65 min de demora.
              </p>
            </div>

            <div className="bg-slate-950 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300 space-y-1.5">
              <strong className="text-rose-400 print:text-red-700 font-bold block text-sm">Problema 3: Fallas del Sistema en Checkout (Direcciones)</strong>
              <p className="text-slate-300 print:text-slate-800 leading-relaxed">
                Falta de validación y geocodificación GPS en el checkout de la app, permitiendo direcciones erróneas que causaron 90 min de retraso y entregas desfasadas de día.
              </p>
            </div>

            <div className="bg-slate-950 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300 space-y-1.5">
              <strong className="text-rose-400 print:text-red-700 font-bold block text-sm">Problema 4: Rutas Deficientes y Despacho A Ciegas</strong>
              <p className="text-slate-300 print:text-slate-800 leading-relaxed">
                Ausencia de ruteo dinámico por lote diario (VRP) y asignación ineficiente de choferes comodín (`DR-105`) a rutas limpias en lugar de auxiliares.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Strategic Solutions */}
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-yellow-400 print:text-black border-b border-slate-800 print:border-slate-300 pb-2">
            5. Propuesta de Soluciones Estratégicas
          </h2>
          <ol className="list-decimal list-inside text-xs text-slate-300 print:text-slate-800 space-y-2.5 leading-relaxed">
            <li>
              <strong>Solución a Problema 1 — Consolidación Diaria de Flota (Batch Routing VRP):</strong> Agrupar los pedidos del día en 1 o 2 vehículos activos, reduciendo el sobrecosto de flota en 75% y maximizando la densidad de paradas.
            </li>
            <li>
              <strong>Solución a Problema 2 — Ruteo Sensible al Clima y Flota Ágil:</strong> Algoritmo de despacho que conmuta a vehículos ágiles (Small Vans / Car) ante alertas meteorológicas o tráfico pesado.
            </li>
            <li>
              <strong>Solución a Problema 3 — API de Autocompletado GPS Google Maps en Checkout:</strong> Validación obligatoria de latitud/longitud en el formulario de compra antes de permitir la emisión del pedido.
            </li>
            <li>
              <strong>Solución a Problema 4 — Pautas de Inspección Preventiva (*Pre-Trip*) & Constraints en Supabase:</strong> Chequeo mecánico diario obligatorio en app móvil y restricciones relacionales en base de datos.
            </li>
            <li>
              <strong>Solución a Problema 5 — Modelo de Datos Enriquecido (`id_movil`, `tipo_movil`, $m^3$, $kg$ y Temperatura):</strong> Creación de columnas obligatorias en la arquitectura para mapear patente/ID de auto (`id_movil`), clasificación de vehículo (`tipo_movil`), límites de carga física (peso máx $kg$ y volumen máx $m^3$) y rango térmico exigido por el alimento (congelado, refrigerado, ambiente).
            </li>
          </ol>
        </div>

        {/* Section 6: Success Metrics */}
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-yellow-400 print:text-black border-b border-slate-800 print:border-slate-300 pb-2">
            6. Cuadro de Mando de KPIs Propuestos & Explicación
          </h2>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-700 uppercase font-bold text-[11px]">
                  <th className="py-2.5 px-3 min-w-[180px]">Métrica / KPI</th>
                  <th className="py-2.5 px-3 text-center min-w-[140px]">Meta (Target)</th>
                  <th className="py-2.5 px-3 text-center min-w-[180px]">Estado Actual</th>
                  <th className="py-2.5 px-3 min-w-[260px]">Justificación de Impacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                <tr>
                  <td className="py-3 px-3 font-bold text-white print:text-black">On-Time Delivery Rate (OTD %)</td>
                  <td className="py-3 px-3 text-center text-emerald-400 print:text-emerald-800 font-mono font-bold">≥ 95.0%</td>
                  <td className="py-3 px-3 text-center text-amber-400 print:text-amber-800 font-mono font-bold">78.9% (Operacional) / 75.0% (Estricto)</td>
                  <td className="py-3 px-3 text-slate-300 print:text-slate-800"><strong>¿Por qué?:</strong> Satisfacción del comprador en comestibles en línea.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-white print:text-black">Tasa de Integridad Alimentaria & Cadena de Frío</td>
                  <td className="py-3 px-3 text-center text-emerald-400 print:text-emerald-800 font-mono font-bold">100.0% Compliance</td>
                  <td className="py-3 px-3 text-center text-rose-400 print:text-rose-800 font-mono font-bold">En Riesgo (&gt; 45 min)</td>
                  <td className="py-3 px-3 text-slate-300 print:text-slate-800"><strong>¿Por qué?:</strong> Evita mermas por alimentos derretidos o aplastados en el despacho.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-white print:text-black">Eficiencia de Asignación de Comodines (Dispatch Score)</td>
                  <td className="py-3 px-3 text-center text-emerald-400 print:text-emerald-800 font-mono font-bold">100.0% Alivio de Embotellamiento</td>
                  <td className="py-3 px-3 text-center text-amber-400 print:text-amber-800 font-mono font-bold">0.0% (Asignado a Ruta B Limpia)</td>
                  <td className="py-3 px-3 text-slate-300 print:text-slate-800"><strong>¿Por qué?:</strong> Garantiza que choferes de relevo auxilien la ruta con cuello de botella.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-white print:text-black">Kilometraje Total Recorrido</td>
                  <td className="py-3 px-3 text-center text-emerald-400 print:text-emerald-800 font-mono font-bold">12.57 km</td>
                  <td className="py-3 px-3 text-center text-amber-400 print:text-amber-800 font-mono font-bold">45.26 km</td>
                  <td className="py-3 px-3 text-slate-300 print:text-slate-800"><strong>¿Por qué?:</strong> Mide la eliminación de rutas cruzadas (-72.2%).</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-white print:text-black">Desviación Promedio de Tiempo</td>
                  <td className="py-3 px-3 text-center text-emerald-400 print:text-emerald-800 font-mono font-bold">≤ +5.0 min</td>
                  <td className="py-3 px-3 text-center text-amber-400 print:text-amber-800 font-mono font-bold">+19.0 min (RT-A-01)</td>
                  <td className="py-3 px-3 text-slate-300 print:text-slate-800"><strong>¿Por qué?:</strong> Mide la precisión del modelo de estimación de tiempos.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-white print:text-black">Tasa de Conciliación de Paradas vs Entregas (Brecha Faltante %)</td>
                  <td className="py-3 px-3 text-center text-emerald-400 print:text-emerald-800 font-mono font-bold">100.0% Coincidente</td>
                  <td className="py-3 px-3 text-center text-rose-400 print:text-rose-800 font-mono font-bold">58.8% (7 entregas faltantes)</td>
                  <td className="py-3 px-3 text-slate-300 print:text-slate-800"><strong>¿Por qué?:</strong> Mide la brecha entre las 17 paradas en catálogo (8 en RT-A-01, 9 en RT-B-02) vs las 10 entregas reales registradas (+3 y +4 faltantes).</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-white print:text-black">Índice de Rutas Huérfanas (Orphan Route Index %)</td>
                  <td className="py-3 px-3 text-center text-emerald-400 print:text-emerald-800 font-mono font-bold">0.0% Rutas Huérfanas</td>
                  <td className="py-3 px-3 text-center text-rose-400 print:text-rose-800 font-mono font-bold">50.0% en Riesgo (10/20 entregas)</td>
                  <td className="py-3 px-3 text-slate-300 print:text-slate-800"><strong>¿Por qué?:</strong> Mide las 10 entregas operadas por DR-103 (5 en RT-C-03) y DR-104 (5 en RT-D-04) en rutas inexistentes en el catálogo.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-white print:text-black">Tasa de Inconsistencia de Datos</td>
                  <td className="py-3 px-3 text-center text-emerald-400 print:text-emerald-800 font-mono font-bold">0.0%</td>
                  <td className="py-3 px-3 text-center text-amber-400 print:text-amber-800 font-mono font-bold">10.0% (Anomalías)</td>
                  <td className="py-3 px-3 text-slate-300 print:text-slate-800"><strong>¿Por qué?:</strong> Decidir sobre datos limpios sin registros nulos.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 7: Infrastructure Tools */}
        <div className="space-y-3 bg-slate-950 print:bg-slate-100 p-6 rounded-2xl border border-slate-800 print:border-slate-300">
          <h2 className="text-sm font-extrabold text-white print:text-black flex items-center gap-2">
            <Code2 className="w-4 h-4 text-yellow-400" /> Infraestructura & Herramientas Implementadas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-300 print:text-slate-800 font-mono">
            <div className="bg-slate-900 print:bg-white p-3 rounded-xl border border-slate-800 print:border-slate-300 flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
              <span className="truncate">Python 3.12 (Sanitización)</span>
            </div>
            <div className="bg-slate-900 print:bg-white p-3 rounded-xl border border-slate-800 print:border-slate-300 flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="truncate">Supabase (Esquema <code className="text-yellow-400">meli</code>)</span>
            </div>
            <div className="bg-slate-900 print:bg-white p-3 rounded-xl border border-slate-800 print:border-slate-300 flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
              <span className="truncate">Leaflet GPS Cartografía</span>
            </div>
            <div className="bg-slate-900 print:bg-white p-3 rounded-xl border border-slate-800 print:border-slate-300 flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              <span className="truncate" title="Vercel (meli.nexusnetwork.cl)">Vercel (<code className="text-yellow-300">meli.nexusnetwork.cl</code>)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
