import React from 'react';
import { IoCheckmarkCircle, IoCloseCircle, IoWarning, IoInformation, IoClose } from 'react-icons/io5';

export const Alert = ({ type = 'info', title, message, onClose, dismissible = true }) => {
  const types = {
    success: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', icon: IoCheckmarkCircle },
    error: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', icon: IoCloseCircle },
    warning: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', icon: IoWarning },
    info: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', icon: IoInformation },
  };

  const typeConfig = types[type];
  const Icon = typeConfig.icon;

  return (
    <div className={`${typeConfig.bg} ${typeConfig.border} border-l-4 p-4 rounded-md flex items-start gap-3 mb-4`}>
      <Icon className={`${typeConfig.text} text-xl flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        {title && <h4 className={`${typeConfig.text} font-semibold`}>{title}</h4>}
        {message && <p className={`${typeConfig.text} text-sm`}>{message}</p>}
      </div>
      {dismissible && (
        <button
          onClick={onClose}
          className={`${typeConfig.text} hover:opacity-70 flex-shrink-0`}
        >
          <IoClose size={20} />
        </button>
      )}
    </div>
  );
};
