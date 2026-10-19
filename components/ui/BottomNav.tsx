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
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-dotted border-caldera-obsidian/25 bg-caldera-limestone/95 backdrop-blur-xs safe-pb">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={`flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1 transition-all duration-150 ${
                isActive
                  ? 'text-caldera-obsidian font-bold'
                  : 'text-caldera-muted hover:text-caldera-obsidian'
              }`}
            >
              <div
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-caldera-ember text-caldera-obsidian'
                    : 'bg-transparent'
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 transition-transform ${
                    isActive ? 'scale-105 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span className="text-[10px] tracking-tight uppercase font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
