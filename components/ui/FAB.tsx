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
      className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-family-ink text-white border border-family-stone shadow-family-dark transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none"
    >
      <Plus className="h-7 w-7 stroke-[2.2]" />
    </button>
  );
};
