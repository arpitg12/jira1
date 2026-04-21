import React from 'react';

export const Card = ({ title, subtitle, children, className = '' }) => {
  return (
    <div className={`ui-surface ui-shadow p-3 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-2">
          {title && <h3 className="text-sm font-semibold text-dark">{title}</h3>}
          {subtitle && <p className="text-gray-600 text-xs">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
