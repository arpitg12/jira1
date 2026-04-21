import React from 'react';

export const Badge = ({ children, variant = 'primary', size = 'md' }) => {
  const variants = {
    primary: 'bg-blue-100 text-primary',
    secondary: 'bg-purple-100 text-secondary',
    success: 'bg-green-100 text-success',
    danger: 'bg-red-100 text-danger',
    warning: 'bg-yellow-100 text-warning',
    info: 'bg-cyan-100 text-info',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`${variants[variant]} ${sizes[size]} rounded font-semibold inline-block`}>
      {children}
    </span>
  );
};
