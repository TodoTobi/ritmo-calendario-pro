import React from 'react';
import { Calendar, Clock3, FileText, Settings } from 'lucide-react';

export type NavTab = 'calendar' | 'timeline' | 'notes' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'calendar' as NavTab, label: 'Calendario', icon: Calendar },
    { id: 'timeline' as NavTab, label: 'Línea Táctil', icon: Clock3 },
    { id: 'notes' as NavTab, label: 'Notas', icon: FileText },
    { id: 'settings' as NavTab, label: 'Ajustes', icon: Settings },
  ];

  const handleSelect = (tab: NavTab) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onChangeTab(tab);
  };

  return (
    <div className="fixed bottom-3 left-0 right-0 z-30 mx-auto max-w-md px-4 safe-pb pointer-events-none font-nunito">
      <nav className="pointer-events-auto flex h-16 items-center justify-around px-2 rounded-2xl bg-white border-2 border-duo-border-light shadow-duo-sticker">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={`flex min-h-[44px] min-w-[60px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-all duration-150 ${
                isActive
                  ? 'text-duo-green font-extrabold'
                  : 'text-duo-gray hover:text-duo-charcoal font-bold'
              }`}
            >
              <div
                className={`flex h-7 w-12 items-center justify-center rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-duo-green-light text-duo-green border-2 border-duo-green'
                    : 'bg-transparent text-duo-gray'
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[2]'
                  }`}
                />
              </div>
              <span className="text-[11px] tracking-wide uppercase">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
