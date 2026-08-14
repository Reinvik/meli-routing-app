import React, { useState, useEffect } from 'react';
import { supabase, INITIAL_ROUTES, INITIAL_DELIVERIES } from './lib/supabase';
import { Route, Delivery } from './types';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { RouteMap } from './components/RouteMap';
import { SqlExplorer } from './components/SqlExplorer';
import { AnomalyAudit } from './components/AnomalyAudit';
import { SolutionsView } from './components/SolutionsView';
import { ExecutiveReport } from './components/ExecutiveReport';
import { RefreshCw } from 'lucide-react';

export type DateFilter = 'all' | '2024-01-01' | '2024-01-02' | '2024-01-03';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSqlQueryId, setSelectedSqlQueryId] = useState<string>('query-1');
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [deliveries, setDeliveries] = useState<Delivery[]>(INITIAL_DELIVERIES);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<DateFilter>('all');

  const handleNavigateToSql = (queryId: string) => {
    setSelectedSqlQueryId(queryId);
    setActiveTab('sql');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Derivar entregas filtradas por día seleccionado
  const filteredDeliveries: Delivery[] =
    selectedDate === 'all'
      ? deliveries
      : deliveries.filter((d) => d.order_date === selectedDate);

  const fetchDataFromSupabase = async () => {
    setIsLoading(true);
    try {
      const { data: routesData, error: routesError } = await supabase.from('meli_routes').select('*');
      const { data: delData, error: delError } = await supabase.from('meli_deliveries').select('*');

      if (!routesError && routesData && routesData.length > 0) {
        setRoutes(routesData as Route[]);
      }
      if (!delError && delData && delData.length > 0) {
        setDeliveries(delData as Delivery[]);
        setIsDbConnected(true);
      } else {
        setIsDbConnected(false);
      }
    } catch (err) {
      console.warn('Network issue fetching from Supabase, using synced local dataset.', err);
      setIsDbConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataFromSupabase();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-slate-900">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDbConnected={isDbConnected}
        totalDeliveries={deliveries.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {/* Floating Quick Sync Button */}
        <div className="flex items-center justify-end mb-4 print:hidden">
          <button
            onClick={fetchDataFromSupabase}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
            title="Sincronizar datos con Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-yellow-400' : ''}`} />
            <span>{isLoading ? 'Sincronizando...' : 'Re-sincronizar Supabase'}</span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <Dashboard
            routes={routes}
            deliveries={filteredDeliveries}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onNavigateToSql={handleNavigateToSql}
          />
        )}

        {activeTab === 'map' && (
          <RouteMap
            routes={routes}
            deliveries={filteredDeliveries}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onNavigateToSql={handleNavigateToSql}
          />
        )}

        {activeTab === 'sql' && (
          <SqlExplorer initialQueryId={selectedSqlQueryId} />
        )}

        {activeTab === 'anomalies' && (
          <AnomalyAudit routes={routes} deliveries={deliveries} />
        )}

        {activeTab === 'solutions' && (
          <SolutionsView />
        )}

        {activeTab === 'report' && (
          <ExecutiveReport routes={routes} deliveries={deliveries} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-400 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[10px]">meli</span>
            <span>Mercado Foods Routing Intelligence &amp; Supabase Integration Platform</span>
          </div>
          <div>Desafío Técnico Finalizado con Éxito • Esquema <code className="font-mono text-yellow-400">meli</code> en Supabase</div>
        </div>
      </footer>
    </div>
  );
}

export default App;
