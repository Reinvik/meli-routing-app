import React, { useEffect, useRef, useState } from 'react';
import type { Route, Delivery } from '../types';
import type { DateFilter } from '../App';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Globe, 
  Layers, 
  Compass, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  Maximize2,
  Scale,
  Truck,
  AlertTriangle,
  ShieldAlert,
  Package,
  Database
} from 'lucide-react';

interface RouteMapProps {
  routes: Route[];
  deliveries: Delivery[];
  selectedDate: DateFilter;
  onDateChange: (d: DateFilter) => void;
  onNavigateToSql?: (queryId: string) => void;
}

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all',        label: 'Todos los Días' },
  { value: '2024-01-01', label: '01 Ene' },
  { value: '2024-01-02', label: '02 Ene' },
  { value: '2024-01-03', label: '03 Ene' },
];

export const RouteMap: React.FC<RouteMapProps> = ({ routes, deliveries, selectedDate, onDateChange, onNavigateToSql }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [tileLayerType, setTileLayerType] = useState<'dark' | 'streets'>('dark');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Calculate Initial Weight Payload per Route
  const getRouteInitialPayload = (routeId: string) => {
    const routeDels = deliveries.filter(d => d.route_id === routeId);
    const totalWeight = routeDels.reduce((sum, d) => sum + (d.package_weight_kg || 0), 0);
    return {
      totalWeight: Number(totalWeight.toFixed(1)),
      count: routeDels.length,
      deliveries: routeDels
    };
  };

  const payloadRTA01 = getRouteInitialPayload('RT-A-01');
  const payloadRTB02 = getRouteInitialPayload('RT-B-02');
  const payloadRTC03 = getRouteInitialPayload('RT-C-03');
  const payloadRTD04 = getRouteInitialPayload('RT-D-04');

  // Set default selected delivery on load
  useEffect(() => {
    if (deliveries.length > 0 && !selectedDelivery) {
      const defaultDel = deliveries.find(d => d.delivery_id === 'DEL-20240102-005') || deliveries[0];
      setSelectedDelivery(defaultDel);
    }
  }, [deliveries]);

  // Color mapping per route
  const routeColors: Record<string, string> = {
    'RT-A-01': '#3b82f6', // Blue
    'RT-B-02': '#a855f7', // Purple
    'RT-C-03': '#f59e0b', // Amber / Yellow
    'RT-D-04': '#f43f5e', // Rose / Red
  };

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Centered around Los Angeles delivery coordinates
    const map = L.map(mapContainerRef.current, {
      center: [34.10, -118.285],
      zoom: 12,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Layer groups for dynamic markers and polylines
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    polylineLayerGroupRef.current = L.layerGroup().addTo(map);

    // Initial tile layer
    const initialUrl = tileLayerType === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(initialUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer dynamically when user toggles (Modo Oscuro / Calles Real)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const newUrl = tileLayerType === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayerRef.current.setUrl(newUrl);
  }, [tileLayerType]);

  // Update Markers & Polylines dynamically when selectedRouteId or deliveries change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current || !polylineLayerGroupRef.current) return;

    const markersGroup = markersLayerGroupRef.current;
    const polylineGroup = polylineLayerGroupRef.current;

    markersGroup.clearLayers();
    polylineGroup.clearLayers();

    // Filter deliveries based on route dropdown selection
    const activeDeliveries = selectedRouteId
      ? deliveries.filter(d => d.route_id === selectedRouteId)
      : deliveries;

    // 1. Add GPS Markers
    activeDeliveries.forEach((del) => {
      if (!del.latitude || !del.longitude) return;

      const numStr = del.delivery_id ? del.delivery_id.split('-').pop() || '00' : '00';
      const isOrphan = del.route_id === 'RT-C-03' || del.route_id === 'RT-D-04';
      const isDelayed = del.status === 'Delayed';

      // Pin Color logic
      let markerColor = '#10b981'; // Green for Delivered
      if (isOrphan) {
        markerColor = '#a855f7'; // Purple for Orphan routes
      } else if (isDelayed) {
        markerColor = '#f43f5e'; // Red for Delayed
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: ${markerColor};
            color: #ffffff;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 800;
            font-family: monospace;
            border: 2px solid #0f172a;
            box-shadow: 0 0 10px ${markerColor}bb;
            cursor: pointer;
            transition: transform 0.2s;
          " class="hover:scale-125">
            ${numStr}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([del.latitude, del.longitude], { icon: customIcon });
      marker.on('click', () => setSelectedDelivery(del));
      markersGroup.addLayer(marker);
    });

    // 2. Draw Route Connecting Lines (Polylines)
    const routesToDraw = selectedRouteId ? [selectedRouteId] : ['RT-A-01', 'RT-B-02', 'RT-C-03', 'RT-D-04'];

    routesToDraw.forEach(rId => {
      const routeDels = deliveries.filter(d => d.route_id === rId && d.latitude && d.longitude);
      if (routeDels.length < 2) return;

      const latLngs: [number, number][] = routeDels.map(d => [d.latitude!, d.longitude!]);
      const color = routeColors[rId] || '#eab308';

      const polyline = L.polyline(latLngs, {
        color: color,
        weight: selectedRouteId === rId ? 4 : 2,
        opacity: selectedRouteId === rId ? 0.9 : 0.4,
        dashArray: '5, 8'
      });

      polylineGroup.addLayer(polyline);
    });
  }, [selectedRouteId, deliveries]);

  // Reset Map View
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([34.10, -118.285], 12);
      setSelectedRouteId(null);
    }
  };

  // Selected delivery payload context
  const selectedDeliveryRoutePayload = selectedDelivery ? getRouteInitialPayload(selectedDelivery.route_id) : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar matching exact screenshot design */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4 text-yellow-400" /> MAPA DE NAVEGACIÓN REAL — LOS ÁNGELES, CA
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Mapa GPS Interactivo de Entregas Mercado Foods
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Visualizador cartográfico con mapas reales de OpenStreetMap / CARTO, rutas de despacho y marcadores por coordenadas GPS.
          </p>
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Day Selector Pill-Tabs */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-1 flex items-center gap-0.5">
            {DATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onDateChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDate === opt.value
                    ? 'bg-yellow-400 text-slate-900 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Tile Layer Mode Switcher (Modo Oscuro / Calles Real OSM) */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-1 flex items-center">
            <button
              onClick={() => setTileLayerType('dark')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tileLayerType === 'dark'
                  ? 'bg-yellow-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Modo Oscuro
            </button>
            <button
              onClick={() => setTileLayerType('streets')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tileLayerType === 'streets'
                  ? 'bg-yellow-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calles Real (OSM)
            </button>
          </div>

          {/* Route Dropdown Selector */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-200">
            <Layers className="w-4 h-4 text-yellow-400 shrink-0" />
            <select
              value={selectedRouteId || ''}
              onChange={(e) => setSelectedRouteId(e.target.value || null)}
              className="bg-transparent text-slate-100 font-bold focus:outline-none cursor-pointer pr-2"
            >
              <option value="" className="bg-slate-900 text-white">Todas las Rutas</option>
              <option value="RT-A-01" className="bg-slate-900 text-white">Ruta RT-A-01 (City Center North)</option>
              <option value="RT-B-02" className="bg-slate-900 text-white">Ruta RT-B-02 (Suburban East)</option>
              <option value="RT-C-03" className="bg-slate-900 text-white">Ruta RT-C-03 (Industrial - Huérfana)</option>
              <option value="RT-D-04" className="bg-slate-900 text-white">Ruta RT-D-04 (Suburban West - Huérfana)</option>
            </select>
          </div>

          {/* Reset Map Center Button */}
          <button
            onClick={handleResetView}
            title="Restablecer Vista Centrada"
            className="bg-slate-950/90 hover:bg-slate-800 border border-slate-800 text-slate-300 p-2.5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center"
          >
            <Compass className="w-4 h-4 text-yellow-400" />
          </button>
        </div>
      </div>

      {/* Main Grid: Leaflet Map (Left) + Detail Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map Box (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-4 rounded-2xl border border-slate-800 relative space-y-2">
          {/* Map Leaflet Container */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-[540px] rounded-xl border border-slate-800 overflow-hidden shadow-2xl relative z-0"
          />

          {/* Top Left Legend Overlay matching screenshot exactly */}
          <div className="absolute top-7 left-7 z-[1000] bg-slate-950/90 backdrop-blur-md p-4 rounded-xl border border-slate-800 text-xs space-y-2 shadow-2xl pointer-events-auto">
            <div className="font-extrabold text-slate-300 uppercase text-[10px] tracking-wider mb-1">
              MARCADORES GPS
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 inline-block" />
              <span>Entregado A Tiempo</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0 inline-block" />
              <span>Con Retraso</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0 inline-block" />
              <span>Ruta Huérfana (`RT-C-03` / `RT-D-04`)</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar Details Panel */}
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <div>
              <h3 className="text-lg font-extrabold text-white">Detalle del Punto de Entrega</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Haz clic en cualquier pin del mapa para inspeccionar la entrega
              </p>
            </div>

            {selectedDelivery ? (
              <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800/90 space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-mono font-bold text-yellow-400 text-sm">
                    {selectedDelivery.delivery_id}
                  </span>
                  <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                    selectedDelivery.status === 'Delayed'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {selectedDelivery.status === 'Delayed' ? 'Con Retraso' : 'Entregado'}
                  </span>
                </div>

                <div className="space-y-2.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ruta Asignada:</span>
                    <strong className="font-mono text-white">{selectedDelivery.route_id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conductor ID:</span>
                    <strong className="font-mono text-white">{selectedDelivery.driver_id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cliente ID:</span>
                    <strong className="font-mono text-white">{selectedDelivery.customer_id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dirección:</span>
                    <strong className="text-white text-right max-w-[180px] truncate">
                      {selectedDelivery.address || 'N/A (Null Record)'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coordenadas GPS Real:</span>
                    <strong className="font-mono text-yellow-400">
                      {selectedDelivery.latitude?.toFixed(4)}, {selectedDelivery.longitude?.toFixed(4)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tiempo Transcurrido:</span>
                    <strong className="font-mono text-white">
                      {selectedDelivery.delivery_time_min ? `${selectedDelivery.delivery_time_min} min` : 'N/A'}
                    </strong>
                  </div>

                  {/* Weight Breakdown */}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">Peso Paquete Individual:</span>
                    <strong className="font-mono text-yellow-300 font-bold text-xs">
                      {selectedDelivery.package_weight_kg ? `${selectedDelivery.package_weight_kg} kg` : 'N/A'}
                    </strong>
                  </div>

                  {/* Initial Accumulated Payload Metric */}
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 flex items-center gap-1 font-semibold">
                      <Scale className="w-3.5 h-3.5 text-amber-400" /> Carga Inicial al Salir:
                    </span>
                    <strong className="font-mono text-amber-300 font-extrabold text-xs">
                      {selectedDeliveryRoutePayload?.totalWeight} kg
                    </strong>
                  </div>


                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                Selecciona una entrega en el mapa
              </div>
            )}

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-yellow-400" /> Georreferenciación en Los Ángeles
              </span>
              <p className="text-slate-400 leading-relaxed">
                Ubicación real basada en los datos de Latitud (34.05° - 34.16° N) y Longitud (-118.24° - -118.33° W) del dataset Mercado Foods.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ANALYTICAL CARD: Initial Payload Weight per Vehicle Analysis (DYNAMIC BY DATE) */}
      <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-2xl space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-white">
              Análisis de Carga Inicial Acumulada por Flota (Peso al Salir del Hub)
            </h3>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onNavigateToSql && onNavigateToSql('query-8')}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono font-bold text-xs px-3 py-1 rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
              title="Ver y Ejecutar Consulta SQL 8 en SQL Explorer"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>(Consulta SQL 8)</span>
            </button>
            <span className="bg-slate-800 text-slate-300 font-mono font-bold text-xs px-3 py-1 rounded-xl border border-slate-700">
              {selectedDate === 'all' ? 'Total Dataset: 57.1 kg' : `Carga ${selectedDate}: ${(deliveries.reduce((acc, d) => acc + (d.package_weight_kg || 0), 0)).toFixed(1)} kg`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* RT-A-01 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-blue-400">RT-A-01 (Motocicleta)</span>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded">Carga Ágil</span>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {payloadRTA01.totalWeight} kg <span className="text-xs font-normal text-slate-400">({payloadRTA01.count} pedido{payloadRTA01.count !== 1 ? 's' : ''})</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {payloadRTA01.count > 0 ? (
                <>Paquetes: {payloadRTA01.deliveries.map(d => `${d.package_weight_kg || 0}kg`).join(', ')}. Carga dentro de norma operativa.</>
              ) : (
                <>Sin entregas asignadas a esta ruta en la fecha seleccionada.</>
              )}
            </p>
          </div>

          {/* RT-B-02 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-purple-400">RT-B-02 (Small Van)</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">Capacidad OK</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {payloadRTB02.totalWeight} kg <span className="text-xs font-normal text-slate-400">({payloadRTB02.count} pedido{payloadRTB02.count !== 1 ? 's' : ''})</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {payloadRTB02.count > 0 ? (
                <>Paquetes: {payloadRTB02.deliveries.map(d => `${d.package_weight_kg || 0}kg`).join(', ')}. Carga en rango seguro para camioneta pequeña.</>
              ) : (
                <>Sin entregas asignadas a esta ruta en la fecha seleccionada.</>
              )}
            </p>
          </div>

          {/* RT-C-03 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-amber-400">RT-C-03 (Large Van)</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">Capacidad OK</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {payloadRTC03.totalWeight} kg <span className="text-xs font-normal text-slate-400">({payloadRTC03.count} pedido{payloadRTC03.count !== 1 ? 's' : ''})</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {payloadRTC03.count > 0 ? (
                <>Paquetes: {payloadRTC03.deliveries.map(d => `${d.package_weight_kg || 0}kg`).join(', ')}. Carga pesada soportada por furgón grande.</>
              ) : (
                <>Sin entregas asignadas a esta ruta en la fecha seleccionada.</>
              )}
            </p>
          </div>

          {/* RT-D-04 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-rose-400">RT-D-04 (Car / SUV)</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">Capacidad OK</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {payloadRTD04.totalWeight} kg <span className="text-xs font-normal text-slate-400">({payloadRTD04.count} pedido{payloadRTD04.count !== 1 ? 's' : ''})</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {payloadRTD04.count > 0 ? (
                <>Paquetes: {payloadRTD04.deliveries.map(d => d.package_weight_kg !== null ? `${d.package_weight_kg}kg` : 'Nulo').join(', ')}.</>
              ) : (
                <>Sin entregas asignadas a esta ruta en la fecha seleccionada.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* FIRST BOX: Cartographic Analysis Callout Updated for 3-Day Dynamic Batch Routing */}
      <div className="bg-gradient-to-r from-yellow-500/10 via-slate-900 to-slate-950 border border-yellow-400/40 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
            <h3 className="text-lg font-extrabold text-white">
              Demostración Cartográfica: Diagnóstico de Flota Sub-utilizada y Dispersa por Jornada
            </h3>
          </div>
          <span className="bg-yellow-400 text-slate-950 px-3.5 py-1 rounded-full font-black text-xs uppercase tracking-wider self-start md:self-auto shadow-md">
            -75% Flota Sobrante en Tránsito
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Al analizar los marcadores GPS en el mapa de Los Ángeles desglosados por fecha de pedido (<code className="text-yellow-300 font-mono">2024-01-01</code>, <code className="text-yellow-300 font-mono">2024-01-02</code> y <code className="text-yellow-300 font-mono">2024-01-03</code>), se evidencia un <strong className="text-rose-400 font-bold">patrón ineficiente de sobredespacho por turno</strong>: en cada jornada se enviaban 4 vehículos y choferes en paralelo (<code className="text-yellow-300 font-mono">RT-A-01</code>, <code className="text-yellow-300 font-mono">RT-B-02</code>, <code className="text-yellow-300 font-mono">RT-C-03</code>, <code className="text-yellow-300 font-mono">RT-D-04</code>) para atender solo 8 entregas diarias en el mismo vecindario, trabajando apenas 1.5 a 1.8 horas efectivas por chofer.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/30 space-y-1.5">
            <span className="text-rose-400 font-bold block text-xs">1. Diagnóstico Actual (Flota Dispersa)</span>
            <span className="text-rose-300 font-mono font-bold text-sm">4 vehículos / choferes por día</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">4 vehículos salían al mismo sector cada día para entregar 1 o 2 paquetes cada uno, generando sobrecostos del 75%.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40 space-y-1.5">
            <span className="text-emerald-400 font-bold block text-xs">2. Consolidación Diaria (Batch VRP)</span>
            <span className="text-emerald-300 font-mono font-bold text-sm">1 vehículo activo por jornada</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">Un solo vehículo consolidando las 8 entregas del día cubre el turno completo en 2.5 a 3.5 horas de recorrido dinámico.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-yellow-500/40 space-y-1.5">
            <span className="text-yellow-400 font-bold block text-xs">3. Ahorro Operacional Estimado</span>
            <span className="text-yellow-300 font-mono font-bold text-sm">Reducción del 75% en flota activa</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">Eliminación de 3 camionetas/motos ociosas en tránsito, menor consumo de combustible y eliminación de costos fijos por chofer.</p>
          </div>
        </div>
      </div>

      {/* SECOND BOX AT THE VERY BOTTOM: Proposed Dynamic Batch Route Plan */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-4 h-4" /> Propuesta Final de Rediseño Operacional
            </div>
            <h3 className="text-xl font-extrabold text-white">
              Modelo de Ruteo Dinámico Diario (Dynamic Batch VRP por Jornada)
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Planificación por lotes diarios según los pedidos confirmados la noche anterior, asignando flota ágil y validando direcciones en checkout.
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-right">
            <div className="text-[10px] uppercase text-emerald-400 font-bold">Flota Requerida por Día</div>
            <div className="text-lg font-black text-emerald-300 font-mono">1 a 2 Vehículos Activos</div>
          </div>
        </div>

        {/* Grid of 4 Proposed Operational Shift Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shift 1: Day 1 Batch */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="bg-blue-500/20 text-blue-400 font-extrabold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Jornada Día 1 (01 Ene): Sector Este (Centro)
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-400">Lon -118.24° a -118.27°</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Vehículo Asignado:</span>
                <strong className="text-yellow-400 font-mono">1 Small Van / Car</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Distancia Recorrida:</span>
                <strong className="text-emerald-400 font-mono">3.8 km (vs 13.5 km con 4 choferes)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Entregas Consolidadas:</span>
                <strong className="text-white font-mono font-bold">8 entregas del Día 1</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
              💡 <strong>Estrategia de Flota:</strong> En lugar de enviar 4 choferes (que trabajaron solo 1.5h cada uno), 1 solo vehículo Small Van realiza el recorrido secuencial en 3 horas.
            </p>
          </div>

          {/* Shift 2: Day 2 Batch */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="bg-purple-500/20 text-purple-400 font-extrabold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Jornada Día 2 (02 Ene): Sector Centro-Oeste
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-400">Lon -118.28° a -118.31°</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Vehículo Asignado:</span>
                <strong className="text-yellow-400 font-mono">1 Small Van / Motorcycle</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Distancia Recorrida:</span>
                <strong className="text-emerald-400 font-mono">4.2 km (vs 14.8 km con 4 choferes)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Entregas Consolidadas:</span>
                <strong className="text-white font-mono font-bold">8 entregas del Día 2 (5.9 kg en moto)</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
              💡 <strong>Estrategia de Mantenimiento:</strong> Carga ligera de 5.9 kg. Requiere pauta de inspección técnica previa (*Pre-trip*) para prevenir averías de moto en ruta.
            </p>
          </div>

          {/* Shift 3: Day 3 Batch */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="bg-amber-500/20 text-amber-400 font-extrabold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Jornada Día 3 (03 Ene): Sector Oeste
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-400">Lon -118.32° a -118.33°</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Vehículo Asignado:</span>
                <strong className="text-yellow-400 font-mono">1 Car / SUV</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Distancia Recorrida:</span>
                <strong className="text-emerald-400 font-mono">2.5 km (vs 9.2 km con 3 choferes)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Entregas Consolidadas:</span>
                <strong className="text-white font-mono font-bold">4 entregas del Día 3</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
              💡 <strong>Estrategia de Sistema:</strong> Excluye la orden nula previa validación de campos obligatorios en el API de checkout.
            </p>
          </div>

          {/* System Control */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="bg-emerald-500/20 text-emerald-400 font-extrabold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Torre de Control & Validaciones del Sistema
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-400">Checkout & API GPS</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Validación de Direcciones:</span>
                <strong className="text-emerald-400 font-mono">Google Maps Autocomplete</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Alerta Clima / Tráfico:</span>
                <strong className="text-yellow-400 font-mono">Conmutación a Flota Ágil</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Re-balanceo de Comodines:</span>
                <strong className="text-white font-mono font-bold">Direccionamiento por Alerta OTD</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
              💡 <strong>Estrategia de Software:</strong> La integración de geocodificación GPS en checkout elimina el 100% de retrasos de 90 min por direcciones erróneas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
