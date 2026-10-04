import React from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  ariaLabel?: string;
}

export const FAB: React.FC<FABProps> = ({
  onClick,
  ariaLabel = 'Crear nuevo evento o nota',
}) => {
  const handleClick = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ritmo-purple text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-ritmo-purple/30"
      style={{
        boxShadow: '0 8px 24px rgba(101, 88, 245, 0.45)',
      }}
    >
      <Plus className="h-7 w-7 stroke-[2.5]" />
    </button>
  );
};
