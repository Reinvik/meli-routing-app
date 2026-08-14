import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Database, 
  AlertTriangle, 
  Lightbulb, 
  FileText, 
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDbConnected: boolean;
  totalDeliveries: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDbConnected,
  totalDeliveries
}) => {
  interface TabItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Mapa de Rutas', icon: MapPin },
    { id: 'sql', label: 'SQL Explorer', icon: Database },
    { id: 'anomalies', label: 'Auditoría', icon: AlertTriangle },
    { id: 'solutions', label: 'Propuestas & KPIs', icon: Lightbulb },
    { id: 'report', label: 'Informe PDF', icon: FileText }
  ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 border-b border-amber-500/40 shadow-xl px-3 sm:px-6 py-1.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-950 text-yellow-400 px-2.5 py-1 rounded-xl shadow-md font-extrabold tracking-tight text-xs flex items-center gap-1.5 border border-yellow-500/30">
            <span className="bg-yellow-400 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black">meli</span>
            <span className="font-black tracking-wider text-[11px] sm:text-xs">ROUTING INTELLIGENCE</span>
          </div>
        </div>

        {/* Center: Navigation Menu Tabs in a Single Compact Line */}
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap border cursor-pointer ${
                  isActive
                    ? 'bg-slate-950 text-yellow-400 border-yellow-400/60 shadow-lg shadow-slate-950/30 scale-105'
                    : 'bg-slate-900/80 hover:bg-slate-900 text-slate-200 hover:text-white border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-yellow-400' : 'text-amber-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-full shrink-0 ${
                    isActive 
                      ? 'bg-slate-900 text-rose-400 border border-rose-500/40' 
                      : 'bg-rose-500 text-white animate-pulse'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Single Compact System Status Badge */}
        <div className="flex items-center shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-950 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isDbConnected ? 'Supabase' : 'Offline'} ({totalDeliveries})</span>
          </div>
        </div>
      </div>
    </header>
  );
};
