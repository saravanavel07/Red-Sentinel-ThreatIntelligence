import React from 'react';
import { RedSentinelLogo } from './RedSentinelLogo';
import { ShieldAlert, Play, User as UserIcon, Terminal, Activity, FileText } from 'lucide-react';

export type NavTab = 
  | 'landing'
  | 'dashboard'
  | 'events'
  | 'intel'
  | 'incidents'
  | 'triage'
  | 'rules'
  | 'code_tests'
  | 'settings';

interface TopNavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSimModal: () => void;
  activeAlertCount: number;
  currentUser: { name: string; role: string } | null;
  onLoginClick: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenSimModal,
  activeAlertCount,
  currentUser,
  onLoginClick,
}) => {
  const navItems: { id: NavTab; label: string }[] = [
    { id: 'landing', label: 'Overview' },
    { id: 'dashboard', label: 'SOC Dashboard' },
    { id: 'events', label: 'Events' },
    { id: 'intel', label: 'Threat Intel' },
    { id: 'incidents', label: 'Incidents' },
    { id: 'triage', label: 'AI Triage' },
    { id: 'rules', label: 'Detection Rules' },
    { id: 'code_tests', label: 'Code & Tests' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0E121A]/90 backdrop-blur-md border-b border-[#292F3B]/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onSelectTab('landing')}
          className="flex items-center gap-2 cursor-pointer focus:outline-none shrink-0"
        >
          <RedSentinelLogo size={34} showWordmark={true} />
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-[#9CA7B8]">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 relative py-1 focus:outline-none ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-[#9CA7B8] hover:text-[#F4F6FA]'
                }`}
              >
                {item.label}
                {item.id === 'incidents' && activeAlertCount > 0 && (
                  <span className="ml-1.5 text-xs text-[#FF334F] font-mono tabular-nums">
                    ({activeAlertCount})
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF334F] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenSimModal}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF334F] hover:bg-[#FF5C6C] rounded-lg transition-all shadow-sm hover:shadow-[0_0_14px_rgba(255,51,79,0.35)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Attack</span>
          </button>

          {currentUser ? (
            <button
              onClick={() => onSelectTab('settings')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#F4F6FA] bg-[#151A23] hover:bg-[#1B2230] border border-[#292F3B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#FF334F]" />
              <span className="max-w-[120px] truncate">{currentUser.name}</span>
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-3 py-1.5 text-xs font-medium text-[#F4F6FA] bg-[#151A23] hover:bg-[#1B2230] border border-[#292F3B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile/Tablet scrollable subnav */}
      <div className="xl:hidden flex items-center gap-4 overflow-x-auto pt-2.5 mt-2 border-t border-[#292F3B]/40 text-xs font-medium text-[#9CA7B8] scrollbar-none">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`whitespace-nowrap pb-1 border-b-2 transition-colors ${
              currentTab === item.id
                ? 'text-white border-[#FF334F]'
                : 'text-[#9CA7B8] border-transparent hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
