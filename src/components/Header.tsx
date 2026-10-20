import React from 'react';
import { RefreshCw } from 'lucide-react';
import { SyncConfig } from '../types/dashboard';

interface HeaderProps {
  syncConfig: SyncConfig;
  onOpenSyncModal: () => void;
  onManualRefresh: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  syncConfig,
  onOpenSyncModal,
  onManualRefresh,
  activeSection,
  onNavigate,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('overview');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-indigo-600 transition-colors"
          >
            Dining Zone Organizer
          </a>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('overview')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'overview' ? 'text-slate-950 font-semibold underline underline-offset-8 decoration-2 decoration-indigo-600' : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('space-productivity')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'space-productivity' ? 'text-slate-950 font-semibold underline underline-offset-8 decoration-2 decoration-indigo-600' : ''
              }`}
            >
              Space Metrics
            </button>
            <button
              onClick={() => onNavigate('analytics')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'analytics' ? 'text-slate-950 font-semibold underline underline-offset-8 decoration-2 decoration-indigo-600' : ''
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => onNavigate('spreadsheet')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'spreadsheet' ? 'text-slate-950 font-semibold underline underline-offset-8 decoration-2 decoration-indigo-600' : ''
              }`}
            >
              Spreadsheet
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenSyncModal}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  syncConfig.status === 'syncing' ? 'animate-spin' : ''
                }`}
              />
              <span>
                {syncConfig.isSimulating
                  ? 'Live Stream Active'
                  : syncConfig.autoSyncEnabled
                  ? 'Realtime Sync (On)'
                  : 'Sync Spreadsheet'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
