import React from 'react';
import { IoClose } from 'react-icons/io5';

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className={`ui-surface ui-shadow w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <IoClose size={20} />
          </button>
        </div>
        <div className="p-3">
          {children}
        </div>
      </div>
    </div>
  );
};

